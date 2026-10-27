FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm turbo
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/api ./apps/api
COPY packages ./packages
RUN pnpm install --frozen-lockfile
RUN pnpm --filter=@ehms/api build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json

EXPOSE 4000
CMD ["node", "dist/main.js"]
