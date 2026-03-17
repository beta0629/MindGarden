# 배지(Badge) 관련 컴포넌트·사용처 분석 및 공통 배지 모듈 제안

**버전**: 1.0.0  
**작성일**: 2025-03-17  
**작성**: core-component-manager (정리·제안·문서화만, 코드 작성 없음)  
**참조**: `docs/standards/COMMON_MODULES_USAGE_GUIDE.md` §1.5(배지·버튼), `core-solution-atomic-design`, `core-solution-common-modules`

---

## 1. 배지 사용처 파악

`frontend/src` 내 "badge", "Badge", "배지" 관련 컴포넌트·클래스명·CSS 사용처를 정리한 목록입니다. **파일 경로**, **용도(상태/카운트/탭·pill/선택 UI 등)** 로 구분했습니다.

### 1.1 배지 **컴포넌트** (React 컴포넌트)

| 구분 | 파일 경로 | 용도 |
|------|-----------|------|
| **공통(이미 등록)** | `components/common/StatusBadge.js` | 상태 배지 (승인·대기·반려·활성·비활성 등). status→variant 매핑, STATUS_KO 라벨. |
| **공통(이미 등록)** | `components/common/RemainingSessionsBadge.js` | 남은 회기 수 배지. `mg-v2-count-badge` 클래스. |
| **공통(레거시)** | `components/common/NotificationBadge.js` | 알림 개수·모달 연동용. deprecated; 개수만 표시 시 dashboard-v2/atoms 권장. |
| **공통(선택 UI)** | `components/common/BadgeSelect.js` | 배지 형태 단일/다중 선택 (폼·모달). 선택 UI이므로 “표시용 배지”와 별도. |
| **dashboard-v2 Atom** | `components/dashboard-v2/atoms/NotificationBadge.js` | 알림 개수만 표시 (단일 소스 권장). `mg-v2-notification-badge`. |
| **Admin B0KlA** | `components/admin/AdminDashboard/atoms/PipelineStepBadge.js` | 파이프라인 단계별 건수 배지. `pipeline-step-badge`, variant: neutral/warning/success/info. |
| **매핑 re-export** | `components/admin/mapping-management/integrated-schedule/atoms/StatusBadge.js` | common/StatusBadge re-export. **@deprecated** — common 직접 import 권장. |
| **매핑 re-export** | `components/admin/mapping-management/integrated-schedule/atoms/RemainingSessionsBadge.js` | common/RemainingSessionsBadge re-export. **@deprecated**. |
| **도메인 로컬** | `components/erp/refund-management/RefundHistoryTableBlock.js` (내부 `StatusBadge`) | ERP 환불 상태 배지. 로컬 클래스 `refund-management__status-badge`, common 미사용. |
| **도메인 로컬** | `components/billing/SubscriptionManagement.js` (내부 `SubscriptionStatusBadge`) | 구독 상태 배지. 공통코드 기반 라벨·클래스. |
| **도메인** | `components/clinical/RiskAlertBadge.js` | 위험 알림 배지(실시간 AI 알림). 카운트+드롭다운 등 복합 UI. |
| **도메인** | `components/consultant/molecules/FilterBadge.js` | 필터 pill (라벨+카운트, 클릭 시 필터). `mg-v2-filter-badge`. |
| **UI(미사용)** | `components/ui/badge.jsx` | CVA·Tailwind 스타일 Badge. 프로젝트 내 import 없음 — shadcn 스타일 잔여로 추정. |

### 1.2 배지 **CSS 클래스**·인라인 사용처 (컴포넌트가 아닌 클래스/인라인)

