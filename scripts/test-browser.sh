#!/bin/bash

# 브라우저 테스트 가이드 스크립트
# 사용법: ./scripts/test-browser.sh

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로고 출력
echo -e "${PURPLE}"
echo "=========================================="
echo "  🌐 브라우저 테스트 가이드"
echo "=========================================="
echo -e "${NC}"

# 프로젝트 루트로 이동
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."
PROJECT_ROOT=$(pwd)

echo -e "${CYAN}📂 프로젝트 루트: ${PROJECT_ROOT}${NC}"
echo ""

# ===============================================
# 1단계: 서버 상태 확인
# ===============================================
echo -e "${YELLOW}📊 1단계: 서버 상태 확인${NC}"
echo ""

# 백엔드 서버 확인
echo -e "${BLUE}   백엔드 서버 (포트 8080) 확인...${NC}"
if lsof -i:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ 백엔드 서버 실행 중${NC}"
    BACKEND_RUNNING=true
else
    echo -e "${YELLOW}   ⚠️  백엔드 서버가 실행되지 않았습니다.${NC}"
    BACKEND_RUNNING=false
fi

# 프론트엔드 서버 확인
echo -e "${BLUE}   프론트엔드 서버 (포트 3000) 확인...${NC}"
if lsof -i:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ 프론트엔드 서버 실행 중${NC}"
    FRONTEND_RUNNING=true
else
    echo -e "${YELLOW}   ⚠️  프론트엔드 서버가 실행되지 않았습니다.${NC}"
    FRONTEND_RUNNING=false
fi

echo ""

# ===============================================
# 2단계: 서버 시작 안내
# ===============================================
if [ "$BACKEND_RUNNING" = false ] || [ "$FRONTEND_RUNNING" = false ]; then
    echo -e "${YELLOW}🚀 2단계: 서버 시작 필요${NC}"
    echo ""
    echo -e "${CYAN}다음 명령어로 서버를 시작하세요:${NC}"
    echo ""
    echo -e "${BLUE}   ./start-local.sh${NC}"
    echo ""
    echo -e "${YELLOW}또는 개별 실행:${NC}"
    echo ""
    echo -e "${BLUE}   # 백엔드 (터미널 1)${NC}"
    echo -e "${BLUE}   mvn spring-boot:run -Dspring.profiles.active=dev${NC}"
    echo ""
    echo -e "${BLUE}   # 프론트엔드 (터미널 2)${NC}"
    echo -e "${BLUE}   cd frontend && npm start${NC}"
    echo ""
    echo -e "${CYAN}서버 시작 후 이 스크립트를 다시 실행하세요.${NC}"
    echo ""
    exit 0
fi

