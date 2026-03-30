#!/bin/bash

# 🔧 Git Hooks 설치 스크립트
# 
# CI/BI 보호를 위한 Git pre-commit hook 자동 설치
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
    echo -e "${PURPLE}🔧 $1${NC}"
}

echo ""
log_phase "MindGarden CI/BI 보호 시스템 - Git Hooks 설치"
echo ""

# 프로젝트 루트 확인
if [ ! -d ".git" ]; then
    log_error "Git 저장소가 아닙니다. 프로젝트 루트에서 실행해주세요."
    exit 1
fi

# Git hooks 디렉토리 확인/생성
HOOKS_DIR=".git/hooks"
if [ ! -d "$HOOKS_DIR" ]; then
    mkdir -p "$HOOKS_DIR"
    log_info "Git hooks 디렉토리 생성: $HOOKS_DIR"
fi

# Pre-commit hook 파일 경로
PRE_COMMIT_HOOK="$HOOKS_DIR/pre-commit"
HARDCODING_CHECK_SCRIPT="scripts/design-system/automation/pre-commit-hardcoding-check.sh"

# 기존 pre-commit hook 백업
if [ -f "$PRE_COMMIT_HOOK" ]; then
    BACKUP_FILE="$PRE_COMMIT_HOOK.backup.$(date +%Y%m%d-%H%M%S)"
    cp "$PRE_COMMIT_HOOK" "$BACKUP_FILE"
    log_warning "기존 pre-commit hook 백업: $BACKUP_FILE"
fi

# Pre-commit hook 생성
log_info "Pre-commit hook 생성 중..."

cat > "$PRE_COMMIT_HOOK" << 'EOF'
#!/bin/bash

# MindGarden CI/BI 보호 시스템
# 자동 생성된 pre-commit hook

# 하드코딩 색상 검사
if [ -f "scripts/design-system/automation/pre-commit-hardcoding-check.sh" ]; then
    echo ""
    echo "🔍 MindGarden CI/BI 보호 시스템 실행 중..."
    
    # 하드코딩 검사 실행
    ./scripts/design-system/automation/pre-commit-hardcoding-check.sh
    
    # 검사 결과에 따라 커밋 허용/차단
    if [ $? -ne 0 ]; then
        echo ""
        echo "🚨 커밋이 차단되었습니다. 하드코딩을 제거한 후 다시 시도해주세요."
        echo ""
        exit 1
    fi
else
    echo "⚠️  하드코딩 검사 스크립트를 찾을 수 없습니다."
    echo "   scripts/design-system/automation/pre-commit-hardcoding-check.sh"
fi

# 다른 기존 검사들이 있다면 여기에 추가...

echo ""
echo "✅ 모든 검사를 통과했습니다. 커밋을 진행합니다."
echo ""

exit 0
EOF

# Pre-commit hook 실행 권한 부여
chmod +x "$PRE_COMMIT_HOOK"
log_success "Pre-commit hook 설치 완료: $PRE_COMMIT_HOOK"

# 하드코딩 검사 스크립트 실행 권한 확인
if [ -f "$HARDCODING_CHECK_SCRIPT" ]; then
    chmod +x "$HARDCODING_CHECK_SCRIPT"
    log_success "하드코딩 검사 스크립트 권한 설정 완료"
else
    log_error "하드코딩 검사 스크립트를 찾을 수 없습니다: $HARDCODING_CHECK_SCRIPT"
    exit 1
fi

echo ""
log_success "🎉 Git Hooks 설치 완료!"
echo ""
echo "📋 설치된 기능:"
echo "  🔍 Pre-commit 하드코딩 검사"
echo "  🚨 CI/BI 보호 시스템"
echo "  ⚡ 자동 커밋 차단"
echo ""
echo "💡 사용법:"
echo "  - 일반적인 git commit 사용"
echo "  - 하드코딩 발견 시 자동으로 커밋 차단"
echo "  - 수정 후 다시 커밋 시도"
echo ""
echo "🔧 테스트:"
echo "  git add ."
echo "  git commit -m \"테스트 커밋\""
echo ""
echo "🎯 이제 CI/BI 변경에 안전한 개발 환경이 구축되었습니다!"
echo ""
