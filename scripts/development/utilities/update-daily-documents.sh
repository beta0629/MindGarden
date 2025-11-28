#!/bin/bash

# 매일 날짜별 문서 업데이트 스크립트
# 사용법: ./scripts/update-daily-documents.sh [YYYY-MM-DD]
# 날짜를 지정하지 않으면 오늘 날짜 사용

set -e

# 날짜 확인
if [ -z "$1" ]; then
    TODAY=$(date +%Y-%m-%d)
else
    TODAY="$1"
fi

# 날짜 형식 검증
if ! [[ "$TODAY" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    echo "❌ 날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식을 사용하세요."
    exit 1
fi

# 프로젝트 루트 디렉토리
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCS_DIR="$PROJECT_ROOT/docs/mgsb"
TODAY_DIR="$DOCS_DIR/$TODAY"

# 어제 날짜 찾기 (가장 최근 날짜 폴더)
YESTERDAY_DIR=$(find "$DOCS_DIR" -maxdepth 1 -type d -name "2025-*" | sort -r | head -1)

if [ -z "$YESTERDAY_DIR" ]; then
    echo "❌ 이전 날짜 폴더를 찾을 수 없습니다."
    exit 1
fi

YESTERDAY=$(basename "$YESTERDAY_DIR")
echo "📅 오늘 날짜: $TODAY"
echo "📅 어제 날짜: $YESTERDAY"

# 오늘 날짜 폴더 생성
if [ -d "$TODAY_DIR" ]; then
    echo "⚠️  오늘 날짜 폴더가 이미 존재합니다: $TODAY_DIR"
    read -p "계속하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    mkdir -p "$TODAY_DIR"
    echo "✅ 오늘 날짜 폴더 생성: $TODAY_DIR"
fi

# 문서 복사
DOCUMENTS=(
    "PENDING_DEVELOPMENT_ITEMS.md"
    "DEVELOPMENT_CHECKLIST.md"
)

for doc in "${DOCUMENTS[@]}"; do
    if [ -f "$YESTERDAY_DIR/$doc" ]; then
        cp "$YESTERDAY_DIR/$doc" "$TODAY_DIR/$doc"
        echo "✅ 문서 복사: $doc"
        
        # 날짜 업데이트 (sed를 사용하여 날짜 교체)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/\*\*작성일\*\*: $YESTERDAY/\*\*작성일\*\*: $TODAY/g" "$TODAY_DIR/$doc"
            sed -i '' "s/\*\*최종 업데이트\*\*: $YESTERDAY/\*\*최종 업데이트\*\*: $TODAY/g" "$TODAY_DIR/$doc"
            sed -i '' "s/\*\*작성일\*\*: 2025-[0-9][0-9]-[0-9][0-9]/\*\*작성일\*\*: $TODAY/g" "$TODAY_DIR/$doc"
            sed -i '' "s/\*\*최종 업데이트\*\*: 2025-[0-9][0-9]-[0-9][0-9]/\*\*최종 업데이트\*\*: $TODAY/g" "$TODAY_DIR/$doc"
        else
            # Linux
            sed -i "s/\*\*작성일\*\*: $YESTERDAY/\*\*작성일\*\*: $TODAY/g" "$TODAY_DIR/$doc"
            sed -i "s/\*\*최종 업데이트\*\*: $YESTERDAY/\*\*최종 업데이트\*\*: $TODAY/g" "$TODAY_DIR/$doc"
            sed -i "s/\*\*작성일\*\*: 2025-[0-9][0-9]-[0-9][0-9]/\*\*작성일\*\*: $TODAY/g" "$TODAY_DIR/$doc"
            sed -i "s/\*\*최종 업데이트\*\*: 2025-[0-9][0-9]-[0-9][0-9]/\*\*최종 업데이트\*\*: $TODAY/g" "$TODAY_DIR/$doc"
        fi
        
        echo "✅ 날짜 업데이트 완료: $doc"
    else
        echo "⚠️  문서를 찾을 수 없습니다: $YESTERDAY_DIR/$doc"
    fi
done

echo ""
echo "✅ 문서 업데이트 완료!"
echo "📁 오늘 날짜 폴더: $TODAY_DIR"
echo ""
echo "다음 단계:"
echo "1. 문서를 열어서 오늘 완료된 작업 체크"
echo "2. 진행 상황 업데이트"
echo "3. 필요 시 새로운 작업 추가"

