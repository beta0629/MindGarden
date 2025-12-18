#!/bin/bash

# 마인드가든 홈페이지 개발 서버 실행 스크립트
# 코어솔루션 포트(8080)와 겹치지 않도록 설정

echo "🚀 마인드가든 홈페이지 개발 서버 시작..."
echo "📌 프론트엔드: http://localhost:3000"
echo "📌 코어솔루션 API: http://beta0629.cafe24.com:8080 (또는 환경 변수 설정값)"
echo ""

# 환경 변수 확인
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local 파일이 없습니다."
    echo "📝 .env.local 파일을 생성하고 다음 내용을 추가하세요:"
    echo ""
    echo "NEXT_PUBLIC_API_BASE_URL=http://beta0629.cafe24.com:8080"
    echo "BLOG_ADMIN_PASSWORD=your-secure-password"
    echo ""
    read -p "계속하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 포트 확인
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  포트 3000이 이미 사용 중입니다."
    read -p "포트를 변경하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "사용할 포트 번호를 입력하세요 (기본값: 3000): " PORT
        PORT=${PORT:-3000}
        npm run dev -- -p $PORT
    else
        echo "기존 포트를 사용합니다."
        npm run dev
    fi
else
    npm run dev
fi

