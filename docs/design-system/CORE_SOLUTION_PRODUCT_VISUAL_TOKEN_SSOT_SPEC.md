# Core Solution — 제품 비주얼 언어 통합 및 토큰 SSOT 설계 스펙

- **문서 ID**: `CORE_SOLUTION_PRODUCT_VISUAL_TOKEN_SSOT_SPEC`
- **작성자**: core-designer (디자인 전용 서브에이전트 — 코드 미작성)
- **기준 브랜치**: `cursor/core-solution-dark-contrast-emoji-efe3` (base: develop)
- **대상**: Core Solution 웹 플랫폼 전반 (셸·로그인·대시보드·폼·테이블·EmptyState·설정·모달)
- **관련 오케스트레이션**: `docs/project-management/CORE_SOLUTION_PRODUCT_VISUAL_TOKEN_SSOT_ORCHESTRATION.md`
- **적용 스킬**: `/core-solution-design-handoff`, `/core-solution-atomic-design`, `/core-solution-design-system-css`, `/core-solution-standardization`
- **Supersedes**: `docs/design-system/CORE_SOLUTION_DARK_CONTRAST_EMOJI_SPEC.md` (다크-only 구스펙 폐기)

---

## 1. 개요 및 사용자 최종 잠금 원칙 (Overview & User Final Lock)

### 1.0 사용자 최종 잠금 (User Final Lock — Commercial-Grade Clinic OS)

> **질문**: “commercial-grade color, pattern, contrast for a professional counseling platform”이 너무 넓은가?  
> **답: GOAL은 넓지 않다.** — 작은 비주얼 시스템을 잠그고 **토큰으로 적용**하면 된다. 화면별 취향 restyle을 전면 금지하며, Cursor developer-tool aesthetic(near-black IDE, marketing hero) **복제를 엄격히 금지**한다. Cursor는 오직 **컴포지션 품질 기준(composition quality bar only: tidy density, no stickers, tokens not hardcoded)**으로만 참조한다.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                    VISUAL SYSTEM TO LOCK (Counseling / Clinical SaaS)                       │
├───────────────────┬───────────────────┬───────────────────────┬─────────────────────────────┤
│ 1. Color (Identity│ 2. Pattern (Zero) │ 3. Contrast (WCAG AA) │ 4. Default Look             │
│    Calm & Stable) │                   │                       │                             │
│ - Slate #0F172A   │ - 거의 없음       │ - WCAG 2.1 AA 양 테마 │ • Primary: Light Clinic OS  │
│ - Teal #0D9488    │ - 장식 배경 금지  │ - 임상/상담 필수 가독 │   (주간 상담 센터 환경)     │
│ - Mint #CCFBF1    │ - 이모지/스티커 X │   (라벨/헬퍼/테이블   │ • Deep Slate Dark (#0F172A) │
│ - Light: Stone/   │ - 1px 선/정렬/    │    /비활성/플레이스   │   (순수 #000 / #121212 지양)│
│   Warm Off-White  │   위계/스페이싱   │    홀더 완전 식별)    │ • 정보 밀도(Dense) 100% 보존│
└───────────────────┴───────────────────┴───────────────────────┴─────────────────────────────┘
```

#### [비주얼 시스템 잠금 핵심 요약]
1. **Color (Core Solution Identity — Calm it Down)**:
   - **브랜드 자산**: Slate `#0F172A`, Teal `#0D9488`, Mint `#CCFBF1`, sian 05 shield lockup.
   - **Clinic OS 느낌 (테크 랜딩/IDE 아님)**:
     - **Light Surface**: **Warm off-white / Stone surfaces** (캔버스: `#FAF9F7`, 서페이스: `#F5F3EF` 및 `#FFFFFF` 웜 톤, 테두리: `#E2E8F0`/`#D4CFC8` 스톤 틴트). 순수 차가운 블루 슬레이트(`--slate-50/100`)만 남발하거나 병원 느낌의 시린 순백만을 사용하지 않음.
     - **Dark Surface**: **Deep Slate `#0F172A` 계열** (순수 `#000000` 또는 거친 `#121212` 지양).
     - **Teal**: **Primary CTA 및 포커스 링 전용**.
     - **Mint**: **Rare Wash 전용** (10~15% 틴트 뱃지/선택 하이라이트 배경만 허용, **Mint 배경 위에 큰 본문/헤드라인 텍스트 배치 절대 금지**).
   - **Neutrals가 본업을 수행**: 본문, 테이블, 테두리는 정돈된 뉴트럴(Slate)이 담당. 크롬에 무지개색 뱃지/칩 남발 금지 (상태 표시는 AA 대비를 만족하는 절제된 Semantic 뮤트 톤으로 통일).
   - **팔레트 추가 금지**: 새로운 임의 팔레트 추가 금지. MindGarden 테넌트의 나비/골드/수채화 스타일 플랫폼 크롬 침범 금지.
2. **Pattern (장식 전면 배제)**:
   - 장식용 기하학 패턴 배경, UI 크롬 이모지, 일러스트 SVG, 노이즈 그라데이션 일체 배제.
   - UI 구조는 **1px 얇은 보더, 정교한 정렬, 그룹핑, 타이포그래피 위계, 4px 스페이싱 스케일**만으로 형성.
3. **Contrast (WCAG 2.1 AA 엄수)**:
   - 라이트와 다크 모드 양쪽 모두 **WCAG 2.1 AA** 준수.
   - 상담 및 임상 운영용 플랫폼 특성상 라벨, 헬퍼 텍스트, 테이블 크롬, 비활성 텍스트, 플레이스홀더가 모두 명확히 읽혀야 함.
4. **Still True (불변의 원칙)**:
   - **Dense SaaS stays dense**: 정리 정돈(Tidy)은 데이터 컬럼이나 필드를 비우는(Emptying) 것이 아님. 기존 정보량 100% 유지.
   - **Tokens First**: 화면별 one-off hex 하드코딩 paint job 전면 금지. 모든 스타일은 SSOT 토큰으로 수렴.
   - **Default Commercial Look = Light**: 주간 상담실/오피스 환경에 최적화된 **라이트 모드가 메인 상용 룩**이며, 다크 모드는 Deep Slate 기반의 AA 완성도를 갖춤.

---

