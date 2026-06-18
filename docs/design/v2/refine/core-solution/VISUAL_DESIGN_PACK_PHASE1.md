# Phase 1 상용화 Visual Design Pack

> **Status**: Active (Step B 검수용)  
> **Scope**: Batch 1 (Public & Auth) + Batch 2 (Admin Shell + Main Hub) 상용 SaaS 수준 Visual Design Pack  
> **Model**: gemini-3.1-pro (designer)

이 문서는 코어 솔루션(Core Solution) Phase 1 시안을 문서화한 Visual Design Pack입니다. 코드 수정 없이 Phase 3에서 core-coder가 이 문서만으로 B0KlA 기반의 UI를 구현할 수 있도록 상세 스펙을 정의합니다.

---

## Batch 1 — Public & Auth First Impression

### 1.1 Homepage.js 대체 방향 (`/` 비로그인 Public Main)

- **디자인 방향**: 제네릭한 B2B SaaS Jargon 및 SaaS Blue(`var(--mg-v2-color-primary-main)` 기반) 배제. Shield 로고와 Calm Forest 톤 앤 매너 적용.
- **카피 (1안 적용)**:
  - Headline: "예약부터 회기, 정산까지. 센터 운영의 모든 것을 한곳에서."
  - Sub-copy: 복잡한 행정 업무는 코어 솔루션에 맡기고, 내담자와의 소중한 시간에 집중하세요.
- **CTA 위계**:
  - Primary: 「시작하기」 → `https://apply.e-trinity.co.kr` (Trinity 퍼널 연결)
  - Secondary: 「로그인」 → `/login`

#### 1440px 데스크톱 와이어프레임

```ascii
+-----------------------------------------------------------------------------------+
| [Shield Logo]                        [솔루션 소개] [기능]          [로그인] [시작하기]|
+-----------------------------------------------------------------------------------+
|                                                                                   |
|                                                                                   |
|                   예약부터 회기, 정산까지.                                          |
|                   센터 운영의 모든 것을 한곳에서.                                   |
|                                                                                   |
|       복잡한 행정 업무는 코어 솔루션에 맡기고, 내담자와의 소중한 시간에 집중하세요.         |
|                                                                                   |
|                         [ 시작하기 (Primary) ]   [ 로그인 (Secondary) ]            |
|                                                                                   |
|                                                                                   |
|                   +-----------------------------------------------+               |
|                   |           [ 대시보드 UI Mockup Graphic ]         |               |
|                   +-----------------------------------------------+               |
|                                                                                   |
+-----------------------------------------------------------------------------------+
|  [Badge: ISO27001] [Badge: GDPR]   (Trust Strip / Empty Space)                    |
+-----------------------------------------------------------------------------------+
```

#### 375px 모바일 와이어프레임

```ascii
+-----------------------------------+
| [Shield Logo]                 [☰] |
+-----------------------------------+
|                                   |
|   예약부터 회기, 정산까지.          |
|   센터 운영의 모든 것을             |
|   한곳에서.                       |
|                                   |
| 복잡한 행정 업무는 코어 솔루션에      |
| 맡기고, 내담자와의 소중한 시간에      |
| 집중하세요.                       |
|                                   |
| [      시작하기 (Primary)      ]  |
| [      로그인 (Secondary)      ]  |
|                                   |
| +-------------------------------+ |
| |      [UI Mockup Graphic]      | |
| +-------------------------------+ |
|                                   |
| [Badge: ISO] [Badge: GDPR]        |
+-----------------------------------+
```

#### 블록별 상세 스펙
- **GNB**:
  - 높이: `64px`
  - 배경: `var(--mg-v2-color-surface-bg)` (`#FAF9F7`)
  - 간격: 양옆 Padding `var(--mg-v2-space-8)` (32px)
  - 로고: Shield H2 Logo (Primary)
- **Hero**:
  - 간격: 상하 Padding `var(--mg-v2-space-20)` (80px), 하단 여백(Whitespace) 적극 활용
  - 타이포(Headline): `var(--mg-v2-font-size-display)`, Bold (`var(--mg-v2-font-weight-bold)`), Color: `var(--mg-v2-color-text-primary)`
  - 타이포(Sub-copy): `var(--mg-v2-font-size-body-lg)`, Regular, Color: `var(--mg-v2-color-text-secondary)`
- **CTA 버튼 (MGButton)**:
  - Primary (시작하기): Bg `var(--mg-v2-color-primary-main)`, Text `var(--mg-v2-color-text-inverse)`, Radius `var(--mg-v2-radius-md)` (10px), Height `40px`
  - Secondary (로그인): Bg 투명, Border `var(--mg-v2-color-border-default)`, Text `var(--mg-v2-color-text-primary)`
