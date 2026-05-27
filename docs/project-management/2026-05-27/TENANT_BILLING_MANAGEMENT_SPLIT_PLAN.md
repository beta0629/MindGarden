# TENANT_BILLING_MANAGEMENT_SPLIT_PLAN

## 1. 개요 및 배경
- **목표**: 테넌트 프로필 페이지에서 분리된 구독 및 결제 수단 관리 기능을 별도의 SSOT(Single Source of Truth) 기반 UI/UX로 재구축.
- **배경**: PR #26 (`hotfix/tenant-profile-layout-regression`)을 통해 테넌트 프로필 내 `<SubscriptionManagement />` 및 `<PaymentMethodRegistration />`의 standalone 임베드가 제거됨. 현재 해당 탭은 EmptyState만 표시되며 관리 액션이 일시적으로 차단된 상태.
- **방향성**: 어드민 표준 레이아웃(`AdminCommonLayout`, `mg-v2-ad-b0kla`) 또는 표준 모달(`UnifiedModal`)을 적용하여 디자인/컴포넌트 파편화를 해소하고 독립적인 관리 흐름을 제공.

## 2. 기능 및 컴포넌트 인벤토리 (Phase 0)

### 2.1. SubscriptionManagement
- **기능**: 구독 목록 조회, 신규 구독 생성(요금제 선택), 구독 활성화, 구독 취소, 결제 수단 등록 화면 호출.
- **데이터 모델**: `planId`, `paymentMethodId`, `status`, `billingCycle`, `amount`, `currency`.
- **관련 API**:
  - `GET /api/v1/billing/subscriptions` (목록 조회)
  - `GET /api/v1/billing/pricing-plans/active` (요금제 목록)
  - `POST /api/v1/billing/subscriptions` (구독 생성)
  - `POST /api/v1/billing/subscriptions/{id}/activate` (구독 활성화)
  - `POST /api/v1/billing/subscriptions/{id}/cancel` (구독 취소)
  - 공통 코드: `SUBSCRIPTION_STATUS`, `BILLING_CYCLE`

### 2.2. PaymentMethodRegistration
- **기능**: PG SDK(토스페이먼츠 v2) 연동을 통한 자동결제(빌링) 수단 등록.
- **데이터 모델**: `customerKey` (UUID), `pgProvider`, `cardBrand`, `cardLast4`, `isDefault`.
- **관련 API**:
  - `GET /api/v1/billing/payment-methods` (목록 조회)
  - `requestBillingAuth` (PG SDK 호출)
  - 콜백 URL 생성 및 처리 (`successUrl`, `failUrl`)
  - 공통 코드: `PG_PROVIDER`

## 3. 분리 전략 옵션 매트릭스

| 구분 | 옵션 A: 별도 어드민 라우트 신설 | 옵션 B: UnifiedModal SSOT 임베드 | 옵션 C: 혼합형 (라우트 + 모달) |
|---|---|---|---|
| **설명** | `/admin/billing` 등 신규 메뉴/라우트 생성 | 테넌트 프로필 내 CTA 클릭 시 모달로 띄움 | 구독/결제 페이지는 라우트로, 등록/취소 액션은 모달로 처리 |
| **장점** | 확장성 높음(결제 내역, 인보이스 등 추가 용이), Deep Link 가능 | 라우트 이동 없이 컨텍스트 유지, LNB 수정 불필요 | 복잡한 뷰와 간단한 액션의 최적화된 UX 제공 |
| **단점** | LNB 메뉴 추가 필요, 라우팅 작업 발생 | 모달 내 정보량이 많아질 경우 UX 저하 우려 | 구현 복잡도 가장 높음 |
| **SSOT 정합** | `AdminCommonLayout`, `mg-v2-ad-b0kla` 완벽 호환 | `UnifiedModal` 완벽 호환 | 두 SSOT 모두 사용 |
| **운영 영향도** | 중 (메뉴 구조 변경) | 하 (기존 화면 내 CTA만 추가) | 중 (메뉴 구조 변경 + 모달 처리) |

**권장 사항**: **옵션 C (혼합형)**
- 구독 및 결제 수단 '목록 조회'와 '요금제 선택'은 정보량이 많으므로 **별도 라우트(옵션 A)**로 분리하여 `AdminCommonLayout`을 적용.
- 결제 수단 '신규 등록' 및 구독 '취소/활성화' 확인 창은 컨텍스트 이탈을 막기 위해 **`UnifiedModal`(옵션 B)**로 처리.

