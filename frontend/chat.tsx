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
  role: "user" | "assistant" | "tool";
  toolType?: "write" | "other";
  content: string;
  isStreaming?: boolean;
  isLoading?: boolean;
  isTyping?: boolean; // 打字机效果状态
  fullPath?: string; // 完整文件路径
  contentIndex?: number; // 用于追踪工具调用
};

type WSMessage =
  | { type: "connected"; sessionId: string; message?: string }
  | { type: "text_delta"; delta: string }
  | { type: "tool_call_delta"; tool: string; path: string; content: string; contentIndex: number }
  | { type: "tool_call_start"; tool: string; contentIndex: number }
  | { type: "tool_start"; tool: string; args: any }
  | { type: "tool_end"; tool: string; success: boolean; result: string }
  | { type: "error"; message: string };

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

  const wsRef = useRef<WebSocket | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const currentWriteToolRef = useRef<{ messageId: string | null; contentIndex: number | null }>({
    messageId: null,
    contentIndex: null,
  });

  const connect = useCallback(() => {
    setIsConnecting(true);
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      setIsConnecting(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WSMessage;

        switch (data.type) {
          case "connected":
            setIsConnected(true);
            setSessionId(data.sessionId);
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

            // Reset completion timer
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
              // Mark streaming as complete
              streamingMessageIdRef.current = null;
              setMessages((prev) =>
                prev.map((msg) => ({ ...msg, isStreaming: false })),
              );
            }, 1000);
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
                  content: `🔧 执行工具: ${data.tool}\n📝 参数: ${JSON.stringify(data.args, null, 2)}`,
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

    ws.onclose = () => {
      setIsConnected(false);
      setIsConnecting(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnecting(false);
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();

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
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    const messageText = input.trim();
    if (!messageText || !wsRef.current || !isConnected) return;

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

    wsRef.current.send(
      JSON.stringify({
        type: "prompt",
        message: messageText,
      }),
    );
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const statusClass = isConnected ? "connected" : isConnecting ? "connecting" : "error";

  return (
    <>
      <div class="header">
        <div class={`status-dot ${statusClass}`} />
        <h1>MiniAgent Chat</h1>
        {sessionId && <span class="session-id">{sessionId}</span>}
      </div>

      <div class="messages" ref={messagesContainerRef}>
        {messages.map((msg) => (
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
        ))}
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
            onClick={sendMessage}
            disabled={!isConnected || !input.trim()}
          >
            发送
          </button>
        </div>
      </div>
    </>
  );
}

render(<App />, document.getElementById("app")!);
