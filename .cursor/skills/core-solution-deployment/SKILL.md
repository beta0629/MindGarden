---
name: core-solution-deployment
description: 배포·CI/CD 워크플로 수정 시 적용. GitHub Actions, systemd, 배포 체크리스트·롤백·paths 트리거 준수. 부분 tip 단독 덮어쓰기 금지·6항 동결 심볼 게이트(IL/가예약/드래그/히스토리/카드/prepaid).
---

# 배포·CI 워크플로 스킬 (Deployment & CI)

`.github/workflows` 수정, systemd·배포 스크립트 변경, 배포 전/후 검증·롤백 절차를 다룰 때 이 스킬을 적용합니다.

## 적용 시점

- GitHub Actions 워크플로 파일 수정 (deploy-*-dev.yml, deploy-production.yml 등)
- 배포 paths·트리거 조건 변경
- 헬스체크·타임아웃·롤백 로직 추가/수정
- systemd 서비스 파일·start 스크립트 수정
- 배포 체크리스트·문서와의 일치 여부 검토

## 원칙

- **운영 반영 게이트 — 하드코딩**: 프로덕션 배포 전 **하드코딩 검사·CI 스캔·코드 검색에 노출된 항목은 전부 제거·토큰화**한다. 예외는 문서화된 합의 목록만. 상세: `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` **§17**, `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`. 프론트 구현 정리는 **core-coder** + `/core-solution-frontend`·`/core-solution-standardization`.
- **표준 참조**: 워크플로·스크립트 수정 전에 `docs/standards/DEPLOYMENT_STANDARD.md`, `docs/troubleshooting/DEV_DEPLOYMENT_STABILITY_CHECKLIST.md` 를 반드시 참조.
- **paths 일관성**: 백엔드/온보딩 배포 시 `application.yml`, `application-dev.yml` 등 설정 파일 변경이 배포에 반영되도록 paths에 포함되어 있는지 확인.
- **실패 대비**: 헬스체크 실패·기동 실패 시 로그 수집(예: error.log tail), 필요 시 백업 복원·롤백 절차가 워크플로에 포함되어 있는지 확인.
- **환경 분리**: 개발(develop)·운영(main/workflow_dispatch) 트리거와 배포 대상 서버가 표준과 일치하는지 확인.

## 배포 덮어쓰기 금지 · 동결 게이트 (6항 전부 PASS) — 필수

기능 브랜치 **부분 tip** 단독 빌드로 frontend/JAR를 통째 교체하면 IL SSOT·가예약 일지·OPEN 점유 드래그·이관 히스토리·카드 일정이 지워질 수 있다. **부분 tip 단독 PROD/SSH/Actions 배포·머지 금지. DATAFIX 0.**

상세: **`docs/deployment/DEPLOY_NO_OVERWRITE_GATE.md`**  
스크립트: **`scripts/deployment/check-deploy-no-overwrite-symbols.sh`** (1항 FAIL → exit 1)  
CI: **`.github/workflows/deploy-no-overwrite-gate.yml`** + `deploy-production.yml` / `deploy-frontend-prod.yml` 체크아웃 직후

### 규칙

1. **동일 스택 + 새 커밋만 배포**. 기능 브랜치 단독 빌드로 정적 번들·JAR 통째 교체 금지.
2. **큰 기능은 검증된 통합 tip 하나**만 올린다. 연달아 다른 “최종 빌드”로 덮지 않는다.
3. **배포마다 prev 롤백 경로**를 남긴다.
4. **금지**: 카드-only tip(`cf9a5138` 계열) 단독 PROD 컷오버; **6항 중 하나라도 없으면 중단·머지 금지**.

### 심볼 게이트 (6항 — 전부 PASS)

| # | 항목 | 필수 심볼 |
|---|------|-----------|
| 1 | IL SSOT / institution-link log | `ConsultationLogExistenceSsot`, `InstitutionLinkConsultationLogController`, `_institutionLinkLog` |
| 2 | 가예약 일지 | `ProvisionalConsultationLogSession` (+ Record/Schedule 참조) |
| 3 | OPEN 점유 드래그 차단 | `hasOpenOccupyingConsultationSchedule` / `provisional_already_has_schedule` |
| 4 | 이관 히스토리 | `SessionTransferHistorySection` SidePeek 마운트 + `session-transfer-history` API |
| 5 | IL 월·완료일 카드 | `CardBillingProgress` / `consultationSchedules` · **mapping 단위** (`client lifetime`/`clientConsultationSchedules` 우선 금지) |
| 6 | prepaid 10만 비표시 | `mappingPackageDisplay` packageName-only · `초기상담료(선납)` 없음 |

```bash
./scripts/deployment/check-deploy-no-overwrite-symbols.sh --source-root .
```

### 권장 tip 순서

6항 PASS 통합 tip만 **한 번** FE `/var/www/mindgarden/frontend` + JAR. 가예약 핫픽스 RUNNING이면 건드리지 않는다.

## 참조 문서

- `docs/standards/DEPLOYMENT_STANDARD.md` — 배포 원칙, 환경 분리, 체크리스트
- `docs/deployment/DEPLOY_NO_OVERWRITE_GATE.md` — **부분 tip 덮어쓰기 금지·6항 동결 게이트**
- `docs/standards/GIT_WORKFLOW_STANDARD.md` — 브랜치·워크플로 전략
- `docs/troubleshooting/DEV_DEPLOYMENT_STABILITY_CHECKLIST.md` — 개발 배포 검증·롤백·점검
- `docs/guides/deployment/DEPLOYMENT_CHECKLIST.md` — 배포 전/중/후 체크리스트

## 작업 체크리스트 (운영 배포 전 — 하드코딩)

- [ ] `check-hardcode`/CI 하드코딩 검사 **0건** 또는 합의된 예외만 문서화
- [ ] `ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17 체크리스트와 정합

## 작업 체크리스트 (워크플로 수정 시)

- [ ] 수정한 워크플로의 paths가 의도한 파일 변경 시에만 트리거되는지 확인
- [ ] 헬스체크 대기 시간·타임아웃이 표준(예: 개발 90초)과 맞는지 확인
- [ ] 실패 시 로그 수집( journalctl, error.log ) 및 필요 시 롤백 절차 포함 여부 확인
- [ ] 배포 브랜치(develop/main) 및 수동 실행(workflow_dispatch) 여부 확인
- [ ] DEPLOYMENT_STANDARD, DEV_DEPLOYMENT_STABILITY_CHECKLIST 와 충돌 없는지 확인
- [ ] **덮어쓰기 금지 · 6항 동결**: `check-deploy-no-overwrite-symbols.sh` 전부 PASS·통합 tip만·prev 롤백 경로·DATAFIX 0

## 담당

- **배포 트리거·수동/자동 안내(SSOT)**: **`core-deployer`** 서브에이전트 (`/.cursor/agents/core-deployer.md`). 메인 채팅은 배포 절차를 반복 서술하지 않고 위임한다.
- **구현**: core-coder (워크플로·스크립트 수정).
- **실행·검증**: 필요 시 shell 서브에이전트로 로컬/CI 명령 실행.

이 스킬은 **코드·설정 수정**에만 적용하며, 실제 서버 상태 확인·복구는 **/core-solution-server-status** (shell → core-debugger → core-coder) 흐름을 사용합니다.
