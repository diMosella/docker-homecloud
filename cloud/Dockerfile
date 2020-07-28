FROM nextcloud:19-fpm

RUN apt-get update && apt-get install -y \
    supervisor \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir /var/log/supervisord /var/run/supervisord

COPY supervisord.conf /

ENV NEXTCLOUD_UPDATE=1

CMD "chown www-data:root /var/spool/cron/crontabs/www-data && /usr/bin/supervisord -c /supervisord.conf"
