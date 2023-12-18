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
WORKDIR /app

RUN ls -lah
RUN apk upgrade --no-cache

COPY *.json ./
RUN npm ci

COPY src src
RUN npm run build

RUN chown -R 64357:64357 /app
RUN mkdir /.npm && chown -R 64357:64357 "/.npm"

COPY --from=build /app/package*.json /app/
COPY --from=build /app/build /app/build/
COPY --from=build /app/node_modules /app/node_modules

ENV SERVICE_NAME=bublr-backend-proto

RUN ls -lah
RUN apk upgrade --no-cache

USER 64357:64357

EXPOSE 8080

# this is using ts-node, no currently 3pl-approval for that
# likely we should change this as we do not want the raw source in here anyway
CMD node --trace-warnings build/index.js