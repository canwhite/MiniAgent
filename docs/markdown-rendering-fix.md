# Markdown 渲染优化修复记录

## 问题背景

在前端聊天界面中，AI 助手返回的 markdown 内容显示不正常，主要表现为：

- 列表格式混乱，无法正确渲染
- 粗体、斜体等格式显示异常
- 标题层级不清晰
- 流式输出时格式错乱

## 根本原因分析

### 1. HTML 转义顺序错误（原始问题）

**原始代码：**
```tsx
function formatMessage(content: string): string {
  // 先转义 HTML
  let formatted = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // 再解析 markdown
  formatted = marked.parse(formatted) as string;

  return formatted;
}
```

**问题：**
- 先转义 HTML 会破坏 markdown 语法
- 例如：`` `code` `` 被转义后变成 `&lt;code&gt;`，导致 markdown 无法识别

### 2. 流式更新时的解析不稳定

**问题场景：**
```tsx
case "text_delta":
  // 每次追加内容
  { ...msg, content: msg.content + data.delta }
```

当内容不完整时：
- 第1次：`这是**粗体` → marked 解析失败或产生错误输出
- 第2次：`这是**粗体**文本` → 解析正确

这导致流式输出时 HTML 结构不断变化，造成显示闪烁和格式混乱。

## 解决方案

### 修复 1：使用 DOMPurify 进行安全净化

**改动：**
```tsx
import DOMPurify from "dompurify";

function formatMessage(content: string): string {
  try {
    // 先解析 markdown（保持语法完整）
    const parsed = marked.parse(content) as string;
    // 再净化 HTML（防止 XSS 攻击）
    return DOMPurify.sanitize(parsed);
  } catch (e) {
    console.error("Markdown parse error:", e);
    return content;
  }
}
```

**优势：**
- ✅ 保持 markdown 语法完整
- ✅ 使用专业的 XSS 防护库（已安装但未使用）
- ✅ 安全性和正确性兼顾

### 修复 2：流式时的智能格式化

**新增函数：**
```tsx
function formatStreamingMessage(content: string): string {
  try {
    // 尝试解析 markdown
    const parsed = marked.parse(content) as string;
    return DOMPurify.sanitize(parsed);
  } catch (e) {
    // 如果解析失败，回退到简单格式化
    let formatted = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 处理基本格式
    formatted = formatted.replace(/`([^`]+)`/g, "<code>$1</code>");
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    formatted = formatted.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    return `<div class="streaming">${formatted.replace(/\n/g, "<br>")}</div>`;
  }
}
```

**渲染逻辑：**
```tsx
dangerouslySetInnerHTML={{
  __html: msg.isStreaming
    ? formatStreamingMessage(msg.content)  // 流式时
    : formatMessage(msg.content)           // 完成后
}}
```

### 修复 3：优化 marked 配置

```tsx
marked.setOptions({
  breaks: true,  // 单个换行符转换为 <br>
  gfm: true,     // GitHub Flavored Markdown
});
```

### 修复 4：添加流式消息样式

```css
.message-content .streaming {
  white-space: pre-wrap;
  word-break: break-word;
}
```

## 技术要点

### DOMPurify vs 简单转义

| 方案 | 安全性 | Markdown 支持 | 性能 |
|------|--------|--------------|------|
| 简单转义 | 低（容易绕过） | 破坏语法 | 快 |
| DOMPurify | 高（专业防护） | 完整支持 | 中等 |

### 流式渲染策略

1. **流式期间**：尝试完整解析，失败则回退
2. **流式结束**：强制使用完整解析
3. **状态切换**：通过 `isStreaming` 标志控制

## 文件变更

- `/frontend/chat.tsx`
  - 添加 DOMPurify 导入
  - 新增 `formatStreamingMessage` 函数
  - 修改 `formatMessage` 函数
  - 更新渲染逻辑

- `/frontend/chat.html`
  - 添加 `.streaming` 样式类

## 测试验证

修复后应能正确显示：
- ✅ 标题（#、##、###）
- ✅ 粗体（**text**）和斜体（*text*）
- ✅ 列表（有序、无序）
- ✅ 代码块和行内代码
- ✅ 分隔线（---）
- ✅ 链接和引用

## 后续优化建议

1. **性能优化**：考虑使用增量解析而非每次重新解析整段
2. **代码高亮**：确保 highlight.js 在流式时也能正常工作
3. **数学公式**：优化 KaTeX 的流式渲染支持
4. **表格渲染**：添加更好的表格样式支持

## 相关依赖

- `marked@17.0.4` - Markdown 解析器
- `marked-katex-extension@5.1.7` - KaTeX 扩展
- `highlight.js@11.11.1` - 代码高亮
- `dompurify@3.3.3` - XSS 防护
- `katex@0.16.40` - 数学公式渲染
