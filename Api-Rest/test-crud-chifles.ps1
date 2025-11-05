# test-crud-chifles.ps1
# Script para probar CRUD de la API "chifles" (NestJS).
# Requiere: pwsh (PowerShell Core). Ejecutar con la API corriendo en http://localhost:3000

$base = 'http://localhost:3000/chifles'

function PostJson($path, $obj) {
  $json = $obj | ConvertTo-Json -Depth 10
  try {
    return Invoke-RestMethod -Method Post -Uri "$base/$path" -ContentType 'application/json' -Body $json
  } catch {
    Write-Host "POST $path falló:" -ForegroundColor Red
    if ($_.Exception.Response) { Write-Host $_.Exception.Response.Content.ReadAsStringAsync().Result }
    throw $_
  }
}

function PutJson($path, $obj) {
  $json = $obj | ConvertTo-Json -Depth 10
  try {
    return Invoke-RestMethod -Method Put -Uri "$base/$path" -ContentType 'application/json' -Body $json
  } catch {
    Write-Host "PUT $path falló:" -ForegroundColor Red
    if ($_.Exception.Response) { Write-Host $_.Exception.Response.Content.ReadAsStringAsync().Result }
    throw $_
  }
}

function GetJson($path) {
  try {
    return Invoke-RestMethod -Method Get -Uri "$base/$path"
  } catch {
    Write-Host "GET $path falló:" -ForegroundColor Yellow
    if ($_.Exception.Response) { Write-Host $_.Exception.Response.Content.ReadAsStringAsync().Result }
    return $null
  }
}

function DeleteJson($path) {
  try {
    return Invoke-RestMethod -Method Delete -Uri "$base/$path"
  } catch {
    Write-Host "DELETE $path falló:" -ForegroundColor Yellow
    if ($_.Exception.Response) { Write-Host $_.Exception.Response.Content.ReadAsStringAsync().Result }
    return $null
  }
}

Write-Host "Base API: $base" -ForegroundColor Cyan

# 1) Crear cliente
$clienteBody = @{
  nombre = "María"
  apellido = "González"
  dni = "78451236"
  telefono = "+5493412345678"
  email = "maria.gonzalez@example.com"
}
$cliente = PostJson "clientes" $clienteBody
$clienteId = $cliente.id
Write-Host "Cliente creado id=$clienteId"

# 2) Crear producto A
$productoA = @{
  nombre = "Chifle Tradicional"
  descripcion = "Chifle salado artesanal, paquete 500g"
  precio = 450.50
  categoria = "Snack"
  unidad_medida = "g"
  estado = "activo"
}
$prodA = PostJson "productos" $productoA
$productoAId = $prodA.id
Write-Host "Producto A id=$productoAId"

# 3) Crear insumo
$insumo = @{
  nombre = "Aceite vegetal"
  unidad_medida = "litro"
  stock = 120
  estado = "disponible"
}
$ins = PostJson "insumos" $insumo
$insumoId = $ins.id
Write-Host "Insumo id=$insumoId"

# 4) Crear producto-insumo (relación)
$prodInsumoBody = @{
  productoId = $productoAId
  insumoId = $insumoId
  cantidad_necesaria = 0.02
}
$prodInsumo = PostJson "productos-insumos" $prodInsumoBody
$prodInsumoId = $prodInsumo.id
Write-Host "Producto-Insumo id=$prodInsumoId"

# 5) Crear orden de producción
$ordenBody = @{
  fecha_inicio = "2025-11-10T08:00:00Z"
  fecha_fin = "2025-11-12T18:00:00Z"
  estado = "planificada"
  productoId = $productoAId
  cantidad_producir = 2000
}
$orden = PostJson "ordenes-produccion" $ordenBody
$ordenId = $orden.id
Write-Host "Orden de producción id=$ordenId"

# 6) Crear pedido con detalles (controlador 'pedidos' que acepta detalles)
$detalle1 = @{
  productoId = $productoAId
  cantidad_solicitada = 2
  precio_unitario = 450.5
  subtotal = 901.0
}
$pedidoBody = @{
  fecha = "2025-11-10T10:30:00Z"
  total = 901.0
  estado = "pendiente"
  clienteId = $clienteId
  detalles = @($detalle1)
}
$pedido = PostJson "pedidos" $pedidoBody
if ($pedido -ne $null -and $pedido.id) { $pedidoId = $pedido.id } else { $pedidoId = $pedido.id }
Write-Host "Pedido creado id=$pedidoId"

# 7) Crear factura asociada al pedido
$facturaBody = @{
  fecha_emision = "2025-11-10T11:00:00Z"
  total = 901.0
  estado_pago = "pendiente"
  clienteId = $clienteId
  pedidoId = $pedidoId
}
$factura = PostJson "facturas" $facturaBody
$facturaId = $factura.id
Write-Host "Factura id=$facturaId"

# Verificaciones GET
Write-Host ""
Write-Host "-- Verificaciones --" -ForegroundColor Cyan
GetJson "pedidos/$pedidoId" | Write-Host
GetJson "detalles-pedido/pedido/$pedidoId" | Write-Host

Write-Host "" 
Write-Host "Script finalizado." -ForegroundColor Green
