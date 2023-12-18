##Test image
FROM node:18-alpine as test
WORKDIR /app

RUN apk upgrade --no-cache
COPY *.json ./
RUN npm ci

COPY src src

CMD npm run build && npm run test

## Build image
FROM node:18-alpine as build
WORKDIR /app

COPY package*.json tsconfig.json ./
COPY src src
RUN npm install
RUN npm run build
RUN rm -Rf node_modules
RUN npm install --production

##Production image
FROM node:18-alpine3.18 as production
RUN npm update -g
WORKDIR /app

RUN apk --update --no-cache upgrade && npm uninstall npm -g

COPY package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build/ ./

ENV SERVICE_NAME=bublr-backend-proto

USER 64357:64357
EXPOSE 8085
CMD node --trace-warnings -r ./src/tracing/init-tracing.js ./src/index.js