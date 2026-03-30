#!/bin/bash
# GitHub Actions 워크플로우 실행 스크립트
# 개발 서버 로그 확인 워크플로우를 실행합니다.

set -e

echo "=========================================="
echo "📋 개발 서버 로그 확인 워크플로우 실행"
echo "=========================================="
echo ""

# GitHub CLI 인증 확인
if ! gh auth status &>/dev/null; then
    echo "⚠️ GitHub CLI 인증이 필요합니다."
    echo ""
    echo "다음 명령어로 인증하세요:"
    echo "  gh auth login"
    echo ""
    echo "또는 GitHub 웹 인터페이스에서 실행하세요:"
    echo "  https://github.com/beta0629/MindGarden/actions/workflows/check-dev-server-logs.yml"
    exit 1
fi

# 워크플로우 실행
echo "🚀 워크플로우 실행 중..."
WORKFLOW_RUN=$(gh workflow run "check-dev-server-logs.yml" --ref develop 2>&1)

if [ $? -eq 0 ]; then
    echo "✅ 워크플로우 실행 성공!"
    echo ""
    echo "실행 상태 확인:"
    echo "  gh run list --workflow='check-dev-server-logs.yml' --limit 1"
    echo ""
    echo "실시간 로그 확인:"
    echo "  gh run watch"
    echo ""
    echo "또는 GitHub 웹에서 확인:"
    echo "  https://github.com/beta0629/MindGarden/actions"
    echo ""
    
    # 최근 실행 확인
    sleep 2
    echo "📋 최근 실행 상태:"
    gh run list --workflow="check-dev-server-logs.yml" --limit 1
else
    echo "❌ 워크플로우 실행 실패"
    echo "$WORKFLOW_RUN"
    exit 1
fi

