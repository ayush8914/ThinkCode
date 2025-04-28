const content = fs.readFileSync(0, 'utf-8');
const lines = content.split('\n');

if (lines.length === 0 || !lines[0].trim()) {
    process.exit(0);
}

const t = parseInt(lines[0].trim());

const inputLines = lines.slice(1);
let lineIndex = 0;

global.input = () => {
    return inputLines[lineIndex++] || '';
};

for (let i = 0; i < t; i++) {
    solve();
}

process.exit(0);