import type { QuizQuestion } from "@/types";
import { normalizeHistoryChapter } from "@/utils/chapter";

export type ChallengeLevelUnit = {
  id: string;
  index: number;
  title: string;
  questions: QuizQuestion[];
};

const fallbackLevelTitles = [
  "政治制度与国家治理",
  "经济发展与社会生活",
  "思想文化与历史解释",
  "民族关系与对外交流",
  "阶段特征综合训练",
  "高考综合演练"
];

const historyLevelTitlePresets: Record<string, string[]> = {
  "先秦时期": [
    "早期国家与文明起源",
    "西周分封宗法与礼乐秩序",
    "春秋战国政治变革",
    "先秦经济与社会结构",
    "百家争鸣与思想文化",
    "统一趋势与历史解释",
    "阶段特征综合训练"
  ],
  "秦汉魏晋时期": [
    "秦汉统一与制度奠基",
    "汉代中央集权与国家治理",
    "秦汉经济社会与边疆治理",
    "魏晋门阀政治与选官制度",
    "民族交融与思想文化",
    "阶段特征综合训练"
  ],
  "隋唐宋元时期": [
    "隋唐制度与国家治理",
    "唐宋经济与社会变迁",
    "宋元政治格局与民族关系",
    "思想文化与科技交流",
    "阶段特征综合训练"
  ],
  "明清时期": [
    "明清君主专制与国家治理",
    "明清经济发展与社会结构",
    "边疆治理与民族关系",
    "思想文化与时代变化",
    "阶段特征综合训练"
  ],
  "晚清时期": [
    "晚清危局与民族危机",
    "列强侵略与条约体系",
    "洋务运动与近代转型",
    "维新变法与制度探索",
    "社会经济与思想变迁",
    "阶段特征综合训练"
  ],
  "民国初期至抗战前": [
    "民国政治与制度转型",
    "北洋时期与社会变迁",
    "南京国民政府与近代建设",
    "新民主主义革命兴起",
    "近代思想文化与社会生活",
    "阶段特征综合训练"
  ],
  "抗日战争与解放战争时期": [
    "全民族抗战与统一战线",
    "正面战场与敌后战场",
    "抗战胜利与民族觉醒",
    "解放战争与政权更替",
    "阶段特征综合训练"
  ],
  "新中国成立后": [
    "政权巩固与制度建立",
    "社会主义建设探索",
    "改革开放与现代化建设",
    "中国特色社会主义新时代",
    "阶段特征综合训练"
  ],
  "古代世界史": [
    "古代文明与早期国家",
    "古代帝国与文明交流",
    "中古欧洲与亚洲世界",
    "古代非洲美洲文明",
    "阶段特征综合训练"
  ],
  "新航路开辟到两次工业革命": [
    "新航路开辟与世界联系",
    "早期殖民扩张与全球贸易",
    "资产阶级革命与制度变革",
    "工业革命与世界市场",
    "阶段特征综合训练"
  ],
  "两次大战期间的世界": [
    "一战后的国际秩序",
    "经济危机与政治变化",
    "苏联社会主义建设",
    "法西斯主义与战争阴影",
    "阶段特征综合训练"
  ],
  "二战后的世界": [
    "冷战格局与国际秩序",
    "世界殖民体系瓦解",
    "多极化趋势与全球化",
    "战后经济与社会变化",
    "阶段特征综合训练"
  ]
};

const maxQuestionsPerLevel = 10;

function getQuestionSortKey(question: QuizQuestion, originalIndex: number) {
  return question.id || `${originalIndex}`;
}

function stableSortQuestions(questions: QuizQuestion[]) {
  return questions
    .map((question, originalIndex) => ({ originalIndex, question, sortKey: getQuestionSortKey(question, originalIndex) }))
    .sort((first, second) => {
      const result = first.sortKey.localeCompare(second.sortKey, "zh-CN", { numeric: true });
      return result === 0 ? first.originalIndex - second.originalIndex : result;
    })
    .map(({ question }) => question);
}

function getLevelSizes(total: number) {
  if (total <= 0) {
    return [];
  }

  const levelCount = Math.ceil(total / maxQuestionsPerLevel);
  const baseSize = Math.floor(total / levelCount);
  const remainder = total % levelCount;

  return Array.from({ length: levelCount }, (_, index) => baseSize + (index < remainder ? 1 : 0));
}

function toChineseSerial(index: number) {
  const values = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  return values[index - 1] ?? `${index}`;
}

function getLevelTitle(subjectName: string, chapterTitle: string, index: number) {
  const normalizedSubject = subjectName.trim();
  const normalizedChapter = normalizedSubject === "历史" ? normalizeHistoryChapter(chapterTitle) : chapterTitle.trim();
  const presetTitles = normalizedSubject === "历史" ? historyLevelTitlePresets[normalizedChapter] : undefined;
  const titles = presetTitles ?? fallbackLevelTitles;

  if (titles[index - 1]) {
    return titles[index - 1];
  }

  return `综合训练（${toChineseSerial(index - titles.length)}）`;
}

export function buildChallengeLevels({
  chapterTitle,
  questions,
  subjectName
}: {
  questions: QuizQuestion[];
  subjectName: string;
  chapterTitle: string;
}) {
  const sortedQuestions = stableSortQuestions(questions);
  const sizes = getLevelSizes(sortedQuestions.length);
  let cursor = 0;

  return sizes.map((size, index): ChallengeLevelUnit => {
    const levelIndex = index + 1;
    const levelQuestions = sortedQuestions.slice(cursor, cursor + size);
    cursor += size;

    return {
      id: `level:${levelIndex}`,
      index: levelIndex,
      title: getLevelTitle(subjectName, chapterTitle, levelIndex),
      questions: levelQuestions
    };
  });
}
