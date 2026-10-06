---
name: core-solution-deployment
description: 배포·CI/CD 워크플로 수정 시 적용. GitHub Actions, systemd, 배포 체크리스트·롤백·paths 트리거 준수. 기능 브랜치 단독 빌드 덮어쓰기 금지·번들/JAR 체크리스트.
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

## 배포 덮어쓰기 금지 (기능 소실 방지)

기능 브랜치 단독 빌드로 frontend/JAR를 **통째 교체**하면 이미 반영된 기능이 빠질 수 있다. 아래를 **배포 전 필수**로 적용한다.

### 규칙

1. **동일 스택 + 새 커밋만 배포**: 항상 **지금 운영(또는 개발)과 같은 스택** 위에 새 커밋을 올린 결과만 배포한다. 기능 브랜치 단독 빌드로 정적 번들·JAR를 통째 교체하지 않는다.
2. **개발 = 운영 동일 해시**를 기본으로 한다. 의도적 분기가 아니면 해시가 갈라지지 않게 맞춘다.
3. **큰 기능은 검증된 통합 스택 커밋 하나**만 운영에 올린다. 서로 다른 “최종 빌드”로 연달아 덮지 않는다.
4. **배포마다 prev 롤백 경로**를 남긴다 (이전 번들/JAR 백업·복원 경로).
5. **가드·도메인 한 줄**: `rem=0` SAME_DAY_CARD는 가예약 가드와 분리; **기관연계 ≠ 바우처**.

### 배포 전 번들/JAR 체크리스트

하나라도 없으면 **배포 중단**. 최소 항목:

- [ ] **잔여 SSOT** — `remainingSessions` 우선; `total − sessionSequence` 금지
- [ ] **회차 문구** — `N회기` / 잔여와 구분
- [ ] **승계·이관 이력** — session-transfer-history
- [ ] **가예약 COMPLETED 점유 가드 완화** — OPEN만 차단
- [ ] **기관연계** — `INSTITUTION_LINK` / 배지 / 배정 배타
- [ ] **패키지 만료 임박 모달** (있으면)
- [ ] **슬롯 occupancy**

### 사고 메모 (재발 방지)

institution-link choi 단독 번들 `main.cf6e984e.js`가 운영에 올라가 **#1001·회차 라벨·승계이력을 덮어** 이승민 잔여1·히스토리가 소실된 사례가 있다. → **통합 스택이 아닌 단독 빌드 덮어쓰기 금지.**

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
- [ ] **덮어쓰기 금지**: 대상이 동일 스택+새 커밋인지, 번들/JAR 체크리스트·prev 롤백 경로 확보 여부 확인

## 담당

- **배포 트리거·수동/자동 안내(SSOT)**: **`core-deployer`** 서브에이전트 (`/.cursor/agents/core-deployer.md`). 메인 채팅은 배포 절차를 반복 서술하지 않고 위임한다.
- **구현**: core-coder (워크플로·스크립트 수정).
- **실행·검증**: 필요 시 shell 서브에이전트로 로컬/CI 명령 실행.

이 스킬은 **코드·설정 수정**에만 적용하며, 실제 서버 상태 확인·복구는 **/core-solution-server-status** (shell → core-debugger → core-coder) 흐름을 사용합니다.
