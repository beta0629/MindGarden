# 배포 전 요약 (레거시 서버 작업용)

> **2026-02-12 갱신**: 운영 반영 **전체 기준**은 종합 문서로 이관되었습니다.  
> ➜ **[docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md)** (도메인·서브도메인·보안·전 에이전트 회의 항목)

본 파일은 **빠른 참조**와 과거 수동 배포 명령 예시 보존용입니다. **DNS IP·호스트명은 배포 전 실제 인프라와 반드시 대조**하세요.

---

## 필수: Go-Live 문서 점검 순서

1. [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) 전항목
2. [DEPLOYMENT_STANDARD.md](../docs/standards/DEPLOYMENT_STANDARD.md)
3. [PRODUCTION_DEPLOYMENT_READINESS_MEETING.md](../docs/운영반영/PRODUCTION_DEPLOYMENT_READINESS_MEETING.md)

---

## 레거시: 로컬/서버 수동 배포 개요 (예시)

### 로컬에서 배포 스크립트 실행(환경에 존재할 경우)

```bash
./deployment/manual-deploy.sh
```

### 서버 예시(과거 기록 — 계정·경로는 현행화 필요)

```bash
# SSH — 실제 호스트·사용자로 변경
ssh user@your-production-host

# DB 초기화 스크립트는 운영에서 이미 적용 여부 확인 후 실행
# mysql -u root -p < ~/mindgarden/production-db-setup.sql

source ~/mindgarden/.env.production
cd ~/mindgarden
nohup java -jar app.jar > app.log 2>&1 &
```

### 배포 검증(경로는 환경 변수 기준으로 통일 권장)

- [ ] 공개 URL HTTPS 로딩
- [ ] `/api/actuator/health` 또는 운영 정책에 맞는 헬스 경로
- [ ] 로그인·소셜 로그인
- [ ] 관리자 대시보드

---

## 자동 배포 · GitHub Secrets (예시)

운영 호스트·키 등은 **저장소에 커밋 금지**. Secrets에만 보관.

---

## 모니터링·문제 조치

애플리케이션 로그·메모리·OAuth 콜백은 [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) 8절·디버거 의견서·표준 문서를 참고.
