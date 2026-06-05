import type { TextbookArticle } from "@/types";

/*
  文件用途：
  这里维护“教材解读页”的章节卡片。
  每个大括号就是一个章节，内容用自己的复习语言改写，不要复制教材原文。

  字段说明：
  - id：章节卡片唯一编号，不能重复
  - subject：所属学科，只能填 history / politics / geography
  - book：教材或模块名称，例如“历史必修：中外历史纲要相关单元”
  - chapter：章节名，建议和 questions.ts 里的关卡 name 保持一致
  - coreQuestion：本章最核心的问题，帮助学生抓主线
  - keyPoints：关键知识点，建议 3-5 个
  - examFocus：高频考点，建议 3-5 个
  - commonMistakes：易错点，建议 2-4 个
  - relatedQuizId：跳转练习用，格式为“subject:章节名”，例如 "history:新航路开辟"
  - relatedPromptId：跳转 AI 提示词用，填 aiPrompts.ts 里某个提示词的 id

  如何新增一个教材章节：
  1. 复制 textbookGuides 数组里任意一个完整大括号。
  2. 修改 id、subject、book、chapter、coreQuestion 等文字。
  3. 如果希望“跳转练习”能打开对应题目，relatedQuizId 要和 questions.ts 里的关卡 id 一致。
  4. 如果希望“跳转 AI 提示词”更精准，relatedPromptId 要填 aiPrompts.ts 里已有的 id。
  5. 如果希望章节卡片推荐教辅，studyAids.ts 里的 relatedChapters 要包含这个 chapter。
*/

export const textbookGuides: TextbookArticle[] = [
  {
    id: "guide-history-discovery",
    subject: "history",
    book: "历史必修：中外历史纲要相关单元",
    chapter: "新航路开辟",
    coreQuestion: "为什么欧洲人要冒险出海？出海以后世界联系发生了什么变化？",
    keyPoints: ["欧洲商品经济发展", "传统商路受阻", "航海技术进步", "世界市场联系增强"],
    examFocus: ["代表人物与航线对应", "商业革命的表现", "殖民扩张的双重影响"],
    commonMistakes: ["只写世界联系加强，忘记殖民掠夺", "把达伽马和哥伦布航线混淆", "把商业革命和价格革命混为一谈"],
    relatedQuizId: "history:新航路开辟",
    relatedPromptId: "history-timeline"
  },
  {
    id: "guide-politics-economy",
    subject: "politics",
    book: "政治必修：经济与社会",
    chapter: "基本经济制度",
    coreQuestion: "为什么要坚持公有制为主体、多种所有制经济共同发展？",
    keyPoints: ["公有制主体地位", "国有经济主导作用", "非公有制经济作用", "依法平等保护"],
    examFocus: ["主体和主导的区别", "非公有制经济的作用", "材料题中的主体判断"],
    commonMistakes: ["把主体地位和主导作用混淆", "认为非公有制经济不重要", "材料题只背概念，不结合材料"],
    relatedQuizId: "politics:基本经济制度",
    relatedPromptId: "politics-material"
  },
  {
    id: "guide-geography-atmosphere",
    subject: "geography",
    book: "地理必修：自然地理基础",
    chapter: "大气受热过程",
    coreQuestion: "太阳怎样让地面变热？大气为什么能对地面起保温作用？",
    keyPoints: ["太阳短波辐射", "地面长波辐射", "大气吸收", "大气逆辐射"],
    examFocus: ["晴天和阴天的昼夜温差", "温室效应的基本解释", "云层对太阳辐射和保温作用的影响"],
    commonMistakes: ["把太阳辐射和地面辐射混淆", "只背结论，不会解释过程", "不会用大气逆辐射解释夜间保温"],
    relatedQuizId: "geography:大气受热过程",
    relatedPromptId: "geo-process"
  }
];

export const textbookArticles = textbookGuides;
