#!/bin/bash

# MindGarden 자동 메모리 관리 크론잡 설정
# 메모리 사용량 모니터링 및 자동 최적화

echo "⏰ 자동 메모리 관리 크론잡 설정 중..."

# 로그 디렉토리 생성
sudo mkdir -p /var/log/mindgarden
sudo chown beta74:beta74 /var/log/mindgarden

# 메모리 체크 스크립트 생성
cat > /tmp/auto-memory-check.sh << 'EOF'
#!/bin/bash

LOG_FILE="/var/log/mindgarden/memory-auto.log"
ALERT_THRESHOLD=1500  # MB
CRITICAL_THRESHOLD=1800  # MB

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Java 프로세스 확인
JAVA_PID=$(pgrep -f "mindgarden")
if [ -z "$JAVA_PID" ]; then
    log "경고: MindGarden 프로세스가 실행 중이지 않음"
    exit 1
fi

# 메모리 사용량 확인
RSS_KB=$(ps -p $JAVA_PID -o rss --no-headers | tr -d ' ')
RSS_MB=$((RSS_KB / 1024))

log "메모리 체크 - PID: $JAVA_PID, RSS: ${RSS_MB}MB"

# 임계치 확인 및 조치
if [ $RSS_MB -gt $CRITICAL_THRESHOLD ]; then
    log "위험: 메모리 사용량 ${RSS_MB}MB (임계치: ${CRITICAL_THRESHOLD}MB) - 서비스 재시작"
    
    # 힙 덤프 생성 (분석용)
    DUMP_FILE="/var/log/mindgarden/emergency-dump-$(date +%Y%m%d_%H%M%S).hprof"
    jmap -dump:live,format=b,file=$DUMP_FILE $JAVA_PID 2>/dev/null || true
    
    # 서비스 재시작
    sudo systemctl restart mindgarden
    log "서비스 재시작 완료"
    
elif [ $RSS_MB -gt $ALERT_THRESHOLD ]; then
    log "주의: 메모리 사용량 ${RSS_MB}MB (경고 임계치: ${ALERT_THRESHOLD}MB) - GC 실행"
    
    # 강제 GC 실행
    jcmd $JAVA_PID GC.run 2>/dev/null || true
    sleep 3
    
    # GC 후 메모리 확인
    NEW_RSS_KB=$(ps -p $JAVA_PID -o rss --no-headers | tr -d ' ')
    NEW_RSS_MB=$((NEW_RSS_KB / 1024))
    log "GC 후 메모리: ${NEW_RSS_MB}MB (절약: $((RSS_MB - NEW_RSS_MB))MB)"
    
else
    log "정상: 메모리 사용량 ${RSS_MB}MB"
fi

# 오래된 로그 파일 정리 (7일 이상)
find /var/log/mindgarden -name "*.log" -mtime +7 -delete 2>/dev/null || true
find /var/log/mindgarden -name "*.hprof" -mtime +3 -delete 2>/dev/null || true
EOF

# 스크립트 설치
chmod +x /tmp/auto-memory-check.sh
sudo mv /tmp/auto-memory-check.sh /usr/local/bin/mindgarden-auto-memory.sh

# 일일 메모리 리포트 스크립트
cat > /tmp/daily-memory-report.sh << 'EOF'
#!/bin/bash

REPORT_FILE="/var/log/mindgarden/daily-memory-report-$(date +%Y%m%d).log"

echo "📊 MindGarden 일일 메모리 리포트 - $(date)" > "$REPORT_FILE"
echo "=================================================" >> "$REPORT_FILE"

# 시스템 메모리 현황
echo "" >> "$REPORT_FILE"
echo "💻 시스템 메모리:" >> "$REPORT_FILE"
free -h >> "$REPORT_FILE"

# Java 프로세스 정보
JAVA_PID=$(pgrep -f "mindgarden")
if [ ! -z "$JAVA_PID" ]; then
    echo "" >> "$REPORT_FILE"
    echo "☕ Java 프로세스 (PID: $JAVA_PID):" >> "$REPORT_FILE"
    ps -p $JAVA_PID -o pid,pmem,rss,vsz,etime,cmd --no-headers >> "$REPORT_FILE"
    
    echo "" >> "$REPORT_FILE"
    echo "🧠 JVM 힙 메모리:" >> "$REPORT_FILE"
    jstat -gc $JAVA_PID >> "$REPORT_FILE" 2>/dev/null || echo "GC 정보 수집 실패" >> "$REPORT_FILE"
fi

# 오늘의 메모리 이벤트 요약
echo "" >> "$REPORT_FILE"
echo "📈 오늘의 메모리 이벤트:" >> "$REPORT_FILE"
grep "$(date +%Y-%m-%d)" /var/log/mindgarden/memory-auto.log 2>/dev/null | tail -20 >> "$REPORT_FILE" || echo "메모리 이벤트 없음" >> "$REPORT_FILE"

echo "일일 메모리 리포트 생성 완료: $REPORT_FILE"
EOF

chmod +x /tmp/daily-memory-report.sh
sudo mv /tmp/daily-memory-report.sh /usr/local/bin/mindgarden-daily-report.sh

# 크론잡 설정
echo "⏰ 크론잡 설정 중..."

# 기존 크론잡 백업
crontab -l > /tmp/crontab-backup-$(date +%Y%m%d_%H%M%S).txt 2>/dev/null || true

# 새 크론잡 설정
(crontab -l 2>/dev/null | grep -v "mindgarden"; cat << 'CRON_JOBS'
# MindGarden 메모리 관리 크론잡
*/5 * * * * /usr/local/bin/mindgarden-auto-memory.sh >/dev/null 2>&1
0 6 * * * /usr/local/bin/mindgarden-daily-report.sh >/dev/null 2>&1
0 3 * * 0 find /var/log/mindgarden -name "*.log" -mtime +30 -delete 2>/dev/null
CRON_JOBS
) | crontab -

echo "✅ 자동 메모리 관리 설정 완료!"
echo ""
echo "📋 설정된 크론잡:"
echo "   - 5분마다: 메모리 사용량 체크 및 자동 최적화"
echo "   - 매일 06:00: 일일 메모리 리포트 생성"
echo "   - 매주 일요일 03:00: 오래된 로그 파일 정리"
echo ""
echo "📁 로그 파일 위치:"
echo "   - 자동 관리: /var/log/mindgarden/memory-auto.log"
echo "   - 일일 리포트: /var/log/mindgarden/daily-memory-report-YYYYMMDD.log"
echo ""
echo "🔍 모니터링 명령어:"
echo "   tail -f /var/log/mindgarden/memory-auto.log  # 실시간 로그"
echo "   ./memory-management.sh monitor              # 실시간 모니터링"
