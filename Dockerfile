# perly-pay-mcp in a container, built from this source: what Glama and Docker's
# MCP catalogue start to list its tools. It speaks MCP over stdio, as with npx.
#
#   docker build -t perly-pay-mcp .
#   docker run -i --rm -e PERLY_PAY_SECRET_KEY=sk_test_… perly-pay-mcp
#
# Without a key it still starts and lists its tools; each one then says how
# to set the key.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json tsconfig.json ./
COPY src ./src
RUN npm install --ignore-scripts --no-audit --no-fund \
 && npm install --no-save --ignore-scripts --no-audit --no-fund typescript@6.0.3 @types/node@24.19.1 \
 && npx tsc -p tsconfig.json

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json README.md LICENSE ./
RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund
COPY --from=build /app/dist ./dist
USER node
ENTRYPOINT ["node", "dist/cli.js"]
