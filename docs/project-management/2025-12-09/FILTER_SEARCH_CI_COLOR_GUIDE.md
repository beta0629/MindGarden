# 필터/검색 컴포넌트 CI 색상 연동 가이드

## 개요

필터/검색 컴포넌트는 CI(Corporate Identity) 색상 변경 시 쉽게 적용할 수 있도록 CSS 변수 기반 색상 시스템을 사용합니다.

## CI 색상 변경 방법

### 1. `unified-design-tokens.css` 파일 수정

`frontend/src/styles/unified-design-tokens.css` 파일에서 다음 변수들을 수정합니다:

```css
/* ===== FILTER/SEARCH COMPONENT COLORS (CI 연동) ===== */
--filter-search-primary: var(--tenant-primary, var(--cs-primary-500));
--filter-search-primary-light: var(--cs-primary-100);
--filter-search-primary-medium: var(--cs-primary-200);
--filter-search-primary-dark: var(--cs-primary-700);
--filter-search-primary-hover: var(--tenant-primary-hover, var(--cs-primary-600));
--filter-search-primary-active: var(--cs-primary-700);

--filter-search-secondary: var(--tenant-secondary, var(--cs-secondary-500));
--filter-search-secondary-light: var(--cs-secondary-50);
--filter-search-secondary-medium: var(--cs-secondary-200);
--filter-search-secondary-dark: var(--cs-secondary-700);

--filter-search-border: var(--cs-secondary-200);
--filter-search-border-hover: var(--filter-search-primary);
--filter-search-background: var(--color-white);
--filter-search-background-hover: var(--cs-secondary-50);

--filter-search-text: var(--cs-secondary-900);
--filter-search-text-secondary: var(--cs-secondary-500);
--filter-search-text-placeholder: var(--cs-secondary-400);

--filter-search-badge: var(--cs-error-500);
--filter-search-chip-bg: var(--filter-search-primary-light);
--filter-search-chip-border: var(--filter-search-primary-medium);
--filter-search-chip-text: var(--filter-search-primary-dark);
```

### 2. 테넌트 브랜딩 변수 수정

테넌트별 CI 색상을 적용하려면 다음 변수를 수정합니다:

```css
/* ===== TENANT BRANDING VARIABLES ===== */
--tenant-primary: #YOUR_CI_PRIMARY_COLOR;
--tenant-secondary: #YOUR_CI_SECONDARY_COLOR;
--tenant-primary-hover: #YOUR_CI_PRIMARY_HOVER_COLOR;
```

### 3. 직접 색상 값 지정

특정 색상을 직접 지정하려면:

```css
--filter-search-primary: #3b82f6;  /* 예: 파란색 */
--filter-search-primary-hover: #2563eb;  /* 예: 진한 파란색 */
--filter-search-chip-bg: #dbeafe;  /* 예: 연한 파란색 배경 */
--filter-search-chip-text: #1d4ed8;  /* 예: 진한 파란색 텍스트 */
```

## 적용되는 컴포넌트

다음 컴포넌트들이 CI 색상 변수를 사용합니다:

1. **검색 바 (SearchBar)**
   - 입력 필드 테두리
   - 포커스 상태 색상
   - 아이콘 색상
   - 자동완성 드롭다운

2. **해시태그 (Hashtags)**
   - 해시태그 배경색
   - 해시태그 테두리
   - 해시태그 텍스트

3. **필터 칩 (Filter Chips)**
   - 칩 배경색
   - 칩 테두리
   - 칩 텍스트
   - 제거 버튼 색상

4. **필터 드롭다운 (Filter Dropdown)**
   - 드롭다운 테두리
   - 호버 상태 색상
   - 포커스 상태 색상

5. **필터 토글 버튼 배지**
   - 활성 필터 개수 표시 배지 색상

## 색상 변수 매핑

| 컴포넌트 요소 | CSS 변수 | 기본값 |
|-------------|---------|--------|
| 검색 바 테두리 (포커스) | `--filter-search-border-hover` | `--filter-search-primary` |
| 해시태그 배경 | `--filter-search-chip-bg` | `--filter-search-primary-light` |
| 해시태그 테두리 | `--filter-search-chip-border` | `--filter-search-primary-medium` |
| 해시태그 텍스트 | `--filter-search-chip-text` | `--filter-search-primary-dark` |
| 필터 칩 배경 | `--filter-search-chip-bg` | `--filter-search-primary-light` |
| 필터 칩 테두리 | `--filter-search-chip-border` | `--filter-search-primary-medium` |
| 필터 칩 텍스트 | `--filter-search-chip-text` | `--filter-search-primary-dark` |
| 필터 배지 | `--filter-search-badge` | `--cs-error-500` |

## 예시: CI 색상 변경

### 예시 1: 민트 그린 CI 적용

```css
--filter-search-primary: #10b981;  /* 민트 그린 */
--filter-search-primary-light: #d1fae5;  /* 연한 민트 */
--filter-search-primary-medium: #a7f3d0;  /* 중간 민트 */
--filter-search-primary-dark: #047857;  /* 진한 민트 */
--filter-search-primary-hover: #059669;  /* 호버 민트 */
```

### 예시 2: 핑크 CI 적용

```css
--filter-search-primary: #ec4899;  /* 핑크 */
--filter-search-primary-light: #fce7f3;  /* 연한 핑크 */
--filter-search-primary-medium: #fbcfe8;  /* 중간 핑크 */
--filter-search-primary-dark: #be185d;  /* 진한 핑크 */
--filter-search-primary-hover: #db2777;  /* 호버 핑크 */
```

## 주의사항

1. **하드코딩 금지**: 컴포넌트 CSS 파일에 직접 색상 값을 작성하지 마세요.
2. **변수 사용**: 항상 `--filter-search-*` 변수를 사용하세요.
3. **일관성 유지**: 모든 필터/검색 관련 색상은 `unified-design-tokens.css`에서 관리합니다.
4. **테넌트별 색상**: 테넌트별 CI 색상은 `--tenant-primary`, `--tenant-secondary` 변수를 통해 자동으로 적용됩니다.

## 관련 파일

- `frontend/src/styles/unified-design-tokens.css` - CI 색상 변수 정의
- `frontend/src/styles/mindgarden-design-system.css` - 필터/검색 컴포넌트 스타일
- `frontend/src/components/ui/FilterSearch/` - 필터/검색 컴포넌트