- **States**: Focus 시 2px 포커스 링 `var(--mg-v2-color-state-focus-ring)`. Hover 시 `var(--mg-v2-color-state-hover)`.

---

### 1.2 `/login` 톤 정합 (Light 우선)

- **디자인 방향**: Public Main과 시각적 정합성 유지 (Shield + Calm Forest).
- **레이아웃**: 중앙 정렬된 Auth Card 형태. 배경은 `var(--mg-v2-color-surface-bg)`, 폼 래퍼는 `var(--mg-v2-color-surface-card)` 사용.

#### 1440px / 375px 간략 와이어프레임

```ascii
(Desktop/Mobile 공통: 중앙 정렬 컨테이너)
+-----------------------------------+
|           [Shield Logo]           |
|                                   |
|      환영합니다. 코어 솔루션        |
|                                   |
| +-------------------------------+ |
| | 이메일                          | |
| | [ 입력 필드 ]                   | |
| | 비밀번호                        | |
| | [ 입력 필드 ]                   | |
| |                               | |
| | [      로그인 (MGButton)     ]  | |
| +-------------------------------+ |
|                                   |
|    비밀번호 찾기 | 계정 만들기       |
+-----------------------------------+
```

- **토큰**:
  - 카드 배경: `var(--mg-v2-color-surface-card)` (`#F5F3EF`), Radius `var(--mg-v2-radius-xl)` (16px), Shadow `var(--mg-v2-shadow-sm)`
  - 입력 필드: Height `40px`, Radius `var(--mg-v2-radius-md)` (10px), Focus 시 `var(--mg-v2-color-border-focus)`
  - 간격: 필드 간 gap `var(--mg-v2-space-4)` (16px), 내부 Padding `var(--mg-v2-space-8)` (32px)

---

## Batch 2 — Admin Shell + Main Hub

### 2.1 App Shell Greenfield

Phase 1은 **ADMIN(어드민)** 단일 대상을 기준으로 합니다.

- **Desktop (1440px)**
  - GNB: 높이 64px, z-index `var(--mg-v2-z-header)` (1000). 좌측 Shield 로고.
  - LNB (좌측 사이드바): 너비 260px, 배경 `var(--mg-v2-color-surface-sidebar)` (`#2C2C2C`), 텍스트 `var(--mg-v2-color-text-inverse)`. 활성 메뉴 배경 `var(--mg-v2-color-primary-main)` (`#3D5246`).
  - ContentArea: 배경 `var(--mg-v2-color-surface-bg)` (`#FAF9F7`), Padding `var(--mg-v2-space-8)` (32px).
- **Mobile (375px)**
  - GNB 우측 햄버거 버튼. LNB는 좌측 드로어 모달로 전환 (터치 타겟 44px 보장).

#### Desktop & Mobile 와이어프레임

```ascii
[Desktop 1440px]
+---------------------------------------------------------------------------+
| [Shield Logo] (GNB 64px)                 [검색] [알림:bell] [프로필/설정] |
+----------------+----------------------------------------------------------+
| 대시보드 (활성)  | 홈 > 대시보드 (ContentHeader)               [ + 일정 추가 ]|
| 통합스케줄       +----------------------------------------------------------+
| 내담자관리       | [ KPI: 오늘일정]   [ KPI: 상담사일정 ] [ KPI: 신규접수 ] |
| 정산관리         +----------------------------------------------------------+
| ...            | [  매칭  ]ㅡ[ 입금확인 ]ㅡ[ 회기권한 ]ㅡ[  스케줄  ]ㅡ[정산] |
|                +----------------------------------------------------------+
|                | [ Widget: 오늘 예정 스케줄 ] | [ Widget: 미작성 일지 ]   |
+----------------+----------------------------------------------------------+

[Mobile 375px]
+-----------------------------------+
| [Shield Logo]           [bell][☰] |
+-----------------------------------+
| 홈 > 대시보드                     |
|                       [+일정추가] |
+-----------------------------------+
| [ KPI: 오늘 일정 (3D Flip) ]      |
+-----------------------------------+
| [ KPI: 상담사별 오늘 일정 ]        |
+-----------------------------------+
| [ KPI: 신규 상담 접수 ]           |
+-----------------------------------+
| < [매칭]-[입금]-[회기]-[스케줄] > | <-- 가로 스크롤 (Horizontal scroll)
+-----------------------------------+
| [ Widget: 오늘 예정 스케줄 ]      |
+-----------------------------------+
```

---

### 2.2 KPI 3 + KpiFlipCard

어드민 허브 접속 후 3초 내 파악을 위한 3개의 핵심 KPI 카드. **3D Flip (rotateY)** 인터랙션을 적용합니다.

