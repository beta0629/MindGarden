# 통일 레이아웃 및 전 페이지 적용 스펙

**문서 버전**: 1.0.0  
**작성일**: 2025-03-04  
**담당**: core-designer (디자인 스펙만, 코드 작성 없음)  
**참조**: UNIFIED_LAYOUT_AND_PAGES_PLAN.md, RESPONSIVE_LAYOUT_SPEC.md, PENCIL_DESIGN_GUIDE.md, 어드민 대시보드 샘플 https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample

---

## 1. 개요 및 적용 범위

- **목적**: 어드민/ERP 전 페이지에 GNB + LNB + 메인 콘텐츠 구조를 통일하고, ContentHeader / ContentArea / 목록·상세·폼 블록 배치를 일관되게 적용한다.
- **적용 대상**: ERP·어드민의 모든 목록·상세·폼 페이지. 공통 레이아웃은 AdminCommonLayout + DesktopLayout / MobileLayout 기반.
- **단일 소스**: `mindgarden-design-system.pen`(B0KlA), `pencil-new.pen`(아토믹 컴포넌트), `unified-design-tokens.css`, `responsive-layout-tokens.css`. 이 외 색상·간격·타이포 값 사용 금지.
- **이모지**: 모든 UI에서 이모지 사용 금지. 아이콘은 Lucide React(또는 프로젝트 표준) 아이콘 컴포넌트로만 사용한다(제4장 참조).

---

## 2. 레이아웃 통일 스펙

### 2.1 전체 구조 (와이어프레임)

어드민/ERP 공통 레이아웃은 다음 3영역으로 구성한다.

```
+------------------------------------------+
| GNB (상단 글로벌 네비게이션)               |  높이: 56px(모바일) / 64px(데스크톱+)
| [로고] [검색] [알림] [프로필/로그아웃]     |  배경: var(--mg-layout-header-bg)
+----------+-------------------------------+
|          | ContentHeader (페이지별)        |
| LNB      | [제목] [부제목] [주요 액션]     |
| (260px   +-------------------------------+
|  데스크) | ContentArea (메인 콘텐츠)       |
|          | +---------------------------+  |
|  또는    | | 섹션 블록 1                |  |
| 드로어   | | (테이블/카드/폼 등)        |  |
| (모바일) | +---------------------------+  |
|          | | 섹션 블록 2 ...            |  |
|          | +---------------------------+  |
+----------+-------------------------------+
```

- **GNB**: 고정 상단. 로고·검색·알림·로그아웃 등. 색상·높이는 토큰 준수.
- **LNB**: 데스크톱 260px 고정 좌측; 태블릿/모바일은 드로어(280px)로 토글.
- **메인**: ContentHeader + ContentArea. ContentArea 내부가 목록/상세/폼 블록으로 채워짐.

### 2.2 ContentHeader / ContentArea / 블록 배치

| 영역 | 역할 | 클래스/토큰 | 비고 |
|------|------|-------------|------|
| **ContentHeader** | 페이지 제목 + 부제목 + 우측 주요 액션 | `mg-v2-content-header`, `mg-v2-content-header__title`, `mg-v2-content-header__subtitle`, `mg-v2-content-header__right` | B0KlA headerRow. 제목 20~28px, fontWeight 600~700. |
| **ContentArea** | 메인 콘텐츠 래퍼, flex column, gap | `mg-v2-content-area`, `var(--mg-layout-grid-gap)` | 내부에 섹션 블록·테이블·카드 그리드 배치. |
| **섹션 블록** | 콘텐츠 구역 1개 단위 | 배경 `var(--mg-layout-section-bg)` 또는 `var(--mg-color-surface-main)`, 테두리 1px `var(--mg-layout-section-border)`, border-radius 16px, 패딩 `var(--mg-layout-section-padding)` | 좌측 악센트 바 4px, `var(--mg-color-primary-main)`, radius 2px. |
| **목록(테이블)** | 테이블이 들어가는 블록 | 섹션 블록 안에 테이블. 헤더·행 스타일은 B0KlA/토큰. | 반응형: 스크롤 또는 카드형 전환. |
| **목록(카드 그리드)** | 카드 그리드가 들어가는 블록 | `mg-v2-ad-b0kla__card` 등 B0KlA 카드 클래스. 그리드 gap `var(--mg-layout-grid-gap)`. | 컬럼 수는 RESPONSIVE_LAYOUT_SPEC 4.1절. |
| **상세 블록** | 읽기/편집 필드 그룹 | 섹션 블록 내 필드 그룹. 라벨 12px `var(--mg-color-text-secondary)`, 값 14~16px. | 카드 단위로 그룹화 가능. |
| **폼 블록** | 등록/수정 폼 영역 | 섹션 블록 내 폼. 하단 제출/취소 버튼 영역 분리. | UnifiedModal 내 폼이면 모달 스펙 준수. |

