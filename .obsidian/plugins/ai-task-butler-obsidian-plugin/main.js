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
  openaiTaskEndpoint: "https://api.openai.com/v1/chat/completions",
  openaiTaskModel: "gpt-4.1-mini",
  openaiTaskApiKey: "",
  alibabaTaskEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  alibabaTaskModel: "qwen-plus",
  alibabaTaskApiKey: "",
  transcriptionProvider: "web-speech",
  openaiTranscriptionEndpoint: "https://api.openai.com/v1/audio/transcriptions",
  openaiTranscriptionModel: "gpt-4o-mini-transcribe",
  openaiTranscriptionApiKey: "",
  alibabaTranscriptionEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  alibabaTranscriptionModel: "qwen3-asr-flash",
  alibabaTranscriptionApiKey: "",
  alibabaTranscriptionLanguage: "zh",
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
      id: "quick-voice-task",
      name: "Quick voice task",
      callback: () => new QuickVoiceTaskModal(this.app, this).open()
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
      id: "test-ai-task-parser",
      name: "Test AI task parser",
      callback: async () => {
        const sample = "明天下午三点提醒我给张三发合同，很重要 #work";
        const draft = await this.parseTask(sample);
        new Notice(taskDraftToMarkdown(draft, this.settings), 15000);
      }
    });

    this.addCommand({
      id: "insert-today-task-dashboard",
      name: "Insert today task dashboard",
      editorCallback: (editor) => {
        editor.replaceSelection(todayTaskDashboardMarkdown());
      }
    });

    this.addCommand({
      id: "scan-due-reminders-now",
      name: "Scan due reminders now",
      callback: async () => {
        const count = await this.scanDueReminders();
        new Notice(`Reminder scan complete. Triggered ${count} reminder(s).`);
      }
    });

    this.addCommand({
      id: "test-reminder-notification",
      name: "Test reminder notification",
      callback: () => {
        new Notice("AI Task Butler reminder test.", 10000);
        maybeSendSystemNotification("AI Task Butler", "Reminder notification test.");
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

  canUseConfiguredTranscriptionProvider() {
    if (this.settings.transcriptionProvider === "openai") {
      return Boolean(this.settings.openaiTranscriptionApiKey);
    }
    if (this.settings.transcriptionProvider === "alibaba") {
      return Boolean(this.settings.alibabaTranscriptionApiKey);
    }
    return true;
  }

  async transcribeAudio(blob) {
    return await transcribeAudio(blob, this.settings);
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
    const now = new Date();
    const staleBefore = now.getTime() - 24 * 60 * 60 * 1000;
    const files = this.getReminderScanFiles();
    let changed = false;
    let triggered = 0;

    for (const file of files) {
      const content = await this.app.vault.read(file);
      const lines = content.split(/\r?\n/);
      const path = file.path;

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
        maybeSendSystemNotification("该处理", `${title}\n${path}:${index + 1}`);
        this.settings.notifiedReminders[key] = new Date().toISOString();
        changed = true;
        triggered += 1;
      }
    }

    if (changed) {
      await this.saveSettings();
    }

    return triggered;
  }

  getReminderScanFiles() {
    const path = normalizePath(this.settings.inboxPath || DEFAULT_SETTINGS.inboxPath);
    const file = this.app.vault.getAbstractFileByPath(path);
    return file instanceof TFile ? [file] : [];
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
    voiceButton.addEventListener("click", () => {
      if (this.activeRecorder) {
        this.stopApiRecording();
        return;
      }
      if (this.activeRecognition) {
        this.stopDictation();
        return;
      }
      this.startVoiceInput(textArea, voiceButton);
    });

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

  startVoiceInput(textArea, voiceButton) {
    const provider = this.plugin.settings.transcriptionProvider || "web-speech";
    if (provider === "openai" || provider === "alibaba") {
      this.startApiRecording(textArea, voiceButton);
      return;
    }

    this.startDictation(textArea, voiceButton);
  }

  async startApiRecording(textArea, voiceButton) {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      new Notice("当前环境不支持录音，请检查 Obsidian 桌面版或系统权限。");
      return;
    }

    const provider = this.plugin.settings.transcriptionProvider;
    if (!this.plugin.canUseConfiguredTranscriptionProvider()) {
      new Notice("请先在 AI Task Butler 设置里填写当前转写服务的 API Key。", 10000);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickRecordingMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks = [];

      this.activeRecorder = recorder;
      this.activeRecorderStream = stream;
      voiceButton.setText("停止录音");
      new Notice(provider === "openai" ? "正在录音，停止后将用 OpenAI 转写。" : "正在录音，停止后将用阿里云转写。");

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunks.push(event.data);
      };

      recorder.onerror = () => {
        new Notice("录音失败，请检查麦克风权限。");
      };

      recorder.onstop = async () => {
        this.stopRecordingTracks();
        voiceButton.setText("转写中...");

        try {
          const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
          if (blob.size < 1024) {
            throw new Error("录音太短或为空，请录制至少 1 秒语音。");
          }
          const transcript = await this.plugin.transcribeAudio(blob);
          this.appendTranscriptToInput(textArea, transcript);
          new Notice("语音转写完成。");
        } catch (error) {
          console.error("AI Task Butler: transcription failed.", error);
          new Notice(`语音转写失败：${error.message || "未知错误"}`, 12000);
        } finally {
          this.activeRecorder = null;
          this.activeRecorderStream = null;
          voiceButton.setText("语音输入");
        }
      };

      recorder.start();
    } catch (error) {
      this.activeRecorder = null;
      this.stopRecordingTracks();
      voiceButton.setText("语音输入");
      new Notice(`无法开始录音：${error.message || "请检查麦克风权限"}`, 10000);
    }
  }

  stopApiRecording() {
    if (!this.activeRecorder) return;
    if (this.activeRecorder.state !== "inactive") {
      this.activeRecorder.stop();
    }
  }

  stopRecordingTracks() {
    if (!this.activeRecorderStream) return;
    for (const track of this.activeRecorderStream.getTracks()) {
      track.stop();
    }
  }

  appendTranscriptToInput(textArea, transcript) {
    const cleanTranscript = (transcript || "").trim();
    if (!cleanTranscript) {
      new Notice("转写结果为空，请再试一次。");
      return;
    }

    const prefix = textArea.value.trim() ? `${textArea.value.trim()} ` : "";
    textArea.value = `${prefix}${cleanTranscript}`;
    this.input = textArea.value;
    this.draft = parseTaskText(this.input);
    this.renderPreview();
  }

  startDictation(textArea, voiceButton) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      new Notice("当前 Obsidian 环境不支持浏览器语音识别，请先用文本输入。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    const baseText = textArea.value.trim();
    let finalTranscript = "";
    let started = false;
    let handledError = false;

    this.activeRecognition = recognition;
    voiceButton.setText("停止听写");

    recognition.onstart = () => {
      started = true;
      new Notice("正在听写，请开始说话。");
    };

    recognition.onaudiostart = () => {
      voiceButton.setText("正在听...");
    };

    recognition.onspeechstart = () => {
      voiceButton.setText("识别中...");
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index]?.[0]?.transcript || "";
        if (event.results[index].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const combined = `${finalTranscript}${interimTranscript}`.trim();
      if (!combined) return;

      textArea.value = [baseText, combined].filter(Boolean).join(" ");
      this.input = textArea.value;
      this.draft = parseTaskText(this.input);
      this.renderPreview();
    };

    recognition.onnomatch = () => {
      new Notice("没有识别到清晰语音，请再试一次。");
    };

    recognition.onerror = (event) => {
      handledError = true;
      new Notice(dictationErrorMessage(event?.error), 10000);
    };

    recognition.onend = () => {
      this.activeRecognition = null;
      voiceButton.setText("语音输入");
      if (!started && !handledError) {
        new Notice("语音识别没有启动，可能是当前 Obsidian 环境不支持。");
      }
    };

    try {
      recognition.start();
    } catch (error) {
      this.activeRecognition = null;
      voiceButton.setText("语音输入");
      new Notice(`语音识别启动失败：${error.message || "未知错误"}`, 10000);
    }
  }

  stopDictation() {
    if (!this.activeRecognition) return;
    try {
      this.activeRecognition.stop();
    } catch (error) {
      console.warn("AI Task Butler: failed to stop dictation.", error);
    }
    this.activeRecognition = null;
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

class QuickVoiceTaskModal extends Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.status = "准备录音...";
    this.transcript = "";
    this.draft = null;
    this.chunks = [];
    this.hasHeardVoice = false;
    this.silenceStartedAt = null;
    this.rafId = null;
  }

  onOpen() {
    this.render();
    this.scope.register([], "Enter", (event) => {
      event.preventDefault();
      this.commitTask();
    });
    this.scope.register([], "r", (event) => {
      event.preventDefault();
      this.restart();
    });
    window.setTimeout(() => this.start(), 150);
  }

  render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("ai-task-butler-modal");
    contentEl.addClass("ai-task-butler-quick-voice");

    contentEl.createEl("h2", { text: "快速语音任务" });
    this.statusEl = contentEl.createEl("div", {
      cls: "ai-task-butler-voice-status",
      text: this.status
    });

    this.levelEl = contentEl.createDiv({ cls: "ai-task-butler-level" });
    this.levelBarEl = this.levelEl.createDiv({ cls: "ai-task-butler-level-bar" });

    this.previewEl = contentEl.createDiv({ cls: "ai-task-butler-preview" });
    this.renderPreview();

    const buttonRow = contentEl.createDiv({ cls: "ai-task-butler-actions" });
    const retryButton = buttonRow.createEl("button", { text: "重录 R" });
    retryButton.addEventListener("click", () => this.restart());

    const stopButton = buttonRow.createEl("button", { text: "停止录音" });
    stopButton.addEventListener("click", () => this.stopRecording());

    const saveButton = buttonRow.createEl("button", {
      text: "导入 Enter",
      cls: "mod-cta"
    });
    saveButton.addEventListener("click", () => this.commitTask());
  }

  renderPreview() {
    if (!this.previewEl) return;
    this.previewEl.empty();

    if (this.transcript) {
      this.previewEl.createEl("div", { text: "识别文本：" });
      this.previewEl.createEl("pre", { text: this.transcript });
    }

    if (this.draft) {
      this.previewEl.createEl("div", { text: "将写入：" });
      this.previewEl.createEl("pre", { text: taskDraftToMarkdown(this.draft, this.plugin.settings) });
      this.previewEl.createEl("div", {
        cls: "ai-task-butler-empty",
        text: "按 Enter 导入，按 r 重录。"
      });
      return;
    }

    if (!this.transcript) {
      this.previewEl.createEl("div", {
        cls: "ai-task-butler-empty",
        text: "说完后停顿一下，我会自动结束录音并识别。"
      });
    }
  }

  setStatus(status) {
    this.status = status;
    if (this.statusEl) this.statusEl.setText(status);
  }

  async start() {
    if (this.recorder) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      this.setStatus("当前环境不支持录音，请检查 Obsidian 桌面版或系统权限。");
      return;
    }
    if (!this.plugin.canUseConfiguredTranscriptionProvider()) {
      this.setStatus("请先在设置里选择 OpenAI 或阿里云转写，并填写对应 API Key。");
      return;
    }
    if (this.plugin.settings.transcriptionProvider === "web-speech") {
      this.setStatus("快速语音任务需要录音转写服务，请选择 OpenAI 或阿里云。");
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await this.startVoiceActivityDetection(this.stream);

      const mimeType = pickRecordingMimeType();
      this.recorder = mimeType ? new MediaRecorder(this.stream, { mimeType }) : new MediaRecorder(this.stream);
      this.chunks = [];
      this.hasHeardVoice = false;
      this.silenceStartedAt = null;

      this.recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) this.chunks.push(event.data);
      };
      this.recorder.onerror = () => {
        this.setStatus("录音失败，请检查麦克风权限。");
      };
      this.recorder.onstop = () => this.finishRecording();

      this.recorder.start();
      this.setStatus("正在听，请开始说话...");
    } catch (error) {
      this.cleanupAudio();
      this.setStatus(`无法开始录音：${error.message || "请检查麦克风权限"}`);
    }
  }

  async startVoiceActivityDetection(stream) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.audioContext = new AudioContextClass();
    const source = this.audioContext.createMediaStreamSource(stream);
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    this.analyser = analyser;
    this.audioData = new Uint8Array(analyser.fftSize);

    const voiceThreshold = 0.035;
    const silenceMs = 1100;
    const maxRecordingMs = 30000;
    const minRecordingMs = 700;
    const startedAt = Date.now();

    const tick = () => {
      if (!this.recorder || this.recorder.state !== "recording") {
        this.rafId = null;
        return;
      }

      analyser.getByteTimeDomainData(this.audioData);
      const level = rmsAudioLevel(this.audioData);
      if (this.levelBarEl) {
        this.levelBarEl.style.width = `${Math.min(100, Math.round(level * 280))}%`;
      }

      const now = Date.now();
      if (level > voiceThreshold) {
        this.hasHeardVoice = true;
        this.silenceStartedAt = null;
        this.setStatus("识别到人声，继续说...");
      } else if (this.hasHeardVoice) {
        if (!this.silenceStartedAt) this.silenceStartedAt = now;
        if (now - this.silenceStartedAt > silenceMs && now - startedAt > minRecordingMs) {
          this.setStatus("检测到停顿，正在转写...");
          this.stopRecording();
          return;
        }
      }

      if (now - startedAt > maxRecordingMs) {
        this.setStatus("录音达到 30 秒，正在转写...");
        this.stopRecording();
        return;
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  stopRecording() {
    if (this.recorder && this.recorder.state !== "inactive") {
      this.recorder.stop();
    }
  }

  async finishRecording() {
    this.cancelVad();
    this.stopTracks();

    try {
      const blob = new Blob(this.chunks, { type: this.recorder?.mimeType || "audio/webm" });
      this.recorder = null;
      if (blob.size < 1024) {
        this.setStatus("录音太短或为空，按 r 重录。");
        return;
      }

      this.setStatus("正在转写...");
      this.transcript = await this.plugin.transcribeAudio(blob);
      this.draft = await this.plugin.parseTask(this.transcript);
      this.setStatus("转写完成。按 Enter 导入，按 r 重录。");
      this.renderPreview();
    } catch (error) {
      console.error("AI Task Butler: quick voice task failed.", error);
      this.setStatus(`转写失败：${error.message || "未知错误"}。按 r 重录。`);
    }
  }

  async commitTask() {
    if (!this.draft) {
      new Notice("还没有可导入的任务。");
      return;
    }
    await this.plugin.appendTask(this.draft);
    this.close();
  }

  restart() {
    this.cancelVad();
    this.stopRecording();
    this.stopTracks();
    this.recorder = null;
    this.transcript = "";
    this.draft = null;
    this.chunks = [];
    this.hasHeardVoice = false;
    this.silenceStartedAt = null;
    this.setStatus("重新录音...");
    this.renderPreview();
    window.setTimeout(() => this.start(), 150);
  }

  cancelVad() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }

  stopTracks() {
    if (!this.stream) return;
    for (const track of this.stream.getTracks()) {
      track.stop();
    }
    this.stream = null;
  }

  cleanupAudio() {
    this.cancelVad();
    this.stopTracks();
    this.recorder = null;
  }

  onClose() {
    this.cleanupAudio();
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
      .setDesc("Captured tasks are appended here, and reminders are scanned only from this Markdown file.")
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
      .setDesc("Choose the text model used to translate natural language into structured tasks.")
      .addDropdown((dropdown) => dropdown
        .addOption("off", "Offline rules")
        .addOption("openai", "OpenAI")
        .addOption("alibaba", "Alibaba Qwen")
        .addOption("openai-compatible", "Custom OpenAI-compatible")
        .setValue(this.plugin.settings.aiProvider)
        .onChange(async (value) => {
          this.plugin.settings.aiProvider = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("OpenAI task endpoint")
      .setDesc("Used when AI provider is OpenAI.")
      .addText((text) => text
        .setPlaceholder(DEFAULT_SETTINGS.openaiTaskEndpoint)
        .setValue(this.plugin.settings.openaiTaskEndpoint)
        .onChange(async (value) => {
          this.plugin.settings.openaiTaskEndpoint = value.trim() || DEFAULT_SETTINGS.openaiTaskEndpoint;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("OpenAI task model")
      .setDesc("Text model used to parse tasks.")
      .addText((text) => text
        .setPlaceholder(DEFAULT_SETTINGS.openaiTaskModel)
        .setValue(this.plugin.settings.openaiTaskModel)
        .onChange(async (value) => {
          this.plugin.settings.openaiTaskModel = value.trim() || DEFAULT_SETTINGS.openaiTaskModel;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("OpenAI task API key")
      .setDesc("Stored locally in this plugin's settings.")
      .addText((text) => {
        text.inputEl.type = "password";
        text
          .setPlaceholder("sk-...")
          .setValue(this.plugin.settings.openaiTaskApiKey)
          .onChange(async (value) => {
            this.plugin.settings.openaiTaskApiKey = value.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Alibaba Qwen task endpoint")
      .setDesc("DashScope OpenAI-compatible chat completions endpoint.")
      .addText((text) => text
        .setPlaceholder(DEFAULT_SETTINGS.alibabaTaskEndpoint)
        .setValue(this.plugin.settings.alibabaTaskEndpoint)
        .onChange(async (value) => {
          this.plugin.settings.alibabaTaskEndpoint = value.trim() || DEFAULT_SETTINGS.alibabaTaskEndpoint;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Alibaba Qwen task model")
      .setDesc("Recommended default is qwen-plus.")
      .addText((text) => text
        .setPlaceholder(DEFAULT_SETTINGS.alibabaTaskModel)
        .setValue(this.plugin.settings.alibabaTaskModel)
        .onChange(async (value) => {
          this.plugin.settings.alibabaTaskModel = value.trim() || DEFAULT_SETTINGS.alibabaTaskModel;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Alibaba Qwen task API key")
      .setDesc("DashScope API key, stored locally in this plugin's settings.")
      .addText((text) => {
        text.inputEl.type = "password";
        text
          .setPlaceholder("sk-...")
          .setValue(this.plugin.settings.alibabaTaskApiKey)
          .onChange(async (value) => {
            this.plugin.settings.alibabaTaskApiKey = value.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("AI endpoint")
      .setDesc("Custom provider only. Chat completions endpoint for OpenAI-compatible APIs.")
      .addText((text) => text
        .setPlaceholder("https://api.openai.com/v1/chat/completions")
        .setValue(this.plugin.settings.aiEndpoint)
        .onChange(async (value) => {
          this.plugin.settings.aiEndpoint = value.trim() || DEFAULT_SETTINGS.aiEndpoint;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("AI model")
      .setDesc("Custom provider only. Model name used by the configured endpoint.")
      .addText((text) => text
        .setPlaceholder("gpt-4.1-mini")
        .setValue(this.plugin.settings.aiModel)
        .onChange(async (value) => {
          this.plugin.settings.aiModel = value.trim() || DEFAULT_SETTINGS.aiModel;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("AI API key")
      .setDesc("Custom provider only. Stored in this plugin's local Obsidian settings.")
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

    containerEl.createEl("h3", { text: "Voice transcription" });

    new Setting(containerEl)
      .setName("Transcription provider")
      .setDesc("Web Speech is built in but may fail in Obsidian. OpenAI and Alibaba record audio, then transcribe through API.")
      .addDropdown((dropdown) => dropdown
        .addOption("web-speech", "Web Speech")
        .addOption("openai", "OpenAI gpt-4o-mini-transcribe")
        .addOption("alibaba", "Alibaba Qwen-ASR")
        .setValue(this.plugin.settings.transcriptionProvider)
        .onChange(async (value) => {
          this.plugin.settings.transcriptionProvider = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("OpenAI transcription endpoint")
      .setDesc("Used when transcription provider is OpenAI.")
      .addText((text) => text
        .setPlaceholder(DEFAULT_SETTINGS.openaiTranscriptionEndpoint)
        .setValue(this.plugin.settings.openaiTranscriptionEndpoint)
        .onChange(async (value) => {
          this.plugin.settings.openaiTranscriptionEndpoint = value.trim() || DEFAULT_SETTINGS.openaiTranscriptionEndpoint;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("OpenAI transcription model")
      .setDesc("Recommended first model for short task voice capture.")
      .addText((text) => text
        .setPlaceholder(DEFAULT_SETTINGS.openaiTranscriptionModel)
        .setValue(this.plugin.settings.openaiTranscriptionModel)
        .onChange(async (value) => {
          this.plugin.settings.openaiTranscriptionModel = value.trim() || DEFAULT_SETTINGS.openaiTranscriptionModel;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("OpenAI transcription API key")
      .setDesc("Stored locally in this plugin's settings.")
      .addText((text) => {
        text.inputEl.type = "password";
        text
          .setPlaceholder("sk-...")
          .setValue(this.plugin.settings.openaiTranscriptionApiKey)
          .onChange(async (value) => {
            this.plugin.settings.openaiTranscriptionApiKey = value.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Alibaba transcription endpoint")
      .setDesc("DashScope OpenAI-compatible chat completions endpoint.")
      .addText((text) => text
        .setPlaceholder(DEFAULT_SETTINGS.alibabaTranscriptionEndpoint)
        .setValue(this.plugin.settings.alibabaTranscriptionEndpoint)
        .onChange(async (value) => {
          this.plugin.settings.alibabaTranscriptionEndpoint = value.trim() || DEFAULT_SETTINGS.alibabaTranscriptionEndpoint;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Alibaba transcription model")
      .setDesc("Default is qwen3-asr-flash.")
      .addText((text) => text
        .setPlaceholder(DEFAULT_SETTINGS.alibabaTranscriptionModel)
        .setValue(this.plugin.settings.alibabaTranscriptionModel)
        .onChange(async (value) => {
          this.plugin.settings.alibabaTranscriptionModel = value.trim() || DEFAULT_SETTINGS.alibabaTranscriptionModel;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Alibaba transcription API key")
      .setDesc("DashScope API key, stored locally in this plugin's settings.")
      .addText((text) => {
        text.inputEl.type = "password";
        text
          .setPlaceholder("sk-...")
          .setValue(this.plugin.settings.alibabaTranscriptionApiKey)
          .onChange(async (value) => {
            this.plugin.settings.alibabaTranscriptionApiKey = value.trim();
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
      .setDesc("While Obsidian is open, scan the configured Inbox file for due ⏰ reminders and show notifications.")
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
  if (!canUseTaskAiProvider(settings)) {
    return localDraft;
  }

  try {
    const aiDraft = await parseTaskWithChatCompletions(rawText, settings, now);
    return normalizeAiDraft(aiDraft, localDraft);
  } catch (error) {
    console.warn("AI Task Butler: AI parsing failed, using offline parser.", error);
    new Notice(`AI task parsing failed; used offline parser instead. ${error.message || ""}`, 10000);
    return localDraft;
  }
}

function canUseTaskAiProvider(settings) {
  if (settings.aiProvider === "openai") return Boolean(settings.openaiTaskApiKey);
  if (settings.aiProvider === "alibaba") return Boolean(settings.alibabaTaskApiKey);
  if (settings.aiProvider === "openai-compatible") return Boolean(settings.aiApiKey);
  return false;
}

function taskAiProviderConfig(settings) {
  if (settings.aiProvider === "openai") {
    return {
      providerName: "OpenAI task parser",
      endpoint: settings.openaiTaskEndpoint || DEFAULT_SETTINGS.openaiTaskEndpoint,
      model: settings.openaiTaskModel || DEFAULT_SETTINGS.openaiTaskModel,
      apiKey: settings.openaiTaskApiKey,
      responseFormat: { type: "json_object" }
    };
  }

  if (settings.aiProvider === "alibaba") {
    return {
      providerName: "Alibaba Qwen task parser",
      endpoint: settings.alibabaTaskEndpoint || DEFAULT_SETTINGS.alibabaTaskEndpoint,
      model: settings.alibabaTaskModel || DEFAULT_SETTINGS.alibabaTaskModel,
      apiKey: settings.alibabaTaskApiKey,
      responseFormat: { type: "json_object" }
    };
  }

  return {
    providerName: "Custom OpenAI-compatible task parser",
    endpoint: settings.aiEndpoint || DEFAULT_SETTINGS.aiEndpoint,
    model: settings.aiModel || DEFAULT_SETTINGS.aiModel,
    apiKey: settings.aiApiKey,
    responseFormat: { type: "json_object" }
  };
}

async function parseTaskWithChatCompletions(rawText, settings, now) {
  const config = taskAiProviderConfig(settings);
  const payload = {
    model: config.model,
    temperature: 0.1,
    response_format: config.responseFormat,
    messages: [
      {
        role: "system",
        content: taskParserSystemPrompt()
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

  const response = await requestUrlWithHint({
    provider: config.providerName,
    hint: "请检查任务解析 API Key、endpoint、模型名，以及模型是否支持 Chat Completions JSON 输出。",
    request: {
      url: config.endpoint,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(payload)
    }
  });

  const content = response.json?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI response did not include message content.");
  }

  return JSON.parse(content);
}

function taskParserSystemPrompt() {
  return [
    "你是一个面向 Obsidian Tasks 的中文任务转译器。",
    "你的任务是把用户随口说出的任务、提醒、截止日期、优先级和上下文，转换为严格 JSON。",
    "只输出 JSON，不要输出 Markdown、解释、代码块或多余文字。",
    "JSON keys 必须包含：title, notes, project, tags, startDate, scheduledDate, dueDate, reminderAt, priority, estimatedMinutes, confidence, questions。",
    "字段规则：",
    "- title: 简洁可执行的任务标题，删除'提醒我'、日期、时间、优先级废话，但保留人名、对象和动作。",
    "- notes: 可选补充说明；没有则 null。",
    "- project: 工作/家庭/学习/健康/财务等领域；不确定则 null。",
    "- tags: Obsidian 标签数组，必须以 # 开头；用户已给标签要保留；没有明确标签可返回 []。",
    "- startDate: 开始日期，YYYY-MM-DD；来自'从...开始'、'开始准备'等语义。",
    "- scheduledDate: 计划执行日期，YYYY-MM-DD；来自'今天做'、'明天处理'、'周五安排'等语义。",
    "- dueDate: 截止日期，YYYY-MM-DD；来自'之前'、'前'、'截止'、'ddl'、'deadline'、'到期'等语义。",
    "- reminderAt: 提醒时间，格式 YYYY-MM-DDTHH:mm:ss；只有用户明确说提醒、叫我、到点通知，或给出具体执行时间时填写。",
    "- priority: highest/high/medium/none/low/lowest 之一。",
    "- estimatedMinutes: 如果用户表达了耗时，返回分钟数；否则 null。",
    "- confidence: 0 到 1。日期、时间、任务对象明确时更高；含糊表达如'找时间'、'有空'要降低。",
    "- questions: 如果需要用户确认，返回简短问题数组；否则 []。",
    "日期理解：",
    "- 所有日期都以 user.now 和 user.timezoneHint 为基准。",
    "- 不要编造不存在的日期。",
    "- '明天下午三点提醒我开会' => scheduledDate 为明天，reminderAt 为明天 15:00:00。",
    "- '周五前交报告' => dueDate 为最近合理的周五。",
    "- '有空整理书桌' => priority low，日期为空，confidence 较低。",
    "优先级理解：",
    "- 紧急、马上、必须今天、十万火急 => highest。",
    "- 重要、尽快、客户、老板、截止、必须 => high。",
    "- 普通、一般 => medium。",
    "- 有空、不急、顺手、回头 => low。",
    "返回示例：",
    "{\"title\":\"给张三发合同\",\"notes\":null,\"project\":\"工作\",\"tags\":[\"#work\"],\"startDate\":null,\"scheduledDate\":\"2026-07-01\",\"dueDate\":null,\"reminderAt\":\"2026-07-01T15:00:00\",\"priority\":\"high\",\"estimatedMinutes\":null,\"confidence\":0.9,\"questions\":[]}"
  ].join("\\n");
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

async function transcribeAudio(blob, settings) {
  if (settings.transcriptionProvider === "openai") {
    return await transcribeWithOpenAi(blob, settings);
  }

  if (settings.transcriptionProvider === "alibaba") {
    return await transcribeWithAlibaba(blob, settings);
  }

  throw new Error("当前语音提供商不支持录音转写。");
}

async function transcribeWithOpenAi(blob, settings) {
  const audioContentType = normalizeAudioMimeType(blob.type || "audio/webm");
  const { body, contentType: multipartContentType } = await createMultipartBody({
    fields: {
      model: settings.openaiTranscriptionModel || DEFAULT_SETTINGS.openaiTranscriptionModel,
      response_format: "json"
    },
    file: {
      fieldName: "file",
      fileName: `task-voice.${mimeTypeToAudioFormat(audioContentType)}`,
      contentType: audioContentType,
      data: await blob.arrayBuffer()
    }
  });

  const response = await requestUrlWithHint({
    provider: "OpenAI 转写",
    hint: "请检查 API Key、模型名、音频是否为空，以及 endpoint 是否为 /v1/audio/transcriptions。",
    request: {
      url: settings.openaiTranscriptionEndpoint || DEFAULT_SETTINGS.openaiTranscriptionEndpoint,
      method: "POST",
      headers: {
        "Authorization": `Bearer ${settings.openaiTranscriptionApiKey}`,
        "Content-Type": multipartContentType
      },
      body
    }
  });

  const text = response.json?.text;
  if (!text) {
    throw new Error("OpenAI 转写响应中没有 text 字段。");
  }
  return text;
}

async function transcribeWithAlibaba(blob, settings) {
  const audioBase64 = arrayBufferToBase64(await blob.arrayBuffer());
  const mimeType = normalizeAudioMimeType(blob.type || "audio/webm");
  const dataUrl = `data:${mimeType};base64,${audioBase64}`;

  const response = await requestUrlWithHint({
    provider: "阿里云转写",
    hint: "请检查 DashScope API Key、endpoint 区域、模型名，以及音频格式。中国北京 endpoint 是 https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions。",
    request: {
      url: settings.alibabaTranscriptionEndpoint || DEFAULT_SETTINGS.alibabaTranscriptionEndpoint,
      method: "POST",
      headers: {
        "Authorization": `Bearer ${settings.alibabaTranscriptionApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
      model: settings.alibabaTranscriptionModel || DEFAULT_SETTINGS.alibabaTranscriptionModel,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "input_audio",
              input_audio: {
                data: dataUrl
              }
            }
          ]
        }
      ],
      stream: false,
      asr_options: {
        language: settings.alibabaTranscriptionLanguage || "zh",
        enable_itn: false
      }
      })
    }
  });

  const content = response.json?.choices?.[0]?.message?.content;
  const text = Array.isArray(content)
    ? content.map((item) => item.text || "").join("").trim()
    : String(content || "").trim();

  if (!text) {
    throw new Error("阿里云转写响应中没有文本内容。");
  }
  return text;
}

async function requestUrlWithHint({ provider, hint, request }) {
  try {
    return await requestUrl(request);
  } catch (error) {
    const status = error?.status ? `status ${error.status}` : error?.message || "请求失败";
    throw new Error(`${provider}请求失败：${status}。${hint}`);
  }
}

async function createMultipartBody({ fields, file }) {
  const boundary = `----AiTaskButler${stableHash(`${Date.now()}${Math.random()}`)}`;
  const encoder = new TextEncoder();
  const chunks = [];

  for (const [name, value] of Object.entries(fields)) {
    chunks.push(encoder.encode(`--${boundary}\r\n`));
    chunks.push(encoder.encode(`Content-Disposition: form-data; name="${name}"\r\n\r\n`));
    chunks.push(encoder.encode(`${value}\r\n`));
  }

  chunks.push(encoder.encode(`--${boundary}\r\n`));
  chunks.push(encoder.encode(`Content-Disposition: form-data; name="${file.fieldName}"; filename="${file.fileName}"\r\n`));
  chunks.push(encoder.encode(`Content-Type: ${file.contentType}\r\n\r\n`));
  chunks.push(new Uint8Array(file.data));
  chunks.push(encoder.encode("\r\n"));
  chunks.push(encoder.encode(`--${boundary}--\r\n`));

  return {
    body: concatUint8Arrays(chunks).buffer,
    contentType: `multipart/form-data; boundary=${boundary}`
  };
}

function concatUint8Arrays(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function mimeTypeToAudioFormat(mimeType) {
  if (/mp4|m4a/.test(mimeType)) return "mp4";
  if (/mpeg|mp3/.test(mimeType)) return "mp3";
  if (/wav/.test(mimeType)) return "wav";
  if (/ogg/.test(mimeType)) return "ogg";
  return "webm";
}

function normalizeAudioMimeType(mimeType) {
  return String(mimeType || "audio/webm").split(";")[0].trim() || "audio/webm";
}

function pickRecordingMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus"
  ];

  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return "";
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || "";
}

function rmsAudioLevel(byteTimeDomainData) {
  let sum = 0;
  for (let index = 0; index < byteTimeDomainData.length; index += 1) {
    const centered = (byteTimeDomainData[index] - 128) / 128;
    sum += centered * centered;
  }
  return Math.sqrt(sum / byteTimeDomainData.length);
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

function dictationErrorMessage(errorCode) {
  const messages = {
    "no-speech": "没有听到声音。请点击语音输入后立刻说话，或检查麦克风音量。",
    "audio-capture": "没有检测到可用麦克风。请检查系统麦克风权限和输入设备。",
    "not-allowed": "麦克风权限被拒绝。请在系统设置中允许 Obsidian 使用麦克风。",
    "service-not-allowed": "当前环境不允许使用语音识别服务。Obsidian 桌面版可能不支持 Web Speech。",
    "network": "语音识别服务不可用。Obsidian/Electron 环境里 Web Speech 可能无法连接服务。",
    "aborted": "语音识别已停止。",
    "language-not-supported": "当前语音识别服务不支持 zh-CN。"
  };

  return messages[errorCode] || `语音识别失败：${errorCode || "未知错误"}`;
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
