# 매칭 생성 모달 summary-bar UI 개선 태스크

> DOM: `mg-v2-mapping-creation-modal__summary-bar`  
> 목표: 상담사·내담자·상품·금액 정보를 구분하여 정돈된 UI로 개선

## 1. 현황 분석

### 1.1 사용처
- **MappingCreationModal.js** (4단계 결제 정보) — line 597-605
- **MappingDepositModal.js** (입금 확인 모달) — line 129-137

### 1.2 현재 구조 (MappingCreationModal)
```jsx
<div className="mg-v2-mapping-creation-modal__summary-bar">
  <span><User size={16} /> {selectedConsultant?.name}</span>
  <Link2 size={16} />
  <span><UserCircle size={16} /> {selectedClient?.name}</span>
  <span className="mg-v2-mapping-creation-modal__summary-pkg">
    {paymentInfo.packageName} · {paymentInfo.totalSessions}회
  </span>
</div>
```

### 1.3 현재 표시
- 한 줄에 "김선희 이재학 단회기 90,000원" 식으로 모든 정보가 붙어 있어 구분이 없음
- 금액은 MappingCreationModal 4단계 summary-bar에는 **미표시** (폼의 readonly에만 표시)
- MappingDepositModal에는 packageName, packagePrice 표시

### 1.4 현재 CSS (MappingCreationModal.css)
- `display: flex`, `gap: 0.5rem`, `flex-wrap`
- `__summary-pkg`만 `margin-left: auto`로 오른쪽 정렬

---

## 2. 개선 방안

### 2.1 구조 제안 (BEM 기반)
정보를 **세그먼트**로 구분하여 시각적 분리:

| 세그먼트 | 표시 내용 | 레이블 | 예시 |
|----------|----------|--------|------|
| A | 상담사 | (아이콘만) | `김선희` |
| B | 구분자 | Link2 | `↔` |
| C | 내담자 | (아이콘만) | `이재학` |
| D | 상품 | (구분선 뒤) | `단회기 · 1회` |
| E | 금액 | (강조) | `90,000원` |

### 2.2 시각적 구분 방법
1. **세그먼트 래퍼**: 각 그룹을 `__summary-segment`로 감싸기
2. **구분선**: 상담사↔내담자와 상품·금액 사이에 `|` 또는 `·` 구분선
3. **금액 강조**: `__summary-amount` 클래스로 font-weight, 색상 강조
4. **라벨(선택)**: `상담사:`, `내담자:` 등 — 기존 디자인 스펙(MAPPING_CREATION_MODAL_DESIGN_SPEC)에는 라벨 있음. 공간·가독성 고려해 아이콘+이름만으로도 충분할 수 있음

### 2.3 디자인 스펙 참고 (docs/design-system/MAPPING_CREATION_MODAL_DESIGN_SPEC.md)
```html
<span>상담사: 김상담</span>
<span><Link2 /></span>
<span>내담자: 이내담</span>
<span>|</span>
<span>10회기 · 500,000원</span>
```

### 2.4 권장 마크업
```html
<div class="mg-v2-mapping-creation-modal__summary-bar">
  <span class="mg-v2-mapping-creation-modal__summary-segment mg-v2-mapping-creation-modal__summary-segment--person">
    <User size={16} /> 김선희
  </span>
  <span class="mg-v2-mapping-creation-modal__summary-divider" aria-hidden="true">
    <Link2 size={16} />
  </span>
  <span class="mg-v2-mapping-creation-modal__summary-segment mg-v2-mapping-creation-modal__summary-segment--person">
    <UserCircle size={16} /> 이재학
  </span>
  <span class="mg-v2-mapping-creation-modal__summary-separator">|</span>
  <span class="mg-v2-mapping-creation-modal__summary-segment mg-v2-mapping-creation-modal__summary-segment--product">
    단회기 · 1회
  </span>
  <span class="mg-v2-mapping-creation-modal__summary-segment mg-v2-mapping-creation-modal__summary-segment--amount">
    90,000원
  </span>
</div>
```

---

## 3. 구현 요구사항

### 3.1 MappingCreationModal.js (4단계)
- `paymentInfo.packagePrice`를 summary-bar에 **추가 표시**
- 세그먼트 구조 적용 (상담사 | Link2 | 내담자 | 구분선 | 패키지·회기 | 금액)
- BEM 클래스: `__summary-segment`, `__summary-segment--person`, `__summary-segment--product`, `__summary-segment--amount`, `__summary-separator`, `__summary-divider`

### 3.2 MappingDepositModal.js
- 동일한 summary-bar 구조·클래스 적용
- 데이터: consultantName, clientName, packageName, packagePrice(또는 paymentAmount)

### 3.3 MappingCreationModal.css
- `__summary-segment`: 세그먼트 단위 간격, 필요 시 `gap` 조정
- `__summary-separator`: `|` 색상 `var(--ad-b0kla-text-secondary)`, 좌우 여백
- `__summary-segment--amount`: `font-weight: 600`, 필요 시 `--ad-b0kla-title-color` 등
- `__summary-divider`(Link2): 기존 svg 스타일 유지
- 기존 `__summary-pkg`는 `__summary-segment--product`로 통합 또는 유지

### 3.4 토큰·표준
- `frontend/src/styles/unified-design-tokens.css`, B0KlA 변수 사용
- 하드코딩 색상 금지

---

## 4. 완료 기준
- [ ] MappingCreationModal 4단계 summary-bar: 상담사·내담자·패키지·금액 구분 표시
- [ ] MappingDepositModal summary-bar: 동일 구조·스타일 적용
- [ ] CSS 변수(B0KlA)만 사용, 반응형 유지
- [ ] 시각적으로 정보가 구분되어 정돈된 느낌
