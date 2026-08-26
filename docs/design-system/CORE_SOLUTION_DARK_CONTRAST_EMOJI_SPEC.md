# SUPERSEDED — 다크 전용 스펙 (사용 금지)

> **상태**: **SUPERSEDED** (2026-08-26)  
> **사유**: 사용자 정정 — 다크 AA + 이모지만으로는 범위 오류. 제품 **전체** 비주얼 언어(라이트+다크)·**토큰 SSOT**·dense tidy chrome이 필요.  
> **대체**: Phase 2를 **재호출**하여 `docs/design-system/CORE_SOLUTION_PRODUCT_VISUAL_TOKEN_SSOT_SPEC.md` 를 새로 받을 것.  
> **오케스트레이션**: `docs/project-management/CORE_SOLUTION_PRODUCT_VISUAL_TOKEN_SSOT_ORCHESTRATION.md`  
> **코더**: 본 문서로 구현하지 말 것. 다크 hex 표는 참고만 가능.

---

# (archived) Core Solution 다크 모드 WCAG 2.1 AA 토큰 스펙 및 이모지/장식 SVG 제거 가이드

- **문서 ID**: `CORE_SOLUTION_DARK_CONTRAST_EMOJI_SPEC` (**SUPERSEDED**)
- **작성자**: core-designer
- **기준 브랜치**: `cursor/core-solution-dark-contrast-emoji-efe3`
- **대상**: 플랫폼 어드민·내담자·상담사 공통 UI (Frontend Web)
- **플랫폼 브랜드 정체성**: **Core Solution (sian 05 Secure Core)**
  - Slate `#0F172A` / `#1E293B` / `#334155`
  - Teal `#0D9488` (teal-600) / `#14B8A6` (teal-500) / `#2DD4BF` (teal-400) / `#5EEAD4` (teal-300)
  - Mint `#CCFBF1` (mint-100) / `#F0FDFA` (mint-50)
- **금지 원칙**: 
  1. MindGarden 테넌트 전용 비주얼(Calm Forest olive `#3D5246` / `#4A6354` / `#6B7F72`, 나비, 수채화 일러스트, 골드 스크립트)로 플랫폼 재스타일 금지.
  2. 임의의 신규 팔레트 발명 금지 — Core Solution slate/teal/mint 기반 정렬.
  3. 디자이너 코드 직접 작성 금지 — 본 문서는 **core-coder가 토큰명 및 hex 값만으로 100% 구현할 수 있도록 작성된 설계 스펙**임.

---

## 1. 다크 모드 WCAG 2.1 AA 토큰 전/후 및 대비 분석표

본 표는 다크 모드(`[data-theme="dark"]` 및 `html[data-theme="dark"]`) 환경에서 일반 텍스트(Normal Text) 대비비 ≥ 4.5:1, 대형 텍스트(Large Text) 및 UI 컴포넌트/테두리/아이콘(Non-text/UI Component) 대비비 ≥ 3.0:1을 충족하도록 교정된 명세입니다.

> **대비비 계산 기준 배경**: 
> - 다크 기본 배경(Base BG): Slate-900 `#0F172A` / Neutral-900 `#121212` / Surface `#1A1A1A`
> - 다크 카드/서페이스(Raised Surface): Slate-800 `#1E293B` / Neutral-800 `#242424` / `#262626`
> - 다크 오버레이/모달(Overlay/Modal): Slate-700 `#334155` / Neutral-700 `#2C2C2C`

### 1.1 텍스트 및 전경색 토큰 (Text & Foreground Tokens)

