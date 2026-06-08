import type { AuthUser, QuizQuestion, StudyStats, WrongAnswerRecord } from "@/types";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

type ApiOptions = RequestInit & {
  token?: string | null;
};

export type ProgressMeResponse = {
  stats?: StudyStats;
  completedQuestionIds?: string[];
  wrongQuestions?: WrongAnswerRecord[];
};

async function apiRequest<T>(path: string, options: ApiOptions = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers
  });

  const data = (await response.json().catch(() => null)) as T | { message?: string } | null;

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data && typeof data.message === "string" ? data.message : "请求失败";
    throw new Error(message);
  }

  return data as T;
}

export function registerUser(payload: { email: string; password: string; name?: string }) {
  return apiRequest<{ token: string; user: AuthUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function loginUser(payload: { email: string; password: string }) {
  return apiRequest<{ token: string; user: AuthUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function fetchMe(token: string) {
  return apiRequest<{ user: AuthUser; stats?: StudyStats }>("/api/auth/me", { token });
}

export function fetchProgressMe(token: string) {
  return apiRequest<ProgressMeResponse>("/api/progress/me", { token });
}

export function sendAnswerAttempt({
  isCorrect,
  question,
  selectedAnswer,
  token
}: {
  isCorrect: boolean;
  question: QuizQuestion;
  selectedAnswer: string;
  token: string;
}) {
  return apiRequest<{ ok: boolean }>("/api/progress/answer", {
    method: "POST",
    token,
    body: JSON.stringify({
      questionId: question.id,
      subject: question.subject,
      chapter: question.chapter,
      question: question.question,
      selectedAnswer,
      correctAnswer: question.answer,
      isCorrect,
      explanation: question.explanation,
      tags: question.tags
    })
  });
}

export function resolveWrongQuestion(questionId: string, token: string) {
  return apiRequest<{ ok: boolean }>(`/api/progress/wrong-questions/${encodeURIComponent(questionId)}/resolve`, {
    method: "POST",
    token,
    body: JSON.stringify({})
  });
}
