# 운영 환경 배포 가이드

## 🚀 운영 환경 배포 체크리스트

### 1. 환경 변수 설정
운영 서버에서 다음 환경 변수를 설정해야 합니다:

```bash
# 데이터베이스 설정
export DB_URL="jdbc:mysql://your-db-host:3306/mindgarden_consultation?useSSL=true&serverTimezone=Asia/Seoul"
export DB_USERNAME="your-db-username"
export DB_PASSWORD="your-secure-password"

# JWT 설정
export JWT_SECRET="your-super-secure-jwt-secret-key-32-chars-minimum"

# 암호화 설정
export PERSONAL_DATA_ENCRYPTION_KEY="your-32-character-encryption-key"
export PERSONAL_DATA_IV="your-16-character-iv"

# OAuth2 설정
export KAKAO_CLIENT_ID="your-kakao-client-id"
export KAKAO_CLIENT_SECRET="your-kakao-client-secret"
export NAVER_CLIENT_ID="your-naver-client-id"
export NAVER_CLIENT_SECRET="your-naver-client-secret"

# 도메인 설정
export BASE_URL="https://yourdomain.com"
export ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"

# 서버 설정
export SERVER_PORT="8080"
```

### 2. 프로파일 설정
운영 환경에서는 `prod` 프로파일을 사용합니다:

```bash
# JAR 실행 시
java -jar -Dspring.profiles.active=prod consultation-management-system-1.0.0.jar

# 또는 환경 변수로
export SPRING_PROFILES_ACTIVE=prod
java -jar consultation-management-system-1.0.0.jar
```

### 3. 보안 설정 확인

#### 3.1 CORS 설정
- 운영 환경에서는 `ALLOWED_ORIGINS` 환경 변수로 허용 도메인 설정
- 개발 환경과 달리 localhost는 허용되지 않음

#### 3.2 인증 설정
- 운영 환경에서는 모든 API에 인증 필요
- 공개 API: `/api/auth/**`, `/oauth2/**`, `/error`, `/actuator/health`, `/actuator/info`

#### 3.3 세션 설정
- 쿠키: `http-only=true`, `secure=true`, `same-site=strict`
- JWT 토큰 만료 시간: 1시간 (개발: 24시간)

### 4. 데이터베이스 설정

#### 4.1 운영 데이터베이스 준비
```sql
-- 데이터베이스 생성
CREATE DATABASE mindgarden_consultation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 및 권한 부여
CREATE USER 'mindgarden'@'%' IDENTIFIED BY 'your-secure-password';
GRANT ALL PRIVILEGES ON mindgarden_consultation.* TO 'mindgarden'@'%';
FLUSH PRIVILEGES;
```

#### 4.2 스키마 초기화
```bash
# JPA가 자동으로 스키마 생성 (ddl-auto: validate)
# 또는 수동으로 스키마 생성 후 validate 모드 사용
```

### 5. 로그 설정

#### 5.1 로그 디렉토리 생성
```bash
sudo mkdir -p /var/log/mindgarden
sudo chown your-user:your-group /var/log/mindgarden
```

#### 5.2 로그 로테이션 설정
```bash
# /etc/logrotate.d/mindgarden
/var/log/mindgarden/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 your-user your-group
}
```

### 6. 서비스 등록 (systemd)

#### 6.1 서비스 파일 생성
```bash
# /etc/systemd/system/mindgarden.service
[Unit]
Description=MindGarden Consultation Management System
After=network.target

[Service]
Type=simple
User=your-user
Group=your-group
WorkingDirectory=/opt/mindgarden
ExecStart=/usr/bin/java -jar -Dspring.profiles.active=prod /opt/mindgarden/consultation-management-system-1.0.0.jar
Restart=always
RestartSec=10
Environment=SPRING_PROFILES_ACTIVE=prod
Environment=DB_URL=jdbc:mysql://your-db-host:3306/mindgarden_consultation
Environment=DB_USERNAME=your-db-username
Environment=DB_PASSWORD=your-secure-password
Environment=JWT_SECRET=your-super-secure-jwt-secret-key
Environment=PERSONAL_DATA_ENCRYPTION_KEY=your-32-character-encryption-key
Environment=PERSONAL_DATA_IV=your-16-character-iv
Environment=BASE_URL=https://yourdomain.com
Environment=ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

[Install]
WantedBy=multi-user.target
```

