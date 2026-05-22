# D6 합의서 — 잔존 hex Top 20 매핑 + 다크모드 토큰 표준화 + L-1 SSOT 단일화 (2026 Q2)

> **작성**: 2026-05-22 (core-planner 오케스트레이션)
> **유형**: 의사결정 합의서 (코드·D1~D5 SSOT 무수정, 분배 골격만)
> **상위 합의**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_DIRECTION.md` §7 (D6 다크모드 토큰 표준화)
> **입력 (3건)**:
> - T-A 트랙 결과 (정규식 인프라 정착·매핑 hex 잔존 0건, codemod 재실행만으로는 < 1,000 진입 불가)
> - T-B 시각 회귀 검수 (`docs/project-management/2026-05-22/T_B_VISUAL_REGRESSION_REPORT.md` §4.2 L-1)
> - D5 §7 후속 라운드 권장 (D6 ~4주 시점)
> **연계**: `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`, `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D4.md` §6

---

## §0 결정 요약 (TL;DR)

- **3개 책무 합산**: (1) 잔존 hex Top 20 매핑 합의 + (2) success/error/warning/info × 50/100/500/800/dark 다크모드 톤 표준화 + (3) L-1 SSOT 단일화 (`--mg-color-background-main` 유지, `--mg-color-background-base` 폐기 권장).
- **예상 카운트 감축**: 직접 매핑 Top 20 × 평균 ~9건 = **-150 ~ -250건** (R-2 폴백 343건 미보호, 실 codemod 영향).
- **운영 게이트 < 1,000 진입 시나리오**: T-B 정착 1,659 → D6 적용 후 1,409 ~ 1,509 (warn 통과 보장 ≠ 자동, gap 추가 라운드 필요).
- **사용자 컨펌 필요**: §9 — 5건 (Pink accent 신설 여부, Bootstrap 잔재 폐기 범위, 다크모드 일괄 vs 분할, L-1 SSOT 선택, NAVER green `#03c75a` 처리).

---

## §1 현황 스냅샷

### 1.1 카운트 추이

| 라운드 | 적용 시점 | 적용 후 카운트 | 라운드 감축량 | 운영 게이트 (warn < 1,000) |
|---:|---|---:|---:|:---:|
| 기준선 | D2 적용 이전 | ~2,400 | — | ❌ |
| **D2** | (10건 매핑, gray 계열) | ~1,801 | -599 | ❌ |
| **D3** | (10건 매핑 + 3자리 정규화) | ~1,670 | -131 | ❌ |
| **D4** | `267755325` (10건 + 인프라) | 1,005 | -665 | ⚠️ gap 6 |
| **D5 T-B 정착** | `86b663381` (테마 고도화·alias·success 통합) | **1,659** | **+654** | ❌ (재상승) |
| **D6 목표 (본 합의서)** | (Top 20 + 다크 표준화 + L-1) | **1,409 ~ 1,509** | -150 ~ -250 | ⚠️ gap 409 ~ 509 |

> **재상승 사유 (D5 T-B → 1,659)**: T-B alias 5종 분리·success 통합 후 잔존 hex 스캐너의 R-2 폴백 분류 기준이 재계산되며 노출된 신규 잔존 (Tailwind/Bootstrap 잔재 + 미매핑 브랜드 톤). 운영 화면 시각 변동 0건 (T-B 보고서 §4 PASS), 운영 게이트 카운트만 영향.

### 1.2 L-1 관찰사항 (T-B §4.2)

`--mg-color-background-main` (R-3 핫픽스 잔존, 라이트 `#faf9f7` / 다크 `#1a1a1a`) 와 `--mg-color-background-base` (D5 §1 신설, 라이트 `#FAF9F7` / 다크 `#1A1A1A`) **값 동일**.
- 사용량 측정: `var(--mg-color-background-main)` **60+ 파일 (100+건)** vs `var(--mg-color-background-base)` **1 파일 / 3건** (`Homepage.css`).
- 시각 영향 0건 (값 동일, 폴백 체인 정상 작동) — **SSOT 중복**만 잔존.

### 1.3 다크모드 토큰 일관성 현황

