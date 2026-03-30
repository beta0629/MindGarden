# 매칭 관리 연관 모달 디자인 스펙 (B0KlA 토큰 적용)

**버전**: 2.0.0  
**최종 업데이트**: 2025-02-22  
**기준**: 어드민 대시보드 샘플 / mindgarden-design-system.pen / B0KlA 토큰  
**적용 대상**: MappingDetailModal, MappingEditModal, ConsultantTransferModal, ConsultantTransferHistory, PaymentConfirmationModal, PartialRefundModal, MappingPaymentModal, MappingDepositModal, 환불 처리 인라인 모달

---

## 1. 공통 모달 구조 — 표준 마크업 (B0KlA)

모든 매칭 관련 모달은 **동일한 헤더·바디·푸터** 마크업을 사용합니다. core-coder는 아래 구조를 그대로 적용합니다.

### 1.1 필수 마크업 템플릿

```html
<div class="mg-v2-modal-overlay mg-v2-ad-b0kla mg-v2-ad-b0kla-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
  <div class="mg-v2-modal mg-v2-modal-large mg-v2-ad-b0kla-modal" onClick={(e) => e.stopPropagation()}>

    <header class="mg-v2-modal-header mg-v2-ad-b0kla-modal__header">
      <div class="mg-v2-modal-title-section">
        <Icon size={24} className="mg-v2-modal-title-icon mg-v2-ad-b0kla-modal__icon" aria-hidden="true" />
        <h2 className="mg-v2-modal-title mg-v2-ad-b0kla-modal__title">매칭 상세 정보</h2>
      </div>
      <button type="button" className="mg-v2-modal-close mg-v2-ad-b0kla-modal__close" onClick={onClose} aria-label="닫기">
        <XCircle size={24} aria-hidden="true" />
      </button>
    </header>

    <div className="mg-v2-modal-body mg-v2-ad-b0kla-modal__body">
      <!-- MappingDetailModal: 탭 + 섹션 카드 / 기타: 폼 등 -->
    </div>

    <footer className="mg-v2-modal-footer mg-v2-ad-b0kla-modal__footer">
      <button type="button" className="mg-v2-button mg-v2-button-secondary">취소</button>
      <button type="button" className="mg-v2-button mg-v2-button-primary">확인</button>
    </footer>

  </div>
</div>
```

### 1.2 헤더·바디·푸터 스타일 값 (B0KlA 토큰)

| 영역 | CSS 클래스 | 토큰/값 |
|------|------------|---------|
| 헤더 | `mg-v2-modal-header` `mg-v2-ad-b0kla-modal__header` | padding 20–24px, border-bottom 1px solid `--ad-b0kla-border` |
| 헤더 제목 | `mg-v2-modal-title` | font-size 1.25rem, font-weight 600, color `--ad-b0kla-title-color` |
| 헤더 아이콘 | `mg-v2-modal-title-icon` | margin-right 8px, color `--ad-b0kla-green` |
| 바디 | `mg-v2-modal-body` `mg-v2-ad-b0kla-modal__body` | padding 20–24px, overflow-y auto |
| 푸터 | `mg-v2-modal-footer` `mg-v2-ad-b0kla-modal__footer` | padding 16–20px, gap 12px, flex justify-end |
| 닫기 | `mg-v2-modal-close` | 32×32px, color `--ad-b0kla-text-secondary` |

### 1.3 B0KlA 토큰 (모달 스코프)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--ad-b0kla-overlay-bg` | rgba(0,0,0,0.4) | 오버레이 |
| `--ad-b0kla-card-bg` | #ffffff | 모달·카드 배경 |
| `--ad-b0kla-border` | #e2e8f0 | 구분선·테두리 |
| `--ad-b0kla-radius` | 24px | 모달 corner-radius |
| `--ad-b0kla-radius-sm` | 12px | 버튼·카드 내부 |
| `--ad-b0kla-title-color` | #2d3748 | 제목 |
| `--ad-b0kla-text-secondary` | #64748b | 라벨·메타 |
| `--ad-b0kla-green` | #4b745c | 주조·확인 |
| `--ad-b0kla-green-bg` | #ebf2ee | 활성·강조 배경 |
| `--ad-b0kla-orange` | #e8a87c | 경고 |
| `--ad-b0kla-orange-bg` | #fcf3ed | 경고 배경 |
| `--ad-b0kla-blue` | #6d9dc5 | 정보 |
| `--ad-b0kla-blue-bg` | #f0f5f9 | 정보 배경 |
| `--ad-b0kla-danger` | var(--color-danger) | 삭제·환불 버튼 |

