FROM node:alpine

ENV NPM_CONFIG_LOGLEVEL warn

RUN apk add --no-cache git nano

RUN npm config set unsafe-perm true
RUN npm i npm@latest -g
RUN npm install -g yarn

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . /usr/src/app

RUN yarn install
RUN yarn build

EXPOSE 3000
CMD yarn start
