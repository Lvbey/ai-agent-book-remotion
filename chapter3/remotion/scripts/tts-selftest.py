"""tts-synthesize 的离线单元测试：不发网络请求，不读取凭据。

覆盖参考工程 voice-stage 的回归点，并补充本工程的降级语义：
字级时间戳越界/缺失时必须返回空列表（由调用方回退），绝不伪造时间戳。
"""
import array
import base64
import importlib.util
import math
import unittest
from pathlib import Path

SPEC = importlib.util.spec_from_file_location('tts', Path(__file__).with_name('tts-synthesize.py'))
tts = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(tts)


class DecodeTests(unittest.TestCase):
    def test_chunk_order_preserved(self):
        events = [
            {'data': base64.b64encode(b'ab').decode()},
            {'data': base64.b64encode(b'cd').decode(), 'code': 20000000},
        ]
        pcm, words = tts.decode(events)
        self.assertEqual(pcm, b'abcd')
        self.assertEqual(words, [])

    def test_incomplete_stream_rejected(self):
        with self.assertRaises(tts.TtsError):
            tts.decode([{'data': base64.b64encode(b'ab').decode()}])

    def test_provider_failure_rejected(self):
        with self.assertRaises(tts.TtsError):
            tts.decode([{'code': 45000000}])

    def test_odd_byte_length_rejected(self):
        with self.assertRaises(tts.TtsError):
            tts.decode([{'data': base64.b64encode(b'abc').decode(), 'code': 20000000}])

    def test_sentence_payload_parsed(self):
        payload = {'sentence': '{"words":[{"word":"测试","startTime":0.1,"endTime":0.8}]}'}
        _, words = tts.decode([{**payload, 'code': 20000000},
                               {'data': base64.b64encode(b'ab').decode(), 'code': 20000000}])
        self.assertEqual(words[0]['word'], '测试')


class WordValidationTests(unittest.TestCase):
    def test_bounds_rejected(self):
        self.assertEqual(tts.validate_words([{'word': '越界', 'startTime': 0, 'endTime': 2}], 1.0), [])

    def test_non_monotonic_rejected(self):
        words = [
            {'word': '后', 'startTime': 0.6, 'endTime': 0.9},
            {'word': '前', 'startTime': 0.1, 'endTime': 0.4},
        ]
        self.assertEqual(tts.validate_words(words, 1.0), [])

    def test_missing_fields_rejected(self):
        self.assertEqual(tts.validate_words([{'word': 'x'}], 1.0), [])

    def test_valid_words_kept(self):
        words = [{'word': '测试', 'startTime': 0.1, 'endTime': 0.8, 'confidence': 0.9}]
        self.assertEqual(tts.validate_words(words, 1.0)[0]['endTime'], 0.8)

    def test_no_fabricated_timestamps(self):
        self.assertEqual(tts.validate_words([], 1.0), [])


class CacheKeyTests(unittest.TestCase):
    CONFIG = {
        'resource': 'seed-tts-2.0',
        'speaker': 'zh_female_zhixingnv_uranus_bigtts',
        'sample_rate': 48000,
        'speech_rate': 0,
        'instruction': '测试风格',
    }

    def test_stable(self):
        self.assertEqual(tts.cache_key('文本', self.CONFIG), tts.cache_key('文本', self.CONFIG))

    def test_text_sensitive(self):
        self.assertNotEqual(tts.cache_key('文本A', self.CONFIG), tts.cache_key('文本B', self.CONFIG))

    def test_config_sensitive(self):
        changed = dict(self.CONFIG, speech_rate=5)
        self.assertNotEqual(tts.cache_key('文本', self.CONFIG), tts.cache_key('文本', changed))

    def test_ignores_dict_order(self):
        reordered = dict(reversed(list(self.CONFIG.items())))
        self.assertEqual(tts.cache_key('文本', self.CONFIG), tts.cache_key('文本', reordered))


