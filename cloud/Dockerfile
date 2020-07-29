FROM nextcloud:19-fpm

COPY ./flush.php /var/www/html/

RUN chown www-data:root /var/www/html/flush.php

ENV NEXTCLOUD_UPDATE=1
