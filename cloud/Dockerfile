FROM nextcloud:19-fpm

COPY --chown=www-data:root flush.php /var/www/html/

ENV NEXTCLOUD_UPDATE=1

CMD php-fpm
