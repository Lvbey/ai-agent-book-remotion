// 字幕切分的回归测试：守住阶段 F 修掉的三类缺陷。
//
// 1) 不得出现纯标点字幕条（旧实现因超宽折断把「、」「，」「：」「。」单独成条）
// 2) 不得把英文单词从中间切断（append-on|ly、Personali|zed、q|wen3:4b）
// 3) 不得丢弃句首标点（旧正则要求标点前有非标点字符，句首标点被静默吞掉）
// 另外守住通用不变量：切分是纯划分（拼回等于原文）、每条都有实词、宽度不超告警线。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {displayWidth, hasContent, splitCues, tokenize} from './lib/split-cues.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UNITS_DIR = path.resolve(__dirname, '../src/data/units');
const SECTIONS = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'];

const loadUnits = () => {
  const all = [];
  for (const section of SECTIONS) {
    const list = JSON.parse(fs.readFileSync(path.join(UNITS_DIR, `${section}.json`), 'utf8'));
    for (const unit of list) all.push(unit);
  }
  return all;
};

/** 统计含字母的完整词（按 tokenize 口径），用于比对「切分前后词是否被拆散」。 */
const wordCounts = (text) => {
  const counts = new Map();
  for (const token of tokenize(text)) {
    if (token.type !== 'word' || !/[A-Za-z]/.test(token.value)) continue;
    counts.set(token.value, (counts.get(token.value) ?? 0) + 1);
  }
  return counts;
};

const sumWordCounts = (cues) => {
  const counts = new Map();
  for (const cue of cues) {
    for (const [word, n] of wordCounts(cue)) counts.set(word, (counts.get(word) ?? 0) + n);
  }
  return counts;
};

const stripSpace = (s) => s.replace(/\s/g, '');

const units = loadUnits();

test('全部单元：切分是纯划分，拼回等于原文', () => {
  for (const unit of units) {
    const cues = splitCues(unit.text);
    assert.ok(cues.length >= 1, `${unit.id} 没有产出字幕条`);
    assert.equal(
      stripSpace(cues.join('')),
      stripSpace(unit.text),
      `${unit.id} 切分后丢失或新增了字符`,
    );
  }
});

test('全部单元：不存在纯标点字幕条', () => {
  const offenders = [];
  for (const unit of units) {
    for (const cue of splitCues(unit.text)) {
      if (!hasContent(cue)) offenders.push(`${unit.id}: ${JSON.stringify(cue)}`);
    }
  }
  assert.deepEqual(offenders, [], `出现纯标点字幕条：\n${offenders.join('\n')}`);
});

test('全部单元：不存在英文单词被切断', () => {
  const offenders = [];
  for (const unit of units) {
    const cues = splitCues(unit.text);
    const expected = wordCounts(unit.text);
    const actual = sumWordCounts(cues);
    for (const [word, n] of expected) {
      const got = actual.get(word) ?? 0;
      if (got !== n) offenders.push(`${unit.id}: 词 ${JSON.stringify(word)} 期望 ${n} 次，切分后 ${got} 次`);
    }
  }
  assert.deepEqual(offenders, [], `出现英文断词：\n${offenders.join('\n')}`);
});

test('全部单元：单条宽度不超过 20 的告警线', () => {
  const offenders = [];
  for (const unit of units) {
    for (const cue of splitCues(unit.text)) {
      const width = displayWidth(cue);
      if (width > 20) offenders.push(`${unit.id}: ${width.toFixed(1)} ${JSON.stringify(cue)}`);
    }
  }
  assert.deepEqual(offenders, [], `出现超宽字幕条：\n${offenders.join('\n')}`);
});

test('回归 EP01-U002：超宽折断不得把「、」留成单独一条', () => {
  const unit = units.find((u) => u.id === 'EP01-U002');
  const cues = splitCues(unit.text);
  assert.ok(!cues.includes('、'), '仍然出现「、」单独成条');
  assert.ok(cues.some((c) => c.includes('偏好')), '「偏好」所在条缺失');
});

test('回归 EP01-U047：append-only 不得被切成 append-on / ly', () => {
  const unit = units.find((u) => u.id === 'EP01-U047');
  const cues = splitCues(unit.text);
  const joined = cues.join('|');
  assert.ok(!/\|ly/.test(joined), '仍出现以 ly 开头的断词条');
  assert.ok(cues.some((c) => c.includes('append-only')), 'append-only 未完整落在同一条');
});

test('回归 EP01-U092：Personalized Agents 不得被切断', () => {
  const unit = units.find((u) => u.id === 'EP01-U092');
  const cues = splitCues(unit.text);
  const expected = wordCounts(unit.text);
  const actual = sumWordCounts(cues);
  for (const [word, n] of expected) {
    assert.equal(actual.get(word) ?? 0, n, `词 ${JSON.stringify(word)} 被切断`);
  }
  assert.ok(!cues.some((c) => c.startsWith('zed')), '仍出现以 zed 开头的断词条');
});

test('回归 EP01-U141：qwen3:4b 不得被切成 q / wen3:4b', () => {
  const unit = units.find((u) => u.id === 'EP01-U141');
  const cues = splitCues(unit.text);
  assert.ok(cues.some((c) => c.includes('qwen3:4b')), 'qwen3:4b 未完整落在同一条');
  assert.ok(!cues.some((c) => c.startsWith('wen3')), '仍出现以 wen3 开头的断词条');
});

test('句首标点不被丢弃', () => {
  const cues = splitCues('、先说结论：这件事值得做。');
  assert.equal(cues.join(''), '、先说结论：这件事值得做。');
  assert.ok(hasContent(cues[0]), '首条只有标点');
});

test('英文词内部连接符保持整体', () => {
  const tokens = tokenize('切到 qwen3:4b 或 append-only 模式');
  const words = tokens.filter((t) => t.type === 'word').map((t) => t.value);
  assert.deepEqual(words, ['qwen3:4b', 'append-only']);
});

test('句末句点不吞进单词', () => {
  const tokens = tokenize('using RetinaNet.');
  const words = tokens.filter((t) => t.type === 'word').map((t) => t.value);
  assert.deepEqual(words, ['using', 'RetinaNet']);
});

test('极长无标点文本按宽度折行且不留标点尾片', () => {
  const text = '这是一段完全没有标点的很长的口播文本用来验证折行逻辑是否正确、';
  const cues = splitCues(text);
  assert.ok(cues.length > 1);
  for (const cue of cues) {
    assert.ok(hasContent(cue), `出现纯标点条 ${JSON.stringify(cue)}`);
    assert.ok(displayWidth(cue) <= 20);
  }
  assert.equal(cues.join(''), text);
});
