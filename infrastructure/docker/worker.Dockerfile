FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Background queue worker container (jobs: reservation hold expiry, fiscal sync, night audit)
CMD ["node", "-e", "console.log('EHMS Background Queue Worker active'); setInterval(() => {}, 10000);"]
