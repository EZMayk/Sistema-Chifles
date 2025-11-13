$args = @('-m','uvicorn','GraphQL.app.main:app','--host','127.0.0.1','--port','8000','--log-level','info')
Write-Host "Starting uvicorn via python with args: $args"
$proc = Start-Process -FilePath (Get-Command python).Source -ArgumentList $args -PassThru -WindowStyle Hidden
Write-Host "Started uvicorn PID=$($proc.Id)"
$proc.Id | Out-File -FilePath "$PSScriptRoot\uvicorn.pid" -Encoding ascii
Start-Sleep -Seconds 1
Write-Host "Process status:"; Get-Process -Id $proc.Id | Select-Object Id, ProcessName, StartTime | Format-List
