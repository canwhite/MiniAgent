```
AgentEvent (最外层 - 整个会话)
├── agent_start              → Agent 开始
├── Turn (对话轮次)
│   ├── turn_start           → 轮次开始
│   ├── Message (消息)
│   │   ├── message_start    → 消息开始
│   │   ├── message_update   → 流式更新
│   │   │   ├── text_start/delta/end
│   │   │   ├── thinking_start/delta/end
│   │   │   └── toolcall_start/delta/end
│   │   └── message_end      → 消息结束
│   └── Turn Execution (工具执行 - 在 message_end 之后)
│       ├── tool_execution_start
│       ├── tool_execution_update
│       └── tool_execution_end
│   └── turn_end             → 轮次结束
└── agent_end { messages: AgentMessage[] }  → Agent 结束（包含所有消息）
```
