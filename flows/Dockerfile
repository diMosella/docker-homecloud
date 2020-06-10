FROM node:alpine

# install file, exiftool, imagemagick, ffmpeg and set timezone
# each RUN creates a seperate layer
RUN apk add --update --no-cache \
    curl \
    file \
    exiftool \
    imagemagick \
    libvpx \
    libvorbis \
    ffmpeg \
    ocrmypdf \
    tzdata \
    sed &&\
    cp /usr/share/zoneinfo/Europe/Amsterdam /etc/localtime &&\
    echo "Europe/Amsterdam" > /etc/timezone &&\
    apk del tzdata &&\
    rm -rf /var/cache/apk/*

HEALTHCHECK CMD curl -X POST localhost:8000/status
# HEALTHCHECK --interval=DURATION (default: 30s) --timeout=DURATION (default: 30s) --start-period=DURATION (default: 0s)  --retries=N (default: 3) CMD curl -X POST localhost:8000/status

CMD /usr/sbin/crond -f

# command that wrappes incoming commands, clearing restic default
ENTRYPOINT []
