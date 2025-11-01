# E2E runner (PowerShell) - flujo: producto -> insumo -> producto-insumo -> orden -> verificar detalles
$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3000/chifles'

Write-Host "Comenzando E2E runner contra $base";

function PostJson($url, $obj) {
    $body = $obj | ConvertTo-Json
    return Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 30
}

# 1) Crear producto
Write-Host 'Creando producto...'
$prod = PostJson "$base/productos" @{ nombre='Chifles Tradicional'; descripcion='Chifles fritos salados - bolsa 200g'; precio=3.5; categoria='snack'; unidad_medida='bolsa' }
Write-Host "Producto creado id=$($prod.id)"

# 2) Crear insumo
Write-Host 'Creando insumo...'
$ins = PostJson "$base/insumos" @{ nombre='Plátano verde'; descripcion='Plátano para fritura - kg'; unidad_medida='kg'; stock=100; estado='disponible' }
Write-Host "Insumo creado id=$($ins.id)"

# 3) Crear producto-insumo (receta)
Write-Host 'Creando producto-insumo (receta)...'
$pi = PostJson "$base/productos-insumos" @{ productoId = $prod.id; insumoId = $ins.id; cantidad_necesaria = 0.5 }
Write-Host "ProductoInsumo creado id=$($pi.id)"

# 4) Crear orden de producción
Write-Host 'Creando orden de produccion...'
$orden = PostJson "$base/ordenes-produccion" @{ fecha_inicio='2025-11-11T08:00:00Z'; fecha_fin='2025-11-11T12:00:00Z'; estado='planificada'; productoId = $prod.id; cantidad_producir = 10 }
Write-Host "Orden creada id=$($orden.id)"

# 5) Verificar detalles
if ($orden.detalles -and $orden.detalles.Length -gt 0) {
    Write-Host "Detalles encontrados: $($orden.detalles.Length)"
    $detalle = $orden.detalles | Where-Object { $_.insumoId -eq $ins.id }
    if ($null -eq $detalle) {
        Write-Host 'ERROR: no se encontró detalle para el insumo creado' ; exit 2
    }
    $cant = [double]::Parse($detalle.cantidad_utilizada, [System.Globalization.CultureInfo]::InvariantCulture)
    Write-Host "Cantidad utilizada en detalle: $cant"
    if ([math]::Abs($cant - (0.5 * 10)) -gt 0.0001) {
        Write-Host 'ERROR: cantidad_utilizada no coincide con la receta * cantidad_producir' ; exit 3
    }
    Write-Host 'E2E OK: detalle generado correctamente.'
    exit 0
} else {
    Write-Host 'ERROR: no se generaron detalles en la orden' ; exit 4
}
