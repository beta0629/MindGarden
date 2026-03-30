# MG Button — 아토믹 디자인 스펙 (Design Handoff)

**대상**: MG Button 공통 컴포넌트  
**아토믹 계층**: Atoms (원자)  
**버전**: 1.0  
**최종 업데이트**: 2025-03-04  
**구현**: `MGButton.js`는 유지하고, `MGButton.css`만 토큰 기반으로 수정.

---

## 1. 개요

**MG Button**은 프로젝트 아토믹 디자인 시스템의 **Atoms(원자)** 에 해당하는 공통 버튼 컴포넌트이다.  
`docs/design-system/ATOMIC_DESIGN_SYSTEM.md` 1.1 버튼 규칙(Primary / Secondary / Ghost / Danger, Size: sm / md / lg, `--cs-button-*` 등 CSS 변수 사용)을 따르며, 현재 구현된 **variant**(primary, secondary, success, danger, warning, info, outline, progress), **size**(small, medium, large), **상태**(disabled, loading) 및 **동작**(preventDoubleClick 등)은 그대로 유지한다.  
스타일만 **하드코딩 제거** 후 `unified-design-tokens.css`에 정의된 **CSS 변수(var(--mg-*), var(--cs-*))** 로 통일한다.

---

## 2. 사용 토큰 (CSS 변수만 사용)

배경·텍스트·테두리·호버·비활성·로딩·포커스·크기·간격·radius·그림자에 사용할 **토큰만** 나열한다.  
**기존 MGButton.css에 있는 #4b745c, #3e604c, #edf2f7, #a0aec0, 8px, 6px 12px, 14px, 16px, 18px 등 모든 하드코딩 값은 제거하고 아래 토큰으로 치환한다.**

### 2.1 색상

| 용도 | 토큰 |
|------|------|
| 주조(Primary) 배경 | `var(--mg-primary-500)` |
| 주조 호버 | `var(--mg-primary-600)` 또는 `var(--cs-primary-600)` |
| 주조 텍스트(밝은 배경 위) | `var(--mg-white)` |
| 보조(Secondary) 배경 | `var(--cs-secondary-500)` |
| 보조 호버 | `var(--cs-secondary-600)` |
| 성공(Success) 배경 | `var(--mg-success-500)` |
| 성공 호버 | `var(--cs-success-600)` |
| 위험(Danger) 배경 | `var(--mg-error-500)` |
| 위험 호버 | `var(--cs-error-600)` |
| 경고(Warning) 배경 | `var(--mg-warning-500)` |
| 경고 호버 | `var(--cs-warning-600)` |
| 정보(Info) 배경 | `var(--mg-primary-500)` 또는 `var(--mg-info-500)` |
| 정보 호버 | `var(--mg-primary-600)` 또는 `var(--mg-info-600)` |
| 아웃라인(Outline) 테두리/텍스트 | `var(--mg-primary-500)` |
| 아웃라인 호버 배경 | `var(--mg-primary-500)` |
| 프로그레스(Progress) 배경 | `var(--mg-primary-100)` 또는 `var(--cs-primary-100)` (연한 톤) |
| 프로그레스 바 | `var(--mg-primary-400)` 또는 `var(--cs-primary-400)` |
| 프로그레스 텍스트 | `var(--mg-primary-700)` 또는 `var(--cs-primary-700)` |
| 비활성(Disabled) 배경 | `var(--cs-secondary-100)` |
| 비활성 텍스트 | `var(--cs-secondary-400)` |
| 비활성 테두리 | `var(--cs-secondary-300)` |
| 로딩(Loading) 배경 | `var(--mg-primary-500)` + opacity(0.6) 또는 전용 토큰이 있으면 해당 토큰 |
| 포커스 링 | `var(--mg-primary-500)` 또는 `var(--color-border-focus)` |

### 2.2 간격 · 크기 · 타이포 · radius · 그림자

