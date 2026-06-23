export type ImportedQuestionType = "single_choice" | "multiple_choice" | "fill_blank";

export type ImportedQuestionItem = {
  id: string;
  subject: string;
  chapter: string;
  questionType: ImportedQuestionType;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  analysis: string;
  tags: string[];
  sourceFile: string;
  imported: true;
};

export const importedQuestionData: ImportedQuestionItem[] = [
  {
    "id": "imported-question-e76202ee2ac6",
    "subject": "math",
    "chapter": "函数",
    "questionType": "single_choice",
    "difficulty": "medium",
    "question": "下列四组函数中，两个函数表示的是同一个函数的是（）.",
    "options": [
      "A. $f \\left( x \\right) = { \\frac { x ^ { 2 } - 2 } { x - { \\sqrt { 2 } } } }$ 与 $f \\left( x \\right) = x + { \\sqrt { 2 } }$",
      "B. $f \\left( x \\right) = \\frac { 1 } { 2 } \\log _ { 3 } x ^ { 2 }$ 与 $f ( x ) = \\log _ { 3 } x$",
      "C. $f ( x ) = { \\sqrt { x ^ { 2 } } } \\ E \\ f ( x ) = x$",
      "D. $f ( x ) = \\sqrt [ 3 ] { \\left( x - 1 \\right) ^ { 3 } }$ 与 $f ( x ) = x - 1$"
    ],
    "answer": "$f ( x ) = \\sqrt [ 3 ] { \\left( x - 1 \\right) ^ { 3 } }$ 与 $f ( x ) = x - 1$",
    "explanation": "对两函数的定义域、值域、对应关系分别进行逐一判断即可得出结论.\n\n对于A，易知 $f \\left( x \\right) = { \\frac { x ^ { 2 } - 2 } { x - { \\sqrt { 2 } } } }$ 的定义域为 $\\left\\{ x \\mid x \\neq { \\sqrt { 2 } } \\right\\}$ 而 $f \\left( x \\right) = x + { \\sqrt { 2 } }$ 的定义域为R，两函数定义域不同，可知A错误;对于B，显然 $f \\left( x \\right) = \\frac { 1 } { 2 } \\log _ { 3 } x ^ { 2 }$ 的定义域为 $\\{ x | x \\neq 0 \\}$\n而函数 $f ( x ) = \\log _ { 3 } x$ 的定义域为 $\\left( 0 , + \\infty \\right)$ 两函数定义域不同，可知B错误；\n对于C，两函数定义域均为R，但 $f \\left( x \\right) = { \\sqrt { x ^ { 2 } } }$ 的值域为 $\\left[ 0 , + \\infty \\right)$\n而 $f ( x ) = x$ 的值域为R，两函数值域不同，即C错误；\n对于D，易知 $f \\left( x \\right) = \\sqrt [ 3 ] { \\left( x - 1 \\right) ^ { 3 } } = x - 1$ 与 $f ( x ) = x - 1$ 的定义域、值域、对应关系均相同，即D正确.\n故选：D",
    "analysis": "对两函数的定义域、值域、对应关系分别进行逐一判断即可得出结论.",
    "tags": [
      "函数",
      "选择题"
    ],
    "sourceFile": "../formula-importer/mineru-output/函数第一组/auto/函数第一组.md",
    "imported": true
  }
];