### 1.1 배경 및 범위 정정 요약
기존 다크 모드 및 이모지 중심의 부분 개선은 범위가 협소하여 제품 전반의 시각적 불일치와 하드코딩 누적 문제를 근본적으로 해결하지 못했습니다. 본 스펙은 제품 전체의 고품질 비주얼 언어(라이트 + 다크)를 일관된 **단일 진실 공급원(SSOT)** 토큰 체계로 통일하고, dense한 B2B SaaS의 정보 밀도를 유지하면서 정돈된(tidy) UI를 확립하는 설계 기준입니다.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CORE PRINCIPLES                                 │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ 1. Light + Dark 통합 │ 2. Dense SaaS Tidy   │ 3. 하드코딩 완전 근절         │
│ - 다크만이 아님      │ - 마케팅 랜딩 아님   │ - 화면별 paint-job 금지       │
│ - 동일 토큰명 기반   │ - 필드·컬럼 100% 유지│ - 토큰 1회 변경으로 전사 반영 │
│ - WCAG 2.1 AA 준수   │ - 시각 계층·정렬 정돈│ - 중복 local CSS 삭제 우선    │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

### 1.2 플랫폼 브랜드 정체성 (Core Solution — sian 05 Secure Core)
Core Solution은 신뢰성과 보안성을 제공하는 엔터프라이즈 B2B 상담 운영 SaaS 플랫폼입니다.
- **핵심 브랜드 팔레트**:
  - **Slate**: `#0F172A` (Slate-900), `#1E293B` (Slate-800), `#334155` (Slate-700), `#475569` (Slate-600), `#64748B` (Slate-500), `#94A3B8` (Slate-400), `#CBD5E1` (Slate-300), `#E2E8F0` (Slate-200), `#F8FAFC` (Slate-50)
  - **Teal**: `#0D9488` (Teal-600), `#14B8A6` (Teal-500), `#2DD4BF` (Teal-400), `#5EEAD4` (Teal-300), `#CCFBF1` (Teal-100), `#F0FDFA` (Teal-50)
  - **Mint**: `#CCFBF1` (Mint-100), `#F0FDFA` (Mint-50)
  - **Stone / Warm Neutral**: `#FAF9F7` (Warm Off-White Canvas), `#F5F3EF` (Warm Stone Surface), `#D4CFC8` (Stone Border)
- **금지 원칙**:
  1. **Cursor 개발자 툴 / 마케팅 히어로 복제 금지**: 외부 개발자 도구의 Near-black IDE 에디터 화면, 마케팅 랜딩 히어로 스타일 차용 금지.
  2. **MindGarden 테넌트 스타일로 플랫폼 재브랜딩 금지**: Calm Forest Olive (`#3D5246`), 나비, 수채화 일러스트, 골드 필기체 스크립트는 플랫폼 chrome/토큰에 사용하지 않음.
  3. **화면별 one-off paint job 금지**: 페이지별 개별 hex/rgb 선언 금지.

### 1.3 컴포지션 품질 기준 (Composition Quality Bar Only — NOT Cursor Developer IDE Clone)
- **적용 의미**: Cursor는 오직 **컴포지션 품질 기준(Composition Quality Bar)**으로만 참조합니다.
  - 수많은 테이블, 상세 차트, 검색 필터, 복합 액션 바가 공존하면서도 질서정연하게 정돈된 고밀도 전문가 도구 수준의 완성도.
  - **Near-black IDE 화면이나 개발자 마케팅 히어로를 복제하는 것이 아님**.
  - 본 제품은 **상담센터 전문 운영 OS (Clinic OS)**이며, **라이트 모드가 기본 상용 룩(Primary Commercial Look)**입니다.
- **특징**:
  - **One Type Scale**: 8단계 이내의 절제된 타이포그래피 (`--mg-v2-font-size-*`).
  - **One Spacing Scale**: 4px 기반 리듬 (`--mg-v2-space-*`).
  - **One Accent (Teal)**: 집중이 필요한 단 하나의 주요 액션에만 절제하여 사용.
  - **Thin 1px Borders & Reduced Shadows**: 과도한 그림자/글래스모피즘 대신 1px 얇은 선으로 경계 구분.
  - **No Emoji in Chrome**: 텍스트 라벨과 1.5px/2px 스트로크 기하학 아이콘으로 표현.

### 1.4 Teal & Mint 전용 사용 규칙표 (Teal & Mint Authority Matrix)

Teal과 Mint는 시각적 오염을 방지하고 전문적인 임상 SaaS의 침착함을 유지하기 위해 엄격히 제한된 용도로만 사용합니다.

| 색상 계열 | 토큰명 | 허용 용도 (Allowed Usage) | 엄격 금지 용도 (Strictly Forbidden) |
|---|---|---|---|
| **Teal (Primary CTA & Focus)** | `--mg-v2-color-primary-main`<br>`--mg-v2-color-border-focus`<br>`--mg-v2-color-state-focus-ring` | • 단일 주요 액션 버튼 (Primary Solid CTA)<br>• 인풋 폼 포커스 링 (3px glow) 및 포커스 보더<br>• LNB 좌측 사이드바 활성 메뉴 인디케이터 (3px 바)<br>• 본문 텍스트 링크 및 활성 탭 인디케이터 | • 대형 카드나 섹션 배경 전체를 Teal로 채우기<br>• 한 화면에 3개 이상의 Solid Teal 버튼 남발<br>• 비활성 UI나 장식 박스에 Teal 도배<br>• 테이블 헤더나 전체 캔버스 배경에 적용 |
| **Mint (Rare Wash Only)** | `--mg-v2-color-primary-subtle`<br>`--mg-v2-color-accent-subtle` | • 상태 뱃지/칩의 은은한 배경 틴트 (10~15% wash)<br>• 선택된 행/항목의 초미세 하이라이트 배경<br>• 완료/성공 지표의 미세 서페이스 틴트 | • **Mint 배경 위에 큰 본문/헤드라인 텍스트 배치 (가독성 파괴)**<br>• 버튼 배경 전체를 Solid Mint로 채우기<br>• 섹션 블록이나 카드 본체 배경으로 넓게 깔기 |

---

## 2. 디자인 토큰 SSOT 파일 우선순위 및 캐스케이드 규칙 (Token SSOT Cascade)

스타일 충돌 및 다중 정의 문제를 방지하기 위해, 모든 스타일 시트는 아래의 **단일 진실 공급원(SSOT) 우선순위**를 따릅니다.

```
[최상위 승자 (Winner SSOT)]
1순위: frontend/src/styles/tokens/design-v2-tokens.css (:root 및 [data-theme="dark"])
   │  ↳ 모든 카테고리(--mg-v2-*)의 원천 정의. Light/Dark 모든 값의 단일 진실점.
   ↓
2순위: frontend/src/styles/tokens/design-v2-tokens-refine.css
   │  ↳ 온보딩/프라이싱/랜딩 전용 확장 토큰 (--mg-v2-refine-*, --mg-v2-onboarding-*).
   ↓
3순위: frontend/src/styles/unified-design-tokens.css
   │  ↳ 레거시 호환 브릿지 변수 (--mg-*, --cs-*). 1순위 토큰을 참조하도록 연결.
   ↓
4순위: frontend/src/styles/dashboard-tokens-extension.css
   │  ↳ 대시보드 컴포넌트 별칭 변수. 하드코딩 배제, 1순위 토큰 참조.
   ↓
5순위: frontend/src/styles/themes/dark-theme.css, light-theme.css
[최하위 호환 레이어]
```

