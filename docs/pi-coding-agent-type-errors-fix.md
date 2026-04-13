# pi-coding-agent 0.66 类型错误修复清单

## 问题汇总

升级到 0.66.1 后，server.ts 存在以下 4 个主要类型错误：

### 1. AuthStorage 构造函数私有

**错误:**
```typescript
error TS2673: Constructor of class 'AuthStorage' is private
```

**位置:** server.ts:320

**旧代码:**
```typescript
const authStorage = new AuthStorage();
```

**修复:**
```typescript
const authStorage = AuthStorage.create();
```

---

### 2. ModelRegistry 构造函数私有

**错误:**
```typescript
error TS2673: Constructor of class 'ModelRegistry' is private
```

**位置:** server.ts:321

**旧代码:**
```typescript
const modelRegistry = new ModelRegistry(authStorage);
```

**修复:**
```typescript
const modelRegistry = ModelRegistry.create(authStorage);
```

---

### 3. Skill 类型不匹配

**错误:**
```typescript
error TS2322: Type 'SkillConfig[]' is not assignable to type 'Skill[]'.
Property 'sourceInfo' is missing
```

**位置:** server.ts:354

**原因:** `Skill` 接口新增了 `sourceInfo: SourceInfo` 字段

**修复方案 A - 修改 skills/index.ts:**
```typescript
import { createSyntheticSourceInfo } from "@mariozechner/pi-coding-agent";

export interface SkillConfig {
  name: string;
  description: string;
  filePath: string;
  baseDir: string;
  source: "inline";
  sourceInfo: SourceInfo;  // 新增
  disableModelInvocation: boolean;
}

export const SKILLS: SkillConfig[] = [
  {
    name: "web-search-tool",
    description: "提供网页搜索功能示例",
    filePath: `${SKILLS_BASE_DIR}/web-search-tool/SKILL.md`,
    baseDir: `${SKILLS_BASE_DIR}/web-search-tool`,
    source: "inline",
    sourceInfo: createSyntheticSourceInfo(),  // 新增
    disableModelInvocation: false,
  },
  // ... 其他 skills
];
```

**修复方案 B - 在 server.ts 中转换:**
```typescript
import { createSyntheticSourceInfo } from "@mariozechner/pi-coding-agent";

// 在 resourceLoader 中转换
getSkills: () => ({
  skills: SKILLS.map(s => ({
    ...s,
    sourceInfo: createSyntheticSourceInfo(),
  })),
  diagnostics: [],
}),
```

---

### 4. switchSession 方法已移除

**错误:**
```typescript
error TS2339: Property 'switchSession' does not exist on type 'AgentSession'
```

**位置:** server.ts:1223

**原因:** v0.65.0 将会话管理方法从 `AgentSession` 移至 `AgentSessionRuntime`

**旧代码:**
```typescript
const success = await session.switchSession(sessionMeta.file_path);
```

**修复方案 A - 使用 AgentSessionRuntime:**
```typescript
import { createAgentSessionRuntime, AgentSessionRuntime } from "@mariozechner/pi-coding-agent";

// 创建 runtime 而非直接创建 session
const runtime = await createAgentSessionRuntime(
  async (options) => {
    // ... 创建 session 的逻辑
    return await createAgentSession(options);
  },
  {
    cwd: process.cwd(),
    agentDir: getAgentDir(),
    sessionManager: SessionManager.create(process.cwd()),
  }
);

// 使用 runtime 的方法
const result = await runtime.switchSession(sessionMeta.file_path);
if (!result.cancelled) {
  // 切换成功
}
```

**修复方案 B - 保持现有架构 (推荐):**
如果不想大改架构，可以通过 SessionManager 直接操作会话文件：

```typescript
// 不使用 switchSession，直接创建新 session
const sessionManager = SessionManager.create(cwd);
const newSession = await createSession(data.sessionId);

// 替换当前 session
sessions.set(data.sessionId, newSession);
```

---

## 推荐修复顺序

1. **快速修复** (1-2): AuthStorage 和 ModelRegistry - 直接替换构造函数调用
2. **中等修复** (3): Skill 类型 - 添加 sourceInfo 字段
3. **架构调整** (4): switchSession - 需要评估是否采用新的 Runtime API

## 兼容性说明

- **破坏性变更**: v0.65.0 移除了 `session_switch` 和 `session_fork` 事件
- **新增 API**: `AgentSessionRuntime` 提供更清晰的会话生命周期管理
- **影响范围**: 会话切换、新建、分支等功能需要适配新 API

## 参考文档

- [AgentSessionRuntime API](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/src/core/agent-session-runtime.ts)
- [v0.65.0 Migration Guide](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/CHANGELOG.md)
