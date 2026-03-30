#!/bin/bash

# GitHub Actions 운영 배포 트리거 스크립트
# GitHub Personal Access Token이 필요합니다.

set -e

echo "🚀 MindGarden 운영 배포 트리거"
echo "=================================="

# GitHub 저장소 정보
REPO_OWNER="beta0629"
REPO_NAME="MindGarden"
WORKFLOW_FILE="🚀 MindGarden 운영 배포.yml"

# GitHub Personal Access Token 확인
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN 환경 변수가 설정되지 않았습니다."
    echo ""
    echo "다음 중 하나의 방법을 선택하세요:"
    echo ""
    echo "1. GitHub 웹 인터페이스에서 실행:"
    echo "   https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/workflows/deploy-production.yml"
    echo "   → 'Run workflow' 버튼 클릭 → main 브랜치 선택 → 실행"
    echo ""
    echo "2. GitHub CLI 설치 후 실행:"
    echo "   brew install gh"
    echo "   gh auth login"
    echo "   gh workflow run \"${WORKFLOW_FILE}\" --ref main"
    echo ""
    echo "3. 이 스크립트에 GITHUB_TOKEN 설정 후 실행:"
    echo "   export GITHUB_TOKEN=your_token_here"
    echo "   ./scripts/trigger-production-deploy.sh"
    exit 1
fi

# GitHub API를 사용하여 워크플로우 트리거
echo "📡 GitHub API로 워크플로우 트리거 중..."

WORKFLOW_ID=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows" \
    | jq -r ".workflows[] | select(.name == \"${WORKFLOW_FILE}\") | .id")

if [ -z "$WORKFLOW_ID" ] || [ "$WORKFLOW_ID" == "null" ]; then
    echo "❌ 워크플로우를 찾을 수 없습니다."
    echo "워크플로우 파일명을 확인하세요: ${WORKFLOW_FILE}"
    exit 1
fi

echo "✅ 워크플로우 ID: ${WORKFLOW_ID}"

# 워크플로우 실행
RESPONSE=$(curl -s -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_ID}/dispatches" \
    -d "{\"ref\":\"main\"}")

if [ $? -eq 0 ]; then
    echo "✅ 워크플로우 트리거 성공!"
    echo ""
    echo "배포 상태 확인:"
    echo "https://github.com/${REPO_OWNER}/${REPO_NAME}/actions"
    echo ""
    echo "워크플로우 실행 확인:"
    echo "https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/workflows/deploy-production.yml"
else
    echo "❌ 워크플로우 트리거 실패"
    echo "응답: $RESPONSE"
    exit 1
fi

