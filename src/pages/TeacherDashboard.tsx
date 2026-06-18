import { BarChart3, BookOpen, ClipboardList, FileText, GraduationCap, School, UsersRound } from "lucide-react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import type { PageId } from "@/types";

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
  return (
    <div className="space-y-5 pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-6">
      <PageHeader title="教师管理中心" subtitle="管理班级、课程与学习数据。当前版本为前端功能骨架。" />

      <GameCard className="bg-[linear-gradient(135deg,#EEF7F7_0%,#FFFFFF_50%,#F7F1E4_100%)]">
        <div className="grid gap-4 md:grid-cols-3">
          <Summary label="我的班级" value="0" note="尚未接入真实班级" />
          <Summary label="学生人数" value="0" note="仅显示本人班级学生" />
          <Summary label="待处理任务" value="0" note="作业功能预留" />
        </div>
        <p className="mt-4 rounded-2xl bg-white/72 px-4 py-3 text-sm font-semibold leading-6 text-ink/58">
          权限边界：教师端后续只能读取当前教师负责的班级和课程数据；本版本不采集真实学生敏感信息。
        </p>
      </GameCard>

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