### 2.3 페이지 유형별 공통 블록 구조

#### 2.3.1 목록 페이지

- **구조**: `ContentHeader` + `ContentArea` → [필터/검색 영역(선택)] + [테이블 또는 카드 그리드 블록] + [페이징/정렬(선택)].
- **ContentHeader**: 제목(예: "구매 관리"), 부제목(선택), 우측에 "등록"·"엑셀 다운로드" 등 주요 액션 버튼.
- **ContentArea**: 하나 이상의 섹션 블록. 첫 블록에 검색·필터·액션 바를 두고, 그 다음 블록에 테이블 또는 카드 그리드.
- **반응형**: 데스크톱은 테이블 유지, 모바일/태블릿은 카드형 목록 또는 가로 스크롤 테이블로 전환 가능.

#### 2.3.2 상세 페이지

- **구조**: `ContentHeader` + `ContentArea` → [블록 1: 기본 정보] [블록 2: 상세 정보] … [하단 액션].
- **ContentHeader**: 제목(엔티티명 또는 상세 제목), 부제목(선택), 우측에 "뒤로가기"·"편집" 버튼.
- **ContentArea**: 블록 단위로 정보 그룹. 각 블록은 섹션 블록 스타일(배경·테두리·radius·좌측 악센트).
- **읽기/편집**: 동일 블록 구조 재사용, 편집 시 필드만 입력 가능 상태로 전환.

#### 2.3.3 폼 페이지(등록/수정)

- **구조**: `ContentHeader` + `ContentArea` → [폼 섹션 1] [폼 섹션 2] … [하단 고정: 제출 / 취소].
- **ContentHeader**: 제목(예: "구매 요청 등록").
- **ContentArea**: 폼을 섹션 블록으로 나눔. 하단 버튼 영역은 별도 블록 또는 고정 영역으로 구분.
- **모달 내 폼**: UnifiedModal 스펙 준수. 모달 내부에 동일한 섹션 블록·버튼 규칙 적용.

### 2.4 DesktopLayout / MobileLayout 치수 및 브레이크포인트

RESPONSIVE_LAYOUT_SPEC.md 및 `responsive-layout-tokens.css`와 동일하게 적용한다.

| 항목 | DesktopLayout (768px 이상) | MobileLayout (768px 미만) |
|------|----------------------------|----------------------------|
| **LNB** | 고정 260px (`--mg-layout-sidebar-width`). 배경 `--mg-layout-sidebar-bg`. | 표시 안 함. 대신 드로어: 너비 280px (`--mg-layout-sidebar-width-mobile`). |
| **메인 영역** | LNB(260px) 제외한 나머지 전폭. 패딩 `var(--mg-layout-page-padding)` → 24px(데스크톱), 28px(FHD), 32px(2K), 40px(4K). | 전폭. 패딩 `var(--mg-layout-page-padding-mobile)` = 16px. |
| **브레이크포인트** | 768px 이상에서 DesktopLayout 사용. 1280/1920/2560/3840에서 패딩·gap만 증가. | 375px 기준 모바일, ~767px 태블릿. |
| **헤더 높이** | 64px (`--mg-layout-header-height`) | 56px (`--mg-layout-header-height-mobile`) |
| **배경** | `var(--mg-layout-main-bg-start)` → `var(--mg-layout-main-bg-end)` 그라데이션 | 동일 |

