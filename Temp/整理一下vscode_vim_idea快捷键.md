
## vscode

- `<space>`
    `<space>` esaymotion
	    `s` s-easymotion 输入一个字符
	`w` 保存
	`n` 切换 tree
	`ct` 打开/关闭 ai 提示
- `g`
	`d` 跳转到定义
	`q` 用于可视化选择的重排和换行文本块，保持评论风格。非常适合格式化文档注释。
	`b` 对下一个同名变量添加一个光标
	`h` 鼠标悬浮
- `a`
  `f` 视觉模式命令，可选择越来越大的作用域文本块

## neovim

- `<space>`
	  `h/j/k/l` 窗口跳转
	  `s` esaymotion
	  `w` 保存
	  `n` nvim-tree开关
	  `q` 保存退出
	  `Q` 强制退出
	  `bp` 标签页选择
	  `cs` 显示代码大纲
	  `f`
		 `b` 查找缓冲区(Buffers)
		  `g` 全局搜索字符串(Live Grep)
		  `r` 最近文件(Recent Files)
		  `f`  查找文件(Find Files)
		  `h` 查找帮助标签(Help Tags)
		  `s` 文档符号(Document Symbols)
		`g`
		  `c` Lspsaga code_action
		  `d` 跳转到定义
		  `f` 格式化
		  `h` 查找函数文档
		  `n` 查找下一个建议
		  `p` 查找上一个建议
		  `R` Lspsaga finder
		  `r` 重命名变量

