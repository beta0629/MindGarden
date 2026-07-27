---
name: core-solution-github-ci-triage
description: GitHub Actions, PR checks, 배포 전 검증 실패를 원인별로 분류하고 MindGarden 서브에이전트 흐름으로 조사·수정·재검증하는 스킬. CI 실패, checks 빨간불, 배포 워크플로 오류 대응에 사용한다.
---

# Core Solution GitHub CI Triage 스킬

GitHub Actions 또는 PR checks가 실패했을 때 이 스킬을 적용합니다. 목적은 실패 로그를 읽고 끝내는 것이 아니라, **원인 분류 → 담당 위임 → 재검증 기준 정리**까지 일관되게 수행하는 것입니다.

## 적용 시점

- PR checks 중 하나 이상이 실패했을 때
- GitHub Actions 로그 해석이 필요할 때
- 배포 워크플로, 테스트, lint, build, hardcode gate가 빨간불일 때
- “이 실패가 코드 문제인지, 환경 문제인지, 워크플로 문제인지” 빠르게 가려야 할 때

## 핵심 원칙

- **증거 우선**: 실패 job 이름, 단계(step), 첫 에러 라인, 관련 파일/워크플로를 먼저 확보한다.
- **원인 분류 우선**: 구현 버그, 테스트 기대값 불일치, 환경 변수/시크릿, 워크플로 paths, 인프라 일시 장애를 구분한다.
- **수정은 담당자에게 위임**: 조사와 정리는 할 수 있지만, 실제 코드 수정은 `core-coder` 흐름을 따른다.
- **재검증 조건 명시**: 무엇이 통과되면 닫을 수 있는지 분명히 남긴다.
- **하드코딩 실패는 우회 금지**: 관련 스캔은 운영 반영 게이트이므로 같은 범위에서 정리한다.

## 먼저 확인할 것

- `.github/workflows/` 관련 파일
- `docs/standards/DEPLOYMENT_STANDARD.md`
- `docs/standards/TESTING_STANDARD.md`
- `docs/troubleshooting/DEV_DEPLOYMENT_STABILITY_CHECKLIST.md`
- `.cursor/rules/mindgarden-subagents.mdc`
- `/core-solution-deployment`
- `/core-solution-testing`
- 하드코딩 게이트 문서:
  - `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17
  - `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3
  - `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`

## 실패 분류 기준

### 1. 구현/로직 실패

- 단위/통합 테스트 assertion 실패
- 타입 오류, 빌드 오류, import 오류
- lint 규칙 위반

담당:
- 수정: `core-coder`
- 검증: `core-tester`

### 2. 테스트/시드/환경 불일치

- 테스트 데이터 변경으로 기대값이 깨진 경우
- 환경 변수 누락
- CI에서만 재현되는 경로/OS 차이

담당:
- 원인 정리: `core-debugger` 또는 조사 담당
- 수정: `core-coder`
- 검증: `core-tester`

### 3. 배포/워크플로 설정 실패

- Actions paths 누락
- 잘못된 branch trigger
- SSH, secrets, systemd, health check 설정 문제

담당:
- 워크플로 수정: `core-coder` + `/core-solution-deployment`
- 운영 절차/체크리스트 확인: `core-deployer`

### 4. 하드코딩/품질 게이트 실패

- `check-hardcode`
- 디자인 토큰/상수화 규칙 위반
- 리뷰에서 “하드코딩 발견”으로 분류된 항목

담당:
- 수정: `core-coder`
- 필요 시 토큰 스펙: `core-designer`
- 재검증: `core-tester`

## 조사 절차

### 1. 실패 지점 고정

- 어느 workflow/job/step 인지 기록
- 실패 최초 시점의 에러 메시지를 짧게 요약
- 관련 파일, 명령, 환경을 붙인다

권장 출력:

```markdown
- Workflow:
- Job:
- Step:
- First error:
- Suspected files:
```

### 2. 영향 범위 분리

- 이 PR 변경으로 인한 직접 실패인지
- 기존 flaky/infrastructure 이슈인지
- 다른 브랜치에서도 재현될 가능성이 높은지

### 3. 담당 위임

- 코드 수정이면 `core-coder`
- 원인 분석만 더 필요하면 `core-debugger`
- 재현·회귀 점검은 `core-tester`
- 배포/시크릿/운영 반영은 `core-deployer`
- 복합 배치면 `core-planner`

### 4. 재검증 기준 정리

- 어떤 명령/체크가 통과되면 닫는지 명시
- 추가 확인이 필요한 수동 스모크가 있으면 남긴다

## 권장 응답 형식

1. **실패 요약**: 어떤 check가 왜 실패했는지
2. **원인 분류**: 코드/테스트/워크플로/환경/하드코딩 중 어디인지
3. **즉시 액션**: 누구에게 무엇을 위임할지
4. **재검증 기준**: 통과 조건
5. **잔여 리스크**: 아직 불확실한 점

## GitHub 작업 팁

- `gh`로 checks와 run 상태를 확인하더라도, 요약은 사람 기준으로 다시 정리한다.
- PR 페이지의 checks, diff, Bugbot 결과를 함께 봐야 원인 추적이 빨라진다.
- 같은 실패를 두 번 이상 재시도하기 전에, 로그 또는 설정에서 새 근거를 확보한다.

## 금지 사항

- 로그를 읽지 않은 채 “재실행해보자”부터 하지 않는다.
- 인프라 문제인지 코드 문제인지 구분하지 않고 한 번에 큰 수정으로 덮지 않는다.
- 실패 원인을 확인하지 않은 상태에서 테스트만 비활성화하지 않는다.
- 하드코딩 게이트를 예외 처리로 넘기지 않는다.

## 함께 쓰면 좋은 스킬

- `/core-solution-github-pr-operations` — PR 설명, 리뷰 대응, 머지 준비까지 이어질 때
- `/core-solution-deployment` — Actions, 배포, 서버 기동 실패가 포함될 때
- `/core-solution-server-status` — 실제 서버/로그 확인이 필요할 때
