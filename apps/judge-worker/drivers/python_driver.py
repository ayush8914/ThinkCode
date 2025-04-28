if __name__ == "__main__":
    import sys
    from io import StringIO
    
    content = sys.stdin.read()
    lines = content.split('\n')
    
    if not lines or not lines[0].strip():
        sys.exit(0)
    
    t = int(lines[0].strip())
    
    remaining = '\n'.join(lines[1:])
    
    sys.stdin = StringIO(remaining)
    
    for _ in range(t):
        solve()