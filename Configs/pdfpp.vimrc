
" " （可选）方式B：保留 :vsp/:ssp Ex 命令 + 快捷键
" :map :vsp :obcommand workspace:split-vertical<CR>  " Ex 模式 :vsp = 纵向分割
" :map :ssp :obcommand workspace:split-horizontal<CR>  " Ex 模式 :ssp = 横向分割
" :noremap normal <C-v> :vsp<CR>  " 快捷键触发 :vsp
" :noremap normal <C-s> :ssp<CR>  " 快捷键触发 :ssp


" " 3. 聚焦不同方向工作区：无 exmap 版
" " 方式A：快捷键直接绑定（推荐）
" :noremap normal <C-h> :obcommand editor:focus-left<CR>    " <C-h> 聚焦左
" :noremap normal <C-l> :obcommand editor:focus-right<CR>   " <C-l> 聚焦右
" :noremap normal <C-j> :obcommand editor:focus-bottom<CR>  " <C-j> 聚焦下
" :noremap normal <C-k> :obcommand editor:focus-top<CR>     " <C-k> 聚焦上


" 工作区分割（纵向/横向）
" - 按 Ctrl+v 纵向分割工作区
nmap <C-v> :obcommand workspace:split-vertical<CR>
" - 按 Ctrl+s 横向分割工作区
nmap <C-s> :obcommand workspace:split-horizontal<CR>

" 聚焦不同方向的工作区
" - 按 Ctrl+h 聚焦左侧工作区
nmap <C-h> :obcommand editor:focus-left<CR>
" - 按 Ctrl+l 聚焦右侧工作区
nmap <C-l> :obcommand editor:focus-right<CR>
" - 按 Ctrl+j 聚焦下方工作区
nmap <C-j> :obcommand editor:focus-bottom<CR>
" - 按 Ctrl+k 聚焦上方工作区
nmap <C-k> :obcommand editor:focus-top<CR>

" 关闭当前工作区
" - 按 Ctrl+q 关闭当前工作区
nmap <C-q> :obcommand workspace:close<CR>

" （可选）保留 Ex 模式命令（输入 :q 关闭工作区）
map q :obcommand workspace:close<CR>"
