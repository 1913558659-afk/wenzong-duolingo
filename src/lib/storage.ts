import { useEffect, useState } from "react";
import { defaultScheduleItems } from "@/data/timetable";
import { fetchProgressMe } from "@/lib/api";
import { subjectLabels } from "@/lib/labels";
import type { QuizQuestion, ScheduleItem, StudyStats, Subject, WrongAnswerRecord } from "@/types";
import { replaceCompletedQuestionIds } from "@/utils/progress";

const statsKey = "wenzong-island-study-stats";
const scheduleKey = "wenzong-island-schedule";
const wrongBookKey = "wenzong-island-wrong-book";

const today = () => new Date().toISOString().slice(0, 10);

export const defaultStats: StudyStats = {
  xp: 0,
  streakDays: 0,
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

export function useStudyStats(token?: string | null) {
  const [stats, setStats] = useState<StudyStats>(defaultStats);
  const [syncError, setSyncError] = useState(false);

  useEffect(() => {
    setStats(loadStats());
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    fetchProgressMe(token)
      .then((progress) => {
        setSyncError(false);
        if (progress.stats) {
          setStats(progress.stats);
          window.localStorage.setItem(statsKey, JSON.stringify(progress.stats));
        }
        if (progress.completedQuestionIds) {
          replaceCompletedQuestionIds(progress.completedQuestionIds);
        }
      })
      .catch(() => {
        setSyncError(true);
        // 后端暂时不可用时，保留游客本地进度。
      });
  }, [token]);

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

  return { stats, addQuizResult, resetStats, syncError };
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

export function useWrongAnswers(token?: string | null, questions: QuizQuestion[] = []) {
  const [records, setRecords] = useState<WrongAnswerRecord[]>([]);
  const [syncError, setSyncError] = useState(false);

  useEffect(() => {
    setRecords(loadWrongAnswers());
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    fetchProgressMe(token)
      .then((progress) => {
        setSyncError(false);
        if (progress.wrongQuestions) {
          const next = progress.wrongQuestions.map((record) => normalizeWrongAnswer(record, questions));
          setRecords(next);
          window.localStorage.setItem(wrongBookKey, JSON.stringify(next));
        }
        if (progress.completedQuestionIds) {
          replaceCompletedQuestionIds(progress.completedQuestionIds);
        }
      })
      .catch(() => {
        setSyncError(true);
        // 后端暂时不可用时，保留游客本地错题本。
      });
  }, [questions, token]);

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
          questionType: question.questionType ?? "single_choice",
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

  return { records, addWrongAnswer, removeWrongAnswer, clearWrongAnswers, syncError };
}

function normalizeWrongAnswer(record: WrongAnswerRecord, questions: QuizQuestion[]) {
  const question = questions.find((item) => item.id === record.questionId);

  return {
    ...record,
    id: record.id || `wrong-${record.questionId}`,
    subject: record.subject || question?.subject || "history",
    chapter: record.chapter || question?.chapter || "未匹配章节",
    question: record.question || question?.question || "题目数据暂未匹配",
    options: record.options?.length ? record.options : question?.options ?? [],
    correctAnswer: record.correctAnswer || question?.answer || "题目数据暂未匹配",
    questionType: record.questionType || question?.questionType || "single_choice",
    explanation: record.explanation || question?.explanation || "题目数据暂未匹配",
    tags: record.tags?.length ? record.tags : question?.tags ?? [],
    createdAt: record.createdAt || new Date().toISOString()
  } satisfies WrongAnswerRecord;
}
