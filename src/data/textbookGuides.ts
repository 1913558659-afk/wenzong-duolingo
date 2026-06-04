import type { TextbookArticle } from "@/types";

/*
  以后添加新章节：
  1. 复制 textbookGuides 数组里任意一个章节对象。
  2. 修改 id，保证唯一，建议格式：guide-学科-章节名拼音或英文。
  3. subject 只能填 history / politics / geography。
  4. relatedQuizId 填这个章节对应的练习入口，目前建议写成：subject:chapter，例如 history:新航路开辟。
  5. relatedPromptId 填 aiPrompts.ts 里某个提示词的 id，用来跳转到合适的 AI 提示词。
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
    id: "guide-history-reform",
    subject: "history",
    book: "历史必修：近代中国相关单元",
    chapter: "戊戌变法",
    coreQuestion: "民族危机加深后，维新派为什么要变法？变法为什么没能成功？",
    keyPoints: ["甲午战败后的民族危机", "维新思想传播", "变法措施", "顽固势力阻挠"],
    examFocus: ["变法背景", "失败原因", "思想启蒙作用"],
    commonMistakes: ["把戊戌变法和洋务运动混在一起", "只记失败，不写思想影响", "忽略维新派自身局限"],
    relatedQuizId: "history:戊戌变法",
    relatedPromptId: "history-compare"
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
    id: "guide-politics-market",
    subject: "politics",
    book: "政治必修：经济与社会",
    chapter: "市场与政府",
    coreQuestion: "市场怎样配置资源？为什么还需要政府更好发挥作用？",
    keyPoints: ["价格机制", "供求关系", "竞争机制", "宏观调控"],
    examFocus: ["市场决定性作用", "市场调节局限", "有效市场和有为政府"],
    commonMistakes: ["把市场局限理解成市场无用", "只写政府作用，忘记市场机制", "看见价格波动却想不到供求关系"],
    relatedQuizId: "politics:市场与政府",
    relatedPromptId: "politics-keywords"
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
  },
  {
    id: "guide-geography-water",
    subject: "geography",
    book: "地理必修：自然地理基础",
    chapter: "水循环",
    coreQuestion: "水怎样在海洋、陆地和大气之间循环？人类活动会改变哪些环节？",
    keyPoints: ["蒸发", "水汽输送", "降水", "径流", "下渗"],
    examFocus: ["海陆间循环环节", "植被破坏对径流的影响", "城市内涝与下渗减少"],
    commonMistakes: ["环节写不全", "把水循环能量来源说错", "分析城市内涝时忘记硬化地面"],
    relatedQuizId: "geography:水循环",
    relatedPromptId: "geo-map"
  }
];

export const textbookArticles = textbookGuides;
