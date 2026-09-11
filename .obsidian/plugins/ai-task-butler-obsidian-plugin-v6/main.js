const {
  App,
  Component,
  MarkdownRenderer,
  MarkdownView,
  Menu,
  Modal,
  Notice,
  ItemView,
  Plugin,
  PluginSettingTab,
  requestUrl,
  Setting,
  TFile,
  normalizePath
} = require("obsidian");

const TASK_BUTLER_NAVIGATION_VIEW_TYPE = "ai-task-butler-navigation";

// 候选 Tasks 插件 "Create or edit task" 命令 ID，按版本/插件 ID 排序。
const TASKS_EDIT_COMMAND_IDS = [
  "obsidian-tasks-plugin:edit-task",
  "tasks:edit-task"
];

function findTasksEditCommandId(app) {
  for (const id of TASKS_EDIT_COMMAND_IDS) {
    if (app.commands.findCommand(id)) return id;
  }
  return null;
}

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
  lowConfidenceThreshold: 0.55
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
    const removedLegacySettings = ["enableReminderNotices", "notifiedReminders"];
    const didMigrateSettings = removedLegacySettings.some((key) => {
      if (!Object.prototype.hasOwnProperty.call(this.settings, key)) return false;
      delete this.settings[key];
      return true;
    });
    if (didMigrateSettings) {
      await this.saveSettings();
    }

    this.addRibbonIcon("list-plus", "AI Task Butler: capture task", () => {
      new CaptureTaskModal(this.app, this).open();
    });
    this.addRibbonIcon("list-checks", "AI Task Butler: open task navigator", () => {
      this.activateTaskButlerNavigation();
    });

    this.registerView(
      TASK_BUTLER_NAVIGATION_VIEW_TYPE,
      (leaf) => new TaskButlerNavigationView(leaf, this)
    );
    // 不再监听 vault 的 modify/create/delete/rename —— 写普通笔记不会触发导航栏刷新。
    // 刷新只发生在明确的时间点，见 setupTasksCommandHook 的注释。
    this.setupTasksCommandHook();

    this.addCommand({
      id: "open-task-butler-navigation",
      name: "Open Task Butler navigation",
      callback: () => this.activateTaskButlerNavigation()
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

    this.addSettingTab(new AiTaskButlerSettingTab(this.app, this));
  }

  async onunload() {
    this.teardownTasksCommandHook();
    this.app.workspace.detachLeavesOfType(TASK_BUTLER_NAVIGATION_VIEW_TYPE);
  }

  async activateTaskButlerNavigation() {
    let leaf = this.app.workspace.getLeavesOfType(TASK_BUTLER_NAVIGATION_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false);
      await leaf.setViewState({ type: TASK_BUTLER_NAVIGATION_VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
  }

  requestTaskNavigationRefresh() {
    if (this.taskNavigationRefreshTimer) window.clearTimeout(this.taskNavigationRefreshTimer);
    this.taskNavigationRefreshTimer = window.setTimeout(() => {
      for (const leaf of this.app.workspace.getLeavesOfType(TASK_BUTLER_NAVIGATION_VIEW_TYPE)) {
        leaf.view?.refresh?.();
      }
    }, 100);
  }

  // 导航栏只在明确的时间点刷新（不再监听 vault 的每次 modify）：
  //  1. 调用 Tasks 插件命令时（Create or edit task / toggle done 等，见下方挂钩）
  //  2. 勾选任务完成时（updateTask 内部调用 requestTaskNavigationRefresh）
  //  3. 推迟任务时（rescheduleTask / shiftScheduledDate 都走 updateTask）
  //  4. 切换（聚焦）到 Task Butler 侧边栏时（见 TaskButlerNavigationView 构造器）
  //  5. 点击 "刷新" / "新增" 按钮时（见 TaskButlerNavigationView.render）
  // 这样在普通笔记里写一整天字也不会刷新导航栏。
  setupTasksCommandHook() {
    const commands = this.app.commands;
    if (!commands || typeof commands.executeCommandById !== "function") return;
    const originalExecute = commands.executeCommandById.bind(commands);
    this.originalExecuteCommandById = originalExecute;
    commands.executeCommandById = (commandId) => {
      const result = originalExecute(commandId);
      if (typeof commandId === "string" && /^(obsidian-tasks-plugin|tasks):/.test(commandId)) {
        this.requestTaskNavigationRefresh();
      }
      return result;
    };
  }

  teardownTasksCommandHook() {
    const commands = this.app?.commands;
    if (commands && this.originalExecuteCommandById) {
      commands.executeCommandById = this.originalExecuteCommandById;
      this.originalExecuteCommandById = null;
    }
  }

  async listTasksInDateRange(startDate, endDate) {
    const markdownFiles = this.app.vault.getMarkdownFiles();
    const tasks = [];
    for (const file of markdownFiles) {
      const content = await this.app.vault.read(file);
      const lines = content.split(/\r?\n/);
      for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
        const task = parseMarkdownTaskLine(lines[lineNumber], file.path, lineNumber);
        if (task && taskMatchesDateRange(task, startDate, endDate)) tasks.push(task);
      }
    }
    return sortTaskNavigationItems(tasks, startDate);
  }

  async updateTask(task, patch) {
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof TFile)) throw new Error("任务所在文件不存在或已被移动。");

    let updated = false;
    await this.app.vault.process(file, (content) => {
      const lines = content.split(/\r?\n/);
      const index = findTaskLineIndex(lines, task);
      if (index < 0) throw new Error("任务已被修改或移动，请刷新导航栏后重试。");
      lines[index] = patchMarkdownTaskLine(lines[index], patch);
      updated = true;
      return lines.join("\n");
    });

    if (!updated) throw new Error("未能定位任务。");
    this.requestTaskNavigationRefresh();
  }

  async openTaskSource(task, { activateCursor = false } = {}) {
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof TFile)) {
      new Notice("任务所在文件不存在或已被移动。");
      return null;
    }
    const leaf = this.app.workspace.getLeaf("split");
    await leaf.openFile(file);
    if (activateCursor) {
      const ready = await this.waitForTaskEditor(leaf, task.lineNumber, 3000);
      if (!ready) {
        new Notice("已打开笔记，但编辑器视图未就绪，无法把光标定位到任务行。");
        return leaf.view || null;
      }
      this.app.workspace.setActiveLeaf(leaf, { focus: true });
      await new Promise((resolve) => window.setTimeout(resolve, 120));
    }
    return leaf.view || null;
  }

  async waitForTaskEditor(leaf, lineNumber, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const view = leaf && leaf.view;
      if (view instanceof MarkdownView && view.editor) {
        try {
          const lineText = view.editor.getLine(lineNumber) || "";
          view.editor.setSelection({ line: lineNumber, ch: 0 }, { line: lineNumber, ch: lineText.length });
          view.editor.focus();
          return true;
        } catch (error) {
          console.warn("AI Task Butler: failed to focus task line.", error);
          return false;
        }
      }
      await new Promise((resolve) => window.setTimeout(resolve, 30));
    }
    return false;
  }

  async editTaskInTasksPlugin(task) {
    const tasksCommandId = findTasksEditCommandId(this.app);
    if (!tasksCommandId) {
      const available = this.app.commands
        .listCommands()
        .filter((command) => /edit[- ]?task|create or edit/i.test(`${command.id} ${command.name}`))
        .map((command) => `\`${command.id}\``)
        .join(", ");
      const hint = available
        ? `检测到可能的命令：${available}。请把对应 ID 写入 AI Task Butler 设置中的 "Tasks 编辑命令 ID"，或升级 Tasks 插件。`
        : "未找到 Tasks 插件的 `Tasks: Create or edit task` 命令，请确认 Tasks 插件已启用并升级到最新版本。";
      new Notice(hint, 8000);
      return;
    }

    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof TFile)) {
      new Notice("任务所在文件不存在或已被移动。");
      return;
    }

    // 仅当当前激活的 Markdown 编辑器不是该任务所在文件时，才打开；
    // 否则直接复用当前视图，不开 split、不切换 leaf，避免"打开 tasks 文件"。
    const leaf = await this.resolveEditorLeafForTask(file);
    if (!leaf) {
      new Notice("编辑器视图未就绪，无法定位任务行。");
      return;
    }

    const ready = await this.waitForTaskEditor(leaf, task.lineNumber, 3000);
    if (!ready) {
      new Notice("编辑器视图未就绪，无法把光标定位到任务行。");
      return;
    }
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
    await new Promise((resolve) => window.setTimeout(resolve, 120));

    const activeEditor = this.app.workspace.activeEditor;
    if (!activeEditor || !activeEditor.editor) {
      new Notice("activeEditor 未指向任务所在文件，Tasks 命令无法定位任务。");
      return;
    }

    try {
      this.app.commands.executeCommandById(tasksCommandId);
    } catch (error) {
      new Notice(`调用 Tasks 编辑命令失败：${error.message || "未知错误"}`);
    }
  }

  // 寻找一个适合编辑该任务的 MarkdownView leaf：
  //  1. 当前活动编辑器已经在该文件中 → 直接复用（不打开任何文件）
  //  2. 否则在当前活动 leaf（不创建 split）中打开任务所在文件
  // 这避免了之前 "总在右侧新开一个 split 打开 tasks 文件" 的行为。
  async resolveEditorLeafForTask(file) {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile && activeFile.path === file.path) {
      const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (activeView && activeView.editor && activeView.leaf) {
        return activeView.leaf;
      }
    }
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(file);
    return leaf;
  }

  async rescheduleTask(task, scheduledDate) {
    await this.updateTask(task, { scheduledDate });
  }

  async shiftScheduledDate(task, days) {
    const baseDate = validDateOrUndefined(task.scheduledDate) || task.startDate || formatDate(new Date());
    const targetDate = formatDate(addDays(dateFromIso(baseDate), days));
    await this.updateTask(task, { scheduledDate: targetDate });
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
    this.requestTaskNavigationRefresh();

    if (this.settings.openInboxAfterCapture) {
      await this.app.workspace.getLeaf(false).openFile(file);
    }
  }

};

