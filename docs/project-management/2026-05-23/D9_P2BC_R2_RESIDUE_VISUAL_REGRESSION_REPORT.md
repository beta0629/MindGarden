# D9 P2-b + P2-c — R-2 잔존 흡수 (T-R2-manual + T-R2-hold + P2-a 이월) 시각 회귀 위험 보고서

> **작성**: 2026-05-23 (core-coder 위임 산출물 — D9 P2-b + P2-c 묶음)
> **상위 합의**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D9.md` §2.1·§2.2 + §4 C2·C3 + §5 P2-b/c
> **상위 디자인 핸드오프**: `docs/project-management/2026-05-23/D9_P1_DESIGN_HANDOFF.md` §2.1·§2.2·§3 (hex 결정표 정확 인용)
> **답습 패턴**: `docs/project-management/2026-05-23/D9_P2A_R2_V2_VISUAL_REGRESSION_REPORT.md` (D9 P2-a SAFE/HOLD 분류 패턴 정확 답습) + `docs/project-management/2026-05-23/D8_PR_B_R2_MG_VISUAL_REGRESSION_REPORT.md` (D8 PR-B 단계 1)
> **인벤토리 SSOT**: `scripts/design-system/color-management/reports/r2-inventory-20260523-D9-P2bc-before.json` / `r2-inventory-20260523-D9-P2bc-after.json`
> **count 측정 (적용 전·후)**: `reports/count-20260523-D9-P2bc-before.json` / `reports/count-20260523-D9-P2bc-after.json`
> **codemod 변경**: `scripts/design-system/color-management/convert-hardcoded-colors.js` — `--r2-mg-alias-bc-replace` 옵션 + `R2_MG_ALIAS_BC_SAFE_PAIRS` 화이트리스트 신설 (21쌍) + `R2_V2_ALIAS_SAFE_PAIRS` 확장 (1쌍 추가, P2-a 이월) + COLOR_MAPPING §C2 신설 2종 추가 (4 라인, 대문자 변형 포함)
> **SSOT 변경**: `frontend/src/styles/unified-design-tokens.css` — D9 §C2/§C3 신설 3종 (라이트·다크 cascade) +44 라인
> **변경 파일 수**: 33 (CSS 30 + JS 1 + codemod 1 + SSOT 1)
> **변경 라인 수**: 288 insertions / 83 deletions (codemod 본문 171 추가, SSOT 44 추가, 광역 흡수 78쌍 1:1 라인 스왑)
> **HARD_EXCLUDE / VAR_FALLBACK 보호 패턴 변경**: 0줄 (모두 원위치 유지)
> **`unified-design-tokens.css` SSOT 본문 흡수처 변경**: 0줄 (정의 추가만, codemod 흡수 대상에서 제외)

---

## §0 TL;DR

D9 P2-b + P2-c 는 P1 §C2 (T-R2-manual 77건) + §C3 (T-R2-hold 13건) + P2-a 이월 HOLD/manual-review 23건을 통합 처리했다. **신설 3종** (`--mg-color-legacy-primary` / `--mg-color-brand-olive-muted` / `--mg-color-bg-hover`) SSOT 정의 추가 (라이트·다크 cascade) + **R2_MG_ALIAS_BC_SAFE_PAIRS 21쌍 신설** + **R2_V2_ALIAS_SAFE_PAIRS 1쌍 추가** (P2-a HOLD 이월: `--mg-v2-color-primary-100` + `#dbeafe`). 총 **흡수 78건** — mg-* BC 74건 / mg-v2-* 3건 / raw hex 1건 (AudioRecorder.js `#4a90e2`). HOLD 16건 (mg-* manual-review custom-*/danger-dark/purple-*/warning amber V2 등) + V2 manual-review 16건은 D10 또는 P1 디자이너 재컨펌 대기. T-D 가드 38 OK / 0 WARN / 0 ERROR / 0 🚨 PASS. 빌드 PASS. HARD_EXCLUDE / R-2 보호 정규식 영구 변경 0줄. 시각 회귀 위험 **MEDIUM** — primary blue `#4a90e2` 톤 보존 신설로 ops/admin 광역 시각 변화 0, brand-olive 변형 통합으로 consultant/pipeline 도메인 미세 시프트 (P1 endorsed), 신규 bg-hover 토큰 정착으로 hover 상태 시맨틱 분리 효과.

---

## §1 인벤토리 분류 결과

### 1.1 R-2 폴백 그룹별 분포 (P2-bc 직전 → 직후)

| 그룹 | Before | After | Δ | 본 PR 처리 |
|---|---:|---:|---:|---|
| mg-* (D8 PR-B + D9 P2-bc 누적 범위) | 90 | 16 | **-74** | BC SAFE 21쌍 흡수 + 16건 HOLD (manual-review 잔존) |
| mg-v2-* (D9 P2-a + P2-c 누적 범위) | 23 | 20 | -3 | V2 P2-c 보강 1쌍 흡수 + 4건 border-light HOLD + 16건 manual-review HOLD |
| other (cs-*, color-*, theme-* 등) | 156 | 156 | 0 | 본 PR 대상 외 |
| **합계** | **269** | **192** | **-77** | (r2Protected metric 직접 반영) |

