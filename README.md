# MiniAgent

基于 `@mariozechner/pi-coding-agent` 的 AI 编程助手，支持 Web UI 和交互式聊天。

## 特性

- 🤖 **智能代码生成** - 支持 DeepSeek 和 Claude 模型
- 📝 **文件读写** - 安全的文件操作，所有文件写入到 `custom/` 目录
- 🔧 **Bash 执行** - 在隔离环境中执行 shell 命令
- 🔍 **网络搜索** - 集成网络搜索能力
- 💬 **Web UI** - 实时聊天界面，支持 Markdown 和代码高亮
- 📊 **流式显示** - 实时显示文件写入进度和内容
- 🐛 **调试模式** - 可选的事件日志记录功能

## 快速开始

```bash
# 安装依赖
bun install

# 配置 API Key（二选一）
export DEEPSEEK_API_KEY=your_key_here    # 推荐，性价比高
# 或
export ANTHROPIC_API_KEY=your_key_here

# 启动服务器
bun run server.ts

# 访问 Web UI
open http://localhost:3000
```

## 环境配置

创建 `.env` 文件：

```bash
# API Key（必需）
DEEPSEEK_API_KEY=your_deepseek_key
# 或
ANTHROPIC_API_KEY=your_anthropic_key

# 服务器端口（可选，默认 3000）
PORT=3000

# 日志级别（可选）
LOG_LEVEL=NORMAL    # 只输出到控制台
LOG_LEVEL=DEBUG     # 输出到控制台并写入 monitor.log
```

## 功能演示

### 1. 代码生成

```
用户：帮我写一个 Python 快速排序

AI：我来帮你写一个 Python 版本的快速排序算法。

📝 准备写入文件...
📝 正在生成文件: custom/quick_sort.py...
📝 写入文件: custom/quick_sort.py

📄 内容：
def quick_sort(arr):
    """
    快速排序算法
    ...

✅ 写入完成！
📁 文件: custom/quick_sort.py
📊 大小: 1234 bytes
```

### 2. 代码执行

```
用户：运行这个快速排序

AI：好的，我来运行这个快速排序程序来测试一下。

🔧 执行工具: bash
📝 参数: {"command":"python custom/quick_sort.py"}

测试快速排序算法
==================================================
测试用例 1: [64, 34, 25, 12, 22, 11, 90]
  快速排序（新列表）: [11, 12, 22, 25, 34, 64, 90]
  ✓ 排序正确
...
```

### 3. 文件读取

```
用户：查看 quick_sort.py 的内容

AI：好的，让我读取这个文件的内容。

📄 文件内容：
def quick_sort(arr):
    ...
```

## 项目结构

```
MiniAgent/
├── server.ts           # WebSocket 服务器和 Agent 会话管理
├── index.ts            # HTTP 服务器和静态文件服务
├── frontend/           # Web UI 前端
│   ├── chat.html       # HTML 和 CSS 样式
│   └── chat.tsx        # React 组件和 WebSocket 客户端
├── lib/                # 工具库
│   └── logger.ts       # 日志工具（支持 NORMAL/DEBUG 模式）
├── custom/             # Agent 工作目录（所有文件写入此处）
├── docs/               # 文档
│   ├── architecture-overview.md    # 架构概览
│   ├── write-tool-loading-debug.md # Write Tool Loading 问题排查
│   ├── write-tool-streaming-display.md # 流式内容显示优化
│   └── pi-mono-tool-monitoring.md  # pi-mono 工具监听机制
└── schema/             # 数据模型定义
```

## 工具说明

| 工具 | 功能 | 示例 |
|------|------|------|
| `read` | 读取文件 | `读取 custom/app.py 的内容` |
| `write` | 写入文件 | `创建一个 hello.py 文件` |
| `bash` | 执行命令 | `运行 python hello.py` |
| `web_search` | 网络搜索 | `搜索 TypeScript 最新特性` |

## 工作原理

### Tool Calling 流程

```
┌─────────────────────────────────────────────────────────────────┐
│                         Tool Calling 流程                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 用户输入                                                      │
│     "帮我创建一个 TypeScript 文件"                                 │
│            ↓                                                     │
│  2. LLM 分析需求                                                  │
│     理解：需要创建文件 → 选择 write 工具                          │
│            ↓                                                     │
│  3. 工具调用生成（toolcall_delta）                                │
│     增量传输：path, content 等参数                                 │
│            ↓                                                     │
│  4. 工具执行（tool_execution_start）                             │
│     writeTool.execute(params) → 2ms 完成                         │
│            ↓                                                     │
│  5. 返回结果（tool_execution_end）                               │
│     { success: true, bytes: 1234 }                               │
│            ↓                                                     │
│  6. LLM 根据结果继续                                              │
│     "文件已创建成功，包含以下函数..."                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### ReAct 循环模式

Agent 使用 ReAct (Reasoning + Acting) 模式：

1. **Reason** - LLM 分析当前状态，决定下一步行动
2. **Act** - 执行工具调用
3. **Observe** - 观察工具执行结果
4. **循环** - 重复直到任务完成

### 事件流

```
toolcall_start      → LLM 开始生成工具调用
  ↓
toolcall_delta      → 增量传输参数（实时显示进度）
  ↓
toolcall_end        → LLM 完成工具调用生成
  ↓
tool_execution_start → 工具开始执行（2-4ms）
  ↓
tool_execution_end   → 工具执行完成
```

## 开发

### 添加新工具

```typescript
import { Type } from "@sinclair/typebox";

const myTool: ToolDefinition = {
  name: "my_tool",
  label: "My Tool",
  description: "工具描述",
  parameters: Type.Object({
    param1: Type.String({ description: "参数说明" }),
  }),
  execute: async (_toolCallId, params, _signal, _onUpdate, _ctx) => {
    // 工具执行逻辑
    return {
      content: [{ type: "text", text: "执行结果" }],
      details: {},
    };
  },
};

// 在 createAgentSession 中注册
tools: [
  createReadTool(cwd),
  createBashTool(join(cwd, "custom")),
  createWriteTool(join(cwd, "custom")),
  myTool,  // 添加新工具
],
```

### 日志调试

```bash
# 开启 DEBUG 模式
echo "LOG_LEVEL=DEBUG" > .env

# 重启服务器
bun run server.ts

# 查看日志
tail -f monitor.log
```

## 技术栈

- **后端**: Bun + TypeScript
- **前端**: Preact + Markdown + Highlight.js
- **AI**: `@mariozechner/pi-coding-agent`
- **通信**: WebSocket
- **样式**: 自定义 CSS（暗色主题）

## 参考资源

- [pi-mono GitHub](https://github.com/badlogic/pi-mono)
- [pi-coding-agent 文档](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent)
- [Anthropic Tool Use](https://docs.anthropic.com/claude/docs/tool-use)
- [项目文档](./docs/)

## License

MIT
