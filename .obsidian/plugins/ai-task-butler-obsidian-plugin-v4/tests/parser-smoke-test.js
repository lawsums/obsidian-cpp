const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "main.js"), "utf8");

class Plugin {
  addRibbonIcon() {}
  addCommand() {}
  addSettingTab() {}
  registerInterval() {}
  async loadData() { return {}; }
  async saveData() {}
}

class Modal {}
class PluginSettingTab {}
class TFile {}

const sandbox = {
  console,
  Intl,
  Date,
  require(name) {
    if (name !== "obsidian") throw new Error(`Unexpected require: ${name}`);
    return {
      App: class {},
      Modal,
      Notice: class {},
      Plugin,
      PluginSettingTab,
      requestUrl: async () => {
        throw new Error("requestUrl should not be called in offline tests");
      },
      Setting: class {},
      TFile,
      normalizePath: (value) => value
    };
  },
  module: { exports: {} },
  exports: {}
};

vm.createContext(sandbox);
new vm.Script(source, { filename: "main.js" }).runInContext(sandbox);

const now = new Date(2026, 5, 30);

assert.equal(sandbox.priorityFromShortcutEvent({ ctrlKey: true, altKey: false, metaKey: false, shiftKey: false, key: "u" }), "highest");
assert.equal(sandbox.priorityFromShortcutEvent({ ctrlKey: true, altKey: false, metaKey: false, shiftKey: false, key: "H" }), "high");
assert.equal(sandbox.priorityFromShortcutEvent({ ctrlKey: true, altKey: false, metaKey: false, shiftKey: false, key: "m" }), "medium");
assert.equal(sandbox.priorityFromShortcutEvent({ ctrlKey: true, altKey: false, metaKey: false, shiftKey: false, key: "l" }), "low");
assert.equal(sandbox.priorityFromShortcutEvent({ ctrlKey: false, altKey: false, metaKey: false, shiftKey: false, key: "h" }), undefined);
assert.equal(sandbox.priorityFromShortcutEvent({ ctrlKey: true, altKey: false, metaKey: false, shiftKey: true, key: "h" }), undefined);
assert.equal(sandbox.dateFromShortcutEvent({ ctrlKey: true, altKey: false, metaKey: false, shiftKey: false, key: "y" }, now), "2026-06-30");
assert.equal(sandbox.dateFromShortcutEvent({ ctrlKey: true, altKey: false, metaKey: false, shiftKey: false, key: "t" }, now), "2026-07-01");
assert.equal(sandbox.dateFromShortcutEvent({ ctrlKey: true, altKey: false, metaKey: false, shiftKey: false, key: "r" }, now), "2026-07-02");
assert.equal(sandbox.dateFromShortcutEvent({ ctrlKey: true, altKey: false, metaKey: false, shiftKey: false, key: "1" }, now), "2026-07-06");
assert.equal(sandbox.dateFromShortcutEvent({ ctrlKey: true, altKey: false, metaKey: false, shiftKey: false, key: "2" }, now), "2026-06-30");
assert.equal(sandbox.dateFromShortcutEvent({ ctrlKey: true, altKey: false, metaKey: false, shiftKey: false, key: "7" }, now), "2026-07-05");
assert.equal(sandbox.isDatePickerShortcutEvent({ ctrlKey: true, altKey: false, metaKey: false, shiftKey: false, key: "d" }), true);
assert.equal(sandbox.isDatePickerShortcutEvent({ ctrlKey: true, altKey: false, metaKey: false, shiftKey: true, key: "d" }), false);

const settings = {
  aiProvider: "off",
  defaultTag: "#task",
  appendCreatedDate: true,
  appendBlockId: false
};

const contractTask = sandbox.parseTaskText("明天下午三点提醒我给张三发合同，很重要 #work", now);
assert.equal(contractTask.title, "给张三发合同");
assert.equal(contractTask.scheduledDate, "2026-07-01");
assert.equal(contractTask.reminderAt, undefined);
assert.equal(contractTask.dueDate, undefined);
assert.equal(contractTask.priority, "high");