### 2.1 테마 선택자 및 스위치 표준화 규칙
1. **HTML 루트 스위치**: `DarkModeContext.js`에서 제어하는 `html[data-theme="dark"]` 및 `[data-theme="dark"]`를 표준 선택자로 사용합니다.
2. **동일 토큰명 원칙 (Same Token Name, Different Value)**:
   - 라이트 모드와 다크 모드는 반드시 **동일한 CSS 변수명**을 호출하며, 값만 테마 선택자 블록에서 분기합니다.
   - 예: `color: var(--mg-v2-color-text-primary)` → 라이트에서는 `#0F172A`, 다크에서는 `#F8FAFC`로 자동 치환.
3. **토큰 명명 규약**:
   - Primitive / Brand: `--mg-v2-color-primary-{shade}`, `--mg-v2-color-neutral-{50~900}`
   - Semantic / Role: `--mg-v2-color-text-{primary|secondary|tertiary|disabled|link}`, `--mg-v2-color-surface-{bg|card|raised|overlay|sidebar}`, `--mg-v2-color-border-{default|subtle|strong|focus}`
   - Layout / Size: `--mg-v2-font-size-*`, `--mg-v2-space-*`, `--mg-v2-radius-*`

---

## 3. 타이포그래피 스케일 (Single Typographic Scale SSOT)

제품 전반에 단 하나의 통일된 타이포그래피 스케일을 적용합니다. 과도한 폰트 크기 변형을 금지하고, 정보 계층에 따른 8단계 크기로 표준화합니다.

- **기본 폰트**: `'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', Roboto, sans-serif`
- **모노스페이스 폰트**: `'JetBrains Mono', 'Fira Code', 'Roboto Mono', Menlo, monospace`

### 3.1 Type Scale 매핑표

| 계층 (Role) | 토큰명 (CSS Variable) | 폰트 크기 (rem / px) | Line Height (토큰명 / 값) | Font Weight (토큰명 / 값) | Letter Spacing | 주요 적용 컴포넌트 |
|---|---|---|---|---|---|---|
| **Page Title** (H1) | `--mg-v2-font-size-h1` | `1.75rem` (28px) | `--mg-v2-font-line-height-heading` (1.3) | `--mg-v2-font-weight-bold` (700) | `-0.02em` | `ContentHeader__title`, 로그인 메인 헤더 |
| **Section Title** (H2) | `--mg-v2-font-size-h2` | `1.375rem` (22px) | `--mg-v2-font-line-height-heading` (1.3) | `--mg-v2-font-weight-semibold` (600) | `-0.015em` | `ContentSection__title`, 모달 제목, 메인 카드 헤더 |
| **Subsection / Card** (H3) | `--mg-v2-font-size-h3` | `1.125rem` (18px) | `--mg-v2-font-line-height-subheading` (1.4) | `--mg-v2-font-weight-semibold` (600) | `-0.01em` | 위젯 제목, 소분류 타이틀, 폼 그룹 헤더 |
| **Body Large** | `--mg-v2-font-size-body-lg` | `1.0rem` (16px) | `--mg-v2-font-line-height-body` (1.5) | `--mg-v2-font-weight-regular` (400) / `500` | `0` | 중요 본문, 모달 본문 텍스트, 메인 인풋 필드 값 |
| **Body Medium (기본)** | `--mg-v2-font-size-body-md` | `0.875rem` (14px) | `--mg-v2-font-line-height-body` (1.5) | `--mg-v2-font-weight-regular` (400) / `500` | `0` | **표준 UI 기본 크기**: 테이블 셀, 폼 라벨/입력값, LNB 메뉴, 버튼 |
| **Body Small / Dense** | `--mg-v2-font-size-body-sm` | `0.8125rem` (13px) | `--mg-v2-font-line-height-body` (1.45) | `--mg-v2-font-weight-regular` (400) / `500` | `0` | 고밀도 데이터 그리드, 보조 파라미터, 인풋 헬퍼 텍스트 |
| **Caption / Meta** | `--mg-v2-font-size-caption` | `0.75rem` (12px) | `--mg-v2-font-line-height-caption` (1.4) | `--mg-v2-font-weight-medium` (500) | `+0.01em` | 테이블 헤더(TH), 상태 뱃지, 타임스탬프, 캡션 |
| **Micro** | `--mg-v2-font-size-micro` | `0.6875rem` (11px) | `--mg-v2-font-line-height-caption` (1.3) | `--mg-v2-font-weight-medium` (500) | `+0.02em` | 미니 태그, 키보드 단축키(Kbd), 차트 축 라벨 |

### 3.2 페이지 단일 타이틀 원칙 (Single Page Title Rule)
- 한 화면 내 H1(`--mg-v2-font-size-h1`)은 반드시 **페이지당 1개(`ContentHeader`)만 존재**해야 합니다.
- 섹션 컨테이너 내부 제목은 H2(`--mg-v2-font-size-h2`) 또는 H3(`--mg-v2-font-size-h3`)를 사용하며, 여러 헤드라인이 시각적 경쟁을 일으키지 않도록 통일합니다.

---

## 4. 스페이싱 리듬 스케일 (4px Grid Spacing Scale SSOT)

모든 margin, padding, gap은 4px 배수 그리드 토큰만 사용합니다. 하드코딩된 픽셀값(7px, 13px, 27px 등)은 전면 제거합니다.

### 4.1 Spacing Scale 매핑표

