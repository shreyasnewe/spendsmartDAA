#!/usr/bin/env bash
set -e

echo "Building SpendSmart C++ Backend..."
cd "$(dirname "$0")"

g++ -std=c++17 -O2 -pthread main.cpp -o spendsmart_server

echo "[SUCCESS] spendsmart_server compiled successfully!"
