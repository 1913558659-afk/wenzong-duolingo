export type FormulaSubject = "math" | "physics" | "geography";

export type FormulaVariable = {
  symbol: string;
  meaning: string;
};

export type FormulaItem = {
  chapter: string;
  commonMistakes: string[];
  example: string;
  id: string;
  keywords: string[];
  latex: string;
  name: string;
  scenario: string;
  steps: string[];
  subject: FormulaSubject;
  variables: FormulaVariable[];
};

export const formulaSubjectConfig: Record<FormulaSubject, { color: string; label: string; chapters: string[] }> = {
  math: {
    color: "from-tide/20 to-gold/20",
    label: "数学",
    chapters: ["函数", "三角函数", "数列", "解析几何", "概率统计"]
  },
  physics: {
    color: "from-coral/16 to-gold/22",
    label: "物理",
    chapters: ["运动学", "力学", "能量", "电学", "磁场"]
  },
  geography: {
    color: "from-leaf/20 to-tide/16",
    label: "地理",
    chapters: ["地球运动", "地图与比例尺", "等高线", "人口与城市", "气候计算"]
  }
};

export const formulaItems: FormulaItem[] = [
  {
    id: "math-quadratic-vertex",
    subject: "math",
    chapter: "函数",
    name: "二次函数顶点横坐标",
    latex: "x=-\\frac{b}{2a}",
    scenario: "求二次函数图像的对称轴和顶点位置。",
    variables: [{ symbol: "a,b", meaning: "二次函数 y=ax^2+bx+c 的系数，且 a≠0" }],
    commonMistakes: ["分母是 2a，不是 2。", "代入时注意 b 前面的负号。"],
    steps: ["确认函数已整理为一般式。", "识别 a、b 的值。", "代入公式求横坐标，再代回函数求纵坐标。"],
    example: "已知 y=2x²-8x+3，求顶点横坐标。答案：x=2。",
    keywords: ["二次函数", "顶点", "对称轴"]
  },
  {
    id: "math-sine-law",
    subject: "math",
    chapter: "三角函数",
    name: "正弦定理",
    latex: "\\frac{a}{\\sin A}=\\frac{b}{\\sin B}=\\frac{c}{\\sin C}=2R",
    scenario: "已知三角形的边角关系，求未知边或未知角。",
    variables: [{ symbol: "a,b,c", meaning: "角 A、B、C 的对边" }, { symbol: "R", meaning: "三角形外接圆半径" }],
    commonMistakes: ["边必须对应其对角。", "用反三角函数求角时注意可能存在两解。"],
    steps: ["标出已知边角的对应关系。", "选择含一个未知量的比例式。", "代入并检查三角形解的合理性。"],
    example: "在三角形中，A=30°，a=4，B=45°，可由 a/sinA=b/sinB 求 b。",
    keywords: ["三角形", "正弦", "边角"]
  },
  {
    id: "math-arithmetic-term",
    subject: "math",
    chapter: "数列",
    name: "等差数列通项公式",
    latex: "a_n=a_1+(n-1)d",
    scenario: "已知首项和公差，求等差数列任意一项。",
    variables: [{ symbol: "a_n", meaning: "第 n 项" }, { symbol: "a_1", meaning: "首项" }, { symbol: "d", meaning: "公差" }],
    commonMistakes: ["项数差是 n-1，不是 n。", "公差为负数时要连同符号代入。"],
    steps: ["确定首项、公差和项数。", "计算 n-1。", "代入并化简。"],
    example: "数列 3, 7, 11, … 的第 10 项为 3+(10-1)×4=39。",
    keywords: ["等差数列", "通项", "公差"]
  },
  {
    id: "math-arithmetic-sum",
    subject: "math",
    chapter: "数列",
    name: "等差数列求和公式",
    latex: "S_n=\\frac{n(a_1+a_n)}{2}",
    scenario: "已知首项、末项和项数，求等差数列前 n 项和。",
    variables: [{ symbol: "S_n", meaning: "前 n 项和" }, { symbol: "a_1,a_n", meaning: "首项与第 n 项" }],
    commonMistakes: ["必须乘项数 n。", "末项未知时先用通项公式求出。"],
    steps: ["确认项数 n。", "确定首项和末项。", "代入公式并约分。"],
    example: "1+3+5+…+19 共 10 项，和为 10×(1+19)/2=100。",
    keywords: ["等差数列", "求和", "前n项和"]
  },
  {
    id: "math-pythagorean",
    subject: "math",
    chapter: "解析几何",
    name: "勾股定理",
    latex: "a^2+b^2=c^2",
    scenario: "在直角三角形中，由两边求第三边，也可用于坐标距离计算。",
    variables: [{ symbol: "a,b", meaning: "两条直角边" }, { symbol: "c", meaning: "斜边" }],
    commonMistakes: ["c 必须是斜边。", "求边长后要取非负平方根。"],
    steps: ["判断直角和斜边。", "代入已知边长。", "开平方并检查长度关系。"],
    example: "直角边为 3 和 4，斜边 c=5。",
    keywords: ["直角三角形", "距离", "勾股"]
  },
  {
    id: "math-probability",
    subject: "math",
    chapter: "概率统计",
    name: "古典概型概率",
    latex: "P(A)=\\frac{m}{n}",
    scenario: "所有基本事件等可能时，计算事件发生概率。",
    variables: [{ symbol: "m", meaning: "事件 A 包含的基本事件数" }, { symbol: "n", meaning: "全部基本事件数" }],
    commonMistakes: ["必须先确认基本事件等可能。", "不要重复或遗漏基本事件。"],
    steps: ["列出全部基本事件。", "数出符合事件 A 的结果。", "用 m/n 计算并化简。"],
    example: "掷一枚骰子，出现偶数的概率为 3/6=1/2。",
    keywords: ["概率", "古典概型", "等可能"]
  },
  {
    id: "physics-speed",
    subject: "physics",
    chapter: "运动学",
    name: "速度公式",
    latex: "v=\\frac{s}{t}",
    scenario: "计算物体在一段时间内的平均速度或匀速运动速度。",
    variables: [{ symbol: "v", meaning: "速度" }, { symbol: "s", meaning: "路程或位移" }, { symbol: "t", meaning: "时间" }],
    commonMistakes: ["单位必须统一。", "平均速度与瞬时速度含义不同。"],
    steps: ["明确路程或位移。", "统一长度和时间单位。", "相除并写出速度单位。"],
    example: "物体 5 秒运动 20 米，速度为 4 m/s。",
    keywords: ["速度", "路程", "时间"]
  },
  {
    id: "physics-uniform-speed",
    subject: "physics",
    chapter: "运动学",
    name: "匀变速速度公式",
    latex: "v=v_0+at",
    scenario: "已知初速度、加速度和时间，求末速度。",
    variables: [{ symbol: "v_0", meaning: "初速度" }, { symbol: "a", meaning: "加速度" }, { symbol: "t", meaning: "运动时间" }],
    commonMistakes: ["先规定正方向，再判断 a 的正负。", "公式只适用于匀变速直线运动。"],
    steps: ["规定正方向。", "写出各量及正负号。", "代入计算末速度。"],
    example: "初速度 2 m/s，加速度 3 m/s²，2 秒后速度为 8 m/s。",
    keywords: ["匀变速", "速度", "加速度"]
  },
  {
    id: "physics-displacement",
    subject: "physics",
    chapter: "力学",
    name: "匀变速位移公式",
    latex: "s=v_0t+\\frac{1}{2}at^2",
    scenario: "求匀变速直线运动在一段时间内的位移。",
    variables: [{ symbol: "s", meaning: "位移" }, { symbol: "v_0", meaning: "初速度" }, { symbol: "a", meaning: "加速度" }],
    commonMistakes: ["t² 只作用于加速度项。", "位移可能为负。"],
    steps: ["建立正方向。", "统一单位并代入。", "结合方向解释位移符号。"],
    example: "物体由静止以 2 m/s² 加速 3 秒，位移为 9 米。",
    keywords: ["位移", "匀变速", "加速度"]
  },
  {
    id: "physics-work",
    subject: "physics",
    chapter: "能量",
    name: "功的公式",
    latex: "W=Fs",
    scenario: "力与位移同方向且力恒定时，计算力做的功。",
    variables: [{ symbol: "W", meaning: "功" }, { symbol: "F", meaning: "力" }, { symbol: "s", meaning: "沿力方向的位移" }],
    commonMistakes: ["力与位移不共线时不能直接用 Fs。", "功的单位是焦耳 J。"],
    steps: ["判断力与位移方向。", "取沿力方向的位移。", "相乘并写单位。"],
    example: "用 10 N 的力沿方向推动物体 3 m，做功 30 J。",
    keywords: ["功", "能量", "力", "位移"]
  },
  {
    id: "physics-ohm",
    subject: "physics",
    chapter: "电学",
    name: "欧姆定律",
    latex: "I=\\frac{U}{R}",
    scenario: "计算纯电阻电路中的电流、电压或电阻。",
    variables: [{ symbol: "I", meaning: "电流" }, { symbol: "U", meaning: "电压" }, { symbol: "R", meaning: "电阻" }],
    commonMistakes: ["各量必须对应同一段电路。", "注意单位 A、V、Ω。"],
    steps: ["识别同一导体两端电压和电阻。", "统一单位。", "变形公式求未知量。"],
    example: "电压 12 V、电阻 4 Ω，电流为 3 A。",
    keywords: ["欧姆定律", "电流", "电压", "电阻"]
  },
  {
    id: "physics-magnetic-force",
    subject: "physics",
    chapter: "磁场",
    name: "安培力公式",
    latex: "F=BIL",
    scenario: "通电直导线与磁场垂直时，计算导线受到的安培力。",
    variables: [{ symbol: "B", meaning: "磁感应强度" }, { symbol: "I", meaning: "电流" }, { symbol: "L", meaning: "有效导线长度" }],
    commonMistakes: ["该简式要求导线与磁场垂直。", "方向需另用左手定则判断。"],
    steps: ["判断导线与磁场夹角。", "找出有效长度。", "代入大小并判断方向。"],
    example: "B=0.5 T、I=2 A、L=0.4 m 时，F=0.4 N。",
    keywords: ["磁场", "安培力", "通电导线"]
  },
  {
    id: "geo-local-time",
    subject: "geography",
    chapter: "地球运动",
    name: "地方时计算",
    latex: "\\Delta t=\\frac{\\Delta \\lambda}{15^\\circ}",
    scenario: "根据两地经度差计算地方时差，遵循东加西减。",
    variables: [{ symbol: "Δλ", meaning: "两地经度差" }, { symbol: "Δt", meaning: "地方时差" }],
    commonMistakes: ["同为东经或西经用大数减小数，异经相加。", "东边地点时间更早进入下一时刻，应东加西减。"],
    steps: ["判断两地东西位置。", "计算经度差。", "每相差 15° 换算 1 小时，再按东加西减。"],
    example: "东经 120° 比东经 90° 早 2 小时。",
    keywords: ["地方时", "经度", "时差", "15度"]
  },
  {
    id: "geo-solar-altitude",
    subject: "geography",
    chapter: "地球运动",
    name: "正午太阳高度角",
    latex: "H=90^\\circ-|\\varphi-\\delta|",
    scenario: "计算某地在特定日期的正午太阳高度角。",
    variables: [{ symbol: "H", meaning: "正午太阳高度角" }, { symbol: "φ", meaning: "当地纬度" }, { symbol: "δ", meaning: "太阳直射点纬度" }],
    commonMistakes: ["纬度差应取绝对值。", "南北纬符号和太阳直射点位置要先判断。"],
    steps: ["确定当地纬度。", "判断当天太阳直射点纬度。", "求纬度差的绝对值，再用 90° 相减。"],
    example: "夏至日北纬 40° 的正午太阳高度约为 90°-|40°-23.5°|=73.5°。",
    keywords: ["太阳高度角", "正午太阳高度", "纬度", "太阳直射点"]
  },
  {
    id: "geo-scale",
    subject: "geography",
    chapter: "地图与比例尺",
    name: "比例尺公式",
    latex: "\\text{比例尺}=\\frac{\\text{图上距离}}{\\text{实地距离}}",
    scenario: "在地图距离、实际距离和比例尺之间换算。",
    variables: [{ symbol: "图上距离", meaning: "地图上测得的长度" }, { symbol: "实地距离", meaning: "真实地表距离" }],
    commonMistakes: ["图上距离和实地距离必须统一单位。", "比例尺是比值，没有单位。"],
    steps: ["统一两个距离的单位。", "将图上距离除以实地距离。", "按数字式或文字式表达。"],
    example: "图上 2 cm 表示实地 20 km，比例尺为 1:1,000,000。",
    keywords: ["比例尺", "地图", "图上距离", "实地距离"]
  },
  {
    id: "geo-contour-slope",
    subject: "geography",
    chapter: "等高线",
    name: "相对高度估算",
    latex: "(n-1)d < H < (n+1)d",
    scenario: "根据两点间经过的等高线条数估算相对高度范围。",
    variables: [{ symbol: "n", meaning: "两点间相差的等高线条数" }, { symbol: "d", meaning: "等高距" }],
    commonMistakes: ["严格不等号不能写成等号。", "先确认两点不恰好位于已知等高线上。"],
    steps: ["读出等高距 d。", "数两点之间的等高线差 n。", "代入不等式确定范围。"],
    example: "等高距 100 m，两点相差 3 条等高线，则相对高度在 200～400 m 之间。",
    keywords: ["等高线", "相对高度", "等高距"]
  },
  {
    id: "geo-population-density",
    subject: "geography",
    chapter: "人口与城市",
    name: "人口密度",
    latex: "\\text{人口密度}=\\frac{\\text{总人口}}{\\text{面积}}",
    scenario: "比较不同地区人口分布的疏密程度。",
    variables: [{ symbol: "总人口", meaning: "区域内人口总数" }, { symbol: "面积", meaning: "区域土地面积" }],
    commonMistakes: ["人口密度不等于人口数量。", "注意面积单位通常为 km²。"],
    steps: ["读取总人口和面积。", "统一人口与面积量级。", "相除并写人/km²。"],
    example: "某地人口 100 万、面积 5000 km²，人口密度为 200 人/km²。",
    keywords: ["人口密度", "人口", "城市", "面积"]
  },
  {
    id: "geo-lapse-rate",
    subject: "geography",
    chapter: "气候计算",
    name: "气温垂直递减率",
    latex: "\\Delta T\\approx 6^\\circ\\text{C}\\times\\frac{\\Delta h}{1000\\text{m}}",
    scenario: "估算对流层中不同海拔地点的气温差。",
    variables: [{ symbol: "ΔT", meaning: "气温差" }, { symbol: "Δh", meaning: "海拔高度差" }],
    commonMistakes: ["海拔升高气温下降，方向不能写反。", "6℃/1000m 是近似经验值。"],
    steps: ["计算两地海拔差。", "换算成若干个 1000 m。", "乘 6℃ 并判断升温或降温。"],
    example: "山脚 20℃，山顶高 2000 m，山顶约为 8℃。",
    keywords: ["气温", "海拔", "垂直递减率", "气候"]
  }
];
