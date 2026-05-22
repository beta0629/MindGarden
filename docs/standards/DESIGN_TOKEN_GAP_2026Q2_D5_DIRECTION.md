# D5 방향 합의서 — 테마 고도화 vs i18n Phase 2 vs rgba/3자리 완벽 흡수 (2026 Q2)

> **작성**: 2026-05-21 (core-planner 오케스트레이션)
> **유형**: 의사결정 합의서 (코드·D1~D4 SSOT 무수정)
> **상위 합의**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D4.md` §7 (다음 라운드 권장)
> **연계**: `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`

---

## 0. 결정 요약 (TL;DR)

- **1순위 (병렬 가능)**: **T-D codemod 가드 강화** + **T-E R-5 alias 톤 분리 합의 정착**
  - 직전 라운드 R-3·R-4·weekend·R-5 4건의 회귀 모두 **codemod 사이드이펙트 / 토큰 SSOT 부재**에서 출발. 다음 라운드의 모든 트랙(T-A·T-B·T-C)이 안전하게 굴러가려면 **가드 인프라가 선행**되어야 함.
- **2순위**: **T-B D5 테마 오버라이드 고도화** — 운영 게이트 1,005 → < 1,000 미만 진입의 마지막 1bp는 추가 치환이 아닌 **다크/라이트 토큰 분기 정합** 으로 흡수하는 편이 회귀 위험이 낮음.
- **3순위**: **T-A rgba()/3자리 완벽 흡수** — T-D 가드 인프라 배포 후에만 codemod 1회 재실행.
- **4순위(별도 트랙)**: **T-C i18n Phase 2** — 색상 트랙 안정화 이후 namespace 분할.
- **사용자 컨펌 필요**: 5건 (§6).

---

## 1. 현황 스냅샷

### 1.1 카운트 추이 (운영 hardcoding 게이트)

| 라운드 | 적용 PR/커밋 | 적용 후 카운트 | 라운드 감축량 | 운영 게이트(warn < 1,000) |
|---:|---|---:|---:|:---:|
| 기준선 | D2 적용 이전 | ~2,400 | — | ❌ |
| **D2** | (10건 매핑, gray 계열) | ~1,801 | -599 | ❌ |
| **D3** | (10건 매핑, gray/배경/border + 3자리 정규화) | ~1,670 | -131 | ❌ |
| **D4** | `267755325` (10건 + 인프라 일부) | **1,005** | **-665 (-40%)** | ⚠️ 진입 직전 (gap 6건) |
| **D5 목표** | (본 합의서) | **< 1,000** | -6 이상 | ✅ |

> **주의**: D4 감축량(-665)은 직접 매핑 10건(~160건) + 3자리 정규화 잠재 케이스 + Bootstrap 잔재 흡수의 누적 효과. D3 시뮬레이션(1,200 추정)보다 큰 실측치 — 인프라 보강이 예상보다 크게 작용함.

### 1.2 D4 라운드 직후 핫픽스 회고 (R-3·R-4·weekend·R-5)

| # | 커밋/시점 | 회귀 종류 | 근본 원인 | 잔존 위험 |
|---:|---|---|---|---|
| R-3 | `b8336cf11` | codemod 사이드이펙트 | 토큰 정의 파일 일부 매핑 → 자기 참조 회피 누락 | 낮음 (D3 HARD_EXCLUDE 확장으로 완화) |
| R-4 | `7d7567550` | codemod 사이드이펙트 | 동일 계열 (특이 케이스 변형) | 낮음 |
| weekend | `0aa3bbcee` | `.fc-non-business` 흰색 덮기 | 토큰 정착 후 라이트/다크 톤 차이 미반영 | **중간 (T-B에서 흡수 필요)** |
| R-5 | 위임 진행 중 | surface/background-base/muted/secondary/sub alias 정착 | alias 톤 분리 합의 부재 (T-E) | **중간 (T-E 결론 전 추가 회귀 가능)** |

> **시그널**: 4건 모두 **"치환 자체"가 아니라 "치환 이후 SSOT/alias 정합 부재"** 가 원인. 따라서 D5의 우선순위는 **추가 치환(T-A) 보다 가드 인프라(T-D) + alias 정착(T-E) + 테마 고도화(T-B)** 가 합리적임.

### 1.3 직전 디버거 §3 권고 (codemod 가드 강화)

- **치환 대상 토큰의 SSOT 정의 여부 사전 lint**: codemod가 매핑하려는 `var(--mg-color-*)` 가 `unified-design-tokens.css` 에 정의되어 있는지 사전 검증 후 치환.
- **alias 충돌 사전 차단**: 동일 의미를 가진 alias가 둘 이상 정의된 경우, codemod가 어느 쪽을 우선할지 사전 합의 없이 임의 선택하지 않도록 차단.

---

## 2. 옵션(트랙) 비교

D4 §7 의 3개 옵션 + 디버거 §3 권고 + R-5 alias 합의 = **총 5개 트랙(T-A ~ T-E)**.

### 2.1 트랙별 정의

| 트랙 | 명칭 | 목적 | 기대 효과 | 소요(가늠) | 위험 | 선후 의존성 |
|---|---|---|---|---|---|---|
| **T-A** | rgba()/3자리 완벽 흡수 | D4 인프라 보완 후 T1-C 잔존 hex 최종 클렌징 | 운영 게이트 카운트 -100 ~ -200 추가, T1-C 트랙 종결 | M (2~3 PR) | **중간** (codemod 변형 정규식 회귀 가능 — R-3/R-4 재발 위험) | **T-D 선행 필수**. T-E 와 직렬. |
| **T-B** | D5 테마 오버라이드 고도화 | 추가 치환이 아닌 **다크/라이트 토큰 분기 정합** 으로 게이트 흡수 + weekend 회귀 류 차단 | 시각 회귀 ↓, 1,000 미만 도달, 다크모드 품질 ↑ | L (4~6 PR) | **중간** (다크 톤 D4 §2 추정치 컨펌 필요, 디자이너 의사결정 의존) | T-E 결과를 입력으로 받음. T-D 와 병렬 가능. |
| **T-C** | i18n Phase 2 (namespace 분리·도메인 확장) | `react-i18next` Phase 1 부트스트래핑 후 본격 도입 | 다국어 기반 확보, 텍스트 길이 변동 대응 | XL (1~2주 트랙) | **낮음 (트랙 자체)** / **중간 (색상 트랙과 동시 진행 시 시각 회귀와 i18n 레이아웃 변동이 겹쳐 원인 분리 어려움)** | 색상 트랙(T-A·T-B) **안정화 후** 진행 권장. |
| **T-D** | codemod 가드 강화 | 치환 대상 토큰 SSOT 사전 lint, alias 충돌 사전 차단, R-3/R-4/weekend 류 재발 차단 | 후속 치환 안전망, T-A 안전 실행 보장 | S (1~2 PR) | **낮음** (인프라 추가, 코드 수정 영향 면적 작음) | **선행 권장** (T-A·T-B 모두의 안전망). |
| **T-E** | R-5 alias 톤 분리 합의 정착 | surface/background-base/muted/secondary/sub alias 톤 차이 합의·SSOT 반영 | 잠재 회귀 차단(weekend `.fc-non-business` 류), T-B의 입력 | S (1 PR + 디자이너 컨펌) | **낮음~중간** (디자이너 컨펌 의존, alias 5종 톤 결정) | T-D 와 병렬 가능. **T-B 선행**. |

### 2.2 한눈에 보는 비교표

| 기준 | T-A | T-B | T-C | T-D | T-E |
|---|:---:|:---:|:---:|:---:|:---:|
| 운영 게이트 카운트 직접 감축 | ◎ | ○ | × | × | △ |
| 시각 회귀 위험 차단 | △ | ◎ | × | ◎ | ◎ |
| 다크모드 품질 ↑ | × | ◎ | × | × | ○ |
| 사용자 컨펌 필요 | × | **◎** | △ | × | **◎** |
| 단독 실행 가능 | △ (T-D 의존) | ○ (T-E 입력 권장) | ○ | ◎ | ○ |
| **권장 1순위 진입 가능성** | 3순위 | **2순위** | 4순위 | **1순위** | **1순위** |

> **결정 근거**: 직전 라운드의 회귀 패턴(R-3/R-4/weekend/R-5)이 **codemod 가드 부재 + alias 정합 부재** 라는 단일 축에 모이는 점, 운영 게이트가 이미 1,005 (gap 6) 까지 도달해 추가 치환의 한계 효용이 낮은 점을 고려.

---

## 3. 결정 (방향)

### 3.1 1순위 (병렬 진행)

- **T-D codemod 가드 강화** (`shell` + `core-coder`)
- **T-E R-5 alias 톤 분리 합의 정착** (`core-designer` 컨펌 → `core-coder` 반영)

> **이유**: 다른 모든 트랙(T-A·T-B)의 안전망. T-D는 코드 가드, T-E는 디자인 SSOT 가드. 두 트랙은 서로 독립 (병렬).

### 3.2 2순위 (T-D·T-E 안정화 직후)

- **T-B D5 테마 오버라이드 고도화** (`core-designer` 다크 톤 컨펌 → `core-coder` 반영 → `core-tester` 시각 회귀 검증)

> **이유**: 운영 게이트 1,000 미만 진입의 마지막 6건 gap을 **추가 치환이 아닌 테마 분기 정합** 으로 흡수. T-E 결과를 입력으로 받음.

### 3.3 3순위 (T-D 배포 후)

- **T-A rgba()/3자리 완벽 흡수** (`core-coder` codemod 재실행 + `core-tester` 회귀 검증)

> **이유**: T-D 가드가 배포되지 않은 상태에서 codemod 정규식을 변형 확장하면 R-3/R-4 재발 위험. T-D 배포 후 1회만 실행.

### 3.4 4순위 (별도 트랙, 색상 안정화 후)

- **T-C i18n Phase 2** (`core-planner` 별도 합의서 + `core-coder`)

> **이유**: 색상 트랙(T-B) 안정화 이전에 진입하면 텍스트 길이 변동과 시각 회귀가 겹쳐 원인 분리가 어려워짐. **별도 합의서로 진입 조건 정의** (§6 참조).

### 3.5 사용자 컨펌 필요 분리

T-B·T-E·T-C 진행 전 §6 의 5건 컨펌이 선행되어야 함.

---

## 4. 분배실행 표 (위임 골격 — 본 합의서 단계에서는 정렬만)

> **본 임무 범위 외**: 실제 위임은 사용자 컨펌(§6) 후 메인 어시스턴트가 수행. 본 표는 위임 시 사용할 골격.

| Phase | 트랙 | 담당 서브에이전트 | 위임 프롬프트 골격 (요약) | 적용 스킬 | 모델 권장 |
|---|---|---|---|---|---|
| P1-a | T-D | `shell` → `core-coder` | (shell) `scripts/design-system/color-management/convert-hardcoded-colors.js` 의 매핑 대상 토큰을 `unified-design-tokens.css` 와 cross-check 하는 lint 스크립트 신설 → (coder) lint 실패 시 codemod abort, alias 충돌 시 명시적 우선순위 옵션 요구. 완료 조건: D4 매핑 10건 lint 통과, 가짜 토큰 1건 추가 시 abort 동작. | `/core-solution-frontend`, `/core-solution-standardization` | 기본 |
| P1-b | T-E | `core-designer` → `core-coder` → `core-tester` | (designer) surface/background-base/muted/secondary/sub 5종 alias 톤 분리 합의서 1장(라이트·다크 각 5톤 hex 표) → (coder) `unified-design-tokens.css` 라이트/다크 블록에 alias 5종 정의 추가 → (tester) weekend `.fc-non-business` 류 회귀 0건 확인. | `/core-solution-design-system-css`, `/core-solution-design-handoff` | designer/tester: `gemini-3.1-pro` |
| P2 | T-B | `core-designer` → `core-coder` → `core-tester` | (designer) D4 §2 다크 톤 추정치(info-bg `#082f49`, error-50 `#450a0a`, error-dark `#fca5a5`, success-600 `#6ee7b7`, brand-olive `#d9f99d`, info-dark `#bae6fd`) 컨펌·재조정 → (coder) `:root[data-theme="dark"]` 블록 정합 + 잔존 카운트 1,000 미만 확인 → (tester) 다크/라이트 양방향 시각 회귀, 어드민/임상/대시보드 우선 점검. | `/core-solution-design-system-css`, `/core-solution-standardization` | designer: `gemini-3.1-pro` |
| P3 | T-A | `core-coder` → `core-tester` → `core-deployer` | (coder) `rgba(R,G,B,A)` 공백·소수점 변형 정규식 추가, 3자리 HEX 케이스 인센서티브 정규화 잔존 케이스 매핑 → (tester) R-2 폴백 보호 343건 0감소 확인 + 시각 회귀 0건 → (deployer) 운영 반영 시 hardcoding 게이트 통과 확인. | `/core-solution-frontend`, `/core-solution-deployment` | 기본 |
| P4 | T-C | `core-planner` (별도 합의서) → `core-coder` | (planner) i18n Phase 2 진입 조건 합의서 신설(`docs/standards/I18N_ADOPTION_STRATEGY_2026Q2.md`) → (coder) namespace 분할·도메인 확장(공통/관리자/임상/내담자). | `/core-solution-planning`, `/core-solution-frontend` | 기본 |

