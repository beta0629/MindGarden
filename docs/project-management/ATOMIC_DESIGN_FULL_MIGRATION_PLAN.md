# 아토믹 디자인·common 통합 풀 마이그레이션 계획

**작성일**: 2025-03-14  
**목표**: 배지/버튼/카드 비준수 컴포넌트를 common 기준으로 통합, 아토믹 디자인 체계로 일원화  
**참조**: `COMMON_UI_ENCAPSULATION_PLAN.md`, `COMMON_UI_IMPLEMENTATION_SPEC.md`, `CARD_VISUAL_UNIFIED_SPEC.md`

---

## 1. 현황 요약

### 1.1 배지 (Badge) — 비준수 패턴 및 파일 수

| 패턴 | 파일 수 | 주요 파일 |
|------|---------|-----------|
| `status-badge` (자체 정의) | 15+ | ConsultationHistory, ConsultantRecords, PgConfigurationList, PgConfigurationDetail, ConsultationHistory, TenantProfile, CommonCodeList, TenantCodeManagement, ComplianceDashboard, SmartNoteTab, AdvancedDesignSample, PrivacyConsentSection |
| `mg-v2-status-badge` (클래스 직접 사용) | 12+ | ClientMappingTab, ClientOverviewTab, ConsultantComprehensiveManagement, StaffManagement, MappingCard, MappingPartiesRow, ConsultantClientList, consultant/molecules/ClientCard |
| `mg-status-badge` | 4 | unified-design-tokens.css, TenantCommonCodeManagerUI, ConsultantComprehensiveManagement |
| `mg-consultant-card__status-badge`, `mg-client-card__status-badge` | 5+ | ConsultantCard, ClientCardShowcase, ConsultantCardShowcase, ScheduleB0KlA, unified-design-tokens.css |
| 기타 (consultant-client-status-badge, transfer-status-badge, schedule-status-badge 등) | 10+ | ConsultantClientWidget, ConsultationRecordSection, ScheduleCard, WelcomeSection 등 |

**common StatusBadge 사용처(완료)**: CardMeta (integrated-schedule) — 1곳  
**common RemainingSessionsBadge 사용처(완료)**: CardMeta (integrated-schedule) — 1곳

---

### 1.2 버튼 (Button) — 비준수 패턴 및 파일 수

| 패턴 | 파일 수 | 주요 파일 |
|------|---------|-----------|
| `mg-v2-button` (클래스 직접 사용) | 40+ | TaxDetailsModal, ConsultantComprehensiveManagement, MappingEditModal, SessionExtensionModal, MappingDetailModal, ClientPaymentHistory, UserManagement, MappingListSection, MappingContentHeader, ConfirmModal, ConsultationGuideModal, ClientModal, VacationModal, ClientFilters, RatableConsultationsSection 등 |
| `MGButton` import (활성) | 15+ | MappingEditModal, MatchQueueRow, DepositPendingList, PsychDocumentListBlock, AccountForm, IntegratedFinanceDashboard, ErpButton, QuickExpenseForm, PsychAssessmentAdminWidget, ClientModal, CacheMonitoringDashboard, SchedulePendingList 등 |
| `MGButton` 임시 비활성화 | 10+ | MappingFilters, TenantProfile, CourseList, ClassForm, AdminDashboard, ClientFilters, DashboardManagement 등 |
| `btn-success` (Bootstrap/자체) | 4 | ScheduleModal, PaymentManagement, constants/mapping.js, Test/PaymentTest |
| `integrated-schedule__btn-*` | 1 | IntegratedMatchingSchedule.css (필터 버튼) |

**common ActionButton 사용처(완료)**: IntegratedMatchingSchedule (신규 매칭 버튼), integrated-schedule molecules/CardActionGroup — 2곳

---

### 1.3 카드 (Card) — 비준수 패턴 및 파일 수

| 패턴 | 파일 수 | 주요 파일 |
|------|---------|-----------|
| `mg-v2-card` 직접 사용 | 30+ | MappingCard, ConsultantMessageScreen, ClientStatisticsTab, UserManagement, ConsultantClientSection, Homepage, ConsultationRecordSection, SessionManagement, ErpCard, AdminDashboard, DiscountPaymentConfirmationModal, WelcomeSection 등 |
| `mg-v2-content-card`, `mg-v2-mapping-card` | 10+ | MappingCard, MappingListSection, ClientMappingTab, IntegratedMatchingSchedule |
| `content-card`, `mg-v2-card-container` | 2 | MappingListSection, CardContainer (common) |

