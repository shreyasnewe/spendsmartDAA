#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

if [ ! -f "spendsmart_server" ]; then
    ./build.sh
fi

echo "Starting SpendSmart C++ server on port 5000..."
./spendsmart_server 5000
