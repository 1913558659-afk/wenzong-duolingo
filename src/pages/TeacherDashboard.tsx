import { useState } from "react";
import { BarChart3, BookOpen, ClipboardList, Database, FileText, GraduationCap, RotateCcw, School, UsersRound } from "lucide-react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import { generateMockEducationData, getEducationDataSnapshot, resetEducationDemoData } from "@/lib/educationStore";
import type { PageId } from "@/types";
import type { EducationDataSnapshot } from "@/types/education";

type TeacherDashboardProps = {
  navigate: (page: PageId) => void;
};

const teacherEntries: Array<{ description: string; icon: typeof School; page: PageId; title: string }> = [
  { description: "创建和查看班级，预留班级邀请码与成员管理。", icon: School, page: "teacherClasses", title: "班级管理" },
  { description: "查看学生列表、添加学生并维护教学关系。", icon: UsersRound, page: "teacherStudents", title: "学生管理" },
  { description: "创建课程，绑定学科、班级和章节范围。", icon: BookOpen, page: "teacherCourses", title: "课程管理" },
  { description: "预留练习任务、章节任务和题目指派。", icon: ClipboardList, page: "teacherCourses", title: "作业 / 任务管理" },
  { description: "预留手动录入、批量导入和成绩记录。", icon: GraduationCap, page: "teacherGrades", title: "成绩录入" },
  { description: "查看班级均分、个人趋势与分数段分布。", icon: BarChart3, page: "teacherGrades", title: "成绩分析" },
  { description: "分析高频错题、知识点和班级错题率。", icon: ClipboardList, page: "teacherWrongAnalytics", title: "错题统计" },
  { description: "预览班级和学生个人学情分析报告。", icon: FileText, page: "teacherReports", title: "学情分析报告" }
];

