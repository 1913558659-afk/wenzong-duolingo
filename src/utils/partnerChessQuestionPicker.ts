import { partnerChessQuizQuestions } from "@/data/partnerChessQuizData";
import { getPrepQuestionCount } from "@/data/partnerChessStages";
import type { QuizQuestion, Subject } from "@/types";
import {
  adaptMockQuestion,
  adaptRealQuestion,
  type PartnerChessQuizQuestion,
  type PartnerChessSubjectFilter
} from "@/utils/partnerChessQuestionAdapter";

export type PartnerChessQuestionPickResult = {
  questions: PartnerChessQuizQuestion[];
  realCount: number;
  mockCount: number;
  insufficientRealQuestions: boolean;
};

function matchesSubject(question: QuizQuestion, subject: PartnerChessSubjectFilter) {
  return subject === "all" || question.subject === subject;
}

function matchesMockSubject(question: { subject?: string }, subject: PartnerChessSubjectFilter) {
  return subject === "all" || question.subject === subject;
}

function stableShuffle<T>(items: T[], seed: number) {
  const next = [...items];
  let value = seed || 1;
  for (let index = next.length - 1; index > 0; index -= 1) {
    value = (value * 9301 + 49297) % 233280;
    const randomIndex = Math.floor((value / 233280) * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }
  return next;
}

export function countRealChoiceQuestionsBySubject(questions: QuizQuestion[]) {
  return questions.reduce(
    (counts, question) => {
      if ((question.questionType ?? "single_choice") !== "single_choice") return counts;
      if (!question.options?.length || !question.answer) return counts;
      counts.all += 1;
      counts[question.subject] = (counts[question.subject] ?? 0) + 1;
      return counts;
    },
    { all: 0 } as Record<PartnerChessSubjectFilter, number>
  );
}

export function pickPartnerChessQuestions({
  questions,
  round,
  seed,
  selectedSubject,
  usedIds
}: {
  questions: QuizQuestion[];
  round: number;
  seed: number;
  selectedSubject: PartnerChessSubjectFilter;
  usedIds: string[];
}): PartnerChessQuestionPickResult {
  const count = getPrepQuestionCount(round);
  const used = new Set(usedIds);
  const realPool = questions
    .filter((question) => matchesSubject(question, selectedSubject))
    .map(adaptRealQuestion)
    .filter((question): question is PartnerChessQuizQuestion => Boolean(question));

  const unusedRealPool = realPool.filter((question) => !used.has(question.id));
  const selectedReal = stableShuffle(unusedRealPool.length >= count ? unusedRealPool : realPool, seed).slice(0, count);

  if (selectedReal.length >= count) {
    return {
      questions: selectedReal,
      realCount: selectedReal.length,
      mockCount: 0,
      insufficientRealQuestions: false
    };
  }

  const remaining = count - selectedReal.length;
  const subjectMockPool = partnerChessQuizQuestions.filter((question) => matchesMockSubject(question, selectedSubject));
  const mockPool = subjectMockPool.length ? subjectMockPool : partnerChessQuizQuestions;
  const selectedMock = stableShuffle(mockPool, seed + 17)
    .map(adaptMockQuestion)
    .filter((question): question is PartnerChessQuizQuestion => Boolean(question))
    .slice(0, remaining);

  return {
    questions: [...selectedReal, ...selectedMock],
    realCount: selectedReal.length,
    mockCount: selectedMock.length,
    insufficientRealQuestions: selectedReal.length < count
  };
}

export function recommendedPartnerChessSubject(questions: QuizQuestion[]): Subject | "all" {
  const counts = countRealChoiceQuestionsBySubject(questions);
  if (counts.history > 0) return "history";

  const subjects: Subject[] = ["history", "politics", "geography", "english", "math", "biology"];
  return subjects.reduce<Subject | "all">((best, subject) => {
    if (best === "all") return (counts[subject] ?? 0) > 0 ? subject : best;
    return (counts[subject] ?? 0) > (counts[best] ?? 0) ? subject : best;
  }, "all");
}