# ===============================================
# 3단계: 브라우저 테스트 가이드
# ===============================================
echo -e "${YELLOW}🌐 3단계: 브라우저 테스트 가이드${NC}"
echo ""

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  📋 테스트 체크리스트${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

echo -e "${PURPLE}■ 로그인 테스트${NC}"
echo ""
echo -e "${BLUE}1. 브라우저에서 접속:${NC}"
echo -e "   ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}2. 테스트 계정으로 로그인:${NC}"
echo -e "   이메일: ${GREEN}test-consultation-1763988242@example.com${NC}"
echo -e "   비밀번호: ${GREEN}Test1234!@#${NC}"
echo ""
echo -e "${BLUE}3. 확인 사항:${NC}"
echo "   [ ] 로그인 성공"
echo "   [ ] 대시보드 정상 로딩"
echo "   [ ] 세션 유지 확인"
echo ""

echo -e "${PURPLE}■ 위젯 테스트${NC}"
echo ""
echo -e "${BLUE}4. 대시보드에서 위젯 확인:${NC}"
echo "   [ ] TodayStatsWidget - 오늘의 통계"
echo "   [ ] SystemOverviewWidget - 시스템 개요"
echo "   [ ] QuickActionsWidget - 빠른 작업"
echo "   [ ] ConsultationStatsWidget - 상담 통계"
echo "   [ ] ScheduleWidget - 일정"
echo ""
echo -e "${BLUE}5. 무한 로딩 확인:${NC}"
echo "   [ ] 모든 위젯이 3초 이내 로딩 완료"
echo "   [ ] 로딩 스피너가 멈추지 않는 위젯 없음"
echo ""

echo -e "${PURPLE}■ 데이터 연동 테스트${NC}"
echo ""
echo -e "${BLUE}6. 브라우저 개발자 도구 열기 (F12):${NC}"
echo "   [ ] Network 탭 확인"
echo "   [ ] Console 탭에서 에러 없음"
echo ""
echo -e "${BLUE}7. API 호출 확인 (Network 탭):${NC}"
echo "   [ ] /api/schedules/today/statistics"
echo "   [ ] /api/v1/consultations/statistics/overall"
echo "   [ ] /api/admin/monitoring/status"
echo "   [ ] 모든 API가 200 OK 응답"
echo ""
echo -e "${BLUE}8. tenantId 확인:${NC}"
echo "   [ ] API 요청에 tenantId 파라미터 포함"
echo "   [ ] 응답 데이터가 해당 테넌트 데이터만 포함"
echo ""

echo -e "${PURPLE}■ 크로스 테넌트 접근 차단 테스트${NC}"
echo ""
echo -e "${BLUE}9. Console 탭에서 다음 코드 실행:${NC}"
echo ""
echo -e "${GREEN}fetch('/api/schedules/today/statistics?tenantId=other-tenant', {${NC}"
echo -e "${GREEN}  credentials: 'include'${NC}"
echo -e "${GREEN}}).then(r => r.json()).then(d => console.log(d));${NC}"
echo ""
echo -e "${BLUE}10. 예상 결과:${NC}"
echo "   [ ] 403 Forbidden 또는 빈 데이터"
echo "   [ ] 다른 테넌트 데이터 접근 불가"
echo ""

echo -e "${PURPLE}■ 성능 테스트${NC}"
echo ""
echo -e "${BLUE}11. 페이지 로딩 시간 측정:${NC}"
echo "   [ ] Network 탭에서 'Load' 시간 확인"
echo "   [ ] 페이지 로딩 < 2초"
echo "   [ ] API 응답 < 500ms"
echo ""

echo -e "${CYAN}========================================${NC}"
echo ""

# ===============================================
# 4단계: 테스트 완료 후 안내
# ===============================================
echo -e "${YELLOW}📝 4단계: 테스트 완료 후${NC}"
echo ""
echo -e "${BLUE}테스트 결과를 다음 파일에 기록하세요:${NC}"
echo -e "   ${GREEN}docs/project-management/archive/2025-12-01/BROWSER_TEST_RESULT.md${NC}"
echo ""
echo -e "${BLUE}기록할 내용:${NC}"
echo "   - 테스트 일시"
echo "   - 성공/실패 항목"
echo "   - 발견된 이슈"
echo "   - 스크린샷 (선택적)"
echo ""

# ===============================================
# 5단계: 유용한 명령어
# ===============================================
echo -e "${YELLOW}🔧 5단계: 유용한 명령어${NC}"
echo ""
echo -e "${BLUE}서버 로그 확인:${NC}"
echo -e "   ${GREEN}tail -f logs/application.log${NC}  # 백엔드"
echo -e "   ${GREEN}tail -f logs/frontend.log${NC}     # 프론트엔드"
echo ""
echo -e "${BLUE}서버 재시작:${NC}"
echo -e "   ${GREEN}./stop-local.sh && ./start-local.sh${NC}"
echo ""
echo -e "${BLUE}브라우저 캐시 삭제:${NC}"
echo -e "   ${GREEN}Ctrl + Shift + R${NC}  # 강력 새로고침"
echo ""

echo -e "${GREEN}✅ 브라우저 테스트 가이드 완료${NC}"
echo ""
echo -e "${CYAN}행운을 빕니다! 🚀${NC}"
echo ""

