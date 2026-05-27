# 테넌트 구독·결제 관리 액션 SSOT 분리 — Phase 1 디자인 핸드오프

본 문서는 테넌트 구독 및 결제 수단 관리 기능을 별도의 어드민 라우트와 `UnifiedModal`로 분리하기 위한 디자인 및 UI/UX 명세서입니다. `core-designer`가 작성하였으며, `core-coder`가 즉각적으로 구현할 수 있는 와이어프레임, 디자인 토큰, SSOT 컴포넌트 매핑을 제공합니다.

## §A. LNB 메뉴 신설 와이어
- **새 최상위 그룹**: "결제/구독"
  - i18n 키 권장: `admin.lnb.billing.group`
- **하위 메뉴**:
  - "구독 관리" → 라우트: `/admin/billing/subscriptions`, i18n 키: `admin.lnb.billing.subscriptions`
  - "결제 수단" → 라우트: `/admin/billing/payment-methods`, i18n 키: `admin.lnb.billing.paymentMethods`
- **LNB 아이콘 권장**: Lucide 아이콘 `CreditCard` (결제 수단), `Receipt` 또는 `CalendarDays` (구독 관리) 등 기존 SSOT 아이콘 활용.
- **권한**: 어드민(ADMIN) 및 헤드쿼터(HQ) 가시성 정책 동일 적용 (테넌트 권한 기반).

## §B. 새 라우트 페이지 와이어 (옵션 C 라우트 부분)

### 1. `/admin/billing/subscriptions` — 구독 관리
- **레이아웃**: `mg-v2-ad-b0kla` + `mg-v2-ad-b0kla__container` (SSOT 너비 토큰 `var(--mg-container-max)` 정합)
- **ContentHeader**: 
  - 제목: "구독 관리"
  - 우상단 Actions: "구독 등록" 버튼 (클릭 시 구독 등록 모달 호출)
- **ContentSection 1: 구독 목록**: 
  - 활성 구독 카드 리스트 렌더링 (요금제 정보, 갱신일, 금액 등).
  - 데이터가 없을 경우 `EmptyState` 렌더링.
- **ContentSection 2: 결제 이력**: 
  - 향후 별도 라우트로 분리 검토 (현재는 리스트 하단 또는 탭으로 배치 가능하나 우선순위 낮음).

### 2. `/admin/billing/payment-methods` — 결제 수단
- **레이아웃**: `mg-v2-ad-b0kla` + `mg-v2-ad-b0kla__container`
- **ContentHeader**: 
  - 제목: "결제 수단"
  - 우상단 Actions: "결제 수단 등록" 버튼 (클릭 시 결제 수단 등록 모달 호출)
- **ContentSection 1: 결제 수단 목록**: 
  - 등록된 결제 수단 카드 리스트 (카드, 계좌, 카카오페이 등 Brand 표시).
  - 데이터가 없을 경우 `EmptyState` 렌더링.
  - 각 카드 액션: "기본 설정" 버튼, "삭제" 버튼 (클릭 시 컨펜 모달 호출).

> **주의**: `SimpleLayout` 및 `UnifiedHeader`는 절대 사용하지 않음 (핸드오프 v1.1 §G 정합).

## §C. UnifiedModal 와이어 (옵션 C 모달 부분)
모든 모달은 `UnifiedModal` SSOT를 사용하며, 커스텀 오버레이/래퍼 사용을 엄격히 금지합니다 (`core-solution-unified-modal` 스킬 준수).

1. **결제 수단 등록 모달**:
   - 카드 / 계좌 / 간편결제 brand 선택 → PG SDK 연동 또는 직접 입력 폼 렌더링.
   - 폼 제출 및 등록 완료 후 모달 자동 닫힘.
2. **구독 등록·변경 모달**:
   - 요금제 선택 → 결제 수단 선택 (기존 등록 수단 선택 또는 신규 등록 sub-modal 호출).
   - 결제 컨펜(확인) 후 완료.
3. **구독 취소 컨펜 모달**:
   - 타이틀: "정말 취소하시겠습니까?"
   - 내용: 취소 사유 선택(옵션) 및 환불 정책 안내.
   - 액션: 취소 진행 / 닫기.
4. **기본 결제 수단 설정 모달**:
   - 타이틀: "기본 결제 수단 변경"
   - 내용: 토글 또는 컨펜 형태의 안내 문구 ("이 결제 수단을 기본으로 설정하시겠습니까?").
   - 액션: 변경 / 닫기.

## §D. 디자인 토큰
- **적용 토큰**: mg-v2 / B0KlA SSOT 인용
  - Background: `var(--mg-v2-bg-base)`
  - Surface (카드): `var(--mg-v2-surface)`
  - Border: `var(--mg-v2-border-base)`
  - Primary: `var(--mg-v2-ad-b0kla-green)`
- **카드 스타일**: 
  - Padding: `var(--mg-v2-space-24)`
  - Border Radius: `var(--mg-v2-radius-16)`
  - Box Shadow: `none`
  - Spacing (요소 간 간격): `var(--mg-v2-space-16)` 또는 `var(--mg-v2-space-24)`
- **폼 요소**: 
  - Input, Toggle, Radio 등은 기존 mg-v2 폼 SSOT 토큰을 그대로 사용.
- **신규 토큰 필요 시 형식**: 
  - Light Hex / Dark Hex / WCAG AA 대비율 명시 후 추가 (본 Phase에서는 기존 토큰으로 충분할 것으로 예상됨).