class TaskButlerNavigationView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    const today = formatDate(new Date());
    this.startDate = today;
    this.endDate = today;
    this.showCompleted = false;
    this.refreshTimer = null;
    // 触发点 4：切换（聚焦）到本侧边栏时刷新一次。
    // 覆盖 "在别的笔记 / Tasks 编辑面板里改完任务，再点回侧边栏想看最新" 的场景。
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (activeLeaf) => {
        if (activeLeaf === this.leaf) this.refresh();
      })
    );
  }

  getViewType() {
    return TASK_BUTLER_NAVIGATION_VIEW_TYPE;
  }

  getDisplayText() {
    return "Task Butler";
  }

  getIcon() {
    return "list-checks";
  }

  async onOpen() {
    await this.render();
  }

  async onClose() {
    if (this.refreshTimer) window.clearTimeout(this.refreshTimer);
    if (this.markdownComponent) {
      this.markdownComponent.unload();
      this.markdownComponent = null;
    }
    this.contentEl.empty();
  }

  refresh() {
    if (this.refreshTimer) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => this.render(), 120);
  }

  ensureMarkdownComponent() {
    if (!this.markdownComponent) {
      this.markdownComponent = new Component();
      this.markdownComponent.load();
    }
    return this.markdownComponent;
  }

  async render() {
    const { contentEl } = this;
    // 卸载上一轮渲染注册的点击/悬停等监听，避免任务增删时链接处理泄漏。
    if (this.markdownComponent) {
      this.markdownComponent.unload();
      this.markdownComponent = null;
    }
    contentEl.empty();
    contentEl.addClass("ai-task-butler-navigation");

    const header = contentEl.createDiv({ cls: "ai-task-butler-navigation-header" });
    header.createEl("h4", { text: "Task Butler" });
    const actions = header.createDiv({ cls: "ai-task-butler-navigation-actions" });
    const captureButton = actions.createEl("button", { text: "新增", attr: { "aria-label": "新增任务" } });
    captureButton.addEventListener("click", () => {
      // 触发点 5：点 "新增" 时先刷新一遍，再弹采集窗口。
      this.refresh();
      new CaptureTaskModal(this.app, this.plugin).open();
    });
    const refreshButton = actions.createEl("button", { text: "刷新", attr: { "aria-label": "刷新任务" } });
    refreshButton.addEventListener("click", () => this.refresh());

    const range = contentEl.createDiv({ cls: "ai-task-butler-range" });
    const previousButton = range.createEl("button", { text: "‹", attr: { "aria-label": "前一天" } });
    previousButton.addEventListener("click", () => this.shiftRange(-1));
    this.startInput = range.createEl("input", { attr: { type: "date", "aria-label": "开始日期" } });
    this.startInput.value = this.startDate;
    this.startInput.addEventListener("change", () => this.setRange(this.startInput.value, this.endDate));
    const separator = range.createEl("span", { text: "至" });
    separator.addClass("ai-task-butler-range-separator");
    this.endInput = range.createEl("input", { attr: { type: "date", "aria-label": "结束日期" } });
    this.endInput.value = this.endDate;
    this.endInput.addEventListener("change", () => this.setRange(this.startDate, this.endInput.value));
    const nextButton = range.createEl("button", { text: "›", attr: { "aria-label": "后一天" } });
    nextButton.addEventListener("click", () => this.shiftRange(1));

    const filters = contentEl.createDiv({ cls: "ai-task-butler-navigation-filters" });
    const todayButton = filters.createEl("button", { text: "今天" });
    todayButton.addEventListener("click", () => {
      const today = formatDate(new Date());
      this.setRange(today, today);
    });
    const nextWeekButton = filters.createEl("button", { text: "未来 7 天" });
    nextWeekButton.addEventListener("click", () => {
      const today = new Date();
      this.setRange(formatDate(today), formatDate(addDays(today, 6)));
    });
    const completedLabel = filters.createEl("label", { cls: "ai-task-butler-completed-filter" });
    const completedToggle = completedLabel.createEl("input", { attr: { type: "checkbox" } });
    completedToggle.checked = this.showCompleted;
    completedToggle.addEventListener("change", () => {
      this.showCompleted = completedToggle.checked;
      this.refresh();
    });
    completedLabel.appendText("仅显示已完成");

    const list = contentEl.createDiv({ cls: "ai-task-butler-task-list" });
    const loading = list.createDiv({ cls: "ai-task-butler-empty", text: "正在读取任务..." });
    try {
      const allTasks = await this.plugin.listTasksInDateRange(this.startDate, this.endDate);
      // showCompleted 是"只显示已完成"的开关（不是"同时显示已完成与未完成"）：
      //  - 关闭（默认）：只显示未完成，避免误勾的与待办混在一起；
      //  - 开启：只显示已完成的，方便在选定日期范围内一键定位误勾的任务并撤回。
      const tasks = allTasks.filter((task) => (this.showCompleted ? task.completed : !task.completed));
      if (!list.isConnected) return;
      loading.remove();
      contentEl.querySelector(".ai-task-butler-task-count")?.remove();
      header.createEl("span", { cls: "ai-task-butler-task-count", text: `${tasks.length} 项` });

      if (tasks.length === 0) {
        list.createDiv({
          cls: "ai-task-butler-empty",
          text: this.showCompleted
            ? "这个日期范围内没有已完成的任务。"
            : "这个日期范围内没有未完成的任务。"
        });
        return;
      }
      for (const task of tasks) await this.renderTaskRow(list, task);
    } catch (error) {
      console.error("AI Task Butler: failed to load navigation tasks.", error);
      loading.setText(`读取任务失败：${error.message || "未知错误"}`);
    }
  }

  setRange(startDate, endDate) {
    const validStart = validDateOrUndefined(startDate) || this.startDate;
    const validEnd = validDateOrUndefined(endDate) || validStart;
    this.startDate = validStart <= validEnd ? validStart : validEnd;
    this.endDate = validStart <= validEnd ? validEnd : validStart;
    this.refresh();
  }

  shiftRange(days) {
    this.setRange(
      formatDate(addDays(dateFromIso(this.startDate), days)),
      formatDate(addDays(dateFromIso(this.endDate), days))
    );
  }

  async renderTaskRow(list, task) {
    const row = list.createDiv({ cls: "ai-task-butler-task-row" });
    if (task.completed) row.addClass("is-completed");
    if (task.scheduledDate && task.scheduledDate < formatDate(new Date()) && !task.completed) row.addClass("is-overdue");

    const doneToggle = row.createEl("input", { cls: "ai-task-butler-task-done", attr: { type: "checkbox", "aria-label": "切换任务完成状态" } });
    doneToggle.checked = task.completed;
    doneToggle.addEventListener("change", async () => {
      doneToggle.disabled = true;
      try {
        await this.plugin.updateTask(task, { completed: doneToggle.checked });
      } catch (error) {
        doneToggle.checked = !doneToggle.checked;
        new Notice(`更新任务失败：${error.message || "未知错误"}`);
      } finally {
        doneToggle.disabled = false;
      }
    });

    const body = row.createDiv({ cls: "ai-task-butler-task-body" });
    const title = body.createDiv({ cls: "ai-task-butler-task-title" });
    title.setAttribute("title", "右键获取更多操作");
    await this.renderTaskTitle(title, task);

    const meta = body.createDiv({ cls: "ai-task-butler-task-meta" });
    const priority = task.priority === "none" ? "" : `${PRIORITY_MARKS[task.priority] || ""} ${priorityDisplayName(task.priority)}`;
    const schedule = task.scheduledDate ? `计划 ${task.scheduledDate}` : task.startDate ? `开始 ${task.startDate}` : "未排期";
    meta.setText([priority, schedule, task.filePath].filter(Boolean).join(" · "));

    const tasksCommandId = findTasksEditCommandId(this.app);
    const hasTasksPlugin = Boolean(tasksCommandId);

    row.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      const menu = new Menu();
      menu.addItem((item) => item
        .setTitle(task.completed ? "取消完成" : "标记为完成")
        .setIcon("check")
        .onClick(async () => {
          try {
            await this.plugin.updateTask(task, { completed: !task.completed });
          } catch (error) {
            new Notice(`更新任务失败：${error.message || "未知错误"}`);
          }
        }));
      menu.addItem((item) => {
        item.setTitle("推迟计划日期").setIcon("calendar-clock");
        const submenu = item.setSubmenu();
        const todayDate = formatDate(new Date());
        const tomorrowDate = formatDate(addDays(new Date(), 1));
        const nextWeekDate = formatDate(addDays(new Date(), 7));
        const current = validDateOrUndefined(task.scheduledDate);
        const runReschedule = async (targetDate) => {
          try {
            await this.plugin.rescheduleTask(task, targetDate);
          } catch (error) {
            new Notice(`更新日期失败：${error.message || "未知错误"}`);
          }
        };
        submenu.addItem((sub) => sub
          .setTitle(`今天 · ${todayDate}${current === todayDate ? "（当前）" : ""}`)
          .setIcon("calendar-check")
          .onClick(() => runReschedule(todayDate)));
        submenu.addItem((sub) => sub
          .setTitle(`明天 · ${tomorrowDate}${current === tomorrowDate ? "（当前）" : ""}`)
          .setIcon("sun")
          .onClick(() => runReschedule(tomorrowDate)));
        submenu.addItem((sub) => sub
          .setTitle(`下周 · ${nextWeekDate}${current === nextWeekDate ? "（当前）" : ""}`)
          .setIcon("calendar")
          .onClick(() => runReschedule(nextWeekDate)));
        submenu.addSeparator();
        submenu.addItem((sub) => sub
          .setTitle("推迟 1 天")
          .setIcon("chevron-right")
          .onClick(async () => {
            try {
              await this.plugin.shiftScheduledDate(task, 1);
            } catch (error) {
              new Notice(`推迟日期失败：${error.message || "未知错误"}`);
            }
          }));
        submenu.addItem((sub) => sub
          .setTitle("推迟 1 周")
          .setIcon("chevrons-right")
          .onClick(async () => {
            try {
              await this.plugin.shiftScheduledDate(task, 7);
            } catch (error) {
              new Notice(`推迟日期失败：${error.message || "未知错误"}`);
            }
          }));
        submenu.addSeparator();
        submenu.addItem((sub) => sub
          .setTitle("清除计划日期")
          .setIcon("x-circle")
          .onClick(async () => {
            try {
              await this.plugin.rescheduleTask(task, undefined);
            } catch (error) {
              new Notice(`清除日期失败：${error.message || "未知错误"}`);
            }
          }));
      });
      menu.addItem((item) => item
        .setTitle("用 Tasks 插件编辑")
        .setIcon("pencil")
        .setDisabled(!hasTasksPlugin)
        .onClick(async () => {
          await this.plugin.editTaskInTasksPlugin(task);
        }));
      menu.addItem((item) => item
        .setTitle("打开原文")
        .setIcon("file-text")
        .onClick(async () => {
          await this.plugin.openTaskSource(task, { activateCursor: true });
        }));
      menu.addItem((item) => item
        .setTitle("复制任务内容")
        .setIcon("copy")
        .onClick(async () => {
          try {
            await navigator.clipboard.writeText(task.originalLine.trim());
            new Notice("已复制任务内容到剪贴板。");
          } catch (error) {
            new Notice(`复制失败：${error.message || "剪贴板不可用"}`);
          }
        }));
      menu.showAtMouseEvent(event);
    });
  }

  // 用 Obsidian 内置的 MarkdownRenderer 渲染任务标题：
  //  - [[wikilink]] / [text](url) 自动成为可点击链接
  //  - 行内代码、强调、标签等也走原生 Markdown 样式
  // 渲染结果绑定在 view 级 Component 上，render() 重绘或 onClose() 时统一卸载。
  async renderTaskTitle(titleEl, task) {
    const raw = String(task.title || "").trim();
    if (!raw) {
      titleEl.setText("(空任务)");
      return;
    }
    const component = this.ensureMarkdownComponent();
    try {
      // 用单行包裹：避免 Markdown 把第一行当成块级元素解析（如 # / >），但保留内联语法。
      await MarkdownRenderer.render(this.app, raw, titleEl, task.filePath || "", component);
    } catch (error) {
      console.warn("AI Task Butler: failed to render task title as Markdown, falling back to text.", error);
      titleEl.setText(raw);
    }
  }
}