class NormalizeTests(unittest.TestCase):
    RATE = 1000
    AMP = 8000

    def pcm(self, seconds):
        return b'\x00\x00' * int(seconds * self.RATE)

    def voiced_pcm(self, parts):
        """按 [(时长, 是否有声)] 拼 PCM，声部为 200Hz 正弦。"""
        data = array.array('h')
        for seconds, voiced in parts:
            for i in range(int(seconds * self.RATE)):
                value = 0
                if voiced:
                    value = int(self.AMP * math.sin(2 * math.pi * 200 * i / self.RATE))
                data.append(value)
        return data.tobytes()

    def tail_ratio(self, pcm):
        samples = array.array('h')
        samples.frombytes(pcm)
        peak = max(abs(v) for v in samples) or 1
        window = samples[-10:]
        return (sum(v * v for v in window) / len(window)) ** 0.5 / peak

    def test_trims_by_energy_not_by_word_timestamps(self):
        # 真实收声 0.5–1.1s，但末词时码只标到 1.0s（provider 常见的提前）
        words = [{'word': '甲', 'startTime': 0.5, 'endTime': 0.8},
                 {'word': '乙', 'startTime': 0.8, 'endTime': 1.0}]
        pcm = self.voiced_pcm([(0.5, False), (0.6, True), (0.9, False)])
        trimmed, offset, shifted = tts.normalize_segment(pcm, words, self.RATE)
        # 起点 0.5-0.10=0.40；终点 1.10+0.22=1.32
        self.assertAlmostEqual(offset, 0.40, places=3)
        self.assertAlmostEqual(tts.wav_seconds(trimmed, self.RATE), 0.92, places=3)
        # 关键回归：裁剪不得早于真实收声结束，且切口必须落在静音里
        self.assertGreater(tts.wav_seconds(trimmed, self.RATE), 1.10 - offset)
        self.assertLess(self.tail_ratio(trimmed), 0.02)
        self.assertAlmostEqual(shifted[0]['startTime'], 0.10, places=3)
        self.assertAlmostEqual(shifted[-1]['endTime'], 0.60, places=3)

    def test_edge_fade_softens_hard_start(self):
        words = [{'word': '甲', 'startTime': 0.0, 'endTime': 0.5}]
        trimmed, _, _ = tts.normalize_segment(self.voiced_pcm([(0.5, True)]), words, self.RATE)
        samples = array.array('h')
        samples.frombytes(trimmed)
        self.assertLess(max(abs(v) for v in samples[:10]), self.AMP * 0.6)

    def test_silence_only_keeps_raw(self):
        words = [{'word': '甲', 'startTime': 0.0, 'endTime': 0.2}]
        pcm, offset, _ = tts.normalize_segment(self.pcm(1.0), words, self.RATE)
        self.assertEqual(offset, 0.0)
        self.assertAlmostEqual(tts.wav_seconds(pcm, self.RATE), 1.0, places=3)

    def test_words_clamped_into_range(self):
        words = [{'word': '甲', 'startTime': 0.0, 'endTime': 0.2}]
        pcm, _, shifted = tts.normalize_segment(self.pcm(1.0), words, self.RATE)
        self.assertGreaterEqual(shifted[0]['startTime'], 0.0)
        self.assertGreaterEqual(shifted[0]['endTime'], shifted[0]['startTime'])
        self.assertLessEqual(shifted[0]['endTime'], tts.wav_seconds(pcm, self.RATE) + 1e-6)

    def test_no_words_keeps_raw(self):
        pcm, offset, words = tts.normalize_segment(self.pcm(1.0), [], self.RATE)
        self.assertEqual(offset, 0.0)
        self.assertEqual(words, [])
        self.assertAlmostEqual(tts.wav_seconds(pcm, self.RATE), 1.0, places=3)


if __name__ == '__main__':
    unittest.main(verbosity=2)
