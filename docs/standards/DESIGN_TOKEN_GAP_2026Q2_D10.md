# D10 합의서 — T1-C 종결 라운드 (R-2 잔존 최종 분류 + Black-α/Shadow 다크 정착 + Other 그룹 일괄 흡수 + 인라인 매직 트랙 진입) (2026 Q2)

> **작성**: 2026-05-23 (core-planner 오케스트레이션)
> **유형**: 의사결정 합의서 (코드·D1~D9 SSOT 무수정, 분배 골격만)
> **상위 합의**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D9.md` §8 (D10 — T1-C 종결 가늠) + D9 P2-b/c §6 + D9 P2-f §9.2 (D10 이월 권고)
> **선행 라운드**: D9 P2-a/b/c/d/e/f 정착 (운영 main `04ac359a0`, 2026-05-23 13:17 KST push 완료) — rawLine 1,485 → 1,423, R-2 보호 283 → 192, T-D 가드 38 PASS / 0 WARN
> **연계**: `docs/project-management/2026-05-23/D9_P2BC_R2_RESIDUE_VISUAL_REGRESSION_REPORT.md`, `docs/project-management/2026-05-23/D9_P2F_GLASS_SHADOW_OVERLAY_VISUAL_REGRESSION_REPORT.md`, `docs/project-management/2026-05-23/D9_P3_VISUAL_REGRESSION_REPORT.md`, `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`

---

## §0 결정 요약 (TL;DR)

D9 운영 정착 후속 — **D10 단일 합의서**에 6 트랙 통합. **T1-C 종결 라운드**로, R-2 잔존 mg-/mg-v2- 32건 + HOLD 4건 + D9 P2-f HOLD black α 4종 + `--mg-shadow-light` 다크 cascade + R-2 other 그룹 156건(cs-*/color-*/theme-*) + 인라인/매직 라벨/canvas gradient 비CSS 잔존을 일괄 처리한다. **운영 게이트 rawLine < 1,000 진입 직접 트리거는 T-CS-Theme-Other** (R-2 보호 156건 + 비-R-2 hex 다수 동반 흡수, 보수 -200 ~ 표준 -450 가늠). 사용자 컨펌 필요 항목 5건(§4). T-D 가드 WARN 0건 유지 + HARD_EXCLUDE / R-2 보호 정규식 영구 무수정 원칙 답습.

---

## §1 현황 스냅샷

### 1.1 카운트 추이

| 라운드 | 적용 시점 | canonical | withR2 | rawLine | R-2 보호 | 라운드 감축 |
|---:|---|---:|---:|---:|---:|---:|
| D7-2 PR-B | `d30b4cf9c` | 523 | 866 | 1,571 | 343 | -38 |
| D8 PR-A | `1d97d41f7` | 458 | 801 | 1,544 | 343 | -27 |
| D8 PR-B 단계 1 | `9518d040c` | 458 | 741 | 1,485 | 283 | -59 |
| D9 P2-a (R-2 v2 SAFE 14) | `ca84310f2` | 458 | 727 | 1,481 | 269 | -4 |
| D9 P2-b/c (SSOT 3 + 78건) | `3d1434664` | 457 | 649 | 1,423 | 192 | -58 |
| D9 P2-d/e (WARN4 + warning-100/800) | `de057e490` | 457 | 649 | 1,423 | 192 | 0 (정의만) |
| D9 P2-f / PR-D (Glass/Shadow rgba SSOT) | `e169c0be3` | 457 | 649 | 1,423 | 192 | 0 (rgba metric 한계) |
| **D9 P3 검수 PASS** | `04ac359a0` | **457** | **649** | **1,423** | **192** | 0 (검수만) |
| **D10 목표 (본 합의서)** | (6 트랙 · 시나리오별) | **~430 ~ 455** | **~470 ~ 620** | **~970 ~ 1,200** | **~30 ~ 192** | **-230 ~ -450** |

### 1.2 운영 게이트 metric 한계 (D9 P3 §10 SSOT 인용)

| metric | 현재 값 | 한계 진단 |
|---|---:|---|
| canonical | 457 | hex-only (`#[0-9a-fA-F]{3,6}`) — rgba 흡수 미반영 |
| withR2 | 649 | canonical + R-2 보호 hex 합산 (hex-only) |
| rawLine | 1,423 | CI/BI 호환 grep 패턴 (`#[0-9a-fA-F]+`) — rgba/`color()`/HSL/HSLA/inline label 미포함 |
| R-2 보호 | 192 | mg-* 16 / mg-v2- 20 / other 156 (cs-*/color-*/theme-*) |
| T-D 가드 | 38 PASS / 0 WARN | `--mg-color-*` 패밀리 양방향 cascade 100% |

