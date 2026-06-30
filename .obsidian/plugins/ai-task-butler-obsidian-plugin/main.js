const {
  App,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  requestUrl,
  Setting,
  TFile,
  normalizePath
} = require("obsidian");

const DEFAULT_SETTINGS = {
  inboxPath: "Tasks/Inbox.md",
  defaultTag: "#task",
  aiProvider: "off",
  aiEndpoint: "https://api.openai.com/v1/chat/completions",
  aiModel: "gpt-4.1-mini",
  aiApiKey: "",
  appendCreatedDate: true,
  appendBlockId: true,
  openInboxAfterCapture: false,
  lowConfidenceThreshold: 0.55,
  enableReminderNotices: true,
  notifiedReminders: {}
};

const PRIORITY_MARKS = {
  highest: "🔺",
  high: "⏫",
  medium: "🔼",
  none: "",
  low: "🔽",
  lowest: "⏬"
};

const WEEKDAY = {
  "一": 1,
  "二": 2,
  "三": 3,
  "四": 4,
  "五": 5,
  "六": 6,
  "日": 0,
  "天": 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 0
};

module.exports = class AiTaskButlerPlugin extends Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    this.addRibbonIcon("list-plus", "AI Task Butler: capture task", () => {
      new CaptureTaskModal(this.app, this).open();
    });

    this.addCommand({
      id: "capture-ai-task",
      name: "Capture AI task",
      callback: () => new CaptureTaskModal(this.app, this).open()
    });

    this.addCommand({
      id: "capture-selection-as-ai-task",
      name: "Capture selection as AI task",
      editorCallback: async (editor) => {
        const selected = editor.getSelection();
        const text = selected && selected.trim() ? selected : editor.getLine(editor.getCursor().line);
        if (!text || !text.trim()) {
          new Notice("No text selected.");
          return;
        }
        const draft = await this.parseTask(text);
        await this.appendTask(draft);
      }
    });

    this.addCommand({
      id: "insert-today-task-dashboard",
      name: "Insert today task dashboard",
      editorCallback: (editor) => {
        editor.replaceSelection(todayTaskDashboardMarkdown());
      }
    });

    this.addSettingTab(new AiTaskButlerSettingTab(this.app, this));

    if (this.settings.enableReminderNotices) {
      this.registerInterval(window.setInterval(() => this.scanDueReminders(), 60 * 1000));
      window.setTimeout(() => this.scanDueReminders(), 3000);
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async parseTask(text) {
    return await parseTaskWithAiFallback(text, this.settings);
  }

  async appendTask(draft) {
    const markdown = taskDraftToMarkdown(draft, this.settings);
    const path = normalizePath(this.settings.inboxPath || DEFAULT_SETTINGS.inboxPath);
    const file = await ensureMarkdownFile(this.app, path);
    const current = await this.app.vault.read(file);
    const next = current.trim().length === 0
      ? `# Inbox\n\n${markdown}\n`
      : `${current.replace(/\s*$/, "\n")}${markdown}\n`;

    await this.app.vault.modify(file, next);
    new Notice(`Task captured: ${draft.title}`);

    if (this.settings.openInboxAfterCapture) {
      await this.app.workspace.getLeaf(false).openFile(file);
    }
  }

  async scanDueReminders() {
    const path = normalizePath(this.settings.inboxPath || DEFAULT_SETTINGS.inboxPath);
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) return;

    const content = await this.app.vault.read(file);
    const now = new Date();
    const staleBefore = now.getTime() - 24 * 60 * 60 * 1000;
    const lines = content.split(/\r?\n/);
    let changed = false;

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!/^- \[ \]/.test(line)) continue;

      const match = line.match(/⏰\s*(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
      if (!match) continue;

      const due = new Date(`${match[1]}T${match[2]}:00`);
      const key = `${path}:${index + 1}:${match[1]}T${match[2]}:${extractBlockId(line) || stableHash(line)}`;
      if (this.settings.notifiedReminders[key]) continue;
      if (Number.isNaN(due.getTime())) continue;
      if (due.getTime() > now.getTime()) continue;
      if (due.getTime() < staleBefore) continue;

      const title = notificationTitleFromTaskLine(line);
      new Notice(`该处理：${title}`, 10000);
      maybeSendSystemNotification("该处理", title);
      this.settings.notifiedReminders[key] = new Date().toISOString();
      changed = true;
    }

    if (changed) {
      await this.saveSettings();
    }
  }
};

