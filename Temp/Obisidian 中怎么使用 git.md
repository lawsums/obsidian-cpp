
1. 首先我们需要建立一个新的 github仓库
2. 然后将这个仓库 pull 下来
3. 把这个仓库的配置文件夹(. Git) 移动到你的实际目录下
4. 设置自己作为当前文件夹的用户
   ``` bash
   # 或者可以通过这个命令一次性关闭所有目录的所有权校验, 虽然便捷，但略降低安全性，仅推荐本地开发环境使用。
   git config --global --add safe.directory '*'
   ```
   [多用户的情况下如何设置使用哪个用户](https://github.com/git-ecosystem/git-credential-manager/blob/main/docs/multiple-users.md)
5. 下载 Git 插件
6. 打开 Git 插件自动同步功能
   ![[Pasted image 20260212172521.png]]
   ![[Pasted image 20260212172442.png]]
7. Enjoy yourself!