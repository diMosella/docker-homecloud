#!/bin/sh

set -e

echo "Build docker image dimosella/backup:latest"
docker build --rm -t dimosella/backup:latest -f Dockerfile .