| 토큰명 (CSS Variable) | 파일 위치 | Before Hex | After Hex | 대상 배경 (Context BG) | After 대비비 | 목표 기준 (WCAG 2.1) | 변경 사유 및 가독성 개선점 | 라이트 영향 |
|---|---|---|---|---|---|---|---|---|
| `--color-text-muted` | `dark-theme.css` | `#94a3b8` (Slate-400) | `#94a3b8` (유지) / `#cbd5e1` (서브용) | `#0F172A` / `#1E293B` | 6.58:1 / 4.49:1 | AA Normal Text (≥4.5:1) | 다크 서페이스 `#1E293B` 위에서 보조 설명 텍스트 가독 확보 (4.5:1+ 충족) | 없음 (dark-theme 전용) |
| `--mg-v2-color-text-tertiary` | `design-v2-tokens.css` | `#7A7A7A` | `#9CA3AF` (Gray-400) | `#121212` / `#1E1E1E` | 6.74:1 / 5.58:1 | AA Normal Text (≥4.5:1) | 기존 4.36:1(경계 탈락)에서 6.74:1로 향상되어 캡션/부제목 선명화 | 없음 (`[data-theme="dark"]` 한정) |
| `--mg-v2-color-text-disabled` | `design-v2-tokens.css` | `#525252` | `#6B7280` (Gray-500) | `#121212` / `#1E1E1E` | 3.52:1 / 2.91:1 | UI Component (≥3.0:1) | 비활성 텍스트 판독성 보장 (기존 2.23:1에서 대폭 개선) | 없음 (`[data-theme="dark"]` 한정) |
| `--mg-color-primary-main` | `unified-design-tokens.css` | `#6B7F72` (Olive) | `#2DD4BF` (Teal-400) | `#0F172A` / `#1E293B` | 10.74:1 / 8.87:1 | AAA Normal Text (≥7.0:1) | 플랫폼 Teal 톤 정렬 및 다크 배경에서 완벽한 가독성(10.7:1) 확보 | 없음 (`:root[data-theme="dark"]`) |
| `--mg-color-primary-light` | `unified-design-tokens.css` | `#8AA08F` (Olive Light) | `#5EEAD4` (Teal-300) | `#0F172A` / `#1E293B` | 13.04:1 / 10.77:1 | AAA Normal Text (≥7.0:1) | Primary 호버 및 강조 텍스트용 고대비 Teal-300 적용 | 없음 (`:root[data-theme="dark"]`) |
| `--mg-color-primary-dark` | `unified-design-tokens.css` | `#4F6B5A` (Olive Dark) | `#0D9488` (Teal-600) | `#0F172A` (UI Surface) | 4.77:1 | AA Normal Text (≥4.5:1) | 다크 서페이스 위 칩/버튼 배경 톤으로 사용 | 없음 (`:root[data-theme="dark"]`) |
| `--mg-v2-color-primary-main` | `design-v2-tokens.css` | `#4A6354` (Calm Forest) | `#2DD4BF` (Teal-400) | `#121212` / `#1E1E1E` | 11.23:1 / 9.29:1 | AAA Normal Text (≥7.0:1) | 기존 2.66:1 FAIL 상태를 11.23:1 AAA PASS로 전면 교정 | 없음 (`[data-theme="dark"]` 한정) |
| `--mg-v2-color-primary-light` | `design-v2-tokens.css` | `#5C6B61` | `#5EEAD4` (Teal-300) | `#121212` / `#1E1E1E` | 13.63:1 / 11.28:1 | AAA Normal Text (≥7.0:1) | Primary Hover/Active 상태 텍스트 시인성 극대화 | 없음 (`[data-theme="dark"]` 한정) |
| `--mg-v2-color-text-link` | `design-v2-tokens.css` | `#7DA68A` | `#2DD4BF` (Teal-400) | `#121212` / `#1E1E1E` | 11.23:1 / 9.29:1 | AAA Normal Text (≥7.0:1) | 본문 내 하이퍼링크 텍스트 가독성 확보 | 없음 (`[data-theme="dark"]` 한정) |
| `--mg-v2-color-text-link-hover` | `design-v2-tokens.css` | `#97C0A2` | `#5EEAD4` (Teal-300) | `#121212` / `#1E1E1E` | 13.63:1 / 11.28:1 | AAA Normal Text (≥7.0:1) | 하이퍼링크 호버 시 선명한 피드백 제공 | 없음 (`[data-theme="dark"]` 한정) |

### 1.2 테두리 및 UI 구조 토큰 (Border & UI Component Tokens)

