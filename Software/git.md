
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

# 2 开发基本流程

多人（以两人为例）协作开发的 Git 核心流程遵循「**拉取最新代码 → 本地开发 → 提交本地变更 → 推送/解决冲突**」的闭环，核心原则是：**永远基于远程最新代码开发，避免直接推送覆盖他人修改**。下面我会用「两人轮流开发」的场景，拆解完整的 Git 命令流程，步骤清晰且贴合实际工作场景。

### 2.1.1 一、先明确基础约定（多人协作前提）
1. **分支规范**：
   - 主分支：`main`/`master`（保护分支，禁止直接推送，仅通过合并请求/MR/PR 合并）；
   - 开发分支：每人基于 `dev` 分支（开发主分支）创建个人功能分支，比如 `feature/zhangsan-login`、`feature/lisi-pay`；
   - 临时约定：两人轮流开发时，也可简化为直接在 `dev` 分支协作（适合小项目）。
2. **提交规范**：提交信息清晰（比如 `feat: 新增登录验证`、`fix: 修复支付按钮样式`），避免无意义的 `update`。

### 2.1.2 二、两人轮流开发的完整 Git 命令流程（以简化版 `dev` 分支协作为例）
假设：开发者 A 和开发者 B 协作开发，共用远程 `dev` 分支，轮流提交代码。

#### 2.1.2.1 阶段1：初始化/首次拉取代码（两人都要做）
```bash
# 1. 克隆远程仓库（首次仅需执行）
git clone <远程仓库地址>  # 比如 git clone git@github.com:xxx/xxx.git
cd <项目目录>

# 2. 切换到开发分支（如果远程已有dev分支）
git checkout dev
# 如果远程没有dev分支，先创建并推送到远程
git checkout -b dev  # 创建本地dev分支
git push -u origin dev  # 关联并推送dev分支到远程
```

#### 2.1.2.2 阶段2：开发者 A 先开发并推送
```bash
# 步骤1：拉取远程dev分支最新代码（开发前必做！确保基于最新版本）
git pull origin dev

# 步骤2：本地开发（修改代码、新增文件等）

# 步骤3：查看本地变更（确认修改内容）
git status  # 红色为未追踪/修改的文件，绿色为已暂存的文件

# 步骤4：暂存所有变更（. 表示所有文件，也可指定文件 git add src/login.vue）
git add .

# 步骤5：提交本地变更（备注清晰的提交信息）
git commit -m "feat: 完成登录页面开发"

# 步骤6：推送本地dev分支到远程（无冲突时直接推送）
git push origin dev
```

#### 2.1.2.3 阶段3：开发者 B 接棒开发（核心：先同步 A 的代码）
```bash
# 步骤1：拉取 A 推送的最新代码（开发前必做！关键步骤）
git pull origin dev
# ✅ 此时 B 的本地dev分支会同步 A 的所有修改，基于最新代码开发

# 步骤2：本地开发（比如修改登录页面的交互逻辑）

# 步骤3：暂存+提交（和A的操作一致）
git add .
git commit -m "fix: 优化登录按钮点击逻辑"

# 步骤4：推送代码到远程
git push origin dev
```

#### 2.1.2.4 阶段4：开发者 A 再次开发（重复闭环）
```bash
# 第一步依然是拉取 B 的最新代码！
git pull origin dev  # 同步 B 推送的优化代码
# 然后本地开发 → git add → git commit → git push
```

### 2.1.3 三、核心场景：推送时遇到冲突（两人同时修改同一文件）
如果两人同时修改了同一个文件的同一行，推送时会提示 `failed to push some refs to`（即你之前问的报错），解决流程如下：

#### 2.1.3.1 以开发者 A 为例（推送时提示冲突）：
```bash
# 1. 先拉取远程最新代码（会自动尝试合并，若冲突则终止）
git pull origin dev

# 2. 终端提示 "Automatic merge failed; fix conflicts and then commit the result"
#    此时打开冲突文件，会看到如下标记：
#    <<<<<<< HEAD （本地你的修改）
#    你的代码内容
#    =======
#    远程B的代码内容
#    >>>>>>> xxxxxxxx（B的提交哈希）

# 3. 手动解决冲突：保留正确代码，删除冲突标记（<<<<<<<、=======、>>>>>>>）
#    比如最终保留：优化后的登录按钮逻辑 + 你的新增功能

# 4. 标记冲突已解决，重新提交
git add .  # 暂存解决冲突后的文件
git commit -m "fix: 解决登录页面冲突，合并A和B的修改"

# 5. 再次推送（此时无冲突，可正常推送）
git push origin dev
```

### 2.1.4 四、进阶：用功能分支协作（更规范的多人流程）
小项目可直接用 `dev` 分支，但中大型项目建议用「功能分支」，流程如下：
```bash
# 开发者 A 流程：
1. git checkout dev  # 切到开发主分支
2. git pull origin dev  # 拉取最新dev
3. git checkout -b feature/A-login  # 创建个人功能分支
4. 本地开发 → git add → git commit
5. git push origin feature/A-login  # 推送个人分支到远程
6. 提 MR/PR 到 dev 分支（GitLab/GitHub 界面操作）
7. 开发者 B 审核后合并到 dev 分支

# 开发者 B 流程：
1. git checkout dev
2. git pull origin dev  # 拉取A合并后的最新dev
3. git checkout -b feature/B-pay  # 创建自己的功能分支
4. 开发 → 提交 → 推送 → 提 MR/PR
5. A 审核后合并到 dev
```

### 2.1.5 五、两人协作的关键命令速查表
| 场景        | 核心命令                                                                     |
| --------- | ------------------------------------------------------------------------ |
| 开发前同步最新代码 | `git pull origin dev`                                                    |
| 本地开发后暂存   | `git add .`                                                              |
| 提交本地变更    | `git commit -m "清晰的提交信息"`                                                |
| 推送本地分支到远程 | `git push origin dev`                                                    |
| 解决推送冲突    | `git pull origin dev` → 手动解决冲突 → `git add .` → `git commit` → `git push` |
| 查看分支状态    | `git status`（看变更）、`git log`（看提交历史）、`git branch -a`（看所有分支）                |

### 2.1.6 总结
1. **核心闭环**：多人协作的核心是「**开发前拉取最新代码 → 本地提交 → 推送/解决冲突**」，永远不跳过 `git pull` 步骤；
2. **冲突处理**：遇到冲突先拉取，手动解决冲突后再提交推送，禁止用 `git push -f` 强制覆盖；
3. **分支建议**：小项目可直接在 `dev` 分支轮流协作，中大型项目建议用「个人功能分支 + 合并请求」，更易追溯和回滚。

这个流程适配 90% 的双人协作场景，你可以直接按这个命令流程操作，遇到具体问题（比如冲突解决、分支管理）可以再细化问。