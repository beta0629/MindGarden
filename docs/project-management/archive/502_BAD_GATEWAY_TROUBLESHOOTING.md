# 502 Bad Gateway 오류 해결 가이드

**작성일**: 2025-11-21  
**목적**: 개발 서버 502 Bad Gateway 오류 진단 및 해결

## 1. 오류 원인

502 Bad Gateway 오류는 Nginx가 백엔드 서버(포트 8080)에 연결하지 못할 때 발생합니다.

### 주요 원인:
1. **백엔드 서버가 실행되지 않음** (가장 흔한 원인)
2. **Nginx 프록시 설정 오류** (`localhost:8080` → IPv6/IPv4 해석 문제)
3. **포트 충돌** (다른 프로세스가 8080 포트 사용)
4. **방화벽 문제** (포트 차단)
5. **백엔드 서버 응답 지연** (타임아웃)

## 2. 빠른 진단 방법

### 2.1 백엔드 서버 상태 확인

```bash
# 개발 서버에 SSH 접속
ssh root@114.202.247.246

# 백엔드 서비스 상태 확인
sudo systemctl status mindgarden-dev.service

# 백엔드 서비스 로그 확인
sudo journalctl -u mindgarden-dev.service -n 50

# 포트 8080 리스닝 확인
sudo netstat -tlnp | grep 8080
# 또는
sudo ss -tlnp | grep 8080
```

### 2.2 백엔드 서버 직접 접속 테스트

```bash
# 로컬에서 직접 접속 테스트
curl http://127.0.0.1:8080/actuator/health

# 또는
curl http://localhost:8080/actuator/health
```

**예상 결과:**
- ✅ 정상: `{"status":"UP"}` 또는 JSON 응답
- ❌ 오류: `Connection refused` 또는 타임아웃

### 2.3 Nginx 에러 로그 확인

```bash
# 특정 도메인 에러 로그 확인
sudo tail -f /var/log/nginx/ops.dev.e-trinity.co.kr.error.log

# 모든 Nginx 에러 로그 확인
sudo tail -f /var/log/nginx/error.log
```

**주요 에러 메시지:**
- `connect() failed (111: Connection refused)` → 백엔드 서버가 실행되지 않음
- `connect() failed (113: No route to host)` → 방화벽 문제
- `upstream timed out` → 백엔드 서버 응답 지연

## 3. 해결 방법

### 3.1 백엔드 서버 재시작

```bash
# 서비스 재시작
sudo systemctl restart mindgarden-dev.service

# 서비스 상태 확인
sudo systemctl status mindgarden-dev.service

# 로그 확인
sudo journalctl -u mindgarden-dev.service -n 100
```

### 3.2 Nginx 설정 수정

**문제**: `localhost:8080`은 IPv6/IPv4 해석 문제가 발생할 수 있습니다.

**해결**: `127.0.0.1:8080`으로 변경 (IPv4 명시)

```nginx
# 수정 전
proxy_pass http://localhost:8080;

# 수정 후
proxy_pass http://127.0.0.1:8080;
```

**설정 파일 위치**: `/etc/nginx/sites-available/core-solution-dev`

**적용 방법:**
```bash
# 1. 설정 파일 수정
sudo nano /etc/nginx/sites-available/core-solution-dev

# 2. 설정 테스트
sudo nginx -t

# 3. Nginx 재시작
sudo systemctl reload nginx
```

### 3.3 포트 충돌 확인 및 해결

```bash
# 포트 8080 사용 중인 프로세스 확인
sudo lsof -i :8080
# 또는
sudo fuser 8080/tcp

# 프로세스 종료 (필요시)
sudo kill -9 <PID>
```

### 3.4 방화벽 확인

```bash
# UFW 방화벽 상태 확인
sudo ufw status

# 포트 8080 허용 (필요시)
sudo ufw allow 8080/tcp
```

## 4. 도메인별 설정 확인

### 4.1 ops.dev.e-trinity.co.kr (운영 포털)

**설정 요구사항:**
- 모든 요청을 백엔드로 프록시
- 프론트엔드 파일 서빙 불필요 (Next.js 서버 또는 별도 서버 사용 가능)

**현재 설정:**
```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $server_name;
    
    # 타임아웃 설정
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # WebSocket 지원
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # 버퍼링 비활성화
    proxy_buffering off;
    proxy_request_buffering off;
}
```

### 4.2 dev.core-solution.co.kr (메인 개발 서버)

**설정 요구사항:**
- 프론트엔드 파일 서빙 (`/var/www/html-dev`)
- API 요청은 백엔드로 프록시 (`/api/`)

**현재 설정:**
```nginx
# 프론트엔드 파일 서빙
location / {
    root /var/www/html-dev;
    index index.html;
    try_files $uri $uri/ /index.html;
}

# 백엔드 API 프록시
location /api/ {
    proxy_pass http://127.0.0.1:8080;
    # ... 프록시 설정
}
```

## 5. 체크리스트

### 5.1 백엔드 서버 확인
- [ ] `systemctl status mindgarden-dev.service` → `active (running)`
- [ ] `curl http://127.0.0.1:8080/actuator/health` → 정상 응답
- [ ] `netstat -tlnp | grep 8080` → 포트 리스닝 확인

### 5.2 Nginx 설정 확인
- [ ] `nginx -t` → 설정 테스트 통과
- [ ] `proxy_pass http://127.0.0.1:8080` (IPv4 명시)
- [ ] 모든 프록시 헤더 설정 확인

### 5.3 네트워크 확인
- [ ] 포트 8080 충돌 없음
- [ ] 방화벽 설정 확인
- [ ] Nginx 에러 로그 확인

## 6. 문제 해결 후 검증

```bash
# 1. 백엔드 서버 직접 접속 테스트
curl http://127.0.0.1:8080/actuator/health

# 2. Nginx를 통한 접속 테스트
curl -I https://ops.dev.e-trinity.co.kr

# 3. 브라우저에서 접속 테스트
# https://ops.dev.e-trinity.co.kr
```

## 7. 참조 문서

- `docs/mgsb/NGINX_FRONTEND_BACKEND_CONFIG.md` - Nginx 프론트엔드+백엔드 통합 설정 가이드
- `docs/mgsb/DEV_SERVER_SETUP_GUIDE.md` - 개발 서버 세팅 가이드
- `config/nginx/core-solution-dev.conf` - 개발 서버 Nginx 설정 파일

## 8. 추가 지원

문제가 지속되면 다음 정보를 수집하여 확인하세요:

```bash
# 백엔드 서비스 상태
sudo systemctl status mindgarden-dev.service

# 백엔드 서비스 로그 (최근 100줄)
sudo journalctl -u mindgarden-dev.service -n 100

# Nginx 에러 로그
sudo tail -50 /var/log/nginx/ops.dev.e-trinity.co.kr.error.log

# 포트 상태
sudo netstat -tlnp | grep 8080

# Nginx 설정 테스트
sudo nginx -t
```