> **결론**: D9 P3 §10 "rgba metric 미반영" 진단 그대로 잔존. D10 적용 효과 < 1,000 진입의 **직접 트리거는 hex 잔존 흡수** (T-CS-Theme-Other 156건 + T-Inline-Magic 잔존). T-Glass-Black-Cascade / T-Shadow-Light-Dark 는 운영 품질 트랙(다크 가시성·broken cascade 해소) 으로 metric 영향 0건, D11+ metric 재정의 후 후행 측정.

### 1.3 R-2 보호 192건 그룹별 분포 (D9 P2-b/c §1.1 인용)

| 그룹 | 건수 | D10 처리 트랙 |
|---|---:|---|
| mg-* manual-review | 16 | **T-R2-Manual-Final** §2.1 |
| mg-v2-* border-light HOLD | 4 | **T-R2-Hold-Final** §2.2 |
| mg-v2-* manual-review | 16 | **T-R2-Manual-Final** §2.1 |
| other (cs-*/color-*/theme-* 등) | 156 | **T-CS-Theme-Other** §2.5 |
| **합계** | **192** | (4 트랙 분산) |

---

## §2 트랙별 인벤토리

### §2.1 T-R2-Manual-Final (mg-* 16 + mg-v2-* 16 = 32건 최종 처리)

- **D9 P2-b/c §3.1·§3.3 인용**: 캐노니컬 매핑 부재 또는 ΔE/시맨틱 시프트 위험 보수 분류 잔존.
- **mg-* 분포 (16건)**: custom-* placeholder 4건 (`#ffeaa7`/`#e8f4fd`/`#bee5eb`/`#0c5460`), Bootstrap 잔재 4건 (`danger-dark` `#c82333` ×2 / `warning-500` `#fd7e14` / `purple-500` `#6f42c1`), Tailwind 변형 5건 (`success` `#22c55e` / `success-dark` `#16a34a` / `purple-light` `#ede9fe` / `text-secondary` `#888` / `text-secondary` `#555555`), brand olive-gray 변형 2건 (`text-tertiary` `#8a9a90` ×2), accent 1건 (`#8b7355`).
- **mg-v2-* 분포 (16건)**: primary blue 7건 (`#eff6ff`/`#bfdbfe`/`#93c5fd`), warning amber 6건 (`#fffbeb`/`#fde68a`/`#d97706`/`#b45309`), success/info 진한톤 3건 (`#16a34a`/`#15803d`/`#0284c7`).
- **후보 처리**:
  - (a) purple 패밀리 신설 (`--mg-color-purple-{soft,500}` 2종) — Bootstrap+Tailwind 5건 흡수
  - (b) Bootstrap red-800/danger-dark 분기 (`--mg-color-danger-bootstrap` 단일 또는 `error-700` 기존 통합) — 2건 흡수
  - (c) Tailwind palette 변형 흡수 — mg-v2- primary blue 200/300/50 + warning amber 50/200/600/700 + success-600/700 + info-600 (총 16건). 신설 시 `--mg-color-primary-{50,200,300}` / `--mg-color-warning-{50,200,600,700}` / `--mg-color-success-{600,700}` / `--mg-color-info-600` = 10종 추가.
  - (d) custom-* placeholder 4건 — D8 PR-B 후보 정책 (`--mg-color-info-soft` 흡수 또는 신설 폐기) 답습.
- **codemod 영향**: P1 결정 범위에 따라 **-20 ~ -32건** (R-2 보호 192 → 160 ~ 172).

### §2.2 T-R2-Hold-Final (mg-v2-* border-light 4건 — `--mg-color-border-soft` 신설 검토)

- **D9 P2-b/c §3.2 + §6.2 인용**: `--mg-v2-color-border-light` + `#f3f4f6` (4건) — border ≠ background/hover-bg 시맨틱 시프트, `--mg-color-border-main` (`#D4CFC8`) 와 hex 차 큼.
- **신설 후보 (P1 디자이너 결정)**:
  - **`--mg-color-border-soft`**: 라이트 `#f3f4f6` (Tailwind gray-100) / 다크 `#374151` (gray-700) — 정적 border 시맨틱 분리
  - 또는 기존 `--mg-color-border-light` (`#E5E0DA`) 흡수 — 라이트 hex 차이 미세, ΔE 분류 후 시각 회귀 검수
- **codemod 영향**: 신설 시 -4건 (R-2 보호 -4).

