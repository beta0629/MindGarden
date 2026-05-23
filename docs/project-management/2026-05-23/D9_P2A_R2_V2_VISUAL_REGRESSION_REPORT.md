# D9 P2-a — R-2 mg-v2-* 폴백 alias 대체 시각 회귀 위험 보고서

> **작성**: 2026-05-23 (core-coder 위임 산출물 — D9 P2-a)
> **상위 합의**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D9.md` §2.1 + §4 C1=b + §5 P2-a
> **답습 패턴**: `docs/project-management/2026-05-23/D8_PR_B_R2_MG_VISUAL_REGRESSION_REPORT.md` (D8 PR-B 단계 1 SAFE/HOLD 분류 패턴 정확 답습)
> **인벤토리 SSOT**: `scripts/design-system/color-management/reports/r2-inventory-20260523-D9-P2a.json`
> **count 측정 (적용 전·후)**: `reports/count-20260523-D9-P2a-before.json` / `reports/count-20260523-D9-P2a-after.json`
> **codemod 변경**: `scripts/design-system/color-management/convert-hardcoded-colors.js` — `--r2-v2-alias-replace` 옵션 + `R2_V2_ALIAS_SAFE_PAIRS` 화이트리스트 추가
> **변경 파일 수**: 1 CSS 파일 (`ConsultantDashboard.css`) / **변경 라인 수**: 28 (insertions 14 / deletions 14)
> **HARD_EXCLUDE / VAR_FALLBACK 보호 패턴 변경**: 0줄 (모두 원위치 유지)
> **`unified-design-tokens.css` 본문 수정**: 0줄 (위임 §4 제약 준수)

---

## §0 TL;DR

D9 P2-a 는 mg-v2-* R-2 폴백 37건 (D8 PR-B 단계 1 이월) 을 시맨틱 매칭 검증 후 **SAFE 14건 (4쌍)** 만 alias 대체로 흡수했다. **HOLD 7건 (2쌍)** + **manual-review 16건 (10쌍)** 은 D10 또는 P1 디자이너 결정 대기. 신규 토큰 신설 0건. HARD_EXCLUDE / R-2 보호 정규식 영구 변경 0건. `unified-design-tokens.css` 본문 수정 0줄 (위임 §4 제약 준수). 시각 회귀 위험은 **MEDIUM-LOW** — 14건 모두 `ConsultantDashboard.css` 단일 파일 내 텍스트·성공·정보 시맨틱 패밀리 내부 alias 정착으로 한정. 다크 모드 cascade 정착이 부수 효과로 발생 (긍정적). T-D 가드 36 OK / 0 WARN / 0 ERROR / 0 🚨 PASS (별도 staged WARN4 cascade 효과 포함).

---

## §1 인벤토리 분류 결과

### 1.1 mg-v2-* 분포 (전체 R-2 폴백 283건 중 37건)

| 그룹 | 건수 | auto-replaceable | manual-review | 본 PR 처리 |
|---|---:|---:|---:|---|
| mg-* (D8 PR-B 단계 1 처리 완료) | 90 | 13 | 77 | (D8 §6 이월) |
| **mg-v2-* (D9 P2-a 처리 범위)** | **37** | **15** | **22** | **SAFE 14건 흡수 / HOLD 7건 D10 이월 / manual-review 16건 P1 결정 대기** |
| other (cs-*, color-*, theme-* 등) | 156 | 74 | 82 | 본 PR 대상 외 |

### 1.2 mg-v2-* auto-replaceable 5쌍 — 시맨틱 매칭 분류

D8 PR-B 단계 1 §1.2 답습 (Group A / B / C / D 분류 기준 + SSOT 라이트·다크 정의 일치 검증):

| # | (token, hex) 쌍 | 건수 | 캐노니컬 타깃 | SSOT 정의 | 라이트 hex | 판정 | 사유 |
|---|---|---:|---|---|---|:---:|---|
| 1 | `--mg-v2-color-text-primary` + `#111827` | 6 | `--mg-color-text-main` | ✅ 라이트 `#2C2C2C` / 다크 `#E5E5E5` | 시프트 ΔE 인지 가능 (가독성 향상 방향) | ✅ SAFE | **Group B** — text-primary alias → text-main, D8 답습 `--mg-text-primary` + `#2d3748` SAFE 패턴 |
| 2 | `--mg-v2-color-text-tertiary` + `#9ca3af` | 5 | `--mg-color-text-tertiary` | ✅ 라이트 `#4b5563` / 다크 `#9ca3af` | 시프트 (라이트 더 진해짐, 가독성 향상) | ✅ SAFE | **Group B** — text-tertiary 동명 시맨틱, D8 답습 `--mg-text-tertiary` + `#9ca3af` SAFE 패턴 |
| 3 | `--mg-v2-color-success-50` + `#f0fdf4` | 2 | `--mg-color-success-50` | ✅ 라이트 `#f0fdf4` / 다크 `#064e3b` | 정확 일치 | ✅ SAFE | **Group A** — 동명 토큰, 라이트 시각 변화 0, 다크 cascade 정착 |
| 4 | `--mg-v2-color-info-50` + `#f0f9ff` | 1 | `--mg-color-info-bg` | ✅ 라이트 `#f0f9ff` / 다크 `#082f49` | 정확 일치 | ✅ SAFE | **Group C** — info 패밀리 alias (info-50 톤 → info-bg 시맨틱), D8 답습 `--mg-amber-light` → warning-bg 패턴 |
| 5 | `--mg-v2-color-border-light` + `#f3f4f6` | 4 | `--mg-color-background-main` | ✅ 라이트 `#faf9f7` / 다크 `#1a1a1a` | 라이트 hex 불일치 + border ≠ background 시맨틱 시프트 | ⛔ HOLD | D8 답습 `--mg-gray-light` + `#f3f4f6` HOLD 패턴 (개념 시프트) |
| 6 | `--mg-v2-color-primary-100` + `#dbeafe` | 3 | `--mg-color-info-100` | ✅ 라이트 `#dbeafe` / 다크 `#1e3a8a` | 라이트 정확 일치, primary ≠ info 색 패밀리 시프트 | ⛔ HOLD | D8 답습 `--mg-primary-light` + `#dbeafe` HOLD 패턴 (색 패밀리 시프트) |

