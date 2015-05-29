#!/bin/bash

export GIT_DIR=$(git rev-parse --show-toplevel)

(sleep 2; export X=`docker inspect --format '{{ .NetworkSettings.IPAddress }}' iota-frontend 2>&1`; echo "http://$X/frontend" ) &
docker run --rm  --name iota-frontend  -v $GIT_DIR:/data/frontend:ro iota/frontend-nginx

