---
<%* 
// 1. 所有需要的变量统一在顶部声明（避免重复声明）
// 0. 读剪贴板，拆出「语言 + URL」
// 剪贴板格式： "<语言> <URL>"  或  直接 "<URL>"（默认 cpp）
// 例：py https://leetcode.cn/problems/two-sum/  →  生成 two-sum.py
const LANG_MAP = {
  cpp:        { slug: 'cpp',        ext: 'cpp',   prelude: '#include <bits/stdc++.h>\nusing namespace std;\n\n' },
  'c++':      { slug: 'cpp',        ext: 'cpp',   prelude: '#include <bits/stdc++.h>\nusing namespace std;\n\n' },
  c:          { slug: 'c',          ext: 'c',     prelude: '' },
  python:     { slug: 'python3',    ext: 'py',    prelude: '' },
  python3:    { slug: 'python3',    ext: 'py',    prelude: '' },
  py:         { slug: 'python3',    ext: 'py',    prelude: '' },
  py3:        { slug: 'python3',    ext: 'py',    prelude: '' },
  java:       { slug: 'java',       ext: 'java',  prelude: '' },
  js:         { slug: 'javascript', ext: 'js',    prelude: '' },
  javascript: { slug: 'javascript', ext: 'js',    prelude: '' },
  ts:         { slug: 'typescript', ext: 'ts',    prelude: '' },
  typescript: { slug: 'typescript', ext: 'ts',    prelude: '' },
  go:         { slug: 'golang',     ext: 'go',    prelude: '' },
  golang:     { slug: 'golang',     ext: 'go',    prelude: '' },
  rust:       { slug: 'rust',       ext: 'rs',    prelude: '' },
  cs:         { slug: 'csharp',     ext: 'cs',    prelude: '' },
  csharp:     { slug: 'csharp',     ext: 'cs',    prelude: '' },
  'c#':       { slug: 'csharp',     ext: 'cs',    prelude: '' },
  kt:         { slug: 'kotlin',     ext: 'kt',    prelude: '' },
  kotlin:     { slug: 'kotlin',     ext: 'kt',    prelude: '' },
  swift:      { slug: 'swift',      ext: 'swift', prelude: '' },
  rb:         { slug: 'ruby',       ext: 'rb',    prelude: '' },
  ruby:       { slug: 'ruby',       ext: 'rb',    prelude: '' },
  php:        { slug: 'php',        ext: 'php',   prelude: '' },
  dart:       { slug: 'dart',       ext: 'dart',  prelude: '' },
  scala:      { slug: 'scala',      ext: 'scala', prelude: '' },
  elixir:     { slug: 'elixir',     ext: 'ex',    prelude: '' },
  erlang:     { slug: 'erlang',     ext: 'erl',   prelude: '' },
  racket:     { slug: 'racket',     ext: 'rkt',   prelude: '' },
  cangjie:    { slug: 'cangjie',    ext: 'cj',    prelude: '' },
};

let rawClip = ((await tp.system.clipboard()) || '').trim();
let url = rawClip;
let langKey = 'cpp';

