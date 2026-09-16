# PROD 배포 창 — 2026-09-16 21:00 KST까지 추가 배포 금지

**정책 출처**: 사용자 동결 (상담·일지 중 → 운영은 「지금 까지만」)  
**역할**: docs + freeze only · **PROD 추가 배포 0** · SSH 컷오버 0 · `release/prod` 추가 push/merge 0

## 창

| 항목 | 값 |
|------|-----|
| **동결 시작** | 즉시 (문서 작성 시점부터) |
| **동결 종료** | **2026-09-16 21:00 KST** |
| **이후** | 21:00 KST 이후 **일괄** 반영 (미머지·브랜치 작업 포함) |

## 이미 운영 반영됨 (추가 PROD 불필요)

- **일정상세 표 레이아웃 FE** — [일정상세 표레이아웃 반영](https://cursor.com/agents/bc-5f65ca4f-23ea-5792-9772-453db8575926) FE prod **SUCCESS**
- 운영 소스 브랜치: `release/prod` (추가 push/merge **금지** until 21:00 KST)

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

## 에이전트 행동

- 사용자가 **배포 창**을 명시한 경우 그 창을 **존중**한다 (스킬 한 줄 정책).
- 창 안에서는 「배포할까요?」 유도 금지 · **배포 실행 금지**.
- ManagePullRequest: 표 레이아웃 등 **배포 트리거 있는 브랜치 PR만** 필요 시 draft. **문서-only PR은 선택**.
