import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "../..");
const defaultQuestionBankFile = path.join(projectRoot, "src", "data", "questions.ts");
const defaultBackupDir = path.join(scriptDir, "backups");

function isImportedQuestion(question) {
  return question?.imported === true || question?.source === "mineru-question-import";
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function locateQuizArray(source) {
  const marker = "export const quizQuestions: QuizQuestion[] =";
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error("未找到 quizQuestions 正式题库数组。");
  const start = source.indexOf("[", markerIndex + marker.length);
  if (start < 0) throw new Error("无法定位 quizQuestions 数组起点。");

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === "\"") inString = false;
      continue;
    }
    if (character === "\"") inString = true;
    else if (character === "[") depth += 1;
    else if (character === "]") {
      depth -= 1;
      if (depth === 0) return { start, end: index };
    }
  }
  throw new Error("无法定位 quizQuestions 数组结尾。");
}

function parseQuestionBank(source) {
  const location = locateQuizArray(source);
  const questions = JSON.parse(source.slice(location.start, location.end + 1));
  if (!Array.isArray(questions)) throw new Error("正式题库不是数组结构。");
  return { location, questions };
}

function renderQuestionBank(source, location, questions) {
  return `${source.slice(0, location.start)}${JSON.stringify(questions, null, 2)}${source.slice(location.end + 1)}`;
}

async function atomicWrite(file, content) {
  const temporaryFile = `${file}.tmp-${Date.now()}`;
  try {
    await fs.writeFile(temporaryFile, content, "utf8");
    await fs.rename(temporaryFile, file);
  } catch (error) {
    await fs.rm(temporaryFile, { force: true });
    throw error;
  }
}

function resolvePaths(options = {}) {
  return {
    backupDir: options.backupDir ? path.resolve(options.backupDir) : process.env.QUESTION_BACKUP_DIR ? path.resolve(process.env.QUESTION_BACKUP_DIR) : defaultBackupDir,
    questionBankFile: options.questionBankFile ? path.resolve(options.questionBankFile) : process.env.QUESTION_BANK_FILE ? path.resolve(process.env.QUESTION_BANK_FILE) : defaultQuestionBankFile
  };
}

async function backupQuestionBank(questionBankFile, backupDir, label = "questions") {
  await fs.mkdir(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, `${label}-${timestampForFile()}.ts`);
  await fs.copyFile(questionBankFile, backupFile);
  return backupFile;
}

function relativeToProject(file) {
  return path.relative(projectRoot, file).replaceAll("\\", "/");
}

function normalizePatch(patch) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) throw new Error("patch 必须是对象。");
  const result = {};
  const stringFields = ["subject", "chapter", "type", "difficulty", "stem", "answer", "analysis", "explanation"];
  for (const field of stringFields) {
    if (field in patch) result[field] = String(patch[field] ?? "").trim();
  }
  for (const field of ["tags", "options"]) {
    if (!(field in patch)) continue;
    if (!Array.isArray(patch[field])) throw new Error(`${field} 必须是数组。`);
    result[field] = patch[field].map((value) => String(value).trim()).filter(Boolean);
  }
  if ("stem" in result && !result.stem) throw new Error("题干不能为空。");
  return result;
}

function applyQuestionPatch(question, patch) {
  const next = { ...question };
  if ("subject" in patch) next.subject = patch.subject;
  if ("chapter" in patch) next.chapter = patch.chapter;
  if ("type" in patch) {
    next.type = patch.type;
    next.questionType = patch.type;
  }
  if ("difficulty" in patch) next.difficulty = patch.difficulty;
  if ("tags" in patch) next.tags = patch.tags;
  if ("stem" in patch) next.question = patch.stem;
  if ("options" in patch) next.options = patch.options;
  if ("answer" in patch) next.answer = patch.answer;
  if ("analysis" in patch) next.analysis = patch.analysis;
  if ("explanation" in patch) next.explanation = patch.explanation;
  if ("stem" in patch || "answer" in patch) {
    next.importFingerprint = createHash("sha256")
      .update(`${String(next.sourceFile ?? "").trim()}\n${String(next.question ?? "").replace(/\s+/g, " ").trim()}\n${String(next.answer ?? "").replace(/\s+/g, " ").trim()}`)
      .digest("hex")
      .slice(0, 24);
  }
  return next;
}

