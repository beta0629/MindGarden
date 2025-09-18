#!/bin/bash

# MindGarden 메모리 모니터링 웹 대시보드
# 간단한 HTML 기반 메모리 현황 페이지

echo "📊 메모리 모니터링 대시보드 설정 중..."

# 웹 대시보드 디렉토리 생성
sudo mkdir -p /var/www/html/admin/memory
sudo chown beta74:beta74 /var/www/html/admin/memory

# 메모리 현황 JSON 생성 스크립트
cat > /tmp/memory-status-json.sh << 'EOF'
#!/bin/bash

JSON_FILE="/var/www/html/admin/memory/status.json"

# Java 프로세스 확인
JAVA_PID=$(pgrep -f "mindgarden")

if [ -z "$JAVA_PID" ]; then
    cat > "$JSON_FILE" << JSON
{
    "timestamp": "$(date -Iseconds)",
    "status": "error",
    "message": "MindGarden 프로세스가 실행 중이지 않습니다",
    "system_memory": {},
    "java_memory": {},
    "gc_stats": {}
}
JSON
    exit 1
fi

# 시스템 메모리 정보
TOTAL_MEM=$(free -m | awk 'NR==2{print $2}')
USED_MEM=$(free -m | awk 'NR==2{print $3}')
FREE_MEM=$(free -m | awk 'NR==2{print $4}')
AVAILABLE_MEM=$(free -m | awk 'NR==2{print $7}')

# Java 프로세스 메모리 정보
RSS_KB=$(ps -p $JAVA_PID -o rss --no-headers | tr -d ' ')
RSS_MB=$((RSS_KB / 1024))
PMEM=$(ps -p $JAVA_PID -o pmem --no-headers | tr -d ' ')

# JVM GC 정보
GC_INFO=$(jstat -gc $JAVA_PID 2>/dev/null | tail -1)
if [ $? -eq 0 ]; then
    EDEN=$(echo $GC_INFO | awk '{printf "%.1f", $6/1024}')
    SURVIVOR=$(echo $GC_INFO | awk '{printf "%.1f", ($7+$8)/1024}')
    OLD_GEN=$(echo $GC_INFO | awk '{printf "%.1f", $10/1024}')
    GC_COUNT=$(echo $GC_INFO | awk '{print $13+$14}')
else
    EDEN="0"
    SURVIVOR="0"
    OLD_GEN="0"
    GC_COUNT="0"
fi

# 메모리 상태 판정
if [ $RSS_MB -gt 1800 ]; then
    STATUS="critical"
    STATUS_MESSAGE="메모리 사용량 위험"
elif [ $RSS_MB -gt 1200 ]; then
    STATUS="warning"
    STATUS_MESSAGE="메모리 사용량 주의"
else
    STATUS="normal"
    STATUS_MESSAGE="메모리 사용량 정상"
fi

# JSON 생성
cat > "$JSON_FILE" << JSON
{
    "timestamp": "$(date -Iseconds)",
    "status": "$STATUS",
    "message": "$STATUS_MESSAGE",
    "system_memory": {
        "total_mb": $TOTAL_MEM,
        "used_mb": $USED_MEM,
        "free_mb": $FREE_MEM,
        "available_mb": $AVAILABLE_MEM,
        "usage_percent": $(echo "scale=1; $USED_MEM * 100 / $TOTAL_MEM" | bc -l)
    },
    "java_memory": {
        "pid": $JAVA_PID,
        "rss_mb": $RSS_MB,
        "memory_percent": $PMEM,
        "eden_mb": $EDEN,
        "survivor_mb": $SURVIVOR,
        "old_gen_mb": $OLD_GEN
    },
    "gc_stats": {
        "total_gc_count": $GC_COUNT,
        "last_update": "$(date -Iseconds)"
    }
}
JSON

chmod 644 "$JSON_FILE"
EOF

chmod +x /tmp/memory-status-json.sh
sudo mv /tmp/memory-status-json.sh /usr/local/bin/mindgarden-memory-json.sh

