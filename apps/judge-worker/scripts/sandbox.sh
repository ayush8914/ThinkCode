#!/bin/bash
# Secure code execution sandbox
# This runs NATIVELY in the pod - no Docker-in-Docker

set -e

LANGUAGE=$1
CODE_FILE=$2
INPUT_FILE=$3
TIME_LIMIT_MS=$4
MEMORY_LIMIT_KB=$5

# Convert time limit to seconds (with decimal)
TIME_LIMIT_SEC=$(echo "scale=3; $TIME_LIMIT_MS / 1000" | bc)

# Set strict resource limits
ulimit -t $((TIME_LIMIT_MS / 1000 + 2))      # CPU time in seconds
ulimit -v $((MEMORY_LIMIT_KB))                # Virtual memory in KB
ulimit -m $((MEMORY_LIMIT_KB))                # Resident memory in KB
ulimit -f 10485760                            # File size 10MB
ulimit -n 64                                  # Max open files
ulimit -u 32                                  # Max user processes
ulimit -c 0                                   # No core dumps

# Create temp working directory
WORK_DIR=$(mktemp -d)
cd "$WORK_DIR"

# Function to clean up
cleanup() {
    cd /
    rm -rf "$WORK_DIR"
}
trap cleanup EXIT

# Execute based on language
case $LANGUAGE in
    "PYTHON")
        # Run Python with timeout
        /usr/bin/time -f "%e %M" -o time.txt \
            timeout --signal=KILL ${TIME_LIMIT_SEC}s \
            python3 "$CODE_FILE" < "$INPUT_FILE" > output.txt 2> error.txt
        
        EXIT_CODE=$?
        ;;
    
    "CPP")
        # Compile C++ code
        g++ -std=c++17 -O2 -Wall -o program "$CODE_FILE" 2> compile_error.txt
        
        if [ $? -ne 0 ]; then
            echo "COMPILATION_ERROR"
            cat compile_error.txt
            exit 0
        fi
        
        # Run compiled binary
        /usr/bin/time -f "%e %M" -o time.txt \
            timeout --signal=KILL ${TIME_LIMIT_SEC}s \
            ./program < "$INPUT_FILE" > output.txt 2> error.txt
        
        EXIT_CODE=$?
        ;;
    
    "JAVA")
        # Extract class name (assuming Main class)
        CLASS_NAME=$(grep -o "public class [A-Za-z0-9_]*" "$CODE_FILE" | head -1 | awk '{print $3}')
        
        if [ -z "$CLASS_NAME" ]; then
            echo "COMPILATION_ERROR"
            echo "No public class found. Make sure your class is public."
            exit 0
        fi
        
        # Compile Java code
        javac "$CODE_FILE" 2> compile_error.txt
        
        if [ $? -ne 0 ]; then
            echo "COMPILATION_ERROR"
            cat compile_error.txt
            exit 0
        fi
        
        # Run Java with memory limits
        /usr/bin/time -f "%e %M" -o time.txt \
            timeout --signal=KILL ${TIME_LIMIT_SEC}s \
            java -Xmx${MEMORY_LIMIT_KB}k -Xss1m -XX:+UseSerialGC "$CLASS_NAME" \
            < "$INPUT_FILE" > output.txt 2> error.txt
        
        EXIT_CODE=$?
        ;;
    
    *)
        echo "INTERNAL_ERROR"
        echo "Unsupported language: $LANGUAGE"
        exit 0
        ;;
esac

# Parse time and memory
TIME_SEC=$(awk '{print $1}' time.txt 2>/dev/null || echo "0")
TIME_MS=$(echo "$TIME_SEC * 1000" | bc | cut -d. -f1)
MEMORY_KB=$(awk '{print $2}' time.txt 2>/dev/null || echo "0")

# Handle exit codes
case $EXIT_CODE in
    0)
        echo "SUCCESS"
        echo "TIME:${TIME_MS}"
        echo "MEMORY:${MEMORY_KB}"
        cat output.txt
        ;;
    124|137)
        # 124 = timeout killed, 137 = SIGKILL (memory limit)
        if [ $EXIT_CODE -eq 124 ]; then
            echo "TIME_LIMIT_EXCEEDED"
        else
            echo "MEMORY_LIMIT_EXCEEDED"
        fi
        echo "TIME:${TIME_MS}"
        echo "MEMORY:${MEMORY_KB}"
        ;;
    139)
        # Segmentation fault
        echo "RUNTIME_ERROR"
        echo "TIME:${TIME_MS}"
        echo "MEMORY:${MEMORY_KB}"
        echo "Segmentation fault"
        ;;
    *)
        echo "RUNTIME_ERROR"
        echo "TIME:${TIME_MS}"
        echo "MEMORY:${MEMORY_KB}"
        cat error.txt 2>/dev/null || echo "Exit code: $EXIT_CODE"
        ;;
esac