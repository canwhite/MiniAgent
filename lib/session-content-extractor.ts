/**
 * Session 内容提取器
 *
 * 从 AI 输出的累积文本中智能提取最终内容（JSON、章节等）。
 * 用于替代 write 工具的内容提取功能。
 */

/**
 * 过滤 MiniMax 的 think 标签内容
 */
function filterThinkTags(text: string): string {
  // 使用正则表达式匹配 <think>...</think> 标签（支持换行、嵌套等）
  // 注意：正则默认不匹配嵌套，但通常 think 标签不会嵌套，如果需要处理嵌套可用栈方式
  // 这里使用 .*? 非贪婪匹配，s 标志使 . 匹配换行符
  const thinkRegex = /<think\b[^>]*>([\s\S]*?)<\/think\s*>/gi;

  // 移除所有匹配的标签及其内容
  const filtered = text.replace(thinkRegex, "");

  // 处理不完整的标签：如果存在未闭合的 <think 标签，则移除从该标签开始到末尾的内容
  // 这可以防止因标签未闭合导致的残留
  const incompleteRegex = /<think\b[^>]*>[\s\S]*$/gi;
  const finalFiltered = filtered.replace(incompleteRegex, "");

  // 可选：清理多余的空行（如果需要）
  // return finalFiltered.replace(/\n\s*\n/g, '\n\n').trim();

  return finalFiltered;
}
export function extractFromSessionText(
  fullText: string,
  logger?: { log: (msg: string) => void },
): string | undefined {
  // 0. 过滤 MiniMax 的 think 标签内容
  const filteredText = filterThinkTags(fullText);
  if (filteredText !== fullText) {
    logger?.log("[EXTRACT] 已过滤 MiniMax think 标签内容");
  }

  // 1. 最高优先级：提取标记为【最终输出】的内容
  const finalOutputMatch = filteredText.match(
    /【最终输出】([\s\S]*?)【最终输出】/,
  );
  if (finalOutputMatch && finalOutputMatch[1]) {
    logger?.log("[EXTRACT] 从【最终输出】标记提取内容");
    return finalOutputMatch[1].trim();
  }

  // 0.1. 识别 **最终定稿：** 标记
  const finalDraftMatch = filteredText.match(/\*\*最终定稿：\*\*([\s\S]*)/);
  if (finalDraftMatch && finalDraftMatch[1]) {
    logger?.log("[EXTRACT] 从**最终定稿**标记提取内容");
    return finalDraftMatch[1].trim();
  }

  // 2. 尝试提取 JSON 代码块
  const jsonMatch = filteredText.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    try {
      const json = JSON.parse(jsonMatch[1]);
      logger?.log("[EXTRACT] 从 JSON 代码块提取内容");
      return JSON.stringify(json, null, 2);
    } catch {
      // JSON 解析失败，继续尝试其他方式
    }
  }

  // 3. 尝试提取纯 JSON 对象
  const jsonObjectMatch = filteredText.match(/\{[\s\S]*?\}/);
  if (jsonObjectMatch && jsonObjectMatch[0]) {
    try {
      const json = JSON.parse(jsonObjectMatch[0]) as Record<string, unknown>;
      // 验证是有效的 JSON（不是代码片段）
      if (json.title || json.chapter || json.name || json.age || json.content) {
        logger?.log("[EXTRACT] 从文本中提取 JSON 对象");
        return JSON.stringify(json, null, 2);
      }
    } catch {
      // JSON 解析失败，继续尝试其他方式
    }
  }

  // 4. 尝试提取文章内容（公众号文章、章节等）
  if (
    filteredText.includes("标题") ||
    filteredText.includes("摘要") ||
    filteredText.includes("#") ||
    filteredText.includes("##")
  ) {
    const articleText = extractArticleContent(filteredText);
    if (articleText) {
      logger?.log("[EXTRACT] 提取文章内容");
      return articleText;
    }
  }

  // 5. 检查是否有"章节"标识的小说内容
  if (
    filteredText.includes("章节") ||
    filteredText.includes("第") ||
    filteredText.length > 500
  ) {
    // 提取章节正文（去除分析、步骤等）
    const chapterText = extractChapterContent(filteredText);
    if (chapterText) {
      logger?.log("[EXTRACT] 提取章节内容");
      return chapterText;
    }
  }

  // 6. 后备：返回完整文本（如果足够长且不是过程描述）
  if (filteredText.length > 100 && !isProcessText(filteredText)) {
    logger?.log("[EXTRACT] 使用完整文本作为内容");
    return filteredText;
  }

  logger?.log("[EXTRACT] 未能提取有效内容");
  return undefined;
}

/**
 * 提取章节正文（去除分析、步骤等内容）
 */
function extractChapterContent(fullText: string): string | undefined {
  // 查找章节正文开始标记
  const startMarkers = ["**", "##", "章节标题", "正文：", "【"];
  const endMarkers = ["**创作过程总结**", "**步骤**", "**分析**", "```"];

  let startIndex = fullText.length;
  for (const marker of startMarkers) {
    const idx = fullText.indexOf(marker);
    if (idx !== -1) {
      startIndex = Math.min(startIndex, idx);
    }
  }

  let endIndex = fullText.length;
  for (const marker of endMarkers) {
    const idx = fullText.indexOf(marker);
    if (idx !== -1 && idx > startIndex) {
      endIndex = Math.min(endIndex, idx);
    }
  }

  const content = fullText.substring(startIndex, endIndex).trim();
  if (content.length > 200) {
    return content;
  }
  return undefined;
}

/**
 * 提取文章内容（去除分析、步骤等）
 */
function extractArticleContent(fullText: string): string | undefined {
  // 查找文章正文开始标记
  const startMarkers = ["# ", "## ", "标题：", "摘要：", "正文："];
  const endMarkers = [
    "**创作过程**",
    "**创作过程总结**",
    "**步骤**",
    "**分析**",
    "**优化建议**",
  ];

  let startIndex = fullText.length;
  for (const marker of startMarkers) {
    const idx = fullText.indexOf(marker);
    if (idx !== -1) {
      startIndex = Math.min(startIndex, idx);
    }
  }

  // 如果没有找到开始标记，从头开始
  if (startIndex === fullText.length) {
    startIndex = 0;
  }

  let endIndex = fullText.length;
  for (const marker of endMarkers) {
    const idx = fullText.indexOf(marker);
    if (idx !== -1 && idx > startIndex) {
      endIndex = Math.min(endIndex, idx);
    }
  }

  const content = fullText.substring(startIndex, endIndex).trim();
  if (content.length > 200) {
    return content;
  }
  return undefined;
}

/**
 * 判断是否是过程描述文本
 */
function isProcessText(text: string): boolean {
  const processKeywords = [
    "我先",
    "让我先",
    "首先",
    "步骤",
    "正在",
    "分析",
    "我现在",
    "好的，我",
    "让我来",
    "我将",
  ];
  const hasProcessKeyword = processKeywords.some((k) => text.includes(k));

  // 如果文本以过程关键词开头且较短，认为是过程描述
  if (hasProcessKeyword && text.length < 500) {
    return true;
  }

  return false;
}
