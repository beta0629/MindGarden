#!/bin/bash

# 🔍 Git Pre-commit Hook: 하드코딩 색상 자동 검사
# 
# 커밋 전 하드코딩된 색상값이 추가되지 않았는지 자동 검사
# CI/BI 대응 시스템 보호
# 
# @author MindGarden
# @version 1.0.0
# @since 2025-11-28

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 로그 함수들
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_phase() {
    echo -e "${PURPLE}🔍 $1${NC}"
}

echo ""
log_phase "MindGarden CI/BI 보호 시스템 - 하드코딩 검사 시작"
echo ""

# 프로젝트 루트 확인
if [ ! -f "package.json" ]; then
    log_error "프로젝트 루트에서 실행해주세요"
    exit 1
fi

# 변경된 파일들 가져오기
ALL_STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(css|js|jsx|ts|tsx)$' || true)
STAGED_FILES=""

# 존재하는 파일만 필터링
for file in $ALL_STAGED_FILES; do
    if [ -f "$file" ]; then
        STAGED_FILES="$STAGED_FILES $file"
    fi
done

if [ -z "$STAGED_FILES" ]; then
    log_success "검사할 CSS/JS 파일이 없습니다"
    exit 0
fi

log_info "검사 대상 파일: $(echo "$STAGED_FILES" | wc -l)개"

# 하드코딩 패턴 정의
HARDCODED_PATTERNS=(
    # HEX 색상 (3자리)
    '#[0-9a-fA-F]{3}[^0-9a-fA-F]'
    # HEX 색상 (6자리)
    '#[0-9a-fA-F]{6}[^0-9a-fA-F]'
    # RGB/RGBA 색상
    'rgb\s*\([^)]+\)'
    'rgba\s*\([^)]+\)'
    # HSL/HSLA 색상
    'hsl\s*\([^)]+\)'
    'hsla\s*\([^)]+\)'
)

# 허용된 하드코딩 (예외)
ALLOWED_HARDCODING=(
    # 투명도
    'transparent'
    'inherit'
    'initial'
    'unset'
    # 기본 색상 (매우 제한적)
    '#fff'
    '#ffffff'
    '#000'
    '#000000'
    'white'
    'black'
    # 그라데이션에서 투명도 처리
    'rgba(0,0,0,0)'
    'rgba(255,255,255,0)'
)

VIOLATIONS_FOUND=0
TOTAL_VIOLATIONS=0

# 각 파일 검사
for FILE in $STAGED_FILES; do
    if [ ! -f "$FILE" ]; then
        log_warning "파일을 찾을 수 없습니다: $FILE (건너뜀)"
        continue
    fi
    
    log_info "검사 중: $FILE"
    
    FILE_VIOLATIONS=0
    
    # 각 패턴으로 검사
    for PATTERN in "${HARDCODED_PATTERNS[@]}"; do
        MATCHES=$(grep -n -E "$PATTERN" "$FILE" || true)
        
        if [ -n "$MATCHES" ]; then
            # 허용된 패턴인지 확인
            while IFS= read -r MATCH; do
                IS_ALLOWED=false
                
                for ALLOWED in "${ALLOWED_HARDCODING[@]}"; do
                    if echo "$MATCH" | grep -q "$ALLOWED"; then
                        IS_ALLOWED=true
                        break
                    fi
                done
                
                if [ "$IS_ALLOWED" = false ]; then
                    if [ $FILE_VIOLATIONS -eq 0 ]; then
                        echo ""
                        log_error "하드코딩 발견: $FILE"
                    fi
                    
                    LINE_NUM=$(echo "$MATCH" | cut -d: -f1)
                    CONTENT=$(echo "$MATCH" | cut -d: -f2-)
                    
                    echo "  라인 $LINE_NUM: $CONTENT"
                    
                    FILE_VIOLATIONS=$((FILE_VIOLATIONS + 1))
                    TOTAL_VIOLATIONS=$((TOTAL_VIOLATIONS + 1))
                fi
            done <<< "$MATCHES"
        fi
    done
    
    if [ $FILE_VIOLATIONS -gt 0 ]; then
        VIOLATIONS_FOUND=1
        echo ""
        log_warning "💡 해결 방법:"
        echo "   1. CSS 변수 사용: var(--mg-primary-500)"
        echo "   2. 통합 디자인 토큰 활용: frontend/src/styles/unified-design-tokens.css"
        echo "   3. 자동 변환 도구 사용: node scripts/design-system/color-management/convert-hardcoded-colors.js"
        echo ""
    fi
done

echo ""

# 결과 출력
if [ $VIOLATIONS_FOUND -eq 1 ]; then
    log_error "🚨 CI/BI 보호 시스템: 하드코딩된 색상 발견!"
    echo ""
    echo "📊 검사 결과:"
    echo "  🔍 검사된 파일: $(echo "$STAGED_FILES" | wc -l)개"
    echo "  🚨 위반 사항: $TOTAL_VIOLATIONS개"
    echo ""
    echo "🎯 CI/BI 변경 대응을 위해 하드코딩을 제거해주세요:"
    echo ""
    echo "  1️⃣  자동 변환 도구 사용:"
    echo "     node scripts/design-system/color-management/convert-hardcoded-colors.js"
    echo ""
    echo "  2️⃣  수동 수정:"
    echo "     하드코딩된 색상 → var(--mg-색상명)"
    echo ""
    echo "  3️⃣  통합 디자인 토큰 참조:"
    echo "     frontend/src/styles/unified-design-tokens.css"
    echo ""
    echo "💡 수정 후 다시 커밋해주세요."
    echo ""
    
    exit 1
else
    log_success "🎉 CI/BI 보호 시스템: 하드코딩 검사 통과!"
    echo ""
    echo "📊 검사 결과:"
    echo "  🔍 검사된 파일: $(echo "$STAGED_FILES" | wc -l)개"
    echo "  ✅ 위반 사항: 없음"
    echo ""
    echo "🎯 CI/BI 변경 대응 준비 완료!"
    echo ""
    
    exit 0
fi
