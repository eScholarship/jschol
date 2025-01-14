#!/bin/bash

set -e  # exit immediately if error occurs

shopt -s expand_aliases
alias trace_on='set -x'
alias trace_off='{ PREV_STATUS=$? ; set +x; } 2>/dev/null; (exit $PREV_STATUS)'

echo "======== Recreating venv ========"
trace_on
rm -rf venv
python3 -m venv --symlinks venv
trace_off
source venv/bin/activate

echo "======== Installing packages ========"
trace_on
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
trace_off

echo "======== Done ========"
