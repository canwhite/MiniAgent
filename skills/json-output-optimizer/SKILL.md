---
name: json-output-optimizer
description: "JSON输出优化器 - 当用户要求返回JSON格式时，检查并修复输出结果，确保输出是合法且结构完整的JSON"
tags:
  - json
  - output
  - format
  - validation
  - optimization
trigger_keywords:
  - json
  - 返回json
  - json格式
  - 输出json
  - 格式为json
---

# JSON 输出优化器

## 概述

当用户明确要求返回 JSON 格式时，此技能会自动检查、优化和修复输出结果，确保最终返回的是合法、结构完整的 JSON。

## 触发条件

当用户请求包含以下关键词时自动触发：
- "json"
- "返回 json"
- "json 格式"
- "输出 json"
- "格式为 json"

## 核心流程

### 1. 检测触发

识别用户是否明确要求 JSON 格式输出。

### 2. JSON 验证

检查当前输出是否为合法 JSON：

```typescript
function validateJSON(output: string): {
  isValid: boolean;
  parsed?: any;
  error?: string;
} {
  try {
    const parsed = JSON.parse(output);
    return { isValid: true, parsed };
  } catch (e) {
    return { isValid: false, error: e.message };
  }
}
```

### 3. 结构检查

验证 JSON 结构是否符合预期：

```typescript
function checkStructure(parsed: any, context: string): {
  isComplete: boolean;
  suggestions: string[];
} {
  const suggestions: string[] = [];

  // 检查是否为数组或对象
  if (!Array.isArray(parsed) && typeof parsed !== 'object') {
    suggestions.push('输出应为数组或对象');
  }

  // 检查空值
  if (parsed === null || parsed === undefined) {
    suggestions.push('输出不能为空');
  }

  return { isComplete: suggestions.length === 0, suggestions };
}
```

### 4. 修复策略

遇到无效 JSON 时，按以下顺序尝试修复：

| 错误类型 | 修复策略 |
|---------|---------|
| Markdown 代码块包裹 | 移除 ```json 和 ``` 标记 |
| 尾部逗号 | 移除多余逗号 |
| 缺失引号 | 为所有键添加引号 |
| 单引号 | 转换为双引号 |
| 注释 | 移除 JSON 中的注释 |
| 括号不匹配 | 补全或修正括号 |

```typescript
function repairJSON(output: string): string {
  let repaired = output;

  // 1. 移除 Markdown 代码块
  repaired = repaired.replace(/^```json\s*/g, '');
  repaired = repaired.replace(/```$/gm, '');

  // 2. 移除注释
  repaired = repaired.replace(/\/\/.*$/gm, '');
  repaired = repaired.replace(/\/\*[\s\S]*?\*\//g, '');

  // 3. 单引号转双引号
  repaired = repaired.replace(/'/g, '"');

  // 4. 移除尾部逗号
  repaired = repaired.replace(/,(\s*[\]}])/g, '$1');

  // 5. 尝试解析
  try {
    JSON.parse(repaired);
    return repaired;
  } catch {
    // 返回原始错误信息
    throw new Error('无法修复 JSON，请检查输出格式');
  }
}
```

### 5. 结果返回

- **成功**：返回修复后的 JSON（无 Markdown 包裹）
- **失败**：返回原始错误信息和修复建议

## 输出要求

修复后的 JSON 必须满足：
1. 是合法的 JSON 字符串（可被 `JSON.parse` 解析）
2. 不包含 Markdown 代码块标记
3. 不包含注释
4. 使用双引号
5. 无尾部逗号

## 常见 JSON 响应模式

参考 [json-patterns.md](references/json-patterns.md) 了解常见的 JSON 响应结构。

## 失败处理

如果无法修复 JSON：
1. 保留原始输出
2. 添加错误说明
3. 建议用户手动调整
