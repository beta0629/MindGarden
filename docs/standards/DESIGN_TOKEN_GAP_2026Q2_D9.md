# D9 합의서 — R-2 잔존 분류 흡수 + WARN4 다크 cascade + D6 매트릭스 보강 + rgba SSOT 정착 (2026 Q2)

> **작성**: 2026-05-23 (core-planner 오케스트레이션)
> **유형**: 의사결정 합의서 (코드·D1~D8 SSOT 무수정, 분배 골격만)
> **상위 합의**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D8.md` §8 (D9 — T1-C 종결 가늠) + §4 C3·C4 이월
> **선행 라운드**: D8 PR-A 정착 (commit `1d97d41f7`, 운영 main) + D8 PR-B 단계 1 정착 (commit `9518d040c`, develop) — mg-* alias SAFE 60건 흡수, 운영 게이트 rawLine 1,544 → 1,485 (-59)
> **연계**: `docs/project-management/2026-05-23/D8_PR_B_R2_MG_VISUAL_REGRESSION_REPORT.md`, `docs/project-management/2026-05-23/D8_PR_B_AND_D5_P1B_VISUAL_REGRESSION_REPORT.md`, `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`

---

## §0 결정 요약 (TL;DR)

D8 PR-B 단계 1 정착 후속으로 **D9 단일 합의서**에 6 트랙 통합 — (T-R2-v2 / T-R2-manual / T-R2-hold / T-DarkCascade-WARN4 / T-D6-Residue / T-Glass-Shadow-Overlay). 단계별 codemod 흡수량은 트랙 구성에 따라 rawLine **-30 ~ -900건** (Glass/Shadow/Overlay rgba SSOT 정착 시 한 번에 -800 이상 가능). 운영 게이트(rawLine) 시나리오: **보수 ~1,450 / 표준 ~1,400 / 확장 ~600~700 — 확장(rgba SSOT 정착) 시 < 1,000 진입 확실**. 사용자 컨펌 필요 항목 6건(§4).

---

## §1 현황 스냅샷

### 1.1 카운트 추이

| 라운드 | 적용 시점 | canonical | withR2 | rawLine | R-2 보호 | 라운드 감축 |
|---:|---|---:|---:|---:|---:|---:|
| D7-2 PR-B | `d30b4cf9c` (12쌍 + 48건) | 523 | 866 | 1,571 | 343 | -38 |
| **D8 PR-A** | `1d97d41f7` (Pink2·Top100·TextMain-Dark) | **458** | **801** | **1,544** | **343** | **-27** |
| **D8 PR-B 단계 1** | `9518d040c` (mg-* alias SAFE 60건) | **458** | **741** | **1,485** | **283** | **-59** (rawLine) |
| **D9 목표 (본 합의서)** | (6 트랙 · 시나리오별) | **~430 ~ 458** | **~530 ~ 700** | **~600 ~ 1,450** | **~150 ~ 283** | **-30 ~ -900** |

### 1.2 운영 게이트 metric (D7-2 §4.1 C5 SSOT)

| metric | 현재 값 | 위상 |
|---|---:|---|
| **canonical** | **458** | 색상 트랙 진척 SSOT (codemod canonical) |
| **withR2** | **741** | R-2 폴백 토큰화 진행도 보조 metric (R-2 283 흡수 후 → canonical 근접) |
| **rawLine** | **1,485** | 운영 게이트 추적 metric (CI/BI `check-hardcode.sh` 호환, < 1,000 게이트) |
| **R-2 보호** | **283** | `var(--token, #hex)` 폴백 보호 (D9 단계별 흡수 대상 잔존) |

> **결론**: D8 PR-B 단계 1 정착 후 canonical/rawLine gap = 1,027. 잔존 gap 핵심은 (1) R-2 폴백 283건 (mg-* HOLD/manual + mg-v2-* + other 그룹), (2) **rgba(W, α)·rgba(B, α) ~838건** (D5 P3 권고 잔존, T-Glass-Shadow-Overlay 트랙 대상), (3) 인라인/매직 라벨 잔존. **확장 시나리오는 rgba SSOT 정착 1회로 < 1,000 진입 가능**.

### 1.3 T-D 가드 정착 상태 (D8 PR-B 단계 1 후)

D8 PR-B 단계 1 §7 인용: **33 OK / 4 WARN / 0 ERROR / 0 🚨** — 운영 cascade 영향 없음.
- WARN 4 토큰: `--mg-color-border-main` / `--mg-color-error` / `--mg-color-info` / `--mg-color-text-secondary` — 라이트 정의만 존재, 다크 cascade 부재.
- **T-DarkCascade-WARN4 트랙에서 4건 일괄 정착** (§4 C4 컨펌).

---

## §2 트랙별 인벤토리

### §2.1 T-R2-v2 (mg-v2-* 폴백 37건 흡수)

- **D8 §4 C3 이월**: mg-v2-* 폴백은 cascade 영향 검증 후 D9 별도 처리 명시.
- **상위 쌍** (인벤토리 `r2-inventory-20260523-1135.json` 인용):
  - `--mg-v2-color-text-primary` 6건 / `--mg-v2-color-text-tertiary` 5건 / `--mg-v2-color-primary-50` 4건 / `--mg-v2-color-border-light` 4건 / 기타 12쌍 18건
- **위험 평가**: `mg-v2-*` alias 체인 깊음 (v2 → v1 → 캐노니컬), 단순 alias 대체 시 cascade 분기 영향 가능. D8 PR-B 단계 1 답습 (SAFE 14쌍 화이트리스트) 분류 권고.
- **codemod 영향**: SAFE 필터 후 -15 ~ -25건 (전체 37건 중 보수 분류).

### §2.2 T-R2-manual (manual-review 77건 디자이너 결정)

- **D8 PR-B 단계 1 §3.2 인용**: 캐노니컬 매핑 부재로 자동 대체 불가. P1 디자이너 결정 필요.
- **상위 후보 3쌍 (37건)**:
  - `--mg-primary` + `#4a90e2` — **15건**: 구 primary blue. 폐기 통합(`--mg-color-primary-500`) vs 신설 토큰(`--mg-color-legacy-primary`) vs WCAG AA 검증 후 결정.
  - `--mg-color-surface-main` + `#f5f3ef` — **8건**: 따뜻한 표면색. 신설 토큰 `--mg-color-surface-warm` 후보 또는 D5 §1 `--mg-color-surface-main` SSOT 흡수.
  - `--mg-color-primary-light` + `#4a6354` — **8건**: brand-olive 변형. 기존 `--mg-color-brand-olive-light` 흡수 vs 별도 분리.
- **기타 25쌍 40건**: `--mg-text-secondary` + `#64748b` 4건 / `--mg-primary-light` + `#4f6b5a` 4건 등 (D9 P1 디자이너 일괄 검토).
- **codemod 영향**: P1 결정에 따라 -30 ~ -70건.

### §2.3 T-R2-hold (D8 PR-B HOLD 13건 시맨틱 시프트)

- **D8 PR-B 단계 1 §6.1 인용**: 7쌍 13건 시맨틱 시프트 위험으로 D9 이월:
  - `--mg-bg-hover` + `#f3f4f6` (4건) — hover 상태 vs base bg 시프트
  - `--mg-text-tertiary` + `#666` (3건) — tier 시프트 (tertiary → secondary)
  - `--mg-primary-light` + `#dbeafe` (2건) — 브랜드 → info 패밀리 시프트
  - 기타 4건 (`pipeline-card-bg` 1, `gray-light` 1, `color-primary-light` + `#e3f2fd` 1, `gray-100` 1)
- **결정 옵션**:
  - (a) 시맨틱 시프트 허용 — 캐노니컬 통합 (`background-main`/`text-secondary`/`info-100`)
  - (b) 신설 토큰 분리 (`--mg-color-bg-hover`/`--mg-color-text-tertiary-dim` 등) — 시맨틱 보존
  - (c) 케이스별 분리 결정 (4 + 3 + 2 + 4)
- **codemod 영향**: -13건 (전건 흡수).

### §2.4 T-DarkCascade-WARN4 (4 토큰 다크 cascade 정착)

- **D7-2 §1.3 + D8 §4 C4 이월 + D8 PR-B 단계 1 §7 인용**: `--mg-color-border-main` / `--mg-color-error` / `--mg-color-info` / `--mg-color-text-secondary` 4건 다크 cascade 부재.
- **결정 권고 (P1 디자이너)**: 라이트·다크 cascade hex 결정 + WCAG AA 양방향 검증:
  - `border-main` 라이트 `#D4CFC8` → 다크 권고 hex (`#3A3A3A` 또는 P1 결정)
  - `error` 라이트 `#dc2626` → 다크 권고 hex (`#fca5a5` 또는 P1 결정)
  - `info` 라이트 `#3b82f6` → 다크 권고 hex (`#93c5fd` 또는 P1 결정)
  - `text-secondary` 라이트 `#5C6B61` → 다크 권고 hex (`#9CA3AF` 또는 P1 결정)
- **codemod 영향**: 0 (정의만 추가, 사용처 흡수 불필요). T-D 가드 WARN 0건 도달.

### §2.5 T-D6-Residue (D6 §4 잔존 다크 매트릭스)

- **D6 §4 인용**: 다크모드 매트릭스 잔존 — `warning-100` / `warning-800` 신설 미완 (D8에서 `success-50` 흡수 완료).
- **신설 후보**:
  - `--mg-color-warning-100`: 라이트 `#fef3c7` (Tailwind amber-100) / 다크 `#78350f` (Tailwind amber-900) — D6 §4 권고
  - `--mg-color-warning-800`: 라이트 `#92400e` (Tailwind amber-800) / 다크 `#fde68a` (Tailwind amber-200) — D6 §4 권고
- **WCAG AA 검증**: P1 디자이너 양방향 대비비 검증 필수.
- **codemod 영향**: 신설 매핑 추가 시 -5 ~ -15건 (잔존 hex 사용처 흡수).

### §2.6 T-Glass-Shadow-Overlay (rgba SSOT 정착 + 일괄 흡수)

- **D5 P3 권고 잔존 인용** (`docs/COLOR_CONVERSION_REPORT.md` §RGB/RGBA): 5종 SSOT 정착안 (라이트·다크 cascade 결정 필요):
  - `--mg-glass-bg-light` ← `rgba(255, 255, 255, 0.25)`
  - `--mg-glass-bg-medium` ← `rgba(255, 255, 255, 0.35)`
  - `--mg-glass-bg-strong` ← `rgba(255, 255, 255, 0.45)`
  - `--mg-shadow-medium` ← `rgba(0, 0, 0, 0.15)`
  - `--mg-overlay` ← `rgba(0, 0, 0, 0.5)`
- **확장 흡수 가늠**: 정착 후 `rgba(255, 255, 255, α)` + `rgba(0, 0, 0, α)` 류 약 **245종 hex 변형 / 838건** 일괄 codemod 매핑 추가 가능 (P1 디자이너 α 단계 cascade 결정 후).
- **위험 평가**:
  - **High**: glass morphism α 단계가 컴포넌트별 시각 의도와 다를 수 있음 — P3 검수 광역 필수
  - **Med**: shadow α 단계 시프트 시 그림자 깊이 차 인지 가능
  - **Low**: overlay α 0.5 단일 hex로 표준화 안전
- **codemod 영향**: SSOT 5종 정착 + 매핑 추가 시 **-300 ~ -800건** (단계 분류에 따라). 단일 토큰 흡수 라운드 1회만으로 < 1,000 진입 확실.

---

## §3 트랙별 우선순위·의존성

- **즉시 진행 가능 (병렬)**:
  - **T-R2-v2** (SAFE 분류 후 alias 대체, P2-a 코더 신중)
  - **T-R2-hold** (P1 디자이너 결정 후 P2-c 코더)
  - **T-DarkCascade-WARN4** (P1 후 P2-d 코더, 정의만 추가)
  - **T-D6-Residue** (P1 후 P2-e 코더, 신설 + 매핑)
- **디자이너 컨펌 필요 (직렬 P1 → P2)**:
  - **T-R2-manual** (77건 P1 일괄 검토 — 정책 결정 우선)
  - **T-Glass-Shadow-Overlay** (SSOT 5종 라이트·다크 cascade hex + α 단계 정합 — P1 디자이너 필수)
- **시각 회귀 검수 게이트**:
  - 모든 트랙 codemod 흡수·수동 치환 후 `core-tester` PASS 후에만 운영 push
  - T-Glass-Shadow-Overlay 는 광역 영향(838건)이므로 **단계적 PR 분리 권장**
  - D8 PR-B 단계 1 §6 패턴 답습 (보고서 1장 + lint·build PASS)

---

## §4 사용자 컨펌 필요 항목 (D9 진입 전)

### C1. T-R2-v2 진행 범위
- **질문**: mg-v2-* 폴백 37건 (a) 일괄 alias 대체 vs (b) D8 PR-B 단계 1 답습 SAFE 분류 후 단계적 vs (c) D10 추가 이월.
- **권장**: **(b) SAFE 분류 후 단계적** — cascade 분기 검증 후 안전 15~25건만 흡수.

### C2. T-R2-manual 상위 후보 처리
- **질문**: `--mg-primary` + `#4a90e2` (15건) / `--mg-color-surface-main` + `#f5f3ef` (8건) / `--mg-color-primary-light` + `#4a6354` (8건) 처리 정책.
- **권장**: P1 디자이너 위임 후 옵션 (a) 캐노니컬 통합 vs (b) 신설 토큰 vs (c) 폐기 결정. surface-main 8건은 D5 §1 SSOT 흡수 우선 권고.

### C3. T-R2-hold 13건 시맨틱 시프트 결정
- **질문**: D8 PR-B 단계 1 HOLD 7쌍 13건 (a) 캐노니컬 통합 vs (b) 신설 토큰 분리 vs (c) 케이스별 분리.
- **권장**: **(c) 케이스별 분리** — `--mg-bg-hover` (4건) 만 신설 후보, 나머지 9건은 캐노니컬 통합 권고.

### C4. T-DarkCascade-WARN4 cascade hex 결정
- **질문**: 4 토큰 (`border-main`/`error`/`info`/`text-secondary`) 다크 cascade hex (a) Tailwind 답습 일괄 vs (b) 브랜드 톤 분기 결정 vs (c) WARN 1~2건만 D9 정착 + 나머지 D10 이월.
- **권장**: **(a) Tailwind 답습 일괄** — 4건 일괄 정착, D9에서 T-D 가드 WARN 0건 도달.

### C5. T-D6-Residue 신설 범위
- **질문**: D6 §4 권고 잔존 (`warning-100`/`warning-800`) (a) 2종 일괄 신설 vs (b) D10 이월.
- **권장**: **(a) 2종 일괄 신설** — D6 매트릭스 완전성 도달, codemod 매핑 추가로 -5 ~ -15건 흡수.

### C6. T-Glass-Shadow-Overlay SSOT 정착 진행
- **질문**: rgba SSOT 5종 (`glass-bg-{light,medium,strong}`/`shadow-medium`/`overlay`) 라이트·다크 cascade 정착 + 일괄 흡수 (a) D9 진행 (운영 게이트 < 1,000 즉시 진입) vs (b) D10 이월 (광역 위험 통제).
- **권장**: **(a) D9 진행** — SSOT 5종만 정착 후 codemod 매핑 단계적 추가 (PR-D 단독 분리, 시각 회귀 검수 광역 P3). 운영 게이트 < 1,000 진입 직접 트리거.

---

## §5 분배실행 표 (위임 골격)

> **본 임무 범위 외**: 실제 위임은 사용자 컨펌(§4) 후 메인 어시스턴트가 수행. 본 표는 위임 시 사용할 골격.

| Phase | 책무 | 담당 서브에이전트 | 위임 프롬프트 골격 (요약) | 적용 스킬 | 모델 권장 |
|---|---|---|---|---|---|
| **P1** | §4 C2·C3·C4·C5·C6 디자이너 컨펌 | `core-designer` | (1) T-R2-manual 77건 정책 결정 (상위 3쌍 + 25쌍 잔존). (2) T-R2-hold 13건 케이스별 결정. (3) T-DarkCascade-WARN4 4 토큰 cascade hex 결정. (4) T-D6-Residue 2종 신설 hex + WCAG AA. (5) T-Glass-Shadow-Overlay 5 SSOT 라이트·다크 cascade + α 단계 정합. 완료 조건: P2-a~f 핸드오프 1장. | `/core-solution-design-system-css`, `/core-solution-design-handoff` | `gemini-3.1-pro` |
| **P2-a** | §2.1 T-R2-v2 SAFE 분류 + alias 대체 | `core-coder` | (1) `inventory-r2-fallbacks.js` 재실행 → mg-v2-* 37건 분류. (2) SAFE 14쌍 화이트리스트 작성 (D8 PR-B 답습). (3) `--r2-mg-alias-replace` 옵션 확장 → SAFE 흡수. 완료 조건: HARD_EXCLUDE/R-2 보호 원위치 유지 + rawLine -15 ~ -25. | `/core-solution-frontend`, `/core-solution-standardization` | 기본 |
| **P2-b** | §2.2 T-R2-manual P1 결정 적용 | `core-coder` | P1 결정 매핑 적용 → `convert-hardcoded-colors.js` 매핑 추가 (상위 3쌍 + 잔존) + dry-run → 실행. 완료 조건: T-D 가드 PASS + rawLine -30 ~ -70. | `/core-solution-frontend`, `/core-solution-standardization` | 기본 |
| **P2-c** | §2.3 T-R2-hold 케이스별 처리 | `core-coder` | P1 결정 적용 → (a) `--mg-bg-hover` 신설 토큰 정의 (if 결정) + 4건 alias 대체. (b) 나머지 9건 캐노니컬 통합 매핑 추가. 완료 조건: rawLine -13. | `/core-solution-frontend` | 기본 |
| **P2-d** | §2.4 T-DarkCascade-WARN4 cascade 정착 | `core-coder` | P1 결정 hex 적용 → `unified-design-tokens.css` `[data-theme="dark"]` 4 토큰 cascade 추가. 완료 조건: T-D 가드 WARN 0건 + 빌드 PASS. | `/core-solution-frontend` | 기본 |
| **P2-e** | §2.5 T-D6-Residue 신설 + 매핑 | `core-coder` | (1) `unified-design-tokens.css` `warning-100`/`warning-800` 라이트·다크 정의 추가. (2) `convert-hardcoded-colors.js` 매핑 2쌍 + 대문자 변형 추가. (3) dry-run → 실행. 완료 조건: T-D 가드 PASS + rawLine -5 ~ -15. | `/core-solution-frontend`, `/core-solution-standardization` | 기본 |
| **P2-f** | §2.6 T-Glass-Shadow-Overlay SSOT 정착 + 흡수 | `core-coder` | (1) `unified-design-tokens.css` 5 SSOT 정의 (라이트·다크 cascade). (2) `convert-hardcoded-colors.js` 매핑 5쌍 + α 단계 변형 추가 (단계 1: opaque 변형 우선, 단계 2: α 분기 시 별도 PR). (3) dry-run → 실행. 완료 조건: rawLine -300 ~ -800 + < 1,000 진입. | `/core-solution-frontend`, `/core-solution-standardization` | 기본 |
| **P3** | §6 시각 회귀 검수 | `core-tester` | P2-a~f 적용 후 (1) §6 우선 점검 화면 UAT. (2) 라이트·다크 cascade 정합 확인. (3) T-Glass-Shadow-Overlay 광역 영향 검수 (838건). 완료 조건: HIGH 0건. | `/core-solution-testing` | `gemini-3.1-pro` |
| **P4** | 운영 push (PR 분리 단위) | `core-deployer` | (P3 PASS 후) PR-A (WARN4 + D6-Residue, 신설/cascade 묶음) + PR-B (R2-v2/manual/hold, R-2 잔존 흡수 묶음) + **PR-D (Glass-Shadow-Overlay, 광역 위험 격리 단독)** 분리 push → count 측정. 완료 조건: rawLine < 1,000 진입 보고. | `/core-solution-deployment` | 기본 |

> **검증 게이트 (필수)**: P2 코드 변경은 P3 `core-tester` 통과 전 P4 진행 금지 (`CORE_PLANNER_DELEGATION_ORDER.md` 강제 규칙).
> **병렬 가능**: P2-a (T-R2-v2 SAFE 분류 단계) 와 P2-d (WARN4 cascade) 는 P1 결정 무관 항목이므로 P1 진행 중 병렬 가능. P2-b·c·e·f 는 P1 후 직렬.

---

## §6 시각 회귀 위험·core-tester 우선 점검 화면

| 트랙 | 영향 화면군 | 위험 분류 |
|---|---|---|
| T-R2-v2 (mg-v2-* SAFE 15~25건) | mg-v2-* 사용처 (dashboard-v2/admin-v2 컴포넌트 잔재) — D8 PR-B 답습 영역 | **Med** (cascade 분기 검증 필수) |
| T-R2-manual (~30~70건) | `--mg-primary` 15건 (admin/ops/landing 광역) / surface-main 8건 (대시보드 표면) / brand-olive 변형 8건 (consultant) | **Med** (광역 — primary 톤 시프트 위험) |
| T-R2-hold (13건) | `--mg-bg-hover` (테이블/카드 hover 상태) / text-tertiary tier 시프트 / primary→info 시프트 | **Med** (hover 상호작용 + tier 시프트 인지 가능) |
| T-DarkCascade-WARN4 | 다크 모드 전 영역 (border/error/info/text-secondary 다크 가시성) | **Med** (다크 모드 사용자 가시성 — WCAG AA 검증 필수) |
| T-D6-Residue (warning-100/800 ~5~15건) | warning 메시지 컴포넌트 (form/alert/toast) | Low (D6 §4 매트릭스 완성도) |
| **T-Glass-Shadow-Overlay (~838건)** | **광역** — 모든 카드/모달/드로워 glass morphism + 그림자 + 오버레이 backdrop. landing/dashboard/admin/ops 전 영역 | **HIGH** (시각 톤·깊이·blur 정합 광역 영향, **PR-D 단독 분리 + 단계적 적용 필수**) |

---

## §7 운영 게이트 진입 시나리오

### 7.1 카운트 계산 (D9 적용 전)

- **canonical**: 458 (D8 PR-B 단계 1 §2)
- **withR2**: 741 (D8 PR-B 단계 1 §2)
- **rawLine**: 1,485 (D8 PR-B 단계 1 §2)
- **R-2 보호**: 283 (D8 PR-B 단계 1 §2)

### 7.2 예상 감축 시나리오

| 시나리오 | 적용 트랙 | rawLine 감축 | 적용 후 rawLine | < 1,000 진입 |
|---|---|---:|---:|:---:|
| **보수** | T-R2-v2 SAFE + WARN4 + D6-Residue (rgba 미적용) | -20 ~ -40 | **~1,445 ~ 1,465** | ❌ (gap 445~465) |
| **표준** | + T-R2-hold + T-R2-manual 상위 3쌍 (~30건) | -50 ~ -100 | **~1,385 ~ 1,435** | ❌ (gap 385~435) |
| **표준+** | + T-R2-manual 전건 (~70건) | -100 ~ -180 | **~1,305 ~ 1,385** | ❌ (gap 305~385) |
| **확장 (rgba 단계 1)** | + T-Glass-Shadow-Overlay opaque 변형 흡수 (~300건) | -300 ~ -500 | **~985 ~ 1,185** | ⚠️ (확장 진입 가능) |
| **확장 (rgba 전건)** | + α 단계 변형 일괄 (~838건) | -700 ~ -900 | **~585 ~ 785** | ✅ (확실 진입) |

### 7.3 목표

- **D9 적용 목표**: **rawLine < 1,000 진입** (확장 시나리오 — T-Glass-Shadow-Overlay 정착) + canonical < 450.
- **미도달 시 D10 이월**: 잔존 hex < 100 + R-2 보호 < 100 + α 단계 분기 정착 + 디자인 시스템 자산 갱신.

---

## §8 후속 라운드 (D10 가늠)

| 라운드 | 시점 가늠 | 트리거 | 주요 책무 | 비고 |
|---|---|---|---|---|
| **D10 (T1-C 종결)** | D9 적용 후 (~2주 내) | rawLine < 1,000 진입 + 잔존 hex < 100 도달 | (1) R-2 보호 잔존 (other 그룹 156건: cs-*/color-*/theme-*) 일괄 분류·흡수 (2) α 단계 분기 정착 (rgba α 변형 후속) (3) 인라인 스타일·매직 라벨 트랙 진입 | 운영 게이트 < 500 (장기 목표) |
| **D11 (디자인 시스템 자산 갱신)** | D10 정착 후 | T1-C 종결 + 디자이너 D5 후속 결정 | `mindgarden-design-system.pen` 자산 갱신 (B0KlA 팔레트 확장 + 다크 매트릭스 + glass/shadow SSOT 일원화) | T1 전체 트랙 종결 |
| **i18n Phase 2.1c** | D9와 무관 진행 가능 | i18n 트랙 별도 결정 | clinical + client Top 100 라벨 i18n | T-C 별도 트랙 |
| **다크모드 UAT 후속** | D9 신설 토큰 정착 후 | 임상 모듈 활성화 또는 사용자 보고 | 임상 모듈 UAT (RiskAlert/SOAP/Diagnostic/Audio) WARN4 정착 cascade 정합 + glass/shadow 다크 검수 | T-B §5 발견 자동 차단 해제 시점 |

---

## §9 변경 이력

| 일자 | 작성 | 내용 |
|---|---|---|
| 2026-05-23 | core-planner | D9 합의서 신규 작성. 6 트랙(T-R2-v2 / T-R2-manual / T-R2-hold / T-DarkCascade-WARN4 / T-D6-Residue / T-Glass-Shadow-Overlay) 통합 — mg-v2-* SAFE 분류 단계적 흡수 / manual-review 77건 P1 결정 / HOLD 13건 케이스별 / WARN4 cascade 일괄 / D6 매트릭스 보강 / rgba SSOT 5종 정착 + 광역 흡수. 사용자 컨펌 6건(§4). 운영 게이트 rawLine < 1,000 진입은 확장 시나리오(T-Glass-Shadow-Overlay) 정착 시 확실, 보수·표준 시나리오는 D10 이월 명시. PR 분리 단위 권고: PR-A (WARN4 + D6-Residue) / PR-B (R-2 잔존 흡수 묶음) / PR-D (Glass-Shadow-Overlay 단독, 광역 위험 격리). |
