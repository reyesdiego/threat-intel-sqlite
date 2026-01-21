FROM alpine:3.20

RUN apk add --no-cache sqlite sqlite-libs bash coreutils

WORKDIR /app

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]
