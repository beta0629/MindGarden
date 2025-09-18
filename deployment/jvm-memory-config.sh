#!/bin/bash

# MindGarden JVM 메모리 최적화 설정
# Cafe24 서버 사양에 맞춘 JVM 옵션

echo "☕ JVM 메모리 최적화 설정 생성 중..."

# 서버 메모리 확인
TOTAL_MEMORY=$(free -m | awk 'NR==2{printf "%.0f", $2}')
echo "📊 총 시스템 메모리: ${TOTAL_MEMORY}MB"

# 메모리 할당 계산 (총 메모리의 60-70%)
if [ $TOTAL_MEMORY -gt 4000 ]; then
    # 4GB 이상
    HEAP_SIZE="2g"
    NEW_SIZE="512m"
    METASPACE_SIZE="256m"
elif [ $TOTAL_MEMORY -gt 2000 ]; then
    # 2-4GB
    HEAP_SIZE="1g"
    NEW_SIZE="256m"
    METASPACE_SIZE="128m"
else
    # 2GB 이하
    HEAP_SIZE="512m"
    NEW_SIZE="128m"
    METASPACE_SIZE="64m"
fi

echo "🎯 권장 JVM 설정:"
echo "   힙 메모리: $HEAP_SIZE"
echo "   Young Generation: $NEW_SIZE"
echo "   Metaspace: $METASPACE_SIZE"

# JVM 옵션 생성
cat > /tmp/jvm-options.txt << EOF
# MindGarden JVM 메모리 최적화 옵션
# 서버 메모리: ${TOTAL_MEMORY}MB에 최적화

# 힙 메모리 설정
-Xms${HEAP_SIZE}
-Xmx${HEAP_SIZE}
-XX:NewSize=${NEW_SIZE}
-XX:MaxNewSize=${NEW_SIZE}

# Metaspace 설정
-XX:MetaspaceSize=${METASPACE_SIZE}
-XX:MaxMetaspaceSize=${METASPACE_SIZE}

# GC 최적화 (G1GC 사용)
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:G1HeapRegionSize=16m
-XX:+G1UseAdaptiveIHOP
-XX:G1MixedGCCountTarget=8

# GC 로깅
-Xlog:gc*:logs/gc.log:time,tags
-XX:+UseStringDeduplication

# 메모리 누수 감지
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/log/mindgarden/heap-dumps/

# 성능 최적화
-XX:+OptimizeStringConcat
-XX:+UseCompressedOops
-XX:+UseCompressedClassPointers

# 시스템 최적화
-Djava.awt.headless=true
-Dfile.encoding=UTF-8
-Duser.timezone=Asia/Seoul

# Spring Boot 최적화
-Dspring.backgroundpreinitializer.ignore=true
-Dspring.jmx.enabled=false

# 네트워크 최적화
-Djava.net.preferIPv4Stack=true
-Dsun.net.useExclusiveBind=false
EOF

echo ""
echo "📝 생성된 JVM 옵션을 확인하세요:"
cat /tmp/jvm-options.txt

echo ""
echo "🔧 Systemd 서비스에 적용 방법:"
echo "   /etc/systemd/system/mindgarden.service 파일에서"
echo "   Environment=JAVA_OPTS=\"$(tr '\n' ' ' < /tmp/jvm-options.txt)\""

# 시스템 서비스 파일 업데이트
cat > /tmp/mindgarden.service << EOF
[Unit]
Description=MindGarden Consultation System
After=network.target mysql.service

[Service]
Type=simple
User=beta74
Group=beta74
WorkingDirectory=/home/beta74/mindgarden
ExecStart=/usr/bin/java $(tr '\n' ' ' < /tmp/jvm-options.txt) -jar app.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# 환경변수 파일 로드
EnvironmentFile=/home/beta74/mindgarden/.env

# 리소스 제한
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

echo ""
echo "📄 업데이트된 시스템 서비스 파일:"
cat /tmp/mindgarden.service

echo ""
echo "✅ JVM 메모리 설정 완료!"
echo ""
echo "📋 적용 방법:"
echo "1. sudo cp /tmp/mindgarden.service /etc/systemd/system/"
echo "2. sudo systemctl daemon-reload"
echo "3. sudo systemctl restart mindgarden"
echo "4. ./memory-management.sh check  # 메모리 확인"
