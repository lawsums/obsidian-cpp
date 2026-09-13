<# 
SoftOneTab - a Windows session snapshot and restore helper.

Usage:
  powershell -ExecutionPolicy Bypass -File .\SoftOneTab.ps1 save
  powershell -ExecutionPolicy Bypass -File .\SoftOneTab.ps1 restore
  powershell -ExecutionPolicy Bypass -File .\SoftOneTab.ps1 install
  powershell -ExecutionPolicy Bypass -File .\SoftOneTab.ps1 watch
#>

[CmdletBinding()]
param(
    [ValidateSet("save", "restore", "watch", "install", "uninstall", "status")]
    [string]$Command = "save",

    [string]$SessionPath,

    [int]$IntervalSeconds = 60,

    [switch]$NoGenericApps,

    # Seconds to wait between launching heavy apps (browsers, PDF readers,
    # file manager) during restore, to avoid short-term memory spikes.
    [int]$HeavyAppDelaySeconds = 10,

    # restore -Pick : list all archived snapshots for interactive selection
    [switch]$Pick,

    # restore -Date "2026-08-13" : restore the latest snapshot on that date
    # Also accepts "08-13" / "8-13" / "0813" (current year is assumed).
    [string]$Date,

    # restore -Days 1 : restore the latest snapshot from N days ago
    # 0 = today, 1 = yesterday, 2 = day before yesterday, ...
    [int]$Days = -1
)

$ErrorActionPreference = "Stop"

$AppName = "SoftOneTab"
$TaskName = "SoftOneTab Auto Snapshot"
$BaseDir = Join-Path $env:LOCALAPPDATA $AppName
$SessionsDir = Join-Path $BaseDir "sessions"
$LastSessionFile = Join-Path $BaseDir "last-session.json"
$PreShutdownFile = Join-Path $BaseDir "pre-shutdown-session.json"

function Ensure-Directory {
    param([Parameter(Mandatory = $true)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Write-SoftInfo {
    param([string]$Message)
    Write-Host "[$AppName] $Message"
}

function Get-SystemBootTime {
    try {
        $os = Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction SilentlyContinue
        if ($os -and $os.LastBootUpTime) {
            return $os.LastBootUpTime
        }
    }
    catch { }
    return $null
}

function Initialize-NativeWindowApi {
    if ("SoftOneTab.Native" -as [type]) {
        return $true
    }

    $csharp = @"
namespace SoftOneTab {
    public static class Native {
        public delegate bool EnumWindowsProc(System.IntPtr hWnd, System.IntPtr lParam);

        [System.Runtime.InteropServices.DllImport("user32.dll")]
        public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, System.IntPtr lParam);

        [System.Runtime.InteropServices.DllImport("user32.dll")]
        [return: System.Runtime.InteropServices.MarshalAs(System.Runtime.InteropServices.UnmanagedType.Bool)]
        public static extern bool IsWindowVisible(System.IntPtr hWnd);

        [System.Runtime.InteropServices.DllImport("user32.dll", SetLastError = true, CharSet = System.Runtime.InteropServices.CharSet.Auto)]
        public static extern int GetWindowText(System.IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);

        [System.Runtime.InteropServices.DllImport("user32.dll", SetLastError = true, CharSet = System.Runtime.InteropServices.CharSet.Auto)]
        public static extern int GetWindowTextLength(System.IntPtr hWnd);

        [System.Runtime.InteropServices.DllImport("user32.dll")]
        public static extern uint GetWindowThreadProcessId(System.IntPtr hWnd, out int lpdwProcessId);
    }
}
"@

    # Add-Type launches csc.exe as a child process, which inherits the current
    # environment block. Windows limits the environment block to 65535 bytes.
    # Some systems have oversized env vars (e.g. ACC_PRODUCT_CONFIG_V3) that
    # exceed this limit, causing csc.exe to fail. Work around by temporarily
    # removing any env var larger than 4 KB from the process environment.
    $clearedVars = @{}
    try {
        foreach ($kv in [System.Environment]::GetEnvironmentVariables([System.EnvironmentVariableTarget]::Process).GetEnumerator()) {
            $key = $kv.Key.ToString()
            $val = $kv.Value.ToString()
            $size = ($key.Length + $val.Length + 2) * 2
            if ($size -gt 4096) {
                $clearedVars[$key] = $val
                Remove-Item -LiteralPath "Env:$key" -ErrorAction SilentlyContinue
            }
        }

        if ($clearedVars.Count -gt 0) {
            Write-SoftInfo ("Temporarily cleared {0} oversized env var(s) for C# compilation." -f $clearedVars.Count)
        }

        Add-Type -TypeDefinition $csharp
        return $true
    }
    catch {
        Write-SoftInfo ("ERROR: Failed to compile native API type: {0}" -f $_.Exception.Message)
        throw
    }
    finally {
        # Restore cleared env vars. Values that exceed the OS limit cannot be
        # restored via the Env: provider; use the .NET API and silently ignore
        # failures (the variable will be re-populated from the registry on the
        # next process launch).
        foreach ($key in @($clearedVars.Keys)) {
            try {
                [System.Environment]::SetEnvironmentVariable($key, $clearedVars[$key], [System.EnvironmentVariableTarget]::Process)
            }
            catch {
                # Value too long for process env; skip, will be available next launch
            }
        }
    }
}

function Get-ProcessInfoMap {
    $map = @{}
    $cimSuccess = $false
    try {
        $cimProcesses = Get-CimInstance -ClassName Win32_Process -ErrorAction SilentlyContinue
        if ($cimProcesses) {
            foreach ($proc in $cimProcesses) {
                $map[[int]$proc.ProcessId] = [pscustomobject]@{
                    processId      = [int]$proc.ProcessId
                    processName    = $proc.Name
                    executablePath  = $proc.ExecutablePath
                    commandLine    = $proc.CommandLine
                    parentProcessId = $proc.ParentProcessId
                }
            }
            $cimSuccess = $true
        }
    }
    catch {
        Write-SoftInfo "Get-CimInstance failed: $($_.Exception.Message)"
    }

    if (-not $cimSuccess) {
        try {
            Get-Process | ForEach-Object {
                $map[[int]$_.Id] = [pscustomobject]@{
                    processId      = [int]$_.Id
                    processName    = $_.ProcessName
                    executablePath  = $null
                    commandLine    = $null
                    parentProcessId = $null
                }
            }
        }
        catch {
            Write-SoftInfo "Get-Process fallback also failed: $($_.Exception.Message)"
        }
    }
    return $map
}

function Get-VisibleWindows {
    $null = Initialize-NativeWindowApi

    $items = New-Object System.Collections.ArrayList
    $callback = [SoftOneTab.Native+EnumWindowsProc]{
        param([IntPtr]$hWnd, [IntPtr]$lParam)

        if (-not [SoftOneTab.Native]::IsWindowVisible($hWnd)) {
            return $true
        }

        $length = [SoftOneTab.Native]::GetWindowTextLength($hWnd)
        if ($length -le 0) {
            return $true
        }

        $builder = New-Object System.Text.StringBuilder ($length + 1)
        [void][SoftOneTab.Native]::GetWindowText($hWnd, $builder, $builder.Capacity)
        $title = $builder.ToString().Trim()
        if ([string]::IsNullOrWhiteSpace($title) -or $title -eq "Program Manager") {
            return $true
        }

        $windowProcessId = 0
        [void][SoftOneTab.Native]::GetWindowThreadProcessId($hWnd, [ref]$windowProcessId)
        if ($windowProcessId -le 0) {
            return $true
        }

        [void]$items.Add([pscustomobject]@{
            hwnd      = ("0x{0:X}" -f $hWnd.ToInt64())
            title     = $title
            processId = [int]$windowProcessId
        })
        return $true
    }

    [void][SoftOneTab.Native]::EnumWindows($callback, [IntPtr]::Zero)
    return $items
}

function Get-ActiveComObject {
    param([Parameter(Mandatory = $true)][string]$ProgId)
    try {
        return [System.Runtime.InteropServices.Marshal]::GetActiveObject($ProgId)
    }
    catch {
        return $null
    }
}

function Convert-FileUrlToPath {
    param([string]$Url)
    if ([string]::IsNullOrWhiteSpace($Url)) {
        return $null
    }

    try {
        $uri = [Uri]$Url
        if ($uri.IsFile) {
            return [Uri]::UnescapeDataString($uri.LocalPath)
        }
    }
    catch {
        return $null
    }

    return $null
}

function Get-ExplorerFolders {
    $folders = New-Object System.Collections.ArrayList
    $shell = $null
    try {
        $shell = New-Object -ComObject Shell.Application
        foreach ($window in @($shell.Windows())) {
            try {
                $fullName = [string]$window.FullName
                if ($fullName -notmatch "\\explorer\.exe$") {
                    continue
                }

                $path = Convert-FileUrlToPath ([string]$window.LocationURL)
                if ([string]::IsNullOrWhiteSpace($path)) {
                    continue
                }

                [void]$folders.Add([pscustomobject]@{
                    path  = $path
                    title = [string]$window.LocationName
                })
            }
            catch {
                continue
            }
        }
    }
    catch {
        return @()
    }
    finally {
        if ($shell) {
            try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($shell) } catch {}
        }
    }

    return $folders | Sort-Object path -Unique
}

function Get-OfficeDocuments {
    $documents = New-Object System.Collections.ArrayList
    $targets = @(
        @{ progId = "Word.Application"; collection = "Documents"; kind = "word" },
        @{ progId = "Excel.Application"; collection = "Workbooks"; kind = "excel" },
        @{ progId = "PowerPoint.Application"; collection = "Presentations"; kind = "powerpoint" }
    )

    foreach ($target in $targets) {
        $app = Get-ActiveComObject $target.progId
        if ($null -eq $app) {
            continue
        }

        try {
            switch ($target.collection) {
                "Documents" { $collection = $app.Documents }
                "Workbooks" { $collection = $app.Workbooks }
                "Presentations" { $collection = $app.Presentations }
                default { $collection = $null }
            }

            if ($null -eq $collection) {
                continue
            }
            foreach ($item in @($collection)) {
                try {
                    $fullName = [string]$item.FullName
                    if ([string]::IsNullOrWhiteSpace($fullName)) {
                        continue
                    }

                    [void]$documents.Add([pscustomobject]@{
                        kind = $target.kind
                        path = $fullName
                        title = [System.IO.Path]::GetFileName($fullName)
                    })
                }
                catch {
                    continue
                }
            }
        }
        catch {
            continue
        }
        finally {
            try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) } catch {}
        }
    }

    return $documents | Sort-Object kind,path -Unique
}

