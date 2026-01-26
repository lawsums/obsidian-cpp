
# 今日日记 <% tp.file.title %>
## 通用待办
- [ ] 背单词20个
- [ ] 阅读1小时
- [ ] 记录收支

## 当日专属任务
<%*
// 获取英文全写的星期（如Monday）
const weekName = tp.date.now("dddd", 0, tp.file.title, "yyyy-MM-dd");
let specialTasks = "";
if (weekName === "Monday") {
  specialTasks = "- [ ] 领取本周办公用品\n- [ ] 核对上周考勤";
} else if (weekName === "Tuesday") {
  specialTasks = "- [ ] 参加技术分享会\n- [ ] 测试新功能模块";
} else if (weekName === "Wednesday") {
  specialTasks = "- [ ] 优化工作流程\n- [ ] 备份重要数据";
} else if (weekName === "Thursday") {
  specialTasks = "- [ ] 组织小组讨论\n- [ ] 反馈工作中问题";
} else if (weekName === "Friday") {
  specialTasks = "- [ ] 盘点本周物资\n- [ ] 提交报销申请";
} else if (weekName === "Saturday") {
  specialTasks = "- [ ] 打扫房间卫生\n- [ ] 陪伴家人";
} else if (weekName === "Sunday") {
  specialTasks = "- [ ] 采购下周生活用品\n- [ ] 调整作息准备上班";
}
tR += specialTasks;
%>

## 今日总结