#===============#
# BUILDER STAGE #
#===============#

FROM node:16-alpine3.14 AS builder

WORKDIR /usr/src/builder

COPY . .
RUN npm i -D && npm i -g typescript
RUN tsc -p .


#============#
# MAIN STAGE #
#============#

FROM node:16-alpine3.14

WORKDIR /usr/src/tinf20b2-bot

COPY package*.json ./
RUN npm i
COPY --from=builder /usr/src/builder/dist/ ./dist/

CMD ["node", "./dist/main.js"]