| 용도 | 파일 경로 | 클래스/사용 방식 |
|------|-----------|------------------|
| **공통 코드 목록** | `CommonCodeList.js` | `code-group-badge`, `status-badge` (active/inactive). |
| **SimpleLayout GNB** | `SimpleLayout.js` | `notification-badge` (인라인 스타일 없음, SimpleHeader.css 의존). |
| **SimpleHeader** | `SimpleHeader.css` | `.notification-badge`, `.tenant-switch-modal__item-badge`. |
| **내담자 평가** | `RatableConsultationsSection.css` | `.ratable-consultations-badge`. |
| **예측 유사 사례** | `SimilarCasesPanel.css` | `.similarity-badge`, `.outcome-badge`. |
| **대시보드 내담자** | `ConsultantClientSection.js` | `mg-v2-badge` + `getStatusClass()` → `mg-v2-badge-success/warning/secondary/info/danger`. |
| **BadgeSelect** | `BadgeSelect.css` | `.mg-v2-badge-select`, `__item`, `__item--selected` 등 (선택 UI). |
| **SOAP 에디터** | `SOAPNoteEditor.js` | `ai-badge`, `model-badge`, `confidence-badge`, `completion-badge`, `approved-badge`. |
| **AI 모니터링** | `AIMonitoringWidget.js` | `mg-badge`, `mg-badge--error/warning/info/success`, `mg-badge--sm`. |
| **시스템 알림 관리** | `SystemNotificationManagement.css` | `.system-notification-management__badge`, `--success/secondary/warning/danger/primary`. |
| **상담사 대시보드** | `ConsultantDashboard.css` | `.mg-v2-badge`, `--primary/critical/high/medium`. |
| **클라이언트 메시지** | `ClientMessageWidget.js` | `client-message-unread-badge`, `client-message-badge` + colorClass/warning/danger. |
| **웰니스 알림 리스트** | `WellnessNotificationList.js` | `card-badges`, `badge badge-important`, `badge-urgent`, `badge-new`. |
| **상담사 평점** | `ConsultantRatingWidget.js` | `consultant-rating-badge`. |
| **매칭 스케줄** | `IntegratedMatchingSchedule.css` | `integrated-schedule__status-badge`. |
| **웰니스 관리** | `WellnessManagement.css` | `wellness-template-badge`, `--important`. |
| **시스템 알림 위젯** | `SystemNotificationWidget.css` | `system-notification-unread-badge`, `system-notification-badge`, `.important`, `.urgent`. |
| **디자인 시스템** | `mindgarden-design-system.css` | `.mg-card__header .mg-v2-badge`, `mg-v2-filter-search__badge`. |
| **ERD** | `ErdListPage.css` | `erd-status-badge`. |
| **계정 테이블** | `AccountTable.css` | `primary-badge`, 상태 배지. |
| **마크업 샘플** | `admin-notifications-page.html` | `mg-v2-notification-badge`. |
| **ERP 재무** | `FinancialManagement.js` | `mg-erp-filter-badge`, `mg-v2-badge`, `mg-financial-transaction-card__type-badge`, `mg-v2-transaction-detail-badge`, `mg-v2-transaction-detail-consistent-badge`. |
| **대시보드 공통 v3** | `dashboard-common-v3.css` | `mg-grade-badge` (등급: client/consultant/admin). |
| **메시지 위젯** | `MessageWidget.js.js` | `widget-badge`. |
| **일정 등록 위젯** | `ScheduleRegistrationWidget.css` | `today-badge`. |
| **어드민 메시지** | `AdminMessages.css`, `AdminMessageListBlock.js` | `admin-messages__badge`, `mg-v2-badge`, `mg-v2-message-badge`, `mg-v2-badge-warning/danger`. |
| **대시보드 에디터** | `DashboardWidgetEditor.js` | `widget-section-badge`, `widget-specialized-badge` (인라인 style). |
| **KPI·B0KlA** | `AdminDashboardB0KlA.css` | `.mg-v2-badge` (success/warning/info/error/secondary), `.mg-v2-status-badge--*`, `.mg-v2-ad-b0kla__kpi-badge` (--green/orange/blue). |
| **세션 프로필** | `SessionUserProfile.css` | `image-type-badge`. |
| **메뉴 권한 UI** | `MenuPermissionManagementUI.css` | `mg-badge`, `mg-role-badge`, location/role 배지. |
| **환불 관리** | `RefundManagement.css` | `refund-management__status-badge`, `--success/warning/danger/neutral`. |
| **인지 왜곡** | `CognitiveDistortionPanel.css` | `score-badge`, `count-badge`, `severity-badge`. |
| **클라이언트 카드** | `ClientCard.js` (ui/Card) | `mg-client-card__status-badge`, `--${getStatusClass()}`. |
| **ERP 통합 재무** | `IntegratedFinanceDashboard.css` | `finance-badge`, `finance-mapping-badge`. |
| **일정 페이지** | `SchedulePage.js` | `role-badge`. |
| **디자인 가이드 샘플** | `DashboardDesignGuideSample.css` | `notification-badge`. |
| **unified-design-tokens** | `unified-design-tokens.css` | `.mg-badge`, `.mg-v2-badge`, `.mg-v2-status-badge` 등 전역 토큰. |

