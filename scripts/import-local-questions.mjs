import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const defaultInputPath = path.join(rootDir, "dist/question-import/local-questions-export.new.json");
const inputPath = process.argv[2] ? path.resolve(rootDir, process.argv[2]) : defaultInputPath;

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

function apiUrl(pathname) {
  const rawBaseUrl = readEnvValue("API_BASE_URL") || readEnvValue("VITE_API_BASE_URL");
  if (!rawBaseUrl || rawBaseUrl.startsWith("/")) {
    throw new Error("请设置完整 API_BASE_URL，例如 API_BASE_URL=http://47.239.150.109:3000");
  }
  const baseUrl = rawBaseUrl.replace(/\/$/, "");
  return `${baseUrl}${pathname}`;
}

async function request(pathname, options = {}) {
  const response = await fetch(apiUrl(pathname), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${response.status} ${data?.message ?? "请求失败"}`);
  }
  return data;
}

const token = process.env.ADMIN_TOKEN;
if (!token) {
  throw new Error("请先设置 ADMIN_TOKEN，例如 ADMIN_TOKEN=你的管理员JWT");
}

if (!existsSync(inputPath)) {
  throw new Error(`导入文件不存在：${inputPath}。请先运行 node scripts/export-local-questions.mjs`);
}

const questions = JSON.parse(readFileSync(inputPath, "utf8"));
let importedCount = 0;
let failedCount = 0;
const failures = [];

console.log(`[SayHiStudy] 准备导入 ${questions.length} 题：${inputPath}`);

for (const question of questions) {
  try {
    await request("/api/admin/questions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(question)
    });
    importedCount += 1;
  } catch (error) {
    failedCount += 1;
    failures.push({
      questionCode: question.questionCode,
      error: error instanceof Error ? error.message : "导入失败"
    });
  }
}

console.log(`[SayHiStudy] 导入完成 imported=${importedCount}, failed=${failedCount}`);
if (failures.length > 0) {
  console.log(JSON.stringify(failures.slice(0, 20), null, 2));
}
