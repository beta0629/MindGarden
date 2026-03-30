# 개발 서버 502 오류 해결 가이드

## 문제 증상
- `https://dev.core-solution.co.kr/api/v1/*` 엔드포인트에서 502 Bad Gateway 오류 발생
- 프론트엔드에서 API 호출 실패

## 원인
- CoreSolution 백엔드 서비스(`mindgarden-dev.service`)가 실행되지 않음
- Nginx는 `127.0.0.1:8080`으로 프록시하지만, 백엔드 서버가 응답하지 않음

## 해결 방법

### 1. 서비스 상태 확인
개발 서버에 SSH로 접속한 후 다음 명령어 실행:

```bash
# 서비스 상태 확인
sudo systemctl status mindgarden-dev.service

# 서비스가 실행 중인지 확인
sudo systemctl is-active mindgarden-dev.service

# 서비스 로그 확인 (최근 100줄)
sudo journalctl -u mindgarden-dev.service -n 100 --no-pager

# 에러 로그 확인
sudo tail -100 /var/log/mindgarden/dev-error.log
```

### 2. 서비스 재시작
서비스가 중지되어 있거나 오류가 있는 경우:

```bash
# 서비스 재시작
sudo systemctl restart mindgarden-dev.service

# 서비스 상태 재확인
sudo systemctl status mindgarden-dev.service

# 헬스체크 확인 (서비스 시작 후 약 30초 대기)
curl -f http://localhost:8080/actuator/health
```

### 3. 서비스가 시작되지 않는 경우

#### 3.1 JAR 파일 확인
```bash
# JAR 파일 존재 확인
ls -lh /var/www/mindgarden-dev/app.jar

# JAR 파일이 없거나 오래된 경우, 최신 빌드 확인 필요
```

#### 3.2 시작 스크립트 확인
```bash
# 시작 스크립트 확인
cat /opt/mindgarden/start.sh

# 환경 변수 파일 확인
cat /etc/mindgarden/dev.env
```

#### 3.3 포트 충돌 확인
```bash
# 8080 포트 사용 중인 프로세스 확인
sudo lsof -i :8080
# 또는
sudo netstat -tlnp | grep 8080

# 포트를 사용하는 프로세스 종료 (필요한 경우)
sudo kill -9 <PID>
```

#### 3.4 데이터베이스 연결 확인
```bash
# 데이터베이스 연결 테스트
mysql -h beta0629.cafe24.com -u mindgarden_dev -pMindGardenDev2025!@# core_solution -e "SELECT 1;"
```

### 4. GitHub Actions를 통한 재배포
서비스 파일이 손상되었거나 JAR 파일이 없는 경우:

1. GitHub Actions에서 `deploy-backend-dev.yml` 워크플로우 수동 실행
2. 또는 `develop` 브랜치에 빈 커밋 푸시하여 자동 배포 트리거

### 5. 수동 배포 (긴급한 경우)

```bash
# 서비스 중지
sudo systemctl stop mindgarden-dev.service

# JAR 파일 확인 및 백업
cd /var/www/mindgarden-dev
ls -lh app.jar
cp app.jar app.jar.backup.$(date +%Y%m%d_%H%M%S)

# 최신 JAR 파일 업로드 (로컬에서)
# scp target/consultation-management-system-1.0.0.jar user@dev-server:/var/www/mindgarden-dev/app.jar

# 권한 설정
sudo chmod +x app.jar

# 서비스 시작
sudo systemctl start mindgarden-dev.service

# 상태 확인
sudo systemctl status mindgarden-dev.service
```

## 예방 조치

### 서비스 자동 재시작 확인
`mindgarden-dev.service`는 `Restart=always`로 설정되어 있어 자동 재시작되어야 합니다. 
하지만 계속 실패하는 경우 로그를 확인하여 근본 원인을 해결해야 합니다.

### 모니터링 설정
```bash
# 서비스 상태 모니터링 (선택사항)
watch -n 5 'sudo systemctl status mindgarden-dev.service --no-pager | head -15'
```

## 관련 파일
- Systemd 서비스: `/etc/systemd/system/mindgarden-dev.service`
- 시작 스크립트: `/opt/mindgarden/start.sh`
- JAR 파일: `/var/www/mindgarden-dev/app.jar`
- 로그 파일: `/var/log/mindgarden/dev.log`, `/var/log/mindgarden/dev-error.log`
- 환경 변수: `/etc/mindgarden/dev.env`
- Nginx 설정: `/etc/nginx/sites-available/core-solution-dev.conf`

## 추가 도움말
문제가 지속되는 경우:
1. 서비스 로그 전체 확인: `sudo journalctl -u mindgarden-dev.service -n 500`
2. Nginx 에러 로그 확인: `sudo tail -100 /var/log/nginx/dev.core-solution.co.kr.error.log`
3. 시스템 리소스 확인: `free -h`, `df -h`, `top`