function Get-ReferencedPathsFromCommandLine {
    param([string]$CommandLine)

    if ([string]::IsNullOrWhiteSpace($CommandLine)) {
        return @()
    }

    $extensions = "pdf|epub|mobi|azw3|azw|fb2|djvu|doc|docx|dotx|xls|xlsx|xlsm|ppt|pptx|txt|md|rtf|csv|tsv|html|htm|png|jpg|jpeg|gif|webp"
    $paths = New-Object System.Collections.ArrayList

    foreach ($match in [regex]::Matches($CommandLine, '"([A-Za-z]:\\[^"]+\.(' + $extensions + '))"', "IgnoreCase")) {
        [void]$paths.Add($match.Groups[1].Value)
    }

    foreach ($match in [regex]::Matches($CommandLine, "([A-Za-z]:\\[^\s`"]+\.(" + $extensions + "))", "IgnoreCase")) {
        [void]$paths.Add($match.Groups[1].Value)
    }

    return $paths | Where-Object { Test-Path -LiteralPath $_ } | Sort-Object -Unique
}

$script:BrowserProcessNames = @(
    "msedge.exe", "chrome.exe", "brave.exe", "firefox.exe",
    "vivaldi.exe", "opera.exe", "msedgewebview2.exe"
)

$script:PdfReaderProcessNames = @(
    "FoxitPDFReader.exe", "FoxitReader.exe", "AcroRd32.exe", "Acrobat.exe",
    "SumatraPDF.exe", "PDFXEdit.exe", "Wondershare.PDFReader.exe",
    "Apowersoft.PDFReader.exe", "HaiyuPDFReader.exe", "PDFReader.exe",
    "program.exe"
)

function Get-BrowserTabs {
    param([array]$Windows)

    $tabs = New-Object System.Collections.ArrayList

    try {
        Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes -ErrorAction SilentlyContinue
    }
    catch {
        Write-SoftInfo "WARNING: UI Automation not available, skipping browser tab enumeration."
        return $tabs
    }

    foreach ($window in $Windows) {
        $procName = $window.processName
        if (-not $procName) { continue }
        if ($script:BrowserProcessNames -notcontains $procName) { continue }

        $hwndValue = 0L
        if ($window.hwnd -match '^0x([0-9A-Fa-f]+)$') {
            $hwndValue = [Convert]::ToInt64($Matches[1], 16)
        }
        else {
            try { $hwndValue = [long]$window.hwnd } catch { continue }
        }

        if ($hwndValue -le 0) { continue }

        try {
            $element = [System.Windows.Automation.AutomationElement]::FromHandle([IntPtr]$hwndValue)
            if (-not $element) { continue }

            $condition = New-Object System.Windows.Automation.PropertyCondition(
                [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
                [System.Windows.Automation.ControlType]::TabItem
            )

            $tabItems = $element.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condition)

            foreach ($tab in $tabItems) {
                $name = $tab.Current.Name
                if ([string]::IsNullOrWhiteSpace($name)) { continue }

                # Clean up Edge/Chrome memory usage suffix
                $name = $name -replace '\s*-\s*睡眠\s*-\s*内存使用率\s*-\s*\d+\s*MB\s*$', ''
                $name = $name -replace '\s*-\s*内存使用率\s*-\s*\d+\s*MB\s*$', ''
                $name = $name.Trim()

                if ([string]::IsNullOrWhiteSpace($name)) { continue }

                [void]$tabs.Add([pscustomobject]@{
                    browser    = $procName
                    tabTitle   = $name
                    sourceHwnd = $window.hwnd
                })
            }
        }
        catch {
            continue
        }
    }

    return $tabs
}

