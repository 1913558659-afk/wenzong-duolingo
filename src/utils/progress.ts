import type { QuizQuestion, Subject } from "@/types";

const completedQuestionsKey = "wenzong-island-completed-question-ids";

export function getPercent(done: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((done / total) * 100);
}

export function getCompletedQuestionIds() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const saved = window.localStorage.getItem(completedQuestionsKey);
    const ids = saved ? (JSON.parse(saved) as string[]) : [];
    return new Set(ids);
  } catch {
    return new Set<string>();
  }
}

export function markQuestionsCompleted(questionIds: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  const completed = getCompletedQuestionIds();
  questionIds.forEach((id) => completed.add(id));
  window.localStorage.setItem(completedQuestionsKey, JSON.stringify([...completed]));
}

export function replaceCompletedQuestionIds(questionIds: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(completedQuestionsKey, JSON.stringify([...new Set(questionIds)]));
}

function countCompleted(questions: QuizQuestion[], completedIds = getCompletedQuestionIds()) {
  return questions.filter((question) => completedIds.has(question.id)).length;
}

export function getSubjectProgress(subject: Subject, completedIds = getCompletedQuestionIds(), sourceQuestions: QuizQuestion[] = []) {
  const questions = sourceQuestions.filter((question) => question.subject === subject);
  const done = countCompleted(questions, completedIds);

  return {
    done,
    total: questions.length,
    percent: getPercent(done, questions.length)
  };
}

export function getChapterProgress(subject: Subject, chapter: string, completedIds = getCompletedQuestionIds(), sourceQuestions: QuizQuestion[] = []) {
  const questions = sourceQuestions.filter((question) => question.subject === subject && question.chapter === chapter);
  const done = countCompleted(questions, completedIds);

  return {
    done,
    total: questions.length,
    percent: getPercent(done, questions.length)
  };
}

export function getModuleProgress(subject: Subject, chapters: string[], completedIds = getCompletedQuestionIds(), sourceQuestions: QuizQuestion[] = []) {
  const chapterSet = new Set(chapters);
  const questions = sourceQuestions.filter((question) => question.subject === subject && chapterSet.has(question.chapter));
  const done = countCompleted(questions, completedIds);

  return {
    done,
    total: questions.length,
    percent: getPercent(done, questions.length)
  };
}

export function getTotalProgress(completedIds = getCompletedQuestionIds(), sourceQuestions: QuizQuestion[] = []) {
  const done = countCompleted(sourceQuestions, completedIds);

  return {
    done,
    total: sourceQuestions.length,
    percent: getPercent(done, sourceQuestions.length)
  };
}