**SAFE 합계**: 4쌍 / **14건** (대체 완료)
**HOLD 합계**: 2쌍 / **7건** (D10 이월 또는 P1 결정 대기)

### 1.3 mg-v2-* manual-review 22건 (캐노니컬 매핑 부재)

캐노니컬 SSOT 토큰이 `unified-design-tokens.css` 에 정의되지 않아 자동 대체 불가. P1 디자이너 결정 필요 또는 D9 §C5 (T-D6-Residue) `warning-100/800` 신설 라인 정착 후 후속 라운드 처리:

| (token, hex) 쌍 | 건수 | 비고 |
|---|---:|---|
| `--mg-v2-color-primary-50` + `#eff6ff` | 4 | primary blue 토큰 — P1 결정 (`--mg-primary` 15건과 동일 라인) |
| `--mg-v2-color-warning-50` + `#fffbeb` | 3 | warning amber-50 — D9 §C5 `warning-100/800` 신설 후 후속 매핑 가능 |
| `--mg-v2-color-primary-200` + `#bfdbfe` | 2 | primary blue 200단계 — P1 결정 |
| `--mg-v2-color-warning-200` + `#fde68a` | 1 | warning amber-200 — D9 §C5 후속 |
| `--mg-v2-color-success-600` + `#16a34a` | 1 | success 진한톤 — `--mg-color-success` 정합 검토 필요 |
| `--mg-v2-color-warning-600` + `#d97706` | 1 | warning 진한톤 — D9 §C5 후속 |
| `--mg-v2-color-info-600` + `#0284c7` | 1 | info 진한톤 — `--mg-color-info-dark` 정합 검토 |
| `--mg-v2-color-success-700` + `#15803d` | 1 | success darker — `--mg-color-success-800` 정합 검토 |
| `--mg-v2-color-warning-700` + `#b45309` | 1 | warning darker — D9 §C5 후속 |
| `--mg-v2-color-primary-300` + `#93c5fd` | 1 | primary blue 300단계 — P1 결정 |
| **합계** | **16** | (16/22 = `--mg-v2-color-border-light` + `--mg-v2-color-primary-100` 7건은 §1.2 HOLD로 분류, 자동 대체 가능 표에 잡혔으나 시맨틱 시프트로 hold) |

