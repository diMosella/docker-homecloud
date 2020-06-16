#!/bin/sh

set -e

echo "Build docker image dimosella/flows:latest"
docker build --rm -t dimosella/flows:latest -f Dockerfile .
