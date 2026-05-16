# OpenSERP checker for ortopednn.ru
# Проверяет позиции сайта по целевым запросам

$queries = @(
    "болит зуб под коронкой",
    "коронка на зуб цена нижний новгород",
    "бюгельный протез цена",
    "металлокерамическая коронка цена",
    "циркониевая коронка цена",
    "съемный протез цена нижний новгород",
    "полный съемный протез цена",
    "протезирование зубов нижний новгород цены",
    "нейлоновый протез отзывы",
    "акриловый протез зубов",
    "мостовидный протез цена",
    "какой протез лучше выбрать",
    "выпала коронка что делать"
)

$api = "http://127.0.0.1:7000"
$site = "ortopednn.ru"
$report = @()

Write-Host "=== OpenSERP Check: $site ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm')`n"

foreach ($q in $queries) {
    try {
        $resp = Invoke-RestMethod -Uri "$api/google/search?text=$([System.Web.HttpUtility]::UrlEncode($q))&limit=20" -TimeoutSec 30 -ErrorAction Stop
        $found = $resp.results | Where-Object { $_.url -like "*$site*" }
        if ($found) {
            $rank = $found | Select-Object -First 1
            Write-Host "[$q] → позиция $($rank.rank) ($($rank.url))" -ForegroundColor Green
            $report += [PSCustomObject]@{ Query = $q; Engine = "Google"; Position = $rank.rank; Url = $rank.url }
        } else {
            Write-Host "[$q] → не в топ-20 Google" -ForegroundColor Yellow
            $report += [PSCustomObject]@{ Query = $q; Engine = "Google"; Position = ">20"; Url = "" }
        }
    } catch {
        Write-Host "[$q] → ошибка: $_" -ForegroundColor Red
        $report += [PSCustomObject]@{ Query = $q; Engine = "Google"; Position = "ERROR"; Url = $_ }
    }

    try {
        $resp = Invoke-RestMethod -Uri "$api/yandex/search?text=$([System.Web.HttpUtility]::UrlEncode($q))&limit=20" -TimeoutSec 30 -ErrorAction Stop
        $found = $resp.results | Where-Object { $_.url -like "*$site*" }
        if ($found) {
            $rank = $found | Select-Object -First 1
            Write-Host "[$q] → Yandex: $($rank.rank) ($($rank.url))" -ForegroundColor Green
            $report += [PSCustomObject]@{ Query = $q; Engine = "Yandex"; Position = $rank.rank; Url = $rank.url }
        } else {
            Write-Host "[$q] → Yandex: не в топ-20" -ForegroundColor Yellow
            $report += [PSCustomObject]@{ Query = $q; Engine = "Yandex"; Position = ">20"; Url = "" }
        }
    } catch {
        Write-Host "[$q] → Yandex ошибка: $_" -ForegroundColor Red
    }
}

$report | Export-Csv -Path "reports/report_$(Get-Date -Format 'yyyyMMdd_HHmm').csv" -NoTypeInformation -Encoding UTF8
Write-Host "`nReport saved" -ForegroundColor Cyan
$report | Format-Table -AutoSize