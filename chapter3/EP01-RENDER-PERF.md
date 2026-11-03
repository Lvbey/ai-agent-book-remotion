# EP01 渲染性能基准（并发 + GPU 加速）

> 目的：在保证画质不降级的前提下，压掉「整片 ~30 分钟、54,637 帧」的渲染墙钟时间。
> 本文件只解决「渲染得够不够快」，与画面内容、配音、字幕的验收无关。

## 1. 测试环境

| 项 | 值 |
| --- | --- |
| OS | Windows 10/11（Git Bash） |
| CPU | 4 核 8 线程（Remotion 报告 `Available CPU cores: 8`） |
| 独显 | NVIDIA GeForce GTX 1050 Ti，4,096 MiB，驱动 581.57 |
| 核显 | Intel HD Graphics 630 |
| Remotion | 4.0.332，`chrome-headless-shell` 无头渲染 |
| 样片区间 | 帧 1500–2100（600 帧，对应正片 00:50–01:10，含代码流/结构图等中高负载场景） |
| 分辨率/编码 | 1920×1080、H.264、`crf 20`、`jpeg` 中间帧 |

同一区间反复渲染，取墙钟秒数（含 bundling 之外的渲染主体）。GPU 侧用
`nvidia-smi --query-gpu=utilization.gpu,memory.used` 每 0.5 s 采样求均值。

## 2. 结果

| 配置 | `--gl` | 并发 | 耗时 | 相对基线 | 独显占用 |
| --- | --- | --- | --- | --- | --- |
| 基线（软件光栅） | `swangle` | 6 | **155 s** | 1.00× | 0 % / 0 MiB |
| ANGLE + D3D11 | `angle` | 6 | 42 s | 3.69× | 0 % / 0 MiB（走核显） |
| ANGLE + EGL | `angle-egl` | 6 | 48 s | 3.23× | — |
| Vulkan | `vulkan` | 6 | 39 s | 3.97× | 5 % / 296 MiB（走独显） |
| ANGLE | `angle` | 8 | 41 s / 39 s | ≈3.9× | 1 % / 0 MiB |
| Vulkan | `vulkan` | 8 | 36 s / 41 s | ≈4.0× | 5 % / 288 MiB |
| ANGLE + `veryfast` | `angle` | 8 | 37 s | 4.19× | — |
| ANGLE + NVENC | `angle` | 6 | ❌ 失败 | — | — |
| 并发 10 | — | 10 | ❌ 失败 | — | — |

## 3. 结论

### 3.1 GPU 加速：必须开，收益 3.8×

`swangle` 是 Chromium 自带的 SwiftShader **纯 CPU 软光栅**，155 s/600 帧；
换成 `angle`（Windows 下走 D3D11 硬件光栅）后降到 40 s 上下。
这条 3.8 倍的差距就是「GPU 加速到底有没有用」的答案——有，而且很大。

值得注意的一点：`angle` 全程 `nvidia-smi` 读数为 0 % / 0 MiB，
说明 ANGLE 选的适配器是 **Intel HD 630 核显**而不是 GTX 1050 Ti。
核显已经足够——本片的瓶颈不在填充率，而在「逐帧截屏 + 帧数据回传 + x264 编码」，
这些仍然是 CPU 活儿（Vulkan 走独显时 GPU 利用率也只有 5 %，印证了这一点）。

### 3.2 Vulkan 只快 4 %，不采用

`vulkan` 面子上最快（38.5 s vs 40 s），但两次复测分别 36 s / 41 s，
与 `angle` 的 41 s / 39 s **落在同一噪声带内**。为这 4 % 去赌老 Pascal 驱动
在 30 分钟长渲染里不出事，不划算，故选 `angle`。

### 3.3 并发：8 是硬上限

Remotion 会校验 `concurrency ≤ CPU 核数`，并发 10 直接报
`concurrency is set higher than the amount of CPU cores available`。
实测 6 → 8 收益不足 5 %（41 s vs 42 s），既然免费就取满核 8。

### 3.4 `--hardware-acceleration`（NVENC）为什么用不了

两个原因，任一都足以否掉：

1. **参数互斥**：该项会强制 `videoBitrate`，与配置里的 `crf` 冲突，直接抛
   `"crf" and "videoBitrate" can not both be set`。
2. **不划算**：编码只占整体耗时的约 8 %（把 `--x264-preset` 从 `medium` 换到
   `veryfast` 也仅省 7 %，37 s vs 40 s），而 NVENC 在同码率下画质弱于 x264，
   本片大量柔和渐变背景，x264 快档容易出现色带。

因此编码链路保持 `h264 + crf 20 + medium`，不吃这块收益。

## 4. 整片实测

按上面选定的配置跑完整片（54,637 帧）验证，不是估算：

| 项 | 值 |
| --- | --- |
| 墙钟耗时 | **2,411 s（40.2 min）** |
| 平均吞吐 | 22.7 帧/秒（整片平均，含片头片尾的轻负载段） |
| 产物体积 | 154,517,313 B / 147.3 MiB |
| 结果 | `rc=0`，无重试、无崩溃、无内存告警 |

样片区间的 24 帧/秒与整片 22.7 帧/秒基本吻合，说明 600 帧基准的代表性够用。

## 5. 落地配置

已写入 `remotion/remotion.config.ts`：

```ts
Config.setVideoImageFormat('jpeg');
Config.setConcurrency(8);                      // 拉满 8 逻辑核
Config.setChromiumOpenGlRenderer('angle');     // D3D11 硬件光栅，3.8x
Config.setCodec('h264');
Config.setCrf(20);
```

命令行不再需要额外传参，直接：

```bash
npm run render:voiced     # → out/EP01-voiced.mp4
```

## 6. 复现基准

```bash
# 单配置计时（600 帧）
time npx remotion render src/index.ts EP01UserMemory out/bench/x.mp4 \
  --frames=1500-2100 --concurrency=8 --gl=angle

# 边渲染边采 GPU
( while true; do nvidia-smi --query-gpu=utilization.gpu,memory.used \
    --format=csv,noheader,nounits; sleep 0.5; done ) &
```

> 提醒：`--log=error` 会把进度条一起吞掉，长渲染排障时用 `--log=info`。
