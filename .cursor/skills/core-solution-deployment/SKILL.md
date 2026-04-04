---
name: core-solution-deployment
description: 배포·CI/CD 워크플로 수정 시 적용. GitHub Actions, systemd, 배포 체크리스트·롤백·paths 트리거 준수.
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

## 참조 문서

- `docs/standards/DEPLOYMENT_STANDARD.md` — 배포 원칙, 환경 분리, 체크리스트
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

## 담당

- **배포 트리거·수동/자동 안내(SSOT)**: **`core-deployer`** 서브에이전트 (`/.cursor/agents/core-deployer.md`). 메인 채팅은 배포 절차를 반복 서술하지 않고 위임한다.
- **구현**: core-coder (워크플로·스크립트 수정).
- **실행·검증**: 필요 시 shell 서브에이전트로 로컬/CI 명령 실행.

이 스킬은 **코드·설정 수정**에만 적용하며, 실제 서버 상태 확인·복구는 **/core-solution-server-status** (shell → core-debugger → core-coder) 흐름을 사용합니다.