| 카드 | 앞면 (Front - 요약) | 뒷면 (Back - 상세) |
|---|---|---|
| **1. 오늘 상담 일정** | 타이틀: 오늘 상담 일정<br>숫자: 24px Bold<br>내용: 예약 및 완료 건수 요약 | 타임라인: 시간대별 미니 타임라인 또는 상태(Confirmed/Completed) breakdown.<br>버튼: 「일정 보기」 CTA |
| **2. 상담사별 오늘 일정** | 타이틀: 상담사별 오늘 일정<br>숫자: 24px Bold<br>내용: 상담사별 전체 N건 요약 | 리스트: 상담사 이름, N건, 다음 일정 시각.<br>버튼: 칩 클릭 시 integrated-schedule 딥링크 |
| **3. 신규 상담 접수** | 타이틀: 신규 상담 접수<br>숫자: 24px Bold<br>내용: 신규 등록 및 배정 대기 건수 | 리스트: 신규 내담자 목록 (이름, 접수일, 대기 상태).<br>버튼: 「배정하기」 CTA |

#### 스펙 및 상태 (States)
- **카드 스타일**: 배경 `var(--mg-v2-color-surface-card)` (`#F5F3EF`), Radius `var(--mg-v2-radius-xl)` (16px), Shadow `var(--mg-v2-shadow-sm)`.
- **Typography**: 숫자(24px) `var(--mg-v2-font-size-h3)`, 라벨(12px) `var(--mg-v2-font-size-caption)`. 좌측에 4px 너비의 악센트 바(`var(--mg-v2-color-primary-main)`)를 배치하여 시각적 구분을 제공.
- **애니메이션**: `transform: rotateY(180deg)`, `transition-duration: 400ms`. 동시 1장만 Flipped 상태 유지.
- **접근성(Reduced Motion)**: `@media (prefers-reduced-motion: reduce)` 환경에서는 flip 모션을 crossfade 또는 instant toggle로 대체 적용.

---

### 2.3 Core Flow Pipeline 5단계

기존 중앙 정렬(Center Cluster)로 인한 와이드 스크린 여백 낭비 문제 해결.

- **레이아웃 (Desktop)**: Flex/Grid를 활용한 전체 컨테이너 너비 균등 분배(Equal Distribution).
- **레이아웃 (Mobile)**: 세로 스택이 아닌 1열 가로 스크롤(Horizontal scroll) 컨테이너로 제공.
- **구조**: 매칭 → 입금 확인 → 회기 권한 → 스케줄 → 자동 차감/회계
- **스타일**: B0KlA 토큰 적용. 현재 진행 중/대기 중인 단계는 `var(--mg-v2-color-primary-main)` 컬러와 Bold 텍스트로 하이라이트.

---

### 2.4 AdminDashboardV2 앵커 대비 변경점 표

기존 `AdminDashboardV2` 코드베이스를 상용화 바에 맞춰 변경합니다.

| 영역 | 현재 (AdminDashboardV2) | Phase 1 Visual Pack (목표) | 토큰 / 컴포넌트 |
|---|---|---|---|
| **레이아웃 셸** | 중앙 고정 Narrow 컬럼 및 넓은 여백 | Greenfield (Full-width 대응 App Shell) | `var(--mg-v2-color-surface-bg)` |
| **사이드바 (LNB)** | 없음 (또는 TabletHomepage 종속) | 260px 고정 LNB (다크 배경), 반응형 드로어 | `var(--mg-v2-color-surface-sidebar)` |
| **KPI 구역** | 단순 Grid 정렬, 정적인 일반 카드 | 3D KpiFlipCard 인터랙션, 좌측 악센트 바 | `KpiFlipCard` / `mg-v2-ad-b0kla__card` |
| **Core Flow Pipeline**| 중앙 정렬 Cluster 구조 | 전체 너비 균등 분배 (Equal flex/grid) | `PipelineStepCard` |
| **버튼 & 액션** | `btn-primary`, `<button>` 혼재 | `MGButton` (40px, radius 10px) 통일 | `MGButton`, `var(--mg-v2-color-primary-main)` |
| **오버레이** | 커스텀 모달, 하드코딩 z-index | `UnifiedModal`로 일괄 정합, 체계적인 z-index | `UnifiedModal`, `var(--mg-v2-z-modal)` |

---

## 공통 섹션 (Visual Specs & Tokens)

### Typography Scale Table

