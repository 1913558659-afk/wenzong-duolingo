import type { AiPrompt } from "@/types";

/*
  文件用途：
  这里维护“AI 学习提示词页”的卡片。
  每个大括号就是一个提示词，学生可以一键复制去问 AI。

  category 只能填：
  - history：历史
  - politics：政治
  - geography：地理
  - wrongReview：错题分析
  - recitePlan：背诵计划

  字段说明：
  - id：提示词唯一编号，不能重复；教材解读页会用它跳转
  - category：提示词分类，只能填上面 5 个固定值
  - title：页面上显示的标题，短一点
  - useCase：什么时候适合用这个提示词
  - prompt：真正复制给 AI 的提示词
  - example：学生可以照着替换的使用例子

  如何新增一个 AI 提示词：
  1. 复制 aiPrompts 数组里任意一个完整大括号。
  2. 修改 id，建议格式：分类-用途，例如 "history-cause-analysis"。
  3. 修改 category、title、useCase、prompt、example。
  4. 如果教材解读页要跳到它，把 textbookGuides.ts 里的 relatedPromptId 改成这个 id。
*/

export const aiPrompts: AiPrompt[] = [
  {
    id: "history-timeline",
    category: "history",
    title: "历史时间线整理",
    useCase: "适合复习历史事件顺序、背景、过程和影响。",
    prompt: "请帮我把这个历史章节整理成时间线。要求写清楚：背景、过程、结果、影响，并提醒我最容易混淆的知识点。",
    example: "例子：请把“新航路开辟”整理成时间线，并帮我区分商业革命和价格革命。"
  },
  {
    id: "politics-material",
    category: "politics",
    title: "政治材料题拆题",
    useCase: "适合遇到政治材料题，不知道从哪里开始写答案时使用。",
    prompt: "请帮我分析这道政治材料题。先找主体，再找关键词，最后按知识点分条写答案。不要写太空泛。",
    example: "例子：材料提到民营企业创新和就业，请帮我用基本经济制度知识点拆题。"
  },
  {
    id: "geo-process",
    category: "geography",
    title: "地理过程讲清楚",
    useCase: "适合大气、水循环、洋流等过程类知识点。",
    prompt: "请用因果链讲解这个地理过程。格式：第一步发生什么、为什么发生、会带来什么影响、选择题怎么判断。",
    example: "例子：请用因果链讲解大气受热过程，并说明晴朗夜晚为什么更冷。"
  }
];