export function TeacherDashboard({ navigate }: TeacherDashboardProps) {
  const [data, setData] = useState<EducationDataSnapshot>(() => getEducationDataSnapshot());
  const hasData = data.classes.length + data.students.length + data.courses.length + data.assignments.length + data.grades.length + data.reports.length > 0;
  const studentsById = new Map(data.students.map((student) => [student.id, student]));
  const coursesById = new Map(data.courses.map((course) => [course.id, course]));
  const recentGrades = [...data.grades].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const recentReports = [...data.reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);

  return (
    <div className="space-y-5 pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-6">
      <PageHeader title="教师管理中心" subtitle="查看班级、学生、课程、任务与学习成果的本地演示数据。" />

      <GameCard className="bg-[linear-gradient(135deg,#EEF7F7_0%,#FFFFFF_50%,#F7F1E4_100%)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-tide">Education Demo Store</p>
            <h2 className="mt-2 text-xl font-black text-ink">{hasData ? "教学数据概览" : "还没有教育模块数据"}</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-ink/56">
              {hasData ? "以下数据来自当前浏览器的 localStorage，可用于验证教师端仪表盘。" : "生成一组不包含真实个人信息的演示数据，即可预览仪表盘。"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-tide px-4 text-sm font-black text-white transition hover:-translate-y-0.5" onClick={() => setData(generateMockEducationData())} type="button">
              <Database className="size-4" />生成演示数据
            </button>
            <button className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white/82 px-4 text-sm font-black text-ink ring-1 ring-ink/10 transition hover:bg-ink hover:text-white" onClick={() => setData(resetEducationDemoData())} type="button">
              <RotateCcw className="size-4" />重置演示数据
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Summary label="班级数量" value={String(data.classes.length)} note="当前教师负责班级" />
          <Summary label="学生数量" value={String(data.students.length)} note="演示学生档案" />
          <Summary label="课程数量" value={String(data.courses.length)} note="已创建课程" />
          <Summary label="任务数量" value={String(data.assignments.length)} note="课程学习任务" />
          <Summary label="成绩记录" value={String(data.grades.length)} note="本地成绩条目" />
        </div>
        <p className="mt-4 rounded-2xl bg-white/72 px-4 py-3 text-sm font-semibold leading-6 text-ink/58">
          当前为本地演示数据底座。正式接入后端时，仍需按教师 ID、班级 ID 和课程 ID 做服务端权限校验。
        </p>
      </GameCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <GameCard className="bg-white/74">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-tide">最近成绩</p>
              <h2 className="mt-1 text-lg font-black text-ink">最新录入记录</h2>
            </div>
            <button className="rounded-2xl bg-ink/5 px-3 py-2 text-xs font-black text-ink" onClick={() => navigate("teacherGrades")} type="button">成绩管理</button>
          </div>
          {recentGrades.length > 0 ? (
            <div className="mt-4 space-y-2">
              {recentGrades.map((grade) => (
                <div className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl bg-ink/[0.04] px-4 py-3" key={grade.id}>
                  <div>
                    <p className="text-sm font-black text-ink">{studentsById.get(grade.studentId)?.displayName ?? "未知学生"} · {grade.examName}</p>
                    <p className="mt-1 text-xs font-semibold text-ink/48">{coursesById.get(grade.courseId)?.name ?? grade.subject} · {formatDate(grade.date)}</p>
                  </div>
                  <p className="self-center text-lg font-black text-tide">{grade.score}<span className="text-xs text-ink/38">/{grade.fullScore}</span></p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="暂无成绩记录。生成演示数据后，这里会显示最近 5 条成绩。" />
          )}
        </GameCard>

        <GameCard className="bg-white/74">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-coral">最近报告</p>
              <h2 className="mt-1 text-lg font-black text-ink">学情分析摘要</h2>
            </div>
            <button className="rounded-2xl bg-ink/5 px-3 py-2 text-xs font-black text-ink" onClick={() => navigate("teacherReports")} type="button">报告中心</button>
          </div>
          {recentReports.length > 0 ? (
            <div className="mt-4 space-y-3">
              {recentReports.map((report) => (
                <div className="rounded-2xl border border-ink/5 bg-[#F7F1E4]/55 px-4 py-4" key={report.id}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-black text-ink">{report.title ?? `${report.scopeType === "class" ? "班级" : "学生"}学情报告`}</p>
                    <span className="shrink-0 rounded-full bg-white/82 px-2 py-1 text-[10px] font-black text-ink/52">{report.scopeType === "class" ? "班级" : "个人"}</span>
                  </div>
                  <p className="mt-2 text-xs font-semibold leading-5 text-ink/56">{report.summary}</p>
                  <p className="mt-2 text-[11px] font-bold text-ink/38">{formatDate(report.createdAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="暂无学情报告。生成演示数据后，这里会显示班级和学生报告。" />
          )}
        </GameCard>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-black text-ink">功能入口</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {teacherEntries.map((entry) => {
            const Icon = entry.icon;
            return (
              <button className="text-left" key={entry.title} onClick={() => navigate(entry.page)} type="button">
                <GameCard className="h-full bg-white/74 transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(16,35,63,0.1)]">
                  <span className="grid size-11 place-items-center rounded-2xl bg-ink/5 text-tide"><Icon className="size-5" /></span>
                  <h3 className="mt-4 text-lg font-black text-ink">{entry.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-ink/56">{entry.description}</p>
                </GameCard>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Summary({ label, note, value }: { label: string; note: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/76 p-4 ring-1 ring-white/80">
      <p className="text-xs font-black text-ink/46">{label}</p>
      <p className="mt-2 text-3xl font-black text-ink">{value}</p>
      <p className="mt-1 text-xs font-bold text-ink/46">{note}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-ink/12 bg-ink/[0.025] px-4 py-8 text-center">
      <p className="text-sm font-bold leading-6 text-ink/46">{text}</p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "日期未知";
  return new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" }).format(date);
}