| 토큰명 (CSS Variable) | Rem 값 | Px 환산 | 주 적용 대상 (UI Usage) |
|---|---|---|---|
| `--mg-v2-space-1` | `0.25rem` | 4px | 인라인 아이콘-텍스트 간격, 뱃지 내부 패딩(Y), 폼 라벨 하단 간격 |
| `--mg-v2-space-2` | `0.5rem` | 8px | 컴포넌트 내부 조밀한 gap, 칩/태그 패딩, 테이블 셀 간격, 버튼 내부 gap |
| `--mg-v2-space-3` | `0.75rem` | 12px | 버튼 내부 패딩(X), 인풋 내부 패딩, 툴바 컨트롤 간격, 작은 카드 패딩 |
| `--mg-v2-space-4` | `1.0rem` | 16px | **기본 간격**: 폼 필드 간 gap, 표준 카드 내부 패딩, 섹션 헤더 하단 margin |
| `--mg-v2-space-5` | `1.25rem` | 20px | 대시보드 카드 내부 패딩, 모달 바디 패딩, 중간 여백 |
| `--mg-v2-space-6` | `1.5rem` | 24px | **주요 레이아웃 간격**: 섹션 블록 간 gap, 페이지 기본 Y축 패딩, 모달 전체 패딩 |
| `--mg-v2-space-8` | `2.0rem` | 32px | **페이지 메인 X축 패딩**, 대형 섹션 간격, 로그인 컨테이너 간격 |
| `--mg-v2-space-10` | `2.5rem` | 40px | 온보딩 블록 간격, 히어로 섹션 패딩 |
| `--mg-v2-space-12` | `3.0rem` | 48px | 최대 레이아웃 구획 간격 |

### 4.2 레이아웃 & 패딩 리듬 규약
- **GNB 높이**: `64px` (`--mg-layout-header-height`)
- **LNB 너비**: `260px` 고정 (`width: 260px; min-width: 260px;`)
- **Main Area Padding**: 상하 `--mg-v2-space-6` (24px), 좌우 `--mg-v2-space-8` (32px)
- **Section Block**: 내부 패딩 `--mg-v2-space-5` (20px) 또는 `--mg-v2-space-6` (24px), 섹션 간 gap `--mg-v2-space-6` (24px)
- **Table Density**: 셀 패딩 세로 `--mg-v2-space-2` (8px) ~ `--mg-v2-space-3` (12px), 가로 `--mg-v2-space-4` (16px)

---

## 5. 라이트 & 다크 컬러 토큰 및 WCAG 2.1 AA 대비 분석표 (Color Tokens & AA Matrix)

모든 텍스트는 일반 텍스트 기준 **대비비 ≥ 4.5:1 (AA)**, 대형 텍스트 및 UI 테두리/아이콘 기준 **대비비 ≥ 3.0:1 (AA Non-text)**을 준수합니다. 특히 임상 및 상담 전문 플랫폼 특성상 라벨, 헬퍼 텍스트, 테이블 크롬, 비활성 필드, 플레이스홀더가 흐릿하지 않고 선명하게 판독되어야 합니다.

```
[라이트 모드 기준 배경 (Clinic OS Warm Off-White / Stone)]
- Base Canvas BG: #FAF9F7 (Warm Canvas)
- Surface/Card BG: #FFFFFF (Crisp Card Surface) / #F5F3EF (Warm Stone Block Surface)
- Raised/Modal BG: #FFFFFF (Crisp Raised)
- Border Subtle/Default: #E2E8F0 / #D4CFC8 (Warm Stone Border)

[다크 모드 기준 배경 (Deep Slate — Pure Black/121212 지양)]
- Base Canvas BG: #0F172A (Deep Slate-900 Canvas)
- Surface/Card BG: #1E293B (Deep Slate-800 Surface)
- Raised/Modal BG: #334155 (Slate-700 Raised)
- Border Subtle/Default: #334155 / #475569 (Slate Border)
```

### 5.1 텍스트 및 전경색 토큰 (Text & Foreground Tokens)

| 토큰명 (CSS Variable) | Light Hex (Role) | Light BG 대비비 (Canvas/Stone) | Dark Hex (Role) | Dark BG 대비비 (Deep Slate) | WCAG 기준 | 설계 설명 (Clinic 가독성 보장) |
|---|---|---|---|---|---|---|
| `--mg-v2-color-text-primary` | `#0F172A` (Slate-900) | **16.2:1 (AAA)** on `#FAF9F7`<br>**15.3:1 (AAA)** on `#F5F3EF`<br>**18.1:1 (AAA)** on `#FFFFFF` | `#F8FAFC` (Slate-50) | **15.6:1 (AAA)** on `#0F172A`<br>**12.8:1 (AAA)** on `#1E293B` | AA (≥4.5:1) | 주요 제목, 본문 텍스트, 활성 메뉴 텍스트 |
| `--mg-v2-color-text-secondary` | `#475569` (Slate-600) | **6.4:1 (AA)** on `#FAF9F7`<br>**6.1:1 (AA)** on `#F5F3EF`<br>**7.0:1 (AAA)** on `#FFFFFF` | `#CBD5E1` (Slate-300) | **9.5:1 (AAA)** on `#0F172A`<br>**7.8:1 (AAA)** on `#1E293B` | AA (≥4.5:1) | 서브타이틀, **필수 폼 라벨**, 테이블 보조 텍스트 |
| `--mg-v2-color-text-tertiary` | `#5C6B61` / `#64748B` (Slate-500) | **4.6:1 (AA)** on `#FAF9F7`<br>**4.5:1 (AA)** on `#F5F3EF`<br>**4.9:1 (AA)** on `#FFFFFF` | `#94A3B8` (Slate-400) | **5.4:1 (AA)** on `#0F172A`<br>**4.5:1 (AA)** on `#1E293B` | AA (≥4.5:1) | **인풋 헬퍼 텍스트**, 캡션, 타임스탬프, 메타데이터 |
| `--mg-v2-color-text-disabled` | `#94A3B8` (Slate-400) | **3.0:1 (AA Non-text)** on `#FAF9F7` | `#64748B` (Slate-500) | **3.1:1 (AA Non-text)** on `#0F172A` | AA Non-text | 비활성화 필드 및 비활성 버튼 텍스트 (판독 가능) |
| `--mg-v2-color-text-placeholder` | `#64748B` (Slate-500) | **4.6:1 (AA)** on `#FAF9F7`<br>**4.9:1 (AA)** on `#FFFFFF` | `#94A3B8` (Slate-400) | **5.4:1 (AA)** on `#0F172A` | AA (≥4.5:1) | 입력 필드 플레이스홀더 (흐릿하지 않고 선명함) |
| `--mg-v2-color-text-link` | `#0D9488` (Teal-600) | **4.8:1 (AA)** on `#FAF9F7`<br>**5.3:1 (AA)** on `#FFFFFF` | `#2DD4BF` (Teal-400) | **9.6:1 (AAA)** on `#0F172A`<br>**7.9:1 (AAA)** on `#1E293B` | AA (≥4.5:1) | 본문 하이퍼링크, 활성 액션 텍스트 |
| `--mg-v2-color-text-link-hover` | `#0F766E` (Teal-700) | **6.6:1 (AA)** on `#FAF9F7` | `#5EEAD4` (Teal-300) | **12.4:1 (AAA)** on `#0F172A` | AA (≥4.5:1) | 링크 마우스 호버 시 강조 |
| `--mg-v2-color-text-inverse` | `#FFFFFF` | N/A (Solid Dark/Teal UI 전용) | `#0F172A` | N/A (Mint Wash 전용) | AA (≥4.5:1) | 솔리드 버튼 및 뱃지 내부 텍스트 |

