import type { Subject } from "@/types";

const historyChapterAliases: Record<string, string> = {
  "秦汉统一": "秦汉魏晋时期",
  "秦汉时期": "秦汉魏晋时期",
  "秦汉魏晋时期": "秦汉魏晋时期"
};

const historyChapterOrder = [
  "先秦时期",
  "秦汉魏晋时期",
  "隋唐宋元时期",
  "明清时期",
  "晚清时期",
  "民国初期至抗战前",
  "抗日战争与解放战争时期",
  "新中国成立后",
  "古代文明",
  "古代世界史",
  "中古时期的世界",
  "走向整体的世界",
  "全球航路的开辟",
  "新航路开辟到两次工业革命",
  "两次大战期间的世界",
  "第二次世界大战与战后世界",
  "二战后世界"
];

const mathChapterOrder = [
  "集合与常用逻辑用语",
  "函数",
  "三角函数",
  "平面向量",
  "数列",
  "不等式",
  "立体几何",
  "解析几何",
  "概率统计",
  "导数",
  "复数",
  "综合训练"
];

const englishChapterOrder = [
  "词汇与语法",
  "阅读理解",
  "完形填空",
  "七选五",
  "语法填空",
  "应用文写作",
  "读后续写",
  "听力训练",
  "综合训练"
];

const chapterOrders: Partial<Record<Subject, string[]>> = {
  history: historyChapterOrder,
  math: mathChapterOrder,
  english: englishChapterOrder
};

export function normalizeHistoryChapter(chapter: string) {
  const value = chapter.trim();
  return historyChapterAliases[value] ?? value;
}

export function normalizeChapterForSubject(subject: Subject, chapter: string) {
  const value = chapter.trim();
  return subject === "history" ? normalizeHistoryChapter(value) : value;
}

export function defaultChaptersForSubject(subject: Subject) {
  return subject === "math" || subject === "english" ? [...(chapterOrders[subject] ?? [])] : [];
}

export function compareChapters(subject: Subject, first: string, second: string) {
  const order = chapterOrders[subject];
  if (!order) {
    return first.localeCompare(second, "zh-CN");
  }

  const firstIndex = order.indexOf(first);
  const secondIndex = order.indexOf(second);
  const firstKnown = firstIndex >= 0;
  const secondKnown = secondIndex >= 0;

  if (firstKnown && secondKnown) {
    return firstIndex - secondIndex;
  }
  if (firstKnown) {
    return -1;
  }
  if (secondKnown) {
    return 1;
  }
  return first.localeCompare(second, "zh-CN");
}
