/**
 * 字幕时码对齐：把 provider 的字级时间戳映射到既有字幕切分（按标点规则切好的条）。
 *
 * 为什么不直接按词渲染字幕：
 *   词级时间戳粒度是「单字」，直接上屏会碎成两三字一闪；本工程的字幕条是人工确认过的
 *   语义断句（每屏 ≤18 汉字）。因此保留切分、只把每条区间替换为真实语音区间。
 *
 * 坐标换算：
 *   字幕条坐标系以「发音字符数」累加（剔除标点空白），词表坐标系同理。
 *   两者总量通常相等（TTS 按原文合成），但数字/英文可能被读成不同字数，
 *   故按 scale = 字幕总字数 / 词表总字数 做一次线性换算，再落到具体词的内部插值。
 */

const PUNCT = /[\s，。！？；：、,.!?;:"'“”‘’（）()《》〈〉【】—…·\-~～]/;

/** 发音字符数（剔除标点与空白）。 */
export const spokenChars = (text) => {
  let n = 0;
  for (const ch of text) {
    if (PUNCT.test(ch)) continue;
    n += 1;
  }
  return n;
};

/** 在「字」坐标系上，把累计字数位置换算为时间。 */
export const timeAtChar = (words, wordEnds, scale, position) => {
  const target = position / scale;
  let idx = wordEnds.findIndex((end) => end > target + 1e-6);
  if (idx < 0) return words[words.length - 1].endTime;
  const prevEnd = idx === 0 ? 0 : wordEnds[idx - 1];
  const word = words[idx];
  const span = Math.max(wordEnds[idx] - prevEnd, 1e-6);
  const frac = Math.min(1, Math.max(0, (target - prevEnd) / span));
  return word.startTime + (word.endTime - word.startTime) * frac;
};

/**
 * @param {string[]} cues 字幕条文本（顺序与上屏顺序一致）
 * @param {{word:string,startTime:number,endTime:number,confidence:number|null}[]} words
 * @param {number} audioSeconds 该单元音频时长（秒）
 * @returns {{startSec:number,endSec:number,confidence:number|null}[]|null} 词表不可用时返回 null
 */
export const alignCues = (cues, words, audioSeconds) => {
  if (!words || !words.length || !cues.length) return null;
  const cueLens = cues.map((c) => Math.max(1, spokenChars(c)));
  const wordLens = words.map((w) => spokenChars(w.word));
  const totalCue = cueLens.reduce((a, b) => a + b, 0);
  const totalWord = wordLens.reduce((a, b) => a + b, 0);
  if (!totalWord || !totalCue) return null;

  const scale = totalCue / totalWord;
  const wordEnds = [];
  let acc = 0;
  for (const len of wordLens) {
    acc += len;
    wordEnds.push(acc);
  }

  const starts = [0];
  let cum = 0;
  for (let i = 0; i < cues.length - 1; i++) {
    cum += cueLens[i];
    starts.push(cum);
  }

  const result = [];
  let prevEnd = words[0].startTime;
  for (let i = 0; i < cues.length; i++) {
    const start = Math.max(
      prevEnd,
      i === 0 ? words[0].startTime : timeAtChar(words, wordEnds, scale, starts[i]),
    );
    let end = i === cues.length - 1
      ? Math.max(start, Math.min(audioSeconds, words[words.length - 1].endTime))
      : Math.max(start, timeAtChar(words, wordEnds, scale, starts[i + 1]));
    if (end - start < 0.08) end = Math.min(audioSeconds, start + 0.08);

    // 置信度取与区间有交叠的词；纯标点字幕条可能落在两词之间，回退到最近的前一个词
    const overlapping = words.filter(
      (w) => w.startTime < end + 1e-6 && w.endTime > start - 1e-6,
    );
    const pool = overlapping.length
      ? overlapping
      : words.filter((w) => w.startTime <= end + 1e-6).slice(-1);
    const confidences = pool
      .map((w) => w.confidence)
      .filter((c) => typeof c === 'number');

    result.push({
      startSec: start,
      endSec: end,
      confidence: confidences.length ? confidences.reduce((a, b) => a + b, 0) / confidences.length : null,
    });
    prevEnd = end;
  }
  return result;
};
