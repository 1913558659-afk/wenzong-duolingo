import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "../..");
const inputDir = path.join(scriptDir, "input");
const mineruOutputDir = path.join(scriptDir, "mineru-output");
const draftsFile = path.join(scriptDir, "drafts", "formula-drafts.json");
const importerScript = path.join(scriptDir, "import-mineru-output.js");

export async function assertPdf(sourcePath) {
  let stat;
  try {
    stat = await fs.stat(sourcePath);
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`输入 PDF 不存在：${sourcePath}`);
    }
    throw error;
  }

  if (!stat.isFile()) {
    throw new Error(`输入路径不是文件：${sourcePath}`);
  }
  if (path.extname(sourcePath).toLowerCase() !== ".pdf") {
    throw new Error(`当前一键导入只接受 PDF 文件：${sourcePath}`);
  }
}

export async function clearDirectoryPreservingGitkeep(directory) {
  await fs.mkdir(directory, { recursive: true });
  const entries = await fs.readdir(directory, { withFileTypes: true });
  await Promise.all(entries
    .filter((entry) => entry.name !== ".gitkeep")
    .map((entry) => fs.rm(path.join(directory, entry.name), { force: true, recursive: true })));
}

export function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env: process.env,
      stdio: "inherit",
      ...options
    });

    child.once("error", (error) => {
      if (error?.code === "ENOENT") {
        reject(new Error(`无法运行 ${command}。请确认 MinerU 已安装，并且命令已加入 PATH。`));
        return;
      }
      reject(error);
    });
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} 执行失败${signal ? `，信号 ${signal}` : `，退出码 ${code ?? "未知"}`}`));
    });
  });
}

function extractDrafts(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.drafts)) return parsed.drafts;
  if (Array.isArray(parsed?.formulas)) return parsed.formulas;
  return [];
}

export async function readImportSummary() {
  const raw = await fs.readFile(draftsFile, "utf8");
  const parsed = JSON.parse(raw);
  const scannedFiles = Array.isArray(parsed?.scannedFiles) ? parsed.scannedFiles : [];
  const drafts = extractDrafts(parsed);

  return {
    draftCount: typeof parsed?.draftCount === "number" ? parsed.draftCount : drafts.length,
    jsonCount: scannedFiles.filter((file) => path.extname(file).toLowerCase() === ".json").length,
    markdownCount: scannedFiles.filter((file) => [".md", ".markdown"].includes(path.extname(file).toLowerCase())).length
  };
}

export async function runFullImport(sourceArgument, options = {}) {
  const logger = options.logger ?? console;
  const onStatus = options.onStatus ?? (() => {});
  const sourcePath = path.resolve(sourceArgument);
  await assertPdf(sourcePath);
  logger.log(`输入 PDF 路径：${sourcePath}`);

  const temporaryDir = await fs.mkdtemp(path.join(os.tmpdir(), "sayhi-formula-import-"));
  const temporaryPdf = path.join(temporaryDir, path.basename(sourcePath));
  const targetPdf = path.join(inputDir, path.basename(sourcePath));

  try {
    await fs.copyFile(sourcePath, temporaryPdf);
    await clearDirectoryPreservingGitkeep(inputDir);
    await clearDirectoryPreservingGitkeep(mineruOutputDir);
    await fs.copyFile(temporaryPdf, targetPdf);

    logger.log("已清理旧临时文件并复制 PDF。");
    logger.log("正在运行 MinerU...");
    onStatus("parsing");

    const mineruCommand = process.env.MINERU_BIN || "mineru";
    await runCommand(mineruCommand, [
      "-p",
      targetPdf,
      "-o",
      mineruOutputDir,
      "-b",
      "pipeline"
    ]);
    logger.log("MinerU 是否成功：是");

    logger.log("正在生成公式草稿...");
    onStatus("drafting");
    await runCommand(process.execPath, [importerScript]);

    const summary = await readImportSummary();
    const result = {
      ...summary,
      draftPath: path.relative(projectRoot, draftsFile),
      fileName: path.basename(sourcePath),
      inputPath: sourcePath,
      mineruSucceeded: true
    };
    onStatus("completed");
    logger.log("");
    logger.log("公式导入完成");
    logger.log(`输入 PDF 路径：${sourcePath}`);
    logger.log("MinerU 是否成功：是");
    logger.log(`扫描 Markdown 数量：${summary.markdownCount}`);
    logger.log(`扫描 JSON 数量：${summary.jsonCount}`);
    logger.log(`生成草稿数量：${summary.draftCount}`);
    logger.log(`草稿文件：${result.draftPath}`);
    logger.log("下一步：打开 formula-drafts.json 审核；将确认正确的条目改为 approved 后，运行：");
    logger.log("node tools/formula-importer/export-drafts-to-formula-data.js");
    return result;
  } finally {
    await fs.rm(temporaryDir, { force: true, recursive: true });
  }
}

async function main() {
  const sourceArgument = process.argv[2];
  if (!sourceArgument) {
    throw new Error('缺少 PDF 路径。用法：npm run formula:import -- "/path/to/file.pdf"');
  }
  await runFullImport(sourceArgument);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`公式一键导入失败：${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