### 1.2 P2-b (T-R2-manual) — Group N/A/B/C 분류 결과

P1 §2.1 결정표 정확 인용 + 시맨틱 매칭 검증:

#### Group N (NEW token 흡수, P1 §C2 신설 결정)

| (token, hex) 쌍 | 건수 | 캐노니컬 타깃 | SSOT 정의 | 시각 영향 |
|---|---:|---|---|---|
| `--mg-primary` + `#4a90e2` | 15 | `--mg-color-legacy-primary` | ✅ light `#4a90e2` / dark `#60a5fa` (Tailwind blue-400) | 라이트 hex 정확 일치 (시각 변화 0), 다크 cascade 정착 |
| `--mg-color-primary-light` + `#4a6354` | 8 | `--mg-color-brand-olive-muted` | ✅ light `#4a6354` / dark `#86a793` | 라이트 hex 정확 일치, 다크 cascade 정착 |
| `--mg-primary-light` + `#4a6354` | 1 | `--mg-color-brand-olive-muted` | ✅ 동일 | 라이트 hex 정확 일치, 다크 cascade 정착 |
| `--mg-bg-hover` + `#f3f4f6` | 4 | `--mg-color-bg-hover` | ✅ light `#f3f4f6` / dark `#374151` (Tailwind gray-700) | 라이트 hex 정확 일치, 다크 cascade 정착 (시맨틱 hover 분리) |

**합계**: 4쌍 / **28건**

#### Group A (polyfill-only, 시각 변화 0)

| (token, hex) 쌍 | 건수 | 캐노니컬 타깃 | SSOT 정의 | 시각 영향 |
|---|---:|---|---|---|
| `--mg-color-surface-main` + `#f5f3ef` | 8 | `--mg-color-surface-main` | ✅ light `#F5F3EF` / dark `#262626` | 라이트 hex 정확 일치 (case-insensitive), 폴백만 제거 |
| `--mg-color-success` + `#81c784` | 3 | `--mg-color-success` | ✅ light `#059669` / dark `#6ee7b7` | 폴백 제거 (SSOT 정의 시점에 폴백 hex 사용 안 됨) |
| `--mg-color-error` + `#e57373` | 3 | `--mg-color-error` | ✅ light `#E57373` / dark `#fca5a5` | 라이트 hex 정확 일치 (case-insensitive), 폴백만 제거 |

**합계**: 3쌍 / **14건**

#### Group B (P1 명시 endorsed 톤/패밀리 시프트)

| (token, hex) 쌍 | 건수 | 캐노니컬 타깃 | SSOT 정의 | 시각 영향 |
|---|---:|---|---|---|
| `--mg-surface-primary` + `#f5f3ef` | 5 | `--mg-color-surface-main` | ✅ light `#F5F3EF` / dark `#262626` | 표면 시맨틱 중복 정리, 라이트 hex 정확 일치 |
| `--mg-text-secondary` + `#64748b` | 4 | `--mg-color-text-secondary` | ✅ light `#5C6B61` / dark `#9CA3AF` | 라이트 톤 시프트 (Tailwind slate-500 → 브랜드 olive-gray), 가독성 유지 |
| `--mg-primary-light` + `#4f6b5a` | 4 | `--mg-color-brand-olive-muted` | ✅ light `#4a6354` / dark `#86a793` | ΔE 작은 olive 변형 시프트, 다크 cascade 정착 |
| `--mg-consultant-primary-light` + `#6b7f72` | 3 | `--mg-color-brand-olive-muted` | ✅ 동일 | 도메인 alias 통합, brand-olive 패밀리 시프트 |
| `--mg-pipeline-primary` + `#4b745c` | 2 | `--mg-color-brand-olive-muted` | ✅ 동일 | 도메인 alias 통합, brand-olive 패밀리 시프트 |

**합계**: 5쌍 / **18건**

#### Group C (closest-canonical, P1 §C2 "기타 18쌍" ΔE 작은 케이스)

| (token, hex) 쌍 | 건수 | 캐노니컬 타깃 | SSOT 정의 | 시각 영향 |
|---|---:|---|---|---|
| `--mg-layout-main-bg-end` + `#f2ede8` | 2 | `--mg-color-background-muted` | ✅ light `#F2EDE8` / dark `#2C2C2C` | 라이트 hex 정확 일치 |
| `--mg-surface-secondary` + `#ebe9e4` | 2 | `--mg-color-background-secondary` | ✅ light `#EBE6E0` / dark `#232323` | ΔE 작은 warm-bg 시프트 |
| `--mg-color-primary-light` + `#7a9082` | 1 | `--mg-color-brand-olive-muted` | ✅ light `#4a6354` / dark `#86a793` | brand-olive 변형 (ΔE 작음) |

**합계**: 3쌍 / **5건**

**P2-b 합계**: 15쌍 / **65건**

### 1.3 P2-c (T-R2-hold) — Group N/B 분류 결과

P1 §2.2 결정표 정확 인용:

