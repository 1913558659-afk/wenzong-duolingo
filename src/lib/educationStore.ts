import type {
  Assignment,
  ClassGroup,
  Course,
  EducationDataSnapshot,
  GradeRecord,
  LearningReport,
  StudentProfile,
  WrongQuestionStat
} from "@/types/education";

export const educationStorageKeys = {
  assignments: "sayhi_edu_assignments",
  classes: "sayhi_edu_classes",
  courses: "sayhi_edu_courses",
  grades: "sayhi_edu_grades",
  reports: "sayhi_edu_reports",
  students: "sayhi_edu_students",
  wrongQuestionStats: "sayhi_edu_wrong_question_stats"
} as const;

function getStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

function readList<T>(key: string): T[] {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const saved = storage.getItem(key);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function saveList<T>(key: string, value: T[]) {
  try {
    getStorage()?.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable or full. Keep the page usable.
  }
}

function createId(prefix: string) {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `${prefix}-${crypto.randomUUID()}`;
    }
  } catch {
    // Fall through to a timestamp-based id.
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const getClasses = () => readList<ClassGroup>(educationStorageKeys.classes);
export const saveClasses = (classes: ClassGroup[]) => saveList(educationStorageKeys.classes, classes);

export function createClassGroup(data: Omit<ClassGroup, "id" | "createdAt"> & Partial<Pick<ClassGroup, "id" | "createdAt">>) {
  const item: ClassGroup = { ...data, createdAt: data.createdAt ?? new Date().toISOString(), id: data.id ?? createId("class") };
  saveClasses([...getClasses(), item]);
  return item;
}

export function updateClassGroup(id: string, patch: Partial<Omit<ClassGroup, "id">>) {
  const items = getClasses();
  const next = items.map((item) => item.id === id ? { ...item, ...patch, id } : item);
  saveClasses(next);
  return next.find((item) => item.id === id) ?? null;
}

export function deleteClassGroup(id: string) {
  const next = getClasses().filter((item) => item.id !== id);
  saveClasses(next);
  return next;
}

export const getStudents = () => readList<StudentProfile>(educationStorageKeys.students);
export const saveStudents = (students: StudentProfile[]) => saveList(educationStorageKeys.students, students);

export function createStudent(data: Omit<StudentProfile, "id" | "createdAt"> & Partial<Pick<StudentProfile, "id" | "createdAt">>) {
  const item: StudentProfile = { ...data, createdAt: data.createdAt ?? new Date().toISOString(), id: data.id ?? createId("student") };
  saveStudents([...getStudents(), item]);
  return item;
}

export function updateStudent(id: string, patch: Partial<Omit<StudentProfile, "id">>) {
  const next = getStudents().map((item) => item.id === id ? { ...item, ...patch, id } : item);
  saveStudents(next);
  return next.find((item) => item.id === id) ?? null;
}

export function deleteStudent(id: string) {
  const next = getStudents().filter((item) => item.id !== id);
  saveStudents(next);
  return next;
}

export const getCourses = () => readList<Course>(educationStorageKeys.courses);
export const saveCourses = (courses: Course[]) => saveList(educationStorageKeys.courses, courses);

export function createCourse(data: Omit<Course, "id" | "createdAt"> & Partial<Pick<Course, "id" | "createdAt">>) {
  const item: Course = { ...data, createdAt: data.createdAt ?? new Date().toISOString(), id: data.id ?? createId("course") };
  saveCourses([...getCourses(), item]);
  return item;
}

export function updateCourse(id: string, patch: Partial<Omit<Course, "id">>) {
  const next = getCourses().map((item) => item.id === id ? { ...item, ...patch, id } : item);
  saveCourses(next);
  return next.find((item) => item.id === id) ?? null;
}

export function deleteCourse(id: string) {
  const next = getCourses().filter((item) => item.id !== id);
  saveCourses(next);
  return next;
}

export const getAssignments = () => readList<Assignment>(educationStorageKeys.assignments);
export const saveAssignments = (assignments: Assignment[]) => saveList(educationStorageKeys.assignments, assignments);

export function createAssignment(data: Omit<Assignment, "id" | "createdAt"> & Partial<Pick<Assignment, "id" | "createdAt">>) {
  const item: Assignment = { ...data, createdAt: data.createdAt ?? new Date().toISOString(), id: data.id ?? createId("assignment") };
  saveAssignments([...getAssignments(), item]);
  return item;
}

export function updateAssignment(id: string, patch: Partial<Omit<Assignment, "id">>) {
  const next = getAssignments().map((item) => item.id === id ? { ...item, ...patch, id } : item);
  saveAssignments(next);
  return next.find((item) => item.id === id) ?? null;
}

export function deleteAssignment(id: string) {
  const next = getAssignments().filter((item) => item.id !== id);
  saveAssignments(next);
  return next;
}

export const getGrades = () => readList<GradeRecord>(educationStorageKeys.grades);
export const saveGrades = (grades: GradeRecord[]) => saveList(educationStorageKeys.grades, grades);

export function createGradeRecord(data: Omit<GradeRecord, "id"> & Partial<Pick<GradeRecord, "id">>) {
  const item: GradeRecord = { ...data, id: data.id ?? createId("grade") };
  saveGrades([...getGrades(), item]);
  return item;
}

export function updateGradeRecord(id: string, patch: Partial<Omit<GradeRecord, "id">>) {
  const next = getGrades().map((item) => item.id === id ? { ...item, ...patch, id } : item);
  saveGrades(next);
  return next.find((item) => item.id === id) ?? null;
}

export function deleteGradeRecord(id: string) {
  const next = getGrades().filter((item) => item.id !== id);
  saveGrades(next);
  return next;
}

export const getReports = () => readList<LearningReport>(educationStorageKeys.reports);
export const saveReports = (reports: LearningReport[]) => saveList(educationStorageKeys.reports, reports);

export function createLearningReport(data: Omit<LearningReport, "id" | "createdAt"> & Partial<Pick<LearningReport, "id" | "createdAt">>) {
  const item: LearningReport = { ...data, createdAt: data.createdAt ?? new Date().toISOString(), id: data.id ?? createId("report") };
  saveReports([...getReports(), item]);
  return item;
}

export function deleteLearningReport(id: string) {
  const next = getReports().filter((item) => item.id !== id);
  saveReports(next);
  return next;
}

export const getWrongQuestionStats = () => readList<WrongQuestionStat>(educationStorageKeys.wrongQuestionStats);
export const saveWrongQuestionStats = (stats: WrongQuestionStat[]) => saveList(educationStorageKeys.wrongQuestionStats, stats);

export function getEducationDataSnapshot(): EducationDataSnapshot {
  return {
    assignments: getAssignments(),
    classes: getClasses(),
    courses: getCourses(),
    grades: getGrades(),
    reports: getReports(),
    students: getStudents(),
    wrongQuestionStats: getWrongQuestionStats()
  };
}

export function hasEducationDemoData() {
  const data = getEducationDataSnapshot();
  return Object.values(data).some((items) => items.length > 0);
}

function isoDate(daysFromToday: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString();
}

export function generateMockEducationData(): EducationDataSnapshot {
  const teacherId = "test-teacher";
  const classes: ClassGroup[] = [
    {
      createdAt: isoDate(-120),
      grade: "高一",
      id: "class-01",
      inviteCode: "SAYHI101",
      name: "高一历史冲刺班",
      studentIds: ["student-01", "student-02", "student-03", "student-04", "student-05"],
      subjectFocus: ["history"],
      teacherId
    },
    {
      createdAt: isoDate(-110),
      grade: "高一",
      id: "class-02",
      inviteCode: "SAYHI102",
      name: "高一英语基础班",
      studentIds: ["student-06", "student-07", "student-08", "student-09", "student-10"],
      subjectFocus: ["english"],
      teacherId
    }
  ];

  const studentNames = Array.from({ length: 10 }, (_, index) => `演示学生${String(index + 1).padStart(2, "0")}`);
  const students: StudentProfile[] = studentNames.map((displayName, index) => {
    const number = String(index + 1).padStart(2, "0");
    const firstClass = index < 5;
    return {
      classIds: [firstClass ? "class-01" : "class-02"],
      courseIds: firstClass ? ["course-history"] : ["course-english", "course-politics"],
      createdAt: isoDate(-100 + index),
      displayName,
      grade: "高一",
      id: `student-${number}`,
      studentNo: `DEMO${number}`,
      tags: index % 3 === 0 ? ["学习积极"] : index % 3 === 1 ? ["基础稳固"] : ["需要关注"],
      userId: `demo-user-${number}`
    };
  });

  const courses: Course[] = [
    {
      chapterScope: ["中华文明起源", "秦汉统一多民族国家"],
      classId: "class-01",
      createdAt: isoDate(-90),
      id: "course-history",
      description: "围绕高一历史核心知识进行一轮复习。",
      name: "历史一轮复习",
      subject: "history",
      teacherId
    },
    {
      chapterScope: ["名词", "时态", "从句"],
      classId: "class-02",
      createdAt: isoDate(-82),
      description: "通过专项练习巩固英语语法基础。",
      id: "course-english",
      name: "英语语法训练",
      subject: "english",
      teacherId
    },
    {
      chapterScope: ["经济生活", "政治生活"],
      classId: "class-02",
      createdAt: isoDate(-76),
      id: "course-politics",
      description: "梳理政治学科核心概念和答题方法。",
      name: "政治核心概念",
      subject: "politics",
      teacherId
    }
  ];

  const assignments: Assignment[] = [
    {
      chapter: "秦汉统一多民族国家",
      classId: "class-01",
      courseId: "course-history",
      createdAt: isoDate(-7),
      description: "完成章节基础练习并订正错题。",
      dueAt: isoDate(2),
      id: "assignment-01",
      questionIds: ["history-q001", "history-q002", "history-q003"],
      status: "published",
      subject: "history",
      questionCount: 12,
      title: "先秦史基础训练"
    },
    {
      chapter: "名词",
      classId: "class-02",
      courseId: "course-english",
      createdAt: isoDate(-4),
      dueAt: isoDate(4),
      id: "assignment-02",
      questionCount: 10,
      questionIds: ["english-q001", "english-q002"],
      status: "published",
      subject: "english",
      title: "英语名词复数专项"
    },
    {
      chapter: "经济生活",
      classId: "class-02",
      courseId: "course-politics",
      createdAt: isoDate(-2),
      dueAt: isoDate(6),
      id: "assignment-03",
      questionIds: ["politics-q001", "politics-q002"],
      status: "published",
      subject: "politics",
      questionCount: 15,
      title: "政治经济生活练习"
    }
  ];

  const courseIds = ["course-history", "course-english", "course-politics"] as const;
  const subjects = ["history", "english", "politics"] as const;
  const grades: GradeRecord[] = Array.from({ length: 20 }, (_, index) => {
    const courseIndex = index % courseIds.length;
    const studentNumber = String(courseIndex === 0 ? (index % 5) + 1 : (index % 5) + 6).padStart(2, "0");
    return {
      classId: courseIndex === 0 ? "class-01" : "class-02",
      courseId: courseIds[courseIndex],
      date: isoDate(-index),
      examName: index < 10 ? "六月阶段检测" : "五月单元测验",
      fullScore: 100,
      id: `grade-${String(index + 1).padStart(2, "0")}`,
      score: 68 + ((index * 7) % 29),
      studentId: `student-${studentNumber}`,
      subject: subjects[courseIndex],
      tags: index % 4 === 0 ? ["进步明显"] : undefined,
      teacherComment: index % 5 === 0 ? "基础掌握较好，继续加强综合题训练。" : undefined
    };
  });

  const wrongQuestionStats: WrongQuestionStat[] = [
    { attemptCount: 10, chapter: "先秦史", questionId: "history-q002", studentIds: ["student-01", "student-03", "student-05", "student-07", "student-09"], subject: "history", tags: ["时空观念", "史料实证"], title: "先秦政治制度辨析", wrongCount: 6, wrongRate: 0.6 },
    { attemptCount: 10, chapter: "名词", questionId: "english-q002", studentIds: ["student-02", "student-04", "student-06", "student-08"], subject: "english", tags: ["名词复数", "不规则变化"], title: "名词复数变化规则", wrongCount: 5, wrongRate: 0.5 },
    { attemptCount: 8, chapter: "经济生活", questionId: "politics-q001", studentIds: ["student-06", "student-07", "student-10"], subject: "politics", tags: ["价格变动"], title: "价格变动影响因素", wrongCount: 3, wrongRate: 0.375 }
  ];

  const reports: LearningReport[] = [
    {
      createdAt: isoDate(-1),
      highFrequencyWrongQuestions: ["history-q002", "english-q002"],
      id: "report-class-01",
      scopeId: "class-01",
      scopeType: "class",
      strengths: ["学习任务完成较稳定", "历史基础题正确率较高"],
      subject: "history",
      suggestedActions: ["增加地球运动专题训练", "安排高频错题讲评"],
      summary: "高一历史冲刺班整体学习节奏稳定，史料分析题仍是主要薄弱项。",
      title: "高一历史冲刺班六月学情报告",
      weaknesses: ["史料分析题失分较多", "部分学生综合分析题表达不完整"]
    },
    {
      createdAt: isoDate(0),
      highFrequencyWrongQuestions: ["english-q002"],
      id: "report-student-01",
      scopeId: "student-06",
      scopeType: "student",
      strengths: ["学习连续性良好", "历史知识框架清晰"],
      subject: "english",
      suggestedActions: ["每天完成 10 道名词复数专项题", "整理不规则变化词表"],
      summary: "演示学生06近期成绩稳中有升，需要继续巩固名词复数变化规则。",
      title: "演示学生06个人学习报告",
      weaknesses: ["不规则名词复数容易混淆"]
    }
  ];

  saveClasses(classes);
  saveStudents(students);
  saveCourses(courses);
  saveAssignments(assignments);
  saveGrades(grades);
  saveWrongQuestionStats(wrongQuestionStats);
  saveReports(reports);

  return { assignments, classes, courses, grades, reports, students, wrongQuestionStats };
}

export function resetEducationDemoData(): EducationDataSnapshot {
  try {
    const storage = getStorage();
    if (storage) {
      Object.values(educationStorageKeys).forEach((key) => storage.removeItem(key));
    }
  } catch {
    // Storage may be unavailable. Return a safe empty snapshot.
  }
  return getEducationDataSnapshot();
}
