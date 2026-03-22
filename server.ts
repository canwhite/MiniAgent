import {
  createAgentSession,
  type ToolDefinition,
  createBashTool,
  createReadTool,
  createWriteTool,
  createEditTool,
  SessionManager,
  AuthStorage,
  ModelRegistry,
  createExtensionRuntime,
} from "@mariozechner/pi-coding-agent";
import type { Model } from "@mariozechner/pi-ai";
import { join } from "path";
import { MonitorLogger } from "./lib/logger.js";
import { saveSessionMeta, getAllSessions, getSessionById } from "./db/index.js";
import { getCurrentTimeTool } from "./tools/index.js";
import { existsSync, readdirSync, readFileSync } from "fs";

const apiKey =
  process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY || "";
const useDeepSeek = !!process.env.DEEPSEEK_API_KEY;

if (!apiKey) {
  console.error("错误：未设置 API Key 环境变量");
  console.error("请设置以下之一：");
  console.error("  export DEEPSEEK_API_KEY=your_key_here  # 使用 DeepSeek");
  console.error("  export ANTHROPIC_API_KEY=your_key_here  # 使用 Claude");
  process.exit(1);
}

function createDeepSeekModel(): Model<"openai-completions"> {
  return {
    id: "deepseek-chat",
    name: "DeepSeek Chat",
    api: "openai-completions",
    provider: "deepseek",
    baseUrl: "https://api.deepseek.com/v1",
    reasoning: false,
    input: ["text", "image"] as ("text" | "image")[],
    cost: { input: 0.27, output: 1.1, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 64000,
    maxTokens: 8000,
    compat: {
      supportsReasoningEffort: false,
    },
  };
}

const systemPrompt = `你是一个专业的编程助手，可以帮助用户完成各种开发任务。

你的能力包括：
- 执行 shell 命令
- 读写文件（重要：必须使用 write 工具来写文件，所有文件都会被自动保存到 custom 子目录）
- 编辑文件（使用 edit 工具修改文件中的特定内容）
- 网络搜索
- 获取当前时间

工作原则：
1. 理解用户需求，选择合适的工具
2. 写新文件时必须使用 write 工具
3. 修改现有文件时优先使用 edit 工具（指定 path、oldText 和 newText）
4. 按照工具的参数要求正确调用
5. 根据工具结果继续处理或给出最终答案
6. 如果任务复杂，可以分步骤完成
7. 遇到错误时，尝试分析原因并给出解决建议

请始终使用中文回复用户。`;

import { type AgentSession } from "@mariozechner/pi-coding-agent";

const sessions = new Map<string, AgentSession>();

async function getSessionMessages(id: string) {
  const sessionMeta = getSessionById(id) as any;
  if (!sessionMeta || !sessionMeta.file_path) {
    return null;
  }

  const filePath = sessionMeta.file_path;
  
  if (!existsSync(filePath)) {
    return null;
  }

  const fileContent = readFileSync(filePath, "utf-8");
  
  const messages: any[] = [];
  const lines = fileContent.split("\n").filter(Boolean);
  
  for (const line of lines) {
    try {
      const data = JSON.parse(line);
      if (data.type === "message") {
        const msg = data.message;
        let content = "";
        
        if (msg.role === "user") {
          content = msg.content?.[0]?.text || "";
        } else if (msg.role === "assistant") {
          content = msg.content?.map((c: any) => {
            if (c.type === "text") return c.text;
            if (c.type === "toolCall") return `[调用工具: ${c.name}]`;
            return "";
          }).join("") || "";
        } else if (msg.role === "toolResult") {
          content = msg.content?.[0]?.text || "";
        }
        
        if (content) {
          messages.push({
            role: msg.role === "toolResult" ? "tool" : msg.role,
            content,
            timestamp: msg.timestamp,
          });
        }
      }
    } catch (e) {
      // Skip invalid JSON lines
    }
  }
  
  return { sessionId: sessionMeta.session_id, messages };
}

async function createSession(sessionId: string) {
  const cwd = process.cwd();
  const sessionsPath = join(cwd, "sessions");
  const authStorage = new AuthStorage();
  const modelRegistry = new ModelRegistry(authStorage);

  // Create sessionManager first and capture reference
  const sessionManager = SessionManager.create(cwd, join(cwd, "sessions"));

  if (useDeepSeek) {
    authStorage.setRuntimeApiKey("deepseek", apiKey);
  }

  const model = useDeepSeek
    ? createDeepSeekModel()
    : (() => {
        const { getModel } = require("@mariozechner/pi-ai");
        return getModel("anthropic", "claude-sonnet-4-20250514");
      })();

  const result = await createAgentSession({
    cwd,
    model,
    thinkingLevel: "off",
    authStorage,
    modelRegistry,
    tools: [
      createReadTool(cwd),
      createBashTool(join(cwd, "custom")),
      createWriteTool(join(cwd, "custom")),
      createEditTool(cwd),
    ],
    customTools: [getCurrentTimeTool],
    sessionManager,
    resourceLoader: {
      getExtensions: () => ({
        extensions: [],
        errors: [],
        runtime: createExtensionRuntime(),
      }),
      getSkills: () => ({
        skills: [
          {
            name: "web-search-tool",
            description:
              "提供网页搜索功能示例，演示如何使用 curl 进行 HTTP 请求",
            filePath:
              "/Users/zack/Desktop/MiniAgent/skills/web-search-tool/SKILL.md",
            baseDir: "/Users/zack/Desktop/MiniAgent/skills/web-search-tool",
            source: "inline",
            disableModelInvocation: false,
          },
        ],
        diagnostics: [],
      }),
      getPrompts: () => ({ prompts: [], diagnostics: [] }),
      getThemes: () => ({ themes: [], diagnostics: [] }),
      getAgentsFiles: () => ({ agentsFiles: [] }),
      getSystemPrompt: () => systemPrompt,
      getAppendSystemPrompt: () => [],
      getPathMetadata: () => new Map(),
      extendResources: () => {},
      reload: async () => {},
    },
  });

  // Wait a bit for the session file to be created (needed for async file creation)
  // 已移除，改为在发送第一条消息时获取文件路径

  sessions.set(sessionId, result.session);
  return { session: result.session };
}

function getSession(sessionId: string) {
  return sessions.get(sessionId);
}

function deleteSession(sessionId: string) {
  const session = sessions.get(sessionId);
  if (session) {
    session.dispose();
    sessions.delete(sessionId);
  }
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const PORT = process.env.PORT ? parseInt(process.env.PORT ?? "3000", 10) : 3000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function getContentType(filePath: string): string {
  const ext = filePath.split(".").pop();
  const types: Record<string, string> = {
    js: "application/javascript; charset=utf-8",
    ts: "application/javascript; charset=utf-8",
    tsx: "application/javascript; charset=utf-8",
    jsx: "application/javascript; charset=utf-8",
    css: "text/css; charset=utf-8",
    html: "text/html; charset=utf-8",
    json: "application/json; charset=utf-8",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    ico: "image/x-icon",
  };
  return types[ext || ""] || "application/octet-stream";
}

async function handleApiMessage(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as { message?: string; sessionId?: string };
    const { message, sessionId } = body;

    if (!message || typeof message !== "string") {
      return Response.json(
        { error: "缺少 'message' 字段" },
        { status: 400, headers: corsHeaders },
      );
    }

    let session: AgentSession;
    let usedSessionId: string;

    if (sessionId) {
      const existing = getSession(sessionId);
      if (existing) {
        session = existing;
        usedSessionId = sessionId;
      } else {
        return Response.json(
          { error: "Session 不存在" },
          { status: 404, headers: corsHeaders },
        );
      }
    } else {
      usedSessionId = generateSessionId();
      const result = await createSession(usedSessionId);
      session = result.session;
    }

    const events: any[] = [];
    session.subscribe((event) => {
      events.push(event);
    });

    // Get session file path from PI SDK (created when session is initialized)
    const sessionFilePath = session.sessionFile;

    await session.prompt(message);

    // Only save if this is a new session (no existing sessionId in request)
    if (!sessionId && sessionFilePath) {
      saveSessionMeta(usedSessionId, message, sessionFilePath);
    }

    const textResponse = events
      .filter(
        (e) =>
          e.type === "message_update" &&
          e.assistantMessageEvent.type === "text_delta",
      )
      .map((e) => e.assistantMessageEvent.delta)
      .join("");

    return Response.json(
      {
        sessionId: usedSessionId,
        response: textResponse,
      },
      { headers: corsHeaders },
    );
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: 500, headers: corsHeaders },
    );
  }
}

