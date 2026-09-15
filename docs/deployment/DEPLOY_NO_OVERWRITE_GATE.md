# 배포 덮어쓰기 금지 · 동결 게이트 (6항 전부 PASS)

**상태**: 필수 (PROD Actions 컷오버·머지 전)  
**관련**: `/core-solution-deployment` 스킬 「배포 덮어쓰기 금지」, [DEPLOYMENT_STANDARD.md](../standards/DEPLOYMENT_STANDARD.md), [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md), [RESUME_GITHUB_DEPLOY_ACTIONS_ONLY.md](../../.cursor/handoff/RESUME_GITHUB_DEPLOY_ACTIONS_ONLY.md)

**일상 PROD 배포 경로 (고정)**: `workflow_dispatch` / 지정된 deploy workflow만. SSH FE/JAR atomic swap·수동 scp 컷오버는 **일상 배포에서 금지**(Actions budget 막혀도 우회 금지 → billing/한도 안내). 긴급 장애 문서의 **롤백만** 예외. **부분 tip 금지 · 본 문서 6항 게이트는 유지**.

## 왜 필요한가

기능 브랜치 **부분 tip**만으로 `/var/www/mindgarden/frontend` 또는 JAR를 통째 교체하면, 이미 반영된 **IL SSOT·가예약 일지·OPEN 점유 드래그 차단·이관 히스토리·카드 일정·prepaid 표시 금지**가 한 기능 추가만으로 사라진다.  
**부분 tip 단독 배포·머지 금지.** 심볼 게이트 **6항 전부 PASS**한 **통합 tip 한 번**만 FE+JAR를 올린다. **DATAFIX 0.** 일상 반영은 **GitHub Actions만** — SSH로 부분 tip을 올리는 것도 금지.

## 동결 규칙 (하나라도 FAIL → 배포·머지 중단)

| # | 항목 | PASS 기준 (심볼) |
|---|------|------------------|
| 1 | IL SSOT / institution-link log | `ConsultationLogExistenceSsot`(+Impl), `InstitutionLinkConsultationLogController`, FE `institution-link/consultation-records` / `_institutionLinkLog` |
| 2 | 가예약 일지 | `ProvisionalConsultationLogSession` + `ConsultationRecordServiceImpl` / `ScheduleServiceImpl` 참조 |
| 3 | 가예약 OPEN 점유 드래그 차단 | FE `hasOpenOccupyingConsultationSchedule` + `provisional_already_has_schedule`; BE `AdminController` enrich |
| 4 | SessionTransferHistory 마운트 | `SessionTransferHistorySection`(`session-transfer-history`) + SidePeek 마운트 + `AdminSessionTransferHistoryController` |
| 5 | CardBillingProgress / IL 월·완료일 **mapping 단위** | `CardBillingProgress` + `consultationSchedules` (FE·`AdminController`); **`client lifetime 금지`**; `cardBillingProgressDisplay`/`mappingDateDisplay`/`mappingScheduleStatusDisplay`가 `clientConsultationSchedules` lifetime 우선·혼입 금지 |
| 6 | prepaid 10만 SSOT 표시 없음 | `mappingPackageDisplay.js`가 `packageName`만 사용·`institutionLinkPrepaidAmount` 무시; `초기상담료(선납)` 라벨 없음 |

**정책**: DATAFIX / SQL 쓰기 **0**. 부분 tip 단독 PROD(Actions) 컷오버 **금지**. 일상 PROD는 Actions-only — SSH 직접 컷오버로 우회하지 말 것.

## 스크립트

```bash
# tip checkout 기준 (배포·머지 직전) — 1항이라도 FAIL 이면 exit 1
./scripts/deployment/check-deploy-no-overwrite-symbols.sh --source-root .

# 빌드 산출물 / 서버 경로까지 (선택)
./scripts/deployment/check-deploy-no-overwrite-symbols.sh \
  --source-root . \
  --jar target/mindgarden-*.jar \
  --fe-dir /var/www/mindgarden/frontend
```

## CI / Actions

- 워크플로: [`.github/workflows/deploy-no-overwrite-gate.yml`](../../.github/workflows/deploy-no-overwrite-gate.yml)  
  - `pull_request` / `push`(paths) / `workflow_dispatch` → 스크립트 실행, 실패 시 job fail  
- 운영 배포: `deploy-production.yml` · `deploy-frontend-prod.yml` 체크아웃 직후 동일 스크립트 실행 → **FAIL 시 배포 중단**

## 금지

- [ ] **카드-only tip** (`cf9a5138` 계열 등) **단독 PROD 컷오버**
- [ ] 위 6항 중 하나라도 없는 feature tip으로 Actions 배포·머지
- [ ] 일상 PROD에서 SSH FE/JAR atomic swap·수동 scp 컷오버 (Actions 한도 시에도 우회 금지)
- [ ] prepaid `100000` / `institutionLinkPrepaidAmount` / `초기상담료(선납)` 를 IL 카드·Peek 표시 SSOT로 복원
- [ ] IL 카드·월 한눈에 `clientConsultationSchedules` / `clientCompletedConsultationCount` lifetime 혼입 복원
- [ ] DATAFIX / 승인 없는 SQL 쓰기

## 권장 tip 순서 (한 번만 — Actions로 반영)

통합 tip(IL SSOT + 카드 + 가예약 일지 + OPEN 점유 드래그 + 이관 히스토리 + prepaid 비표시)이 **6항 PASS**한 뒤에만 FE(`/var/www/mindgarden/frontend`) + JAR를 **한 번** Actions로 반영한다.  
가예약 핫픽스가 RUNNING이면 그 파이프라인은 건드리지 않는다.

## 사고 메모

- 카드 단독·부분 tip이 운영을 덮어 IL 일지·SSOT·드래그 차단·히스토리·카드 일정이 회귀한 사례 → **6항 동결 · 부분 tip 덮어쓰기 금지**.
- SSH 일상 컷오버로 Actions와 싱크가 어긋난 사례 방지 → **일상 PROD = Actions only**.
