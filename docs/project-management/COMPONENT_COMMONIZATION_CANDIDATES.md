# 공통화 후보 컴포넌트 목록

**문서 역할**: 공통화(추출·재사용) 가능한 컴포넌트 후보를 유지·관리하고, Phase 배정·우선순위 결정을 기획에 위임하기 위한 문서.

**최종 업데이트**: 2025-03-17  
**작성**: core-component-manager (목록·제안만, 코드 수정 없음)

---

## 기획 위임

**기획 위임: 목록 검토·Phase 배정·우선순위 결정 요청**

- 본 목록을 **코어 플래너(core-planner)**가 검토하여 공통화 Phase를 설계하고, Phase별 담당(core-coder, core-component-manager 등)을 배정해 주세요.
- 우선순위(높음/중간/낮음)는 비즈니스 영향도·중복 규모·마이그레이션 비용을 고려해 기획에서 결정해 주세요.
- Phase 확정 후 **core-coder**가 실제 코드 이동·통합·배치를 수행하고, 필요 시 component-manager가 본 문서를 갱신합니다.

---

## 1. 모달 (Modal)

| 컴포넌트/파일 경로 | 현재 사용처 | 공통화 시 기대 효과 | 우선순위 |
|-------------------|-------------|----------------------|----------|
| **common/ConfirmModal.js** vs **common/modals/ConfirmModal.js** | SimpleHeader, WellnessManagement, FinancialManagement, EventModal, HeaderWidget 등에서 `common/ConfirmModal` 사용; modals/ConfirmModal은 직접 사용처 적음 | 확인 모달 단일 구현으로 유지보수·동작 일치; modals/ConfirmModal 제거 또는 common/ConfirmModal이 re-export 하도록 통합 | 높음 |
| **common/CompactConfirmModal.js** | SimpleHamburgerMenu | ConfirmModal과 props/UX 통일 시 하나로 통합 가능(옵션: size="compact") | 중간 |
| **ui/Modal/Modal.js** | ui export, 일부 테스트/스토리 | 표준은 UnifiedModal이므로, ui/Modal을 UnifiedModal re-export 또는 deprecated 처리하여 단일 진입점 유지 | 높음 |
| **common/MGModal.js**, **MGConfirmModal** | AdvancedDesignSample 등 | UnifiedModal + variant로 흡수 가능; MG* 모달 사용처 마이그레이션 후 제거 | 중간 |
| **erp/common/ErpModal.js** | SalaryConfigModal, ConsultantProfileModal, ItemManagement, FinancialTransactionForm, SuperAdminApprovalDashboard | 이미 UnifiedModal 래퍼이므로 유지. ERP 전용 size/className 기본값만 두고, 추가 공통화 불필요 | 낮음 |
| **ConsultantApplicationModal.js** | Bootstrap `Modal` 사용 | UnifiedModal 기반으로 마이그레이션 시 B0KlA·디자인 시스템 일치 | 중간 |
| **도메인별 콘텐츠 모달** (ClientModal, ScheduleDetailModal, MappingDetailModal, SalaryConfigModal, TaxDetailsModal 등) | 각 도메인 페이지 | 콘텐츠는 도메인 유지, **쉘은 모두 UnifiedModal** 사용으로 통일(core-solution-unified-modal 스킬). 미적용 모달에 대해 Phase로 마이그레이션 | 높음 |

---

## 2. 카드 (Card) · 통계/스탯 카드

| 컴포넌트/파일 경로 | 현재 사용처 | 공통화 시 기대 효과 | 우선순위 |
|-------------------|-------------|----------------------|----------|
| **common/StatCard**, **common/StatsCard**, **common/StatisticsCard** | StatCard: common/index, 다수 대시보드; StatsCard: 위젯/대시보드; StatisticsCard: 통계 관련 | 세 가지 유사 네이밍·역할 통일 → 하나의 **StatCard**(또는 **DataCard**)로 통합, props로 label/value/trend/unit 등 지원 | 높음 |
| **common/GlassStatCard**, **common/GlassHeaderCard**, **common/DetailedStatsCard** | 대시보드, 위젯, 상세 통계 | “유리/상세/헤더” 스타일을 **variant** 또는 **layout** prop으로 갖는 공통 **StatCard**로 흡수 가능 | 중간 |
| **common/StatisticsGrid**, **common/StatsCardGrid**, **common/DetailedStatsGrid** | 그리드 레이아웃으로 여러 Stat/Stats 카드 배치 | 하나의 **StatsGrid** (columns, gap, children)로 통일 시 반복 제거 | 중간 |
| **ui/Card/Card.js**, **common/CardContainer**, **common/MGCard** | ui/Card: 다양한 화면; CardContainer: common export; MGCard: 레거시 | 기본 카드 래퍼는 **하나의 표준(Card 또는 CardContainer)**로 정리하고, ui/Card·MGCard 사용처 이전 후 deprecated | 중간 |
| **dashboard-v2/content/ContentCard** vs **common 카드** | B0KlA·대시보드 v2 | ContentCard를 common으로 올리거나, common 카드와 BEM/토큰 호환되도록 정리하여 “카드” 계열 일원화 | 낮음 |

