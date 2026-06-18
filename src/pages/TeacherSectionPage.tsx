import { ArrowLeft, BarChart3, BookOpen, ClipboardList, FileText, School, UsersRound } from "lucide-react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import type { PageId } from "@/types";

const sectionConfig: Record<string, { description: string; icon: typeof School; modules: string[]; title: string }> = {
  teacherClasses: { description: "创建班级、查看班级和管理邀请码。", icon: School, modules: ["班级列表", "创建班级", "班级邀请码", "班级成员概览"], title: "班级管理" },
  teacherStudents: { description: "管理当前教师负责班级中的学生。", icon: UsersRound, modules: ["学生列表", "添加学生", "标签与分组", "学生学习概览"], title: "学生管理" },
  teacherCourses: { description: "创建课程并关联学科、章节、班级和任务。", icon: BookOpen, modules: ["课程列表", "课程创建", "章节范围", "作业与任务"], title: "课程与任务管理" },
  teacherGrades: { description: "录入成绩并查看趋势与分数段分析。", icon: BarChart3, modules: ["成绩录入", "批量导入预留", "班级均分", "个人趋势", "分数段分布"], title: "成绩管理与分析" },
  teacherWrongAnalytics: { description: "分析班级高频错题和薄弱知识点。", icon: ClipboardList, modules: ["班级错题总览", "高频错题 TOP 10", "高频知识点", "学科 / 章节筛选", "学生错题分布", "导出报告预留"], title: "错题统计与高频错题分析" },
  teacherReports: { description: "生成班级和学生个人学情报告。", icon: FileText, modules: ["班级学习摘要", "学生个人摘要", "优势与薄弱项", "建议行动", "报告导出预留"], title: "学情分析报告" }
};

export function TeacherSectionPage({ page, navigate }: { navigate: (page: PageId) => void; page: PageId }) {
  const config = sectionConfig[page] ?? sectionConfig.teacherClasses;
  const Icon = config.icon;
  return (
    <div className="space-y-5 pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-6">
      <PageHeader title={config.title} subtitle={config.description} />
      <GameCard className="bg-white/74">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-tide/10 text-tide"><Icon className="size-6" /></span>
          <div>
            <h2 className="text-xl font-black text-ink">第一版功能占位</h2>
            <p className="mt-1 text-sm font-semibold text-ink/54">后续接入真实后端时，将按教师 ID、班级 ID 和课程 ID 做服务端权限校验。</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {config.modules.map((module) => <div className="rounded-2xl bg-ink/5 px-4 py-4 text-sm font-black text-ink/68" key={module}>{module}</div>)}
        </div>
        <button className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-ink px-5 text-sm font-black text-white" onClick={() => navigate("teacher")} type="button">
          <ArrowLeft className="size-4" />返回教师管理中心
        </button>
      </GameCard>
    </div>
  );
}
