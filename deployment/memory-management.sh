#!/bin/bash

# MindGarden 운영 서버 메모리 관리 스크립트
# 서버: $PROD_SERVER_HOST
# 사용법: ./memory-management.sh [check|optimize|monitor|gc|restart]

set -e

SERVICE_NAME="mindgarden"
LOG_DIR="/var/log/mindgarden"
MEMORY_LOG="$LOG_DIR/memory.log"
PID_FILE="/var/run/mindgarden.pid"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$MEMORY_LOG"
}

# 메모리 사용량 확인
check_memory() {
    echo -e "${BLUE}🔍 시스템 메모리 현황${NC}"
    echo "=================================="
    
    # 전체 시스템 메모리
    echo -e "${YELLOW}📊 시스템 메모리:${NC}"
    free -h
    echo ""
    
    # Java 프로세스 메모리
    if pgrep -f "mindgarden" > /dev/null; then
        JAVA_PID=$(pgrep -f "mindgarden")
        echo -e "${YELLOW}☕ Java 프로세스 메모리 (PID: $JAVA_PID):${NC}"
        
        # RSS, VSZ 메모리 사용량
        ps -p $JAVA_PID -o pid,ppid,cmd,pmem,rss,vsz,time --no-headers
        echo ""
        
        # JVM 힙 메모리 상세 정보
        echo -e "${YELLOW}🧠 JVM 힙 메모리 상세:${NC}"
        jstat -gc $JAVA_PID | head -2
        echo ""
        
        # GC 통계
        echo -e "${YELLOW}🗑️ GC 통계:${NC}"
        jstat -gccapacity $JAVA_PID | head -2
        echo ""
        
        log "메모리 체크 - PID: $JAVA_PID, RSS: $(ps -p $JAVA_PID -o rss --no-headers | tr -d ' ')KB"
    else
        echo -e "${RED}❌ MindGarden 프로세스를 찾을 수 없습니다.${NC}"
        log "메모리 체크 실패 - 프로세스 없음"
    fi
}

# 메모리 최적화
optimize_memory() {
    echo -e "${BLUE}⚡ 메모리 최적화 시작${NC}"
    echo "=================================="
    
    # 1. 시스템 캐시 정리
    echo -e "${YELLOW}🧹 시스템 캐시 정리...${NC}"
    sync
    echo 3 > /proc/sys/vm/drop_caches
    echo "✅ 시스템 캐시 정리 완료"
    
    # 2. Java GC 강제 실행
    if pgrep -f "mindgarden" > /dev/null; then
        JAVA_PID=$(pgrep -f "mindgarden")
        echo -e "${YELLOW}🗑️ Java GC 강제 실행...${NC}"
        
        # jcmd를 사용한 GC 실행
        jcmd $JAVA_PID GC.run_finalization
        jcmd $JAVA_PID GC.run
        
        echo "✅ Java GC 실행 완료"
        log "메모리 최적화 완료 - PID: $JAVA_PID"
    else
        echo -e "${RED}❌ MindGarden 프로세스를 찾을 수 없습니다.${NC}"
    fi
    
    # 3. 최적화 후 메모리 상태 확인
    echo ""
    echo -e "${GREEN}📈 최적화 후 메모리 상태:${NC}"
    free -h
}

