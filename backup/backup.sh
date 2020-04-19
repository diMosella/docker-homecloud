#!/bin/sh

# script to backup cloud and secure data

# 0. definitions
CONFIG_CLOUD_FOLDER="/backup/source-root/config"
SOURCE_CLOUD_FOLDER="/backup/source-cloud"
SOURCE_SECURE_FOLDER="/backup/source-secure"
SOURCE_CLOUD_DATABASE="database-server"
TARGET_FOLDER="/backup/target"
TARGET_CLOUD_FILE="$TARGET_FOLDER/cloud.sql"
TARGET_SECURE_FILE="$TARGET_FOLDER/secure.sqlite3"
MAINTENANCE="'maintenance' =>"
ON="true"
OFF="false"
TIMESTAMP=$(date +"%Y%m%dT%H:%M")

export RESTIC_REPOSITORY="$REPO"
export RESTIC_PASSWORD="$TOKEN"

SetMaintenance () {
    if [ $1 = $ON ]; then
        sed -i -e "s/$MAINTENANCE $OFF/$MAINTENANCE $ON/g" $CONFIG_CLOUD_FOLDER/config.php
    else
        sed -i -e "s/$MAINTENANCE $ON/$MAINTENANCE $OFF/g" $CONFIG_CLOUD_FOLDER/config.php
    fi
}

# abort entire script if any command fails
echo $TIMESTAMP :: creating a backup of cloud and secure data

# 1. ensure cloud will get out of maintenance mode anyhow (/backup/source-root/config)
trap "SetMaintenance $OFF" EXIT

# 2. set cloud in maintenance mode (/backup/source-root/config)
SetMaintenance $ON

# 3. dump secure database
sqlite3 $SOURCE_SECURE_FOLDER/db.sqlite3 ".backup '$TARGET_SECURE_FILE'"

# 4. dump cloud database
mysqldump --single-transaction -h $SOURCE_CLOUD_DATABASE -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE > $TARGET_CLOUD_FILE

# 5. check backup repo
restic snapshots
if [ $? -ne 0 ]; then
    echo "Backup repository doesn't exist yet. It wil be created"
    restic init
fi
restic unlock

# 6. backup secure data
restic backup --tag secure --tag $TIMESTAMP $TARGET_SECURE_FILE $SOURCE_SECURE_FOLDER/attachments

# 7. backup cloud data
restic backup --tag cloud --tag $TIMESTAMP $TARGET_CLOUD_FILE $SOURCE_CLOUD_FOLDER $CONFIG_CLOUD_FOLDER

# 8. exit maintenance mode cloud, remove trap
SetMaintenance $OFF
trap "" EXIT

# 9. cleanup
rm -rf $TARGET_FOLDER/*
restic forget --keep-daily 7 --keep-weekly 5 --keep-monthly 12 --keep-yearly 75
restic prune