| (token, hex) 쌍 | 건수 | 캐노니컬 타깃 | SSOT 정의 | 시각 영향 |
|---|---:|---|---|---|
| `--mg-bg-hover` + `#f3f4f6` | 4 | `--mg-color-bg-hover` | ✅ light `#f3f4f6` / dark `#374151` | (Group N — 위 P2-b 표에 포함) |
| `--mg-text-tertiary` + `#666` | 3 | `--mg-color-text-secondary` | ✅ light `#5C6B61` / dark `#9CA3AF` | tier 시프트 (tertiary → secondary) — P1 결정 |
| `--mg-primary-light` + `#dbeafe` | 2 | `--mg-color-info-100` | ✅ light `#dbeafe` / dark `#1e3a8a` | primary↔info 패밀리 시프트, 라이트 hex 정확 일치 |
| `--mg-pipeline-card-bg` + `#f8fafc` | 1 | `--mg-color-background-main` | ✅ light `#faf9f7` / dark `#1a1a1a` | generic bg 통합, warm-bg 톤 시프트 |
| `--mg-gray-light` + `#f3f4f6` | 1 | `--mg-color-background-main` | ✅ 동일 | semantic surface 통합, warm-bg 톤 시프트 |
| `--mg-color-primary-light` + `#e3f2fd` | 1 | `--mg-color-info-soft` | ✅ light `#e3f2fd` / dark `#1e3a8a` | info 패밀리 통합, 라이트 hex 정확 일치 |
| `--mg-gray-100` + `#f3f4f6` | 1 | `--mg-color-background-main` | ✅ light `#faf9f7` / dark `#1a1a1a` | semantic surface 통합, warm-bg 톤 시프트 |

**P2-c 합계**: 6쌍 (bg-hover Group N 제외) + 1쌍 (Group N bg-hover) = **7쌍 / 13건**

### 1.4 P2-a 이월 통합 (mg-v2-* HOLD 1쌍, primary↔info 시프트)

P2-a 시점 HOLD 였던 `--mg-v2-color-primary-100` + `#dbeafe` (3건) 를 P1 §C3 결정과 일관 (primary↔info 패밀리 시프트 SAFE) 차원에서 본 위임에서 흡수:

| (token, hex) 쌍 | 건수 | 캐노니컬 타깃 | SSOT 정의 | 시각 영향 |
|---|---:|---|---|---|
| `--mg-v2-color-primary-100` + `#dbeafe` | 3 | `--mg-color-info-100` | ✅ light `#dbeafe` / dark `#1e3a8a` | 라이트 hex 정확 일치 (시각 변화 0), 다크 cascade 정착 효과 |

**P2-a 이월 합계**: 1쌍 / **3건**

### 1.5 흡수 총계

| 트랙 | 신설 SSOT | codemod 매핑 쌍 (BC + V2 + COLOR_MAPPING) | 흡수 건수 |
|---|---:|---:|---:|
| P2-b (T-R2-manual) | 2 (legacy-primary / brand-olive-muted) | 14쌍 BC + 2쌍 COLOR_MAPPING (legacy-primary 대문자 변형 포함) | 65 |
| P2-c (T-R2-hold) | 1 (bg-hover) | 7쌍 BC | 13 |
| P2-a 이월 통합 | 0 | 1쌍 V2 | 3 |
| **합계** | **3** | **21 BC + 1 V2 + 4 COLOR_MAPPING (대문자 변형 포함)** | **81** (78 alias 대체 + 1 raw hex AudioRecorder.js + 2 lint 인입용) |

> **참고**: codemod 보고서의 R-2 alias 대체 통계는 BC 74건 + V2 3건 = 77건이며, 추가로 AudioRecorder.js 의 raw hex `#4a90e2` 1건이 COLOR_MAPPING `--mg-color-legacy-primary` 신설 매핑으로 자동 흡수되어 총 78건 변경 라인이 광역에 적용.

---

## §2 적용 전·후 count 비교

| metric | 적용 전 (`count-20260523-D9-P2bc-before.json`) | 적용 후 (`count-20260523-D9-P2bc-after.json`) | Δ |
|---|---:|---:|---:|
| **canonical** (D6 §8 운영 게이트) | 458 | 457 | **-1** (AudioRecorder.js `#4a90e2` raw hex 흡수 — canonical 잔존 영역에서 1건 제거) |
| **withR2** | 727 | 649 | **-78** (정확 — 77 alias + 1 raw hex) |
| **rawLine** (CI/BI grep 라인) | 1,481 | 1,423 | **-58** (위임 기대 -40~-90 범위 정합) |
| **rawLineCss** | 1,468 | 1,411 | -57 |
| **rawLineJs** | 13 | 12 | -1 (AudioRecorder.js) |
| **r2Protected** | 269 | 192 | **-77** (정확 — alias 대체 77건과 1:1 매칭) |
| **uniqueCanonicalHex** | 213 | 212 | -1 (`#4a90e2` 신설 매핑으로 흡수) |
| **uniqueR2ProtectedHex** | 73 | 61 | -12 (mg-* 그룹에서 12종 hex 완전 제거) |