## 4. SSOT 및 아키텍처 정합성
- **레이아웃**: 기존 `SimpleLayout`을 폐기하고, 신규 라우트에는 반드시 `AdminCommonLayout` + `ContentArea` + `ContentHeader` + `ContentSection` 적용.
- **CSS 토큰**: `mg-v2-ad-b0kla` 패턴 및 글로벌 SSOT 너비 토큰 사용. 기존 `subscription-management__*` 클래스는 폐기 또는 리팩토링.
- **모달**: `core-solution-unified-modal` 스킬을 준수하여 커스텀 오버레이/래퍼 없이 `UnifiedModal` 사용.
- **멀티테넌트**: 모든 API 호출 및 데이터 렌더링 시 `tenantId` 격리 철저 유지.
- **i18n**: 하드코딩된 텍스트(예: "결제 수단 등록", "구독 취소")를 `admin/ko` 키 인벤토리로 이관.

## 5. 단계별 위임 명세 (Delegation Order)

### Phase 1: 디자인 및 UI/UX 설계 (core-designer)
- **예상 소요 시간**: 2~3시간
- **목표**: 권장 옵션(옵션 C)에 따른 화면 설계서 및 와이어프레임 작성.
- **프롬프트 초안**:
  > "테넌트 구독 및 결제 관리 분리를 위한 화면 설계를 진행해 주세요. 
  > 1) 신규 라우트(`/admin/billing`)의 목록 화면은 `AdminCommonLayout`과 `mg-v2-ad-b0kla` 패턴을 적용하세요.
  > 2) 결제 수단 등록 액션은 `UnifiedModal`을 사용하는 UI로 설계하세요.
  > 3) 기존 `SimpleLayout` 기반 디자인을 어드민 표준에 맞게 재구성하세요."

### Phase 2: 프론트엔드 및 라우트 구현 (core-coder)
- **예상 소요 시간**: 4~5시간
- **목표**: 신규 라우트 추가, 컴포넌트 리팩토링 및 API 연동.
- **프롬프트 초안**:
  > "Phase 1의 설계를 바탕으로 코드를 구현해 주세요.
  > 1) `App.js` 및 `ADMIN_ROUTES`에 `/admin/billing` 라우트를 추가하세요.
  > 2) `SubscriptionManagement.js`를 `AdminCommonLayout` 기반으로 리팩토링하세요.
  > 3) `PaymentMethodRegistration.js`를 `UnifiedModal` 내부에서 동작하도록 수정하세요.
  > 4) 모든 하드코딩 문자열을 i18n 키로 추출하고, CSS는 SSOT 토큰을 사용하세요."

### Phase 3: 테스트 및 시각 검수 (core-tester)
- **예상 소요 시간**: 2시간
- **목표**: 신규 라우트 및 모달의 기능, 시각 회귀, 접근성 테스트.
- **프롬프트 초안**:
  > "구현된 구독/결제 관리 기능에 대해 다음을 테스트해 주세요.
  > 1) 라우트 진입 및 `AdminCommonLayout` 렌더링 시각 회귀 검수 (라이트/다크 모드).
  > 2) 결제 수단 등록 `UnifiedModal`의 열기/닫기 흐름 및 PG SDK 호출 모의 테스트.
  > 3) 테넌트 격리(`tenantId`) 데이터 매트릭스 검증 및 a11y 테스트."

### Phase 4: 배포 및 피처 플래그 (core-deployer)
- **예상 소요 시간**: 1시간
- **목표**: 안전한 운영 반영 및 모니터링.
- **프롬프트 초안**:
  > "신규 결제 관리 라우트를 배포하기 위한 플랜을 실행해 주세요.
  > 1) develop 및 main 브랜치에 Feature Flag를 적용하여 점진적 오픈을 준비하세요.
  > 2) PR #26 머지 이후 cutover 플랜을 수립하세요."

## 6. 사용자 컨펜(Confirmation) 필요 질문
작업을 본격적으로 시작하기 전, 다음 항목들에 대한 의사결정이 필요합니다.

1. **분리 전략 결정**: 제안된 옵션 C(목록은 라우트, 액션은 모달)로 진행해도 될까요? 아니면 전체 라우트(옵션 A)나 전체 모달(옵션 B)을 선호하시나요?
2. **LNB 메뉴 위치**: 신규 라우트를 생성할 경우, 좌측 LNB 메뉴의 어느 그룹 하위에 배치할까요? (예: '설정' 하위, 혹은 '결제/구독' 최상위 그룹 신설)
3. **비즈니스 정책**: 기본 결제 수단 지정이나 구독 자동 결제 실패 시의 fallback 정책 등 추가로 고려해야 할 비즈니스 룰이 있나요?