| 용도 | 토큰 |
|------|------|
| 버튼 border-radius | `var(--cs-radius-md)` 또는 `var(--border-radius-default)` (8px 계열) |
| Small padding | `var(--cs-spacing-sm)` `var(--cs-spacing-md)` (세로 가로) 또는 `var(--button-padding-sm)` |
| Medium padding | `var(--cs-spacing-sm)` `var(--cs-spacing-md)` 또는 `var(--button-padding-default)` |
| Large padding | `var(--cs-spacing-md)` `var(--cs-spacing-lg)` 또는 `var(--button-padding-lg)` |
| Small min-height | `var(--button-height-sm)` (32px) |
| Medium min-height | `var(--button-height-default)` (40px) |
| Large min-height | `var(--button-height-lg)` (48px) |
| Small font-size | `var(--cs-text-sm)` 또는 `var(--font-size-sm)` |
| Medium font-size | `var(--cs-text-md)` 또는 `var(--font-size-base)` |
| Large font-size | `var(--cs-text-lg)` 또는 `var(--font-size-lg)` |
| Font-weight | `var(--cs-font-medium)` 또는 `var(--font-weight-medium)` |
| Font-family | `var(--font-family-base)` (정의된 경우) 또는 inherit |
| 내용 gap(아이콘·텍스트) | `var(--cs-spacing-sm)` |
| 호버 그림자 | `var(--cs-shadow-soft)` |
| 포커스 outline-offset | `var(--cs-spacing-xs)` 또는 2px 고정(토큰 없을 시) |

---

## 3. 변형(Variant) — 토큰 매핑 표

| Variant | 기본 배경 | 기본 텍스트 | 기본 테두리 | 호버 배경 | 호버 텍스트 | Disabled 배경 | Disabled 텍스트 |
|---------|-----------|-------------|-------------|-----------|-------------|----------------|-----------------|
| primary | `var(--mg-primary-500)` | `var(--mg-white)` | transparent | `var(--mg-primary-600)` | `var(--mg-white)` | `var(--cs-secondary-100)` | `var(--cs-secondary-400)` |
| secondary | `var(--cs-secondary-500)` | `var(--mg-white)` | transparent | `var(--cs-secondary-600)` | `var(--mg-white)` | `var(--cs-secondary-100)` | `var(--cs-secondary-400)` |
| success | `var(--mg-success-500)` | `var(--mg-white)` | transparent | `var(--cs-success-600)` | `var(--mg-white)` | `var(--cs-secondary-100)` | `var(--cs-secondary-400)` |
| danger | `var(--mg-error-500)` | `var(--mg-white)` | transparent | `var(--cs-error-600)` | `var(--mg-white)` | `var(--cs-secondary-100)` | `var(--cs-secondary-400)` |
| warning | `var(--mg-warning-500)` | `var(--mg-white)` | transparent | `var(--cs-warning-600)` | `var(--mg-white)` | `var(--cs-secondary-100)` | `var(--cs-secondary-400)` |
| info | `var(--mg-primary-500)` | `var(--mg-white)` | transparent | `var(--mg-primary-600)` | `var(--mg-white)` | `var(--cs-secondary-100)` | `var(--cs-secondary-400)` |
| outline | transparent | `var(--mg-primary-500)` | `var(--mg-primary-500)` | `var(--mg-primary-500)` | `var(--mg-white)` | `var(--cs-secondary-100)` | `var(--cs-secondary-400)` |
| progress | `var(--mg-primary-100)` | `var(--mg-primary-700)` | transparent | (유지) | (유지) | `var(--cs-secondary-100)` | `var(--cs-secondary-400)` |

---

## 4. 크기(Size) — 토큰 지정

| Size | padding | font-size | min-height |
|------|--------|-----------|------------|
| small | `var(--cs-spacing-sm)` `var(--cs-spacing-md)` 또는 `var(--button-padding-sm)` | `var(--cs-text-sm)` / `var(--font-size-sm)` | `var(--button-height-sm)` |
| medium | `var(--cs-spacing-sm)` `var(--cs-spacing-md)` 또는 `var(--button-padding-default)` | `var(--cs-text-md)` / `var(--font-size-base)` | `var(--button-height-default)` |
| large | `var(--cs-spacing-md)` `var(--cs-spacing-lg)` 또는 `var(--button-padding-lg)` | `var(--cs-text-lg)` / `var(--font-size-lg)` | `var(--button-height-lg)` |

