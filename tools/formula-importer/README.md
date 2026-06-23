# 公式岛 MinerU 资料导入工具

这个目录用于把 MinerU 解析出的 Markdown / JSON 转换为“公式岛”可人工审核的公式卡片草稿。

它不会运行 MinerU、不会上传资料，也不会直接修改 `src/data/formulaData.ts`。

## 目录说明

- `input/`：放置待解析的 PDF、图片或 DOCX。
- `mineru-output/`：MinerU 输出目录。
- `drafts/`：导入脚本生成的草稿。
- `import-mineru-output.js`：Markdown / JSON 扫描与公式提取脚本。
- `export-drafts-to-formula-data.js`：把审核通过的草稿导出为公式岛数据。
- `run-full-import.js`：复制 PDF、清理临时目录、运行 MinerU 并生成草稿的一键编排脚本。

## 一键导入

在项目根目录运行：

```bash
npm run formula:import -- "/path/to/file.pdf"
```

路径包含空格时必须保留引号。该命令会自动：

1. 检查 PDF 路径是否存在且确实是 `.pdf` 文件。
2. 清理 `input/` 和 `mineru-output/` 中的旧临时文件，同时保留 `.gitkeep`。
3. 把 PDF 复制到 `input/`。
4. 运行：

   ```bash
   mineru -p tools/formula-importer/input/<filename> \
     -o tools/formula-importer/mineru-output \
     -b pipeline
   ```

5. 运行 `import-mineru-output.js`。
6. 生成 `drafts/formula-drafts.json`。
7. 打印 MinerU 状态、Markdown / JSON 扫描数量和草稿数量。

一键导入不会自动把草稿标记为 `approved`，也不会运行正式数据导出脚本。完成后仍需人工审核：

```bash
node tools/formula-importer/export-drafts-to-formula-data.js
```

如果终端无法找到 `mineru`，请确认 MinerU 已安装并加入 `PATH`。也可以临时指定命令路径：

```bash
MINERU_BIN="/absolute/path/to/mineru" npm run formula:import -- "/path/to/file.pdf"
```

## 完整导入与审核流程

1. 使用本地 MinerU 解析 PDF，例如：

   ```bash
   mineru -p input/test.pdf -o output -b pipeline
   ```

2. 把 MinerU 的 `output` 内容复制到：

   ```text
   tools/formula-importer/mineru-output/
   ```

   也可以直接使用本目录作为 MinerU 输入和输出位置：

   ```bash
   mineru -p tools/formula-importer/input/test.pdf \
     -o tools/formula-importer/mineru-output \
     -b pipeline
   ```

3. 在项目根目录生成待审核草稿：

   ```bash
   node tools/formula-importer/import-mineru-output.js
   ```

   脚本会递归扫描 `mineru-output/`。Markdown 文件优先处理，随后处理 JSON 中可读取的文本字段。

4. 人工打开：

   ```text
   tools/formula-importer/drafts/formula-drafts.json
   ```

   检查公式、学科、章节、标题、场景、变量、易错点和例题。只把确认正确的条目从：

   ```json
   "status": "draft"
   ```

   改为：

   ```json
   "status": "approved"
   ```

5. 导出审核通过的公式：

   ```bash
   node tools/formula-importer/export-drafts-to-formula-data.js
   ```

   输出文件：

   ```text
   src/data/importedFormulaData.ts
   ```

   导出脚本不会覆盖 `src/data/formulaData.ts`。只有 `approved` 条目会被写入；`draft` 和无法识别学科的条目不会进入公式岛。

6. 启动项目：

   ```bash
   npm run dev
   ```

7. 打开公式岛查看导入公式。导入卡片会显示“MinerU 导入”标签。

8. 在开发环境进入公式导入审核台：

   ```text
   http://localhost:5173/formula-review
   ```

   也可以点击公式岛页面底部的“开发工具：导入审核台”。

## 发布前人工审核

MinerU 导入后不要直接发布。应先进入公式导入审核台逐条检查：

- 标题是否准确，避免“x 公式”“y 公式”等无意义名称
- 学科和章节是否正确
- LaTeX 公式是否完整，是否截断了上下文
- 变量解释是否完整，是否仍有“待人工补充”
- 适用场景是否是正常文本，而不是 `equation_inline` 等解析标记
- 例题和易错点是否需要人工补充
- `sourceFile` 是否能追溯到正确的 MinerU 输出文件

审核台只提供预览、质量提示和“复制整理模板”，不会直接写回 `formula-drafts.json`。复制模板后，可以手动整理草稿，再重新运行导出脚本。

## 数据转换

导出脚本会自动完成：

- `title` → `name`
- `scene` → `scenario`
- `mistakes` → `commonMistakes`
- 补充基础 `keywords` 和默认 `steps`
- 添加 `source: "mineru"` 和 `imported: true`
- 过滤非 `approved` 和空公式
- 对 `unknown` 学科按章节、标题和来源推断；无法判断时暂按数学归类并在终端警告

如果没有 `approved` 草稿，脚本会提示“没有可导入的公式草稿”，正常退出并生成安全的空 `importedFormulaData.ts`。

## 公式提取规则

导入脚本尝试识别：

- `$$...$$`
- `\[...\]`
- `\(...\)`
- 常见独立等式行，如 `v = s / t`、`S_n = n(a_1+a_n)/2`

不要未经审核直接批准全部草稿。OCR、上下文切分和等式识别都可能产生误判。

## 当前识别局限

- 只能读取 MinerU 已输出为文本的公式，无法直接理解图片中的公式。
- 行内公式可能是变量片段而不是完整公式。
- 普通等式行使用启发式规则，可能漏掉复杂多行推导，也可能把数据表达式误判为公式。
- `subject` 和 `chapter` 主要根据文件路径、文件名和附近标题关键词推断。
- 变量含义只能从附近的“变量/其中/式中”文字尝试提取，通常需要人工补充。
- 易错点和示例题只有在附近文字包含“易错、注意、提醒、例题、示例”等提示词时才能较好识别。
- JSON 结构因 MinerU 版本而异；脚本会递归收集字符串字段，但不会理解所有自定义结构。