| 카테고리 | 라이트 50/100/500/800 | 다크 50/100/500/800 | bg | -dark | 50 | 일관성 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `success` | ✅ (`--cs-success-*` alias) | ⚠️ cascade only (별도 다크 정의 부재) | ❌ | ⚠️ D5 통합 (`--mg-color-success` = `#059669` / dark `#6ee7b7`) | ❌ | **부분** |
| `error` | ✅ (`--cs-error-*` alias) | ⚠️ cascade only | ✅ `--mg-color-error-bg` (D3) | ✅ `--mg-color-error-dark` (D4) | ✅ `--mg-color-error-50` (D4) | **양호** |
| `warning` | ✅ (`--cs-warning-*` alias) | ⚠️ cascade only | ✅ `--mg-color-warning-bg` (D3) | ❌ | ❌ | **부분** |
| `info` | ✅ (`--cs-blue-*` alias) | ⚠️ cascade only | ✅ `--mg-color-info-bg` (D5) | ✅ `--mg-color-info-dark` (D5) | ❌ | **부분** |

> **요약**: D3·D4·D5에 걸쳐 `-bg`/`-50`/`-dark`가 단편적으로 추가됐으나 카테고리 4종 × 단계 5종 (총 20 토큰) 매트릭스의 완전성 부재. D6에서 **누락 톤 신설 + 다크 톤 cascade 분기 정합 합의**가 책무 2.

---

## §2 잔존 hex Top 20 인벤토리 (책무 1)

**측정**: `node scripts/design-system/color-management/convert-hardcoded-colors.js --dry-run` (2026-05-22, T-B 정착 commit `86b663381` 기준).
- 처리 파일 1,425개 / 잔존 고유 238종 / 총 662건 / R-2 폴백 보호 343건 별도.

### 2.1 Top 20 결정표