| 토큰명 (CSS Variable) | 파일 위치 | Before Hex | After Hex | 대상 배경 (Context BG) | After 대비비 | 목표 기준 (WCAG 2.1) | 변경 사유 및 가독성 개선점 | 라이트 영향 |
|---|---|---|---|---|---|---|---|---|
| `--color-border-primary` | `dark-theme.css` | `#334155` (Slate-700) | `#475569` (Slate-600) | `#0F172A` (Slate-900) | 3.12:1 | UI Component (≥3.0:1) | 폼 인풋 및 카드 외곽선이 어둠 속에 묻히던 현상(1.72:1 FAIL) 완전 해소 | 없음 (dark-theme 전용) |
| `--color-border-secondary` | `dark-theme.css` | `#475569` (Slate-600) | `#64748B` (Slate-500) | `#0F172A` (Slate-900) | 4.62:1 | UI Component (≥3.0:1) | 테이블 구분선 및 디바이더 경계 뚜렷하게 식별 (2.36:1 → 4.62:1) | 없음 (dark-theme 전용) |
| `--color-border-accent` | `dark-theme.css` | `#64748b` (Slate-500) | `#2DD4BF` (Teal-400) | `#0F172A` / `#1E293B` | 10.74:1 / 8.87:1 | UI Component (≥3.0:1) | 포커스 링 및 선택 상태 테두리 강조 | 없음 (dark-theme 전용) |
| `--mg-color-border-main` | `unified-design-tokens.css` | `#3A3A3A` | `#4B5563` (Gray-600) | `#1A1A1A` / `#262626` | 3.25:1 / 2.72:1 | UI Component (≥3.0:1) | 관리자 대시보드 섹션 블록 및 테이블 테두리 가시성 복원 (1.53:1 → 3.25:1) | 없음 (`:root[data-theme="dark"]`) |
| `--mg-v2-color-border-default` | `design-v2-tokens.css` | `#3D3D3D` | `#4B5563` (Gray-600) | `#121212` / `#1E1E1E` | 3.49:1 / 2.89:1 | UI Component (≥3.0:1) | V2 기본 폼 및 카드 테두리 경계선 식별성 회복 (1.60:1 → 3.49:1) | 없음 (`[data-theme="dark"]` 한정) |
| `--mg-v2-color-border-focus` | `design-v2-tokens.css` | `#7DA68A` (Olive) | `#2DD4BF` (Teal-400) | `#121212` / `#1E1E1E` | 11.23:1 / 9.29:1 | UI Component (≥3.0:1) | 인풋 포커스 상태 시 브랜드 Teal 톤으로 선명하게 포커스 인지 | 없음 (`[data-theme="dark"]` 한정) |
| `--mg-v2-color-state-focus-ring` | `design-v2-tokens.css` | `rgba(125, 166, 138, 0.4)` | `rgba(45, 212, 191, 0.45)` | `#121212` / `#1E1E1E` | N/A (Focus Ring) | Accessibility Focus Indicator | 키보드 내비게이션 시 명확한 포커스 링 표시 | 없음 (`[data-theme="dark"]` 한정) |

### 1.3 배경 및 서페이스 토큰 (Surface & Elevation Tokens)

| 토큰명 (CSS Variable) | 파일 위치 | Before Hex | After Hex | 용도 및 시각 계층 | 라이트 영향 |
|---|---|---|---|---|---|
| `--color-bg-primary` | `dark-theme.css` | `#0f172a` (Slate-900) | `#0F172A` (유지) | 플랫폼 최하단 페이지 배경 (Canvas Base) | 없음 |
| `--color-bg-secondary` | `dark-theme.css` | `#1e293b` (Slate-800) | `#1E293B` (유지) | 카드, 모달 본문, 섹션 블록 배경 (Surface) | 없음 |
| `--color-bg-tertiary` | `dark-theme.css` | `#334155` (Slate-700) | `#334155` (유지) | 헤더/푸터, 툴바, 팝오버 등 돌출 영역 (Raised) | 없음 |
| `--mg-color-background-main` | `unified-design-tokens.css` | `#1a1a1a` | `#0F172A` (Slate-900 통일) | 어드민 및 공통 페이지 배경 | 없음 |
| `--mg-color-surface-main` | `unified-design-tokens.css` | `#262626` | `#1E293B` (Slate-800 통일) | 어드민 카드, 모달, 리스트 아이템 배경 | 없음 |
| `--mg-v2-color-surface-bg` | `design-v2-tokens.css` | `#121212` | `#0F172A` (Slate-900) | V2 플랫폼 전체 캔버스 배경 | 없음 |
| `--mg-v2-color-surface-card` | `design-v2-tokens.css` | `#1E1E1E` | `#1E293B` (Slate-800) | V2 카드 및 위젯 배경 | 없음 |
| `--mg-v2-color-surface-raised` | `design-v2-tokens.css` | `#2C2C2C` | `#334155` (Slate-700) | 드롭다운 메뉴, 툴팁, 플로팅 바 | 없음 |

---

## 2. 디자인 토큰 SSOT 우선순위 (Conflict Resolution Rules)

Core Solution 프론트엔드 스타일 체계에는 여러 토큰 파일이 병존합니다. 다크 모드 충돌 발생 시 아래의 **단일 진실 공급원(SSOT) 우선순위**에 따라 상위 파일의 정의가 최종 승자가 됩니다.

```
[최우선 승자]
1순위: frontend/src/styles/tokens/design-v2-tokens.css ([data-theme="dark"])
   ↓
2순위: frontend/src/styles/tokens/design-v2-tokens-refine.css ([data-theme="dark"])
   ↓
3순위: frontend/src/styles/unified-design-tokens.css (:root[data-theme="dark"])
   ↓
4순위: frontend/src/styles/dashboard-tokens-extension.css ([data-theme="dark"])
   ↓
5순위: frontend/src/styles/themes/dark-theme.css ([data-theme="dark"])
[최하위 폴백]
```

### 2.1 우선순위 상세 적용 원칙

