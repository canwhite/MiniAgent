#!/bin/bash

echo "🔍 搜索最有价值的AI信息..."
echo "================================"
echo ""

# 搜索AI相关的最新信息
echo "1. AI最新突破和趋势："
curl -s "https://api.duckduckgo.com/?q=artificial+intelligence+latest+breakthroughs+2026&format=json" | \
  grep -o '"AbstractText":"[^"]*"' | \
  sed 's/"AbstractText":"//g' | sed 's/"$//g' | \
  sed 's/\\u0026/\&/g' | sed 's/\\n/\n/g' | head -5

echo ""
echo "2. 机器学习进展："
curl -s "https://api.duckduckgo.com/?q=machine+learning+advancements+2026&format=json" | \
  grep -o '"AbstractText":"[^"]*"' | \
  sed 's/"AbstractText":"//g' | sed 's/"$//g' | \
  sed 's/\\u0026/\&/g' | sed 's/\\n/\n/g' | head -5

echo ""
echo "3. 生成式AI发展："
curl -s "https://api.duckduckgo.com/?q=generative+AI+developments+2026&format=json" | \
  grep -o '"AbstractText":"[^"]*"' | \
  sed 's/"AbstractText":"//g' | sed 's/"$//g' | \
  sed 's/\\u0026/\&/g' | sed 's/\\n/\n/g' | head -5

echo ""
echo "4. AI伦理和安全："
curl -s "https://api.duckduckgo.com/?q=AI+ethics+safety+2026&format=json" | \
  grep -o '"AbstractText":"[^"]*"' | \
  sed 's/"AbstractText":"//g' | sed 's/"$//g' | \
  sed 's/\\u0026/\&/g' | sed 's/\\n/\n/g' | head -5

echo ""
echo "5. AI在医疗领域的应用："
curl -s "https://api.duckduckgo.com/?q=AI+in+healthcare+2026&format=json" | \
  grep -o '"AbstractText":"[^"]*"' | \
  sed 's/"AbstractText":"//g' | sed 's/"$//g' | \
  sed 's/\\u0026/\&/g' | sed 's/\\n/\n/g' | head -5

echo ""
echo "================================"