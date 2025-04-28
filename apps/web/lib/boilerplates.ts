export const DEFAULT_BOILERPLATES: Record<string, string> = {
  CPP: `void solve() {
    // Your code here
    
}`,

  C: `void solve() {
    // Your code here
    
}`,

  PYTHON: `def solve():
    # Your code here
    pass`,

  JS: `function solve() {
    // Your code here
    
}`,
};

export function getBoilerplate(language: string, problemSlug?: string): string {

  return DEFAULT_BOILERPLATES[language] || '// Write your code here';
}