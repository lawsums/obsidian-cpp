# run_tests.ps1 - lightweight test runner for the KDXF written exam problems.
#
# Usage:
#   .\run_tests.ps1 -Problem q1 -Source path\to\solution.cpp
#   .\run_tests.ps1 q1 solution.cpp
#   .\run_tests.ps1 all solution.cpp
#
# Problem: q1 | q2 | q3 | all   (default: all)
# Source:  path to the .cpp file to test (default: solution.cpp, looked up in this folder)
#
# Comparison is whitespace-insensitive: extra/missing spaces, tabs and trailing
# newlines are ignored; the sequence of numbers must match exactly.

param(
    [string]$Problem = "all",
    [string]$Source = "solution.cpp"
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

# Forgiving argument order: if the first arg is a file name, treat it as Source.
$known = @("q1", "q2", "q3", "all")
if ($known -notcontains $Problem) {
    $tmp = $Problem
    $Problem = "all"
    if ($Source -eq "solution.cpp" -and $tmp -ne "") {
        $Source = $tmp
    }
}

# ---- locate g++ ----
$gpp = Get-Command g++ -ErrorAction SilentlyContinue
if (-not $gpp) {
    Write-Host "[ERROR] g++ not found in PATH. Install MinGW-w64 and add g++ to PATH."
    exit 1
}

# ---- resolve source file ----
if (-not [System.IO.Path]::IsPathRooted($Source)) {
    if (Test-Path -LiteralPath $Source) {
        $Source = (Resolve-Path -LiteralPath $Source).Path
    }
    else {
        $candidate = Join-Path $root $Source
        if (Test-Path -LiteralPath $candidate) {
            $Source = $candidate
        }
    }
}
if (-not (Test-Path -LiteralPath $Source)) {
    Write-Host "[ERROR] source file not found: $Source"
    exit 1
}

# ---- select test directories ----
$dirMap = @{
    "q1" = "q1-convolution"
    "q2" = "q2-particle-energy"
    "q3" = "q3-max-region"
}
if ($Problem -eq "all") {
    $dirs = @("q1-convolution", "q2-particle-energy", "q3-max-region")
}
elseif ($dirMap.ContainsKey($Problem)) {
    $dirs = @($dirMap[$Problem])
}
else {
    Write-Host "[ERROR] unknown problem '$Problem'. Use q1, q2, q3 or all."
    exit 1
}

# ---- compile ----
$exe = Join-Path $env:TEMP ("kdxf_sol_" + $PID + ".exe")
Write-Host "[BUILD] g++ -O2 -std=c++17 -o $exe $Source"
& $gpp.Source -O2 -std=c++17 -o $exe $Source
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] compilation failed."
    exit 1
}

function Normalize($text) {
    if ($null -eq $text) { $text = "" }
    $text = $text -replace "`r", ""
    return (($text -split "\s+") | Where-Object { $_ -ne "" }) -join " "
}

# ---- run tests ----
$total = 0
$passed = 0
foreach ($d in $dirs) {
    $dirPath = Join-Path $root $d
    if (-not (Test-Path -LiteralPath $dirPath)) {
        Write-Host "[WARN] test directory missing: $d"
        continue
    }
    $ins = @(Get-ChildItem -LiteralPath $dirPath -Filter "test*.in" | Sort-Object Name)
    if ($ins.Count -eq 0) {
        Write-Host "[WARN] no test*.in files in $d"
        continue
    }
    Write-Host ""
    Write-Host "[DIR]  $d"
    foreach ($inFile in $ins) {
        $base = $inFile.BaseName
        $outFile = Join-Path $dirPath ($base + ".out")
        $tmpOut = Join-Path $env:TEMP ("kdxf_out_" + $PID + ".txt")
        $total++

        Start-Process -FilePath $exe `
            -RedirectStandardInput $inFile.FullName `
            -RedirectStandardOutput $tmpOut `
            -NoNewWindow -Wait | Out-Null

        if (-not (Test-Path -LiteralPath $outFile)) {
            Write-Host ("  {0}  : FAIL  (expected file missing)" -f $base)
            continue
        }
        $expectedRaw = Get-Content -LiteralPath $outFile -Raw
        $actualRaw = Get-Content -LiteralPath $tmpOut -Raw

        $e = Normalize $expectedRaw
        $a = Normalize $actualRaw

        if ($e -eq $a) {
            Write-Host ("  {0}  : PASS" -f $base)
            $passed++
        }
        else {
            Write-Host ("  {0}  : FAIL" -f $base)
            Write-Host "      --- expected ---"
            ($expectedRaw.TrimEnd() -split "`r?`n") | ForEach-Object { Write-Host ("      " + $_) }
            Write-Host "      --- got ---"
            ($actualRaw.TrimEnd() -split "`r?`n") | ForEach-Object { Write-Host ("      " + $_) }
        }
        Remove-Item -LiteralPath $tmpOut -Force -ErrorAction SilentlyContinue
    }
}

Remove-Item -LiteralPath $exe -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host ("RESULT: {0} / {1} passed" -f $passed, $total)
if ($passed -eq $total) { exit 0 } else { exit 1 }
