FROM node:25-alpine

WORKDIR /app

# Instalar dependencias de compilación para bcrypt
RUN apk add --no-cache python3 make g++

# Instalar dependencias
COPY package*.json ./
RUN npm install --build-from-source

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Puerto del servicio
EXPOSE 3001

# Comando de inicio
CMD ["npm", "run", "start:prod"]