async function handleCreateSession(): Promise<Response> {
  const sessionId = generateSessionId();
  await createSession(sessionId);
  return Response.json(
    { sessionId, message: "Session 已创建" },
    { headers: corsHeaders },
  );
}

function handleDeleteSession(sessionId: string): Response {
  const session = getSession(sessionId);
  if (!session) {
    return Response.json(
      { error: "Session 不存在" },
      { status: 404, headers: corsHeaders },
    );
  }
  deleteSession(sessionId);
  return Response.json({ message: "Session 已删除" }, { headers: corsHeaders });
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/ws") {
      const upgraded = server.upgrade(req);
      if (upgraded) {
        return undefined;
      }
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    if (url.pathname === "/api/messages" && req.method === "POST") {
      return handleApiMessage(req);
    }

    if (url.pathname === "/api/sessions" && req.method === "POST") {
      return handleCreateSession();
    }

    if (url.pathname === "/api/sessions/list" && req.method === "GET") {
      const allSessions = getAllSessions();
      return Response.json({ sessions: allSessions }, { headers: corsHeaders });
    }

    if (url.pathname.startsWith("/api/sessions/") && req.method === "GET") {
      const id = url.pathname.split("/").pop()!;
      const sessionMessages = await getSessionMessages(id);
      if (!sessionMessages) {
        return Response.json({ error: "Session 不存在" }, { status: 404, headers: corsHeaders });
      }
      return Response.json(sessionMessages, { headers: corsHeaders });
    }

    if (url.pathname.startsWith("/api/sessions/") && req.method === "DELETE") {
      const sessionId = url.pathname.split("/").pop()!;
      return handleDeleteSession(sessionId);
    }

    if (url.pathname === "/health" && req.method === "GET") {
      return Response.json(
        { status: "ok", sessions: sessions.size },
        { headers: corsHeaders },
      );
    }

    // Serve chat UI
    if (url.pathname === "/" && req.method === "GET") {
      return new Response(Bun.file("./frontend/chat.html"), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Serve frontend static files with Bun's transpiler
    if (url.pathname.startsWith("/frontend/")) {
      const filePath = "." + url.pathname;
      const file = Bun.file(filePath);

      // Check if file exists
      if (await file.exists()) {
        // For TSX/JSX files, transpile on the fly
        if (filePath.endsWith(".tsx") || filePath.endsWith(".jsx")) {
          const transpiled = await Bun.build({
            entrypoints: [filePath],
            target: "browser",
            minify: false,
            jsx: {
              runtime: "automatic",
              importSource: "preact",
            },
          });

          return new Response(transpiled.outputs[0], {
            headers: {
              "Content-Type": "application/javascript; charset=utf-8",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }

        return new Response(file, {
          headers: {
            "Content-Type": getContentType(filePath),
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
  websocket: {
    open(ws) {
      console.log("[WebSocket] 新连接已建立");
      const sessionId = generateSessionId();

      // Create logger instance
      const logger = MonitorLogger.createInstance();
      (ws as any).data = { sessionId, logger };

      logger.log(`[SESSION] Session ${sessionId} started, WebSocket opened`);

      createSession(sessionId).then((result) => {
        const session = result.session;
        (ws as any).data.firstMessageSaved = false;
        ws.send(
          JSON.stringify({
            type: "connected",
            sessionId,
            message: "WebSocket 连接已建立",
          }),
        );

        logger.log(`[SESSION] Session created successfully`);

        session.subscribe((event) => {
          logger.log(`[EVENT] Type: ${event.type}`);

          if (event.type === "message_update") {
            if (event.assistantMessageEvent.type === "text_delta") {
              ws.send(
                JSON.stringify({
                  type: "text_delta",
                  delta: event.assistantMessageEvent.delta,
                }),
              );
            } else if (event.assistantMessageEvent.type === "toolcall_start") {
              // LLM started generating a tool call - show loading immediately
              const partial = event.assistantMessageEvent.partial;
              const toolCall =
                partial.content?.[event.assistantMessageEvent.contentIndex];
              if (toolCall && toolCall.type === "toolCall") {
                logger.log(
                  `[TOOLCALL_START] Tool: ${toolCall.name}, ContentIndex: ${event.assistantMessageEvent.contentIndex}`,
                );
                ws.send(
                  JSON.stringify({
                    type: "tool_call_start",
                    tool: toolCall.name,
                    contentIndex: event.assistantMessageEvent.contentIndex,
                  }),
                );
              }
            } else if (event.assistantMessageEvent.type === "toolcall_delta") {
              // Tool call arguments are being streamed - send incremental updates for write tool
              const partial = event.assistantMessageEvent.partial;
              const toolCall =
                partial.content?.[event.assistantMessageEvent.contentIndex];
              if (toolCall?.type === "toolCall" && toolCall.name === "write") {
                const args = (toolCall.arguments || {}) as {
                  path?: string;
                  content?: string;
                };
                logger.log(
                  `[TOOLCALL_DELTA] Tool: write, Path: ${args.path || "(generating)"}, Content length: ${args.content?.length || 0}`,
                );
                ws.send(
                  JSON.stringify({
                    type: "tool_call_delta",
                    tool: "write",
                    path: args.path || "",
                    content: args.content || "",
                    contentIndex: event.assistantMessageEvent.contentIndex,
                  }),
                );
              }
            } else if (event.assistantMessageEvent.type === "toolcall_end") {
              // LLM finished generating the tool call
              logger.log(
                `[TOOLCALL_END] ContentIndex: ${event.assistantMessageEvent.contentIndex}`,
              );
            } else {
              logger.log(
                `[MESSAGE_UPDATE] ${JSON.stringify(event.assistantMessageEvent).substring(0, 200)}...`,
              );
            }
          } else if (event.type === "tool_execution_start") {
            logger.log(
              `[TOOL_EXECUTION_START] Tool: ${event.toolName}, Args: ${JSON.stringify(event.args).substring(0, 100)}...`,
            );
            ws.send(
              JSON.stringify({
                type: "tool_start",
                tool: event.toolName,
                args: event.args,
              }),
            );
          } else if (event.type === "tool_execution_end") {
            const result = event.result;
            const content = result?.content?.[0]?.text || "";
            logger.log(
              `[TOOL_EXECUTION_END] Tool: ${event.toolName}, Success: ${!event.isError}, Result length: ${content.length}`,
            );
            ws.send(
              JSON.stringify({
                type: "tool_end",
                tool: event.toolName,
                success: !event.isError,
                result: content,
              }),
            );
          }
        });
      });
    },
    async message(ws, message) {
      try {
        const data = JSON.parse(message.toString()) as {
          type?: string;
          message?: string;
          sessionId?: string;
        };
        const sessionId = (ws as any).data?.sessionId;
        const session = getSession(sessionId!);

        if (!session) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Session 不存在",
            }),
          );
          return;
        }

        if (data.type === "switch_session" && data.sessionId) {
          console.log(`[WebSocket] 切换 session 到: ${data.sessionId}`);

          const sessionMeta = getSessionById(data.sessionId);
          if (!sessionMeta || !sessionMeta.file_path) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Session 不存在或文件路径无效",
              }),
            );
            return;
          }

          try {
            const success = await session.switchSession(sessionMeta.file_path);
            if (success) {
              // Update sessions Map mapping
              sessions.set(data.sessionId, session);

              // Remove old sessionId mapping if different
              if (sessionId && sessionId !== data.sessionId) {
                sessions.delete(sessionId);
              }

              // Update the sessionId in ws.data
              (ws as any).data.sessionId = data.sessionId;
              (ws as any).data.firstMessageSaved = true; // Existing session, don't save meta again

              ws.send(
                JSON.stringify({
                  type: "session_switched",
                  sessionId: data.sessionId,
                }),
              );
              console.log(`[WebSocket] Session 切换成功: ${data.sessionId}`);
            } else {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "切换 session 失败",
                }),
              );
            }
          } catch (error: any) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: `切换 session 出错: ${error.message}`,
              }),
            );
          }
        } else if (data.type === "prompt" && typeof data.message === "string") {
          console.log(`[WebSocket] 收到消息: ${data.message}`);

          const firstMessageSaved = (ws as any).data?.firstMessageSaved;
          if (!firstMessageSaved) {
            // Get session file path from PI SDK (created when session is initialized)
            const filePath = session.sessionFile;

            if (filePath) {
              saveSessionMeta(sessionId!, data.message, filePath);
              (ws as any).data.firstMessageSaved = true;
            }
          }

          session.prompt(data.message).catch((error) => {
            ws.send(
              JSON.stringify({
                type: "error",
                message: error.message,
              }),
            );
          });
        }
      } catch (error: any) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: `解析消息失败: ${error.message}`,
          }),
        );
      }
    },
    close(ws) {
      const sessionId = (ws as any).data?.sessionId;
      const logger = (ws as any).data?.logger;
      console.log(`[WebSocket] 连接已关闭: ${sessionId}`);

      if (logger) {
        logger.log(`[SESSION] Session ${sessionId} WebSocket closed`);
        logger.close();
      }

      if (sessionId) {
        deleteSession(sessionId);
      }
    },
  },
});

console.log("=".repeat(60));
console.log("🚀 MiniAgent Gateway 已启动！");
console.log("=".repeat(60));
console.log(`📡 HTTP: http://localhost:${server.port}`);
console.log(`🔌 WebSocket: ws://localhost:${server.port}/ws`);
console.log("=".repeat(60));