> **검증 게이트 (필수)**: 모든 코드 변경 Phase는 `core-tester` 통과 전 완료 보고 금지 (`CORE_PLANNER_DELEGATION_ORDER.md` 강제 규칙).

---

## 5. 운영 게이트 위험 매트릭스

| 트랙 | 카운트 영향 | 시각 회귀 위험 | 다운타임 위험 | 종합 |
|---|---:|:---:|:---:|:---:|
| T-D codemod 가드 | 0 | 0 | 0 (인프라) | **Safe** |
| T-E alias 정착 | -0 ~ -10 | Low~Med (alias 5종 재계산) | 0 | **Low** |
| T-B 테마 고도화 | -5 ~ -50 (게이트 진입) | **Med~High** (다크모드 전영역) | 0 (CSS 변수) | **Med** |
| T-A rgba/3자리 흡수 | **-100 ~ -200** | Med (R-2 폴백 343건과 충돌 가능) | 0 | **Med** (T-D 선행 시 Low) |
| T-C i18n Phase 2 | 0 | 0 (별 트랙) | Low (번들 사이즈) | **Low** (단독 진행 시) |

> **다운타임 위험 0**: 전 트랙이 CSS 토큰/JS 인프라 변경이므로 백엔드 다운타임 없음. 운영 반영 시 frontend 정적 자원 배포 (~5분).