# 실시간 메모리 모니터링
monitor_memory() {
    echo -e "${BLUE}📊 실시간 메모리 모니터링 시작${NC}"
    echo "=================================="
    echo "Ctrl+C로 종료"
    echo ""
    
    while true; do
        clear
        echo -e "${BLUE}🔄 MindGarden 메모리 모니터링 - $(date)${NC}"
        echo "=================================================="
        
        if pgrep -f "mindgarden" > /dev/null; then
            JAVA_PID=$(pgrep -f "mindgarden")
            
            # 시스템 메모리
            echo -e "${YELLOW}💻 시스템 메모리:${NC}"
            free -h | grep -E "(Mem|Swap)"
            echo ""
            
            # Java 프로세스 메모리
            echo -e "${YELLOW}☕ Java 프로세스 (PID: $JAVA_PID):${NC}"
            ps -p $JAVA_PID -o pid,pmem,rss,vsz --no-headers | \
            awk '{printf "메모리 사용률: %s%%, RSS: %sMB, VSZ: %sMB\n", $2, int($3/1024), int($4/1024)}'
            echo ""
            
            # JVM 힙 사용량
            echo -e "${YELLOW}🧠 JVM 힙 사용량:${NC}"
            jstat -gc $JAVA_PID | tail -1 | \
            awk '{printf "Eden: %.1fMB, Survivor: %.1fMB, Old: %.1fMB, GC Count: %d\n", $6/1024, ($7+$8)/1024, $10/1024, $13+$14}'
            
            # 메모리 경고 체크
            RSS_KB=$(ps -p $JAVA_PID -o rss --no-headers | tr -d ' ')
            RSS_MB=$((RSS_KB / 1024))
            
            if [ $RSS_MB -gt 1500 ]; then
                echo -e "${RED}⚠️ 메모리 사용량 높음: ${RSS_MB}MB${NC}"
                log "메모리 경고 - RSS: ${RSS_MB}MB"
            elif [ $RSS_MB -gt 1000 ]; then
                echo -e "${YELLOW}⚠️ 메모리 사용량 주의: ${RSS_MB}MB${NC}"
            else
                echo -e "${GREEN}✅ 메모리 사용량 정상: ${RSS_MB}MB${NC}"
            fi
            
        else
            echo -e "${RED}❌ MindGarden 프로세스가 실행 중이지 않습니다.${NC}"
        fi
        
        sleep 5
    done
}

# 강제 GC 실행
force_gc() {
    echo -e "${BLUE}🗑️ 강제 GC 실행${NC}"
    echo "=================================="
    
    if pgrep -f "mindgarden" > /dev/null; then
        JAVA_PID=$(pgrep -f "mindgarden")
        
        echo "GC 실행 전 메모리 상태:"
        jstat -gc $JAVA_PID | head -2
        echo ""
        
        echo -e "${YELLOW}🔄 GC 실행 중...${NC}"
        jcmd $JAVA_PID GC.run_finalization
        jcmd $JAVA_PID GC.run
        
        sleep 3
        
        echo -e "${GREEN}✅ GC 실행 완료${NC}"
        echo "GC 실행 후 메모리 상태:"
        jstat -gc $JAVA_PID | head -2
        
        log "강제 GC 실행 완료 - PID: $JAVA_PID"
    else
        echo -e "${RED}❌ MindGarden 프로세스를 찾을 수 없습니다.${NC}"
    fi
}

# 서비스 재시작 (메모리 리셋)
restart_service() {
    echo -e "${BLUE}🔄 MindGarden 서비스 재시작${NC}"
    echo "=================================="
    
    echo -e "${YELLOW}🛑 서비스 중지 중...${NC}"
    sudo systemctl stop $SERVICE_NAME
    sleep 5
    
    echo -e "${YELLOW}🚀 서비스 시작 중...${NC}"
    sudo systemctl start $SERVICE_NAME
    sleep 10
    
    echo -e "${YELLOW}🔍 서비스 상태 확인...${NC}"
    sudo systemctl status $SERVICE_NAME --no-pager
    
    if systemctl is-active --quiet $SERVICE_NAME; then
        echo -e "${GREEN}✅ 서비스 재시작 완료${NC}"
        log "서비스 재시작 완료"
    else
        echo -e "${RED}❌ 서비스 시작 실패${NC}"
        log "서비스 재시작 실패"
        exit 1
    fi
}

