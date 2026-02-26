# Avatar 컴포넌트 설계 정합 (아토믹 디자인)

**버전**: 1.0.0  
**최종 업데이트**: 2026-02-26  
**목적**: 공통 Avatar 컴포넌트의 아토믹 디자인 위치, props/변형 규칙, 카드·스케줄 등 사용 규칙을 정리하여 구현·확장 시 정합성을 유지한다.  
**구현 위치**: `frontend/src/components/common/Avatar.js`, `Avatar.css`

---

## 1. 아토믹 디자인에서의 위치와 역할

- **위치**: **Atoms (원자)** — `common/`에 위치한, 더 이상 분해하지 않는 기본 UI 단위.
- **역할 한 줄 정의**: "프로필 이미지 또는 이니셜을 원형으로 표시하는 단일 시각 요소이며, 카드·리스트·스케줄 등 상위 컴포넌트에서 조합해 사용하는 Atom."

---

## 2. Props / variant 규칙

### 2.1 Props 정리

| Prop | 필수/선택 | 타입 | 설명 | 네이밍 일관성 |
|------|-----------|------|------|----------------|
| `profileImageUrl` | 선택 | string | 표시할 프로필 이미지 URL. 없거나 로드 실패 시 이니셜로 폴백. | API/엔티티 필드명과 동일 권장 |
| `displayName` | 선택 | string | 이니셜 추출용 이름. 한글은 공백 기준 성+이름 첫 글자, 영문은 첫 글자. 없으면 `'?'`. | `displayName` 또는 `name` 등 표준 필드명 사용 |
| `className` | 선택 | string | 루트 요소에 추가할 클래스. **반드시** 부모 BEM 블록의 `__avatar`(및 modifier) 전달. | 부모 블록 기준: `mg-{block}__avatar`, modifier는 `--{variant}` |
| `size` | 선택 | number \| string | 루트 요소 width/height (px). 미지정 시 부모/토큰에 위임. | 숫자(px) 또는 CSS 값 문자열 |
| `alt` | 선택 | string | 이미지 대체 텍스트. 기본값 `'프로필 사진'`. | a11y용, 이미지 표시 시에만 적용 |

- **필수 props 없음**: 이미지·이름 모두 없어도 이니셜 `'?'`로 렌더 가능.
- **네이밍**: 컴포넌트 자체는 `profileImageUrl`·`displayName` 유지. 상위에서 API 필드명이 다르면 매핑 후 전달(예: `consultantName` → `displayName`).

### 2.2 Variant (시각적 변형)

- Avatar **자체**는 variant prop을 두지 않음. 시각적 변형(크기·배치)은 **부모가 지정한 `className`**으로만 구분한다.
- 공통 루트 클래스: `mg-v2-avatar` (항상 적용). 내부: `mg-v2-avatar-img`, `mg-v2-avatar-fallback`.
- 크기·컨텍스트별 스타일은 부모 BEM 블록의 `__avatar` + `--large`, `--mobile`, `--schedule-select` 등 modifier로 정의.

---

## 3. 카드·스케줄 선택 등에서의 사용 규칙

**컴포넌트 사용**: 카드(ConsultantCard, ClientCard), 스케줄 선택, 위젯, 리스트 등에서는 **반드시 공통 `Avatar` 컴포넌트를 import하여 사용**한다. 동일한 img+fallback 마크업을 각 화면에서 중복 구현하지 않는다.

**className 규칙**:
- 루트에 **항상** 부모 블록의 아바타 요소 클래스를 넘긴다. 예: `className="mg-consultant-card__avatar"`, `className="mg-client-card__avatar"`.
- 레이아웃/크기 변형은 **같은 블록의 modifier**를 붙인다. 예: `mg-consultant-card__avatar mg-consultant-card__avatar--large`, `mg-consultant-card__avatar--schedule-select`, `mg-client-card__avatar--mobile-simple`. Avatar 컴포넌트는 `className`을 그대로 합쳐서 적용하므로, 각 카드/스케줄 CSS에서 `.mg-consultant-card__avatar--large` 등으로 크기·위치를 정의한다.
- **공통 Atom 클래스**(`mg-v2-avatar`, `mg-v2-avatar-img`, `mg-v2-avatar-fallback`)는 Avatar 내부에서만 사용하며, 상위 컴포넌트에서 직접 이 클래스로 img/fallback을 조합해 마크업하지 않는다. 새 컨텍스트가 필요하면 부모 블록의 `__avatar`(및 `--modifier`)를 정의하고, 그 클래스명을 Avatar의 `className`으로 전달한다.

**데이터 전달**: 상담사/내담자 등 엔티티에서 `profileImageUrl`(또는 동일 의미 필드), `displayName`(또는 `name` 등)을 매핑해 Avatar에 넘긴다. 이니셜 로직은 Avatar 내부 `getAvatarInitial(displayName)`에만 두고, 다른 컴포넌트에서는 `getAvatarInitial`을 재구현하지 않는다. 필요 시 `Avatar`와 함께 `getAvatarInitial`을 export하여 사용(예: 목록 정렬용 이니셜).

---

## 4. CSS 클래스 체계 요약

| 클래스 | 용도 | 정의 위치 |
|--------|------|-----------|
| `mg-v2-avatar` | Atom 루트(원형, overflow, flex 정렬) | `Avatar.css` |
| `mg-v2-avatar-img` | 내부 `<img>` (object-fit: cover, 원형) | `Avatar.css` |
| `mg-v2-avatar-fallback` | 이니셜용 `<span>` | `Avatar.css` |
| `mg-consultant-card__avatar`, `mg-consultant-card__avatar--large` 등 | 상담사 카드 내 아바타 크기·배치 | 카드/디자인 토큰 CSS |
| `mg-client-card__avatar`, `mg-client-card__avatar--mobile` 등 | 내담자 카드 내 아바타 | 카드/디자인 토큰 CSS |

- 컨텍스트별 색·폰트(이니셜)는 **부모 블록**에서 `.mg-consultant-card__avatar .mg-v2-avatar-fallback` 등으로 오버라이드 가능. 기본은 Avatar.css에만 두고, 테마/카드별 차이는 상위에서 한정해 적용한다.

---

## 5. 참조

- **표시 우선순위(이미지 vs 이니셜, 폴백)**: `docs/design-system/v2/AVATAR_IMAGE_OR_INITIAL_SPEC.md`
- **아토믹 디자인 계층·규칙**: `docs/design-system/ATOMIC_DESIGN_SYSTEM.md`, `.cursor/skills/core-solution-atomic-design/SKILL.md`
- **구현**: `frontend/src/components/common/Avatar.js`, `Avatar.css`
- **토큰(크기 참고)**: `frontend/src/styles/unified-design-tokens.css` (예: `--avatar-size-*`)
