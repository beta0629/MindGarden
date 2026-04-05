# AdminCommonLayout 본문 표준 스켈레톤 및 마이그레이션 가이드

**문서 버전**: 1.0  
**작성**: 레이아웃 공통화 TF 2단계 (core-designer · core-publisher 산출)  
**대상**: core-coder (JSX·스타일·연동)  
**참조 구현**: `SchedulePage.js`, `TenantCommonCodeManager.js`, `ErpDashboard.js`, `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md`

---

## 1. 목표

`AdminCommonLayout`을 사용하는 모든 어드민 페이지의 **직계 자식(children)** 에서 다음을 표준화한다.

- **`ContentArea`**로 본문 영역을 한 번 감싼다 (`mg-v2-content-area`, `role="region"`).
- 페이지 상단 제목·부제·우측 액션은 **`ContentHeader`** (`mg-v2-content-header`)로 통일한다.
- 레거시 전용 래퍼(`mg-dashboard-layout`, `dashboard-container`, `*-dashboard-container`, 임의 `admin-page` 류 등)는 **제거하거나** B0KlA·토큰 기반 블록으로 치환한다.

전수조사에서 `ContentArea` 미사용 페이지가 다수인 경우, 아래 스켈레톤을 **최소 변경**으로 끼워 넣는 것이 1차 목표다.

---

## 2. 레이어 구조 (실제 DOM 관점)

```
AdminCommonLayout
  └── div.mg-v2-ad-b0kla.mg-v2-ad-dashboard-v2
        └── DesktopLayout | MobileLayout
              ├── GNB / LNB (템플릿)
              └── main.mg-v2-desktop-layout__main | .mg-v2-mobile-layout__main   ← 이미 페이지 단일 <main>
                    └── [여기부터 앱이 넣는 children]
                          └── (권장) ContentArea.mg-v2-content-area[role="region"]
                                └── (선택) ContentHeader.mg-v2-content-header
                                └── 본문 블록 (ContentSection, 카드, 폼 등)
```

**접근성 주의**: 템플릿이 이미 `<main role="main">`을 제공하므로, **`ContentArea` 안에 또 `<main>`을 두지 않는다.** 본문 구획이 필요하면 `<section aria-labelledby="...">` 등을 사용한다. (기존 일부 파일의 `<main>` 중첩은 마이그레이션 시 정리 대상이다.)

---

## 3. 표준 마크업 스켈레톤

### 3.1 시맨틱 HTML(퍼블리셔 기준 조각)

코더가 JSX로 옮길 때 구조·클래스가 1:1 대응하도록 작성한다.

```html
<!-- 페이지: AdminCommonLayout children 내부 -->
<div class="mg-v2-content-area" role="region" aria-label="(페이지별 짧은 설명)">
  <header class="mg-v2-content-header">
    <div class="mg-v2-content-header__left">
      <h1 id="(선택)페이지-제목-id" class="mg-v2-content-header__title">페이지 제목</h1>
      <p class="mg-v2-content-header__subtitle">한 줄 설명 (없으면 생략 가능)</p>
    </div>
    <div class="mg-v2-content-header__right">
      <!-- 선택: 필터, 버튼 그룹 등 actions 슬롯 -->
    </div>
  </header>

  <!-- 본문: 섹션·카드·테이블 등 -->
  <section class="mg-v2-content-section mg-v2-content-section--card" aria-labelledby="섹션-제목-id">
    <header class="mg-v2-content-section__header">
      <div class="mg-v2-content-section__title-wrap">
        <div>
          <h2 id="섹션-제목-id" class="mg-v2-content-section__title">섹션 제목</h2>
          <p class="mg-v2-content-section__subtitle">섹션 부제 (선택)</p>
        </div>
      </div>
    </header>
    <div class="mg-v2-content-section__body">
      <!-- 콘텐츠 -->
    </div>
  </section>
</div>
```

- **ContentHeader가 불필요한 경우**(예: 대시보드만 KPI로 시작): `ContentHeader` 노드 자체를 생략하고 `ContentArea` 직하위에 본문만 둔다.
- **카드 없이 풀폭 본문**: `ContentSection`의 `noCard`(plain) 패턴을 사용한다. (구현은 `ContentSection` 컴포넌트 참조.)

### 3.2 JSX 스켈레톤 (core-coder용)

`ContentArea` / `ContentHeader`는 `frontend/src/components/dashboard-v2/content`에서 import 한다.

```jsx
import AdminCommonLayout from '../../components/layout/AdminCommonLayout';
import { ContentArea, ContentHeader, ContentSection } from '../../components/dashboard-v2/content';

const PAGE_TITLE_ID = 'some-page-title';

export default function SomeAdminPage() {
  return (
    <AdminCommonLayout title="LNB/브라우저 타이틀용" /* searchValue 등 props */>
      <ContentArea ariaLabel="(스크린리더용 짧은 영역 설명)">
        <ContentHeader
          title="페이지 제목"
          subtitle="한 줄 설명"
          titleId={PAGE_TITLE_ID}
          /* actions={<>...</>} */
        />

        <section className="mg-v2-content-section mg-v2-content-section--card" aria-labelledby="section-example">
          {/* 또는 <ContentSection title="..." titleId="section-example">...</ContentSection> */}
        </section>
      </ContentArea>
    </AdminCommonLayout>
  );
}
```

**props 요약** (구현 기준):