### §2.3 T-Glass-Black-Cascade (D9 P2-f HOLD black α 4종 케이스별 분류)

- **D9 P2-f §2.3 + §4.4 인용**: `rgba(0,0,0,0.20)` / `rgba(0,0,0,0.30)` / `rgba(0,0,0,0.40)` / `rgba(0,0,0,0.60)` 변형 — glass-bg-* 다크 cascade / shadow-medium 다크 cascade 와 hex 충돌, 라이트 모드 컨텍스트에서 매핑 시 라이트 cascade 토큰값(white 기반) 정착으로 의도 충돌.
- **분류 권고 (P1 디자이너)**:
  - **고정 dark rgba (라이트 모드에서도 dark 톤 의도)**: 신설 토큰 `--mg-color-overlay-light-fixed` / `--mg-color-shadow-strong-fixed` 검토 (양방향 동일 hex) — 후보 분기 없으면 HARD_EXCLUDE 그대로 보존.
  - **시맨틱 안전 케이스 (다크 cascade 의도와 일치)**: glass-bg-light/medium/strong 또는 shadow-medium SAFE 흡수 — codemod 매핑 추가.
- **사전 grep 결과 가늠** (`rg "rgba\(0, *0, *0, *0\.(20|30|40|60)\)" frontend/src --type css | wc -l`): ~30 ~ 60건 추산 (P1 위임 시점 정확 인벤토리 산출).
- **codemod 영향**: SAFE 분류 후 **-10 ~ -30건** rgba (metric 영향 0, broken cascade 추가 해소).

### §2.4 T-Shadow-Light-Dark (`--mg-shadow-light` 다크 cascade 정착)

- **D9 P2-f §9.2 D10 권고 인용**: 현재 `rgba(0,0,0,0.1)` → `--mg-shadow-light` D5 매핑 유지되나 `--mg-shadow-light` 자체는 다크 cascade 부재 (`:root` 라이트만 정의). 다크 모드에서 그림자 broken 가능성 잔존.
- **사전 grep 결과** (`unified-design-tokens.css` 의 `--mg-shadow-light` 정의): 라이트 정의 존재, 다크 cascade 없음.
- **결정 후보 (P1 디자이너)**:
  - 라이트 `rgba(0,0,0,0.05)` 또는 기존 정의값 유지 / 다크 `rgba(0,0,0,0.20)` 신설 — shadow-medium 다크 (0.30) 와 단계 정합
  - shadow 패밀리 일관성: shadow-light 0.05/0.20 / shadow-medium 0.10/0.30 / shadow-strong 0.15/0.40 (검증 후 결정)
- **codemod 영향**: 정의만 추가, codemod 흡수 불필요. broken cascade 해소 1건.

### §2.5 T-CS-Theme-Other (R-2 보호 other 그룹 156건 일괄 분류·흡수) — **rawLine < 1,000 직접 트리거**

- **D9 P3 §9 권고 인용 + D9 P2-b/c §6.4 명시**: cs-*/color-*/theme-* 등 R-2 폴백 156건 미처리 잔존.
- **인벤토리 사전 분류** (`r2-inventory-20260523-D9-P2bc-after.json` `groups.other` 인용 — D10 P2 진입 시 신규 산출):
  - `cs-*` (정확 분포 P2 인벤토리 산출) — clinical/customer-service 도메인 alias
  - `color-*` (legacy color- 접두 alias) — D2 라운드 진입 이전 변형
  - `theme-*` (테마 alias) — useTheme.js / dashboard-theme 등
  - 기타 (`mood-*`/`semantic-*`/도메인 변형 등)
- **분류 전략 (D8 PR-B 답습)**:
  - **SAFE 화이트리스트** (캐노니컬 hex 정확 일치) — opt-in `--r2-other-alias-replace` 옵션 신설로 단계적 흡수
  - **HOLD** (시맨틱 시프트 위험 또는 캐노니컬 부재) — P1 디자이너 결정 후 신설 또는 재매핑
- **codemod 영향**: 보수 시나리오 -50 ~ -80건 (SAFE 30~50%), 표준 시나리오 -100 ~ -150건 (SAFE 70%+). rawLine 동반 감축 가늠 -150 ~ -450 (R-2 보호 라인 + 비-R-2 hex 동반 라인).

### §2.6 T-Inline-Magic (인라인 `style={{color:#hex}}` / 매직 라벨 / canvas gradient 비CSS 잔존)

