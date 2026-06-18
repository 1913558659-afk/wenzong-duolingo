import type { GradeTrendPoint, LearningReport, WrongQuestionStat } from "@/types/education";

export function getClassWrongQuestionStats(_classId: string): WrongQuestionStat[] {
  return [];
}

export function getStudentLearningSummary(studentId: string) {
  return {
    scopeId: studentId,
    strengths: ["持续学习记录稳定"],
    summary: "当前为前端测试摘要，后续将接入真实课程、作业与错题数据。",
    weaknesses: ["等待更多学习数据后生成"]
  };
}

export function getClassLearningSummary(classId: string) {
  return {
    scopeId: classId,
    strengths: ["班级学习数据尚未接入"],
    summary: "当前为班级学情分析占位。",
    weaknesses: ["暂无可分析的真实数据"]
  };
}

export function analyzeGradeTrend(_scopeId: string): GradeTrendPoint[] {
  return [
    { label: "第一次", score: 72 },
    { label: "第二次", score: 78 },
    { label: "第三次", score: 82 }
  ];
}

export function generateLearningReport(scopeType: "student" | "class", scopeId: string): LearningReport {
  return {
    createdAt: new Date().toISOString(),
    highFrequencyWrongQuestions: [],
    id: `mock-report-${scopeType}-${scopeId}`,
    scopeId,
    scopeType,
    strengths: ["学习连续性良好"],
    subject: "history",
    suggestedActions: ["继续积累答题数据", "按章节复盘错题"],
    summary: "此报告为前端结构预览，尚未接入真实教学数据。",
    title: scopeType === "class" ? "班级学情报告" : "学生学习报告",
    weaknesses: ["数据样本不足"]
  };
}