### 1.4 버튼 클래스

| 용도 | 클래스 | 스타일 |
|------|--------|--------|
| 주조(확인·저장·생성) | `mg-v2-button mg-v2-button-primary` | background `--ad-b0kla-green`, color white |
| 보조(취소·닫기) | `mg-v2-button mg-v2-button-secondary` | background transparent, border `--ad-b0kla-border` |
| 위험(삭제·환불) | `mg-v2-button mg-v2-button-danger` | background `--ad-b0kla-danger` |

---

## 2. 모달별 스펙

### 2.1 MappingDetailModal (매칭 상세) — 상세 스펙

**용도**: 매칭 상세 조회. 탭: 기본/결제/회기/ERP/변경이력. 각 탭 내부는 **카드형 섹션**으로 구성.

| 항목 | 값 |
|------|-----|
| size | `mg-v2-modal-large` (max-width 1000px) |
| 헤더 아이콘 | `Info` (lucide-react) |
| 탭 | `mg-v2-ad-b0kla__pill-toggle` 내부 `mg-v2-ad-b0kla__pill` |
| 섹션 | `mg-v2-ad-b0kla-modal__section` (카드형, 좌측 악센트 4px) |
| 푸터 | 닫기 버튼만 (secondary) |

#### 2.1.1 전체 DOM 구조

```
mg-v2-modal-overlay.mg-v2-ad-b0kla
  └─ mg-v2-modal.mg-v2-modal-large.mg-v2-ad-b0kla-modal
       ├─ header.mg-v2-modal-header.mg-v2-ad-b0kla-modal__header
       │    ├─ .mg-v2-modal-title-section
       │    │    ├─ Info (icon)
       │    │    └─ h2.mg-v2-modal-title
       │    └─ button.mg-v2-modal-close
       │
       ├─ div.mg-v2-modal-body.mg-v2-ad-b0kla-modal__body
       │    ├─ .mg-v2-ad-b0kla__pill-toggle (탭 컨테이너)
       │    │    ├─ button.mg-v2-ad-b0kla__pill.mg-v2-ad-b0kla__pill--active (기본)
       │    │    ├─ button.mg-v2-ad-b0kla__pill (결제)
       │    │    ├─ button.mg-v2-ad-b0kla__pill (회기)
       │    │    ├─ button.mg-v2-ad-b0kla__pill (ERP)
       │    │    └─ button.mg-v2-ad-b0kla__pill (변경이력)
       │    │
       │    └─ .mg-v2-ad-b0kla-modal__tab-content
       │         └─ [탭별 컨텐츠: 여러 .mg-v2-ad-b0kla-modal__section]
       │
       └─ footer.mg-v2-modal-footer.mg-v2-ad-b0kla-modal__footer
            └─ button.mg-v2-button.mg-v2-button-secondary (닫기)
```

#### 2.1.2 탭 정의

| 탭 ID | 라벨 | 아이콘 (lucide-react) |
|-------|------|------------------------|
| basic | 기본 정보 | User |
| payment | 결제 정보 | CreditCard |
| sessions | 회기 정보 | Calendar |
| erp | ERP 연동 | TrendingUp |
| history | 변경 이력 | Clock |

#### 2.1.3 탭별 섹션 구조 (카드형)

**탭: 기본 정보 (basic)**
- 섹션 1: 매칭 기본 정보 — `mg-v2-ad-b0kla-modal__section`
  - 제목: "매칭 기본 정보" (h4 + 좌측 악센트)
  - 그리드: 매칭 ID, 상태, 결제 상태, 지점 (`mg-v2-ad-b0kla-modal__info-grid`, `mg-v2-ad-b0kla-modal__info-row`)
