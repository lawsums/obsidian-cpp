unmap <Space> " 可选：专门解绑普通模式，避免影响其他模式（更严谨）

" Alt-p 快速生成超链接（可视/普通模式）
map <A-p> :pasteinto<CR>  

" --- 快速退出插入/可视模式 ---
imap jk <Esc>
vmap jk <Esc>

" 重做 (撤销"撤销")
nnoremap U <C-r>

" 修正版本3：两步替换，最可靠
" nnoremap gf :s/\\\(/$/g<CR>:s/\\\)/$/g<CR>
" vnoremap gf :s/\\\(/$/g<CR>:s/\\\)/$/g<CR>
" nnoremap gF :%s/\\\(/$/g<CR>:%s/\\\)/$/g<CR>
"
"

" 映射说明：
" gf = 处理圆括号 -> $...$
" gd = 处理中括号 -> $$...$$

" 原有映射保持不变
nnoremap gf :s/\\\(/$/g<CR>:s/\\\)/$/g<CR>
vnoremap gf :s/\\\(/$/g<CR>:s/\\\)/$/g<CR>
nnoremap gF :%s/\\\(/$/g<CR>:%s/\\\)/$/g<CR>

" 新增专门处理中括号的映射
" 分步处理中括号
nnoremap gb :s/\\\[/$$/ <Bar> s/\\\]/$$/<CR>
vnoremap gb :s/\\\[/$$/ <Bar> s/\\\]/$$/<CR>
nnoremap gB :%s/\\\[/$$/ <Bar> %s/\\\]/$$/<CR>


" --- 行首/行尾导航 ---
" 更快的移动光标
" 现在space不起作用了
nnoremap gJ J 
nnoremap J 6gj
nnoremap K 6gk

" Home 键到行首第一个非空白字符
nnoremap H ^
vnoremap H ^
" End 键到行尾
nnoremap L $
vnoremap L $

" 使用系统剪贴板
set clipboard=unnamed

" Ctrl+A - 全选
" nnoremap <C-a> ggVG
" inoremap <C-a> <C-o>gg<C-o>VG
" vnoremap <C-a> <Esc>ggVG

" Ctrl+X - 剪切选中内容
vnoremap <C-x> +d  
" 兼容大小写
vnoremap <C-X> +d

" Ctrl+V 粘贴
nnoremap <C-v> "+P
vnoremap <C-v> <Esc>"+P

" 保存
nnoremap W :w<CR>
nnoremap <Space>w :w<CR>

" 打开文本编辑菜单 = 鼠标右键
exmap contextMenu obcommand editor:context-menu
nmap zl :contextMenu<CR>

" 移动到下一段落
nmap [ {
nmap ] }

" 实现括号的surrend功能 
exmap surround_wiki surround [[ ]]
exmap surround_double_quotes surround " "
exmap surround_single_quotes surround ' '
exmap surround_backticks surround ` `
exmap surround_brackets surround ( )
exmap surround_square_brackets surround [ ]
exmap surround_curly_brackets surround { }
exmap surround_italic surround * *
exmap surround_bold surround ** **
exmap surround_delete surround ~~ ~~
exmap surround_mark surround == ==
exmap surround_math surround $ $

" 快速添加下划线
exmap surround_underline surround <u> </u>

" 必须使用 'map'
map [[ :surround_wiki<CR>
nunmap s
vunmap s
map s" :surround_double_quotes<CR>
map s' :surround_single_quotes<CR>
map s` :surround_backticks<CR>
map sb :surround_brackets<CR>
map s( :surround_brackets<CR>
map s) :surround_brackets<CR>
map s[ :surround_square_brackets<CR>
map s] :surround_square_brackets<CR>
map s{ :surround_curly_brackets<CR>
map s} :surround_curly_brackets<CR>
map si :surround_italic<CR>
map sb :surround_bold<CR>
map sd :surround_delete<CR>
map sm :surround_mark<CR>
map s$ :surround_math<CR>
map su :surround_underline<CR>


" 使用^和$实现tab的切换 
exmap tabnext obcommand workspace:next-tab
nnoremap $ :tabnext<CR>
exmap tabprev obcommand workspace:previous-tab
nnoremap ^ :tabprev<CR>

" 实现工作区的横向分割
exmap vsp obcommand workspace:split-vertical
" 实现工作区的纵向分割
exmap ssp obcommand workspace:split-horizontal

" 聚焦
exmap focusLeft obcommand editor:focus-left
exmap focusRight obcommand editor:focus-right
exmap focusBottom obcommand editor:focus-bottom
exmap focusTop obcommand editor:focus-top
nmap <Space>h :focusLeft<CR>
nmap <Space>l :focusRight<CR>
nmap <Space>j :focusBottom<CR>
nmap <Space>k :focusTop<CR>
nmap <Space>sv :vsp<CR>
nmap <Space>sh :ssp<CR>

" 关闭工作区
exmap q obcommand workspace:close

" 模拟折叠标题的功能
exmap unfoldall obcommand editor:unfold-all
exmap togglefold obcommand editor:toggle-fold
exmap foldall obcommand editor:fold-all
nmap zo :togglefold<CR>
nmap za :foldall<CR>
nmap zr :unfoldall<CR>

" --- 表格编辑快捷键 ---
exmap insertColumn obcommand table-editor-obsidian:insert-column
exmap insertRow obcommand table-editor-obsidian:insert-row

" 推荐方案：使用逗号作为表格前缀（,c = column，,r = row）
nmap ,c :insertColumn<CR>
nmap ,r :insertRow<CR>

" " --- 出向链接快捷键 ---
" exmap outgoingLinks obcommand outgoing-links:open
" " 保持 glo 没问题（g 开头通常是安全的）
" nmap gd :outgoingLinks<CR>

" 1. 在当前面板打开链接（默认行为）
exmap followLink obcommand editor:follow-link
" gf = go file（Vim 传统快捷键）
nmap gd :followLink<CR>

" 2. 在新标签页打开链接
exmap newTabLink obcommand editor:open-link-in-new-leaf
" gF = go File（大写，表示新标签页）
nmap gD :newTabLink<CR>

" --- 主题切换快捷键 ---
exmap toggleTheme obcommand theme:switch
exmap toggleThemeLightDark obcommand theme:toggle-light-dark
"exmap darkTheme obcommand theme:use-dark
"exmap lightTheme obcommand theme:use-light

" 推荐方案：使用逗号前缀，或者 g 前缀
" 方案 A：使用逗号前缀
"nmap ,ts :toggleTheme<CR>
"nmap ,td :darkTheme<CR>
"nmap ,tl :lightTheme<CR>

" 方案 B：使用 g 前缀
nmap <Space>th :toggleTheme<CR>
nmap <Space>tt :toggleThemeLightDark<CR>
"nmap gtd :darkTheme<CR>
"nmap gtl :lightTheme<CR>

" --- 窗口缩放快捷键 ---
exmap zoomIn obcommand window:zoom-in
exmap zoomOut obcommand window:zoom-out
exmap zoomReset obcommand window:reset-zoom

" z 开头的缩放命令是安全的（Vim 的 z 命令主要用于滚动）
nmap <Space>+ :zoomIn<CR>
nmap <Space>- :zoomOut<CR>
nmap <Space>= :zoomReset<CR>

" 添加日记快捷键
exmap diary obcommand daily-notes
exmap diary_prev obcommand daily-notes:goto-prev
exmap diary_next obcommand daily-notes:goto-next

nmap <Space>cd :diary<CR>
nmap <Space>cb :diary_prev<CR>
nmap <Space>cn :diary_next<CR>

" 一个没用的注释
