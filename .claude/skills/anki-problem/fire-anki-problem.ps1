<#
.SYNOPSIS
    触发 Obsidian QuickAdd 的 Anki_problem 指令，把一道 LeetCode 题抓成笔记。

.DESCRIPTION
    通过 obsidian-advanced-uri 把命令 ID 转发给 Obsidian，等价于在命令面板里
    执行 "QuickAdd: Anki_problem"。模板会读剪贴板里的 leetcode.cn 链接，拉取题目、
    下载题图、生成 Leetcode/<题号>.<中文标题>.md 和同名 .cpp。

    脚本发完 URI 后会轮询 Leetcode/ 目录，确认新文件真的落地了才返回成功，
    避免"发出去了但没生效"的静默失败。

.PARAMETER Url
    LeetCode 中文站题目链接。给了就写进剪贴板（模板只读剪贴板，不读参数）。
    不给则直接用当前剪贴板内容。

.PARAMETER Lang
    刷题语言，默认 cpp。别名见脚本里的 $LANG_KEYS（py / python3 / python 等价，
    js / javascript 等价…）。最终写进剪贴板的是 "<语言> <URL>"，由模板解析出
    langSlug、文件扩展名和预置头。

.PARAMETER TimeoutSec
    等待新笔记出现的秒数，默认 120。

.PARAMETER NoWait
    只发 URI，不等结果。

.EXAMPLE
    .\fire-anki-problem.ps1
    .\fire-anki-problem.ps1 -Url 'https://leetcode.cn/problems/two-sum/'
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$Url,

    [string]$Lang         = 'cpp',
    [string]$Vault        = 'Cpp',
    [string]$CommandId    = 'quickadd:choice:7f2392c8-cda6-45e2-98ee-702bfff75a17',
    [string]$LeetcodeDir  = 'Leetcode',
    [int]$TimeoutSec      = 120,
    [switch]$NoWait
)

$ErrorActionPreference = 'Stop'

# ---------- 定位 vault 根目录 ----------
function Get-VaultRoot {
    # 本脚本位于 <vault>/.claude/skills/anki-problem/，向上三级即 vault 根
    $up3 = Join-Path $PSScriptRoot '..\..\..'
    if (Test-Path $up3) {
        $resolved = (Resolve-Path $up3).Path
        if (Test-Path (Join-Path $resolved '.obsidian')) { return $resolved }
    }
    if (Test-Path '.obsidian') { return (Get-Location).Path }
    throw "定位 vault 根目录失败（找不到 .obsidian）。请从 vault 内运行本脚本。"
}

$vaultRoot = Get-VaultRoot
$lcDir     = Join-Path $vaultRoot $LeetcodeDir

if (-not (Test-Path $lcDir)) { throw "找不到 Leetcode 目录：$lcDir" }

# ---------- 语言别名（与 Templates/Leetcode_problem_template.md 的 LANG_MAP 保持对齐）----------
$LANG_KEYS = @(
    'cpp', 'c++', 'c',
    'python', 'python3', 'py', 'py3',
    'java', 'js', 'javascript', 'ts', 'typescript',
    'go', 'golang', 'rust',
    'cs', 'csharp', 'c#', 'kt', 'kotlin', 'swift', 'rb', 'ruby',
    'php', 'dart', 'scala', 'elixir', 'erlang', 'racket', 'cangjie'
)

# 语言 → 源文件扩展名（探测新文件时要用）
$EXT_MAP = @{
    'cpp' = 'cpp'; 'c++' = 'cpp'; 'c' = 'c'
    'python' = 'py'; 'python3' = 'py'; 'py' = 'py'; 'py3' = 'py'
    'java' = 'java'; 'js' = 'js'; 'javascript' = 'js'; 'ts' = 'ts'; 'typescript' = 'ts'
    'go' = 'go'; 'golang' = 'go'; 'rust' = 'rs'
    'cs' = 'cs'; 'csharp' = 'cs'; 'c#' = 'cs'; 'kt' = 'kt'; 'kotlin' = 'kt'
    'swift' = 'swift'; 'rb' = 'rb'; 'ruby' = 'rb'
    'php' = 'php'; 'dart' = 'dart'; 'scala' = 'scala'
    'elixir' = 'ex'; 'erlang' = 'erl'; 'racket' = 'rkt'; 'cangjie' = 'cj'
}

# ---------- 准备 URL 与语言 ----------
$raw = if ($Url) { $Url } else { Get-Clipboard -Raw }
if (-not $raw) { throw "剪贴板为空，且没有用 -Url 传入链接。" }
$raw = $raw.Trim()

# 剪贴板里可能已经是 "<语言> <URL>"，先把 URL 抽出来
if ($raw -match '(https?://\S+)') { $Url = $Matches[1] }
else { throw "不是 LeetCode 题目链接：$raw" }

$slug = $null
if     ($Url -match 'leetcode\.cn/problems/([^/?#]+)')  { $slug = $Matches[1] }
elseif ($Url -match 'leetcode\.com/problems/([^/?#]+)') {
    Write-Warning "检测到 leetcode.com 链接。"
    Write-Warning "模板调用的 getLeetcodeProblem.js 只解析 leetcode.cn，会直接报错。"
    throw "请改用中文站链接：https://leetcode.cn/problems/$($Matches[1])/"
}
else { throw "不是 LeetCode 题目链接：$Url" }

$Lang = $Lang.ToLower()
if ($LANG_KEYS -notcontains $Lang) {
    throw "不认识的语言 '$Lang'。可用：$($LANG_KEYS -join ', ')"
}