- **페이지 패딩**: `responsive-layout-tokens.css`의 `--mg-layout-page-padding-*` 사용. 미디어쿼리로 자동 전환.
- **섹션 패딩·gap**: `--mg-layout-section-padding-*`, `--mg-layout-gap-*`, `--mg-layout-grid-gap-*` 사용.

---

## 3. 컴포넌트 구조 (아토믹 계층)

AdminCommonLayout, DesktopLayout, MobileLayout 하위에 오는 공통 영역을 아토믹 계층으로 정리한다.

### 3.1 템플릿 레벨

| 컴포넌트 | 계층 | 설명 |
|----------|------|------|
| AdminCommonLayout | Template | GNB/LNB 분기, 로딩 처리. children으로 페이지 본문. |
| DesktopLayout | Template | GNB + LNB(260px) + main. `mg-v2-desktop-layout`, `mg-v2-desktop-layout__body`, `mg-v2-desktop-layout__main`. |
| MobileLayout | Template | GNB + MobileLnbDrawer + main. `mg-v2-mobile-layout`, `mg-v2-mobile-layout__main`. |

### 3.2 Organisms (공통 영역)

| 컴포넌트 | 사용처 | 비고 |
|----------|--------|------|
| DesktopGnb | DesktopLayout | 상단 바: 로고, 검색, 알림, 로그아웃. |
| DesktopLnb | DesktopLayout | 좌측 260px 네비게이션. `mg-v2-desktop-lnb`. |
| MobileGnb | MobileLayout | 상단 바 + 햄버거 메뉴. |
| MobileLnbDrawer | MobileLayout | 280px 드로어. `mg-v2-mobile-lnb-drawer`. |
| ContentHeader | 메인 내부 | 페이지 제목·부제목·우측 액션. `mg-v2-content-header`. |
| ContentArea | 메인 내부 | 메인 콘텐츠 래퍼. `mg-v2-content-area`. |

### 3.3 Molecules

| 컴포넌트 | 사용처 | 비고 |
|----------|--------|------|
| LnbMenuItem / NavLink | DesktopLnb, MobileLnbDrawer | 메뉴 항목. 높이 44px, radius 10px, 활성 시 `--mg-layout-sidebar-active-bg`. |
| 섹션 블록 래퍼 | ContentArea 내부 | 제목(좌측 악센트 바) + 본문. B0KlA 섹션 스타일. |
| 테이블 툴바 | 목록 페이지 | 검색·필터·액션 버튼 그룹. |
| 폼 버튼 그룹 | 폼 페이지 | 제출·취소 등. |

### 3.4 Atoms

| 컴포넌트 | 사용처 | 비고 |
|----------|--------|------|
| 버튼 | GNB, ContentHeader, 테이블 툴바, 폼 | 주조: `var(--mg-color-primary-main)`. 아웃라인: 테두리 `var(--mg-color-border-main)`. 높이 40px, radius 10px. |
| 아이콘 | 전역 | Lucide React 등. 이모지 사용 금지. |
| 입력 필드, 라벨 | 폼·필터 | 토큰 기반. |

### 3.5 B0KlA 카드·그리드·버튼 사용 영역

