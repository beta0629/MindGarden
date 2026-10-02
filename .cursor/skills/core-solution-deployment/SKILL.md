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

- **운영 반영 게이트 — 하드코딩**: 프로덕션·**클라우드 이전** 대비 **하드코딩 검사·CI 스캔·코드 검색에 노출된 항목은 전부 제거·토큰화/env화**한다. 예외는 문서화된 합의 목록만. **호스트·경로·테넌트·도메인 하드코딩 절대 금지** (`.cursor/rules/mindgarden-no-hardcode-cloud.mdc`). 상세: `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` **§17**, `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`. 프론트 구현 정리는 **core-coder** + `/core-solution-frontend`·`/core-solution-standardization`.
- **표준 참조**: 워크플로·스크립트 수정 전에 `docs/standards/DEPLOYMENT_STANDARD.md`, `docs/troubleshooting/DEV_DEPLOYMENT_STABILITY_CHECKLIST.md` 를 반드시 참조.
- **paths 일관성**: 백엔드/온보딩 배포 시 `application.yml`, `application-dev.yml` 등 설정 파일 변경이 배포에 반영되도록 paths에 포함되어 있는지 확인.
- **실패 대비**: 헬스체크 실패·기동 실패 시 로그 수집(예: error.log tail), 필요 시 백업 복원·롤백 절차가 워크플로에 포함되어 있는지 확인.
- **환경 분리**: 개발(develop)·운영(main/workflow_dispatch) 트리거와 배포 대상 서버가 표준과 일치하는지 확인.

## 화면·서버 세트 배포 (필수)

같은 기능의 화면(관리자·내담자 UI)과 API는 한 변경 세트다. 한쪽만 수정하고 끝내지 않는다.

- 배포도 한 세트다. 화면 커밋과 서버 커밋을 서로 다른 시점에 운영에 올리지 않는다. **한 커밋(또는 같은 SHA)** 에 화면과 서버가 같이 들어가야 한다.
- 프론트 전용 워크플로만 먼저 성공시키고, 같은 SHA의 백엔드 배포가 그 화면을 다른 빌드로 덮어쓰지 않게 한다. 백엔드 워크플로의 **프론트 업로드 스킵 가드**(같은 SHA의 프론트 운영 배포가 이미 success면 업로드하지 않음)를 깨지 말 것.
- 사용자 트래픽이 받는 슬롯은 세트 배포 중 재시작으로 로그인 이탈을 만들지 않는다. **비활성 슬롯 헬스 통과 후**에만 전환한다.
- 분야·테넌트·호스트 하드코딩 금지. 공통코드·env.

## release/dev 머지 전 — 자체 검증 실행 (필수)

- **`release/dev` 머지·배포 시 자체 검증**: 규칙을 읽는 데 그치지 말고 스킬 `.cursor/skills/core-solution-self-verify/SKILL.md`를 **실행**한다. 머지 전 1~4, 6, 7번을 실행해 PR 본문 「## 자체 검증」에 전부 PASS로 기록하고, `.dev` 배포 후 같은 스킬의 5번 스모크를 실행·보고한다. 섹션 누락이나 FAIL이 있으면 머지하지 않고 사용자에게 보고한다. FAIL에는 하드스톱(다른 사용자 데이터, 동작이 증명되지 않은 스모크, 외부 호출 중 커넥션 점유, 돈·권한 경로의 추정 PASS)이 포함되며, 이를 「남은 위험」으로 적고 PASS 처리하지 않는다.
- 5번 스모크의 화면·데이터는 같은 규칙의 필수 확인 2·3이다. FE면 실제 URL 스크린샷(PC 1280px, 모바일 390px, 최소 2장, 공개 페이지는 로그아웃)을 붙인다. Jest·curl 200은 화면 확인이 아니다. 데이터는 .dev 실제 값이며 mock·픽스처로 대체하지 않는다. 멀티테넌트는 대상 테넌트와 다른 테넌트다. 데이터가 섞이거나 MindGarden 내용이 다른 테넌트에 있으면 FAIL이다. 표(항목 / 결과 / 근거)에 적고, 못 본 항목은 미확인이다. 추정으로 통과시키지 않는다.

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
