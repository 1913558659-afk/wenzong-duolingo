import type { Subject } from "@/types";

export type UserRole = "student" | "teacher" | "admin";

export type EducationUser = {
  avatar?: string;
  createdAt?: string;
  email: string;
  id: string;
  name: string;
  role: UserRole;
};

export type StudentProfile = {
  classIds: string[];
  courseIds: string[];
  createdAt: string;
  displayName: string;
  grade: string;
  guardianContact?: string;
  id: string;
  school?: string;
  tags?: string[];
  userId: string;
};

export type TeacherProfile = {
  classIds: string[];
  courseIds: string[];
  createdAt: string;
  displayName: string;
  id: string;
  subjectTags: Subject[];
  userId: string;
};

export type ClassGroup = {
  createdAt: string;
  grade: string;
  id: string;
  inviteCode: string;
  name: string;
  studentIds: string[];
  teacherId: string;
};

export type Course = {
  chapterScope?: string[];
  classId: string;
  createdAt: string;
  id: string;
  name: string;
  subject: Subject;
  teacherId: string;
};

export type Assignment = {
  chapter: string;
  classId: string;
  courseId: string;
  createdAt: string;
  dueAt?: string;
  id: string;
  questionIds: string[];
  subject: Subject;
  title: string;
};

export type GradeRecord = {
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
  subject: Subject;
  suggestedActions: string[];
  summary: string;
  weaknesses: string[];
};

export type GradeTrendPoint = {
  label: string;
  score: number;
};
