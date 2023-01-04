#!/bin/bash
echo "Running start up script...(note: this script will only work on a linux machine and must be run from the root of the project directory /dist))"

# check if the 1Password access key was supplied
if (test -z "$1") then
    echo "No 1Password access key was supplied"
    exit 1
fi

# run the encrypt script
variable=$(node ./scripts/encrypt.bundle.js $1)

# slip the variable into an array on comma
IFS=',' read -ra ADDR <<< "$variable"

# start up pm2
NODE_ENV=production pm2 start --no-autorestart --name api-watch --attach ./watch-bundle.js -- ${ADDR[0]} ${ADDR[1]} ${ADDR[2]}