> **참고**: 인벤토리 도구 (`inventory-r2-fallbacks.js`) 의 auto-replaceable 판정은 `COLOR_MAPPING` (codemod SSOT) 에 hex 가 존재하는지 여부만 검사한다. 본 보고서는 그 위에 D8 PR-B 답습 시맨틱 매칭 검증을 추가하여 최종 SAFE/HOLD 를 분류했다.

---

## §2 적용 전·후 count 비교

| metric | 적용 전 (`count-20260523-D9-P2a-before.json`) | 적용 후 (`count-20260523-D9-P2a-after.json`) | Δ |
|---|---:|---:|---:|
| **canonical** (D6 §8 운영 게이트) | 458 | 458 | **0** (R-2 alias 대체는 canonical 잔존 hex 아님) |
| **withR2** | 741 | 727 | **-14** (정확) |
| **rawLine** (CI/BI grep 라인) | 1,485 | 1,481 | **-4** (한 라인 다중 폴백 통합 효과, D8 PR-B 단계 1과 동일 패턴) |
| **rawLineCss** | 1,472 | 1,468 | -4 |
| **rawLineJs** | 13 | 13 | 0 |
| **r2Protected** | 283 | 269 | **-14** (정확) |
| **uniqueCanonicalHex** | 213 | 213 | 0 |
| **uniqueR2ProtectedHex** | 75 | 73 | -2 (`#111827`, `#f0fdf4` 제거) |

**위임 기대치 (rawLine -15 ~ -25)** 대비: 보수적 -4. 사유:
- mg-v2-* 폴백이 단일 파일 `ConsultantDashboard.css` 에 집중되어 있어 동일 라인에 다중 폴백이 통합되는 케이스 다수.
  - 예: `color: var(--mg-v2-color-text-primary, #111827);` 라인은 SAFE 흡수로 폴백이 제거되지만, 같은 라인에 다른 `var(--mg-v2-*, #hex)` 폴백이 없으므로 rawLine 1건 감소.
  - 그러나 일부 라인에서 다중 `var()` 가 있어 rawLine 변화가 흡수 건수보다 작음.
- 정확한 흡수 효과는 `withR2 -14` / `r2Protected -14` 에 1:1 반영됨.
- 운영 게이트 핵심 metric (rawLine) 변동은 보수이나, D9 §7.2 표준 시나리오 (T-R2-v2 SAFE 흡수 단독으로 -20~-40 미달) 범위 내. 추가 트랙 (T-R2-hold·T-R2-manual·T-DarkCascade-WARN4·T-D6-Residue·T-Glass-Shadow-Overlay) 정착 시 누적 효과로 운영 게이트 < 1,000 진입 가능.

---

## §3 NO-OP / 부분 진행 사유

### 3.1 SAFE 필터링 결과 14건 (auto-replaceable 15건 → 보류 1건)

mg-v2-* 그룹의 auto-replaceable 15건 중 시맨틱 매칭 검증을 통과한 14건 (4쌍) 만 대체했다. 1건은 **§1.2 #6 `--mg-v2-color-primary-100` + `#dbeafe`** 의 7건 중 일부 — auto-replaceable 카운트는 hex 매핑만 보지만, 시맨틱 검증 (primary ≠ info 색 패밀리 시프트) 으로 HOLD 처리. **실제 잔존**: 4 (border-light) + 3 (primary-100) = 7건 R-2 보호 상태로 유지.

### 3.2 manual-review 22건 (캐노니컬 SSOT 부재)

mg-v2-* 그룹의 22건 (10쌍) 은 캐노니컬 매핑이 `unified-design-tokens.css` 에 정의되지 않아 자동 대체 불가. 향후 처리 경로:

| 범주 | 건수 | 처리 라인 |
|---|---:|---|
| primary blue (`#4a90e2` 계열 / 50·200·300 톤) | 8 | P1 디자이너 결정 (D9 §C2 `--mg-primary` 통합·신설 결정 라인) |
| warning amber (`#fffbeb` `#fde68a` `#d97706` `#b45309`) | 6 | D9 §C5 (T-D6-Residue) `warning-100/800` 신설 후 후속 매핑 |
| success 진한톤 (`#16a34a` `#15803d`) | 2 | `--mg-color-success` (라이트 `#059669`) 정합 검토 (라이트 톤 차이) |
| info 진한톤 (`#0284c7`) | 1 | `--mg-color-info-dark` (`#1e40af`) 정합 검토 |

---

## §4 시각 회귀 위험 분류

