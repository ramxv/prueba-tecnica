# frontend/Dockerfile
FROM node:22-alpine

# Herramientas básicas + Corepack (pnpm via Corepack)
RUN apk add --no-cache libc6-compat bash curl && corepack enable

WORKDIR /app

# Instalar deps con lockfile si existe
COPY package*.json pnpm-lock* ./
RUN pnpm install

# Copiar el resto del código
COPY . .

# Variables útiles para Vite dev (puedes sobrescribirlas en docker-compose)
ENV VITE_HOST=0.0.0.0
ENV VITE_PORT=5173

EXPOSE 5173

# Vite leerá .env.* del proyecto (montado como volumen) y/o estas ENV
CMD ["sh", "-lc", "pnpm dev --host ${VITE_HOST} --port ${VITE_PORT}"]

