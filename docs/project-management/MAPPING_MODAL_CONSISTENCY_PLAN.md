# 매칭 모달 일관성 기획서

**대상**: 매칭 생성 모달(MappingCreationModal) / 입금 확인 모달(MappingDepositModal)  
**목표**: (1) filter-row 배지 소형화, (2) 입금 확인 모달을 매칭 생성 모달과 시각·레이아웃 동일화  
**문서**: 1페이지 기획 요약 (코드 수정 없음)

---

## 1. 필터 배지 소형화 방안

**BadgeSelect에 `size="small"` prop 추가**를 권장한다. 현재 BadgeSelect는 `padding: 10px 16px`, `min-height: 40px`로 고정되어 있으며, 매칭 생성 모달의 filter-row 등 좁은 영역에서는 배지가 과도하게 커 보인다. `size="small"`을 추가하면 `padding`, `min-height`, `font-size`를 축소한 `.mg-v2-badge-select--small` 변형을 BadgeSelect.css에 정의하고, 컴포넌트가 이 prop에 따라 해당 클래스를 붙이도록 한다. MappingCreationModal 전용 작은 배지 스타일 클래스(`mg-v2-mapping-creation-modal__badge-select--small`)를 filter-row 내부에서만 적용하는 방식도 가능하지만, BadgeSelect는 UserManagement, ErpReportModal, ClientModal 등 여러 화면에서 재사용되므로 **컴포넌트 수준의 size prop**이 유지보수·일관성 측면에서 유리하다.

---

## 2. 입금 확인 모달 일관화 (MappingDepositModal → MappingCreationModal 스타일 적용)

매칭 생성 모달과 동일한 시각·레이아웃을 적용한다. UnifiedModal 사용은 유지하며, 내부 마크업과 클래스만 정리한다.

| 구분 | 현재 (MappingDepositModal) | 적용 후 (매칭 생성 모달과 동일) |
|------|---------------------------|--------------------------------|
| **모달 wrapper** | `className="mg-v2-ad-b0kla"`만 적용, `mg-v2-modal-body` 직계 내부 | `mg-v2-mapping-creation-modal-wrapper` > `mg-v2-ad-b0kla mg-v2-mapping-creation-modal` 래핑. UnifiedModal `className="mg-v2-ad-b0kla"` 유지. MappingCreationModal.css가 `.mg-modal.mg-v2-ad-b0kla` 스타일을 적용하므로 동일한 모달 전역 스타일 공유 |
| **정보 영역** | `mg-v2-ad-b0kla__card mg-v2-info-box` + `mg-v2-info-row` (label/value) | `mg-v2-mapping-creation-modal__step-content` 내부에 `mg-v2-mapping-creation-modal__summary-bar` 사용. 상담사·내담자·패키지·금액을 `summary-bar` 내부 span으로 표시. 금액은 `mg-v2-mapping-creation-modal__summary-pkg` 등으로 강조 |
| **폼 그룹** | `mg-v2-form-group` + `mg-v2-label` + `mg-v2-input` | `mg-v2-mapping-creation-modal__form` > `mg-v2-mapping-creation-modal__form-group` 구조. `label`은 `mg-v2-mapping-creation-modal__form-group label`, 입력은 `mg-v2-mapping-creation-modal__input`. 도움말은 기존 `mg-v2-form-help` 유지 또는 매칭 모달 규칙에 맞게 정리 |

---

## 3. 적용 시 참조 파일

| 항목 | 참조 파일 |
|------|----------|
| BadgeSelect 구조·스타일 | `frontend/src/components/common/BadgeSelect.js`, `BadgeSelect.css` |
| 매칭 생성 모달 구조 | `MappingCreationModal.js` (wrapper, step-content, summary-bar, form-group, input) |
| 매칭 생성 모달 스타일 | `MappingCreationModal.css` (`.mg-v2-mapping-creation-modal__summary-bar`, `__form-group`, `__input`) |
| 입금 확인 모달 현재 | `MappingDepositModal.js` |

---

## 4. 리스크·제약

- BadgeSelect `size` prop 추가 시, 기존 사용처(UserManagement, ErpReportModal 등)는 `size` 미지정으로 기본 크기 유지.
- MappingDepositModal에 `MappingCreationModal.css` import가 필요할 수 있음. 또는 공통 B0KlA 모달 스타일을 별도 모듈로 분리해 두 모달에서 import하는 방안 검토.
