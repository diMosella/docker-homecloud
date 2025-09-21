FROM alpine:latest

# install sed, avahi-tools; set timezone
# each RUN creates a separate layer
RUN apk add --update --no-cache \
    tzdata \
    avahi-tools \
    sed &&\
    cp /usr/share/zoneinfo/Europe/Amsterdam /etc/localtime &&\ 
    echo "Europe/Amsterdam" > /etc/timezone &&\ 
    apk del tzdata &&\
    rm -rf /var/cache/apk/*

CMD chown root:root /opt/kiosk/server && /opt/kiosk/server

# command that wrappes incoming commands, clearing kiosk default
ENTRYPOINT []