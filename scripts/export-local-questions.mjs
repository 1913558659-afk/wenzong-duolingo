import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const sourcePath = path.join(rootDir, "src/data/questions.ts");
const outputDir = path.join(rootDir, "dist/question-import");
const jsonPath = path.join(outputDir, "local-questions-export.json");
const markdownPath = path.join(outputDir, "local-questions-export.md");
const newJsonPath = path.join(outputDir, "local-questions-export.new.json");
const newMarkdownPath = path.join(outputDir, "local-questions-export.new.md");
const reportPath = path.join(outputDir, "local-questions-export.report.json");

const subjectMap = {
  history: { code: "history", name: "历史" },
  politics: { code: "politics", name: "政治" },
  geography: { code: "geography", name: "地理" }
};

const chapterCodeMap = {
  先秦时期: "pre-qin",
  秦汉时期: "qin-han",
  秦汉魏晋时期: "qin-han-wei-jin",
  魏晋南北朝: "wei-jin-nan-bei",
  隋唐时期: "sui-tang",
  隋唐宋元时期: "sui-tang-song-yuan",
  宋元时期: "song-yuan",
  明清时期: "ming-qing",
  晚清时期: "late-qing",
  中国近代史: "modern-china",
  世界史: "world-history",
  地球运动与生活: "earth-movement-life",
  大气受热过程: "atmosphere-heating"
};

function readEnvValue(key) {
  if (process.env[key]) {
    return process.env[key];
  }

  for (const file of [".env.local", ".env", ".env.production"]) {
    const envPath = path.join(rootDir, file);
    if (!existsSync(envPath)) {
      continue;
    }

    const match = readFileSync(envPath, "utf8").match(new RegExp(`^${key}=(.+)$`, "m"));
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return "";
}

function extractQuizQuestions() {
  const text = readFileSync(sourcePath, "utf8");
  const marker = "export const quizQuestions";
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) {
    throw new Error("没有找到 export const quizQuestions");
  }

  const assignmentIndex = text.indexOf("=", markerIndex);
  if (assignmentIndex < 0) {
    throw new Error("没有找到 quizQuestions 赋值符号");
  }

  const start = text.indexOf("[", assignmentIndex);
  if (start < 0) {
    throw new Error("没有找到 quizQuestions 数组开始位置");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      escaped = char === "\\" && !escaped;
      if (char === "\"" && !escaped) {
        inString = false;
      }
      if (char !== "\\") {
        escaped = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }
    if (char === "[") {
      depth += 1;
    }
    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(text.slice(start, index + 1));
      }
    }
  }

  throw new Error("没有正确解析 quizQuestions 数组");
}

function normalizeSubject(subject) {
  const value = String(subject ?? "").trim().toLowerCase();
  if (value.includes("politics") || value.includes("政治")) {
    return subjectMap.politics;
  }
  if (value.includes("geography") || value.includes("地理")) {
    return subjectMap.geography;
  }
  return subjectMap.history;
}

function normalizeDifficulty(value) {
  return value === "easy" || value === "medium" || value === "hard" ? value : "medium";
}

function slugify(text) {
  const trimmed = String(text ?? "").trim();
  if (chapterCodeMap[trimmed]) {
    return chapterCodeMap[trimmed];
  }
  return encodeURIComponent(trimmed)
    .replace(/%/g, "")
    .toLowerCase()
    .slice(0, 48) || "uncategorized";
}

function answerLetter(question) {
  const answer = String(question.answer ?? "").trim();
  const direct = answer.toUpperCase();
  if (["A", "B", "C", "D"].includes(direct)) {
    return direct;
  }

  const index = question.options.findIndex((option) => String(option).trim() === answer);
  return ["A", "B", "C", "D"][index] ?? "A";
}

function toPayload(question) {
  const subject = normalizeSubject(question.subject);
  const chapterTitle = String(question.chapter ?? "未分类章节").trim() || "未分类章节";

  return {
    questionCode: String(question.id ?? "").trim(),
    subjectCode: subject.code,
    subjectName: subject.name,
    chapterCode: slugify(chapterTitle),
    chapterTitle,
    stem: String(question.question ?? "").trim(),
    optionA: String(question.options?.[0] ?? "").trim(),
    optionB: String(question.options?.[1] ?? "").trim(),
    optionC: String(question.options?.[2] ?? "").trim(),
    optionD: String(question.options?.[3] ?? "").trim(),
    correctAnswer: answerLetter(question),
    explanation: String(question.explanation ?? "").trim(),
    difficulty: normalizeDifficulty(question.difficulty),
    tags: Array.isArray(question.tags) ? question.tags.map((tag) => String(tag).trim()).filter(Boolean) : []
  };
}

function toMarkdown(question) {
  return [
    `学科：${question.subjectName}`,
    `章节：${question.chapterTitle}`,
    `难度：${question.difficulty}`,
    `标签：${question.tags.join(",")}`,
    "",
    `题干：${question.stem}`,
    `A. ${question.optionA}`,
    `B. ${question.optionB}`,
    `C. ${question.optionC}`,
    `D. ${question.optionD}`,
    `答案：${question.correctAnswer}`,
    `解析：${question.explanation}`,
    "---"
  ].join("\n");
}

