# Resume GitHub Deploy — 2026-09-16

병행: [IL표시통합 tip 안전배포](https://cursor.com/agents/bc-35f7bbfb-9f37-59b9-b3ca-a2c56ce4bd88)  
작성: core-deployer · SSH 통합 컷오버 **종료 후** develop/main 반영용 메모  
범위: **핸드오프만** (DATAFIX 없음 · 현재 SSH 배포 미개입 · `.github/workflows` 미수정)

---

## 1. 한 줄

이번 SSH 통합 tip이 끝나면, **심볼 게이트 PASS** 확인 후 tip을 `develop`→`main`에 올리고 **GitHub Actions만**으로 배포한다. **부분 tip SSH 금지**.

---

## 2. 이번 SSH 통합 tip (정본)

| 항목 | 값 |
|------|-----|
| 에이전트 | `bc-35f7bbfb` IL표시통합 tip 안전배포 (병행) |
| tip 브랜치 | `cursor/prod-safe-unified-ship-7f13` |
| **라이브 컷오버 tip SHA** | `127167822dbe0766767792177ba00a3b4d84a18c` |
| tip 구성 | #1023 ⊂ #1024 + #1025 gate (+ CardMeta/Billing/Flyway boot) |
| FE | `main.9cbcbf97.js` |
| 기록 | `/opt/cursor/artifacts/unified-ship-tip.txt`, `unified-ship-summary-ko.md` |
| 통합 PR | [#1029](https://github.com/beta0629/MindGarden/pull/1029) OPEN · base `deploy/dev-991-998-999-1000` |

참고: origin tip HEAD는 이후에 `31035f0b7`(Side Peek 배지)까지 앞서 있을 수 있음. **서버에 올린 정본은 `127167822`**. develop/main 올릴 때 tip HEAD vs 서버 tip 차이를 확인한다.

롤백 FE: `frontend.prev-20260915_105522` → `main.689b6eef.js`

---

## 3. 통합 PR·브랜치 목록 (SSH 종료 후 develop/main 후보)

base 대부분: `deploy/dev-991-998-999-1000` (아직 develop/main 아님)

### A. tip / 게이트 (우선)

| PR | 브랜치 | tip SHA (origin) | 역할 |
|----|--------|------------------|------|
| [#1029](https://github.com/beta0629/MindGarden/pull/1029) | `cursor/prod-safe-unified-ship-7f13` | `31035f0b7` (라이브 컷오버 `127167822`) | **PROD 안전 통합 tip** (IL+카드+가예약+게이트) |
| [#1028](https://github.com/beta0629/MindGarden/pull/1028) | `cursor/prod-sequential-ship-669a` | `18a08109a` | 순차 tip 기록(#1023+#1024+#1025) — #1029와 tip 다를 수 있음 |
| [#1025](https://github.com/beta0629/MindGarden/pull/1025) | `cursor/deploy-no-overwrite-gate-7f13` | `b97fd0d53` | 심볼 게이트 문서·스크립트 |
| [#1023](https://github.com/beta0629/MindGarden/pull/1023) | `cursor/fix-prod-log-register-guard-7f13` | `888233628` | IL SSOT + 카드 tip |
| [#1024](https://github.com/beta0629/MindGarden/pull/1024) | `cursor/fix-provisional-log-write-7f13` | (tip에 포함) | 가예약·회차 null 일지 |
| [#1021](https://github.com/beta0629/MindGarden/pull/1021) | `cursor/il-log-ssot-complete-2158` | `789abe146` | IL 일지 SSOT |
| [#1022](https://github.com/beta0629/MindGarden/pull/1022) | `cursor/il-card-progress-billing-7f13` | `f1ac9d05f` | 카드 누적 진행 |

### B. IL 표시 통합 (표시 SSOT · tip 병행)

| PR | 브랜치 | tip SHA | 역할 |
|----|--------|---------|------|
| [#1030](https://github.com/beta0629/MindGarden/pull/1030) | `cursor/il-display-ssot-bind-b8cb` | `76199a6fd` | IL 표시 SSOT (FT9만·최초상담일=스케줄 MIN) |
| [#1031](https://github.com/beta0629/MindGarden/pull/1031) | `cursor/il-first-consultation-date-11a5` | (관련) | 최초 상담일=스케줄 MIN |
| [#1033](https://github.com/beta0629/MindGarden/pull/1033) | `cursor/il-ft90-date-labels-b751` | (관련) | FT9만·날짜 라벨 분리 |
| [#1032](https://github.com/beta0629/MindGarden/pull/1032) | `cursor/assignment-timeline-hardcode-audit-3a9a` | (관련) | 타임라인 하드코딩 감사 |

권장 머지 축: **#1029 tip을 develop/main에 올리는 단일 경로**. 부분 PR(#1022/#1023 등)만 따로 올려 부분 tip이 되지 않게 한다.

---

## 4. 내일(09-16~) 절차 — Actions only

| 환경 | 워크플로 | `on:` 요지 |
|------|----------|------------|
| 개발 BE | `deploy-backend-dev.yml` | `push` **`develop`** + Java/pom/Flyway paths · `workflow_dispatch` |
| 개발 FE | `deploy-frontend-dev.yml` | `push` **`develop`** + `frontend/**` · `workflow_dispatch` |
| 운영 풀스택 | `deploy-production.yml` | `push` **`main`** + BE paths · **`workflow_dispatch`(main만)** |
| 운영 FE만 | `deploy-frontend-prod.yml` | `push` **`main`** + `frontend/**` · `workflow_dispatch`(main만) |

### 순서

1. SSH 통합 배포 완료·헬스 확인 (이번 세션이 끝낸 뒤).
2. `./scripts/deployment/check-deploy-no-overwrite-symbols.sh` (**심볼 게이트 PASS 필수**). 문서: `docs/deployment/DEPLOY_NO_OVERWRITE_GATE.md`.
3. tip(#1029 축) → PR로 **`develop`** 머지 → 개발 FE/BE Actions 자동(또는 수동 dispatch).
4. 검증 후 tip → **`main`** 머지 → `deploy-production.yml` (필요 시 FE만 `deploy-frontend-prod.yml`).
5. **금지**: 부분 tip SSH, 카드-only 컷오버, DATAFIX, `.github/workflows` 임의 수정.

### 워크플로 수정 금지

그록봇/CI 허브 PR과 충돌 방지:

- [#1026](https://github.com/beta0629/MindGarden/pull/1026) Actions 분 절감
- [#1027](https://github.com/beta0629/MindGarden/pull/1027) CI·Deploy 허브 통합

필요 시 **사용자·그록봇만** `.github/workflows` 수정.

### 수동 실행 예 (Secret 필요)

```bash
# 개발 백엔드
gh workflow run deploy-backend-dev.yml --ref develop

# 개발 프론트
gh workflow run deploy-frontend-dev.yml --ref develop

# 운영 풀스택 (main만)
gh workflow run deploy-production.yml --ref main -f deploy_ref=main

# 운영 프론트만
gh workflow run deploy-frontend-prod.yml --ref main -f deploy_ref=main
```

---

## 5. 게이트·표준 인용 (1회)

- 심볼: `scripts/deployment/check-deploy-no-overwrite-symbols.sh` · `docs/deployment/DEPLOY_NO_OVERWRITE_GATE.md`
- 배포 표준: `docs/standards/DEPLOYMENT_STANDARD.md`
- 운영 go-live: `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`
- 스킬: `/core-solution-deployment`

---

## 6. 기준 ref (스냅샷 시각 기준)

| ref | SHA |
|-----|-----|
| `origin/develop` | `a5f2d1c978879069cb3b84a18840035af576c729` |
| `origin/main` | `d67aa17939c7d60bee732377eaf2e99494fd865a` |
| `origin/deploy/dev-991-998-999-1000` | `4893c598bbe6f1da63b2d5589b61be057ebb2793` |
| SSH 라이브 tip | `127167822dbe0766767792177ba00a3b4d84a18c` |

스냅샷: 2026-09-15 (SSH tip 문서화) · 내일부터 Actions 재개.
