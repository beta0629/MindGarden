# 배포 표준

**버전**: 1.0.0  
**최종 업데이트**: 2026-03-30  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 배포 및 CI/CD 표준입니다.  
GitHub Actions를 통한 자동 배포 프로세스를 정의합니다.

### 참조 문서
- **[운영 Go-Live 종합 체크리스트](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md)** — 도메인·서브도메인·TLS·보안·전 에이전트 합의 (배포 직전 필수)
- [보안 표준](./SECURITY_STANDARD.md)
- [백엔드 코딩 표준](./BACKEND_CODING_STANDARD.md)
- [프론트엔드 개발 표준](./FRONTEND_DEVELOPMENT_STANDARD.md)

### 구현 위치
- **워크플로우 파일**: `.github/workflows/`
- **배포 스크립트**: `scripts/deployment/`
- **서비스 설정**: `config/systemd/`

---

## 🎯 배포 원칙

### 1. 자동화 우선
```
모든 배포는 GitHub Actions를 통해 자동화
```

**원칙**:
- ✅ GitHub Actions 자동 배포
- ✅ 수동 배포 금지 (GitHub와 싱크 불일치 방지)
- ✅ 환경별 분리 배포 (개발/운영)
- ❌ 수동 파일 업로드 금지

### 2. 환경 분리
```
개발 환경과 운영 환경은 완전히 분리
```

**원칙**:
- ✅ `develop` 브랜치 → 개발 서버
- ✅ `main` 브랜치 → 운영 서버 (수동 실행)
- ✅ 환경 변수 분리
- ✅ 데이터베이스 분리

### 2.5. 개발·운영 역할 동형(미러링)
개발 서버와 운영 서버는 **같은 역할·같은 포트 규칙**(호스트당 동일한 서비스 바인딩)을 따른다. **도메인은 동일 패턴**이며, 운영은 서브도메인에서 **`dev`만 제거**하면 된다(예: `apply.dev.e-trinity.co.kr` ↔ `apply.e-trinity.co.kr`). **보안·자격·DB·Secret·TLS 정책**은 환경별로 달라질 수 있으나, **토폴로지·Nginx 정적 경로·프록시 역할**은 개발과 운영을 맞춘다. 한 호스트에서 서로 다른 프로세스가 같은 포트를 점유하면 충돌하므로, 여기서 말하는 “동일 포트”는 **서버별로 역할이 동일할 때**를 전제로 한다.

**GitHub Actions 대응**(`.github/workflows/`):
- `deploy-trinity-dev.yml` ↔ `deploy-trinity-prod.yml`
- `deploy-ops-dev.yml` ↔ `deploy-ops-prod.yml`
- Ops 백엔드 운영 배포가 필요할 때: `deploy-ops-backend-prod.yml`

### 3. 안전한 배포
```
배포 실패 시 자동 롤백 및 알림
```

**원칙**:
- ✅ 배포 전 백업 생성
- ✅ 헬스체크 필수
- ✅ 롤백 절차 명확화
- ✅ 배포 실패 시 알림

**개발 서버 HTML 백업 보관**: 프론트 개발 배포 워크플로(`deploy-frontend-dev`, `deploy-trinity-dev`, `deploy-ops-dev`)는 배포 전 `/var/www/backups/html-dev`, `html-trinity`, `html-ops`에 만든 `*-backup-*.tar.gz`를 최신 5개만 남기고 이전 파일을 같은 단계에서 제거하여 디스크 사용량이 누적되지 않게 한다.

---

## 🚀 배포 프로세스

### 1. 브랜치 전략

#### 브랜치 구조
```
main (운영)
  └─ develop (개발)
      └─ feature/* (기능 개발)
```

#### 배포 매핑
- **`develop` 브랜치**: 개발 서버 (`beta0629.cafe24.com`)
- **`main` 브랜치**: 운영 서버 (`beta74.cafe24.com`)

### 2. 개발 서버 배포

#### 트리거 조건
```yaml
on:
  push:
    branches: [ develop ]
    paths:
      - 'src/**'           # 백엔드 코드
      - 'frontend/**'      # 프론트엔드 코드
      - 'pom.xml'          # Maven 설정
```

#### 배포 프로세스
1. **코드 체크아웃**
2. **Java 17 + Node.js 18 환경 구성**
3. **백엔드 빌드** (Maven)
4. **프론트엔드 빌드** (React)
5. **개발 서버로 파일 업로드** (SCP)
6. **systemd 서비스 재시작**
7. **헬스체크**

