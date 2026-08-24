# delete-files.ps1 — Delete files from GitHub repo via Content API
# Usage: .\scripts\delete-files.ps1 -Paths "src/pages/checkup/old.astro", "data/temp.json"
# Or pipe: @("file1","file2") | .\scripts\delete-files.ps1 -Paths $_

param(
    [Parameter(Mandatory=$true)]
    [string[]]$Paths,
    
    [string]$Message = "chore: delete files",
    
    [string]$Owner = "vpcea2s1r",
    
    [string]$Repo = "ortopednn-auto"
)

# Load token from .env.local
$envFile = Join-Path $PSScriptRoot "..\.env.local"
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    if ($content -match 'GH_PAT=(.+)') {
        $token = $Matches[1].Trim()
    }
}
if (-not $token) { $token = $env:GH_PAT }
if (-not $token) { Write-Error "No GH_PAT found. Set GH_PAT env var or put it in .env.local"; exit 1 }

$headers = @{ Authorization = "token $token"; "User-Agent" = "opencode"; Accept = "application/vnd.github.v3+json" }
$deleted = 0; $failed = 0

foreach ($path in $Paths) {
    try {
        # Get file SHA
        $file = Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$Repo/contents/$path" -Headers $headers -Method Get
        $sha = $file.sha
        
        # Delete
        $body = @{ message = "$Message — $path"; sha = $sha } | ConvertTo-Json
        Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$Repo/contents/$path" -Headers $headers -Method Delete -Body $body -ContentType "application/json" | Out-Null
        $deleted++
        Write-Host "OK: $path" -ForegroundColor Green
    } catch {
        $failed++
        Write-Host "FAIL: $path — $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nDone: $deleted deleted, $failed failed" -ForegroundColor Cyan