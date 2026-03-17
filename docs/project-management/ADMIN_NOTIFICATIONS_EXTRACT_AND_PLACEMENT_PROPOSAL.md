# SystemNotificationManagement · AdminMessages 추출·재사용 블록 및 적재적소 배치 제안서

**대상 파일**: `frontend/src/components/admin/SystemNotificationManagement.js`, `frontend/src/components/admin/AdminMessages.js`  
**참조**: [GNB_AND_ADMIN_NOTIFICATION_COMPONENT_PROPOSAL.md](./GNB_AND_ADMIN_NOTIFICATION_COMPONENT_PROPOSAL.md) §3  
**담당**: core-component-manager (제안·문서화만, 코드 작성은 core-coder 위임)  
**산출**: 추출·재사용 블록 목록, 중복 제거·적재적소 배치 제안

---

## 1. 개요

- **목적**: 두 페이지에서 **추출·재사용할 블록**을 Organism/Molecule 수준으로 정리하고, **중복 제거** 및 **적재적소 배치**(common vs admin)를 제안한다.
- **적용 맥락**: 관리자 통합 알림 페이지(`AdminNotificationsPage`)에서 탭별로 “시스템 공지” / “메시지” 블록을 재사용하며, 공통 UI(헤더·필터·카드 목록)는 한 곳에서 관리한다.

---

## 2. 현재 구조 요약

### 2.1 SystemNotificationManagement.js

| 구간 | 라인(대략) | 내용 | 비고 |
|------|------------|------|------|
| 레이아웃·헤더 | 276–291 | AdminCommonLayout, 제목(아이콘+텍스트), “새 공지 작성” 버튼 | `contentOnly`일 때는 321–328에서 섹션 타이틀+필터만 |
| 필터 | 292–315 / 326–345 / 329–345 | 대상(select), 상태(select) | **동일 필터 UI가 3곳** (contentOnly 섹션 1곳, 비-contentOnly 2곳) |
| 목록 | 346–368 / 350–378 | 로딩/빈 상태/공지 카드 리스트, 카드 내 제목·배지·요약·메타·액션 버튼 | 카드 구조·액션(게시/보관/수정/삭제) **중복** |
| 모달 | 381–428 | 작성/수정 모달 **뼈대** (실제로는 `UnifiedModal` 미사용·`div.mg-modal`로 렌더됨) | 폼 필드: 대상, 제목, 내용, 공지 타입, 중요/긴급 체크, 만료일 |

- **중복**: (1) 헤더+버튼 패턴 2종(전체 페이지 vs contentOnly), (2) 필터 UI 3회 반복, (3) 공지 카드 행 UI 2회 반복(contentOnly / 비-contentOnly).

### 2.2 AdminMessages.js

| 구간 | 라인(대략) | 내용 | 비고 |
|------|------------|------|------|
| 헤더 | 126–140 | 제목 “메시지 관리”, 부제 “전체 메시지 N개 · 읽지 않음 N개” | contentOnly일 때는 141 섹션 타이틀만 |
| 필터 | 143–185 | 검색 input + BadgeSelect(유형) + BadgeSelect(상태) | 카드 래퍼 `mg-v2-message-filters-card` |
| 목록 | 187–261 | 빈 상태 / 메시지 카드 그리드(MGCard), 카드 내 배지·제목·참여자·날짜 | 테이블→카드 전환 완료 |
| 상세 모달 | 264–302 | UnifiedModal + 상세(배지·발신/수신/발송일·본문) | 읽음 처리 후 새로고침 |

- **중복**: (1) “제목 + 부제(요약)” 헤더 패턴이 SystemNotificationManagement의 헤더와 **유사**, (2) “필터(검색+선택)” 패턴이 공지 필터와 **개념 동일·구성만 다름**(select vs BadgeSelect).

---

## 3. 추출·재사용 블록 목록 (Organism / Molecule 제안)

아래는 **추출 대상**과 **배치 위치**, **기존 컴포넌트와의 관계**를 정리한 것이다. 코드 작성은 하지 않고 제안만 한다.

### 3.1 Organism 수준

| 블록명 | 추출 소스 | 설명 | 배치 제안 |
|--------|-----------|------|-----------|
| **SystemNotificationListBlock** | SystemNotificationManagement | “필터(대상/상태) + 로딩/빈 상태 + 공지 카드 목록 + 카드별 액션(게시/보관/수정/삭제)”. 목록 fetch·핸들러 포함. | `admin/organisms/` (또는 `admin/notifications/organisms/`) |
| **AdminMessageListBlock** | AdminMessages | “검색+유형/상태 필터 + 로딩/빈 상태 + 메시지 카드 그리드 + 상세 모달”. 목록 fetch·필터링·상세 열기 포함. | `admin/organisms/` (동일 계층) |

- **공통점**: 둘 다 “필터 + 목록(카드) + (모달)” 구조. 통합 페이지 탭에서 각각 한 탭을 담당하도록 재사용.