- **D9 P3 §9 권고 + D7 series 이월**: rawLineJs 12건 (대부분 canvas API / chart palette) + 인라인 style hex 잔존 + `colorMap`/`labelMap` 변환 미적용.
- **사전 grep 결과 가늠** (`rg "color:\s*['\"]#" frontend/src --type tsx --type jsx | wc -l`): ~30 ~ 50건 추산 (P1 인벤토리 정확 산출).
- **분류 후보**:
  - canvas API addColorStop / fillStyle — D2 / D9 P2-b/c §1.5 AudioRecorder 답습 (CSS var 직접 사용 가능 영역만)
  - 인라인 style hex — JSX `style={{color:'#...'}}` → 토큰 className 또는 `var(--mg-color-*)` 인라인 var 변환
  - colorMap/labelMap — JS 상수 객체 — D9 P2-f charts.js 답습
- **codemod 영향**: 정밀 분류 후 -10 ~ -30건 (광역 rawLineJs 감축).

---

## §3 트랙별 우선순위·의존성

- **즉시 진행 가능 (병렬 — P1 디자이너 컨펌 무관 또는 사전 인벤토리만)**:
  - **T-CS-Theme-Other** (P2 인벤토리 산출 → 명확 SAFE 흡수, codemod 옵션 분기)
  - **T-Inline-Magic** (인벤토리 산출 → canvas/inline grep + 분류표 작성)
- **디자이너 컨펌 필요 (직렬 P1 → P2)**:
  - **T-R2-Manual-Final** (purple/Bootstrap-red/Tailwind palette 신설 정책 — C1·C2)
  - **T-R2-Hold-Final** (`--mg-color-border-soft` 신설 vs 기존 통합 — C3)
  - **T-Glass-Black-Cascade** (black α 4종 케이스별 분류 — C4)
  - **T-Shadow-Light-Dark** (다크 cascade hex + shadow 패밀리 정합 — C5)
- **시각 회귀 검수 게이트**:
  - 모든 트랙 codemod 흡수·수동 치환 후 `core-tester` PASS 후에만 운영 push
  - T-CS-Theme-Other 는 광역 영향 (156건 + 동반 hex 라인) → **단계적 PR 분리 권장** (D9 PR-B 답습)
  - HARD_EXCLUDE / R-2 보호 정규식 영구 무수정 검증 필수 (D8~D9 답습)

---

## §4 사용자 컨펌 필요 항목 (D10 진입 전)

### C1. T-R2-Manual-Final mg-* 16건 처리 정책
- **질문**: custom-* placeholder 4건 / Bootstrap 잔재 4건 / Tailwind 변형 5건 / brand olive-gray 변형 2건 / accent 1건 처리:
  - (a) **신설 최소화 + HARD_EXCLUDE 보존** (custom-*/Bootstrap 폐기 마이그레이션 권고, Tailwind 변형은 기존 통합 시도)
  - (b) **신설 적극 진행** (purple 패밀리 2종 + Bootstrap red-800/warning-orange 분기 신설)
  - (c) **D11 추가 이월** (디자인 시스템 자산 갱신 라운드로 일괄 이관)
- **권장**: **(a) 신설 최소화** — custom-* 4건은 폐기 마이그레이션(또는 info-soft 통합), Bootstrap 잔재 4건은 기존 error/warning 패밀리 흡수, Tailwind text 변형(`#888`/`#555555`) 2건은 text-secondary 통합. accent 1건만 P1 재판단.

### C2. T-R2-Manual-Final mg-v2-* Tailwind palette 신설 범위
- **질문**: primary blue 200/300/50 (7건) + warning amber 50/200/600/700 (6건) + success-600/700·info-600 (3건):
  - (a) **10종 일괄 신설** (`primary-{50,200,300}` / `warning-{50,200,600,700}` / `success-{600,700}` / `info-600`) — 16건 일괄 흡수
  - (b) **단계적 신설** (primary 3종 우선, warning/success/info 는 D11 이월)
  - (c) **신설 없이 폐기 마이그레이션** (mg-v2-* 사용처 → 기존 캐노니컬 패밀리 직접 사용)
- **권장**: **(a) 10종 일괄 신설** — D6 매트릭스 완전성 동일 패턴 답습, codemod 매핑 10쌍 추가, T-D 가드 PASS 보장.

### C3. T-R2-Hold-Final `--mg-color-border-soft` 신설 vs 통합
- **질문**: mg-v2- border-light 4건 (`#f3f4f6`):
  - (a) **`--mg-color-border-soft` 신설** — 라이트 `#f3f4f6` / 다크 `#374151` (gray-700), 정적 border 시맨틱 분리
  - (b) **기존 `--mg-color-border-light` (`#E5E0DA`) 흡수** — ΔE 작아 시각 회귀 미세, 신설 회피