function Get-PdfDocuments {
    param([array]$Windows)

    $pdfs = New-Object System.Collections.ArrayList

    foreach ($window in $Windows) {
        $procName = $window.processName
        $title = $window.title
        if (-not $title) { continue }

        # Skip browser windows - their PDFs are covered by browser tab enumeration
        if ($procName -and $script:BrowserProcessNames -contains $procName) {
            continue
        }

        $isPdf = $false
        $fileName = $null
        $fullPath = $null

        # Check by process name
        if ($procName -and $script:PdfReaderProcessNames -contains $procName) {
            $isPdf = $true
        }

        # Check by title containing .pdf
        if ($title -match '\.pdf') {
            $isPdf = $true
        }

        if (-not $isPdf) { continue }

        # Extract filename from title (pattern: "filename.pdf - ReaderName" or just "filename.pdf")
        if ($title -match '([^\s|/\\]+\.[Pp][Dd][Ff])') {
            $fileName = $Matches[1].Trim()
        }

        # Try to get full path from command line
        if ($window.commandLine) {
            $pdfMatch = [regex]::Match($window.commandLine, '"([A-Za-z]:\\[^"]+\.[Pp][Dd][Ff])"')
            if (-not $pdfMatch.Success) {
                $pdfMatch = [regex]::Match($window.commandLine, '([A-Za-z]:\\[^\s"]+\.[Pp][Dd][Ff])')
            }
            if ($pdfMatch.Success) {
                $fullPath = $pdfMatch.Groups[1].Value
            }
        }

        [void]$pdfs.Add([pscustomobject]@{
            fileName    = $fileName
            fullPath    = $fullPath
            reader      = $procName
            windowTitle = $title
        })
    }

    return $pdfs
}

function Test-ShouldSkipWindow {
    param(
        [string]$ProcessName,
        [string]$CommandLine,
        [string]$Title
    )

    $skipNames = @(
        "ApplicationFrameHost.exe",
        "LockApp.exe",
        "SearchHost.exe",
        "ShellExperienceHost.exe",
        "StartMenuExperienceHost.exe",
        "SystemSettings.exe",
        "TextInputHost.exe",
        "WindowsTerminal.exe"
    )

    if ($skipNames -contains $ProcessName) {
        return $true
    }

    if ($CommandLine -and $CommandLine -match [regex]::Escape("SoftOneTab.ps1")) {
        return $true
    }

    if ($Title -match "^\s*$") {
        return $true
    }

    return $false
}

function New-SessionSnapshot {
    $processMap = Get-ProcessInfoMap
    $windows = New-Object System.Collections.ArrayList

    try {
        foreach ($window in Get-VisibleWindows) {
            $processInfo = $null
            if ($processMap.ContainsKey($window.processId)) {
                $processInfo = $processMap[$window.processId]
            }

            $processName = if ($processInfo) { $processInfo.processName } else { $null }
            $commandLine = if ($processInfo) { $processInfo.commandLine } else { $null }

            if (Test-ShouldSkipWindow -ProcessName $processName -CommandLine $commandLine -Title $window.title) {
                continue
            }

            [void]$windows.Add([pscustomobject]@{
                hwnd           = $window.hwnd
                title          = $window.title
                processId      = $window.processId
                processName    = $processName
                executablePath = if ($processInfo) { $processInfo.executablePath } else { $null }
                commandLine    = $commandLine
            })
        }
    }
    catch {
        Write-SoftInfo ("WARNING: Get-VisibleWindows failed: {0}" -f $_.Exception.Message)
    }

    $apps = $windows |
        Group-Object processId |
        ForEach-Object {
            $first = $_.Group[0]
            [pscustomobject]@{
                processId      = $first.processId
                processName    = $first.processName
                executablePath = $first.executablePath
                windowCount    = $_.Count
                titles         = @($_.Group | Select-Object -ExpandProperty title)
            }
        } |
        Sort-Object processName,processId

    $commandFiles = New-Object System.Collections.ArrayList
    foreach ($window in $windows) {
        foreach ($path in Get-ReferencedPathsFromCommandLine $window.commandLine) {
            [void]$commandFiles.Add([pscustomobject]@{
                path = $path
                sourceProcess = $window.processName
                sourceTitle = $window.title
            })
        }
    }

    $explorerFolders = @()
    try {
        $explorerFolders = @(Get-ExplorerFolders)
    }
    catch {
        Write-SoftInfo ("WARNING: Get-ExplorerFolders failed: {0}" -f $_.Exception.Message)
    }

    $officeDocuments = @()
    try {
        $officeDocuments = @(Get-OfficeDocuments)
    }
    catch {
        Write-SoftInfo ("WARNING: Get-OfficeDocuments failed: {0}" -f $_.Exception.Message)
    }

    $commandFileItems = @($commandFiles | Sort-Object path -Unique)

    $browserTabs = @()
    try {
        $browserTabs = @(Get-BrowserTabs -Windows $windows)
    }
    catch {
        Write-SoftInfo ("WARNING: Get-BrowserTabs failed: {0}" -f $_.Exception.Message)
    }

    $pdfDocuments = @()
    try {
        $pdfDocuments = @(Get-PdfDocuments -Windows $windows)
    }
    catch {
        Write-SoftInfo ("WARNING: Get-PdfDocuments failed: {0}" -f $_.Exception.Message)
    }

    return [pscustomobject]@{
        snapshotVersion = 2
        capturedAt      = (Get-Date).ToString("o")
        bootTime        = (Get-SystemBootTime).ToString("o")
        machine         = $env:COMPUTERNAME
        user            = "$env:USERDOMAIN\$env:USERNAME"
        windows         = @($windows)
        apps            = @($apps)
        browserTabs     = @($browserTabs)
        documents       = [pscustomobject]@{
            explorerFolders      = @($explorerFolders)
            officeDocuments      = @($officeDocuments)
            pdfDocuments         = @($pdfDocuments)
            filesFromCommandLine = @($commandFileItems)
        }
    }
}

