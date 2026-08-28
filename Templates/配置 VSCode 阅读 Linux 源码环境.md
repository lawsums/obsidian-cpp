
[Vscode配置Linux内核源码环境并整合DeepSeek大模型_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1LQfmYSEPj/?spm_id_from=333.337.search-card.all.click&vd_source=cf6228c0b4a5c283905e22fd11934994)


- [x] 1.安装arm交叉编译工具链 ✅ 2026-08-28
- [ ] 2.linux内核编译
- [ ] 3.clangd和bear的安装
- [ ] 4.bear跟踪linux内核编译
- [ ] 5.vscode安装remote工具和clangd插件实现精准跳转



# 1 笔记
## 1.1 安装 arm 交叉编译工具链
[工具/用于 ARM 平台的 gnu-toolchains · GitLab --- Tooling / gnu-toolchains-for-arm · GitLab](https://gitlab.arm.com/tooling/gnu-toolchains-for-arm/-/tree/releases/11.2-2022.02?ref_type=heads#linux)


通过 `sudo vim /etc/profile` 来修改环境变量配置
添加了一行 `export PATH=$PATH:/usr/arm/gcc-arm-none-eabi-linux/bin`


## 1.2 内核编译
`make menuconfig`, 进行图形化配置