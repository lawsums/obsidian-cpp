
[Vscode配置Linux内核源码环境并整合DeepSeek大模型_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1LQfmYSEPj/?spm_id_from=333.337.search-card.all.click&vd_source=cf6228c0b4a5c283905e22fd11934994)


- [x] 1.安装arm交叉编译工具链 ✅ 2026-08-28
- [x] 2.linux内核编译 ✅ 2026-08-28
- [x] 3.clangd和bear的安装 ✅ 2026-08-28
- [x] 4.bear跟踪linux内核编译 ✅ 2026-08-28
- [ ] 5.vscode安装remote工具和clangd插件实现精准跳转



# 1 笔记
## 1.1 安装 arm 交叉编译工具链
[工具/用于 ARM 平台的 gnu-toolchains · GitLab --- Tooling / gnu-toolchains-for-arm · GitLab](https://gitlab.arm.com/tooling/gnu-toolchains-for-arm/-/tree/releases/11.2-2022.02?ref_type=heads#linux)


通过 `sudo vim /etc/profile` 来修改环境变量配置
添加了一行 `export PATH=$PATH:/usr/arm/gcc-arm-none-eabi-linux/bin`


## 1.2 内核编译
`make menuconfig`, 进行图形化配置

以三星系列为例，生成配置文件
`make exynos_defconfig ARCH=arm CROSS_COMPILE=arm-none-eabi-`

编译内核zImage
`make ARCH=arm CROSS_COMPILE=arm-none-eabi- zImage -j8`


## 1.3 clangd 和 bear 的安装
![[Pasted image 20260828170413.png]]

### 1.3.1 clangd
去 GitHub 上下载相应的二进制 Linux 版本
```bash
# 1. 进入目录
cd ~/tmp

# 2. 解压
unzip clangd-linux-15.0.6.zip

# 3. 进入解压出来的文件夹
cd clangd_15.0.6

# 4. 把二进制文件拷到系统路径（这样以后任何地方都能用）
sudo cp bin/clangd /usr/bin/

# 5. 把自带的库文件拷过去（虽然可能没有权限，但看具体包结构）
sudo cp -r lib/* /usr/local/lib/
```

### 1.3.2 bear
#### 1.3.2.1 安装 rustup

#### 1.3.2.2 通过 github 源码安装 bear

## 1.4 ![[bear 追踪内核编译]]

## 1.5 vscode 安装 remote 工具和 clangd 插件实现精准跳转
我们发现 11.2 的版本依旧太高，所以我们要安装 7.5 的版本。安装 7.5 版本时，需要将该环境变量继续加入此目录。
