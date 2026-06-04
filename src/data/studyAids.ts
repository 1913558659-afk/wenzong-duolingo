import type { StudyAid } from "@/types";

/*
  以后添加新教辅：
  1. 复制 studyAids 数组里任意一本书的大括号。
  2. 修改 id，保证唯一，建议格式：aid-学科-书名拼音。
  3. subject 只能填 history / politics / geography。
  4. relatedChapters 写它适合搭配学习的章节名，教材解读页会用它推荐教辅。
  5. searchKeyword 写购买搜索关键词，页面会自动生成京东/淘宝/当当搜索页，不写死具体商品。
*/

export const studyAids: StudyAid[] = [
  {
    id: "aid-history-basic-map",
    title: "高中历史基础知识图谱",
    subject: "history",
    grade: "通用",
    type: "同步讲解",
    difficulty: "easy",
    fitFor: "适合刚开始整理历史框架、时间线经常混乱的同学。",
    highlights: ["按时间线整理事件", "适合课前预习和课后回看", "概念解释比较友好"],
    cautions: ["题量不算大", "更适合打基础，不适合只靠它冲刺难题"],
    relatedChapters: ["新航路开辟", "戊戌变法", "辛亥革命"],
    priceRange: "约 30-60 元",
    searchKeyword: "高中历史知识图谱",
    coverColor: "bg-coral"
  },
  {
    id: "aid-history-question-boost",
    title: "高中历史选择题专项训练",
    subject: "history",
    grade: "高二",
    type: "刷题训练",
    difficulty: "medium",
    fitFor: "适合基础知识能看懂，但选择题总在细节和因果上失分的同学。",
    highlights: ["选择题场景多", "适合配合错题本复盘", "材料型题目比较多"],
    cautions: ["需要自己整理错因", "不建议完全跳过教材直接刷"],
    relatedChapters: ["新航路开辟", "戊戌变法"],
    priceRange: "约 25-50 元",
    searchKeyword: "高中历史选择题专项训练",
    coverColor: "bg-gold"
  },
  {
    id: "aid-politics-keyword",
    title: "高中政治关键词速记",
    subject: "politics",
    grade: "通用",
    type: "同步讲解",
    difficulty: "easy",
    fitFor: "适合政治概念背了就忘、材料题不知道套哪个知识点的同学。",
    highlights: ["关键词清楚", "适合碎片时间背诵", "能帮助材料题找主体"],
    cautions: ["不能替代完整教材理解", "需要配合真题练表达"],
    relatedChapters: ["基本经济制度", "市场与政府", "人民民主专政"],
    priceRange: "约 20-45 元",
    searchKeyword: "高中政治知识点速记",
    coverColor: "bg-leaf"
  },
  {
    id: "aid-politics-material",
    title: "高中政治材料题突破",
    subject: "politics",
    grade: "高二",
    type: "专题突破",
    difficulty: "hard",
    fitFor: "适合选择题还可以，但主观题总写不准、写不全的同学。",
    highlights: ["按题型训练审题", "强调主体和关键词", "适合考前专题突破"],
    cautions: ["对基础概念有要求", "不要直接背模板，要学会迁移"],
    relatedChapters: ["基本经济制度", "市场与政府"],
    priceRange: "约 35-70 元",
    searchKeyword: "高中政治材料题",
    coverColor: "bg-tide"
  },
  {
    id: "aid-geo-process",
    title: "高中地理过程图解",
    subject: "geography",
    grade: "高一",
    type: "同步讲解",
    difficulty: "easy",
    fitFor: "适合自然地理过程看不懂、图示题容易懵的同学。",
    highlights: ["过程图清晰", "适合大气和水循环入门", "帮助建立因果链"],
    cautions: ["区域地理内容较少", "刷题量需要另外补充"],
    relatedChapters: ["大气受热过程", "水循环"],
    priceRange: "约 30-60 元",
    searchKeyword: "高中地理过程图解",
    coverColor: "bg-tide"
  },
  {
    id: "aid-geo-question",
    title: "高中地理图表题训练",
    subject: "geography",
    grade: "高二",
    type: "刷题训练",
    difficulty: "medium",
    fitFor: "适合读图慢、图表信息提取不稳定的同学。",
    highlights: ["图表题集中", "适合训练读图步骤", "城市和自然地理都有覆盖"],
    cautions: ["解析质量要重点看版本", "建议搭配教材知识点复盘"],
    relatedChapters: ["水循环", "城市功能区"],
    priceRange: "约 25-55 元",
    searchKeyword: "高中地理图表题",
    coverColor: "bg-coral"
  }
];
