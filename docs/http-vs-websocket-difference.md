# HTTP vs WebSocket 事件处理机制差异

## 目录
- [什么是 Turn？](#什么是-turn)
- [核心区别对比](#核心区别对比)
- [详细流程分析](#详细流程分析)
- [为什么 waitForSessionComplete 在 WebSocket 中无效？](#为什么-waitsessioncomplete-在-websocket-中无效)
- [正确的解决方案](#正确的解决方案)

## 什么是 Turn？

**Turn（对话轮次）** = 一次完整的"用户消息 → AI 处理 → AI 响应"周期

```
┌─────────────────────────────────────────────────────────┐
│  Agent（整个会话）                                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Turn 1（第一轮对话）                              │  │
│  │  用户: "帮我读取文件"                              │  │
│  │  turn_start → message_start → AI 思考            │  │
│  │  → 调用 read 工具 → 返回结果 → message_end        │  │
│  │  → turn_end                                        │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Turn 2（第二轮对话）                              │  │
│  │  用户: "文件里有什么内容？"                        │  │
│  │  turn_start → message_start → AI 思考            │  │
│  │  → 生成回答 → message_end → turn_end              │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 事件层级结构

```
Agent（整个会话）
 └── agent_start
 └── Turn（一次对话轮次）
     └── turn_start
     └── Message（一条消息）
         ├── message_start
         ├── message_update（流式更新）
         │   ├── text_delta（文本增量）
         │   ├── toolcall_start（工具调用生成开始）
         │   ├── toolcall_delta（工具调用参数增量）
         │   └── toolcall_end（工具调用生成结束）
         └── message_end
     └── Tool Execution（工具实际执行）
         ├── tool_execution_start
         ├── tool_execution_update
         └── tool_execution_end
     └── turn_end
 └── agent_end
```

## 核心区别对比

| 特性 | HTTP | WebSocket |
|------|------|-----------|
| **订阅时机** | 调用 `prompt()` **之后**订阅 | 连接建立时**立即**订阅 |
| **等待方式** | `await waitForSessionComplete()` 阻塞等待 | 在事件回调中处理 |
| **`message_end` 处理** | 订阅还没开始，等待事件到来 | 订阅已存在，**在回调中**收到事件 |
| **文件读取时机** | `waitForSessionComplete` 返回后读取 | 在 `message_end` 回调中读取 |
| **响应方式** | 一次性返回完整结果 | 流式推送实时更新 |

## 详细流程分析

### HTTP 方式（阻塞式）

```
用户请求 → HTTP 服务器
    ↓
session.prompt(message)  ← 触发 AI 开始工作
    ↓
【此时开始订阅事件】
session.subscribe((event) => {
  if (event.type === "message_end") {
    resolve()  ← 等待这个事件
  }
})
    ↓
【等待中...】AI 产生一系列事件：
  - message_start
  - message_update (text_delta) × N
  - message_end ← 收到！resolve()
    ↓
读取文件 → 返回响应
```

**代码位置：** `server.ts` 第 486-489 行
```typescript
await session.prompt(message);

// 等待 session 完成（message_end 事件或 isStreaming 为 false）
await waitForSessionComplete(session, logger);
```

### WebSocket 方式（事件驱动）

```
WebSocket 连接建立
    ↓
【立即订阅事件】session.subscribe() ← 第772行
    ↓
用户发送消息 → session.prompt(message)
    ↓
【实时接收事件】AI 产生的事件实时推送：
  - message_start → 推送给前端
  - message_update (text_delta) → 推送给前端
  - message_update (text_delta) → 推送给前端
  ...
  - message_end ← 我们在这里！
    ↓
【问题】在 message_end 回调里尝试读取文件
         但此时订阅已经建立了，事件正在处理中
```

**代码位置：** `server.ts` 第 772 行
```typescript
// WebSocket 连接建立时立即订阅
session.subscribe((event) => {
  if (event.type === "message_end") {
    // 在回调中处理 message_end
    // 尝试读取文件...
  }
});
```

## 为什么 waitForSessionComplete 在 WebSocket 中无效？

### 问题演示

```typescript
// WebSocket 的订阅（第772行）
session.subscribe((event) => {
  if (event.type === "message_end") {
    // 我们在这里！
    // 如果调用 waitForSessionComplete...
  }
})

// waitForSessionComplete 内部也是
session.subscribe((event) => {
  if (event.type === "message_end") {
    resolve()  // 但事件已经触发过了！
  }
})
```

### 时序问题

```
时间线：
t0: WebSocket 订阅事件（第772行）
t1: 用户发送消息
t2: session.prompt(message) 触发
t3: AI 开始工作...
t4: message_end 事件触发
    ↓
    WebSocket 收到 message_end
    进入回调处理
    ↓
    调用 waitForSessionComplete()
    ↓
    waitForSessionComplete 内部订阅事件
    但 message_end 已经触发过了！
    ↓
    等待下一个 message_end（永远不会来）
    或者超时失败
```

**关键点：** 当我们在 WebSocket 的 `message_end` 回调中调用 `waitForSessionComplete` 时，`message_end` 事件**已经触发并且正在处理中**。新订阅的 `waitForSessionComplete` 会等待**下一个** `message_end` 事件，但当前 Turn 只有一个 `message_end`。

## 正确的解决方案

### 使用重试机制

由于 `message_end` 事件已触发，但文件可能还未完全写入，应该使用**重试机制**而不是等待事件：

```typescript
// message_end 事件已触发，但文件可能还未完全写入
// 使用重试机制读取文件，避免因时序问题导致失败
const maxRetries = 5;
const retryDelay = 100; // 100ms

for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    const fullTextResponse = await getLastAssistantMessageFromFile(
      sessionFilePath,
      logger,
    );
    const generatedContent = extractFromSessionText(
      fullTextResponse,
      logger,
    );

    ws.send(
      JSON.stringify({
        type: "response_end",
        generatedContent: generatedContent,
      }),
    );
    break; // 成功，退出重试循环
  } catch (error: any) {
    if (attempt === maxRetries) {
      // 最后一次重试失败
      logger.log(
        `[SESSION] 读取文件失败（已重试 ${maxRetries} 次）: ${error.message}`,
      );
      ws.send(
        JSON.stringify({
          type: "response_end",
          generatedContent: undefined,
        }),
      );
    } else {
      // 等待后重试
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
}
```

### 为什么重试机制有效？

1. **不依赖事件**：直接尝试读取文件，不等待新的事件
2. **给 PI SDK 时间**：每次重试间隔 100ms，给 PI SDK 时间完成文件写入
3. **有限重试**：最多重试 5 次，避免无限等待
4. **优雅降级**：如果最终还是失败，返回 `undefined` 而不是阻塞

## 总结

| 场景 | 解决方案 | 原因 |
|------|----------|------|
| **HTTP** | `await waitForSessionComplete()` | 订阅在 `prompt()` 之后，等待 `message_end` 事件 |
| **WebSocket** | 重试机制 | 订阅在连接时，`message_end` 已触发，无法等待 |

## 相关文件

- `server.ts` - HTTP 和 WebSocket 实现
- `docs/pi-sdk-event-structure.md` - PI SDK 事件结构详解
- `docs/http-api-timeout-refactor.md` - HTTP API 超时处理重构