const langMatch = rawClip.match(/^([A-Za-z+#]+)\s+(https?:\/\/\S+)$/);
if (langMatch) {
  url = langMatch[2];
  const key = langMatch[1].toLowerCase();
  if (LANG_MAP[key]) {
    langKey = key;
  } else {
    new tp.obsidian.Notice(`未识别语言前缀 "${langMatch[1]}"，已回退到 cpp`);
  }
}
const LANG = LANG_MAP[langKey];
let question = await tp.user.getLeetcodeProblem(tp, url, {
  download_imgs: true,
  img_folder: "assets/leetcode_imgs"
});
// let question = await tp.user.getLeetcodeProblem(tp, url, { download_imgs: false });

// console.log(question);
// console.log(question.codeSnippets);

// 1. 按语言筛选代码片段（LANG 在顶部解析）
const snippet = question.codeSnippets.find(s => s.langSlug === LANG.slug);

// 2. 安全提取 code（避免找不到时报错）；预置头由 LANG.prelude 提供
const code = snippet ? snippet.code : '';
if (!snippet) {
  new tp.obsidian.Notice(`该题没有 ${LANG.slug} 的代码模板，源文件只写预置头。`);
}
const all = LANG.prelude;

// 3. 打印结果
// console.log(code);

// TODO 
// console.log(question.similarQuestions);

// 不要". ", "."就行
await tp.file.rename(question.questionId + "." + question.title);

// 提前声明存储标签和提示的变量
let topicTagsText = ""; // 存储分类标签
let hintsText = "";    // 存储提示信息
_%>
Date: <% tp.file.creation_date("YYYY-MM-DD") %>
Link: <% `https://leetcode.com/problems/${question.titleSlug}/` %>
Category: 
<%*
question.topicTags.forEach(item => {
  topicTagsText += `- ${item.name}\n`;
});
tR += topicTagsText; // 输出到模板
_%>
Difficulty: <% question.difficulty %>
SimilarQuestions:  
<%*
let similarQuestionsText = ""; // 存储相似题标题文本
try {
  // 1. 解析 JSON 字符串为数组
  const similarQuestionsArr = typeof question.similarQuestions === 'string' 
    ? JSON.parse(question.similarQuestions) 
    : question.similarQuestions;
  
  // 2. 确认是数组后，遍历拼接格式
  if (Array.isArray(similarQuestionsArr)) {
    similarQuestionsArr.forEach(item => {
      // 拼接 "- 中文标题\n"，每个标题一行
      similarQuestionsText += `- ${item.translatedTitle}\n`;
    });
  }
} catch (error) {
  similarQuestionsText = "- 暂无相似题目\n"; // 解析失败时的默认文本
}

// 3. 输出到模板（tR 是 Templater 的输出变量）
tR += similarQuestionsText;
_%>
Completed: false
---

<%*
let categoryTags = ""; // 用于存储 #标签 集合
question.topicTags.forEach(item => {
  categoryTags += `#${item.name} `; // 每个标签前面加 #
});
tR += categoryTags; // 输出到模板
tR += '\n'
_%>

<%*
// 核心配置与工具函数（统一管理）
const targetFile = tp.config.target_file;
const fs = require('fs');
const path = require('path');

// 2. 拼接源文件路径（和笔记同名同目录，扩展名随语言）
const srcFilePath = path.join(
  targetFile.vault.adapter.basePath,
  targetFile.parent.path,
  `${targetFile.basename}.${LANG.ext}`
);

// 3. 自动创建源文件（不存在时） 写入 codeSnippet
if (!fs.existsSync(srcFilePath)) {
  try {
    fs.writeFileSync(srcFilePath, all + code + "\n", 'utf-8'); 
    console.log(`已创建源文件：${srcFilePath}`);
  } catch (error) {
    console.error(`创建文件失败：${error.message}`);
  }
}

// 4. 生成 Neovim 打开命令（Windows 适配）
let openNvimCommand;
if (process.platform === "win32") {
  openNvimCommand = `${srcFilePath}`;
} else {
  openNvimCommand = `nvim "${srcFilePath}"`;
}
const nvimLink = `file:///${encodeURIComponent(openNvimCommand)}`;

// 5. 新增：生成 VS Code 打开命令（跨平台适配）
let openVscodeCommand;
if (process.platform === "win32") {
  // Windows 下直接用 code 命令（需确保 VS Code 已加入环境变量）
  openVscodeCommand = `code "${srcFilePath}"`;
} else if (process.platform === "darwin") {
  // MacOS 下的 VS Code 命令
  openVscodeCommand = `code "${srcFilePath}"`;
} else {
  // Linux 下的 VS Code 命令
  openVscodeCommand = `code "${srcFilePath}"`;
}
const vscodeLink = `file:///${encodeURIComponent(openVscodeCommand)}`;

_%>


```button
name <font color="#548dd4">nvim打开</font>
type link
action <% nvimLink %>
```
```button
name <font color="#4e937a">VSCode打开</font>
type link
action <% vscodeLink %>
```

`button-anki-open`   `button-anki-update`

DECK: 面试题-hot100

## 0.1 <% `${targetFile.basename}` %>

<% question.content %>

<%*
// 3. 给另一个已声明的变量赋值（同样不用 let）
question.hints.forEach(item => {
  hintsText += `> [!note]- Hint\n> ${item}\n\n`;
});
// 输出提示内容
hintsText
_%>

## 0.2 Notes


## 0.3 Solution 
**记得复制题目**

![[<% `${targetFile.basename}.${LANG.ext}` %>]]

END
