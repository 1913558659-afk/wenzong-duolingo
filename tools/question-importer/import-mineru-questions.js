import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.QUESTION_MINERU_OUTPUT_DIR
  ? path.resolve(process.env.QUESTION_MINERU_OUTPUT_DIR)
  : path.join(scriptDir, "mineru-output");
const draftsDir = path.join(scriptDir, "drafts");
const draftsFile = path.join(draftsDir, "question-drafts.json");

const subjectRules = [
  ["math", /数学|函数|数列|几何|概率|方程|不等式|导数|三角/i],
  ["physics", /物理|力学|运动学|电学|磁场|能量|光学/i],
  ["geography", /地理|气候|人口|城市|地图|经纬|地球运动/i],
  ["biology", /生物|细胞|遗传|生态|代谢/i],
  ["english", /英语|english|grammar|vocabulary/i],
  ["history", /历史|朝代|战争|革命|文明/i],
  ["politics", /政治|哲学|经济生活|法律|思想政治/i]
];

const chapterRules = [
  ["函数", /函数|定义域|值域|function/i],
  ["三角函数", /三角函数|正弦|余弦|正切/i],
  ["数列", /数列|等差|等比/i],
  ["解析几何", /解析几何|圆锥曲线|直线与圆/i],
  ["概率统计", /概率|统计/i],
  ["运动学", /运动学|速度|加速度/i],
  ["力学", /力学|牛顿|受力/i],
  ["能量", /能量|功率|机械能/i],
  ["电学", /电学|电流|电压|电阻/i],
  ["磁场", /磁场|磁感应/i],
  ["地球运动", /地球运动|地方时|太阳高度/i],
  ["地图与比例尺", /比例尺|地图/i],
  ["人口与城市", /人口|城市/i],
  ["气候计算", /气候|气温|降水/i]
];

