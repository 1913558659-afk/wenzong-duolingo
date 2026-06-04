import type { AiPrompt } from "@/types";

/*
  以后添加新提示词：
  1. 复制 aiPrompts 数组里任意一个提示词对象。
  2. 修改 id，保证唯一，建议格式：分类-用途。
  3. category 只能填 history / politics / geography / wrongReview / recitePlan。
  4. useCase 写“什么时候用它”，example 写一个学生能直接照着替换的例子。
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
    id: "history-compare",
    category: "history",
    title: "历史事件对比",
    useCase: "适合区分两个容易混淆的历史事件。",
    prompt: "请比较这两个历史事件：相同点、不同点、各自影响、考试常见问法。请用高中生能看懂的语言。",
    example: "例子：请比较洋务运动和戊戌变法，重点讲它们的目的、内容和局限。"
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
    id: "politics-keywords",
    category: "politics",
    title: "政治关键词背诵",
    useCase: "适合背概念前先抓住关键词和易错说法。",
    prompt: "请把这个政治知识点整理成：核心概念、关键词、常见陷阱、选择题判断方法。",
    example: "例子：请整理“市场在资源配置中起决定性作用”的关键词和选择题陷阱。"
  },
  {
    id: "geo-process",
    category: "geography",
    title: "地理过程讲清楚",
    useCase: "适合大气、水循环、洋流等过程类知识点。",
    prompt: "请用因果链讲解这个地理过程。格式：第一步发生什么、为什么发生、会带来什么影响、选择题怎么判断。",
    example: "例子：请用因果链讲解大气受热过程，并说明晴朗夜晚为什么更冷。"
  },
  {
    id: "geo-map",
    category: "geography",
    title: "地理图表读题",
    useCase: "适合遇到地图、统计图、示意图读不懂时使用。",
    prompt: "请帮我读这张地理图或材料。先判断图表类型，再找关键信息，最后告诉我做题时应该注意什么。",
    example: "例子：请帮我分析一张城市功能区示意图，判断商业区和住宅区的位置。"
  },
  {
    id: "wrong-answer",
    category: "wrongReview",
    title: "选择题错因分析",
    useCase: "适合做完题后，把错题变成可复习的经验。",
    prompt: "我会给你题干、选项、正确答案和我的答案。请帮我分析：考点是什么、我为什么错、下次看到类似题怎么判断。",
    example: "例子：我选了 B，但正确答案是 A。请帮我分析我错在概念、审题还是排除法。"
  },
  {
    id: "recite-three-days",
    category: "recitePlan",
    title: "三天背诵计划",
    useCase: "适合周测或小考前，把一章内容拆成每天能完成的小任务。",
    prompt: "请根据我给你的知识点，安排一个三天背诵计划。每天任务不要太多，要包含复习、默写和自测。",
    example: "例子：请把“基本经济制度”安排成三天背诵计划，每天 20 分钟。"
  }
];