##  ideavimrc
``` vimrc
" 这是一个 IdeaVim 配置文件 (.ideavimrc)。
" 它与标准的 Vim 配置 (.vimrc) 语法兼容，并支持集成 IDE 特定功能。
" 官方文档: https://jb.gg/h38q75
" 更多示例: https://jb.gg/share-ideavimrc

" ===========================================
"            基础 Vim/IdeaVim 设置
" ===========================================

" 启用 EasyMotion 插件
set easymotion

" 启用行号显示
set number

" 启用相对行号显示 (方便 hjkl 配合数字移动)
set relativenumber

" 设置滚动偏移量，确保光标周围总有上下文可见
set scrolloff=5

" 启用增量搜索，实时高亮匹配结果
set incsearch

" 搜索时忽略大小写
set ignorecase

" 设置 Tab 键和缩进的宽度为 4 个空格
set tabstop=4
set shiftwidth=4

" 启用自动缩进
set autoindent

" 禁用声音提示，改为视觉闪烁
set visualbell

" 高亮显示光标所在行
set cursorline

" 将搜索匹配的文本非高亮显示
set nohlsearch

" 允许退格键删除任何字符 (包括自动缩进、行尾符等)
set backspace=indent,eol,start

" 将Vim剪贴板关联到系统剪贴板（最常用配置）
set clipboard=unnamedplus

" TODO 设置返回normal模式时回到英文输入法(不需要)
"set keep-english-in-normal

" ===========================================
"            常用快捷键映射 (Mappings)
" ===========================================

" 定义 leader 键，通常设为逗号或空格，这里用空格
" 可将 <leader> 理解为自定义快捷键的前缀
let mapleader = " "
let g:mapleader = " "

" --- 快速退出插入/可视模式 ---
" 插入模式下快速按 jk 退出
inoremap jk <Esc>
" 可视模式下快速按 jk 退出
vnoremap jk <Esc>
" Ctrl + [ 也是一个标准的退出方式
inoremap <C-[> <Esc>
vnoremap <C-[> <Esc>

" 行首/行尾（H/L）
nnoremap H ^
vnoremap H ^
nnoremap L $
vnoremap L $

" 映射 yf 为：选中代码块 -> 切换到开头 -> 向上移一行 -> 复制
nnoremap yf va{oky

"切换标签页
nmap $ <action>(NextTab)
nmap ^ <action>(PreviousTab)

"--格式化（规范化）文本，即对选定的文本进行换行或重排，适应指定的文本宽度。
"全文规范化：Ctrl+Alt+l
"map Q gq
"跳转到下一个错误或警告
nmap ge <action>(GotoNextError)
let g:WhichKeyDesc_GotoNextError = "ge 跳转到下一个错误或警告"
"在源代码和测试代码之间快速切换
nmap gt <action>(GotoTest)
let g:WhichKeyDesc_GotoTest = "gt 在源代码和测试代码之间快速切换"
"将光标移动到上一个方法的声明处
" last changed in current buffer(file)
nmap gm <action>(MethodUp)
let g:WhichKeyDesc_MethodUp = "gm 将光标移动到上一个方法的声明处"
"跳转到当前源代码处
nmap gr <action>(EditSource)
let g:WhichKeyDesc_EditSource = "gr 跳转到源代码处"
"跳转到当前接口或抽象类的实现处
nmap ga <action>(GotoImplementation)
let g:WhichKeyDesc_GotoImplementation = "ga 跳转到当前接口或抽象类的实现处"
"跳转上一个位置
nmap <C-o> <action>(Back)
"跳转后一个位置
nmap <C-i> <action>(Forward)


" 重构元素名称
"nnoremap <leader>R :<C-u>action RenameElement<CR>
" 撤销”撤销“
nnoremap U <C-r>

" --- 保存/退出快捷键 ---
" <leader>w: 保存文件
let g:WhichKeyDesc_Save2 = "<leader>w 保存文件"
nmap <leader>w :w<CR>
" <leader>q: 保存并退出
let g:WhichKeyDesc_Quit = "<leader>q 保存并退出"
nmap <leader>q :wq<CR>
" <leader>Q: 不保存退出
let g:WhichKeyDesc_ForceQuit = "<leader>Q 强行退出"
nmap <leader>Q :q!<CR>

" --- 行首/行尾导航 (覆盖默认的屏幕顶部/底部跳转，以更常用) ---

" --- 选中整个文件 ---
" <leader>a: 全选文件 (ggVG)
"nmap <leader>a ggVG

" --- 代码折叠 ---
" <leader>z: 切换当前光标处的代码折叠状态
"nmap <leader>z za

" 设置代码折叠方法为基于缩进
set foldmethod=indent
" 默认打开折叠
set foldenable


" ===========================================
"            IdeaVim 插件配置 (Plugins)
" ===========================================
" IdeaVim 内置插件管理。只需列出插件 GitHub 仓库名即可。

" 高亮显示最近复制 (yank) 的文本
Plug 'machakann/vim-highlightedyank'

" 快速注释/取消注释代码 (强大的注释插件)
" 使用方法:
"   普通模式: `gc` 后跟移动命令 (如 `gcc` 注释当前行, `gcap` 注释段落)
"   可视模式: 选中代码后按 `gc` 进行注释/取消注释
Plug 'tpope/vim-commentary'

" 新增这一行来添加 vim-surround 插件
Plug 'tpope/vim-surround'

" 新增 easymotion 插件
Plug 'easymotion/vim-easymotion'

" Nerdtree目录
Plug 'preservim/nerdtree'

" ===========================================
"            集成 IDE 动作 (Action Mappings)
" ===========================================
" IdeaVim 的强大之处，将 IDE 的内置功能映射到 Vim 快捷键。

" <leader>r: 格式化代码 (IDE 的 Reformat Code 功能)
nnoremap == :<C-u>action ReformatCode<CR>
vnoremap == :<C-u>action ReformatCode<CR>
nnoremap cc :<C-u>action CommentByLineComment<CR>
vnoremap cc :<C-u>action CommentByLineComment<CR>

" <leader>d: 开始调试
"nmap <leader>R <Action>(Debug)

" 调试类
"nmap <leader>d  <Action>(DebugClass)             

" 将Python列表转换为C++大括号格式（修正版）
nnoremap <leader>cpp :s/\[/{/g<CR>:s/\]/}/g<CR>:s/\([0-9]\)\([,}\]\)/\1,\2/g<CR>:s/,\([},]\)/\1/g<CR>

" <leader>r: 运行当前类 用于运行当前main函数
"nmap <leader>r <Action>(RunClass)

" <leader>b: 切换当前行的断点
"nmap <leader>b <Action>(ToggleLineBreakpoint)

" <leader>f: 查找所有引用
"nmap <leader>f <Action>(FindUsages)

" <leader>n: 打开/关闭 Project 窗口
"nmap <leader>n <Action>(ActivateProjectToolWindow)

" <leader>t: 运行测试 (Run Test)
"nmap <leader>t <Action>(RunCurrentFileInConsole)
" 注意：具体运行测试的 Action 名称可能因 IDE 和上下文而异，可能需要调整。
" 常见还有：RunClass, RunConfiguration

" ===========================================
"            easymotion 映射
" ===========================================


" 基本映射配置
" 默认前缀键（通常是 <Leader><Leader>）
"let g:EasyMotion_leader_key = '<Leader>'

" 自定义映射示例：

" 单词内跳转 (类似 w, e, b 动作)
"nmap <Leader>w <Plug>(easymotion-w)
"nmap <Leader>e <Plug>(easymotion-e)
"nmap <Leader>b <Plug>(easymotion-b)
"
"" 行内跳转
"nmap <Leader>j <Plug>(easymotion-j)
"nmap <Leader>k <Plug>(easymotion-k)
"
"" 搜索字符跳转
"nmap <Leader>s <Plug>(easymotion-s)
"
"" 搜索两个字符跳转
"nmap <Leader><Leader>s <Plug>(easymotion-s2)
"
"" 单词首字母跳转
"nmap <Leader><Leader>f <Plug>(easymotion-f)
"
"" 跳到任意行
"nmap <Leader><Leader>l <Plug>(easymotion-bd-jk)

" ================================================================================================
" 👻👻👻 Which-Key 👻👻👻
" ================================================================================================
"which-key的官方推荐配置
set which-key
set notimeout

" ================================================================================================
" 获取默认描述
let g:WhichKey_ShowVimActions = "true"
" 设置字体
let g:WhichKey_FontFamily = "JetBrains Maple Mono"

" ================================================================================================
" 🌞🌞🌞 目录-食用手册 🌞🌞🌞
" ================================================================================================

"===================================== A =====================================
" a:
"===================================== B =====================================
" b:
"===================================== C =====================================
" c:  CodeAndClose-[目录]🎈
" cc: CodeCompletion-自动补全
" cd: CloseEditor-关闭当前标签页
" ca: CloseAllEditors-关闭所有标签页
" co: CloseAllEditorsButActive-关闭其他标签页
"===================================== D =====================================
" d: DebugOrDelete-[目录]🎈
" dp: BreakPoint-打断点/解除断点
" db: DeBug-调试
" [V]d: DeleteAndCopyClipboard-在可视模式中：删除选择的文本并复制到剪切板
"===================================== E =====================================
" e: ToggleExplorer ⭐️ 激活项目工具窗口
"===================================== F =====================================
" f: Find/Format ⭐🎈[目录]
" ff: FindFile-快速 导航/查找 项目中的其他文件(Ctrl + n)
" fl: FindFileLocation-将当前编辑的文件在项目视图中进行选中定位(Ctrl+f)
" ft: FindText-在整个项目中查找指定的文本、关键字或正则表达式，包括代码文件、配置文件和其他文件等(Ctrl + Shift + F)
" fc: Commands-打开 "Find Action"（查找动作）对话框(Ctrl + Shift + A)
" fm: Format-重新格式化代码，使其符合预定义的代码样式和规范 and 优化导入语句，删除未使用的导入，并将导入语句按字母顺序进行排列
"===================================== G =====================================
" g: GitOrGenerate 🎈[目录]
" gr: RollbackHunk-执行版本控制（VCS）的回滚操作，将修改的代码还原到之前的版本
" gc: GenerateConstructor-生成构造函数
" gg: GenerateGetter-生成getter函数
" gs: GenerateSetter-生成setter函数
" ga: GenerateGetterAndSetter-生成getter和setter函数
" ge: GenerateEquals-生成equals和hashcode的重写方法
" gd: ShowTabbedFileHistory-显示文件的版本控制历史(git)
"===================================== H =====================================
" h: MoveToLeftMoveToLeft-跳转到左边的分割窗口
"===================================== I =====================================
" i: Insert ⭐快速查找并跳转到下一个以 ( 开始的函数或方法调用的位置️
"===================================== J =====================================
" j: MoveToDown-跳转到下边的分割窗口
"===================================== K =====================================
" k: MoveToUp-跳转到上边的分割窗口
"===================================== L =====================================
" l: MoveToRight-跳转到右边的分割窗口
"===================================== M =====================================
" m: CodeGlance-打开/关闭地图(需要CodeGlance Pro插件)
"===================================== N =====================================
" n: NERDTreeOrNo ⭐️[目录]🎈
" nn: NERDTreeFocus-将使焦点转移到 NERDTree 窗口(配置在NERDTree专栏)
" nh: NoHighlight-取消搜索高亮显示
" nd: NewDir-新建文件夹
" nc: NewClass-新建类
"===================================== O =====================================
" o:
"===================================== P =====================================
" p: PasteClipboardDown-从剪切板粘贴到下面行
" P: PasteClipboardUp-从剪切板粘贴到上面行
" [V]p: PasteClipboardDown-在可视模式中：从剪切板粘贴到下面行
" [V]P: PasteClipboardUp-在可视模式中：从剪切板粘贴到上面行
"===================================== Q =====================================
" q:
"===================================== R =====================================
" r: Run/Re ⭐️[目录]🎈
" ru: Run-运行
" rc: RunClass-运行当前编辑器中的文件或类(Shift + F10)
" rr: ReRun-重新运行最近一次运行的程序或测试(Ctrl + Shift + F10)
" rt: ReRunTests-重新运行最近一次运行的测试（Unit Tests）(Ctrl + Shift + F10)
" rn: Rename-在代码中快速更改一个标识符的名称，并自动处理所有相关的引用(Shift + F6)
"===================================== S =====================================
" s: Show ⭐️[目录]🎈
" st: Stop
" ss: ShowFileStructure-显示当前打开文件的文件结构弹出窗口，其中包含文件中的类、方法、字段等结构(Alt + 7)
" sb: ShowBookmarks-显示书签（Bookmarks）工具窗口，其中包含当前文件中设置的书签列表(Ctrl + F11)
" sp: ShowParameterInfo-用于显示方法或函数的参数信息(Ctrl + p)
"===================================== T =====================================
" t: Translate-翻译(需要Translate插件)
"===================================== U =====================================
" u:
"===================================== V =====================================
" v:
"===================================== W =====================================
" w: Window ⭐️[目录]🎈
" wc: CloseSplitTab-关闭当前分割窗口(ctrl+w+c)
" wu: Unsplit-恢复当前分割窗口
" wa: UnsplitAll-恢复所有分割窗口
" wml: MoveTabRight-向右拆分标签页
" wmd: MoveTabDown-向下拆分标签页
" wmc: SplitVertically-向右复制标签页
" wmo: MoveEditorToOppositeTabGroup-在另一边打开（前提是有另一边的分割窗口）
" wl: MoveToRight-跳转到右边的窗口(<c-w>l)
" wh: MoveToLeft-跳转到左边的窗口(<c-w>h)
" wk: MoveToUp-跳转到上边的窗口(<c-w>k)
" wj: MoveToDown-跳转到下边的窗口(<c-w>j)
" wwa: HideActiveWindow-关闭提示窗口(Shift+Esc)
"===================================== X =====================================
" x:
"===================================== Y =====================================
" y: CopyClipboard-将选中行复制到剪切板
" [V]y: CopyClipboard-在可视模式中：将选中文字复制到剪切板
"===================================== Z =====================================
" z: zip(fold) ⭐️[目录]🎈
" zo: unZipAll-展开所有代码折叠区域(Ctrl + Shift + 加号键)
" zc: ZipAll-折叠所有代码折叠区域(Ctrl + Shift + 减号键)
"=============================================================================
"=============================================================================
"=============================================================================


" ================================================================================================
" 🌟🌟🌟 <leader>详细配置 🌟🌟🌟
" ================================================================================================
"========= NULL ========
"这一行为在按下<leader>后显示的,甭管就行
let g:WhichKeyDesc_LeaderKeymap= "<leader> 🌟🌟🌟紫色为二级目录🌟🌟🌟"

"========== c =========c
let g:WhichKeyDesc_CodeAndClose = "<leader>c Code&关闭"

"关闭所有标签页
let g:WhichKeyDesc_CodeAndClose_CloseAllEditors = "<leader>ca 关闭所有标签页"
nmap <leader>ca <action>(CloseAllEditors)
"关闭当前标签页
let g:WhichKeyDesc_CodeAndClose_CloseEditor = "<leader>cd 关闭当前标签页"
nmap <leader>cd :action CloseEditor<CR>
"代码自动补全
let g:WhichKeyDesc_CodeAndClose_CodeCompletion = "<leader>cc 代码自动补全"
nmap <leader>cc <action>(CodeCompletion)
"关闭其他标签页
let g:WhichKeyDesc_CodeAndClose_CloseAllEditorsButActive = "<leader>co 关闭其他标签页"
nmap <leader>co :action CloseAllEditorsButActive<CR>

"========== d ==========
let g:WhichKeyDesc_DeBugOrDelete= "<leader>d 调试&删除"
"打断点/解除断点
let g:WhichKeyDesc_DebugOrDelete_BreakPoint = "<leader>dp 打断点/解除断点 "
nmap <leader>dp <Action>(ToggleLineBreakpoint)
"调试
let g:WhichKeyDesc_DebugOrDelete_DeBug = "<leader>db 调试"
nmap <leader>db <Action>(Debug)
"在可视模式中：删除选择的文本并复制到剪切板
let g:WhichKeyDesc_DebugOrDelete_DeleteAndCopyToClipboard = "<leader>dd 删除并复制到剪切板"
vmap <leader>dd "+d

"========== e ==========
"激活项目工具窗口(Alt + 1)
let g:WhichKeyDesc_ToggleExplorerOrExtract = "<leader>e 打开文件列表"
nmap <leader>e <action>(ActivateProjectToolWindow)

"========== f ==========
let g:WhichKeyDesc_FindOrFormat = "<leader>f 查找&格式化"

"快速 导航/查找 项目中的其他文件(Ctrl + n)
let g:WhichKeyDesc_FindOrFormat_FindFile = "<leader>ff 查找文件"
nmap <leader>ff <action>(GotoFile)
"将当前编辑的文件在项目视图中进行选中定位(Alt + F1)
let g:WhichKeyDesc_FindOrFormat_FindFileLocation = "<leader>fl 定位文件位置"
nmap <leader>fl <action>(SelectInProjectView)
"在整个项目中查找指定的文本、关键字或正则表达式，包括代码文件、配置文件和其他文件等(Ctrl + Shift + F)
let g:WhichKeyDesc_FindOrFormat_FindText = "<leader>ft 查找字符"
nmap <leader>ft <action>(FindInPath)
"打开 "Find Action"（查找动作）对话框(Ctrl + Shift + A)
let g:WhichKeyDesc_FindOrFormat_Commands = "<leader>fc 打开查找菜单"
nmap <leader>fc <action>(GotoAction)
"重新格式化代码，使其符合预定义的代码样式和规范 \| 优化导入语句，删除未使用的导入，并将导入语句按字母顺序进行排列
let g:WhichKeyDesc_FindOrFormat_Format = "<leader>fm 格式化代码"
nmap <leader>fm <action>(ReformatCode) \| <action>(OptimizeImports)

"========== g ==========
let g:WhichKeyDesc_GitOrGenerate = "<leader>g Git&构造"

"执行版本控制（VCS）的回滚操作，将修改的代码还原到之前的版本
let g:WhichKeyDesc_GitOrGenerate_RollbackHunk = "<leader>gr git回滚"
nmap <leader>gr :action Vcs.RollbackChangedLines<CR>
"生成构造器
let g:WhichKeyDesc_GitOrGenerate_GenerateConstructor = "<leader>gc 生成构造器"
nmap <leader>gc :action GenerateConstructor<CR>
"生成getter
let g:WhichKeyDesc_GitOrGenerate_GenerateGetter = "<leader>gg 生成getter"
nmap <leader>gg :action GenerateGetter<CR>
"生成setter
let g:WhichKeyDesc_GitOrGenerate_GenerateSetter = "<leader>gs 生成setter"
nmap <leader>gs :action GenerateSetter<CR>
"生成setter和getter
let g:WhichKeyDesc_GitOrGenerate_GenerateGetterAndSetter = "<leader>ga 生成setter和getter"
nmap <leader>ga <action>(GenerateGetterAndSetter)
"生成 equals() 和 hashcode() 的重写方法
let g:WhichKeyDesc_GitOrGenerate_GenerateEquals = "<leader>ge 生成equals和hashcode的重写"
nmap <leader>ge <action>(GenerateEquals)
"生成toString
let g:WhichKeyDesc_GitOrGenerate_GenerateToString = "<leader>gt 生成toString"
nmap <leader>gt <action>(Actions.ActionsPlugin.GenerateToString)
"跳转到定义
nmap <leader>gd <action>(GotoDeclaration)
let g:WhichKeyDesc_GitOrGenerate_GotoDeclaration = "<leader>gd 跳转到定义"

" 先取消原生 gi 的映射（普通模式）
" <Nop> 表示空操作，禁用原生 gi
nnoremap gi <Nop>  
"跳转到实现
nmap <leader>gi <action>(GotoImplementation)
let g:WhichKeyDesc_GitOrGenerate_GotoImplementation = "<leader>gi 跳转到实现"
"切换头/源文件
nmap <leader>gh <action>(CIDR.Lang.SwitchHeaderSourceGroup)
let g:WhichKeyDesc_GitOrGenerate_SwitchHeaderSourceGroup = "<leader>gh 切换头/源文件"

""diff 显示文件的版本控制历史(git)
"nmap <leader>gd <action>(Vcs.ShowTabbedFileHistory)
"let g:WhichKeyDesc_DebugOrDelete_ShowTabbedFileHistory = "<leader>gd 显示文件的版本控制历史"

"========== h ==========
"跳转到左边的分割窗口
let g:WhichKeyDesc_Show_MoveToLeft = "<leader>h 向左跳转"
nmap <leader>h <c-w>h


"========== i ==========
"快速查找并跳转到下一个以 ( 开始的函数或方法调用的位置️
let g:WhichKeyDesc_InsertAfterBrackets = "<leader>i 跳转到选一个("
nmap <leader>i f(a


"========== j ==========
"跳转到下边的分割窗口
let g:WhichKeyDesc_Show_MoveToDown = "<leader>j 向下跳转"
nmap <leader>j <c-w>j


"========== k ==========
"跳转到上边的分割窗口
let g:WhichKeyDesc_Show_MoveToUp = "<leader>k 向上跳转"
nmap <leader>k <c-w>k


"========== l ==========
"跳转到右边的窗口
let g:WhichKeyDesc_Show_MoveToRight = "<leader>l 向右跳转"
nmap <leader>l <c-w>l

"========== m ==========
"打开/关闭 代码小地图 
"let g:WhichKeyDesc_CodeGlance = "<leader>m 开关小地图 默认ctrl+shift+G"
"nmap <leader>m <action>(CodeGlance.toggle)
"好像更新版本后,突然用不了了,用默认的ctrl+shift+G吧

"========== n ==========
let g:WhichKeyDesc_NERDTreeOrNew = "<leader>n 目录树&新建"

"取消搜索高亮显示(No Highlight)
let g:WhichKeyDesc_NERDTreeOrNew_Highlight = "<leader>nh 取消搜索高亮"
nmap <leader>nl :nohlsearch<CR>
"在当前目录新建文件夹
let g:WhichKeyDesc_NERDTreeOrNew_NewDir = "<leader>nd 新建文件夹"
nmap <leader>nd <action>(NewDir)
"在当前目录新建类
let g:WhichKeyDesc_NERDTreeOrNew_NewClass = "<leader>nc 新建.Class"
nmap <leader>nc <action>(NewClass)


"========== r ==========
let g:WhichKeyDesc_RunOrRe = "<leader>r 运行&重新"

"运行当前编辑器中的文件或类(Shift + F10)
let g:WhichKeyDesc_RunOrRe_RunCalss = "<leader>rc 运行当前文件"
nmap <leader>rc :action RunClass<CR>
"重新运行最近一次运行的程序或测试(Ctrl+Shift + F10)
let g:WhichKeyDesc_RunOrRe_ReRun = "<leader>rr 重新运行"
nmap <leader>rr <action>(Rerun)
"重新运行最近一次运行的测试（Unit Tests）(Ctrl + Shift + F10)
let g:WhichKeyDesc_RunOrRe_ReRunTests = "<leader>rt 重新运行Test"
nmap <leader>rt <action>(RerunTests)
"在代码中快速更改一个标识符的名称，并自动处理所有相关的引用(Shift + F6)
let g:WhichKeyDesc_RunOrRe_Rename = "<leader>rn 重构"
map <leader>rn <action>(RenameElement)
"运行
let g:WhichKeyDesc_RunOrRe_Run = "<leader>ru 运行"
map <leader>ru <action>(Run)

"========== s ==========
let g:WhichKeyDesc_Show = "<leader>s 显示&停止"

"显示当前打开文件的文件结构弹出窗口，其中包含文件中的类、方法、字段等结构(Alt + 7)
let g:WhichKeyDesc_Show_FileStructure = "<leader>ss 显示文件结构"
nmap <leader>ss <action>(FileStructurePopup)
"显示书签（Bookmarks）工具窗口，其中包含当前文件中设置的书签列表(Ctrl + F11)
let g:WhichKeyDesc_Show_Bookmarks = "<leader>sb 显示书签工具窗口"
nmap <leader>sb <action>(ShowBookmarks)
"用于显示方法或函数的参数信息(Ctrl + p)
let g:WhichKeyDesc_Show_ParameterInfo = "<leader>sp 显示方法或函数的参数信息"
nmap <leader>sp <action>(ParameterInfo)
"Stop
let g:WhichKeyDesc_Show_Stop = "<leader>st 停止运行"
nmap <leader>st <action>(Stop)

"========== m ==========
let g:WhichKeyDesc_Windows = "<leader>m 窗口(开关小地图 默认ctrl+shift+G)"
"let g:WhichKeyDesc_Windows_Hide = "<leader>ww 关闭提示窗口->a"
let g:WhichKeyDesc_Windows_Move = "<leader>mm 移动窗口"

"向右拆分标签页
let g:WhichKeyDesc_Windows_Move_MoveTabRight = "<leader>mml 向右拆分标签页"
nmap <leader>mml <action>(MoveTabRight)
"向下拆分标签页
let g:WhichKeyDesc_Windows_Move_MoveTabDown = "<leader>mmd 向下拆分标签页"
nmap <leader>mmd <action>(MoveTabDown)
"在另一边打开（前提是有另一边的分割窗口）
let g:WhichKeyDesc_Windows_Move_MoveEditorToOppositeTabGroup = "<leader>mmo 在另一边打开"
nmap <leader>mmo <action>(MoveEditorToOppositeTabGroup)
"向右复制标签页
let g:WhichKeyDesc_Windows_Move_SplitVertically = "<leader>mmc 向右复制标签页"
nmap <leader>mmc <action>(SplitVertically)

"取消所有分割窗口
let g:WhichKeyDesc_Windows_UnsplitAll = "<leader>ma 取消所有分割窗口"
nmap <leader>ma <action>(UnsplitAll)
"关闭当前窗口或分割窗格
let g:WhichKeyDesc_Windows_closeActiveWindow = "<leader>mc 关闭当前分割窗口"
nmap <leader>mc <c-w>c
"取消拆分当前分割窗口
let g:WhichKeyDesc_Windows_Unsplit = "<leader>mu 取消拆分当前分割窗口"
nmap <leader>mu <action>(Unsplit)

"关闭提示窗口
"let g:WhichKeyDesc_Windows_Hide_HideActiveWindow = "<leader>wwa 关闭提示窗口"
"nmap <leader>wwa <action>(HideActiveWindow)

"保存文件
"let g:WhichKeyDesc_Save = "<leader>ww 保存文件"
"nmap <leader>ww :w<CR>

"========== z ==========
let g:WhichKeyDesc_Zip = "<leader>z 折叠"

"展开所有代码折叠区域(Ctrl + Shift + 加号键)
let g:WhichKeyDesc_Zip_unZipAll = "<leader>zr 展开所有折叠"
nmap <leader>zr <action>(ExpandAllRegions)
"折叠所有代码折叠区域(Ctrl + Shift + 减号键)
let g:WhichKeyDesc_Zip_ZipAll = "<leader>zm 折叠所有代码"
nmap <leader>zm <action>(CollapseAllRegions)

let g:WhichKeyDesc_Zip_ZipAll = "<leader>za 折叠/展开代码"
nmap<leader>za <action>(ExpandCollapseToggleAction)

" ================================================================================================
" 🌸🌸🌸 NERDTree 🌸🌸🌸
" ================================================================================================
"<C-w-w>：在多个打开的编辑器窗口之间切换
"在目录中，按下 go 打开文件并保持光标在目录
"在目录中，按下 gi 以上下并排窗口形式打开文件(并关闭目录)
"在目录树中，使用空格预览文件
"光标在目录时，按Esc回到编辑器
"编辑器和目录间切换存在许多功能类似的快捷键，相似但不完全相同
"仅 打开/关闭 目录推荐使用<leader>wo 其次 Alt + 1

"按下 <leader>nn 将使焦点转移到 NERDTree 窗口
nnoremap <leader>nn :NERDTreeFocus<CR>
let g:WhichKeyDesc_NERDTreeOrNo_NERDTreeFocus = "<leader>nn 转移到目录树"

"按下 <C-n> 将打开 NERDTree 文件资源管理器(==<leader>nn)
nnoremap <C-n> :NERDTree<CR>

"按下 <C-t> 将切换 NERDTree 文件资源管理器的显示状态，即打开或关闭 NERDTree(不建议)
"nnoremap <C-t> :NERDTreeToggle<CR>
nnoremap <leader>no :NERDTreeToggle<CR>
let g:WhichKeyDesc_NERDTreeToggle = "<leader>no 打开/关闭目录树"

"按下 <C-f> 将在 NERDTree 文件资源管理器中定位当前编辑文件所在的节点，并使其可见(<leader>fl)
"nnoremap <C-f> :NERDTreeFind<CR>
nnoremap <leader>nf :NERDTreeFind<CR>
let g:WhichKeyDesc_NERDTreeFind = "<leader>nf 定位当前文件所在的节点"


" ================================================================================================
" 🌸🌸🌸 Easymotion 🌸🌸🌸
" ================================================================================================

let g:WhichKeyDesc_easymotionkey = "<leader><leader> 快速跳转插件"

"普通模式输入s后输入要跳转到单词首字母(或多输入几个字母)
nmap s <Plug>(easymotion-bd-n)
let g:WhichKeyDesc_easymotion = "s 快速跳转"
```