import { requestUrl } from 'obsidian';
import { LlmSettings } from '../types';

const MAX_ERROR_DETAIL = 300;

/** 若模型用 ```markdown ... ``` 包裹了输出，剥掉代码围栏 */
function stripCodeFence(text: string): string {
	const trimmed = text.trim();
	const match = trimmed.match(/^```[^\n]*\n([\s\S]*?)\n?```$/);
	return match ? match[1].trim() : trimmed;
}

function safeSlice(text: string): string {
	const sliced = text.slice(0, MAX_ERROR_DETAIL);
	return sliced.length < text.length ? `${sliced}…` : sliced;
}

/**
 * LLM 转换服务：走 OpenAI 兼容协议（/chat/completions），
 * 适配 DeepSeek / GLM / Kimi / Ollama / 各类中转站。
 */
export class LlmService {
	constructor(private getSettings: () => LlmSettings) {}

	/** 将原始题目文本转换为 {Q}...{A}...{E} 卡片内容 */
	async convert(rawQuestion: string): Promise<string> {
		const { baseUrl, apiKey, model, systemPrompt } = this.getSettings();
		if (!baseUrl) throw new Error('LLM Base URL 未配置，请先到插件设置中填写');
		if (!model) throw new Error('模型名未配置，请先到插件设置中填写');

		let response;
		try {
			response = await requestUrl({
				url: `${baseUrl.replace(/\/+$/, '')}/chat/completions`,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
				},
				body: JSON.stringify({
					model,
					messages: [
						{ role: 'system', content: systemPrompt },
						{ role: 'user', content: rawQuestion },
					],
					temperature: 0.3,
				}),
				throw: false,
			});
		} catch (error) {
			throw new Error(`无法连接 LLM 服务：${(error as Error).message}`);
		}

		if (response.status !== 200) {
			throw new Error(
				`LLM 请求失败（HTTP ${response.status}）${response.text ? `：${safeSlice(response.text)}` : ''}`
			);
		}

		const content: unknown = response.json?.choices?.[0]?.message?.content;
		if (typeof content !== 'string' || !content.trim()) {
			throw new Error('LLM 返回内容为空，请检查模型名是否正确');
		}
		return stripCodeFence(content);
	}
}
