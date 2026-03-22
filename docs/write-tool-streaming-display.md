# Write Tool 流式内容显示优化

## 概述

本文档记录了对 write tool 显示体验的优化过程，实现了从简单的"准备→完成"两态显示，到流式显示生成进度、完整内容和完成状态的三阶段展示。

## 问题背景

### 原始问题

用户反馈 write tool 的写入体验存在以下问题：
- 漫长的等待时间（LLM 生成代码需要 10+ 秒）
- 突然显示"写入完成"，中间过程不透明
- 用户不知道正在写什么内容，写到了哪里

### 分析发现

通过分析 `monitor.log` 数据，发现了关键事实：

1. **write 工具执行极快**：只有 2-4 毫秒
   ```
   [03:31:57.446Z] TOOL_EXECUTION_START Tool: write
   [03:31:57.446Z] TOOL_EXECUTION_END Tool: write
   ```

2. **内容在 LLM 生成阶段就已完成**：
   - `tool_execution_start` 时，Args 中已包含完整的 content
   - 无法在执行阶段实现真正的"流式写入"

3. **toolcall_delta 事件包含增量数据**：
   ```
   [03:31:23.727Z] toolcall_delta delta: ""
   [03:31:23.842Z] toolcall_delta delta: "{"
   [03:31:23.843Z] toolcall_delta delta: "\""
   ```
   LLM 生成工具调用时，通过 `toolcall_delta` 事件增量传输参数

## 解决方案

### 方案选择

经过讨论，选择了**混合方案（三阶段显示）**：

1. **阶段1：参数生成进度** - 显示 LLM 正在生成什么
2. **阶段2：完整内容展示** - 显示文件完整内容
3. **阶段3：完成状态** - 显示写入结果和文件信息

### 事件流时间线

```
[时间] toolcall_start      → 阶段1开始：显示"准备写入文件..."
[时间] toolcall_delta      → 阶段1进行中：实时更新文件名和内容预览
[时间] toolcall_end        → 阶段1结束：参数生成完成
[时间] tool_execution_start → 阶段2开始：显示完整文件内容
[时间+2ms] tool_execution_end → 阶段3开始：显示完成状态
```

## 实现细节

### 服务器端（server.ts）

#### 1. 添加 toolcall_delta 事件处理

```typescript
else if (event.assistantMessageEvent.type === "toolcall_delta") {
  const partial = event.assistantMessageEvent.partial;
  const toolCall = partial.content?.[event.assistantMessageEvent.contentIndex];
  if (toolCall?.type === "toolCall" && toolCall.name === "write") {
    const args = (toolCall.arguments || {}) as {
      path?: string;
      content?: string;
    };
    logger.log(
      `[TOOLCALL_DELTA] Tool: write, Path: ${args.path || "(generating)"}, Content length: ${args.content?.length || 0}`,
    );
    ws.send(JSON.stringify({
      type: "tool_call_delta",
      tool: "write",
      path: args.path || "",
      content: args.content || "",
      contentIndex: event.assistantMessageEvent.contentIndex,
    }));
  }
}
```

**关键点**：
- 只处理 write 工具的 toolcall_delta 事件
- 提取 `partial.arguments.path` 和 `partial.arguments.content`
- 发送增量数据到前端

#### 2. 保留完整的 tool_execution_start 事件

原有的 `tool_execution_start` 处理保持不变，发送完整的 `args` 对象：
```typescript
ws.send(JSON.stringify({
  type: "tool_start",
  tool: event.toolName,
  args: event.args,  // 包含完整的 path 和 content
}));
```

### 前端（chat.tsx）

#### 1. 扩展 WSMessage 类型

```typescript
type WSMessage =
  | { type: "tool_call_delta"; tool: string; path: string; content: string; contentIndex: number }
  | { type: "tool_call_start"; tool: string; contentIndex: number }
  | { type: "tool_start"; tool: string; args: any }
  | { type: "tool_end"; tool: string; success: boolean; result: string }
  // ... 其他类型
```

#### 2. 扩展 Message 类型

```typescript
type Message = {
  id: string;
  role: "user" | "assistant" | "tool";
  toolType?: "write" | "other";
  content: string;
  isStreaming?: boolean;
  isLoading?: boolean;
  fullPath?: string;        // 完整文件路径
  contentIndex?: number;     // 用于追踪工具调用
};
```

#### 3. 处理 tool_call_delta 事件

```typescript
case "tool_call_delta":
  if (data.tool === "write") {
    setMessages((prev) =>
      prev.map((msg) => {
        if (
          msg.role === "tool" &&
          msg.toolType === "write" &&
          msg.isLoading &&
          msg.contentIndex === data.contentIndex
        ) {
          const preview = data.content
            ? data.content.substring(0, 100).replace(/\n/g, "\\n")
            : "";
          return {
            ...msg,
            content: `📝 正在生成文件${data.path ? `: ${data.path}` : ""}...\n📄 内容: ${preview}${data.content && data.content.length > 100 ? "..." : ""}`,
            fullPath: data.path,
          };
        }
        return msg;
      })
    );
  }
  break;
```

