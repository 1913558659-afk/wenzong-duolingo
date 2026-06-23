# 公式岛 MinerU 资料导入工具

这个目录用于把 MinerU 解析出的 Markdown / JSON 转换为“公式岛”可人工审核的公式卡片草稿。

它不会运行 MinerU、不会上传资料，也不会直接修改 `src/data/formulaData.ts`。

## 目录说明

- `input/`：放置待解析的 PDF、图片或 DOCX。
- `mineru-output/`：MinerU 输出目录。
- `drafts/`：导入脚本生成的草稿。
- `import-mineru-output.js`：Markdown / JSON 扫描与公式提取脚本。

## 导入流程

1. 把 PDF、图片或 DOCX 放入：

   ```text
   tools/formula-importer/input/
   ```

2. 在项目根目录使用本地 MinerU 解析：

   ```bash
   mineru -p tools/formula-importer/input -o tools/formula-importer/mineru-output
   ```

3. 运行导入脚本：

   ```bash
   node tools/formula-importer/import-mineru-output.js
   ```

4. 脚本会递归扫描 `mineru-output/`。Markdown 文件优先处理，随后处理 JSON 中可读取的文本字段。

5. 脚本尝试识别：

   - `$$...$$`
   - `\[...\]`
   - `\(...\)`
   - 常见独立等式行，如 `v = s / t`、`S_n = n(a_1+a_n)/2`

6. 输出文件：

   ```text
   tools/formula-importer/drafts/formula-drafts.json
   ```

7. 人工审核草稿，补全标题、章节、适用场景、变量解释、易错点和例题后，再合并到：

   ```text
   src/data/formulaData.ts
   ```

## 草稿合并建议

导入草稿字段与正式数据字段存在少量命名差异，合并时建议转换：

- `title` → `name`
- `scene` → `scenario`
- `mistakes` → `commonMistakes`
- 保留 `latex`、`subject`、`chapter`、`variables`、`example`
- 人工补充正式数据需要的 `keywords` 和 `steps`
- 删除草稿专用的 `sourceFile`、`status`
- 正式 `subject` 只接受 `math`、`physics`、`geography`；`unknown` 必须人工归类

不要直接把全部草稿批量发布。OCR、上下文切分和等式识别都可能产生误判。

## 当前识别局限

- 只能读取 MinerU 已输出为文本的公式，无法直接理解图片中的公式。
- 行内公式可能是变量片段而不是完整公式。
- 普通等式行使用启发式规则，可能漏掉复杂多行推导，也可能把数据表达式误判为公式。
- `subject` 和 `chapter` 主要根据文件路径、文件名和附近标题关键词推断。
- 变量含义只能从附近的“变量/其中/式中”文字尝试提取，通常需要人工补充。
- 易错点和示例题只有在附近文字包含“易错、注意、提醒、例题、示例”等提示词时才能较好识别。
- JSON 结构因 MinerU 版本而异；脚本会递归收集字符串字段，但不会理解所有自定义结构。

