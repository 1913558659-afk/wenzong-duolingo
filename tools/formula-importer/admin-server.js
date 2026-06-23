import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { runFullImport } from "./run-full-import.js";

const host = "127.0.0.1";
const port = Number(process.env.FORMULA_ADMIN_PORT || 8787);
const maxPdfBytes = 30 * 1024 * 1024;
const maxRequestBytes = maxPdfBytes + 1024 * 1024;
const draftsFile = path.resolve("tools/formula-importer/drafts/formula-drafts.json");
const questionDraftsFile = path.resolve("tools/question-importer/drafts/question-drafts.json");
let importRunning = false;

function allowedOrigin(origin) {
  return typeof origin === "string" && /^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(origin) ? origin : null;
}

function setCorsHeaders(request, response) {
  const origin = allowedOrigin(request.headers.origin);
  if (origin) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(request, response, statusCode, payload) {
  setCorsHeaders(request, response);
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function extractDrafts(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.drafts)) return payload.drafts;
  if (payload && Array.isArray(payload.formulas)) return payload.formulas;
  if (payload && Array.isArray(payload.questions)) return payload.questions;
  return [];
}

async function readDraftsFile(file) {
  try {
    const content = await fs.readFile(file, "utf8");
    return extractDrafts(JSON.parse(content));
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let tooLarge = false;

    request.on("data", (chunk) => {
      total += chunk.length;
      if (total > maxRequestBytes) {
        tooLarge = true;
        chunks.length = 0;
        return;
      }
      if (!tooLarge) chunks.push(chunk);
    });
    request.on("end", () => {
      if (tooLarge) {
        reject(new Error("PDF 文件超过 30MB 限制。"));
        return;
      }
      resolve(Buffer.concat(chunks));
    });
    request.on("error", reject);
  });
}

function sanitizeFileName(fileName) {
  const baseName = path.basename(fileName || "upload.pdf");
  const sanitized = baseName.replace(/[^\p{L}\p{N}._ -]+/gu, "_").trim();
  return sanitized || "upload.pdf";
}

function parseMultipartPdf(body, contentType) {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  const boundary = boundaryMatch?.[1] || boundaryMatch?.[2]?.trim();
  if (!boundary) throw new Error("上传请求缺少 multipart boundary。");

  const boundaryBuffer = Buffer.from(`--${boundary}`);
  let position = 0;

  while (position < body.length) {
    const boundaryIndex = body.indexOf(boundaryBuffer, position);
    if (boundaryIndex < 0) break;
    const partStart = boundaryIndex + boundaryBuffer.length;
    if (body.subarray(partStart, partStart + 2).toString() === "--") break;

    const headersStart = partStart + 2;
    const headersEnd = body.indexOf(Buffer.from("\r\n\r\n"), headersStart);
    if (headersEnd < 0) break;
    const headers = body.subarray(headersStart, headersEnd).toString("utf8");
    const nextBoundary = body.indexOf(boundaryBuffer, headersEnd + 4);
    if (nextBoundary < 0) break;

    const disposition = /content-disposition:\s*form-data;\s*([^\r\n]+)/i.exec(headers)?.[1] ?? "";
    const name = /name="([^"]+)"/i.exec(disposition)?.[1];
    const fileName = /filename="([^"]*)"/i.exec(disposition)?.[1];
    if (name === "file" && fileName) {
      const dataEnd = nextBoundary >= 2 ? nextBoundary - 2 : nextBoundary;
      const data = body.subarray(headersEnd + 4, dataEnd);
      const mimeType = /content-type:\s*([^\r\n]+)/i.exec(headers)?.[1]?.trim().toLowerCase() ?? "";
      return { data, fileName: sanitizeFileName(fileName), mimeType };
    }
    position = nextBoundary;
  }

  throw new Error("未找到名为 file 的 PDF 上传字段。");
}

function validatePdfUpload(file) {
  if (path.extname(file.fileName).toLowerCase() !== ".pdf") {
    throw new Error("只允许上传 .pdf 文件。");
  }
  if (file.data.length === 0) throw new Error("上传的 PDF 为空。");
  if (file.data.length > maxPdfBytes) throw new Error("PDF 文件超过 30MB 限制。");
  if (!["application/pdf", "application/x-pdf", "application/octet-stream", ""].includes(file.mimeType)) {
    throw new Error(`不支持的文件类型：${file.mimeType}`);
  }
  if (file.data.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("文件内容不是有效的 PDF。");
  }
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    setCorsHeaders(request, response);
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.headers.origin && !allowedOrigin(request.headers.origin)) {
    sendJson(request, response, 403, { ok: false, error: "只允许本机 localhost 页面调用此接口。" });
    return;
  }

  if (request.method === "GET" && request.url === "/api/formula-drafts") {
    try {
      const drafts = await readDraftsFile(draftsFile);
      sendJson(request, response, 200, { ok: true, drafts, total: drafts.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendJson(request, response, 500, { ok: false, error: `读取公式草稿失败：${message}` });
    }
    return;
  }

  if (request.method === "GET" && request.url === "/api/question-drafts") {
    try {
      const drafts = await readDraftsFile(questionDraftsFile);
      sendJson(request, response, 200, { ok: true, drafts, total: drafts.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendJson(request, response, 500, { ok: false, error: `读取题目草稿失败：${message}` });
    }
    return;
  }

  if (request.method !== "POST" || request.url !== "/api/formula-import") {
    sendJson(request, response, 404, { ok: false, error: "接口不存在。" });
    return;
  }

  if (importRunning) {
    sendJson(request, response, 409, { ok: false, error: "已有公式导入任务正在运行，请稍后再试。" });
    return;
  }

  const contentLength = Number(request.headers["content-length"] || 0);
  if (contentLength > maxRequestBytes) {
    sendJson(request, response, 413, { ok: false, error: "PDF 文件超过 30MB 限制。" });
    return;
  }
  const contentType = request.headers["content-type"] || "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    sendJson(request, response, 400, { ok: false, error: "请求必须使用 multipart/form-data。" });
    return;
  }

  importRunning = true;
  let temporaryDir;
  try {
    const body = await readRequestBody(request);
    const file = parseMultipartPdf(body, contentType);
    validatePdfUpload(file);

    temporaryDir = await fs.mkdtemp(path.join(os.tmpdir(), "sayhi-formula-upload-"));
    const temporaryPdf = path.join(temporaryDir, file.fileName);
    await fs.writeFile(temporaryPdf, file.data);

    const result = await runFullImport(temporaryPdf);
    sendJson(request, response, 200, {
      ok: true,
      fileName: file.fileName,
      markdownCount: result.markdownCount,
      jsonCount: result.jsonCount,
      draftCount: result.draftCount,
      draftPath: result.draftPath
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`本地公式导入失败：${message}`);
    if (!response.headersSent) sendJson(request, response, 400, { ok: false, error: message });
  } finally {
    importRunning = false;
    if (temporaryDir) await fs.rm(temporaryDir, { force: true, recursive: true });
  }
});

server.listen(port, host, () => {
  console.log(`公式导入后台已启动：http://${host}:${port}`);
  console.log("仅监听本机地址，单个 PDF 最大 30MB。");
  console.log("前端页面：http://localhost:5173/formula-admin");
});

server.on("error", (error) => {
  console.error(`公式导入后台启动失败：${error.message}`);
  process.exitCode = 1;
});