---

## 2. 중복·일관성 분석

### 2.1 동일·유사 역할의 배지가 여러 곳에 흩어진 사례

- **상태 배지**
  - **공통**: `StatusBadge` (common) + `StatusBadge.css` (variant 기반).
  - **중복**: `RefundHistoryTableBlock` 내부 로컬 `StatusBadge` (`refund-management__status-badge`), ERP 환불 테이블만 별도 스타일.
  - **중복**: `SubscriptionStatusBadge` (billing 내부) — 상태 라벨+클래스만 다르고 역할은 StatusBadge와 유사.
  - **중복**: 여러 화면에서 `getStatusBadge`/`renderStatusBadge` 같은 **인라인 함수**로 `<span className="...">` 렌더 (PgConfigurationDetail, TenantProfile, PgConfigurationList, ConsultationHistory, ResponsiveDataTable, DataTableSample, PaymentManagement 등). 이들은 공통 `StatusBadge`로 치환 가능.

- **알림·메시지 개수 배지**
  - **권장 단일 소스**: `dashboard-v2/atoms/NotificationBadge.js` (count prop).
  - **레거시**: `common/NotificationBadge.js` (deprecated, 모달 연동).
  - **별도 구현**: `SimpleLayout.js` — `notification-badge` 클래스로 직접 스팬 렌더. NotificationBadge 컴포넌트 미사용.

- **메시지/알림 타입·중요도 배지 (중요/긴급/NEW)**
  - **AdminMessageListBlock**: `mg-v2-badge`, `mg-v2-message-badge`, `mg-v2-badge-warning`, `mg-v2-badge-danger`.
  - **WellnessNotificationList**: `badge badge-important`, `badge-urgent`, `badge-new` (다른 네이밍·스타일).
  - **ClientMessageWidget**: `client-message-badge` + colorClass, `warning`, `danger`.
  - **SystemNotificationWidget**: `system-notification-badge`, `.important`, `.urgent`.
  → 동일 의미(중요/긴급/신규)인데 **스타일·클래스가 화면마다 상이**.

- **KPI·숫자 강조 배지**
  - **B0KlA**: `mg-v2-ad-b0kla__kpi-badge` (--green/orange/blue).
  - **PipelineStepBadge**: `pipeline-step-badge` (숫자+라벨, variant).
  - **등급**: `mg-grade-badge` (dashboard-common-v3).
  → “숫자+색상 강조” 역할은 비슷하나 컴포넌트/클래스가 각각 다름.

- **필터·pill 형태**
  - **BadgeSelect**: 선택용 칩 (common).
  - **FilterBadge**: 필터 pill (라벨+카운트, consultant).
  - **ERP**: `mg-erp-filter-badge`, `mg-erp-filter-badge--selected`.
  → “pill 형태”는 맞지만 **선택 UI( BadgeSelect )** vs **필터 토글( FilterBadge/ERP )** 로 용도가 다름. 공통 “표시용 배지”와는 구분.

### 2.2 스타일(색상·크기·모양)이 화면/컴포넌트마다 다르게 적용된 사례

- **상태 색상**: StatusBadge는 `--mg-badge-status-*` 토큰 사용. RefundManagement·SubscriptionStatusBadge·각 CSS는 로컬 클래스로 별도 색상 정의 → **시맨틱은 같고 값이 다를 수 있음**.
- **메시지/알림 “중요·긴급”**: AdminMessageListBlock은 `mg-v2-badge-*`, WellnessNotificationList은 `badge-important/urgent/new`, SystemNotificationWidget은 `system-notification-badge.important/urgent` → **클래스명·배치·크기 불일치**.
- **배지 크기**: `mg-badge--sm` (AIMonitoringWidget), `mg-v2-badge` (여러 곳), `pipeline-step-badge` 등 → **size/variant 체계가 한 곳에 정리되어 있지 않음**.

### 2.3 리스트/탭 이동 시 배지가 나오는 화면과 사용 방식 요약

