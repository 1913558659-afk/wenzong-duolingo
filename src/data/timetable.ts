import type { ScheduleItem } from "@/types";

export const defaultScheduleItems: ScheduleItem[] = [
  { id: "mon-1", day: "周一", time: "19:30", subject: "history", title: "新航路开辟", task: "完成历史岛第一关 5 道题", done: false },
  { id: "tue-1", day: "周二", time: "20:00", subject: "geography", title: "大气受热过程", task: "画出辐射过程小图，再做一关", done: false },
  { id: "wed-1", day: "周三", time: "19:40", subject: "politics", title: "基本经济制度", task: "背 3 个关键词，练 5 道选择题", done: false },
  { id: "thu-1", day: "周四", time: "20:10", subject: "history", title: "戊戌变法", task: "整理背景、内容、影响三栏表", done: false },
  { id: "fri-1", day: "周五", time: "19:30", subject: "geography", title: "水循环", task: "复习水循环环节和人类活动影响", done: false },
  { id: "sat-1", day: "周六", time: "10:00", subject: "politics", title: "错题复盘", task: "把本周错题交给 AI 做错因分析", done: false },
  { id: "sun-1", day: "周日", time: "16:00", subject: "history", title: "本周总结", task: "回看教材解读，写 5 句复习总结", done: false }
];
