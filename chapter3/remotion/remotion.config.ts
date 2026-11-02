import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setConcurrency(6);
Config.setChromiumOpenGlRenderer('angle');
Config.setCodec('h264');
Config.setCrf(20);