#### 4. 处理 tool_start 事件

```typescript
case "tool_start":
  if (data.tool === "write") {
    const fileName = data.args?.path || "";
    const fileContent = data.args?.content || "";
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.role === "tool" && msg.toolType === "write" && msg.isLoading) {
          const fullContent = `📝 写入文件: ${fileName}\n\n📄 内容：\n\`\`\`\n${fileContent}\n\`\`\``;
          return {
            ...msg,
            content: fullContent,
            isLoading: false,
            fullPath: fileName,
          };
        }
        return msg;
      })
    );
  }
  break;
```

#### 5. 处理 tool_end 事件

```typescript
case "tool_end":
  if (data.tool === "write") {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.role === "tool" && msg.toolType === "write") {
          const size = data.result ? `${data.result.length} bytes` : "0 bytes";
          return {
            ...msg,
            content: data.success
              ? `${msg.content}\n\n✅ 写入完成！\n📁 文件: ${msg.fullPath || "unknown"}\n📊 大小: ${size}`
              : `❌ 写入失败\n\n${data.result}`,
            isLoading: false,
          };
        }
        return msg;
      })
    );
  }
  break;
```

## 用户体验

### 完整的显示流程

**阶段1：准备阶段**
```
📝 准备写入文件...
```

**阶段2：参数生成阶段**（实时更新）
```
📝 正在生成文件: custom/quick_sort.py...
📄 内容: def quick_sort(arr):
    """
    快速排序算法
    ...
```

**阶段3：执行阶段**
```
📝 写入文件: custom/quick_sort.py

📄 内容：
```python
def quick_sort(arr):
    """
    快速排序算法

    参数:
      arr: 要排序的列表

    返回:
      排序后的列表
    """
    if len(arr) <= 1:
        return arr
    ...
```
```

**阶段4：完成阶段**
```
✅ 写入完成！
📁 文件: custom/quick_sort.py
📊 大小: 1234 bytes
```

### 改进效果

| 改进点 | 之前 | 之后 |
|--------|------|------|
| 等待透明度 | 完全不知道在做什么 | 实时看到文件名和内容 |
| 内容可见性 | 突然显示完成 | 逐步展示完整内容 |
| 状态反馈 | 两态（准备/完成） | 四态（准备/生成/执行/完成） |
| 用户焦虑 | 不知道要等多久 | 可以看到正在生成什么 |

## 技术要点

### 1. 事件类型理解

- **toolcall_start/end**：LLM 生成工具调用的边界
- **toolcall_delta**：LLM 增量生成工具参数
- **tool_execution_start/end**：工具实际执行的边界

### 2. 数据结构

```typescript
// toolcall_delta 事件结构
{
  type: "toolcall_delta",
  contentIndex: number,
  delta: string,                    // JSON 增量
  partial: {
    content: [{
      type: "toolCall",
      name: "write",
      arguments: {
        path: string,
        content: string
      }
    }]
  }
}
```

### 3. 状态管理

使用 ref 跟踪当前正在生成的 write 工具：
```typescript
const currentWriteToolRef = useRef<{
  messageId: string | null;
  contentIndex: number | null;
}>({ messageId: null, contentIndex: null });
```

### 4. 关键代码位置

- **server.ts 第455-479行**：toolcall_delta 事件处理
- **server.ts 第488-498行**：tool_execution_start 事件处理
- **chat.tsx 第132-152行**：tool_call_delta 前端处理
- **chat.tsx 第270-285行**：tool_start 前端处理
- **chat.tsx 第327-345行**：tool_end 前端处理

## 已知限制

1. **toolcall_delta 的 arguments 可能不完整**
   - 缓解：只显示可用的部分
   - 如果 arguments 不可用，跳过阶段1

2. **大文件显示可能很长**
   - 可以考虑添加"展开/收起"功能
   - 或限制显示的行数

3. **多工具并发**
   - 当前实现使用 contentIndex 区分不同工具调用
   - 可能为每个 write 工具创建独立的消息条目

## 相关文件

- `server.ts` - 服务器端事件处理
- `frontend/chat.tsx` - 前端状态管理和显示逻辑
- `docs/write-tool-loading-debug.md` - 之前的 loading 状态问题排查
- `docs/pi-mono-tool-monitoring.md` - pi-mono 工具监听机制分析

## 参考资料

- [pi-mono GitHub](https://github.com/badlogic/pi-mono)
- [pi-agent-core README](../node_modules/@mariozechner/pi-agent-core/README.md)