| 용도 | 토큰명 | 크기 (Desktop) | 크기 (Mobile) |
|---|---|---|---|
| Hero 타이틀 | `var(--mg-v2-font-size-display)` | 48px | 36px |
| 페이지 타이틀 | `var(--mg-v2-font-size-h1)` | 36px | 28px |
| KPI 숫자 (Bold) | `var(--mg-v2-font-size-h3)` | 24px | 20px |
| 본문 텍스트 (Base) | `var(--mg-v2-font-size-body-lg)` | 16px | 16px |
| KPI 라벨/캡션 | `var(--mg-v2-font-size-caption)` | 12px | 12px |

### Spacing Token Table (4px Grid)

| 토큰명 | 크기 | 용도 예시 |
|---|---|---|
| `var(--mg-v2-space-2)` | 8px | 아이콘과 텍스트 간격 |
| `var(--mg-v2-space-4)` | 16px | 리스트 아이템 간격, 폼 필드 간격 |
| `var(--mg-v2-space-6)` | 24px | 카드 내부 기본 Padding |
| `var(--mg-v2-space-8)` | 32px | 메인 ContentArea 여백 |
| `var(--mg-v2-space-12)` | 48px | 섹션 간 수직 간격 |

### Color Token Table (Calm Forest)

SaaS Blue (`#3B82F6`)는 일절 사용하지 않으며, 아래 토큰으로 대체됩니다.

| 역할 | 토큰명 | HEX (참고용) |
|---|---|---|
| **Primary 주조색** | `var(--mg-v2-color-primary-main)` | `#3D5246` (Deep Forest) |
| **Background** | `var(--mg-v2-color-surface-bg)` | `#FAF9F7` (Off-white/Beige) |
| **Card Surface** | `var(--mg-v2-color-surface-card)` | `#F5F3EF` |
| **Sidebar** | `var(--mg-v2-color-surface-sidebar)` | `#2C2C2C` (Dark) |
| **Text Primary** | `var(--mg-v2-color-text-primary)` | `#2C2C2C` (Off-black) |
| **Text Secondary** | `var(--mg-v2-color-text-secondary)` | `#5C6B61` |
| **Border Default** | `var(--mg-v2-color-border-default)` | `#D4CFC8` |

### Component Inventory

1. **MGButton**: 100% `var(--mg-v2-color-primary-main)` 적용, 높이 40px, Radius 10px.
2. **ContentHeader**: 브레드크럼(홈 > 대시보드), 타이틀 위계 묶음 래퍼.
3. **KpiFlipCard**: KPI 표시용 3D 180도 회전 카드 (Radius 16px).
4. **PipelineStepCard**: 파이프라인 5단계 표시용 가로 신축(Flex) 대응 카드.
5. **UnifiedModal**: `var(--mg-v2-z-modal)` 및 `var(--mg-v2-z-modal-backdrop)` 적용.

### States Matrix

| 상태 (State) | 시각적 스펙 가이드 |
|---|---|
| **Default** | `--mg-v2-color-primary-main` (버튼), `--mg-v2-color-surface-card` (카드) 유지 |
| **Hover** | 카드는 Box-shadow 상향 (`--mg-v2-shadow-md`). 버튼은 배경에 `--mg-v2-color-state-hover` 오버레이 적용. |
| **Focus-Visible** | 키보드 탭 접근 시 2px 두께의 `--mg-v2-color-state-focus-ring` (rgba(61,82,70,0.4)) 아웃라인 표시. |
| **Disabled** | `--mg-v2-color-state-disabled-bg` (`#E8E5DF`), opacity 0.5 및 `cursor: not-allowed`. |
| **Loading** | 스켈레톤 UI 노출 또는 `UnifiedLoading` 스피너 노출. 빈 화면(White screen) 방치 금지. |
| **Empty** | 데이터가 없는 위젯(예: 미완료 일지 0건)의 경우, 일러스트 그래픽 + "완료된 항목이 없습니다" 안내 텍스트 + CTA 버튼 1프레임 노출. |
| **Error** | SafeErrorDisplay 패턴 (`--mg-v2-color-semantic-error` 기반). |

### Quality Bar Checklist Reference

구현 시 다음 기준을 반드시 만족해야 합니다. (자세한 내용은 [COMMERCIALIZATION_DESIGN_PLAN.md](./COMMERCIALIZATION_DESIGN_PLAN.md) 및 `DESIGN_REVIEW_CHECKLIST.md` 참조)
1. 하드코딩된 HEX / Margin / Padding / z-index 없음 (반드시 `var(--mg-v2-*)` 토큰 사용).
2. SaaS Blue (`#3B82F6`) 잔존 0건.
3. 본문 텍스트 명도 대비(Contrast) WCAG AA 등급(4.5:1 이상) 보장.
4. 모바일 터치 타겟 최소 44px, 가로 스크롤 방지(허브 메인 본문 기준).
5. 3D 모션의 경우 Reduced Motion 모드 정상 동작 확인.