- 섹션 2: 참여자 정보 — `mg-v2-ad-b0kla-modal__section`
  - 제목: "참여자 정보"
  - 참여자 카드: `mg-v2-ad-b0kla__counselor-item` (상담사·내담자)
- 섹션 3: 일정 정보 — `mg-v2-ad-b0kla-modal__section`
  - 제목: "일정 정보"
  - 그리드: 시작일, 생성일, 수정일, 종료일

**탭: 결제 정보 (payment)**
- 섹션 1: 결제 정보 — `mg-v2-ad-b0kla-modal__section`
- 섹션 2: 금액 일관성 검사 — `mg-v2-ad-b0kla-modal__section` (성공: green, 경고: orange)

**탭: 회기 정보 (sessions)**
- 섹션 1: 회기 현황 — `mg-v2-ad-b0kla-modal__section` (총/사용/남은 회기 카드 + 진행률)

**탭: ERP 연동 (erp)**
- 섹션 1: ERP 연동 상태 — `mg-v2-ad-b0kla-modal__section` (거래 목록 또는 빈 상태)

**탭: 변경 이력 (history)**
- 섹션 1: 변경 이력 — `mg-v2-ad-b0kla-modal__section`
- 섹션 2(선택): 특별 고려사항 — `mg-v2-ad-b0kla-modal__section`

#### 2.1.4 섹션 카드 마크업

```html
<div class="mg-v2-ad-b0kla-modal__section mg-v2-ad-b0kla__card">
  <h4 class="mg-v2-ad-b0kla-modal__section-title mg-v2-ad-b0kla__chart-title">
    <span class="mg-v2-ad-b0kla-modal__section-accent"></span>
    매칭 기본 정보
  </h4>
  <div class="mg-v2-ad-b0kla-modal__info-grid">
    <div class="mg-v2-ad-b0kla-modal__info-row">
      <span class="mg-v2-ad-b0kla-modal__label">매칭 ID</span>
      <span class="mg-v2-ad-b0kla-modal__value">#123</span>
    </div>
    <!-- ... -->
  </div>
</div>
```

#### 2.1.5 뱃지 클래스

| 상태 | 뱃지 클래스 | 배경 |
|------|-------------|------|
| ACTIVE | `mg-v2-ad-b0kla__kpi-badge mg-v2-ad-b0kla__kpi-badge--green` | `--ad-b0kla-green-bg` |
| PENDING_PAYMENT | `mg-v2-ad-b0kla__kpi-badge mg-v2-ad-b0kla__kpi-badge--orange` | `--ad-b0kla-orange-bg` |
| 기타/종료 | `mg-v2-ad-b0kla__kpi-badge mg-v2-ad-b0kla__kpi-badge--blue` | `--ad-b0kla-blue-bg` |

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

## 3. CSS 클래스 목록 (구현용)

### 3.1 모달 래퍼·헤더·바디·푸터

| 클래스 | 용도 | 필수 |
|--------|------|------|
| `mg-v2-modal-overlay` | 오버레이 래퍼 | ✓ |
| `mg-v2-ad-b0kla` | B0KlA 토큰 스코프 | ✓ |
| `mg-v2-ad-b0kla-modal-overlay` | 오버레이 B0KlA 배경 | ✓ |
| `mg-v2-modal` | 모달 컨테이너 | ✓ |
| `mg-v2-modal-large` | large (max-width 1000px) | MappingDetailModal |
| `mg-v2-modal-medium` | medium (max-width 640px) | 기타 대부분 |
| `mg-v2-ad-b0kla-modal` | 모달 B0KlA 스타일 | ✓ |
| `mg-v2-modal-header` | 헤더 | ✓ |
| `mg-v2-ad-b0kla-modal__header` | 헤더 B0KlA | ✓ |
| `mg-v2-modal-title-section` | 제목 영역 (아이콘+텍스트) | ✓ |
| `mg-v2-modal-title-icon` | 제목 아이콘 | ✓ |
| `mg-v2-ad-b0kla-modal__icon` | 아이콘 색상 | 선택 |
| `mg-v2-modal-title` | 제목 h2 | ✓ |
| `mg-v2-ad-b0kla-modal__title` | 제목 B0KlA | 선택 |
| `mg-v2-modal-close` | 닫기 버튼 | ✓ |
| `mg-v2-ad-b0kla-modal__close` | 닫기 B0KlA | 선택 |
| `mg-v2-modal-body` | 바디 | ✓ |
| `mg-v2-ad-b0kla-modal__body` | 바디 B0KlA | ✓ |
| `mg-v2-modal-footer` | 푸터 | ✓ |
| `mg-v2-ad-b0kla-modal__footer` | 푸터 B0KlA | ✓ |

