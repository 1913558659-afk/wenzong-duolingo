import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertPdf,
  clearDirectoryPreservingGitkeep,
  runCommand
} from "../formula-importer/run-full-import.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "../..");
const inputDir = path.join(scriptDir, "input");
const outputDir = path.join(scriptDir, "mineru-output");
const draftsFile = path.join(scriptDir, "drafts", "question-drafts.json");
const importerScript = path.join(scriptDir, "import-mineru-questions.js");

function extractDrafts(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.drafts)) return payload.drafts;
  if (Array.isArray(payload?.questions)) return payload.questions;
  return [];
}

export async function runQuestionImport(sourceArgument) {
  const sourcePath = path.resolve(sourceArgument);
  await assertPdf(sourcePath);
  const temporaryDir = await fs.mkdtemp(path.join(os.tmpdir(), "sayhi-question-import-"));
  const temporaryPdf = path.join(temporaryDir, path.basename(sourcePath));
  const targetPdf = path.join(inputDir, path.basename(sourcePath));

  try {
    await fs.copyFile(sourcePath, temporaryPdf);
    await clearDirectoryPreservingGitkeep(inputDir);
    await clearDirectoryPreservingGitkeep(outputDir);
    await fs.copyFile(temporaryPdf, targetPdf);

    console.log(`输入 PDF 路径：${sourcePath}`);
    console.log("正在运行 MinerU...");
    await runCommand(process.env.MINERU_BIN || "mineru", [
      "-p",
      targetPdf,
      "-o",
      outputDir,
      "-b",
      "pipeline"
    ]);
    console.log("MinerU 是否成功：是");
    console.log("正在生成题目草稿...");
    await runCommand(process.execPath, [importerScript]);

    const payload = JSON.parse(await fs.readFile(draftsFile, "utf8"));
    const draftCount = extractDrafts(payload).length;
    console.log("");
    console.log("题库导入完成");
    console.log(`生成题目数量：${draftCount}`);
    console.log(`草稿文件：${path.relative(projectRoot, draftsFile)}`);
    console.log("下一步：打开 question-drafts.json 人工审核，不会自动发布题目。");
    return { draftCount, draftPath: path.relative(projectRoot, draftsFile) };
  } finally {
    await fs.rm(temporaryDir, { force: true, recursive: true });
  }
}

async function main() {
  const sourceArgument = process.argv[2];
  if (!sourceArgument) {
    throw new Error('缺少 PDF 路径。用法：npm run question:import -- "/path/to/file.pdf"');
  }
  await runQuestionImport(sourceArgument);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`题库一键导入失败：${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
