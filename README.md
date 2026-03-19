# MiniAgent - 简单 Agent 实现

基于 `@mariozechner/pi-coding-agent` 的 Tool Calling 原理说明。

## 快速开始

```bash
# 安装依赖
bun install

# 配置 API Key
export ANTHROPIC_API_KEY=your_key_here

# 运行交互模式
bun run simple-agent.ts

# 运行示例
bun run simple-agent.ts --example
```

## Tool Calling 核心原理

```
┌─────────────────────────────────────────────────────────────────┐
│                         Tool Calling 流程                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 用户输入                                                      │
│     "帮我创建一个 TypeScript 文件"                                 │
│            ↓                                                     │
│  2. LLM 分析需求                                                  │
│     理解：需要创建文件 → 选择 write_file 工具                       │
│            ↓                                                     │
│  3. 工具调用                                                      │
│     {                                                             │
│       "tool": "write_file",                                      │
│       "arguments": {                                             │
│         "path": "math-utils.ts",                                 │
│         "content": "export function add..."                      │
│       }                                                           │
│     }                                                             │
│            ↓                                                     │
│  4. 执行工具                                                      │
│     writeFileTool.execute(params)                                │
│            ↓                                                     │
│  5. 返回结果                                                      │
│     { success: true }                                            │
│            ↓                                                     │
│  6. LLM 根据结果继续                                              │
│     "文件已创建成功，包含以下函数..."                               │
│            ↓                                                     │
│  7. 最终回复                                                      │
│     "我已经创建了 math-utils.ts 文件..."                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### ReAct 循环模式

Agent 使用 ReAct (Reasoning + Acting) 模式：

1. **Reason** - LLM 分析当前状态，决定下一步行动
2. **Act** - 执行工具调用
3. **Observe** - 观察工具执行结果
4. **循环** - 重复直到任务完成

## 代码结构

```typescript
// 1. 定义工具
const myTool: Tool = {
  name: "tool_name",
  description: "工具描述，LLM 根据这个决定何时使用",
  inputSchema: { /* 参数 JSON Schema */ },
  async execute(params) { /* 执行逻辑 */ }
};

// 2. 创建 Agent
const agent = new Agent({
  apiKey: "your_key",
  model: "claude-sonnet-4-6",
  systemPrompt: "你是一个编程助手...",
  tools: [myTool, ...]
});

// 3. 处理消息
const response = await agent.chat(userMessage);
```

## 内置工具

| 工具               | 功能            |
| ------------------ | --------------- |
| `bash`             | 执行 shell 命令 |
| `read_file`        | 读取文件内容    |
| `write_file`       | 写入文件        |
| `web_search`       | 网络搜索        |
| `get_current_time` | 获取当前时间    |

## 与 Krebs 的对应关系

| Krebs                        | 简单实现       |
| ---------------------------- | -------------- |
| `src/agent/tools/base.ts`    | Tool 接口定义  |
| `src/agent/tools/builtin.ts` | 工具实现示例   |
| `src/agent/core/agent.ts`    | Agent 核心逻辑 |
| `src/provider/`              | LLM Provider   |
| `src/agent/tool-parser.ts`   | 工具调用解析   |

## 参考资源

- [Anthropic Tool Use](https://docs.anthropic.com/claude/docs/tool-use)
- [pi-coding-agent](https://github.com/mariozechner/pi-coding-agent)
