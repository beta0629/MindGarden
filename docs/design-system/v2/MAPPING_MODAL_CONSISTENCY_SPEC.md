# 매칭 모달 일관성 스펙 (Mapping Modal Consistency Spec)

**버전**: 1.0.0  
**최종 업데이트**: 2025-03-14  
**기준**: 어드민 대시보드 샘플 / B0KlA 토큰 / mindgarden-design-system.pen  
**참조**: `docs/design-system/PENCIL_DESIGN_GUIDE.md`, `docs/design/BADGE_SELECT_SPEC.md`, `docs/design-system/MAPPING_CREATION_MODAL_DESIGN_SPEC.md`, `docs/design-system/MAPPING_MODALS_DESIGN_SPEC.md`  
**적용 대상**: 매칭 생성 모달 filter-row BadgeSelect, 입금 확인 모달 (MappingDepositModal)

---

## 1. 개요

- **목적**: 매칭 생성 모달(MappingCreationModal)과 입금 확인 모달(MappingDepositModal)의 시각·레이아웃 일관성 확보
- **범위**:
  1. BadgeSelect / filter-row 전용 **작은 배지(small variant)** 스펙
  2. 입금 확인 모달의 summary-bar, form-group 스타일을 매칭 생성 모달과 동일하게 적용

---

## 2. BadgeSelect Small Variant 스펙

### 2.1 배경

- **매칭 생성 모달** filter-row: BadgeSelect 사용. 사용자 요청에 따라 **작은 배지**로 전환
- **적용 위치**: `mg-v2-mapping-creation-modal__filter-row` 내부 BadgeSelect (예: 필터 전체/매칭 없음/활성 등, 정렬 이름순/이메일순 등)

### 2.2 수치 (B0KlA 토큰·unified-design-tokens 기준)

| 속성 | 값 | 토큰/비고 |
|------|-----|-----------|
| **padding** | `6px 10px` | 세로 `0.375rem`, 가로 `0.625rem` (작은 패딩) |
| **font-size** | `12px` | `0.75rem`, 라벨/캡션 수준. `var(--mg-color-text-main)` |
| **min-height** | `28px` | `1.75rem`, filter-row 압축용 |
| **gap** (컨테이너) | `6px` | `0.375rem`. 기본 BadgeSelect `8px`보다 작음 |
| **border-radius** | `8px` | `0.5rem`, 작은 배지용 (기본 10px보다 약간 작게) |
| **line-height** | `1.25` | 12px 텍스트에서 줄 간격 자연스럽게 |

### 2.3 토큰 매핑

