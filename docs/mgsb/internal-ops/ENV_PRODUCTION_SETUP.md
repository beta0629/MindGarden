# Ops Portal 운영 환경 설정 가이드

## 1. 개요
- 대상: Internal Ops Portal (backend-ops + frontend-ops)
- 배포 방법: GitHub Actions → 서버 (systemd) or Docker
- staging 미사용 → 바로 운영 배포 시 안전 장치 필수 (CI 테스트, 하드코딩 검사)
- **다국어 정책**: 모든 코드/마스터 데이터는 영문 + 한글 컬럼을 기본으로 저장하며, 향후 추가 언어 지원을 고려해 확장 가능 구조로 유지

## 2. 공통 체크리스트
- [ ] `config/shell-scripts/check-syntax.sh`
- [ ] `config/shell-scripts/check-hardcode.sh`
- [ ] `frontend-ops/env.production.example` → 실제 값으로 교체
- [ ] `backend-ops/env.production.example` → 실제 값으로 교체
- [ ] GitHub Actions Secrets 업데이트 (`OPS_DB_URL`, `OPS_API_TOKEN`, …)
- [ ] 배포 전 백업 (DB snapshot, 현재 릴리스 태그)

## 3. Backend (Spring Boot)
### 3.1 시스템 환경 변수
```
MG_DB_URL=jdbc:postgresql://<prod-host>:5432/mindgarden_ops_db
MG_DB_USERNAME=<user>
MG_DB_PASSWORD=<password>
MG_JWT_SECRET=<32자리 이상 키>
MG_JWT_ISSUER=https://identity.e-trinity.co.kr/realms/trinity-ops
```

### 3.2 systemd 서비스 예시
`/etc/systemd/system/mindgarden-ops.service`
```
[Unit]
Description=Trinity Ops Portal Backend
After=network.target

[Service]
WorkingDirectory=/opt/mindgarden/backend-ops
EnvironmentFile=/etc/mindgarden/ops-backend.env
ExecStart=/opt/mindgarden/backend-ops/gradlew bootRun --args="--spring.profiles.active=prod"
User=mindgarden
Restart=on-failure
SuccessExitStatus=143

[Install]
WantedBy=multi-user.target
```

### 3.3 로그 & 모니터링
- `/var/log/mindgarden/ops-backend.log` → filebeat or cloud logging 연계
- Spring actuator `/actuator/health`, `/actuator/info`
- 장애 시 Slack/PagerDuty 알림 연동

## 4. Frontend (Next.js)
### 4.1 환경 변수 (`.env.production`)
```
NEXT_PUBLIC_OPS_API_BASE_URL=https://ops-api.e-trinity.co.kr/api/v1
NEXT_PUBLIC_OPS_API_TOKEN=<서버 간 통신용 토큰>
NEXT_PUBLIC_OPS_ACTOR_ID=ops-service-account
NEXT_PUBLIC_OPS_ACTOR_ROLE=HQ_ADMIN
```

### 4.2 빌드 & 배포
```
npm ci
npm run build
```
- 출력물: `.next/` → Docker 이미지 또는 SSR 서버(`next start`)
- PM2/systemd 사용 시:
```
ExecStart=/usr/bin/npm run start
EnvironmentFile=/etc/mindgarden/ops-frontend.env
WorkingDirectory=/opt/mindgarden/frontend-ops
```

## 5. CI/CD 파이프라인
1. `check-syntax.sh`, `check-hardcode.sh`
2. `npm run build` (frontend)
3. `./gradlew build` (backend)
4. 아티팩트 업로드 → 서버 배포
5. 배포 후 Smoke Test (`/health`, 주요 API, 프런트 200 응답)

## 6. 운영 점검 포인트
- DB 연결 (ops 테이블 생성 여부 확인)
- JWT 발급 정상 (OPS API 인증)
- Feature Flag 토글 → UI 반영 확인
- 감사 로그 (`ops_audit_log`) 저장 확인
- 온보딩 승인 workflow end-to-end 검증

## 7. R&R
- DevOps: 배포 자동화, 환경 변수 관리
- Backend: API 모니터링, DB 마이그레이션
- Frontend: 디자인 시스템 적용, 런타임 환경 변수 관리
- 보안: 토큰·비밀 키 회전, 접근 제어

## 8. 운영 후속 조치
- 배포 로그 아카이브
- Release 노트 작성
- 회귀 테스트 결과 기록
- Incident 발생 시 Root Cause 분석 문서화
- 다국어 관련 변경 사항은 코드/DB/문서가 일관되게 업데이트되었는지 확인하고 추후 언어 확장 로드맵에 반영

