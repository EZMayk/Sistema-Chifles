# Usa una imagen oficial de Node.js
FROM node:18-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de configuración
COPY package*.json ./

# Instala dependencias (incluye dependencias de desarrollo)
RUN npm install

# Copia el resto del proyecto
COPY . .

# Expone el puerto del servidor
EXPOSE 3000

# Comando de inicio
CMD ["npm", "run", "start:dev"]