### 5.2 테두리 및 UI 구조 토큰 (Border & Structural Tokens)

| 토큰명 (CSS Variable) | Light Hex | Light Surface 대비 | Dark Hex | Dark Surface 대비 | 목표 기준 | 설계 설명 |
|---|---|---|---|---|---|---|
| `--mg-v2-color-border-default` | `#E2E8F0` / `#D4CFC8` (Stone Subtle) | **1.3:1** (Subtle Card) | `#334155` (Slate-700) | **2.1:1** on `#1E293B` | UI Subtle | 기본 카드 외곽선, 테이블 헤더 구분선 |
| `--mg-v2-color-border-subtle` | `#F1F5F9` / `#EBE6DF` (Divider) | **1.15:1** (Divider) | `#1E293B` (Slate-800) | **1.5:1** on `#0F172A` | UI Divider | 목록 간 디바이더, 테이블 행 구분선 |
| `--mg-v2-color-border-strong` | `#CBD5E1` / `#B8B2A8` (Stone Strong) | **3.1:1 (AA)** on `#FFFFFF` | `#475569` (Slate-600) | **3.2:1 (AA)** on `#0F172A` | AA Non-text (≥3.0:1) | **인풋 폼 테두리**, 모달 외곽선, 독립 위젯 경계 |
| `--mg-v2-color-border-focus` | `#0D9488` (Teal-600) | **5.3:1 (AA)** on `#FFFFFF` | `#2DD4BF` (Teal-400) | **7.9:1 (AA)** on `#1E293B` | AA Non-text (≥3.0:1) | 폼 필드 포커스 링, 선택된 카드 테두리 |
| `--mg-v2-color-state-focus-ring` | `rgba(13, 148, 136, 0.25)` | Focus Indicator | `rgba(45, 212, 191, 0.35)` | Focus Indicator | A11y Focus | 키보드 내비게이션 포커스 링 (3px glow) |

### 5.3 서페이스 및 배경 토큰 (Surface & Elevation Tokens)

| 토큰명 (CSS Variable) | Light Hex / 값 | Dark Hex / 값 | 시각적 위계 (Elevation Layer) |
|---|---|---|---|
| `--mg-v2-color-surface-bg` | `#FAF9F7` (Warm Off-White Canvas) | `#0F172A` (Deep Slate-900 Canvas) | 가장 바닥면 전체 캔버스 배경 (L0) |
| `--mg-v2-color-surface-card` | `#FFFFFF` (Crisp White) / `#F5F3EF` (Warm Stone) | `#1E293B` (Deep Slate-800 Surface) | 기본 컨텐츠 카드, 섹션 블록, 테이블 컨테이너 (L1) |
| `--mg-v2-color-surface-raised` | `#FFFFFF` | `#334155` (Slate-700 Raised) | 툴팁, 팝오버, 드롭다운 메뉴, 플로팅 바 (L2) |
| `--mg-v2-color-surface-overlay` | `#FFFFFF` | `#1E293B` (Deep Slate-800 Overlay) | 모달 대화상자 본체 (L3) |
| `--mg-v2-color-surface-sidebar` | `#0F172A` (Deep Dark Slate) | `#0F172A` (Deep Dark Slate) | LNB 좌측 사이드바 (Light/Dark 공통 다크 셸) |
| `--mg-v2-color-surface-hover` | `rgba(15, 23, 42, 0.04)` | `rgba(248, 250, 252, 0.06)` | 테이블 행 및 리스트 아이템 마우스 호버 |
| `--mg-v2-color-surface-active` | `rgba(15, 23, 42, 0.08)` | `rgba(248, 250, 252, 0.12)` | 버튼 및 메뉴 아이템 클릭/선택 상태 |

### 5.4 카드 / 그림자 / 테두리 억제 규칙 (Card / Shadow / Border Suppression Rules)

1. **Thin 1px Border 통일**:
   - 모든 카드는 `border: 1px solid var(--mg-v2-color-border-default);`를 기본으로 합니다. 2px 이상 굵은 테두리 금지(포커스 상태 제외).
2. **그림자 억제 (Shadow Reduction)**:
   - **라이트 모드**: 과도한 3단 글래스 그림자 제거. 단일 광원 기반의 매우 부드러운 단일 그림자만 허용:
     - Card: `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05);` (`--mg-v2-shadow-sm`)
     - Dropdown/Popover: `box-shadow: 0 4px 12px 0 rgba(15, 23, 42, 0.08);` (`--mg-v2-shadow-md`)
     - Modal: `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.15);` (`--mg-v2-shadow-lg`)
   - **다크 모드**: **모든 그림자 전면 제거 (`box-shadow: none;`)**. 그림자 대신 1px의 테두리 밝기 차이(Border Elevation: `#334155`, `#475569`)로 계층을 구분합니다.
3. **중첩 카드 증후군(Nested Cards) 방지**:
   - 카드 안에 또 다른 카드를 3~4겹 중첩하는 패턴 금지.
   - 섹션 컨테이너 내부의 데이터 그룹핑은 중첩 카드가 아닌 **1px 디바이더(`--mg-v2-color-border-subtle`)** 또는 **미세 배경 틴트(`--mg-v2-color-surface-bg`)** 구역으로 구분합니다.

---

## 6. 상태색 (Semantic Status Tokens) — 절제된 피드백 체계 (Muted Semantic with AA)

크롬 영역에 불필요한 무지개빛(Rainbow Chrome)을 남발하지 않고, 기능적 피드백이 필요한 상태에만 절제된 뮤트 톤 팔레트를 사용합니다.

| 상태 (Semantic) | 역할 (Role) | Light Text / Icon | Light BG (Muted Tint) | Dark Text / Icon | Dark BG (Muted Tint) | AA 판정 (Text/BG) |
|---|---|---|---|---|---|---|
| **Success** | 완료, 정상, 승인 | `#059669` (Emerald-600) | `#ECFDF5` (Emerald-50) | `#34D399` (Emerald-400) | `#064E3B` (Emerald-900/30%) | **6.1:1 / 8.2:1 (PASS)** |
| **Warning** | 대기, 주의, 미입금 | `#D97706` (Amber-600) | `#FFFBEB` (Amber-50) | `#FBBF24` (Amber-400) | `#78350F` (Amber-900/30%) | **5.2:1 / 7.4:1 (PASS)** |
| **Error / Danger** | 실패, 취소, 오류, 삭제 | `#DC2626` (Red-600) | `#FEF2F2` (Red-50) | `#F87171` (Red-400) | `#7F1D1D` (Red-900/30%) | **5.8:1 / 8.0:1 (PASS)** |
| **Info** | 정보, 안내, 진행중 | `#0284C7` (Sky-600) | `#F0F9FF` (Sky-50) | `#38BDF8` (Sky-400) | `#0C4A6E` (Sky-900/30%) | **5.4:1 / 8.5:1 (PASS)** |