**위임 기대치 (rawLine -40 ~ -90)** 대비: **-58, 표준 범위 정합 ✅**. 사유:
- BC alias 대체 74건 + V2 3건 = 77건이 rawLine 에 반영되나, 일부 파일에서 동일 라인 다중 폴백 케이스가 있어 rawLine 변화는 흡수 건수보다 작음 (D8 PR-B 단계 1 / D9 P2-a 동일 패턴).
- 정확한 흡수 효과는 `withR2 -78` / `r2Protected -77` 에 직접 반영됨.

---

## §3 NO-OP / 부분 진행 사유

### 3.1 mg-* manual-review 16건 (HOLD, custom-* / danger-dark / purple-* 등)

캐노니컬 매핑이 부재하거나 시맨틱 시프트 위험이 큰 케이스. P1 §C2 "기타 18쌍" 라인 중 ΔE 가 크거나 시맨틱 위험이 명확한 케이스를 보수적으로 HOLD 분류:

| (token, hex) 쌍 | 건수 | HOLD 사유 |
|---|---:|---|
| `--mg-color-text-tertiary` + `#8a9a90` | 2 | brand olive-gray 톤, 캐노니컬 부재 (text-tertiary `#4b5563` 와 hex 차 큼) |
| `--mg-color-danger-dark` + `#c82333` | 2 | Bootstrap danger 톤 보존, `--mg-color-error-dark` `#991b1b` 와 hex 차 큼 |
| `--mg-purple-light` + `#ede9fe` | 1 | Tailwind violet-50, 캐노니컬 purple 패밀리 부재 |
| `--mg-success` + `#22c55e` | 1 | Tailwind green-500, `--mg-color-success` `#059669` 와 hex 차 큼 |
| `--mg-success-dark` + `#16a34a` | 1 | Tailwind green-600, 캐노니컬 success darker 부재 |
| `--mg-color-text-secondary` + `#888` | 1 | 3자리 단색 회색, 캐노니컬 text-secondary `#5C6B61` 와 톤 차 |
| `--mg-custom-ffeaa7` + `#ffeaa7` | 1 | warning 톤 placeholder, 캐노니컬 부재 |
| `--mg-custom-e8f4fd` + `#e8f4fd` | 1 | info 톤 placeholder, 캐노니컬 부재 |
| `--mg-custom-bee5eb` + `#bee5eb` | 1 | info 톤 placeholder, 캐노니컬 부재 |
| `--mg-custom-0c5460` + `#0c5460` | 1 | info-dark 톤 placeholder, 캐노니컬 부재 |
| `--mg-warning-500` + `#fd7e14` | 1 | Bootstrap warning orange, `--mg-color-warning-500` `#f59e0b` 와 톤 차 큼 |
| `--mg-purple-500` + `#6f42c1` | 1 | Bootstrap purple, 캐노니컬 purple 패밀리 부재 |
| `--mg-color-accent-main` + `#8b7355` | 1 | coffee/brown accent, 캐노니컬 부재 |
| `--mg-text-secondary` + `#555555` | 1 | 6자리 회색, 캐노니컬 text-secondary `#5C6B61` 와 톤 차 |

**합계**: 14쌍 / **16건** — D10 또는 P1 디자이너 재컨펌 대기.

### 3.2 mg-v2-* HOLD 4건 (border-light, 시맨틱 시프트)

| (token, hex) 쌍 | 건수 | HOLD 사유 |
|---|---:|---|
| `--mg-v2-color-border-light` + `#f3f4f6` | 4 | border ≠ background/hover-bg 시맨틱 시프트. 본 위임에서 신설된 `--mg-color-bg-hover` 도 hover 상태 시맨틱이므로 정적 border 대체에는 부적합. `--mg-color-border-main` (`#D4CFC8`) 과 hex 차 큼 (gray-100 톤 vs neutral-700 톤). |

P1 디자이너 재컨펌 필요 — `--mg-color-border-soft` 등 신설 검토 권고 (D10 후속).

### 3.3 mg-v2-* manual-review 16건 (Tailwind palette 변형)

D9 §C5 `warning-100/800` 신설 (커밋 `de057e490`) 후에도 V2 warning amber hex 값은 신설 토큰 hex 와 불일치 (`#fffbeb`/`#fde68a`/`#d97706`/`#b45309` vs `#fef3c7`/`#92400e`). primary blue V2 hex 값도 신설된 `--mg-color-legacy-primary` (`#4a90e2`) 와 hex 차 큼 (`#eff6ff`/`#bfdbfe`/`#93c5fd`). 진한톤 V2 (`#16a34a`/`#15803d`/`#0284c7`) 도 캐노니컬 success/info-dark 와 hex 차 큼. 모두 D10 또는 P1 추가 신설 결정 대기:

| 범주 | 건수 | 처리 라인 |
|---|---:|---|
| primary blue (`#eff6ff` `#bfdbfe` `#93c5fd`) | 7 | D10 — primary blue 200·300·50 신설 또는 legacy-primary 확장 결정 |
| warning amber (`#fffbeb` `#fde68a` `#d97706` `#b45309`) | 6 | D10 — warning amber 50·200·600·700 신설 결정 |
| success/info 진한톤 (`#16a34a` `#15803d` `#0284c7`) | 3 | D10 — success-600/700, info-600 신설 결정 |

---

## §4 시각 회귀 위험 분류

### 4.1 영향 화면군 + 위험 등급