function Save-SessionSnapshot {
    param([switch]$AutoSnapshot)

    Ensure-Directory $BaseDir
    Ensure-Directory $SessionsDir

    $snapshot = New-SessionSnapshot

    # --- Session break detection ---
    # Two signals indicate the computer was off/asleep since the last snapshot:
    #
    # Signal 1: Boot time changed (full reboot — LastBootUpTime updates)
    #
    # Signal 2: Time gap since last snapshot > 5 minutes.
    #   Only reliable when auto-snapshot is running (every 60 seconds). If the
    #   previous snapshot is older than 5 minutes, the task wasn't running —
    #   the computer was shut down, hibernated, or asleep.
    #
    #   IMPORTANT: Signal 2 is DISABLED in manual save mode. When the user
    #   manually clicks "save", the gap between two saves is naturally large
    #   (hours or even days) and does NOT indicate a session break. Enabling
    #   Signal 2 in manual mode causes the previous snapshot to be incorrectly
    #   copied to pre-shutdown, which then confuses restore into recovering
    #   an older snapshot instead of the most recent one.
    $currentBootTime = $snapshot.bootTime
    $sessionChanged = $false
    $gapReason = ""

    if (Test-Path -LiteralPath $LastSessionFile) {
        try {
            $prevSnapshot = Get-Content -LiteralPath $LastSessionFile -Raw | ConvertFrom-Json
            $prevBootTime = $prevSnapshot.bootTime
            $prevCapturedAt = $prevSnapshot.capturedAt

            # Signal 1: boot time changed (full reboot)
            if ($prevBootTime -and $currentBootTime -and ($prevBootTime -ne $currentBootTime)) {
                $sessionChanged = $true
                $gapReason = "boot time changed"
            }

            # Signal 2: time gap > 5 minutes (Fast Startup / sleep / hibernate)
            # Only checked in auto-snapshot mode. In manual mode, large gaps
            # between saves are normal and must not be treated as a break.
            if ($AutoSnapshot -and -not $sessionChanged -and $prevCapturedAt) {
                try {
                    $prevTime = [DateTimeOffset]::Parse($prevCapturedAt)
                    $nowTime = [DateTimeOffset]::Now
                    $gap = $nowTime - $prevTime
                    if ($gap.TotalMinutes -gt 5) {
                        $sessionChanged = $true
                        $gapReason = ("time gap {0:N0} min (computer was off/asleep)" -f $gap.TotalMinutes)
                    }
                }
                catch { }
            }

            if ($sessionChanged) {
                Copy-Item -LiteralPath $LastSessionFile -Destination $PreShutdownFile -Force
                Write-SoftInfo "Session break detected ($gapReason)."
                Write-SoftInfo "  Previous session saved as pre-shutdown snapshot."
                if ($prevCapturedAt) {
                    Write-SoftInfo "  Previous snapshot: $prevCapturedAt"
                }
                Write-SoftInfo "  Current time:      $(Get-Date -Format 'o')"
            }
        }
        catch {
            Write-SoftInfo "WARNING: Could not read previous snapshot for session-break comparison."
        }
    }

    # --- Archive to daily folder ---
    $dateStr = Get-Date -Format "yyyy-MM-dd"
    $dailyDir = Join-Path $SessionsDir $dateStr
    Ensure-Directory $dailyDir
    $stamp = Get-Date -Format "HHmmss"
    $archivePath = Join-Path $dailyDir "session-$stamp.json"

    try {
        $json = $snapshot | ConvertTo-Json -Depth 10 -ErrorAction Stop
    }
    catch {
        Write-SoftInfo ("ERROR: ConvertTo-Json failed: {0}" -f $_.Exception.Message)
        throw
    }

    Set-Content -LiteralPath $archivePath -Value $json -Encoding UTF8
    Set-Content -LiteralPath $LastSessionFile -Value $json -Encoding UTF8

    Write-SoftInfo ("Saved {0} windows, {1} apps, {2} explorer folders, {3} office documents, {4} PDF docs, {5} browser tabs." -f `
        @($snapshot.windows).Count,
        @($snapshot.apps).Count,
        @($snapshot.documents.explorerFolders).Count,
        @($snapshot.documents.officeDocuments).Count,
        @($snapshot.documents.pdfDocuments).Count,
        @($snapshot.browserTabs).Count)
    Write-SoftInfo "Latest snapshot: $LastSessionFile"
    Write-SoftInfo "Archive: $archivePath"
}

function Start-RestorePath {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (Test-Path -LiteralPath $Path) {
        Invoke-Item -LiteralPath $Path
        return $true
    }

    return $false
}

# Heavy apps are launched slowly (with a delay between each) during restore to
# avoid memory spikes. They are identified by process name (browsers, PDF
# readers, file manager) or by file extension (.pdf, .epub, ...).
$script:HeavyFileExtensions = @(
    ".pdf", ".epub", ".mobi", ".azw3", ".azw", ".fb2", ".djvu"
)

function Test-IsHeavyApp {
    param([string]$ProcessName)

    if ([string]::IsNullOrWhiteSpace($ProcessName)) {
        return $false
    }

    $name = $ProcessName.ToLowerInvariant()

    if ($script:BrowserProcessNames -contains $name) {
        return $true
    }

    if ($script:PdfReaderProcessNames -contains $name) {
        return $true
    }

    if ($name -eq "explorer.exe") {
        return $true
    }

    return $false
}

function Test-IsHeavyFile {
    param([string]$FilePath)

    if ([string]::IsNullOrWhiteSpace($FilePath)) {
        return $false
    }

    $ext = [System.IO.Path]::GetExtension($FilePath)
    if ([string]::IsNullOrWhiteSpace($ext)) {
        return $false
    }

    return $script:HeavyFileExtensions -contains $ext.ToLowerInvariant()
}

function Get-ArchivedSnapshots {
    param([int]$MaxDays = 60)

    $snapshots = New-Object System.Collections.ArrayList

    if (-not (Test-Path -LiteralPath $SessionsDir)) {
        return $snapshots
    }

    $dailyDirs = Get-ChildItem -LiteralPath $SessionsDir -Directory -ErrorAction SilentlyContinue |
        Sort-Object Name -Descending |
        Select-Object -First $MaxDays

    foreach ($dir in $dailyDirs) {
        $files = Get-ChildItem -LiteralPath $dir.FullName -Filter "session-*.json" -ErrorAction SilentlyContinue |
            Sort-Object Name -Descending

        foreach ($file in $files) {
            try {
                $snap = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
                $capturedAt = $null
                if ($snap.capturedAt) {
                    try { $capturedAt = [DateTimeOffset]::Parse($snap.capturedAt) } catch { }
                }

                [void]$snapshots.Add([pscustomobject]@{
                    FilePath    = $file.FullName
                    CapturedAt  = $capturedAt
                    DateStr     = $dir.Name
                    Windows     = @($snap.windows).Count
                    Apps        = @($snap.apps).Count
                    BrowserTabs = @($snap.browserTabs).Count
                    Folders     = @($snap.documents.explorerFolders).Count
                    OfficeDocs  = @($snap.documents.officeDocuments).Count
                    PdfDocs     = @($snap.documents.pdfDocuments).Count
                    CmdFiles    = @($snap.documents.filesFromCommandLine).Count
                })
            }
            catch {
                # Skip unreadable snapshot files
            }
        }
    }

    # Sort by CapturedAt descending (most recent first).
    # Snapshots that failed to parse CapturedAt sort to the end.
    return @($snapshots | Sort-Object { $_.CapturedAt } -Descending)
}

function Find-SnapshotByDate {
    param([string]$DateStr)

    $targetDate = $null

    # yyyy-MM-dd
    if ($DateStr -match '^(\d{4})-(\d{1,2})-(\d{1,2})$') {
        $targetDate = "{0:D4}-{1:D2}-{2:D2}" -f [int]$Matches[1], [int]$Matches[2], [int]$Matches[3]
    }
    # MM-dd or M-d
    elseif ($DateStr -match '^(\d{1,2})-(\d{1,2})$') {
        $year = (Get-Date).Year
        $targetDate = "{0:D4}-{1:D2}-{2:D2}" -f $year, [int]$Matches[1], [int]$Matches[2]
    }
    # MMdd
    elseif ($DateStr -match '^(\d{2})(\d{2})$') {
        $year = (Get-Date).Year
        $targetDate = "{0:D4}-{1:D2}-{2:D2}" -f $year, [int]$Matches[1], [int]$Matches[2]
    }
    else {
        Write-SoftInfo "Cannot parse date: $DateStr"
        Write-SoftInfo "  Supported formats: 2026-08-13, 08-13, 0813"
        return $null
    }

    $snapshots = Get-ArchivedSnapshots

    # Also check last-session.json and pre-shutdown-session.json
    foreach ($extraFile in @($LastSessionFile, $PreShutdownFile)) {
        if (Test-Path -LiteralPath $extraFile) {
            try {
                $snap = Get-Content -LiteralPath $extraFile -Raw -Encoding UTF8 | ConvertFrom-Json
                $capturedAt = $null
                if ($snap.capturedAt) {
                    try { $capturedAt = [DateTimeOffset]::Parse($snap.capturedAt) } catch { }
                }
                if ($capturedAt -and $capturedAt.ToString("yyyy-MM-dd") -eq $targetDate) {
                    $snapshots = @([pscustomobject]@{
                        FilePath    = $extraFile
                        CapturedAt  = $capturedAt
                        DateStr     = $targetDate
                        Windows     = @($snap.windows).Count
                        Apps        = @($snap.apps).Count
                        BrowserTabs = @($snap.browserTabs).Count
                        Folders     = @($snap.documents.explorerFolders).Count
                        OfficeDocs  = @($snap.documents.officeDocuments).Count
                        PdfDocs     = @($snap.documents.pdfDocuments).Count
                        CmdFiles    = @($snap.documents.filesFromCommandLine).Count
                    }) + $snapshots
                }
            }
            catch { }
        }
    }

    $matched = @($snapshots | Where-Object {
        ($_.CapturedAt -and $_.CapturedAt.ToString("yyyy-MM-dd") -eq $targetDate) -or
        ($_.DateStr -eq $targetDate)
    } | Sort-Object { $_.CapturedAt } -Descending)

    if ($matched.Count -eq 0) {
        Write-SoftInfo "No snapshot found for $targetDate."
        return $null
    }

    Write-SoftInfo "Found $($matched.Count) snapshot(s) for $targetDate, using the latest one."
    Write-SoftInfo "  Captured at: $($matched[0].CapturedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
    return $matched[0].FilePath
}

function Select-SnapshotInteractively {
    Write-SoftInfo "Loading snapshot list..."

    $snapshots = Get-ArchivedSnapshots

    # Also include last-session.json if it's not already represented
    if (Test-Path -LiteralPath $LastSessionFile) {
        try {
            $snap = Get-Content -LiteralPath $LastSessionFile -Raw -Encoding UTF8 | ConvertFrom-Json
            $capturedAt = $null
            if ($snap.capturedAt) {
                try { $capturedAt = [DateTimeOffset]::Parse($snap.capturedAt) } catch { }
            }
            $alreadyHave = $false
            if ($capturedAt) {
                foreach ($s in $snapshots) {
                    if ($s.CapturedAt -and $s.CapturedAt.ToString("o") -eq $capturedAt.ToString("o")) {
                        $alreadyHave = $true
                        break
                    }
                }
            }
            if (-not $alreadyHave) {
                $snapshots = @([pscustomobject]@{
                    FilePath    = $LastSessionFile
                    CapturedAt  = $capturedAt
                    DateStr     = if ($capturedAt) { $capturedAt.ToString("yyyy-MM-dd") } else { "unknown" }
                    Windows     = @($snap.windows).Count
                    Apps        = @($snap.apps).Count
                    BrowserTabs = @($snap.browserTabs).Count
                    Folders     = @($snap.documents.explorerFolders).Count
                    OfficeDocs  = @($snap.documents.officeDocuments).Count
                    PdfDocs     = @($snap.documents.pdfDocuments).Count
                    CmdFiles    = @($snap.documents.filesFromCommandLine).Count
                }) + $snapshots
            }
        }
        catch { }
    }

    # Re-sort
    $snapshots = @($snapshots | Sort-Object { $_.CapturedAt } -Descending)

    if ($snapshots.Count -eq 0) {
        Write-SoftInfo "No archived snapshots found."
        Write-SoftInfo "  Use 'save' to create one first."
        return $null
    }

    # Display the list (cap at 30 entries for readability)
    $displayCount = [Math]::Min($snapshots.Count, 30)

    Write-Host ""
    Write-Host ("  Recoverable snapshots ({0} total, showing latest {1})" -f $snapshots.Count, $displayCount) -ForegroundColor Cyan
    Write-Host ""
    Write-Host ("  {0,-5} {1,-12} {2,-10} {3,5} {4,5} {5,5} {6,5} {7,5}" -f `
        "No.", "Date", "Time", "Win", "Apps", "Tabs", "Dirs", "Docs") -ForegroundColor Yellow
    Write-Host ("  {0}" -f ("-" * 62)) -ForegroundColor DarkGray

    for ($i = 0; $i -lt $displayCount; $i++) {
        $s = $snapshots[$i]
        $datePart = if ($s.CapturedAt) { $s.CapturedAt.ToString("yyyy-MM-dd") } else { $s.DateStr }
        $timePart = if ($s.CapturedAt) { $s.CapturedAt.ToString("HH:mm:ss") } else { "??:??:??" }

        $marker = " "
        if ($i -eq 0) { $marker = ">" }

        Write-Host ("  {0}{1,-4} {2,-12} {3,-10} {4,5} {5,5} {6,5} {7,5} {8,5}" -f `
            $marker, ($i + 1), $datePart, $timePart, $s.Windows, $s.Apps, $s.BrowserTabs, $s.Folders, ($s.OfficeDocs + $s.PdfDocs))
    }

    if ($snapshots.Count -gt 30) {
        Write-Host ("  ... and {0} more (use -Date to pick older ones)" -f ($snapshots.Count - 30)) -ForegroundColor DarkGray
    }

    Write-Host ""
    Write-Host "  Column legend: Win=windows  Apps=programs  Tabs=browser tabs Dirs=folders  Docs=office+PDF" -ForegroundColor DarkGray
    Write-Host ""

    $valid = $false
    while (-not $valid) {
        $input = Read-Host "  Enter number to restore (or 'q' to quit)"

        if ($input -match '^\s*[qQ]\s*$') {
            Write-SoftInfo "Cancelled."
            return $null
        }

        $choice = 0
        if ([int]::TryParse($input.Trim(), [ref]$choice)) {
            if ($choice -ge 1 -and $choice -le $displayCount) {
                return $snapshots[$choice - 1].FilePath
            }
            if ($choice -ge 1 -and $choice -le $snapshots.Count) {
                return $snapshots[$choice - 1].FilePath
            }
        }

        # Try date input (0813, 08-13, 2026-08-13)
        $datePath = Find-SnapshotByDate -DateStr $input.Trim()
        if ($datePath) {
            return $datePath
        }

        Write-Host "  Invalid input. Please enter a number (1-$displayCount) or a date." -ForegroundColor Red
    }

    return $null
}

function Restore-SessionSnapshot {
    param(
        [string]$Path,
        [int]$HeavyAppDelay = 10
    )

    if ([string]::IsNullOrWhiteSpace($Path)) {
        # After the computer was off/asleep, the user typically wants to restore
        # the PRE-shutdown state, not the current state. If a pre-shutdown
        # snapshot exists, use it. We detect "was off" by:
        #   1. boot time differs (full reboot), OR
        #   2. pre-shutdown snapshot's capturedAt is older than the current
        #      last-session snapshot's capturedAt (covers Fast Startup / sleep)
        if (Test-Path -LiteralPath $PreShutdownFile) {
            $usePreShutdown = $false
            try {
                $preSnap = Get-Content -LiteralPath $PreShutdownFile -Raw | ConvertFrom-Json
                $currentBoot = Get-SystemBootTime

                # Signal 1: boot time changed
                if ($preSnap.bootTime -and $currentBoot -and ($preSnap.bootTime.ToString() -ne $currentBoot.ToString())) {
                    $usePreShutdown = $true
                }

                # Signal 2: pre-shutdown snapshot is older than last-session,
                # AND the gap between them is small (<= 10 minutes).
                #
                # The small-gap requirement ensures this only triggers in
                # auto-snapshot mode (which saves every 60 seconds). In manual
                # mode, the gap between two saves is typically hours or days,
                # so pre-shutdown being older than last-session is normal and
                # must NOT trigger a switch to the older pre-shutdown file.
                if (-not $usePreShutdown -and (Test-Path -LiteralPath $LastSessionFile)) {
                    $lastSnap = Get-Content -LiteralPath $LastSessionFile -Raw | ConvertFrom-Json
                    if ($preSnap.capturedAt -and $lastSnap.capturedAt) {
                        $preTime = [DateTimeOffset]::Parse($preSnap.capturedAt)
                        $lastTime = [DateTimeOffset]::Parse($lastSnap.capturedAt)
                        if ($preTime -lt $lastTime) {
                            $snapGap = $lastTime - $preTime
                            if ($snapGap.TotalMinutes -le 10) {
                                $usePreShutdown = $true
                            }
                        }
                    }
                }
            }
            catch { }

            if ($usePreShutdown) {
                $Path = $PreShutdownFile
                Write-SoftInfo "Restoring from pre-shutdown snapshot (previous session)."
            }
            else {
                $Path = $LastSessionFile
            }
        }
        else {
            $Path = $LastSessionFile
        }
    }

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Snapshot not found: $Path"
    }

    $snapshot = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
    $opened = New-Object System.Collections.Generic.HashSet[string]

    # Heavy app launches are deferred to phase 2 so they don't all start at
    # once and cause a memory spike. Each heavy launch is followed by a delay.
    $heavyLaunches = New-Object System.Collections.ArrayList

    # --- Phase 1: Quick-launch light apps, defer heavy apps ---

    # Explorer folders (always heavy -> deferred to phase 2)
    foreach ($folder in @($snapshot.documents.explorerFolders)) {
        if ($folder.path -and (Test-Path -LiteralPath $folder.path)) {
            [void]$opened.Add(("folder::{0}" -f $folder.path.ToLowerInvariant()))
            [void]$heavyLaunches.Add([pscustomobject]@{
                Kind         = "folder"
                TargetPath   = $folder.path
                ArgumentList = "`"$($folder.path)`""
                Label        = "Folder:   $($folder.path)"
            })
        }
    }

    # Office documents (Word/Excel/PowerPoint — treat as light, launch now)
    foreach ($doc in @($snapshot.documents.officeDocuments)) {
        if ($doc.path -and (Test-Path -LiteralPath $doc.path)) {
            if (Start-RestorePath $doc.path) {
                [void]$opened.Add(("file::{0}" -f $doc.path.ToLowerInvariant()))
            }
        }
    }

    # Files from command line (PDFs/e-books are heavy -> deferred)
    foreach ($file in @($snapshot.documents.filesFromCommandLine)) {
        if ($file.path -and (Test-Path -LiteralPath $file.path)) {
            $key = "file::{0}" -f $file.path.ToLowerInvariant()
            if (-not $opened.Contains($key)) {
                if (Test-IsHeavyFile -FilePath $file.path) {
                    [void]$opened.Add($key)
                    [void]$heavyLaunches.Add([pscustomobject]@{
                        Kind         = "file"
                        TargetPath   = $file.path
                        ArgumentList = $null
                        Label        = "Document: $($file.path)"
                    })
                }
                elseif (Start-RestorePath $file.path) {
                    [void]$opened.Add($key)
                }
            }
        }
    }

    # Generic apps (browsers & PDF readers are heavy -> deferred)
    if (-not $NoGenericApps) {
        $startedApps = New-Object System.Collections.Generic.HashSet[string]
        $skipGeneric = @("explorer.exe", "powershell.exe", "pwsh.exe", "cmd.exe", "conhost.exe")

        foreach ($app in @($snapshot.apps)) {
            if ([string]::IsNullOrWhiteSpace($app.executablePath)) {
                continue
            }
            if ($skipGeneric -contains $app.processName) {
                continue
            }
            if (-not (Test-Path -LiteralPath $app.executablePath)) {
                continue
            }

            $key = $app.executablePath.ToLowerInvariant()
            if ($startedApps.Contains($key)) {
                continue
            }
            [void]$startedApps.Add($key)

            if (Test-IsHeavyApp -ProcessName $app.processName) {
                [void]$heavyLaunches.Add([pscustomobject]@{
                    Kind         = "app"
                    TargetPath   = $app.executablePath
                    ArgumentList = $null
                    Label        = "App:      $($app.processName)"
                })
            }
            else {
                try {
                    Start-Process -FilePath $app.executablePath
                }
                catch {
                    continue
                }
            }
        }
    }

    # --- Phase 2: Launch heavy apps with delay between each ---
    if ($heavyLaunches.Count -gt 0) {
        $delay = $HeavyAppDelay
        if ($delay -lt 0) { $delay = 0 }

        Write-SoftInfo ("Phase 1 done. Launching {0} heavy app(s) with {1}s delay between each..." -f $heavyLaunches.Count, $delay)

        $idx = 0
        foreach ($item in $heavyLaunches) {
            $idx++
            Write-SoftInfo ("  [{0}/{1}] {2}" -f $idx, $heavyLaunches.Count, $item.Label)

            try {
                if ($item.Kind -eq "folder") {
                    Start-Process -FilePath "explorer.exe" -ArgumentList $item.ArgumentList
                }
                elseif ($item.Kind -eq "file") {
                    Invoke-Item -LiteralPath $item.TargetPath
                }
                elseif ($item.Kind -eq "app") {
                    Start-Process -FilePath $item.TargetPath
                }
            }
            catch {
                Write-SoftInfo ("    WARNING: launch failed: {0}" -f $_.Exception.Message)
            }

            # Wait before the next heavy launch (skip after the last one).
            if ($idx -lt $heavyLaunches.Count -and $delay -gt 0) {
                Write-SoftInfo ("    waiting {0}s ..." -f $delay)
                Start-Sleep -Seconds $delay
            }
        }
    }

    Write-SoftInfo "Restore requested from: $Path"
}

