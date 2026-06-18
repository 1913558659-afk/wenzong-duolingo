import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { isAdminUser } from "@/config/admin";
import { quizQuestions as localQuizQuestions } from "@/data/questions";
import { About } from "@/pages/About";
import { AdminQuestionBank } from "@/pages/AdminQuestionBank";
import { AdminTestPanel } from "@/pages/AdminTestPanel";
import { AIPrompts } from "@/pages/AIPrompts";
import { Auth } from "@/pages/Auth";
import { ChallengeMap } from "@/pages/ChallengeMap";
import { Home } from "@/pages/Home";
import { PetBattle } from "@/pages/PetBattle";
import { PartnerChessPage } from "@/pages/PartnerChessPage";
import { Profile } from "@/pages/Profile";
import { Quiz } from "@/pages/Quiz";
import { StudyAidDetail } from "@/pages/StudyAidDetail";
import { StudyAidList } from "@/pages/StudyAidList";
import { StudentDashboard } from "@/pages/StudentDashboard";
import { TeacherDashboard } from "@/pages/TeacherDashboard";
import { TeacherSectionPage } from "@/pages/TeacherSectionPage";
import { TextbookGuide } from "@/pages/TextbookGuide";
import { Timetable } from "@/pages/Timetable";
import { TerritoryWarPage } from "@/pages/TerritoryWarPage";
import { WrongBook } from "@/pages/WrongBook";
import { useAuth } from "@/lib/auth";
import { fetchQuestions } from "@/lib/api";
import { useScheduleItems, useStudyStats, useWrongAnswers } from "@/lib/storage";
import type { AuthUser, PageId, PromptCategory, QuizQuestion } from "@/types";
import { addCompanionTrainingExp } from "@/utils/petBattleStorage";

type QuestionSourceStatus = "loading" | "cloud" | "local";

const pathToPage: Record<string, PageId> = {
  "/admin-test": "adminTest",
  "/debug-lab": "adminTest",
  "/login": "auth",
  "/student": "student",
  "/teacher": "teacher",
  "/teacher/classes": "teacherClasses",
  "/teacher/courses": "teacherCourses",
  "/teacher/grades": "teacherGrades",
  "/teacher/learning-reports": "teacherReports",
  "/teacher/students": "teacherStudents",
  "/teacher/wrong-question-analytics": "teacherWrongAnalytics",
  "/territory-war": "territoryWar"
};

const pageToPath: Partial<Record<PageId, string>> = Object.fromEntries(
  Object.entries(pathToPage).map(([path, page]) => [page, path])
);

const teacherPages = new Set<PageId>(["teacher", "teacherClasses", "teacherStudents", "teacherCourses", "teacherGrades", "teacherWrongAnalytics", "teacherReports"]);

function userRole(user: AuthUser | null) {
  if (isAdminUser(user)) return "admin";
  if (user?.role === "admin" || user?.role === "teacher" || user?.role === "student") return user.role;
  return user ? "student" : null;
}

