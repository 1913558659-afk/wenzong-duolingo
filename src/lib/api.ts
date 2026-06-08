import type { AuthUser, Difficulty, QuizQuestion, StudyStats, Subject, WrongAnswerRecord } from "@/types";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

type ApiOptions = RequestInit & {
  token?: string | null;
};

export type ProgressMeResponse = {
  stats?: StudyStats;
  completedQuestionIds?: string[];
  wrongQuestions?: WrongAnswerRecord[];
};

type BackendQuestion = {
  questionCode?: string;
  id?: string;
  subject?: {
    code?: string;
    name?: string;
  };
  chapter?: {
    code?: string;
    title?: string;
  };
  stem?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer?: string;
  explanation?: string;
  difficulty?: string;
  tags?: string[] | string | null;
};

export type BackendSubject = {
  code: string;
  name: string;
};

type QuestionsResponse = {
  questions?: BackendQuestion[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
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

function normalizeSubject(code?: string): Subject {
  return code === "history" || code === "politics" || code === "geography" ? code : "history";
}

function normalizeDifficulty(value?: string): Difficulty {
  return value === "easy" || value === "medium" || value === "hard" ? value : "medium";
}

function normalizeTags(tags: BackendQuestion["tags"]) {
  if (Array.isArray(tags)) {
    return tags;
  }
  if (typeof tags === "string") {
    return tags.split(/[、,，]/).map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
}

function answerText(question: BackendQuestion) {
  const options = [question.optionA ?? "", question.optionB ?? "", question.optionC ?? "", question.optionD ?? ""];
  const index = { A: 0, B: 1, C: 2, D: 3 }[String(question.correctAnswer ?? "").toUpperCase() as "A" | "B" | "C" | "D"];
  return index === undefined ? String(question.correctAnswer ?? "") : options[index];
}

export function mapBackendQuestion(question: BackendQuestion): QuizQuestion {
  return {
    id: question.questionCode ?? question.id ?? "",
    subject: normalizeSubject(question.subject?.code),
    chapter: question.chapter?.title ?? "未分类章节",
    difficulty: normalizeDifficulty(question.difficulty),
    question: question.stem ?? "",
    options: [question.optionA ?? "", question.optionB ?? "", question.optionC ?? "", question.optionD ?? ""],
    answer: answerText(question),
    explanation: question.explanation ?? "",
    tags: normalizeTags(question.tags)
  };
}

export async function fetchQuestions(subject?: Subject) {
  const params = new URLSearchParams({ limit: "1000" });
  if (subject) {
    params.set("subject", subject);
  }

  const data = await apiRequest<QuestionsResponse>(`/api/questions?${params.toString()}`);

  if (import.meta.env.DEV) {
    console.log("[wenzong-api] API_BASE_URL:", apiBaseUrl);
    console.log("[wenzong-api] /api/questions response:", data);
  }

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error("题库接口返回格式不正确或题目为空");
  }

  return data.questions
    .map(mapBackendQuestion)
    .filter((question) => question.id && question.question && question.options.length >= 4 && question.answer);
}

export function fetchSubjects() {
  return apiRequest<BackendSubject[]>("/api/subjects");
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