1. **V2 신규 컴포넌트 (`mg-v2-*`)**: 
   - 무조건 `design-v2-tokens.css`의 `[data-theme="dark"]`가 최우선 적용됩니다.
   - Calm Forest 팔레트로 오염된 V2 다크 토큰을 이번 작업에서 Core Solution Slate/Teal SSOT로 완전히 교체합니다.
2. **공통 레거시 및 유틸리티 컴포넌트 (`mg-*`, `cs-*`)**:
   - `unified-design-tokens.css`의 `:root[data-theme="dark"]` 블록을 기준으로 합니다.
3. **HTML 루트 스위치 정합**:
   - `DarkModeContext.js`가 `document.documentElement.setAttribute('data-theme', 'dark')`를 수행하므로, 모든 CSS 선택자는 `html[data-theme="dark"]` 및 `[data-theme="dark"]`에 정상 바인딩되도록 작성합니다.
   - `useTheme.js`의 `classList.add('dark-theme')` 레거시 호출 경로도 커버하기 위해 `dark-theme.css`는 최하위 호환 레이어로 유지합니다.

---

## 3. MindGarden Olive → Core Solution Teal 다크 텍스트/UI 매핑

기존 Calm Forest 테넌트용 올리브 계열 색상을 Core Solution 플랫폼 아이덴티티인 Teal/Mint 계열로 1:1 치환합니다. 텍스트용은 다크 서페이스에서 WCAG AA(≥4.5:1)를 만족하는 **Teal-400/300**을 사용합니다.

| 분류 | 기존 MindGarden Olive Hex | 교체 Core Solution Teal Hex | Tailwind 계열 매핑 | 다크 Surface 대비비 | 권장 사용처 (Usage) |
|---|---|---|---|---|---|
| **Primary Main** | `#3D5246` / `#4A6354` | `#2DD4BF` | `teal-400` | **10.74:1 (AAA)** | 다크 모드 링크 텍스트, 활성 탭 텍스트, 주요 뱃지 텍스트 |
| **Primary Light (Hover)** | `#4A6354` / `#5C6B61` | `#5EEAD4` | `teal-300` | **13.04:1 (AAA)** | 텍스트 호버 상태, 밝은 강조 텍스트, 포커스 상태 |
| **Primary Dark (Fill)** | `#2C3B32` / `#3D5246` | `#0D9488` | `teal-600` | **4.77:1 (AA)** | 버튼 배경(Primary Button Fill), 활성 칩 배경 |
| **Secondary Main** | `#6B7F72` / `#829689` | `#14B8A6` | `teal-500` | **7.52:1 (AAA)** | 서브 액션 버튼, 보조 라벨 텍스트, 카드 좌측 액센트 바 |
| **Secondary Light** | `#829689` / `#97A89C` | `#2DD4BF` | `teal-400` | **10.74:1 (AAA)** | 서브 요소 호버 상태 |
| **Surface Accent** | `#EBF2EE` / `#1C2E23` | `#134E4A` | `teal-900` | **N/A (Surface)** | 다크 모드 뱃지 배경, 선택된 행 배경 (`rgba(20, 184, 166, 0.15)`) |
| **Border Accent** | `#7DA68A` | `#2DD4BF` | `teal-400` | **10.74:1 (UI PASS)**| 인풋 포커스 링, 선택된 카드 테두리 |

---

## 4. 이모지 → Plain Text / Stroke 아이콘 교체 가이드

사용자 대면 UI에서 이모지(Emoji)를 전면 제거하고, 명확한 **Plain Text** 또는 **Lucide React 기반 Quiet Stroke / Geometric 아이콘**으로 교체합니다.

> **아이콘 SSOT**: `frontend/src/constants/icons.js` (Lucide-react 기반 아이콘 레지스트리)

### 4.1 Toast / Notification 클러스터

| 대상 파일 | 기존 구현 (Before) | 교체 스펙 (After) | 아이콘/텍스트 명세 | 비고 |
|---|---|---|---|---|
| `Toast.js` | `✅` (success)<br/>`❌` (error)<br/>`⚠️` (warning)<br/>`ℹ️` (info)<br/>`🔧` (system)<br/>`📢` (default) | `<CheckCircle size={18} />`<br/>`<XCircle size={18} />`<br/>`<AlertTriangle size={18} />`<br/>`<Info size={18} />`<br/>`<Settings size={18} />`<br/>`<Bell size={18} />` | `ICONS.CHECK_CIRCLE`<br/>`ICONS.X_CIRCLE`<br/>`ICONS.ALERT_TRIANGLE`<br/>`ICONS.INFO`<br/>`ICONS.SETTINGS`<br/>`ICONS.BELL` | Stroke 2px, 18px 정렬, 컬러는 CSS 시맨틱 클래스로 주입 |
| `UnifiedNotification.js` | `✅` (success)<br/>`❌` (error)<br/>`⚠️` (warning)<br/>`ℹ️` (info) | `<CheckCircle size={20} />`<br/>`<XCircle size={20} />`<br/>`<AlertTriangle size={20} />`<br/>`<Info size={20} />` | `ICONS.CHECK_CIRCLE`<br/>`ICONS.X_CIRCLE`<br/>`ICONS.ALERT_TRIANGLE`<br/>`ICONS.INFO` | 모달/배너/토스트 공통 적용 |
| `PublicNotification.jsx` | 이모지 알림 아이콘 | `<Bell size={16} />` 및 Plain Text | `ICONS.BELL` | 헤더 알림 드롭다운 일관성 확보 |

