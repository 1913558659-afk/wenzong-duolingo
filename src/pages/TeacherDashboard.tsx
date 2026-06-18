import { useState } from "react";
import { BarChart3, BookOpen, ClipboardList, Database, FileText, GraduationCap, Plus, RotateCcw, School, UserPlus, UsersRound } from "lucide-react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import { generateMockEducationData, getEducationDataSnapshot, hasEducationDemoData, resetEducationDemoData } from "@/lib/educationStore";
import type { AuthUser, PageId, Subject } from "@/types";
import type { EducationDataSnapshot } from "@/types/education";

type TeacherDashboardProps = {
  navigate: (page: PageId) => void;
  user: AuthUser | null;
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

const subjectNames: Record<Subject, string> = {
  biology: "生物",
  english: "英语",
  geography: "地理",
  history: "历史",
  math: "数学",
  politics: "政治"
};

export function TeacherDashboard({ navigate, user }: TeacherDashboardProps) {
  const [data, setData] = useState<EducationDataSnapshot>(() => getEducationDataSnapshot());
  const [notice, setNotice] = useState("");
  const hasData = data.classes.length + data.students.length + data.courses.length + data.assignments.length + data.grades.length + data.reports.length > 0;
  const studentsById = new Map(data.students.map((student) => [student.id, student]));
  const coursesById = new Map(data.courses.map((course) => [course.id, course]));
  const recentGrades = [...data.grades].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const recentReports = [...data.reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  const teacherName = user?.name?.trim() || "教师";

  function generateDemo() {
    if (hasEducationDemoData() && !window.confirm("当前已有教育数据。生成演示数据将覆盖现有教育模块数据，是否继续？")) return;
    setData(generateMockEducationData());
    setNotice("演示数据已生成并保存到当前浏览器。");
  }

  function resetDemo() {
    setData(resetEducationDemoData());
    setNotice("教育模块演示数据已重置。");
  }

  function openNextStep(page: PageId, label: string) {
    setNotice(`${label}将在下一步开发，本轮先进入对应功能页。`);
    navigate(page);
  }

  return (
    <div className="space-y-5 pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-6">
      <PageHeader title="教师管理中心" subtitle={`欢迎，${teacherName}。当前为 localStorage 本地演示版本。`} />

      {notice && (
        <div className="rounded-2xl border border-tide/20 bg-tide/10 px-4 py-3 text-sm font-bold text-tide" role="status">
          {notice}
        </div>
      )}

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
            <button className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-tide px-4 text-sm font-black text-white transition hover:-translate-y-0.5" onClick={generateDemo} type="button">
              <Database className="size-4" />生成演示数据
            </button>
            <button className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white/82 px-4 text-sm font-black text-ink ring-1 ring-ink/10 transition hover:bg-ink hover:text-white" onClick={resetDemo} type="button">
              <RotateCcw className="size-4" />重置演示数据
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <Summary label="班级数量" value={String(data.classes.length)} note="当前教师负责班级" />
          <Summary label="学生数量" value={String(data.students.length)} note="演示学生档案" />
          <Summary label="课程数量" value={String(data.courses.length)} note="已创建课程" />
          <Summary label="任务数量" value={String(data.assignments.length)} note="课程学习任务" />
          <Summary label="成绩记录" value={String(data.grades.length)} note="本地成绩条目" />
          <Summary label="报告数量" value={String(data.reports.length)} note="班级与个人报告" />
        </div>
        <p className="mt-4 rounded-2xl bg-white/72 px-4 py-3 text-sm font-semibold leading-6 text-ink/58">
          当前为本地演示数据底座。正式接入后端时，仍需按教师 ID、班级 ID 和课程 ID 做服务端权限校验。
        </p>
      </GameCard>

      {!hasData && (
        <GameCard className="border border-dashed border-tide/25 bg-white/70 text-center">
          <School className="mx-auto size-10 text-tide" />
          <h2 className="mt-3 text-lg font-black text-ink">还没有班级和学生数据</h2>
          <p className="mt-2 text-sm font-semibold text-ink/52">你可以先生成一组演示数据，体验教师端功能。</p>
          <button className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-tide px-5 text-sm font-black text-white" onClick={generateDemo} type="button">
            <Database className="size-4" />生成演示数据
          </button>
        </GameCard>
      )}

      <GameCard className="bg-white/74">
        <div>
          <p className="text-xs font-black text-tide">快捷操作</p>
          <h2 className="mt-1 text-lg font-black text-ink">常用教学入口</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction icon={Plus} label="创建班级" onClick={() => openNextStep("teacherClasses", "创建班级")} />
          <QuickAction icon={UserPlus} label="添加学生" onClick={() => openNextStep("teacherStudents", "添加学生")} />
          <QuickAction icon={BookOpen} label="创建课程" onClick={() => openNextStep("teacherCourses", "创建课程")} />
          <QuickAction icon={GraduationCap} label="录入成绩" onClick={() => openNextStep("teacherGrades", "录入成绩")} />
        </div>
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
                    <p className="text-sm font-black text-ink">{report.title}</p>
                    <span className="shrink-0 rounded-full bg-white/82 px-2 py-1 text-[10px] font-black text-ink/52">{report.scopeType === "class" ? "班级" : "个人"}</span>
                  </div>
                  <p className="mt-2 text-xs font-semibold leading-5 text-ink/56">{report.summary}</p>
                  <p className="mt-2 text-[11px] font-bold text-ink/38">{report.subject ? subjectNames[report.subject] : "综合"} · {formatDate(report.createdAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="暂无学情报告。生成演示数据后，这里会显示班级和学生报告。" />
          )}
        </GameCard>
      </div>

      <GameCard className="bg-white/74">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black text-gold">班级概览</p>
            <h2 className="mt-1 text-lg font-black text-ink">当前负责班级</h2>
          </div>
          <button className="rounded-2xl bg-ink/5 px-3 py-2 text-xs font-black text-ink" onClick={() => navigate("teacherClasses")} type="button">班级管理</button>
        </div>
        {data.classes.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {data.classes.map((classGroup) => {
              const courseCount = data.courses.filter((course) => course.classId === classGroup.id).length;
              return (
                <div className="rounded-2xl bg-ink/[0.04] p-4" key={classGroup.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-ink">{classGroup.name}</h3>
                      <p className="mt-1 text-xs font-bold text-ink/45">{classGroup.grade}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-tide">{classGroup.inviteCode}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <MiniMetric label="学生人数" value={classGroup.studentIds.length} />
                    <MiniMetric label="课程数量" value={courseCount} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState text="暂无班级数据。生成演示数据后，这里会显示班级人数、课程数和邀请码。" />
        )}
      </GameCard>

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

function QuickAction({ icon: Icon, label, onClick }: { icon: typeof School; label: string; onClick: () => void }) {
  return (
    <button className="flex min-h-12 items-center gap-3 rounded-2xl bg-ink/[0.04] px-4 text-left text-sm font-black text-ink transition hover:bg-tide hover:text-white" onClick={onClick} type="button">
      <Icon className="size-4" />{label}
    </button>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/76 px-3 py-2">
      <p className="text-[10px] font-black text-ink/38">{label}</p>
      <p className="mt-1 text-lg font-black text-ink">{value}</p>
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
