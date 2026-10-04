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

- **운영 반영 게이트 — 하드코딩**: 프로덕션·**클라우드 이전** 대비 **하드코딩 검사·CI 스캔·코드 검색에 노출된 항목은 전부 제거·토큰화/env화**한다. 예외는 문서화된 합의 목록만. **호스트·경로·테넌트·도메인 하드코딩 절대 금지** (`AGENTS.md §6`). 상세: `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` **§17**, `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`. 프론트 구현 정리는 **core-coder** + `/core-solution-frontend`·`/core-solution-standardization`.
- **표준 참조**: 워크플로·스크립트 수정 전에 `docs/standards/DEPLOYMENT_STANDARD.md`, `docs/troubleshooting/DEV_DEPLOYMENT_STABILITY_CHECKLIST.md` 를 반드시 참조.
- **paths 일관성**: 백엔드/온보딩 배포 시 `application.yml`, `application-dev.yml` 등 설정 파일 변경이 배포에 반영되도록 paths에 포함되어 있는지 확인.
- **실패 대비**: 헬스체크 실패·기동 실패 시 로그 수집(예: error.log tail), 필요 시 백업 복원·롤백 절차가 워크플로에 포함되어 있는지 확인.
- **환경 분리**: 개발(`release/dev`)·운영(`release/prod`/workflow_dispatch) 트리거와 배포 대상 서버가 표준과 일치하는지 확인.

## 화면·서버 세트 배포 (필수)

같은 기능의 화면(관리자·내담자 UI)과 API는 한 변경 세트다. 한쪽만 수정하고 끝내지 않는다.

- 배포도 한 세트다. 화면 커밋과 서버 커밋을 서로 다른 시점에 운영에 올리지 않는다. **한 커밋(또는 같은 SHA)** 에 화면과 서버가 같이 들어가야 한다.
- 프론트 전용 워크플로만 먼저 성공시키고, 같은 SHA의 백엔드 배포가 그 화면을 다른 빌드로 덮어쓰지 않게 한다. 백엔드 워크플로의 **프론트 업로드 스킵 가드**(같은 SHA의 프론트 운영 배포가 이미 success면 업로드하지 않음)를 깨지 말 것.
- 사용자 트래픽이 받는 슬롯은 세트 배포 중 재시작으로 로그인 이탈을 만들지 않는다. **비활성 슬롯 헬스 통과 후**에만 전환한다.
- 분야·테넌트·호스트 하드코딩 금지. 공통코드·env.

## 표준 프로시저 운영 반영 순서 (프로시저 먼저, BE 나중)

프로시저 시그니처·본문이 바뀐 BE 를 운영에 올릴 때는 **운영 프로시저 배포 → BE 운영 배포** 순서다. BE 가 먼저 나가면 새 JDBC 호출이 옛 프로시저와 맞지 않아 통계·급여·할인 API 가 실패한다.

1. `deploy-procedures-production-mysql.yml` 을 `mode=db-diff`, `confirm` 비움으로 실행(dry-run). DDL 없음. 로그의 차이 목록을 PR·이슈에 남긴다. db-diff 는 **파라미터만** 비교하므로 본문만 바뀐 프로시저(예: `LEAVE` 라벨 수정)는 여기 안 나올 수 있다.
2. 같은 워크플로를 `mode` 비움, `procedures=<이름 쉼표 구분>`, `confirm=CONFIRM` 으로 실행. 지정한 이름만 safe-replace(스테이징 CREATE → SHOW CREATE 백업 → 교체, 실패 시 복원). 결과 표(`프로시저 | 결과 | 사유`)에 failed 가 있으면 BE 배포하지 않는다.
3. 1번 dry-run 을 다시 돌려 차이 0 을 확인한 뒤 BE 운영 배포.

개발(.dev) DB 는 매일 운영 데이터 복사(`prod-to-dev-daily.sh`, 루틴 제외 덤프) 직후 저장소 SQL 44개를 safe-replace 로 다시 깐다. 운영 루틴 본문을 개발로 가져오지 않는다. 서버 쪽 스크립트·SQL 묶음은 `deploy-procedures-dev.yml` 의 `publish-dev-sync-bundle.sh` 가 갱신한다.

## release/dev 머지 전 — 자체 검증

- 판정 기준은 `.cursor/rules/guardrail-preflight.mdc`, 실행 절차는 `.cursor/skills/core-solution-self-verify/SKILL.md`.

## 배포 덮어쓰기 금지 · 동결 게이트 — 필수

- 부분 tip 단독 배포 금지·6항 동결 심볼 게이트: `docs/deployment/DEPLOY_NO_OVERWRITE_GATE.md`
- CI: `.github/workflows/deploy-no-overwrite-gate.yml` (스크립트 `scripts/deployment/check-deploy-no-overwrite-symbols.sh`)

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
- [ ] 배포 브랜치(`release/dev`/`release/prod`) 및 수동 실행(workflow_dispatch) 여부 확인
- [ ] DEPLOYMENT_STANDARD, DEV_DEPLOYMENT_STABILITY_CHECKLIST 와 충돌 없는지 확인
- [ ] **덮어쓰기 금지 · 6항 동결**: `check-deploy-no-overwrite-symbols.sh` 전부 PASS·통합 tip만·prev 롤백 경로·DATAFIX 0

## 담당

- **배포 트리거·수동/자동 안내(SSOT)**: **`core-deployer`** 서브에이전트 (`/.cursor/agents/core-deployer.md`). 메인 채팅은 배포 절차를 반복 서술하지 않고 위임한다.
- **구현**: core-coder (워크플로·스크립트 수정).
- **실행·검증**: 필요 시 shell 서브에이전트로 로컬/CI 명령 실행.

이 스킬은 **코드·설정 수정**에만 적용하며, 실제 서버 상태 확인·복구는 **/core-solution-server-status** (shell → core-debugger → core-coder) 흐름을 사용합니다.
