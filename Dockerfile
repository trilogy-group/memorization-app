# syntax = docker/dockerfile:experimental

FROM node:16.8.0 AS nextjs

USER node

ADD . /app

WORKDIR /app

COPY --chown=node:node . ./

RUN npm run build

CMD ["npm", "run", "start"]