---

## 3. 배지 (Badge)

| 컴포넌트/파일 경로 | 현재 사용처 | 공통화 시 기대 효과 | 우선순위 |
|-------------------|-------------|----------------------|----------|
| **common/StatusBadge** | ClientCard, ClientConsultationTab, MappingCard, MappingListRow, CardMeta 등 | 이미 단일 구현. **admin/mapping-management/integrated-schedule/atoms/StatusBadge.js**는 common re-export이므로, 해당 경로 사용처를 common 직접 import로 정리하면 re-export 제거 가능 | 낮음 |
| **common/RemainingSessionsBadge** | 매칭·회기 관련 카드/리스트 | 동일하게 integrated-schedule/atoms의 re-export만 제거하고 common 직접 사용 권장 | 낮음 |
| **common/NotificationBadge**, **dashboard-v2/atoms/NotificationBadge** | 알림 개수 표시 | 하나로 통일(common 또는 dashboard-v2에서 하나만 유지하고 다른 쪽 re-export) | 중간 |
| **consultant/molecules/FilterBadge**, **admin/AdminDashboard/atoms/PipelineStepBadge**, **clinical/RiskAlertBadge** | 필터 칩, 파이프라인 단계, 위험 알림 | 도메인 특화 배지는 유지하되, **스타일은 common/StatusBadge variant 또는 디자인 토큰**에 맞추어 시각적 일관성 확보 | 낮음 |

---

## 4. 테이블 · 리스트 블록

| 컴포넌트/파일 경로 | 현재 사용처 | 공통화 시 기대 효과 | 우선순위 |
|-------------------|-------------|----------------------|----------|
| **common/ListTableView.js** | 리스트(테이블) 뷰 공통 (USER_MANAGEMENT_VIEW_MODE_MEETING 등) | 이미 공통 컴포넌트. **ConsultationLogTableBlock, RefundHistoryTableBlock, MappingTableView** 등이 동일 패턴(columns + data + renderCell)이면 ListTableView 기반으로 리팩터하여 중복 제거 | 높음 |
| **common/MGTable.js** vs **ui/Table/Table.js** | MGTable: 레거시 화면; ui/Table: 스토리·일부 화면 | 테이블 표준을 **하나**로 정해(예: ui/Table 또는 common/ListTableView 확장), MGTable 사용처 마이그레이션 후 정리 | 중간 |
| **ListBlock 패턴** (MappingListBlock, ConsultationLogListBlock, PsychDocumentListBlock, ConsultantRecordListBlock) | 매칭, 상담 로그, 심리 문서, 상담사 기록 | “필터 + 뷰 모드 전환 + 리스트/테이블/캘린더” 공통 **ListBlock** 템플릿 추출 시 반복 제거. 도메인별 데이터·컬럼만 주입 | 중간 |

---

## 5. 필터 섹션

| 컴포넌트/파일 경로 | 현재 사용처 | 공통화 시 기대 효과 | 우선순위 |
|-------------------|-------------|----------------------|----------|
| **MappingFilterSection**, **ConsultationLogFilterSection**, **ConsultantRecordFilterBlock**, **RefundFilterBlock**, **SearchFilterSection** | 매칭 관리, 상담 로그, 상담사 기록, 환불, 검색 | 공통 **FilterSection** (또는 **FilterBlock**) 컴포넌트: 레이아웃·반응형·칩 정리 공통화, 도메인별 필터 항목만 props/children으로 주입 | 중간 |
| **ui/FilterSearch/UnifiedFilterSearch**, **FilterChips** | 이미 ui 공통 | 도메인 FilterSection들이 UnifiedFilterSearch·FilterChips를 내부에서 사용하도록 통일하면 일관성 향상 | 중간 |

