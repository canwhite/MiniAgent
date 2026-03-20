import { render } from "preact";
import { useState, useEffect, useRef, useCallback } from "preact/hooks";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type WSMessage =
  | { type: "connected"; sessionId: string; message?: string }
  | { type: "text_delta"; delta: string }
  | { type: "error"; message: string };

function formatMessage(content: string): string {
  let formatted = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  formatted = formatted.replace(
    /```(\w+)?\n([\s\S]*?)```/g,
    (_, lang, code) => {
      return `<pre><code>${code.trim()}</code></pre>`;
    },
  );

  formatted = formatted.replace(/`([^`]+)`/g, "<code>$1</code>");

  formatted = formatted
    .split("\n\n")
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  return formatted;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [currentResponse, setCurrentResponse] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const currentResponseRef = useRef("");
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

          case "text_delta":
            currentResponseRef.current += data.delta;
            setCurrentResponse(currentResponseRef.current);

            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
              if (currentResponseRef.current) {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: currentResponseRef.current,
                  },
                ]);
                currentResponseRef.current = "";
                setCurrentResponse("");
              }
            }, 1000);
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentResponse]);

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

    currentResponseRef.current = "";
    setCurrentResponse("");

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

  return (
    <>
      <div class="header">
        <div
          class={`status-dot ${
            isConnected ? "connected" : isConnecting ? "connecting" : "error"
          }`}
        />
        <h1>MiniAgent Chat</h1>
        {sessionId && <span class="session-id">{sessionId}</span>}
      </div>

      <div class="messages">
        {messages.map((msg) => (
          <div class={`message ${msg.role}`}>
            <div class="avatar">{msg.role === "user" ? "U" : "AI"}</div>
            <div
              class="message-content"
              dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
            />
          </div>
        ))}

        {currentResponse && (
          <div class="message assistant">
            <div class="avatar">AI</div>
            <div
              class="message-content"
              dangerouslySetInnerHTML={{
                __html: formatMessage(currentResponse),
              }}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
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
