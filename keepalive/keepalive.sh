#!/bin/bash
while true; do
  echo "$(date) - keepalive heartbeat" >> /dev/shm/keepalive.log
  touch /dev/shm/keepalive_heartbeat 2>/dev/null
  curl -s --connect-timeout 2 http://127.0.0.1:3099/ > /dev/null 2>&1 || true
  python3 -c "sum(range(10000))" 2>/dev/null || true
  sleep 60
done
