// MiniAgent Chat - Vanilla JS with efficient DOM updates
(function() {
  const state = {
    messages: [],
    input: '',
    isConnected: false,
    isConnecting: false,
    sessionId: '',
    currentResponse: ''
  };

  let ws = null;
  let currentAssistantMessage = '';
  let typingTimeout = null;

  // Cache DOM elements
  let els = {};

  function formatMessage(content) {
    let formatted = content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre><code>${code.trim()}</code></pre>`;
    });

    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

    formatted = formatted
      .split('\n\n')
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('');

    return formatted;
  }

  function initDOM() {
    const app = document.getElementById('app');

    app.innerHTML = `
      <div class="header">
        <div class="status-dot" id="status-dot"></div>
        <h1>MiniAgent Chat</h1>
        <span class="session-id" id="session-id"></span>
      </div>

      <div class="messages" id="messages">
      </div>

      <div class="input-area">
        <div class="input-container">
          <input
            type="text"
            id="message-input"
            placeholder="连接中..."
            disabled
          />
          <button id="send-btn" disabled>发送</button>
        </div>
      </div>
    `;

    // Cache elements
    els = {
      statusDot: document.getElementById('status-dot'),
      sessionId: document.getElementById('session-id'),
      messages: document.getElementById('messages'),
      input: document.getElementById('message-input'),
      sendBtn: document.getElementById('send-btn'),
    };

    // Setup input event listeners
    els.input.addEventListener('input', (e) => {
      state.input = e.target.value;
      updateButtonState();
    });

    els.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    els.sendBtn.addEventListener('click', sendMessage);

    updateStatus();
  }

  function updateStatus() {
    const statusClass = state.isConnected ? 'connected' : (state.isConnecting ? 'connecting' : 'error');
    els.statusDot.className = `status-dot ${statusClass}`;
    els.sessionId.textContent = state.sessionId;
    els.input.placeholder = state.isConnected ? '输入消息...' : '连接中...';
    els.input.disabled = !state.isConnected;
    updateButtonState();
  }

  function updateButtonState() {
    els.sendBtn.disabled = !state.isConnected || !state.input.trim();
  }

  function appendMessage(msg) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${msg.role}`;
    msgDiv.id = `msg-${msg.id}`;
    msgDiv.innerHTML = `
      <div class="avatar">${msg.role === 'user' ? 'U' : 'AI'}</div>
      <div class="message-content">${formatMessage(msg.content)}</div>
    `;
    els.messages.appendChild(msgDiv);
    scrollToBottom();
  }

  function updateStreamingResponse(content) {
    let streamingDiv = document.getElementById('streaming-response');
    if (!streamingDiv) {
      streamingDiv = document.createElement('div');
      streamingDiv.id = 'streaming-response';
      streamingDiv.className = 'message assistant';
      streamingDiv.innerHTML = `
        <div class="avatar">AI</div>
        <div class="message-content" id="streaming-content"></div>
      `;
      els.messages.appendChild(streamingDiv);
    }
    document.getElementById('streaming-content').innerHTML = formatMessage(content);
    scrollToBottom();
  }

  function removeStreamingResponse() {
    const streamingDiv = document.getElementById('streaming-response');
    if (streamingDiv) {
      streamingDiv.remove();
    }
  }

  function scrollToBottom() {
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function connect() {
    state.isConnecting = true;
    updateStatus();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      state.isConnecting = false;
      updateStatus();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'connected':
            state.isConnected = true;
            state.sessionId = data.sessionId;
            updateStatus();
            els.input.focus();
            break;

          case 'text_delta':
            currentAssistantMessage += data.delta;
            state.currentResponse = currentAssistantMessage;
            updateStreamingResponse(currentAssistantMessage);

            if (typingTimeout) clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
              if (currentAssistantMessage) {
                state.messages.push({
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  content: currentAssistantMessage
                });
                appendMessage(state.messages[state.messages.length - 1]);
                currentAssistantMessage = '';
                state.currentResponse = '';
                removeStreamingResponse();
              }
            }, 1000);
            break;

          case 'error':
            console.error('WebSocket error:', data.message);
            break;
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.onclose = () => {
      state.isConnected = false;
      state.isConnecting = false;
      updateStatus();
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      state.isConnecting = false;
      updateStatus();
    };
  }

  function sendMessage() {
    const messageText = state.input.trim();
    if (!messageText || !ws || !state.isConnected) return;

    const msg = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText
    };
    state.messages.push(msg);
    appendMessage(msg);

    state.input = '';
    els.input.value = '';
    updateButtonState();

    currentAssistantMessage = '';
    state.currentResponse = '';
    removeStreamingResponse();

    ws.send(JSON.stringify({
      type: 'prompt',
      message: messageText
    }));
  }

  // Initialize
  initDOM();
  connect();
})();
