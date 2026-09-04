export interface DeckEntry {
	/** Deck 名称，同时也是 Anki 中的牌组名 */
	name: string;
	/** 对应 md 文件的 vault 相对路径 */
	filePath: string;
	/** 最近一次使用时间（Unix ms） */
	lastUsed: number;
	/** 通过本插件写入卡片的次数 */
	useCount: number;
	/** 是否已归档（文件已移入归档目录，不再参与同步） */
	archived: boolean;
	/** 条目来源 */
	source: 'created' | 'scanned' | 'manual';
}

export interface LlmSettings {
	/** OpenAI 兼容 API 的 Base URL，如 https://api.deepseek.com/v1 */
	baseUrl: string;
	/** API Key（本地明文存储于插件 data.json） */
	apiKey: string;
	/** 模型名，如 deepseek-chat */
	model: string;
	/** 发送给 LLM 的系统提示词，控制卡片输出格式 */
	systemPrompt: string;
}

export interface InterviewHelperSettings {
	/** 题目根目录（vault 相对路径），所有 Deck 文件平铺于此 */
	rootDir: string;
	/** 归档目录（vault 相对路径） */
	archiveDir: string;
	/** 打开「新建面试题卡片」向导时，自动把当前激活文件的内容填入原始题目输入框 */
	autoLoadActiveFile: boolean;
	llm: LlmSettings;
	decks: DeckEntry[];
}

export const DEFAULT_SYSTEM_PROMPT = `你是面试题整理助手，负责将原始面试题转换为 Anki 知识卡片。

输出格式（必须严格遵守）：
{Q}题面{A}答案{E}

规则：
1. 每张卡片是一个 {Q}...{A}...{E} 块，卡片之间用一个空行分隔
2. {Q} 为题面：一句话、明确、可以直接自测的问句
3. {A} 为答案：使用 Markdown 格式（可加粗关键词、使用列表、行内代码、代码块等），比纯文本更易读
4. 短答案（几个并列要点）用顿号或逗号串联成一行；长答案分点列出
5. 原始材料包含多个独立知识点时，拆分为多张卡片
6. 只输出卡片内容本身：不要解释、不要前言、不要用代码块包裹输出`;

export const DEFAULT_SETTINGS: InterviewHelperSettings = {
	rootDir: 'Anki',
	archiveDir: 'Anki/Archive',
	autoLoadActiveFile: false,
	llm: {
		baseUrl: '',
		apiKey: '',
		model: '',
		systemPrompt: DEFAULT_SYSTEM_PROMPT,
	},
	decks: [],
};