*(프로젝트에서 `--button-padding-*`, `--button-height-*`가 정의되어 있으면 우선 사용하고, 없으면 `--cs-spacing-*`, `--cs-text-*` 조합으로 동일한 수치를 맞춘다.)*

---

## 5. 상태별 시각(사용 토큰)

| 상태 | 시각 | 사용 토큰 |
|------|------|-----------|
| default | 각 variant별 기본 배경·텍스트·테두리 | 위 §3 변형 표 참조 |
| hover | 배경은 variant 호버색, 그림자·약간 위로 이동 유지 | 호버 배경 토큰, `var(--cs-shadow-soft)` |
| active | 이동·그림자 원복(눌린 느낌) | 동일 토큰, transform/shadow만 변경 |
| disabled | 회색 배경·연한 텍스트·테두리, cursor not-allowed, 클릭 불가 | `var(--cs-secondary-100)`, `var(--cs-secondary-400)`, `var(--cs-secondary-300)` |
| loading | variant 주조 계열 반투명 배경, 스피너·로딩 문구, cursor wait, 클릭 불가 | `var(--mg-primary-500)` + opacity 또는 전용 토큰, 텍스트 `var(--mg-white)` |
| focus-visible | 포커스 링(접근성) | `outline: 2px solid var(--mg-primary-500)` 또는 `var(--color-border-focus)`, `outline-offset: 2px` |

---

## 6. 클래스 네이밍

아토믹 규칙에 맞게 **현재와 동일**하게 유지한다.

- 루트: `.mg-button`
- 변형: `.mg-button--primary`, `.mg-button--secondary`, `.mg-button--success`, `.mg-button--danger`, `.mg-button--warning`, `.mg-button--info`, `.mg-button--outline`, `.mg-button--progress`
- 크기: `.mg-button--small`, `.mg-button--medium`, `.mg-button--large`
- 상태: `.mg-button--disabled`, `.mg-button--loading`
- 레이아웃: `.mg-button--full-width`
- 내부: `.mg-button__content`, `.mg-button__loading`, `.mg-button__spinner`, `.mg-button__text`, `.mg-button__progress-bar`

---

## 7. 참조 문서

| 문서 | 용도 |
|------|------|
| `docs/design-system/ATOMIC_DESIGN_SYSTEM.md` | Atoms 1.1 버튼, Primary/Secondary/Ghost/Danger, Size sm/md/lg, `--cs-button-*` |
| `frontend/src/styles/unified-design-tokens.css` | 사용할 색·간격·radius·폰트·그림자 **토큰 목록** — 여기 있는 `var(--mg-*)`, `var(--cs-*)`만 사용, 하드코딩 금지 |
| `docs/design-system/PENCIL_DESIGN_GUIDE.md` | B0KlA 색상·타이포·버튼(주조 #3D5246, height 40px, radius 10px 등) — 어드민 톤 일치 시 참고 |
| `.cursor/skills/core-solution-design-handoff/SKILL.md` | 산출물 형식(개요, 사용 토큰, 아토믹 계층, 상태·예외, 참조) |

---

## 8. 구현 시 유의사항 (core-coder용)

- **MGButton.js**: 수정하지 않는다. variant / size / disabled / loading / preventDoubleClick / progress 등 props 및 클래스 조합 로직 유지.
- **MGButton.css**: 위 §2~§5의 토큰만 사용하여 스타일을 재작성한다. `#4b745c`, `#3e604c`, `#edf2f7`, `#a0aec0`, `#cbd5e0`, `8px`, `6px 12px`, `14px`, `16px`, `18px`, `rgba(75,116,92,…)` 등 **모든 하드코딩을 제거**하고 해당 용도에 맞는 **CSS 변수**로 치환한다.
- 반응형(예: `@media (max-width: 768px)`) 구간도 동일하게 **토큰**으로만 표현한다 (예: `var(--cs-spacing-xs)`, `var(--cs-text-xs)` 등).
- 테넌트 브랜딩 등으로 `[data-tenant-id] .mg-button--primary` 등 오버레이가 이미 있다면, 해당 규칙도 토큰 기반으로 정리한다.
