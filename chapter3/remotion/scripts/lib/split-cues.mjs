// 口播稿 → 字幕条切分：按「CJK 单字 / ASCII 词 / 单个标点」为原子单位折行。
//
// 旧实现的三个缺陷（阶段 A 遗留，于阶段 F 修复）：
//   1. 超宽强制折断按「字符」贪心，最后一段可能只剩标点，产出「、」「，」「。」这类纯标点字幕条；
//   2. 同一轮折断会把英文单词从中间切开（append-on|ly、Personali|zed、q|wen3:4b）；
//   3. 分词正则要求标点前至少一个非标点字符，句首标点会被静默丢弃。
//
// 新实现把 ASCII 词当作不可分割的原子，标点单独成原子但永不独立成条：
// 折行后若尾片只剩标点，直接并回前一条（最多溢出 1 个汉字宽度，仍低于 20 的告警线）。

/** 单行字幕最大宽度（汉字当量），与 check-subtitles 的判定口径一致。 */
export const MAX_CUE_WIDTH = 18;
/** 低于该宽度视为碎条，优先并回前一条。 */
export const MIN_CUE_WIDTH = 5;

/** 全角字符按 1、其余按 0.55 计宽，与既有视觉排版口径保持一致。 */
const WIDE_RE = /[一-鿿぀-ヿ：，。、；！？（）]/;

export const displayWidth = (text) => {
  let w = 0;
  for (const ch of text) w += WIDE_RE.test(ch) ? 1 : 0.55;
  return w;
};

/** 是否含实词（CJK 或字母数字）。纯标点/纯空白返回 false。 */
export const hasContent = (text) => /[一-鿿぀-ヿA-Za-z0-9]/.test(text);

const CUE_BREAK = '，。！？；：、';
const isAsciiAlnum = (ch) => /[A-Za-z0-9]/.test(ch);
// 允许出现在词内部的连接符：qwen3:4b、append-only、1.7b、A/B
const WORD_JOINER = /[.:_%+\-/'']/;

/**
 * 切成原子：ASCII 词整体为一个 token，其余逐字符。
 * 词内只允许「连接符 + 字母数字」继续成词，避免把句末的「.」吞进单词。
 */
export const tokenize = (text) => {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (isAsciiAlnum(ch)) {
      let j = i + 1;
      while (j < text.length) {
        if (isAsciiAlnum(text[j])) {
          j++;
          continue;
        }
        if (WORD_JOINER.test(text[j]) && j + 1 < text.length && isAsciiAlnum(text[j + 1])) {
          j += 2;
          continue;
        }
        break;
      }
      tokens.push({type: 'word', value: text.slice(i, j)});
      i = j;
      continue;
    }
    tokens.push({
      type: CUE_BREAK.includes(ch) ? 'punct' : /\s/.test(ch) ? 'space' : 'char',
      value: ch,
    });
    i++;
  }
  return tokens;
};

const joinTokens = (tokens) => tokens.map((t) => t.value).join('');

/** 贪心装行；token 不入内拆分，因此不会把英文单词切断。 */
const packTokens = (tokens, maxWidth) => {
  const lines = [];
  let cur = [];
  let width = 0;
  for (const token of tokens) {
    const tokenWidth = displayWidth(token.value);
    if (cur.length && width + tokenWidth > maxWidth) {
      lines.push(cur);
      cur = [token];
      width = tokenWidth;
    } else {
      cur.push(token);
      width += tokenWidth;
    }
  }
  if (cur.length) lines.push(cur);
  return lines;
};

/**
 * 口播稿 → 字幕条数组。
 *
 * 流程：按终止标点切成句子（标点随前句）→ 句子贪心装箱到 maxWidth →
 * 超宽句子按原子折行 → 纯标点尾片并回前条 → 碎条并回前条。
 */
export const splitCues = (text, options = {}) => {
  const maxWidth = options.maxWidth ?? MAX_CUE_WIDTH;
  const minWidth = options.minWidth ?? MIN_CUE_WIDTH;
  const tokens = tokenize(text);
  if (!tokens.length) return [];

  // 1) 句子：遇到句中终止标点即收尾，标点保留在本句
  const sentences = [];
  let sentence = [];
  for (const token of tokens) {
    sentence.push(token);
    if (token.type === 'punct') {
      sentences.push(sentence);
      sentence = [];
    }
  }
  if (sentence.length) sentences.push(sentence);

  // 2) 句子装箱：相邻短句合成一条，超宽句子单独折行
  const lines = [];
  let bucket = [];
  let bucketWidth = 0;
  const flush = () => {
    if (!bucket.length) return;
    const width = displayWidth(joinTokens(bucket));
    if (width <= maxWidth) {
      lines.push(bucket);
    } else {
      lines.push(...packTokens(bucket, maxWidth));
    }
    bucket = [];
    bucketWidth = 0;
  };
  for (const s of sentences) {
    const width = displayWidth(joinTokens(s));
    if (bucket.length && bucketWidth + width > maxWidth) flush();
    bucket.push(...s);
    bucketWidth += width;
  }
  flush();

  // 3) 纯标点片并回相邻条：绝不产出只有标点的字幕条
  const merged = [];
  for (const line of lines) {
    const textOf = joinTokens(line);
    if (!hasContent(textOf) && merged.length) {
      merged[merged.length - 1] = [...merged[merged.length - 1], ...line];
      continue;
    }
    if (!hasContent(textOf) && !merged.length) {
      // 句首孤立标点：并入下一条，先暂存
      merged.push(line);
      continue;
    }
    merged.push(line);
  }

  // 4) 碎条并回前条（不超宽才并）
  const finalLines = [];
  for (const line of merged) {
    const prev = finalLines[finalLines.length - 1];
    if (!prev) {
      finalLines.push(line);
      continue;
    }
    const textOf = joinTokens(line);
    const prevText = joinTokens(prev);
    const width = displayWidth(textOf);
    const shouldMerge = !hasContent(textOf) || width < minWidth;
    if (shouldMerge && displayWidth(prevText + textOf) <= maxWidth) {
      finalLines[finalLines.length - 1] = [...prev, ...line];
    } else if (shouldMerge && !hasContent(textOf)) {
      // 标点尾片即便溢出也并回，避免孤条（单标点最多溢出 1 个宽度）
      finalLines[finalLines.length - 1] = [...prev, ...line];
    } else {
      finalLines.push(line);
    }
  }

  return finalLines
    .map((line) => joinTokens(line).trim())
    .filter((cue) => cue.length > 0);
};

export default splitCues;
