FROM alpine:latest

WORKDIR /pb

RUN apk add --no-cache ca-certificates unzip wget

ARG PB_VERSION={{pbVersion}}

# Environment variables for superuser credentials
ENV SUPERUSER_EMAIL=""
ENV SUPERUSER_PASSWORD=""

ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

EXPOSE 8090

# Health check
HEALTHCHECK --interval=90s --timeout=3s --start-period=5s \
    CMD wget -q --spider http://0.0.0.0:8090/api/health || exit 1

VOLUME /pb/pb_data

CMD if [ -n "${SUPERUSER_EMAIL}" ] && [ -n "${SUPERUSER_PASSWORD}" ]; then \
      /pb/pocketbase superuser upsert "${SUPERUSER_EMAIL}" "${SUPERUSER_PASSWORD}"; \
    fi && \
    exec /pb/pocketbase serve --http=0.0.0.0:8090