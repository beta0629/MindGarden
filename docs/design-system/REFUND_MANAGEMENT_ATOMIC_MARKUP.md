# 환불 관리 시스템 — 아토믹 디자인 마크업 구조

**작성일**: 2025-03-16  
**담당**: core-publisher  
**참조**: `docs/project-management/REFUND_MANAGEMENT_NEW_LAYOUT_SPEC.md`, `docs/design-system/v2/COMMON_UI_IMPLEMENTATION_SPEC.md`, `.cursor/skills/core-solution-publisher/SKILL.md`

---

## 1. 개요

- **목적**: 환불 관리 페이지(`/erp/refund-management`)의 HTML 마크업 구조를 아토믹 디자인 계층으로 제안.
- **규칙**: BEM(`mg-v2-*`, `refund-management__*`), 시맨틱 태그, 접근성(aria-*, role, label) 반영.
- **공통 컴포넌트**: 버튼·배지·카드는 `common/` 모듈 클래스만 사용. 신규 클래스·구조 금지.

---

## 2. Atoms (원자)

### 2.1 버튼

| 용도 | 클래스 | 비고 |
|------|--------|------|
| 주 액션(ERP 환불 반영 등) | `mg-v2-button mg-v2-button--primary` | |
| 보조(새로고침, 엑셀) | `mg-v2-button mg-v2-button--secondary` | |
| 링크형(운영 현황으로 돌아가기) | `mg-v2-button mg-v2-button--outline` 또는 앵커 + 동일 클래스 | |
| 아이콘만 버튼 | `mg-v2-button mg-v2-button--secondary` + `aria-label` 필수 | |

**HTML 조각 예(버튼)**

```html
<button type="button" class="mg-v2-button mg-v2-button--primary" aria-label="ERP 환불 반영">
  ERP 환불 반영
</button>
<button type="button" class="mg-v2-button mg-v2-button--secondary" aria-label="새로고침">
  <!-- 아이콘 또는 텍스트 -->
</button>
```

### 2.2 라벨

| 용도 | 클래스 | 비고 |
|------|--------|------|
| 폼 라벨 | `mg-v2-form-label` | `<label for="...">` |
| KPI/카드 라벨 | `refund-management__stat-label` | 숫자 위 설명 텍스트 |

**HTML 조각 예(라벨)**

```html
<label for="refund-period" class="mg-v2-form-label">기간</label>
<span class="refund-management__stat-label">환불 건수</span>
```

### 2.3 배지

| 용도 | 클래스 | 비고 |
|------|--------|------|
| 상태(연동 완료/대기 등) | `mg-v2-status-badge mg-v2-badge--success` / `--warning` / `--neutral` / `--danger` / `--info` | role="status" |
| 회기 수 | `mg-v2-count-badge` | 예: 3회 |

**HTML 조각 예(배지)**

```html
<span class="mg-v2-status-badge mg-v2-badge--success" role="status">연동 완료</span>
<span class="mg-v2-count-badge">3회</span>
```

### 2.4 아이콘

- 컨테이너 또는 `<span>`에 `refund-management__icon` 등 BEM 요소 클래스. 아이콘 SVG/이미지는 core-coder 연동.
- 아이콘만 있는 버튼에는 `aria-label` 필수.

### 2.5 입력(Select)

| 용도 | 클래스 | 비고 |
|------|--------|------|
| 기간 선택 | `mg-v2-select` | id + label for 연결 |
| 상태 선택 | `mg-v2-select` | id + label for 연결 |

**HTML 조각 예(Select)**

```html
<select id="refund-period" class="mg-v2-select" name="period" aria-label="조회 기간">
  <option value="">전체</option>
</select>
<select id="refund-status" class="mg-v2-select" name="status" aria-label="환불 상태">
  <option value="">전체</option>
</select>
```

---

## 3. Molecules (분자)

### 3.1 통계 카드 1장 (KPI 셀)

- **역할**: 환불 건수 / 환불 금액 / 환불 회기 / 연동 상태 중 하나를 표시.
- **공통**: 카드 컨테이너 `mg-v2-card-container`, 내부에 라벨(Atom) + 값.

**클래스**

| 요소 | 클래스 |
|------|--------|
| 카드 래퍼 | `mg-v2-card-container refund-management__stat-card` |
| 라벨 | `refund-management__stat-label` |
| 값 | `refund-management__stat-value` |

**HTML 조각**

```html
<!-- Molecule: 환불 KPI 카드 1장 -->
<div class="mg-v2-card-container refund-management__stat-card">
  <span class="refund-management__stat-label" id="refund-stat-count-label">환불 건수</span>
  <span class="refund-management__stat-value" aria-labelledby="refund-stat-count-label">0</span>
</div>
```

### 3.2 필터 그룹 (기간 + 상태 한 줄)