---

## 6. 폼 (Form)

| 컴포넌트/파일 경로 | 현재 사용처 | 공통화 시 기대 효과 | 우선순위 |
|-------------------|-------------|----------------------|----------|
| **common/modals/FormModal.js** | 폼이 들어가는 모달 | UnifiedModal + variant="form" + 슬롯(header/body/actions)으로 통합 가능. FormModal 사용처가 적으면 Phase에서 UnifiedModal로 흡수 | 낮음 |
| **common/MGForm.js** | 레거시 폼 레이아웃 | 신규는 디자인 토큰·공통 Form 레이아웃 컴포넌트 사용, MGForm 사용처 점진적 마이그레이션 | 낮음 |
| **도메인별 폼** (SalaryProfileFormModal, CommonCodeForm, PgConfigurationForm 등) | ERP, 공통코드, 테넌트 설정 | 폼 **필드 그룹·레이아웃**만 공통(예: FormSection, LabeledField)으로 추출하고, 도메인 로직은 각 폼에 유지 | 낮음 |

---

## 7. 버튼 · 버튼 그룹

| 컴포넌트/파일 경로 | 현재 사용처 | 공통화 시 기대 효과 | 우선순위 |
|-------------------|-------------|----------------------|----------|
| **common/CardActionGroup.js** | 카드 하단 액션 버튼 그룹 | 이미 common 단일. **mapping-management/integrated-schedule/molecules/CardActionGroup**는 매칭 도메인 래퍼(결제/입금/승인)이므로 common 기반 유지로 적절. 추가 공통화 불필요 | - |
| **common/ActionButton.js** | common export, 다수 카드/리스트 | 표준 유지. 신규 화면에서는 ActionButton + CardActionGroup 사용 권장 | - |

---

## 8. 기타 공통화 후보

| 컴포넌트/파일 경로 | 현재 사용처 | 공통화 시 기대 효과 | 우선순위 |
|-------------------|-------------|----------------------|----------|
| **Empty state (빈 목록/빈 결과)** | MappingListBlock, ConsultationLogListBlock, PsychDocumentListBlock 등 각자 empty UI 구현 | **EmptyState** 공통 컴포넌트(아이콘+메시지+선택적 CTA) 추출 시 일관된 빈 상태 UX | 중간 |
| **common/ViewModeToggle**, **MappingListBlock 내 viewMode** | 사용자 관리, 매칭 목록 등 | 뷰 모드 전환(카드/테이블/캘린더)을 공통 **ViewModeToggle** + 공통 **ListBlock** 템플릿으로 제공하면 반복 제거 | 중간 |
| **Loading / Skeleton** | CommonLoading, UnifiedLoading, ui/Loading/Skeleton 등 | 로딩 UI 표준을 **UnifiedLoading** + **Skeleton**으로 통일하고, 레거시 로딩 컴포넌트 사용처 정리 | 낮음 |
| **common/UnifiedHeader** vs **common/MGHeader** vs **layout/SimpleHeader** | 상단 헤더 사용 화면 | 헤더 역할을 하나의 **UnifiedHeader**(또는 표준 헤더)로 정리하고, MGHeader/SimpleHeader 사용처 통합 검토 | 낮음 |

---

## 9. 정리 요약

- **높음 우선순위**: 모달 통일(UnifiedModal·ConfirmModal 단일화, ui/Modal 정리), Stat/Stats/Statistics 카드 통일, ListTableView 기반 테이블/리스트 블록 통일.
- **중간 우선순위**: CompactConfirmModal·ConfirmModal 통합, Glass/Detailed Stat 카드 variant 통일, NotificationBadge 단일화, ListBlock·FilterSection 공통 템플릿, EmptyState·ViewModeToggle 공통화.
- **낮음 우선순위**: re-export 제거(StatusBadge/RemainingSessionsBadge), ContentCard·common 카드 정리, FormModal/MGForm/폼 레이아웃, 로딩·헤더 통일.

---

## 10. 참조

- **core-solution-unified-modal** 스킬: 모든 모달은 UnifiedModal 사용.
- **core-solution-atomic-design** 스킬: Atoms(StatusBadge, RemainingSessionsBadge, ActionButton, CardContainer, CardActionGroup)는 common 사용.
- **docs/standards/FRONTEND_DEVELOPMENT_STANDARD.md**, **docs/standards/COMPONENT_STRUCTURE_STANDARD.md**
- **core-coder**: 본 목록의 Phase 반영(이동·통합·배치) 수행. **core-component-manager**: Phase 완료 후 본 문서 갱신.

