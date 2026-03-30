# 입금 확인 모달 및 B0KlA 버튼 표준 스펙

**버전**: 1.0.0  
**작성일**: 2025-03-14  
**기준**: MAPPING_MODALS_DESIGN_SPEC, PENCIL_DESIGN_GUIDE, MODAL_AND_BUTTON_CONSISTENCY_PLAN  
**적용 대상**: MappingDepositModal, B0KlA·어드민 모달 푸터 버튼 전반

---

## 1. 입금 확인 모달 (MappingDepositModal) 스펙

### 1.1 콘텐츠 특성

- **구성**: 요약바(상담사·내담자·패키지·금액) + 입력 1개(입금 참조번호)
- **목표**: 콘텐츠에 맞는 compact 높이, 100vh 초과·비정상 높이(예: 1156px) 방지

### 1.2 UnifiedModal size 권장

| 항목 | 권장값 | 비고 |
|------|--------|------|
| **size** | `"medium"` | `"auto"` 사용 시 `max-height: 90vh`로 뷰포트 크기에 따라 비정상 높이(1284px 기준 1156px 등) 발생. 단순 폼에 적합한 고정 크기 사용 권장 |
| **대안** | `"auto"` + body max-height 오버라이드 | compact용 별도 수정 시에 한함 |

**core-coder 적용**: `size="medium"` 로 변경

### 1.3 바디 max-height

| 대상 | 권장 수치 | 목적 |
|------|-----------|------|
| `.mg-modal.mg-v2-ad-b0kla.mg-modal--medium .mg-modal__body` | `max-height: min(55vh, 420px)` | 입금 확인 모달 등 compact 폼용. 100vh 초과 방지, 콘텐츠 양에 맞는 높이 제한 |
| compact 전용 (선택) | `data-compact="true"` 또는 `.mg-modal-deposit` | MappingDepositModal만 별도 적용 시 |

**참고**: MappingCreationModal.css의 `.mg-modal__body`는 `min(70vh, 600px)` 사용. 입금 확인은 단순 폼이므로 `420px` 이하 권장.

### 1.4 B0KlA 모달 푸터 (.mg-modal__actions) 배치

| 항목 | 값 |
|------|-----|
| **순서** | 취소(보조) → 확인(주조) |
| **패딩** | `var(--mg-spacing-lg)` ~ `var(--mg-spacing-xl)` (16px~24px) |
| **gap** | `var(--mg-spacing-md)` (12px) |
| **정렬** | `justify-content: flex-end` |

---

## 2. B0KlA·어드민 모달 버튼 표준

### 2.1 취소(보조) 버튼

| 항목 | 권장 |
|------|------|
| **클래스** | `mg-v2-button mg-v2-button-secondary` |
| **스타일** | 배경 투명, 테두리 `var(--ad-b0kla-border)`, 텍스트 `var(--ad-b0kla-text-secondary)` |
| **용도** | 모달 닫기, 취소, 되돌리기 |

**비고**: `mg-v2-button-outline`은 B0KlA에서 주조색(녹색) 테두리로 스타일됨. 일반 취소용으로는 **secondary** 권장.

### 2.2 확인(주조) 버튼

| 항목 | 권장 |
|------|------|
| **클래스** | `mg-v2-button mg-v2-button-primary` |
| **스타일** | 배경 `var(--ad-b0kla-green)`, 텍스트 #fff |
| **용도** | 저장, 확인, 입금 확인, 승인 등 주 액션 |

### 2.3 위험(삭제·환불) 버튼

| 항목 | 권장 |
|------|------|
| **클래스** | `mg-v2-button mg-v2-button-danger` |

### 2.4 권장 사용 예시 (마크업)

```html
<footer class="mg-modal__actions">
  <button type="button" class="mg-v2-button mg-v2-button-secondary">취소</button>
  <button type="button" class="mg-v2-button mg-v2-button-primary">확인</button>
</footer>
```

---

## 3. 아토믹 Button.js와 mg-v2-button 매핑

### 3.1 현재 구조

| 시스템 | 베이스 클래스 | variant 클래스 | 적용 영역 |
|--------|---------------|----------------|-----------|
| **Button.js** | `mg-button` | `mg-button--${variant}` (primary, secondary, outline 등) | 전역 Atoms |
| **mg-v2-button** | `mg-v2-button` | `mg-v2-button-primary`, `mg-v2-button-secondary`, `mg-v2-button-outline` | B0KlA·어드민 |

### 3.2 B0KlA 모달 권장 사용

- **권장**: B0KlA·어드민 모달 푸터에서는 **클래스 직접 지정** (`mg-v2-button mg-v2-button-secondary`, `mg-v2-button mg-v2-button-primary`)
- **이유**: Button.js는 `mg-button--*` 출력. B0KlA 스타일은 `mg-v2-button-*` 기준. 별도 매핑/확장 전까지는 직접 클래스 사용이 확실함.
- **향후**: Button.js에 `theme="b0kla"` 등 옵션 추가 시 `variant="secondary"` → `mg-v2-button mg-v2-button-secondary` 출력 가능하도록 확장 검토

### 3.3 variant 매핑 참고표 (B0KlA용)

| 용도 | Button.js variant (참고) | mg-v2 클래스 (권장) |
|------|--------------------------|---------------------|
| 취소 | secondary / outline | `mg-v2-button-secondary` |
| 확인 | primary | `mg-v2-button-primary` |
| 삭제·환불 | danger | `mg-v2-button-danger` |

---

## 4. 구현 체크리스트 (core-coder용)

### 입금 확인 모달

- [ ] UnifiedModal `size="medium"` 로 변경
- [ ] `.mg-modal.mg-v2-ad-b0kla .mg-modal__body` compact용: `max-height: min(55vh, 420px)` 또는 MappingDepositModal 전용 클래스로 적용
- [ ] 취소 버튼: `mg-v2-button mg-v2-button-secondary` (기존 `mg-v2-button-outline` → secondary 교체)
- [ ] 확인 버튼: `mg-v2-button mg-v2-button-primary` 유지
- [ ] 버튼 순서: 취소 왼쪽, 확인 오른쪽
- [ ] `className="mg-v2-ad-b0kla"` 유지

### B0KlA 모달 푸터 공통

- [ ] 푸터 `.mg-modal__actions`: padding 16–24px, gap 12px, `justify-content: flex-end`
- [ ] 취소 → 확인 순서
- [ ] 보조: `mg-v2-button-secondary`, 주조: `mg-v2-button-primary`

---

## 5. 참조 파일

| 구분 | 경로 |
|------|------|
| 입금 확인 모달 | `frontend/src/components/admin/mapping/MappingDepositModal.js` |
| 모달 공통 | `frontend/src/components/common/modals/UnifiedModal.js` |
| B0KlA 모달·버튼 | `frontend/src/components/admin/MappingCreationModal.css`, `AdminDashboardB0KlA.css` |
| Unified 모달 | `frontend/src/styles/06-components/_unified-modals.css` |
| 디자인 스펙 | `docs/design-system/MAPPING_MODALS_DESIGN_SPEC.md` |
| 기획 | `docs/project-management/MODAL_AND_BUTTON_CONSISTENCY_PLAN.md` |
