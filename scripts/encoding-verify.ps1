# encoding-verify.ps1
param(
    [string]$Path = (Join-Path $PSScriptRoot ".."),
    [switch]$Fix
)

$errors = @()
$extensions = @("*.astro", "*.ts", "*.json", "*.md")

foreach ($ext in $extensions) {
    Get-ChildItem -Path $Path -Recurse -Filter $ext | Where-Object {
        $_.FullName -notmatch "\\node_modules\\" -and
        $_.FullName -notmatch "\\.git\\" -and
        $_.FullName -notmatch "\\dist\\"
    } | ForEach-Object {
        $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
        $text = [System.Text.Encoding]::UTF8.GetString($bytes)
        
        if ($bytes.Length -gt 100) {
            $hasRussianInput = $text -match "[\u0410-\u044F\u0451\u0401]{2,}"
            if (-not $hasRussianInput) {
                $possibleRussianContent = $text -match "[\u0410-\u044F\u0451\u0401]"
                if ($possibleRussianContent) {
                    $errors += "$($_.FullName): broken encoding (single Cyrillic chars without words)"
                    if ($Fix) {
                        try {
                            $fixed = [System.Text.Encoding]::GetEncoding(1251).GetString($bytes)
                            if ($fixed -match "[\u0410-\u044F\u0451\u0401]{4,}") {
                                [System.IO.File]::WriteAllText($_.FullName, $fixed, [System.Text.Encoding]::UTF8)
                                Write-Host "  FIXED: $($_.Name) (1251->UTF8)"
                            }
                        } catch {}
                    }
                }
            }
        }
        
        if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
            Write-Host "  WARN: $($_.Name) has BOM" -ForegroundColor Yellow
        }
    }
}

if ($errors.Count -gt 0) {
    Write-Host "=== ENCODING ERRORS ($($errors.Count)) ===" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    exit 1
} else {
    $count = (Get-ChildItem -Path $Path -Recurse -Include $extensions | Where-Object {
        $_.FullName -notmatch "\\node_modules\\" -and $_.FullName -notmatch "\\.git\\" -and $_.FullName -notmatch "\\dist\\"
    }).Count
    Write-Host "OK: $count files checked, no encoding errors" -ForegroundColor Green
    exit 0
}