## §E. 반응형
- **≥ 1280px (Desktop Wide)**: 카드 Grid 유지 (예: 2~3 컬럼), 모달 Width (UnifiedModal SSOT 기본값).
- **1024px - 1279px (Desktop Standard)**: 카드 Grid 유지 (2 컬럼).
- **768px - 1023px (Tablet)**: 1-컬럼 Stack으로 전환.
- **< 768px (Mobile)**: 1-컬럼 Stack 유지, ContentHeader 우측 버튼 Wrap 처리. 모달은 화면 너비에 맞게 Full-width(또는 margin 포함) 조정.

## §F. 접근성
- **Aria 속성**: `aria-label`, `role` 적절히 부여.
- **Focus State**: 모든 인터랙티브 요소(버튼, 폼)에 `:focus-visible` 키보드 네비게이션 지원.
- **모달 접근성**: Trap focus, ESC 키로 닫기, `aria-modal="true"`, `role="dialog"` (UnifiedModal 내장 기능 활용).
- **폼 요소**: Input label과 error message 명확히 연결 (`aria-describedby`), required indicator 시각적/의미적 제공.

## §G. i18n 키 인벤토리
`admin/ko` 네임스페이스 (`admin.billing.*` 또는 동급) 기준으로 작성:
- **LNB**: `admin.lnb.billing.group`, `admin.lnb.billing.subscriptions`, `admin.lnb.billing.paymentMethods`
- **페이지 헤더**: `admin.billing.subscriptions.title`, `admin.billing.paymentMethods.title`
- **버튼**: `admin.billing.action.addSubscription`, `admin.billing.action.addPaymentMethod`, `admin.billing.action.setDefault`, `admin.billing.action.delete`
- **빈 상태**: `admin.billing.empty.subscription.title`, `admin.billing.empty.paymentMethod.title`
- **모달**: `admin.billing.modal.cancelSubscription.title`, `admin.billing.modal.setDefaultPayment.title`
- **에러 메시지**: `admin.billing.error.paymentFailed`, `admin.billing.error.loadFailed`

## §H. SSOT 컴포넌트 매핑 (코더 인계용)
- `ContentHeader` / `ContentSection` / `ContentArea` (mg-v2 레이아웃)
- `UnifiedModal` (모든 모달)
- `EmptyState` (빈 상태)
- `StatusBadge` (구독 상태 및 결제 수단 기본(Default) 배지)
- `MGButton` (공통 버튼)
- `SafeText` (XSS 방지 텍스트 렌더링)
- `UnifiedLoading` (데이터 로딩 상태)
- 폼 SSOT: 기존 Input / Select / Radio / Toggle 컴포넌트 인벤토리 권장.

## §I. 기존 standalone 컴포넌트 처리
- **결정**: 기존 `SubscriptionManagement.js` 및 `PaymentMethodRegistration.js`는 **재활용 (내부 로직 보존) + wrapper 만 새로 작성 (어드민 SSOT layout 정합)** 하는 방향을 권장합니다.
- **정책**: 기존 standalone 패턴인 `SimpleLayout`, `UnifiedHeader`, 자체 white card 스타일은 완전히 제거하고, 신규 라우트의 `ContentSection` 내부에 로직 컴포넌트로 임베드되도록 리팩토링합니다.

## §J. 비즈니스 정책 (Q3 default 반영)
- **기본 결제 수단**: 1개 지정 강제.
- **결제 실패 처리**: 자동결제 실패 시 알림톡 + 이메일 통지 (3회 재시도 후 구독 일시 정지).
- **환불**: 별도 어드민 요청 (본 분리 PR 범위 밖).
- **Audit Log**: 등록 및 취소 액션에 대한 감사 로그 기록.

## §K. 하드코딩 게이트 통과 조건
- 모든 색상, spacing, 문구는 하드코딩 없이 토큰 및 i18n SSOT를 사용해야 합니다.
- 인용: `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17, `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3, `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`

---

## 코더 인계 체크리스트
- [ ] 라우트 신설 명세: `App.js` 및 `ADMIN_ROUTES`에 `/admin/billing/subscriptions`, `/admin/billing/payment-methods` 추가.
- [ ] LNB 메뉴 신설: `common_codes` 시드 또는 `menus` 테이블 추가 (백엔드 검토 필요).
- [ ] 컴포넌트 신설 / 재활용 매트릭스 준수 (기존 로직 재활용 + 레이아웃 래퍼 적용).
- [ ] 모달 정의: `UnifiedModal` config를 사용하여 4종 모달 구현.
- [ ] i18n 키 추가: `admin/ko` 네임스페이스에 키 등록.
- [ ] 단위 테스트 + 시각 검수 매트릭스 작성 및 통과.
- [ ] 백엔드 API 변경 필요 여부 확인 (가능하면 무변경, 기존 API 재활용).

## 위험·게이트
- **LNB 메뉴 신설 시 권한 정책**: HQ vs ADMIN 가시성 정책이 기존 테넌트 프로필과 동일하게 유지되는지 확인 필요.
- **UnifiedModal SSOT 충돌 회피**: 다른 모달(예: PG SDK 자체 오버레이)과 z-index 정합성 확인.
- **기존 standalone 컴포넌트 삭제 시 외부 사용처 회귀 가드**: 기존 테넌트 프로필 등에서 임베드 사용처가 0건인지 최종 확인.

---
*Generated by core-designer*
