import type { AuthUser, Difficulty, QuizQuestion, StudyStats, Subject, WrongAnswerRecord } from "@/types";
import { normalizeSubjectCode } from "@/lib/subjects";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

type ApiOptions = RequestInit & {
  token?: string | null;
};

export type ProgressMeResponse = {
  stats?: StudyStats;
  completedQuestionIds?: string[];
  wrongQuestions?: WrongAnswerRecord[];
};

export type BackendQuestion = {
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

export type AdminQuestionPayload = {
  questionCode: string;
  subjectCode: string;
  subjectName: string;
  chapterCode: string;
  chapterTitle: string;
  stem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
  difficulty: Difficulty;
  tags: string[];
};

export type ImportQuestionIssue = {
  index?: number;
  questionIndex?: number;
  row?: number;
  message?: string;
  reason?: string;
  error?: string;
};

export type ImportPreviewResponse = {
  total?: number;
  validCount?: number;
  invalidCount?: number;
  errors?: ImportQuestionIssue[];
  issues?: ImportQuestionIssue[];
  items?: unknown[];
  parsedQuestions?: unknown[];
};

export type ImportConfirmResponse = {
  importedCount?: number;
  failedCount?: number;
  errors?: ImportQuestionIssue[];
  issues?: ImportQuestionIssue[];
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
    totalPages?: number;
  };
};

export type NormalizedQuestionsResponse = {
  questions: BackendQuestion[];
  total: number;
};

type QuestionsApiResponse = BackendQuestion[] | QuestionsResponse;

function apiUrl(path: string) {
  const normalizedBase = apiBaseUrl.replace(/\/$/, "");
  if (normalizedBase.endsWith("/api") && path.startsWith("/api/")) {
    return `${normalizedBase}${path.slice(4)}`;
  }
  return `${normalizedBase}${path}`;
}

async function apiRequest<T>(path: string, options: ApiOptions = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    headers
  });

  const data = (await response.json().catch(() => null)) as T | { message?: string } | null;

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data && typeof data.message === "string" ? data.message : "请求失败";
    throw new Error(`${response.status} ${message}`);
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

function normalizeSubject(code?: string, name?: string): Subject {
  return normalizeSubjectCode(`${code ?? ""} ${name ?? ""}`);
}

function normalizeChapter(title?: string, code?: string) {
  return (title ?? code ?? "未分类章节").trim() || "未分类章节";
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
    subject: normalizeSubject(question.subject?.code, question.subject?.name),
    chapter: normalizeChapter(question.chapter?.title, question.chapter?.code),
    difficulty: normalizeDifficulty(question.difficulty),
    question: question.stem ?? "",
    options: [question.optionA ?? "", question.optionB ?? "", question.optionC ?? "", question.optionD ?? ""],
    answer: answerText(question),
    explanation: question.explanation ?? "",
    tags: normalizeTags(question.tags)
  };
}

function pageCount(data: QuestionsResponse) {
  if (typeof data.pagination?.totalPages === "number") {
    return data.pagination.totalPages;
  }

  if (typeof data.pagination?.total === "number" && typeof data.pagination.limit === "number" && data.pagination.limit > 0) {
    return Math.ceil(data.pagination.total / data.pagination.limit);
  }

  return 1;
}

function normalizeQuestionsResponse(data: QuestionsApiResponse): NormalizedQuestionsResponse {
  if (Array.isArray(data)) {
    return {
      questions: data,
      total: data.length
    };
  }

  if (data && Array.isArray(data.questions)) {
    return {
      questions: data.questions,
      total: typeof data.pagination?.total === "number" ? data.pagination.total : data.questions.length
    };
  }

  throw new Error("题库接口返回格式不正确");
}

export async function fetchAllBackendQuestionsResult(subject?: Subject): Promise<NormalizedQuestionsResponse> {
  const limit = "100";
  const firstParams = new URLSearchParams({ page: "1", limit });
  if (subject) {
    firstParams.set("subject", subject);
  }

  const firstPage = await apiRequest<QuestionsApiResponse>(`/api/questions?${firstParams.toString()}`);

  if (import.meta.env.DEV) {
    console.log("[wenzong-api] API_BASE_URL:", apiBaseUrl);
    console.log("[wenzong-api] /api/questions page 1 response:", firstPage);
  }

  const normalizedFirstPage = normalizeQuestionsResponse(firstPage);

  if (Array.isArray(firstPage)) {
    return normalizedFirstPage;
  }

  const totalPages = pageCount(firstPage);
  const allQuestions = [...normalizedFirstPage.questions];

  for (let page = 2; page <= totalPages; page += 1) {
    const params = new URLSearchParams({ page: String(page), limit });
    if (subject) {
      params.set("subject", subject);
    }

    const data = await apiRequest<QuestionsApiResponse>(`/api/questions?${params.toString()}`);
    const normalizedPage = normalizeQuestionsResponse(data);
    allQuestions.push(...normalizedPage.questions);
  }

  return {
    questions: allQuestions,
    total: normalizedFirstPage.total
  };
}

export async function fetchAllBackendQuestions(subject?: Subject) {
  const result = await fetchAllBackendQuestionsResult(subject);
  return result.questions;
}

export async function fetchAllQuestions(subject?: Subject) {
  const questions = await fetchAllBackendQuestions(subject);

  return questions
    .map(mapBackendQuestion)
    .filter((question) => question.id && question.question && question.options.length >= 4 && question.answer);
}

export function fetchQuestions(subject?: Subject) {
  return fetchAllQuestions(subject);
}

export function fetchSubjects() {
  return apiRequest<BackendSubject[]>("/api/subjects");
}

export function createAdminQuestion(payload: AdminQuestionPayload, token: string) {
  return apiRequest<BackendQuestion>("/api/admin/questions", {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export function updateAdminQuestion(id: string, payload: AdminQuestionPayload, token: string) {
  return apiRequest<BackendQuestion>(`/api/admin/questions/${encodeURIComponent(id)}`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload)
  });
}

export function deleteAdminQuestion(id: string, token: string) {
  return apiRequest<{ ok: boolean }>(`/api/admin/questions/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token
  });
}

export function previewImportQuestions(text: string, token: string) {
  return apiRequest<ImportPreviewResponse>("/api/admin/questions/import/preview", {
    method: "POST",
    token,
    body: JSON.stringify({ format: "markdown", text })
  });
}

export function confirmImportQuestions(text: string, token: string) {
  return apiRequest<ImportConfirmResponse>("/api/admin/questions/import/confirm", {
    method: "POST",
    token,
    body: JSON.stringify({ format: "markdown", text })
  });
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
