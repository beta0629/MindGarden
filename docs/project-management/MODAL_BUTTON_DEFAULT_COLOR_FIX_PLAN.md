# 모달 푸터 버튼 기본 색상 적용 기획서

**목표**: 모달 내 primary/CTA 버튼이 기본 상태에서도 B0KlA 토큰(`--ad-b0kla-green`) 적용으로 눈에 띄게 표시  
**문제**: 기본 배경/테두리 없음, 호버 시에만 색상 적용 → 사용성이 저하  
**기준**: B0KlA·unified-design-tokens, DEPOSIT_MODAL_AND_BUTTON_SPEC.md

---

## 1. 조사 결과 요약

### 1.1 현재 구조

| 항목 | 내용 |
|------|------|
| **예시 DOM** | `.mg-modal__actions`, `.mg-v2-mapping-creation-modal__actions` ("다음" 버튼) |
| **UnifiedModal** | `className="mg-v2-ad-b0kla"` → `.mg-modal.mg-v2-ad-b0kla` |
| **Button 컴포넌트** | `variant="primary"` → `mg-button mg-button--primary` |
| **mg-v2 직접 사용** | `mg-v2-button mg-v2-button-primary` (클래스 직접 지정 시) |

### 1.2 클래스 불일치로 인한 미적용

| CSS 파일 | 타겟 클래스 | 실제 버튼 출력 | 매칭 여부 |
|----------|-------------|----------------|-----------|
| MappingCreationModal.css | `.mg-modal__actions .mg-v2-button-primary` | `mg-button--primary` | ❌ 미매칭 |
| AdminDashboardB0KlA.css | `.mg-v2-ad-b0kla .mg-v2-button-primary`, `.mg-v2-button--primary` | `mg-button--primary` | ❌ 미매칭 (`mg-v2-` ≠ `mg-`) |

- **원인**: MappingCreationModal은 `<Button variant="primary">`를 사용 → `mg-button--primary` 출력. B0KlA 오버라이드는 `mg-v2-button-primary`만 대상으로 함.

### 1.3 관련 파일·셀렉터 위치

| 파일 | 셀렉터 | 역할 |
|------|--------|------|
| `frontend/src/components/admin/MappingCreationModal.css` | `.mg-modal.mg-v2-ad-b0kla .mg-modal__actions .mg-v2-button-primary` | B0KlA 모달 푸터 primary |
| `frontend/src/components/admin/MappingCreationModal.css` | `.mg-modal.mg-v2-ad-b0kla .mg-modal__actions .mg-v2-button-outline` | B0KlA 모달 푸터 outline |
| `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css` | `.mg-v2-ad-b0kla .mg-v2-button-primary`, `.mg-v2-ad-b0kla .mg-v2-button--primary` | B0KlA 버튼 전반 |
| `frontend/src/components/schedule/ScheduleB0KlA.css` | `.mg-modal.mg-v2-ad-b0kla .mg-modal__actions` | 모달 푸터 레이아웃만 |
| `frontend/src/styles/06-components/_unified-modals.css` | `.mg-modal__actions` | 레이아웃(gap, padding) |
| `frontend/src/styles/unified-design-tokens.css` | `.mg-button--primary`, `.mg-v2-button-primary` | 기본 스타일 |

### 1.4 호버 전용 패턴 조사

- `.mg-button--primary`: 기본에 `background: var(--color-primary)` 있음. B0KlA 컨텍스트에서 `--color-primary` 미정의/투명 가능성.
- `.mg-button--outline`: 기본 `background: transparent`, 호버 시 `background: var(--color-primary)` — outline 특성상 의도된 동작.
- **핵심**: B0KlA 모달 푸터에서 Button 컴포넌트(`mg-button--primary`)에 대한 B0KlA 오버라이드가 없어, `--color-primary`가 B0KlA 그린으로 보장되지 않을 수 있음.

---

## 2. B0KlA·unified-design-tokens 기준

| 용도 | 기본 상태 | 호버 | 토큰 |
|------|-----------|------|------|
| **primary/CTA** | 배경 `var(--ad-b0kla-green)`, 텍스트 #fff | opacity 0.9 또는 약간 darker | `--ad-b0kla-green` |
| **outline(이전)** | 배경 transparent, 테두리·텍스트 `--ad-b0kla-green` | 배경 `--ad-b0kla-green-bg` | `--ad-b0kla-green` |
| **secondary** | 배경 transparent, 테두리 `--ad-b0kla-border` | 배경·테두리 유지 | `--ad-b0kla-border` |

- **DEPOSIT_MODAL_AND_BUTTON_SPEC.md** §2.2: 확인(주조) 버튼 = 배경 `var(--ad-b0kla-green)`, 텍스트 #fff.

---

## 3. 수정 대상 파일·클래스

