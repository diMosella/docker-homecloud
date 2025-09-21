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
    rm -rf /var/cache/apk/* &&\
    adduser -D -u 82 www-data -G www-data

CMD chown www-data:www-data /opt/kiosk/server && ls -al /opt/kiosk && su -c '/opt/kiosk/server' www-data

# command that wrappes incoming commands, clearing kiosk default
ENTRYPOINT []