---

**다음 단계**: 아래 「Phase 및 담당」에 따라 Phase별로 core-component-manager(제안·목록) → core-coder(구현) 순으로 수행합니다.

---

## 11. Phase 및 담당 (기획 배정)

**목표**: 공통화 후보를 우선순위·의존성에 따라 Phase로 나누고, Phase별 담당(core-component-manager / core-coder)을 배정하여 실행 시 참고할 수 있게 함.

**원칙**  
- **core-component-manager**: 해당 Phase 범위의 상세 작업 목록·마이그레이션 순서·파일 매핑 제안 및 문서 갱신. 코드 직접 작성 안 함.  
- **core-coder**: component-manager 제안(또는 본 문서 Phase 설명)을 바탕으로 실제 코드 이동·통합·배치 수행.

---

### Phase 1: 모달 통일 (우선순위 높음)

| 항목 | 내용 |
|------|------|
| **범위** | ConfirmModal 단일화(common vs modals/), ui/Modal → UnifiedModal re-export 또는 deprecated, CompactConfirmModal·MG* 모달 통합, Bootstrap/비-UnifiedModal 사용 모달(ConsultantApplicationModal 등) → UnifiedModal 마이그레이션, 도메인 콘텐츠 모달(ClientModal, ScheduleDetailModal, SalaryConfigModal, TaxDetailsModal 등) 쉘을 UnifiedModal로 통일. ErpModal은 유지(추가 공통화 불필요). |
| **의존성** | 선행 없음. 다른 Phase와 병렬 가능. |
| **담당** | **1-1** core-component-manager → **1-2** core-coder. 1-1: Phase 1 대상 파일·사용처 목록, 통합 후 단일 진입점(common/ConfirmModal, UnifiedModal re-export) 제안서. 1-2: 제안서 기반 코드 반영. |
| **참조** | `/core-solution-unified-modal`, `docs/standards` |

---

### Phase 2: 카드·통계 (StatCard / StatsGrid) (우선순위 높음)

| 항목 | 내용 |
|------|------|
| **범위** | StatCard / StatsCard / StatisticsCard → 단일 StatCard(또는 DataCard) 통합; GlassStatCard·GlassHeaderCard·DetailedStatsCard를 variant/layout prop으로 흡수; StatisticsGrid·StatsCardGrid·DetailedStatsGrid → StatsGrid 통일; ui/Card·CardContainer·MGCard 정리(표준 하나로, 사용처 이전 후 deprecated). ContentCard·common 카드 일원화는 낮음으로 Phase 6에서 처리 가능. |
| **의존성** | 선행 없음. Phase 1과 병렬 가능. |
| **담당** | **2-1** core-component-manager → **2-2** core-coder. 2-1: Phase 2 대상 컴포넌트·사용처 목록, 통합 후 API(props)·variant 설계 제안서. 2-2: 제안서 기반 코드 반영. |

---

### Phase 3: 테이블·리스트 블록 (우선순위 높음·중간)

| 항목 | 내용 |
|------|------|
| **범위** | ListTableView 기반으로 ConsultationLogTableBlock, RefundHistoryTableBlock, MappingTableView 등 동일 패턴 리팩터; MGTable vs ui/Table 표준 하나로 정리; ListBlock 패턴(MappingListBlock, ConsultationLogListBlock, PsychDocumentListBlock, ConsultantRecordListBlock)에서 “필터 + 뷰 모드 전환 + 리스트/테이블/캘린더” 공통 ListBlock 템플릿 추출. |
| **의존성** | Phase 4(필터·ViewModeToggle)와 연관 있으나, ListBlock 템플릿 내부에서 Phase 4 컴포넌트를 사용하도록 설계하면 Phase 4 선행 또는 병렬 가능. |
| **담당** | **3-1** core-component-manager → **3-2** core-coder. 3-1: Phase 3 대상 블록·테이블 목록, ListTableView 확장 API·ListBlock 템플릿 스펙 제안서. 3-2: 제안서 기반 코드 반영. |

---

### Phase 4: 필터·뷰 모드·Empty (우선순위 중간)

