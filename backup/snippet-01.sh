#!/bin/bash

export RESTIC_REPOSITORY="/mnt/nc-backup"
export RESTIC_PASSWORD="oJSesetLzRgphy9UwmWxi50oE0dkYa16"

# abort entire script if any command fails
set -e

# Make sure nextcloud is enabled when we are done
trap "sudo -u www-data php /var/www/nextcloud/occ maintenance:mode --off" EXIT

# set nextcloud to maintenance mode
sudo -u www-data php /var/www/nextcloud/occ maintenance:mode --on

# unlock restic
/usr/local/bin/restic unlock

# backup the database
sudo -u postgres pg_dump -c -U postgres nextcloud_db | /usr/local/bin/restic backup --stdin --stdin-filename db_postgres_nextcloud.sql

# backup the data dir
/usr/local/bin/restic backup /mnt/nc-data /var/www/nextcloud

# turn maintenance mode off
sudo -u www-data php /var/www/nextcloud/occ maintenance:mode --off

# delete trap
trap "" EXIT

# clean up backup dir
/usr/local/bin/restic forget --keep-daily 7 --keep-weekly 5 --keep-monthly 12 --keep-yearly 75

/usr/local/bin/restic prune