**common CardContainer 사용처(완료)**: MappingScheduleCard — 1곳  
**common CardActionGroup 사용처(완료)**: MappingScheduleCard (molecules/CardActionGroup 래핑) — 1곳

---

## 2. Phase별 마이그레이션 계획

### Phase 1: 매칭·통합스케줄 (완료/진행중)

| 항목 | 상태 | 비고 |
|------|------|------|
| MappingScheduleCard | ✅ 완료 | CardContainer, StatusBadge, RemainingSessionsBadge, CardActionGroup(ActionButton) 사용 |
| IntegratedMatchingSchedule | ✅ 신규 매칭 버튼 | ActionButton 사용 |
| CardMeta, CardActionGroup (integrated molecules) | ✅ 완료 | common에서 import |
| fc-event 분리 | 🔄 진행중 | `INTEGRATED_SCHEDULE_CARD_DESIGN_PLAN` 참조 — fc-event → integrated-schedule__card--draggable |
| IntegratedMatchingSchedule.css | 🔄 잔여 | `integrated-schedule__status-badge`, `integrated-schedule__status-btn` 필터 UI — 필요 시 StatusBadge variant 적용 검토 |

---

### Phase 2: ClientMappingTab, MappingCard, MappingDetailModal, MappingListRow, MappingTableView 등

| 대상 | 교체 대상 | 권장 common 컴포넌트 | 우선순위 |
|------|------------|---------------------|----------|
| **ClientMappingTab** | `mg-v2-status-badge` 인라인 span, `MAPPING_STATUS_COLOR_MAP`·`getMappingStatusVariant` | StatusBadge (status prop) | P0 |
| **ClientMappingTab** | `mg-v2-card mg-v2-mapping-card` 직접 div | CardContainer + className modifier | P0 |
| **MappingCard** (mapping) | `mg-v2-status-badge`, `mg-v2-content-card` | StatusBadge, CardContainer | P0 |
| **MappingListSection** | 네이티브 `<button className="mg-v2-button...">` | ActionButton | P0 |
| **MappingListRow** | 카드 스타일 (border, radius 등) | CardContainer 또는 공통 클래스 | P1 |
| **MappingListBlock** | 카드 영역 | CardContainer | P1 |
| **MappingDetailModal** | 버튼 | ActionButton | P1 |
| **MappingContentHeader** | 버튼 | ActionButton | P1 |
| **MappingEditModal** | MGButton, mg-v2-button | ActionButton | P1 |

---

### Phase 3: tenant (PgConfiguration, TenantProfile), dashboard, consultant

| 대상 | 교체 대상 | 권장 common 컴포넌트 | 우선순위 |
|------|------------|---------------------|----------|
| **PgConfigurationList** | `.status-badge`, `status-badge--success` 등 | StatusBadge | P1 |
| **PgConfigurationDetail** | 동일 | StatusBadge | P1 |
| **TenantProfile** | `tenant-status-badge`, MGButton | StatusBadge, ActionButton | P1 |
| **ConsultantComprehensiveManagement** | `mg-v2-status-badge`, `mg-v2-button` | StatusBadge, ActionButton | P1 |
| **consultant/molecules/ClientCard** | `mg-v2-status-badge--active` 등 | StatusBadge | P1 |
| **Dashboard widgets** | mg-v2-card, mg-v2-button | CardContainer, ActionButton | P2 |
| **AdminDashboard** | mg-v2-card, MGButton | CardContainer, ActionButton | P2 |
| **ConsultantRecordSection** | mg-v2-button, mg-v2-card | ActionButton, CardContainer | P2 |

---

### Phase 4: erp, client, auth, 기타

| 대상 | 교체 대상 | 권장 common 컴포넌트 | 우선순위 |
|------|------------|---------------------|----------|
| **ERP (ErpButton, ErpCard)** | MGButton, mg-v2-card | ActionButton, CardContainer | P2 |
| **IntegratedFinanceDashboard** | MGButton, 인라인 mg-v2-button | ActionButton | P2 |
| **ClientPaymentHistory** | mg-v2-button | ActionButton | P2 |
| **UserManagement** | mg-v2-button | ActionButton | P2 |
| **ConsultationHistory** | status-badge | StatusBadge | P2 |
| **ComplianceDashboard** | status-badge | StatusBadge | P2 |
| **Bootstrap btn-success** | ScheduleModal, PaymentManagement | ActionButton variant="success" | P2 |
| **constants/mapping.js** | `className: 'btn-success'` | ActionButton 또는 statusInfo 표준화 | P2 |