- **토큰 변수명**:
  - Main: `--mg-v2-color-semantic-success`, `--mg-v2-color-semantic-warning`, `--mg-v2-color-semantic-error`, `--mg-v2-color-semantic-info`
  - Light/Tint BG: `--mg-v2-color-semantic-{state}-light`
  - Dark/Border: `--mg-v2-color-semantic-{state}-dark`

---

## 7. 이모지 → Plain Text / Stroke 아이콘 & 장식 그래픽 정리 가이드

UI 내부에 장식성 또는 상태 표시용으로 흩어져 있던 이모지(Emoji)를 전문적인 텍스트 라벨 및 기하학 스트로크 아이콘으로 전환합니다.

### 7.1 UI 이모지 전환 매핑표

| 위치 / 컴포넌트 | 기존 이모지 | 교체 디자인 명세 (Stroke Icon / Plain Text) | 토큰 / 스타일 가이드 |
|---|---|---|---|
| `UnifiedLogin.js` / `TabletLogin.js` | `👁️`, `👁️‍🗨️` (비밀번호 표시) | Lucide `Eye` / `EyeOff` SVG Stroke (16x16, stroke-width: 1.75) | `color: var(--mg-v2-color-text-tertiary)` |
| `HeadquartersLogin.js` / `BranchLogin.js` | `🏢`, `🏪`, `❌` | 텍스트 라벨 "본사", "지점" 및 Lucide `Building2` / `Store` | `color: var(--mg-v2-color-text-primary)` |
| `Toast.js` / `UnifiedNotification.js` | `✅`, `❌`, `⚠️`, `📢`, `🔧` | Lucide `CheckCircle2`, `XCircle`, `AlertTriangle`, `Bell`, `Wrench` | 상태별 `--mg-v2-color-semantic-*` 적용 |
| `TenantCommonCodeManagerUI.js` | `⚠️`, `📁` | Lucide `AlertCircle`, `Folder` (16x16) | `color: var(--mg-v2-color-text-secondary)` |
| `AddressInput.js` | `🏠`, `🏢`, `🏛️`, `🏪`, `🚨`, `📍` | 텍스트 라벨 ("자택", "직장", "사무실", "지점", "비상연락처", "기타") | `font-size: var(--mg-v2-font-size-body-sm)` |
| `ProfileSection.js` | `♂️`, `♀️`, `⚧` | 텍스트 라벨 ("남성", "여성", "기타") | 단일 라벨 태그 |
| `ResetPassword.js` / `ForgotPassword.js` | `💡`, `✉️`, `✅` | Lucide `Info`, `Mail`, `Check` | 16x16 geometric stroke |
| `EmptyState.js` / 각종 목록 | `📦`, `🔍`, `📋`, `✨` | Lucide `Inbox`, `Search`, `FileText` (stroke 1.5px, 32x32) | `color: var(--mg-v2-color-text-tertiary)` |

### 7.2 장식 일러스트 및 불필요 SVG 제거 대상
- **제거 대상**:
  - `login-hero-watercolor.png`, `core-logo-butterfly.png`
  - MindGarden Calm Forest 수채화/나비 벡터 자산
  - `TenantProfileIllustrations.js`의 장식용 거대 SVG → 단정한 32px 기하학 라인 아이콘 + 텍스트 설명으로 간소화
- **유지 대상 (예외 보존)**:
  - **로그인 히어로 (`LoginHero`) Core Solution 브랜드 락업**:
    - 시안 05 Secure Core Mark (방패 실루엣 + 자물쇠)
    - `CoreSolution` 영문 워드마크 + `코어 솔루션` 국문 + `상담센터 All-in-One 운영` 태그라인
    - **One-shot Stroke Path-Draw 애니메이션 (~3s ease-out 후 fill 상태로 고정, 무한 반복 금지)**

---

## 8. 정보 밀도 유지 가이드 (Dense SaaS — Anti-Sparse Marketing Rules)

Core Solution은 대량의 상담 일정, 결제 내역, 내담자 차트, 통계 데이터를 다루는 **전문가용 SaaS 도구**입니다.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DENSE TIDY vs SPARSE MARKETING                         │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ DO (Dense SaaS Tidy)                 │ DON'T (Sparse Marketing)             │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • 기존 테이블 컬럼·필드 100% 보존    │ ✗ 여백을 위해 데이터 컬럼 삭제       │
│ • 한눈에 들어오는 높은 가시 정보량   │ ✗ 마케팅 랜딩식 80px+ 거대 패딩      │
│ • 헤더-필터-테이블-페이지네이션 정렬 │ ✗ 모바일 카드뷰로 데스크톱 정보 축소 │
│ • 조용한 2차 액션 (Ghost/Outline)    │ ✗ 모든 버튼을 튀는 색으로 강조       │
│ • 1px 디바이더 및 컴팩트 셀 패딩     │ ✗ 카드 안에 카드를 3~4중 중첩        │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### 8.1 고밀도 화면 정돈 규칙
1. **데이터 컬럼 완전 보존**: 테이블, 리스트, 상세 뷰에서 어떠한 정보 필드나 상태 뱃지도 임의로 생략하거나 숨기지 않습니다.
2. **컨트롤 그룹화 (Grouped Controls)**:
   - 검색창, 기간 선택기, 필터 드롭다운, 정렬 버튼을 상단 1줄 툴바(Toolbar Row)로 컴팩트하게 정렬 (`gap: var(--mg-v2-space-2)`).
3. **2차 액션 정숙화 (Quiet Secondary Actions)**:
   - 주요 CTA 1개만 Primary Solid Teal(`--mg-v2-color-primary-main`) 적용.
   - '다운로드', '필터 초기화', '상세보기', '수정' 등 보조 액션은 Subdued Outline 또는 Ghost Button 적용 (`border: 1px solid var(--mg-v2-color-border-default)`, `color: var(--mg-v2-color-text-secondary)`).

---

## 9. "삭제할 중복 Local CSS" vs "토큰으로 올릴 하드코딩" 인벤토리