| 화면/블록 | 배지가 나오는 위치 | 현재 사용 방식 |
|-----------|--------------------|----------------|
| **어드민 대시보드 B0KlA** | KPI 카드, 매칭 리스트 상태, 파이프라인 단계 | B0KlA CSS `.mg-v2-badge`, `.mg-v2-ad-b0kla__kpi-badge`, PipelineStepBadge, StatusBadge(common). |
| **어드민 알림/메시지** | LNB 메뉴 알림 개수, 메시지 리스트 탭, 메시지 상세 모달 | NotificationBadge(dashboard-v2), AdminMessageListBlock에서 `mg-v2-badge`, BadgeSelect(필터). |
| **SimpleLayout (GNB)** | 알림 아이콘 옆 개수 | 인라인 `<span className="notification-badge">`. 공통 NotificationBadge 미사용. |
| **시스템 알림 위젯/관리** | 위젯 내 미읽음 개수, 리스트 항목 중요/긴급 | 로컬 CSS `system-notification-unread-badge`, `system-notification-badge`. |
| **웰니스 알림 리스트** | 카드별 중요/긴급/NEW | 로컬 클래스 `badge badge-important/urgent/new`. |
| **클라이언트 메시지 위젯** | 미읽음 개수, 메시지 타입·중요/긴급 | 로컬 `client-message-unread-badge`, `client-message-badge`. |
| **ERP 재무/환불** | 필터 pill, 거래 타입, 환불 상태 | `mg-erp-filter-badge`, `mg-v2-badge`, 로컬 `RefundHistoryTableBlock` StatusBadge. |
| **매칭/매핑** | 카드·리스트 상태, 남은 회기 | StatusBadge·RemainingSessionsBadge(common). |

---

## 3. 공통 배지 모듈 제안

### 3.1 배치 경로 제안

- **권장 위치**: `frontend/src/components/common/atoms/` 또는 **기존 common 직하위**에 **단일 Atom “Badge”** 를 두는 방안을 제안합니다.
  - **이유**: COMMON_MODULES_USAGE_GUIDE §1.5에는 이미 StatusBadge, RemainingSessionsBadge, NotificationBadge가 **공통 모듈**로 나열되어 있음. 아토믹 디자인상 배지는 Atom에 해당하며, `common/` 또는 `common/atoms/` 가 프로젝트의 공통 Atom 배치 규칙과 맞음 (COMPONENT_STRUCTURE_STANDARD, atomic-design 스킬).
  - **선택지**:
    - **A안**: **공통 “Badge” Atom 하나**를 `components/common/atoms/Badge.js` (또는 `components/common/Badge.js`)에 두고, **variant**로 status/count/tab/kpi 등을 구분. 기존 StatusBadge, RemainingSessionsBadge, NotificationBadge는 **내부에서 이 Badge를 참조**하거나, **점진적으로 이 Badge 기반으로 리팩터**하여 “통합·확장” 형태로 간다.
    - **B안**: 기존 StatusBadge, RemainingSessionsBadge, NotificationBadge는 **그대로 두고**, **새 공통 Atom “Badge”**만 추가. “표시용 배지”가 필요한 신규/기타 화면은 이 Badge만 사용하고, 기존 3종은 “도메인별 래퍼”로 유지 (별도 Atom으로 두고 이들이 내부에서 공통 Badge를 참조할지 여부는 Phase 2에서 결정).
  - **제안**: **B안**으로 진행하고, **공통 Badge 경로**는 `components/common/Badge.js` (또는 `components/common/atoms/Badge.js` 로 구조 정리 시)로 두는 것을 권장. COMMON_MODULES_USAGE_GUIDE §1.5와의 충돌을 피하려면 “공통 배지 모듈”은 **기존 StatusBadge·RemainingSessionsBadge·NotificationBadge를 대체하기보다**, **공통 스타일·variant를 가진 Atom 하나**를 추가한 뒤, §1.5에는 “상태용은 StatusBadge, 회기용은 RemainingSessionsBadge, 알림 개수용은 NotificationBadge(dashboard-v2) 권장. 그 외 일반 표시용 배지는 common/Badge(variant) 사용”으로 문구를 보강하는 쪽이 자연스럽습니다.  
  - **통합 확장**을 나중에 할 경우: StatusBadge/RemainingSessionsBadge/NotificationBadge를 **내부적으로 common/Badge를 쓰는 래퍼**로 바꾸면, 스타일 일원화와 중복 제거에 유리합니다.

### 3.2 variant 구분 제안

공통 Badge Atom에 **variant**를 두었을 때의 제안입니다.

