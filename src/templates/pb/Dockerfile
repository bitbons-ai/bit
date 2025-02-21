FROM alpine:latest as downloader

WORKDIR /pb
ARG PB_VERSION={{pbVersion}}

RUN apk add --no-cache ca-certificates unzip wget && \
    wget -q https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip -O /tmp/pb.zip && \
    unzip /tmp/pb.zip -d /pb/ && \
    rm /tmp/pb.zip

FROM alpine:latest

WORKDIR /pb

# Create non-root user
RUN addgroup -S pocketbase && \
    adduser -S pocketbase -G pocketbase && \
    apk add --no-cache ca-certificates

# Copy PocketBase from builder
COPY --from=downloader /pb/pocketbase /pb/pocketbase
RUN chown -R pocketbase:pocketbase /pb

USER pocketbase

EXPOSE 8090

# Health check
HEALTHCHECK --interval=90s --timeout=3s --start-period=5s \
    CMD wget -q --spider http://0.0.0.0:8090/api/health || exit 1

VOLUME /pb/pb_data

# Create superuser if env vars are provided, then start PocketBase
CMD if [ -n "${SUPERUSER_EMAIL}" ] && [ -n "${SUPERUSER_PASSWORD}" ]; then \
      /pb/pocketbase superuser upsert "${SUPERUSER_EMAIL}" "${SUPERUSER_PASSWORD}"; \
    fi && \
    exec /pb/pocketbase serve --http=0.0.0.0:8090
 