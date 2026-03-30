# BadgeSelect 모달/폼 배치 레이아웃 가이드

**대상**: 드롭다운 → 배지 전체 교체(40곳) 시 코더 참고용.  
**상위 스펙**: `docs/design/BADGE_SELECT_SPEC.md`  
**참조**: PENCIL_DESIGN_GUIDE.md, 어드민 대시보드 샘플

---

## 1. 적용 대상

MappingCreationModal, ConsultationLogModal, SessionExtensionModal, UserManagement, ScheduleModal, TimeSelectionModal, SalaryConfigModal, SalaryProfileFormModal, VacationManagementModal, ClientModal, RecurringExpenseModal, AdminMessages, ConsultantMessages, ErpReportModal, FinancialTransactionForm, ItemManagement, SpecialtyManagementModal, MessageSendModal, ConsultantVacationModal, PerformanceMetricsModal 등 — `docs/planning/DROPDOWN_TO_BADGE_FULL_SCOPE.md` §5 목록 전체에 동일한 레이아웃 규칙을 적용한다.

---

## 2. 모달/폼 내 배지 배치 규칙 (문단 요약)

- **여백**  
  배지 그룹의 **상하좌우**는 다음과 같이 통일한다. 라벨과 배지 그룹 사이는 **8px** (`var(--cs-spacing-sm)`). 배지 그룹 위·아래에 다른 폼 행이나 섹션이 오는 경우 **12~16px** (`var(--cs-spacing-sm)` ~ `var(--cs-spacing-md)`). 좌우는 **0** — 라벨과 같은 시작선에서 시작하고, 필드 영역 끝까지 사용(추가 좌우 margin 없음).

- **라벨과 배지 간격**  
  라벨 바로 아래에 배지 그룹이 오는 한 행 구조에서는 **라벨 아래 8px** 후에 배지 그룹을 둔다. 라벨에 `margin-bottom: 8px`를 주거나, 배지 그룹을 감싼 래퍼에 `margin-top: 8px`를 주면 된다.

- **배지 간 gap**  
  BadgeSelect 컴포넌트(`.mg-v2-badge-select`)는 이미 **gap 8px**를 사용한다. 스펙상 8~12px 범위이므로 8px로 일관해도 되고, 필요 시 12px로 조정할 때는 `var(--cs-spacing-md)`가 16px이므로 중간값은 10px 등으로만 조정(대부분 8px 유지 권장).

- **2줄 이상 시 줄바꿈·정렬**  
  옵션이 많아 배지가 두 줄 이상 될 때는 **flex-wrap**으로 자동 줄바꿈하고, **좌측 정렬**을 유지한다. 라벨 아래 첫 줄이 세로로 흔들리지 않도록 컨테이너에 `align-items: flex-start`를 두는 것을 권장한다(기본 `align-items: center`도 가능하나, 여러 모달에서 행 높이가 달라질 수 있음). 줄과 줄 사이 간격은 컴포넌트 gap으로 동일하게 적용된다.

- **배지 영역 min-height**  
  컴포넌트 자체에 `min-height: 40px`가 있으므로, 옵션이 없거나 한 줄일 때도 높이가 유지된다. 별도 래퍼에 min-height를 중복으로 줄 필요는 없다.

- **섹션 블록 안에 넣을 때**  
  모달 본문이 **섹션 블록**(배경 #F5F3EF, 테두리 1px #D4CFC8, radius 16px, 패딩 24px)으로 나뉘어 있다면, 블록 **내부 자식 간 gap은 16px** (`var(--cs-spacing-md)`)로 통일한다. “라벨 + BadgeSelect”를 하나의 논리 행으로 보고, 그 행과 다음 섹션 자식(다른 폼 그룹, 버튼 영역 등) 사이도 16px로 둔다. 즉 배지 그룹 래퍼의 `margin-bottom`을 16px로 두면 섹션 내부 gap과 맞다.

---

## 3. 코더 체크리스트

- [ ] 라벨 ↔ 배지 그룹 간격 8px 적용했는가?
- [ ] 배지 그룹 상하 12~16px(섹션 내에서는 16px 권장), 좌우 0으로 두었는가?
- [ ] 섹션 블록 내부에서 다른 자식과 gap 16px를 유지했는가?
- [ ] 2줄 이상 시 좌측 정렬·줄 간 gap 일관되는가? (필요 시 `align-items: flex-start` 검토)
- [ ] 배지 영역에 불필요한 중복 min-height를 두지 않았는가?

---

**문서 끝.**
