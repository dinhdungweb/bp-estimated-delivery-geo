FROM node:20-alpine AS build

RUN apk add --no-cache openssl
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runtime

RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
EXPOSE 3000

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/build ./build
COPY --from=build /app/public ./public
COPY --from=build /app/extensions ./extensions
COPY --from=build /app/prisma ./prisma

CMD ["npm", "run", "docker-start"]
