#!/bin/bash
# 환경 변수 자동 로드 스크립트 (macOS/Linux)
# Usage: source scripts/load-env.sh

ENV_FILE=".env.local"

# 프로젝트 루트 디렉토리로 이동
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env.local 파일이 없습니다."
    echo "💡 env.local.example을 복사하여 .env.local을 만드세요:"
    echo "   cp env.local.example .env.local"
    exit 1
fi

# 환경 변수 로드 (주석 제외)
while IFS= read -r line || [ -n "$line" ]; do
    # 주석과 빈 줄 건너뛰기
    if [[ "$line" =~ ^[[:space:]]*# ]] || [[ -z "$line" ]]; then
        continue
    fi
    
    # 환경 변수 export
    if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
        export "${BASH_REMATCH[1]}"="${BASH_REMATCH[2]}"
    fi
done < "$ENV_FILE"

echo "✅ 환경 변수가 로드되었습니다."
echo "📋 DB_HOST: $DB_HOST"
echo "📋 DB_NAME: $DB_NAME"
echo "📋 DB_USERNAME: $DB_USERNAME"
echo ""
echo "💡 이 스크립트는 source 명령으로 실행해야 합니다:"
echo "   source scripts/load-env.sh"

