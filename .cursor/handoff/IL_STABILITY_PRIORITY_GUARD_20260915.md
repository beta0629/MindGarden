# IL 안정 = 최우선 가드 (RUNNING 중 강화)

수신:
- [IL표시통합 tip 안전배포](https://cursor.com/agents/bc-35f7bbfb-9f37-59b9-b3ca-a2c56ce4bd88) `bc-35f7bbfb`
- [내일 Actions복귀 정리](https://cursor.com/agents/bc-4f1f3e4a-d8ce-5602-b9c3-267e251d392d) `bc-4f1f3e4a`

작성: core-deployer · 2026-09-15  
범위: **가드·판정만** (운영 과다 테스트 금지 · DATAFIX 0 · 워크플로 본문 미수정)

---

## 한 줄

**기관연계(IL) 안정 확인 전** Actions 복귀·부분 tip·prepaid 10만 표시·최가을 특례 전부 금지.  
판정은 **심볼·헬스·번들**만.

---

## 컷오버 성공 기준 (하나라도 깨지면 롤백·미완료)

| # | 기준 | 판정 방법 |
|---|------|-----------|
| 1 | JAR: `ConsultationLogExistenceSsot` + InstitutionLink consultation log API | 활성 JAR/클래스·API 심볼 |
| 2 | FE: IL 일지 라우팅/심볼, 누적 **lifetime**(회기권 0/1 아님), 월별·상담일시, 최초상담일=`schedule` MIN, 배지 1개 | FE 번들·소스 심볼 |
| 3 | 금액: FT/패키지 **9만** 정합 (`prepaid` 10만 DATAFIX **표시 금지**) | 표시 경로에 `prepaid_amount`/`100000` SSOT 없음 |
| 4 | `ProvisionalConsultationLogSession` 등 **통합 tip 심볼 유지** | tip에 Provisional+ExistenceSsot **동시** 존재 |
| 5 | DATAFIX **0** · 최가을(`client_id=78`) 특례 하드코딩 **0** | 쓰기/분기 없음 |

---

## tip 가드 (부분 tip 금지 — 근거)

| tip | ExistenceSsot | ProvisionalConsultationLogSession | 판정 |
|-----|---------------|-----------------------------------|------|
| `cursor/prod-safe-unified-ship-7f13` | ✅ | ✅ | **정본 통합 tip** |
| `cursor/il-log-ssot-complete-2158` | ✅ | ❌ | **부분 tip** — Provisional 소실 위험 → 단독 배포 금지 |
| `origin/develop` / `origin/main` | ❌ | ❌ | IL SSOT **미반영** |

라이브 컷오버 tip SHA(정본): `127167822` (`RESUME_GITHUB_DEPLOY_20260916.md` 참조).  
origin HEAD가 `31035f0b7` 등으로 앞서도 **서버 tip과 불일치 시 부분 덮어쓰기 금지**.

폐기 커밋: `aa4a6d0a0`(prepaid 10만 표시 restore) — 통합 tip ancestor **아님**(exit 1). tip에 머지 금지.

---

## 에이전트별 강제

### `bc-35f7bbfb` (IL표시통합 tip 안전배포)
- 배포/컷오버는 **통합 tip만** (`prod-safe-unified-ship-7f13` / 라이브 SHA).
- `#1021`/`#1022`/`#1023` 등 **부분 tip SSH·JAR 덮어쓰기 금지**.
- 판정: 심볼·헬스·번들. 운영 UI 과다 스모크 금지.
- DATAFIX / client 78 특례 / prepaid 10만 표시 **0**.

### `bc-4f1f3e4a` (내일 Actions 복귀 정리)
- **IL 안정 게이트 PASS 전** Actions cron·허브 복귀·분 절감 되돌리기 **문서만 작성 가능, 실행·머지·워크플로 활성화 금지**.
- IL PASS 후에만 `RESUME_GITHUB_DEPLOY_20260916.md` 절차 진행.
- `develop`/`main`에 tip 올리기 전 위 표 #1~#5 재확인.

---

## 배포 트리거 (저장소 `on:`)

| 목적 | 워크플로 | 트리거 |
|------|----------|--------|
| 운영 코어(JAR 등) | `deploy-production.yml` | `push: main`(paths) + `workflow_dispatch` |
| 운영 프론트 | `deploy-frontend-prod.yml` | `push: main` + `frontend/**` / `workflow_dispatch` |
| 개발 백엔드 | `deploy-backend-dev.yml` | `push: develop` + Java/pom paths |

운영 게이트 문서: `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` · `docs/standards/DEPLOYMENT_STANDARD.md`

---

## IL 안정 판정 상태 (이 시각)

| 항목 | 상태 |
|------|------|
| `bc-35f7bbfb` / `bc-4f1f3e4a` | **RUNNING** |
| develop/main IL 심볼 | **미포함** → 안정 **미판정** |
| 가드 | **강화됨** (본 문서) |

PASS 시에만 한 줄: `IL 안정 PASS · Actions 복귀 가능`.  
FAIL/RUNNING: `IL 안정 미판정 · Actions 복귀 보류`.
