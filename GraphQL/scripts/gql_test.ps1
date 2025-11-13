$url = 'http://127.0.0.1:8000/graphql'
$body = @{ query = "{ salesByClient { clientId clientName total } }" } | ConvertTo-Json
Write-Host "POST $url -> body: $body"
try {
    $resp = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 15
    $resp | ConvertTo-Json -Depth 5 | Out-File -FilePath "$PSScriptRoot\gql_salesByClient.json" -Encoding utf8
    Write-Host "Saved response to $PSScriptRoot\gql_salesByClient.json"
} catch {
    Write-Host 'ERROR:' $_.Exception.Message
    if ($_.Exception.Response) {
        $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host 'ResponseBody:'
        Write-Host $sr.ReadToEnd()
    }
    exit 1
}
