FROM arm64v8/openjdk:11-jdk-slim
LABEL maintainer="Noah Kilders (mail@nkilders.de)"

RUN apt-get update && \
    apt-get install curl -y

COPY target/tinf20b2-bot*.jar app.jar
COPY resource resource

CMD java -jar app.jar