

## 🎩 VSCodeVim tricks!  🎩 VSCodeVim 的技巧！

[](https://github.com/VSCodeVim/Vim#-vscodevim-tricks)

VS Code has a lot of nifty tricks and we try to preserve some of them:  
VS Code 有很多巧妙的技巧，我们尽力保留其中一些：

- `gd` - jump to definition.  
    `GD`——跳转到定义。
- `gq` - on a visual selection reflow and wordwrap blocks of text, preserving commenting style. Great for formatting documentation comments.  
    `GQ` - 用于可视化选择的重排和换行文本块，保持评论风格。非常适合格式化文档注释。
- `gb` - adds another cursor on the next word it finds which is the same as the word under the cursor.  
    `GB`——在找到的下一个词上添加一个光标，这个光标和光标下方的词相同。
- `af` - visual mode command which selects increasingly large blocks of text. For example, if you had "blah (foo [bar 'ba|z'])" then it would select 'baz' first. If you pressed `af` again, it'd then select [bar 'baz'], and if you did it a third time it would select "(foo [bar 'baz'])".  
    `AF` - 视觉模式命令，可选择越来越大的文本块。例如，如果你有“blah （foo [bar 'ba|z']）”，它会先选择'baz'。如果你再次按 `AF`，它会选择[bar 'baz']]，如果第三次按，则会选择“（foo [bar 'baz']）”。
- `gh` - equivalent to hovering your mouse over wherever the cursor is. Handy for seeing types and error messages without reaching for the mouse!  
    `GH`——相当于将鼠标悬停在鼠标所在的位置上。方便查看类型和错误信息，不用伸手去拿鼠标！