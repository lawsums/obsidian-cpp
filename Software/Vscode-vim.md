## 重要设置
1. **vim.useCtrlKeys** 
   是否使用系统CtrlKeys, 暂时抛弃vim Ctrl系列, 建议一开始设置为false, 配置好==vim.handleKeys==之后设置为true, 因为如果用vim不用`Ctrl-Q` `Ctrl-O` `Ctrl-I`, 缺少了跳转功能那感觉就白用了
2. **vim.handleKeys** 
   配置哪些按键使用系统配置, 建议
   ![[Pasted image 20260211153424.png]]
3. **vim.useSystemClipboard** 设置系统剪切板
4. **vim.highlightedyank.enable** 设置复制时==高亮==

## Mapping 映射
```json
"vim.insertModeKeyBindings": [
    {
        "before": [
            "j",
            "k"
        ],
        "after": [
            "<Esc>"
        ]
    }
],
"vim.normalModeKeyBindingsNonRecursive": [
	// 快速跳转首尾
    {
        "before": [
            "H"
        ],
        "after": [
            "^"
        ]
    },
    {
        "before": [
            "L"
        ],
        "after": [
            "$"
        ]
    },
    {
        "before": [
            "<leader>",
            "d"
        ],
        "after": [
            "d",
            "d"
        ]
    },
    {
        "before": [
            "<C-n>"
        ],
        "commands": [
            ":nohl"
        ]
    },
    // 保存
    {
        "before": [
            "<leader>",
            "w"
        ],
        "commands": [
            ":w"
        ] 
    },
    {
        "before": [
            "K"
        ],
        "commands": [
            "lineBreakInsert"
        ],
        "silent": true
    },
	// 快速运行文件
    {
        "before": [
            "<leader>",
            "r"
        ],
        "commands": [
            "code-runner.run"
        ],
        "silent": true
    },
    // 快速切换标签页
    {
        "before": [
            "$"
        ],
        "commands": [
            "workbench.action.nextEditorInGroup"
        ],
        "silent": true
    },
    {
        "before": [
            "^"
        ],
        "commands": [
            "workbench.action.previousEditorInGroup"
        ],
        "silent": true
    }
],
```


## 自带插件
- **`.vimrc support`**：这是一个分类或文件夹，代表下面的插件都是在 `.vimrc` 中配置和加载的。
- **`vim-airline`**：一个轻量的状态栏美化插件，用来替换 Vim 默认的状态栏，显示更丰富的信息（如文件类型、光标位置、Git 分支等）。
- **`vim-easymotion`**：让光标快速跳转到屏幕上任意位置的插件，通过输入提示字符实现“指哪打哪”，大幅提升移动效率。
- **`vim-surround`**：用于快速操作括号、引号等成对符号的插件，比如快速添加、修改或删除文本周围的括号/引号。
- **`vim-commentary`**：一键注释/取消注释代码的插件，支持多种语言，操作非常简洁。
- **`Input Method`**：通常是用于在 Vim 中更好地切换和管理输入法（尤其是中文输入法）的配置或插件，避免在插入模式和普通模式切换时出现输入法状态混乱。
- **`ReplaceWithRegister`**：可以用寄存器中的内容快速替换选中文本的插件，简化文本替换操作。
- **`vim-textobj-entire`**：提供“整个文件”作为文本对象，方便一次性选中或操作整个文件内容。
- **`vim-textobj-arguments`**：提供函数参数作为文本对象，方便快速选中、修改函数的参数列表。

如果你需要的话，我可以帮你整理一份**这些插件的常用快捷键速查表**，方便你快速上手。需要我整理吗？

## 技巧
VS Code has a lot of nifty tricks and we try to preserve some of them:  
VS Code 有很多巧妙的技巧，我们尽力保留其中一些：
- 
    `GD`——跳转到定义。
    `GQ` - 在视觉选择重排和换行文本块上，保持评论风格。非常适合格式化文档注释。
    `GB`——在找到的下一个词上添加一个光标，这个光标和光标下方的词相同。
    `AF` - 视觉模式命令，可选择越来越大的文本块。例如，如果你有“blah （foo [bar'ba|z]）”，那么它会先选择“baz”。如果你再按一次，它会选择[小节“baz”]，如果再按第三次，则会选择“（foo [bar'baz']）”。
    `GH`——相当于将鼠标悬停在光标所在的位置。不用拿鼠标就能看到类型和错误信息，非常方便！

---

![[VSCodeVimVim star Vim for Visual Studio Code 1]]