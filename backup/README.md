# README

## Back up clouddata

- [ ] Start new container with docker socker and clouddata volumes mounted
    - `docker run -v /var/run/docker.sock:/var/run/docker.sock alpine` https://medium.com/better-programming/about-var-run-docker-sock-3bfd276e12fd
    - with sqlite in it https://github.com/shivpatel/bitwarden_rs_dropbox_backup
- [ ] Make sure maintenance mode is always turned off again
    - `trap "sudo -u www-data php /var/www/nextcloud/occ maintenance:mode --off" EXIT` https://help.nextcloud.com/t/nextcloud-backup-and-restore/51589/6
- [ ] Set maintenance mode of nextcloud on
    - `sudo docker exec -u www-data -it cloud-server php occ maintenance:mode --on`
- [ ] Dump databases https://docs.nextcloud.com/server/stable/admin_manual/maintenance/backup.html
    - ``mysqldump --single-transaction -h [server] -u [username] -p[password] [db_name] > nextcloud-sqlbkp_`date +"%Y%m%d"`.bak``
    - ``docker exec [MYSQL_CONTAINER] /usr/bin/mysqldump -u [MYSQL_USER] --password=[MYSQL_PASSWORD]``
  [MYSQL_DATABASE] > backup.sql``
    - ``sqlite3 data/owncloud.db .dump > nextcloud-sqlbkp_`date +"%Y%m%d"`.bak``
- [ ] Sync files
    - ``rsync -Aavx nextcloud/ nextcloud-dirbkp_`date +"%Y%m%d"`/``
