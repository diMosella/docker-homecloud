FROM restic/restic:latest

# install sqlite, mysql-client, bash (for script)
RUN apk add --update --no-cache \
    sqlite \
    mysql-client \
    bash \
    sed

CMD chown root:root /etc/crontabs/root && /usr/sbin/crond -f

# create a landing place for the scripts
# RUN mkdir /scripts

# copy backup script to landing place
# COPY scripts/backup.sh /scripts/

# give execution permission to scripts
# RUN chmod +x /scripts/backup.sh

ENTRYPOINT ["/bin/bash"]
