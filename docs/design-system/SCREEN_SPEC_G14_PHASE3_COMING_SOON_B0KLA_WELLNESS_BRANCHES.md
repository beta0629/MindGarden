# G-14 Phase 3: ComingSoon, BranchDeprecation & Wellness UI/UX 스펙

## 1. 개요
- **목표**: 어드민 내 '준비 중(ComingSoon)', '지점 사용 중단(BranchDeprecationNotice)', '웰니스 관리(WellnessManagement)' 화면을 B0KlA 디자인 시스템 기준으로 통합·개편한다.
- **주요 변경 사항**:
  - `AdminCommonLayout`을 통한 셸 통합 및 이중 헤더/이중 LNB 제거
  - `ContentHeader`의 `title` 중복 제거 패턴 적용 (Wellness)
  - `mg-v2-notice-card` (공통 카드 Organism) 추출을 통한 ComingSoon / BranchDeprecation UI 통합
  - 기존 레거시 `ComingSoon.css` (풀스크린 그라데이션) 폐기
- **제약 사항 (Must not)**:
  - 이중 LNB 구조 발생 금지
  - `min-height: 100vh` 등 풀스크린 그라데이션 금지 (셸 레이아웃의 콘텐츠 영역만을 사용)

---

## 2. Before / After 와이어프레임 (텍스트)

### 2.1 ComingSoon / BranchDeprecationNotice
**[Before]**
```text
+---------------------------------------------------------+
| [풀스크린 그라데이션 배경 (ComingSoon.css)]               |
| +-----------------------------------------------------+ |
| | 아이콘                                              | |
| | 제목 (H1) - "준비 중" / "지점 사용 중단"            | |
| | 설명                                                | |
| | - 특징 1                                            | |
| | - 특징 2                                            | |
| | [ 이전 페이지로 ] 버튼                              | |
| +-----------------------------------------------------+ |
+---------------------------------------------------------+
* 문제: AdminCommonLayout 적용 시 화면 전체를 덮는 레거시 스타일과 충돌하며 어드민 셸 일관성 위배.
```

**[After]**
```text
+---------------------------------------------------------+
| <AdminCommonLayout title="준비 중" loading={false}>       |
|   <div className="mg-v2-ad-b0kla">                      |
|     <ContentArea>                                       |
|       <div className="mg-v2-notice-card">               |
|         <div className="mg-v2-notice-card__accent" />   |
|         <div className="mg-v2-notice-card__content">    |
|           <div className="mg-v2-notice-card__icon" />   |
|           <h2 className="mg-v2-notice-card__title">준비 중</h2> |
|           <p className="mg-v2-notice-card__desc">...</p>|
|           <ul className="mg-v2-notice-card__features">  |
|             <li className="mg-v2-notice-card__feature-item">특징 1</li> |
|           </ul>                                         |
|           <div className="mg-v2-notice-card__actions">  |
|             <MGButton>이전 페이지로</MGButton>          |
|           </div>                                        |
|         </div>                                          |
|       </div>                                            |
|     </ContentArea>                                      |
|   </div>                                                |
| </AdminCommonLayout>                                    |
+---------------------------------------------------------+
```

### 2.2 WellnessManagement (이중 타이틀 제거)
**[Before]**
```text
<AdminCommonLayout title="웰니스 알림 관리">
  <ContentArea>
    <ContentHeader title="웰니스 알림 관리" subtitle="..." actions={...} />
    <main>...</main>
...
* 문제: GNB/LNB 영역의 타이틀과 본문 ContentHeader의 타이틀이 중복 노출됨.
```

**[After]**
```text
<AdminCommonLayout title="웰니스 알림 관리" loading={false}>
  <ContentArea>
    {/* title prop을 null로 전달하여 중복 렌더링 방지, 부제와 액션만 유지 */}
    <ContentHeader title={null} subtitle="..." actions={...} />
    <main>...</main>
...
```

---

## 3. 공통 UI Organism: Notice Card (`mg-v2-notice-card`)

ComingSoon 및 BranchDeprecationNotice에서 공통으로 사용할 카드형 컴포넌트 구조입니다. 기존 `ComingSoon.css`를 완전히 대체합니다.

