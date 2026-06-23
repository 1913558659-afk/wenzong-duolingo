import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "../..");
const draftsFile = process.env.QUESTION_DRAFTS_FILE
  ? path.resolve(process.env.QUESTION_DRAFTS_FILE)
  : path.join(scriptDir, "drafts", "question-drafts.json");
const outputFile = process.env.QUESTION_IMPORT_OUTPUT_FILE
  ? path.resolve(process.env.QUESTION_IMPORT_OUTPUT_FILE)
  : path.join(projectRoot, "src", "data", "importedQuestionData.ts");

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
  return value.flatMap((entry) => {
    if (typeof entry === "string") return entry.trim() ? [entry.trim()] : [];
    if (!entry || typeof entry !== "object") return [];
    const label = stringValue(entry.label);
    const text = stringValue(entry.text ?? entry.value);
    return text ? [`${label ? `${label}. ` : ""}${text}`] : [];
  });
}

function normalizeType(value, options) {
  if (value === "multiple_choice" || value === "single_choice" || value === "fill_blank") return value;
  return options.length >= 2 ? "single_choice" : "fill_blank";
}

function optionTextForAnswer(answer, options) {
  const normalized = answer.trim().toUpperCase();
  if (!/^[A-D]$/.test(normalized)) return answer;
  const option = options[normalized.charCodeAt(0) - 65];
  return option ? option.replace(/^[A-D][.．、]\s*/u, "").trim() : answer;
}

function convertDraft(draft, index) {
  const options = stringArray(draft.options);
  const questionType = normalizeType(draft.type ?? draft.questionType, options);
  const rawAnswer = stringValue(draft.answer);
  const analysis = stringValue(draft.analysis);
  const detailedExplanation = stringValue(draft.explanation);
  const explanation = [analysis, detailedExplanation].filter(Boolean).join("\n\n");

  return {
    id: stringValue(draft.id, `imported-question-${index + 1}`).replace(/^question-draft-/, "imported-question-"),
    subject: stringValue(draft.subject, "unknown"),
    chapter: stringValue(draft.chapter, "unknown"),
    questionType,
    difficulty: ["easy", "medium", "hard"].includes(draft.difficulty) ? draft.difficulty : "medium",
    question: stringValue(draft.stem ?? draft.question),
    options,
    answer: questionType === "single_choice" ? optionTextForAnswer(rawAnswer, options) : rawAnswer,
    explanation,
    analysis,
    tags: stringArray(draft.tags),
    sourceFile: stringValue(draft.sourceFile),
    imported: true
  };
}

function renderOutput(items) {
  return `export type ImportedQuestionType = "single_choice" | "multiple_choice" | "fill_blank";

export type ImportedQuestionItem = {
  id: string;
  subject: string;
  chapter: string;
  questionType: ImportedQuestionType;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  analysis: string;
  tags: string[];
  sourceFile: string;
  imported: true;
};

export const importedQuestionData: ImportedQuestionItem[] = ${JSON.stringify(items, null, 2)};
`;
}

async function main() {
  let payload;
  try {
    payload = JSON.parse(await fs.readFile(draftsFile, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`题目草稿文件不存在：${path.relative(projectRoot, draftsFile)}`);
    }
    throw error;
  }

  const drafts = extractDrafts(payload);
  const approved = drafts.filter((draft) => draft?.status === "approved");
  const imported = approved.map(convertDraft);
  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, renderOutput(imported), "utf8");

  console.log(`草稿总数：${drafts.length}`);
  console.log(`approved 数量：${approved.length}`);
  console.log(`输出文件：${path.relative(projectRoot, outputFile)}`);
  if (approved.length === 0) console.log("没有可导入的题目草稿");
}

main().catch((error) => {
  console.error(`题目草稿导出失败：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
