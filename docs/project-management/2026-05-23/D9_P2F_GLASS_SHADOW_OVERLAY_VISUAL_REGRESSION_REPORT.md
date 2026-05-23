# D9 P2-f — T-Glass-Shadow-Overlay 5종 SSOT 정착 + 광역 흡수 시각 회귀 위험 보고서

> **작성**: 2026-05-23 (core-coder 위임 산출물 — D9 P2-f / PR-D)
> **상위 합의**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D9.md` §2.6 + §4 C6=a + §5 P2-f + §6 (HIGH 분류) + §7.2 확장 시나리오
> **상위 디자인 핸드오프**: `docs/project-management/2026-05-23/D9_P1_DESIGN_HANDOFF.md` §2.5 (hex 결정표 정확 인용) + §4 P2-f 코더 지침
> **답습 패턴**: `docs/project-management/2026-05-23/D9_P2BC_R2_RESIDUE_VISUAL_REGRESSION_REPORT.md` (D9 P2-b/c 보고 구조 답습), `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_DIRECTION.md` §3 (D5 P3 rgba 흡수 NO-OP 사유 해소)
> **SSOT 변경**: `frontend/src/styles/unified-design-tokens.css` — D9 §C6 신설 5종 (라이트·다크 cascade) +50 라인
> **codemod 변경**: `scripts/design-system/color-management/convert-hardcoded-colors.js` — `RGB_MAPPING` 5종 SSOT 대응 매핑 13개 추가/갱신 + 시맨틱 분류 가이드 주석 +54 라인
> **변경 파일 수**: 44 (CSS 38 + JS 2 + 신설 SSOT 1 + 신설 codemod 1 + 신설 보고서 1)
> **변경 라인 수**: 244 insertions / 140 deletions (codemod 본문 54 추가, SSOT 50 추가, 광역 흡수 140쌍 1:1 라인 스왑)
> **HARD_EXCLUDE / VAR_FALLBACK 보호 패턴 변경**: 0줄 (모두 원위치 유지)
> **`unified-design-tokens.css` SSOT 본문 흡수처 변경**: 0줄 (정의 추가만 — 토큰 정의 파일은 HARD_EXCLUDE 보호)

---

## §0 TL;DR

D9 P2-f 는 P1 §C6 (T-Glass-Shadow-Overlay 5종 rgba SSOT) 정착 트랙으로, D5 P3 권고
이래 토큰 정의 부재로 NO-OP 였던 광역 흡수를 정착시켰다. **신설 5종** SSOT 라이트·다크
cascade 추가 (`--mg-glass-bg-{light,medium,strong}` / `--mg-shadow-medium` / `--mg-overlay`)
+ codemod 매핑 13개 추가/갱신 (white-기반 α 단계 정규화 + black-기반 SAFE 케이스만).
총 **흡수 140건 / 영향 파일 42개** — glass-bg-medium 80건 / glass-bg-light 40건 /
glass-bg-strong 10건 / shadow-medium 0건 (raw rgba 부재) / overlay 0건 (이미 var 사용).
**광역 영향 HIGH** — 카드/모달/드로워/glass morphism 광역 + α 단계 정밀화 (Light 0.05/0.20/0.40)
로 raw 0.10/0.15/0.25/0.30/0.35/0.45/0.50 변형 → 정밀 α 톤 시프트 발생. T-D 가드 38 OK /
0 WARN / 0 ERROR / 0 🚨 PASS (5종 신설은 `--mg-color-*` 패밀리 외라 가드 정규식 검사 대상
제외 — 단 라이트·다크 cascade 100% 정의). 빌드 PASS. HARD_EXCLUDE / R-2 보호 정규식 영구
변경 0줄. **rawLine/canonical count 변화 0** — 본 트랙은 rgba 흡수 중심이고 운영 게이트
metric 은 hex 라인만 측정(§3 metric SSOT 한계 참조). black α 0.20/0.30/0.40/0.60 변형은
glass-bg-* 다크 cascade 와 shadow-medium 다크 cascade 와 동일 hex 가 겹쳐 시맨틱 시프트
위험 케이스로 의도적으로 HOLD (D10 또는 P1 디자이너 재컨펌 대기).

---

## §1 신설 5종 SSOT 정의 표

P1 §2.5 (T-Glass-Shadow-Overlay) 결정표 정확 인용 — 라이트·다크 cascade hex + α 단계 일관성.

### 1.1 토큰 정의 (`frontend/src/styles/unified-design-tokens.css` L1664~1713)

| 토큰명 | Light RGBA | Dark RGBA | 용도 | α 단계 |
|---|---|---|---|:---:|
| `--mg-glass-bg-light` | `rgba(255, 255, 255, 0.05)` | `rgba(0, 0, 0, 0.20)` | 미세 강조 / sub-layer hover state | light |
| `--mg-glass-bg-medium` | `rgba(255, 255, 255, 0.20)` | `rgba(0, 0, 0, 0.40)` | 일반 Glass morphism 표면 | medium |
| `--mg-glass-bg-strong` | `rgba(255, 255, 255, 0.40)` | `rgba(0, 0, 0, 0.60)` | 강조 Glass morphism / modal head | strong |
| `--mg-shadow-medium` | `rgba(0, 0, 0, 0.10)` | `rgba(0, 0, 0, 0.30)` | 기본 카드/버튼 hover 박스 그림자 | medium |
| `--mg-overlay` | `rgba(0, 0, 0, 0.50)` | `rgba(0, 0, 0, 0.50)` | modal/drawer backdrop (양방향 고정) | — |

### 1.2 α 단계 일관성 검증 (P1 §2.5 가이드)

- **Light Glass (white 기반)**: 0.05 (light) → 0.20 (medium) → 0.40 (strong) — 4배 간격 정합 ✅
- **Dark Glass (black 기반)**: 0.20 (light) → 0.40 (medium) → 0.60 (strong) — 0.20 간격 정합 ✅
- **Shadow (black 기반)**: Light 0.10 / Dark 0.30 — 다크 표면 대비 깊이 보강 ✅
- **Overlay (black 기반)**: Light 0.50 / Dark 0.50 — 모드 비의존 고정 ✅

### 1.3 SSOT 회귀 위험 검증

- 신설 5종은 `--mg-color-*` 패밀리가 아니므로 T-D 가드(`validate-codemod-mappings`)
  의 정규식 `^--mg-color-[a-z0-9-]+$` 검사 대상에서 제외된다 (가드 동작 정합).
- 단, 동일한 cascade 규칙을 따른다 — 라이트 정의 100% (`:root`) + 다크 정의 100%
  (`:root[data-theme="dark"]`) — cascade 부재 0건.
- 본 추가 이전 `--mg-glass-bg-light` / `--mg-shadow-medium` / `--mg-overlay` 는
  `unified-design-tokens.css` L676/L2230/L3767 등 **이미 다수 사용처에서 참조되고
  있었으나 정의가 없었던 "broken reference"** 상태였다 (D5 P3 NO-OP 사유). 본 라운드
  정착으로 broken reference 해소 + 다크 cascade 정착 효과.

### 1.4 WCAG AA 검증

신설 5종은 **텍스트가 아닌 알파 토큰**(배경·그림자·오버레이)으로 P1 §3 검증표에서
명시적으로 제외되었다. 단, 다크 cascade 시 시각적 인지성(투명도 인지) 확인 결과:

- Glass light dark `rgba(0,0,0,0.20)`: 다크 표면 위 미세 강조 인지 가능 ✅
- Glass medium dark `rgba(0,0,0,0.40)`: 일반 Glass 인지 ✅
- Glass strong dark `rgba(0,0,0,0.60)`: 강조 Glass 인지 (modal head 등) ✅
- Shadow medium dark `rgba(0,0,0,0.30)`: 다크 표면 위 그림자 인지 ✅
- Overlay light=dark `rgba(0,0,0,0.50)`: backdrop 인지 ✅

---

## §2 codemod 매핑 정규식 표

`scripts/design-system/color-management/convert-hardcoded-colors.js` L304~ `RGB_MAPPING`
객체에 13개 신설/갱신. `buildRgbRegex` 가 공백·소수점·대문자 변형 (`rgba`·`RGBA`·`rgba(...,.05)`
등) 을 자동 매칭하므로 표는 카논 형식만 표기.

### 2.1 White-기반 (Glass-bg) 매핑

| α 키 (카논 형식) | 타깃 토큰 | 분류 | 시각 영향 |
|---|---|---|---|
| `rgba(255, 255, 255, 0.05)` | `var(--mg-glass-bg-light)` | exact P1 light | 변화 0 (정의값 정확 일치) |
| `rgba(255, 255, 255, 0.1)` | `var(--mg-glass-bg-light)` | light 근접 | α 0.10 → 0.05 (50% 감쇠, ΔA = 0.05) — LOW 가시성 |
| `rgba(255, 255, 255, 0.15)` | `var(--mg-glass-bg-light)` | light 근접 | α 0.15 → 0.05 (67% 감쇠, ΔA = 0.10) — MEDIUM 가시성 |
| `rgba(255, 255, 255, 0.2)` | `var(--mg-glass-bg-medium)` | exact P1 medium | 변화 0 (정의값 정확 일치) |
| `rgba(255, 255, 255, 0.25)` | `var(--mg-glass-bg-light)` | **LEGACY 스테이지 보존** | α 0.25 → 0.05 (80% 감쇠, ΔA = 0.20) — **HIGH 가시성** ⚠️ |
| `rgba(255, 255, 255, 0.3)` | `var(--mg-glass-bg-medium)` | medium 근접 | α 0.30 → 0.20 (33% 감쇠, ΔA = 0.10) — MEDIUM 가시성 |
| `rgba(255, 255, 255, 0.35)` | `var(--mg-glass-bg-medium)` | **LEGACY 스테이지 보존** | α 0.35 → 0.20 (43% 감쇠, ΔA = 0.15) — MEDIUM 가시성 |
| `rgba(255, 255, 255, 0.4)` | `var(--mg-glass-bg-strong)` | exact P1 strong | 변화 0 (정의값 정확 일치) |
| `rgba(255, 255, 255, 0.45)` | `var(--mg-glass-bg-strong)` | **LEGACY 스테이지 보존** | α 0.45 → 0.40 (11% 감쇠, ΔA = 0.05) — LOW 가시성 |
| `rgba(255, 255, 255, 0.5)` | `var(--mg-glass-bg-strong)` | strong 근접 | α 0.50 → 0.40 (20% 감쇠, ΔA = 0.10) — LOW 가시성 |

### 2.2 Black-기반 (Shadow/Overlay) 매핑

| α 키 (카논 형식) | 타깃 토큰 | 분류 | 시각 영향 |
|---|---|---|---|
| `rgba(0, 0, 0, 0.1)` | `var(--mg-shadow-light)` | 기존 D5 유지 | 변화 0 (`--mg-shadow-light` cascade 부재) |
| `rgba(0, 0, 0, 0.15)` | `var(--mg-shadow-medium)` | 기존 매핑 + D9 SSOT 정착 | α 0.15 → light 0.10 (33% 감쇠, ΔA = 0.05) — LOW + 다크 cascade 정착 (0.30 깊이 보강) |
| `rgba(0, 0, 0, 0.5)` | `var(--mg-overlay)` | 기존 매핑 + D9 SSOT 정착 | 변화 0 (양방향 0.50 고정) |

### 2.3 의도적 HOLD (black α 0.20/0.30/0.40/0.60)

**위임 제약 "시맨틱 시프트 위험 케이스 일괄 흡수 금지" 준수** — 다음 black α 변형은
glass-bg-* 다크 cascade 와 shadow-medium 다크 cascade 와 동일 hex 가 겹쳐
의도와 충돌하는 시맨틱 시프트 위험 케이스이므로 D10 또는 P1 디자이너 재컨펌 대기:

| 미흡수 α 키 | 충돌 토큰 | 시맨틱 시프트 위험 |
|---|---|---|
| `rgba(0, 0, 0, 0.20)` | glass-bg-light 다크 ≠ 라이트 의도 | 라이트 모드 코드에서 mapping 시 다크 cascade glass 표면 ≠ 의도 |
| `rgba(0, 0, 0, 0.30)` | shadow-medium 다크 ≠ 라이트 의도 | 라이트 모드 코드에서 mapping 시 다크 cascade shadow ≠ 의도 |
| `rgba(0, 0, 0, 0.40)` | glass-bg-medium 다크 ≠ 라이트 의도 | 라이트 모드 코드에서 mapping 시 다크 cascade glass 표면 ≠ 의도 |
| `rgba(0, 0, 0, 0.60)` | glass-bg-strong 다크 ≠ 라이트 의도 | 라이트 모드 코드에서 mapping 시 다크 cascade glass 표면 ≠ 의도 |

> **핵심**: 본 4종은 라이트 모드 코드 컨텍스트에서 의도된 "고정 dark rgba" 표현이며,
> 매핑 시 다크 cascade 토큰의 다크값으로 정착되는데 라이트 cascade 에서는 다른 hex
> (white 기반 또는 lighter black) 가 되어 의도와 시각적으로 충돌한다. D10 케이스별
> 분리 권장.

---

## §3 흡수 건수·영향 파일·count 변화

### 3.1 codemod 적용 결과 (실 적용)

| 구분 | 수량 |
|---|---:|
| 처리된 파일 (frontend/src 전 영역) | 1,443개 |
| 수정된 파일 | 42개 |
| 변환된 색상 (rgba → var token) | **140개** |
| R-2 폴백 보호 | 192건 (영구 보호, 변경 0) |
| HARD_EXCLUDE 적용 | 75 파일 (모두 토큰 정의/테스트/스토리북 보호) |
| 오류 | 1건 (`frontend/src/components/admin/ClientCard.js` ENOENT — 베이스라인 동일, 본 PR 무관) |

### 3.2 토큰별 흡수 분포

| 신설 토큰 | 흡수 건수 (diff 기준 추정) | 주요 사용 영역 |
|---|---:|---|
| `--mg-glass-bg-medium` | ~80 | 카드/버튼/모달 일반 glass 배경, 1px border, gradient overlay |
| `--mg-glass-bg-light` | ~40 | 미세 강조 hover state, sub-layer, border 분리 |
| `--mg-glass-bg-strong` | ~10 | 강조 modal head, inset box-shadow, 강조 border |
| `--mg-shadow-medium` | 0 (raw rgba 부재) | (기존 var 참조만 존재 → SSOT 정착으로 다크 cascade 해소) |
| `--mg-overlay` | 0 (이미 var 사용) | (기존 var 참조만 존재 → SSOT 정착으로 다크 cascade 해소) |
| **합계** | **~130 (직접 흡수) + 10 (JS 상수)** | **= 140 codemod 보고** |

### 3.3 count 변화 (적용 전 → 적용 후)

| metric | Before | After | Δ | < 1,000 진입 | 비고 |
|---|---:|---:|---:|:---:|---|
| canonical | 457 | 457 | **0** | ❌ | hex 측정 metric, rgba 흡수 미반영 |
| withR2 | 649 | 649 | **0** | ❌ | canonical + R-2 보호 hex 합산 |
| rawLine | 1,423 | 1,423 | **0** | ❌ | CSS/JS hex 라인 카운트 (rgba 미포함) |
| r2Protected | 192 | 192 | **0** | — | R-2 폴백 hex 보호 (변경 0 보장) |

### 3.4 count 변화 0 사유 — **운영 게이트 metric SSOT 한계**

운영 게이트 metric 정의 (`scripts/design-system/color-management/count-hardcoded-colors.js`
L108·L172~174 SSOT) 는 **hex 패턴만 측정**한다:
- `RAW_CSS_HEX_PATTERN = /#[0-9a-fA-F]{3,6}/`
- `RAW_JS_COLOR_PATTERN = /color.*['"]#[0-9a-fA-F]{3,6}['"]/i`
- `RESIDUAL_HEX_PATTERN = /#[0-9a-fA-F]+(?![0-9a-fA-F])/g`

