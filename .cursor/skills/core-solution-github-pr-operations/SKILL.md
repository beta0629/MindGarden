---
name: core-solution-github-pr-operations
description: GitHub Pull Request 작성·리뷰·피드백 반영·머지 준비를 MindGarden 규칙에 맞춰 운영하는 스킬. PR 설명 작성, 리뷰 대응, Bugbot/Security Review 활용, 검증 게이트 정리가 필요할 때 사용한다.
---

# Core Solution GitHub PR 운영 스킬

GitHub Pull Request 관련 작업을 할 때 이 스킬을 적용합니다. 이 스킬의 목적은 **PR 본문, 리뷰 대응, 검증 게이트, 서브에이전트 위임 흐름**을 MindGarden 방식으로 일관되게 유지하는 것입니다.

## 적용 시점

- PR 생성 전 변경 요약과 검증 범위를 정리할 때
- PR 설명, 체크리스트, 테스트 계획을 작성할 때
- 리뷰 코멘트·Bugbot·Security Review 결과를 반영할 때
- 머지 전 “무엇이 남았는지”를 정리할 때
- GitHub PR 페이지 또는 `gh` 기반으로 현재 PR 상태를 점검할 때

## 핵심 원칙

- **직접 수정 금지 규칙 우선**: 코드 수정이 필요하면 일반 메인 어시스턴트가 직접 패치하지 않고, 반드시 `core-coder` 또는 지정된 서브에이전트 흐름으로 위임한다.
- **PR은 결과물이 아니라 운영 단위**: 코드 설명만 쓰지 말고, 범위·리스크·검증 결과·잔여 이슈를 함께 정리한다.
- **검증 게이트 필수**: 코드 변경이 포함된 PR은 `core-tester` 검증 계획 또는 실행 결과가 있어야 한다.
- **하드코딩 제로**: PR 범위에서 하드코딩 검사·리뷰·CI에 걸린 항목은 운영 반영 전까지 예외 없이 정리한다.
- **무단 머지/푸시 금지**: push, merge, force-push, 승인 처리 등 쓰기 작업은 사용자 명시 요청 없이는 수행하지 않는다.

## 먼저 확인할 것

- `docs/standards/GIT_WORKFLOW_STANDARD.md`
- `docs/standards/TESTING_STANDARD.md`
- `docs/standards/DEPLOYMENT_STANDARD.md`
- `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`
- `.cursor/rules/mindgarden-subagents.mdc`
- 하드코딩 게이트:
  - `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17
  - `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3
  - `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`

## 운영 절차

### 1. PR 목적과 범위 고정

- 이 PR이 무엇을 해결하는지 한 문장으로 고정한다.
- 변경 범위를 기능/버그/리팩터/문서/배포 중 어디에 가까운지 분류한다.
- 관련 이슈, 회의 문서, 표준 문서가 있으면 PR 설명에 연결한다.

### 2. 변경 성격에 맞춰 담당 배정

- **코드 구현/수정**: `core-coder`
- **원인 분석만 필요**: `core-debugger`
- **테스트 작성·실행·회귀 점검**: `core-tester`
- **배포/Actions/운영 반영 절차**: `core-deployer`
- **여러 역할을 묶는 배치**: `core-planner`
- **문서/체크리스트 정리**: `generalPurpose` + `/core-solution-documentation`

PR 코멘트에 “이 파일 고쳐 달라”가 와도, 수정 자체는 위 매핑을 따른다.

### 3. PR 설명은 아래 정보가 빠지지 않게 작성

- 왜 이 변경이 필요한지
- 사용자가 체감하는 변화 또는 시스템 동작 변화
- 리스크가 큰 부분
- 수행한 검증 또는 아직 못한 검증
- 후속 작업이 있으면 명시

권장 형식:

```markdown
## 요약
- 변경 목적 1~3개

## 주요 변경
- 사용자/운영 관점의 핵심 변화

## 검증
- [x] 실행한 테스트/스모크
- [ ] 미실행 항목과 사유

## 리스크/후속
- 남은 확인 사항
```

### 4. 리뷰 대응

- 리뷰 코멘트는 **사실 확인 → 영향 범위 파악 → 수정 또는 반박 근거 정리** 순으로 처리한다.
- Bugbot 또는 Security Review 결과가 있으면 무시하지 말고 `must-fix`, `follow-up`, `false-positive`로 분류한다.
- 반영 후에는 “무엇을 바꿨는지”보다 **왜 그 방식으로 정리했는지**를 짧게 남긴다.

### 5. 머지 준비 체크

- `core-tester` 검증 또는 동등한 검증 근거가 있는가
- CI 실패가 없는가, 또는 실패 원인이 현재 변경과 무관하다고 설명 가능한가
- 하드코딩 검사/리뷰 이슈가 남아 있지 않은가
- PR 설명과 실제 diff가 어긋나지 않는가
- 배포나 운영 영향이 있으면 `core-deployer` 기준 문구가 정리되었는가

## GitHub 기능 활용 기준

- PR 페이지에서 diff, 댓글, checks, Bugbot 결과를 함께 본다.
- 필요 시 `review-bugbot`, `review-security`를 우선 활용한다.
- `gh`를 사용할 때도 **PR 상태 파악 → 검증 → 수정 위임 → 결과 요약** 순서를 지킨다.
- GitHub 자동화나 Actions 변경이 포함되면 `/core-solution-deployment`도 함께 적용한다.

## 금지 사항

- PR 설명에 테스트하지 않은 내용을 테스트 완료처럼 쓰지 않는다.
- 리뷰 코멘트를 읽지 않고 일괄 “수정 완료”로 처리하지 않는다.
- CI 실패를 무시한 채 머지 가능하다고 판단하지 않는다.
- PR 범위에서 발견한 하드코딩 이슈를 “다음 PR”로 넘기지 않는다.
- 사용자 지시 없이 승인, 머지, 강제 푸시를 하지 않는다.

## 출력 요약 형식

PR 관련 응답은 가능하면 아래 순서를 유지한다.

1. 현재 상태
2. 핵심 리스크 또는 막힌 점
3. 필요한 수정/위임 액션
4. 검증 상태

## 함께 쓰면 좋은 스킬

- `/core-solution-deployment` — Actions, 배포 절차, 운영 체크리스트가 얽힌 PR
- `/core-solution-testing` — 테스트 보강·회귀 검증이 필요한 PR
- `/core-solution-documentation` — PR 설명 외에도 문서 정리가 필요한 경우