class CaptureTaskModal extends Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.input = "";
    this.draft = null;
    this.manualOverrides = {
      priority: undefined,
      scheduledDate: undefined
    };
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
      text: "Enter 创建任务；Ctrl+U/H/M/L 选择优先级；Ctrl+Y/T/R 选择今天/明天/后天；Ctrl+1~7 选择最近的周一至周日；Ctrl+D 选择其他计划日期。反引号内内容会原样保留。"
    });

    const textArea = contentEl.createEl("textarea", {
      cls: "ai-task-butler-input",
      attr: {
        placeholder: "写下或粘贴任务；用 `内容` 原样保留双链、网址、命令或专有文本..."
      }
    });
    textArea.value = this.input;
    textArea.addEventListener("input", () => {
      this.input = textArea.value;
      this.refreshDraft();
    });
    textArea.addEventListener("keydown", (event) => {
      if (event.isComposing) return;

      const shortcutPriority = priorityFromShortcutEvent(event);
      if (shortcutPriority) {
        event.preventDefault();
        this.setPriorityOverride(shortcutPriority);
        return;
      }

      const shortcutDate = dateFromShortcutEvent(event);
      if (shortcutDate) {
        event.preventDefault();
        this.setScheduledDateOverride(shortcutDate);
        return;
      }

      if (isDatePickerShortcutEvent(event)) {
        event.preventDefault();
        this.openDatePicker();
        return;
      }

      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        this.submit();
      }
    });

    this.draftStatusEl = contentEl.createDiv({ cls: "ai-task-butler-draft-status" });
    this.priorityStatusEl = this.draftStatusEl.createDiv({ cls: "ai-task-butler-draft-item" });
    const dateControl = this.draftStatusEl.createDiv({ cls: "ai-task-butler-date-control" });
    this.dateStatusEl = dateControl.createEl("span", { cls: "ai-task-butler-draft-item" });
    this.dateInput = dateControl.createEl("input", {
      cls: "ai-task-butler-date-picker",
      attr: { type: "date", "aria-label": "计划日期" }
    });
    this.dateInput.addEventListener("change", () => {
      this.setScheduledDateOverride(this.dateInput.value || undefined);
    });
    this.clearDateButton = dateControl.createEl("button", { text: "清除", cls: "ai-task-butler-clear-date" });
    this.clearDateButton.addEventListener("click", () => this.setScheduledDateOverride(undefined));

    this.previewEl = contentEl.createDiv({ cls: "ai-task-butler-preview" });
    this.refreshDraft();

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

    this.appendButton = buttonRow.createEl("button", {
      text: "加入 Inbox",
      cls: "mod-cta"
    });
    this.appendButton.addEventListener("click", () => this.submit());

    textArea.focus();
  }

  refreshDraft() {
    const parsedDraft = this.input.trim() ? parseTaskText(this.input) : null;
    this.draft = parsedDraft ? applyTaskDraftOverrides(parsedDraft, this.manualOverrides) : null;
    this.renderDraftStatus();
    this.renderPreview();
  }

  setPriorityOverride(priority) {
    this.manualOverrides.priority = this.manualOverrides.priority === priority ? undefined : priority;
    this.refreshDraft();
  }

  setScheduledDateOverride(scheduledDate) {
    this.manualOverrides.scheduledDate = validDateOrUndefined(scheduledDate);
    this.refreshDraft();
  }

  openDatePicker() {
    if (!this.dateInput) return;
    this.dateInput.focus();
    if (typeof this.dateInput.showPicker === "function") {
      try {
        this.dateInput.showPicker();
      } catch (error) {
        console.warn("AI Task Butler: could not open date picker.", error);
      }
    }
  }

  renderDraftStatus() {
    if (!this.priorityStatusEl || !this.dateStatusEl || !this.dateInput) return;

    const priority = this.draft?.priority || "none";
    const priorityLabel = priorityDisplayName(priority);
    const prioritySource = this.manualOverrides.priority ? "手动" : "自动";
    this.priorityStatusEl.setText(`优先级：${priorityLabel}（${prioritySource}）`);

    const scheduledDate = this.draft?.scheduledDate;
    const dateSource = this.manualOverrides.scheduledDate ? "手动" : "自动";
    this.dateStatusEl.setText(scheduledDate ? `计划日期：${scheduledDate}（${dateSource}）` : "计划日期：未指定（自动）");
    this.dateInput.value = this.manualOverrides.scheduledDate || "";
    this.clearDateButton.style.display = this.manualOverrides.scheduledDate ? "" : "none";
  }

  async submit() {
    if (this.isSubmitting) return;
    if (!this.input.trim()) {
      new Notice("请输入任务内容。");
      return;
    }

    this.isSubmitting = true;
    if (this.appendButton) {
      this.appendButton.disabled = true;
      this.appendButton.setText("解析中...");
    }

    try {
      const parsedDraft = await this.plugin.parseTask(this.input);
      const draft = applyTaskDraftOverrides(parsedDraft, this.manualOverrides);
      await this.plugin.appendTask(draft);
      this.close();
    } catch (error) {
      console.error("AI Task Butler: failed to capture task.", error);
      new Notice(`导入失败：${error.message || "未知错误"}`, 10000);
      this.isSubmitting = false;
      if (this.appendButton) {
        this.appendButton.disabled = false;
        this.appendButton.setText("加入 Inbox");
      }
    }
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
    this.refreshDraft();
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
      this.refreshDraft();
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

    const hasManualPriority = this.manualOverrides.priority !== undefined;
    const hasManualScheduledDate = this.manualOverrides.scheduledDate !== undefined;
    if (
      this.draft.confidence < this.plugin.settings.lowConfidenceThreshold &&
      !(hasManualPriority && hasManualScheduledDate)
    ) {
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
      .setDesc("Captured tasks are appended to this Markdown file.")
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


  }
}