> **운영 게이트 진입 시나리오**:
> - T-D + T-E 만 적용: 1,005 → ~995~1,000 (안전 통과 보장 불가, **gap 0~10**)
> - T-D + T-E + T-B 적용: 1,005 → ~960~990 (**안전 통과**)
> - T-D + T-E + T-B + T-A 적용: 1,005 → ~800~900 (**여유 통과, T1-C 종결**)

---

## 6. 사용자 컨펌 필요 항목

### C1. D5 방향 확정 (필수)
- **질문**: D5 라운드를 **"하드코딩 추가 치환(T-A)"** 이 아닌 **"테마 오버라이드 고도화(T-B) + 가드 인프라(T-D) + alias 정착(T-E)"** 으로 방향 전환할지.
- **권장**: 본 합의서 §3 결정대로 **방향 전환 (Yes)**.

### C2. 다크 모드 톤 컨펌 (T-B 진입 조건)
- **질문**: D4 §2 의 다크 모드 추정치를 그대로 채택할지, 디자이너 재조정 1회 거칠지.
  - `info-bg` `#082f49`, `info-dark` `#bae6fd`
  - `error-50` `#450a0a`, `error-dark` `#fca5a5`
  - `success-600` `#6ee7b7`
  - `brand-olive` `#d9f99d`
