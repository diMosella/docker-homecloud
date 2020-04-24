FROM restic/restic:latest

# install sqlite, mysql-client, sed, set timezone
# each RUN creates a seperate layer
RUN apk add --update --no-cache \
    sqlite \
    mysql-client \
    tzdata \
    sed &&\
    cp /usr/share/zoneinfo/Europe/Amsterdam /etc/localtime &&\ 
    echo "Europe/Amsterdam" > /etc/timezone &&\ 
    apk del tzdata &&\
    rm -rf /var/cache/apk/*

CMD chown root:root /etc/crontabs/root && /usr/sbin/crond -f

# command that wrappes incoming commands, clearing restic default
ENTRYPOINT []