- **역할**: 기간 select, 상태 select를 한 줄로 묶음.
- **시맨틱**: `<form>` 또는 `<fieldset>` + `<legend>`(sr-only 가능).

**클래스**

| 요소 | 클래스 |
|------|--------|
| 필터 래퍼 | `refund-management__filter-group` |
| 필드셋 | `refund-management__filter-fieldset` |
| 개별 필드 래퍼 | `mg-v2-form-group refund-management__filter-field` |

**HTML 조각**

```html
<!-- Molecule: 필터 그룹 -->
<fieldset class="refund-management__filter-fieldset" aria-labelledby="refund-filter-legend">
  <legend id="refund-filter-legend" class="sr-only">환불 조회 필터</legend>
  <div class="mg-v2-form-group refund-management__filter-field">
    <label for="refund-period" class="mg-v2-form-label">기간</label>
    <select id="refund-period" class="mg-v2-select" name="period" aria-label="조회 기간"></select>
  </div>
  <div class="mg-v2-form-group refund-management__filter-field">
    <label for="refund-status" class="mg-v2-form-label">상태</label>
    <select id="refund-status" class="mg-v2-select" name="status" aria-label="환불 상태"></select>
  </div>
</fieldset>
```

### 3.3 테이블 행 — 헤더 한 줄

- **역할**: 환불 이력 테이블의 thead 한 줄.
- **컬럼**: 환불일시, 내담자, 상담사, 패키지, 환불 회기, 환불 금액, 환불 사유, ERP 상태.

**클래스**

| 요소 | 클래스 |
|------|--------|
| 행 | (시맨틱 `<tr>`) |
| 셀 | `refund-management__th` (필요 시 scope="col") |

**HTML 조각**

```html
<!-- Molecule: 테이블 헤더 행 -->
<tr>
  <th scope="col" class="refund-management__th">환불일시</th>
  <th scope="col" class="refund-management__th">내담자</th>
  <th scope="col" class="refund-management__th">상담사</th>
  <th scope="col" class="refund-management__th">패키지</th>
  <th scope="col" class="refund-management__th">환불 회기</th>
  <th scope="col" class="refund-management__th">환불 금액</th>
  <th scope="col" class="refund-management__th">환불 사유</th>
  <th scope="col" class="refund-management__th">ERP 상태</th>
  <th scope="col" class="refund-management__th refund-management__th--action" aria-label="액션"></th>
</tr>
```

### 3.4 테이블 행 — 데이터 한 줄 (바디)

- **역할**: 환불 이력 한 건. 셀 + 필요 시 액션(ERP 환불 반영 버튼).

**클래스**

| 요소 | 클래스 |
|------|--------|
| 행 | (시맨틱 `<tr>`) |
| 셀 | `refund-management__td` |
| 액션 셀 | `refund-management__td refund-management__td--action` |

**HTML 조각**

```html
<!-- Molecule: 테이블 데이터 행 1줄 -->
<tr class="refund-management__data-row">
  <td class="refund-management__td">2025-03-16 14:00</td>
  <td class="refund-management__td">내담자명</td>
  <td class="refund-management__td">상담사명</td>
  <td class="refund-management__td">패키지명</td>
  <td class="refund-management__td"><span class="mg-v2-count-badge">2회</span></td>
  <td class="refund-management__td">50,000원</td>
  <td class="refund-management__td">사유 텍스트</td>
  <td class="refund-management__td"><span class="mg-v2-status-badge mg-v2-badge--success" role="status">연동 완료</span></td>
  <td class="refund-management__td refund-management__td--action">
    <button type="button" class="mg-v2-button mg-v2-button--secondary mg-v2-button--small" aria-label="해당 건 ERP 환불 반영">ERP 환불 반영</button>
  </td>
</tr>
```

---

## 4. Organisms (유기체)

### 4.1 환불 KPI 블록

- **역할**: 상단 4열 — 환불 건수, 환불 금액, 환불 회기, 연동 상태.
- **시맨틱**: `<section>` + `aria-labelledby`.

**클래스**

| 요소 | 클래스 |
|------|--------|
| 섹션 | `refund-management__kpi-block` |
| 그리드 래퍼 | `refund-management__kpi-grid` |
| 카드 각각 | Molecule 3.1 사용 |

**HTML 조각**

```html
<!-- Organism: 환불 KPI 블록 -->
<section class="refund-management__kpi-block" aria-labelledby="refund-kpi-heading">
  <h2 id="refund-kpi-heading" class="sr-only">환불 현황 요약</h2>
  <div class="refund-management__kpi-grid">
    <div class="mg-v2-card-container refund-management__stat-card">...</div>
    <div class="mg-v2-card-container refund-management__stat-card">...</div>
    <div class="mg-v2-card-container refund-management__stat-card">...</div>
    <div class="mg-v2-card-container refund-management__stat-card">...</div>
  </div>
</section>
```

