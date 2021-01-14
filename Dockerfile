FROM arm64v8/openjdk:11-jdk-slim
LABEL maintainer="Noah Kilders (mail@nkilders.de)"

COPY target/tinf20b2-bot*.jar app.jar

CMD java -jar app.jar