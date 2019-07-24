FROM node:11.15-alpine

COPY . /registry

WORKDIR /registry

RUN apk add --no-cache libc6-compat
RUN apk add make g++ git python
RUN npm install
RUN npm audit fix
ENTRYPOINT ["npm", "run", "migrate-docker"]