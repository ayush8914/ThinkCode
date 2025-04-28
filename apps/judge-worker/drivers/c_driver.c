int main() {
    int t;
    char firstLine[100];
    
    fgets(firstLine, sizeof(firstLine), stdin);
    sscanf(firstLine, "%d", &t);
    
    while (t--) {
        solve();
    }
    
    return 0;
}