---

## 3. 파일별 액션

### 3.1 Phase 2 상세

| 파일 | 교체 대상 클래스/코드 | 권장 common | 담당 |
|------|----------------------|-------------|------|
| `ClientMappingTab.js` | `MAPPING_STATUS_COLOR_MAP`, `getMappingStatusVariant`, inline span `mg-v2-status-badge` | StatusBadge | core-coder |
| `ClientMappingTab.js` | `mg-v2-card mg-v2-mapping-card` 루트 div | CardContainer | core-coder |
| `ClientMappingTab.css` | `.mg-v2-mapping-client-block .mg-v2-card.mg-v2-mapping-card` 오버라이드 | CardContainer modifier로 통합 | core-coder |
| `mapping/MappingCard.js` | `mg-v2-status-badge`, `mg-v2-content-card` | StatusBadge, CardContainer | core-coder |
| `MappingListSection.js` | `<button className="mg-v2-button...">` | ActionButton | core-coder |
| `MappingListRow.js` | 카드 스타일 | CardContainer 또는 수치 통일 | core-coder |
| `MappingDetailModal.js` | mg-v2-button | ActionButton | core-coder |
| `MappingContentHeader.js` | mg-v2-button | ActionButton | core-coder |
| `MappingEditModal.js` | MGButton, mg-v2-button | ActionButton | core-coder |

### 3.2 Phase 3 상세

| 파일 | 교체 대상 | 권장 common | 담당 |
|------|-----------|-------------|------|
| `PgConfigurationList.js` | status-badge 인라인 | StatusBadge | core-coder |
| `PgConfigurationList.css` | .status-badge* | StatusBadge 사용 시 제거 또는 최소화 | core-coder |
| `PgConfigurationDetail.js` | status-badge 인라인 | StatusBadge | core-coder |
| `TenantProfile.js` | tenant-status-badge, MGButton | StatusBadge, ActionButton | core-coder |
| `ConsultantComprehensiveManagement.js` | mg-v2-status-badge, mg-v2-button | StatusBadge, ActionButton | core-coder |
| `consultant/molecules/ClientCard.js` | mg-v2-status-badge | StatusBadge | core-coder |

### 3.3 Phase 4 상세 (대표)

| 파일 | 교체 대상 | 권장 common | 담당 |
|------|-----------|-------------|------|
| `ErpButton.js` | MGButton 래핑 | ActionButton로 대체 또는 내부 전환 | core-coder |
| `IntegratedFinanceDashboard.js` | MGButton | ActionButton | core-coder |
| `ClientPaymentHistory.js` | mg-v2-button | ActionButton | core-coder |
| `UserManagement.js` | mg-v2-button | ActionButton | core-coder |
| `ConsultationHistory.js` | status-badge | StatusBadge | core-coder |
| `constants/mapping.js` | className: 'btn-success' | statusInfo 또는 ActionButton | core-coder |

---

## 4. 리스크·제약

| 항목 | 내용 |
|------|------|
| **B0KlA 스코프** | AdminDashboardB0KlA.css 등 `.mg-v2-ad-b0kla` 스코프 내 버튼·배지 오버라이드 유지. common 컴포넌트가 B0KlA 토큰과 호환되어야 함. |
| **레거시 유지 영역** | FullCalendar `fc-event`, Bootstrap `btn` 일부 페이지(ScheduleModal, PaymentManagement 등) — 점진적 교체, 급격한 제거 금지. |
| **MGButton 임시 비활성화** | 10+ 파일에서 `// import MGButton` 등 비활성화된 상태. ActionButton 확정 후 해당 import 제거 및 ActionButton 교체 순차 진행. |
| **토큰 일관성** | `unified-design-tokens.css`의 `--mg-*` 변수만 사용. hex 하드코딩 금지. |
| **MAPPING_STATUS_* 중복** | ClientMappingTab, constants, utils 등 여러 곳에 상태→색상/라벨 매핑 존재. StatusBadge의 STATUS_KO·variant 체계로 통합 권장. |
| **fc-event 분리** | Phase 1 미완료 시 통합 스케줄 카드 border 등 시각 불일치 가능. 우선 fc-event 분리 완료 후 Phase 2 진행 권장. |