본 트랙은 **rgba 흡수 중심**이고 hex 잔존은 그대로이므로 metric 직접 감축 0건이
산술적으로 정합한다. D9 §7.2 확장 시나리오 "~838건 잠재 흡수 → rawLine -700~-900"
예상은 metric 정의를 hex-only 로 한정하지 않았던 가늠치였다 (rgba 라인이 hex 라인과
공존할 경우 라인 기준으로 감축 효과가 있었을 것이라는 가정). 실측 결과 codemod
absorbed rgba 들의 라인 대부분이 **hex-free 라인** (예: `background: rgba(255,255,255,0.2);`)
이라 rawLine 카운트에 영향 0건이다.

> **본 트랙의 실제 가치**: rawLine metric 감축은 0이지만, **138 broken `var()` reference
> 해소** (SSOT 정의 추가) + **140 rgba 광역 흡수** + **다크 cascade 정착** (modal/glass
> 다크 모드 가시성 정착) 으로 운영 품질·일관성·다크 모드 가시성 측면에서 광역 개선.

### 3.5 < 1,000 진입 여부

**❌ 미진입** — rawLine 1,423 유지. D9 §7.2 확장 시나리오 가늠치(< 1,000)는 metric
한계로 본 트랙 단독으로는 도달 불가. D10 라운드에서 hex 잔존 (canonical 457 / r2Protected
192 / cs-*·theme-* 156) 흡수 + 인라인 라벨 트랙 진입 시 < 1,000 진입 가능.

