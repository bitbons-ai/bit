FROM alpine:latest

ARG PB_VERSION=0.19.4

RUN apk add --no-cache \
    unzip \
    ca-certificates

# download and unzip PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

EXPOSE 8090

WORKDIR /pb

CMD ["./pocketbase", "serve", "--http=0.0.0.0:8090"]
