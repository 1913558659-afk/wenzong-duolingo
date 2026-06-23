import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "../..");
const draftsFile = process.env.QUESTION_DRAFTS_FILE
  ? path.resolve(process.env.QUESTION_DRAFTS_FILE)
  : path.join(scriptDir, "drafts", "question-drafts.json");
const questionBankFile = process.env.QUESTION_BANK_FILE
  ? path.resolve(process.env.QUESTION_BANK_FILE)
  : path.join(projectRoot, "src", "data", "questions.ts");
const backupDir = process.env.QUESTION_BACKUP_DIR
  ? path.resolve(process.env.QUESTION_BACKUP_DIR)
  : path.join(scriptDir, "backups");
const supportedSubjects = new Set(["history", "politics", "geography", "biology", "math", "english"]);

function extractDrafts(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.drafts)) return payload.drafts;
  if (Array.isArray(payload?.questions)) return payload.questions;
  return [];
}

function stringValue(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function stringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => typeof entry === "string" && entry.trim() ? [entry.trim()] : []);
}

function stripOptionLabel(option) {
  return option.replace(/^[A-DＡ-Ｄ]\s*[.．、]\s*/u, "").trim();
}

function normalizeType(value, options) {
  if (value === "multiple_choice" || value === "single_choice" || value === "fill_blank") return value;
  return options.length >= 2 ? "single_choice" : "fill_blank";
}

function normalizeAnswer(answer, questionType, options) {
  const value = stringValue(answer);
  if (questionType === "single_choice" && /^[A-D]$/i.test(value)) {
    return options[value.toUpperCase().charCodeAt(0) - 65] ?? value;
  }
  if (questionType === "multiple_choice") {
    return [...new Set((value.toUpperCase().match(/[A-D]/g) ?? []))].sort().join("");
  }
  return value;
}

function fingerprintFor(sourceFile, stem, answer) {
  return createHash("sha256")
    .update(`${sourceFile.trim()}\n${stem.replace(/\s+/g, " ").trim()}\n${answer.replace(/\s+/g, " ").trim()}`)
    .digest("hex")
    .slice(0, 24);
}

function timestampForFile(date) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function uniqueId(baseId, existingIds) {
  let candidate = baseId;
  let suffix = 2;
  while (existingIds.has(candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }
  existingIds.add(candidate);
  return candidate;
}

function convertDraft(draft, batchId, createdAt, existingIds) {
  const subject = stringValue(draft.subject);
  const chapter = stringValue(draft.chapter);
  const question = stringValue(draft.stem ?? draft.question);
  const sourceFile = stringValue(draft.sourceFile);
  const options = stringArray(draft.options).map(stripOptionLabel);
  const questionType = normalizeType(draft.type ?? draft.questionType, options);
  const answer = normalizeAnswer(draft.answer, questionType, options);
  const analysis = stringValue(draft.analysis);
  const detail = stringValue(draft.explanation);

  if (!supportedSubjects.has(subject)) return { reason: `不支持的学科：${subject || "unknown"}` };
  if (!chapter || /unknown|待分类|无法识别/i.test(chapter)) return { reason: "章节未确认" };
  if (!question || !answer) return { reason: "题干或答案为空" };
  if (questionType !== "fill_blank" && options.length < 2) return { reason: "选择题选项不足" };
  if (questionType === "multiple_choice" && !/^[A-D]{2,4}$/.test(answer)) return { reason: "多选题答案格式无效" };
  if (questionType === "single_choice" && !options.includes(answer)) return { reason: "单选题答案无法匹配选项" };

  const importFingerprint = fingerprintFor(sourceFile, question, answer);
  const idBase = `mineru-${subject}-${importFingerprint.slice(0, 12)}`;
  return {
    item: {
      id: uniqueId(idBase, existingIds),
      subject,
      chapter,
      type: questionType,
      questionType,
      difficulty: ["easy", "medium", "hard"].includes(draft.difficulty) ? draft.difficulty : "medium",
      question,
      options,
      answer,
      explanation: [analysis, detail].filter(Boolean).join("\n\n") || "暂无解析。",
      tags: [...new Set([...stringArray(draft.tags), "导入题库"])],
      source: "mineru-question-import",
      imported: true,
      importBatchId: batchId,
      importFingerprint,
      sourceFile,
      createdAt
    },
    fingerprint: importFingerprint
  };
}

function renderItems(items) {
  return items
    .map((item) => JSON.stringify(item, null, 2).split("\n").map((line) => `  ${line}`).join("\n"))
    .join(",\n");
}

function insertIntoQuizQuestions(source, items) {
  const arrayStart = source.indexOf("export const quizQuestions: QuizQuestion[] = [");
  if (arrayStart < 0) throw new Error("未找到 quizQuestions 正式题库数组。");
  const arrayEnd = source.lastIndexOf("\n];");
  if (arrayEnd < arrayStart) throw new Error("无法定位 quizQuestions 数组结尾。");
  const existingBody = source.slice(arrayStart, arrayEnd).trimEnd();
  const separator = existingBody.endsWith("[") ? "\n" : ",\n";
  return `${source.slice(0, arrayEnd)}${separator}${renderItems(items)}${source.slice(arrayEnd)}`;
}

async function main() {
  const payload = JSON.parse(await fs.readFile(draftsFile, "utf8"));
  const drafts = extractDrafts(payload);
  const approved = drafts.filter((draft) => draft?.status === "approved");
  console.log(`approved 数量：${approved.length}`);

  if (approved.length === 0) {
    console.log("没有可导入的题目草稿");
    return;
  }

  const source = await fs.readFile(questionBankFile, "utf8");
  const existingIds = new Set([...source.matchAll(/"id"\s*:\s*"([^"]+)"/g)].map((match) => match[1]));
  const existingFingerprints = new Set([...source.matchAll(/"importFingerprint"\s*:\s*"([^"]+)"/g)].map((match) => match[1]));
  const now = new Date();
  const createdAt = now.toISOString();
  const batchId = `mineru-question-${timestampForFile(now)}`;
  const items = [];
  let skipped = 0;

  for (const draft of approved) {
    const converted = convertDraft(draft, batchId, createdAt, existingIds);
    if (!converted.item) {
      skipped += 1;
      console.log(`跳过题目 ${stringValue(draft.id, "unknown")}：${converted.reason}`);
      continue;
    }
    if (existingFingerprints.has(converted.fingerprint)) {
      skipped += 1;
      console.log(`跳过重复题目：${stringValue(draft.id, converted.item.id)}`);
      continue;
    }
    existingFingerprints.add(converted.fingerprint);
    items.push(converted.item);
  }

  if (items.length === 0) {
    console.log("成功导入数量：0");
    console.log(`跳过数量：${skipped}`);
    console.log("没有新的题目需要写入，正式题库未修改。");
    return;
  }

  await fs.mkdir(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, `questions-${timestampForFile(now)}.ts`);
  await fs.copyFile(questionBankFile, backupFile);
  await fs.writeFile(questionBankFile, insertIntoQuizQuestions(source, items), "utf8");

  console.log(`成功导入数量：${items.length}`);
  console.log(`跳过数量：${skipped}`);
  console.log(`备份文件路径：${path.relative(projectRoot, backupFile)}`);
  console.log(`正式题库文件路径：${path.relative(projectRoot, questionBankFile)}`);
  console.log(`导入批次：${batchId}`);
}

main().catch((error) => {
  console.error(`正式题库发布失败：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