### 3.2 Molecule 수준 (공통 UI 추출)

| 블록명 | 추출 소스 | 설명 | 배치 제안 |
|--------|-----------|------|-----------|
| **AdminSectionHeader** | 두 페이지 인라인 헤더 | “아이콘 + 제목 + (부제/요약) + (선택) 액션 버튼”. 예: “시스템 공지 관리” + “새 공지 작성” / “메시지 관리” + “전체 N개 · 읽지 않음 N개”. | **admin** 공통: `admin/molecules/AdminSectionHeader.js` (또는 `common/` 에 두고 admin에서만 사용해도 됨. 도메인 무관하면 common) |
| **AdminFilterBar** | SystemNotificationManagement(select 2개), AdminMessages(검색+BadgeSelect 2개) | “검색(선택) + 1~N개 필터(select 또는 BadgeSelect)”. 옵션·value·onChange는 props로 주입. | **common** 권장: `common/molecules/AdminFilterBar.js` — 도메인 무관한 “검색+필터 조합”이라 다른 admin 목록에도 재사용 가능. |
| **AdminCardList** | 공지 카드 리스트 / 메시지 카드 그리드 | “빈 상태 UI + children(카드들)”. 레이아웃만 담당하고, 개별 카드 내용은 부모에서 렌더. 또는 “목록/그리드 레이아웃 + empty state” 래퍼. | **common** 권장: `common/molecules/AdminCardList.js` (또는 admin 전용이면 `admin/molecules/`). MGCard 그리드·빈 상태 일원화. |
| **SystemNotificationFormModal** | SystemNotificationManagement 모달 내부 | “UnifiedModal + 공지 폼 필드 전체(대상, 제목, 내용, 타입, 중요/긴급, 만료일) + 취소/작성·수정 버튼”. 상태·API 호출은 부모 또는 훅으로 주입. | **admin** 전용: `admin/molecules/SystemNotificationFormModal.js` (또는 organisms에 둘 수 있음. 폼이 복잡하면 Organism). |

### 3.3 기존 컴포넌트와의 관계

| 기존 컴포넌트 | 관계 제안 |
|---------------|------------|
| **ContentHeader** (dashboard-v2/content) | AdminNotificationsPage에서 이미 사용. “제목 + 부제 + 액션” 역할. **AdminSectionHeader**는 “탭 내부 섹션”용(공지 목록/메시지 목록 상단)으로 구분해, 페이지 상단은 ContentHeader 유지, **탭 콘텐츠 상단**은 AdminSectionHeader로 통일 권장. |
| **SectionHeader** (admin/SectionHeader.js) | “제목, 부제목, 통계, 액션” 구조 유사. **AdminSectionHeader** 추출 시 SectionHeader와 **통합 검토** 가능: 하나로 합쳐서 admin 섹션 헤더 단일 소스로 가거나, SectionHeader를 deprecated 하고 AdminSectionHeader로 대체. |
| **SearchFilterSection** (admin/SearchFilterSection.js) | 검색+필터 select. 스타일이 레거시(bi-search, search-filter-section). **AdminFilterBar**를 새로 두고, SearchFilterSection 사용처를 점진적으로 AdminFilterBar로 이전 후 deprecated 제안. |
| **UnifiedModal** | 공지 작성/수정·메시지 상세 모두 **UnifiedModal** 사용 필수. SystemNotificationFormModal은 내부에 UnifiedModal을 쓰는 Molecule/Organism. |
| **BadgeSelect**, **MGCard** | 그대로 재사용. AdminFilterBar는 BadgeSelect 또는 select를 옵션으로 받도록 설계. AdminCardList는 MGCard를 children으로 감싸는 레이아웃. |

---

## 4. 블록별 배치 및 추출 범위 요약

| 블록 | 배치 | 추출 범위 (어디서 무엇을 가져오는지) |
|------|------|--------------------------------------|
| **SystemNotificationListBlock** | admin/organisms/ | SystemNotificationManagement: (1) contentOnly일 때의 “섹션 필터 + section-body + 카드 리스트” 전체 + (2) 비-contentOnly일 때의 “필터 + 목록 + 빈 상태” 통합. 권한·loadNotifications·handleCreate/Edit/Publish/Archive/Delete는 블록 내부 또는 props로. |
| **AdminMessageListBlock** | admin/organisms/ | AdminMessages: “필터 카드 + 메시지 카드 그리드 + 상세 모달” 전체. loadMessages, filteredMessages, handleMessageClick, closeModal, MESSAGE_TYPES 등 포함. |
| **AdminSectionHeader** | admin/molecules/ 또는 common/ | 두 페이지의 “제목+부제+액션” 인라인 블록. SystemNotificationManagement 281–289행, AdminMessages 126–136행 유사 구조를 하나의 props 기반 컴포넌트로. |
| **AdminFilterBar** | common/molecules/ | 공지: 대상/상태 select 2개. 메시지: 검색 input + BadgeSelect 2개. “slots” 또는 “filterConfig[]” 형태로 검색 영역 + 필터 항목 배열을 받아 렌더. |
| **AdminCardList** | common/molecules/ | “빈 상태(아이콘+문구+선택 버튼) + 목록/그리드 컨테이너”. 공지의 `mg-v2-space-y-sm` 리스트, 메시지의 `mg-v2-message-cards-grid`를 “layout” prop으로 통일 가능하게. |
| **SystemNotificationFormModal** | admin/molecules/ (또는 organisms) | SystemNotificationManagement 381–428행: 모달 타이틀, 폼 필드 전체, 액션 버튼. isOpen, onClose, initialData, onSave props. 내부에서 UnifiedModal 사용. |