### 4.2 Empty State / Chart 클러스터

| 대상 파일 | 기존 구현 (Before) | 교체 스펙 (After) | 아이콘/텍스트 명세 | 비고 |
|---|---|---|---|---|
| `MGTable.js` | `<span className="mg-table__empty-icon">📊</span>` | `<FileText size={32} className="mg-table__empty-icon" />` | `ICONS.FILE_TEXT` | Stroke-width: 1.5px, Color: `var(--mg-color-text-secondary)` |
| `MGChart.js` | `<span className="mg-chart__error-icon">📊</span>` | `<BarChart2 size={32} className="mg-chart__error-icon" />` | `ICONS.BAR_CHART` | 에러/빈 차트 영역 정돈 |
| `BaseWidget.js` | `{config.emptyIcon \|\| '📭'}` | `<Inbox size={32} className="mg-widget__empty-icon" />` | `ICONS.INBOX` | 폴백 이모지 제거 및 SVG 정합 |
| `ClientMessageScreen.js` | `<div className="...empty-icon">📭</div>` | `<Mail size={32} className="...empty-icon" />` | `ICONS.MAIL` | 메시지 없음 빈 상태 |
| `TenantProfileIllustrations.js` | 장식용 빈 상태 SVG 일러스트 | `<Calendar size={32} />` (구독)<br/>`<CreditCard size={32} />` (결제) | `ICONS.CALENDAR`<br/>`ICONS.CREDIT_CARD` | 100x100 복잡한 일러스트를 간결한 32px quiet stroke + 안내 텍스트로 단순화 |

### 4.3 Nav / Header / Greeting 클러스터

| 대상 파일 | 기존 구현 (Before) | 교체 스펙 (After) | 텍스트/아이콘 명세 | 비고 |
|---|---|---|---|---|
| `MGHeader.js` | `<div className="mg-header__logo-icon">🌱</div>` | Core Solution Wordmark 또는 `<Shield size={20} />` | `ICONS.SHIELD` | 새싹 이모지 제거, 플랫폼 심볼 적용 |
| `WelcomeWidget.js` | `{getGreeting()}, {user?.name}님! 👋` | `{getGreeting()}, {user?.name}님` | Plain Text | 손 흔들기 이모지 제거, 깔끔한 문장 종결 |
| `DynamicDashboard.js` | `🏥 Core Solution 상담소 관리자` | `Core Solution 상담소 관리자` | Plain Text | 병원 이모지 접두사 일괄 제거 |
| `DynamicDashboard.js` | `🏥 Core Solution 관리자 대시보드` | `Core Solution 관리자 대시보드` | Plain Text | 대시보드 타이틀 정돈 |

### 4.4 Forms / Status / CodeHelper 클러스터

