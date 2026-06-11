import type { Difficulty, Subject } from "@/types";

export type PartnerChessQuizQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  subject: Subject;
  difficulty: Difficulty;
};

export const partnerChessQuizQuestions: PartnerChessQuizQuestion[] = [
  {
    id: "pcq-001",
    subject: "history",
    difficulty: "easy",
    question: "做材料题时，第一步最应该先做什么？",
    options: ["直接背结论", "圈出时间、主体和关键词", "先看解析", "跳过材料"],
    answer: "B",
    explanation: "先抓时间、主体和关键词，能减少粗心漏读。"
  },
  {
    id: "pcq-002",
    subject: "politics",
    difficulty: "easy",
    question: "判断政治观点题时，最稳妥的做法是？",
    options: ["只看选项语气", "先判断材料主旨，再对应教材概念", "凭熟悉程度选", "只选最长的"],
    answer: "B",
    explanation: "材料主旨和教材概念对应，是政治选择题的重要路径。"
  },
  {
    id: "pcq-003",
    subject: "geography",
    difficulty: "medium",
    question: "读地图题时，最容易先忽略的信息是？",
    options: ["图例、比例尺和方向", "题干最后一句", "选项顺序", "图片颜色"],
    answer: "A",
    explanation: "地图三要素是判断空间位置和距离的基础。"
  },
  {
    id: "pcq-004",
    subject: "english",
    difficulty: "easy",
    question: "英语语法填空遇到括号词时，通常先判断什么？",
    options: ["中文意思", "词性和句子成分", "是否很长", "是否认识"],
    answer: "B",
    explanation: "词性和句子成分决定形式变化。"
  },
  {
    id: "pcq-005",
    subject: "math",
    difficulty: "medium",
    question: "函数题中判断定义域时，根号内通常需要满足什么条件？",
    options: ["大于 0", "小于 0", "大于等于 0", "任意实数"],
    answer: "C",
    explanation: "偶次根式中被开方数需要大于等于 0。"
  },
  {
    id: "pcq-006",
    subject: "biology",
    difficulty: "easy",
    question: "复习生物实验题时，最应该关注的是？",
    options: ["实验目的、变量和对照", "图片是否好看", "题目长度", "选项数量"],
    answer: "A",
    explanation: "实验目的、变量和对照是实验分析的核心。"
  },
  {
    id: "pcq-007",
    subject: "history",
    difficulty: "medium",
    question: "防止“背了就忘”的有效复习方式是？",
    options: ["只读一遍", "间隔复习并主动回忆", "考前通宵", "只看答案"],
    answer: "B",
    explanation: "间隔复习和主动回忆能加强长期记忆。"
  },
  {
    id: "pcq-008",
    subject: "politics",
    difficulty: "medium",
    question: "面对焦虑导致做题变慢，最适合的策略是？",
    options: ["立刻放弃", "固定审题步骤，先做会做的题", "反复看同一道题", "只凭第一感觉"],
    answer: "B",
    explanation: "固定步骤能降低焦虑对判断的干扰。"
  },
  {
    id: "pcq-009",
    subject: "geography",
    difficulty: "hard",
    question: "区域地理综合题中，组织答案时最好遵循什么？",
    options: ["想到哪写到哪", "自然条件、人文条件、影响结果分层表达", "只写结论", "只写一个角度"],
    answer: "B",
    explanation: "分层表达能减少漏点，也更符合综合题评分。"
  }
];

export function getPartnerChessQuestions(round: number) {
  const count = round <= 1 ? 1 : round === 2 ? 2 : 3;
  const start = ((round - 1) * 2) % partnerChessQuizQuestions.length;
  return Array.from({ length: count }, (_, index) => partnerChessQuizQuestions[(start + index) % partnerChessQuizQuestions.length]);
}