function parseMarkdownTaskLine(line, filePath, lineNumber) {
  const match = String(line || "").match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/);
  if (!match) return null;

  const rawBody = match[3];
  const scheduledDate = extractTaskDate(rawBody, "⏳");
  const startDate = extractTaskDate(rawBody, "🛫");
  const recurrence = rawBody.match(/🔁\s+(.+?)(?=\s+(?:➕|⏳|🛫|📅|\^\S+)|$)/)?.[1]?.trim();
  const blockId = rawBody.match(/\s+\^([A-Za-z0-9_-]+)\s*$/)?.[1];
  const priority = priorityFromTaskMarkdown(rawBody);
  const title = taskTitleFromMarkdown(rawBody);
  if (!title) return null;

  return {
    filePath,
    lineNumber,
    originalLine: line,
    rawBody,
    title,
    completed: match[2].toLowerCase() === "x",
    scheduledDate,
    startDate,
    recurrence,
    priority,
    blockId
  };
}

function extractTaskDate(text, marker) {
  const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.match(new RegExp(`${escapedMarker}\\s+(\\d{4}-\\d{2}-\\d{2})`))?.[1];
}

function priorityFromTaskMarkdown(text) {
  for (const [priority, mark] of Object.entries(PRIORITY_MARKS)) {
    if (mark && text.includes(mark)) return priority;
  }
  return "none";
}