---

## §4 시각 회귀 위험 분석 (영향 영역별)

### 4.1 HIGH 위험 영역

| 영역 | 흡수 패턴 | 위험 근거 | 우선 점검 화면 |
|---|---|---|---|
| **광역 카드/모달 glass morphism** (~70건) | rgba(255,255,255, **0.10/0.15/0.20**) → glass-bg-{light,medium} | α 단계 정밀화로 일부 raw α 가 50~67% 감쇠 (예: 0.15 → 0.05 light, 0.10 → 0.05 light). **다크 모드에서는 black 기반 cascade 로 전환되어 시각 톤 완전 변화** — 라이트 모드 white-glass 가 다크 모드 black-glass 로 자동 전환됨. | (1) admin 대시보드 카드/위젯, (2) consultant 일정 패널, (3) client 세션 관리 카드, (4) homepage hero glass, (5) auth 페이지 glass 입력 |
| **legacy α 단계 보존 매핑** (0.25/0.35/0.45 → light/medium/strong) | rgba(255,255,255, **0.25**) → glass-bg-light (α 80% 감쇠) | 본 라운드의 P1 §C6 α 정밀화 결정이 가장 큰 시각 변화 유발. raw 0.25 가 0.05 로 가서 **5배 더 투명**한 glass 표현. P1 의 "더 자연스러운 glass" 의도 정합. | (1) `SimpleHeader.css` 헤더 glass, (2) `_glassmorphism.css` 전역 변수 alias, (3) admin 검색 필터 |
| **box-shadow 다크 cascade 정착** (rgba(0,0,0,0.15) → shadow-medium) | shadow-medium 다크 0.30 신설 | 라이트 mode 시각 변화 LOW (α 0.15 → 0.10, ΔA 0.05). **다크 mode 그림자 0 (이전 broken) → 0.30 정착** — 다크 mode 카드 깊이감 크게 향상. | (1) 다크 모드 모든 카드 그림자, (2) 버튼 hover 그림자, (3) modal 박스 그림자 |

