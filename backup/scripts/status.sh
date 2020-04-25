#!/bin/sh

# script to report the status of cloud and secure data backup

# 0. definitions
TIMESTAMP=$(date +"%Y%m%dT%H:%M")

export RESTIC_REPOSITORY="$REPO"
export RESTIC_PASSWORD="$TOKEN"

# abort entire script if any command fails
echo $TIMESTAMP :: reporting cloud and secure data backup

# 1. check backup repo
restic snapshots
