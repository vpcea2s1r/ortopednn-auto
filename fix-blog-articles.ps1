$filePath = 'C:\opencode\ortopednn-auto\data\blog-articles.ts'
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
$lines = $content -split "`r?`n"

# Find the junk section: starts at line 232 (0-indexed: 231) which is "];"
# Then lines 233-248 are junk
# Then line 249 is another "];"
# We want to keep line 232 "];" and remove 233-249, then keep 250+

# Build new file content
$newLines = @()
for ($i = 0; $i -lt 232; $i++) {
    $newLines += $lines[$i]
}
# Skip lines 232 through 249 (indices 232-249), which is the junk + extra "];"
for ($i = 250; $i -lt $lines.Count; $i++) {
    $newLines += $lines[$i]
}

$newContent = $newLines -join "`r`n"
[System.IO.File]::WriteAllText($filePath, $newContent, [System.Text.Encoding]::UTF8)
Write-Host "Fixed. New line count: $($newLines.Count)"
