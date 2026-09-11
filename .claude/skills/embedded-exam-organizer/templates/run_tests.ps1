<#
.SYNOPSIS
    通用笔试题本地自动测试脚本（自动发现题目 + 用例）。
.DESCRIPTION
    目录约定：
      - 每道题一个子目录，命名形如  q1-<题名>\   q2-<题名>\   ……（也可直接用 q1\ q2\）
      - 每个题目目录内放用例： test1.in / test1.out 、 test2.in / test2.out ……
      - 源码放在本目录下，命名 q1.cpp / q2.cpp ……（题号与目录题号对应）
      - 可选：reference\q1.cpp … 为参考实现，用于自检测试环境

    用法：
      .\run_tests.ps1                 自动跑全部题目（每题自动找 qN.cpp）
      .\run_tests.ps1 -Problem q1     只跑 q1
      .\run_tests.ps1 -Problem q1 -Source my.cpp
      .\run_tests.ps1 -Source a.cpp   用同一个源文件跑全部题目
      .\run_tests.ps1 -Reference      改用 reference\qN.cpp 自检测试环境
      .\run_tests.ps1 -List           只列出发现的题目，不编译

    比对规则：忽略空白差异（空格 / Tab / 换行），但数字序列必须完全一致。
#>
param(
    [string]$Problem = "all",
    [string]$Source = "",
    [switch]$Reference,
    [switch]$List,
    [int]$TimeoutSec = 10
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

# ---- 发现题目目录：形如 q1 / q1-xxx / q1_xxx ----
$num = { param($n) [int]([regex]::Match($n, '^q(\d+)').Groups[1].Value) }
$allDirs = @(
    Get-ChildItem -LiteralPath $root -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^q\d+([-_].*)?$' } |
        Sort-Object { & $num $_.Name }
)

if ($allDirs.Count -eq 0) {
    Write-Host "[ERROR] 未发现题目目录（应形如 q1-题名\ 或 q1\）。" -ForegroundColor Red
    exit 1
}

if ($Problem -ne "all") {
    $allDirs = @($allDirs | Where-Object { $_.Name -match ('^' + [regex]::Escape($Problem) + '([-_].*)?$') })
    if ($allDirs.Count -eq 0) {
        Write-Host "[ERROR] 未找到题目 '$Problem'。" -ForegroundColor Red
        exit 1
    }
}

if ($List) {
    Write-Host "发现的题目："
    foreach ($d in $allDirs) { Write-Host ("  " + $d.Name) }
    exit 0
}

# ---- 定位 g++ ----
$gpp = Get-Command g++ -ErrorAction SilentlyContinue
if (-not $gpp) {
    Write-Host "[ERROR] 未找到 g++，请安装 MinGW-w64 并将其加入 PATH。" -ForegroundColor Red
    exit 1
}

function Resolve-Source([string]$p) {
    if ([System.IO.Path]::IsPathRooted($p) -and (Test-Path -LiteralPath $p)) { return $p }
    if (Test-Path -LiteralPath $p) { return (Resolve-Path -LiteralPath $p).Path }
    $cand = Join-Path $root $p
    if (Test-Path -LiteralPath $cand) { return $cand }
    return $p
}

function Normalize($text) {
    if ($null -eq $text) { $text = "" }
    $text = $text -replace "`r", ""
    return (($text -split "\s+") | Where-Object { $_ -ne "" }) -join " "
}

$total = 0
$passed = 0
$skipped = 0
$todo = 0

foreach ($d in $allDirs) {
    $qid = [regex]::Match($d.Name, '^q\d+').Value          # q1 / q2 ...

    # ---- 确定源文件 ----
    $srcArg = if ($Source -ne "") { $Source }
              elseif ($Reference) { "reference\$qid.cpp" }
              else { "$qid.cpp" }
    $src = Resolve-Source $srcArg

    $ins = @(Get-ChildItem -LiteralPath $d.FullName -Filter "test*.in" -ErrorAction SilentlyContinue |
             Sort-Object { & $num $_.BaseName })
    if ($ins.Count -eq 0) {
        Write-Host "[WARN] $($d.Name) 内没有 test*.in，跳过。" -ForegroundColor Yellow
        continue
    }
    if (-not (Test-Path -LiteralPath $src)) {
        Write-Host "[WARN] 缺少源文件 $srcArg（题目 $qid），跳过。写完再跑一次即可。" -ForegroundColor Yellow
        $skipped += $ins.Count
        continue
    }

    Write-Host ""
    Write-Host ("[DIR]  " + $d.Name) -ForegroundColor Cyan
    Write-Host ("       src: {0}" -f $src)

    # ---- 编译 ----
    $exe = Join-Path $env:TEMP ("exam_" + $qid + "_" + $PID + ".exe")
    & $gpp.Source -O2 -std=c++17 -o $exe $src
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [ERROR] 编译失败：$src" -ForegroundColor Red
        $total += $ins.Count
        continue
    }

    # ---- 逐用例运行 ----
    foreach ($inFile in $ins) {
        $base = $inFile.BaseName
        $outFile = Join-Path $d.FullName ($base + ".out")
        $tmpOut = Join-Path $env:TEMP ("exam_out_" + $PID + ".txt")
        $total++

        $proc = Start-Process -FilePath $exe `
            -RedirectStandardInput $inFile.FullName `
            -RedirectStandardOutput $tmpOut `
            -NoNewWindow -PassThru
        if (-not $proc.WaitForExit($TimeoutSec * 1000)) {
            try { $proc.Kill() } catch {}
            Write-Host ("  {0,-8}: TIMEOUT (>{1}s)" -f $base, $TimeoutSec) -ForegroundColor Red
            Remove-Item -LiteralPath $tmpOut -Force -ErrorAction SilentlyContinue
            continue
        }

        if (-not (Test-Path -LiteralPath $outFile)) {
            Write-Host ("  {0,-8}: FAIL  (缺少期望输出 {1}.out)" -f $base, $base) -ForegroundColor Red
            Remove-Item -LiteralPath $tmpOut -Force -ErrorAction SilentlyContinue
            continue
        }

        $expectedRaw = Get-Content -LiteralPath $outFile -Raw
        $actualRaw = Get-Content -LiteralPath $tmpOut -Raw
        $e = Normalize $expectedRaw
        $a = Normalize $actualRaw

        if ($e -eq $a) {
            Write-Host ("  {0,-8}: PASS" -f $base) -ForegroundColor Green
            $passed++
        }
        elseif ($a -eq "" -and $e -ne "") {
            # 程序没有任何输出 -> 基本可判定为「还没开始写」，不算失败
            Write-Host ("  {0,-8}: TODO  (未实现，无输出)" -f $base) -ForegroundColor DarkGray
            $todo++
        }
        else {
            Write-Host ("  {0,-8}: FAIL" -f $base) -ForegroundColor Red
            Write-Host "      --- expected ---"
            ($expectedRaw.TrimEnd() -split "`r?`n") | ForEach-Object { Write-Host ("      " + $_) }
            Write-Host "      --- got ---"
            ($actualRaw.TrimEnd() -split "`r?`n") | ForEach-Object { Write-Host ("      " + $_) }
        }
        Remove-Item -LiteralPath $tmpOut -Force -ErrorAction SilentlyContinue
    }

    Remove-Item -LiteralPath $exe -Force -ErrorAction SilentlyContinue
}

Write-Host ""
$summary = "RESULT: {0} / {1} passed" -f $passed, $total
if ($todo -gt 0) { $summary += "  ({0} todo - 未实现)" -f $todo }
if ($skipped -gt 0) { $summary += "  ({0} skipped - 源文件缺失)" -f $skipped }
if ($passed -eq $total -and $skipped -eq 0 -and $todo -eq 0) {
    Write-Host $summary -ForegroundColor Green
    exit 0
}
Write-Host $summary -ForegroundColor Yellow
exit 1