#### 워크플로우 파일
- `deploy-backend-dev.yml` - 백엔드 배포
- `deploy-frontend-dev.yml` - 프론트엔드 배포
- `deploy-ops-dev.yml` - Ops 프론트엔드 배포
- `deploy-trinity-dev.yml` - Trinity 프론트엔드 배포
- `deploy-procedures-dev.yml` - 표준화된 프로시저 배포 (개발)

개발·운영 **역할 동형**에 따른 배포 쌍(상세는 위 `### 2.5`):

| 구분 | 개발 (`develop` push 등) | 운영 (`workflow_dispatch`, `main`) |
|------|--------------------------|--------------------------------------|
| Trinity 프론트 | `deploy-trinity-dev.yml` | `deploy-trinity-prod.yml` |
| Ops 프론트 | `deploy-ops-dev.yml` | `deploy-ops-prod.yml` |
| Ops 백엔드 (필요 시) | — | `deploy-ops-backend-prod.yml` |

### 3. 운영 서버 배포

#### 트리거 조건
```yaml
on:
  workflow_dispatch:  # 수동 실행만 가능
```

**중요**: 운영 배포는 수동 실행만 가능 (실수 방지)

#### 워크플로우 파일 (수동 실행, `main` 기준)
Trinity·Ops 등 **미러링** 대상은 개발과 동일 역할의 운영 워크플로를 사용한다. 예:
- `deploy-trinity-prod.yml` — Trinity 프론트엔드 (쌍: `deploy-trinity-dev.yml`)
- `deploy-ops-prod.yml` — Ops 프론트엔드 (쌍: `deploy-ops-dev.yml`)
- `deploy-ops-backend-prod.yml` — Ops 백엔드 운영 (필요 시)

그 외 MindGarden 본체·프로시저 등은 기존대로 `deploy-production.yml`, `deploy-procedures-prod.yml` 등을 따른다.

#### 배포 프로세스
1. **코드 체크아웃**
2. **Java 17 + Node.js 18 환경 구성**
3. **백엔드 빌드** (Maven, `-DskipTests`)
4. **프론트엔드 빌드** (React)
5. **프로시저 배포** (표준화된 프로시저 변경 시, `deploy-procedures-prod.yml` 수동 실행)
6. **SSH 연결 테스트**
7. **서비스 중지**
8. **백업 생성**
9. **파일 업로드** (JAR, 정적 파일)
10. **서비스 재시작**
11. **헬스체크**
12. **메모리 정리**

---

## 📋 배포 체크리스트

### 배포 전 확인
- [ ] 코드 리뷰 완료
- [ ] 테스트 통과
- [ ] 환경 변수 확인
- [ ] 데이터베이스 마이그레이션 확인
- [ ] **프로시저 배포 확인** (표준화된 프로시저 변경 시)
- [ ] 백업 계획 수립

### 배포 중 확인
- [ ] 빌드 성공 확인
- [ ] 파일 업로드 성공 확인
- [ ] 서비스 재시작 성공 확인
- [ ] 헬스체크 통과 확인

### 배포 후 확인
- [ ] 서비스 정상 동작 확인
- [ ] API 응답 확인
- [ ] 프론트엔드 접근 확인
- [ ] 에러 로그 확인
- [ ] 성능 모니터링

---

## 🔧 환경 설정

### 1. GitHub Secrets 설정

#### 개발 서버
```
DEV_SERVER_HOST=beta0629.cafe24.com
DEV_SERVER_USER=root
DEV_SERVER_SSH_KEY=<SSH Private Key>
```

#### 운영 서버
```
PRODUCTION_HOST=beta74.cafe24.com
PRODUCTION_USER=root
PRODUCTION_SSH_KEY=<SSH Private Key>
```

### 2. 서버 환경 변수

#### 개발 서버 (`/etc/mindgarden/dev.env`)
```bash
# 데이터베이스
DB_HOST=beta0629.cafe24.com
DB_PORT=3306
DB_NAME=core_solution
DB_USERNAME=mindgarden_dev
DB_PASSWORD=MindGardenDev2025!@#

# JWT
JWT_SECRET=<32자 이상의 비밀키>

# 암호화
PERSONAL_DATA_ENCRYPTION_KEY=<암호화 키>
PERSONAL_DATA_ENCRYPTION_IV=<IV>
```

#### 운영 서버 (systemd 서비스 파일)
```ini
[Service]
Environment="DB_HOST=beta74.cafe24.com"
Environment="DB_PORT=3306"
Environment="DB_NAME=core_solution"
Environment="JWT_SECRET=<운영 비밀키>"
```

---

## 🏗️ 빌드 프로세스

### 1. 백엔드 빌드

#### Maven 빌드
```bash
mvn clean package -DskipTests
```

