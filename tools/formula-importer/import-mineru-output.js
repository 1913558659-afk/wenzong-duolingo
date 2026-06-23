import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(scriptDir, "mineru-output");
const draftsDir = path.join(scriptDir, "drafts");
const draftsFile = path.join(draftsDir, "formula-drafts.json");

const subjectRules = [
  { subject: "math", pattern: /math|mathematics|数学/i },
  { subject: "physics", pattern: /physics|物理/i },
  { subject: "geography", pattern: /geography|geo|地理/i }
];

const chapterRules = [
  ["函数", /二次函数|函数|function/i],
  ["三角函数", /三角函数|正弦|余弦|triangle|trigonometry/i],
  ["数列", /数列|等差|等比|sequence/i],
  ["解析几何", /解析几何|圆锥曲线|直线与圆|analytic.?geometry/i],
  ["概率统计", /概率|统计|probability|statistics/i],
  ["运动学", /运动学|速度|加速度|kinematics/i],
  ["力学", /力学|牛顿|受力|mechanics/i],
  ["能量", /能量|功率|机械能|energy|work/i],
  ["电学", /电学|电流|电压|电阻|electric/i],
  ["磁场", /磁场|磁感应|magnetic/i],
  ["地球运动", /地球运动|地方时|太阳高度|earth.?motion/i],
  ["地图与比例尺", /比例尺|地图|scale|map/i],
  ["等高线", /等高线|地形图|contour/i],
  ["人口与城市", /人口|城市|population|urban/i],
  ["气候计算", /气候|气温|降水|climate|temperature/i]
];

const displayFormulaPatterns = [
  /\$\$([\s\S]*?)\$\$/g,
  /\\\[([\s\S]*?)\\\]/g,
  /\\\(([\s\S]*?)\\\)/g
];

async function ensureDirectories() {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(draftsDir, { recursive: true });
}

async function collectFiles(directory) {
  const files = [];
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function stringsFromJson(value, result = []) {
  if (typeof value === "string") {
    if (value.trim()) result.push(value);
    return result;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => stringsFromJson(item, result));
    return result;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => stringsFromJson(item, result));
  }
  return result;
}

async function readSource(file) {
  const extension = path.extname(file).toLowerCase();
  const raw = await fs.readFile(file, "utf8");
  if (extension === ".md" || extension === ".markdown") return normalizeSourceText(raw);

  if (extension === ".json") {
    try {
      return normalizeSourceText(stringsFromJson(JSON.parse(raw)).join("\n\n"));
    } catch (error) {
      console.warn(`跳过无法解析的 JSON：${relativePath(file)} (${error.message})`);
      return "";
    }
  }
  return "";
}

function normalizeSourceText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/([。；;])\s*(?=(?:易错点?|注意|提醒|警惕|例题|示例|举例)[：:])/gu, "$1\n")
    .replace(/(?<!^)(?=(?:易错点?|注意|提醒|警惕|例题|示例|举例)[：:])/gmu, "\n");
}

function inferSubject(file) {
  const normalized = `/${relativePath(file).replaceAll("\\", "/")}/`;
  return subjectRules.find((rule) => rule.pattern.test(normalized))?.subject ?? "unknown";
}

function inferChapter(file, context) {
  const haystack = `${relativePath(file)} ${context}`;
  return chapterRules.find(([, pattern]) => pattern.test(haystack))?.[0] ?? "待分类";
}

function cleanLatex(value) {
  return value
    .replace(/\r/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[，。；;：:]+$/u, "")
    .trim();
}

function looksLikeEquationLine(line) {
  const value = line.trim()
    .replace(/^[-*+]\s+/, "")
    .replace(/^>\s*/, "")
    .replace(/^`|`$/g, "");

  if (!value || value.length > 180 || !value.includes("=")) return false;
  if (/https?:\/\/|=>|===|!==|==/.test(value)) return false;
  if (/^[\p{L}\p{N}_{}\\^+\-*/().,\s°%]+=[\p{L}\p{N}_{}\\^+\-*/().,\s°%]+$/u.test(value)) {
    return /[A-Za-z\\_^]|比例尺|密度|速度|距离|时间|面积|人口|气温/u.test(value);
  }
  return false;
}

function extractFormulaMatches(text) {
  const matches = [];

  for (const pattern of displayFormulaPatterns) {
    for (const match of text.matchAll(pattern)) {
      const latex = cleanLatex(match[1]);
      if (latex) matches.push({ index: match.index ?? 0, latex });
    }
  }

  let offset = 0;
  for (const line of text.split("\n")) {
    if (looksLikeEquationLine(line) && !line.includes("$$") && !line.includes("\\(") && !line.includes("\\[")) {
      const latex = cleanLatex(line.replace(/^[-*+>]\s*/, "").replace(/^`|`$/g, ""));
      matches.push({ index: offset, latex });
    }
    offset += line.length + 1;
  }

  return matches.sort((a, b) => a.index - b.index);
}

function contextAround(text, index, radius = 420) {
  return text.slice(Math.max(0, index - radius), Math.min(text.length, index + radius));
}

function linesAround(text, index, before = 6, after = 10) {
  const prefix = text.slice(0, index);
  const lineIndex = prefix.split("\n").length - 1;
  const lines = text.split("\n");
  return lines.slice(Math.max(0, lineIndex - before), Math.min(lines.length, lineIndex + after + 1));
}

