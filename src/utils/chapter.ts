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

export function normalizeHistoryChapter(chapter: string) {
  const value = chapter.trim();
  return historyChapterAliases[value] ?? value;
}

export function normalizeChapterForSubject(subject: Subject, chapter: string) {
  const value = chapter.trim();
  return subject === "history" ? normalizeHistoryChapter(value) : value;
}

export function compareChapters(subject: Subject, first: string, second: string) {
  if (subject !== "history") {
    return first.localeCompare(second, "zh-CN");
  }

  const firstIndex = historyChapterOrder.indexOf(first);
  const secondIndex = historyChapterOrder.indexOf(second);
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
