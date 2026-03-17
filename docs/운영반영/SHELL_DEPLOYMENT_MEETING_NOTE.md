# 회의에 제출할 셸(배포) 의견 — 운영 서버 반영 준비

**작성:** 셸(배포·빌드) 담당  
**목적:** 운영 서버 반영 준비 회의 — 배포·빌드 관점 현황 및 할 일 정리

---

## 1. 저장소 내 배포·빌드 관련 자원

### 1.1 배포 스크립트·CI

| 구분 | 경로 | 비고 |
|------|------|------|
| **로컬/수동 배포** | `deployment/deploy-production.sh` | mvn -Pprod, frontend build, scp → 서버 |
| **수동 배포(대안)** | `deployment/manual-deploy.sh`, `manual-deploy-password.sh` | 서버 전송·재시작 |
| **CI/CD** | `.github/workflows/deploy-production.yml` | workflow_dispatch 전용(수동 실행만), 빌드 → SSH/SCP → 서비스 재시작 |
| **프로시저 배포** | `.github/workflows/deploy-procedures-prod.yml`, `deployment/deploy-mapping-update-procedures-prod.sh` 등 | DB 프로시저/권한 반영 |
| **기타** | `deploy-financial-permission.sh`, `deploy-plsql-financial.sh` (루트) | 권한·PL/SQL 등 개별 배포 |

### 1.2 Docker

- **Dockerfile / docker-compose:** 프로젝트 루트·deployment 폴더에는 없음. 컨테이너 기반 배포는 미사용.

### 1.3 환경 변수·설정 예시

| 자원 | 경로 | 비고 |
|------|------|------|
| **운영 env 템플릿** | `deployment/production-env-template.sh` | 서버에서 실행 시 `.env.production` 생성(값은 스크립트 내 하드코딩/플레이스홀더) |
| **Spring 운영 설정** | `deployment/application-production.yml` | DB·Actuator 등 운영용 설정 |
| **DB 초기 스크립트** | `deployment/production-db-setup.sql` | 운영 DB 초기 설정 |
| **루트 .env 예시** | `.env.example` | **없음** (저장소에 미존재) |
| **프론트엔드** | `frontend/.env`, `frontend/.env.local` | 로컬용 존재, 운영용 예시는 deployment 쪽 참고 |

### 1.4 빌드·실행 방식

| 구분 | 명령·방식 |
|------|-----------|
| **백엔드** | `mvn clean package -DskipTests` (CI) / `-Pprod` 추가 가능(로컬 스크립트). packaging: **jar**. 실행: `java -jar app.jar` (systemd: mindgarden.service) |
| **프론트엔드** | `npm run build` (일반), `npm run build:ci` (CI: `CI=false GENERATE_SOURCEMAP=false craco build`) |
| **서버 경로** | deploy-production.sh: 백엔드 `~/mindgarden`, 프론트 `scp` → `/var/www/html`. GitHub Actions: 작업 디렉터리 `/var/www/mindgarden`, 프론트 → `/var/www/html` |

---

## 2. 현재 상태 요약

- **배포 방식:** 수동 배포(`deploy-production.sh` 또는 `manual-deploy.sh`)와 GitHub Actions **수동 워크플로**(`deploy-production.yml`, workflow_dispatch) 병행. push 트리거는 비활성화되어 있어 자동 배포는 없음.
- **빌드 성공 여부:** CI에서 백엔드(mvn), 프론트(npm run build:ci) 순서로 실행되므로, 워크플로 실행 결과로 빌드 성공 여부 확인 가능. 로컬에서는 `mvn clean package -DskipTests` 및 `cd frontend && npm run build` 로 사전 검증 가능.
- **환경 변수·시크릿 문서:** 운영용 항목은 `deployment/production-env-template.sh`·`deploy-production.sh` 내 안내 문구에 나열됨. `.env.example`은 없고, 표준 문서 `../standards/DEPLOYMENT_STANDARD.md`, `deployment/pre-deployment-checklist.md` 및 (있으면) `../guides/deployment/DEPLOYMENT_CHECKLIST.md` 에서 체크리스트·환경 분리 정책 확인 가능. 시크릿은 GitHub Secrets(PRODUCTION_HOST, PRODUCTION_USER, PRODUCTION_SSH_KEY 등) 및 서버 측에 두고, 저장소에는 실제 값 미기록 원칙.

---

## 3. 운영 반영 전 셸 관점에서 할 일

1. **빌드 검증**
   - 로컬 또는 CI와 동일한 조건으로 **백엔드**: `mvn clean package -DskipTests` (필요 시 `-Pprod`) 한 번 실행해 JAR 생성 확인.
   - **프론트엔드**: `cd frontend && npm ci && npm run build:ci` 실행해 `frontend/build` 산출물 생성 확인.
   - 운영 반영 브랜치/커밋 기준으로 위 명령이 성공하는지 반영 직전에 한 번 더 수행 권장.

2. **스크립트·경로 점검**
   - `deploy-production.sh`의 배포 경로(`/home/beta74/mindgarden` 등)와 GitHub Actions 내 작업 디렉터리(`/var/www/mindgarden`)가 실제 운영 서버 구조와 일치하는지 확인. 불일치 시 스크립트 또는 워크플로 중 한쪽을 실제 서버에 맞춰 수정.
   - 백엔드 Maven 프로파일: `-Pprod` 사용 시 `spring.profiles.active`와 `application-production.yml`(profile: production) 대응 관계 확인. 실행 시 systemd/스크립트의 `-Dspring.profiles.active=production` 과 동일한 프로파일이 로드되는지 확인.

3. **배포 체크리스트 항목 제안**
   - [ ] **빌드:** `mvn clean package -DskipTests` 및 `npm run build:ci` 로컬/CI 성공.
   - [ ] **배포 문서:** `deployment/pre-deployment-checklist.md`, `../standards/DEPLOYMENT_STANDARD.md`, `../guides/deployment/DEPLOYMENT_CHECKLIST.md` 에서 항목 확인 후 미비 사항 보완.
   - [ ] **경로·트리거:** deploy-production.sh vs deploy-production.yml 의 서버 경로·대상 디렉터리 일치 여부.
   - [ ] **환경 변수:** 서버에 필요한 env 목록이 production-env-template.sh·체크리스트와 일치하는지, 실제 값은 저장소에 올리지 않고 Secrets/서버만 사용하는지 확인.
   - [ ] **헬스체크:** 배포 후 `/api/actuator/health`, 프론트 정상 응답 확인(워크플로에 이미 포함되어 있으면 실행 결과 확인).
   - [ ] **롤백:** JAR·프론트 백업 경로 및 복구 절차가 워크플로/문서에 명시되어 있는지 확인(실패 시 로그 수집·복원 절차).

---

## 4. 참고

- 실제 배포 실행 및 민감 정보(비밀번호, API 키 등) 출력은 하지 않았습니다.
- 워크플로·스크립트 수정 시 `../../.cursor/skills/core-solution-deployment/SKILL.md` 및 위 참조 문서를 함께 보시면 됩니다.
