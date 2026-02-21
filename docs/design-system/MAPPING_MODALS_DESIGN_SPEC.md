# 매칭 관리 연관 모달 디자인 스펙 (B0KlA 토큰 적용)

**버전**: 1.0.0  
**최종 업데이트**: 2025-02-22  
**기준**: 어드민 대시보드 샘플 / B0KlA 토큰 / UnifiedModal  
**적용 대상**: MappingDetailModal, MappingEditModal, ConsultantTransferModal, ConsultantTransferHistory, PaymentConfirmationModal, PartialRefundModal, MappingPaymentModal, MappingDepositModal, 환불 처리 인라인 모달

---

## 1. 공통 모달 구조 (B0KlA 적용)

모든 매칭 관련 모달은 **동일한 래퍼·헤더·바디·푸터** 패턴을 따릅니다.

### 1.1 마크업 템플릿

```html
<div class="mg-v2-modal-overlay mg-v2-ad-b0kla-modal-overlay" onClick={onClose}>
  <div class="mg-v2-modal mg-v2-modal--{size} mg-v2-ad-b0kla-modal" onClick={stopPropagation}>
    <header class="mg-v2-modal-header mg-v2-ad-b0kla-modal__header">
      <div class="mg-v2-modal-title-section">
        <Icon size={24} class="mg-v2-modal-title-icon mg-v2-ad-b0kla-modal__icon" />
        <h2 class="mg-v2-modal-title mg-v2-ad-b0kla-modal__title">{제목}</h2>
      </div>
      <button type="button" class="mg-v2-modal-close mg-v2-ad-b0kla-modal__close" aria-label="닫기">
        <XCircle size={24} />
      </button>
    </header>
    <div class="mg-v2-modal-body mg-v2-ad-b0kla-modal__body">
      <!-- 콘텐츠 -->
    </div>
    <footer class="mg-v2-modal-footer mg-v2-ad-b0kla-modal__footer">
      <!-- 액션 버튼 -->
    </footer>
  </div>
</div>
```

### 1.2 B0KlA 토큰 매핑 (모달)

| 요소 | 토큰 | 값 |
|------|------|-----|
| 오버레이 배경 | `--ad-b0kla-overlay-bg` | rgba(0,0,0,0.4) |
| 모달 배경 | `--ad-b0kla-card-bg` | #ffffff |
| 모달 테두리 | `--ad-b0kla-border` | #e2e8f0 |
| 모달 radius | `--ad-b0kla-radius` | 24px |
| 헤더 구분선 | `--ad-b0kla-border` | 1px solid |
| 제목 색상 | `--ad-b0kla-title-color` | #2d3748 |
| 보조 텍스트 | `--ad-b0kla-text-secondary` | #64748b |
| 버튼 주조 | `--ad-b0kla-green` | #4b745c |
| 버튼 위험 | `--ad-b0kla-orange` 또는 별도 danger | — |

### 1.3 버튼 클래스

| 용도 | 클래스 |
|------|--------|
| 주조(확인·저장·생성) | `mg-v2-button mg-v2-button-primary` |
| 보조(취소·닫기) | `mg-v2-button mg-v2-button-secondary` |
| 위험(삭제·환불) | `mg-v2-button mg-v2-button-danger` |

---

## 2. 모달별 스펙

### 2.1 MappingDetailModal (매칭 상세)

**용도**: 매칭 상세 정보 조회 (기본/결제/회기/ERP/변경이력 탭)

| 항목 | 값 |
|------|-----|
| size | `mg-v2-modal-large` (max-width 1000px) |
| 헤더 아이콘 | Info |
| 탭 스타일 | `mg-v2-ad-b0kla__pill-toggle` 또는 `mg-v2-tabs` + B0KlA |
| 탭 버튼 | `mg-v2-ad-b0kla__pill`, `mg-v2-ad-b0kla__pill--active` |
| 섹션 블록 | `mg-v2-ad-b0kla__card`, 좌측 악센트 4px |
| 뱃지 | `mg-v2-badge` + status별 `--ad-b0kla-green-bg`, `--ad-b0kla-orange-bg` 등 |

**섹션 구조**:
- 각 탭 내 `info-section` → `mg-v2-ad-b0kla__card` + `mg-v2-ad-b0kla__chart-title` (좌측 악센트)
- `participant-card` → `mg-v2-ad-b0kla__counselor-item` 스타일 재사용

---

### 2.2 MappingEditModal (매칭 수정)

**용도**: 패키지명·가격·총 회기 수 수정

| 항목 | 값 |
|------|-----|
| size | `mg-v2-modal-medium` |
| 헤더 아이콘 | Edit3 |
| 폼 필드 | FormInput, CustomSelect (B0KlA border/radius) |
| 푸터 | 취소(secondary), 저장(primary) |

---

### 2.3 ConsultantTransferModal (상담사 변경)

**용도**: 매칭의 상담사 변경 (신규 상담사 선택, 사유, 패키지 정보)

| 항목 | 값 |
|------|-----|
| size | `mg-v2-modal-large` |
| 헤더 아이콘 | UserCheck |
| 상담사 선택 | CustomSelect 또는 카드 리스트 (B0KlA 카드) |
| 사유 입력 | textarea, `mg-v2-ad-b0kla` border |
| 푸터 | 취소, 변경 완료(primary) |

---

