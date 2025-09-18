# 🚀 MindGarden 운영 배포 체크리스트

## ✅ 배포 전 확인사항

### 1. **로컬 환경 준비**
- [ ] 모든 기능 테스트 완료
- [ ] 빌드 오류 없음 확인
- [ ] 데이터베이스 스키마 최신 상태
- [ ] OAuth2 콜백 URL 등록 완료

### 2. **서버 환경 준비**
- [ ] SSH 접속 가능 확인
- [ ] MySQL 서비스 실행 중
- [ ] 도메인 DNS 설정 완료 (m-garden.co.kr → 211.37.179.204)
- [ ] 방화벽 포트 8080 오픈

### 3. **배포 파일 준비**
- [ ] JAR 파일 빌드 완료
- [ ] 프론트엔드 빌드 완료
- [ ] 설정 파일 운영용으로 수정
- [ ] 관리 스크립트 준비

## 🔧 수동 배포 단계

### 1단계: 로컬에서 배포 실행
```bash
./deployment/manual-deploy.sh
```

### 2단계: 서버에서 수동 작업
```bash
# SSH 접속
ssh beta74@beta74.cafe24.com

# 데이터베이스 설정
mysql -u root -p < ~/mindgarden/production-db-setup.sql

# 환경변수 로드
source ~/mindgarden/.env.production

# 애플리케이션 시작
cd ~/mindgarden
nohup java -jar app.jar > app.log 2>&1 &

# 상태 확인
tail -f app.log  # Ctrl+C로 종료
./oauth2-callback-test.sh
./memory-management.sh check
```

### 3단계: 배포 검증
- [ ] http://m-garden.co.kr 접속 확인
- [ ] http://m-garden.co.kr/api/actuator/health 상태 UP
- [ ] 로그인 기능 테스트
- [ ] 카카오/네이버 소셜 로그인 테스트
- [ ] 관리자 대시보드 접속 확인

## 🔄 향후 자동 배포 설정

### GitHub Secrets 설정 필요
```
PRODUCTION_HOST=beta74.cafe24.com
PRODUCTION_USER=beta74
PRODUCTION_SSH_KEY=<SSH 개인키>
```

### 자동 배포 트리거
- `git push origin main` 시 자동 배포
- 커밋 메시지에 `[deploy]` 포함 시에만 배포
- 또는 GitHub Actions에서 수동 실행

### 배포 파이프라인
1. **코드 체크아웃**
2. **빌드 (백엔드 + 프론트엔드)**
3. **서버 파일 업로드**
4. **애플리케이션 재시작**
5. **배포 검증**
6. **롤백 준비**

## 📊 모니터링 설정

### 메모리 관리
- 자동 메모리 모니터링 (5분마다)
- 메모리 임계치 초과 시 자동 조치
- 웹 대시보드: http://m-garden.co.kr/admin/memory/

### 로그 관리
- 애플리케이션 로그: `/var/log/mindgarden/application.log`
- 메모리 로그: `/var/log/mindgarden/memory-auto.log`
- 일일 리포트: `/var/log/mindgarden/daily-memory-report-*.log`

### 헬스체크
- API 상태: http://m-garden.co.kr/api/actuator/health
- 메트릭: http://m-garden.co.kr/api/actuator/metrics

## 🆘 문제 해결

### 애플리케이션 시작 실패
```bash
# 로그 확인
tail -100 ~/mindgarden/app.log

# 포트 사용 확인
sudo netstat -tlnp | grep :8080

# 프로세스 확인
ps aux | grep java
```

### 메모리 부족
```bash
# 메모리 상태 확인
./memory-management.sh check

# 메모리 최적화
./memory-management.sh optimize

# 강제 재시작
./memory-management.sh restart
```

### OAuth2 로그인 실패
```bash
# 콜백 URL 테스트
./oauth2-callback-test.sh

# 로그 확인
grep -i oauth ~/mindgarden/app.log
```
