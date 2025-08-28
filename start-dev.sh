#!/bin/bash

echo "🚀 MindGarden 개발 서버 시작 중..."

# 백그라운드에서 백엔드 서버 실행
echo "📡 Spring Boot 백엔드 서버 시작..."
mvn spring-boot:run -Dspring.profiles.active=dev &
BACKEND_PID=$!

# 잠시 대기 (백엔드 서버 시작 시간)
echo "⏳ 백엔드 서버 시작 대기 중..."
sleep 10

# 프론트엔드 서버 실행
echo "🌐 React 프론트엔드 서버 시작..."
cd frontend && npm start &
FRONTEND_PID=$!

echo "✅ 모든 서버가 시작되었습니다!"
echo "📡 백엔드: http://localhost:8080"
echo "🌐 프론트엔드: http://localhost:3000"
echo ""
echo "서버를 중지하려면: Ctrl+C"

# 프로세스 종료 처리
trap "echo '🛑 서버 종료 중...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

# 프로세스 모니터링
wait