- **배경 (기본)**: `var(--mg-color-surface-main)` 또는 `var(--ad-b0kla-card-bg)`
- **테두리**: `1px solid var(--mg-color-border-main)` 또는 `var(--ad-b0kla-border)`
- **텍스트**: `var(--mg-color-text-main)` / `var(--ad-b0kla-title-color)`
- **선택됨 배경**: `var(--mg-color-primary-main)` / `var(--ad-b0kla-green)`
- **선택됨 텍스트**: `var(--mg-color-background-main)` (#FAF9F7)

### 2.4 클래스명 제안

- **컨테이너**: `mg-v2-badge-select mg-v2-badge-select--small`
- **배지 아이템**: `mg-v2-badge-select__item` (기존 유지, --small 스코프에서 오버라이드)
- **모딜파이어**: `mg-v2-badge-select--small` → `.mg-v2-badge-select--small` 내부 `.mg-v2-badge-select__item`에 작은 치수 적용

### 2.5 filter-row 적용 예시 (코더 참고)

```html
<div class="mg-v2-mapping-creation-modal__filter-row">
  <div class="mg-v2-badge-select mg-v2-badge-select--small mg-v2-mapping-creation-modal__select" role="group">
    <!-- 배지들 -->
  </div>
</div>
```

**CSS 오버라이드 (구현 시)**:
```css
.mg-v2-badge-select--small {
  min-height: 28px;
  gap: 6px;
}

.mg-v2-badge-select--small .mg-v2-badge-select__item {
  padding: 6px 10px;
  min-height: 28px;
  font-size: 12px;
  border-radius: 8px;
}
```

### 2.6 반응형

- **모바일 (375px~)**: 터치 영역 44px 권장에 따라, 28px는 필터행 내부 인라인 용도로만 사용. 독립 터치 대상이 많을 경우 모바일에서 `mg-v2-badge-select`(기본 40px) 유지 권장.

---

## 3. 입금 확인 모달 (MappingDepositModal) 스펙

### 3.1 목표

- MappingCreationModal의 **summary-bar**, **form-group**, **input** 스타일을 입금 확인 모달에 그대로 적용
- 두 모달이 **동일한 비주얼 언어**를 사용하도록 통일

### 3.2 마크업·클래스 매핑

#### 3.2.1 모달 래퍼

| 현재 (MappingDepositModal) | 변경 후 | 비고 |
|----------------------------|---------|------|
| `mg-v2-ad-b0kla` (UnifiedModal className) | `mg-v2-ad-b0kla` 유지 | B0KlA 토큰 스코프 |
| - | 바디 래퍼에 `mg-v2-mapping-creation-modal-wrapper` 또는 동일 구조 | MappingCreationModal과 동일 래퍼 구조 권장 |

**참고**: MappingCreationModal은 `mg-v2-mapping-creation-modal-wrapper` > `mg-v2-ad-b0kla mg-v2-mapping-creation-modal` 구조. MappingDepositModal은 UnifiedModal 사용 시 `className="mg-v2-ad-b0kla"`만 전달 가능. **바디 내부**에 `mg-v2-mapping-creation-modal__*` 클래스를 적용하여 시각 일치.

#### 3.2.2 상담사/내담자/패키지/금액 표시 — summary-bar

| 현재 | 변경 후 | 비고 |
|------|---------|------|
| `mg-v2-info-box`, `mg-v2-info-row`, `mg-v2-info-label`, `mg-v2-info-value` | `mg-v2-mapping-creation-modal__summary-bar` | MappingCreationModal 결제 단계와 동일한 요약 바 형태 |

**summary-bar 마크업 예시 (입금 확인용)**:
```html
<div class="mg-v2-mapping-creation-modal__summary-bar">
  <span><User size={16} /> {consultantName}</span>
  <Link2 size={16} />
  <span><UserCircle size={16} /> {clientName}</span>
  <span>|</span>
  <span>{packageName}</span>
  <span class="mg-v2-mapping-creation-modal__summary-pkg">
    {amount}원
  </span>
</div>
```

**summary-bar 스타일 (MappingCreationModal.css 기준)**:
- `display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; padding: 1rem; background: var(--ad-b0kla-blue-bg); border-radius: var(--ad-b0kla-radius-sm); margin-bottom: 1rem;`
- 텍스트: `font-size: 0.875rem; color: var(--ad-b0kla-title-color);`
- 금액 강조: `mg-v2-mapping-creation-modal__summary-pkg` → `margin-left: auto; font-weight: 600;`

#### 3.2.3 입금 참조번호 — form-group + input

| 현재 | 변경 후 | 비고 |
|------|---------|------|
| `mg-v2-form-group`, `mg-v2-label`, `mg-v2-input`, `mg-v2-form-help` | `mg-v2-mapping-creation-modal__form-group`, `mg-v2-mapping-creation-modal__input` | MappingCreationModal form-group 스타일과 동일 |

**form-group 마크업 예시 (입금 확인용)**:
```html
<div class="mg-v2-mapping-creation-modal__form-group">
  <label>입금 참조번호 *</label>
  <input
    type="text"
    value={depositReference}
    onChange={...}
    placeholder="자동 생성됩니다 (수정 가능)"
    class="mg-v2-mapping-creation-modal__input"
    required
  />
  <small class="mg-v2-mapping-creation-modal__form-help">자동으로 입금 참조번호가 생성됩니다. 필요시 수정할 수 있습니다.</small>
</div>
```

**form-group 스타일 (MappingCreationModal.css 기준)**:
- label: `display: block; font-size: 0.8125rem; font-weight: 500; color: var(--ad-b0kla-text-secondary); margin-bottom: 0.25rem;`
- input: `width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--ad-b0kla-border); border-radius: var(--ad-b0kla-radius-sm); background: var(--ad-b0kla-card-bg); font-size: 0.875rem; color: var(--ad-b0kla-title-color);`
- focus: `outline: none; border-color: var(--ad-b0kla-green);`
- help 텍스트: `mg-v2-mapping-creation-modal__form-help` (필요 시 스펙에 별도 정의, 또는 기존 `mg-v2-form-help` 유지 후 색상만 `var(--ad-b0kla-text-secondary)` 적용)

### 3.3 전체 구조 (입금 확인 모달)

```
UnifiedModal (className="mg-v2-ad-b0kla")
  └─ mg-modal__body
       ├─ mg-v2-mapping-creation-modal__summary-bar  (상담사·내담자·패키지·금액)
       └─ mg-v2-mapping-creation-modal__form-group   (입금 참조번호)
            ├─ label
            ├─ input.mg-v2-mapping-creation-modal__input
            └─ small.mg-v2-mapping-creation-modal__form-help (또는 mg-v2-form-help)
```

### 3.4 B0KlA 토큰 (동일 적용)

| 토큰 | 용도 |
|------|------|
| `--ad-b0kla-blue-bg` | summary-bar 배경 |
| `--ad-b0kla-blue` | Link2 아이콘 색상 |
| `--ad-b0kla-title-color` | 텍스트 |
| `--ad-b0kla-text-secondary` | 라벨 |
| `--ad-b0kla-border` | input 테두리 |
| `--ad-b0kla-radius-sm` | corner-radius |
| `--ad-b0kla-green` | input focus, 강조 |

---

## 4. 구현 체크리스트

### 4.1 BadgeSelect Small Variant

- [ ] `mg-v2-badge-select--small` 모딜파이어 클래스 정의
- [ ] padding 6px 10px, font-size 12px, min-height 28px, gap 6px, border-radius 8px 적용
- [ ] MappingCreationModal filter-row BadgeSelect에 `mg-v2-badge-select--small` 적용
- [ ] BadgeSelect 컴포넌트에 `variant="small"` prop 지원 (선택)

### 4.2 MappingDepositModal

- [ ] `mg-v2-info-box` / `mg-v2-info-row` → `mg-v2-mapping-creation-modal__summary-bar` 교체
- [ ] 상담사·내담자·패키지·금액을 summary-bar 형태로 배치 (Link2 아이콘 포함)
- [ ] `mg-v2-form-group` → `mg-v2-mapping-creation-modal__form-group` 교체
- [ ] `mg-v2-input` → `mg-v2-mapping-creation-modal__input` 교체
- [ ] MappingCreationModal.css 스타일이 MappingDepositModal에 적용되도록 클래스 일치 (또는 공통 모달 스타일로 분리)

---

## 5. 참조 파일

| 파일 | 용도 |
|------|------|
| `frontend/src/components/admin/MappingCreationModal.js` | summary-bar, form-group, filter-row 마크업 참조 |
| `frontend/src/components/admin/MappingCreationModal.css` | summary-bar, form-group, input 스타일 참조 |
| `frontend/src/components/admin/mapping/MappingDepositModal.js` | 입금 확인 모달 구현 대상 |
| `frontend/src/components/common/BadgeSelect.js` | BadgeSelect 컴포넌트 |
| `frontend/src/components/common/BadgeSelect.css` | BadgeSelect 스타일 (--small 오버라이드 추가) |
| `frontend/src/styles/dashboard-tokens-extension.css` | B0KlA 토큰 정의 |
| `docs/design-system/PENCIL_DESIGN_GUIDE.md` | 디자이너 숙지 체크리스트 |

---

**문서 끝.**