function cleanTextLine(line) {
  return line
    .replace(/^#{1,6}\s*/, "")
    .replace(/^[-*+>]\s*/, "")
    .replace(/[`*]/g, "")
    .replace(/\$\$|\\\[|\\\]|\\\(|\\\)/g, "")
    .trim();
}

function inferTitle(lines, latex) {
  const formulaIndex = lines.findIndex((line) => line.includes(latex) || line.includes("$$") || line.includes("\\["));
  const preceding = formulaIndex >= 0 ? lines.slice(0, formulaIndex).reverse() : [...lines].reverse();
  const heading = preceding.find((line) => /^#{1,6}\s+\S/.test(line));
  if (heading) return cleanTextLine(heading).slice(0, 60);

  const named = preceding.find((line) => /公式|定理|定律|计算|关系式|表达式/u.test(line) && cleanTextLine(line).length <= 60);
  if (named) return cleanTextLine(named).slice(0, 60);

  const leftSide = latex.split("=")[0]?.replace(/\\text\{([^}]*)\}/g, "$1").trim();
  return leftSide ? `${leftSide} 公式` : "待命名公式";
}

function inferScene(lines, title) {
  const candidates = lines
    .map(cleanTextLine)
    .filter((line) => line && line !== title && line.length >= 8 && line.length <= 140)
    .filter((line) => !looksLikeEquationLine(line))
    .filter((line) => !/易错|注意|提醒|例题|示例|答案|变量|式中|其中/u.test(line));
  return candidates[0] ?? "待人工补充适用场景。";
}

function inferVariables(lines, latex) {
  const contextLines = lines
    .map(cleanTextLine)
    .filter((line) => /变量|式中|其中|表示|代表|为/u.test(line));
  const symbols = [...new Set(
    latex
      .replace(/\\(?:frac|text|sin|cos|tan|Delta|approx|times|circ|left|right)\b/g, " ")
      .match(/[A-Za-z](?:_[A-Za-z0-9{}]+)?/g) ?? []
  )].slice(0, 8);

  return symbols.map((symbol) => {
    const related = contextLines.find((line) => line.includes(symbol.replace(/[{}]/g, "")));
    return {
      symbol,
      meaning: related ?? "待人工补充"
    };
  });
}

function inferMistakes(lines, latex) {
  const results = [];
  const formulaIndex = lines.findIndex((line) => line.includes(latex) || line.includes("$$") || line.includes("\\["));
  lines.map(cleanTextLine).forEach((line, index, allLines) => {
    if (index >= Math.max(0, formulaIndex) && /易错|注意|提醒|警惕/u.test(line)) {
      const value = line.replace(/^.*?(?:易错点?|注意|提醒|警惕)[：:\s]*/u, "").trim();
      if (value) results.push(value);
      else if (allLines[index + 1]) results.push(allLines[index + 1]);
    }
  });
  return [...new Set(results)].slice(0, 5);
}

function inferExample(lines, latex) {
  const cleaned = lines.map(cleanTextLine);
  const formulaIndex = lines.findIndex((line) => line.includes(latex) || line.includes("$$") || line.includes("\\["));
  const searchStart = formulaIndex >= 0 ? formulaIndex : 0;
  const markedIndex = cleaned.findIndex((line, index) => index >= searchStart && /^(?:例题|示例|例|举例)[：:\s]?/u.test(line));
  if (markedIndex < 0) return "待人工补充示例题。";
  const sameLine = cleaned[markedIndex].replace(/^(?:例题|示例|例|举例)[：:\s]?/u, "").trim();
  return sameLine || cleaned[markedIndex + 1] || "待人工补充示例题。";
}

function createDraft(file, text, match) {
  const lines = linesAround(text, match.index);
  const context = contextAround(text, match.index);
  const title = inferTitle(lines, match.latex);
  const subject = inferSubject(file);
  const sourceFile = relativePath(file);
  const hash = createHash("sha1")
    .update(`${sourceFile}:${match.latex}`)
    .digest("hex")
    .slice(0, 12);

  return {
    id: `formula-draft-${hash}`,
    subject,
    chapter: inferChapter(file, context),
    title,
    latex: match.latex,
    scene: inferScene(lines, title),
    variables: inferVariables(lines, match.latex),
    mistakes: inferMistakes(lines, match.latex),
    example: inferExample(lines, match.latex),
    sourceFile,
    status: "draft"
  };
}

function relativePath(file) {
  return path.relative(scriptDir, file).replaceAll("\\", "/");
}

async function main() {
  await ensureDirectories();
  const files = await collectFiles(outputDir);
  const markdownFiles = files
    .filter((file) => [".md", ".markdown"].includes(path.extname(file).toLowerCase()))
    .sort();
  const jsonFiles = files
    .filter((file) => path.extname(file).toLowerCase() === ".json")
    .sort();
  const sourceFiles = [...markdownFiles, ...jsonFiles];
  const draftMap = new Map();

  for (const file of sourceFiles) {
    const text = await readSource(file);
    if (!text) continue;

    for (const match of extractFormulaMatches(text)) {
      const draft = createDraft(file, text, match);
      const dedupeKey = `${draft.subject}:${draft.latex.replace(/\s+/g, "")}`;
      if (!draftMap.has(dedupeKey)) draftMap.set(dedupeKey, draft);
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceDirectory: relativePath(outputDir),
    scannedFiles: sourceFiles.map(relativePath),
    draftCount: draftMap.size,
    drafts: [...draftMap.values()]
  };

  await fs.writeFile(draftsFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`扫描 Markdown：${markdownFiles.length} 个`);
  console.log(`扫描 JSON：${jsonFiles.length} 个`);
  console.log(`生成公式草稿：${draftMap.size} 条`);
  console.log(`输出：${relativePath(draftsFile)}`);
}

main().catch((error) => {
  console.error("公式草稿导入失败：", error);
  process.exitCode = 1;
});
