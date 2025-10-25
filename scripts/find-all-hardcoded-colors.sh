#!/bin/bash

echo "🔍 모든 CSS 파일에서 하드코딩된 색상을 찾습니다..."
echo ""

# Admin 컴포넌트
echo "📁 Admin 컴포넌트:"
find /Users/mind/mindGarden/frontend/src/components/admin -name "*.css" -type f -exec sh -c '
  count=$(grep -c "background.*#\|color.*#\|border.*#" "$1" 2>/dev/null | grep -v "var(--" | grep -v "^  --" || echo "0")
  if [ "$count" -gt 0 ]; then
    echo "  ❌ $(basename $1): ${count}개"
  fi
' _ {} \;

# Schedule 컴포넌트
echo ""
echo "📁 Schedule 컴포넌트:"
find /Users/mind/mindGarden/frontend/src/components/schedule -name "*.css" -type f -exec sh -c '
  count=$(grep -c "background.*#\|color.*#\|border.*#" "$1" 2>/dev/null | grep -v "var(--" | grep -v "^  --" || echo "0")
  if [ "$count" -gt 0 ]; then
    echo "  ❌ $(basename $1): ${count}개"
  fi
' _ {} \;

# Common 컴포넌트
echo ""
echo "📁 Common 컴포넌트:"
find /Users/mind/mindGarden/frontend/src/components/common -name "*.css" -type f -exec sh -c '
  count=$(grep -c "background.*#\|color.*#\|border.*#" "$1" 2>/dev/null | grep -v "var(--" | grep -v "^  --" || echo "0")
  if [ "$count" -gt 0 ]; then
    echo "  ❌ $(basename $1): ${count}개"
  fi
' _ {} \;

# UI 컴포넌트
echo ""
echo "📁 UI 컴포넌트:"
find /Users/mind/mindGarden/frontend/src/components/ui -name "*.css" -type f -exec sh -c '
  count=$(grep -c "background.*#\|color.*#\|border.*#" "$1" 2>/dev/null | grep -v "var(--" | grep -v "^  --" || echo "0")
  if [ "$count" -gt 0 ]; then
    echo "  ❌ $(basename $1): ${count}개"
  fi
' _ {} \;

echo ""
echo "✅ 검색 완료!"

