import { render } from "preact";
import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import { marked } from "marked";
import markedKatex from "marked-katex-extension";
import hljs from "highlight.js";

/// <reference lib="dom" />
/// <reference types="preact/jsx-runtime" />

marked.use(
  markedKatex({
    throwOnError: false,
    errorColor: "#ef4444",
  })
);

marked.setOptions({
  breaks: true,
  gfm: true,
});

const renderer = {
  code({ text, lang }: { text: string; lang?: string }) {
    const validLang = lang && hljs.getLanguage(lang) ? lang : "plaintext";
    const highlighted = hljs.highlight(text, { language: validLang }).value;
    return `<pre><code class="hljs language-${validLang}">${highlighted}</code></pre>`;
  },
};

marked.use({ renderer });

type Message = {
  id: string;
  role: "user" | "assistant" | "tool" | "thinking";
  toolType?: "write" | "other";
  toolName?: string; // 工具名称
  toolArgs?: any; // 工具参数
  toolResult?: string; // 工具执行结果
  content: string;
  isStreaming?: boolean;
  isLoading?: boolean;
  isTyping?: boolean; // 打字机效果状态
  fullPath?: string; // 完整文件路径
  contentIndex?: number; // 用于追踪工具调用
};

type WSMessage =
  | { type: "connected"; sessionId: string; message?: string }
  | { type: "session_switched"; sessionId: string }
  | { type: "message_start" }
  | { type: "message_end" }
  | { type: "text_delta"; delta: string }
  | { type: "thinking_start"; contentIndex: number }
  | { type: "thinking_delta"; delta: string }
  | { type: "thinking_end"; contentIndex: number; content: string }
  | { type: "tool_call_delta"; tool: string; path: string; content: string; contentIndex: number }
  | { type: "tool_call_start"; tool: string; contentIndex: number }
  | { type: "tool_start"; tool: string; args: any }
  | { type: "tool_end"; tool: string; success: boolean; result: string }
  | { type: "response_start" }
  | { type: "response_end" }
  | { type: "think_block"; content: string }
  | { type: "auth_success" }
  | { type: "error"; message: string };

function formatToolCard(toolName: string, args: any, result: string | null): string {
  let card = `🔧 **${toolName}**\n\n`;

  // Display arguments based on tool type
  if (toolName === "bash") {
    card += `**Command:** \`${args.command}\`\n`;
  } else if (toolName === "read") {
    card += `**File:** \`${args.file_path}\`\n`;
  } else if (toolName === "edit") {
    card += `**File:** \`${args.file_path}\`\n`;
  } else if (toolName === "grep") {
    card += `**Pattern:** \`${args.pattern}\`\n`;
    if (args.path) card += `**Path:** \`${args.path}\`\n`;
  } else if (toolName === "glob") {
    card += `**Pattern:** \`${args.pattern}\`\n`;
    if (args.path) card += `**Path:** \`${args.path}\`\n`;
  } else {
    // Generic - show all args
    card += `**Args:**\n\`\`\`json\n${JSON.stringify(args, null, 2)}\n\`\`\`\n`;
  }

  // Add result if available
  if (result) {
    // Truncate result if too long (except for edit and write)
    const maxResultLength = 500;
    const truncatedResult = result.length > maxResultLength
      ? result.substring(0, maxResultLength) + `\n... (${result.length - maxResultLength} more characters)`
      : result;
    card += `\n**Result:**\n\`\`\`\n${truncatedResult}\n\`\`\``;
  } else {
    card += `\n⏳ *Running...*`;
  }

  return card;
}

