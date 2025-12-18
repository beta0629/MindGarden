#!/bin/bash

# 마인드가든 홈페이지 프로덕션 서버 실행 스크립트

echo "🚀 마인드가든 홈페이지 프로덕션 서버 시작..."
echo "📌 서버: http://localhost:3000"
echo ""

# 빌드 확인
if [ ! -d ".next" ]; then
    echo "⚠️  빌드된 파일이 없습니다. 빌드를 먼저 실행합니다..."
    npm run build
    echo ""
fi

# 환경 변수 확인
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local 파일이 없습니다."
    echo "📝 프로덕션 환경 변수를 설정하세요."
    echo ""
fi

# 포트 확인
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  포트 3000이 이미 사용 중입니다."
    read -p "포트를 변경하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "사용할 포트 번호를 입력하세요 (기본값: 3000): " PORT
        PORT=${PORT:-3000}
        npm run start -- -p $PORT
    else
        echo "기존 포트를 사용합니다."
        npm run start
    fi
else
    npm run start
fi

