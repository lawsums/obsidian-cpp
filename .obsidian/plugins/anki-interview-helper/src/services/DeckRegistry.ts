import { App, TFile } from 'obsidian';
import { DeckEntry, InterviewHelperSettings } from '../types';

/**
 * 匹配 Deck 指定行。生成时统一写 `Deck: 牌组名`；
 * 同时兼容历史文件中的 `TARGET DECK: 牌组名`（Obsidian to Anki 旧默认格式），便于扫描回填。
 */
const TARGET_DECK_RE = /^\s*(?:TARGET DECK|Deck|deck)\s*:\s*(.+?)\s*$/i;

/** 每个文件只读取头部若干行来查找 Deck 标记行 */
const SCAN_HEAD_LINES = 20;

export interface ScanResult {
	/** 扫描到的 Deck 文件总数 */
	total: number;
	/** 新增的注册表条目数 */
	added: number;
	/** 更新的注册表条目数 */
	updated: number;
	/** 新标记为已归档的条目数 */
	archivedMarked: number;
}

/**
 * 轻量子序列模糊打分：
 * - 完全相等 > 前缀匹配 > 子序列匹配
 * - 连续命中给递增加分（更接近人类直觉的匹配）
 * - 未完全匹配返回 -1
 */
function fuzzyScore(pattern: string, text: string): number {
	if (!pattern) return 1;
	const p = pattern.toLowerCase();
	const t = text.toLowerCase();
	if (t === p) return 1000;
	if (t.startsWith(p)) return 800 - (t.length - p.length);

	let pi = 0;
	let score = 0;
	let streak = 0;
	let lastIdx = -1;
	for (let ti = 0; ti < t.length && pi < p.length; ti++) {
		if (t[ti] === p[pi]) {
			streak = lastIdx === ti - 1 ? streak + 1 : 1;
			score += 10 + streak * 2 + (ti === 0 ? 5 : 0);
			lastIdx = ti;
			pi++;
		}
	}
	if (pi < p.length) return -1;
	return score;
}

function normalizeDir(dir: string): string {
	return dir.trim().replace(/^\/+|\/+$/g, '');
}

/**
 * Deck 注册表：本插件的记忆中枢。
 * - deck → 文件路径 映射，让「选 Deck」直接完成文件定位
 * - 支持模糊搜索排序（匹配分 > 未归档优先 > 最近使用优先）
 * - 支持扫描 vault 回填历史 Deck
 */
export class DeckRegistry {
	constructor(private settings: InterviewHelperSettings) {}

	get all(): DeckEntry[] {
		return this.settings.decks;
	}

	get(name: string): DeckEntry | undefined {
		const trimmed = name.trim();
		return this.settings.decks.find((d) => d.name === trimmed);
	}

	search(query: string, limit = 8): DeckEntry[] {
		const q = query.trim();
		const scored = this.settings.decks
			.map((deck) => ({ deck, score: fuzzyScore(q, deck.name) }))
			.filter((x) => x.score >= 0)
			.sort(
				(a, b) =>
					b.score - a.score ||
					Number(a.deck.archived) - Number(b.deck.archived) ||
					b.deck.lastUsed - a.deck.lastUsed
			);
		return scored.slice(0, limit).map((x) => x.deck);
	}

	/** 注册（或刷新）一个 Deck 条目，返回该条目 */
	register(name: string, filePath: string, source: DeckEntry['source'] = 'created'): DeckEntry {
		const trimmed = name.trim();
		let entry = this.get(trimmed);
		if (!entry) {
			entry = {
				name: trimmed,
				filePath,
				lastUsed: 0,
				useCount: 0,
				archived: false,
				source,
			};
			this.settings.decks.push(entry);
		} else {
			entry.filePath = filePath;
			entry.archived = false;
		}
		return entry;
	}

	/** 记录一次使用 */
	touch(entry: DeckEntry): void {
		entry.lastUsed = Date.now();
		entry.useCount += 1;
	}

	/**
	 * 扫描整个 vault，读取每个 md 文件头部的 Deck 标记行（Deck: / TARGET DECK:），回填注册表。
	 * 归档目录内的文件会被标记为 archived。
	 */
	async scanVault(app: App): Promise<ScanResult> {
		const result: ScanResult = { total: 0, added: 0, updated: 0, archivedMarked: 0 };
		const archivePrefix = normalizeDir(this.settings.archiveDir);

		for (const file of app.vault.getMarkdownFiles()) {
			if (!(file instanceof TFile)) continue;
			const content = await app.vault.cachedRead(file);
			const deckName = this.extractTargetDeck(content);
			if (deckName === null) continue;

			result.total += 1;
			const archived = archivePrefix !== '' && file.path.startsWith(`${archivePrefix}/`);
			const existing = this.get(deckName);

			if (!existing) {
				this.settings.decks.push({
					name: deckName,
					filePath: file.path,
					lastUsed: file.stat.mtime,
					useCount: 0,
					archived,
					source: 'scanned',
				});
				if (archived) result.archivedMarked += 1;
				result.added += 1;
			} else {
				const wasArchived = existing.archived;
				existing.filePath = file.path;
				existing.archived = archived || wasArchived;
				if (archived && !wasArchived) result.archivedMarked += 1;
				result.updated += 1;
			}
		}
		return result;
	}

	private extractTargetDeck(content: string): string | null {
		for (const line of content.split('\n').slice(0, SCAN_HEAD_LINES)) {
			const match = line.match(TARGET_DECK_RE);
			if (match) return match[1];
		}
		return null;
	}
}
