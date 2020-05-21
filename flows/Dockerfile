FROM node:alpine

# install file, exiftool, imagemagick, ffmpeg and set timezone
# each RUN creates a seperate layer
RUN apk add --update --no-cache \
    file \
    exiftool \
    imagemagick \
    libvpx \
    libvorbis \
    ffmpeg \
    tzdata \
    sed &&\
    cp /usr/share/zoneinfo/Europe/Amsterdam /etc/localtime &&\ 
    echo "Europe/Amsterdam" > /etc/timezone &&\ 
    apk del tzdata &&\
    rm -rf /var/cache/apk/*

CMD /usr/sbin/crond -f

# command that wrappes incoming commands, clearing restic default
ENTRYPOINT []
