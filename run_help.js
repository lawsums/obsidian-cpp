const { execSync } = require('child_process');
try {
    const out = execSync('node "E:\\Documents\\Obsidian\\Templates\\ACGbangumi-cli.cjs" --help', {
        encoding: 'utf8',
        timeout: 30000,
        stdio: ['pipe', 'pipe', 'pipe']
    });
    require('fs').writeFileSync('E:\\Documents\\Obsidian_\\Cpp\\help_output.txt', out, 'utf8');
    console.log('SUCCESS - wrote help_output.txt');
} catch(e) {
    require('fs').writeFileSync('E:\\Documents\\Obsidian_\\Cpp\\help_output.txt', 'STDERR: ' + e.stderr + '\n\nSTDOUT: ' + e.stdout + '\n\nERROR: ' + e.message, 'utf8');
    console.log('ERROR captured');
}
