# pi-mono coding-agent Write Tool 监听机制分析

本文档分析 [pi-mono](https://github.com/badlogic/pi-mono) coding-agent 是如何监听 write tool 的写入操作的。

## 概述

pi-mono 的 coding-agent 通过事件流机制监听所有工具的执行生命周期，包括 write tool。监听基于 `AgentEvent` 类型定义的事件流。

## 事件类型定义

根据 `@mariozechner/pi-agent-core/dist/types.d.ts` (第139-177行)，工具执行事件包含三种类型：

```typescript
export type AgentEvent = {
    type: "tool_execution_start";
    toolCallId: string;
    toolName: string;
    args: any;
} | {
    type: "tool_execution_update";
    toolCallId: string;
    toolName: string;
    args: any;
    partialResult: any;
} | {
    type: "tool_execution_end";
    toolCallId: string;
    toolName: string;
    result: any;
    isError: boolean;
}
```

## 工具执行流程

根据 `@mariozechner/pi-agent-core/dist/agent-loop.js` (第207-276行)，工具执行的监听流程如下：

### 1. 开始 - tool_execution_start

**触发时机**: 工具调用前立即触发

```javascript
// agent-loop.js:214-219
stream.push({
    type: "tool_execution_start",
    toolCallId: toolCall.id,
    toolName: toolCall.name,
    args: toolCall.arguments,
});
```

### 2. 进行中 - tool_execution_update

**触发时机**: 工具执行过程中，通过 `onUpdate` 回调持续触发

```javascript
// agent-loop.js:226-234
result = await tool.execute(toolCall.id, validatedArgs, signal, (partialResult) => {
    stream.push({
        type: "tool_execution_update",
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        args: toolCall.arguments,
        partialResult,
    });
});
```

### 3. 结束 - tool_execution_end

**触发时机**: 工具执行完成或失败后触发

```javascript
// agent-loop.js:243-249
stream.push({
    type: "tool_execution_end",
    toolCallId: toolCall.id,
    toolName: toolCall.name,
    result,
    isError,
});
```

## Write Tool 实现

根据 `@mariozechner/pi-coding-agent/dist/core/tools/write.js`，write tool 的实现如下：

```javascript
export function createWriteTool(cwd, options) {
    return {
        name: "write",
        label: "write",
        description: "Write content to a file...",
        parameters: writeSchema,
        execute: async (_toolCallId, { path, content }, signal) => {
            // 文件写入实现...
            // 注意: 没有 onUpdate 参数
        },
    };
}
```

**关键发现**: write tool 的 `execute` 函数签名中**没有实现 `onUpdate` 回调参数**。

这意味着：
- write 操作是**原子性的**
- 要么成功，要么失败
- **不会触发** `tool_execution_update` 事件

## Write Tool 监听时机总结

| 事件类型 | 是否触发 | 说明 |
|----------|----------|------|
| `tool_execution_start` | ✅ 是 | 工具调用前立即触发 |
| `tool_execution_update` | ❌ 否 | write 是原子操作，无法中途报告进度 |
| `tool_execution_end` | ✅ 是 | 文件写入完成或失败后触发 |

## 对比 Bash Tool

bash tool 实现了完整的流式监听，对比参考：

```javascript
// @mariozechner/pi-coding-agent/dist/core/tools/bash.js:113
execute: async (_toolCallId, { command, timeout }, signal, onUpdate) => {
    // 接收输出时持续触发 update 事件
    if (onUpdate) {
        onUpdate({
            content: [{ type: "text", text: truncation.content || "" }],
            details: { ... }
        });
    }
}
```

| 工具 | start | update | end |
|------|-------|--------|-----|
| write | ✅ 触发 | ❌ 不触发 (原子操作) | ✅ 触发 |
| bash | ✅ 触发 | ✅ 持续触发 (流式输出) | ✅ 触发 |

## 监听实现示例

如果要监听 write tool 的执行，可以通过订阅 Agent 的事件流：

```typescript
agent.subscribe((event) => {
    if (event.type === "tool_execution_start" && event.toolName === "write") {
        console.log("开始写入文件:", event.args.path);
    }
    if (event.type === "tool_execution_end" && event.toolName === "write") {
        if (event.isError) {
            console.error("写入失败");
        } else {
            console.log("写入成功");
        }
    }
});
```

## 相关文件

- `node_modules/@mariozechner/pi-agent-core/dist/types.d.ts` - 事件类型定义
- `node_modules/@mariozechner/pi-agent-core/dist/agent-loop.js` - 工具执行流程
- `node_modules/@mariozechner/pi-coding-agent/dist/core/tools/write.js` - write tool 实现
- `node_modules/@mariozechner/pi-coding-agent/dist/core/tools/bash.js` - bash tool 实现（对比参考）

## 参考资料

- [pi-mono GitHub Repository](https://github.com/badlogic/pi-mono)
- [pi-agent-core README](../node_modules/@mariozechner/pi-agent-core/README.md)