async function loadQuestionBank(options = {}) {
  const paths = resolvePaths(options);
  const source = await fs.readFile(paths.questionBankFile, "utf8");
  return { ...paths, source, ...parseQuestionBank(source) };
}

export async function listImportedQuestions(options = {}) {
  const bank = await loadQuestionBank(options);
  const questions = bank.questions.filter(isImportedQuestion);
  const batches = [...new Set(questions.map((question) => question.importBatchId).filter(Boolean))].sort().reverse();
  const sourceFiles = [...new Set(questions.map((question) => question.sourceFile).filter(Boolean))].sort();
  let backups = [];
  try {
    backups = (await fs.readdir(bank.backupDir))
      .filter((file) => /^questions-.*\.ts$/u.test(file))
      .sort()
      .reverse()
      .map((file) => relativeToProject(path.join(bank.backupDir, file)));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return { questions, total: questions.length, batches, sourceFiles, backups };
}

export async function updateImportedQuestion(id, rawPatch, options = {}) {
  const bank = await loadQuestionBank(options);
  const index = bank.questions.findIndex((question) => question?.id === id);
  if (index < 0) throw new Error(`未找到题目：${id}`);
  if (!isImportedQuestion(bank.questions[index])) throw new Error("只允许修改 MinerU 导入题。");
  const patch = normalizePatch(rawPatch);
  const updated = applyQuestionPatch(bank.questions[index], patch);
  const backupFile = await backupQuestionBank(bank.questionBankFile, bank.backupDir);
  bank.questions[index] = updated;
  await atomicWrite(bank.questionBankFile, renderQuestionBank(bank.source, bank.location, bank.questions));
  return { question: updated, backupPath: relativeToProject(backupFile) };
}

export async function deleteImportedQuestion(id, options = {}) {
  const bank = await loadQuestionBank(options);
  const index = bank.questions.findIndex((question) => question?.id === id);
  if (index < 0) throw new Error(`未找到题目：${id}`);
  if (!isImportedQuestion(bank.questions[index])) throw new Error("不允许删除普通题目。");
  const backupFile = await backupQuestionBank(bank.questionBankFile, bank.backupDir);
  bank.questions.splice(index, 1);
  await atomicWrite(bank.questionBankFile, renderQuestionBank(bank.source, bank.location, bank.questions));
  return { deletedCount: 1, backupPath: relativeToProject(backupFile) };
}

export async function deleteImportedQuestionBatch(importBatchId, options = {}) {
  if (!String(importBatchId ?? "").trim()) throw new Error("importBatchId 不能为空。");
  const bank = await loadQuestionBank(options);
  const matches = bank.questions.filter((question) => isImportedQuestion(question) && question.importBatchId === importBatchId);
  if (matches.length === 0) throw new Error(`未找到导入批次：${importBatchId}`);
  const backupFile = await backupQuestionBank(bank.questionBankFile, bank.backupDir);
  bank.questions = bank.questions.filter((question) => !(isImportedQuestion(question) && question.importBatchId === importBatchId));
  await atomicWrite(bank.questionBankFile, renderQuestionBank(bank.source, bank.location, bank.questions));
  return { deletedCount: matches.length, backupPath: relativeToProject(backupFile) };
}

export async function rollbackQuestionBank(backupPath, options = {}) {
  const bank = await loadQuestionBank(options);
  const requested = path.resolve(projectRoot, String(backupPath ?? ""));
  const relative = path.relative(bank.backupDir, requested);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative) || path.extname(requested) !== ".ts") {
    throw new Error("备份路径必须位于 tools/question-importer/backups/。");
  }
  await fs.access(requested);
  const safetyBackup = await backupQuestionBank(bank.questionBankFile, bank.backupDir, "questions-before-rollback");
  const backupContent = await fs.readFile(requested, "utf8");
  parseQuestionBank(backupContent);
  await atomicWrite(bank.questionBankFile, backupContent);
  return {
    restoredFrom: relativeToProject(requested),
    safetyBackupPath: relativeToProject(safetyBackup),
    questionBankPath: relativeToProject(bank.questionBankFile)
  };
}
