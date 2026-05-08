# chrome-cache-cleanup.ps1
# Clears Chrome Cache and Snapshots when C: free space drops below threshold.
# Skips cleanup if Chrome is currently running.
# Designed to run daily via Windows Task Scheduler.

$threshold_gb    = 8       # Trigger cleanup if C: free space is below this (GB)
$log_dir         = "D:\CLAUDE\Work\shared\logs"
$log_file        = "$log_dir\chrome-cache-cleanup.log"
$chrome_exe      = "chrome"

$profile_dirs = @(
    "Default",
    "Guest Profile",
    "Profile 10",
    "Profile 20",
    "Profile 23",
    "Profile 61",
    "Profile 114"
)

$chrome_user_data = "$env:LOCALAPPDATA\Google\Chrome\User Data"

function Write-Log {
    param([string]$msg)
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    Write-Host $line
    Add-Content -Path $log_file -Value $line
}

# Ensure log dir exists
if (-not (Test-Path $log_dir)) {
    New-Item -ItemType Directory -Path $log_dir -Force | Out-Null
}

Write-Log "--- Chrome cache cleanup started ---"

# Check if Chrome is running
$chrome_running = Get-Process -Name $chrome_exe -ErrorAction SilentlyContinue
if ($chrome_running) {
    Write-Log "Chrome is open. Skipping cleanup to avoid file lock issues."
    Write-Log "--- Done ---"
    exit 0
}

# Check C: free space
$drive = Get-PSDrive -Name C
$free_gb = [math]::Round($drive.Free / 1GB, 2)
Write-Log "C: free space: ${free_gb}GB (threshold: ${threshold_gb}GB)"

if ($free_gb -ge $threshold_gb) {
    Write-Log "C: has enough free space. No cleanup needed."
    Write-Log "--- Done ---"
    exit 0
}

Write-Log "Below threshold. Starting cleanup..."

$total_freed_mb = 0

# Delete Cache folders across all profiles
foreach ($profile in $profile_dirs) {
    $cache_path = "$chrome_user_data\$profile\Cache"
    if (Test-Path $cache_path) {
        $size_mb = [math]::Round((Get-ChildItem $cache_path -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB, 1)
        Remove-Item -Path $cache_path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Log "Deleted Cache for '$profile': ${size_mb}MB"
        $total_freed_mb += $size_mb
    }
}

# Delete Snapshots
$snapshots_path = "$chrome_user_data\Snapshots"
if (Test-Path $snapshots_path) {
    $size_mb = [math]::Round((Get-ChildItem $snapshots_path -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB, 1)
    Remove-Item -Path $snapshots_path -Recurse -Force -ErrorAction SilentlyContinue
    Write-Log "Deleted Snapshots: ${size_mb}MB"
    $total_freed_mb += $size_mb
}

$total_freed_gb = [math]::Round($total_freed_mb / 1024, 2)
Write-Log "Total freed: ${total_freed_mb}MB (${total_freed_gb}GB)"
Write-Log "--- Done ---"