| 항목 | 내용 |
|------|------|
| **범위** | MappingFilterSection, ConsultationLogFilterSection, ConsultantRecordFilterBlock, RefundFilterBlock, SearchFilterSection → 공통 FilterSection(또는 FilterBlock) 추출, 레이아웃·UnifiedFilterSearch·FilterChips 사용 통일; ViewModeToggle 공통화 및 ListBlock에서 사용; Empty state(빈 목록/빈 결과) → EmptyState 공통 컴포넌트(아이콘+메시지+선택적 CTA) 추출. |
| **의존성** | Phase 3과 연계 시 ListBlock 템플릿이 FilterSection·ViewModeToggle·EmptyState를 사용하도록 설계. Phase 3과 병렬 진행 가능(공통 API만 먼저 합의). |
| **담당** | **4-1** core-component-manager → **4-2** core-coder. 4-1: Phase 4 대상 필터·뷰모드·empty 목록, FilterSection/EmptyState API 제안서. 4-2: 제안서 기반 코드 반영. |

---

### Phase 5: 배지·re-export 정리 (우선순위 중간·낮음)

| 항목 | 내용 |
|------|------|
| **범위** | NotificationBadge 단일화(common vs dashboard-v2); StatusBadge·RemainingSessionsBadge의 integrated-schedule/atoms re-export 제거 → common 직접 import 권장; 도메인 특화 배지(FilterBadge, PipelineStepBadge, RiskAlertBadge)는 스타일만 common/StatusBadge variant·디자인 토큰에 맞춤. |
| **의존성** | 선행 없음. Phase 1·2와 병렬 가능. |
| **담당** | **5-1** core-component-manager → **5-2** core-coder. 5-1: re-export 사용처·NotificationBadge 통합 방안 제안서. 5-2: 제안서 기반 코드 반영. |

---

### Phase 6: 폼·로딩·헤더·기타 (우선순위 낮음)

| 항목 | 내용 |
|------|------|
| **범위** | FormModal → UnifiedModal variant 흡수; MGForm 사용처 점진적 마이그레이션; FormSection·LabeledField 등 폼 레이아웃 공통화; Loading/Skeleton → UnifiedLoading·Skeleton 표준 통일; UnifiedHeader vs MGHeader vs SimpleHeader 정리; ContentCard·common 카드 일원화(필요 시). |
| **의존성** | Phase 1·2 완료 후 또는 병렬. 비긴급. |
| **담당** | **6-1** core-component-manager → **6-2** core-coder. 6-1: Phase 6 대상 목록·마이그레이션 순서 제안서. 6-2: 제안서 기반 코드 반영. |

---

### 분배실행 요약

| Phase | 1단계(제안·분석) | 2단계(구현) | 비고 |
|-------|-------------------|-------------|------|
| Phase 1 모달 통일 | core-component-manager | core-coder | Phase 2와 병렬 가능 |
| Phase 2 카드·통계 | core-component-manager | core-coder | Phase 1과 병렬 가능 |
| Phase 3 테이블·리스트 블록 | core-component-manager | core-coder | Phase 4와 API 합의 후 병렬 가능 |
| Phase 4 필터·뷰모드·Empty | core-component-manager | core-coder | Phase 3과 연계 |
| Phase 5 배지·re-export | core-component-manager | core-coder | Phase 1·2와 병렬 가능 |
| Phase 6 폼·로딩·헤더 | core-component-manager | core-coder | 낮음 우선순위, 후순위 |

**실행 요청문**  
- Phase 1·2·5는 서로 의존성이 없으므로, **동시에** 각 Phase별로 core-component-manager 호출(Phase N 상세 작업 목록·마이그레이션 제안서 작성) → 결과 수신 후 core-coder 호출(제안서 기반 구현)할 수 있습니다.  
- Phase 3·4는 공통 ListBlock·FilterSection·ViewModeToggle·EmptyState API를 먼저 합의한 뒤, 3-1·4-1을 병렬 호출하고, 3-2·4-2는 순차 또는 병렬로 진행할 수 있습니다.  
- Phase 6은 Phase 1·2 완료 후 또는 리소스 여유 시 진행합니다.

**산출물·완료 기준**  
- **core-component-manager** 산출: 해당 Phase 대상 파일·사용처 목록, 통합 후 API(진입점·props)·마이그레이션 순서가 담긴 제안서(문서 또는 본 MD 하위 섹션).  
- **core-coder** 산출: 제안서 반영 코드, import 경로 정리, deprecated 주석 또는 제거.  
- **Phase 완료 후**: core-component-manager가 본 문서(COMPONENT_COMMONIZATION_CANDIDATES.md)의 목록·상태를 갱신.
