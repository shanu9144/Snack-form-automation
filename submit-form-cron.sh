#!/bin/bash
cd "$(dirname "$0")"
/usr/bin/node ./snack.js >> cron-log.txt 2>&1