- **권장**: **(a) 신설** — `--mg-color-bg-hover` 신설 (D9 P2-b/c §1.2) 답습. Tailwind gray-100 톤 보존 + 다크 cascade 정착으로 다크 모드 가시성 향상.

### C4. T-Glass-Black-Cascade black α 4종 분류
- **질문**: `rgba(0,0,0,0.20/0.30/0.40/0.60)` 변형 (~30~60건):
  - (a) **케이스별 분류 후 SAFE 흡수** — 다크 cascade 의도 일치 케이스만 codemod 매핑 추가, 고정 dark rgba 케이스는 HARD_EXCLUDE 보존
  - (b) **고정 dark 토큰 신설** (`--mg-color-overlay-fixed` 등 양방향 동일 hex 2~4종 신설)
  - (c) **D11 이월** (D5 P3 답습, NO-OP 잔존 유지)
- **권장**: **(a) 케이스별 SAFE 흡수** — D9 P2-f HOLD 사유 그대로 분류 워크플로 진입, 신설 회피하여 디자인 시스템 단순화.

### C5. T-Shadow-Light-Dark cascade 정착 범위
- **질문**: `--mg-shadow-light` 다크 cascade + shadow 패밀리 정합:
  - (a) **단일 정착** (`--mg-shadow-light` 다크 cascade 추가, 라이트는 기존 유지)
  - (b) **shadow 패밀리 일관 신설** (shadow-light + shadow-strong 양방향 cascade 일괄, shadow-medium D9 정착과 단계 정합)
  - (c) **D11 디자인 시스템 자산 갱신 이월**
- **권장**: **(a) 단일 정착** — broken cascade 1건 해소 우선, shadow-strong 신설은 D11 자산 갱신 라운드로 이월.

### C6. T-CS-Theme-Other 적용 범위·PR 분리 단위
- **질문**: R-2 other 156건 + 비-R-2 동반 hex 흡수 (rawLine < 1,000 직접 트리거):
  - (a) **단계적 PR (보수)** — SAFE 30~50% 만 D10 진행, 나머지 D11 (rawLine ~1,200 ~ 1,300)
  - (b) **광역 PR (표준)** — SAFE 70%+ + 동반 hex 광역 흡수 (rawLine ~970 ~ 1,050, < 1,000 진입 가능)
  - (c) **광역 + 인라인 통합** — T-Inline-Magic 도 본 PR 묶음 (rawLine ~940 ~ 1,020 보수~표준)
- **권장**: **(b) 광역 PR (표준)** — D8 PR-B / D9 P2-b/c 답습으로 SAFE 화이트리스트 정확 분류 후 codemod 옵션 분기 (`--r2-other-alias-replace`). T-Inline-Magic 은 PR 분리 (PR-E 단독), 광역 위험 격리.

---

## §5 분배실행 표 (위임 골격)

> **본 임무 범위 외**: 실제 위임은 사용자 컨펌(§4) 후 메인 어시스턴트가 수행. 본 표는 위임 시 사용할 골격.

