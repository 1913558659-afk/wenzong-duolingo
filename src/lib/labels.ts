import type { Difficulty, PromptCategory, Subject } from "@/types";

export const subjectLabels: Record<Subject, string> = {
  history: "历史",
  politics: "政治",
  geography: "地理"
};

export const promptCategoryLabels: Record<PromptCategory, string> = {
  history: "历史",
  politics: "政治",
  geography: "地理",
  wrongReview: "错题分析",
  recitePlan: "背诵计划"
};

export const difficultyLabels: Record<Difficulty, string> = {
  easy: "入门",
  medium: "进阶",
  hard: "挑战"
};
