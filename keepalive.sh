#!/bin/bash
while true; do
  sleep 1
  echo "keepalive $(date +%s)" > /dev/shm/keepalive.log
done
