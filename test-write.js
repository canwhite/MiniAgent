#!/usr/bin/env node

/**
 * 测试 WebSocket 写文件功能
 * 连接到本地服务器，发送一个简单的写文件请求
 */

const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000/ws');

ws.on('open', () => {
  console.log('[TEST] WebSocket connected');

  // 发送一个简单的写文件请求
  ws.send(JSON.stringify({
    type: 'prompt',
    message: '写一个hello world文件到 custom/hello.txt，内容是 "Hello, World!"'
  }));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('[TEST] Received:', message);

    if (message.type === 'tool_start') {
      console.log('[TEST] Tool started:', message.tool);
    }
    if (message.type === 'tool_end') {
      console.log('[TEST] Tool ended:', message.tool, 'Success:', message.success);
    }

    // 收到完成消息后退出
    if (message.type === 'text_delta' && message.delta.includes('完成')) {
      setTimeout(() => {
        console.log('[TEST] Test complete, closing connection...');
        ws.close();
      }, 1000);
    }
  } catch (e) {
    console.log('[TEST] Raw message:', data.toString());
  }
});

ws.on('close', () => {
  console.log('[TEST] WebSocket closed');
  process.exit(0);
});

ws.on('error', (error) => {
  console.error('[TEST] Error:', error);
  process.exit(1);
});

// 30秒超时
setTimeout(() => {
  console.log('[TEST] Timeout after 30 seconds');
  ws.close();
  process.exit(1);
}, 30000);
