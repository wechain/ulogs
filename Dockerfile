FROM node:alpine

RUN apk add --no-cache git
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . /usr/src/app

RUN yarn install
RUN yarn build

EXPOSE 3000
CMD yarn start
