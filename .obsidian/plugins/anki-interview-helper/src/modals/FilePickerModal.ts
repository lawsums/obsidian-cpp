import { App, FuzzySuggestModal, TFile } from 'obsidian';

/**
 * Vault 文件模糊选择器：基于 Obsidian 原生 FuzzySuggestModal。
 * 用于挑选作为 LLM 输入来源的 md 文件；每次选择一个文件后关闭，
 * 可重复打开继续叠加选择。
 */
export class FilePickerModal extends FuzzySuggestModal<TFile> {
	constructor(app: App, private onPick: (file: TFile) => void) {
		super(app);
		this.setPlaceholder('输入关键词搜索 vault 中的文件（可多次打开叠加选择）…');
	}

	getItems(): TFile[] {
		return this.app.vault.getMarkdownFiles();
	}

	getItemText(file: TFile): string {
		return file.path;
	}

	onChooseItem(file: TFile): void {
		this.onPick(file);
	}
}
