BLUE='\033[1;34m'
NC='\033[0m'

log() {
  echo -e "[${BLUE}DEPLOY${NC}] $1"
}

log "Building new image..."
docker build -t nkilders/tinf20b2-bot:new .

log "Removing old data..."
docker stop tinf20b2-bot
docker rm tinf20b2-bot
docker rmi nkilders/tinf20b2-bot:latest

docker image tag nkilders/tinf20b2-bot:new nkilders/tinf20b2-bot:latest

log "Starting new container..."
docker run -d \
  -e TZ=Europe/Berlin \
  -v ~/tinf20b2-bot:/usr/src/tinf20b2-bot/bot-data \
  --name=tinf20b2-bot \
  --hostname=tinf20b2-bot \
  --restart=unless-stopped \
  nkilders/tinf20b2-bot:latest

log "Removing unused images..."
docker rmi nkilders/tinf20b2-bot:new
docker image prune -f