export default function App() {
  const [page, setPage] = useState<PageId>("home");
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [activePromptCategory, setActivePromptCategory] = useState<PromptCategory | undefined>();
  const [activePromptId, setActivePromptId] = useState<string | undefined>();
  const [selectedStudyAidId, setSelectedStudyAidId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [questionSourceStatus, setQuestionSourceStatus] = useState<QuestionSourceStatus>("loading");
  const [loginRoleIntent, setLoginRoleIntent] = useState<"student" | "teacher">("student");
  const auth = useAuth();
  const { stats, addQuizResult, resetStats, syncError: statsSyncError } = useStudyStats(auth.token);
  const { records, addWrongAnswer, removeWrongAnswer, clearWrongAnswers, syncError: wrongSyncError } = useWrongAnswers(auth.token, questions);
  const { items: scheduleItems, addItem, toggleDone, quickAdd } = useScheduleItems();

  useEffect(() => {
    fetchQuestions()
      .then((cloudQuestions) => {
        setQuestions(cloudQuestions);
        setQuestionSourceStatus("cloud");
        if (import.meta.env.DEV) {
          console.log("[SayHiStudy] questions source:", "api", cloudQuestions.length);
        }
      })
      .catch((error) => {
        setQuestions(localQuizQuestions);
        setQuestionSourceStatus("local");
        if (import.meta.env.DEV) {
          console.log("[SayHiStudy] questions source:", "local-fallback", localQuizQuestions.length, error);
        }
      });
  }, []);

  useEffect(() => {
    const syncPath = () => setPage(pathToPage[window.location.pathname] ?? "home");
    syncPath();
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

  useEffect(() => {
    if (auth.loading) return;
    const role = userRole(auth.user);
    if (page === "student" && role !== "student" && role !== "admin") {
      navigateTo(role === "teacher" ? "teacher" : "auth", true);
      return;
    }
    if (teacherPages.has(page) && role !== "teacher" && role !== "admin") {
      navigateTo(role === "student" ? "student" : "auth", true);
      return;
    }
    if ((page === "adminTest" || page === "adminQuestions") && role !== "admin") {
      navigateTo(role === "teacher" ? "teacher" : role === "student" ? "student" : "auth", true);
    }
  }, [auth.loading, auth.user, page]);

  function navigateTo(nextPage: PageId, replace = false) {
    setPage(nextPage);
    const path = pageToPath[nextPage] ?? "/";
    if (window.location.pathname !== path) {
      window.history[replace ? "replaceState" : "pushState"]({}, "", path);
    }
  }

  function startPractice(levelId: string) {
    setSelectedLevelId(levelId);
    setPage("quiz");
  }

  function openPrompts(category: PromptCategory, promptId?: string) {
    setActivePromptCategory(category);
    setActivePromptId(promptId);
    setPage("prompts");
  }

  function openStudyAid(aidId: string) {
    setSelectedStudyAidId(aidId);
    setPage("studyAidDetail");
  }

  function navigate(nextPage: PageId) {
    if (nextPage !== "prompts") {
      setActivePromptCategory(undefined);
      setActivePromptId(undefined);
    }
    if (nextPage === "quiz") {
      setSelectedLevelId("random:true");
    }
    navigateTo(nextPage);
  }

  function openRoleLogin(role: "student" | "teacher") {
    setLoginRoleIntent(role);
    navigateTo("auth");
  }

  function finishLogin(user: AuthUser) {
    const role = userRole(user);
    navigateTo(role === "teacher" ? "teacher" : role === "admin" ? "home" : "student", true);
  }

  function completeQuiz(correctAnswers: number, totalQuestions: number, earnedXp: number, meta?: { isRandom: boolean }) {
    addQuizResult(correctAnswers, totalQuestions, earnedXp);
    addCompanionTrainingExp(correctAnswers * 2 + (meta?.isRandom ? 0 : 30));
  }

  return (
    <div className="min-h-screen overflow-x-hidden pb-36 md:pb-0">
      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-5 sm:py-7 md:ml-[284px] md:mr-6 md:w-auto md:max-w-[1180px] md:px-0 lg:px-0">
        {page === "home" && <Home isLoggedIn={Boolean(auth.user)} navigate={navigate} openRoleLogin={openRoleLogin} questionSourceStatus={questionSourceStatus} questions={questions} scheduleItems={scheduleItems} stats={stats} syncError={statsSyncError} user={auth.user} wrongCount={records.length} />}
        {page === "map" && <ChallengeMap goHome={() => setPage("home")} questionSourceStatus={questionSourceStatus} questions={questions} startPractice={startPractice} startRandomPractice={() => navigate("quiz")} />}
        {page === "quiz" && <Quiz goMap={() => setPage("map")} onComplete={completeQuiz} onWrongAnswer={addWrongAnswer} questions={questions} selectedLevelId={selectedLevelId} token={auth.token} />}
        {page === "schedule" && <Timetable addItem={addItem} items={scheduleItems} quickAdd={quickAdd} toggleDone={toggleDone} />}
        {page === "prompts" && <AIPrompts activeCategory={activePromptCategory} activePromptId={activePromptId} />}
        {page === "textbook" && <TextbookGuide openPrompts={openPrompts} openStudyAid={openStudyAid} startPractice={startPractice} />}
        {page === "studyAids" && <StudyAidList openDetail={openStudyAid} />}
        {page === "studyAidDetail" && <StudyAidDetail aidId={selectedStudyAidId} backToList={() => setPage("studyAids")} />}
        {page === "wrongBook" && <WrongBook clearWrongAnswers={clearWrongAnswers} questions={questions} records={records} removeWrongAnswer={removeWrongAnswer} syncError={wrongSyncError} token={auth.token} />}
        {page === "petBattle" && <PetBattle openPartnerChess={() => setPage("partnerChess")} />}
        {page === "partnerChess" && <PartnerChessPage goPetBattle={() => setPage("petBattle")} questions={questions} />}
        {page === "territoryWar" && <TerritoryWarPage questions={questions} user={auth.user} />}
        {page === "student" && <StudentDashboard navigate={navigate} stats={stats} wrongCount={records.length} />}
        {page === "teacher" && <TeacherDashboard navigate={navigate} user={auth.user} />}
        {teacherPages.has(page) && page !== "teacher" && <TeacherSectionPage navigate={navigate} page={page} />}
        {page === "profile" && <Profile navigate={navigate} stats={stats} syncError={statsSyncError} user={auth.user} />}
        {page === "adminQuestions" && <AdminQuestionBank token={auth.token} user={auth.user} />}
        {page === "adminTest" && <AdminTestPanel onNavigateHome={() => setPage("home")} onStartPractice={startPractice} questions={questions} user={auth.user} />}
        {page === "auth" && <Auth initialRole={loginRoleIntent} key={loginRoleIntent} login={auth.login} onDone={finishLogin} register={auth.register} />}
        {page === "about" && <About resetStats={resetStats} />}
      </main>
      <Navbar currentPage={page} onLogout={() => { auth.logout(); navigateTo("home", true); }} onNavigate={navigate} user={auth.user} />
    </div>
  );
}