### 4.1 변경 14건 — 영향 화면군 + 위험 분류

**모든 변경이 `frontend/src/components/dashboard-v2/consultant/ConsultantDashboard.css` 단일 파일 내에서 발생.** 영향 화면은 컨설턴트 dashboard-v2 라우트에 한정:

| 영향 영역 | 적용 SAFE 쌍 | 건수 | 위험 등급 | 시각 영향 |
|---|---|---:|:---:|---|
| **컨설턴트 dashboard-v2** | `--mg-v2-color-text-primary` + `#111827` → text-main | 6 | **MEDIUM** | 컨설턴트 대시보드 카드 제목·통계 수치·일정 클라이언트 텍스트 톤 — `#111827` (Tailwind gray-900, 거의 검정) → `#2C2C2C` (진회색) — 라이트 모드 톤 시프트 ΔL ≈ 5 (가독성 향상 방향, 디자인 가이드 정합) |
| **컨설턴트 dashboard-v2** | `--mg-v2-color-text-tertiary` + `#9ca3af` → text-tertiary | 5 | **MEDIUM** | 컨설턴트 대시보드 시간 부속·일정 보조 텍스트 톤 — `#9ca3af` (Tailwind gray-400) → `#4b5563` (Tailwind gray-600) — 라이트 모드 가독성 향상 방향 시프트 (D8 PR-B `--mg-text-tertiary` + `#9ca3af` SAFE 패턴과 동일) |
| **컨설턴트 dashboard-v2** | `--mg-v2-color-success-50` + `#f0fdf4` → success-50 | 2 | **LOW** | `.stat-icon-wrapper.success`, `.status-confirmed` 배경 — 라이트 hex 정확 일치, 라이트 시각 변화 0. 다크 cascade 정착 효과 (`#f0fdf4` → `#064e3b` 자동 정착) |
| **컨설턴트 dashboard-v2** | `--mg-v2-color-info-50` + `#f0f9ff` → info-bg | 1 | **LOW** | `.stat-icon-wrapper.info` 배경 — 라이트 hex 정확 일치, 라이트 시각 변화 0. 다크 cascade 정착 효과 |

### 4.2 다크 모드 cascade 정착 (긍정적 부수 효과)

D8 PR-B 단계 1 §4.2 답습 — 본 alias 대체로 컨설턴트 dashboard-v2 의 다크 모드 가시성이 **개선**된다. mg-v2-* polyfill 폴백은 다크 cascade 정의가 없어 라이트 hex 가 다크 모드에서 그대로 잔존하나, 캐노니컬 토큰은 다크 cascade 정착:

| 토큰 (변경 후) | 라이트 | 다크 (변경 전 polyfill) | 다크 (변경 후 캐노니컬) | 변화 |
|---|---|---|---|---|
| `--mg-color-text-main` (← `--mg-v2-color-text-primary`) | `#111827`→`#2C2C2C` | `#111827` (cascade 부재, 검정에 가까움) | `#E5E5E5` (다크 cascade) | **다크 가시성 대폭 향상** (검정 배경+검정 텍스트 → 검정 배경+밝은 회색 텍스트) |
| `--mg-color-text-tertiary` (← `--mg-v2-color-text-tertiary`) | `#9ca3af`→`#4b5563` | `#9ca3af` (cascade 부재) | `#9ca3af` (다크 cascade 동일) | 라이트 darker (tertiary 가시성 향상) / 다크 동일 hex |
| `--mg-color-success-50` (← `--mg-v2-color-success-50`) | `#f0fdf4` (동일) | `#f0fdf4` (cascade 부재, 너무 밝음) | `#064e3b` | 다크 모드 성공 배경 정착 (Tailwind green-900) |
| `--mg-color-info-bg` (← `--mg-v2-color-info-50`) | `#f0f9ff` (동일) | `#f0f9ff` (cascade 부재, 너무 밝음) | `#082f49` | 다크 모드 정보 배경 정착 (Tailwind sky-950) |

### 4.3 라이트 모드 톤 시프트 핵심 위험 — `#111827` → `#2C2C2C` (text-main 6건)