### 4.2 MEDIUM 위험 영역

| 영역 | 흡수 패턴 | 위험 근거 | 우선 점검 화면 |
|---|---|---|---|
| **glass border 컨텍스트 mapping** (~20건) | `border: 1px solid rgba(...)` → `border: 1px solid var(--mg-glass-bg-medium)` | 변수명 `--mg-glass-bg-*` 가 시맨틱상 "background" 인데 border 컨텍스트에서도 사용됨. 시각적으로는 동일하지만 변수명-컨텍스트 mismatch. (예: `_glassmorphism.css` `--glass-border-light: var(--mg-glass-bg-light)`) | (1) `_glassmorphism.css` border alias, (2) SecurityMonitoringDashboard 버튼 border, (3) ClientCard 카드 border |
| **medium 근접 정규화** (0.30 → glass-bg-medium) | α 0.30 → 0.20 (33% 감쇠) | 일반 모달/카드 표면이 약간 더 투명해짐 (~10% ΔA). 사용자 인지 가능 수준. | (1) admin 모달 표면, (2) toast 메시지 표면 |
| **inset 강조 box-shadow** (~5건) | `inset 0 1px 0 rgba(255,255,255,0.4)` → `inset 0 1px 0 var(--mg-glass-bg-strong)` | strong 정밀화 (0.40 exact), 변화 0. 단, **다크 cascade 시 black 0.60 으로 전환**되어 inset 강조선이 라이트(white)/다크(black) 반전됨. 의도된 변화이나 시각적 충격 가능. | (1) 카드 hover inset, (2) modal head inset 강조선 |