---

## 5. 체크리스트·완료 기준

### Phase 1
- [x] MappingScheduleCard → CardContainer, StatusBadge, RemainingSessionsBadge, CardActionGroup 사용
- [x] IntegratedMatchingSchedule → ActionButton (신규 매칭) 사용
- [ ] fc-event → integrated-schedule__card--draggable 전환
- [ ] 통합 스케줄 사이드바 카드 시각 통일 검증

### Phase 2
- [ ] ClientMappingTab → StatusBadge, CardContainer
- [ ] MappingCard → StatusBadge, CardContainer
- [ ] MappingListSection → ActionButton
- [ ] MappingDetailModal, MappingContentHeader, MappingEditModal → ActionButton
- [ ] MappingListRow, MappingListBlock → 카드 시각 통일 (CardContainer 또는 수치 일치)

### Phase 3
- [ ] PgConfigurationList, PgConfigurationDetail → StatusBadge
- [ ] TenantProfile → StatusBadge, ActionButton
- [ ] ConsultantComprehensiveManagement → StatusBadge, ActionButton
- [ ] consultant/molecules/ClientCard → StatusBadge

### Phase 4
- [ ] ERP, Client, UserManagement 등 주요 화면 → ActionButton, StatusBadge
- [ ] constants/mapping.js btn-success 제거
- [ ] Bootstrap btn-success 사용처 ActionButton으로 교체

### 전역
- [ ] MGButton vs ActionButton 사용처 1곳(ActionButton)으로 수렴
- [ ] status-badge·mg-v2-status-badge 직접 사용 → StatusBadge 컴포넌트로 수렴
- [ ] mg-v2-card/mg-v2-mapping-card 직접 div → CardContainer(필요 시) 또는 통일 수치 적용
- [ ] docs/README.md, COMMON_UI_ENCAPSULATION_PLAN.md 갱신

---

## 6. 분배실행 (실행 분배표)

| Phase | subagent_type | 전달할 태스크 설명 요약 |
|-------|---------------|-------------------------|
| **1 잔여** | **core-coder** | `INTEGRATED_SCHEDULE_CARD_DESIGN_PLAN.md` 참조. fc-event → integrated-schedule__card--draggable 전환, Draggable itemSelector 업데이트. CARD_VISUAL_UNIFIED_SPEC 시각 통일. |
| **2** | **core-coder** | ClientMappingTab: MAPPING_STATUS_COLOR_MAP 제거, StatusBadge status prop 사용. mg-v2-card → CardContainer. MappingListSection: button → ActionButton. MappingCard: StatusBadge, CardContainer. MappingDetailModal 등 버튼 → ActionButton. `/core-solution-frontend`, COMMON_UI_IMPLEMENTATION_SPEC 참조. |
| **3** | **core-coder** | PgConfigurationList/Detail, TenantProfile, ConsultantComprehensiveManagement, consultant/molecules/ClientCard → StatusBadge, ActionButton 교체. |
| **4** | **core-coder** | Erp, Client, UserManagement, ConsultationHistory 등 → ActionButton, StatusBadge. constants/mapping.js btn-success 제거. Bootstrap btn-success → ActionButton. |
| **문서** | **generalPurpose** | `/core-solution-documentation` 적용. COMMON_UI_ENCAPSULATION_PLAN.md 갱신, docs/README.md 인덱스 반영. |

**실행 순서**: Phase 1 잔여 → Phase 2 → Phase 3 → Phase 4 → 문서.

---

## 7. 참조 문서

- `docs/project-management/COMMON_UI_ENCAPSULATION_PLAN.md`
- `docs/design-system/v2/COMMON_UI_IMPLEMENTATION_SPEC.md`
- `docs/design-system/v2/COMMON_UI_ENCAPSULATION_DESIGN_REVIEW.md`
- `docs/design-system/v2/CARD_VISUAL_UNIFIED_SPEC.md`
- `docs/project-management/INTEGRATED_SCHEDULE_CARD_DESIGN_PLAN.md`
- `frontend/src/styles/unified-design-tokens.css`
- `.cursor/skills/core-solution-atomic-design/SKILL.md`
- `.cursor/skills/core-solution-frontend/SKILL.md`

---

**문서 버전**: 1.0