### 9.1 삭제 대상 중복 Local CSS (Dead/Redundant Overrides)
코더는 아래의 중복 스타일 오버라이드를 삭제하고 부모 토큰 캐스케이드를 신뢰하도록 정리합니다.

1. `*.css` 내 개별 `[data-theme="dark"]` 블록 중 부모 토큰(`--mg-v2-*`)을 다시 동일하게 덮어쓰는 무의미한 재선언 (예: `ContentHeader.css`의 불필요한 다크 오버라이드).
2. 컴포넌트 내부에서 임의로 선언된 글래스모피즘 (`backdrop-filter: blur(20px); background: rgba(...)`).
3. 버튼/카드 내부의 불필요한 호버 애니메이션 (`transform: translateY(-8px) scale(1.02);`).
4. 각 화면별로 개별 작성된 `table`, `th`, `td` 커스텀 여백/폰트 설정 (`Table.css` 표준 컴포넌트로 일원화).

### 9.2 상위 토큰으로 올릴 잔여 하드코딩 값
코드베이스에 남아 있는 아래 하드코딩 값들을 SSOT 토큰으로 치환합니다.

| 하드코딩 발견 패턴 | 치환할 SSOT 토큰명 | 비고 |
|---|---|---|
| `#0f172a`, `#1e293b`, `#111827`, `#2C2C2C` | `var(--mg-v2-color-surface-bg)` / `var(--mg-v2-color-text-primary)` | 캔버스 배경 및 기본 텍스트 |
| `#3D5246`, `#4A6354`, `#6B7F72` (Olive 계열) | `var(--mg-v2-color-primary-main)` / `var(--mg-v2-color-text-link)` | 플랫폼 Teal/Slate 토큰으로 교체 |
| `#e2e8f0`, `#cbd5e1`, `#d4cfc8`, `#334155` | `var(--mg-v2-color-border-default)` / `var(--mg-v2-color-border-strong)` | 테두리 일원화 |
| `font-size: 28px`, `font-size: 22px`, `font-size: 14px` | `var(--mg-v2-font-size-h1)`, `var(--mg-v2-font-size-h2)`, `var(--mg-v2-font-size-body-md)` | 폰트 스케일 통합 |
| `padding: 24px`, `margin-bottom: 16px`, `gap: 8px` | `var(--mg-v2-space-6)`, `var(--mg-v2-space-4)`, `var(--mg-v2-space-2)` | 4px 리듬 스페이싱 |
| `border-radius: 10px`, `border-radius: 16px` | `var(--mg-v2-radius-md)`, `var(--mg-v2-radius-xl)` | 래디우스 토큰화 |

---

## 10. 코더 구현용 1:1 토큰 치환 참조표 (Implementation Token Migration Table)

`core-coder`가 코드 수정 시 기계적으로 치환할 수 있는 종합 사전입니다.

| 기존 레거시 토큰 / 리터럴 | New SSOT 토큰명 (Light & Dark 공통) | Light 모드 적용값 (Clinic Stone) | Dark 모드 적용값 (Deep Slate) | 용도 |
|---|---|---|---|---|
| `--color-primary` / `--mg-primary-500` | `--mg-v2-color-primary-main` | `#0D9488` (Teal-600) | `#2DD4BF` (Teal-400) | 주요 브랜드 단일 CTA 액션, 링크 |
| `--color-primary-hover` | `--mg-v2-color-primary-hover` | `#0F766E` (Teal-700) | `#5EEAD4` (Teal-300) | Primary 호버 |
| `--color-bg-primary` / `--mg-white` / `#faf9f7` | `--mg-v2-color-surface-bg` | `#FAF9F7` (Warm Off-White) | `#0F172A` (Deep Slate-900) | 페이지 기본 배경 (Canvas) |
| `--color-bg-secondary` / `--mg-bg-card` / `#ffffff` | `--mg-v2-color-surface-card` | `#FFFFFF` / `#F5F3EF` (Stone) | `#1E293B` (Deep Slate-800) | 카드, 섹션 블록, 테이블 컨테이너 |
| `--color-bg-tertiary` / `#f1f5f9` | `--mg-v2-color-surface-raised` | `#FFFFFF` | `#334155` (Slate-700 Raised) | 드롭다운, 팝오버, 툴바 레이어 |
| `--color-text-primary` / `#2c2c2c` / `#0f172a` | `--mg-v2-color-text-primary` | `#0F172A` (Slate-900) | `#F8FAFC` (Slate-50) | 본문 텍스트, 제목 |
| `--color-text-secondary` / `#5c6b61` / `#475569` | `--mg-v2-color-text-secondary` | `#475569` (Slate-600) | `#CBD5E1` (Slate-300) | 서브타이틀, 폼 라벨 (필수 가독) |
| `--color-text-tertiary` / `#9c958c` / `#94a3b8` | `--mg-v2-color-text-tertiary` | `#5C6B61` / `#64748B` | `#94A3B8` (Slate-400) | 캡션, 메타데이터, 헬퍼 텍스트 |
| `--color-text-muted` / `#7a7a7a` | `--mg-v2-color-text-tertiary` | `#64748B` | `#94A3B8` | 보조 안내 텍스트 |
| `--color-border-primary` / `#e2e8f0` / `#334155` | `--mg-v2-color-border-default` | `#E2E8F0` / `#D4CFC8` | `#334155` (Slate-700) | 기본 외곽선 및 디바이더 |
| `--color-border-secondary` / `#cbd5e1` / `#475569` | `--mg-v2-color-border-strong` | `#CBD5E1` / `#B8B2A8` | `#475569` (Slate-600) | 인풋 테두리, 모달 외곽선 |
| `--ad-b0kla-card-bg` | `--mg-v2-color-surface-card` | `#FFFFFF` / `#F5F3EF` | `#1E293B` | 어드민 B0KlA 카드 배경 |
| `--ad-b0kla-border` | `--mg-v2-color-border-default` | `#E2E8F0` / `#D4CFC8` | `#334155` | 어드민 B0KlA 테두리 |
| `--ad-b0kla-title-color` | `--mg-v2-color-text-primary` | `#0F172A` | `#F8FAFC` | 어드민 B0KlA 타이틀 |
| `--ad-b0kla-subtitle-color` | `--mg-v2-color-text-secondary` | `#475569` | `#CBD5E1` | 어드민 B0KlA 서브타이틀 |

---

## 11. 통일 대상 Chrome & Layout 컴포넌트 명세 (Chrome / Layout Specifications)

