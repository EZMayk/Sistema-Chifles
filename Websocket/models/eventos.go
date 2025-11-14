package models

// Eventos de Productos
const (
	ProductCreated = "product.created"
	ProductUpdated = "product.updated"
	ProductDeleted = "product.deleted"
	ProductEnabled  = "product.enabled"
	ProductDisabled = "product.disabled"

)

// Eventos de Producto-Insumo
const (
	ProductInsumoCreated = "recipe.created"
	ProductInsumoUpdated = "recipe.updated"
	ProductInsumoDeleted = "recipe.deleted"
)

// Eventos de Insumos
const (
	SupplyCreated = "supply.restocked"
	SupplyUpdated = "supply.updated"
	SupplyDeleted = "supply.deleted"
	SupplyLow     = "supply.low"
)

// Eventos de Pedidos
const (
	OrderCreated    = "order.created"
	OrderUpdated    = "order.updated"
	OrderCompleted  = "order.completed"
	OrderCancelled  = "order.cancelled"
)

// Eventos de Órdenes de Producción
const (
	ProductionStarted  = "production.started"
	ProductionCancelled = "production.cancelled"
	ProductionCompleted = "production.completed"
	ProductionDelayed   = "production.delayed"
)

// Eventos de Clientes
const (
	ClientCreated = "client.created"
	ClientUpdated = "client.updated"
	ClientDeleted = "client.deleted"
)

// Eventos de Facturas
const (
	InvoiceCreated = "invoice.created"
	InvoicePaid    = "invoice.paid"
	InvoiceDeleted = "invoice.deleted"
)

func IsValidEvent(e string) bool {
	validEvents := []string{
		// Productos
		ProductCreated, ProductUpdated, ProductDeleted,ProductDisabled,ProductEnabled,

		// Producto-Insumo
		ProductInsumoCreated, ProductInsumoUpdated, ProductInsumoDeleted,

		// Insumos
		SupplyCreated, SupplyUpdated, SupplyDeleted, SupplyLow,

		// Pedidos
		OrderCreated, OrderUpdated, OrderCompleted, OrderCancelled,

		// Producción
		ProductionStarted, ProductionCancelled, ProductionCompleted, ProductionDelayed,

		// Clientes
		ClientCreated, ClientUpdated, ClientDeleted,

		// Facturas
		InvoiceCreated, InvoicePaid, InvoiceDeleted,
	}

	for _, ev := range validEvents {
		if ev == e {
			return true
		}
	}
	return false
}