class CaptureTaskModal extends Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.input = "";
    this.draft = null;
  }

  onOpen() {
    this.render();
  }

  render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("ai-task-butler-modal");

    contentEl.createEl("h2", { text: "AI Task Butler" });
    contentEl.createEl("p", {
      text: "输入一句自然语言任务，例如：明天下午三点提醒我给张三发合同，很重要。"
    });

    const textArea = contentEl.createEl("textarea", {
      cls: "ai-task-butler-input",
      attr: {
        placeholder: "写下或粘贴任务..."
      }
    });
    textArea.value = this.input;
    textArea.addEventListener("input", () => {
      this.input = textArea.value;
      this.draft = this.input.trim() ? parseTaskText(this.input) : null;
      this.renderPreview();
    });

    this.previewEl = contentEl.createDiv({ cls: "ai-task-butler-preview" });
    this.renderPreview();

    const buttonRow = contentEl.createDiv({ cls: "ai-task-butler-actions" });
    const voiceButton = buttonRow.createEl("button", { text: "语音输入" });
    voiceButton.addEventListener("click", () => this.startDictation(textArea, voiceButton));

    const cancelButton = buttonRow.createEl("button", { text: "取消" });
    cancelButton.addEventListener("click", () => this.close());

      const appendButton = buttonRow.createEl("button", {
      text: "加入 Inbox",
      cls: "mod-cta"
    });
    appendButton.addEventListener("click", async () => {
      if (!this.input.trim()) {
        new Notice("请输入任务内容。");
        return;
      }
      appendButton.disabled = true;
      appendButton.setText("解析中...");
      const draft = await this.plugin.parseTask(this.input);
      await this.plugin.appendTask(draft);
      this.close();
    });

    textArea.focus();
  }

  startDictation(textArea, voiceButton) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      new Notice("当前 Obsidian 环境不支持浏览器语音识别。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    voiceButton.disabled = true;
    voiceButton.setText("听写中...");

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      if (!transcript.trim()) return;
      const prefix = textArea.value.trim() ? `${textArea.value.trim()} ` : "";
      textArea.value = `${prefix}${transcript.trim()}`;
      this.input = textArea.value;
      this.draft = parseTaskText(this.input);
      this.renderPreview();
    };

    recognition.onerror = () => {
      new Notice("语音识别失败，请改用文本输入。");
    };

    recognition.onend = () => {
      voiceButton.disabled = false;
      voiceButton.setText("语音输入");
    };

    recognition.start();
  }

  renderPreview() {
    if (!this.previewEl) return;
    this.previewEl.empty();

    if (!this.draft) {
      this.previewEl.createEl("div", {
        cls: "ai-task-butler-empty",
        text: "预览会显示在这里。"
      });
      return;
    }

    const markdown = taskDraftToMarkdown(this.draft, this.plugin.settings);
    this.previewEl.createEl("div", { text: "将写入：" });
    this.previewEl.createEl("pre", { text: markdown });

    if (this.draft.confidence < this.plugin.settings.lowConfidenceThreshold) {
      this.previewEl.createEl("div", {
        cls: "ai-task-butler-warning",
        text: "解析置信度较低，建议确认日期、优先级或任务标题。"
      });
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}

class AiTaskButlerSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "AI Task Butler" });

    new Setting(containerEl)
      .setName("Inbox path")
      .setDesc("Captured tasks will be appended to this Markdown file.")
      .addText((text) => text
        .setPlaceholder("Tasks/Inbox.md")
        .setValue(this.plugin.settings.inboxPath)
        .onChange(async (value) => {
          this.plugin.settings.inboxPath = value.trim() || DEFAULT_SETTINGS.inboxPath;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Default tag")
      .setDesc("Added when the captured text does not include any #tag.")
      .addText((text) => text
        .setPlaceholder("#task")
        .setValue(this.plugin.settings.defaultTag)
        .onChange(async (value) => {
          const trimmed = value.trim();
          this.plugin.settings.defaultTag = trimmed ? normalizeTag(trimmed) : "";
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("AI provider")
      .setDesc("Use an OpenAI-compatible chat completions endpoint, or keep offline rule parsing.")
      .addDropdown((dropdown) => dropdown
        .addOption("off", "Offline rules")
        .addOption("openai-compatible", "OpenAI-compatible")
        .setValue(this.plugin.settings.aiProvider)
        .onChange(async (value) => {
          this.plugin.settings.aiProvider = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("AI endpoint")
      .setDesc("Chat completions endpoint. Keep the default for OpenAI-compatible APIs.")
      .addText((text) => text
        .setPlaceholder("https://api.openai.com/v1/chat/completions")
        .setValue(this.plugin.settings.aiEndpoint)
        .onChange(async (value) => {
          this.plugin.settings.aiEndpoint = value.trim() || DEFAULT_SETTINGS.aiEndpoint;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("AI model")
      .setDesc("Model name used by the configured endpoint.")
      .addText((text) => text
        .setPlaceholder("gpt-4.1-mini")
        .setValue(this.plugin.settings.aiModel)
        .onChange(async (value) => {
          this.plugin.settings.aiModel = value.trim() || DEFAULT_SETTINGS.aiModel;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("AI API key")
      .setDesc("Stored in this plugin's local Obsidian settings. Leave empty to use offline rules.")
      .addText((text) => {
        text.inputEl.type = "password";
        text
          .setPlaceholder("sk-...")
          .setValue(this.plugin.settings.aiApiKey)
          .onChange(async (value) => {
            this.plugin.settings.aiApiKey = value.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Append created date")
      .setDesc("Adds ➕ YYYY-MM-DD to each task.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.appendCreatedDate)
        .onChange(async (value) => {
          this.plugin.settings.appendCreatedDate = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Append block ID")
      .setDesc("Adds a stable ^task-* ID so future reminder/MCP layers can find the task after it moves.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.appendBlockId)
        .onChange(async (value) => {
          this.plugin.settings.appendBlockId = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Open Inbox after capture")
      .setDesc("Open the target Inbox note after appending a task.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.openInboxAfterCapture)
        .onChange(async (value) => {
          this.plugin.settings.openInboxAfterCapture = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Reminder notices")
      .setDesc("While Obsidian is open, scan the Inbox for due ⏰ reminders and show notifications.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.enableReminderNotices)
        .onChange(async (value) => {
          this.plugin.settings.enableReminderNotices = value;
          await this.plugin.saveSettings();
        }));
  }
}

async function ensureMarkdownFile(app, path) {
  const existing = app.vault.getAbstractFileByPath(path);
  if (existing instanceof TFile) return existing;

  const parts = path.split("/");
  parts.pop();
  let current = "";
  for (const part of parts) {
    if (!part) continue;
    current = current ? `${current}/${part}` : part;
    if (!app.vault.getAbstractFileByPath(current)) {
      await app.vault.createFolder(current);
    }
  }

  return await app.vault.create(path, "# Inbox\n\n");
}

function parseTaskText(rawText, now = new Date()) {
  const original = rawText.trim().replace(/\s+/g, " ");
  const extractedTags = [...original.matchAll(/#[\p{L}\p{N}_/-]+/gu)].map((match) => match[0]);
  const priority = inferPriority(original);
  const dateInfo = inferDateInfo(original, now);
  const timeInfo = inferTimeInfo(original);
  const reminderAt = dateInfo.scheduledDate && timeInfo
    ? `${dateInfo.scheduledDate}T${timeInfo}:00`
    : undefined;
  const title = cleanTitle(original);

  let confidence = 0.72;
  if (dateInfo.scheduledDate || dateInfo.dueDate) confidence += 0.1;
  if (priority !== "none") confidence += 0.05;
  if (/找时间|有空|哪天|抽空|回头|之后/.test(original)) confidence -= 0.28;
  if (title.length < 3) confidence -= 0.2;

  return {
    title: title || original,
    tags: extractedTags,
    scheduledDate: dateInfo.scheduledDate,
    dueDate: dateInfo.dueDate,
    startDate: dateInfo.startDate,
    reminderAt,
    priority,
    confidence: Math.max(0.1, Math.min(confidence, 0.95)),
    sourceText: original
  };
}

async function parseTaskWithAiFallback(rawText, settings, now = new Date()) {
  const localDraft = parseTaskText(rawText, now);
  if (settings.aiProvider !== "openai-compatible" || !settings.aiApiKey) {
    return localDraft;
  }

  try {
    const aiDraft = await parseTaskWithOpenAiCompatible(rawText, settings, now);
    return normalizeAiDraft(aiDraft, localDraft);
  } catch (error) {
    console.warn("AI Task Butler: AI parsing failed, using offline parser.", error);
    new Notice("AI parsing failed; used offline parser instead.");
    return localDraft;
  }
}

async function parseTaskWithOpenAiCompatible(rawText, settings, now) {
  const payload = {
    model: settings.aiModel || DEFAULT_SETTINGS.aiModel,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "You convert natural-language task captures into strict JSON.",
          "Return only valid JSON with these keys:",
          "title, notes, project, tags, startDate, scheduledDate, dueDate, reminderAt, priority, estimatedMinutes, confidence, questions.",
          "Dates must be YYYY-MM-DD. reminderAt must be local ISO-like datetime YYYY-MM-DDTHH:mm:ss without timezone.",
          "priority must be one of highest, high, medium, none, low, lowest.",
          "tags must be an array of Obsidian tags beginning with #.",
          "Use null for unknown optional fields. Do not invent dates."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          text: rawText,
          now: now.toISOString(),
          locale: "zh-CN",
          timezoneHint: Intl.DateTimeFormat().resolvedOptions().timeZone || "local"
        })
      }
    ]
  };

  const response = await requestUrl({
    url: settings.aiEndpoint || DEFAULT_SETTINGS.aiEndpoint,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${settings.aiApiKey}`
    },
    body: JSON.stringify(payload)
  });

  const content = response.json?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI response did not include message content.");
  }

  return JSON.parse(content);
}

function normalizeAiDraft(aiDraft, fallbackDraft) {
  const priority = isValidPriority(aiDraft.priority) ? aiDraft.priority : fallbackDraft.priority;
  const tags = Array.isArray(aiDraft.tags)
    ? aiDraft.tags.filter(Boolean).map(String).map(normalizeTag)
    : fallbackDraft.tags;

  const normalized = {
    title: safeString(aiDraft.title) || fallbackDraft.title,
    notes: safeString(aiDraft.notes) || undefined,
    project: safeString(aiDraft.project) || undefined,
    tags,
    startDate: validDateOrUndefined(aiDraft.startDate) || fallbackDraft.startDate,
    scheduledDate: validDateOrUndefined(aiDraft.scheduledDate) || fallbackDraft.scheduledDate,
    dueDate: validDateOrUndefined(aiDraft.dueDate) || fallbackDraft.dueDate,
    reminderAt: validReminderOrUndefined(aiDraft.reminderAt) || fallbackDraft.reminderAt,
    priority,
    estimatedMinutes: Number.isFinite(Number(aiDraft.estimatedMinutes)) ? Number(aiDraft.estimatedMinutes) : undefined,
    confidence: clampConfidence(aiDraft.confidence, fallbackDraft.confidence),
    questions: Array.isArray(aiDraft.questions) ? aiDraft.questions.filter(Boolean).map(String) : [],
    sourceText: fallbackDraft.sourceText
  };

  if (!normalized.scheduledDate && normalized.reminderAt) {
    normalized.scheduledDate = normalized.reminderAt.slice(0, 10);
  }

  return normalized;
}

function safeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidPriority(value) {
  return Object.prototype.hasOwnProperty.call(PRIORITY_MARKS, value);
}

function validDateOrUndefined(value) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : undefined;
}

function validReminderOrUndefined(value) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(trimmed) ? trimmed : undefined;
}

function clampConfidence(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0.1, Math.min(numeric, 0.99));
}

function taskDraftToMarkdown(draft, settings) {
  const parts = [`- [ ] ${draft.title}`];
  const tags = draft.tags && draft.tags.length > 0
    ? draft.tags.map(normalizeTag)
    : settings.defaultTag ? [normalizeTag(settings.defaultTag)] : [];

  for (const tag of unique(tags)) {
    if (tag) parts.push(tag);
  }

  const priorityMark = PRIORITY_MARKS[draft.priority] || "";
  if (priorityMark) parts.push(priorityMark);
  if (draft.startDate) parts.push(`🛫 ${draft.startDate}`);
  if (draft.scheduledDate) parts.push(`⏳ ${draft.scheduledDate}`);
  if (draft.dueDate) parts.push(`📅 ${draft.dueDate}`);
  if (draft.reminderAt) parts.push(`⏰ ${formatReminderAt(draft.reminderAt)}`);
  if (settings.appendCreatedDate) parts.push(`➕ ${formatDate(new Date())}`);
  if (settings.appendBlockId) parts.push(makeBlockId(draft));

  return parts.join(" ");
}

function inferPriority(text) {
  if (/最高优先级|非常重要|十万火急|立刻|马上|必须今天|紧急/.test(text)) return "highest";
  if (/重要|尽快|客户|老板|截止|ddl|deadline|必须/.test(text)) return "high";
  if (/一般|正常|普通/.test(text)) return "medium";
  if (/有空|不急|顺手|回头|低优先级/.test(text)) return "low";
  return "none";
}

function inferDateInfo(text, now) {
  const result = {};
  const lower = text.toLowerCase();

  if (/从.*开始/.test(text)) {
    result.startDate = inferSingleDate(text, now);
  }

  if (/截止|之前|前|到期|due|ddl|deadline/.test(lower)) {
    result.dueDate = inferSingleDate(text, now);
  } else {
    result.scheduledDate = inferSingleDate(text, now);
  }

  if (/提醒我|记得提醒|到时候叫/.test(text) && !result.scheduledDate) {
    result.scheduledDate = inferSingleDate(text, now);
  }

  return result;
}

function inferSingleDate(text, now) {
  const isoMatch = text.match(/(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})日?/);
  if (isoMatch) {
    return formatDate(new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])));
  }

  const monthDayMatch = text.match(/(\d{1,2})月(\d{1,2})[日号]?/);
  if (monthDayMatch) {
    const month = Number(monthDayMatch[1]) - 1;
    const day = Number(monthDayMatch[2]);
    const date = new Date(now.getFullYear(), month, day);
    if (date < startOfDay(now)) date.setFullYear(date.getFullYear() + 1);
    return formatDate(date);
  }

  if (/大后天/.test(text)) return formatDate(addDays(now, 3));
  if (/后天/.test(text)) return formatDate(addDays(now, 2));
  if (/明天|明日/.test(text)) return formatDate(addDays(now, 1));
  if (/今天|今日/.test(text)) return formatDate(now);

  const weekMatch = text.match(/(下周|下星期|这周|本周|周|星期)([一二三四五六日天1-7])/);
  if (weekMatch) {
    const target = WEEKDAY[weekMatch[2]];
    const base = startOfDay(now);
    const current = base.getDay();
    let delta = (target - current + 7) % 7;
    if (/下周|下星期/.test(weekMatch[1])) delta += 7;
    if (delta === 0 && !/这周|本周/.test(weekMatch[1])) delta = 7;
    return formatDate(addDays(base, delta));
  }

  return undefined;
}

function inferTimeInfo(text) {
  const match = text.match(/(?:(上午|早上|中午|下午|晚上|今晚|凌晨)\s*([零〇一二两三四五六七八九十\d]{1,3})(?:[:：点]([零〇一二两三四五六七八九十\d]{0,2})?)?|([零〇一二两三四五六七八九十\d]{1,3})[:：点]([零〇一二两三四五六七八九十\d]{0,2})?)/);
  if (!match) return undefined;

  let hour = parseChineseNumber(match[2] || match[4]);
  const minute = match[3] || match[5] ? parseChineseNumber(match[3] || match[5]) : 0;
  const period = match[1] || "";

  if (/下午|晚上|今晚/.test(period) && hour < 12) hour += 12;
  if (/中午/.test(period) && hour < 11) hour += 12;
  if (/凌晨|早上|上午/.test(period) && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return undefined;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function cleanTitle(text) {
  return text
    .replace(/#[\p{L}\p{N}_/-]+/gu, "")
    .replace(/提醒我|记得提醒|到时候叫我?/g, "")
    .replace(/(今天|今日|明天|明日|后天|大后天)/g, "")
    .replace(/(上午|早上|中午|下午|晚上|今晚|凌晨)\s*[零〇一二两三四五六七八九十\d]{1,3}([:：点][零〇一二两三四五六七八九十\d]{0,2})?/g, "")
    .replace(/[零〇一二两三四五六七八九十\d]{1,3}[:：点][零〇一二两三四五六七八九十\d]{0,2}/g, "")
    .replace(/(这个|这周|本周|下周|下星期)?(周|星期)[一二三四五六日天1-7]/g, "")
    .replace(/\d{4}[-/.年]\d{1,2}[-/.月]\d{1,2}日?/g, "")
    .replace(/\d{1,2}月\d{1,2}[日号]?/g, "")
    .replace(/(很|非常)?重要|最高优先级|高优先级|低优先级|不急|有空|顺手|尽快|紧急/g, "")
    .replace(/(之前|前|截止|到期|ddl|deadline)/gi, "")
    .replace(/[，。,.；;！!]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTag(tag) {
  const trimmed = tag.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

function unique(values) {
  return [...new Set(values)];
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function formatReminderAt(value) {
  return value.replace("T", " ").slice(0, 16);
}

function parseChineseNumber(value) {
  if (!value) return 0;
  if (/^\d+$/.test(value)) return Number(value);

  const digits = {
    "零": 0,
    "〇": 0,
    "一": 1,
    "二": 2,
    "两": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "七": 7,
    "八": 8,
    "九": 9
  };

  if (value === "十") return 10;
  if (value.startsWith("十")) return 10 + (digits[value.slice(1)] || 0);
  if (value.includes("十")) {
    const [tens, ones] = value.split("十");
    return (digits[tens] || 1) * 10 + (digits[ones] || 0);
  }

  return digits[value] || 0;
}

function makeBlockId(draft) {
  const hash = stableHash(`${draft.title}|${draft.sourceText}|${Date.now()}`);
  return `^task-${formatDate(new Date()).replace(/-/g, "")}-${hash}`;
}

function stableHash(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).slice(0, 8);
}

function extractBlockId(line) {
  const match = line.match(/\^task-[\w-]+/);
  return match ? match[0] : "";
}

function notificationTitleFromTaskLine(line) {
  return line
    .replace(/^- \[ \]\s*/, "")
    .replace(/#[\p{L}\p{N}_/-]+/gu, "")
    .replace(/[🔺⏫🔼🔽⏬]/g, "")
    .replace(/[🛫⏳📅➕]\s*\d{4}-\d{2}-\d{2}/g, "")
    .replace(/⏰\s*\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/g, "")
    .replace(/\^task-[\w-]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function maybeSendSystemNotification(title, body) {
  if (typeof Notification === "undefined") return;

  if (Notification.permission === "granted") {
    new Notification(title, { body });
    return;
  }

  if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, { body });
      }
    });
  }
}

function todayTaskDashboardMarkdown() {
  return [
    "## 今日任务",
    "",
    "```tasks",
    "not done",
    "happens on today",
    "sort by priority",
    "sort by due",
    "```",
    "",
    "## 已逾期",
    "",
    "```tasks",
    "not done",
    "due before today",
    "sort by due",
    "sort by priority",
    "```",
    "",
    "## 高优先级",
    "",
    "```tasks",
    "not done",
    "priority is above medium",
    "sort by due",
    "```",
    ""
  ].join("\n");
}
