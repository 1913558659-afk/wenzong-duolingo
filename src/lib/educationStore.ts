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
  getStorage()?.setItem(key, JSON.stringify(value));
}

export const getClasses = () => readList<ClassGroup>(educationStorageKeys.classes);
export const saveClasses = (classes: ClassGroup[]) => saveList(educationStorageKeys.classes, classes);

export const getStudents = () => readList<StudentProfile>(educationStorageKeys.students);
export const saveStudents = (students: StudentProfile[]) => saveList(educationStorageKeys.students, students);

export const getCourses = () => readList<Course>(educationStorageKeys.courses);
export const saveCourses = (courses: Course[]) => saveList(educationStorageKeys.courses, courses);

export const getAssignments = () => readList<Assignment>(educationStorageKeys.assignments);
export const saveAssignments = (assignments: Assignment[]) => saveList(educationStorageKeys.assignments, assignments);

export const getGrades = () => readList<GradeRecord>(educationStorageKeys.grades);
export const saveGrades = (grades: GradeRecord[]) => saveList(educationStorageKeys.grades, grades);

export const getReports = () => readList<LearningReport>(educationStorageKeys.reports);
export const saveReports = (reports: LearningReport[]) => saveList(educationStorageKeys.reports, reports);

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
      name: "高一（1）班",
      studentIds: ["student-01", "student-02", "student-03", "student-04", "student-05"],
      teacherId
    },
    {
      createdAt: isoDate(-110),
      grade: "高一",
      id: "class-02",
      inviteCode: "SAYHI102",
      name: "高一（2）班",
      studentIds: ["student-06", "student-07", "student-08", "student-09", "student-10"],
      teacherId
    }
  ];

  const studentNames = ["林晓雨", "陈嘉树", "周可欣", "许明远", "苏念安", "赵一航", "顾清禾", "唐子墨", "沈星遥", "江予辰"];
  const students: StudentProfile[] = studentNames.map((displayName, index) => {
    const number = String(index + 1).padStart(2, "0");
    const firstClass = index < 5;
    return {
      classIds: [firstClass ? "class-01" : "class-02"],
      courseIds: firstClass ? ["course-history", "course-geography"] : ["course-history", "course-politics"],
      createdAt: isoDate(-100 + index),
      displayName,
      grade: "高一",
      id: `student-${number}`,
      school: "SayHi 演示中学",
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
      name: "高一历史基础",
      subject: "history",
      teacherId
    },
    {
      chapterScope: ["地球运动", "大气运动"],
      classId: "class-01",
      createdAt: isoDate(-82),
      id: "course-geography",
      name: "自然地理入门",
      subject: "geography",
      teacherId
    },
    {
      chapterScope: ["经济生活", "政治生活"],
      classId: "class-02",
      createdAt: isoDate(-76),
      id: "course-politics",
      name: "思想政治必修",
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
      title: "秦汉单元巩固"
    },
    {
      chapter: "地球运动",
      classId: "class-01",
      courseId: "course-geography",
      createdAt: isoDate(-4),
      description: "复习昼夜长短和地方时计算。",
      dueAt: isoDate(4),
      id: "assignment-02",
      questionIds: ["geo-q001", "geo-q002"],
      status: "published",
      subject: "geography",
      title: "地球运动专题"
    },
    {
      chapter: "经济生活",
      classId: "class-02",
      courseId: "course-politics",
      createdAt: isoDate(-2),
      description: "完成价格与消费主题练习。",
      dueAt: isoDate(6),
      id: "assignment-03",
      questionIds: ["politics-q001", "politics-q002"],
      status: "published",
      subject: "politics",
      title: "价格与消费练习"
    }
  ];

  const courseIds = ["course-history", "course-geography", "course-politics"] as const;
  const subjects = ["history", "geography", "politics"] as const;
  const grades: GradeRecord[] = Array.from({ length: 20 }, (_, index) => {
    const studentNumber = String((index % 10) + 1).padStart(2, "0");
    const courseIndex = index % courseIds.length;
    return {
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
    { attemptCount: 10, chapter: "地球运动", questionId: "geo-q001", studentIds: ["student-01", "student-03", "student-05", "student-07", "student-09"], subject: "geography", tags: ["地方时", "经纬网"], wrongCount: 6, wrongRate: 0.6 },
    { attemptCount: 10, chapter: "秦汉统一多民族国家", questionId: "history-q002", studentIds: ["student-02", "student-04", "student-06", "student-08"], subject: "history", tags: ["时空观念"], wrongCount: 5, wrongRate: 0.5 },
    { attemptCount: 8, chapter: "经济生活", questionId: "politics-q001", studentIds: ["student-06", "student-07", "student-10"], subject: "politics", tags: ["价格变动"], wrongCount: 3, wrongRate: 0.375 }
  ];

  const reports: LearningReport[] = [
    {
      createdAt: isoDate(-1),
      highFrequencyWrongQuestions: ["geo-q001", "history-q002"],
      id: "report-class-01",
      scopeId: "class-01",
      scopeType: "class",
      strengths: ["学习任务完成较稳定", "历史基础题正确率较高"],
      subject: "history",
      suggestedActions: ["增加地球运动专题训练", "安排高频错题讲评"],
      summary: "高一（1）班整体学习节奏稳定，地理计算题仍是主要薄弱项。",
      title: "高一（1）班六月学情报告",
      weaknesses: ["地理计算题失分较多", "部分学生综合分析题表达不完整"]
    },
    {
      createdAt: isoDate(0),
      highFrequencyWrongQuestions: ["geo-q001"],
      id: "report-student-01",
      scopeId: "student-01",
      scopeType: "student",
      strengths: ["学习连续性良好", "历史知识框架清晰"],
      subject: "geography",
      suggestedActions: ["每天完成 2 道地方时计算题", "复盘经纬网基础概念"],
      summary: "林晓雨近期成绩稳中有升，需要继续巩固地球运动计算方法。",
      title: "林晓雨个人学习报告",
      weaknesses: ["地方时计算步骤容易遗漏"]
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
  const storage = getStorage();
  if (storage) {
    Object.values(educationStorageKeys).forEach((key) => storage.removeItem(key));
  }
  return getEducationDataSnapshot();
}
