import { App, normalizePath, TFile, TFolder } from 'obsidian';

/** 清理文件名中的非法字符（Obsidian 不允许 # ^ [ ] | 以及 Windows 路径字符） */
export function sanitizeFileName(name: string): string {
	const cleaned = name.replace(/[\\/:*?"<>|#^[\]]/g, '-').trim();
	return cleaned || 'untitled-deck';
}

/**
 * 文件工厂：负责 Deck 文件的定位与创建。
 * 规则：一个文件 = 一个 Deck，Deck 文件平铺在根目录下，文件头为 deck 标记行（Deck: 牌组名）。
 */
export class NoteFactory {
	constructor(private app: App, private getRootDir: () => string) {}

	/** 当前配置的根目录（已 trim） */
	rootPath(): string {
		return this.getRootDir().trim();
	}

	/** Deck 文件的 vault 相对路径（不创建文件） */
	deckFilePath(deckName: string): string {
		const root = this.rootPath();
		const fileName = `${sanitizeFileName(deckName)}.md`;
		return normalizePath(root ? `${root}/${fileName}` : fileName);
	}

	/**
	 * 获取 Deck 对应的文件：存在则返回，不存在则创建
	 * （含根目录的递归创建、deck 头写入）。
	 */
	async ensureDeckFile(deckName: string): Promise<TFile> {
		const path = this.deckFilePath(deckName);
		const trimmedName = deckName.trim();

		const existing = this.app.vault.getAbstractFileByPath(path);
		if (existing instanceof TFile) return existing;
		if (existing) throw new Error(`目标路径被文件夹占用：${path}`);

		const root = this.rootPath();
		if (root) await this.ensureFolder(root);

		return this.app.vault.create(path, `Deck: ${trimmedName}\n`);
	}

	/** 将卡片内容追加到 Deck 文件末尾 */
	async appendCards(file: TFile, cards: string): Promise<void> {
		const current = await this.app.vault.read(file);
		const body = current.endsWith('\n') ? current : `${current}\n`;
		await this.app.vault.modify(file, `${body}\n${cards.trim()}\n`);
	}

	/** 统计内容中的卡片数量（按 {Q} 标记计） */
	static countCards(content: string): number {
		return (content.match(/\{Q\}/g) ?? []).length;
	}

	private async ensureFolder(path: string): Promise<void> {
		const normalized = normalizePath(path);
		if (this.app.vault.getAbstractFileByPath(normalized) instanceof TFolder) return;
		try {
			await this.app.vault.createFolder(normalized);
		} catch (error) {
			// createFolder 具备递归创建能力；失败时再校验是否为并发/已存在场景
			if (!(this.app.vault.getAbstractFileByPath(normalized) instanceof TFolder)) {
				throw new Error(`无法创建目录 ${normalized}：${(error as Error).message}`);
			}
		}
	}
}