# 메모리 사용량 알림 설정
setup_memory_alert() {
    echo -e "${BLUE}🔔 메모리 알림 설정${NC}"
    echo "=================================="
    
    # crontab에 메모리 체크 스크립트 추가
    cat << 'CRON_SCRIPT' > /tmp/memory-check.sh
#!/bin/bash
JAVA_PID=$(pgrep -f "mindgarden")
if [ ! -z "$JAVA_PID" ]; then
    RSS_KB=$(ps -p $JAVA_PID -o rss --no-headers | tr -d ' ')
    RSS_MB=$((RSS_KB / 1024))
    
    if [ $RSS_MB -gt 1800 ]; then
        echo "$(date) - 메모리 사용량 위험: ${RSS_MB}MB" >> /var/log/mindgarden/memory-alert.log
        # 필요시 알림톡 또는 이메일 발송
        curl -X POST http://localhost:8080/api/admin/alert \
             -H "Content-Type: application/json" \
             -d "{\"type\":\"MEMORY_HIGH\",\"message\":\"메모리 사용량 위험: ${RSS_MB}MB\"}"
    fi
fi
CRON_SCRIPT
    
    chmod +x /tmp/memory-check.sh
    sudo mv /tmp/memory-check.sh /usr/local/bin/mindgarden-memory-check.sh
    
    # crontab 설정 (5분마다 체크)
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/mindgarden-memory-check.sh") | crontab -
    
    echo -e "${GREEN}✅ 메모리 알림 설정 완료 (5분마다 체크)${NC}"
}

# 메모리 덤프 생성 (문제 분석용)
create_memory_dump() {
    echo -e "${BLUE}💾 메모리 덤프 생성${NC}"
    echo "=================================="
    
    if pgrep -f "mindgarden" > /dev/null; then
        JAVA_PID=$(pgrep -f "mindgarden")
        DUMP_FILE="/tmp/mindgarden-heap-dump-$(date +%Y%m%d_%H%M%S).hprof"
        
        echo -e "${YELLOW}📸 힙 덤프 생성 중... (시간이 걸릴 수 있습니다)${NC}"
        jcmd $JAVA_PID GC.run_finalization
        jmap -dump:live,format=b,file=$DUMP_FILE $JAVA_PID
        
        echo -e "${GREEN}✅ 힙 덤프 생성 완료: $DUMP_FILE${NC}"
        echo "파일 크기: $(du -h $DUMP_FILE | cut -f1)"
        
        log "힙 덤프 생성 - 파일: $DUMP_FILE"
    else
        echo -e "${RED}❌ MindGarden 프로세스를 찾을 수 없습니다.${NC}"
    fi
}

# 도움말 표시
show_help() {
    echo -e "${BLUE}📖 MindGarden 메모리 관리 스크립트${NC}"
    echo "=================================="
    echo ""
    echo "사용법: $0 [명령어]"
    echo ""
    echo "명령어:"
    echo "  check     - 현재 메모리 사용량 확인"
    echo "  optimize  - 메모리 최적화 (캐시 정리 + GC)"
    echo "  monitor   - 실시간 메모리 모니터링"
    echo "  gc        - 강제 GC 실행"
    echo "  restart   - 서비스 재시작 (메모리 리셋)"
    echo "  dump      - 메모리 덤프 생성 (문제 분석용)"
    echo "  alert     - 메모리 알림 설정"
    echo "  help      - 이 도움말 표시"
    echo ""
    echo "예시:"
    echo "  $0 check          # 메모리 상태 확인"
    echo "  $0 monitor        # 실시간 모니터링"
    echo "  $0 optimize       # 메모리 최적화"
}

# 메인 실행 로직
case "${1:-help}" in
    "check")
        check_memory
        ;;
    "optimize")
        optimize_memory
        ;;
    "monitor")
        monitor_memory
        ;;
    "gc")
        force_gc
        ;;
    "restart")
        restart_service
        ;;
    "dump")
        create_memory_dump
        ;;
    "alert")
        setup_memory_alert
        ;;
    "help"|*)
        show_help
        ;;
esac