function formatMessage(content: string): string {
  // First escape HTML to prevent XSS
  let formatted = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Parse markdown
  try {
    formatted = marked.parse(formatted) as string;
  } catch (e) {
    console.error("Markdown parse error:", e);
  }

  return formatted;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [userScrolled, setUserScrolled] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [apiToken, setApiToken] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentWriteToolRef = useRef<{ messageId: string | null; contentIndex: number | null }>({
    messageId: null,
    contentIndex: null,
  });
  const currentThinkMessageRef = useRef<{ id: string | null }>({ id: null });
  const lastScrollTopRef = useRef<number>(0);

  const connect = useCallback((retryCount = 0) => {
    setIsConnecting(true);
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      // 连接建立后，发送认证请求（服务器会通过 Cookie 验证）
      console.log("WebSocket 已连接，发送认证请求");
      ws.send(JSON.stringify({ type: 'auth' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WSMessage;

        switch (data.type) {
          case "auth_success":
            console.log("WebSocket 认证成功");
            setIsConnecting(false);
            setIsConnected(true);
            break;

          case "connected":
            setSessionId(data.sessionId);
            break;

          // message_start/message_end 控制停止按钮（每轮消息显示）
          case "message_start":
            setIsResponding(true);
            streamingMessageIdRef.current = null;  // 重置文本流式消息引用
            currentThinkMessageRef.current = { id: null };  // 重置 think 消息引用
            break;

          case "message_end":
            setIsResponding(false);
            break;

          case "response_start":
            // response_start 作为备用保障（通常不需要，因为 message_start 已经设置）
            break;

          case "thinking_start":
            console.log(`[THINKING_START] ContentIndex: ${data.contentIndex}`);
            break;

          case "thinking_delta":
            console.log(`[THINKING_DELTA] ${data.delta.substring(0, 50)}...`);
            break;

          case "thinking_end":
            console.log(`[THINKING_END] ContentIndex: ${data.contentIndex}, Length: ${data.content?.length || 0}`);
            break;

          case "response_end":
            setIsResponding(false);
            streamingMessageIdRef.current = null;
            currentThinkMessageRef.current = { id: null };
            setMessages((prev) =>
              prev.map((msg) => ({ ...msg, isStreaming: false })),
            );
            break;

          case "tool_call_delta":
            if (data.tool === "write") {
              // Update the existing loading message with incremental content
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

          case "tool_call_start":
            if (data.tool === "write") {
              const newId = crypto.randomUUID();
              currentWriteToolRef.current = {
                messageId: newId,
                contentIndex: data.contentIndex,
              };
              // Show loading message as soon as LLM starts generating the tool call
              setMessages((prev) => [
                ...prev,
                {
                  id: newId,
                  role: "tool",
                  toolType: "write",
                  content: `📝 准备写入文件...`,
                  isStreaming: false,
                  isLoading: true,
                  contentIndex: data.contentIndex,
                },
              ]);
            }
            break;

          case "text_delta":
            if (!streamingMessageIdRef.current) {
              // Create new streaming message
              const newId = crypto.randomUUID();
              streamingMessageIdRef.current = newId;
              setMessages((prev) => [
                ...prev,
                { id: newId, role: "assistant", content: data.delta, isStreaming: true },
              ]);
            } else {
              // Update existing streaming message
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamingMessageIdRef.current
                    ? { ...msg, content: msg.content + data.delta }
                    : msg,
                ),
              );
            }
            break;

          case "think_block":
            // 创建或更新 think 消息
            if (!currentThinkMessageRef.current.id) {
              const newId = crypto.randomUUID();
              currentThinkMessageRef.current = { id: newId };
              setMessages((prev) => [
                ...prev,
                {
                  id: newId,
                  role: "thinking",
                  content: data.content,
                  isStreaming: true,
                },
              ]);
            } else {
              // 更新现有的 think 消息 - 累积内容
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === currentThinkMessageRef.current?.id
                    ? { ...msg, content: msg.content + data.content }
                    : msg,
                ),
              );
            }
            break;

          case "tool_start":
            if (data.tool === "write") {
              const fileName = data.args?.path || "";
              const fileContent = data.args?.content || "";
              // Update the existing loading message and start typing effect
              setMessages((prev) =>
                prev.map((msg) => {
                  if (msg.role === "tool" && msg.toolType === "write" && msg.isLoading) {
                    // Prepare full content with typing effect
                    const fullContent = `📝 写入文件: ${fileName}\n\n📄 内容：\n\`\`\`\n${fileContent}\n\`\`\``;
                    return {
                      ...msg,
                      content: fullContent,
                      isLoading: false,
                      isTyping: false, // 暂时禁用打字机动画，直接显示完整内容
                      fullPath: fileName,
                    };
                  }
                  return msg;
                })
              );
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  role: "tool",
                  toolType: "other",
                  toolName: data.tool,
                  toolArgs: data.args,
                  content: formatToolCard(data.tool, data.args, null),
                  isLoading: true,
                  isStreaming: false,
                },
              ]);
            }
            break;

          case "tool_end":
            if (data.tool === "write") {
              // Update the write message with completion status
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
                      isTyping: false,
                    };
                  }
                  return msg;
                })
              );
            } else {
              // Update other tool messages with the result
              setMessages((prev) =>
                prev.map((msg) => {
                  if (msg.role === "tool" && msg.toolType === "other" && msg.toolName === data.tool && msg.isLoading) {
                    return {
                      ...msg,
                      content: formatToolCard(data.tool, msg.toolArgs, data.result),
                      toolResult: data.result,
                      isLoading: false,
                    };
                  }
                  return msg;
                })
              );
            }
            break;

          case "error":
            console.error("WebSocket error:", data.message);
            break;
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      setIsConnecting(false);

      // 如果被拒绝（401 或 1008），重试连接
      if ((event.code === 1008 || event.code === 4001) && retryCount < 3) {
        console.log(`连接被拒绝，${1000}ms 后重试... (${retryCount + 1}/3)`);
        setTimeout(() => {
          connect(retryCount + 1);
        }, 1000);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnecting(false);
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    // 自动认证（本地前端）
    const checkAuth = async () => {
      try {
        // 调用内部认证接口，获取 token 和设置 Cookie
        const res = await fetch('/api/auth/internal');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setIsAuthenticated(true);
            // 立即连接 WebSocket
            connect();
          } else {
            console.error("自动认证失败");
          }
        } else {
          console.error("认证请求失败");
        }
      } catch (e) {
        console.error("认证请求异常", e);
      }
    };

    checkAuth();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [connect]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;

      // Track user scrolling
      const handleScroll = () => {
        const currentScrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const distanceFromBottom = scrollHeight - currentScrollTop - clientHeight;

        // User is scrolling up or not at bottom
        if (currentScrollTop < lastScrollTopRef.current || distanceFromBottom > 100) {
          setUserScrolled(true);
        } else if (distanceFromBottom < 50) {
          // User scrolled back near bottom
          setUserScrolled(false);
        }

        lastScrollTopRef.current = currentScrollTop <= 0 ? 0 : currentScrollTop;
      };

      container.addEventListener("scroll", handleScroll);

      return () => {
        container.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  useEffect(() => {
    if (messagesContainerRef.current && !userScrolled) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, userScrolled]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };

    if (showHistory) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showHistory]);

  const sendMessage = () => {
    const messageText = input.trim();
    if (!messageText || !wsRef.current || !isConnected) return;

    // Reset user scroll state when sending a new message
    setUserScrolled(false);

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: messageText,
      },
    ]);
    setInput("");

    // Reset streaming state
    streamingMessageIdRef.current = null;
    currentThinkMessageRef.current = { id: null };

    wsRef.current.send(
      JSON.stringify({
        type: "prompt",
        message: messageText,
      }),
    );
  };

  const handleStopClick = () => {
    if (isResponding && wsRef.current) {
      wsRef.current.send(
        JSON.stringify({
          type: "stop",
        }),
      );
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setMessages([]);
    setSessionId("");
    streamingMessageIdRef.current = null;
    currentThinkMessageRef.current = { id: null };
    connect();
  };

  const loadSessions = async () => {
    try {
      const res = await fetch("/api/sessions/list");
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (e) {
      console.error("Failed to load sessions:", e);
    }
  };

  const loadSessionMessages = async (sessionItem: any) => {
    setIsLoadingSession(true);
    try {
      const res = await fetch(`/api/sessions/${sessionItem.id}`);
      const data = await res.json();

      if (data.messages) {
        const loadedMessages: Message[] = data.messages.map((msg: any, idx: number) => ({
          id: `${idx}_${Date.now()}`,
          role: msg.role,
          content: msg.content,
        }));
        setMessages(loadedMessages);

        // Send switch session message to backend
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "switch_session",
            sessionId: data.sessionId,
          }));
        }

        setSessionId(data.sessionId);
      }
    } catch (e) {
      console.error("Failed to load session messages:", e);
    }
    setIsLoadingSession(false);
    setShowHistory(false);
  };

  const toggleHistory = () => {
    if (!showHistory) {
      loadSessions();
    }
    setShowHistory(!showHistory);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  };

  const deleteSession = async (sessionIdToDelete: string, e: Event) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/sessions/${sessionIdToDelete}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // Refresh sessions list
        loadSessions();
        // If deleted current session, clear chat
        if (sessionIdToDelete === sessionId) {
          setMessages([]);
          setSessionId("");
        }
      }
    } catch (e) {
      console.error("Failed to delete session:", e);
    }
  };

  const statusClass = isConnected ? "connected" : isConnecting ? "connecting" : "error";

  return (
    <>
      <div class="header">
        <div class={`status-dot ${statusClass}`} />
        <h1>MiniAgent Chat</h1>
        <div class="header-right">
          {sessionId && <span class="session-id">{sessionId}</span>}
          <button class="history-btn" onClick={toggleHistory}>history</button>
        </div>
        {showHistory && (
          <div class="history-dropdown" ref={dropdownRef}>
            <div class="history-dropdown-header">History</div>
            {isLoadingSession ? (
              <div class="history-dropdown-loading">Loading...</div>
            ) : sessions.length === 0 ? (
              <div class="history-dropdown-empty">No sessions</div>
            ) : (
              sessions.map((s) => (
                <div
                  class="history-dropdown-item"
                  key={s.id}
                >
                  <div class="history-item-content" onClick={() => loadSessionMessages(s)}>
                    <div class="history-item-question">
                      {s.first_question.length > 30
                        ? s.first_question.substring(0, 30) + "..."
                        : s.first_question}
                    </div>
                    <div class="history-item-time">{formatTime(s.created_at)}</div>
                  </div>
                  <button
                    class="history-delete-btn"
                    onClick={(e) => deleteSession(s.session_id, e)}
                    title="删除此会话"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div class="messages" ref={messagesContainerRef}>
        {messages.map((msg) => (
          msg.role === "thinking" ? (
            <div
              key={msg.id}
              class="mx-auto max-w-3xl rounded-lg bg-gray-100 p-4 my-2 border border-gray-200"
            >
              <details class="group" open={true}>
                <summary class="cursor-pointer font-semibold text-gray-700 flex items-center gap-2 hover:text-gray-900">
                  <span>💭 思考过程</span>
                  <span class="text-xs text-gray-500">
                    （点击展开/折叠）
                  </span>
                </summary>
                <div class="mt-3 text-sm text-gray-600 whitespace-pre-wrap bg-white p-3 rounded border border-gray-200">
                  {msg.content}
                </div>
              </details>
            </div>
          ) : (
            <div class={`message ${msg.role} ${msg.isLoading ? "loading" : ""}`} key={msg.id}>
              <div class="avatar">
                {msg.role === "user" ? "U" : msg.role === "tool" ? "T" : "AI"}
              </div>
              <div
                class="message-content"
                dangerouslySetInnerHTML={{
                  __html: msg.role === "tool" && msg.toolType !== "write"
                    ? msg.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")
                    : formatMessage(msg.content) + (msg.isLoading ? '<span class="loading-spinner"></span>' : '')
                }}
              />
            </div>
          )
        ))}
        {messages.some(m => m.role === 'assistant') && (
          <button class="clear-btn" onClick={clearChat}>🧹 Clear</button>
        )}
      </div>

      <div class="input-area">
        <div class="input-container">
          <input
            type="text"
            placeholder={isConnected ? "输入消息..." : "连接中..."}
            value={input}
            onInput={(e) => setInput((e.target as HTMLInputElement).value)}
            onKeyDown={handleKeyDown}
            disabled={!isConnected}
          />
          <button
            onClick={isResponding ? handleStopClick : sendMessage}
            disabled={isResponding ? false : (!isConnected || !input.trim())}
            class={isResponding ? "stop-btn" : ""}
          >
            {isResponding ? "停止" : "发送"}
          </button>
        </div>
      </div>
    </>
  );
}

render(<App />, document.getElementById("app")!);
