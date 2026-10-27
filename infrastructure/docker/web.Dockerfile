FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm turbo
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/web ./apps/web
COPY packages ./packages
RUN pnpm install --frozen-lockfile
RUN pnpm --filter=@ehms/web build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
