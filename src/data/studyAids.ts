import type { StudyAid } from "@/types";

/*
  文件用途：
  这里维护“教辅雷达”的教辅/资料介绍。
  每个大括号就是一本资料。页面会根据 searchKeyword 自动生成京东、淘宝、当当搜索入口。
  不要写死具体商品链接，避免版本变化或链接失效。

  固定写法：
  - subject 只能填：history（历史）、politics（政治）、geography（地理）
  - grade 只能填：高一 / 高二 / 高三 / 通用
  - type 只能填：同步讲解 / 刷题训练 / 一轮复习 / 专题突破 / 错题巩固
  - difficulty 只能填：easy（入门）、medium（进阶）、hard（挑战）
  - coverColor 建议填：bg-coral / bg-gold / bg-leaf / bg-tide

  字段说明：
  - id：教辅唯一编号，不能重复
  - title：书名或资料名
  - subject：所属学科，只能填 history / politics / geography
  - grade：适合阶段
  - type：资料类型
  - difficulty：使用难度
  - fitFor：适合什么学生或家长购买参考
  - highlights：亮点，建议 2-4 个
  - cautions：购买或使用前提醒，建议 1-3 个
  - relatedChapters：适合搭配学习的章节名；教材解读页会根据它推荐教辅
  - priceRange：参考价格，例如“约 30-60 元”
  - searchKeyword：购买搜索关键词，页面会自动生成平台搜索链接
  - coverColor：卡片顶部颜色

  如何新增一本教辅：
  1. 复制 studyAids 数组里任意一本书的完整大括号。
  2. 修改 id、title、subject、grade、type、difficulty 等字段。
  3. relatedChapters 要写教材解读页里的 chapter 名称，才能自动推荐。
  4. searchKeyword 写平台搜索时最容易搜到这类资料的关键词。
  5. 价格只写参考范围，实际价格以购买页面为准。
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
    relatedChapters: ["新航路开辟"],
    priceRange: "约 30-60 元",
    searchKeyword: "高中历史知识图谱",
    coverColor: "bg-coral"
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
    relatedChapters: ["基本经济制度"],
    priceRange: "约 20-45 元",
    searchKeyword: "高中政治知识点速记",
    coverColor: "bg-leaf"
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
    relatedChapters: ["大气受热过程"],
    priceRange: "约 30-60 元",
    searchKeyword: "高中地理过程图解",
    coverColor: "bg-tide"
  }
];
