import type { Subject } from "@/types";

export type SubjectConfig = {
  code: Subject;
  name: string;
  islandName: string;
  description: string;
  homeDescription: string;
  accent: string;
};

export const SUBJECT_CONFIGS: SubjectConfig[] = [
  {
    code: "history",
    name: "历史",
    islandName: "历史岛",
    description: "按中国古代史、中国近现代史、世界史分层推进。",
    homeDescription: "穿越历史长河，探索文明的源流",
    accent: "from-coral/18 to-gold/18"
  },
  {
    code: "politics",
    name: "政治",
    islandName: "政治岛",
    description: "围绕教材章节训练概念判断、材料理解和易错点。",
    homeDescription: "理解社会运行，掌握政治智慧",
    accent: "from-tide/16 to-leaf/16"
  },
  {
    code: "geography",
    name: "地理",
    islandName: "地理岛",
    description: "从地球运动、自然地理到区域问题逐步闯关。",
    homeDescription: "认识地理环境，辨析区域特征",
    accent: "from-leaf/18 to-tide/14"
  },
  {
    code: "biology",
    name: "生物",
    islandName: "生物岛",
    description: "围绕细胞、代谢、遗传、稳态和生态系统逐步训练。",
    homeDescription: "观察生命规律，理解结构与功能",
    accent: "from-leaf/20 to-tide/16"
  },
  {
    code: "math",
    name: "数学",
    islandName: "数学岛",
    description: "按高中数学核心模块分层训练，逐步攻克函数、几何、概率与导数。",
    homeDescription: "函数、几何、概率统计、导数等核心模块分层训练。",
    accent: "from-tide/14 to-gold/18"
  },
  {
    code: "english",
    name: "英语",
    islandName: "英语岛",
    description: "围绕词汇语法、阅读理解、完形填空和七选五进行专项训练。",
    homeDescription: "词汇语法、阅读理解、完形填空、七选五专项训练。",
    accent: "from-coral/12 to-tide/14"
  }
];

export const subjectConfigMap = SUBJECT_CONFIGS.reduce(
  (map, subject) => {
    map[subject.code] = subject;
    return map;
  },
  {} as Record<Subject, SubjectConfig>
);

export function normalizeSubjectCode(value?: string | null): Subject {
  const text = String(value ?? "").trim().toLowerCase();

  if (text.includes("biology") || text.includes("bio") || text.includes("生物") || text.includes("生命科学")) {
    return "biology";
  }
  if (text.includes("math") || text.includes("mathematics") || text.includes("数学")) {
    return "math";
  }
  if (text.includes("english") || text.includes("英语")) {
    return "english";
  }
  if (text.includes("politics") || text.includes("政治") || text.includes("思想政治")) {
    return "politics";
  }
  if (text.includes("geography") || text.includes("地理")) {
    return "geography";
  }
  return "history";
}