#### 빌드 결과
- `target/consultation-management-system-1.0.0.jar`
- JAR 파일명: `app.jar` (서버에서 사용)

### 2. 프론트엔드 빌드

#### React 빌드
```bash
cd frontend
npm ci
npm run build:ci
```

#### 빌드 결과
- `frontend/build/` 디렉토리
- 정적 파일 (HTML, CSS, JS)

---

## 📤 파일 업로드

### 1. 백엔드 파일

#### 업로드 경로
```
로컬: target/consultation-management-system-1.0.0.jar
서버: /var/www/mindgarden/app.jar (또는 /var/www/mindgarden-dev/app.jar)
```

#### 파일 권한
```bash
chmod +x app.jar
```

### 2. 프론트엔드 파일

#### 업로드 경로
```
로컬: frontend/build/*
서버: /var/www/html/ (운영) 또는 /var/www/html-dev/ (개발)
```

#### 파일 권한
```bash
chown -R www-data:www-data /var/www/html/
chmod -R 755 /var/www/html/
```

---

## 🔄 서비스 관리

### 1. systemd 서비스

#### 서비스 파일 위치
- 개발: `/etc/systemd/system/mindgarden-dev.service`
- 운영: `/etc/systemd/system/mindgarden.service`

#### 서비스 명령어
```bash
# 서비스 시작
sudo systemctl start mindgarden.service

# 서비스 중지
sudo systemctl stop mindgarden.service

# 서비스 재시작
sudo systemctl restart mindgarden.service

# 서비스 상태 확인
sudo systemctl status mindgarden.service

# 서비스 로그 확인
sudo journalctl -u mindgarden.service -f
```

### 2. 서비스 재시작 프로세스

```bash
# 1. 서비스 중지
sudo systemctl stop mindgarden.service

# 2. 안정화 대기 (5초)
sleep 5

# 3. 서비스 시작
sudo systemctl start mindgarden.service

# 4. 시작 대기 (최대 60초)
for i in {1..60}; do
  if curl -f -s http://localhost:8080/actuator/health > /dev/null; then
    echo "✅ 서비스 시작 완료"
    break
  fi
  sleep 1
done
```

---

## 🏥 헬스체크

### 1. 서비스 상태 확인

```bash
# systemd 서비스 상태
sudo systemctl is-active mindgarden.service

# 서비스 로그 확인
sudo journalctl -u mindgarden.service --no-pager -n 50
```

### 2. HTTP 헬스체크

```bash
# Actuator 헬스체크
curl -f http://localhost:8080/actuator/health

# 프론트엔드 확인
curl -f http://localhost/login
```

### 3. 헬스체크 실패 시

```bash
# 서비스 재시작
sudo systemctl restart mindgarden.service

# 로그 확인
sudo journalctl -u mindgarden.service -n 100

# 롤백 (백업 파일로 복구)
cd /var/www/mindgarden
mv app.jar.backup.* app.jar
sudo systemctl restart mindgarden.service
```

---

## 🔙 롤백 절차

### 1. 자동 롤백 (배포 실패 시)

```bash
# 배포 실패 감지
if [ ! -f /var/www/mindgarden/app.jar ]; then
  echo "❌ 배포 실패 - 롤백 시작"
  
  # 최신 백업 파일 찾기
  LATEST_BACKUP=$(ls -t /var/www/mindgarden/app.jar.backup.* | head -1)
  
  # 백업 파일로 복구
  cp $LATEST_BACKUP /var/www/mindgarden/app.jar
  
  # 서비스 재시작
  sudo systemctl restart mindgarden.service
fi
```

### 2. 수동 롤백

```bash
# 1. 서비스 중지
sudo systemctl stop mindgarden.service

# 2. 백업 파일 확인
ls -lt /var/www/mindgarden/app.jar.backup.*

# 3. 백업 파일로 복구
cd /var/www/mindgarden
cp app.jar.backup.20251203_120000 app.jar

# 4. 서비스 재시작
sudo systemctl start mindgarden.service

# 5. 헬스체크
curl -f http://localhost:8080/actuator/health
```

---

## 🚫 금지 사항

### 1. 수동 배포 금지
```bash
# ❌ 금지: 수동 파일 업로드
scp app.jar root@beta74.cafe24.com:/var/www/mindgarden/

# ✅ 권장: GitHub Actions 자동 배포
git push origin main
# GitHub Actions에서 자동 배포
```

### 2. 운영 서버 직접 수정 금지
```bash
# ❌ 금지: 운영 서버에서 직접 코드 수정
vim /var/www/mindgarden/app.jar

# ✅ 권장: 로컬에서 수정 후 배포
# 로컬 수정 → GitHub 커밋 → 자동 배포
```