| 영역 | B0KlA 클래스/토큰 | 용도 |
|------|-------------------|------|
| 대시보드 카드 | `mg-v2-ad-b0kla__card` | KPI·메트릭·차트 카드. |
| 차트/위젯 헤더 | `mg-v2-ad-b0kla__chart-header`, `mg-v2-ad-b0kla__chart-title` | 카드 내 제목·설명. |
| Pill 토글 | `mg-v2-ad-b0kla__pill`, `mg-v2-ad-b0kla__pill--active` | 기간·뷰 전환. |
| 그리드 | ContentArea 내부 + `var(--mg-layout-grid-gap)` | 카드 그리드 레이아웃. |
| 버튼 | B0KlA 주조/아웃라인 버튼 스타일 | ContentHeader 액션, 폼 제출·취소. |

- **색상**: 카드 배경·테두리·악센트는 `unified-design-tokens.css`의 `--mg-color-*`, `--ad-b0kla-*` 또는 `responsive-layout-tokens.css`의 `--mg-layout-section-bg`, `--mg-layout-section-border` 사용.
- **그리드 컬럼 수**: RESPONSIVE_LAYOUT_SPEC 4.1절(모바일 1 ~ 4K 8~12) 준수.

---

## 4. 디자인 토큰

### 4.1 사용 원칙

- **색상·여백·타이포**: 모두 토큰만 사용. hex/px 하드코딩 금지(예외: 레거시 점진적 교체 시).
- **참조 파일**: `frontend/src/styles/unified-design-tokens.css`, `frontend/src/styles/responsive-layout-tokens.css`, `frontend/src/styles/dashboard-tokens-extension.css`(B0KlA 확장).

### 4.2 레이아웃 토큰 (responsive-layout-tokens.css)

| 토큰 | 용도 | 참고값 |
|------|------|--------|
| `--mg-breakpoint-mobile` ~ `--mg-breakpoint-4k` | 미디어쿼리·반응형 분기 | 375, 768, 1280, 1920, 2560, 3840 |
| `--mg-layout-sidebar-width` | 데스크톱 LNB 너비 | 260px |
| `--mg-layout-sidebar-width-mobile` | 모바일 드로어 너비 | 280px |
| `--mg-layout-header-height` / `--mg-layout-header-height-mobile` | GNB 높이 | 64px / 56px |
| `--mg-layout-page-padding`, `--mg-layout-page-padding-mobile` 등 | 메인 영역 패딩 | 16~40px |
| `--mg-layout-section-padding`, `--mg-layout-section-padding-mobile` 등 | 섹션 블록 패딩 | 16~32px |
| `--mg-layout-gap`, `--mg-layout-grid-gap` | 영역·그리드 간격 | 12~32px / 16~40px |
| `--mg-layout-sidebar-bg`, `--mg-layout-sidebar-active-bg` | LNB 배경·활성 메뉴 | #2C2C2C, #3D5246 |
| `--mg-layout-header-bg`, `--mg-layout-header-border` | GNB 배경·구분선 | #FAF9F7, #D4CFC8 |
| `--mg-layout-main-bg-start`, `--mg-layout-main-bg-end` | 메인 그라데이션 | #FAF9F7, #F2EDE8 |
| `--mg-layout-section-bg`, `--mg-layout-section-border` | 섹션 블록 | #F5F3EF, #D4CFC8 |

### 4.3 B0KlA·공통 토큰 (unified-design-tokens.css, dashboard-tokens-extension.css)

| 토큰/클래스 | 용도 |
|-------------|------|
| `--mg-color-background-main`, `--mg-color-surface-main` | 메인·카드 배경 |
| `--mg-color-primary-main`, `--mg-color-text-main`, `--mg-color-text-secondary` | 주조·본문·보조 텍스트 |
| `--mg-color-border-main` | 테두리 |
| `--ad-b0kla-title-color`, `--ad-b0kla-subtitle-color` | ContentHeader 제목·부제목 |
| `mg-v2-ad-b0kla__*` | B0KlA 카드·차트·Pill 등 컴포넌트 클래스 |

### 4.4 타이포