| Phase | 책무 | 담당 서브에이전트 | 위임 프롬프트 골격 (요약) | 적용 스킬 | 모델 권장 |
|---|---|---|---|---|---|
| **P0-inv** | T-CS-Theme-Other / T-Glass-Black / T-Inline-Magic 인벤토리 산출 | `explore` | (1) `r2-inventory-*` 재실행 → other 그룹 156건 SAFE/HOLD 분류표. (2) `rg "rgba\(0, *0, *0, *0\.(20\|30\|40\|60)\)"` grep 표. (3) `rg "color:\s*['\"]#" --type tsx --type jsx` + canvas API grep 표. 산출: `reports/r2-other-inventory-20260524.json` + 분류 마크다운. | `/core-solution-standardization` | 기본 |
| **P1** | §4 C1·C2·C3·C4·C5·C6 디자이너 컨펌 + 핸드오프 1장 | `core-designer` | (1) T-R2-Manual-Final mg-/mg-v2- 32건 정책 결정 (신설 최소화 vs Tailwind palette 10종 신설). (2) T-R2-Hold-Final `--mg-color-border-soft` 신설 hex + WCAG AA. (3) T-Glass-Black-Cascade 케이스별 분류 워크플로 정의. (4) T-Shadow-Light-Dark 다크 cascade hex. (5) T-CS-Theme-Other 정책 (SAFE 분류 + 신설 후보). 완료 조건: P2-a~f 핸드오프 1장 + hex 결정표. | `/core-solution-design-system-css`, `/core-solution-design-handoff` | `gemini-3.1-pro` |
| **P2-a** | §2.1 T-R2-Manual-Final SAFE 흡수 | `core-coder` | P1 결정 적용 → SSOT 신설 (0~10종 P1 결정) + COLOR_MAPPING 매핑 추가 + `--r2-mg-alias-final-replace` 옵션 신설 → SAFE 흡수. 완료 조건: T-D 가드 PASS + R-2 보호 -20 ~ -32. | `/core-solution-frontend`, `/core-solution-standardization` | 기본 |
| **P2-b** | §2.2 T-R2-Hold-Final 신설 + 흡수 | `core-coder` | P1 결정 hex 적용 → `--mg-color-border-soft` SSOT 정의 + R2_V2_ALIAS_SAFE_PAIRS 1쌍 추가 + dry-run → 실행. 완료 조건: T-D 가드 PASS + R-2 보호 -4. | `/core-solution-frontend` | 기본 |
| **P2-c** | §2.3 T-Glass-Black-Cascade SAFE 흡수 | `core-coder` | P1 분류표 적용 → SAFE 케이스만 RGB_MAPPING 매핑 추가 + HOLD 케이스 HARD_EXCLUDE 보존 + dry-run → 실행. 완료 조건: T-D 가드 PASS + rgba -10 ~ -30 (metric 영향 0). | `/core-solution-frontend`, `/core-solution-standardization` | 기본 |
| **P2-d** | §2.4 T-Shadow-Light-Dark cascade 정착 | `core-coder` | P1 결정 hex 적용 → `unified-design-tokens.css` `[data-theme="dark"]` 블록 `--mg-shadow-light` 다크 cascade 추가. 완료 조건: T-D 가드 PASS + 빌드 PASS + broken cascade -1. | `/core-solution-frontend` | 기본 |
| **P2-e** | §2.5 T-CS-Theme-Other SAFE 흡수 (rawLine 트리거) | `core-coder` | P0 분류표 적용 → `--r2-other-alias-replace` 옵션 신설 + R2_OTHER_ALIAS_SAFE_PAIRS 화이트리스트 → 광역 흡수. 완료 조건: T-D 가드 PASS + R-2 보호 -100 ~ -150 + rawLine -150 ~ -450 + **< 1,000 진입 시도**. | `/core-solution-frontend`, `/core-solution-standardization` | 기본 |
| **P2-f** | §2.6 T-Inline-Magic 흡수 (PR-E 단독 분리) | `core-coder` | P0 분류표 적용 → 인라인 style hex → `var()` 변환 + canvas API SAFE 케이스 흡수. 완료 조건: rawLineJs -10 ~ -30 + 빌드 PASS. | `/core-solution-frontend` | 기본 |
| **P3** | 종합 시각 회귀 검수 | `core-tester` | P2-a~f 적용 후 (1) §6 우선 점검 화면 UAT. (2) 라이트·다크 cascade 정합 확인. (3) T-CS-Theme-Other 광역 영향 검수. 완료 조건: HIGH 0건 + 운영 게이트 metric 측정 + < 1,000 진입 여부 보고. | `/core-solution-testing` | `gemini-3.1-pro` |
| **P4** | 운영 push (PR 분리 단위) | `core-deployer` | (P3 PASS 후) PR-A (T-R2-Manual-Final + T-R2-Hold-Final, 신설 묶음) + PR-B (T-Glass-Black + T-Shadow-Light, 다크 cascade 묶음) + **PR-C (T-CS-Theme-Other, rawLine 트리거 단독)** + PR-E (T-Inline-Magic 단독) 분리 push → count 측정. 완료 조건: rawLine < 1,000 진입 보고. | `/core-solution-deployment` | 기본 |

> **검증 게이트 (필수)**: P2 코드 변경은 P3 `core-tester` 통과 전 P4 진행 금지 (`CORE_PLANNER_DELEGATION_ORDER.md` 강제 규칙).
> **병렬 가능**: P0-inv 와 P2-d (Shadow-Light 다크 cascade — P1 결정 후 단순 정의 추가) 는 다른 트랙과 무관 병렬 가능. P2-a/b/c/e/f 는 P1 결정 후 직렬 또는 광역 PR 묶음 단위 직렬.

---

## §6 시각 회귀 위험·core-tester 우선 점검 화면