| variant | 용도 | 필요한 props·스타일 차이 (요약) |
|---------|------|----------------------------------|
| **status** | 상태 표시 (승인/대기/반려/활성 등) | `variant`: success/warning/neutral/danger/info. children 또는 `label`. StatusBadge와 동일 시맨틱. |
| **count** | 숫자 강조 (알림 개수, 남은 회기 등) | `count` 또는 `value`. 99+ 캡. 작은 원형/pill. NotificationBadge·RemainingSessionsBadge 스타일 통합 가능. |
| **tab / pill** | 탭·필터 pill (선택 가능 여부는 상위 컴포넌트 책임) | `label`, 선택 시 `selected` 스타일. FilterBadge·ERP filter badge와 시각적 일관성만 확보할 수 있는 수준 제안. |
| **kpi** | KPI·숫자 강조 (B0KlA KPI, 파이프라인 단계 등) | `value`, `label`(선택), `variant`: green/orange/blue 또는 success/warning/info. B0KlA `mg-v2-ad-b0kla__kpi-badge`·PipelineStepBadge와 유사. |

- **size**: `sm` / `default` / `lg` 등 한 가지 축으로 통일하면, `mg-badge--sm` 등 기존 사용처와 정리 시 매핑하기 쉬움.

### 3.3 BadgeSelect와의 관계

- **BadgeSelect**는 “선택 UI”(폼 컨트롤)이므로 **표시 전용 배지 Atom과 역할이 다름**. 별도 컴포넌트로 유지하는 것이 맞습니다.
- **제안**: BadgeSelect는 그대로 두고, **내부에서 공통 Badge Atom을 사용할지는 선택 사항**입니다. BadgeSelect의 “선택된/선택 안 된” pill은 현재 `mg-v2-badge-select__item` 등으로 스타일이 정해져 있으므로, 공통 Badge를 참조하면 “선택 가능한 pill”용 variant를 Badge에 추가해 일관된 기본형만 쓰는 방식으로 확장할 수 있습니다. **요약**: BadgeSelect는 배지 모듈과 별도 유지, 필요 시 내부에서 공통 Badge 참조 가능(옵션).

---

## 4. 적용 대상 화면·리스트/탭 목록

아래는 **공통 배지 모듈(공통 Badge Atom + 기존 StatusBadge/RemainingSessionsBadge/NotificationBadge 정리)** 을 적용할 **대상 화면·리스트·탭**과, **현재 사용 방식** vs **적용 후 기대**를 1문장씩 요약한 목록입니다.

| 대상 | 현재 사용 방식 | 적용 후 기대 |
|------|----------------|--------------|
| **어드민 대시보드 B0KlA** | B0KlA 전용 CSS `.mg-v2-badge`, `mg-v2-ad-b0kla__kpi-badge`, PipelineStepBadge, StatusBadge(common) 혼용. | KPI·단계 숫자는 공통 Badge variant=kpi 사용; 상태는 계속 StatusBadge(common) 사용. 스타일은 디자인 토큰으로 공통 Badge와 정렬. |
| **어드민 알림/메시지 (LNB·리스트·탭)** | NotificationBadge(dashboard-v2), AdminMessageListBlock에서 `mg-v2-badge`, `mg-v2-message-badge`, warning/danger. | 알림 개수는 NotificationBadge 유지; 메시지 타입·중요/긴급은 공통 Badge variant=status 또는 동일 스타일 토큰 사용으로 통일. |
| **SimpleLayout GNB 알림** | `<span className="notification-badge">` 직접 렌더. | NotificationBadge(dashboard-v2) 컴포넌트 사용으로 통일. |
| **시스템 알림 위젯/관리** | 로컬 `system-notification-unread-badge`, `system-notification-badge`. | 미읽음 개수·항목 중요/긴급을 공통 Badge(count/status) 또는 NotificationBadge·StatusBadge로 통일. |
| **웰니스 알림 리스트** | `badge badge-important/urgent/new`. | 공통 Badge variant=status 또는 동일 시맨틱 variant로 교체하여 스타일 일관. |
| **클라이언트 메시지 위젯** | `client-message-unread-badge`, `client-message-badge` + colorClass. | 미읽음은 count 배지, 타입/중요/긴급은 공통 Badge(또는 StatusBadge) 사용. |
| **ERP 재무/환불** | `mg-erp-filter-badge`, 로컬 RefundHistoryTableBlock StatusBadge, 거래 타입 배지. | 필터 pill은 Badge variant=tab 또는 기존 BadgeSelect/필터 전용 유지; 환불 상태는 common StatusBadge로 교체; 거래 타입은 공통 Badge variant=status 적용. |
| **매칭/매핑 리스트·카드** | 이미 StatusBadge·RemainingSessionsBadge(common) 사용. | 유지. 필요 시 두 컴포넌트 내부를 공통 Badge 기반으로 리팩터. |
| **구독 관리(빌링)** | 내부 SubscriptionStatusBadge. | 공통 StatusBadge 또는 공통 Badge variant=status로 점진 교체 가능. |
| **기타 인라인 getStatusBadge/ renderStatusBadge** | PgConfigurationDetail, TenantProfile, ConsultationHistory, PaymentManagement 등. | 해당 위치에서 common StatusBadge 컴포넌트 사용으로 통일. |

