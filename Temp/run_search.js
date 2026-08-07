const { execSync } = require('child_process');
const fs = require('fs');

const script = 'E:\\Documents\\Obsidian\\Templates\\ACGbangumi-cli.cjs';
const cmd = `node "${script}" search --name "间谍过家家" --type anime --json`;

try {
    const out = execSync(cmd, {
        encoding: 'utf8',
        timeout: 45000,
        stdio: ['pipe', 'pipe', 'pipe']
    });
    fs.writeFileSync('E:\\Documents\\Obsidian_\\Cpp\\search_result.txt', out, 'utf8');
    console.log('OK');
} catch(e) {
    const msg = 'STDERR: ' + (e.stderr || '') + '\nSTDOUT: ' + (e.stdout || '') + '\nERROR: ' + e.message;
    fs.writeFileSync('E:\\Documents\\Obsidian_\\Cpp\\search_result.txt', msg, 'utf8');
    console.log('ERR');
}