# 메모리 대시보드 HTML 생성
cat > /tmp/memory-dashboard.html << 'EOF'
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MindGarden 메모리 모니터링</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
        }
        .status-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 15px;
            border-left: 5px solid #667eea;
        }
        .card.warning { border-left-color: #ffa500; }
        .card.critical { border-left-color: #ff4757; }
        .card-title { font-size: 14px; color: #666; margin-bottom: 10px; }
        .card-value { font-size: 32px; font-weight: bold; color: #333; }
        .card-unit { font-size: 16px; color: #888; }
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e0e0e0;
            border-radius: 4px;
            margin-top: 15px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.3s ease;
        }
        .progress-fill.warning { background: linear-gradient(90deg, #ffa500, #ff6b35); }
        .progress-fill.critical { background: linear-gradient(90deg, #ff4757, #ff3742); }
        .refresh-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        }
        .timestamp {
            text-align: center;
            color: #666;
            margin-top: 20px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧠 MindGarden 메모리 모니터링</h1>
            <p>실시간 메모리 사용량 및 JVM 상태</p>
        </div>
        
        <div id="status-indicator" class="card">
            <div class="card-title">시스템 상태</div>
            <div id="status-message" class="card-value">로딩 중...</div>
        </div>
        
        <div class="status-cards">
            <div class="card">
                <div class="card-title">시스템 메모리 사용률</div>
                <div class="card-value">
                    <span id="system-usage">--</span>
                    <span class="card-unit">%</span>
                </div>
                <div class="progress-bar">
                    <div id="system-progress" class="progress-fill" style="width: 0%"></div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">Java 메모리 사용량</div>
                <div class="card-value">
                    <span id="java-memory">--</span>
                    <span class="card-unit">MB</span>
                </div>
                <div class="progress-bar">
                    <div id="java-progress" class="progress-fill" style="width: 0%"></div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">JVM 힙 사용량</div>
                <div class="card-value">
                    <span id="heap-usage">--</span>
                    <span class="card-unit">MB</span>
                </div>
                <div class="progress-bar">
                    <div id="heap-progress" class="progress-fill" style="width: 0%"></div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">GC 실행 횟수</div>
                <div class="card-value">
                    <span id="gc-count">--</span>
                    <span class="card-unit">회</span>
                </div>
            </div>
        </div>
        
        <div style="text-align: center;">
            <button class="refresh-btn" onclick="loadMemoryStatus()">🔄 새로고침</button>
            <button class="refresh-btn" onclick="forceGC()" style="background: linear-gradient(135deg, #ffa500 0%, #ff6b35 100%);">🗑️ GC 실행</button>
        </div>
        
        <div id="timestamp" class="timestamp">마지막 업데이트: --</div>
    </div>

    <script>
        let autoRefresh = true;
        
        async function loadMemoryStatus() {
            try {
                const response = await fetch('/admin/memory/status.json');
                const data = await response.json();
                
                // 상태 표시
                const statusCard = document.getElementById('status-indicator');
                const statusMessage = document.getElementById('status-message');
                
                statusCard.className = `card ${data.status}`;
                statusMessage.textContent = data.message;
                
                // 시스템 메모리
                const systemUsage = (data.system_memory.usage_percent || 0).toFixed(1);
                document.getElementById('system-usage').textContent = systemUsage;
                document.getElementById('system-progress').style.width = systemUsage + '%';
                document.getElementById('system-progress').className = 
                    `progress-fill ${systemUsage > 80 ? 'critical' : systemUsage > 60 ? 'warning' : ''}`;
                
                // Java 메모리
                const javaMemory = data.java_memory.rss_mb || 0;
                document.getElementById('java-memory').textContent = javaMemory;
                const javaPercent = Math.min((javaMemory / 2048) * 100, 100); // 2GB 기준
                document.getElementById('java-progress').style.width = javaPercent + '%';
                document.getElementById('java-progress').className = 
                    `progress-fill ${javaPercent > 90 ? 'critical' : javaPercent > 70 ? 'warning' : ''}`;
                
                // JVM 힙
                const heapUsage = (data.java_memory.eden_mb + data.java_memory.survivor_mb + data.java_memory.old_gen_mb).toFixed(1);
                document.getElementById('heap-usage').textContent = heapUsage;
                const heapPercent = Math.min((heapUsage / 1024) * 100, 100); // 1GB 기준
                document.getElementById('heap-progress').style.width = heapPercent + '%';
                
                // GC 횟수
                document.getElementById('gc-count').textContent = data.gc_stats.total_gc_count || 0;
                
                // 타임스탬프
                document.getElementById('timestamp').textContent = 
                    `마지막 업데이트: ${new Date(data.timestamp).toLocaleString('ko-KR')}`;
                
            } catch (error) {
                console.error('메모리 상태 로드 실패:', error);
                document.getElementById('status-message').textContent = '데이터 로드 실패';
            }
        }
        
        async function forceGC() {
            try {
                const response = await fetch('/api/admin/memory/gc', { method: 'POST' });
                if (response.ok) {
                    alert('GC 실행 완료');
                    setTimeout(loadMemoryStatus, 2000);
                } else {
                    alert('GC 실행 실패');
                }
            } catch (error) {
                alert('GC 실행 중 오류 발생');
            }
        }
        
        // 자동 새로고침 (30초마다)
        setInterval(() => {
            if (autoRefresh) {
                loadMemoryStatus();
            }
        }, 30000);
        
        // 초기 로드
        loadMemoryStatus();
    </script>
</body>
</html>
EOF

sudo mv /tmp/memory-dashboard.html /var/www/html/admin/memory/index.html
sudo chown beta74:beta74 /var/www/html/admin/memory/index.html

# JSON 생성 크론잡 추가 (1분마다)
(crontab -l 2>/dev/null | grep -v "memory-status-json"; echo "* * * * * /usr/local/bin/mindgarden-memory-json.sh >/dev/null 2>&1") | crontab -

echo "✅ 메모리 모니터링 대시보드 설정 완료!"
echo ""
echo "🌐 접속 URL: https://m-garden.co.kr/admin/memory/"
echo "🔄 자동 업데이트: 30초마다"
echo "📊 데이터 갱신: 1분마다"
echo ""
echo "📋 기능:"
echo "   - 실시간 메모리 사용량 표시"
echo "   - JVM 힙 메모리 상태"
echo "   - GC 통계"
echo "   - 원클릭 GC 실행"