#### 6.2 서비스 시작
```bash
sudo systemctl daemon-reload
sudo systemctl enable mindgarden
sudo systemctl start mindgarden
sudo systemctl status mindgarden
```

### 7. Nginx 설정 (선택사항)

#### 7.1 Nginx 설정 파일
```nginx
# /etc/nginx/sites-available/mindgarden
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # HTTPS로 리다이렉트
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL 인증서 설정
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # SSL 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # 프록시 설정
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket 지원
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 8. 모니터링 설정

#### 8.1 Health Check
```bash
# 애플리케이션 상태 확인
curl http://localhost:8080/actuator/health

# 상세 정보 확인 (인증 필요)
curl -H "Authorization: Bearer your-jwt-token" http://localhost:8080/actuator/info
```

#### 8.2 로그 모니터링
```bash
# 실시간 로그 확인
sudo journalctl -u mindgarden -f

# 에러 로그만 확인
sudo journalctl -u mindgarden --since "1 hour ago" | grep ERROR
```

### 9. 백업 설정

#### 9.1 데이터베이스 백업
```bash
#!/bin/bash
# /opt/mindgarden/backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/mindgarden/backups"
DB_NAME="mindgarden_consultation"

mkdir -p $BACKUP_DIR
mysqldump -u your-db-username -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/mindgarden_$DATE.sql
gzip $BACKUP_DIR/mindgarden_$DATE.sql

# 30일 이상 된 백업 삭제
find $BACKUP_DIR -name "mindgarden_*.sql.gz" -mtime +30 -delete
```

#### 9.2 자동 백업 설정
```bash
# crontab에 추가
0 2 * * * /opt/mindgarden/backup-db.sh
```

### 10. 트러블슈팅

#### 10.1 일반적인 문제들
1. **CORS 오류**: `ALLOWED_ORIGINS` 환경 변수 확인
2. **데이터베이스 연결 오류**: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` 확인
3. **JWT 토큰 오류**: `JWT_SECRET` 환경 변수 확인
4. **암호화 오류**: `PERSONAL_DATA_ENCRYPTION_KEY`, `PERSONAL_DATA_IV` 확인

#### 10.2 로그 확인
```bash
# 애플리케이션 로그
tail -f /var/log/mindgarden/mindgarden.log

# 시스템 로그
sudo journalctl -u mindgarden --since "1 hour ago"
```

#### 10.3 성능 모니터링
```bash
# 메모리 사용량 확인
ps aux | grep java

# 데이터베이스 연결 확인
mysql -u your-db-username -p$DB_PASSWORD -e "SHOW PROCESSLIST;"
```

## 🔒 보안 체크리스트

- [ ] 환경 변수로 모든 민감한 정보 설정
- [ ] 운영 데이터베이스에 SSL 연결 사용
- [ ] JWT 시크릿 키를 충분히 복잡하게 설정
- [ ] CORS 설정에서 허용 도메인 제한
- [ ] 쿠키 보안 설정 적용
- [ ] 로그 파일 권한 설정
- [ ] 방화벽 설정 (필요한 포트만 개방)
- [ ] 정기적인 보안 업데이트

## 📊 성능 최적화

- [ ] JPA 캐시 활성화
- [ ] 데이터베이스 연결 풀 최적화
- [ ] 로그 레벨 조정 (운영용)
- [ ] 정적 파일 캐싱 설정
- [ ] Gzip 압축 활성화
