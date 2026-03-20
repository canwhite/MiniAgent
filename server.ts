import {
  createAgentSession,
  type ToolDefinition,
  createBashTool,
  createReadTool,
  createWriteTool,
  SessionManager,
  AuthStorage,
  ModelRegistry,
  createExtensionRuntime,
} from "@mariozechner/pi-coding-agent";
import type { Model } from "@mariozechner/pi-ai";
import { Type } from "@sinclair/typebox";

const getCurrentTimeTool: ToolDefinition = {
  name: "get_current_time",
  label: "Get Current Time",
  description: "获取当前时间和日期。当用户询问时间时使用。",
  parameters: Type.Object({
    timezone: Type.Optional(
      Type.String({ description: "时区，例如 'Asia/Shanghai'，默认本地时区" }),
    ),
  }),
  execute: async (_toolCallId, params, _signal, _onUpdate, _ctx) => {
    const { timezone } = params as { timezone?: string };
    const now = new Date();
    const result = {
      iso: now.toISOString(),
      locale: now.toLocaleString("zh-CN", {
        timeZone: timezone || undefined,
        dateStyle: "full",
        timeStyle: "long",
      }),
      timestamp: now.getTime(),
    };

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
      details: {},
    };
  },
};

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
- 读写文件
- 网络搜索
- 获取当前时间

工作原则：
1. 理解用户需求，选择合适的工具
2. 按照工具的参数要求正确调用
3. 根据工具结果继续处理或给出最终答案
4. 如果任务复杂，可以分步骤完成
5. 遇到错误时，尝试分析原因并给出解决建议

请始终使用中文回复用户。`;

import { type AgentSession } from "@mariozechner/pi-coding-agent";

const sessions = new Map<string, AgentSession>();

async function createSession(sessionId: string) {
  const cwd = process.cwd();
  const authStorage = new AuthStorage();
  const modelRegistry = new ModelRegistry(authStorage);

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
    tools: [createReadTool(cwd), createBashTool(cwd), createWriteTool(cwd)],
    customTools: [getCurrentTimeTool],
    sessionManager: SessionManager.inMemory(),
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

  sessions.set(sessionId, result.session);
  return result.session;
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

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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
      session = await createSession(usedSessionId);
    }

    const events: any[] = [];
    session.subscribe((event) => {
      events.push(event);
    });

    await session.prompt(message);

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
      (ws as any).data = { sessionId };

      createSession(sessionId).then((session) => {
        ws.send(
          JSON.stringify({
            type: "connected",
            sessionId,
            message: "WebSocket 连接已建立",
          }),
        );

        session.subscribe((event) => {
          if (event.type === "message_update") {
            if (event.assistantMessageEvent.type === "text_delta") {
              ws.send(
                JSON.stringify({
                  type: "text_delta",
                  delta: event.assistantMessageEvent.delta,
                }),
              );
            }
          }
        });
      });
    },
    message(ws, message) {
      try {
        const data = JSON.parse(message.toString()) as {
          type?: string;
          message?: string;
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

        if (data.type === "prompt" && typeof data.message === "string") {
          console.log(`[WebSocket] 收到消息: ${data.message}`);
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
      console.log(`[WebSocket] 连接已关闭: ${sessionId}`);
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
