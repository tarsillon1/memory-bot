#!/usr/bin/env bash
NAME=$1
echo "Process Name  |  Mem  | Compressed Mem"
top -stats command,mem,cmprs -l 1 | grep webstorm