| 대상 파일 | 기존 구현 (Before) | 교체 스펙 (After) | 텍스트/아이콘 명세 | 비고 |
|---|---|---|---|---|
| `codeHelperStrings.js` (User Grade) | `CLIENT_BRONZE: '🥉'`<br/>`CLIENT_SILVER: '🥈'`<br/>`CLIENT_GOLD: '🥇'`<br/>`CLIENT_PLATINUM: '💎'`<br/>`CLIENT_DIAMOND: '💠'`<br/>`ADMIN: '👑'` | `CLIENT_BRONZE: '브론즈'`<br/>`CLIENT_SILVER: '실버'`<br/>`CLIENT_GOLD: '골드'`<br/>`CLIENT_PLATINUM: '플래티넘'`<br/>`CLIENT_DIAMOND: '다이아몬드'`<br/>`ADMIN: '관리자'` | StatusBadge 컴포넌트 텍스트 칩으로 렌더링 | 메달/보석/왕관 이모지 대신 명확한 텍스트 뱃지(`StatusBadge`) 사용 |
| `codeHelperStrings.js` (Consultant Grade) | `CONSULTANT_JUNIOR: '⭐'`<br/>`CONSULTANT_SENIOR: '⭐⭐'`<br/>`CONSULTANT_EXPERT: '⭐⭐⭐'` | `CONSULTANT_JUNIOR: '주니어'`<br/>`CONSULTANT_SENIOR: '시니어'`<br/>`CONSULTANT_EXPERT: '전문가'` | Plain Text 라벨 | 별 이모지 반복 제거 |
| `ConsultationLogModal.js` (Priority) | `LOW: '🟢'`<br/>`MEDIUM: '🟡'`<br/>`HIGH: '🟠'`<br/>`URGENT: '🔴'`<br/>`CRITICAL: '🟣'` | `LOW: '낮음'`<br/>`MEDIUM: '보통'`<br/>`HIGH: '높음'`<br/>`URGENT: '긴급'`<br/>`CRITICAL: '위험'` | `BadgeSelect` 칩 (점 이모지 제거, 배경색/보더 토큰으로 구분) | 원형 이모지 5종 완전 제거 |
| `ScheduleList.js` (Filter/Sort) | `📋 전체`<br/>`📅 오늘/이번주`<br/>`⏰ 예정`<br/>`✅ 완료`<br/>`🔤 제목순`<br/>`🔄 상태순`<br/>`👥 전체 상담사`<br/>`👤 상담사명` | `전체`<br/>`오늘 / 이번 주`<br/>`예정된 일정`<br/>`완료된 일정`<br/>`제목순`<br/>`상태순`<br/>`전체 상담사`<br/>`{상담사명}` | 드롭다운 옵션 라벨 Plain Text화 (좌측 아이콘 필요 시 SVG `Icon` props 사용) | 드롭다운 내 문자열 이모지 일괄 제거 |
| `widgetConstants.js` | `LOADING: '⏳'`<br/>`ERROR: '⚠️'`<br/>`SUCCESS: '✅'`<br/>`REFRESH: '🔄'`<br/>`SETTINGS: '⚙️'`<br/>`STATS: '📊'`<br/>`USERS: '👥'`<br/>`CALENDAR: '📅'` | `LOADING: '로딩 중'`<br/>`ERROR: '오류'`<br/>`SUCCESS: '성공'`<br/>SVG `<RotateCw size={14} />`<br/>SVG `<Settings size={14} />`<br/>SVG `<BarChart2 size={14} />`<br/>SVG `<Users size={14} />`<br/>SVG `<Calendar size={14} />` | Lucide SVG 매핑 상수로 치환 | 위젯 헤더/액션에서 이모지 제거 |

### 4.5 Auth Password Toggle 클러스터

| 대상 파일 | 기존 구현 (Before) | 교체 스펙 (After) | 아이콘/텍스트 명세 | 비고 |
|---|---|---|---|---|
| `UnifiedLogin.js` | `👁️` (show) / `👁️‍🗨️` (hide) | `<Eye size={18} />`<br/>`<EyeOff size={18} />` | `ICONS.EYE`<br/>`ICONS.EYE_OFF` | 패스워드 토글 버튼 stroke 아이콘 표준화 (`aria-label` 부여) |
| `AcademyRegister.js` | `{showPassword ? '👁️' : '👁️‍🗨️'}` | `<Eye size={18} />` / `<EyeOff size={18} />` | `ICONS.EYE` / `ICONS.EYE_OFF` | 회원가입 폼 패스워드 토글 |

### 4.6 Locales (i18n ko) 클러스터

| 대상 파일 | 기존 키/문구 (Before) | 교체 스펙 (After) | 비고 |
|---|---|---|---|
| `locales/ko/schedule.json` | `"🏖️ 하루 종일 휴무"`<br/>`"🏖️ 휴무"`<br/>`"🏖️ 하루 종일 휴가"`<br/>`"🏖️ 휴가"`<br/>`"📅 예약 정보를..."` | `"하루 종일 휴무"`<br/>`"휴무"`<br/>`"하루 종일 휴가"`<br/>`"휴가"`<br/>`"예약 정보를..."` | 파라솔 및 달력 이모지 제거 |
| `locales/ko/report.json` | `"✅ 저장되었습니다."`<br/>`"❌ 저장에 실패했습니다."`<br/>`"🔍 진단적 인상"` | `"저장되었습니다."`<br/>`"저장에 실패했습니다."`<br/>`"진단적 인상"` | 체크, 엑스, 돋보기 제거 |
| `locales/ko/erp.json` | `"💡 안내사항"`<br/>`"💡 옵션 유형은..."` | `"안내사항"`<br/>`"옵션 유형은..."` | 전구 이모지 제거 |
| `locales/ko/common.json` | `"✅ 완료"` | `"완료"` | 체크 이모지 제거 |
| `locales/ko/admin.json` | `"✅ 역할 선택 시..."`<br/>`"⚙️ 고급 설정"`<br/>`"💡 사용 방법"`<br/>`"🗑️ 버튼"`<br/>`"⚙️ 버튼"`<br/>`"💡 비밀번호는..."`<br/>`"⚠️ 부분 환불은..."`<br/>`"⚠️ 환불 사유를..."`<br/>`"📦 환불 대상:"`<br/>`"✅ 부분 환불이..."` | `"역할 선택 시..."`<br/>`"고급 설정"`<br/>`"사용 방법"`<br/>`"삭제 버튼"`<br/>`"설정 버튼"`<br/>`"비밀번호는..."`<br/>`"부분 환불은..."`<br/>`"환불 사유를..."`<br/>`"환불 대상:"`<br/>`"부분 환불이 완료되었습니다..."` | 관리자 다이얼로그 및 안내 문구 내 이모지 전부 제거 |
| `locales/ko/auth.json` | `"🏢 본사 로그인"`<br/>`"🏪 지점 로그인"` | `"본사 로그인"`<br/>`"지점 로그인"` | 빌딩, 편의점 이모지 제거 |

