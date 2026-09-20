# PROD 배포 창 — 2026-09-16 21:00 KST까지 추가 배포 금지

**정책 출처**: 사용자 동결 (상담·일지 중 → 운영은 「지금 까지만」)  
**역할**: docs + freeze only · **PROD 추가 배포 0** · SSH 컷오버 0 · `release/prod` 추가 push/merge 0

## 창

| 항목 | 값 |
|------|-----|
| **동결 시작** | 즉시 (문서 작성 시점부터) |
| **동결 종료** | **2026-09-16 21:00 KST** |
| **이후** | 21:00 KST 이후 **일괄** 반영 (미머지·브랜치 작업 포함) |

## 지금 시점 운영 반영 스냅샷 (2026-09-16 ~17:02 KST)

| 구분 | 상태 | 근거 |
|------|------|------|
| **Core FE (운영)** | **반영됨** | `deploy-frontend-prod.yml` SUCCESS — Side Peek 일정 표 `9a626d54b` (run `35067516545`); 승계 왕복 표시 FE `2985d257a` (run `35065800697`) |
| **Core BE (운영)** | **JAR 컷오버 미완** | `deploy-production.yml` run `35068182827` — FE 빌드 **exit 137 OOM** (self-hosted, `NODE_OPTIONS=3072` 후에도 실패). 업로드·블루그린 **미실행**. 앱 재시작 **없음**. |
| **Discord 알람 job** | queued (무해) | 동일 run의 실패 알람만 — 앱 컷오버 아님 |
| `release/prod` HEAD | `80607bb1b` | NODE_OPTIONS tip 머지됨 · **추가 push 금지** |

- **일정상세 표 레이아웃 FE** — [일정상세 표레이아웃 반영](https://cursor.com/agents/bc-5f65ca4f-23ea-5792-9772-453db8575926) FE prod **SUCCESS**
- 마지막 **성공** Core 운영 풀스택(BE 컷오버 포함): run `35053465976` (`34bdd43d1c`, 러너 재기동 후 retrigger) — 그 이후 succession tip BE는 FE OOM으로 **미반영**
- 운영 소스 브랜치: `release/prod` (추가 push/merge **금지** until 21:00 KST)
- **21:00 일괄 시 권장**: `deploy-production.yml` FE 빌드를 `ubuntu-latest`로 분리(FE 전용 워크플로와 동일) 후 Core BE 재배포 — 상담 중 추가 재시도·재시작 금지

## 금지 (창 안)

1. **PROD Actions 배포** — `deploy-production.yml`, `deploy-frontend-prod.yml`, `deploy-unified-production.yml`, `deploy-trinity-prod.yml`, `deploy-ops-prod.yml`, `deploy-ops-backend-prod.yml`, `deploy-procedures-production-mysql.yml`, `deploy-mobile.yml` 등 **수동 `workflow_dispatch` / `release/prod` push 트리거 모두**.
2. **`release/prod` 추가 push · merge · tip 컷오버**.
3. **SSH 컷오버** (정적 `/var/www/...` · JAR · nginx upstream 수동 교체).
4. **부분 tip 단독 PROD** — 기존 6항 덮어쓰기 금지와 동일 (`DEPLOY_NO_OVERWRITE_GATE`).

## 허용 (창 안)

- 기능 작업은 **feature 브랜치에만** (예: 승계 왕복 표시 등 미머지분).
- **문서·핸드오프·스킬** 갱신 (본 파일·배포 스킬 등). 배포 트리거 paths에 걸리지 않게 `release/prod`에 올리지 말 것.
- DEV(`release/dev`) 배포는 본 창 범위 밖이나, 상담·일지 중이면 사용자 추가 지시 없이 운영 혼동을 만들지 말 것.

## 21:00 KST 일괄 시 참고 트리거 (워크플로 `on:`)

| 목적 | 워크플로 | 트리거 요지 |
|------|----------|-------------|
| Core 운영 (JAR·연동) | `deploy-production.yml` | `push` `release/prod` + paths **또는** `workflow_dispatch` |
| Core FE만 | `deploy-frontend-prod.yml` | `push` `release/prod` + `frontend/**` **또는** `workflow_dispatch` |
| 운영 통합 진입 | `deploy-unified-production.yml` | `workflow_dispatch` only |
| Trinity / Ops FE / Ops BE | `deploy-*-prod.yml` | `release/prod` push paths 또는 수동 |

일괄 전에는 `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` · `/core-solution-deployment` · `docs/deployment/DEPLOY_NO_OVERWRITE_GATE.md` 확인.

## 21:00 KST 일괄 포함 목록 (코드·release 준비)

| # | 항목 | 브랜치 / tip | 비고 |
|---|------|--------------|------|
| 1 | **상담일지 버튼 (김민영/#130 회귀)** | `cursor/fix-consultation-log-button-7f13` | CONFIRMED 푸터가 `showWrite(===false)` 대신 `consultationLogWriteVisible` SSOT 사용. DATAFIX 불필요 · FE만. **PROD Actions/SSH 금지 until 21:00.** |
| 2 | (기존) Core BE OOM 후 미컷오버 succession tip | `release/prod` @ `80607bb1b`+ | FE `ubuntu-latest` 분리 후 BE 재배포 권장 |
| 3 | (기존) unified tip / 6항 게이트 통과분 | `cursor/unified-prod-redeploy-b83f` 등 | 부분 tip 단독 금지 · 일괄 머지 후 1회 반영 |

**스모크(일괄 후)**: 운영 일정 상세 · 상태=확정(CONFIRMED) · 일지 유/무 · 「상담일지 작성」+「완료 처리」+「예약 취소」 동시 노출. COMPLETED+일지0 → 작성 / COMPLETED+일지有 → 보기·수정.

## 에이전트 행동

- 사용자가 **배포 창**을 명시한 경우 그 창을 **존중**한다 (스킬 한 줄 정책).
- 창 안에서는 「배포할까요?」 유도 금지 · **배포 실행 금지**.
- ManagePullRequest: 표 레이아웃 등 **배포 트리거 있는 브랜치 PR만** 필요 시 draft. **문서-only PR은 선택**.