function taskTitleFromMarkdown(rawBody) {
  return String(rawBody || "")
    .replace(/\s+\^([A-Za-z0-9_-]+)\s*$/, "")
    .replace(/\s+(?:🔺|⏫|🔼|🔽|⏬)(?=\s|$)/g, "")
    .replace(/\s+(?:🛫|⏳|📅|➕)\s+\d{4}-\d{2}-\d{2}/g, "")
    .replace(/\s+🔁\s+(.+?)(?=\s+(?:➕|⏳|🛫|📅)|$)/g, "")
    .replace(/\s+#[\p{L}\p{N}_/-]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function taskMatchesDateRange(task, startDate, endDate) {
  const date = task.scheduledDate || task.startDate;
  if (!date) return false;
  if (task.recurrence && /^every day$/i.test(task.recurrence)) return date <= endDate;
  return date >= startDate && date <= endDate;
}

function sortTaskNavigationItems(tasks, rangeStart) {
  const priorityRank = { highest: 0, high: 1, medium: 2, none: 3, low: 4, lowest: 5 };
  return [...tasks].sort((left, right) => {
    const leftDate = left.scheduledDate || left.startDate || rangeStart;
    const rightDate = right.scheduledDate || right.startDate || rangeStart;
    if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);
    const leftPriority = priorityRank[left.priority] ?? 3;
    const rightPriority = priorityRank[right.priority] ?? 3;
    if (leftPriority !== rightPriority) return leftPriority - rightPriority;
    return left.title.localeCompare(right.title, "zh-CN");
  });
}

