# SCREEN SPEC: Admin Dark Mode C-3 (Phase 1-j~n)

**작성일**: 2026-07-07
**담당**: core-designer
**Baseline**: develop `6a38a97b5`
**목표**: C-3 다크 모드 전역 rollout의 후속 배치인 P1-j~n 화면에 대해 모달, 필터 툴바, 테이블, 폼 요소의 `[data-theme="dark"]` cascade를 완벽하게 적용하기 위한 디자인 스펙. (코드 작성 제외, 스펙/가이드만 제공)

---

## 1. 대상 라우트 및 컴포넌트 (P1-j~n)

| ID | Route | 주요 컴포넌트 |
|----|-------|---------|
| **P1-j** | `/erp/budget` <br/> `/erp/refund-management` | `BudgetManagement`<br/>`RefundManagement` |
| **P1-k** | `/erp/salary` <br/> `/erp/dashboard` | `SalaryManagement`<br/>`ErpDashboard` |
| **P1-l** | `/admin/billing/subscriptions` <br/> `/admin/billing/payment-methods` | `SubscriptionsPage`<br/>`PaymentMethodsPage` |
| **P1-m** | `/admin/branding` <br/> `/admin/tenant-common-codes` | `BrandingManagement`<br/>`TenantCommonCodeManager` |
| **P1-n** | `/admin/package-pricing` <br/> `/admin/psych-assessments` | `PackagePricingListPage`<br/>`PsychAssessmentManagement` |

---

## 2. 사용성·정보노출·레이아웃 (1280/768 반응형) [§0.4]

다크 모드 적용 시에도 라이트 모드와 **동일한 정보 밀도와 사용성**을 유지해야 합니다.
레이아웃 구조는 `PENCIL_DESIGN_GUIDE.md`를 엄격히 따릅니다.

### 2.1 1280px (데스크탑)
- **사이드바**: 폭 약 260px 고정, 다크 계열 유지 (`var(--mg-dark-sidebar-bg)` 등 기존 다크 LNB 토큰 준수).
- **메인 콘텐츠**:
  - 좌우 여백 24~32px.
  - 상단 툴바(필터/검색 등)와 폼 영역, 데이터 테이블이 독립된 섹션 블록(1px 테두리, radius 16px) 안에 위치.
- **모달**: 데스크탑 화면에서 최대 너비(예: 600px, 800px 등)를 초과하지 않도록 제한.

### 2.2 768px (태블릿/모바일 반응형)
- **그리드 변화**: 테이블 뷰는 화면 폭에 맞춰 카드 뷰(Card View) 형태로 우아하게 강등(Graceful degradation)되거나, 가로 스크롤(Overflow-x)을 제공해야 합니다.
- **폼 요소 풀위드**: 입력 폼, 필터 영역은 1열(1-column) 배치로 변경되어 터치 타겟(최소 높이 44px)이 확보되도록 합니다.
- **모달**: 화면의 90% 이상을 차지하도록 넓어지며, 오버레이 대비 본문의 대비가 명확해야 합니다.

---

## 3. `[data-theme="dark"]` Cascade 토큰 표 (SSOT)

컴포넌트 내부에 하드코딩된 hex 값을 절대 피하고, `unified-design-tokens.css`의 SSOT 토큰을 재사용합니다.

### 3.1 모달 (`UnifiedModal` & SidePeek)
| 요소 | CSS 변수 (Dark Cascade) | 설명 |
|---|---|---|
| **오버레이** | `var(--ad-b0kla-overlay-bg)` | `rgba(0, 0, 0, 0.7)` 등 반투명 딤 처리 |
| **컨테이너/배경** | `var(--mg-color-surface-main)` / `var(--mg-dark-content-bg)` | 모달 본문 다크 배경 |
| **헤더/푸터** | `var(--mg-color-surface-raised)` | 다크 표면 대비 약간 밝은 영역 |
| **테두리** | `var(--mg-color-border-subtle)` | 뚜렷한 경계선 제공 |
| **텍스트** | `var(--mg-color-text-primary)` | 다크 모드용 화이트/라이트 그레이 |