**변경 33 파일 중 30 CSS + 1 JS 광역 분포** (admin 12 / dashboard-v2 6 / common 4 / ops·tenant 4 / auth 2 / 기타 3 + AudioRecorder.js):

| 영향 영역 | 적용 SAFE 쌍 | 건수 | 위험 등급 | 시각 영향 |
|---|---|---:|:---:|---|
| **ops/admin 광역** (PgApprovalManagement / PgConfiguration*) | `--mg-primary` + `#4a90e2` → `--mg-color-legacy-primary` | 15 | **MEDIUM** | primary blue 톤 라이트 hex 정확 일치 (변화 0). 다크 모드 cascade 정착 `#60a5fa` (Tailwind blue-400, 다크 4.9:1 PASS). PG 결제 승인 / 설정 화면 focus/border/accent 톤 일관성. |
| **대시보드 광역** (admin Dashboard*/admin Wellness/dashboard-v2 templates) | `--mg-color-surface-main` + `#f5f3ef` → `--mg-color-surface-main` / `--mg-surface-primary` + `#f5f3ef` → 동 | 13 | **LOW** | 폴백 hex 정확 일치 (case-insensitive), 시각 변화 0. surface 메인 카드/모달 배경 통일. |
| **consultant 도메인** (ConsultantDashboard / pipeline / atoms) | `--mg-color-primary-light` + `#4a6354` → `--mg-color-brand-olive-muted` 외 brand-olive 변형 8건 | 18 | **MEDIUM** | brand-olive 패밀리 라이트 hex 정확 일치 (`#4a6354` 본체) 또는 ΔE 작은 변형 (`#4f6b5a`/`#6b7f72`/`#4b745c`/`#7a9082`). 다크 cascade `#86a793` 정착으로 다크 모드 가시성 향상. consultant 대시보드 / 파이프라인 단계 카드 / 도메인 액센트 일관성. |
| **bg-hover 시맨틱 분리** (NotificationDropdown / ProfileDropdown / dropdown-common / WidgetConfigModal 등) | `--mg-bg-hover` + `#f3f4f6` → `--mg-color-bg-hover` | 4 | **LOW** | 라이트 hex 정확 일치 (시각 변화 0), 다크 cascade `#374151` (Tailwind gray-700) 정착으로 다크 모드 hover 가독성 향상. 드롭다운/위젯 hover 상태 일관성. |
| **text 보조 톤 시프트** (Homepage / MgEmailFieldWithAutocomplete 등) | `--mg-text-secondary` + `#64748b` → `--mg-color-text-secondary` | 4 | **MEDIUM** | 라이트 톤 시프트 Tailwind slate-500 `#64748b` → 브랜드 olive-gray `#5C6B61` (ΔE 인지 가능, 가독성 유지). 다크 cascade `#9CA3AF` 정착. P1 §C2 endorsed. |
| **text tier 시프트** (BadgeSelect / MGButton 등) | `--mg-text-tertiary` + `#666` → `--mg-color-text-secondary` (tier 시프트) | 3 | **MEDIUM** | tertiary `#666` → secondary `#5C6B61` (라이트 ΔE 작음, tier 시프트 인지 가능). P1 §C3 endorsed. |
| **primary↔info 패밀리 시프트** (auth/ConsultantDashboard 등) | `--mg-primary-light` + `#dbeafe` → `--mg-color-info-100` / `--mg-v2-color-primary-100` + `#dbeafe` → 동 | 5 | **MEDIUM** | 라이트 hex 정확 일치 (`#dbeafe`, 시각 변화 0). 다크 cascade `#1e3a8a` (Tailwind blue-900) 정착으로 다크 모드 표면 가독성 향상. primary→info 시맨틱 명확화. |
| **generic bg 통합** (AdminMetricsVisualization / pipeline / 기타) | `--mg-pipeline-card-bg` + `#f8fafc` / `--mg-gray-light` + `#f3f4f6` / `--mg-gray-100` + `#f3f4f6` → `--mg-color-background-main` | 3 | **MEDIUM** | warm-bg 톤 시프트 (`#f8fafc`/`#f3f4f6` cool → `#faf9f7` warm). 라이트 모드에서 미세한 따뜻한 톤 변화 가능 (P1 §C3 endorsed). 파이프라인 카드 / 회색 그룹 배경 일관성. |
| **info-soft 통합** (1 파일) | `--mg-color-primary-light` + `#e3f2fd` → `--mg-color-info-soft` | 1 | **LOW** | 라이트 hex 정확 일치 (`#e3f2fd`), 다크 cascade `#1e3a8a` 정착. |
| **background 보조 통합** (1 파일) | `--mg-layout-main-bg-end` + `#f2ede8` → `--mg-color-background-muted` | 2 | **LOW** | 라이트 hex 정확 일치 (`#f2ede8`), 다크 cascade `#2C2C2C` 정착. |
| **background-secondary 통합** (1 파일) | `--mg-surface-secondary` + `#ebe9e4` → `--mg-color-background-secondary` | 2 | **LOW** | ΔE 작은 warm-bg 시프트 (`#ebe9e4` → `#EBE6E0`), 다크 cascade `#232323` 정착. |
| **AudioRecorder canvas gradient** (clinical) | raw hex `#4a90e2` → `var(--mg-color-legacy-primary)` | 1 | **LOW** | Canvas API addColorStop 컨텍스트. 직전 D2 라운드 (`#2563eb` → `var(--mg-color-info)`, commit `b61e71b29`) 동일 패턴 답습. |