function findTaskLineIndex(lines, task) {
  if (task.blockId) {
    const blockPattern = new RegExp(`\\^${escapeRegExp(task.blockId)}\\s*$`);
    const byBlockId = lines.findIndex((line) => blockPattern.test(line));
    if (byBlockId >= 0) return byBlockId;
  }
  if (lines[task.lineNumber] === task.originalLine) return task.lineNumber;
  return lines.findIndex((line) => line === task.originalLine);
}

function patchMarkdownTaskLine(line, patch) {
  let updated = String(line || "");
  if (typeof patch.completed === "boolean") {
    updated = updated.replace(/\[([ xX])\]/, patch.completed ? "[x]" : "[ ]");
  }
  if (typeof patch.title === "string" && patch.title.trim()) {
    updated = replaceTaskTitle(updated, patch.title.trim());
  }
  if (Object.prototype.hasOwnProperty.call(patch, "scheduledDate")) {
    updated = replaceTaskDate(updated, "⏳", patch.scheduledDate);
  }
  return updated;
}

function replaceTaskTitle(line, title) {
  const match = line.match(/^(\s*[-*+]\s+\[[ xX]\]\s+)(.*)$/);
  if (!match) return line;
  const body = match[2];
  const metadataMatch = body.match(/\s+(?=(?:#[\p{L}\p{N}_/-]+|🔺|⏫|🔼|🔽|⏬|🛫|⏳|📅|🔁|➕|\^)[\s\S]*$)/u);
  const suffix = metadataMatch ? body.slice(metadataMatch.index) : "";
  return `${match[1]}${title}${suffix}`;
}

function replaceTaskDate(line, marker, date) {
  const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const markerPattern = new RegExp(`\\s+${escapedMarker}\\s+\\d{4}-\\d{2}-\\d{2}`);
  if (validDateOrUndefined(date)) {
    if (markerPattern.test(line)) return line.replace(markerPattern, ` ${marker} ${date}`);
    const blockIdMatch = line.match(/\s+\^[A-Za-z0-9_-]+\s*$/);
    if (!blockIdMatch) return `${line} ${marker} ${date}`;
    return `${line.slice(0, blockIdMatch.index)} ${marker} ${date}${line.slice(blockIdMatch.index)}`;
  }
  return line.replace(markerPattern, "");
}

function dateFromIso(date) {
  const [year, month, day] = String(date).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function priorityFromShortcutEvent(event) {
  if (!isPlainCtrlShortcutEvent(event)) return undefined;

  const key = String(event.key || "").toLowerCase();
  const priorityByKey = {
    u: "highest",
    h: "high",
    m: "medium",
    l: "low"
  };
  return priorityByKey[key];
}

function dateFromShortcutEvent(event, now = new Date()) {
  if (!isPlainCtrlShortcutEvent(event)) return undefined;

  const key = String(event.key || "").toLowerCase();
  if (key === "y") return formatDate(now);
  if (key === "t") return formatDate(addDays(now, 1));
  if (key === "r") return formatDate(addDays(now, 2));
  if (!/^[1-7]$/.test(key)) return undefined;

  const targetDay = Number(key) === 7 ? 0 : Number(key);
  const today = startOfDay(now);
  const delta = (targetDay - today.getDay() + 7) % 7;
  return formatDate(addDays(today, delta));
}

function isDatePickerShortcutEvent(event) {
  return isPlainCtrlShortcutEvent(event) && String(event.key || "").toLowerCase() === "d";
}

function isPlainCtrlShortcutEvent(event) {
  return Boolean(event.ctrlKey) && !event.altKey && !event.metaKey && !event.shiftKey;
}

function priorityDisplayName(priority) {
  return {
    highest: "最高",
    high: "高",
    medium: "中",
    low: "低",
    lowest: "最低",
    none: "未指定"
  }[priority] || "未指定";
}

function applyTaskDraftOverrides(draft, overrides = {}) {
  return {
    ...draft,
    ...(overrides.priority !== undefined ? { priority: overrides.priority } : {}),
    ...(overrides.scheduledDate !== undefined ? { scheduledDate: overrides.scheduledDate } : {})
  };
}

function protectRawSegments(rawText) {
  const segments = [];
  const protectedText = String(rawText || "").replace(/`([^`]*)`/g, (_match, content) => {
    const token = `__ATBRAW${segments.length}__`;
    segments.push({ token, content });
    return token;
  });
  return { protectedText, segments };
}

function restoreRawSegments(text, segments) {
  let restored = String(text || "");
  for (const segment of segments) {
    restored = restored.split(segment.token).join(segment.content);
  }
  return restored;
}

function normalizeOutsideRawSegments(text, segments) {
  return String(text || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(__ATBRAW\d+__)/g, "$1")
    .trim();
}

function containsAllRawTokens(text, segments) {
  return segments.every((segment) => String(text || "").includes(segment.token));
}

function parseTaskText(rawText, now = new Date()) {
  const protection = protectRawSegments(rawText);
  const original = normalizeOutsideRawSegments(protection.protectedText, protection.segments);
  const extractedTags = [...original.matchAll(/#[\p{L}\p{N}_/-]+/gu)].map((match) => match[0]);
  const priority = inferPriority(original);
  const dateInfo = inferDateInfo(original, now);
  const timeInfo = inferTimeInfo(original);
  const recurrence = inferRecurrence(original);
  if (recurrence && !dateInfo.scheduledDate && !dateInfo.startDate) {
    dateInfo.scheduledDate = nextOccurrenceDateForTime(now, timeInfo);
  }
  const protectedTitle = cleanTitle(original);
  const title = restoreRawSegments(protectedTitle, protection.segments);
  const sourceText = restoreRawSegments(original, protection.segments);

  let confidence = 0.72;
  if (dateInfo.scheduledDate) confidence += 0.1;
  if (priority !== "none") confidence += 0.05;
  if (/找时间|有空|哪天|抽空|回头|之后/.test(original)) confidence -= 0.28;
  if (title.length < 3) confidence -= 0.2;

  return {
    title: title || sourceText,
    tags: extractedTags,
    scheduledDate: dateInfo.scheduledDate,
    startDate: dateInfo.startDate,
    recurrence,
    priority,
    confidence: Math.max(0.1, Math.min(confidence, 0.95)),
    sourceText
  };
}

async function parseTaskWithAiFallback(rawText, settings, now = new Date()) {
  const localDraft = parseTaskText(rawText, now);
  if (!canUseTaskAiProvider(settings)) {
    return localDraft;
  }

  try {
    const protection = protectRawSegments(rawText);
    const aiDraft = await parseTaskWithChatCompletions(protection.protectedText, settings, now);
    return normalizeAiDraft(aiDraft, localDraft, protection.segments);
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
    "将用户自然语言中的任务、开始日期、计划日期、优先级和上下文转换为严格 JSON。",
    "只输出 JSON，不要输出 Markdown、解释、代码块或其他文字。",
    "JSON keys 必须包含：title, notes, project, tags, startDate, scheduledDate, recurrence, priority, estimatedMinutes, confidence, questions。",
    "title 必须为单行、可执行的任务标题；不要包含 Markdown 任务前缀、提醒词、日期、时间或优先级描述。",
    "tags 必须是以 # 开头的数组；日期字段格式为 YYYY-MM-DD；没有值时用 null。",
    "recurrence 是 Obsidian Tasks 循环规则；每天对应 every day。",
    "不要输出 dueDate、reminderAt 或其他自定义提醒字段。",
    "输入可能包含 __ATBRAW0__ 这类原样内容占位符；它们代表用户要求原样保留的文本，必须在 title 中逐字原样保留，不能删除、改写、拆分或解释。",
    "截止、ddl、deadline、某日前等表达中的日期必须写入 scheduledDate，不能写入截止日期字段。",
    "所有日期以 user.now 和 user.timezoneHint 为基准，不能编造日期。",
    "紧急、马上、必须今天对应 highest；重要、尽快、截止对应 high；普通对应 medium；有空、不急对应 low。"
  ].join("\n");
}

function normalizeAiDraft(aiDraft, fallbackDraft, rawSegments = []) {
  const priority = isValidPriority(aiDraft.priority) ? aiDraft.priority : fallbackDraft.priority;
  const tags = Array.isArray(aiDraft.tags)
    ? aiDraft.tags.filter(Boolean).map(String).map(normalizeTag)
    : fallbackDraft.tags;
  const aiTitle = safeString(aiDraft.title);
  const protectedAiTitle = rawSegments.length > 0 && !containsAllRawTokens(aiTitle, rawSegments)
    ? fallbackDraft.title
    : restoreRawSegments(aiTitle, rawSegments);

  const normalized = {
    title: protectedAiTitle || fallbackDraft.title,
    notes: safeString(aiDraft.notes) || undefined,
    project: safeString(aiDraft.project) || undefined,
    tags,
    startDate: validDateOrUndefined(aiDraft.startDate) || fallbackDraft.startDate,
    scheduledDate: validDateOrUndefined(aiDraft.scheduledDate) || fallbackDraft.scheduledDate,
    recurrence: validRecurrenceOrUndefined(aiDraft.recurrence) || fallbackDraft.recurrence,
    priority,
    estimatedMinutes: Number.isFinite(Number(aiDraft.estimatedMinutes)) ? Number(aiDraft.estimatedMinutes) : undefined,
    confidence: clampConfidence(aiDraft.confidence, fallbackDraft.confidence),
    questions: Array.isArray(aiDraft.questions) ? aiDraft.questions.filter(Boolean).map(String) : [],
    sourceText: fallbackDraft.sourceText
  };

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


function validRecurrenceOrUndefined(value) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return undefined;
  if (/^every (day|week|month|year)$/.test(trimmed)) return trimmed;
  if (/^every \d+ (days|weeks|months|years)$/.test(trimmed)) return trimmed;
  if (/^every (monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/.test(trimmed)) return trimmed;
  return undefined;
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
  if (draft.recurrence) parts.push(`🔁 ${draft.recurrence}`);
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

function inferRecurrence(text) {
  if (/以后每天|从今以后每天|之后每天|每天|每日|天天|每一天/.test(text)) return "every day";
  return undefined;
}

function inferDateInfo(text, now) {
  const result = {};
  const lower = text.toLowerCase();

  if (/从.*开始/.test(text)) {
    result.startDate = inferSingleDate(text, now);
  }

  result.scheduledDate = inferSingleDate(text, now);

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

function nextOccurrenceDateForTime(now, timeInfo) {
  if (!timeInfo) return formatDate(now);
  const [hour, minute] = timeInfo.split(":").map(Number);
  const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return formatDate(candidate);
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
    .replace(/(以后每天|从今以后每天|之后每天|每天|每日|天天|每一天)/g, "")
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
