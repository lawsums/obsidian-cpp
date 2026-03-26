# 1 📅 日记 <% tp.date.now("YYYY-MM-DD") %> | <% tp.date.now("dddd") %>

## 1.1 🎯 今日自动任务
<%*
const weekday = tp.date.now("dddd");

// ========= 在这里自定义你的每周任务 =========
// 按星期自动生成任务 SWITCH 版
switch (weekday) {
  case "星期二":
    tR += "- ✅ 参加组会\n";
    tR += "- 📝 准备组会内容\n";
    break;
  case "星期四":
    tR += "- [ ] 📄 待在实验室\n";
    break;
  case "星期五":
    tR += "- 📄 写周报\n";
    tR += "- 🗓️ 规划下周工作\n";
    break;
  // 其他星期不添加特殊任务
  default:
    break;
}

// 每日都有的任务
tR += "- ✅ 日常打卡\n";
tR += "- 💡 记录今日收获\n";
%>