| # | 파일 | 수정 내용 |
|---|------|-----------|
| 1 | `MappingCreationModal.css` | `.mg-modal__actions .mg-v2-button-primary`에 `.mg-button--primary` 셀렉터 추가. `.mg-v2-button-outline`에 `.mg-button--outline` 추가. |
| 2 | `AdminDashboardB0KlA.css` | `.mg-v2-ad-b0kla .mg-v2-button-primary` 규칙에 `.mg-v2-ad-b0kla .mg-button--primary` 추가. |
| 3 | `ScheduleB0KlA.css` | `.mg-modal.mg-v2-ad-b0kla .mg-modal__actions` 내 `.mg-button--primary`, `.mg-button--outline` B0KlA 스타일 추가(해당 영역 버튼이 Button 컴포넌트 사용 시). |

- **1번이 핵심**: MappingCreationModal 푸터 "다음" 버튼이 `mg-button--primary`이므로, 해당 셀렉터에 B0KlA primary 기본 스타일 적용.

---

## 4. Phase 목록 및 실행 분배

| Phase | 담당 | 목표 | 전달 태스크 |
|-------|------|------|-------------|
| **Phase 1** | **core-coder** | 모달 푸터 버튼 기본 색상 적용 | 아래 [Phase 1 실행 태스크] |

---

## 5. Phase 1 실행 태스크 (core-coder 호출용)

**목표**: B0KlA 모달 푸터의 primary/CTA 버튼이 기본 상태에서도 `var(--ad-b0kla-green)` 배경이 보이도록 수정.

**참조**: `docs/design-system/v2/DEPOSIT_MODAL_AND_BUTTON_SPEC.md`, `frontend/src/styles/dashboard-tokens-extension.css` (--ad-b0kla-green)

**수정 사항**:

1. **`frontend/src/components/admin/MappingCreationModal.css`**
   - L36–43: `.mg-modal.mg-v2-ad-b0kla .mg-modal__actions .mg-v2-button-primary` 규칙에 `.mg-button--primary`를 추가하여 Button 컴포넌트 출력과 매칭되게 함.
   - L45–53: `.mg-v2-button-outline` 규칙에 `.mg-button--outline` 추가.
   - 예시: `.mg-modal.mg-v2-ad-b0kla .mg-modal__actions .mg-v2-button-primary, .mg-modal.mg-v2-ad-b0kla .mg-modal__actions .mg-button--primary { ... }`

2. **`frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css`**
   - L13–18: `.mg-v2-ad-b0kla .mg-v2-button-primary, .mg-v2-ad-b0kla .mg-v2-button--primary` 규칙에 `.mg-v2-ad-b0kla .mg-button--primary` 추가.
   - 모달을 포함한 B0KlA 영역 전반에서 `mg-button--primary`(Button 컴포넌트 출력)에 동일 스타일 적용.

**적용 스타일**:
- primary 기본: `background: var(--ad-b0kla-green); color: #fff; border: none;`
- primary 호버: `opacity: 0.9` 또는 기존 유지
- outline 기본: `background: transparent; color: var(--ad-b0kla-green); border: 2px solid var(--ad-b0kla-green);`

**완료 기준**:
- [ ] MappingCreationModal "다음" 버튼 기본 상태에서 녹색 배경 노출
- [ ] "이전"(outline) 버튼 기본 상태에서 녹색 테두리·텍스트 노출
- [ ] 기존 mg-v2-button-primary 사용처 스타일 유지

---

## 6. 실행 요청문

**core-coder 서브에이전트를 호출**하고, 아래 프롬프트를 전달하세요.

```
B0KlA 모달 푸터 버튼 기본 색상 적용:
- docs/project-management/MODAL_BUTTON_DEFAULT_COLOR_FIX_PLAN.md §5 참조
- MappingCreationModal.css: .mg-modal__actions 내 .mg-v2-button-primary 규칙에 .mg-button--primary 추가, .mg-v2-button-outline에 .mg-button--outline 추가
- AdminDashboardB0KlA.css: .mg-v2-button-primary 규칙에 .mg-button--primary 추가
- primary 기본: background var(--ad-b0kla-green), color #fff
- /core-solution-frontend, /core-solution-standardization 적용
```

---

## 7. 참조 문서

| 문서 | 용도 |
|------|------|
| `docs/design-system/v2/DEPOSIT_MODAL_AND_BUTTON_SPEC.md` | B0KlA 버튼 표준 |
| `docs/design-system/MAPPING_MANAGEMENT_DESIGN_SPEC.md` | B0KlA 토큰 |
| `.cursor/skills/core-solution-unified-modal/SKILL.md` | 모달 표준 |
| `frontend/src/styles/dashboard-tokens-extension.css` | --ad-b0kla-green 정의 |
