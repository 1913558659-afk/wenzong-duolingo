import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { About } from "@/pages/About";
import { AIPrompts } from "@/pages/AIPrompts";
import { ChallengeMap } from "@/pages/ChallengeMap";
import { Home } from "@/pages/Home";
import { Quiz } from "@/pages/Quiz";
import { StudyAidDetail } from "@/pages/StudyAidDetail";
import { StudyAidList } from "@/pages/StudyAidList";
import { TextbookGuide } from "@/pages/TextbookGuide";
import { Timetable } from "@/pages/Timetable";
import { WrongBook } from "@/pages/WrongBook";
import { useScheduleItems, useStudyStats, useWrongAnswers } from "@/lib/storage";
import type { PageId, PromptCategory } from "@/types";

export default function App() {
  const [page, setPage] = useState<PageId>("home");
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [activePromptCategory, setActivePromptCategory] = useState<PromptCategory | undefined>();
  const [activePromptId, setActivePromptId] = useState<string | undefined>();
  const [selectedStudyAidId, setSelectedStudyAidId] = useState<string | null>(null);
  const { stats, addQuizResult, resetStats } = useStudyStats();
  const { records, addWrongAnswer, removeWrongAnswer, clearWrongAnswers } = useWrongAnswers();
  const { items: scheduleItems, addItem, toggleDone, quickAdd } = useScheduleItems();

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
    setPage(nextPage);
  }

  return (
    <div className="min-h-screen pb-24">
      <main className="mx-auto w-full max-w-5xl px-4 py-5">
        {page === "home" && <Home navigate={navigate} scheduleItems={scheduleItems} stats={stats} wrongCount={records.length} />}
        {page === "map" && <ChallengeMap startPractice={startPractice} />}
        {page === "quiz" && <Quiz goMap={() => setPage("map")} onComplete={addQuizResult} onWrongAnswer={addWrongAnswer} selectedLevelId={selectedLevelId} />}
        {page === "schedule" && <Timetable addItem={addItem} items={scheduleItems} quickAdd={quickAdd} toggleDone={toggleDone} />}
        {page === "prompts" && <AIPrompts activeCategory={activePromptCategory} activePromptId={activePromptId} />}
        {page === "textbook" && <TextbookGuide openPrompts={openPrompts} openStudyAid={openStudyAid} startPractice={startPractice} />}
        {page === "studyAids" && <StudyAidList openDetail={openStudyAid} />}
        {page === "studyAidDetail" && <StudyAidDetail aidId={selectedStudyAidId} backToList={() => setPage("studyAids")} />}
        {page === "wrongBook" && <WrongBook clearWrongAnswers={clearWrongAnswers} records={records} removeWrongAnswer={removeWrongAnswer} />}
        {page === "about" && <About resetStats={resetStats} />}
      </main>
      <Navbar currentPage={page} onNavigate={navigate} />
    </div>
  );
}
