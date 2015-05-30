#!/bin/bash

export GIT_DIR=$(git rev-parse --show-toplevel)
getMyIP() {
    local _ip _myip _line _nl=$'\n'
    while IFS=$': \t' read -a _line ;do
        [ -z "${_line%inet}" ] &&
           _ip=${_line[${#_line[1]}>4?1:2]} &&
           [ "${_ip#127.0.0.1}" ] && _myip=$_ip
      done< <(LANG=C /sbin/ifconfig)
    printf ${1+-v} $1 "%s${_nl:0:$[${#1}>0?0:1]}" $_myip
}
export MYIP=$(getMyIP)
echo "Make sure API is listening on $MYIP:5000 ";
(sleep 1; export X=`docker inspect --format '{{ .NetworkSettings.IPAddress }}' iota-frontend 2>&1`; echo "http://$X/frontend" ) &

docker run --rm --add-host=api_server:$MYIP --name iota-frontend  -v $GIT_DIR:/data/frontend:ro iota/frontend-nginx

