FROM nextcloud:19-fpm

COPY ./flush.php /var/www/html/

ENV NEXTCLOUD_UPDATE=1

CMD chown www-data:root /var/www/html/flush.php && php-fpm
