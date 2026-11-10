# ---------- Estágio 1: dependências de produção ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
    && mkdir -p node_modules \
    && npm cache clean --force

# ---------- Estágio 2: imagem final (runtime) ----------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    PORT=5002
WORKDIR /app

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src

USER node
EXPOSE 5002
CMD ["node", "src/main.js"]
