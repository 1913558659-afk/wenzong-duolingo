import type { Subject } from "@/types";

export type UserRole = "student" | "teacher" | "admin";

export type EduUser = {
  avatar?: string;
  createdAt: string;
  email: string;
  id: string;
  name: string;
  role: UserRole;
};

export type EducationUser = EduUser;

export type StudentProfile = {
  classIds: string[];
  courseIds: string[];
  createdAt: string;
  displayName: string;
  grade: string;
  id: string;
  studentNo?: string;
  tags?: string[];
  userId?: string;
};

export type TeacherProfile = {
  classIds: string[];
  courseIds: string[];
  createdAt: string;
  displayName: string;
  id: string;
  subjectTags: Subject[];
  userId?: string;
};

export type ClassGroup = {
  createdAt: string;
  grade: string;
  id: string;
  inviteCode: string;
  name: string;
  studentIds: string[];
  subjectFocus?: Subject[];
  teacherId: string;
};

export type Course = {
  chapterScope?: string[];
  classId: string;
  createdAt: string;
  description?: string;
  id: string;
  name: string;
  subject: Subject;
  teacherId: string;
};

export type Assignment = {
  chapter?: string;
  classId: string;
  courseId: string;
  createdAt: string;
  description?: string;
  dueAt?: string;
  id: string;
  questionCount?: number;
  questionIds?: string[];
  status: "draft" | "published" | "closed";
  subject: Subject;
  title: string;
};

export type GradeRecord = {
  classId: string;
  courseId: string;
  date: string;
  examName: string;
  fullScore: number;
  id: string;
  score: number;
  studentId: string;
  subject: Subject;
  tags?: string[];
  teacherComment?: string;
};

export type WrongQuestionStat = {
  attemptCount: number;
  chapter: string;
  questionId: string;
  studentIds: string[];
  subject: Subject;
  tags: string[];
  title: string;
  wrongCount: number;
  wrongRate: number;
};

export type LearningReport = {
  createdAt: string;
  highFrequencyWrongQuestions: string[];
  id: string;
  scopeId: string;
  scopeType: "student" | "class";
  strengths: string[];
  subject?: Subject;
  suggestedActions: string[];
  summary: string;
  title: string;
  weaknesses: string[];
};

export type EducationDataSnapshot = {
  assignments: Assignment[];
  classes: ClassGroup[];
  courses: Course[];
  grades: GradeRecord[];
  reports: LearningReport[];
  students: StudentProfile[];
  wrongQuestionStats: WrongQuestionStat[];
};

export type GradeTrendPoint = {
  label: string;
  score: number;
};
