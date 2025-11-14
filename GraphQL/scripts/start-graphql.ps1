param(
    [int]$Preferred = 8000,
    [int]$Fallback = 8001
)

Write-Host "Comprobando puerto $Preferred..." -ForegroundColor Cyan
$test = Test-NetConnection -ComputerName 127.0.0.1 -Port $Preferred -WarningAction SilentlyContinue

if ($test -and $test.TcpTestSucceeded) {
    Write-Host "Puerto $Preferred en uso (PID detectado). Iniciando en $Fallback." -ForegroundColor Yellow
    # Cambiar al directorio raíz del repositorio para que Python encuentre el paquete `GraphQL`
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $repoRoot = Resolve-Path (Join-Path $scriptDir '..\..')
    Push-Location $repoRoot
    Write-Host "Directorio actual: $(Get-Location)" -ForegroundColor DarkCyan
    & python -m uvicorn GraphQL.app.main:app --host 127.0.0.1 --port $Fallback --reload
    Pop-Location
} else {
    Write-Host "Puerto $Preferred libre. Iniciando en $Preferred." -ForegroundColor Green
    # Cambiar al directorio raíz del repositorio para que Python encuentre el paquete `GraphQL`
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $repoRoot = Resolve-Path (Join-Path $scriptDir '..\..')
    Push-Location $repoRoot
    Write-Host "Directorio actual: $(Get-Location)" -ForegroundColor DarkCyan
    & python -m uvicorn GraphQL.app.main:app --host 127.0.0.1 --port $Preferred --reload
    Pop-Location
}