### 2.4 ConsultantTransferHistory (상담사 변경 이력)

**용도**: 내담자별 상담사 변경 이력 조회

| 항목 | 값 |
|------|-----|
| size | `mg-v2-modal-medium` |
| 헤더 아이콘 | Clock 또는 History |
| 이력 리스트 | `mg-v2-ad-b0kla__counselor-list` 또는 타임라인 스타일 |
| 상태 뱃지 | `mg-v2-ad-b0kla__kpi-badge--green`, `--orange` 등 |

---

### 2.5 PaymentConfirmationModal (결제 확인)

**용도**: 결제 승인 확인

| 항목 | 값 |
|------|-----|
| size | `mg-v2-modal-medium` |
| 헤더 아이콘 | CreditCard |
| 매칭 요약 | `mg-v2-ad-b0kla__card`, 요약 한 줄 |
| 푸터 | 취소, 승인(primary) |

---

### 2.6 PartialRefundModal (부분 환불)

**용도**: 지정 회기수 환불

| 항목 | 값 |
|------|-----|
| size | `mg-v2-modal-medium` |
| 헤더 아이콘 | RefreshCcw |
| 경고 영역 | `--ad-b0kla-orange-bg`, `--ad-b0kla-orange` 테두리 |
| 푸터 | 취소, 환불 처리(danger 또는 primary) |

---

### 2.7 MappingPaymentModal (결제 확인)

**용도**: 입금확인 전 결제 방법·참조번호 입력

| 항목 | 값 |
|------|-----|
| size | `mg-v2-modal-medium` |
| 헤더 아이콘 | CreditCard |
| 지불방법 | CustomSelect, B0KlA 스타일 |
| 푸터 | 취소, 확인(primary) |

---

### 2.8 MappingDepositModal (입금 확인)

**용도**: 입금 참조번호 입력 후 입금 확인

| 항목 | 값 |
|------|-----|
| size | `mg-v2-modal-medium` |
| 헤더 아이콘 | DollarSign |
| 푸터 | 취소, 입금 확인(primary) |

---

### 2.9 환불 처리 인라인 모달

**용도**: 리스트/카드 내 인라인 환불 확인 UI

| 항목 | 값 |
|------|-----|
| 형태 | 작은 팝오버/인라인 확인 (modal 크기 small) |
| 버튼 | mg-v2-button-secondary (취소), mg-v2-button-danger (환불) |

---

## 3. 공통 CSS 클래스 요약

### 3.1 모달 래퍼

```
mg-v2-modal-overlay
mg-v2-modal
mg-v2-modal--small | --medium | --large
mg-v2-modal-header
mg-v2-modal-title
mg-v2-modal-title-icon
mg-v2-modal-close
mg-v2-modal-body
mg-v2-modal-footer
```

### 3.2 B0KlA 확장 (선택)

```
mg-v2-ad-b0kla-modal-overlay
mg-v2-ad-b0kla-modal
mg-v2-ad-b0kla-modal__header
mg-v2-ad-b0kla-modal__title
mg-v2-ad-b0kla-modal__body
mg-v2-ad-b0kla-modal__footer
mg-v2-ad-b0kla-modal__close
```

### 3.3 내부 콘텐츠

- **섹션 블록**: `mg-v2-ad-b0kla__card`
- **섹션 제목**: 좌측 4px 악센트 바 + `mg-v2-ad-b0kla__chart-title`
- **탭**: `mg-v2-ad-b0kla__pill-toggle`, `mg-v2-ad-b0kla__pill`, `mg-v2-ad-b0kla__pill--active`
- **폼 필드**: FormInput, CustomSelect (B0KlA 변수 연동)

---

## 4. 아이콘 (lucide-react)

| 모달 | 아이콘 |
|------|--------|
| MappingDetailModal | Info |
| MappingEditModal | Edit3 |
| ConsultantTransferModal | UserCheck |
| ConsultantTransferHistory | Clock |
| PaymentConfirmationModal | CreditCard |
| PartialRefundModal | RefreshCcw |
| MappingPaymentModal | CreditCard |
| MappingDepositModal | DollarSign |
| 공통 닫기 | XCircle |

---

## 5. UnifiedModal 사용 시

UnifiedModal을 사용하는 경우, `className`에 B0KlA 클래스 전달:

```jsx
<UnifiedModal
  isOpen={isOpen}
  onClose={onClose}
  title="매칭 상세 정보"
  size="large"
  variant="default"
  className="mg-v2-ad-b0kla-modal"
  actions={...}
>
  ...
</UnifiedModal>
```

UnifiedModal 내부가 `mg-modal` 클래스를 사용한다면, B0KlA 스타일을 `.mg-v2-ad-b0kla-modal.mg-modal` 선택자로 덮어쓰기.

---

## 6. 구현 체크리스트

| # | 항목 |
|---|------|
| 1 | 모든 모달에 B0KlA 토큰 적용 (색상·radius·shadow) |
| 2 | 버튼: mg-v2-button, mg-v2-button-primary/secondary/danger |
| 3 | 닫기 버튼: mg-v2-modal-close, XCircle 아이콘 |
| 4 | 섹션: mg-v2-ad-b0kla__card, 좌측 악센트 바 |
| 5 | 탭: mg-v2-ad-b0kla__pill 스타일 |
| 6 | bi-* 아이콘 → lucide-react로 통일 |
