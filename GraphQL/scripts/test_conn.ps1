Write-Host 'Testeando GET http://localhost:3000/chifles/productos'
try {
    $r = Invoke-RestMethod -Uri 'http://localhost:3000/chifles/productos' -Method Get -TimeoutSec 10
    $r | ConvertTo-Json -Depth 5 | Out-File -FilePath "$PSScriptRoot\last_products.json" -Encoding utf8
    Write-Host "OK, response saved to $PSScriptRoot\last_products.json"
} catch {
    Write-Host 'ERROR:' $_.Exception.Message
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $sr = New-Object System.IO.StreamReader($stream)
        Write-Host 'ResponseBody:'
        Write-Host $sr.ReadToEnd()
    }
    exit 1
}
