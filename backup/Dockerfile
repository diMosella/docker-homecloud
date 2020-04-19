FROM restic:latest

# install sqlite, mysql-client, bash (for script)
RUN apk add --update --no-cache \
    sqlite \
    mysql-client \
    bash \
    sed

# create a landing place for the scripts
RUN mkdir /scripts

# copy backup script to landing place
COPY backup.sh /scripts/

# give execution permission to scripts
RUN chmod +x /scripts/backup.sh

ENTRYPOINT ["crond", "-f"]
