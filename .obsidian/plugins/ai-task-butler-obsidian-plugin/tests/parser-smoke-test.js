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
  Notification: undefined,
  window: {
    setInterval() { return 1; },
    setTimeout() { return 1; }
  },
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
const settings = {
  aiProvider: "off",
  defaultTag: "#task",
  appendCreatedDate: true,
  appendBlockId: false
};

const contractTask = sandbox.parseTaskText("明天下午三点提醒我给张三发合同，很重要 #work", now);
assert.equal(contractTask.title, "给张三发合同");
assert.equal(contractTask.scheduledDate, "2026-07-01");
assert.equal(contractTask.reminderAt, "2026-07-01T15:00:00");
assert.equal(contractTask.priority, "high");

const contractMarkdown = sandbox.taskDraftToMarkdown(contractTask, settings);
assert.match(contractMarkdown, /^- \[ \] 给张三发合同 #work ⏫ ⏳ 2026-07-01 ⏰ 2026-07-01 15:00 ➕ \d{4}-\d{2}-\d{2}$/);

const reportTask = sandbox.parseTaskText("这个周五前交报告，很重要", now);
assert.equal(reportTask.title, "交报告");
assert.equal(reportTask.dueDate, "2026-07-03");
assert.equal(reportTask.priority, "high");

const looseTask = sandbox.parseTaskText("下周找时间聊一下方案", now);
assert.ok(looseTask.confidence < 0.55);

const dailyTask = sandbox.parseTaskText("以后每天晚上八点提醒我复盘", now);
assert.equal(dailyTask.title, "复盘");
assert.equal(dailyTask.scheduledDate, "2026-06-30");
assert.equal(dailyTask.reminderAt, "2026-06-30T20:00:00");
assert.equal(dailyTask.recurrence, "every day");
const dailyMarkdown = sandbox.taskDraftToMarkdown(dailyTask, settings);
assert.match(dailyMarkdown, /⏳ 2026-06-30/);
assert.match(dailyMarkdown, /⏰ 2026-06-30 20:00/);
assert.match(dailyMarkdown, /🔁 every day/);

const dashboard = sandbox.todayTaskDashboardMarkdown();
assert.match(dashboard, /happens on today/);
assert.match(dashboard, /due before today/);
assert.match(dashboard, /priority is above medium/);

console.log("parser smoke tests passed");
