import type { ChallengeLevel, QuizQuestion, Subject } from "@/types";

/*
  以后添加新题目：
  1. 复制 quizQuestions 数组里任意一道题的大括号。
  2. 修改 id，保证不要和已有 id 重复，建议格式：学科-章节-q序号。
  3. subject 只能填 history / politics / geography。
  4. answer 必须和 options 里的某一项文字完全一致。
  5. tags 写 2-4 个关键词，方便以后做筛选、错题本和搜索。
*/

export const islands: Subject[] = ["history", "politics", "geography"];

export const challengeLevels: ChallengeLevel[] = [
  { id: "history:新航路开辟", island: "history", name: "新航路开辟", difficulty: "入门", questionCount: 5, unlocked: true },
  { id: "history:戊戌变法", island: "history", name: "戊戌变法", difficulty: "进阶", questionCount: 5, unlocked: false },
  { id: "history:辛亥革命", island: "history", name: "辛亥革命", difficulty: "挑战", questionCount: 5, unlocked: false },
  { id: "politics:基本经济制度", island: "politics", name: "基本经济制度", difficulty: "入门", questionCount: 5, unlocked: true },
  { id: "politics:市场与政府", island: "politics", name: "市场与政府", difficulty: "进阶", questionCount: 5, unlocked: false },
  { id: "politics:人民民主专政", island: "politics", name: "人民民主专政", difficulty: "挑战", questionCount: 5, unlocked: false },
  { id: "geography:大气受热过程", island: "geography", name: "大气受热过程", difficulty: "入门", questionCount: 5, unlocked: true },
  { id: "geography:水循环", island: "geography", name: "水循环", difficulty: "进阶", questionCount: 5, unlocked: false },
  { id: "geography:城市功能区", island: "geography", name: "城市功能区", difficulty: "挑战", questionCount: 5, unlocked: false }
];

