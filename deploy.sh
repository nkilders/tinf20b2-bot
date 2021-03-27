BLUE='\033[1;34m'
NC='\033[0m'

log() {
  echo -e "[${BLUE}DEPLOY${NC}] $1"
}

log "Building Maven project..."
mvn clean install

log "Stopping container..."
docker stop tinf20b2-bot

log "Deleting container..."
docker rm tinf20b2-bot

log "Deleting image..."
docker rmi nkilders/tinf20b2-bot:1.0

log "Building image..."
docker build \
  -t nkilders/tinf20b2-bot:1.0 \
  .

log "Starting container..."
docker run -d \
  -e PUID=1000 -e PGID=1000 \
  -e TZ=Europe/Berlin \
  -v /home/ubuntu/tinf20b2-bot:/tinf20b2-bot \
  --name=tinf20b2-bot \
  --hostname=tinf20b2-bot \
  --restart unless-stopped \
  nkilders/tinf20b2-bot:1.0