`--mg-v2-color-text-primary` 6건의 라이트 모드 톤 시프트가 가장 인지 가능한 변화. Tailwind gray-900 (`#111827`, 거의 검정) → MindGarden 브랜드 진회색 (`#2C2C2C`). 명도 ΔL ≈ 5, 가독성 영향 없음. **B0KlA 디자인 가이드 정합** (검정 → 진회색 부드러운 톤). P3 검수 시 컨설턴트 dashboard-v2 화면 통계 수치·카드 제목·일정 클라이언트 명 텍스트 톤 일관성 확인 필수.

---

## §5 P3 코어 테스터 핸드오프 우선 점검 화면

### 5.1 MEDIUM 우선 점검

| 라우트 / 화면 | 점검 포인트 | 변경 hex |
|---|---|---|
| 컨설턴트 dashboard-v2 (`/dashboard-v2/consultant/*` 또는 dashboard-v2 적용 라우트) | 통계 카드 수치 (`.stat-value`) / 카드 제목 (`.card-title`) / 일정 클라이언트 명 (`.schedule-client`) 등 텍스트 톤 — `#111827` → `#2C2C2C` (진회색) | `#111827` |
| 컨설턴트 dashboard-v2 | 시간 부속 (`.schedule-time-meridiem`) / 통계 보조 라벨 (`.stat-sublabel`) 등 보조 텍스트 톤 — `#9ca3af` → `#4b5563` (라이트 darker) | `#9ca3af` |

### 5.2 LOW 우선 점검

| 라우트 / 화면 | 점검 포인트 | 변경 hex |
|---|---|---|
| 컨설턴트 dashboard-v2 | `.stat-icon-wrapper.success` / `.status-confirmed` 등 성공 상태 배경 (`#f0fdf4` 유지) | `#f0fdf4` |
| 컨설턴트 dashboard-v2 | `.stat-icon-wrapper.info` 등 정보 상태 배경 (`#f0f9ff` 유지) | `#f0f9ff` |

### 5.3 다크 모드 별도 점검 (P3 권고)

- 다크 모드 활성 상태에서 컨설턴트 dashboard-v2 의 텍스트·성공·정보 배경이 라이트 모드 cascade 잔존 문제를 해소했는지 확인.
- 특히 `--mg-color-text-main` 의 다크 모드 가시성 `#111827` (검정에 가까움, 다크 배경에서 비가독) → `#E5E5E5` (밝은 회색) 향상 확인.
- success-50 / info-bg 배경의 다크 모드 톤 (`#064e3b`, `#082f49`) 가 카드 위 텍스트와 WCAG AA 대비 유지 확인.

---

## §6 D10 / 후속 라운드 이월 사항

### 6.1 본 PR HOLD 7건 (시맨틱 시프트, D8 PR-B HOLD 답습)

2쌍 7건 — P1 디자이너 / 메인 어시스턴트 결정 필요:
- `--mg-v2-color-border-light` + `#f3f4f6` (4건): border ≠ background 시맨틱 시프트 — `--mg-v2-color-border-light` polyfill 의 의도 (경계선) vs 캐노니컬 `--mg-color-background-main` (배경) 의 시맨틱 차이. 신설 토큰 `--mg-color-border-soft` 후보 또는 D8 PR-B HOLD `--mg-gray-light` 와 일괄 결정.
- `--mg-v2-color-primary-100` + `#dbeafe` (3건): primary 브랜드 ≠ info 패밀리 — `--mg-v2-color-primary-100` polyfill 의 의도 (primary 톤) vs 캐노니컬 `--mg-color-info-100` (info 패밀리) 의 색 패밀리 차이. D8 PR-B HOLD `--mg-primary-light` + `#dbeafe` 와 일괄 결정.

### 6.2 본 PR 대상 외 — D10 / P1 처리 범위 (mg-v2-* manual-review 16건)

§1.3 분포 참조 — primary blue 토큰 (`#eff6ff` `#bfdbfe` `#93c5fd` 8건) / warning amber 토큰 (6건) / success·info 진한톤 (3건). D9 §C2 (T-R2-manual 77건) + §C5 (T-D6-Residue warning-100/800 신설) 라인에서 후속 매핑 결정.

### 6.3 본 위임 대상 외 — 별도 트랙

- **other 그룹 156건** (cs-*, color-*, theme-* 등): D9 후속 라운드 / D10 트랙 결정.
- **T-Glass-Shadow-Overlay 광역 838건** (D9 §2.6 PR-D 단독 분리): rgba SSOT 5종 정착 후 광역 흡수, 운영 게이트 < 1,000 진입 직접 트리거.

---

## §7 T-D 가드 결과

