@echo off
cd /d "E:\Documents\Obsidian_\Cpp"
node Templates\ACGbangumi-cli.cjs search --name "间谍过家家" --type anime --json > Temp\search_result.json 2>&1
echo EXIT_CODE=%ERRORLEVEL% >> Temp\search_result.json
