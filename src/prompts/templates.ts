export type PromptTask = "general" | "coding" | "ocr" | "ui" | "chart" | "document" | "paper" | "describe" | "ask";

const templates: Record<string, string> = {
  general: "请清晰描述这张图片中可见的主要内容、文字、结构和不确定之处。",
  describe: "请清晰描述这张图片中可见的主要内容、文字、结构和不确定之处。",
  coding: [
    "你是代码助手的视觉预处理器。",
    "请解析图片中所有与代码、终端、报错、文件名、行号、UI 异常相关的信息。",
    "输出清晰、可供文本大模型继续推理的信息。",
    "关注：报错原文、文件名和行号、终端命令、UI 异常、可见代码、可能原因、信息不足之处。"
  ].join("\n"),
  ocr: "请尽可能完整提取图片中的文字。保留换行、表格结构、代码缩进和标点。无法确认的字符用 [?] 标记。",
  ui: "请分析这张 UI 图片的页面结构、关键控件、可见文字、异常状态和可能的交互意图。",
  chart: "请分析图表类型、坐标轴、图例、趋势、关键数值和从图中可以得出的结论。",
  document: "请提取并整理文档图片中的标题、段落、表格、编号和关键信息。",
  paper: "请分析论文或科研图片中的图题、面板、变量、趋势、实验结论和局限。"
};

export function buildPrompt(input: { task: string; question?: string; json: boolean }): string {
  const base = templates[input.task] ?? templates.general;
  const question = input.question ? `\n\n用户问题：${input.question}` : "";
  const json = input.json
    ? '\n\n只返回 JSON，不要使用 Markdown。格式：{"summary":string,"visible_text":string[],"observations":string[],"limitations":string[],"answer":string}'
    : "";
  return `${base}${question}${json}`;
}