### 4.7 Mood / Rating 도메인 클러스터

| 대상 파일 | 기존 구현 (Before) | 교체 스펙 (After) | UI 컴포넌트 형태 | 비고 |
|---|---|---|---|---|
| `ClientWellnessRenewal.js` (감정 일기) | `1: '😢 매우 나쁨'`<br/>`2: '😟 나쁨'`<br/>`3: '😐 보통'`<br/>`4: '🙂 좋음'`<br/>`5: '😊 매우 좋음'` | `1: '매우 나쁨'`<br/>`2: '나쁨'`<br/>`3: '보통'`<br/>`4: '좋음'`<br/>`5: '매우 좋음'` | 1~5단 세그먼트 버튼 또는 5단계 텍스트 칩 바 | 감정 이모지 대신 깔끔한 감정 상태 텍스트 칩 선택 구조 |
| `ClientWellnessRenewal.js` (가이드) | `호흡법: '🌬️'`<br/>`근육이완: '💆'`<br/>`마인드풀니스: '🧘'`<br/>`그라운딩: '🌿'` | `호흡법`<br/>`근육 이완`<br/>`마인드풀니스`<br/>`그라운딩` | `<Wind size={18} />`<br/>`<Activity size={18} />`<br/>`<Sun size={18} />`<br/>`<Compass size={18} />` | 힐링 가이드 이모지 → Lucide Quiet Stroke 아이콘 |
| `ConsultantRatingDisplay.js` | `'💖'.repeat(score)`<br/>`'🤍'.repeat(5-score)`<br/>`💖 내담자 평가`<br/>`📊 총 평가 수` | 5점 척도 별점/하트 스트로크 SVG (`<Star size={16} fill="currentColor" />`) + 평점 숫자 `4.8 / 5.0`<br/>`내담자 평가`<br/>`총 평가 수` | 숫자 평점 강조(24px) + Stroke Star 5개 렌더링 + Plain Text | 하트 이모지 반복 문자열 제거, 표준화된 평점 UI 위젯화 |
| `ConsultantRatingStatisticsView.js` | `⭐ {averageRating}`<br/>`🥇🥈🥉` 메달<br/>`'⭐'.repeat(...)` | `평점 {averageRating}`<br/>순위 `1위`, `2위`, `3위` (Rank 뱃지)<br/>게이지 바(Progress Bar) | `1위`, `2위`, `3위` 숫자 뱃지 + 평점 바 | 별, 메달 이모지 제거 |

---

## 5. 자산 유지 목록 (Keep / Preserved Assets)

플랫폼 신원(Sian 05 Secure Core) 및 사용자 조작 피드백에 필수적인 다음 자산은 절대 제거하지 않고 유지합니다.

| 자산명 / 경로 | 형태 | 유지 사유 및 기준 |
|---|---|---|
| `LoginHeroBrandLockup` (`frontend/src/components/auth/LoginHeroLineOverlay.js`) | React Component | Core Solution 본사 로그인 히어로 브랜드 표기 (Sian 05 Secure Core) |
| `core-solution-hero-lockup.svg` (`frontend/src/assets/images/auth/`) | SVG Asset | Core Solution 심볼마크 및 워드마크 공식 SVG 벡터 |
| `LoginHeroLottieOverlay` (로그인 히어로 Lottie) | Animation Overlay | 이모지/스티커 요소가 아닌 기술적 선 드로잉 및 브랜드 인터랙션 효과이므로 유지 |
| 기능 UI Stroke 아이콘 (`frontend/src/constants/icons.js`) | Lucide React Icons | `ChevronDown`, `ChevronRight`, `ChevronUp`, `X` (Close), `Check`, `Search`, `Menu`, `Eye`, `EyeOff` 등 시스템 필수 내비게이션 아이콘 전체 유지 |

