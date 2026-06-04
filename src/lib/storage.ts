import { useEffect, useState } from "react";
import { defaultScheduleItems } from "@/data/timetable";
import { subjectLabels } from "@/lib/labels";
import type { QuizQuestion, ScheduleItem, StudyStats, Subject, WrongAnswerRecord } from "@/types";

const statsKey = "wenzong-island-study-stats";
const scheduleKey = "wenzong-island-schedule";
const wrongBookKey = "wenzong-island-wrong-book";

const today = () => new Date().toISOString().slice(0, 10);

export const defaultStats: StudyStats = {
  xp: 120,
  streakDays: 3,
  answeredToday: 0,
  correctCount: 0,
  lastStudyDate: today()
};

function loadStats() {
  if (typeof window === "undefined") {
    return defaultStats;
  }

  const saved = window.localStorage.getItem(statsKey);
  return saved ? ({ ...defaultStats, ...JSON.parse(saved) } as StudyStats) : defaultStats;
}

export function useStudyStats() {
  const [stats, setStats] = useState<StudyStats>(defaultStats);

  useEffect(() => {
    setStats(loadStats());
  }, []);

  function addQuizResult(correctAnswers: number, totalQuestions: number, earnedXp: number) {
    setStats((current) => {
      const next: StudyStats = {
        ...current,
        xp: current.xp + earnedXp,
        answeredToday: current.answeredToday + totalQuestions,
        correctCount: current.correctCount + correctAnswers,
        lastStudyDate: today()
      };
      window.localStorage.setItem(statsKey, JSON.stringify(next));
      return next;
    });
  }

  function resetStats() {
    window.localStorage.setItem(statsKey, JSON.stringify(defaultStats));
    setStats(defaultStats);
  }

  return { stats, addQuizResult, resetStats };
}

function loadSchedule() {
  if (typeof window === "undefined") {
    return defaultScheduleItems;
  }

  const saved = window.localStorage.getItem(scheduleKey);
  return saved ? (JSON.parse(saved) as ScheduleItem[]) : defaultScheduleItems;
}

export function useScheduleItems() {
  const [items, setItems] = useState<ScheduleItem[]>(defaultScheduleItems);

  useEffect(() => {
    setItems(loadSchedule());
  }, []);

  function save(next: ScheduleItem[]) {
    setItems(next);
    window.localStorage.setItem(scheduleKey, JSON.stringify(next));
  }

  function addItem(item: Omit<ScheduleItem, "id" | "done">) {
    save([
      ...items,
      {
        ...item,
        id: `task-${Date.now()}`,
        done: false
      }
    ]);
  }

  function toggleDone(id: string) {
    save(items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  }

  function quickAdd(subject: Subject) {
    addItem({
      day: "周日",
      time: "19:30",
      subject,
      title: `${subjectLabels[subject]}自习`,
      task: "复习一个知识点，完成一组选择题"
    });
  }

  return { items, addItem, toggleDone, quickAdd };
}

function loadWrongAnswers() {
  if (typeof window === "undefined") {
    return [];
  }

  const saved = window.localStorage.getItem(wrongBookKey);
  return saved ? (JSON.parse(saved) as WrongAnswerRecord[]) : [];
}

export function useWrongAnswers() {
  const [records, setRecords] = useState<WrongAnswerRecord[]>([]);

  useEffect(() => {
    setRecords(loadWrongAnswers());
  }, []);

  function save(next: WrongAnswerRecord[]) {
    setRecords(next);
    window.localStorage.setItem(wrongBookKey, JSON.stringify(next));
  }

  function addWrongAnswer(question: QuizQuestion, selectedAnswer: string) {
    setRecords((current) => {
      const withoutSameQuestion = current.filter((item) => item.questionId !== question.id);
      const next: WrongAnswerRecord[] = [
        {
          id: `wrong-${question.id}`,
          questionId: question.id,
          subject: question.subject,
          chapter: question.chapter,
          question: question.question,
          options: question.options,
          correctAnswer: question.answer,
          selectedAnswer,
          explanation: question.explanation,
          tags: question.tags,
          createdAt: new Date().toISOString()
        },
        ...withoutSameQuestion
      ];
      window.localStorage.setItem(wrongBookKey, JSON.stringify(next));
      return next;
    });
  }

  function removeWrongAnswer(id: string) {
    save(records.filter((item) => item.id !== id));
  }

  function clearWrongAnswers() {
    save([]);
  }

  return { records, addWrongAnswer, removeWrongAnswer, clearWrongAnswers };
}
