import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { quizQuestions as localQuizQuestions } from "@/data/questions";
import { About } from "@/pages/About";
import { AdminQuestionBank } from "@/pages/AdminQuestionBank";
import { AIPrompts } from "@/pages/AIPrompts";
import { Auth } from "@/pages/Auth";
import { ChallengeMap } from "@/pages/ChallengeMap";
import { Home } from "@/pages/Home";
import { PetBattle } from "@/pages/PetBattle";
import { Profile } from "@/pages/Profile";
import { Quiz } from "@/pages/Quiz";
import { StudyAidDetail } from "@/pages/StudyAidDetail";
import { StudyAidList } from "@/pages/StudyAidList";
import { TextbookGuide } from "@/pages/TextbookGuide";
import { Timetable } from "@/pages/Timetable";
import { WrongBook } from "@/pages/WrongBook";
import { useAuth } from "@/lib/auth";
import { fetchQuestions } from "@/lib/api";
import { useScheduleItems, useStudyStats, useWrongAnswers } from "@/lib/storage";
import type { PageId, PromptCategory, QuizQuestion } from "@/types";
import { addCompanionTrainingExp } from "@/utils/petBattleStorage";

type QuestionSourceStatus = "loading" | "cloud" | "local";

export default function App() {
  const [page, setPage] = useState<PageId>("home");
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [activePromptCategory, setActivePromptCategory] = useState<PromptCategory | undefined>();
  const [activePromptId, setActivePromptId] = useState<string | undefined>();
  const [selectedStudyAidId, setSelectedStudyAidId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [questionSourceStatus, setQuestionSourceStatus] = useState<QuestionSourceStatus>("loading");
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
    setPage(nextPage);
  }

  function completeQuiz(correctAnswers: number, totalQuestions: number, earnedXp: number, meta?: { isRandom: boolean }) {
    addQuizResult(correctAnswers, totalQuestions, earnedXp);
    addCompanionTrainingExp(correctAnswers * 2 + (meta?.isRandom ? 0 : 30));
  }

  return (
    <div className="min-h-screen overflow-x-hidden pb-36 md:pb-0">
      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-5 sm:py-7 md:ml-[284px] md:mr-6 md:w-auto md:max-w-[1180px] md:px-0 lg:px-0">
        {page === "home" && <Home isLoggedIn={Boolean(auth.user)} navigate={navigate} questionSourceStatus={questionSourceStatus} questions={questions} scheduleItems={scheduleItems} stats={stats} syncError={statsSyncError} user={auth.user} wrongCount={records.length} />}
        {page === "map" && <ChallengeMap goHome={() => setPage("home")} questionSourceStatus={questionSourceStatus} questions={questions} startPractice={startPractice} startRandomPractice={() => navigate("quiz")} />}
        {page === "quiz" && <Quiz goMap={() => setPage("map")} onComplete={completeQuiz} onWrongAnswer={addWrongAnswer} questions={questions} selectedLevelId={selectedLevelId} token={auth.token} />}
        {page === "schedule" && <Timetable addItem={addItem} items={scheduleItems} quickAdd={quickAdd} toggleDone={toggleDone} />}
        {page === "prompts" && <AIPrompts activeCategory={activePromptCategory} activePromptId={activePromptId} />}
        {page === "textbook" && <TextbookGuide openPrompts={openPrompts} openStudyAid={openStudyAid} startPractice={startPractice} />}
        {page === "studyAids" && <StudyAidList openDetail={openStudyAid} />}
        {page === "studyAidDetail" && <StudyAidDetail aidId={selectedStudyAidId} backToList={() => setPage("studyAids")} />}
        {page === "wrongBook" && <WrongBook clearWrongAnswers={clearWrongAnswers} questions={questions} records={records} removeWrongAnswer={removeWrongAnswer} syncError={wrongSyncError} token={auth.token} />}
        {page === "petBattle" && <PetBattle />}
        {page === "profile" && <Profile navigate={navigate} stats={stats} syncError={statsSyncError} user={auth.user} />}
        {page === "adminQuestions" && <AdminQuestionBank token={auth.token} user={auth.user} />}
        {page === "auth" && <Auth login={auth.login} onDone={() => setPage("home")} register={auth.register} />}
        {page === "about" && <About resetStats={resetStats} />}
      </main>
      <Navbar currentPage={page} onLogout={auth.logout} onNavigate={navigate} user={auth.user} />
    </div>
  );
}
