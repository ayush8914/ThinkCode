#!/bin/bash
LANGUAGE=$1
CODE_FILE=$2
INPUT_FILE=$3
TIME_LIMIT_MS=$4
MEMORY_LIMIT_KB=$5
EXECUTION_MODE=$6

TIME_LIMIT_SEC=$((TIME_LIMIT_MS / 1000))
[ $TIME_LIMIT_SEC -lt 1 ] && TIME_LIMIT_SEC=1

WORK_DIR=$(mktemp -d)
cd "$WORK_DIR"
trap 'cd /; rm -rf "$WORK_DIR"' EXIT


SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRIVER_DIR="$SCRIPT_DIR/../drivers"


run_with_timeout() {
    local timeout_sec=$1
    shift
    local cmd="$@"
    
    if command -v timeout >/dev/null 2>&1; then
        timeout ${timeout_sec}s $cmd
        return $?
    fi
    
    $cmd &
    local pid=$!
    local elapsed=0
    while kill -0 $pid 2>/dev/null && [ $elapsed -lt $timeout_sec ]; do
        sleep 0.1
        elapsed=$(echo "$elapsed + 0.1" | bc 2>/dev/null || echo $((elapsed + 1)))
    done
    if kill -0 $pid 2>/dev/null; then
        kill -9 $pid 2>/dev/null
        return 124
    fi
    wait $pid
    return $?
}

if [ "$EXECUTION_MODE" = "--driver" ]; then
    # ============================================
    # DRIVER MODE: One execution for all test cases
    # ============================================
    case $LANGUAGE in
  "CPP")
    DRIVER_FILE="$WORK_DIR/driver.cpp"
    
    # Write headers
    echo "#include <iostream>" > "$DRIVER_FILE"
    echo "#include <vector>" >> "$DRIVER_FILE"
    echo "#include <string>" >> "$DRIVER_FILE"
    echo "#include <algorithm>" >> "$DRIVER_FILE"
    echo "#include <cmath>" >> "$DRIVER_FILE"
    echo "using namespace std;" >> "$DRIVER_FILE"
    echo "" >> "$DRIVER_FILE"
    
    # Append user code
    cat "$CODE_FILE" >> "$DRIVER_FILE"
    echo "" >> "$DRIVER_FILE"
    
    # Append driver from file
    cat "$DRIVER_DIR/cpp_driver.cpp" >> "$DRIVER_FILE"
    
    # Compile
    g++ -std=c++17 -O2 -o program "$DRIVER_FILE" 2> compile_error.txt
    if [ $? -ne 0 ]; then
        echo "COMPILATION_ERROR"
        cat compile_error.txt
        exit 0
    fi
    
    # Run
    ./program < "$INPUT_FILE"
    ;;
            
   "PYTHON")
    DRIVER_FILE="$WORK_DIR/driver.py"
    
    cat > "$DRIVER_FILE" << 'HEADER_EOF'
import sys
from io import StringIO

HEADER_EOF
    
    echo "" >> "$DRIVER_FILE"
    
    cat "$CODE_FILE" >> "$DRIVER_FILE"
    echo "" >> "$DRIVER_FILE"
    
    cat "$DRIVER_DIR/python_driver.py" >> "$DRIVER_FILE"
    
    # Run
    python3 "$DRIVER_FILE" < "$INPUT_FILE"
    ;;
            
  "C")
    DRIVER_FILE="$WORK_DIR/driver.c"
    
    # Write headers directly
    cat > "$DRIVER_FILE" << 'HEADER_EOF'
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <math.h>
#include <limits.h>
#include <stdbool.h>

HEADER_EOF
    
    echo "" >> "$DRIVER_FILE"
    
    # Append user code
    cat "$CODE_FILE" >> "$DRIVER_FILE"
    echo "" >> "$DRIVER_FILE"
    
    # Append driver directly
    cat >> "$DRIVER_FILE" << 'DRIVER_EOF'
int main() {
    int t;
    scanf("%d", &t);
    getchar(); // Consume newline after t
    
    while (t--) {
        solve();
    }
    
    return 0;
}
DRIVER_EOF
    
    # Compile
    gcc -O2 -o program "$DRIVER_FILE" 2> compile_error.txt
    if [ $? -ne 0 ]; then
        echo "COMPILATION_ERROR"
        cat compile_error.txt
        exit 0
    fi
    
    # Run
    ./program < "$INPUT_FILE"
    ;;
            
   "JS"|"JAVASCRIPT")
    DRIVER_FILE="$WORK_DIR/driver.js"
    
    # Write headers
    cat > "$DRIVER_FILE" << 'HEADER_EOF'
const fs = require('fs');

HEADER_EOF
    
    echo "" >> "$DRIVER_FILE"
    
    # Append user code FIRST
    cat "$CODE_FILE" >> "$DRIVER_FILE"
    echo "" >> "$DRIVER_FILE"
    
    # Append driver code SECOND (so it runs after user code is defined)
    cat "$DRIVER_DIR/js_driver.js" >> "$DRIVER_FILE"
    
    node "$DRIVER_FILE" < "$INPUT_FILE"
    ;;
    esac
    exit 0
fi

