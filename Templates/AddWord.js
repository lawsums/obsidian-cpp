// // Scripts/addWord.js
// module.exports = { addWord };

// async function addWord(params) {
//     const { quickAddApi } = params;
    
//     // 用户输入
//     const word = await quickAddApi.inputPrompt("Enter the word (English):");
//     if (!word) return {};
    
//     const phonetic = await quickAddApi.inputPrompt("Enter the phonetic (optional):") || '';
    
//     // 翻译 API 调用
//     let meaning = '';
//     try {
//         const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh-CN`);
//         const data = await response.json();
//         meaning = data.responseData.translatedText || 'Translation failed';
//     } catch (error) {
//         meaning = 'API error: ' + error.message;
//     }
    
//     // 月文件处理
//     const now = new Date();
//     const yearMonth = now.toISOString().slice(0, 7);
//     const monthFile = `Words-${yearMonth}.md`;
//     const monthPath = `Vocabulary/${monthFile}`;
//     const monthVaultPath = params.app.vault.getAbstractFileByPath(monthPath);
    
//     if (!monthVaultPath) {
//         await params.app.vault.create(monthPath, `# ${monthFile}\n\n## 当月单词列表\n\n`);
//     }
    
//     const fileName = `${word}-${now.toISOString().replace(/[-:T]/g, '').slice(0, 14)}`;
//     const entry = `- [[${fileName}]] - **${word}**: ${meaning}`;
//     const monthContent = await params.app.vault.read(monthVaultPath);
    
//     if (!monthContent.includes(entry)) {
//         await params.app.vault.modify(monthVaultPath, monthContent + '\n' + entry);
//     }
    
//     // 返回模板变量
//     return {
//         Word: word,
//         Phonetic: phonetic,
//         Meaning: meaning,
//         MonthFile: monthFile
//     };
// }


// Scripts/addWord.js
module.exports = { addWord };

async function addWord(params) {
    const { quickAddApi, app } = params;

    // 用户输入
    const word = await quickAddApi.inputPrompt("Enter the word (English):");
    if (!word) return {};

    // 翻译 API 调用
    let meaning = '';
    try {
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh-CN`);
        const data = await response.json();
        meaning = data.responseData.translatedText || 'Translation failed';
    } catch (error) {
        meaning = 'API error: ' + error.message;
    }

    // 月文件处理
    const now = new Date();
    const yearMonth = now.toISOString().slice(0, 7); // YYYY-MM
    const monthFile = `Words-${yearMonth}.md`;
    const monthPath = `Vocabulary/${monthFile}`;
    const monthVaultPath = app.vault.getAbstractFileByPath(monthPath);

    if (!monthVaultPath) {
        await app.vault.create(monthPath, `\nDECK: Vocalbulary\n\n## 当月单词列表\n\n`);
    }

    // 新的条目格式：**word**: meaning
    const entry = `WORD: **${word}**: ${meaning}`;
    const monthContent = await app.vault.read(monthVaultPath);

    if (!monthContent.includes(entry)) {
        await app.vault.modify(monthVaultPath, monthContent + '\n' + entry);
    }

    // 返回模板变量
    return {
        Word: word,
        Meaning: meaning,
        MonthFile: monthFile
    };
}
