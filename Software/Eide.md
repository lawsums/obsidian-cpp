- [x] 代码补全 ✅ 2026-08-16
- [ ] 创建一个合适的 VS Code IDE 模板，使其进入后能自动识别使用 AC5 和 OpenOCD 烧录格式，以及有一个 `launch.json`

1. 注意路径不能有**中文**
2. 首先下载工具，配置 ARM GCC 工具链和 OpenOCD 工具链。
3. 使用 openocd 创建一个调试配置文件
4. 对于这个调试部分，我们修改 `launch.json` axf 格式代替这个 elf 格式