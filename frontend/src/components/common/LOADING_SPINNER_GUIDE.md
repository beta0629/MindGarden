# 공통 로딩 스피너 가이드 (UnifiedLoading SSOT)

> **Phase 2 — 2026-05-23**: 모든 로딩 UI는 `UnifiedLoading` 단일 SSOT를 사용한다.
>
> 이전 `LoadingSpinner` / `MGLoading` / `<div className="mg-spinner" />` 등 자체 정의는
> 모두 `UnifiedLoading` 으로 마이그레이션되었거나 SSOT 위임 래퍼로 전환되었다.

## 1. 위치 (SSOT)

| 항목 | 경로 |
|------|------|
| React 컴포넌트 | `frontend/src/components/common/UnifiedLoading.js` |
| 스타일 | `frontend/src/styles/06-components/_loading.css` (main.css 로 자동 import) |
| 디자인 토큰 폴백 | `_loading.css` 상단 `--mg-spinner-*` 정의 |
| 회전 키프레임 (SSOT) | `@keyframes mg-spinner-spin` (linear, jitter-free) |

## 2. 사용법

### 2.1 기본

```jsx
import UnifiedLoading from '../common/UnifiedLoading';

<UnifiedLoading text="로딩 중..." size="md" />
```

### 2.2 사이즈

`xs` / `sm` / `md` / `lg` / `xl` (레거시 `small` / `medium` / `large` 지원).

```jsx
<UnifiedLoading size="xs" />   // 16px - 인라인/버튼 내부
<UnifiedLoading size="sm" />   // 24px
<UnifiedLoading size="md" />   // 40px (기본)
<UnifiedLoading size="lg" />   // 56px - 페이지/오버레이
<UnifiedLoading size="xl" />   // 72px
```

### 2.3 톤(색상)

```jsx
<UnifiedLoading tone="primary" />    // 기본
<UnifiedLoading tone="secondary" />
<UnifiedLoading tone="success" />
<UnifiedLoading tone="danger" />
<UnifiedLoading tone="neutral" />
```

### 2.4 인라인 / 오버레이

```jsx
// 인라인 (텍스트 흐름)
<UnifiedLoading inline size="xs" showText={false} label="저장 중" />

// 전체 화면 오버레이
<UnifiedLoading overlay size="lg" text="처리 중..." />

// 페이지 영역 (기본)
<UnifiedLoading type="page" size="lg" text="페이지 불러오는 중..." />
```

### 2.5 다양한 variant

```jsx
<UnifiedLoading variant="spinner" />  // 회전 (기본)
<UnifiedLoading variant="dots" />     // 점 3개 바운스
<UnifiedLoading variant="pulse" />    // 원형 펄스
<UnifiedLoading variant="bars" />     // 바 4개 웨이브
<UnifiedLoading variant="logo" />     // 브랜드 로고
```

## 3. 접근성

`UnifiedLoading`은 자동으로 다음 ARIA 속성을 부여한다.

- `role="status"` — 보조 기술이 상태 영역으로 인식
- `aria-live="polite"` — 변경 사항을 조용히 알림
- `aria-busy="true"` — 진행 중 상태
- `aria-label` — `label` prop 또는 `text` 값으로 자동 설정

`prefers-reduced-motion: reduce` 환경에서는 회전·바운스 대신 페이드만 표시한다.

## 4. Jitter 방지 핵심 (CSS)

`_loading.css` 의 `.mg-loading-spinner-icon` 은 다음을 보장한다.

```css
animation: mg-spinner-spin var(--mg-spinner-duration) linear infinite;
transform-origin: 50% 50%;
will-change: transform;
backface-visibility: hidden;
```

- **linear** — 가속·감속 없는 등속 회전
- **transform-origin: 50% 50%** — 중심 회전 보장
- **will-change: transform** — compositor 레이어 분리, 메인 스레드 jank 회피
- **backface-visibility: hidden** — GPU 가속 안정화

> ⚠️ 새 CSS를 만들 때 `animation: spin ... ease-in-out infinite` 사용 금지.

## 5. Props 전체 참조

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `size` | `xs\|sm\|md\|lg\|xl\|small\|medium\|large` | `md` | 사이즈 (레거시 호환) |
| `tone` | `primary\|secondary\|success\|danger\|neutral` | `primary` | 색상 톤 |
| `variant` | `spinner\|dots\|pulse\|bars\|logo` | `spinner` | 시각 변형 |
| `type` | `inline\|fullscreen\|page\|button` | (자동) | 컨테이너 레이아웃 |
| `inline` | `boolean` | `false` | 인라인 단축 (`type='inline'` 자동) |
| `overlay` | `boolean` | `false` | 오버레이 단축 (`type='fullscreen'` 자동) |
| `text` | `string` | `'로딩 중...'` | 표시 텍스트 |
| `showText` | `boolean` | `true` | 텍스트 표시 여부 |
| `label` | `string` | `text` | `aria-label` (스크린리더 전용) |
| `centered` | `boolean` | `true` | 중앙 정렬 |
| `className` | `string` | `''` | 추가 클래스 |

## 6. 마이그레이션 매핑

| Before | After |
|--------|-------|
| `<div className="mg-spinner" />` | `<UnifiedLoading variant="spinner" size="md" type="inline" />` |
| `<MGLoading variant="..." />` | `<UnifiedLoading variant="..." />` |
| `<Spinner size="medium" />` (`ui/Loading`) | (자동 위임) — `Spinner` 는 SSOT 래퍼로 유지 |
| `<LoadingState message="..." />` (academy) | (자동 위임) — `LoadingState` 는 SSOT 래퍼로 유지 |
| `<LoadingSpinner ... />` (구 demo) | `<UnifiedLoading ... />` — 데모 파일 재작성됨 |

## 7. 후속 (이 PR 범위 외)

- 컴포넌트별 자체 `@keyframes spin` (50+ 곳) 점진 통합 → `mg-spinner-spin` 단일화
- `unified-design-tokens.css` 내 `.mg-spinner` / `.mg-v2-spinner` / `.mg-spinner--sm` 중복 정의 정리
- 시각 회귀 검증: `core-tester` 위임 (Playwright/Chromatic 등)