| 트랙 | 영향 화면군 | 위험 분류 |
|---|---|---|
| T-R2-Manual-Final mg-* (~16건) | custom-* placeholder 영역 (legacy admin alert/toast) / Bootstrap 잔재 (admin 폼/버튼) / Tailwind 변형 (text 보조) | **Med** (시맨틱 시프트, 폐기 마이그레이션 시 ΔE 인지 가능) |
| T-R2-Manual-Final mg-v2-* Tailwind palette (~16건) | dashboard-v2 광역 (consultant/admin v2 컴포넌트) — primary/warning/success/info 변형 | **Med** (광역 — palette 일관성 검수 필수) |
| T-R2-Hold-Final border-soft (4건) | mg-v2- border-light 사용처 (dashboard-v2 border 컨텍스트) | **Low** (ΔE 미세, 다크 cascade 향상) |
| T-Glass-Black-Cascade (~30~60건 rgba) | 다크 모드 fixed-dark 표면 (modal/drawer/header dark backdrop) | **Med** (라이트 모드 자동 cascade 시 시각 시프트 위험) |
| T-Shadow-Light-Dark | 다크 모드 카드/버튼 그림자 (`--mg-shadow-light` 사용처) | Low (broken cascade 해소만) |
| **T-CS-Theme-Other (~156건 + 동반 hex 광역)** | **광역** — clinical/customer-service 도메인 alias / legacy color- 접두 / 테마 변형 전 영역 | **HIGH** (시맨틱 시프트·domain alias 정합 광역 영향, **PR-C 단독 분리 + 단계적 적용 필수**) |
| T-Inline-Magic (~10~30건) | canvas waveform / chart palette / 인라인 style 산발 영역 | **Low** (JS 상수 변환, 시각 변화 미세) |

---

## §7 운영 게이트 진입 시나리오

### 7.1 카운트 계산 (D10 적용 전)

- **canonical**: 457 (D9 P3 §6 운영 main `04ac359a0`)
- **withR2**: 649
- **rawLine**: 1,423 (gap = 423, < 1,000 진입까지)
- **R-2 보호**: 192 (mg-* 16 + mg-v2- 20 + other 156)

### 7.2 예상 감축 시나리오

| 시나리오 | 적용 트랙 | rawLine 감축 | 적용 후 rawLine | < 1,000 진입 |
|---|---|---:|---:|:---:|
| **보수** | T-R2-Manual-Final SAFE + T-R2-Hold-Final + T-Shadow-Light + T-Glass-Black SAFE (rgba metric 영향 0) | -20 ~ -40 | **~1,383 ~ 1,403** | ❌ (gap 383~403) |
| **표준** | + T-CS-Theme-Other SAFE 30~50% (-50 ~ -80) | -70 ~ -120 | **~1,303 ~ 1,353** | ❌ (gap 303~353) |
| **표준+** | + T-CS-Theme-Other SAFE 70%+ (-100 ~ -150) | -120 ~ -200 | **~1,223 ~ 1,303** | ❌ (gap 223~303) |
| **확장 (other 광역 + 동반 hex)** | + T-CS-Theme-Other 광역 (~200~450 rawLine 동반 흡수) | -200 ~ -450 | **~970 ~ 1,220** | ⚠️ (확장 진입 가능) |
| **확장+ (other + 인라인 통합)** | + T-Inline-Magic (~10~30) | -230 ~ -480 | **~940 ~ 1,190** | ✅ (확실 진입 가능 영역) |

### 7.3 목표

- **D10 적용 목표**: **rawLine < 1,000 진입** (확장+ 시나리오 — T-CS-Theme-Other 광역 + T-Inline-Magic) + canonical < 450 + R-2 보호 < 50.
- **미도달 시 D11 이월**: 잔존 hex < 100 + metric 재정의 (rgba 포함) + 디자인 시스템 자산 갱신.

---

## §8 후속 라운드 (D11 가늠)