---

## 5. 요약

- **사용처**: 배지 관련 컴포넌트는 common(StatusBadge, RemainingSessionsBadge, NotificationBadge, BadgeSelect), dashboard-v2(NotificationBadge), admin(PipelineStepBadge), 그 외 **로컬/인라인 배지**가 다수 존재합니다. CSS 클래스만 쓰는 사용처는 40곳 이상으로 분포합니다.
- **중복**: 상태 배지(RefundHistoryTableBlock, SubscriptionStatusBadge, 인라인 getStatusBadge), 알림·메시지 “중요/긴급/NEW”(AdminMessageListBlock, WellnessNotificationList, ClientMessageWidget, SystemNotificationWidget), KPI·pill 형태가 **역할은 비슷한데 구현·클래스가 제각각**입니다.
- **공통 모듈 제안**: **공통 Badge Atom**을 `components/common/Badge.js`(또는 `components/common/atoms/Badge.js`)에 두고, variant로 **status / count / tab / kpi** 를 구분. 기존 StatusBadge·RemainingSessionsBadge·NotificationBadge는 COMMON_MODULES_USAGE_GUIDE §1.5와 맞춰 **유지**하되, 필요 시 이들이 **내부에서 공통 Badge를 참조**하도록 통합·확장. BadgeSelect는 “선택 UI”로 별도 유지하고, 필요 시 내부에서만 공통 Badge 참조 검토.
- **적용 대상**: 어드민 B0KlA, 알림/메시지 리스트·탭, SimpleLayout GNB, 시스템 알림 위젯·관리, 웰니스 알림, 클라이언트 메시지 위젯, ERP 재무/환불, 구독 관리, 기타 인라인 상태 배지 사용처에 공통 Badge·StatusBadge·NotificationBadge 적용을 단계적으로 진행할 수 있습니다.

**다음 단계**: 기획·사용자 확인 후 **core-coder**가 (1) 공통 Badge Atom 추가, (2) 적용 대상 화면별로 기존 배지 → 공통 모듈 전환, (3) COMMON_MODULES_USAGE_GUIDE §1.5 및 COMPONENT_COMMONIZATION_CANDIDATES 갱신을 수행하고, 필요 시 **core-component-manager**가 본 제안서·인벤토리를 갱신하면 됩니다.

---

## 6. Phase 3·4 적용 완료 (2026-03-17)

- **Phase 3**: 시스템 알림 위젯(`SystemNotificationWidget`), 시스템 공지 목록(`SystemNotificationListBlock`), 웰니스 알림 리스트(`WellnessNotificationList`), 클라이언트 메시지 위젯(`ClientMessageWidget`), ERP 환불 이력(`RefundHistoryTableBlock`, `RefundHistoryTable`), ERP 재무(`FinancialManagement`)에서 로컬 배지를 **common Badge/StatusBadge** 또는 **Badge variant=count** 로 교체 완료.
- **Phase 4**: 구독 관리(`SubscriptionManagement`) 내부 `SubscriptionStatusBadge` 제거 후 **common StatusBadge** 사용. 인라인 `getStatusBadge`/`renderStatusBadge` 사용처를 **common StatusBadge** 로 치환: `PgConfigurationList`, `TenantProfile`, `ConsultationHistory`, `PaymentManagement`(super-admin), `ResponsiveDataTable`, `ErdListPage`, `ErdDetailPage` 등.
- **문서**: `docs/standards/COMMON_MODULES_USAGE_GUIDE.md` §1.5에 Phase 3·4 적용 범위 반영.