### 3.2 필터 툴바 (`ErpFilterToolbar`, `SavedViewChip` 등)
| 요소 | CSS 변수 (Dark Cascade) | 설명 |
|---|---|---|
| **툴바 배경** | `var(--mg-dark-toolbar-bg)` | 툴바 영역 |
| **툴바 테두리**| `var(--mg-dark-toolbar-border)` | 툴바 구분선 |
| **칩 기본** | `var(--mg-dark-chip-bg)` / `var(--mg-dark-chip-text)` | `SavedViewChip` 비활성 상태 |
| **칩 활성** | `var(--mg-dark-chip-active-bg)` / `var(--mg-dark-chip-active-text)` | 활성 상태 (Primary Color 적용) |

### 3.3 데이터 테이블 (`B0KlA Table`, List/Compact Row)
| 요소 | CSS 변수 (Dark Cascade) | 설명 |
|---|---|---|
| **헤더 배경** | `var(--ad-b0kla-table-header-bg)` | 테이블 헤더 (th) |
| **로우 배경** | `var(--ad-b0kla-table-row-bg)` | 기본 `transparent` 처리 |
| **로우 호버** | `var(--ad-b0kla-table-row-hover)` | `tr:hover` 시 시각적 반응 |
| **로우 선택** | `var(--ad-b0kla-table-row-selected)` | 체크박스 선택 등 활성화 시 배경 |
| **테두리** | `var(--ad-b0kla-table-border)` | 행 간 구분선, 셀 테두리 |

### 3.4 폼 컨트롤 (Input, Select, Textarea)
| 요소 | CSS 변수 (Dark Cascade) | 설명 |
|---|---|---|
| **폼 배경** | `var(--mg-v2-form-bg)` | `input`, `select`, `textarea` |
| **폼 테두리**| `var(--mg-v2-form-border)` | 기본 폼 경계 |
| **입력 텍스트**| `var(--mg-v2-form-text)` | 사용자 타이핑 텍스트 색상 |
| **포커스 링**| `var(--mg-v2-form-focus-ring)` | `focus-visible` 시 대비되는 외곽선 |
| **라벨** | `var(--mg-v2-form-label)` | 입력 폼 위/옆 라벨 텍스트 |
| **에러 텍스트**| `var(--mg-v2-form-error)` | 유효성 실패 시 에러 텍스트 색상 |

---

## 4. Must not (금지 사항)

1. **라이트 모드 회귀 금지**: `data-theme="light"` 환경에서 레이아웃, 색상, 동작이 어긋나면 안 됩니다. `[data-theme="dark"]` 스코프 내에서만 CSS 속성을 덮어씌웁니다.
2. **Hex 값 하드코딩 금지**: `.css` 파일 내 다크 모드용 컬러 코드를 직접 입력하는 것을 엄격히 금지합니다.
3. **`UnifiedModal` 우회 금지**: 새로운 모달 구현 시 커스텀 오버레이/래퍼를 생성하지 말고 공통 모듈인 `UnifiedModal`을 무조건 재사용하십시오.

---

## 5. Coder PR 분할 및 Handoff 가이드 (core-coder 전송용)

P1-j부터 P1-n까지는 라우트가 많고 컴포넌트가 다수 연관되므로 PR 단위를 작게 나누어야 합니다. (1 PR = 1 가설 원칙)

### 5.1 PR 분할 권장 (Track A)
- **PR-A1**: `P1-j` (`/erp/budget`, `/erp/refund-management`)
- **PR-A2**: `P1-k` (`/erp/salary`, `/erp/dashboard`)
- **PR-A3**: `P1-l` (`/admin/billing/subscriptions`, `/admin/billing/payment-methods`)
- *참고: `P1-m`과 `P1-n`은 위 PR이 정상 머지된 후 후속 작업(PR-A4, PR-A5)으로 분리.*

### 5.2 Jest 확장 포인트
코더(core-coder)와 테스터(core-tester)는 각 PR마다 다음 기준을 검증해야 합니다.
- **`adminDarkMode.cascade`** Jest Gate 통과 필수
- Must not (하드코딩 및 우회) Grep 스크립트 0건 확인
- 1280px / 768px 스냅샷 및 시각 회귀 테스트 (다크 모드 적용 전후 비교)

---
> **Designer Sign-off**: 본 스펙은 C-3 다크 모드 렌더링에 필요한 토큰 체계, 레이아웃 반응형 원칙, 무결성 유지(Must not)를 보장합니다. 코더는 본 문서의 SSOT 표를 참조하여 `unified-design-tokens.css`의 토큰을 `[data-theme="dark"]` 하위에 적용하시기 바랍니다.