| 라운드 | 시점 가늠 | 트리거 | 주요 책무 | 비고 |
|---|---|---|---|---|
| **D11 (T1-C 종결 + metric 재정의)** | D10 적용 후 (~2주 내) | rawLine < 1,000 진입 후 잔존 hex < 100 도달 | (1) `count-hardcoded-colors.js` metric 재정의 (rgba/HSL/HSLA 포함, CI/BI 호환 모드) (2) `--mg-shadow-strong` 신설 + shadow 패밀리 일관성 (3) custom-* placeholder 폐기 마이그레이션 완결 | hex-only metric SSOT 한계 해소 |
| **D12 (디자인 시스템 자산 갱신)** | D11 정착 후 | T1-C 종결 + 디자이너 D5 후속 결정 | `mindgarden-design-system.pen` 자산 갱신 (B0KlA 팔레트 확장 + 다크 매트릭스 + glass/shadow/border SSOT 일원화 + Tailwind palette 정합) | T1 전체 트랙 종결 + Storybook 자산 갱신 |
| **i18n Phase 2.1c** | D10 무관 진행 가능 | i18n 트랙 별도 결정 | clinical + client Top 100 라벨 i18n | T-C 별도 트랙 |
| **다크모드 UAT 후속** | D10 신설 토큰 정착 후 | 임상 모듈 활성화 또는 사용자 보고 | 임상 모듈 UAT (RiskAlert/SOAP/Diagnostic/Audio) + glass/shadow 다크 검수 광역 + Black-α 분류 검수 | T-B §5 발견 자동 차단 해제 시점 |

---

## §9 변경 이력

| 일자 | 작성 | 내용 |
|---|---|---|
| 2026-05-23 | core-planner | D10 합의서 신규 작성. T1-C 종결 라운드 — 6 트랙(T-R2-Manual-Final / T-R2-Hold-Final / T-Glass-Black-Cascade / T-Shadow-Light-Dark / T-CS-Theme-Other / T-Inline-Magic) 통합. R-2 잔존 mg-/mg-v2- 32건 + HOLD 4건 + D9 P2-f HOLD black α 4종 + shadow-light 다크 cascade + R-2 other 그룹 156건 + 인라인/매직 라벨 비CSS 잔존 일괄 처리. 사용자 컨펌 6건(§4). 운영 게이트 rawLine < 1,000 진입은 확장+ 시나리오 (T-CS-Theme-Other 광역 + T-Inline-Magic) 정착 시 확실. PR 분리 단위 권고: PR-A (Manual-Final + Hold-Final, 신설 묶음) / PR-B (Glass-Black + Shadow-Light, 다크 cascade 묶음) / PR-C (CS-Theme-Other, rawLine 트리거 단독) / PR-E (Inline-Magic 단독). 본 합의서는 의사결정 골격만, 코드 직접 수정 0줄. |
| 2026-05-23 | main-assistant | §4 사용자 컨펌 6건 확정 기록. **C1=a** (mg-* 16건 신설 최소화 + HARD_EXCLUDE 보존, custom-* 폐기 마이그 + Bootstrap 잔재 error/warning 통합) / **C2=a** (mg-v2-* Tailwind palette 10종 일괄 신설: primary-{50,200,300} + warning-{50,200,600,700} + success-{600,700} + info-600, D6 매트릭스 답습) / **C3=a** (`--mg-color-border-soft` 신설 라이트 `#f3f4f6`/다크 `#374151`) / **C4=a** (black α 4종 케이스별 SAFE 흡수 + HOLD HARD_EXCLUDE 보존) / **C5=a** (`--mg-shadow-light` 다크 cascade 단일 정착, shadow-strong은 D11 자산 갱신) / **C6=b** (T-CS-Theme-Other 표준 SAFE 70%+ 광역, rawLine < 1,000 진입 트리거, Inline-Magic은 PR-E 단독 격리). P0-inv (`explore`) + P1 디자이너 (`gemini-3.1-pro`) 병렬 위임 개시. |
| 2026-05-23 | main-assistant | P0 인벤토리 (`c1700bd4e`) 후속 추가 컨펌 3건 확정. **C7=a** (§6.3.a B0KlA palette 신설 5종 + 일부 통합 — `--mg-color-b0kla-{green,orange,blue}-500` + `b0kla-{green,orange,blue}-50` 신설, text-secondary/card-bg는 기존 통합. 확장 시나리오 116건(74%) 도달, rawLine ~1,200~1,290) / **C8=a** (§6.3.c iOS dark theme alias 6쌍 HARD_EXCLUDE 보존 — 다크 전용 시맨틱 의도 존중, withR2 metric 제외, D11 iOS theme 재설계 라운드 이월) / **C9=a** (§2 mg-v2-* success/info 600/700 hex P1 신설 hex 적용 endorsed — 실 사용 `#16a34a`/`#15803d`/`#0284c7` → P1 신설 `#059669`/`#047857`/`#2563eb` 톤 시프트 endorsed, ConsultantDashboard 광역 변화 P3 검수). 운영 게이트 표준+ 시나리오 rawLine ~1,180~1,250 (확장 광역 광범위 확보), P1 디자이너 resume으로 B0KlA palette 5종 hex + 통합 매핑 확정 위임 개시. |
