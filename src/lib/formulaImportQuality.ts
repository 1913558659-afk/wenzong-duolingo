import type { FormulaItem } from "@/data/formulaData";

export type FormulaQualityIssue = {
  code: "chapter" | "example" | "mistakes" | "scene" | "title" | "variables";
  label: string;
  suggestion: string;
};

function hasPlaceholder(value: string) {
  return /待人工补充|待补充|equation_inline|待分类|unknown|无法识别/i.test(value);
}

export function hasRoughFormulaTitle(title: string) {
  const normalized = title.trim();
  const prefix = normalized.replace(/\s*公式\s*$/u, "");
  return normalized.length < 4
    || (/公式\s*$/u.test(normalized) && !/[\u4e00-\u9fff]/u.test(prefix))
    || /^(?:x|y|f|g|h|v|s|t)\s*公式$/i.test(normalized);
}

export function hasIncompleteVariables(item: FormulaItem) {
  return item.variables.length === 0 || item.variables.some((variable) => !variable.meaning.trim() || hasPlaceholder(variable.meaning));
}

export function getFormulaQualityIssues(item: FormulaItem): FormulaQualityIssue[] {
  const issues: FormulaQualityIssue[] = [];

  if (hasRoughFormulaTitle(item.name)) {
    issues.push({ code: "title", label: "标题过于简单", suggestion: "建议改标题：根据公式用途命名，例如“幂函数表达式”或“对数函数定义域条件”。" });
  }
  if (item.scenario.trim().length < 8 || hasPlaceholder(item.scenario)) {
    issues.push({ code: "scene", label: "适用场景待整理", suggestion: "建议补适用场景：说明这条公式用于解决哪类题目。" });
  }
  if (hasIncompleteVariables(item)) {
    issues.push({ code: "variables", label: "变量解释不完整", suggestion: "建议补变量解释：逐个说明符号含义、单位和取值范围。" });
  }
  if (!item.example.trim() || hasPlaceholder(item.example) || item.example.trim().length < 8) {
    issues.push({ code: "example", label: "例题待补充", suggestion: "建议补例题：提供一个可直接代入公式的简短题目和结果。" });
  }
  if (item.commonMistakes.length === 0 || item.commonMistakes.some(hasPlaceholder)) {
    issues.push({ code: "mistakes", label: "易错点待补充", suggestion: "建议补易错点：记录符号、定义域、单位或使用条件上的常见错误。" });
  }
  if (!item.chapter.trim() || hasPlaceholder(item.chapter)) {
    issues.push({ code: "chapter", label: "章节待确认", suggestion: "建议确认学科和章节：确保公式出现在正确筛选分类中。" });
  }

  return issues;
}

export function createFormulaCleanupTemplate(item: FormulaItem) {
  return {
    id: item.id.replace(/^mineru-/, "formula-draft-"),
    subject: item.subject,
    chapter: item.chapter,
    title: item.name,
    latex: item.latex,
    scene: item.scenario,
    variables: item.variables,
    mistakes: item.commonMistakes,
    example: item.example,
    sourceFile: item.sourceFile ?? "",
    status: "approved"
  };
}