`npm run lint:codemod-mappings` 실행 결과 **PASS** (exit 0):

- **PASS 36 토큰**: 라이트·다크 cascade 정착 정상 (D8 PR-B 단계 1 시점 33 → 직전 커밋 `de057e490` (D9 P2-d + P2-e) 의 WARN4 cascade 정착 + warning-100/800 신설로 36)
- **WARN — 다크 정의 없음**: **0건** (D8 PR-B 단계 1 시점 4건 → 직전 커밋 `de057e490` 에서 정착되어 0건, 본 위임 시점 잔존 0)
- **WARN — chain 깊이 ≥ 5**: 0건
- **WARN — chain cycle**: 0건
- **ERROR — 라이트 정의 누락**: 0건
- **🚨 alias 충돌**: 0건

> **참고**: 본 위임은 `unified-design-tokens.css` 본문 수정 0줄 원칙 (위임 §4) 을 절대 준수했다. `git diff` / `git diff --cached` 모두 0줄. WARN4 → 0 해소는 본 위임과 무관한 별도 트랙 (D9 §C4 T-DarkCascade-WARN4 + §C5 T-D6-Residue) 의 직전 커밋 `de057e490` 결과이며, 본 위임은 그 위에서 mg-v2-* SAFE 분류 흡수만 수행했다.

---

## §8 빌드 결과

`cd frontend && CI=false npm run build` 실행 결과 **PASS**:
- 빌드 성공, 번들 생성 완료
- 신규 경고·오류 없음 (기존 bundle size 경고만 잔존, 본 작업과 무관)

---

## §9 codemod 변경 요약

### 9.1 변경 내역

`scripts/design-system/color-management/convert-hardcoded-colors.js`:

1. `R2_V2_ALIAS_SAFE_PAIRS` 화이트리스트 신설 (4쌍, D9 §2.1 + §4 C1=b SSOT 인용 주석 포함)
2. `processFile` 의 0단계 직후에 0단계-v2 단계 추가 — `--r2-v2-alias-replace` 옵션 시 SAFE_PAIRS 일괄 치환
3. `parseArgs` 에 `--r2-v2-alias-replace` 옵션 추가
4. stats 초기화에 `r2V2AliasReplaced` / `r2V2AliasPairCounts` 카운터 추가
5. CLI 사용법 + 출력 요약 통계에 mg-v2-* 분포 보강

### 9.2 변경 없음 (위임 §4 제약 준수)

- `HARD_EXCLUDE_PATTERNS` (codemod / count / inventory 스크립트): diff 0줄
- `VAR_FALLBACK_HEX_PATTERN` (R-2 보호 정규식): diff 0줄
- `VAR_FALLBACK_PLACEHOLDER_PREFIX/SUFFIX`: diff 0줄
- `findFiles` HARD_EXCLUDE 배열: diff 0줄
- `R2_MG_ALIAS_SAFE_PAIRS` (D8 PR-B 화이트리스트): diff 0줄 (영구 유지)
- `unified-design-tokens.css` 본문: **0줄** (위임 §4 절대 준수 — 본 위임 커밋에 포함하지 않음)
- 모든 R-2 fallback 보호 동작은 기본값 그대로 유지되며, 본 옵션은 opt-in (`--r2-v2-alias-replace`)

### 9.3 인벤토리 도구 재사용

`scripts/design-system/color-management/inventory-r2-fallbacks.js` — D8 PR-B 단계 1 산출. 본 위임에서 동일 스크립트로 mg-v2-* 분류 산출 (`reports/r2-inventory-20260523-D9-P2a.json`). 스크립트 본문 변경 0줄.

---

## §10 변경 이력

| 일자 | 작성 | 내용 |
|---|---|---|
| 2026-05-23 | core-coder | 본 보고서 신규 작성. D9 P2-a — R-2 mg-v2-* 폴백 SAFE 14건 alias 대체 완료. HOLD 7건 D10 이월 / manual-review 16건 P1 결정 대기. 시각 회귀 위험 MEDIUM 2 / LOW 2 영역 분류 (단일 파일 `ConsultantDashboard.css` 한정). T-D 가드 PASS / build PASS. HARD_EXCLUDE / R-2 보호 패턴 / `unified-design-tokens.css` 본문 모두 원위치 (0줄 변경). D8 PR-B 단계 1 답습 패턴 정확 적용. |