export const quizQuestions: QuizQuestion[] = [
  {
    id: "history-discovery-q1",
    subject: "history",
    chapter: "新航路开辟",
    difficulty: "easy",
    question: "新航路开辟的重要经济背景是？",
    options: ["欧洲商品经济发展", "欧洲完全停止贸易", "美洲已经完成工业化", "奥斯曼帝国支持欧洲远航"],
    answer: "欧洲商品经济发展",
    explanation: "商品经济发展让欧洲对黄金、香料和东方商品的需求增加，这是寻找新航路的重要动力。",
    tags: ["新航路", "背景", "商品经济"]
  },
  {
    id: "history-discovery-q2",
    subject: "history",
    chapter: "新航路开辟",
    difficulty: "easy",
    question: "达伽马航行的主要成果是？",
    options: ["抵达印度", "到达美洲", "完成环球航行", "发现南极洲"],
    answer: "抵达印度",
    explanation: "达伽马绕过好望角抵达印度，开辟了欧洲通往东方的海上航路。",
    tags: ["达伽马", "航线", "印度"]
  },
  {
    id: "history-discovery-q3",
    subject: "history",
    chapter: "新航路开辟",
    difficulty: "easy",
    question: "哥伦布航行最直接联系的地区是？",
    options: ["美洲", "印度", "澳大利亚", "南极洲"],
    answer: "美洲",
    explanation: "哥伦布向西航行到达美洲，虽然他最初以为自己到了东方。",
    tags: ["哥伦布", "美洲", "人物对应"]
  },
  {
    id: "history-discovery-q4",
    subject: "history",
    chapter: "新航路开辟",
    difficulty: "medium",
    question: "新航路开辟后，欧洲贸易中心逐渐转向哪里？",
    options: ["大西洋沿岸", "地中海东岸", "撒哈拉腹地", "北冰洋沿岸"],
    answer: "大西洋沿岸",
    explanation: "新航路开辟推动大西洋沿岸国家海外贸易发展，欧洲贸易中心发生转移。",
    tags: ["商业革命", "贸易中心", "影响"]
  },
  {
    id: "history-discovery-q5",
    subject: "history",
    chapter: "新航路开辟",
    difficulty: "medium",
    question: "评价新航路开辟时，下列说法更全面的是？",
    options: ["只带来进步", "只带来灾难", "加强世界联系，也伴随殖民掠夺", "没有影响"],
    answer: "加强世界联系，也伴随殖民掠夺",
    explanation: "历史评价要看到双重影响：世界联系加强，同时殖民扩张给殖民地人民带来灾难。",
    tags: ["历史评价", "世界联系", "殖民扩张"]
  },
  {
    id: "politics-economy-q1",
    subject: "politics",
    chapter: "基本经济制度",
    difficulty: "easy",
    question: "我国现阶段所有制结构的正确表述是？",
    options: ["公有制为主体，多种所有制经济共同发展", "只发展国有经济", "取消非公有制经济", "完全不需要市场"],
    answer: "公有制为主体，多种所有制经济共同发展",
    explanation: "这是我国基本经济制度的重要内容，也是政治选择题高频考点。",
    tags: ["基本经济制度", "所有制", "公有制"]
  },
  {
    id: "politics-economy-q2",
    subject: "politics",
    chapter: "基本经济制度",
    difficulty: "easy",
    question: "国有经济在国民经济中发挥什么作用？",
    options: ["主导作用", "完全替代作用", "装饰作用", "无关作用"],
    answer: "主导作用",
    explanation: "国有经济控制国民经济命脉，对经济发展发挥主导作用。",
    tags: ["国有经济", "主导作用", "经济制度"]
  },
  {
    id: "politics-economy-q3",
    subject: "politics",
    chapter: "基本经济制度",
    difficulty: "medium",
    question: "非公有制经济的重要作用不包括？",
    options: ["促进就业", "增加税收", "推动创新", "消灭公有制"],
    answer: "消灭公有制",
    explanation: "非公有制经济是社会主义市场经济的重要组成部分，不是为了消灭公有制。",
    tags: ["非公有制经济", "易错", "作用"]
  },
  {
    id: "politics-economy-q4",
    subject: "politics",
    chapter: "基本经济制度",
    difficulty: "medium",
    question: "我国对各种所有制经济的态度是？",
    options: ["依法平等保护", "只保护一种", "全部限制", "完全放任不管"],
    answer: "依法平等保护",
    explanation: "国家依法保护各种所有制经济产权和合法利益，支持它们公平参与市场竞争。",
    tags: ["依法保护", "市场主体", "政策态度"]
  },
  {
    id: "politics-economy-q5",
    subject: "politics",
    chapter: "基本经济制度",
    difficulty: "hard",
    question: "做经济制度材料题时，第一步更适合做什么？",
    options: ["找主体和关键词", "直接写越多越好", "只抄材料", "跳过设问"],
    answer: "找主体和关键词",
    explanation: "政治材料题要先看设问，再找主体和关键词，避免套话和跑题。",
    tags: ["材料题", "审题", "答题方法"]
  },
  {
    id: "geography-atmosphere-q1",
    subject: "geography",
    chapter: "大气受热过程",
    difficulty: "easy",
    question: "大气保温作用主要依靠哪一过程？",
    options: ["大气吸收地面长波辐射并产生逆辐射", "地面直接吸收月光", "太阳辐射全部被反射", "海水停止蒸发"],
    answer: "大气吸收地面长波辐射并产生逆辐射",
    explanation: "地面长波辐射被大气吸收，大气逆辐射把部分热量还给地面。",
    tags: ["大气受热", "大气逆辐射", "保温作用"]
  },
  {
    id: "geography-atmosphere-q2",
    subject: "geography",
    chapter: "大气受热过程",
    difficulty: "easy",
    question: "太阳辐射一般属于？",
    options: ["短波辐射", "长波辐射", "地面辐射", "大气逆辐射"],
    answer: "短波辐射",
    explanation: "高中地理常把太阳辐射理解为短波辐射，地面辐射理解为长波辐射。",
    tags: ["太阳辐射", "短波辐射", "概念"]
  },
  {
    id: "geography-atmosphere-q3",
    subject: "geography",
    chapter: "大气受热过程",
    difficulty: "medium",
    question: "晴朗夜晚气温较低，主要因为？",
    options: ["大气逆辐射弱", "太阳辐射增强", "地面不放热", "海拔突然降低"],
    answer: "大气逆辐射弱",
    explanation: "云量少时大气逆辐射弱，夜间保温作用差，所以降温更明显。",
    tags: ["昼夜温差", "晴天", "逆辐射"]
  },
  {
    id: "geography-atmosphere-q4",
    subject: "geography",
    chapter: "大气受热过程",
    difficulty: "medium",
    question: "白天多云时，地面升温较慢，主要因为？",
    options: ["云层削弱太阳辐射", "大气逆辐射消失", "地球停止自转", "太阳高度角变为零"],
    answer: "云层削弱太阳辐射",
    explanation: "云层会反射和吸收部分太阳辐射，使到达地面的太阳辐射减少。",
    tags: ["云层", "削弱作用", "太阳辐射"]
  },
  {
    id: "geography-atmosphere-q5",
    subject: "geography",
    chapter: "大气受热过程",
    difficulty: "hard",
    question: "大气受热过程最适合用哪组三句话记？",
    options: ["太阳暖地面，地面暖大气，大气还地面", "河流暖山地，山地暖城市，城市还海洋", "人口暖农业，农业暖工业，工业还商业", "历史暖政治，政治暖地理"],
    answer: "太阳暖地面，地面暖大气，大气还地面",
    explanation: "这组三句话能对应太阳辐射、地面辐射和大气逆辐射。",
    tags: ["记忆口诀", "过程理解", "综合判断"]
  }
];
