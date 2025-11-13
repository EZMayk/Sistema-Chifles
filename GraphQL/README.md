GraphQL reporting layer for Sistema-Chifles

Overview

This service implements a read-only GraphQL API that consumes the existing REST API of the Sistema-Chifles application and exposes aggregated reports and traces for production, sales and billing.

Tech stack
- FastAPI (web server)
- Strawberry GraphQL (schema & resolvers)
- httpx (async HTTP client to call the REST API)
- python-dotenv (env vars)
- aiocache (optional simple caching)

Quick start (local)
1. Create a Python virtualenv and install deps:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and adjust `API_URL` if your REST API runs on another host/port.

3. Run the server:

```powershell
uvicorn app.main:app --reload --port 8000
```

4. Open GraphQL playground: `http://localhost:8000/graphql`

Example queries

- Sales by client (between dates):

```
query {
  salesByClient(start: "2025-11-01", end: "2025-11-30") {
    clientId
    clientName
    total
  }
}
```

- Top products:

```
query {
  topProducts(limit: 5, start: "2025-11-01", end: "2025-11-30") {
    productId
    name
    quantitySold
  }
}
```

- Trace a single order (what products and which insumos were needed):

```
query {
  traceOrder(pedidoId: 2) {
    pedidoId
    clienteName
    productos {
      productoId
      nombre
      cantidad
      insumosNecesarios {
        insumoId
        nombre
        cantidadNecesaria
      }
    }
  }
}
```

Notes & next steps
- This service is read-only and does not change the REST backend.
- Consider adding Redis for caching heavy aggregations in production.
- If you want authentication for the GraphQL endpoint, we can wire Supabase or another JWT provider.
