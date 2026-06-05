import type { ScheduleItem } from "@/types";

/*
  文件用途：
  这里维护“课程表页”的默认学习任务。
  用户在网页里添加或勾选任务后，会保存到 localStorage；这个文件只负责第一次打开时的默认示例。

  字段说明：
  - id：任务唯一编号，不能重复
  - day：星期几，例如 周一、周二、周日
  - time：学习时间，建议写成 19:30 这种格式
  - subject：所属学科，只能填 history / politics / geography
  - title：任务标题，短一点
  - task：具体要做什么，写给学生看的任务描述
  - done：是否完成；默认示例一般填 false

  如何新增一个默认课程表任务：
  1. 复制 defaultScheduleItems 数组里任意一个完整大括号。
  2. 修改 id，保证不要重复。
  3. 修改 day、time、subject、title、task。
  4. done 建议保持 false。

  小提醒：
  - 如果你已经在网页里添加过课程表，本文件修改后不一定马上覆盖浏览器里的旧 localStorage。
  - 想看新的默认课程表，可以在“关于本站”里重置本地记录，或清理浏览器 localStorage。
*/

export const defaultScheduleItems: ScheduleItem[] = [
  {
    id: "mon-1",
    day: "周一",
    time: "19:30",
    subject: "history",
    title: "新航路开辟",
    task: "完成历史岛第一关选择题，并看一遍解析。",
    done: false
  },
  {
    id: "wed-1",
    day: "周三",
    time: "19:40",
    subject: "politics",
    title: "基本经济制度",
    task: "背 3 个关键词，再用 AI 提示词拆一道材料题。",
    done: false
  },
  {
    id: "fri-1",
    day: "周五",
    time: "20:00",
    subject: "geography",
    title: "大气受热过程",
    task: "画出大气受热过程小图，并完成对应练习。",
    done: false
  }
];