const contractMarkdown = sandbox.taskDraftToMarkdown(contractTask, settings);
assert.match(contractMarkdown, /^- \[ \] 给张三发合同 #work ⏫ ⏳ 2026-07-01 ➕ \d{4}-\d{2}-\d{2}$/);
assert.doesNotMatch(contractMarkdown, /(?:⏰|📅)/u);

const reportTask = sandbox.parseTaskText("这个周五前交报告，很重要", now);
assert.equal(reportTask.title, "交报告");
assert.equal(reportTask.scheduledDate, "2026-07-03");
assert.equal(reportTask.dueDate, undefined);
assert.equal(reportTask.priority, "high");
assert.doesNotMatch(sandbox.taskDraftToMarkdown(reportTask, settings), /📅/);

const aiNormalizedTask = sandbox.normalizeAiDraft({
  title: "交报告",
  tags: ["#work"],
  startDate: "2026-07-01",
  scheduledDate: "2026-07-03",
  dueDate: "2026-07-04",
  reminderAt: "2026-07-03T15:00:00",
  recurrence: null,
  priority: "high",
  confidence: 0.9,
  questions: []
}, reportTask);
assert.equal(aiNormalizedTask.startDate, "2026-07-01");
assert.equal(aiNormalizedTask.scheduledDate, "2026-07-03");
assert.equal(aiNormalizedTask.dueDate, undefined);
assert.equal(aiNormalizedTask.reminderAt, undefined);
assert.doesNotMatch(sandbox.taskDraftToMarkdown(aiNormalizedTask, settings), /(?:⏰|📅)/u);

const rawPreservedTask = sandbox.parseTaskText("明天整理 `[[项目文档]] https://example.com/a?id=123 #keep deadline 2026-07-10 很重要`", now);
assert.equal(rawPreservedTask.scheduledDate, "2026-07-01");
assert.equal(rawPreservedTask.priority, "none");
assert.equal(rawPreservedTask.tags.length, 0);
assert.equal(rawPreservedTask.title, "整理 [[项目文档]] https://example.com/a?id=123 #keep deadline 2026-07-10 很重要");
assert.match(sandbox.taskDraftToMarkdown(rawPreservedTask, settings), /\[\[项目文档\]\] https:\/\/example\.com\/a\?id=123 #keep deadline 2026-07-10 很重要/);

const rawSpacedTask = sandbox.parseTaskText("处理 `保留  两个空格` 明天", now);
assert.match(rawSpacedTask.title, /保留  两个空格/);

const mergedOverrides = sandbox.applyTaskDraftOverrides(contractTask, {
  priority: "low",
  scheduledDate: "2026-07-09"
});
assert.equal(mergedOverrides.priority, "low");
assert.equal(mergedOverrides.scheduledDate, "2026-07-09");
assert.equal(contractTask.priority, "high");
assert.equal(contractTask.scheduledDate, "2026-07-01");

const aiRawFallback = sandbox.normalizeAiDraft({
  title: "整理链接",
  tags: [],
  priority: "medium",
  confidence: 0.9,
  questions: []
}, rawPreservedTask, [{ token: "__ATBRAW0__", content: "[[项目文档]] https://example.com/a?id=123 #keep deadline 2026-07-10 很重要" }]);
assert.equal(aiRawFallback.title, rawPreservedTask.title);

const looseTask = sandbox.parseTaskText("下周找时间聊一下方案", now);
assert.ok(looseTask.confidence < 0.55);

const dailyTask = sandbox.parseTaskText("以后每天晚上八点提醒我复盘", now);
assert.equal(dailyTask.title, "复盘");
assert.equal(dailyTask.scheduledDate, "2026-06-30");
assert.equal(dailyTask.reminderAt, undefined);
assert.equal(dailyTask.recurrence, "every day");
const dailyMarkdown = sandbox.taskDraftToMarkdown(dailyTask, settings);
assert.match(dailyMarkdown, /⏳ 2026-06-30/);
assert.doesNotMatch(dailyMarkdown, /(?:⏰|📅)/u);
assert.match(dailyMarkdown, /🔁 every day/);

const dashboard = sandbox.todayTaskDashboardMarkdown();
assert.match(dashboard, /happens on today/);
assert.match(dashboard, /due before today/);
assert.match(dashboard, /priority is above medium/);

console.log("parser smoke tests passed");