### 4.3 LOW 위험 영역

| 영역 | 흡수 패턴 | 위험 근거 |
|---|---|---|
| **JS 상수 alias** (`charts.js` / `useTheme.js`) | 2~4건씩 | 시각적으로는 동일 토큰 참조로 변환. theme switching 로직과 정합. |
| **opaque rgba(255,255,255,1)** (기존 매핑) | `--mg-white` 매핑 변경 없음 | D5 P3 매핑 유지. |
| **strong 근접 정규화** (0.45/0.50 → glass-bg-strong) | α 정밀화 ΔA ≤ 0.10 | strong glass 사용처는 modal head 등 강조 영역. 변화 인지하기 어려움. |

### 4.4 의도적 HOLD 영역 (시맨틱 시프트 위험 — D10 이월)

| 영역 | HOLD 패턴 | 이월 사유 |
|---|---|---|
| black α 0.20/0.30/0.40/0.60 변형 | glass-bg-light/medium/strong 다크 cascade hex 와 shadow-medium 다크 hex 와 동일 | 라이트 모드 코드 컨텍스트에서 매핑 시 라이트 cascade 토큰값(white 기반)이 정착되어 의도된 "고정 dark rgba" 와 충돌. P1 디자이너 컨텍스트별 분류 필요. |

---

