#!/bin/bash

# 🔍 Git Pre-commit Hook: 하드코딩 색상 자동 검사
# 
# 커밋 전 하드코딩된 색상값이 추가되지 않았는지 자동 검사
# CI/BI 대응 시스템 보호
# 
# @author MindGarden
# @version 1.1.0
# @since 2025-11-28
# @updated 2026-06-12 — H6: 운영 게이트 옵트인 strict 모드 추가
#
# 사용법:
#   bash scripts/design-system/automation/pre-commit-hardcoding-check.sh
#       → 기본(개발) 모드: 기본 색상(#fff/#000/white/black 등) 허용
#
#   STRICT_MODE=1 bash scripts/design-system/automation/pre-commit-hardcoding-check.sh
#   bash scripts/design-system/automation/pre-commit-hardcoding-check.sh --strict
#       → strict(운영 게이트) 모드: ALLOWED 예외 최소화(transparent/inherit/initial/unset/currentColor)
#         디자인 토큰 사용 강제. docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md(§H5) 기준.
#
# 참고: tests/e2e/ 아래 *.spec.ts 는 색상 하드코딩 grep을 건너뛴다.
# E2E 정규식·에러 코드 리터럴(예: React minified error #130)이 3자리 #xxx HEX 패턴과 충돌해 오탐이 나기 때문이다.
#
# 참고: Expo 색상 HEX SSOT·브랜드 전용 파일은 docs/standards/EXPO_APP_HARDCODING_AND_COLORS.md 에 따라
# expo-app/src/theme/tokens.ts, expo-app/src/constants/oauthProviderBrand.ts 는 색상 패턴 스캔을 건너뛴다.

set -e

# CLI 플래그 파싱 (--strict). 환경변수 STRICT_MODE 와 동등.
# 미사용 인자는 후방 호환을 위해 무시한다.
for ARG in "$@"; do
    case "$ARG" in
        --strict)
            STRICT_MODE=1
            ;;
        --help|-h)
            sed -n '3,22p' "$0" | sed 's/^# \{0,1\}//'
            exit 0
            ;;
        *)
            # unknown args — 향후 확장을 위해 silently ignore
            ;;
    esac
done

# STRICT_MODE 정규화 (1/true/yes 모두 활성)
case "${STRICT_MODE:-0}" in
    1|true|TRUE|yes|YES|on|ON)
        STRICT_MODE=1
        ;;
    *)
        STRICT_MODE=0
        ;;
esac

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
if [ "$STRICT_MODE" = "1" ]; then
    log_phase "MindGarden CI/BI 보호 시스템 - 하드코딩 검사 시작 [STRICT 모드: 운영 게이트 기준]"
else
    log_phase "MindGarden CI/BI 보호 시스템 - 하드코딩 검사 시작 [개발 모드: 기본 색 허용]"
fi
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

# 허용된 하드코딩 (예외) — 모드별 분기
#
# - 개발(기본) 모드: 흑/백·투명도 등 기본 색을 허용하여 개발 흐름을 끊지 않는다.
# - STRICT(운영 게이트) 모드: 디자인 토큰으로 치환 불가능한 키워드(transparent/inherit/initial/unset/currentColor)만 허용.
#   #fff/#000/white/black 도 디자인 토큰(`var(--mg-*)`)으로 강제. docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md(§H5) 기준과 일치.
if [ "$STRICT_MODE" = "1" ]; then
    ALLOWED_HARDCODING=(
        'transparent'
        'inherit'
        'initial'
        'unset'
        'currentColor'
        'currentcolor'
    )