### 3. 환경 변수 하드코딩 금지
```bash
# ❌ 금지: 코드에 비밀키 하드코딩
JWT_SECRET="MySecretKey123"

# ✅ 권장: 환경 변수 사용
JWT_SECRET=${JWT_SECRET}
```

---

## ✅ 체크리스트

### 배포 전
- [ ] 코드 리뷰 완료
- [ ] 테스트 통과
- [ ] 환경 변수 확인
- [ ] 데이터베이스 마이그레이션 확인
- [ ] 백업 계획 수립

### 배포 중
- [ ] 빌드 성공 확인
- [ ] 파일 업로드 성공 확인
- [ ] 서비스 재시작 성공 확인
- [ ] 헬스체크 통과 확인

### 배포 후
- [ ] 서비스 정상 동작 확인
- [ ] API 응답 확인
- [ ] 프론트엔드 접근 확인
- [ ] 에러 로그 확인
- [ ] 성능 모니터링

---

## 💡 베스트 프랙티스

### 1. 단계별 배포
```yaml
# 1단계: 개발 서버 배포
git push origin develop
# → 자동으로 개발 서버에 배포

# 2단계: 개발 서버 테스트
# → 개발 서버에서 테스트 완료

# 3단계: 운영 서버 배포
git push origin main
# → GitHub Actions에서 수동 실행
```

### 2. 배포 시간 관리
```yaml
# 권장 배포 시간
- 개발 서버: 언제든지 가능
- 운영 서버: 평일 오전 9시 ~ 오후 6시 (비즈니스 시간)
```

### 3. 배포 알림
```yaml
# 배포 성공/실패 알림
- Slack 알림
- 이메일 알림
- 모니터링 대시보드 업데이트
```

---

## 📦 프로시저 배포

### 1. 표준화된 프로시저 배포

#### 배포 파일 생성
표준화된 프로시저는 DELIMITER 없이 재작성된 배포용 파일을 사용합니다.

```bash
# 배포용 파일 생성
bash database/schema/procedures_standardized/create_deployment_files.sh
```

생성된 파일 위치: `database/schema/procedures_standardized/deployment/*_deploy.sql`

#### 개발 환경 배포
```bash
# 자동 배포 (develop 브랜치 push 시)
git push origin develop
# → .github/workflows/deploy-procedures-dev.yml 자동 실행

# 수동 배포
bash scripts/automation/deployment/deploy-standardized-procedures.sh dev
```

#### 운영 환경 배포
```bash
# GitHub Actions에서 수동 실행
# 1. GitHub 웹 인터페이스 접속
# 2. Actions → "📦 표준화된 프로시저 배포 (운영)" 선택
# 3. "Run workflow" 클릭 → main 브랜치 선택 → 실행
```

또는:
```bash
# 로컬에서 실행 (운영 환경 DB 정보 필요)
export PROD_SERVER_HOST=beta74.cafe24.com
export PROD_SERVER_USER=beta74
export PROD_DB_HOST=beta74.cafe24.com
export PROD_DB_USER=mindgarden_prod
export PROD_DB_PASSWORD=<운영 DB 비밀번호>
export PROD_DB_NAME=core_solution

bash scripts/automation/deployment/deploy-standardized-procedures.sh prod
```

### 2. 배포 확인

```bash
# 배포된 프로시저 확인
mysql -h <DB_HOST> -u <DB_USER> -p<DB_PASSWORD> <DB_NAME> -e "
SELECT ROUTINE_NAME, CREATED, LAST_ALTERED 
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = '<DB_NAME>' 
  AND ROUTINE_TYPE = 'PROCEDURE' 
  AND ROUTINE_NAME LIKE '%standardized%'
ORDER BY ROUTINE_NAME;
"
```

### 3. 프로시저 배포 체크리스트

#### 배포 전
- [ ] 표준화된 프로시저 파일 검토 완료
- [ ] 배포용 파일 생성 (`create_deployment_files.sh` 실행)
- [ ] 테스트 환경에서 배포 테스트 완료
- [ ] DB 백업 계획 수립

#### 배포 중
- [ ] 배포용 파일 업로드 성공 확인
- [ ] 프로시저 생성 성공 확인
- [ ] 프로시저 파라미터 확인

#### 배포 후
- [ ] 프로시저 실행 테스트
- [ ] 애플리케이션 연동 테스트
- [ ] 에러 로그 확인

---

## 📞 문의

배포 표준 관련 문의:
- DevOps 팀
- 백엔드 팀
- 아키텍처 팀

**최종 업데이트**: 2026-03-30