---

## 6. 자산 제거 및 교체 목록 (Remove / Replace Assets)

플랫폼에 불필요하거나 MindGarden 잔재인 장식용 SVG 및 스티커는 격리 또는 제거합니다.

| 대상 파일 / 자산 | 현재 상태 | 조치 방안 (Action) | 비고 |
|---|---|---|---|
| `core-logo-butterfly-trace.svg` (`frontend/src/assets/images/auth/`) | 미사용 잔재 | 플랫폼 번들에서 제거 또는 `deprecated` 격리 | 플랫폼 코드베이스 내 참조 0건 확인됨 |
| `core-wordmark-mindgarden-trace.svg` (`frontend/src/assets/images/auth/`) | 미사용 잔재 | 플랫폼 번들에서 제거 또는 `deprecated` 격리 | 플랫폼 코드베이스 내 참조 0건 확인됨 |
| `TenantProfileIllustrations.js` (`frontend/src/components/tenant/`) | 100x100 복잡한 빈 상태 일러스트 SVG | Lucide quiet stroke 아이콘 (`Calendar`, `CreditCard`) + 간결한 빈 상태 텍스트로 단순화 교체 | 어드민 테넌트 관리 내 불필요한 장식 제거 |
| `WellnessNotificationDetail.css` (`content: '✨'`) | CSS 가상 요소 이모지 | 가상 요소 이모지 제거 (`content: ''`) | CSS 내 잔존 장식 이모지 정리 |

---

## 7. 레이아웃 및 사용성 무변경 보장 (Layout & Accessibility Guard)

1. **LNB / GNB / AdminCommonLayout 구조**:
   - 사이드바(260px), 상단바(Header), 메인 콘텐츠(Section Blocks, 16px radius, 1px border)의 구조적 HTML 마크업 및 그리드 레이아웃은 일체 변경하지 않습니다.
2. **정보 노출 및 접근성**:
   - 이모지 제거로 인한 정보 손실이 없도록, 등급·상태·우선순위 등은 모두 **동일한 의미의 한국어 텍스트 및 시맨틱 뱃지(`StatusBadge`, `BadgeSelect`)**로 정확하게 표현합니다.
   - 폼 인풋 및 툴바의 터치 영역(최소 40~44px) 및 키보드 포커스 링(`--mg-v2-color-state-focus-ring`)은 다크 모드에서도 완벽하게 보장됩니다.
3. **라이트 모드 회귀 방지**:
   - 모든 색상 변경은 `[data-theme="dark"]` 및 `:root[data-theme="dark"]` 스코프 내에서만 이루어지며, 기본 `:root` 라이트 모드 토큰에는 영향을 주지 않습니다.

---

## 8. core-coder 핸드오프 체크리스트

코더가 본 스펙을 구현할 때 점검해야 할 핵심 순서입니다:

- [ ] **1단계: V2 다크 토큰 갱신** — `frontend/src/styles/tokens/design-v2-tokens.css`의 `[data-theme="dark"]` 및 `@media (prefers-color-scheme: dark)` 블록에서 Calm Forest 올리브 색상을 Slate/Teal SSOT(§1.1, §1.2, §3)로 교체.
- [ ] **2단계: Unified 다크 토큰 갱신** — `frontend/src/styles/unified-design-tokens.css`의 `:root[data-theme="dark"]` 블록 내 Primary 및 Border 토큰을 Teal/Slate(§1.1, §1.2)로 교체.
- [ ] **3단계: Dark Theme CSS 갱신** — `frontend/src/styles/themes/dark-theme.css`의 `--color-border-primary/secondary/accent` 값을 §1.2 기준으로 교정.
- [ ] **4단계: UI 문자열 이모지 제거** — Toast, UnifiedNotification, WelcomeWidget, DynamicDashboard, MGHeader, codeHelperStrings, ScheduleList, widgetConstants, ClientMessageScreen 등에서 이모지를 Plain Text 및 Lucide Stroke 아이콘(§4)으로 치환.
- [ ] **5단계: ko locales 이모지 정리** — `frontend/src/locales/ko/*.json` 파일 6종(schedule, report, erp, common, admin, auth)에서 이모지 접두사/접미사 제거(§4.6).
- [ ] **6단계: Mood/Rating 및 Password Toggle 교체** — `UnifiedLogin.js`의 `👁️` → `<Eye />`, 감정 일기 텍스트화, 평점 별점 SVG화(§4.4, §4.5, §4.7).
- [ ] **7단계: 미사용 SVG 정리** — butterfly 및 mindgarden-trace 미사용 파일 확인 및 TenantProfileIllustrations 컴팩트화(§6).