### 3.2 탭 (MappingDetailModal)

| 클래스 | 용도 |
|--------|------|
| `mg-v2-ad-b0kla__pill-toggle` | 탭 컨테이너 (flex, gap 4px, 배경 `--ad-b0kla-bg`, radius 9999px) |
| `mg-v2-ad-b0kla__pill` | 탭 버튼 (비활성) |
| `mg-v2-ad-b0kla__pill--active` | 활성 탭 (배경 card-bg, box-shadow) |
| `mg-v2-ad-b0kla-modal__tab-content` | 탭 컨텐츠 래퍼 |

### 3.3 섹션·카드 (탭 내부)

| 클래스 | 용도 |
|--------|------|
| `mg-v2-ad-b0kla-modal__section` | 섹션 카드 (mg-v2-ad-b0kla__card와 함께 사용) |
| `mg-v2-ad-b0kla__card` | 카드 스타일 (배경, 테두리, radius, 패딩) |
| `mg-v2-ad-b0kla-modal__section-title` | 섹션 제목 (좌측 악센트 바 포함) |
| `mg-v2-ad-b0kla-modal__section-accent` | 좌측 세로 악센트 (4px, `--ad-b0kla-green`, radius 2px) |
| `mg-v2-ad-b0kla__chart-title` | 제목 텍스트 스타일 (1.125rem, 700, title-color) |
| `mg-v2-ad-b0kla-modal__info-grid` | 라벨·값 그리드 (2열 또는 3열) |
| `mg-v2-ad-b0kla-modal__info-row` | 라벨·값 한 행 |
| `mg-v2-ad-b0kla-modal__label` | 라벨 (12–14px, text-secondary) |
| `mg-v2-ad-b0kla-modal__value` | 값 (14px, title-color) |

### 3.4 참여자·기타

| 클래스 | 용도 |
|--------|------|
| `mg-v2-ad-b0kla__counselor-list` | 참여자 목록 컨테이너 |
| `mg-v2-ad-b0kla__counselor-item` | 상담사·내담자 카드 아이템 |
| `mg-v2-ad-b0kla__kpi-badge` | 상태 뱃지 |
| `mg-v2-ad-b0kla__kpi-badge--green` | green 뱃지 |
| `mg-v2-ad-b0kla__kpi-badge--orange` | orange 뱃지 |
| `mg-v2-ad-b0kla__kpi-badge--blue` | blue 뱃지 |

### 3.5 버튼

| 클래스 | 용도 |
|--------|------|
| `mg-v2-button` | 버튼 베이스 |
| `mg-v2-button-primary` | 주조 버튼 |
| `mg-v2-button-secondary` | 보조 버튼 |
| `mg-v2-button-danger` | 위험 버튼 |

---

## 4. 버튼·탭·라벨 스타일 (B0KlA 구체값)

core-coder가 CSS 작성 시 사용할 수치입니다. mindgarden-design-system.pen, AdminDashboardB0KlA.css 기준.

### 4.1 탭 (pill)

| 속성 | 값 |
|------|-----|
| 컨테이너 `.mg-v2-ad-b0kla__pill-toggle` | display flex, gap 4px, padding 4px, background `--ad-b0kla-bg`, border 1px solid `--ad-b0kla-border`, border-radius 9999px |
| 버튼 `.mg-v2-ad-b0kla__pill` | padding 8px 16px, font-size 13px, font-weight 600, color `--ad-b0kla-text-secondary`, background transparent, border none, border-radius 9999px |
| 활성 `.mg-v2-ad-b0kla__pill--active` | background `--ad-b0kla-card-bg`, color `--ad-b0kla-title-color`, box-shadow 0 1px 2px rgba(0,0,0,0.05) |

