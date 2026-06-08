export type PageId = "home" | "map" | "quiz" | "schedule" | "prompts" | "textbook" | "studyAids" | "studyAidDetail" | "wrongBook" | "profile" | "adminQuestions" | "auth" | "about";

export type Subject = "history" | "politics" | "geography";

export type PromptCategory = Subject | "wrongReview" | "recitePlan";

export type Difficulty = "easy" | "medium" | "hard";

export type ChallengeLevel = {
  id: string;
  island: Subject;
  name: string;
  difficulty: "入门" | "进阶" | "挑战";
  questionCount: number;
  unlocked: boolean;
};

export type QuizQuestion = {
  id: string;
  subject: Subject;
  chapter: string;
  difficulty: Difficulty;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  tags: string[];
};

export type StudyStats = {
  xp: number;
  streakDays: number;
  answeredToday: number;
  correctCount: number;
  totalAnswered?: number;
  lastStudyDate: string;
};

export type ScheduleItem = {
  id: string;
  day: string;
  time: string;
  subject: Subject;
  title: string;
  task: string;
  done: boolean;
};

export type AiPrompt = {
  id: string;
  category: PromptCategory;
  title: string;
  useCase: string;
  prompt: string;
  example: string;
};

export type TextbookArticle = {
  id: string;
  subject: Subject;
  book: string;
  chapter: string;
  coreQuestion: string;
  keyPoints: string[];
  examFocus: string[];
  commonMistakes: string[];
  relatedQuizId: string;
  relatedPromptId: string;
};

export type StudyAid = {
  id: string;
  title: string;
  subject: Subject;
  grade: "高一" | "高二" | "高三" | "通用";
  type: "同步讲解" | "刷题训练" | "一轮复习" | "专题突破" | "错题巩固";
  difficulty: Difficulty;
  fitFor: string;
  highlights: string[];
  cautions: string[];
  relatedChapters: string[];
  priceRange: string;
  searchKeyword: string;
  coverColor: string;
};

export type WrongAnswerRecord = {
  id: string;
  questionId: string;
  subject: Subject;
  chapter: string;
  question: string;
  options: string[];
  correctAnswer: string;
  selectedAnswer: string;
  explanation: string;
  tags: string[];
  createdAt: string;
  wrongCount?: number;
};

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  role?: "admin" | "student" | string | null;
};
