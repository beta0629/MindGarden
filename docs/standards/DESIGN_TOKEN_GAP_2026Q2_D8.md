# D8 합의서 — Pink2 토큰화 + Top100 잔존 흡수 + R-2 폴백 alias 대체 + text-main 다크 cascade (2026 Q2)

> **작성**: 2026-05-22 (core-planner 오케스트레이션)
> **유형**: 의사결정 합의서 (코드·D1~D7-2 SSOT 무수정, 분배 골격만)
> **상위 합의**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D7_2.md` §8 (D8 — T1-C 종결 가늠)
> **선행 라운드**: D7-2 PR-A 정착 (commit `1d1d2bb6f`, 2026-05-22) + PR-B 정착 (commit `d30b4cf9c`, 2026-05-22) — 신규 매핑 20쌍 + 총 93건 흡수, 운영 게이트 rawLine 1,644 → 1,571 (-73)
> **연계**: `docs/project-management/2026-05-22/D7_2_P1_DESIGN_HANDOFF.md`, `docs/project-management/2026-05-22/D7_2_PR_A_VISUAL_REGRESSION_REPORT.md`, `docs/project-management/2026-05-22/D7_2_PR_B_VISUAL_REGRESSION_REPORT.md`, `docs/COLOR_CONVERSION_REPORT.md`, `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`

---

## §0 결정 요약 (TL;DR)

D7-2 PR-B §10 D8 이월 권고 4건을 **D8 단일 합의서**로 통합 — 4 트랙(T-Pink2 / T-Top100 / T-R2 / T-TextMain-Dark) 병행 진행. 예상 codemod canonical 감축 -50 ~ -100건, **rawLine 감축 -200 ~ -400건 (R-2 폴백 alias 대체 확장 시 -343)**. 운영 게이트(rawLine) 시나리오: **보수 1,170 / 표준 1,070 / 확장 870~970 — 확장에서 < 1,000 진입 가능**. T-R2 R-2 폴백 343건 토큰 alias 대체는 의미 변경 위험으로 **단계적 적용** 권장. 사용자 컨펌 필요 항목 6건(§4).

---

## §1 현황 스냅샷

### 1.1 카운트 추이

| 라운드 | 적용 시점 | canonical | withR2 | rawLine | R-2 보호 | 라운드 감축 |
|---:|---|---:|---:|---:|---:|---:|
| D2~D4 | (Top 30 매핑 + 인프라) | 1,005 | — | ~1,800 | — | -1,395 누적 |
| D5 T-B 정착 | `86b663381` (테마·alias·success 통합) | 1,659 | — | 1,688 | — | +654 (재상승) |
| D6 P2-a 정착 | (정의 5종 신설, 흡수 D7 이월) | 662 | — | 1,688 | 343 | 0 |
| D7-1 정착 | `1ef15862c` (6쌍 + 22 파일) | 606 | 949 | 1,644 | 343 | -44 |
| **D7-2 PR-A 정착** | `1d1d2bb6f` (8쌍 + 45건 흡수) | 571 | — | 1,609 | 343 | -35 |
| **D7-2 PR-B 정착** | `d30b4cf9c` (12쌍 + 48건 흡수) | **523** | **866** | **1,571** | **343** | **-38** |
| **D8 목표 (본 합의서)** | (4 트랙 · 시나리오별) | **~470 ~ 500** | **~470 ~ 800** | **~870 ~ 1,170** | **0 ~ 343** | **-200 ~ -400** |

### 1.2 운영 게이트 metric SSOT (D7-2 §4.1 C5 결정 인용)

| metric | 현재 값 | 위상 |
|---|---:|---|
| **canonical** (D7-2 §1.2 SSOT) | **523** | 색상 트랙 진척 SSOT (codemod canonical, T1-C 종결 추적) |
| **withR2** | **866** | R-2 폴백 토큰화 진행도 보조 metric (R-2 343 흡수 후 → canonical에 근접) |
| **rawLine** | **1,571** | 운영 게이트 추적 metric (CI/BI `check-hardcode.sh` 호환, < 1,000 게이트) |
| **R-2 보호** | **343** | `var(--token, #hex)` 폴백 보호 (T-R2 흡수 대상) |

> **결론**: D7-2 정착 후 canonical/rawLine gap = 1,048 (rawLine 1,571 - canonical 523). 이 gap의 핵심은 (1) R-2 폴백 343건 + (2) 인라인 스타일·매직 라벨·URL 등 색상 외 광역 하드코딩. **D8은 (1) R-2 흡수**로 gap을 ~700 수준까지 단축 시도.

### 1.3 T-D 가드 정착 상태

D7-2 PR-B §5 인용: **26 매핑 / ✅21 / ⚠️5 / ❌0 / 🚨0** (운영 cascade 영향 없음).
- ⚠️5 WARN 토큰: `border-main` / `error` / `info` / `text-main` / `text-secondary` — 모두 라이트 정의만 존재, 다크 cascade 부재 또는 동일 hex 의도.
- T-TextMain-Dark 트랙에서 5건 일괄 결정 vs 분리 결정 (§4 C4 컨펌).

### 1.4 D7-2 흡수 효율 분석

| PR | 매핑 추가 | 흡수 건수 | rawLine 감축 | 흡수 효율 (rawLine/매핑) |
|---|---:|---:|---:|---:|
| PR-A | 8쌍 | 45건 | -35 (1,644→1,609) | 4.4 line/쌍 |
| PR-B | 12쌍 | 48건 | -38 (1,609→1,571) | 3.2 line/쌍 |
| **합계** | **20쌍** | **93건** | **-73** | **3.7 line/쌍** |

> **D8 가늠**: rawLine 흡수율 약 3~4 line/쌍. D8 신설 매핑 약 20~30쌍 예상 시 rawLine -60 ~ -120. **단, T-R2 폴백 alias 대체는 매핑 단위가 아닌 R-2 343건 일괄이므로 별도 계산** (§7).

---

## §2 트랙별 인벤토리

### §2.1 T-Pink2 (Pink 잔존 토큰화)

- **D7-2 PR-A 결과 잔존** (PR-B §10 §1 인용):
  - `#f472b6` (pink-400, PR-A 단일 치환 결과) — **10건**
  - `#fbcfe8` (pink-200, PR-A 그라데이션 페어 변환 결과) — **7건**
  - `#fb7185` (rose-400, PR-A 그라데이션 강조 변환 결과) — **잔존 ?건 (실측 grep 필요, P1 디자이너 책무)**
- **토큰화 결정 권고 (P1 디자이너)**:
  - 옵션 A: 개별 토큰 신설 (`--mg-color-pink-400` / `--mg-color-pink-200` / `--mg-color-rose-400`) + 다크 cascade 결정 (Tailwind 다크 모드 대응 hex 결정)
  - 옵션 B: 단일 그룹 토큰 (`--mg-color-accent-pink-{200,400}` + `--mg-color-accent-rose-400`) — 시맨틱 분리 가능
  - 옵션 C: 마인드가든 브랜드 통합 (`--mg-color-brand-pink-*`) — 브랜드 자산 편입
- **WCAG AA 사전 검증 필요 영역** (D7-2 P1 §1 인용): `pink-400`(#f472b6) on white 일반 텍스트 3.0:1 (AA 미달, Large Text PASS). 다크 cascade hex P1 결정 후 양방향 검증 필수.
- **codemod 영향**: 약 17~25건 (Pink2 3종 합계) → rawLine -17 ~ -25.

### §2.2 T-Top100 (Top 51~100 잔존 hex 추가 흡수)

- **count 스크립트 최신 리포트** (`reports/count-20260522-1121.json`, D7-2 PR-B 정착 후 재실행 권고): Top 20 외 51~100위 hex 분포 — D7-2 흡수 후 갱신 리포트 P1 디자이너 단계 실측 권고.
- **예상 후보** (D7-1 §8 + D7-2 P1 §4 권고 잔존 + count 리포트 frequency 5~9건):
  - `#f0f0f0` (9건, Tailwind gray-100 또는 표면 회색) — `--mg-color-surface-light` 신설 vs `--mg-color-background-muted` 통합
  - `#fbbf24` (8건, Tailwind amber-400) — 기존 `--mg-warning-500` 통합 (D6 §3.2 정의)
  - `#f8f9ff` (8건, indigo-50) — 기존 `--mg-color-info-bg` 통합 (D6 §3.2 정의)
  - `#e53e3e` (7건, Tailwind red-500) — 기존 `--mg-color-error-500` 또는 미세 톤 차 검증
  - `#e3f2fd` (6건, MUI blue-50) — `--mg-color-info-bg` 또는 신설 검토
  - `#7b68ee` (6건, MediumSlateBlue) — 외부 브랜드 색 또는 폐기 통합
  - `#b0e0e6` (6건, PowderBlue) — 표면 색, P1 분류 필요
  - 그 외 빈도 5~9건 약 30~40종 추가 잔존 추정 (실측 grep 권고)
- **신설 토큰 후보 수** (예상 3~5종, P1 결정) + ΔRGB 검증 (기존 토큰 통합 시).
- **codemod 영향**: 약 50~100건 (3종 신설 + 4건 통합 가정) → rawLine -50 ~ -100.

### §2.3 T-R2 (R-2 폴백 343건 토큰 alias 대체)

- **count 스크립트 r2ProtectedHex Top 10** (`reports/count-20260522-1121.json`):
  - `#666` (3자리) — **52건**
  - `#333` (3자리) — **24건**
  - `#4a90e2` (6자리, 구 primary blue) — **15건**
  - `#f5f3ef` (6자리, 따뜻한 표면) — **14건**
  - `#9ca3af` (6자리, Tailwind gray-400) — **14건**
  - `#999` (3자리) — 12건
  - `#4b745c` (6자리, brand-olive 변형) — 12건
  - `#f3f4f6` (6자리, Tailwind gray-100) — 11건
  - `#2d3748` (6자리, Tailwind gray-800) — 10건
  - `#4a6354` (6자리, brand-olive 변형) — 9건
- **R-2 폴백 형태** (D6 §6 R-2 보호 패턴 인용): `var(--mg-v2-color-primary-100, #dbeafe)` 등 — 토큰 fallback hex.
- **대체 권고**: 폴백 hex를 정착된 mg-* 토큰 직접 참조로 대체 (예: `var(--mg-v2-color-primary-100, #dbeafe)` → `var(--mg-color-info-100)` 단일).
- **위험 평가**:
  - **High**: 폴백 시점 의미가 다른 컴포넌트 (예: `#666` 52건이 모두 동일 시맨틱 보장 불가) — 의미 분류 후 단계적 대체
  - **Med**: `mg-v2-*` 폴백은 v2 alias 체인 깊음 — 대체 시 cascade 영향 광역
  - **Low**: `mg-*` 폴백 (1단계) — 직접 alias 대체 안전
- **`convert-hardcoded-colors.js` HARD_EXCLUDE 처리**: codemod로 R-2 폴백 흡수 시 HARD_EXCLUDE 패턴 일시 해제 → 매핑 → 보호 복구 (P2-c 신중 처리, 별도 PR 권장).
- **codemod 영향**: 단계적 (mg-* 폴백 우선) -100 ~ -200건, 일괄 (mg-v2-* 포함) -343건.

### §2.4 T-TextMain-Dark (text-main 다크 cascade 정착)

- **현황**: `--mg-color-text-main: #2C2C2C` 라이트만 정의, 다크 cascade 부재 (T-D 가드 WARN 5건 중 1건).
- **D7-2 PR-B §3.4 인용**: "다크 cascade에서는 P1 §4의 의도된 동일 hex 값을 적용하여 일관성 유지" — D7-2 P1 단계에서 의도된 동일 hex 결정 명시.
- **결정 권고 (P1 디자이너)**:
  - 옵션 (a): 의도된 동일 hex 유지 (`#2C2C2C` 라이트·다크 동일) — D7-2 P1 §4 명시 결정 그대로 SSOT 반영
  - 옵션 (b): 다크 cascade 분리 (`#E5E5E5` Tailwind gray-200 권고 또는 P1 결정 hex) — 다크 모드 가독성 향상
- **T-D 가드 WARN 5건 처리 정책**:
  - `text-main` 외 4건 (`border-main` / `error` / `info` / `text-secondary`) 함께 일괄 분리 vs 별도 라운드 분리 (§4 C4 컨펌)
- **codemod 영향**: 0 (정의만 추가, 사용처 흡수 불필요).

---

## §3 트랙별 우선순위·의존성

- **즉시 진행 가능 (병렬)**:
  - **T-Top100** (인벤토리 + 매핑 결정, P1 디자이너 후 P2-b 코더)
  - **T-R2** (HARD_EXCLUDE 일시 해제 + alias 대체 + 보호 복구, P2-c 코더 신중)
  - **T-TextMain-Dark** (단일 토큰 다크 cascade 결정, P1 후 P2-d 코더)
- **디자이너 컨펌 필요 (직렬 P1 → P2-a/b/d)**:
  - **T-Pink2** (3종 신설 hex + 다크 cascade + WCAG AA — P1 디자이너 필수)
  - **T-Top100** 신설 토큰 hex 결정 (3~5종)
  - **T-TextMain-Dark** (a vs b 결정)
- **시각 회귀 검수 게이트**:
  - 모든 트랙 codemod 흡수·수동 치환 후 `core-tester` PASS 후에만 운영 push
  - T-R2 단계적 적용 권장 시 단계별로 P3 검수 + 운영 push 반복
  - D7-2 §6 패턴 답습 (보고서 1장 + lint·build PASS)

---

## §4 사용자 컨펌 필요 항목 (D8 진입 전)

> **컨펌 일자**: 2026-05-22 (사용자 확정).

### C1. T-Pink2 토큰 구조 ✅ 확정
- **결정**: **개별 신설** — `--mg-color-pink-400` / `--mg-color-pink-200` / `--mg-color-rose-400` 3종 분리 (시맨틱 명확성 + Tailwind 명명 정합).
- **후속**: P1 디자이너 — 3종 라이트·다크 cascade hex 결정 + WCAG AA 양방향 검증.

### C2. T-Top100 신설 범위 ✅ 확정
- **결정**: **8종 확장** — 빈도 5~9건 hex 8종 신설/통합 + D6 §4 권고 잔존(`warning-100`/`warning-800`/`success-50`) 다크 매트릭스 정합 흡수까지 포함.
- **권장 8종 후보** (P1 디자이너 최종 결정):
  1. `#f0f0f0` (9건) — `--mg-color-surface-light` 신설
  2. `#fbbf24` (8건) — 기존 `--mg-warning-500` 통합 (ΔRGB 검증)
  3. `#f8f9ff` (8건) — 기존 `--mg-color-info-bg` 통합
  4. `#e53e3e` (7건) — 기존 `--mg-color-error-500` 또는 신설 `--mg-color-error-bright` 검증
  5. `#e3f2fd` (6건) — `--mg-color-info-bg` 또는 신설 `--mg-color-info-soft`
  6. `#7b68ee` (6건) — 신설 `--mg-color-accent-violet` 또는 폐기 통합
  7. `#b0e0e6` (6건) — 신설 `--mg-color-surface-blue-soft` 또는 통합
  8. D6 §4 잔존 1종 (`warning-100`/`warning-800`/`success-50` 중 P1 결정)
- **후속**: P1 디자이너 — 8종 hex·통합 매핑 결정 + ΔRGB 검증.

### C3. T-R2 대체 정책 ✅ 확정
- **결정**: **단계적 (mg-* 폴백 우선 D8 진행, mg-v2-* 폴백은 D9 이월)** — 폴백 의미 변경 시 광역 영향 최소화.
- **D8 처리 범위**: mg-* 폴백 한정 (~150건 추정, count 스크립트 분류 후 확정).
- **D9 이월**: mg-v2-* 폴백 (~193건 추정, cascade 영향 검증 후 별도 진행).
- **후속**: P2-c 코더 — HARD_EXCLUDE 일시 해제 → mg-* 폴백 분류 → alias 대체 → HARD_EXCLUDE 복구. PR-B 단일 PR로 push.

### C4. T-TextMain-Dark 결정 ✅ 확정
- **결정**: **text-main만 다크 cascade 분리** (`#E5E5E5` Tailwind gray-200 권고 또는 P1 결정 hex).
- **WARN 5건 중 나머지 4건** (`border-main`/`error`/`info`/`text-secondary`): **D9 이월** (별도 라운드에서 일괄 결정).
- **후속**: P1 디자이너 — text-main 다크 hex 결정 + WCAG AA(라이트·다크 양방향).

### C5. 운영 push 단위 ✅ 확정
- **결정**: **그룹 2 PR** — PR-A (T-Pink2 + T-Top100 + T-TextMain-Dark, 신설/통합 토큰 묶음) + PR-B (T-R2 mg-* 폴백 단계, 폴백 alias 대체 광역 위험 분리).
- **순서**: PR-A 운영 정착 + P3 PASS → PR-B 진행 (T-R2 위험 격리).

### C6. D8 완료 조건 ✅ 확정
- **결정**: **rawLine < 1,000 진입을 D8 목표로 설정**.
- **도달 가늠**: 확장 시나리오 (T-R2 mg-* 단계 1) 적용 시 ~1,170~1,370 (gap 170~370). **< 1,000 미달 시 D9에서 mg-v2-* 폴백 흡수로 추가 진입 시도**. D8 자체 완료 기준은 PR-A + PR-B 정착 + count 스크립트 측정값 보고.

---

## §5 분배실행 표 (위임 골격)

> **본 임무 범위 외**: 실제 위임은 사용자 컨펌(§4) 후 메인 어시스턴트가 수행. 본 표는 위임 시 사용할 골격.

| Phase | 책무 | 담당 서브에이전트 | 위임 프롬프트 골격 (요약) | 적용 스킬 | 모델 권장 |
|---|---|---|---|---|---|
| **P1** | §4 C1·C2·C4 디자이너 컨펌 | `core-designer` | (1) T-Pink2 3종 신설 hex (라이트·다크) + WCAG AA 검증. (2) T-Top100 5종 hex 결정 (신설 vs 통합) + ΔRGB 검증. (3) T-TextMain-Dark + WARN 5건 다크 cascade hex 결정 + WCAG AA. (4) count 스크립트 재실행 후 Top 51~100 분석. 완료 조건: P2-a~d 핸드오프 1장. | `/core-solution-design-system-css`, `/core-solution-design-handoff` | `gemini-3.1-pro` |
| **P2-a** | §2.1 T-Pink2 codemod 매핑·흡수 | `core-coder` | (1) `unified-design-tokens.css` 에 P1 신설 3종 라이트·다크 블록 추가. (2) `convert-hardcoded-colors.js` 매핑 3쌍 + 대문자 변형 6쌍 추가. (3) dry-run → 실행. 완료 조건: T-D 가드 PASS + canonical 감축 -17 ~ -25. | `/core-solution-frontend`, `/core-solution-standardization` | 기본 |
| **P2-b** | §2.2 T-Top100 codemod 매핑·흡수 | `core-coder` | (1) `unified-design-tokens.css` 에 P1 신설 2~3종 + 통합 매핑 3~4건. (2) `convert-hardcoded-colors.js` 매핑 5~8쌍 추가. (3) dry-run → 실행. 완료 조건: T-D 가드 PASS + canonical 감축 -50 ~ -100. | `/core-solution-frontend`, `/core-solution-standardization` | 기본 |
| **P2-c** | §2.3 T-R2 폴백 alias 대체 (단계적) | `core-coder` | (1) `convert-hardcoded-colors.js` HARD_EXCLUDE 패턴 일시 해제 + R-2 폴백 hex 분류 (mg-* vs mg-v2-*). (2) mg-* 폴백만 alias 대체 codemod 실행 (단계 1). (3) HARD_EXCLUDE 복구. (4) 단계 1 검수 PASS 후 mg-v2-* 폴백 단계 2 별도 진행. 완료 조건: rawLine 감축 -100 ~ -343 (단계별). | `/core-solution-frontend`, `/core-solution-standardization` | 기본 |
| **P2-d** | §2.4 T-TextMain-Dark + WARN 5건 다크 cascade 정착 | `core-coder` | P1 결정 hex 적용 → `unified-design-tokens.css` `[data-theme="dark"]` 블록에 5건 (`text-main`/`border-main`/`error`/`info`/`text-secondary`) 다크 cascade 추가. 완료 조건: T-D 가드 WARN 0건 + 빌드 PASS. | `/core-solution-frontend` | 기본 |
| **P3** | §6 시각 회귀 검수 | `core-tester` | P2-a~d 적용 후 (1) §6 우선 점검 화면 UAT (Pink wellness/client/admin + Top100 영향 + R-2 광역 영향 + 다크 모드 텍스트 가독성). (2) 라이트·다크 cascade 정합 확인. (3) T-R2 단계적 적용 시 단계별 검수. 완료 조건: HIGH 0건. | `/core-solution-testing` | `gemini-3.1-pro` |
| **P4** | 운영 push (§4 C5 결정 단위) | `core-deployer` | (P3 PASS 후) 그룹 2 PR (또는 T-R2 단계별 추가) 분리 push → 운영 게이트 카운트 측정 (count 스크립트 + CI/BI). 완료 조건: rawLine < 1,000 진입 또는 시나리오 §7 도달 수준 보고. | `/core-solution-deployment` | 기본 |

> **검증 게이트 (필수)**: P2 코드 변경은 P3 `core-tester` 통과 전 P4 진행 금지 (`CORE_PLANNER_DELEGATION_ORDER.md` 강제 규칙).
> **병렬 가능**: P1 (디자이너 컨펌) 와 P2-c (T-R2 mg-* 단계 1) 는 의존성 무 → 병렬 가능 (단, T-R2는 HARD_EXCLUDE 해제 위험 검토 후). P2-a·b·d 는 P1 후 직렬.

---

## §6 시각 회귀 위험·core-tester 우선 점검 화면

| 트랙 | 영향 화면군 | 위험 분류 |
|---|---|---|
| T-Pink2 (Pink2 3종 ~17~25건) | wellness/client/admin (D7-2 PR-A 영향 영역 답습 — WellnessNotification/WelcomeSection/ClientSchedule/SystemTools) — Pink 흡수 후 토큰화로 인한 톤 정합 | **Med** (그라데이션 페어 토큰화 후 다크 cascade 검수) |
| T-Top100 (5종 ~50~100건) | gray-100 surface (회색 배경 사용처), info cascade (정보 알림·MUI 잔재), warning amber (경고 메시지) | **Med** (신설 토큰 ΔRGB 차 + 광역 사용처) |
| T-R2 (343건 폴백 대체) | `#666`/`#333` 76건 — 전 페이지 보조 텍스트, `#4a90e2` 15건 — 구 primary, `#f5f3ef` 14건 — 따뜻한 표면, `#9ca3af` 14건 — gray-400 텍스트 — **광역** | **High** (가장 큰 위험 — 폴백 의미 변경 시 광범위 영향, 단계적 적용 필수) |
| T-TextMain-Dark + WARN 5건 | 모든 텍스트 사용처 (text-main 다크 모드 가시성), border/error/info 다크 cascade 신규 정착 | **Med** (다크 모드 사용자 가시성, WCAG AA 검증 필수) |
| 다크 모드 cascade | D6 P2-a 정착 + D7-2 신설 + D8 신설 토큰 다크 톤 정합 | Low (D7-2 PR-B PASS 기반, 신설 토큰만 신규 검수) |
| D5 §1 background cascade | 더블 체크 (T-R2 표면 hex 대체 시 background-main/muted/sub cascade 영향) | **Med** (T-R2 한정, P3 필수 검수) |

---

## §7 운영 게이트 진입 시나리오

### 7.1 카운트 계산 (D8 적용 전)

- **canonical**: 523 (D7-2 PR-B §8 실측)
- **withR2**: 866 (D7-2 PR-B 후 count 스크립트 실측, R-2 343 포함)
- **rawLine**: 1,571 (D7-2 PR-B §8 실측)
- **R-2 보호**: 343 (D6 §6 R-2 보호 패턴 정착)

### 7.2 예상 감축 시나리오

| 시나리오 | 적용 트랙 | canonical 감축 | rawLine 감축 | 적용 후 canonical | 적용 후 rawLine | < 1,000 진입 |
|---|---|---:|---:|---:|---:|:---:|
| **보수** | T-Pink2 + T-Top100 3종 + T-TextMain-Dark (정의만) | -27 ~ -50 | -50 ~ -100 | ~470 ~ 500 | **~1,470 ~ 1,520** | ❌ (gap 470~520) |
| **표준** | + T-Top100 5종 확장 | -50 ~ -100 | -100 ~ -200 | ~430 ~ 480 | **~1,370 ~ 1,470** | ❌ (gap 370~470) |
| **확장 (mg-* 단계)** | + T-R2 mg-* 폴백 단계 1 (~150건 추정) | (변동 없음) | -100 ~ -200 | ~430 ~ 480 | **~1,170 ~ 1,370** | ⚠️ (gap 170~370) |
| **확장 일괄 (343건)** | + T-R2 mg-v2-* 포함 일괄 | (변동 없음) | -343 | ~430 ~ 480 | **~870 ~ 970** | ✅ (확장 일괄 시 < 1,000 진입 가능) |

### 7.3 목표

- **D8 적용 목표**: rawLine < 1,000 진입 (확장 일괄 시나리오) + canonical < 500. **미도달 시 D9 이월** (잔존 hex < 100 + D6 §4 잔존 `warning-100/warning-800/success-50` + 다크 매트릭스 완전성).

---

## §8 후속 라운드 (D9 가늠)

| 라운드 | 시점 가늠 | 트리거 | 주요 책무 | 비고 |
|---|---|---|---|---|
| **D9 (T1-C 종결)** | D8 적용 후 (~2주 내) | rawLine < 1,000 진입 또는 잔존 hex < 100 도달 | (1) 잔존 hex Top 101~200 일괄 흡수 (2) 다크모드 매트릭스 완전성 (D6 §4 권고 `warning-100/warning-800/success-50` 신설) (3) T-R2 mg-v2-* 폴백 잔존 처리 (D8 단계적 시 이월분) | 운영 게이트 < 500 (장기 목표) |
| **D10 (디자인 시스템 자산 갱신)** | D9 정착 후 | T1-C 종결 + 디자이너 D5 후속 결정 | `mindgarden-design-system.pen` 자산 갱신 (B0KlA 팔레트 확장 + 다크 매트릭스 SSOT 일원화) | T1 전체 트랙 종결 + 신규 라운드 진입 |
| **i18n Phase 2.1c** | D8과 무관 진행 가능 | i18n 트랙 별도 결정 | clinical + client Top 100 라벨 i18n | T-C 별도 트랙, 색상 트랙과 충돌 없음 |
| **다크모드 UAT 후속** | D8 신설 토큰 정착 후 | 임상 모듈 활성화 또는 사용자 보고 | 임상 모듈 UAT (RiskAlert/SOAP/Diagnostic/Audio) 신설 토큰 다크 cascade 정합 | T-B §5 발견 자동 차단 해제 시점 |

---

## §9 변경 이력

| 일자 | 작성 | 내용 |
|---|---|---|
| 2026-05-22 | core-planner | D8 합의서 신규 작성. 4 트랙(T-Pink2 / T-Top100 / T-R2 / T-TextMain-Dark) 통합 — Pink2 3종 신설(`pink-400`/`pink-200`/`rose-400`, ~17~25건) / Top100 5종 신설+통합(~50~100건) / R-2 폴백 343건 단계적 alias 대체 / text-main + WARN 5건 다크 cascade 일괄 정착. 사용자 컨펌 6건(§4). 운영 게이트 rawLine < 1,000 진입은 확장 일괄 시나리오(T-R2 343건 전체 흡수)에서 가능(~870~970), 단계적 적용 시 D9 이월 명시. |
| 2026-05-22 | main-assistant | §4 사용자 컨펌 6건 확정 기록. C1 개별 신설(`pink-400`/`pink-200`/`rose-400`) / C2 8종 확장(D6 §4 잔존 1종 포함) / C3 단계적(mg-* 우선 D8, mg-v2-* D9 이월) / C4 text-main만 다크 분리(WARN 4건 D9 이월) / C5 그룹 2 PR / C6 rawLine < 1,000 목표. P1 디자이너(`gemini-3.1-pro`) 위임 개시. |