### 4.2 다크 모드 cascade 정착 (긍정적 부수 효과)

D8 PR-B 단계 1 / D9 P2-a 답습 — 신설 3종 + 흡수 매핑으로 광역 다크 cascade 정착:

| 토큰 (변경 후) | 라이트 | 다크 (변경 전 polyfill) | 다크 (변경 후 캐노니컬) | 변화 |
|---|---|---|---|---|
| `--mg-color-legacy-primary` | `#4a90e2` 정착 | `#4a90e2` (cascade 부재) | `#60a5fa` (Tailwind blue-400) | 다크 가독성 향상 (대비 4.9:1 PASS) |
| `--mg-color-brand-olive-muted` | `#4a6354` ~`#7a9082` 정착 | 폴백 hex 잔존 (cascade 부재) | `#86a793` | 다크 brand-olive 가시성 향상 (5.2:1 PASS) |
| `--mg-color-bg-hover` | `#f3f4f6` 정착 | `#f3f4f6` (cascade 부재, 다크 배경에서 흰 박스) | `#374151` (Tailwind gray-700) | 다크 hover 상태 가독성 대폭 향상 |
| `--mg-color-text-secondary` (P2-b/c 흡수) | `#5C6B61` 정착 | polyfill hex 잔존 | `#9CA3AF` (D9 §C4 cascade) | 다크 보조 텍스트 가시성 향상 |
| `--mg-color-info-100` (P2-c 흡수) | `#dbeafe` 정착 | `#dbeafe` (cascade 부재, 다크에서 너무 밝음) | `#1e3a8a` (Tailwind blue-900) | 다크 info 표면 대비 반전 정착 |

### 4.3 라이트 모드 톤 시프트 핵심 위험 — Group B/C 통합 9건

P1 §C2/§C3 endorsed 톤/패밀리 시프트로 다음 4개 영역에서 미세한 라이트 모드 톤 변화 가능:

1. **text-secondary tone shift (4건)**: `#64748b` (Tailwind slate-500, cool) → `#5C6B61` (브랜드 olive-gray, warm). 명도 ΔL ≈ 1, 색상 ΔE ≈ 7 (인지 가능). P3 검수 — Homepage 보조 텍스트 / MgEmailFieldWithAutocomplete placeholder 톤 일관성 확인.

2. **brand-olive 패밀리 통합 (9건, primary-light variants)**: 다양한 olive 변형 → `--mg-color-brand-olive-muted` (`#4a6354`). ΔE 5~12 (인지 가능). P3 검수 — consultant 대시보드 카드 액센트 / 파이프라인 단계 / 도메인 컬러 일관성 확인.

3. **tier shift (3건, text-tertiary → text-secondary)**: `#666` → `#5C6B61`. ΔE 작음 (가독성 유지 방향). P3 검수 — BadgeSelect / MGButton 보조 라벨 톤 확인.

4. **warm-bg 톤 시프트 (3건, gray-100/gray-light/pipeline-card-bg → background-main)**: `#f3f4f6`/`#f8fafc` (cool gray) → `#faf9f7` (warm beige). ΔE 5~7 (인지 가능). P3 검수 — 파이프라인 카드 배경 / 회색 그룹 일관성 확인.

---

## §5 P3 코어 테스터 핸드오프 우선 점검 화면

### 5.1 MEDIUM 우선 점검 (광역 — primary/brand-olive/text 시프트)

| 라우트 / 화면 | 점검 포인트 | 변경 hex |
|---|---|---|
| ops PG 결제 승인 (`/ops/pg-approval/*`) | 필터/카드/체크박스/textarea focus/border/accent 톤 — primary `#4a90e2` 정착 | `#4a90e2` |
| ops PG 설정 (`/ops/pg-config/*`) | 카드/필드 focus border 톤 — primary `#4a90e2` | `#4a90e2` |
| tenant PG 설정 상세/리스트 (`/tenant/pg/*`) | 카드/포커스 액센트 톤 — primary `#4a90e2` | `#4a90e2` |
| auth login/signup (`/login`) | hero 패널/액션 버튼 톤 — primary `#4a90e2` | `#4a90e2` |
| admin 알림 페이지 (`/admin/notifications`) | 액센트/뱃지 톤 — primary `#4a90e2` | `#4a90e2` |
| dashboard-v2 desktop/mobile layouts | NavLink active / dropdown hover 톤 — primary `#4a90e2` + bg-hover `#f3f4f6` | `#4a90e2` / `#f3f4f6` |
| consultant 대시보드 (`/dashboard-v2/consultant/*`) | 도메인 액센트 / 카드 보더 / 파이프라인 단계 톤 — brand-olive 변형 9건 | `#4a6354` / `#4f6b5a` / `#6b7f72` / `#4b745c` / `#7a9082` |
| admin Wellness/Dashboard widgets (`/admin/dashboard/*`) | 위젯 카드 표면 / 매트릭스 시각화 톤 — surface-main `#f5f3ef` (시각 변화 0 예상) | `#f5f3ef` |
| Homepage / MgEmailFieldWithAutocomplete | 보조 텍스트 / placeholder 톤 — text-secondary `#64748b` → `#5C6B61` 시프트 | `#64748b` |
| BadgeSelect / MGButton | 라벨/뱃지 보조 텍스트 톤 — text-tertiary `#666` → text-secondary `#5C6B61` | `#666` |
| AdminMetricsVisualization / pipeline | generic bg 카드 톤 — warm-bg 톤 시프트 (cool → warm) | `#f8fafc` / `#f3f4f6` |

