import { App, ButtonComponent, Modal, Notice, TFile } from 'obsidian';
import { DeckEntry, InterviewHelperSettings } from '../types';
import { DeckRegistry } from '../services/DeckRegistry';
import { NoteFactory, sanitizeFileName } from '../services/NoteFactory';
import { LlmService } from '../services/LlmService';
import { FilePickerModal } from './FilePickerModal';

/** Modal 对宿主插件的能力依赖（结构化接口，避免与 main.ts 循环引用） */
export interface ModalHost {
	registry: DeckRegistry;
	llm: LlmService;
	factory: NoteFactory;
	settings: InterviewHelperSettings;
	saveSettings(): Promise<void>;
}

function showEl(el: HTMLElement): void {
	el.style.display = 'block';
}

function hideEl(el: HTMLElement): void {
	el.style.display = 'none';
}

export interface NewQuestionModalOptions {
	/** 打开向导时立即读取当前激活文件（用于「从当前文件生成卡片」命令） */
	preloadActiveFile?: boolean;
}

/**
 * 新建面试题卡片：主流程向导。
 * 选 Deck（模糊搜索/新建）→ 输入原始题目（粘贴 / 选文件 / 当前页面）→ LLM 转换 → 预览编辑 → 追加写入 Deck 文件。
 */
export class NewQuestionModal extends Modal {
	private deckInput!: HTMLInputElement;
	private suggestionEl!: HTMLDivElement;
	private fileHintEl!: HTMLElement;
	private questionEl!: HTMLTextAreaElement;
	private chipsEl!: HTMLDivElement;
	private previewSectionEl!: HTMLElement;
	private previewEl!: HTMLTextAreaElement;
	private generateBtn!: ButtonComponent;
	private confirmBtn!: ButtonComponent;
	private currentMatches: DeckEntry[] = [];
	/** 下拉列表中当前高亮的条目下标（键盘 ↑/↓ 导航用） */
	private selectedIndex = 0;
	/** 已加载的文件来源（用于标签展示与移除对应文本段） */
	private loadedSources: { file: TFile; segment: string }[] = [];