| 순위 | hex | 건수 | 추정 출처 | 권장 결정 | 결정값 (토큰) |
|---:|---|---:|---|---|---|
| 1 | `#1a202c` | 13 | Tailwind gray-900 | **A. 기존 통합** | `var(--mg-color-text-main)` |
| 2 | `#4a5568` | 12 | Tailwind gray-700 | **A. 기존 통합** | `var(--mg-color-text-secondary-dark)` |
| 3 | `#065f46` | 10 | Tailwind emerald-800 | **B. 신설** | `var(--mg-color-success-800)` |
| 4 | `#ff6b9d` | 10 | Pink accent (mood-journal 마음날씨 가능성) | **컨펌 필요 (C1)** | (보류) — `var(--mg-color-pink-accent)` 신설 vs 폐기 |
| 5 | `#dee2e6` | 10 | Bootstrap gray-300 | **C. 폐기 통합** | `var(--mg-color-border-main)` |
| 6 | `#856404` | 10 | Bootstrap warning-dark | **B. 신설** | `var(--mg-color-warning-dark)` |
| 7 | `#9caf88` | 10 | Olive-green 인근 (brand-olive `#6b7c32` 변형) | **C. 폐기 통합** | `var(--mg-color-brand-olive)` (D5 §3 공식 편입) |
| 8 | `#fecaca` | 9 | Tailwind red-200 | **B. 신설** | `var(--mg-color-error-100)` (시맨틱 100) |
| 9 | `#d1fae5` | 9 | Tailwind emerald-100 | **B. 신설** | `var(--mg-color-success-100)` (시맨틱 100) |
| 10 | `#92400e` | 9 | Tailwind amber-800 | **A. 기존 통합** | `var(--mg-color-warning-dark)` (#6과 동일) |
| 11 | `#721c24` | 9 | Bootstrap danger-dark | **C. 폐기 통합** | `var(--mg-color-error-dark)` (D4 정착) |
| 12 | `#d4edda` | 9 | Bootstrap success-light | **C. 폐기 통합** | `var(--mg-color-success-100)` (#9과 동일) |
| 13 | `#f0f0f0` | 9 | 회색 표면 (Tailwind neutral) | **A. 기존 통합** | `var(--mg-color-background-muted)` (D5 §1) |
| 14 | `#3498db` | 9 | Flat UI blue | **C. 폐기 통합** | `var(--mg-primary-500)` |
| 15 | `#1d4ed8` | 9 | Tailwind blue-700 | **B. 신설** | `var(--mg-color-info-dark)` (D5 정착, `#1e40af`와 통합 / 미세 차) |
| 16 | `#d2b48c` | 9 | Tan/Beige (브랜드 잔재 가능) | **R-2 보호 유지** | (시각 회귀 위험, 후속 라운드) |
| 17 | `#f8f9ff` | 8 | Indigo-50 | **A. 기존 통합** | `var(--mg-color-info-bg)` (D5 정착, `#f0f9ff`와 통합 / 미세 차) |
| 18 | `#dbeafe` | 8 | Tailwind blue-100 | **B. 신설** | `var(--mg-color-info-100)` (시맨틱 100) |
| 19 | `#fbbf24` | 8 | Tailwind amber-400 | **A. 기존 통합** | `var(--mg-warning-500)` |
| 20 | `#03c75a` | 7 | NAVER green (인증 위젯) | **컨펌 필요 (C5)** | (보류) — 브랜드 외부 색 / `var(--mg-color-naver-green)` 신설 vs 폐기 |

**합계**: 직접 매핑 13건 + 신설 5건 + 컨펌 보류 2건 + R-2 보호 유지 1건 / 위 20개 합 총 사용 **184건**.

---

## §3 새 매핑 정의안 (책무 1 후속)

### 3.1 신설 토큰 (`unified-design-tokens.css` 추가분 — 본 합의서는 정의안만)

```css
/* 2026 Q2 D6 합의서 신규 토큰 */
:root {
  /* 시맨틱 100/800 톤 보강 */
  --mg-color-success-100: #d1fae5;   /* Tailwind emerald-100 (D6 §3) */
  --mg-color-success-800: #065f46;   /* Tailwind emerald-800 (D6 §3) */
  --mg-color-error-100: #fecaca;     /* Tailwind red-200 (D6 §3, 시맨틱 100 슬롯) */
  --mg-color-info-100: #dbeafe;      /* Tailwind blue-100 (D6 §3) */
  --mg-color-warning-dark: #856404;  /* Bootstrap warning-dark / Tailwind amber-800 (D6 §3) */
}

/* 다크 모드 오버라이드 (§4 매트릭스) */
:root[data-theme="dark"] {
  --mg-color-success-100: #064e3b;   /* emerald-900 — 다크 배경 위 옅은 톤 */
  --mg-color-success-800: #6ee7b7;   /* emerald-300 — 다크 강조 대비 (D5 success 다크와 정합) */
  --mg-color-error-100: #7f1d1d;     /* red-900 — 다크 배경 위 옅은 톤 */
  --mg-color-info-100: #1e3a8a;      /* blue-900 — 다크 배경 위 옅은 톤 */
  --mg-color-warning-dark: #fde68a;  /* amber-200 — 다크 강조 대비 */
}
```

### 3.2 기존 토큰 통합 (codemod 매핑만, 토큰 정의 무변경)

- `#1a202c` → `var(--mg-color-text-main)` (Tailwind gray-900은 어드민 헤더 텍스트 잔재)
- `#4a5568` → `var(--mg-color-text-secondary-dark)` (D2 §1 정의 활용)
- `#92400e` → `var(--mg-color-warning-dark)` (#6과 동일 신설 토큰 재사용)
- `#f0f0f0` → `var(--mg-color-background-muted)` (D5 §1 정착)
- `#fbbf24` → `var(--mg-warning-500)` (기존 시스템 토큰)
- `#f8f9ff` → `var(--mg-color-info-bg)` (D5 정착, `#f0f9ff`로 단일화 — 미세 톤 차 -8(R)/0(G)/+6(B) 수용)
- `#1d4ed8` → `var(--mg-color-info-dark)` (D5 정착, `#1e40af`로 단일화 — 미세 톤 차 -1(R)/-12(G)/+19(B), WCAG AA 유지)

### 3.3 폐기·R-2 보호 유지 결정

- **폐기 통합 (Bootstrap/Flat UI 잔재)**: `#dee2e6` → border-main, `#721c24` → error-dark, `#d4edda` → success-100, `#3498db` → primary-500.
- **brand-olive 흡수**: `#9caf88` → `var(--mg-color-brand-olive)` (`#6b7c32` D5 §3 공식 편입). 미세 톤 차 (ΔRGB ~36/29/2) — **사용처가 마케팅 배너·뱃지 한정이면 흡수 가능, 본문 텍스트면 별도 olive-light 신설** (§9 C2 컨펌).
- **R-2 보호 유지**: `#d2b48c` (#16) — 사용처 8건, Tan/Beige 톤. brand 팔레트 신설 또는 후속 라운드 결정 보류.
- **컨펌 보류 (§9)**: `#ff6b9d` (#4 Pink accent), `#03c75a` (#20 NAVER green).

---

## §4 다크모드 토큰 표준화 (책무 2)

### 4.1 success/error/warning/info × 50/100/500/800/dark 매트릭스 (목표)

| 카테고리 | 50 (라이트 / 다크) | 100 (라이트 / 다크) | 500 (라이트 / 다크) | 800 (라이트 / 다크) | dark 시맨틱 (라이트 / 다크) |
|---|---|---|---|---|---|
| **success** | `--mg-success-50` (existing / cascade) | **신설** `#d1fae5 / #064e3b` | `--mg-success-500` (`#059669` / `#6ee7b7` D5 통합) | **신설** `#065f46 / #6ee7b7` | (success-800 흡수) |
| **error** | `--mg-color-error-50` (`#fef2f2 / #450a0a` D4 정착) | **신설** `#fecaca / #7f1d1d` | `--mg-error-500` (existing / cascade) | `--mg-error-800` (existing / cascade) | `--mg-color-error-dark` (`#991b1b / #fca5a5` D4 정착) |
| **warning** | **(미정 — §9 C3)** | (cs-warning-100 cascade) | `--mg-warning-500` (existing / cascade) | (cs-warning-800 cascade) | **신설** `#856404 / #fde68a` |
| **info** | `--mg-color-info-bg` (`#f0f9ff / #082f49` D5 정착, 50 슬롯 alias) | **신설** `#dbeafe / #1e3a8a` | `--mg-info-500` (existing / cascade) | `--mg-info-800` (existing / cascade) | `--mg-color-info-dark` (`#1e40af / #bae6fd` D5 정착) |

> **표준화 목표**: 신설 토큰 4종 + bg/-50 alias 정합 + warning-dark 신설 1종 = **총 신설 5종** (§3.1 코드 블록). 누락 톤 미신설 시 후속 라운드(D7)로 이월.

### 4.2 라이트·다크 대응표 (요약)

| 토큰 | 라이트 hex | 다크 hex | 출처 |
|---|---|---|---|
| `--mg-color-success-100` (신설) | `#d1fae5` | `#064e3b` | Tailwind emerald-100/900 |
| `--mg-color-success-800` (신설) | `#065f46` | `#6ee7b7` | Tailwind emerald-800/300 (다크 = D5 success 다크와 정합) |
| `--mg-color-error-100` (신설) | `#fecaca` | `#7f1d1d` | Tailwind red-200/900 |
| `--mg-color-info-100` (신설) | `#dbeafe` | `#1e3a8a` | Tailwind blue-100/900 |
| `--mg-color-warning-dark` (신설) | `#856404` | `#fde68a` | Bootstrap warning-dark / amber-200 (다크) |

### 4.3 다크모드 UAT 우선 점검 화면

1. 임상 모듈 `RiskAlertBadge` (success-100/error-100 신설 영향 가능)
2. 어드민 메인 대시보드 (`/admin`) — success/info 톤 매트릭스 정착 확인
3. `SOAPNoteEditor` — error-100 신설 영향 가능 (T-B §5 발견대로 빌드 미포함 시 영향 0)

---

## §5 L-1 SSOT 단일화 (책무 3)

### 5.1 결정

- **유지 (SSOT)**: `--mg-color-background-main` (라이트 `#faf9f7` / 다크 `#1a1a1a`).
- **폐기**: `--mg-color-background-base` (D5 §1 신설, 사용처 3건 한정).

### 5.2 결정 근거

| 축 | `--mg-color-background-main` | `--mg-color-background-base` |
|---|---|---|
| 사용처 수 | **60+ 파일 / 100+ 건** | 1 파일 / 3 건 (`Homepage.css`) |
| 도입 라운드 | R-3 핫픽스 (codemod 매핑 SSOT) | D5 §1 (alias 5종 분리) |
| 폴백 체인 잔존 | weekend td 폴백 체인 종착점 | 단순 페이지 배경 |
| 마이그레이션 비용 | 폐기 시 60+ 파일 영향 | 폐기 시 1 파일 3건 영향 |
| 시각 영향 | (둘 다 값 동일, ΔRGB 0) | (둘 다 값 동일, ΔRGB 0) |

### 5.3 마이그레이션 가이드

- **Step 1**: codemod 매핑에 `'var(--mg-color-background-base)' → 'var(--mg-color-background-main)'` 추가 (텍스트 치환).
- **Step 2**: `unified-design-tokens.css` 에서 `--mg-color-background-base` 라이트/다크 블록 4줄 삭제 (alias 4종은 main 폴백 체인 유지).
- **Step 3**: D5 §1 alias 5종 (`surface-main/background-muted/background-secondary/background-sub`)은 그대로 유지 — `--mg-color-background-base` 폐기는 단일 토큰 정리에 한정.

### 5.4 회귀 위험 평가

- 값 동일 (`#faf9f7` ≡ `#FAF9F7`, `#1a1a1a` ≡ `#1A1A1A`) → 시각 영향 0건.
- 폴백 체인 (`color-mix → background-main → surface-main`) 변경 없음.
- 위험 분류: **None** (SSOT 정리 가치만 있음).

---

## §6 codemod 매핑 갱신안

`scripts/design-system/color-management/convert-hardcoded-colors.js` 에 추가할 항목 (D4 §3 형식, 본 합의서는 정의안만):

```js
// 2026 Q2 D6 합의서 매핑 (SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D6.md §2·§3·§5)

// A. 기존 토큰 통합 (5건) — 시맨틱 정합
'#1a202c': 'var(--mg-color-text-main)',          // Tailwind gray-900 → 메인 텍스트
'#4a5568': 'var(--mg-color-text-secondary-dark)', // Tailwind gray-700 → D2 보조 텍스트
'#92400e': 'var(--mg-color-warning-dark)',        // amber-800 → D6 신설 통합
'#f0f0f0': 'var(--mg-color-background-muted)',    // 회색 표면 → D5 muted
'#fbbf24': 'var(--mg-warning-500)',               // amber-400 → 기존 warning

// 미세 톤 차 통합 (ΔRGB ≤ 20, WCAG AA 유지 확인)
'#f8f9ff': 'var(--mg-color-info-bg)',  // Indigo-50 → D5 info-bg 통합
'#1d4ed8': 'var(--mg-color-info-dark)', // blue-700 → D5 info-dark 통합

// B. 신설 토큰 (5건) — §3.1 정의안
'#d1fae5': 'var(--mg-color-success-100)',
'#065f46': 'var(--mg-color-success-800)',
'#fecaca': 'var(--mg-color-error-100)',
'#dbeafe': 'var(--mg-color-info-100)',
'#856404': 'var(--mg-color-warning-dark)',

// C. 폐기 통합 (4건) — Bootstrap/Flat UI 잔재 흡수
'#dee2e6': 'var(--mg-color-border-main)',   // Bootstrap gray-300
'#721c24': 'var(--mg-color-error-dark)',    // Bootstrap danger-dark → D4 정착
'#d4edda': 'var(--mg-color-success-100)',   // Bootstrap success-light → D6 신설
'#3498db': 'var(--mg-primary-500)',         // Flat UI blue → 기존 primary
'#9caf88': 'var(--mg-color-brand-olive)',   // Olive 변형 → D5 §3 공식 편입 (C2 컨펌 시)

// L-1 SSOT 단일화 (§5)
// 주의: 토큰 정의 파일은 HARD_EXCLUDE 로 자동 보호되므로 사용처에서만 치환됨.
// (Homepage.css 등 1 파일 / 3건 영향)
// 별도 매핑 키로는 처리 불가 (변수명 치환은 codemod 범위 밖) → 별도 sed/shell 스크립트 분리 필요.
// 본 합의서는 분리 작업으로 정의 (§10 분배실행 표 코더 P2 참조).
```

### 6.1 T-D 가드 통과 시뮬레이션

- 신설 토큰 5종 (`success-100/success-800/error-100/info-100/warning-dark`) 모두 §3.1 코드로 `unified-design-tokens.css` 라이트·다크 블록에 동시 정의 → `check-token-ssot.js` cross-check 통과 보장.
- alias 충돌 없음 (동일 hex → 다중 `--mg-color-*` 매핑 없음).
- 미세 톤 차 통합 2건 (`#f8f9ff` / `#1d4ed8`) → 시각 회귀 검토 필요 (§7).

---

## §7 시각 회귀 위험·core-tester 우선 점검 화면

### 7.1 영향 화면 grep (실측 권장)

| 매핑 | 영향 추정 화면 | 위험 분류 |
|---|---|---|
| `#1a202c` (13건) → text-main | 어드민 헤더 텍스트, 모달 제목 | **Med** (텍스트 가독성, RGB 거리 ~16) |
| `#4a5568` (12건) → text-secondary-dark | 폼 라벨, 보조 텍스트 | Low (D2 정착 토큰 재사용) |
| `#065f46` / `#d1fae5` (success 100·800 신설) | 임상 모듈 (Audio/RiskAlert), 결제 성공 뱃지 | Low (T-B §5 임상 빌드 미포함) |
| `#856404` / `#92400e` (warning-dark 신설) | 경고 메시지, 권한 미달 안내 | **Med** (warning 다크 텍스트 신규 정착) |
| `#f8f9ff` → info-bg / `#1d4ed8` → info-dark | 정보 알림 배경, 링크 hover | **Med** (미세 톤 차 통합, WCAG AA 검증 필요) |
| `#9caf88` → brand-olive | 마케팅 배너, 프리미엄 뱃지 | **Med** (사용처 컨텍스트 컨펌 필요, §9 C2) |
| `#3498db` → primary-500 | Flat UI 잔재 컴포넌트 (대시보드 위젯) | **Med** (브랜드 primary 톤 차 ~10) |

### 7.2 다크모드 표준화 영향 영역

- 임상 모듈 (RiskAlertBadge/SOAPNoteEditor) — T-B §5 발견대로 빌드 미포함, 운영 영향 0.
- 어드민 대시보드 다크 토글 시 success/error/info 100 톤 신규 정착 → UAT 권장.

### 7.3 L-1 단일화 영향

- **시각 영향 0건** (값 동일).
- `Homepage.css` 3건 텍스트 치환만 — 단순 변수명 변경.

---

## §8 운영 게이트 진입 시나리오

### 8.1 카운트 계산

- **D6 적용 전**: 1,659 (T-B 정착, T-B 보고서 §1.1)
- **Top 20 직접 매핑 (13건 + 신설 5건 + 폐기 4건) × 평균 사용 9.2건**: -184 ~ -200
- **L-1 단일화 효과**: -3 (Homepage.css)
- **다크모드 표준화 효과 (간접)**: 0 (정의만 추가, 사용처는 후속 라운드 codemod 시 흡수)

### 8.2 적용 후 예상 카운트

| 시나리오 | 적용 항목 | 적용 후 카운트 | 게이트 (warn < 1,000) |
|---|---|---:|:---:|
| **보수** | Top 20 중 컨펌·R-2 보호 제외 (13건만 적용) | ~1,540 | ❌ |
| **표준** | Top 20 전체 매핑 + L-1 단일화 | **~1,400 ~ 1,470** | ❌ (gap 400~470) |
| **확장** | 표준 + Top 50까지 매핑 확장 + brand-olive 흡수 | ~1,100 ~ 1,250 | ❌ (gap 100~250) |
| **목표** | 위 + 후속 D7 (Top 50~100 + warning matrix 완전성) | **~900 ~ 1,000** | ✅ (D7 라운드 필요) |

> **결론**: D6 단독으로는 **운영 게이트 < 1,000 진입 불가**. D6은 **Top 20 정리 + 다크모드 매트릭스 정합 + L-1 SSOT 단일화**에 집중하고, **< 1,000 진입은 D7 (잔존 hex Top 50~100 일괄 흡수)** 로 분리 권장.

---

## §9 사용자 컨펌 필요 항목

### C1. Pink accent (`#ff6b9d`, 10건) — 신설 vs 폐기
- **질문**: 사용처가 mood-journal 마음날씨 위젯이면 `--mg-color-pink-accent` 신설, 아니면 폐기.
- **권장**: 사용처 grep 후 mood-journal 한정 시 **신설** (B0KlA 마음날씨 톤 정합).

### C2. brand-olive 흡수 범위 (`#9caf88`, 10건)
- **질문**: D5 §3 brand-olive (`#6b7c32`) 와 미세 톤 차 (ΔRGB ~36/29/2) 흡수 vs `--mg-color-brand-olive-light` 신설.
- **권장**: 사용처 컨텍스트 (마케팅 배너 vs 본문) 확인 후 결정. 마케팅 한정 시 흡수 안전.

### C3. Bootstrap 잔재 일괄 폐기 가능 여부
- **질문**: `#dee2e6` (gray-300, 10건) / `#721c24` (danger-dark, 9건) / `#d4edda` (success-light, 9건) — 같은 컴포넌트군에서 사용 중인지, 일괄 폐기 시 Bootstrap UI 라이브러리 의존 컴포넌트 확인 필요.
- **권장**: `core-coder` 사용처 인벤토리 후 일괄 폐기 확정.

### C4. 다크모드 표준화 시점 — D6 일괄 vs D7 분리
- **질문**: success/error/warning/info × 50/100/500/800/dark 매트릭스 완전성을 **D6 일괄** 도입 vs **D7 분리** (D6은 누락 톤 5종만 신설, 매트릭스 정합은 D7).
- **권장**: **D6에서 신설 5종 + 매트릭스 정합 합의**만 (정의 추가), 사용처 codemod 흡수는 D7. (시각 회귀 위험 최소화)

### C5. L-1 SSOT 단일화 — main vs base
- **질문**: `--mg-color-background-main` 유지 vs `--mg-color-background-base` 유지.
- **권장**: **main 유지·base 폐기** (사용처 60+ vs 3, 마이그레이션 비용 압도적 차이).

### C6. NAVER green (`#03c75a`, 7건)
- **질문**: NAVER 로그인 위젯 외부 브랜드 색 → 브랜드 가이드 외 색이므로 `--mg-color-naver-green` 신설 vs Tailwind emerald 흡수.
- **권장**: 사용처가 NAVER OAuth 버튼 한정이면 **신설** (외부 브랜드 가이드 준수 의무).

### 9.1 사용자 컨펌 결과 (2026-05-22)

| 항목 | 결정 | 메모 |
|---|---|---|
| C1 | **Pink accent 폐기·Tailwind 흡수** (조건부 분기 결과, 2026-05-22 P1 핸드오프) | P1 디자이너 사용처 grep 결과 mood-journal 외 wellness/dashboard/admin 전반 사용 → 한정 조건 미충족 → **폐기·Tailwind pink-400(`#f472b6`)·pink-500(`#ec4899`) 흡수**. P2-a codemod 매핑에서 `--mg-color-pink-accent` 신설 제외. |
| C2 | **brand-olive-light 신설** | 미세 톤 차(ΔRGB ~36/29/2) 흡수 대신 `--mg-color-brand-olive-light` 신설로 팔레트 확장. D5 §3 brand-olive 본체와 명도/채도 차 명시 필요. |
| C3 | **Bootstrap 잔재 일괄 폐기** | `core-coder` 사용처 인벤토리 후 `#dee2e6` → `border-main` / `#721c24` → `error-dark` / `#d4edda` → `success-light` 일괄 치환. Bootstrap UI 라이브러리 의존 컴포넌트 검출 시 P3 tester 보고. |
| C4 | **D6은 신설 5종 + 매트릭스 정합 합의만, codemod 흡수는 D7 분리** | 시각 회귀 위험 최소화. D6 P2-a에서 `unified-design-tokens.css` 정의만 추가, 사용처 흡수·치환은 D7에서 일괄. |
| C5 | **main 유지·base 폐기** | `--mg-color-background-main` 유지, `--mg-color-background-base` 폐기 + `Homepage.css` 3건 변수명 치환. 값 동일 → 시각 영향 0건. |
| C6 | **NAVER green 신설 (조건부)** | NAVER OAuth 버튼 한정이면 `--mg-color-naver-green` 신설. P1 디자이너 사용처 검증 후 확정. |

**P1 디자이너 핸드오프 핵심**: C1·C6 사용처 grep + Pink/brand-olive-light/NAVER hex 라이트·다크 cascade 결정 + 다크 매트릭스 신설 5종(`success-100/success-800/error-100/info-100/warning-dark`) hex 확정. **C4 결정에 따라 D6 P2-a는 정의 추가만, 사용처 codemod 흡수는 D7로 이월**.

---

## §10 분배실행 표 (위임 골격)

> **본 임무 범위 외**: 실제 위임은 사용자 컨펌(§9) 후 메인 어시스턴트가 수행. 본 표는 위임 시 사용할 골격.

| Phase | 책무 | 담당 서브에이전트 | 위임 프롬프트 골격 (요약) | 적용 스킬 | 모델 권장 |
|---|---|---|---|---|---|
| P1 | §9 컨펌 (C1~C6) | `core-designer` | (1) `#ff6b9d` / `#9caf88` / `#03c75a` 사용처 grep 결과 분석 → 신설 vs 흡수 결정. (2) Bootstrap 잔재 사용처 컨텍스트 확인. (3) 다크모드 매트릭스 신설 5종 (`success-100/success-800/error-100/info-100/warning-dark`) hex 결정. 완료 조건: §9 6건 컨펌 결과 1장. | `/core-solution-design-system-css`, `/core-solution-design-handoff` | `gemini-3.1-pro` |
| P2-a | §2·§3·§6 코드 적용 | `core-coder` | (1) `unified-design-tokens.css` 에 §3.1 신설 5종 라이트·다크 블록 추가. (2) `convert-hardcoded-colors.js` 에 §6 매핑 12~14건 추가 (P1 컨펌 결과 반영). (3) `--mg-color-background-base` 정의 4줄 삭제 + `Homepage.css` 3건 변수명 치환. 완료 조건: T-D 가드 통과 + dry-run 잔존 hex 카운트 -184 ~ -200. | `/core-solution-frontend`, `/core-solution-standardization` | 기본 |
| P2-b | §5 L-1 단일화 | `core-coder` | (P2-a와 직렬) `--mg-color-background-base` 사용처 (`Homepage.css` 3건) → `--mg-color-background-main` 일괄 치환. 완료 조건: grep으로 `background-base` 0건 확인 + 빌드 정상. | `/core-solution-frontend` | 기본 |
| P3 | §7 시각 회귀 검수 | `core-tester` | (1) D6 매핑 적용 후 운영 빌드 산출물 동일성 검증 (cmp). (2) §7.1 표 영향 화면 7건 UAT (어드민 헤더/폼 라벨/임상 뱃지/경고 메시지/정보 알림/마케팅 배너/Flat UI 위젯). (3) 라이트·다크 양방향 신설 5종 hex 정착 확인 + 미세 톤 차 통합 2건 (`#f8f9ff`/`#1d4ed8`) WCAG AA 검증. 완료 조건: HIGH 0건. | `/core-solution-testing` | `gemini-3.1-pro` |
| P4 | 운영 push | `core-deployer` | (P3 PASS 후) GitHub Actions 트리거 → 운영 배포 → 운영 hardcoding 게이트 카운트 확인. 완료 조건: 카운트 1,400 ~ 1,500 진입 (목표 < 1,000은 D7로 이월). | `/core-solution-deployment` | 기본 |

> **검증 게이트 (필수)**: P2 코드 변경은 P3 `core-tester` 통과 전 P4 진행 금지 (`CORE_PLANNER_DELEGATION_ORDER.md` 강제 규칙).
> **병렬 가능**: P1 (디자이너 컨펌) 과 P2-b (L-1 단일화) 는 의존성 무 → 병렬 진행 가능.

---

## §11 후속 라운드 (D7 가늠)

| 라운드 | 시점 가늠 | 트리거 | 주요 책무 | 비고 |
|---|---|---|---|---|
| **D7 (Top 50 흡수)** | D6 적용 후 (~2주 내) | D6 정착·시각 회귀 0건 확인 | 잔존 hex 21~50위 일괄 매핑 + warning matrix 완전성 (warning-50/500/800 다크 cascade 분기) + Pink/NAVER 외부 브랜드 확정 | 운영 게이트 < 1,000 진입 목표 (gap ~500 흡수) |
| **D8 (T1-C 종결)** | D7 후 또는 R-2 폴백 343건 처리 시 (~4주 내) | 잔존 hex < 100건 도달 | R-2 폴백 hex 343건 일괄 처리 (var() 폴백 → 토큰 alias 대체) + T1 전체 트랙 종결 | 운영 게이트 < 500 (장기 목표) |
| **i18n Phase 2 진입** | D5 §6 C5 권고 (a) "T-B 완료 직후" | 색상 트랙 안정화 | `I18N_ADOPTION_STRATEGY_2026Q2.md` 별도 합의서 신설 후 진입 | T-C 별도 트랙, D6/D7과 무관 진행 가능 |
| **다크모드 UAT 후속** | D6 다크 신설 5종 정착 후 (~1주 내) | 임상 모듈 활성화 또는 사용자 보고 | 임상 모듈 UAT 1회 (RiskAlert/SOAP/Diagnostic/Audio) | T-B §5 발견 자동 차단 해제 시점 |

---

## 12. 변경 이력

| 일자 | 작성 | 내용 |
|---|---|---|
| 2026-05-22 | core-planner | D6 합의서 신규 작성. 3개 책무 합산 — Top 20 매핑(13+신설5+폐기4+컨펌2+R-2보호1) / 다크 매트릭스(신설5종 §3.1) / L-1 단일화(main 유지). 사용자 컨펌 6건(§9). 운영 게이트 < 1,000은 D7로 이월 명시. |
