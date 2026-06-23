# SayHi 题库导入工具

题库导入适合试卷、练习题和带答案解析的 PDF。它与公式导入并列存在，不会修改公式岛数据，也不会自动发布题目。

## 一键导入

1. 确认 MinerU 可在终端运行。
2. 执行：

   ```bash
   npm run question:import -- "/path/to/file.pdf"
   ```

3. 脚本会清理本工具的旧 `input/` 和 `mineru-output/` 临时文件，调用 MinerU，然后生成：

   ```text
   tools/question-importer/drafts/question-drafts.json
   ```

4. 启动本地草稿读取服务和前端：

   ```bash
   npm run formula:admin
   npm run dev
   ```

5. 打开：

   ```text
   http://localhost:5173/question-review
   ```

审核台只负责查看、检查和复制整理模板，不会修改 JSON，也不会自动导入正式题库。

## 完整审核与正式发布流程

```text
PDF
→ MinerU
→ question-drafts.json
→ 人工审核并把正确条目改为 approved
→ npm run question:publish
→ 自动备份 src/data/questions.ts
→ approved 题目追加进入正式题库
→ 到练习/闯关中验证
```

1. 在 `/question-review` 检查题干、选项、答案、分析和详解。
2. 手动把确认正确的条目改为：

   ```json
   "status": "approved"
   ```

3. 发布 approved 题目：

   ```bash
   npm run question:publish
   ```

4. 发布脚本会先备份正式题库到：

   ```text
   tools/question-importer/backups/questions-<timestamp>.ts
   ```

5. 通过校验且未重复的 approved 题目会追加到：

   ```text
   src/data/questions.ts
   ```

   原有题目不会被覆盖。每条导入题都会记录 `source`、`imported`、`importBatchId`、`importFingerprint`、`sourceFile` 和 `createdAt`。

6. 启动前端，到练习和闯关中验证导入题。题目卡片会显示“MinerU 导入”。

如果没有 approved 草稿，脚本会提示“没有可导入的题目草稿”，不会备份或修改正式题库。相同 `sourceFile + stem + answer` 的题目会被判定为重复并跳过。

### 回滚

找到发布时终端打印的备份文件，将它复制回正式题库：

```bash
cp tools/question-importer/backups/questions-<timestamp>.ts src/data/questions.ts
```

备份目录属于本地生成内容，已被 `.gitignore` 忽略。

## 独立预览导出（可选）

如仍需要生成不进入正式题库的独立预览数据，可运行：

```bash
node tools/question-importer/export-drafts-to-question-data.js
```

如果 MinerU 不在 `PATH`：

```bash
MINERU_BIN="/absolute/path/to/mineru" npm run question:import -- "/path/to/file.pdf"
```

## 当前识别规则

- 按 `1.`、`1．`、`1、` 等题号切分题目
- 识别 A、B、C、D 选项
- 识别 `【答案】`、`【分析】`、`【详解】`
- 根据选项和答案推断单选题、多选题或填空题
- 根据文件名和题目内容初步推断学科、章节和标签

OCR 错字、跨页题目、图片选项、复杂组合题和缺失的区块标签仍需人工清洗。

## 生成文件

以下内容已被 `.gitignore` 忽略：

- `input/` 中上传或复制的 PDF
- `mineru-output/` 中的 MinerU 输出
- `drafts/question-drafts.json`

目录中的 `.gitkeep` 会保留。