---

## 5. 중복 제거 제안

- **필터 UI**: SystemNotificationManagement 내 select 3회 반복 → **AdminFilterBar** 한 곳으로. 공지 블록은 “대상/상태” 옵션만 props로 전달.
- **헤더**: “제목 + 부제 + 액션” 인라인 2종 → **AdminSectionHeader** 한 곳으로. contentOnly 여부에 따라 “섹션 타이틀만” vs “제목+액션” 모두 지원하도록 props 설계.
- **공지 카드 행**: contentOnly / 비-contentOnly에서 동일한 카드 구조 2회 → **SystemNotificationListBlock** 내부에서 **한 컴포넌트**(예: SystemNotificationCard Molecule)로 렌더. 빈 상태도 **AdminCardList** 또는 블록 내 공통 empty 컴포넌트로 한 번만 정의.
- **메시지 카드**: 이미 MGCard 기반으로 일관됨. **AdminMessageListBlock**으로 감싼 뒤, “메시지 카드 한 장”을 필요 시 **AdminMessageCard** Molecule로 분리하면 재사용(드롭다운 등에서)에 유리.

---

## 6. 적재적소 배치 (common vs admin)

| 구분 | 배치 | 블록/컴포넌트 |
|------|------|----------------|
| **common** | 도메인 무관, 여러 admin·다른 영역에서 쓸 수 있는 UI | AdminFilterBar, AdminCardList, UnifiedModal, BadgeSelect, MGCard |
| **admin** | 관리자·알림/메시지 도메인 전용 | AdminSectionHeader(또는 common), SystemNotificationListBlock, AdminMessageListBlock, SystemNotificationFormModal; 필요 시 SystemNotificationCard, AdminMessageCard |
| **페이지** | 라우트·레이아웃 | AdminNotificationsPage(통합), 기존 SystemNotificationManagement·AdminMessages는 점진적으로 “통합 페이지 + 탭”으로 리다이렉트 또는 블록 조합만 남기고 제거 |

- **common vs admin 판단**: “시스템 공지/메시지”에만 쓰이면 admin, “검색+필터/카드 리스트 레이아웃”처럼 다른 목록 화면에도 쓰이면 common.

---

## 7. 참고 사항 (코더 전달용)

- **SystemNotificationManagement.js** 381행 근처: 현재 모달이 `<div className="mg-modal"` 로 열려 있음. **UnifiedModal** 컴포넌트로 교체 필요. 추출 시 **SystemNotificationFormModal**이 내부에서 UnifiedModal을 사용하도록 설계하면 해소됨.
- **AdminNotificationsPage**: 이미 ContentHeader + 탭 + `contentOnly` 로 두 블록을 넣고 있음. 추출 후에는 탭 패널에 `<SystemNotificationListBlock />`, `<AdminMessageListBlock />` 만 넣고, 각 블록이 내부에서 AdminSectionHeader·AdminFilterBar·AdminCardList(또는 동일 개념)를 사용하도록 하면 됨.
- **COMPONENT_INVENTORY**·**COMPONENT_PLACEMENT_PROPOSAL** 갱신: 본 제안 반영 후 core-component-manager에 인벤토리·배치 제안서 갱신 요청 권장.

---

## 8. 체크리스트 (기획·코더 전달용)

- [ ] SystemNotificationListBlock 추출 범위 확정(권한·API 호출 위치: 블록 내부 vs 페이지)
- [ ] AdminMessageListBlock 추출 범위 확정(상세 모달 포함 여부·이벤트 정리)
- [ ] AdminSectionHeader vs SectionHeader 통합 여부 결정
- [ ] AdminFilterBar props 설계(검색 optional, filterConfig 배열 형태 등)
- [ ] AdminCardList layout 옵션(리스트 vs 그리드) 및 빈 상태 스펙
- [ ] SystemNotificationFormModal UnifiedModal 래핑 및 폼 상태·onSave 시그니처
- [ ] common vs admin 최종 배치 확정 후 문서 반영

---

*문서 끝.*
