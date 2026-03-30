#!/bin/bash
# 프론트엔드 컴파일 오류 일괄 수정 스크립트

FRONTEND_DIR="frontend/src"

echo "프론트엔드 오류 일괄 수정 시작..."

# 1. JSDoc 주석 형식 오류 수정: `* 설명` -> `/** 설명`
echo "1. JSDoc 주석 형식 수정 중..."
find "$FRONTEND_DIR" -name "*.js" -type f | while read file; do
    # 파일 시작 부분에 `* 설명` 형식이 있으면 `/**` 추가
    if head -5 "$file" | grep -q "^ \* [가-힣]"; then
        # 첫 번째 `* 설명` 줄 앞에 `/**` 추가
        sed -i '1s/^ \* \(.*\)/\/\*\*\n \* \1/' "$file" 2>/dev/null || true
    fi
    # 또는 import 다음에 바로 `* 설명`이 오는 경우
    if grep -q "^import" "$file" && grep -q "^ \* [가-힣]" "$file"; then
        # import 다음 줄이 `* 설명`이면 그 앞에 `/**` 추가
        sed -i '/^import/,/^ \* [가-힣]/{
            /^ \* [가-힣]/i\
/**
        }' "$file" 2>/dev/null || true
    fi
done

# 2. Button import 수정: `{ Button }` -> `Button`
echo "2. Button import 수정 중..."
find "$FRONTEND_DIR" -name "*.js" -type f -exec sed -i 's/import { Button } from/import Button from/g' {} \;

echo "일괄 수정 완료!"