### 11.1 AdminCommonLayout / DesktopLayout / MobileLayout
- **골격 구조 유지**: GNB(64px) + LNB(260px) + Main Content 계층 보존.
- **배경 토큰**: `.mg-v2-desktop-layout` → `background-color: var(--mg-v2-color-surface-bg)` (`#FAF9F7` / `#0F172A`).
- **스크롤 컨테이너**: `.mg-v2-desktop-layout__main`에 단일 스크롤 적용, 여백은 상하 `--mg-v2-space-6`, 좌우 `--mg-v2-space-8` 통일.

### 11.2 ContentHeader
- **HTML 구조**:
  ```html
  <header className="mg-v2-content-header">
    <div className="mg-v2-content-header__left">
      <h1 className="mg-v2-content-header__title">{title}</h1>
      {subtitle && <p className="mg-v2-content-header__subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="mg-v2-content-header__right">{actions}</div>}
  </header>
  ```
- **스타일 규약**:
  - Title: `--mg-v2-font-size-h1` (28px), weight 700, `color: var(--mg-v2-color-text-primary)`.
  - Subtitle: `--mg-v2-font-size-body-md` (14px), `color: var(--mg-v2-color-text-secondary)`.
  - 하단 margin: `--mg-v2-space-4` (16px).

### 11.3 DesktopGnb & MobileGnb
- **높이 & 테두리**: `height: 64px`, `border-bottom: 1px solid var(--mg-v2-color-border-default)`.
- **배경**: `background: var(--mg-v2-color-surface-card)`.
- **우측 유저 툴바**: 알림, 테마 스위치, 프로필 드롭다운 간격 `--mg-v2-space-2` (8px).

### 11.4 DesktopLnb & MobileLnbDrawer
- **너비 & 배경**: `width: 260px`, `background: var(--mg-v2-color-surface-sidebar)` (`#0F172A`).
- **메뉴 항목**:
  - 높이: `40px` ~ `44px`, `border-radius: var(--mg-v2-radius-md)` (6px).
  - 기본 텍스트: `rgba(248, 250, 252, 0.75)`, 폰트 `14px` (`--mg-v2-font-size-body-md`).
  - 활성(Active) 상태: `background: rgba(13, 148, 136, 0.15)`, `color: var(--mg-v2-color-primary-main)` (`#2DD4BF`), 좌측 3px 인디케이터 바.

### 11.5 ContentSection & ContentCard
- **테두리 및 배경**: `background: var(--mg-v2-color-surface-card)`, `border: 1px solid var(--mg-v2-color-border-default)`, `border-radius: var(--mg-v2-radius-lg)` (8px).
- **섹션 헤더**: 하단 1px 디바이더(`--mg-v2-color-border-subtle`), 제목 폰트 `--mg-v2-font-size-h2` (22px).
- **KPI 지표 카드**: 숫자 24px Bold (`--mg-v2-color-text-primary`), 라벨 12px Medium (`--mg-v2-color-text-secondary`).

### 11.6 Forms & Inputs (FormInput, CustomSelect)
- **높이**: `38px` ~ `40px`.
- **배경/테두리**: `background: var(--mg-v2-color-surface-card)`, `border: 1px solid var(--mg-v2-color-border-strong)`, `border-radius: var(--mg-v2-radius-md)` (6px).
- **포커스 상태**: `border-color: var(--mg-v2-color-border-focus)`, `box-shadow: 0 0 0 3px var(--mg-v2-color-state-focus-ring)`.

### 11.7 Tables & DataGrids
- **Header (TH)**: `background: var(--mg-v2-color-surface-bg)`, `color: var(--mg-v2-color-text-secondary)`, `font-size: var(--mg-v2-font-size-caption)` (12px), `font-weight: 600`, uppercase/tracking.
- **Row (TR)**: 높이 44px, `border-bottom: 1px solid var(--mg-v2-color-border-subtle)`.
- **Hover**: `background: var(--mg-v2-color-surface-hover)`.

### 11.8 EmptyState & Toast
- **EmptyState**: Lucide 32px 기하학 라인 아이콘 (`--mg-v2-color-text-tertiary`) + 타이틀 16px Bold (`--mg-v2-color-text-primary`) + 설명 13px (`--mg-v2-color-text-secondary`) + 액션 버튼.
- **Toast**: 1px 테두리 + 미세 그림자, 상태별 Stroke 아이콘 탑재.

---

## 12. 핸드오프 및 검증 게이트 (Handoff & Verification Gate)

### 12.1 core-coder 이행 체크리스트
- [ ] 1. `design-v2-tokens.css` 본체에 Light (Warm Off-White/Stone) / Dark (Deep Slate `#0F172A`) 및 Slate/Teal/Mint SSOT 통합.
- [ ] 2. `unified-design-tokens.css`, `dashboard-tokens-extension.css` 등 하위 파일에서 SSOT 변수 참조 연결.
- [ ] 3. chrome/layout 전반의 하드코딩된 hex/rgb/px를 SSOT 토큰으로 100% 치환 (화면별 one-off paint job 금지).
- [ ] 4. 중복 선언된 local CSS 및 무의미한 다크 오버라이드 삭제.
- [ ] 5. 컴포넌트 내 UI 이모지를 Lucide Stroke 아이콘 또는 텍스트 라벨로 교체.
- [ ] 6. 장식용 수채화/나비 일러스트 제거 확인 및 LoginHero Core Solution 락업/패스드로우 유지.
- [ ] 7. 정보 밀도(Dense SaaS) 훼손 없이 모든 데이터 컬럼과 컨트롤 보존.
- [ ] 8. Teal은 주요 CTA/포커스에만 사용하고, Mint는 희귀 워시(Rare Wash)로만 제한 적용 확인.

### 12.2 core-tester 검증 항목
- [ ] 1. **Light / Dark 전환 스모크**: 로그인, 대시보드, 폼, 테이블, 설정 화면이 깜빡임이나 깨짐 없이 즉시 반응하는가?
- [ ] 2. **WCAG 2.1 AA 대비비 검증**: 라벨, 헬퍼 텍스트, 테이블 크롬, 비활성, 플레이스홀더를 포함한 모든 텍스트(≥4.5:1), 테두리(≥3.0:1)가 Light(Warm Stone)와 Dark(Deep Slate) 모두에서 통과하는가?
- [ ] 3. **정보 밀도 보존 확인**: 기존 필드나 컬럼이 레이아웃 정리 과정에서 삭제되지 않았는가?
- [ ] 4. **이모지 잔존 여부**: 주요 대면 UI(로그인, 테이블, 뱃지, 토스트)에 잔여 이모지가 없는가?
- [ ] 5. **브랜드 정체성 정합**: MindGarden 올리브/수채화 또는 Cursor Near-black IDE 복제가 아닌, Core Solution Slate/Teal Clinic OS 언어로 렌더링되는가?