function duplicateKey(question) {
  return [
    question.subjectCode,
    question.chapterTitle.replace(/\s+/g, ""),
    question.stem.replace(/\s+/g, ""),
    question.correctAnswer
  ].join("|").toLowerCase();
}

function normalizeBackendQuestion(question) {
  const subject = normalizeSubject(question.subject?.code || question.subject?.name);
  return {
    subjectCode: subject.code,
    chapterTitle: String(question.chapter?.title ?? question.chapter?.code ?? "未分类章节").trim(),
    stem: String(question.stem ?? "").trim(),
    correctAnswer: String(question.correctAnswer ?? "").trim().toUpperCase()
  };
}

async function fetchExistingQuestions() {
  const rawBaseUrl = readEnvValue("API_BASE_URL") || readEnvValue("VITE_API_BASE_URL");
  if (!rawBaseUrl || rawBaseUrl.startsWith("/")) {
    return { questions: [], skipped: true, reason: "未配置可直接访问的完整 API_BASE_URL 或 VITE_API_BASE_URL" };
  }

  const baseUrl = rawBaseUrl.replace(/\/$/, "");
  const firstUrl = `${baseUrl}/api/questions?page=1&limit=100`;
  const first = await fetch(firstUrl).then((response) => response.json());
  const firstQuestions = Array.isArray(first) ? first : first.questions ?? [];
  const totalPages = Array.isArray(first) ? 1 : first.pagination?.totalPages ?? 1;
  const questions = [...firstQuestions];

  for (let page = 2; page <= totalPages; page += 1) {
    const data = await fetch(`${baseUrl}/api/questions?page=${page}&limit=100`).then((response) => response.json());
    questions.push(...(Array.isArray(data) ? data : data.questions ?? []));
  }

  return { questions, skipped: false, reason: "" };
}

const localQuestions = extractQuizQuestions();
const payloads = localQuestions.map(toPayload);
const invalid = payloads
  .map((question, index) => ({ question, index: index + 1 }))
  .filter(({ question }) => !question.questionCode || !question.stem || !question.optionA || !question.optionB || !question.optionC || !question.optionD);

let duplicateCodes = [];
let duplicateByContent = [];
let newQuestions = payloads;
let onlineTotal = null;
let duplicateCheckSkipped = false;
let duplicateCheckReason = "";

try {
  const existingResult = await fetchExistingQuestions();
  duplicateCheckSkipped = existingResult.skipped;
  duplicateCheckReason = existingResult.reason;
  onlineTotal = existingResult.questions.length;

  if (!existingResult.skipped) {
    const existingCodes = new Set(existingResult.questions.map((question) => question.questionCode).filter(Boolean));
    const existingKeys = new Set(existingResult.questions.map((question) => duplicateKey(normalizeBackendQuestion(question))));
    duplicateCodes = payloads.filter((question) => existingCodes.has(question.questionCode)).map((question) => question.questionCode);
    duplicateByContent = payloads.filter((question) => existingKeys.has(duplicateKey(question))).map((question) => question.questionCode);
    const duplicateSet = new Set([...duplicateCodes, ...duplicateByContent]);
    newQuestions = payloads.filter((question) => !duplicateSet.has(question.questionCode));
  }
} catch (error) {
  duplicateCheckSkipped = true;
  duplicateCheckReason = error instanceof Error ? error.message : "线上重复检测失败";
}

mkdirSync(outputDir, { recursive: true });
writeFileSync(jsonPath, `${JSON.stringify(payloads, null, 2)}\n`);
writeFileSync(markdownPath, `${payloads.map(toMarkdown).join("\n")}\n`);
writeFileSync(newJsonPath, `${JSON.stringify(newQuestions, null, 2)}\n`);
writeFileSync(newMarkdownPath, `${newQuestions.map(toMarkdown).join("\n")}\n`);
writeFileSync(reportPath, `${JSON.stringify({
  localTotal: payloads.length,
  onlineTotal,
  duplicateCheckSkipped,
  duplicateCheckReason,
  duplicateCodeCount: duplicateCodes.length,
  duplicateContentCount: duplicateByContent.length,
  invalidCount: invalid.length,
  newCount: newQuestions.length,
  duplicateCodes,
  duplicateByContent,
  invalid: invalid.map(({ index, question }) => ({ index, questionCode: question.questionCode }))
}, null, 2)}\n`);

console.log(`[SayHiStudy] 本地题库 ${payloads.length} 题`);
console.log(`[SayHiStudy] 线上题库 ${onlineTotal ?? "未检测"} 题`);
console.log(`[SayHiStudy] 重复检测${duplicateCheckSkipped ? `已跳过：${duplicateCheckReason}` : "完成"}`);
console.log(`[SayHiStudy] 重复 questionCode ${duplicateCodes.length} 题，重复内容 ${duplicateByContent.length} 题，问题数据 ${invalid.length} 题`);
console.log(`[SayHiStudy] 准备新增 ${newQuestions.length} 题`);
console.log(`[SayHiStudy] JSON: ${jsonPath}`);
console.log(`[SayHiStudy] Markdown: ${markdownPath}`);
console.log(`[SayHiStudy] 新增 JSON: ${newJsonPath}`);
console.log(`[SayHiStudy] 新增 Markdown: ${newMarkdownPath}`);
console.log(`[SayHiStudy] 报告: ${reportPath}`);
