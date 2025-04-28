#!/bin/bash

LANGUAGE=$1
CODE_FILE=$2
INPUT_FILE=$3
TIME_LIMIT_MS=$4
MEMORY_LIMIT_KB=$5

TIME_LIMIT_SEC=$((TIME_LIMIT_MS / 1000))
if [ $TIME_LIMIT_SEC -lt 1 ]; then
    TIME_LIMIT_SEC=1
fi

WORK_DIR=$(mktemp -d)
cd "$WORK_DIR"

cleanup() {
    cd /
    rm -rf "$WORK_DIR"
}
trap cleanup EXIT

case $LANGUAGE in
    "PYTHON")
        python3 "$CODE_FILE" < "$INPUT_FILE" > output.txt 2> error.txt &
        PID=$!
        
        SECONDS=0
        while kill -0 $PID 2>/dev/null && [ $SECONDS -lt $TIME_LIMIT_SEC ]; do
            sleep 0.1
        done
        
        if kill -0 $PID 2>/dev/null; then
            kill -9 $PID 2>/dev/null
            echo "TIME_LIMIT_EXCEEDED"
            echo "TIME:$((SECONDS * 1000))"
            echo "MEMORY:0"
            exit 0
        fi
        
        wait $PID
        EXIT_CODE=$?
        
        if [ $EXIT_CODE -eq 0 ]; then
            echo "SUCCESS"
            echo "TIME:$((SECONDS * 1000))"
            echo "MEMORY:0"
            cat output.txt
        else
            echo "RUNTIME_ERROR"
            echo "TIME:$((SECONDS * 1000))"
            echo "MEMORY:0"
            cat error.txt 2>/dev/null || echo "Exit code: $EXIT_CODE"
        fi
        ;;
    
    "CPP")
        g++ -std=c++17 -O2 -Wall -o program "$CODE_FILE" 2> compile_error.txt
        
        if [ $? -ne 0 ]; then
            echo "COMPILATION_ERROR"
            cat compile_error.txt
            exit 0
        fi
        
        ./program < "$INPUT_FILE" > output.txt 2> error.txt &
        PID=$!
        
        SECONDS=0
        while kill -0 $PID 2>/dev/null && [ $SECONDS -lt $TIME_LIMIT_SEC ]; do
            sleep 0.1
        done
        
        if kill -0 $PID 2>/dev/null; then
            kill -9 $PID 2>/dev/null
            echo "TIME_LIMIT_EXCEEDED"
            echo "TIME:$((SECONDS * 1000))"
            echo "MEMORY:0"
            exit 0
        fi
        
        wait $PID
        EXIT_CODE=$?
        
        if [ $EXIT_CODE -eq 0 ]; then
            echo "SUCCESS"
            echo "TIME:$((SECONDS * 1000))"
            echo "MEMORY:0"
            cat output.txt
        else
            echo "RUNTIME_ERROR"
            echo "TIME:$((SECONDS * 1000))"
            echo "MEMORY:0"
            cat error.txt 2>/dev/null || echo "Exit code: $EXIT_CODE"
        fi
        ;;
    
    "C")
        gcc -O2 -Wall -o program "$CODE_FILE" 2> compile_error.txt
        
        if [ $? -ne 0 ]; then
            echo "COMPILATION_ERROR"
            cat compile_error.txt
            exit 0
        fi
        
        ./program < "$INPUT_FILE" > output.txt 2> error.txt &
        PID=$!
        
        SECONDS=0
        while kill -0 $PID 2>/dev/null && [ $SECONDS -lt $TIME_LIMIT_SEC ]; do
            sleep 0.1
        done
        
        if kill -0 $PID 2>/dev/null; then
            kill -9 $PID 2>/dev/null
            echo "TIME_LIMIT_EXCEEDED"
            echo "TIME:$((SECONDS * 1000))"
            echo "MEMORY:0"
            exit 0
        fi
        
        wait $PID
        EXIT_CODE=$?
        
        if [ $EXIT_CODE -eq 0 ]; then
            echo "SUCCESS"
            echo "TIME:$((SECONDS * 1000))"
            echo "MEMORY:0"
            cat output.txt
        else
            echo "RUNTIME_ERROR"
            echo "TIME:$((SECONDS * 1000))"
            echo "MEMORY:0"
            cat error.txt 2>/dev/null || echo "Exit code: $EXIT_CODE"
        fi
        ;;
    
    "JS"|"JAVASCRIPT")
        node "$CODE_FILE" < "$INPUT_FILE" > output.txt 2> error.txt &
        PID=$!
        
        SECONDS=0
        while kill -0 $PID 2>/dev/null && [ $SECONDS -lt $TIME_LIMIT_SEC ]; do
            sleep 0.1
        done
        
        if kill -0 $PID 2>/dev/null; then
            kill -9 $PID 2>/dev/null
            echo "TIME_LIMIT_EXCEEDED"
            echo "TIME:$((SECONDS * 1000))"
            echo "MEMORY:0"
            exit 0
        fi
        
        wait $PID
        EXIT_CODE=$?
        
        if [ $EXIT_CODE -eq 0 ]; then
            echo "SUCCESS"
            echo "TIME:$((SECONDS * 1000))"
            echo "MEMORY:0"
            cat output.txt
        else
            echo "RUNTIME_ERROR"
            echo "TIME:$((SECONDS * 1000))"
            echo "MEMORY:0"
            cat error.txt 2>/dev/null || echo "Exit code: $EXIT_CODE"
        fi
        ;;
    
    "JAVA")
        CLASS_NAME=$(grep -o "public class [A-Za-z0-9_]*" "$CODE_FILE" | head -1 | awk '{print $3}')
        
        if [ -z "$CLASS_NAME" ]; then
            CLASS_NAME=$(basename "$CODE_FILE" .java)
        fi
        
        javac "$CODE_FILE" 2> compile_error.txt
        
        if [ $? -ne 0 ]; then
            echo "COMPILATION_ERROR"
            cat compile_error.txt
            exit 0
        fi
        
        java "$CLASS_NAME" < "$INPUT_FILE" > output.txt 2> error.txt &
        PID=$!
        
        SECONDS=0
        while kill -0 $PID 2>/dev/null && [ $SECONDS -lt $TIME_LIMIT_SEC ]; do
            sleep 0.1
        done
        
        if kill -0 $PID 2>/dev/null; then
            kill -9 $PID 2>/dev/null
            echo "TIME_LIMIT_EXCEEDED"
            echo "TIME:$((SECONDS * 1000))"
            echo "MEMORY:0"
            exit 0
        fi
        
        wait $PID
        EXIT_CODE=$?
        
        if [ $EXIT_CODE -eq 0 ]; then
            echo "SUCCESS"
            echo "TIME:$((SECONDS * 1000))"
            echo "MEMORY:0"
            cat output.txt
        else
            echo "RUNTIME_ERROR"
            echo "TIME:$((SECONDS * 1000))"
            echo "MEMORY:0"
            cat error.txt 2>/dev/null || echo "Exit code: $EXIT_CODE"
        fi
        ;;
    
    *)
        echo "INTERNAL_ERROR"
        echo "Unsupported language: $LANGUAGE"
        ;;
esac