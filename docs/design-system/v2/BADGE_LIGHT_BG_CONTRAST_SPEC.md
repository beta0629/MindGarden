# 배지 밝은 배경 대비 스펙

**작성일**: 2025-03-14  
**목적**: StatusBadge, RemainingSessionsBadge가 밝은 배경(#FAF9F7, #F2EDE8)에서 가독성·시인성을 확보하도록 어두운 색 위주로 CSS 변수만 적용  
**참조**: `COMMON_UI_IMPLEMENTATION_SPEC.md`, `unified-design-tokens.css`, `dashboard-tokens-extension.css`, `PENCIL_DESIGN_GUIDE.md`, B0KlA·어드민 대시보드 샘플

---

## 1. 배경 및 요구사항

### 1.1 현재 상태

| 배지 | 배경 | 텍스트 |
|------|------|--------|
| StatusBadge (success) | var(--mg-success-100) | var(--mg-success-700) |
| StatusBadge (warning) | var(--mg-warning-100) | var(--mg-warning-700) |
| StatusBadge (neutral) | var(--mg-gray-100) | var(--mg-gray-600) |
| StatusBadge (danger) | var(--mg-error-100) | var(--mg-error-700) |
| StatusBadge (info) | var(--mg-info-100) | var(--mg-info-700) |
| RemainingSessionsBadge | var(--mg-primary-100) | var(--mg-primary-700) |

### 1.2 문제점

- `*-100` 배경이 밝은 페이지 배경(#FAF9F7, #F2EDE8)과 유사하여 배지가 눈에 띄지 않음
- `*-600`, `*-700` 텍스트가 밝은 배지 배경 위에서 대비 부족 가능

### 1.3 목표

- 밝은 배경에서 **배지가 잘 보이도록** 배경을 `*-200` 수준으로 조정
- 텍스트를 **어두운 색 위주** `*-800`으로 조정해 가독성 확보
- 기존 `--mg-*`, `--cs-*` 토큰만 사용. `unified-design-tokens.css`는 자동생성이라 직접 수정하지 않음
- 필요 시 `dashboard-tokens-extension.css`에 시맨틱 변수 추가

---

## 2. StatusBadge — variant별 토큰 매핑

### 2.1 적용할 CSS 변수 (밝은 배경 대비용)

| variant | background-color | color |
|---------|------------------|-------|
| success | var(--mg-badge-status-success-bg) | var(--mg-badge-status-success-text) |
| warning | var(--mg-badge-status-warning-bg) | var(--mg-badge-status-warning-text) |
| neutral | var(--mg-badge-status-neutral-bg) | var(--mg-badge-status-neutral-text) |
| danger | var(--mg-badge-status-danger-bg) | var(--mg-badge-status-danger-text) |
| info | var(--mg-badge-status-info-bg) | var(--mg-badge-status-info-text) |

### 2.2 시맨틱 변수 정의 (dashboard-tokens-extension.css에 추가)

| 변수명 | 값 | 용도 |
|--------|-----|------|
| --mg-badge-status-success-bg | var(--mg-success-200) | success 배지 배경 |
| --mg-badge-status-success-text | var(--mg-success-800) | success 배지 텍스트 |
| --mg-badge-status-warning-bg | var(--mg-warning-200) | warning 배지 배경 |
| --mg-badge-status-warning-text | var(--mg-warning-800) | warning 배지 텍스트 |
| --mg-badge-status-neutral-bg | var(--mg-gray-200) | neutral 배지 배경 |
| --mg-badge-status-neutral-text | var(--mg-gray-800) | neutral 배지 텍스트 |
| --mg-badge-status-danger-bg | var(--mg-error-200) | danger 배지 배경 |
| --mg-badge-status-danger-text | var(--mg-error-800) | danger 배지 텍스트 |
| --mg-badge-status-info-bg | var(--mg-info-200) | info 배지 배경 |
| --mg-badge-status-info-text | var(--mg-info-800) | info 배지 텍스트 |

**선택**: 시맨틱 변수 없이 기존 토큰을 직접 사용할 경우, 아래 매핑을 StatusBadge.css에 직접 적용해도 됨.

| variant | background-color (직접) | color (직접) |
|---------|-------------------------|--------------|
| success | var(--mg-success-200) | var(--mg-success-800) |
| warning | var(--mg-warning-200) | var(--mg-warning-800) |
| neutral | var(--mg-gray-200) | var(--mg-gray-800) |
| danger | var(--mg-error-200) | var(--mg-error-800) |
| info | var(--mg-info-200) | var(--mg-info-800) |

---

## 3. RemainingSessionsBadge — 토큰 매핑

### 3.1 적용할 CSS 변수

| 속성 | 값 |
|------|-----|
| background-color | var(--mg-badge-count-bg) |
| color | var(--mg-badge-count-text) |

### 3.2 시맨틱 변수 정의 (dashboard-tokens-extension.css에 추가)

| 변수명 | 값 | 용도 |
|--------|-----|------|
| --mg-badge-count-bg | var(--mg-primary-200) | 세션 배지 배경 |
| --mg-badge-count-text | var(--mg-primary-800) | 세션 배지 텍스트 |

**선접 사용 예**:  
- background-color: var(--mg-primary-200)  
- color: var(--mg-primary-800)

---

## 4. dashboard-tokens-extension.css 추가 블록

코더가 `frontend/src/styles/dashboard-tokens-extension.css`의 `:root` 블록 하단에 아래 블록을 추가한다.

```css
  /* ===== 배지 밝은 배경 대비 (BADGE_LIGHT_BG_CONTRAST_SPEC) ===== */
  /* StatusBadge, RemainingSessionsBadge — *-200 bg + *-800 text */

  /* StatusBadge - 밝은 배경 대비용 */
  --mg-badge-status-success-bg: var(--mg-success-200);
  --mg-badge-status-success-text: var(--mg-success-800);
  --mg-badge-status-warning-bg: var(--mg-warning-200);
  --mg-badge-status-warning-text: var(--mg-warning-800);
  --mg-badge-status-neutral-bg: var(--mg-gray-200);
  --mg-badge-status-neutral-text: var(--mg-gray-800);
  --mg-badge-status-danger-bg: var(--mg-error-200);
  --mg-badge-status-danger-text: var(--mg-error-800);
  --mg-badge-status-info-bg: var(--mg-info-200);
  --mg-badge-status-info-text: var(--mg-info-800);

  /* RemainingSessionsBadge - 밝은 배경 대비용 */
  --mg-badge-count-bg: var(--mg-primary-200);
  --mg-badge-count-text: var(--mg-primary-800);
```

---

## 5. CSS 적용 변경 사항 (코더용)

### 5.1 StatusBadge.css

기존:

```css
.mg-v2-badge--success {
  background-color: var(--mg-success-100);
  color: var(--mg-success-700);
}
/* ... 동일 패턴 ... */
```

변경:

```css
.mg-v2-badge--success {
  background-color: var(--mg-badge-status-success-bg);
  color: var(--mg-badge-status-success-text);
}
.mg-v2-badge--warning {
  background-color: var(--mg-badge-status-warning-bg);
  color: var(--mg-badge-status-warning-text);
}
.mg-v2-badge--neutral {
  background-color: var(--mg-badge-status-neutral-bg);
  color: var(--mg-badge-status-neutral-text);
}
.mg-v2-badge--danger {
  background-color: var(--mg-badge-status-danger-bg);
  color: var(--mg-badge-status-danger-text);
}
.mg-v2-badge--info {
  background-color: var(--mg-badge-status-info-bg);
  color: var(--mg-badge-status-info-text);
}
```

**대안 (시맨틱 변수 없이 직접 토큰 사용 시)**:

```css
.mg-v2-badge--success {
  background-color: var(--mg-success-200);
  color: var(--mg-success-800);
}
.mg-v2-badge--warning {
  background-color: var(--mg-warning-200);
  color: var(--mg-warning-800);
}
.mg-v2-badge--neutral {
  background-color: var(--mg-gray-200);
  color: var(--mg-gray-800);
}
.mg-v2-badge--danger {
  background-color: var(--mg-error-200);
  color: var(--mg-error-800);
}
.mg-v2-badge--info {
  background-color: var(--mg-info-200);
  color: var(--mg-info-800);
}
```

### 5.2 RemainingSessionsBadge.css

기존:

```css
.mg-v2-count-badge {
  /* ... */
  background-color: var(--mg-primary-100);
  color: var(--mg-primary-700);
}
```

변경:

```css
.mg-v2-count-badge {
  /* ... */
  background-color: var(--mg-badge-count-bg);
  color: var(--mg-badge-count-text);
}
```

**직접 토큰 사용 시**:

```css
background-color: var(--mg-primary-200);
color: var(--mg-primary-800);
```

---

## 6. 토큰 값 참고 (unified-design-tokens → cs-*)

| 토큰 | cs-* 실제값 (참고) |
|------|--------------------|
| --mg-success-200 | #a7f3d0 |
| --mg-success-800 | #065f46 |
| --mg-warning-200 | #fde68a |
| --mg-warning-800 | #92400e |
| --mg-gray-200 | #e5e7eb |
| --mg-gray-800 | #1f2937 |
| --mg-error-200 | #fecaca |
| --mg-error-800 | #991b1b |
| --mg-info-200 | #bfdbfe |
| --mg-info-800 | #004499 |
| --mg-primary-200 | #bfdbfe |
| --mg-primary-800 | #1e40af |

*실제 값은 unified-design-tokens.css의 --mg-* → --cs-* 매핑에 따름. B0KlA primary 등은 CI/BI에 따라 다를 수 있음.*

---

## 7. 구현 체크리스트

- [ ] `dashboard-tokens-extension.css`에 배지 시맨틱 변수 블록 추가
- [ ] `StatusBadge.css` — 5개 variant의 background/color를 시맨틱 변수(또는 직접 토큰)로 변경
- [ ] `RemainingSessionsBadge.css` — background/color를 시맨틱 변수(또는 직접 토큰)로 변경
- [ ] 통합 매칭 스케줄·카드 등 밝은 배경 위 배지 노출 구간에서 시인성 확인

---

**문서 버전**: 1.0
