FROM alpine:latest

WORKDIR /pb

RUN apk add --no-cache ca-certificates unzip wget

ARG PB_VERSION=0.24.4

ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

EXPOSE 8090

# Health check
HEALTHCHECK --interval=90s --timeout=3s --start-period=5s \
    CMD wget -q --spider http://0.0.0.0:8090/api/health || exit 1

VOLUME /pb/pb_data

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090"]
