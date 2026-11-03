import {Config} from '@remotion/cli/config';

// ---- 渲染性能配置（2026-11-03 基准实测，600 帧片段 / 8 逻辑核 / GTX 1050 Ti + Intel HD 630）----
// swangle(CPU 软光栅) 155s → angle(D3D11 硬件光栅) 40s，约 3.8x；Vulkan 走独显 38.5s，仅快 4%
// 且老 Pascal 驱动稳定性未知，故选 angle。
// concurrency 上限被 Remotion 卡在 CPU 核数（本机 8），实测 6→8 收益 <5%，取满核。
// --hardware-acceleration(NVENC) 不可用：与 crf 互斥，且 x264 crf20 画质更优；编码仅占约 8% 耗时。
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setConcurrency(8);
Config.setChromiumOpenGlRenderer('angle');
Config.setCodec('h264');
Config.setCrf(20);