### 5.2 LOW 우선 점검

| 라우트 / 화면 | 점검 포인트 | 변경 hex |
|---|---|---|
| dashboard-v2 dropdown / notification (`NotificationDropdown` / `ProfileDropdown` / `dropdown-common`) | hover 상태 배경 톤 — bg-hover `#f3f4f6` (시각 변화 0) | `#f3f4f6` |
| WidgetConfigModal / Dashboard3DPreview / DashboardLayoutEditor | 위젯 편집 hover 상태 — bg-hover | `#f3f4f6` |
| admin AdminMetricsVisualization / pipeline cards | layout-main-bg-end / background 시프트 | `#f2ede8` / `#ebe9e4` |
| clinical AudioRecorder (`/clinical/*` 오디오 녹음 컴포넌트) | canvas waveform gradient 시작 색 (`#4a90e2` → CSS var) | `#4a90e2` |

### 5.3 다크 모드 별도 점검 (P3 권고)

- **legacy-primary 다크 cascade** (`#60a5fa`, Tailwind blue-400): 다크 모드 ops/admin/auth 화면에서 primary 액센트 가시성 4.9:1 대비 확인.
- **brand-olive-muted 다크 cascade** (`#86a793`): consultant 도메인 다크 모드 액센트 가시성 5.2:1 대비 확인.
- **bg-hover 다크 cascade** (`#374151`, Tailwind gray-700): 다크 모드 드롭다운/위젯 hover 상태 가시성 (다크 배경 vs hover 배경 분리도 확인).
- **info-100 다크 cascade** (`#1e3a8a`, Tailwind blue-900): 다크 모드 primary↔info 시프트된 배경 영역 가독성 (info 표면 위 텍스트 대비 확인).
- **text-secondary 다크 cascade** (`#9CA3AF`, D9 §C4 정착): Homepage/BadgeSelect 다크 모드 보조 텍스트 가독성 5.0:1 대비 확인.

---

## §6 D10 / 후속 라운드 이월 사항

### 6.1 본 PR HOLD 16건 (mg-* manual-review)

§3.1 분포 참조 — custom-* placeholder / Bootstrap 잔재 (danger/warning/purple) / brand-olive-gray text 변형 / 회색 변형 등. P1 디자이너 재컨펌 또는 D10 추가 신설 결정 대기 (purple 패밀리 / Bootstrap red-800 / amber-warning 분기 등).

### 6.2 본 PR HOLD 4건 (mg-v2-* border-light)

§3.2 — `--mg-color-border-soft` 등 신설 검토 권고 (gray-100 톤 border 시맨틱 분리).

### 6.3 본 PR 대상 외 — D10 / P1 처리 범위 (mg-v2-* manual-review 16건)

§3.3 분포 참조 — primary blue 200·300·50 / warning amber 50·200·600·700 / success-600·700·info-600. D10 후속 신설 결정 시 일괄 흡수 가능.

### 6.4 본 위임 대상 외 — 별도 트랙

- **other 그룹 156건** (cs-*, color-*, theme-* 등): D10 트랙 결정 (T1-C 종결).
- **T-Glass-Shadow-Overlay 광역 838건** (D9 §C6 PR-D 단독 분리): rgba SSOT 5종 정착 후 광역 흡수, 운영 게이트 < 1,000 진입 직접 트리거 (P2-f 별도 위임).

---

## §7 T-D 가드 결과

`npm run lint:codemod-mappings` 실행 결과 **PASS** (exit 0):

- **PASS 38 토큰**: D9 P2-a 시점 36 → 본 위임 후 38 (신설 `--mg-color-legacy-primary` + `--mg-color-brand-olive-muted` COLOR_MAPPING 인입 결과)
- **WARN — 다크 정의 없음**: **0건** (신설 3종 모두 라이트·다크 cascade 정착 완료)
- **WARN — chain 깊이 ≥ 5**: 0건
- **WARN — chain cycle**: 0건
- **ERROR — 라이트 정의 누락**: 0건
- **🚨 alias 충돌**: 0건

신설 3종 PASS 상세:
- `--mg-color-legacy-primary` : light `#4a90e2` / dark `#60a5fa` ✅
- `--mg-color-brand-olive-muted` : light `#4a6354` / dark `#86a793` ✅
- `--mg-color-bg-hover` : SSOT 정의 light `#f3f4f6` / dark `#374151` 정착 (단, COLOR_MAPPING 비인입 — `#f3f4f6` 이 D3 라운드에서 이미 `--mg-color-background-main` 으로 매핑되어 alias 충돌 회피 차원, SAFE_PAIRS 옵션 경로로만 alias 대체)

