#!/bin/bash

# Ops Portal 개발 서버 환경 변수 설정 스크립트
# 사용법: ./scripts/deploy-ops-env-dev.sh

set -e

DEV_SERVER="root@beta0629.cafe24.com"
FRONTEND_OPS_PATH="/opt/mindgarden/frontend-ops"

echo "🔧 Ops Portal 개발 서버 환경 변수 설정 중..."

# 개발 서버에서 frontend-ops 경로 찾기
ssh ${DEV_SERVER} << 'EOF'
FRONTEND_OPS_PATH=$(find / -maxdepth 5 -name "frontend-ops" -type d 2>/dev/null | grep -E "(opt|root|home)" | head -1)
if [ -z "$FRONTEND_OPS_PATH" ]; then
    echo "❌ frontend-ops 디렉토리를 찾을 수 없습니다."
    exit 1
fi

cd "$FRONTEND_OPS_PATH"
echo "📁 작업 디렉토리: $(pwd)"

# .env.production 파일 생성
cat > .env.production << 'ENVFILE'
# Ops Portal 개발 서버 환경 변수
# 생성일: $(date)

# 백엔드 API Base URL (서버 사이드에서 사용)
OPS_API_BASE_URL=http://localhost:8080/api/v1

# 클라이언트 사이드에서 사용 (Next.js 빌드 시 포함)
NEXT_PUBLIC_OPS_API_BASE_URL=http://localhost:8080/api/v1

# Mock API 사용 안 함
NEXT_PUBLIC_OPS_API_USE_MOCK=false

# Node 환경
NODE_ENV=production
ENVFILE

echo "✅ .env.production 파일 생성 완료"
echo ""
echo "📄 생성된 파일 내용:"
cat .env.production

echo ""
echo "⚠️  Next.js 앱을 재시작해야 환경 변수가 적용됩니다."
echo "   pm2 restart ops-portal 또는 systemctl restart ops-portal"
EOF

echo ""
echo "✅ 환경 변수 설정 완료!"
echo ""
echo "다음 단계:"
echo "1. 개발 서버에서 Next.js 앱 재시작"
echo "2. 로그인 테스트 진행"

