import importlib.util, unittest, base64
from pathlib import Path
spec=importlib.util.spec_from_file_location('tts',Path(__file__).with_name('generate-tts.py'))
tts=importlib.util.module_from_spec(spec); spec.loader.exec_module(tts)
class ClientTests(unittest.TestCase):
    def test_chunk_order(self):
        pcm,words=tts.decode([{'data':base64.b64encode(b'ab').decode()},{'data':base64.b64encode(b'cd').decode(),'code':20000000}])
        self.assertEqual(pcm,b'abcd')
    def test_incomplete(self):
        with self.assertRaises(ValueError): tts.decode([{'data':'YWI='}])
    def test_provider_failure(self):
        with self.assertRaises(ValueError): tts.decode([{'code':45000000}])
    def test_seconds_conversion(self):
        self.assertEqual(tts.captions([{'word':'测试','startTime':0.1,'endTime':0.8}],1)[0]['endMs'],800)
    def test_no_fabricated_subtitles(self):
        with self.assertRaises(ValueError): tts.captions([],1)
    def test_bounds(self):
        with self.assertRaises(ValueError): tts.captions([{'word':'越界','startTime':0,'endTime':2}],1)
if __name__=='__main__': unittest.main()
