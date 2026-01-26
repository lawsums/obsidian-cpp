

```button
name {<font color="#4bacc6">面试题</font>}
type link
action https://codetop.cc/home
```
^button-interview

```button
name <font color="#9bbb59">牛客</font>
type link
action https://www.nowcoder.com/exam/oj?page=1&tab=%E7%AE%97%E6%B3%95%E7%AC%94%E9%9D%A2%E8%AF%95%E7%AF%87&topicId=389
color default
```
^button-newcoder

```button
name <font color="#f79646">力扣</font>
type link
action https://leetcode.cn/discuss/post/3141566/ru-he-ke-xue-shua-ti-by-endlesscheng-q3yd/
color default
```
^button-leetcode

```button
name <font color="#92d050">多邻国</font>
type link
action https://www.duolingo.cn/learn
color default
```
^button-duolinguo

```button
name 返回
type command
action Navigate back
```
^button-back

```button
name 主页
type link
action obsidian://open?vault=Cpp&file=主页
```
^button-home

```button
name 力扣打卡
type link
action obsidian://open?vault=Cpp&file=Leetcode2
```
^button-leetcode2

```button
name <font color="#7030a0">左程云</font>
type link
action https://space.bilibili.com/8888480/lists/3509640?type=series
```
^button-zuochengyun

```button
name {
🎨 **Custom Styled**
*Multi-line button*
with formatting
}
type command
action Toggle Pin
width 15
height 4
align center middle
color purple
class my-custom-button
```
^button-everything

```button
name Daily Setup
type chain
actions [
  {"type": "command", "action": "Periodic Notes: Open today's daily note"},
  {"type": "append text", "action": "## Tasks for Today"},
  {"type": "template", "action": "Daily Task Template"}
]
```
^button-daily-setup

```button
name Daily Setup
type chain
actions [
  {"type": "link", "action": "file:///H:\MyPath\Latex\texlive\2025\texmf-dist\doc\luatex\barracuda\test\test-ean\005-isbn-test.pdf"},
  {"type": "append text", "action": "## Tasks for Today"},
  {"type": "template", "action": "Daily Task Template"}
]
```

``` button
name <font color="#548dd4">打开anki</font>
type link
action file:///E:\Anki\anki.exe
```
^button-anki-open

``` button
name <font color="#548dd4">更新anki</font>
type command
action Obsidian_to_Anki: Scan Vault
```
^button-anki-update
