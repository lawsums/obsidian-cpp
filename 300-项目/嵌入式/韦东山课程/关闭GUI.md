
对于 IMX6ULL，首先需要关闭默认的 qt gui 程序，才可以执行 ts_test_mt
测试命令，关闭 qt 命令如下所示：
```bash
mv /etc/init.d/*hmi* /root
mv /etc/init.d/*lvgl* /root
sync
reboot
```

---

针对你提到的 IMX6ULL 开发板，关闭 Qt GUI 的程序是通过把启动脚本移走来实现的。要重新打开，**反向操作**即可。

但直接移回去可能不会立刻生效，因为脚本的启动时机是在系统启动时。以下是完整的恢复步骤：

**1. 把脚本文件移回原处**

```bash
# 将之前移到 /root 目录下的 hmi 和 lvgl 相关脚本移回 init.d 目录
mv /root/*hmi* /etc/init.d/
mv /root/*lvgl* /etc/init.d/
```

**2. 同步并重启**

```bash
sync
reboot
```

---

**3. 如果找不到文件（重要提示）**

如果你在 `/root` 目录下找不到这些文件（比如被误删了），可以这样解决：

- **临时手动启动**（不用重启）：直接找到你板子上的 Qt 程序路径，通常位于 `/opt/` 或 `/usr/bin/` 下，名字可能叫 `hmi` 或 `lvgl_demo`。直接执行它：

  ```bash
  /opt/hmi      # 举例，请根据实际路径输入
  ```

- **永久恢复**：如果文件丢失，需要重新烧写包含 Qt 应用的固件，或者从备份中复制这两个脚本文件到 `/etc/init.d/`，然后赋予执行权限：

  ```bash
  chmod +x /etc/init.d/*hmi*
  chmod +x /etc/init.d/*lvgl*
  ```

---

**一些补充建议**

- 如果你只是想临时测试触摸屏，测试完后**不重启**，可以直接在终端输入 `ts_test_mt` 运行；测试完按 `Ctrl + C` 退出，再执行上面的 `mv` 移回命令并重启即可。
- 以后如果频繁切换，建议写两个简单的脚本，比如 `disable_gui.sh`（关闭）和 `enable_gui.sh`（恢复），放在 `/root` 目录下，这样就不用每次都敲命令了。

如果在 `/root` 下没找到移走的文件，告诉我你的 Qt 程序具体叫什么名字，我帮你找找手动启动的方法。😊