| 컴포넌트 | 주요 props | 비고 |
|----------|------------|------|
| `ContentArea` | `ariaLabel`, `className` | 기본 `aria-label`은 "대시보드 콘텐츠". 페이지별로 구체화 권장. |
| `ContentHeader` | `title`, `subtitle`, `actions`, `titleId` | `titleId`로 하위 `section`과 `aria-labelledby` 연결 가능. |
| `ContentSection` | `title`, `subtitle`, `actions`, `noCard`, `className` | 섹션 단위 카드/플레인 블록. |

---

## 4. 선택적 바깥 래퍼: `mg-v2-ad-b0kla__container`

일부 페이지는 `AdminCommonLayout` 직후에 다음을 한 겹 더 둔다.

```jsx
<div className="mg-v2-ad-b0kla">
  <div className="mg-v2-ad-b0kla__container">
    <ContentArea>...</ContentArea>
  </div>
</div>
```

**가이드**:

- 페이지 전용 **최대폭·좌우 패딩**이 B0KlA 컨테이너 스펙과 맞을 때만 유지한다.
- 새로 도입하지 말고, **기존에 동일 래퍼가 있으면** 그 안에 `ContentArea`를 넣어 정렬한다.
- 래퍼만 남고 `ContentArea`가 없으면 **래퍼 안쪽에 `ContentArea`를 추가**하는 형태로 통일한다.

---

## 5. 레거시 래퍼 마이그레이션 매핑

| 레거시 패턴 | 권장 조치 |
|-------------|-----------|
| `mg-dashboard-layout` 단독 래퍼 | 제거. 본문은 `ContentArea`가 담당. (레이아웃은 `AdminCommonLayout` 템플릿) |
| `dashboard-container`, `*-dashboard-container` | `ContentArea`로 치환하거나, 페이지별 BEM 블록을 `ContentArea` **내부**로 이동. |
| 임의 `admin-page` / 커스텀 최상위 div | 역할이 "본문 영역"이면 `ContentArea`; 스타일만이면 토큰·B0KlA 클래스로 이전 후 `ContentArea` 내부에 배치. |
| 커스텀 페이지 헤더 div + h1 | `ContentHeader` + `mg-v2-content-header__*` 로 통일. |
| `ContentArea`에 `className="mg-dashboard-layout"` 부여 | `ContentArea` 주석상 레거시 배치 비권장. **추가 class는 페이지 블록용 BEM**으로만 제한하고 레이아웃 클래스는 제거. |
| 본문 최상위 `<main>` | 템플릿과 중복이므로 `<section>` 등으로 변경하고 `aria-labelledby`로 제목 연결. |

---

## 6. 마이그레이션 절차 (코더 체크리스트)

1. **`AdminCommonLayout` children 진입점 확인**  
   로딩 스피너만 있고 그 아래가 비어 있는지, 레거시 div로 바로 시작하는지 확인한다.

2. **`ContentArea` 삽입**  
   기존 본문 전체를 `ContentArea`로 감싼다. `ariaLabel`을 페이지 맥락에 맞게 지정한다.

3. **`ContentHeader` 정렬**  
   화면 상단 제목이 있으면 `ContentHeader`로 옮기고, `AdminCommonLayout`의 `title`(LNB/헤더용)과 문구를 기획 기준으로 맞춘다.

4. **레거시 레이아웃 클래스 제거**  
   `mg-dashboard-layout`, `dashboard-container` 등이 레이아웃 역할만 한다면 삭제한다. 스타일이 필요하면 `ContentSection`·디자인 토큰·기능 블록 BEM으로 이전한다.

5. **시맨틱 정리**  
   중첩 `<main>` 제거, 표·폼은 시맨틱 태그 유지, 모달·토스트는 기존 공통 모듈 규칙 준수.

6. **회귀 확인**  
   데스크톱/모바일 브레이크포인트에서 GNB·LNB·스크롤 영역이 깨지지 않는지 확인한다.

---

## 7. 관련 소스 (수정 시 반드시 대조)

| 경로 | 설명 |
|------|------|
| `frontend/src/components/layout/AdminCommonLayout.js` | 최상위 `mg-v2-ad-b0kla` 래퍼, Desktop/Mobile 분기 |
| `frontend/src/components/dashboard-v2/templates/DesktopLayout.js` | `<main className="mg-v2-desktop-layout__main">` |
| `frontend/src/components/dashboard-v2/templates/MobileLayout.js` | `<main className="mg-v2-mobile-layout__main">` |
| `frontend/src/components/dashboard-v2/content/ContentArea.js` | `mg-v2-content-area`, `role="region"` |
| `frontend/src/components/dashboard-v2/content/ContentHeader.js` | `mg-v2-content-header` |
| `frontend/src/components/dashboard-v2/content/ContentSection.js` | 섹션 카드/플레인 |
| `docs/design-system/v2/COMMON_UI_IMPLEMENTATION_SPEC.md` | 버튼·배지·카드 등 공통 클래스 |
| `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` | 설정계열 레이아웃 통일 배경 |

---

## 8. 운영 반영 전 하드코딩

운영 게이트·하드코딩 스캔 정책은 프로젝트 문서의 **운영 반영 체크리스트** 및 **ADMIN LNB / 설정 페이지 오케스트레이션** 문서의 하드코딩 절을 따른다. 마이그레이션 시 새 문자열 하드코딩·색상 직접 지정을 추가하지 않는다.

---

*본 문서는 HTML 구조·클래스 계약을 정의한다. CSS 파일 수정·API 연동·상태 로직은 core-coder 영역이다.*
