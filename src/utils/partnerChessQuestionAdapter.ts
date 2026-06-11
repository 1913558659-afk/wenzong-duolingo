import { subjectLabels } from "@/lib/labels";
import type { Difficulty, QuizQuestion, Subject } from "@/types";

export type PartnerChessQuestionSource = "real" | "mock";

export type PartnerChessSubjectFilter = "all" | Subject | "chinese" | "physics" | "chemistry";

export type PartnerChessQuizQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
  subject: string;
  difficulty?: Difficulty | string;
  source: PartnerChessQuestionSource;
};

type RawPartnerChessQuestion = {
  id?: string;
  question?: string;
  options?: unknown;
  answer?: unknown;
  explanation?: string;
  subject?: string;
  difficulty?: Difficulty | string;
};

const answerLetters = ["A", "B", "C", "D"];

function normalizeText(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function optionIndexFromAnswer(value: unknown) {
  const text = normalizeText(value).toUpperCase();
  const letterIndex = answerLetters.indexOf(text);
  if (letterIndex >= 0) return letterIndex;

  const number = Number(text);
  if (Number.isInteger(number)) {
    if (number >= 0 && number <= 3) return number;
    if (number >= 1 && number <= 4) return number - 1;
  }

  return -1;
}

export function normalizePartnerChessOptions(options: unknown) {
  if (Array.isArray(options)) {
    return options.map((option) => String(option ?? "").trim()).filter(Boolean);
  }

  if (options && typeof options === "object") {
    const record = options as Record<string, unknown>;
    return ["A", "B", "C", "D"].map((key) => String(record[key] ?? record[key.toLowerCase()] ?? "").trim()).filter(Boolean);
  }

  return [];
}

export function adaptRealQuestion(question: QuizQuestion): PartnerChessQuizQuestion | null {
  if ((question.questionType ?? "single_choice") !== "single_choice") {
    return null;
  }

  const options = normalizePartnerChessOptions(question.options);
  if (!question.id || !question.question || options.length < 2 || !question.answer) {
    return null;
  }

  return {
    id: question.id,
    question: question.question,
    options,
    answer: question.answer,
    explanation: question.explanation,
    subject: subjectLabels[question.subject],
    difficulty: question.difficulty,
    source: "real"
  };
}

export function adaptMockQuestion(question: RawPartnerChessQuestion): PartnerChessQuizQuestion | null {
  const options = normalizePartnerChessOptions(question.options);
  if (!question.id || !question.question || options.length < 2 || !question.answer) {
    return null;
  }

  return {
    id: question.id,
    question: question.question,
    options,
    answer: String(question.answer),
    explanation: question.explanation,
    subject: question.subject ?? "备战",
    difficulty: question.difficulty ?? "easy",
    source: "mock"
  };
}

export function isPartnerChessAnswerCorrect(question: PartnerChessQuizQuestion, selectedAnswer: string) {
  const answerIndex = optionIndexFromAnswer(question.answer);
  const selectedIndex = optionIndexFromAnswer(selectedAnswer);

  if (answerIndex >= 0) {
    return selectedIndex === answerIndex;
  }

  const selectedOptionText = selectedIndex >= 0 ? question.options[selectedIndex] : selectedAnswer;
  return normalizeText(selectedOptionText) === normalizeText(question.answer);
}

export function sourceLabel(source: PartnerChessQuestionSource) {
  return source === "real" ? "真实题库" : "fallback 备战题";
}