- **폰트**: Noto Sans KR.
- **제목**: 20~28px, fontWeight 600~700. 색상 `var(--mg-color-text-main)` 또는 `--ad-b0kla-title-color`.
- **본문**: 14~16px.
- **라벨/캡션**: 12px, `var(--mg-color-text-secondary)` 또는 `--ad-b0kla-subtitle-color`.

---

## 5. 이모지 사용 금지 및 아이콘 매핑

### 5.1 원칙

- **모든 UI**에서 이모지 사용 금지. 버튼 문구·라벨·상수·메시지 타입·역할·카테고리·빈 상태·에러 상태 등에 이모지를 넣지 않는다.
- **아이콘**: Lucide React(또는 프로젝트에서 채택한 동일 표준) 아이콘 컴포넌트만 사용. 예: `<MessageCircle />`, `<ClipboardList />`.
- **문구**: "저장", "대시보드" 등 텍스트만 사용. 필요 시 아이콘은 컴포넌트로 별도 배치(예: 버튼 앞에 `<Check size={16} />`).

### 5.2 이모지 → 아이콘 컴포넌트 매핑표

코더는 아래 매핑에 따라 기존 이모지 사용처를 Lucide 아이콘으로 교체한다. (Lucide 컴포넌트명 기준)

| 용도/문맥 | 기존 이모지 | Lucide 아이콘 컴포넌트 | 비고 |
|-----------|-------------|-------------------------|------|
| 대시보드/통계 | 📊 | `BarChart3` 또는 `LayoutDashboard` | |
| 목록/클립보드 | 📋 | `ClipboardList` | |
| 메시지/채팅 | 💬 | `MessageCircle` | |
| 알림 | 🔔 | `Bell` | |
| 성공/완료/확인 | ✅ | `Check` 또는 `CheckCircle` | |
| 실패/취소/거부 | ❌ | `X` 또는 `XCircle` | |
| 경고/주의 | ⚠️ | `AlertTriangle` | |
| 에러 | ❗ | `AlertCircle` | |
| 돈/결제 | 💰 | `DollarSign` 또는 `Wallet` | |
| 캘린더/일정 | 📅 | `Calendar` | |
| 시간/알람 | ⏰ | `Clock` | |
| 휴가/휴무 | 🏖️ | `Palmtree` 또는 `Sun` | |
| 사용자/역할 | 👤 | `User` | |
| 사용자들 | 👥 | `Users` | |
| 상담사/의료 | 👨‍⚕️ | `Stethoscope` 또는 `UserCircle` | |
| 설정 | ⚙️ | `Settings` | |
| 이메일 | 📧 | `Mail` | |
| 비밀번호/잠금 | 🔒, 🔐 | `Lock` | |
| 링크/연결 | 🔗 | `Link` | |
| 새로고침 | 🔄 | `RefreshCw` | |
| 검색 | 🔍 | `Search` | |
| 편집 | ✏️ | `Pencil` | |
| 삭제 | 🗑️ | `Trash2` | |
| 빈 상태/메시지 없음 | 📭 | `Inbox` | |
| 문서/보고서 | 📄, 📋 | `FileText` | |
| 폴더/카테고리 | 📁, 📂 | `Folder` | |
| 패키지/상자 | 📦 | `Package` | |
| 결제 수단 | 💳 | `CreditCard` | |
| 구매/쇼핑 | 🛒 | `ShoppingCart` | |
| 우선순위 | ⚡ | `Zap` | |
| 상태/반복 | 🔄 | `Repeat` 또는 `RefreshCw` | |
| 대기/로딩 | ⏳ | `Loader2` (spin) | |
| 저장 | 💾 | `Save` | |
| AI/자동화 | 🤖 | `Bot` 또는 `Sparkles` | |
| 진단/의료 | 💊 | `Pill` | |
| 인지/뇌 | 🧠 | `Brain` | |
| 테넌트/회사 | 🏢 | `Building2` | |
| 역할(왕관) | 👑 | `Crown` | |
| 성별 등 | ⚧ | `User` 등 문맥에 맞게 | |
| 오전/오후 반차 | 🌅, 🌆, ☀️, 🌞, 🌤️ | `Sunrise`, `Sunset`, `Sun` 등 | VacationManagementModal |
| 등급(별) | ⭐, ⭐⭐, ⭐⭐⭐ | `Star` (개수로 반복 또는 Badge) | roleHelper 등 |
| 재생/일시정지 | ▶️, ⏸️ | `Play`, `Pause` | CommonCodeManagement 활성/비활성 |
| 보안/방패 | 🛡️, 🔐 | `Shield`, `Lock` | SecurityMonitoringDashboard |
| 사용 방법/도움말 | 💡 | `Lightbulb` | |
| 위젯 삭제/설정 | 🗑️, ⚙️ | `Trash2`, `Settings` | DashboardFormModal |