### 4.2 버튼

| 속성 | 값 |
|------|-----|
| 기본 | height 40px, padding 10px 20px, border-radius 10px (또는 12px), font-size 14px, font-weight 600 |
| primary | background `--ad-b0kla-green`, color `--ad-b0kla-card-bg` |
| secondary | background transparent, border 2px solid `--ad-b0kla-border`, color `--ad-b0kla-text-secondary` |
| danger | background `--ad-b0kla-danger`, color white |

### 4.3 라벨·값

| 요소 | font-size | font-weight | color |
|------|-----------|-------------|-------|
| `.mg-v2-ad-b0kla-modal__label` | 12–14px | 500 | `--ad-b0kla-text-secondary` |
| `.mg-v2-ad-b0kla-modal__value` | 14px | 400 | `--ad-b0kla-title-color` |
| `.mg-v2-ad-b0kla-modal__section-title` | 1.125rem (18px) | 700 | `--ad-b0kla-title-color` |

### 4.4 섹션 악센트 바

| 속성 | 값 |
|------|-----|
| `.mg-v2-ad-b0kla-modal__section-accent` | width 4px, min-height 1em, background `--ad-b0kla-green`, border-radius 2px, margin-right 12px (inline-block 또는 flex item) |

### 4.5 info-grid 레이아웃

| 속성 | 값 |
|------|-----|
| `.mg-v2-ad-b0kla-modal__info-grid` | display grid, grid-template-columns repeat(2, 1fr) 또는 repeat(3, 1fr), gap 16px |
| `.mg-v2-ad-b0kla-modal__info-row` | display flex, flex-direction column 또는 row, gap 4px |

---

## 5. 아이콘 (lucide-react)

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

## 6. UnifiedModal 사용 시

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

## 참조 파일 (core-coder용)

| 파일 | 용도 |
|------|------|
| `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css` | B0KlA 토큰, pill, card, kpi-badge, counselor-item |
| `frontend/src/components/admin/MappingCreationModal.css` | B0KlA 모달 오버레이·헤더·바디·푸터 스타일 참고 |
| `frontend/src/styles/unified-design-tokens.css` | mg-v2-modal-* 베이스 |
| `mindgarden-design-system.pen` | 색상·타이포 디자인 소스 |
| `pencil-new.pen` | 아토믹 디자인 컴포넌트 |

---

## 7. 구현 체크리스트

| # | 항목 | 대상 |
|---|------|------|
| 1 | 오버레이·모달에 `mg-v2-ad-b0kla` 스코프 적용 | 전체 |
| 2 | 헤더: `mg-v2-modal-title-section` + 아이콘 + h2, 닫기 `mg-v2-modal-close` (XCircle) | 전체 |
| 3 | 바디: `mg-v2-modal-body` `mg-v2-ad-b0kla-modal__body` | 전체 |
| 4 | 푸터: `mg-v2-modal-footer`, 버튼 `mg-v2-button` + variant | 전체 |
| 5 | MappingDetailModal: 탭 `mg-v2-ad-b0kla__pill-toggle` > `mg-v2-ad-b0kla__pill` | MappingDetailModal |
| 6 | MappingDetailModal: 각 탭 내부 `mg-v2-ad-b0kla-modal__section` + `mg-v2-ad-b0kla__card` | MappingDetailModal |
| 7 | 섹션 제목: `mg-v2-ad-b0kla-modal__section-title` + `mg-v2-ad-b0kla-modal__section-accent` | MappingDetailModal |
| 8 | 라벨·값: `mg-v2-ad-b0kla-modal__info-grid`, `mg-v2-ad-b0kla-modal__info-row`, `_label`, `_value` | MappingDetailModal |
| 9 | 뱃지: `mg-v2-ad-b0kla__kpi-badge--green/orange/blue` | MappingDetailModal |
| 10 | bi-* 아이콘 → lucide-react로 통일 | 전체 |
