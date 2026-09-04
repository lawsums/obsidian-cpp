import { Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, InterviewHelperSettings } from './src/types';
import { DeckRegistry } from './src/services/DeckRegistry';
import { LlmService } from './src/services/LlmService';
import { NoteFactory } from './src/services/NoteFactory';
import { InterviewHelperSettingTab } from './src/settings';
import { NewQuestionModal } from './src/modals/NewQuestionModal';

export default class AnkiInterviewHelper extends Plugin {
	settings!: InterviewHelperSettings;
	registry!: DeckRegistry;
	llm!: LlmService;
	factory!: NoteFactory;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registry = new DeckRegistry(this.settings);
		this.llm = new LlmService(() => this.settings.llm);
		this.factory = new NoteFactory(this.app, () => this.settings.rootDir);

		this.addRibbonIcon('layers', '新建面试题卡片', () => {
			new NewQuestionModal(this.app, this).open();
		});

		this.addCommand({
			id: 'new-interview-card',
			name: '新建面试题卡片',
			callback: () => new NewQuestionModal(this.app, this).open(),
		});

		this.addCommand({
			id: 'new-interview-card-from-current-file',
			name: '新建面试题卡片（读取当前文件）',
			callback: () =>
				new NewQuestionModal(this.app, this, { preloadActiveFile: true }).open(),
		});

		this.addCommand({
			id: 'scan-deck-registry',
			name: '扫描回填 Deck 注册表',
			callback: () => void this.scanDeckRegistry(),
		});

		this.addSettingTab(new InterviewHelperSettingTab(this.app, this));
	}

	private async scanDeckRegistry(): Promise<void> {
		new Notice('正在扫描 vault 中的 Deck 标记行（Deck: / TARGET DECK:）…');
		const result = await this.registry.scanVault(this.app);
		await this.saveSettings();
		new Notice(
			`扫描完成：共 ${result.total} 个 Deck 文件，新增 ${result.added}，更新 ${result.updated}，标记归档 ${result.archivedMarked}`
		);
	}

	async loadSettings(): Promise<void> {
		const loaded = (await this.loadData()) as Partial<InterviewHelperSettings> | null;
		this.settings = {
			...DEFAULT_SETTINGS,
			...loaded,
			llm: { ...DEFAULT_SETTINGS.llm, ...(loaded?.llm ?? {}) },
			decks: loaded?.decks ?? [],
		};
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