### 5.3 상수·메시지 타입·역할·카테고리 적용

- **codeHelper.js** 등에서 `icon: '📋'` 형태 → `icon: ClipboardList`(또는 Lucide 컴포넌트 참조)로 변경. 렌더 시 `<Icon />` 형태로 사용.
- **ConsultantMessageScreen**, **ClientMessageScreen**: 메시지 타입(일반, 후속 조치, 과제 안내, 알림, 긴급) → 위 매핑표의 MessageCircle, ClipboardList, FileText, Bell, AlertTriangle 등.
- **UserManagement**, **roleHelper**: 역할·등급 표시 → User, Users, Crown, Star 등.
- **QuickExpenseForm**: 카테고리 아이콘 → 매핑표 기준.
- **tenantCodeConstants**: PAGE_TITLE, PLACEHOLDER_ICON 등 이모지 제거 후 텍스트 + 아이콘 컴포넌트.
- **MappingCard**, **MappingDetailModal**: 라벨·상태 표시 이모지 → 아이콘 컴포넌트.
- **빈 상태/에러 메시지**: "메시지 없음", "오류가 발생했습니다" 등 텍스트 + Inbox, AlertCircle 등 아이콘 컴포넌트.

---

## 6. 코더 구현 체크리스트

- [ ] 모든 어드민/ERP 목록·상세·폼 페이지가 ContentHeader + ContentArea + 섹션 블록 구조를 따르는가?
- [ ] DesktopLayout / MobileLayout에서 LNB 260px, 드로어 280px, 메인 패딩이 `responsive-layout-tokens.css`와 일치하는가?
- [ ] 색상·여백·타이포에 `var(--mg-*)`, `--ad-b0kla-*`, `--mg-layout-*` 토큰만 사용하는가?
- [ ] B0KlA 카드·그리드·버튼 사용 영역에 `mg-v2-ad-b0kla__*` 및 토큰이 적용되어 있는가?
- [ ] UI에 이모지가 남아 있지 않고, 매핑표에 따라 Lucide(또는 표준) 아이콘 컴포넌트로 교체되었는가?
- [ ] AdminCommonLayout 미적용 페이지가 없는가?(해당되는 경우)

---

## 7. 참조 문서

| 문서 | 용도 |
|------|------|
| docs/project-management/UNIFIED_LAYOUT_AND_PAGES_PLAN.md | 기획·범위·Phase |
| docs/design-system/RESPONSIVE_LAYOUT_SPEC.md | 브레이크포인트·컨테이너·패딩·그리드 |
| docs/design-system/PENCIL_DESIGN_GUIDE.md | B0KlA 팔레트·레이아웃·타이포·단일 소스 |
| docs/layout/README.md, ADMIN_COMMON_LAYOUT.md | AdminCommonLayout 사용법 |
| frontend/src/styles/unified-design-tokens.css | 디자인 토큰 참고 |
| frontend/src/styles/responsive-layout-tokens.css | 레이아웃 토큰 |
| 어드민 대시보드 샘플 | https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample |
