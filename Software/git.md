
# 1 常用命令

## 1.1 git clone
`git clone -r 分支名 XXX.git` 表示从特定分支获取这个项目

## 1.2 git add

1.  `git add .` 将自己的文件都添加到待提交文件目录中
2. `git add 具体文件路径` 加入具体路径文件

## 1.3 git commit
`git commit -m ""` 提交并通过-m添加更新说明

## 1.4 git push
`git push -u origin 分支名` 提交到你的分支里面

## 1.5 git status
用于在 `add` 之前看看哪些文件修改了

## 1.6 git reset --soft HEAD~1
撤销一次 commit提交

## 1.7 git reset HEAD `具体路径`
撤销一次对于指定文件夹的修改

## 1.8 git diff  `具体路径`
检查指定文件夹内修改了哪些部分

## 1.9 git fetch origin
从远程仓库下载最新的代码和提交记录到本地仓库

## 1.10 git merge `分支名`