else
    ALLOWED_HARDCODING=(
        # 투명도
        'transparent'
        'inherit'
        'initial'
        'unset'
        'currentColor'
        'currentcolor'
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
fi

VIOLATIONS_FOUND=0
TOTAL_VIOLATIONS=0

# 각 파일 검사
for FILE in $STAGED_FILES; do
    if [ ! -f "$FILE" ]; then
        log_warning "파일을 찾을 수 없습니다: $FILE (건너뜀)"
        continue
    fi

    # E2E 스펙: 정규식·에러 코드 리터럴과 3자리 HEX 색상 패턴 충돌 → 색상 스캔만 생략
    if [[ "$FILE" =~ ^tests/e2e/.*\.spec\.ts$ ]]; then
        log_info "색상 스캔 생략 (E2E 스펙): $FILE"
        continue
    fi

    # Expo SSOT·브랜드 색상 전용 파일: HEX 정의 허용 구역 → 색상 하드코딩 패턴 검사 생략
    if [[ "$FILE" == "expo-app/src/theme/tokens.ts" ]] || [[ "$FILE" == "expo-app/src/constants/oauthProviderBrand.ts" ]]; then
        log_info "Expo SSOT·브랜드 색: 스캔 생략 — $FILE"
        continue
    fi

    # Web SSOT·브랜드 자산 전용 파일: Google Brand Guidelines 4색 다색 로고 픽토그램은
    # 디자인 토큰으로 치환할 수 없는 자산 자체이므로 단일 파일에서만 HEX 정의 허용.
    if [[ "$FILE" == "frontend/src/components/auth/GoogleBrandLogo.js" ]]; then
        log_info "Web 브랜드 자산 SSOT: 스캔 생략 — $FILE"
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
        echo "   3. Expo 앱: 색상 HEX는 expo-app/src/theme/tokens.ts(및 브랜드 expo-app/src/constants/oauthProviderBrand.ts)에만 두고, 그 외는 docs/standards/EXPO_APP_HARDCODING_AND_COLORS.md 기준을 따르세요."
        echo "   4. 자동 변환 도구 사용: node scripts/design-system/color-management/convert-hardcoded-colors.js"
        echo ""
    fi
done

echo ""

# 결과 출력
if [ $VIOLATIONS_FOUND -eq 1 ]; then
    if [ "$STRICT_MODE" = "1" ]; then
        log_error "🚨 CI/BI 보호 시스템 [STRICT]: 하드코딩된 색상 발견! (운영 게이트 기준)"
    else
        log_error "🚨 CI/BI 보호 시스템: 하드코딩된 색상 발견!"
    fi
    echo ""
    echo "📊 검사 결과:"
    echo "  🔍 검사된 파일: $(echo "$STAGED_FILES" | wc -l)개"
    echo "  🚨 위반 사항: $TOTAL_VIOLATIONS개"
    if [ "$STRICT_MODE" = "1" ]; then
        echo "  🛡️  모드: STRICT (운영 게이트 — #fff/#000/white/black 도 불허)"
    else
        echo "  🛡️  모드: 개발 (기본 색 허용)"
        echo ""
        echo "  ℹ️  운영 반영 게이트 기준으로 사전 검증하려면:"
        echo "     STRICT_MODE=1 bash scripts/design-system/automation/pre-commit-hardcoding-check.sh"
    fi
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
    echo "  4️⃣  Expo 앱:"
    echo "     색상 HEX는 expo-app/src/theme/tokens.ts 및 브랜드 상수 expo-app/src/constants/oauthProviderBrand.ts 에만 두고, 표준은 docs/standards/EXPO_APP_HARDCODING_AND_COLORS.md 를 참고하세요."
    echo ""
    echo "💡 수정 후 다시 커밋해주세요."
    echo ""
    
    exit 1
else
    if [ "$STRICT_MODE" = "1" ]; then
        log_success "🎉 CI/BI 보호 시스템 [STRICT]: 하드코딩 검사 통과! (운영 게이트 기준)"
    else
        log_success "🎉 CI/BI 보호 시스템: 하드코딩 검사 통과!"
    fi
    echo ""
    echo "📊 검사 결과:"
    echo "  🔍 검사된 파일: $(echo "$STAGED_FILES" | wc -l)개"
    echo "  ✅ 위반 사항: 없음"
    if [ "$STRICT_MODE" = "1" ]; then
        echo "  🛡️  모드: STRICT (운영 게이트)"
    else
        echo "  🛡️  모드: 개발 (기본 색 허용)"
    fi
    echo ""
    echo "🎯 CI/BI 변경 대응 준비 완료!"
    echo ""
    
    exit 0
fi
