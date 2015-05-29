#!/bin/bash

export GIT_DIR=$(git rev-parse --show-toplevel)

(sleep 2; docker inspect --format '{{ .NetworkSettings.IPAddress }}' iota-frontend ) &
docker run --rm  --name iota-frontend  -v $GIT_DIR:/data/frontend:ro iota/frontend-nginx

