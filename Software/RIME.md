## 0.1 注意
> [!tip] 
>  现在生效的是 C:\Users\Administrator\AppData\Roaming\Rime 的配置而不是 E 盘的

# 1 各个文件作用


# 2 小巧思
## 2.1 Capslock 切换中英文
在 XXX.yaml 的 bindings 中添加以下代码即可
```yaml
# 这两句缺一不可
- { when: always, accept: Caps_Lock, toggle: ascii_mode }
- { when: always, accept: Release+Escape, toggle: ascii_mode }
```