- **권장**: `core-designer` 1회 재조정 후 확정 (`gemini-3.1-pro` 모델 권장, 디자인 트랙 룰).

### C3. brand-olive 공식화 (D4 §6 보류 → D5 결정)
- **질문**: `#6b7c32` (`--mg-color-brand-olive`) 를 **브랜드 팔레트 공식 편입** vs **타 톤 통합/폐기** 중 어느 쪽으로 결정할지.
- **영향**: 공식 편입 시 `mindgarden-design-system.pen` (B0KlA) 및 디자인 토큰 SSOT 동시 반영 필요.
- **권장**: 디자이너 컨펌 (1주 내).

### C4. emerald-600 vs success 통합 (D4 §6 잔존)
- **질문**: `#059669` (`--mg-color-success-600`) 를 기존 `--mg-color-success` (`#81C784`) 와 **통합** vs **success-600 / success-dark 신설 유지** 중 어느 쪽으로 결정할지.
- **영향**: 통합 시 기존 성공 색상 톤이 미세 변화 → 사용자 체감 가능.
- **권장**: 디자이너 컨펌 (T-B 진입 전).

### C5. i18n Phase 2 진입 조건 (T-C 트리거)
- **질문**: i18n Phase 2 진입 트리거를 어디로 잡을지.
  - (a) T-B 완료 직후 (~3주 후)
  - (b) 운영 게이트 < 800 도달 후 (~6주 후)
  - (c) 별도 분기, 색상 트랙과 무관하게 진행
