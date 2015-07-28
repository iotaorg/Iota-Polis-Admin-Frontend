#!/bin/bash

export GIT_DIR=$(git rev-parse --show-toplevel)
export MYIP=$(ip route get 8.8.8.8 | head -1 | cut -d' ' -f8)

echo "Make sure API is listening on $MYIP:5000 ";
(sleep 1; export X=`docker inspect --format '{{ .NetworkSettings.IPAddress }}' iota-frontend 2>&1`; echo "http://$X/frontend" ) &

docker run --rm --add-host=api_server:$MYIP --name iota-frontend -p 8080:80 -v $GIT_DIR:/data/frontend:ro iota/frontend-nginx

