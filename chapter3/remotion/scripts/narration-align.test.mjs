/**
 * 字幕时码对齐的回归测试：node --test scripts/narration-align.test.mjs
 * 关键不变量：单调不重叠、落在 [0, audioSeconds] 内、覆盖整段语音、词表缺失时返回 null。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {alignCues, spokenChars} from './lib/align-cues.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const words = [
  {word: '上', startTime: 0.1, endTime: 0.3, confidence: 0.9},
  {word: '一', startTime: 0.3, endTime: 0.45, confidence: 0.8},
  {word: '章', startTime: 0.45, endTime: 0.7, confidence: 0.7},
  {word: '我', startTime: 0.7, endTime: 0.9, confidence: 0.6},
  {word: '们', startTime: 0.9, endTime: 1.1, confidence: 0.5},
  {word: '讲', startTime: 1.1, endTime: 1.4, confidence: 0.9},
];

const assertMonotonic = (result, audioSeconds) => {
  let prev = 0;
  for (const cue of result) {
    assert.ok(cue.startSec >= prev - 1e-9, `起点回退：${cue.startSec} < ${prev}`);
    assert.ok(cue.endSec >= cue.startSec - 1e-9, '区间倒挂');
    assert.ok(cue.startSec >= -1e-9 && cue.endSec <= audioSeconds + 1e-9, '越出音频边界');
    prev = cue.endSec;
  }
};

test('spokenChars 剔除标点与空白', () => {
  assert.equal(spokenChars('上一章，我们。'), 5);
  assert.equal(spokenChars('Agent 记忆'), 7); // A-g-e-n-t + 记 + 忆
  assert.equal(spokenChars('——'), 0);
});

test('单条字幕覆盖整段语音', () => {
  const result = alignCues(['上一章我们讲'], words, 1.5);
  assert.equal(result.length, 1);
  assert.equal(result[0].startSec, 0.1);
  assert.equal(result[0].endSec, 1.4);
  assert.ok(result[0].confidence > 0.5 && result[0].confidence < 0.9);
});

test('两条字幕在词边界切分', () => {
  const result = alignCues(['上一章', '我们讲'], words, 1.5);
  assert.equal(result.length, 2);
  assertMonotonic(result, 1.5);
  assert.ok(Math.abs(result[0].endSec - 0.7) < 1e-6, `切分点应为 0.7，实际 ${result[0].endSec}`);
  assert.ok(Math.abs(result[1].startSec - 0.7) < 1e-6);
  assert.equal(result[1].endSec, 1.4);
});

test('词表字数与字幕字数不一致时仍单调且不越界', () => {
  // 字幕写 "3"，TTS 读作 "三"，词表多一字
  const odd = [
    {word: '有', startTime: 0, endTime: 0.2, confidence: null},
    {word: '三', startTime: 0.2, endTime: 0.5, confidence: null},
    {word: '个', startTime: 0.5, endTime: 0.8, confidence: null},
  ];
  const result = alignCues(['有3个', '东西'], odd, 0.8);
  assert.equal(result.length, 2);
  assertMonotonic(result, 0.8);
  assert.ok(result[1].endSec <= 0.8 + 1e-9);
});

test('词表缺失时返回 null 由调用方回退', () => {
  assert.equal(alignCues(['任意'], [], 1), null);
  assert.equal(alignCues(['任意'], null, 1), null);
});

test('空字幕文本不会产生负区间', () => {
  const result = alignCues(['。', '上一章'], words, 1.5);
  assertMonotonic(result, 1.5);
});

test('纯标点条也能回退到邻近词的置信度', () => {
  const result = alignCues(['上一章', '。', '我们讲'], words, 1.5);
  assertMonotonic(result, 1.5);
  for (const cue of result) {
    assert.equal(typeof cue.confidence, 'number', '每条字幕都应有置信度');
  }
});

test('真实分段：U001 的对齐结果覆盖全部词表', () => {
  const wordsPath = path.join(ROOT, 'narration/ep01/segments/EP01-U001/words.json');
  const manifestPath = path.join(ROOT, 'narration/ep01/segments/EP01-U001/manifest.json');
  if (!fs.existsSync(wordsPath) || !fs.existsSync(manifestPath)) {
    test.skip('未合成 EP01-U001，跳过真实数据用例');
    return;
  }
  const realWords = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const cues = ['上一章我们解决的是单次交互里的上下文', '管理。', '这一章要处理一个更难的问题：', '对话结束之后，', 'Agent 还能不能记住你、记住知识。'];
  const result = alignCues(cues, realWords, manifest.durationSeconds);
  assert.equal(result.length, cues.length);
  assertMonotonic(result, manifest.durationSeconds);
  // 首条从第一个词起，末条收在最后一个词
  assert.ok(Math.abs(result[0].startSec - realWords[0].startTime) < 1e-6);
  assert.ok(Math.abs(result[result.length - 1].endSec - realWords[realWords.length - 1].endTime) < 1e-6);
  // 区间应铺满语音，不应出现 >0.6s 的空白
  for (let i = 1; i < result.length; i++) {
    assert.ok(result[i].startSec - result[i - 1].endSec < 0.6, `第 ${i} 条前出现过长空白`);
  }
});