### 4.2 필터 + 테이블 상단 제어 블록

- **역할**: 필터 그룹(Molecule) + 새로고침·엑셀 내보내기 버튼.
- **시맨틱**: `<section>` 또는 `<div>` 래퍼.

**클래스**

| 요소 | 클래스 |
|------|--------|
| 래퍼 | `refund-management__filter-block` |
| 액션 그룹 | `mg-v2-card-actions` 또는 `refund-management__filter-actions` |

**HTML 조각**

```html
<!-- Organism: 필터 및 제어 -->
<section class="refund-management__filter-block" aria-labelledby="refund-filter-block-heading">
  <h2 id="refund-filter-block-heading" class="sr-only">조회 조건 및 액션</h2>
  <fieldset class="refund-management__filter-fieldset">...</fieldset>
  <div class="refund-management__filter-actions mg-v2-card-actions">
    <button type="button" class="mg-v2-button mg-v2-button--secondary" aria-label="새로고침">새로고침</button>
    <button type="button" class="mg-v2-button mg-v2-button--secondary" aria-label="엑셀 내보내기">엑셀 내보내기</button>
  </div>
</section>
```

### 4.3 환불 이력 테이블

- **역할**: thead(Molecule 3.3) + tbody(Molecule 3.4 반복) + 페이지네이션 영역.
- **시맨틱**: `<table>`, `<thead>`, `<tbody>`, `<caption>` 또는 aria-labelledby.

**클래스**

| 요소 | 클래스 |
|------|--------|
| 래퍼 섹션 | `refund-management__table-block` |
| 테이블 | `refund-management__history-table` |
| 페이지네이션 래퍼 | `refund-management__pagination` |

**HTML 조각**

```html
<!-- Organism: 환불 이력 테이블 -->
<section class="refund-management__table-block" aria-labelledby="refund-history-heading">
  <h2 id="refund-history-heading" class="sr-only">환불 이력 목록</h2>
  <div class="refund-management__table-wrapper">
    <table class="refund-management__history-table" role="table" aria-labelledby="refund-history-heading">
      <thead>
        <tr>...</tr>
      </thead>
      <tbody>...</tbody>
    </table>
  </div>
  <nav class="refund-management__pagination" aria-label="환불 이력 페이지 네비게이션">...</nav>
</section>
```

### 4.4 환불 사유별 통계 블록

- **역할**: 사유별 건수/비율 표시. 리스트 또는 소테이블.
- **시맨틱**: `<section>` + `<table>` 또는 `<ul>`.

**클래스**

| 요소 | 클래스 |
|------|--------|
| 섹션 | `refund-management__reason-stats-block` |
| 제목 | `refund-management__section-title` |
| 테이블/리스트 | `refund-management__reason-stats-table` 또는 `refund-management__reason-stats-list` |

**HTML 조각**

```html
<!-- Organism: 환불 사유별 통계 -->
<section class="refund-management__reason-stats-block" aria-labelledby="refund-reason-stats-heading">
  <h2 id="refund-reason-stats-heading" class="refund-management__section-title">환불 사유별 통계</h2>
  <table class="refund-management__reason-stats-table" role="table">
    <thead><tr><th scope="col">사유</th><th scope="col">건수</th><th scope="col">비율</th></tr></thead>
    <tbody>...</tbody>
  </table>
</section>
```

### 4.5 ERP 연동 상태 블록

- **역할**: ERP 동기화 상태 요약·안내.
- **시맨틱**: `<section>`.

**클래스**

| 요소 | 클래스 |
|------|--------|
| 섹션 | `refund-management__erp-sync-block` |
| 제목 | `refund-management__section-title` |
| 내용 래퍼 | `refund-management__erp-sync-content` |

**HTML 조각**

```html
<!-- Organism: ERP 동기화 상태 -->
<section class="refund-management__erp-sync-block" aria-labelledby="refund-erp-sync-heading">
  <h2 id="refund-erp-sync-heading" class="refund-management__section-title">ERP 동기화 상태</h2>
  <div class="refund-management__erp-sync-content">...</div>
</section>
```

### 4.6 회계 처리 현황 블록

- **역할**: 회계 처리 현황 요약.
- **시맨틱**: `<section>`.

**클래스**

| 요소 | 클래스 |
|------|--------|
| 섹션 | `refund-management__accounting-block` |
| 제목 | `refund-management__section-title` |
| 내용 래퍼 | `refund-management__accounting-content` |

**HTML 조각**

```html
<!-- Organism: 회계 처리 현황 -->
<section class="refund-management__accounting-block" aria-labelledby="refund-accounting-heading">
  <h2 id="refund-accounting-heading" class="refund-management__section-title">회계 처리 현황</h2>
  <div class="refund-management__accounting-content">...</div>
</section>
```