function Start-WatchMode {
    param([int]$Seconds)

    if ($Seconds -lt 15) {
        $Seconds = 15
    }

    Write-SoftInfo "Watch mode started. Saving every $Seconds seconds."
    while ($true) {
        try {
            Save-SessionSnapshot -AutoSnapshot
        }
        catch {
            Write-SoftInfo "Snapshot failed: $($_.Exception.Message)"
        }

        Start-Sleep -Seconds $Seconds
    }
}

function Install-AutoSnapshot {
    param([int]$Seconds)

    Ensure-Directory $BaseDir
    $scriptPath = $PSCommandPath
    if ([string]::IsNullOrWhiteSpace($scriptPath)) {
        throw "Cannot locate this script path."
    }

    $psExe = (Get-Process -Id $PID).Path
    if (-not $psExe) {
        $psExe = "powershell.exe"
    }

    $argument = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`" watch -IntervalSeconds $Seconds"

    try {
        $action = New-ScheduledTaskAction -Execute $psExe -Argument $argument
        $trigger = New-ScheduledTaskTrigger -AtLogOn
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Days 365)
        $task = New-ScheduledTask -Action $action -Trigger $trigger -Settings $settings

        Register-ScheduledTask -TaskName $TaskName -InputObject $task -Force | Out-Null
        Write-SoftInfo "Installed logon auto snapshot task: $TaskName"
    }
    catch {
        $startupDir = [Environment]::GetFolderPath("Startup")
        $shortcutPath = Join-Path $startupDir "SoftOneTab Auto Snapshot.lnk"
        $shell = New-Object -ComObject WScript.Shell
        $shortcut = $shell.CreateShortcut($shortcutPath)
        $shortcut.TargetPath = $psExe
        $shortcut.Arguments = $argument
        $shortcut.WorkingDirectory = Split-Path -Parent $scriptPath
        $shortcut.WindowStyle = 7
        $shortcut.Description = "SoftOneTab background session snapshot"
        $shortcut.Save()
        Write-SoftInfo "Scheduled task failed, installed startup shortcut instead: $shortcutPath"
    }

    Write-SoftInfo "It records the current desktop every $Seconds seconds."
}

function Uninstall-AutoSnapshot {
    $existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($existing) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-SoftInfo "Removed task: $TaskName"
    }
    else {
        Write-SoftInfo "Task not found: $TaskName"
    }

    $startupShortcut = Join-Path ([Environment]::GetFolderPath("Startup")) "SoftOneTab Auto Snapshot.lnk"
    if (Test-Path -LiteralPath $startupShortcut) {
        Remove-Item -LiteralPath $startupShortcut -Force
        Write-SoftInfo "Removed startup shortcut: $startupShortcut"
    }
}

function Write-SnapshotDetails {
    param($Snapshot, [string]$HeaderColor = "Cyan")

    # Browser tabs
    $browserTabs = @($Snapshot.browserTabs)
    if ($browserTabs.Count -gt 0) {
        Write-Host ""
        Write-Host "=== Browser Tabs ($($browserTabs.Count) tabs) ===" -ForegroundColor $HeaderColor
        $byBrowser = $browserTabs | Group-Object browser
        foreach ($grp in $byBrowser) {
            $browserName = switch ($grp.Name) {
                "msedge.exe" { "Edge" }
                "chrome.exe" { "Chrome" }
                "brave.exe" { "Brave" }
                "firefox.exe" { "Firefox" }
                "vivaldi.exe" { "Vivaldi" }
                "opera.exe" { "Opera" }
                default { $grp.Name }
            }
            Write-Host "  [$browserName] ($($grp.Count) tabs):" -ForegroundColor Yellow
            $idx = 1
            foreach ($tab in $grp.Group) {
                Write-Host ("    {0}. {1}" -f $idx, $tab.tabTitle)
                $idx++
            }
        }
    }

    # PDF documents
    $pdfDocs = @($Snapshot.documents.pdfDocuments)
    if ($pdfDocs.Count -gt 0) {
        Write-Host ""
        Write-Host "=== PDF Documents ($($pdfDocs.Count)) ===" -ForegroundColor $HeaderColor
        foreach ($pdf in $pdfDocs) {
            $readerName = if ($pdf.reader) { $pdf.reader } else { "unknown" }
            $name = if ($pdf.fileName) { $pdf.fileName } else { "(unknown)" }
            Write-Host ("  [{0}] {1}" -f $readerName, $name)
            if ($pdf.fullPath -and $pdf.fileName -and ($pdf.fullPath -notlike "*$($pdf.fileName)")) {
                Write-Host ("        (launched with: {0})" -f $pdf.fullPath) -ForegroundColor DarkGray
            } elseif (-not $pdf.fileName -and $pdf.fullPath) {
                Write-Host ("        {0}" -f $pdf.fullPath) -ForegroundColor DarkGray
            }
        }
    }

    # Windows
    Write-Host ""
    Write-Host "=== Windows ===" -ForegroundColor $HeaderColor
    foreach ($app in @($Snapshot.apps)) {
        $name = if ($app.processName) { $app.processName } else { "(unknown)" }
        foreach ($title in @($app.titles)) {
            Write-Host ("  [{0}] {1}" -f $name, $title)
        }
    }

    # Explorer folders
    $folders = @($Snapshot.documents.explorerFolders)
    if ($folders.Count -gt 0) {
        Write-Host ""
        Write-Host "=== Explorer Folders ===" -ForegroundColor $HeaderColor
        foreach ($folder in $folders) {
            Write-Host ("  {0}" -f $folder.path)
        }
    }

    # Office documents
    $docs = @($Snapshot.documents.officeDocuments)
    if ($docs.Count -gt 0) {
        Write-Host ""
        Write-Host "=== Office Documents ===" -ForegroundColor $HeaderColor
        foreach ($doc in $docs) {
            Write-Host ("  [{0}] {1}" -f $doc.kind, $doc.path)
        }
    }

    # Files from command line
    $cmdFiles = @($Snapshot.documents.filesFromCommandLine)
    if ($cmdFiles.Count -gt 0) {
        Write-Host ""
        Write-Host "=== Files from Command Line ===" -ForegroundColor $HeaderColor
        foreach ($file in $cmdFiles) {
            Write-Host ("  {0}" -f $file.path)
        }
    }
}

function Show-Status {
    Write-SoftInfo "Data directory: $BaseDir"

    # --- Pre-shutdown snapshot (from previous boot session) ---
    if (Test-Path -LiteralPath $PreShutdownFile) {
        try {
            $preSnap = Get-Content -LiteralPath $PreShutdownFile -Raw | ConvertFrom-Json
            Write-Host ""
            Write-Host "=== Pre-Shutdown Snapshot (previous session) ===" -ForegroundColor Magenta
            Write-Host ("  Captured: {0}" -f $preSnap.capturedAt) -ForegroundColor White
            if ($preSnap.bootTime) {
                Write-Host ("  Boot time: {0}" -f $preSnap.bootTime) -ForegroundColor DarkGray
            }
            Write-Host ("  Windows: {0}; apps: {1}; browser tabs: {2}; PDF docs: {3}; folders: {4}" -f `
                @($preSnap.windows).Count,
                @($preSnap.apps).Count,
                @($preSnap.browserTabs).Count,
                @($preSnap.documents.pdfDocuments).Count,
                @($preSnap.documents.explorerFolders).Count)
            Write-Host ("  >> Use '恢复上次页面.bat' to restore this session.") -ForegroundColor Green

            # Show details for pre-shutdown snapshot
            Write-SnapshotDetails -Snapshot $preSnap -HeaderColor Magenta
        }
        catch {
            Write-SoftInfo "WARNING: Could not read pre-shutdown snapshot."
        }
    }

    # --- Current session snapshot ---
    if (Test-Path -LiteralPath $LastSessionFile) {
        $snapshot = Get-Content -LiteralPath $LastSessionFile -Raw | ConvertFrom-Json
        Write-Host ""
        Write-Host "=== Current Session Snapshot ===" -ForegroundColor Cyan
        Write-SoftInfo "Last snapshot: $($snapshot.capturedAt)"
        if ($snapshot.bootTime) {
            Write-SoftInfo "Boot time: $($snapshot.bootTime)"
        }
        Write-SoftInfo ("Windows: {0}; apps: {1}; explorer folders: {2}; office documents: {3}" -f `
            @($snapshot.windows).Count,
            @($snapshot.apps).Count,
            @($snapshot.documents.explorerFolders).Count,
            @($snapshot.documents.officeDocuments).Count)

        Write-SnapshotDetails -Snapshot $snapshot -HeaderColor Cyan
    }
    else {
        Write-SoftInfo "No last-session snapshot yet."
    }

    # --- Archive summary ---
    if (Test-Path -LiteralPath $SessionsDir) {
        $dailyDirs = Get-ChildItem -LiteralPath $SessionsDir -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending
        if ($dailyDirs) {
            $dirCount = @($dailyDirs).Count
            $latestDir = @($dailyDirs)[0].Name
            $latestFiles = @(Get-ChildItem -LiteralPath (@($dailyDirs)[0].FullName) -Filter "*.json" -ErrorAction SilentlyContinue)
            Write-Host ""
            Write-Host "=== Archives ===" -ForegroundColor Cyan
            Write-Host ("  {0} day(s) of archives, latest: {1} ({2} snapshots)" -f $dirCount, $latestDir, $latestFiles.Count)
            # Show last 5 days
            $shown = 0
            foreach ($dir in $dailyDirs) {
                if ($shown -ge 5) { break }
                $files = @(Get-ChildItem -LiteralPath $dir.FullName -Filter "*.json" -ErrorAction SilentlyContinue)
                Write-Host ("  {0}: {1} snapshots" -f $dir.Name, $files.Count) -ForegroundColor DarkGray
                $shown++
            }
            if ($dirCount -gt 5) {
                Write-Host "  ..." -ForegroundColor DarkGray
            }
        }
    }

    Write-Host ""
    $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($task) {
        Write-SoftInfo "Auto snapshot task: $($task.State)"
    }
    else {
        Write-SoftInfo "Auto snapshot task: not installed"
    }
}

switch ($Command) {
    "save" {
        Save-SessionSnapshot
    }
    "restore" {
        if ($Pick) {
            $selectedPath = Select-SnapshotInteractively
            if ($selectedPath) {
                Restore-SessionSnapshot -Path $selectedPath -HeavyAppDelay $HeavyAppDelaySeconds
            }
        }
        elseif ($Date) {
            $selectedPath = Find-SnapshotByDate -DateStr $Date
            if ($selectedPath) {
                Restore-SessionSnapshot -Path $selectedPath -HeavyAppDelay $HeavyAppDelaySeconds
            }
        }
        elseif ($Days -ge 0) {
            $targetDate = (Get-Date).AddDays(-$Days).ToString("yyyy-MM-dd")
            $selectedPath = Find-SnapshotByDate -DateStr $targetDate
            if ($selectedPath) {
                Restore-SessionSnapshot -Path $selectedPath -HeavyAppDelay $HeavyAppDelaySeconds
            }
        }
        else {
            Restore-SessionSnapshot -Path $SessionPath -HeavyAppDelay $HeavyAppDelaySeconds
        }
    }
    "watch" {
        Start-WatchMode -Seconds $IntervalSeconds
    }
    "install" {
        Install-AutoSnapshot -Seconds $IntervalSeconds
    }
    "uninstall" {
        Uninstall-AutoSnapshot
    }
    "status" {
        Show-Status
    }
}
