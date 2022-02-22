#===============#
# BUILDER STAGE #
#===============#

FROM node:16.13.0-slim AS builder

WORKDIR /usr/src/builder

COPY . .
RUN npm i
RUN npm i -g typescript
RUN tsc -p .


#============#
# MAIN STAGE #
#============#

FROM node:16.13.0-slim

RUN apt-get update && apt-get install curl -y

WORKDIR /usr/src/tinf20b2-bot

COPY --from=builder /usr/src/builder/package*.json ./
COPY --from=builder /usr/src/builder/node_modules/ ./node_modules/
COPY --from=builder /usr/src/builder/dist/ ./dist/

COPY resource/ ./resource/

CMD ["node", "./dist/main.js"]