- **권장**: **(a) T-B 완료 직후**, 단 별도 합의서(`I18N_ADOPTION_STRATEGY_2026Q2.md`) 신설 후 진입.

---

## 7. 후속 라운드 권장 (D6·D7 또는 R-6 시점 가늠)

| 라운드 | 시점 가늠 | 트리거 | 주요 트랙 | 비고 |
|---|---|---|---|---|
| **R-6 핫픽스 (예상)** | T-E 정착 직후 (~1주 내) | T-E alias 5종 정착으로 인한 잠재 시각 회귀 발견 시 | 회귀 보정 (소규모) | 발견되지 않으면 생략 가능 |
| **D5 본편 (T-B 중심)** | C2·C3·C4 컨펌 후 (~2주 내) | 사용자 컨펌 완료 | T-B 테마 고도화 + T-A 흡수 | 본 합의서 §3 2·3순위 실행 |
| **D6 (다크모드 토큰 표준화)** | D5 완료 후 (~4주 내) | 운영 게이트 < 1,000 안정 + 다크 톤 정착 | 다크모드 토큰 네이밍·계열 재정비 (50/100/500/800/dark 일관성) | D4 §6 토큰 네이밍 일관성 잔존 과제 흡수 |
| **D7 (T1-C 종결)** | D6 후 또는 T-A 미적용 시 (~6주 내) | T1-C 잔존 hex 100건 미만 도달 | T-A rgba/3자리 흡수 최종 잔존 클렌징 | T1 전체 트랙 종결 |
| **i18n Phase 2 진입** | C5 컨펌대로 (~3주 후) | 색상 트랙 안정화 | T-C 별도 합의서 (`I18N_ADOPTION_STRATEGY_2026Q2.md`) | 본 합의서 외부 트랙 |

---

## 8. 부록 — 미존재/참조 누락 보고

- `docs/standards/I18N_ADOPTION_STRATEGY_2026Q2.md` — **미존재**. T-C 진입 시 신설 필요 (§4 P4·§7 i18n 행).
- `docs/project-management/2026-05-21/HARDCODE_CLEANUP_HOTZONE_INVENTORY.md` — **미존재** (해당 일자 폴더에는 mood-journal 관련 문서 2건만 존재). 필요 시 `explore` 위임으로 인벤토리 재생성 권장.
- R-3·R-4·weekend·R-5 트랙의 시간순 회고는 본 합의서 §1.2 표로 통합 회고. 별도 회고 문서 신설은 후속 라운드 판단.

---

## 9. 변경 이력

| 일자 | 작성 | 내용 |
|---|---|---|
| 2026-05-21 | core-planner | D5 방향 합의서 신규 작성 (D4 §7 후속). 1순위 T-D + T-E 병렬, 2순위 T-B, 3순위 T-A, 4순위 T-C. 사용자 컨펌 5건 분리. |
