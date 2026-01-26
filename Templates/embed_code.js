module.exports = async function(tp, filePath) {
    // 替换 QuickAdd 变量
    const resolvedPath = filePath.replace("{{value}}", tp.frontmatter.value);
    
    // 查找文件
    const file = app.vault.getAbstractFileByPath(resolvedPath);
    
    if (!file) {
        // 如果找不到，尝试其他扩展名
        const altPaths = [
            resolvedPath,
            resolvedPath.replace('.cpp', '.py'),
            resolvedPath.replace('.cpp', '.java')
        ];
        
        for (const path of altPaths) {
            const altFile = app.vault.getAbstractFileByPath(path);
            if (altFile) {
                const content = await app.vault.read(altFile);
                const ext = path.split('.').pop();
                return `\`\`\`${ext}\n${content}\n\`\`\``;
            }
        }
        return `❌ 未找到代码文件: ${resolvedPath}`;
    }
    
    // 读取并返回代码内容
    const content = await app.vault.read(file);
    const ext = resolvedPath.split('.').pop();
    return `\`\`\`${ext}\n${content}\n\`\`\``;
}