async function collectFiles(directory) {
  const files = [];
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return files;
    throw error;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function stringsFromJson(value, result = []) {
  if (typeof value === "string") {
    if (value.trim()) result.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((entry) => stringsFromJson(entry, result));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((entry) => stringsFromJson(entry, result));
  }
  return result;
}

async function readSource(file) {
  const raw = await fs.readFile(file, "utf8");
  if ([".md", ".markdown"].includes(path.extname(file).toLowerCase())) return normalizeText(raw);
  try {
    return normalizeText(stringsFromJson(JSON.parse(raw)).join("\n\n"));
  } catch (error) {
    console.warn(`跳过无法解析的 JSON：${relativePath(file)} (${error.message})`);
    return "";
  }
}

function normalizeText(text) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitQuestionBlocks(text) {
  const pattern = /^(?:#{1,6}\s*)?(\d{1,3})\s*[．.、]\s*/gmu;
  const matches = [...text.matchAll(pattern)];
  return matches.map((match, index) => ({
    number: match[1],
    text: text.slice((match.index ?? 0) + match[0].length, matches[index + 1]?.index ?? text.length).trim()
  })).filter((block) => block.text);
}

function sectionValue(block, label, nextLabels) {
  const next = nextLabels.map((item) => `【${item}】`).join("|");
  const pattern = new RegExp(`【${label}】\\s*([\\s\\S]*?)(?=${next ? `(?:${next})|` : ""}$)`, "u");
  return cleanSection(block.match(pattern)?.[1] ?? "");
}

function cleanSection(value) {
  return value.replace(/\n{3,}/g, "\n\n").trim();
}

function parseStemAndOptions(value) {
  const markers = [...value.matchAll(/([A-DＡ-Ｄ])\s*[．.、]\s*/gmu)].map((match) => ({
    contentStart: (match.index ?? 0) + match[0].length,
    index: match.index ?? 0,
    label: match[1],
    markerStart: match.index ?? 0
  }));
  if (markers.length < 2) return { stem: cleanSection(value), options: [] };

  const options = markers.map((match, index) => {
    const label = normalizeOptionLabel(match.label);
    const start = match.contentStart;
    const end = markers[index + 1]?.index ?? value.length;
    return `${label}. ${cleanSection(value.slice(start, end))}`;
  }).filter((option) => option.length > 3);

  return {
    stem: cleanSection(value.slice(0, markers[0].markerStart)),
    options
  };
}

function normalizeOptionLabel(value) {
  return String.fromCharCode("ＡＢＣＤ".indexOf(value) >= 0 ? 65 + "ＡＢＣＤ".indexOf(value) : value.charCodeAt(0));
}

function inferSubject(file, text) {
  const haystack = `${relativePath(file)} ${text.slice(0, 1200)}`;
  return subjectRules.find(([, pattern]) => pattern.test(haystack))?.[0] ?? "unknown";
}

function inferChapter(file, text) {
  const haystack = `${relativePath(file)} ${text}`;
  return chapterRules.find(([, pattern]) => pattern.test(haystack))?.[0] ?? "unknown";
}

function inferType(block, options, answer) {
  if (options.length < 2) return "fill_blank";
  const answerLetters = (answer.match(/[A-D]/gi) ?? []).length;
  return /多选|multiple/i.test(block) || answerLetters > 1 ? "multiple_choice" : "single_choice";
}

function inferTags(stem, chapter, type) {
  const tags = new Set();
  if (chapter !== "unknown") tags.add(chapter);
  if (type === "multiple_choice") tags.add("多选题");
  else if (type === "single_choice") tags.add("选择题");
  else tags.add("填空题");
  ["定义域", "值域", "同一函数", "充分条件", "必要条件", "集合", "不等式"].forEach((tag) => {
    if (stem.includes(tag)) tags.add(tag);
  });
  return [...tags].slice(0, 6);
}

function createDraft(file, number, block) {
  const stemPart = block.split(/【(?:答案|分析|详解)】/u)[0].trim();
  const { stem, options } = parseStemAndOptions(stemPart);
  const answer = sectionValue(block, "答案", ["分析", "详解"]);
  const analysis = sectionValue(block, "分析", ["详解"]);
  const explanation = sectionValue(block, "详解", []);
  const subject = inferSubject(file, `${stem} ${analysis}`);
  const chapter = inferChapter(file, `${stem} ${analysis}`);
  const type = inferType(block, options, answer);
  const sourceFile = relativePath(file);
  const hash = createHash("sha1").update(`${sourceFile}:${number}:${stem}`).digest("hex").slice(0, 12);

  return {
    id: `question-draft-${hash}`,
    subject,
    chapter,
    type,
    difficulty: "medium",
    tags: inferTags(stem, chapter, type),
    stem,
    options,
    answer,
    analysis,
    explanation,
    sourceFile,
    status: "draft"
  };
}

function relativePath(file) {
  return path.relative(scriptDir, file).replaceAll("\\", "/");
}

export async function importMineruQuestions() {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(draftsDir, { recursive: true });
  const files = await collectFiles(outputDir);
  const markdownFiles = files.filter((file) => [".md", ".markdown"].includes(path.extname(file).toLowerCase())).sort();
  const jsonFiles = files.filter((file) => path.extname(file).toLowerCase() === ".json").sort();
  const sourceFiles = markdownFiles.length > 0 ? markdownFiles : jsonFiles;
  const draftMap = new Map();

  for (const file of sourceFiles) {
    const text = await readSource(file);
    for (const block of splitQuestionBlocks(text)) {
      const draft = createDraft(file, block.number, block.text);
      if (draft.stem.length < 2) continue;
      const key = draft.stem.replace(/\s+/g, "").slice(0, 240);
      if (!draftMap.has(key)) draftMap.set(key, draft);
    }
  }

  const drafts = [...draftMap.values()];
  const payload = {
    generatedAt: new Date().toISOString(),
    sourceDirectory: relativePath(outputDir),
    scannedFiles: sourceFiles.map(relativePath),
    markdownCount: markdownFiles.length,
    jsonCount: jsonFiles.length,
    draftCount: drafts.length,
    drafts
  };
  await fs.writeFile(draftsFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`扫描 Markdown：${markdownFiles.length} 个`);
  console.log(`扫描 JSON：${jsonFiles.length} 个`);
  console.log(`生成题目草稿：${drafts.length} 条`);
  console.log(`输出：${relativePath(draftsFile)}`);
  return payload;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  importMineruQuestions().catch((error) => {
    console.error(`题目草稿导入失败：${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
