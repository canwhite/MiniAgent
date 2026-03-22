# Write Tool Loading 状态问题排查与解决

## 问题描述

在实现 write tool 的 loading 状态时，发现用户发送写文件请求后，前端界面会经历一段漫长的等待时间，然后突然直接显示"写入完成"，中间的"正在写入..." loading 状态完全没有显示出来。

用户期望的行为：
1. 写入开始 → 显示"写入中..."
2. 写入进行中 → 显示 loading 样式
3. 内容出现后 → loading 消失

实际行为：
- 漫长等待后直接显示"写入完成"

## 排查过程

### 1. 添加日志追踪

为了诊断问题，在 `server.ts` 中添加了详细的日志系统，将所有事件记录到 `monitor.log` 文件中：

```typescript
// 创建日志流
const logStream = fs.createWriteStream("./monitor.log", { flags: "a" });

const log = (message: string) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  logStream.write(logMessage);
};

// 订阅所有 session 事件
session.subscribe((event) => {
  log(`[EVENT] Type: ${event.type}`);
  // ... 处理各类事件
});
```

### 2. 分析日志数据

通过分析 `monitor.log`，发现了关键时间线：

```
[2026-03-22T03:08:44.495Z] [EVENT] Type: message_update
[2026-03-22T03:08:56.489Z] [EVENT] Type: tool_execution_start
[2026-03-22T03:08:56.490Z] [EVENT] Type: tool_execution_end
```

**关键发现**：

1. **03:08:44 - 03:08:56 (约12秒)**：LLM 生成快速排序代码的时间
   - 这段时间内只有 `message_update` 事件
   - 事件类型包括 `toolcall_delta`、`toolcall_start`、`toolcall_end`

2. **03:08:56.489 - 03:08:56.490 (1毫秒)**：write 工具实际执行时间
   - `tool_execution_start` 事件触发
   - `tool_execution_end` 事件触发

3. **对比 bash 工具**：
   ```
   [2026-03-22T03:08:58.944Z] [EVENT] Type: tool_execution_start
   [2026-03-22T03:08:59.146Z] [EVENT] Type: tool_execution_end
   ```
   bash 工具花了 202 毫秒，足够显示 loading 状态

### 3. 问题根源

**write 工具执行太快了！**

- 用户等待的"漫长时间"实际上是 LLM 生成代码的过程，不是工具执行
- write 工具本身只用了 1 毫秒
- 原来的代码只在 `tool_execution_start` 时显示 loading
- 但此时工具几乎立即就完成了，前端来不及显示 loading 状态

### 4. 事件类型分析

通过日志统计发现的事件类型：

```
1427 message_update    # LLM 流式响应
   6 message_start
   6 message_end
   3 turn_start
   3 turn_end
   2 tool_execution_start    # 工具实际执行开始
   2 tool_execution_end      # 工具实际执行结束
   1 tool_execution_update
   1 agent_start
   1 agent_end
```

`message_update` 中包含的子事件类型：
```
 976 "type":"text"
   2 "type":"text_end"
   3 "type":"text_start"
 975 "type":"toolCall"
 967 "type":"toolcall_delta"     # LLM 生成工具调用的增量
   2 "type":"toolcall_end"       # LLM 完成工具调用生成
   2 "type":"toolcall_start"     # LLM 开始生成工具调用
```

**关键洞察**：
- `toolcall_start`：LLM 开始生成工具调用（这时就应该显示 loading！）
- `tool_execution_start`：工具真正开始执行（这时才显示已经太晚了）

## 解决方案

### 1. 服务器端修改

在 `server.ts` 中添加对 `toolcall_start` 事件的处理：

```typescript
session.subscribe((event) => {
  if (event.type === "message_update") {
    if (event.assistantMessageEvent.type === "toolcall_start") {
      // LLM 开始生成工具调用 - 立即显示 loading
      const partial = event.assistantMessageEvent.partial;
      const toolCall = partial.content?.[event.assistantMessageEvent.contentIndex];
      if (toolCall && toolCall.type === "toolCall") {
        ws.send(
          JSON.stringify({
            type: "tool_call_start",
            tool: toolCall.name,
            contentIndex: event.assistantMessageEvent.contentIndex,
          }),
        );
      }
    }
  }
  // ... 其他事件处理
});
```

### 2. 前端修改

**添加新的消息类型**：

```typescript
type WSMessage =
  | { type: "connected"; sessionId: string; message?: string }
  | { type: "text_delta"; delta: string }
  | { type: "tool_call_start"; tool: string; contentIndex: number }  // 新增
  | { type: "tool_start"; tool: string; args: any }
  | { type: "tool_end"; tool: string; success: boolean; result: string }
  | { type: "error"; message: string };
```

**处理 tool_call_start 事件**：

```typescript
case "tool_call_start":
  if (data.tool === "write") {
    // LLM 开始生成工具调用时立即显示 loading
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "tool",
        toolType: "write",
        content: `📝 准备写入文件...`,
        isStreaming: false,
        isLoading: true,
      },
    ]);
  }
  break;
```

**更新 tool_start 事件处理**：

```typescript
case "tool_start":
  if (data.tool === "write") {
    const fileName = data.args?.path || "";
    // 更新已有的 loading 消息，显示文件名
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.role === "tool" && msg.toolType === "write" && msg.isLoading) {
          return {
            ...msg,
            content: `📝 写入文件: ${fileName}\n\n⏳ 正在写入...`,
          };
        }
        return msg;
      })
    );
  }
  break;
```

### 3. CSS Loading 动画

在 `chat.html` 中添加 loading 样式：

```css
/* Loading styles */
.message.tool.loading .message-content {
  opacity: 0.7;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { opacity: 0.5; }
  50% { opacity: 0.8; }
  100% { opacity: 0.5; }
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-left: 0.5rem;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

## 最终效果

现在的时间线变成：

1. **LLM 开始生成工具调用** → 立即显示 "📝 准备写入文件..."（loading 动画）
2. **工具参数解析完成** → 更新为 "📝 写入文件: xxx\n\n⏳ 正在写入..."（loading 动画）
3. **工具执行完成** → 显示 "✅ 写入完成"（loading 消失）

用户在整个过程中都能看到进度反馈，体验大幅改善。

## 经验总结

1. **快操作也需要 loading**：即使操作本身很快（1毫秒），如果用户等待时间很长（12秒），也需要在等待开始时就显示 loading

2. **区分 LLM 生成和工具执行**：
   - `toolcall_start/end`：LLM 生成工具调用
   - `tool_execution_start/end`：工具实际执行
   - 对于快速操作，应该在 LLM 开始生成时就显示 loading

3. **日志是调试的利器**：通过详细的事件日志，才能准确找出性能瓶颈和时间线

4. **事件流的重要性**：理解完整的事件流（agent → message → toolcall → tool_execution）对于正确实现 UI 状态至关重要

## 相关文件

- `server.ts` - WebSocket 服务器和事件处理
- `frontend/chat.tsx` - 前端 React 组件和状态管理
- `frontend/chat.html` - HTML 和 CSS 样式
- `monitor.log` - 事件日志文件（运行时生成）
- `docs/pi-mono-tool-monitoring.md` - pi-mono 工具监听机制分析
