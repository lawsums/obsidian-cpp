import { App, PluginSettingTab, Setting } from 'obsidian';
import type AnkiInterviewHelper from '../main';

export class InterviewHelperSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: AnkiInterviewHelper) {
		super(app, plugin);
	}

	display(): void {
		this.containerEl.empty();

		this.renderStorageSection();
		this.renderLlmSection();
		this.renderRegistrySection();
	}

	// ---------- 存储 ----------

	private renderStorageSection(): void {
		new Setting(this.containerEl).setName('存储').setHeading();

		new Setting(this.containerEl)
			.setName('题目根目录')
			.setDesc('所有 Deck 文件平铺存放的目录（vault 相对路径），留空表示 vault 根目录')
			.addText((text) =>
				text.setPlaceholder('Anki').setValue(this.plugin.settings.rootDir).onChange(async (value) => {
					this.plugin.settings.rootDir = value.trim();
					await this.plugin.saveSettings();
				})
			);

		new Setting(this.containerEl)
			.setName('归档目录')
			.setDesc('已掌握题目的归档位置（vault 相对路径），需在 Obsidian to Anki 中配置忽略，见下方提示')
			.addText((text) =>
				text.setPlaceholder('Anki/Archive').setValue(this.plugin.settings.archiveDir).onChange(async (value) => {
					this.plugin.settings.archiveDir = value.trim();
					await this.plugin.saveSettings();
					this.containerEl.empty();
					this.display();
				})
			);

		new Setting(this.containerEl)
			.setName('打开向导时自动读取当前文件')
			.setDesc(
				'开启后，每次打开「新建面试题卡片」向导时，自动把当前激活文件的内容填入原始题目输入框' +
					'（也可随时用命令「新建面试题卡片（读取当前文件）」手动触发）'
			)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.autoLoadActiveFile).onChange(async (value) => {
					this.plugin.settings.autoLoadActiveFile = value;
					await this.plugin.saveSettings();
				})
			);

		this.renderIgnoreGlobHint();
	}

	private renderIgnoreGlobHint(): void {
		const archiveDir = this.plugin.settings.archiveDir.trim().replace(/\/+$/, '');
		const glob = archiveDir ? `${archiveDir}/**` : '';
		const setting = new Setting(this.containerEl)
			.setName('Obsidian to Anki 忽略规则')
			.setDesc(
				glob
					? `请将以下 glob 添加到 Obsidian to Anki 设置的忽略列表（设置 → Ignore Files and Folders），使归档目录退出同步：${glob}`
					: '归档目录为空，未生成忽略规则'
			);
		if (glob) {
			setting.addButton((button) =>
				button.setButtonText('复制').onClick(async () => {
					try {
						await navigator.clipboard.writeText(glob);
						setting.setName('Obsidian to Anki 忽略规则（已复制）');
					} catch {
						// 剪贴板不可用时直接展示，便于手动复制
						setting.setName(`忽略规则（手动复制）：${glob}`);
					}
				})
			);
		}
	}

	// ---------- LLM ----------

	private renderLlmSection(): void {
		new Setting(this.containerEl).setName('LLM 转换').setHeading();

		new Setting(this.containerEl)
			.setName('Base URL')
			.setDesc('OpenAI 兼容 API 地址，如 https://api.deepseek.com/v1 或 http://localhost:11434/v1')
			.addText((text) =>
				text.setPlaceholder('https://api.deepseek.com/v1').setValue(this.plugin.settings.llm.baseUrl).onChange(async (value) => {
					this.plugin.settings.llm.baseUrl = value.trim();
					await this.plugin.saveSettings();
				})
			);

		new Setting(this.containerEl)
			.setName('API Key')
			.setDesc('留空表示无需鉴权（如本地 Ollama）')
			.addText((text) => {
				text.inputEl.type = 'password';
				text.setPlaceholder('sk-...').setValue(this.plugin.settings.llm.apiKey).onChange(async (value) => {
					this.plugin.settings.llm.apiKey = value.trim();
					await this.plugin.saveSettings();
				});
			});

		new Setting(this.containerEl)
			.setName('模型名')
			.setDesc('如 deepseek-chat、glm-4、qwen2.5:14b 等')
			.addText((text) =>
				text.setPlaceholder('deepseek-chat').setValue(this.plugin.settings.llm.model).onChange(async (value) => {
					this.plugin.settings.llm.model = value.trim();
					await this.plugin.saveSettings();
				})
			);

		new Setting(this.containerEl)
			.setName('System Prompt（卡片格式）')
			.setDesc('发送给 LLM 的转换指令，控制卡片输出格式；修改后对下次生成生效')
			.addTextArea((area) => {
				area.setValue(this.plugin.settings.llm.systemPrompt).onChange(async (value) => {
					this.plugin.settings.llm.systemPrompt = value;
					await this.plugin.saveSettings();
				});
				area.inputEl.rows = 14;
				area.inputEl.addClass('anki-settings-textarea');
			});
	}

	// ---------- Deck 注册表 ----------

	private renderRegistrySection(): void {
		new Setting(this.containerEl).setName('Deck 注册表').setHeading();

		const decks = this.plugin.registry.all;
		const archived = decks.filter((d) => d.archived).length;
		new Setting(this.containerEl)
			.setName('当前状态')
			.setDesc(
				`已注册 ${decks.length} 个 Deck（其中 ${archived} 个已归档）。` +
					'在命令面板运行「Anki Interview Helper: 扫描回填 Deck 注册表」可导入 vault 中已有的 Deck 文件。' +
					'注册表存储在插件数据中，删除插件数据前请先扫描备份。'
			);
	}
}
