# ========================================
# Stage 1: Builder
# ========================================
FROM python:3.14-slim AS builder

WORKDIR /app

# Instalar dependencias de compilación
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependencias
COPY requirements.txt ./
RUN pip install --no-cache-dir --user -r requirements.txt

# ========================================
# Stage 2: Runner
# ========================================
FROM python:3.14-slim AS runner

WORKDIR /app

# Crear usuario no-root
RUN groupadd --system --gid 1001 graphql \
    && useradd --system --uid 1001 --gid graphql graphql

# Copiar dependencias instaladas
COPY --from=builder /root/.local /home/graphql/.local

# Copiar código de la aplicación
COPY --chown=graphql:graphql . .

# Variables de entorno
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/home/graphql/.local/bin:$PATH" \
    PORT=8000

# Cambiar a usuario no-root
USER graphql

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