---

## 5. Template / Page 구조

### 5.1 본문 배치 순서 (고정)

1. 환불 KPI 블록 (Organism 4.1)  
2. 필터 + 테이블 상단 제어 (Organism 4.2)  
3. 환불 이력 테이블 (Organism 4.3)  
4. 환불 사유별 통계 (Organism 4.4)  
5. ERP 동기화 상태 (Organism 4.5)  
6. 회계 처리 현황 (Organism 4.6)

### 5.2 Template 레이아웃 (HTML 구조만)

- **헤더**: ContentHeader — 제목 "환불 관리 시스템", 부제 "상담 환불 현황 및 환불·결제 연동", 액션 "운영 현황으로 돌아가기".
- **메인**: `<main>` 내에 위 6개 Organism을 순서대로 배치.

**HTML 조각**

```html
<!-- Template: 환불 관리 페이지 레이아웃 -->
<header class="...">
  <h1>환불 관리 시스템</h1>
  <p>상담 환불 현황 및 환불·결제 연동</p>
  <a href="..." class="mg-v2-button mg-v2-button--outline">운영 현황으로 돌아가기</a>
</header>
<main id="refund-management-main" class="refund-management__main">
  <section class="refund-management__kpi-block">...</section>
  <section class="refund-management__filter-block">...</section>
  <section class="refund-management__table-block">...</section>
  <section class="refund-management__reason-stats-block">...</section>
  <section class="refund-management__erp-sync-block">...</section>
  <section class="refund-management__accounting-block">...</section>
</main>
```

### 5.3 Page

- **페이지**: RefundManagement. 데이터·필터 상태·API·이벤트는 core-coder 담당. 퍼블리셔는 마크업 구조만 제안.

---

## 6. 클래스명 일람 (BEM)

| 클래스 | 계층 | 용도 |
|--------|------|------|
| `refund-management__main` | Template | 본문 컨테이너 |
| `refund-management__kpi-block` | Organism | KPI 섹션 |
| `refund-management__kpi-grid` | Organism | KPI 카드 그리드 |
| `refund-management__stat-card` | Molecule | KPI 카드 1장 |
| `refund-management__stat-label` | Atom | KPI 라벨 |
| `refund-management__stat-value` | Atom | KPI 값 |
| `refund-management__filter-block` | Organism | 필터+액션 섹션 |
| `refund-management__filter-fieldset` | Molecule | 필터 fieldset |
| `refund-management__filter-field` | Molecule | 필터 필드 1개 |
| `refund-management__filter-actions` | Organism | 새로고침/엑셀 버튼 그룹 |
| `refund-management__table-block` | Organism | 이력 테이블 섹션 |
| `refund-management__table-wrapper` | Organism | 테이블 스크롤 래퍼 |
| `refund-management__history-table` | Organism | 테이블 |
| `refund-management__th` | Molecule | 헤더 셀 |
| `refund-management__th--action` | Molecule | 액션 헤더 셀 |
| `refund-management__data-row` | Molecule | 데이터 행 |
| `refund-management__td` | Molecule | 본문 셀 |
| `refund-management__td--action` | Molecule | 액션 셀 |
| `refund-management__pagination` | Organism | 페이지네이션 |
| `refund-management__reason-stats-block` | Organism | 사유별 통계 섹션 |
| `refund-management__reason-stats-table` | Organism | 사유별 통계 테이블 |
| `refund-management__erp-sync-block` | Organism | ERP 동기화 섹션 |
| `refund-management__erp-sync-content` | Organism | ERP 동기화 내용 |
| `refund-management__accounting-block` | Organism | 회계 현황 섹션 |
| `refund-management__accounting-content` | Organism | 회계 현황 내용 |
| `refund-management__section-title` | Organism | 섹션 제목(h2) |

---

## 7. 접근성 체크리스트

- [ ] 버튼(특히 아이콘만 있는 경우)에 `aria-label` 적용
- [ ] 필터 select에 `<label for="...">` 또는 `aria-label` 적용
- [ ] 테이블에 `scope="col"` 및 필요 시 `caption` 또는 `aria-labelledby`
- [ ] 섹션에 `aria-labelledby`로 제목과 연결
- [ ] 스크린 리더 전용 제목은 `class="sr-only"` 사용
- [ ] 상태 배지에 `role="status"` 적용

---

## 8. 참조

- **스펙**: `docs/project-management/REFUND_MANAGEMENT_NEW_LAYOUT_SPEC.md`
- **공통 UI**: `docs/design-system/v2/COMMON_UI_IMPLEMENTATION_SPEC.md`
- **퍼블리셔 스킬**: `.cursor/skills/core-solution-publisher/SKILL.md`
- **아토믹 디자인**: `.cursor/skills/core-solution-atomic-design/SKILL.md`

**문서 끝.**
