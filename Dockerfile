# syntax = docker/dockerfile:experimental

FROM node:16.8.0 AS nextjs

USER root

ADD . /app

WORKDIR /app

COPY . ./

RUN npm install
RUN npm run build

CMD ["npm", "run", "start"]