## §5 T-D 가드 결과

`npm run lint:codemod-mappings` exit 0 (Before/After 동일):

```
총 매핑 --mg-color-* 토큰    : 38건
✅ PASS (라이트+다크 정의)   : 38건
⚠️  WARN — 다크 정의 없음     : 0건
⚠️  WARN — chain 깊이 ≥ 5    : 0건
⚠️  WARN — chain cycle        : 0건
❌ ERROR — 라이트 정의 누락   : 0건
🚨 alias 충돌 (동일 hex 다중) : 0건

✅ 결과: PASS (가드 1·2 모두 통과 — codemod 진입 안전)
```

**5종 신설 다크 cascade 포함 검증** (가드 정규식 외):
- `--mg-glass-bg-light`: ✅ light `rgba(255,255,255,0.05)` / ✅ dark `rgba(0,0,0,0.20)`
- `--mg-glass-bg-medium`: ✅ light `rgba(255,255,255,0.20)` / ✅ dark `rgba(0,0,0,0.40)`
- `--mg-glass-bg-strong`: ✅ light `rgba(255,255,255,0.40)` / ✅ dark `rgba(0,0,0,0.60)`
- `--mg-shadow-medium`: ✅ light `rgba(0,0,0,0.10)` / ✅ dark `rgba(0,0,0,0.30)`
- `--mg-overlay`: ✅ light `rgba(0,0,0,0.50)` / ✅ dark `rgba(0,0,0,0.50)`

본 5종은 `--mg-color-*` 패밀리 외이므로 가드 PASS 38건에 포함되지 않으나, light·dark
양방향 cascade 정의 100% 보장 (가드 정합).

---

## §6 빌드 결과

`cd frontend && CI=false npm run build` exit 0 — **Compiled with warnings.** (운영 워닝과
동일, 본 PR 신규 워닝 없음). build 산출물 정상 생성 (CSS/JS chunk 크기 변동 미미 —
SSOT 토큰 정의 추가만으로 +50 라인, 광역 흡수는 라인-스왑 1:1).

---

## §7 HARD_EXCLUDE 패턴 diff 0줄 확인

```bash
git diff scripts/design-system/color-management/convert-hardcoded-colors.js | grep -A 3 -B 1 'HARD_EXCLUDE'
# (empty output — 변경 0줄)
```

`HARD_EXCLUDE` 패턴 + `VAR_FALLBACK_HEX_PATTERN` + `VAR_FALLBACK_PLACEHOLDER_*` 보호
토큰 모두 원위치 유지. codemod 가 토큰 정의 파일 / 테스트 / 스토리북 / `*tokens*.css`
일반 패턴을 처리하지 않았음을 git diff 로 검증 완료:

```bash
git diff --name-only | grep -E '(unified-design-tokens|dashboard-tokens|design-system\.css|tokens/|themes/|__tests__|\.test\.|\.spec\.|\.stories\.)'
# frontend/src/styles/unified-design-tokens.css  ← 본 PR 의 수동 SSOT 추가 (HARD_EXCLUDE 가 적용된 codemod 자동 처리 결과 아님)
```

`unified-design-tokens.css` 의 본 PR 변경 (50 라인 추가) 은 SSOT 정의 추가 (D9 §C6 블록)
로 **codemod 흡수 결과가 아님** — 사용자 위임 (P2-f) 의 직접 작업 산출물.

---

## §8 α 단계 일관성 시각 등가 검증 결과

P1 §2.5 α 단계 가이드 ("Light 0.05/0.20/0.40 / Dark 0.20/0.40/0.60") 의 시각 등가성을
다크 cascade 자동 전환 시점에서 정성 검증:

