#!/bin/bash
LANGUAGE=$1
CODE_FILE=$2
INPUT_FILE=$3
TIME_LIMIT_MS=$4
MEMORY_LIMIT_KB=$5
BATCH_MODE=$6

TIME_LIMIT_SEC=$((TIME_LIMIT_MS / 1000))
[ $TIME_LIMIT_SEC -lt 1 ] && TIME_LIMIT_SEC=1

WORK_DIR=$(mktemp -d)
cd "$WORK_DIR"
trap 'cd /; rm -rf "$WORK_DIR"' EXIT


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

if [ "$BATCH_MODE" = "--batch" ]; then
    case $LANGUAGE in
        "PYTHON")
            python3 -c "
import subprocess, sys, tempfile, os
content = sys.stdin.read()
# Split and strip each test case to remove surrounding whitespace
test_cases = [tc.strip() for tc in content.split('\n---TEST_CASE---\n') if tc.strip() != '']
for inp in test_cases:
    with tempfile.NamedTemporaryFile(mode='w', suffix='.in', delete=False) as f:
        f.write(inp)
        temp_in = f.name
    try:
        proc = subprocess.Popen(['python3', '$CODE_FILE'], stdin=open(temp_in),
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        try:
            stdout, _ = proc.communicate(timeout=$TIME_LIMIT_SEC)
            print('---OUTPUT---')
            out = stdout.rstrip('\n')
            print(out)
        except subprocess.TimeoutExpired:
            proc.kill()
            print('---OUTPUT---')
            print('TIME_LIMIT_EXCEEDED')
    finally:
        os.unlink(temp_in)
" < "$INPUT_FILE"
            ;;
            
        "CPP")
            g++ -std=c++17 -O2 -o program "$CODE_FILE" 2> compile_error.txt
            if [ $? -ne 0 ]; then
                echo "COMPILATION_ERROR"
                cat compile_error.txt
                exit 0
            fi
            python3 -c "
import subprocess, sys, tempfile, os
content = sys.stdin.read()
test_cases = [tc.strip() for tc in content.split('\n---TEST_CASE---\n') if tc.strip() != '']
for inp in test_cases:
    with tempfile.NamedTemporaryFile(mode='w', suffix='.in', delete=False) as f:
        f.write(inp)
        temp_in = f.name
    try:
        proc = subprocess.Popen(['$WORK_DIR/program'], stdin=open(temp_in),
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        try:
            stdout, stderr = proc.communicate(timeout=$TIME_LIMIT_SEC)
            print('---OUTPUT---')
            out = stdout.rstrip('\n')
            print(out)
            if stderr and proc.returncode != 0:
                print('---STDERR---', file=sys.stderr)
                print(stderr.rstrip('\n'), file=sys.stderr)
        except subprocess.TimeoutExpired:
            proc.kill()
            print('---OUTPUT---')
            print('TIME_LIMIT_EXCEEDED')
    finally:
        os.unlink(temp_in)
" < "$INPUT_FILE"
            rm -f program
            ;;
            
        "C")
            gcc -O2 -o program "$CODE_FILE" 2> compile_error.txt
            if [ $? -ne 0 ]; then
                echo "COMPILATION_ERROR"
                cat compile_error.txt
                exit 0
            fi
            python3 -c "
import subprocess, sys, tempfile, os
content = sys.stdin.read()
test_cases = [tc.strip() for tc in content.split('\n---TEST_CASE---\n') if tc.strip() != '']
for inp in test_cases:
    with tempfile.NamedTemporaryFile(mode='w', suffix='.in', delete=False) as f:
        f.write(inp)
        temp_in = f.name
    try:
        proc = subprocess.Popen(['$WORK_DIR/program'], stdin=open(temp_in),
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        try:
            stdout, stderr = proc.communicate(timeout=$TIME_LIMIT_SEC)
            print('---OUTPUT---')
            out = stdout.strip()
            print(out)
            if stderr and proc.returncode != 0:
                print('---STDERR---', file=sys.stderr)
                print(stderr.rstrip('\n'), file=sys.stderr)
        except subprocess.TimeoutExpired:
            proc.kill()
            print('---OUTPUT---')
            print('TIME_LIMIT_EXCEEDED')
    finally:
        os.unlink(temp_in)
" < "$INPUT_FILE"
            rm -f program
            ;;
            
        "JS"|"JAVASCRIPT")
            python3 -c "
import subprocess, sys, tempfile, os
content = sys.stdin.read()
test_cases = [tc.strip() for tc in content.split('\n---TEST_CASE---\n') if tc.strip() != '']
for inp in test_cases:
    with tempfile.NamedTemporaryFile(mode='w', suffix='.in', delete=False) as f:
        f.write(inp)
        temp_in = f.name
    try:
        proc = subprocess.Popen(['node', '$CODE_FILE'], stdin=open(temp_in),
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        try:
            stdout, _ = proc.communicate(timeout=$TIME_LIMIT_SEC)
            print('---OUTPUT---')
            out = stdout.rstrip('\n')
            print(out)
        except subprocess.TimeoutExpired:
            proc.kill()
            print('---OUTPUT---')
            print('TIME_LIMIT_EXCEEDED')
    finally:
        os.unlink(temp_in)
" < "$INPUT_FILE"
            ;;
            
        *)
            echo "INTERNAL_ERROR"
            echo "Unsupported language: $LANGUAGE"
            exit 1
            ;;
    esac
    exit 0
fi


case $LANGUAGE in
    "PYTHON")
        run_with_timeout $TIME_LIMIT_SEC python3 "$CODE_FILE" < "$INPUT_FILE" 2>/dev/null
        EC=$?
        ;;
    "CPP")
        g++ -std=c++17 -O2 -o program "$CODE_FILE" 2>/dev/null || { echo "COMPILATION_ERROR"; exit 0; }
        run_with_timeout $TIME_LIMIT_SEC ./program < "$INPUT_FILE" 2>/dev/null
        EC=$?
        rm -f program
        ;;
    "C")
        gcc -O2 -o program "$CODE_FILE" 2>/dev/null || { echo "COMPILATION_ERROR"; exit 0; }
        run_with_timeout $TIME_LIMIT_SEC ./program < "$INPUT_FILE" 2>/dev/null
        EC=$?
        rm -f program
        ;;
    "JS"|"JAVASCRIPT")
        run_with_timeout $TIME_LIMIT_SEC node "$CODE_FILE" < "$INPUT_FILE" 2>/dev/null
        EC=$?
        ;;
    *)
        echo "INTERNAL_ERROR"
        exit 1
        ;;
esac

if [ $EC -eq 0 ]; then
    echo "SUCCESS"
elif [ $EC -eq 124 ]; then
    echo "TIME_LIMIT_EXCEEDED"
else
    echo "RUNTIME_ERROR"
fi