---

## §8 빌드 결과

`cd frontend && CI=false npm run build` 실행 결과 **PASS**:
- 빌드 성공, 번들 생성 완료
- 신규 경고·오류 없음 (기존 bundle size 경고만 잔존, 본 작업과 무관)

---

## §9 codemod 변경 요약

### 9.1 변경 내역 — `scripts/design-system/color-management/convert-hardcoded-colors.js`

1. **COLOR_MAPPING §C2 신설 2종 추가** (대문자 변형 포함, 4 라인):
   - `'#4a90e2'` / `'#4A90E2'` → `'var(--mg-color-legacy-primary)'`
   - `'#4a6354'` / `'#4A6354'` → `'var(--mg-color-brand-olive-muted)'`
2. **R2_V2_ALIAS_SAFE_PAIRS 확장** (P2-a HOLD 이월 1쌍 추가):
   - `--mg-v2-color-primary-100` + `#dbeafe` → `var(--mg-color-info-100)`
3. **R2_MG_ALIAS_BC_SAFE_PAIRS 신설** (D9 P2-b + P2-c 21쌍, Group N/A/B/C 분류 + P1 §C2/§C3 SSOT 인용 주석 포함)
4. **processFile 의 0단계-bc 단계 추가** — `--r2-mg-alias-bc-replace` 옵션 시 R2_MG_ALIAS_BC_SAFE_PAIRS 일괄 치환
5. **parseArgs 에 `--r2-mg-alias-bc-replace` 옵션 추가**
6. **stats 초기화에 `r2MgAliasBcReplaced` / `r2MgAliasBcPairCounts` 카운터 추가**
7. **CLI 사용법 + 출력 요약 통계에 BC 분포 보강**

### 9.2 변경 내역 — `frontend/src/styles/unified-design-tokens.css`

1. **D9 §C2/§C3 신설 3종 SSOT 정의 블록 추가** (44 라인):
   - `:root` 블록: `--mg-color-legacy-primary: #4a90e2` / `--mg-color-brand-olive-muted: #4a6354` / `--mg-color-bg-hover: #f3f4f6`
   - `:root[data-theme="dark"]` 블록: `--mg-color-legacy-primary: #60a5fa` / `--mg-color-brand-olive-muted: #86a793` / `--mg-color-bg-hover: #374151`
   - P1 §2.1·§2.2 hex 결정표 + WCAG AA 대비비 검증 결과 인용 주석 포함

### 9.3 변경 없음 (위임 §4 제약 준수)

- `HARD_EXCLUDE_PATTERNS` (codemod / count / inventory 스크립트): **diff 0줄**
- `VAR_FALLBACK_HEX_PATTERN` (R-2 보호 정규식): **diff 0줄**
- `VAR_FALLBACK_PLACEHOLDER_PREFIX/SUFFIX`: **diff 0줄**
- `findFiles` HARD_EXCLUDE 배열: **diff 0줄**
- `R2_MG_ALIAS_SAFE_PAIRS` (D8 PR-B 단계 1 화이트리스트): **diff 0줄** (영구 유지)
- 모든 R-2 fallback 보호 동작은 기본값 그대로 유지되며, 본 옵션은 opt-in (`--r2-mg-alias-bc-replace`)

### 9.4 인벤토리 도구 재사용

`scripts/design-system/color-management/inventory-r2-fallbacks.js` — D8 PR-B 단계 1 산출, D9 P2-a 답습. 본 위임에서 동일 스크립트로 P2-bc 분류 산출 (`reports/r2-inventory-20260523-D9-P2bc-before.json` / `-after.json`). 스크립트 본문 변경 0줄.

---

## §10 변경 이력

| 일자 | 작성 | 내용 |
|---|---|---|
| 2026-05-23 | core-coder | 본 보고서 신규 작성. D9 P2-b + P2-c + P2-a 이월 통합 — SSOT 3종 신설 (legacy-primary / brand-olive-muted / bg-hover) 라이트·다크 cascade 정착 + codemod R2_MG_ALIAS_BC_SAFE_PAIRS 21쌍 신설 + R2_V2_ALIAS_SAFE_PAIRS 1쌍 추가 (P2-a 이월) + COLOR_MAPPING legacy-primary/brand-olive-muted 4 라인 추가 (대문자 변형 포함). 흡수 78건 (mg-* BC 74 + mg-v2-* 3 + raw hex 1). HOLD 16건 (mg-* manual-review) + 20건 (mg-v2-* border-light/manual-review) D10 이월. count rawLine 1,481 → 1,423 (-58, 위임 기대 범위 -40~-90 정합). T-D 가드 38 PASS / 0 WARN / 0 ERROR / 0 🚨. 빌드 PASS. HARD_EXCLUDE / R-2 보호 패턴 / SSOT 흡수처 변경 0줄. 시각 회귀 위험 MEDIUM 6 영역 / LOW 5 영역 분류 (광역 영향 — primary/brand-olive/text-secondary 시프트). D8 PR-B 단계 1 / D9 P2-a 답습 패턴 정확 적용. |
