const { execSync } = require('child_process');
const fs = require('fs');

const script = 'E:\\Documents\\Obsidian\\Templates\\ACGbangumi-cli.cjs';
const args = ['search', '--name', '间谍过家家', '--type', 'anime', '--json'];

console.log('Running:', 'node', script, ...args);

try {
    const out = execSync(`${JSON.stringify(process.execPath)} ${JSON.stringify(script)} ${args.map(a => JSON.stringify(a)).join(' ')}`, {
        timeout: 60000,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log('STDOUT:');
    console.log(out);
    fs.writeFileSync('E:\\Documents\\Obsidian_\\Cpp\\_search_result.json', out, 'utf-8');
    console.log('Wrote to _search_result.json');
} catch (e) {
    console.log('STDERR/ERROR:');
    console.log(e.message);
    if (e.stdout) { console.log('STDOUT:', e.stdout); fs.writeFileSync('E:\\Documents\\Obsidian_\\Cpp\\_search_result.json', e.stdout, 'utf-8'); }
    if (e.stderr) { console.log('STDERR:', e.stderr); }
}