### 3.1 클래스 구조
- `mg-v2-notice-card`: 카드 컨테이너 (최대 너비 약 600px, 중앙 정렬)
- `mg-v2-notice-card__accent`: 좌측 세로 악센트 바
- `mg-v2-notice-card__content`: 내부 콘텐츠 래퍼
- `mg-v2-notice-card__icon`: 상단 아이콘 영역 (bi-tools, bi-exclamation-triangle 등)
- `mg-v2-notice-card__title`: 카드 내 메인 제목 (24px, bold)
- `mg-v2-notice-card__desc`: 설명 텍스트
- `mg-v2-notice-card__features`: 목록 컨테이너
- `mg-v2-notice-card__feature-item`: 목록 개별 항목 (아이콘 + 텍스트)
- `mg-v2-notice-card__actions`: 하단 버튼 그룹 래퍼

### 3.2 B0KlA 토큰 적용 (`var(--mg-*)` Only)
절대 `#hex` 색상 코드를 직접 사용하지 않습니다.
- **배경**: `var(--mg-surface-base)` (라이트 모드: #F5F3EF)
- **테두리**: `1px solid var(--mg-border-base)`
- **Radius**: `var(--mg-radius-xl)` (16px)
- **악센트 바**: `4px solid var(--mg-primary-main)`
- **제목(Text)**: `var(--mg-text-primary)`
- **설명/서브(Text)**: `var(--mg-text-secondary)`
- **아이콘**: `var(--mg-primary-main)` (단, 주의/경고 목적의 카드는 `var(--mg-warning-main)` 사용 가능)
- **패딩**: `var(--mg-spacing-24)` (24px)
- **갭(Gap)**: `var(--mg-spacing-16)` (16px)

---

## 4. AdminCommonLayout Props 매핑

### 4.1 ComingSoon (`/admin/system`, `/admin/logs`, `/admin/settings`, `/admin/erp/reports` 등)
- **title**: 전달된 `title` prop 또는 기본값 "준비 중"
- **loading**: `false`
- **children**: `<ContentArea>` 내부에 `mg-v2-notice-card` Organism 렌더링. 레거시 풀스크린 스타일 제거.

### 4.2 BranchDeprecationNotice (`/admin/branches`)
- **title**: "지점(Branch) 시스템 사용 중단"
- **loading**: `false`
- **children**: `<ContentArea>` 내부에 `mg-v2-notice-card` Organism 렌더링. 아이콘과 텍스트만 지점 중단 안내로 치환.

### 4.3 WellnessManagement (`/admin/wellness`)
- **title**: `t('admin:wellnessMgmt.title')`
- **loading**: 데이터 로드 전역 로딩 상태 (초기 `true` -> 데이터 응답 후 `false`)
- **children**: 기존 구조 유지. 단, 본문 상단의 `ContentHeader` 컴포넌트 호출 시 `title={null}`을 명시하여 GNB 타이틀과의 중복을 제거하고 부제(subtitle)와 우측 버튼(actions) 액션만 남김.

---

## 5. 반응형 및 다크 모드 (C-2b Cascade)

### 5.1 반응형 (1280px / 768px 브레이크포인트)
- **1280px 이상 (Desktop)**: 사이드바 영역과 분리된 본문 레이아웃. `mg-v2-notice-card`는 본문 중앙에 배치되며 최대 너비(Max-width: 600px)를 제한하여 가독성을 높인다.
- **768px ~ 1279px (Tablet)**: 유동적 너비가 적용되며, 카드 내부 패딩이 `var(--mg-spacing-20)` 정도로 축소될 수 있다.
- **767px 이하 (Mobile)**: `AdminCommonLayout`이 `MobileLayout`으로 자동 전환됨. 좌측 악센트 바를 상단 라인 포인트로 변경하거나 카드 좌우 마진을 줄인다. 하단 액션 버튼은 width 100% 가로 스크롤 없이 세로 배치된다.

### 5.2 Dark Mode (`[data-theme="dark"]` Cascade)
Admin Dark Mode C-2b 스펙에 맞춰, 하드코딩 없이 `var(--mg-*)` CSS 변수만으로 테마가 자동 전환되도록 설계한다.
- `[data-theme="dark"]` 활성화 시:
  - `var(--mg-surface-base)`가 자동으로 다크 카드 배경(예: #2C2C2C 계열)으로 치환됨.
  - `var(--mg-border-base)`가 어두운 테두리(예: `rgba(255,255,255, 0.1)`)로 치환됨.
  - `var(--mg-text-primary)`, `var(--mg-text-secondary)` 텍스트 토큰이 밝은 회색/흰색으로 자동 치환됨.
- 따라서, `mg-v2-notice-card` 스타일 시트 내부에서는 별도의 `@media (prefers-color-scheme: dark)` 나 `[data-theme="dark"]` 블록을 최소화하고, 오로지 CSS 변수만을 사용하여 다크 테마 전환을 달성한다.