/**
 * MiniAgent Gateway API 测试套件
 */

const BASE_URL = "http://localhost:6000";
const WS_URL = "ws://localhost:6000/ws";

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(
  name: string,
  fn: () => Promise<void>
): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    results.push({ name, passed: true, duration });
    console.log(`✅ ${name} (${duration}ms)`);
  } catch (error: any) {
    const duration = Date.now() - start;
    results.push({ name, passed: false, duration, error: error.message });
    console.error(`❌ ${name} (${duration}ms)`);
    console.error(`   ${error.message}`);
  }
}

// ============ HTTP API 测试 ============

async function testHealthCheck() {
  const response = await fetch(`${BASE_URL}/health`);
  const data = await response.json();

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (data.status !== "ok") throw new Error("Status not ok");
}

async function testCreateSession() {
  const response = await fetch(`${BASE_URL}/api/sessions`, { method: "POST" });
  const data = await response.json();

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (!data.sessionId) throw new Error("No sessionId returned");
}

async function testSendMessage() {
  const response = await fetch(`${BASE_URL}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "你好，请用一句话介绍你自己" }),
  });
  const data = await response.json();

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (!data.sessionId) throw new Error("No sessionId returned");
  if (!data.response) throw new Error("No response returned");
}

async function testSendMessageReuseSession() {
  // First message
  const response1 = await fetch(`${BASE_URL}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "我的名字是测试用户" }),
  });
  const data1 = await response1.json();

  if (!data1.sessionId) throw new Error("No sessionId returned");

  // Second message with same session
  const response2 = await fetch(`${BASE_URL}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "我叫什么名字？",
      sessionId: data1.sessionId,
    }),
  });
  const data2 = await response2.json();

  if (!response2.ok) throw new Error(`HTTP ${response2.status}`);
  if (data2.sessionId !== data1.sessionId) throw new Error("SessionId mismatch");
}

async function testDeleteSession() {
  // Create a session first
  const createResponse = await fetch(`${BASE_URL}/api/sessions`, {
    method: "POST",
  });
  const { sessionId } = await createResponse.json();

  // Delete it
  const deleteResponse = await fetch(`${BASE_URL}/api/sessions/${sessionId}`, {
    method: "DELETE",
  });
  if (!deleteResponse.ok) throw new Error(`HTTP ${deleteResponse.status}`);

  // Try to use deleted session
  const useResponse = await fetch(`${BASE_URL}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "test",
      sessionId,
    }),
  });
  if (useResponse.status !== 404) throw new Error("Should return 404 for deleted session");
}

async function testMissingMessageField() {
  const response = await fetch(`${BASE_URL}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (response.status !== 400) throw new Error("Should return 400 for missing message");
}

async function testInvalidSessionId() {
  const response = await fetch(`${BASE_URL}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "test",
      sessionId: "invalid_session_id",
    }),
  });
  if (response.status !== 404) throw new Error("Should return 404 for invalid session");
}

async function testNotFoundEndpoint() {
  const response = await fetch(`${BASE_URL}/not-found`);
  if (response.status !== 404) throw new Error("Should return 404");
}

async function testCORSPreflight() {
  const response = await fetch(`${BASE_URL}/api/sessions`, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://example.com",
      "Access-Control-Request-Method": "POST",
    },
  });
  const corsHeader = response.headers.get("Access-Control-Allow-Origin");
  if (corsHeader !== "*") throw new Error("CORS header not set");
}

// ============ WebSocket 测试 ============

async function testWebSocketConnection() {
  return new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    let connected = false;

    ws.onopen = () => {
      connected = true;
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "connected") {
        ws.close();
        if (!connected) reject(new Error("Connection not established"));
        else resolve();
      }
    };

    ws.onerror = (error) => reject(error);

    setTimeout(() => {
      ws.close();
      if (!connected) reject(new Error("Connection timeout"));
    }, 5000);
  });
}

async function testWebSocketMessage() {
  return new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    let receivedDelta = false;

    ws.onopen = () => {
      // Wait for connected message
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "connected") {
        // Send a message
        ws.send(JSON.stringify({
          type: "prompt",
          message: "1+1等于几？",
        }));
      } else if (data.type === "text_delta") {
        receivedDelta = true;
        if (data.delta.includes("2")) {
          ws.close();
          resolve();
        }
      } else if (data.type === "error") {
        ws.close();
        reject(new Error(data.message));
      }
    };

    ws.onerror = (error) => reject(error);

    setTimeout(() => {
      ws.close();
      if (!receivedDelta) reject(new Error("No response received"));
    }, 10000);
  });
}

// ============ 运行所有测试 ============

async function runAllTests() {
  console.log("=".repeat(60));
  console.log("🧪 MiniAgent Gateway 测试套件");
  console.log("=".repeat(60));
  console.log("\n📡 HTTP API 测试:\n");

  // HTTP Tests
  await runTest("GET /health - 健康检查", testHealthCheck);
  await runTest("POST /api/sessions - 创建会话", testCreateSession);
  await runTest("POST /api/messages - 发送消息", testSendMessage);
  await runTest("会话复用 - 记忆上下文", testSendMessageReuseSession);
  await runTest("DELETE /api/sessions/:id - 删除会话", testDeleteSession);
  await runTest("缺少 message 字段 - 错误处理", testMissingMessageField);
  await runTest("无效 sessionId - 错误处理", testInvalidSessionId);
  await runTest("404 - 未知端点", testNotFoundEndpoint);
  await runTest("CORS - 预检请求", testCORSPreflight);

  console.log("\n🔌 WebSocket 测试:\n");

  // WebSocket Tests
  await runTest("WebSocket 连接建立", testWebSocketConnection);
  await runTest("WebSocket 发送和接收消息", testWebSocketMessage);

  // ============ 结果汇总 ============

  console.log("\n" + "=".repeat(60));
  console.log("📊 测试结果汇总");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`总计: ${total} 个测试`);
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📈 通过率: ${passRate}%`);
  console.log(`⏱️  总耗时: ${totalDuration}ms`);

  if (failed > 0) {
    console.log("\n❌ 失败的测试:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   - ${r.name}: ${r.error}`);
      });
  }

  console.log("=".repeat(60));

  process.exit(failed > 0 ? 1 : 0);
}

// 运行测试
runAllTests().catch((error) => {
  console.error("测试运行失败:", error);
  process.exit(1);
});
