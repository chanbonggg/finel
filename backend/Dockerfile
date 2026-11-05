FROM eclipse-temurin:21-jdk AS build

WORKDIR /app
COPY . .
RUN chmod +x ./gradlew && ./gradlew bootJar -x test --no-daemon

FROM eclipse-temurin:21-jre

WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl poppler-utils util-linux \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system finel \
    && useradd --system --gid finel --home-dir /app --shell /usr/sbin/nologin finel \
    && mkdir -p /var/lib/finel/catalogs \
    && chown finel:finel /var/lib/finel/catalogs
COPY --from=build --chown=finel:finel /app/build/libs/*-SNAPSHOT.jar app.jar

EXPOSE 8080

USER finel

ENTRYPOINT ["java", "-jar", "app.jar"]