Write-Host "[anki-problem] slug = $slug" -ForegroundColor Cyan
Write-Host "[anki-problem] 语言 = $Lang" -ForegroundColor Cyan

# 模板读剪贴板，格式 "<语言> <URL>"。
# 只在用户显式指定了 -Url / -Lang 时才回写，避免干扰手动贴链接的老习惯（无前缀 = cpp）。
if ($PSBoundParameters.ContainsKey('Url') -or $PSBoundParameters.ContainsKey('Lang')) {
    Set-Clipboard -Value "$Lang $Url"
    Write-Host "[anki-problem] 剪贴板 → '$Lang $Url'" -ForegroundColor DarkGray
} else {
    Write-Host "[anki-problem] 沿用剪贴板原文，语言交给模板解析（无前缀 = cpp）" -ForegroundColor DarkGray
}

# ---------- 记录触发前的目录快照 ----------
$before = @{}
Get-ChildItem -LiteralPath $lcDir -Filter '*.md' -File -ErrorAction SilentlyContinue |
    ForEach-Object { $before[$_.Name] = $true }

$obsWasRunning = [bool](Get-Process Obsidian -ErrorAction SilentlyContinue)
if (-not $obsWasRunning) {
    Write-Warning "Obsidian 当前没在运行：会先冷启动，插件加载完成前 URI 可能丢失，脚本会自动补发一次。"
}

# ---------- 发送 URI ----------
$uri = 'obsidian://advanced-uri?vault={0}&commandid={1}' -f `
    [uri]::EscapeDataString($Vault), [uri]::EscapeDataString($CommandId)

$fireTime = Get-Date
Write-Host "[anki-problem] 触发 $CommandId" -ForegroundColor Cyan
Start-Process $uri

if ($NoWait) {
    Write-Host "[anki-problem] 已发送，未等待结果（-NoWait）。" -ForegroundColor Yellow
    return
}

# ---------- 轮询等待新笔记 ----------
# 判据：文件名不在快照里，或时间戳变了（覆盖同名文件的情况也要能认出来）
function Get-NewestNewMd {
    Get-ChildItem -LiteralPath $lcDir -Filter '*.md' -File -ErrorAction SilentlyContinue |
        Where-Object {
            (-not $before.ContainsKey($_.Name)) -or ($before[$_.Name] -ne $_.LastWriteTime)
        } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
}

$deadline   = $fireTime.AddSeconds($TimeoutSec)
$newMd      = $null
$relaunched = $false

while ((Get-Date) -lt $deadline) {
    $cand = Get-NewestNewMd
    if ($cand) { $newMd = $cand; break }

    # 冷启动补发：等 30s 还没动静且原本没开 Obsidian，再发一次
    if ((-not $obsWasRunning) -and (-not $relaunched) -and ((Get-Date) -gt $fireTime.AddSeconds(30))) {
        Write-Host "[anki-problem] 冷启动补发一次 URI" -ForegroundColor DarkGray
        Start-Process $uri
        $relaunched = $true
    }

    Start-Sleep -Seconds 2
}

if (-not $newMd) {
    Write-Host "[anki-problem] FAILED 超时 ${TimeoutSec}s，Leetcode/ 没有新笔记。" -ForegroundColor Red
    Write-Host "  排查：1) 弹窗是否在等输入（见 SKILL.md 故障排查）" -ForegroundColor Red
    Write-Host "        2) Obsidian 是否响应 / advanced-uri 是否被禁用" -ForegroundColor Red
    Write-Host "        3) 链接是否 leetcode.cn 且题目存在" -ForegroundColor Red
    exit 1
}

# ---------- 等重命名落定 + 配套源文件落地 ----------
# 关键：QuickAdd 先按 fileNameFormat 建一个"半成品"文件（如 20260921200804.md），
# Templater 随后执行 tp.file.rename() 才改成 <题号>.<标题>.md。
# 所以刚探测到的那一瞬文件名是旧的，直接拿它拼源文件路径必然找不到 —— 必须等名字稳定。
$ext            = $EXT_MAP[$Lang]
$settleDeadline = (Get-Date).AddSeconds(60)
$lastName   = $newMd.Name
$stableHits = 0
$cppPath    = $null

while ((Get-Date) -lt $settleDeadline) {
    Start-Sleep -Seconds 2

    $cur = Get-NewestNewMd
    if ($cur) { $newMd = $cur }

    if ($newMd.Name -eq $lastName) { $stableHits++ }
    else                           { $stableHits = 0; $lastName = $newMd.Name }

    $candidateCpp = Join-Path $lcDir ($newMd.BaseName + ".$ext")
    if ((Test-Path -LiteralPath $candidateCpp) -and ($stableHits -ge 1)) {
        $cppPath = $candidateCpp
        break
    }

    # 名字已稳定 3 轮还没有 .cpp，只可能是该题没有 cpp 模板，别干等
    if ($stableHits -ge 3) { break }
}

Write-Host ''
Write-Host "[anki-problem] OK 新笔记：$($newMd.Name)" -ForegroundColor Green
if ($cppPath) {
    $size = (Get-Item -LiteralPath $cppPath).Length
    Write-Host "[anki-problem] OK 配套 .$ext：$($newMd.BaseName).$ext ($size 字节)" -ForegroundColor Green
} else {
    Write-Host "[anki-problem] WARN 没等到同名 .$ext（该题 codeSnippets 里可能没有 '$Lang' 对应的模板）。" -ForegroundColor Yellow
}
Write-Host "[anki-problem] 路径：$($newMd.FullName)" -ForegroundColor DarkGray

exit 0