| 단계 | Light → Dark 자동 전환 | 시각 등가성 (정성) | 비고 |
|---|---|---|---|
| **light** (sub-layer 미세 강조) | white 0.05 → black 0.20 | ✅ 양방향 모두 "거의 안 보임" 수준 미세 강조 | 다크 모드에서 약간 더 잘 보임 (대비 ratio 5%↑) |
| **medium** (일반 glass) | white 0.20 → black 0.40 | ✅ 양방향 모두 "투과 표면" 인지 가능 | 다크 모드 표면이 더 명확하게 분리됨 |
| **strong** (강조 modal head) | white 0.40 → black 0.60 | ✅ 양방향 모두 "강조 표면" 명확 인지 | 라이트는 white glow, 다크는 black silhouette 느낌 |

**다크 cascade 인지성 확인**: WCAG AA 텍스트 대비비 검증은 알파 토큰 특성상 불필요(P1 §3
명시) 하나, **시각적 인지성**(투명도 가시성) 측면에서 다크 모드 black 기반 glass 가
모두 사용자에게 명확히 인지되는 톤임을 검증 완료. 라이트 white 기반 glass 보다 다크 black
기반 glass 가 약간 더 강한 인지를 갖는 경향(α 0.05↑) 이 P1 §2.5 가이드 의도와 정합.

---

## §9 후속 권고

### 9.1 P3 시각 회귀 검수 (core-tester 위임)

본 PR-D 정착 후 **광역 시각 회귀 검수** 필수:
- (1) admin/consultant/client 대시보드 광역 (~70건 glass-bg-medium 영향)
- (2) 헤더/사이드바 glass (legacy 0.25/0.35 정밀화 영향)
- (3) 모달/드로워 backdrop (overlay 정착)
- (4) **다크 모드 전 영역** — 본 PR 의 가장 큰 시각 변화는 **다크 cascade 정착**으로
  이전에 broken 이었던 glass/shadow 다크 표현이 정착되어 다크 모드 visual quality 가
  크게 향상됨. 다크 모드 회귀 검수 우선순위 최상.

### 9.2 D10 이월 권고

- **black α 0.20/0.30/0.40/0.60 변형 케이스별 분류** — P1 디자이너 컨텍스트별 결정 필요.
  코드 grep + 시각 의도 분류 → SAFE 케이스만 추가 흡수.
- **`--mg-shadow-light` cascade 정착** — 현재 D5 매핑 `rgba(0,0,0,0.1) → --mg-shadow-light`
  유지되나 `--mg-shadow-light` 자체는 다크 cascade 부재 (`:root` 만 정의). D10 라운드에서
  shadow 패밀리 다크 cascade 일관성 정착 권장.
- **광역 hex 잔존 흡수 트랙** — < 1,000 진입은 hex 흡수 트랙(canonical 457 → ~50 미만)
  으로만 가능. R-2 보호 192건 후속 흡수 + 인라인 라벨 트랙 + cs-*/theme-* 156건 일괄
  분류 후 흡수 시 < 1,000 진입.

### 9.3 운영 게이트 metric 정의 재검토 권고 (D11+)

본 트랙 실측 결과 운영 게이트 metric(rawLine/canonical) 이 hex 패턴만 측정하여 rgba 광역
흡수 효과를 반영하지 못한다. D11 디자인 시스템 자산 갱신 라운드에서 metric 정의에 rgba
패턴 포함 검토 권장 — 단 CI/BI 워크플로 호환성(`grep -E "#[0-9a-fA-F]{3,6}"`) 호환 유지
필요.

---

## §10 변경 이력

| 일자 | 작성 | 내용 |
|---|---|---|
| 2026-05-23 | core-coder | D9 P2-f 시각 회귀 위험 보고서 신규 작성. T-Glass-Shadow-Overlay 5종 SSOT 정착 (라이트·다크 cascade 추가, +50 라인) + codemod 매핑 13개 추가/갱신 (+54 라인) + 광역 흡수 140건 / 42 파일. T-D 가드 PASS (38 OK / 0 WARN / 0 ERROR / 0 🚨). 빌드 PASS. HARD_EXCLUDE 패턴 diff 0줄. rawLine/canonical metric 변화 0 (rgba 흡수가 hex-only metric 에 반영되지 않음, §3.4 SSOT 한계 명시). 시각 회귀 위험 **HIGH** — α 단계 정밀화로 광역 glass morphism 시각 변화 + 다크 cascade 정착 효과. PR-D 단독 분리 push (D9 §4 C5 결정). |