	constructor(
		app: App,
		private host: ModalHost,
		private options: NewQuestionModalOptions = {}
	) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.setText('新建面试题卡片');
		this.contentEl.addClass('anki-interview-modal');
		this.renderDeckSection();
		this.renderQuestionSection();
		this.renderPreviewSection();
		this.renderFooter();
		window.setTimeout(() => this.deckInput.focus());
		if (this.options.preloadActiveFile || this.host.settings.autoLoadActiveFile) {
			void this.loadActiveFile(false);
		}
	}

	// ---------- Deck 选择（痛点 3 + 痛点 1） ----------

	private renderDeckSection(): void {
		const section = this.contentEl.createDiv({ cls: 'anki-section' });
		section.createEl('label', { text: 'Deck（问题集）' });

		const wrap = section.createDiv({ cls: 'anki-deck-input-wrap' });
		this.deckInput = wrap.createEl('input', {
			type: 'text',
			cls: 'anki-deck-input',
			attr: { placeholder: '输入关键词搜索历史 Deck，或直接输入新名称' },
		});
		this.suggestionEl = wrap.createDiv({ cls: 'anki-deck-suggestions' });
		hideEl(this.suggestionEl);
		this.fileHintEl = section.createEl('p', { cls: 'anki-file-hint' });

		this.deckInput.addEventListener('input', () => this.onDeckInput());
		this.deckInput.addEventListener('blur', () => {
			// 延迟关闭，给 mousedown 选中的时间
			window.setTimeout(() => hideEl(this.suggestionEl), 120);
		});
		this.deckInput.addEventListener('keydown', (event) => {
			const hasSuggestions =
				this.currentMatches.length > 0 && this.suggestionEl.style.display !== 'none';
			if (event.key === 'ArrowDown' && hasSuggestions) {
				event.preventDefault();
				this.selectedIndex = (this.selectedIndex + 1) % this.currentMatches.length;
				this.updateActiveSuggestion();
			} else if (event.key === 'ArrowUp' && hasSuggestions) {
				event.preventDefault();
				this.selectedIndex =
					(this.selectedIndex - 1 + this.currentMatches.length) % this.currentMatches.length;
				this.updateActiveSuggestion();
			} else if ((event.key === 'Enter' || event.key === 'Tab') && hasSuggestions) {
				// 下拉可见时，Enter / Tab 均确认选择当前高亮项
				event.preventDefault();
				this.selectDeck(this.currentMatches[this.selectedIndex]);
			}
		});
	}

	/** 刷新下拉列表的高亮态，并保证高亮项可见 */
	private updateActiveSuggestion(): void {
		for (let i = 0; i < this.suggestionEl.children.length; i++) {
			const item = this.suggestionEl.children[i] as HTMLElement;
			if (i === this.selectedIndex) {
				item.addClass('is-active');
				item.scrollIntoView({ block: 'nearest' });
			} else {
				item.removeClass('is-active');
			}
		}
	}

	private onDeckInput(): void {
		const query = this.deckInput.value.trim();
		this.currentMatches = this.host.registry.search(query, 8);
		this.suggestionEl.empty();

		if (this.currentMatches.length > 0) {
			for (const deck of this.currentMatches) {
				this.suggestionEl.appendChild(this.buildSuggestionItem(deck));
			}
			this.selectedIndex = 0;
			this.updateActiveSuggestion();
			showEl(this.suggestionEl);
		} else {
			hideEl(this.suggestionEl);
		}
		this.updateFileHint();
	}

	private buildSuggestionItem(deck: DeckEntry): HTMLElement {
		const item = createDiv({
			cls: `anki-deck-item${deck.archived ? ' is-archived' : ''}`,
		});
		const left = item.createDiv({ cls: 'anki-deck-left' });
		left.createSpan({ cls: 'anki-deck-name', text: deck.name });
		if (deck.archived) {
			left.createSpan({ cls: 'anki-deck-badge', text: '已归档' });
		}
		item.createDiv({
			cls: 'anki-deck-meta',
			text: `${deck.useCount} 次 · ${deck.filePath}`,
		});
		// 鼠标悬停时同步高亮（与键盘导航共用 selectedIndex）
		item.addEventListener('mouseenter', () => {
			this.selectedIndex = this.currentMatches.indexOf(deck);
			this.updateActiveSuggestion();
		});
		// mousedown 而非 click：在 blur 收起下拉框之前完成选择
		item.addEventListener('mousedown', (event) => {
			event.preventDefault();
			this.selectDeck(deck);
		});
		return item;
	}

	private selectDeck(deck: DeckEntry): void {
		this.deckInput.value = deck.name;
		this.currentMatches = [];
		this.selectedIndex = 0;
		hideEl(this.suggestionEl);
		this.updateFileHint();
	}

	private updateFileHint(): void {
		const name = this.deckInput.value.trim();
		if (!name) {
			this.fileHintEl.setText('');
			return;
		}
		const entry = this.host.registry.get(name);
		if (entry) {
			const suffix = entry.archived ? '（该 Deck 已归档）' : '';
			this.fileHintEl.setText(`目标文件：${entry.filePath}${suffix}`);
		} else {
			const root = this.host.factory.rootPath();
			this.fileHintEl.setText(
				`新 Deck：将创建 ${root ? `${root}/` : ''}${sanitizeFileName(name)}.md`
			);
		}
	}

	// ---------- 原始题目输入（痛点 2 前半） ----------

	private renderQuestionSection(): void {
		const section = this.contentEl.createDiv({ cls: 'anki-section' });

		const labelRow = section.createDiv({ cls: 'anki-question-label-row' });
		labelRow.createEl('label', { text: '原始题目' });
		const btnRow = labelRow.createDiv({ cls: 'anki-source-buttons' });
		new ButtonComponent(btnRow)
			.setButtonText('选择文件…')
			.onClick(() => this.openFilePicker());
		new ButtonComponent(btnRow)
			.setButtonText('读取当前页面')
			.onClick(() => void this.loadActiveFile(true));

		this.chipsEl = section.createDiv({ cls: 'anki-source-chips' });
		hideEl(this.chipsEl);

		this.questionEl = section.createEl('textarea', {
			cls: 'anki-question-input',
			attr: {
				placeholder:
					'粘贴面试原话，或点击右上角按钮从 vault 文件 / 当前页面读取内容（可混合，可编辑）',
			},
		});
		this.questionEl.rows = 6;

		this.generateBtn = new ButtonComponent(section)
			.setButtonText('生成卡片')
			.setCta()
			.onClick(() => void this.onGenerate());
	}

	/** 打开 vault 文件模糊搜索，选中一个文件即读入输入框；可反复打开叠加选择 */
	private openFilePicker(): void {
		new FilePickerModal(this.app, (file) => void this.loadFile(file)).open();
	}

	/** 读取当前激活的文件（explicit=true 时为用户手动点击，找不到给出提示） */
	private async loadActiveFile(explicit: boolean): Promise<void> {
		const file = this.app.workspace.getActiveFile();
		if (!file || file.extension !== 'md') {
			if (explicit) new Notice('当前没有激活的 Markdown 文件');
			return;
		}
		await this.loadFile(file);
	}

	/** 把文件内容作为一段素材追加到输入框，并登记来源标签 */
	private async loadFile(file: TFile): Promise<void> {
		if (this.loadedSources.some((s) => s.file.path === file.path)) {
			new Notice(`该文件已读取过：${file.path}`);
			return;
		}
		const content = (await this.app.vault.cachedRead(file)).trim();
		if (!content) {
			new Notice(`文件内容为空：${file.path}`);
			return;
		}
		const segment = `===== 来源：${file.basename} =====\n${content}`;
		const base = this.questionEl.value.trim();
		this.questionEl.value = base ? `${base}\n\n${segment}` : segment;
		this.loadedSources.push({ file, segment });
		this.renderChips();
	}

	private renderChips(): void {
		this.chipsEl.empty();
		if (this.loadedSources.length === 0) {
			hideEl(this.chipsEl);
			return;
		}
		showEl(this.chipsEl);
		for (const source of this.loadedSources) {
			const chip = this.chipsEl.createSpan({ cls: 'anki-source-chip' });
			chip.createSpan({
				text: source.file.basename,
				attr: { title: source.file.path },
			});
			chip.createSpan({ cls: 'anki-source-chip-x', text: '✕' }).addEventListener(
				'click',
				() => this.removeSource(source)
			);
		}
	}

	/** 移除一个文件来源：删掉对应文本段与标签 */
	private removeSource(target: { file: TFile; segment: string }): void {
		let text = this.questionEl.value.replace(target.segment, '');
		// 清理删除后残留的连续空行
		text = text.replace(/\n{3,}/g, '\n\n').trim();
		this.questionEl.value = text;
		this.loadedSources = this.loadedSources.filter((s) => s !== target);
		this.renderChips();
	}

	private async onGenerate(): Promise<void> {
		const deckName = this.deckInput.value.trim();
		const question = this.questionEl.value.trim();
		if (!deckName) {
			new Notice('请先填写 Deck 名称');
			this.deckInput.focus();
			return;
		}
		if (!question) {
			new Notice('请先输入原始题目');
			this.questionEl.focus();
			return;
		}

		this.generateBtn.setDisabled(true).setButtonText('生成中…');
		try {
			const result = await this.host.llm.convert(question);
			this.previewEl.value = result;
			showEl(this.previewSectionEl);
			this.confirmBtn.setDisabled(false);
		} catch (error) {
			new Notice(`生成失败：${(error as Error).message}`, 10000);
		} finally {
			this.generateBtn.setDisabled(false).setButtonText('生成卡片');
		}
	}

	// ---------- 预览与写入（痛点 2 后半 + 痛点 1） ----------

	private renderPreviewSection(): void {
		this.previewSectionEl = this.contentEl.createDiv({ cls: 'anki-section' });
		hideEl(this.previewSectionEl);
		this.previewSectionEl.createEl('label', { text: '卡片预览（可编辑）' });
		this.previewEl = this.previewSectionEl.createEl('textarea', {
			cls: 'anki-preview-input',
		});
		this.previewEl.rows = 10;
	}

	private async onConfirm(): Promise<void> {
		const deckName = this.deckInput.value.trim();
		const cards = this.previewEl.value.trim();
		if (!deckName) {
			new Notice('Deck 名称不能为空');
			this.deckInput.focus();
			return;
		}
		if (!cards) {
			new Notice('卡片内容为空，请先生成');
			return;
		}

		this.confirmBtn.setDisabled(true).setButtonText('写入中…');
		try {
			const file = await this.host.factory.ensureDeckFile(deckName);
			const entry = this.host.registry.register(deckName, file.path);
			this.host.registry.touch(entry);
			await this.host.factory.appendCards(file, cards);
			await this.host.saveSettings();

			const count = NoteFactory.countCards(cards);
			new Notice(`已写入 ${count} 张卡片 → ${file.path}`);
			this.close();
			this.app.workspace.getLeaf().openFile(file);
		} catch (error) {
			new Notice(`写入失败：${(error as Error).message}`, 10000);
			this.confirmBtn.setDisabled(false).setButtonText('确认写入');
		}
	}

	private renderFooter(): void {
		const footer = this.contentEl.createDiv({ cls: 'anki-modal-footer' });
		new ButtonComponent(footer).setButtonText('取消').onClick(() => this.close());
		this.confirmBtn = new ButtonComponent(footer)
			.setButtonText('确认写入')
			.setCta()
			.setDisabled(true)
			.onClick(() => void this.onConfirm());
	}
}
