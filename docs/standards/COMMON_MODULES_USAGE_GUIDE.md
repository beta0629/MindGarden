# 공통 모듈 사용 가이드

**버전**: 1.0.0  
**최종 업데이트**: 2025-03-17  
**상태**: 공식 표준  
**서브에이전트 스킬**: `core-solution-common-modules`

---

## 📌 개요

MindGarden 프로젝트에서 **공통으로 사용하는 컴포넌트·유틸**을 정리하고, 새 기능 구현 시 **공통 모듈을 우선 검토·사용**하도록 안내하는 문서입니다. 디자이너·퍼블리셔·코더·컴포넌트 매니저가 "공통 모듈 사용" 태스크를 받았을 때 이 문서를 참조해 일관되게 적용합니다.

### 참조 문서
- [화면 컴포넌트 구성 표준](./COMPONENT_STRUCTURE_STANDARD.md)
- [프론트엔드 개발 표준](./FRONTEND_DEVELOPMENT_STANDARD.md)
- [API 호출 표준](./API_CALL_STANDARD.md)
- [공통화 후보 컴포넌트](../project-management/COMPONENT_COMMONIZATION_CANDIDATES.md)
- [AdminCommonLayout](../layout/ADMIN_COMMON_LAYOUT.md)
- [공통 알림 시스템 표준](./NOTIFICATION_SYSTEM_STANDARD.md)
- [로딩 컴포넌트 표준](./LOADING_COMPONENT_STANDARD.md)

---

## 1. 공통 모듈 목록

아래는 프로젝트에서 **공통으로 사용하는 컴포넌트·유틸** 목록입니다. 참조 경로는 `frontend/src` 기준 상대 경로로 표기합니다.

### 1.1 레이아웃

| 모듈 | 용도 | 위치 | 참조 경로 |
|------|------|------|------------|
| **AdminCommonLayout** | 어드민·ERP·상담사 등 GNB/LNB 통합 레이아웃, 로딩 상태 처리 | layout | `components/layout/AdminCommonLayout` |
| **ContentArea** | 본문 영역 래퍼 (B0KlA·대시보드 v2) | dashboard-v2/content | `components/dashboard-v2/content` (ContentArea) |
| **ContentHeader** | 페이지 제목·부제·주요 액션 (본문 상단) | dashboard-v2/content | `components/dashboard-v2/content` (ContentHeader) |
| **ContentSection** | 섹션 블록 (제목·내용 그룹) | dashboard-v2/content | `components/dashboard-v2/content` (ContentSection) |
| **ContentCard** | 카드 블록 (B0KlA 스타일) | dashboard-v2/content | `components/dashboard-v2/content` (ContentCard) |
| **ContentKpiRow** | KPI 행 (숫자·차트 등 한 줄 배치) | dashboard-v2/content | `components/dashboard-v2/content` (ContentKpiRow) |

- **본문 구조 권장**: 어드민·대시보드 v2·ERP 개선 시 `ContentArea` → `ContentHeader` → `ContentSection` / `ContentCard` 순서로 구성.  
- **AdminCommonLayout**: `docs/layout/ADMIN_COMMON_LAYOUT.md` 참고.

### 1.2 모달

| 모듈 | 용도 | 위치 | 참조 경로 |
|------|------|------|------------|
| **UnifiedModal** | 모든 모달의 공통 쉘 (오버레이·헤더·바디·액션) | common/modals | `components/common/modals/UnifiedModal` |
| **ConfirmModal** | 확인/취소 2버튼 확인 다이얼로그 | common | `components/common/ConfirmModal` (또는 common/modals/ConfirmModal) |

- **필수**: 새 모달은 반드시 **UnifiedModal** 사용. 커스텀 오버레이/래퍼 금지.  
- **스킬**: `.cursor/skills/core-solution-unified-modal/SKILL.md`, `docs/standards/MODAL_STANDARD.md`.

### 1.3 폼·선택 UI

| 모듈 | 용도 | 위치 | 참조 경로 |
|------|------|------|------------|
| **BadgeSelect** | 배지 형태 단일/다중 선택 (결제방법·담당업무·상태 등) | common | `components/common/BadgeSelect` |
| **CustomSelect** | 드롭다운 선택 (공통코드·옵션) | common | `components/common/CustomSelect` |
| **FormInput** | 라벨·입력·에러 메시지 묶음 | common | `components/common/FormInput` |
| **MGForm** | 폼 레이아웃 래퍼 (레거시; 신규는 디자인 토큰·ContentSection 등 권장) | common | `components/common/MGForm` |

- **배지 선택**: 모달·폼 내 소수 옵션은 **BadgeSelect** 우선. `docs/planning/DROPDOWN_TO_BADGE_FULL_SCOPE.md`, `docs/design/BADGE_SELECT_LAYOUT_GUIDE.md` 참고.

### 1.4 카드·리스트·테이블

| 모듈 | 용도 | 위치 | 참조 경로 |
|------|------|------|------------|
| **MGCard** | 카드 래퍼 (variant·className) | common | `components/common/MGCard` |
| **CardContainer** | 카드 컨테이너 (아토믹 공통) | common | `components/common/CardContainer` |
| **CardActionGroup** | 카드 하단 액션 버튼 그룹 | common | `components/common/CardActionGroup` |
| **ListTableView** | 리스트(테이블) 뷰 공통 (columns + data + renderCell) | common | `components/common/ListTableView` |
| **EmptyState** | 빈 목록/빈 결과 표시 (아이콘·메시지·선택적 CTA) | common | `components/common/EmptyState` |
| **ViewModeToggle** | 카드/테이블/캘린더 뷰 전환 | common | `components/common/ViewModeToggle` |
| **SmallCardGrid** | 소형 카드 그리드 | common | `components/common/SmallCardGrid` |

- **통계 카드**: StatCard, StatsCard, StatisticsCard 등 유사 컴포넌트는 `COMPONENT_COMMONIZATION_CANDIDATES.md` 참고 후 단일 StatCard(또는 DataCard)로 통합 권장.

### 1.5 배지·버튼

| 모듈 | 용도 | 위치 | 참조 경로 |
|------|------|------|------------|
| **Badge** | 일반 표시용 배지 (variant: status/count/tab/pill/kpi) | common | `components/common/Badge` |
| **StatusBadge** | 상태 배지 (승인·대기·반려 등) | common | `components/common/StatusBadge` |
| **RemainingSessionsBadge** | 남은 회기 배지 | common | `components/common/RemainingSessionsBadge` |
| **NotificationBadge** | 알림 개수 배지 (GNB 등) | common / dashboard-v2/atoms | `components/common/NotificationBadge` 또는 **dashboard-v2/atoms** (개수만 표시 시 권장) |
| **ActionButton** | 카드/리스트용 액션 버튼 | common | `components/common/ActionButton` |
| **MGButton** | 버튼 (레거시; 신규는 디자인 토큰·B0KlA 버튼 클래스 권장) | common | `components/common/MGButton` |

- **일반 표시용 배지**: 상태·중요도·KPI·탭/필터 pill 등 **표시 전용**이면 **common/Badge** 사용. `variant`: `status`(success/warning/neutral/danger/info), `count`, `tab`, `pill`, `kpi`(green/orange/blue). `size`: `sm`|`default`|`lg`. 상태 전용은 StatusBadge, 알림 개수는 dashboard-v2 NotificationBadge 또는 Badge variant=count, 남은 회기는 RemainingSessionsBadge 우선.
- **Phase 3·4 적용 범위**: 시스템 알림 위젯/관리(미읽음·중요/긴급), 웰니스 알림 리스트(중요/긴급/NEW), 클라이언트 메시지 위젯(미읽음·타입·중요/긴급), ERP 환불/재무(상태·거래 유형), 구독 관리(구독 상태), PG 설정·테넌트 프로필·상담 내역·결제 관리·ERD·샘플 테이블 등 인라인 상태 배지는 **common Badge/StatusBadge** 사용으로 통일됨. 신규 화면에서는 로컬 배지 클래스·인라인 getStatusBadge 대신 공통 모듈만 사용.

### 1.6 로딩·알림

| 모듈 | 용도 | 위치 | 참조 경로 |
|------|------|------|------------|
| **UnifiedLoading** | 전역·섹션 로딩 UI | common | `components/common/UnifiedLoading` |
| **NotificationContext** | 알림 개수·목록·새로고침 (useNotification) | contexts | `contexts/NotificationContext` |
| **UnifiedNotification** | 토스트/모달/배너 알림 표시 | common | `components/common/UnifiedNotification` |

- **로딩**: `docs/standards/LOADING_COMPONENT_STANDARD.md`, `COMPONENT_TEMPLATE_STANDARD.md` 참고.  
- **알림**: `docs/standards/NOTIFICATION_SYSTEM_STANDARD.md` 참고.

### 1.7 API·유틸

| 모듈 | 용도 | 위치 | 참조 경로 |
|------|------|------|------------|
| **StandardizedApi** | 모든 API 호출 (get/post/put/delete, tenantId·세션·에러 자동 처리) | utils | `utils/standardizedApi` |

- **필수**: API 호출은 **StandardizedApi**만 사용. `ajax.js`의 apiGet/apiPost 직접 사용 금지.  
- **스킬**: `.cursor/skills/core-solution-api/SKILL.md`, `docs/standards/API_CALL_STANDARD.md`.

### 1.8 기타 공통

| 모듈 | 용도 | 위치 | 참조 경로 |
|------|------|------|------------|
| **Avatar** | 프로필 이미지·이니셜 | common | `components/common/Avatar` |
| **ProfileImageInput** | 프로필 이미지 업로드 입력 | common | `components/common/ProfileImageInput` |
| **MgEmailFieldWithAutocomplete** | 이메일 입력 + 자동완성 | common | `components/common/MgEmailFieldWithAutocomplete` |
| **MGFilter** | 필터 섹션 레이아웃 (레거시) | common | `components/common/MGFilter` |
| **ProtectedRoute** | 인증/권한 보호 라우트 | common | `components/common/ProtectedRoute` |

---

## 2. 사용 가이드

### 2.1 원칙

1. **새 기능 구현 시 공통 모듈을 우선 검토·사용한다.**  
   - 같은 역할의 컴포넌트·유틸이 이미 있으면 해당 모듈을 사용한다.  
   - 없으면 **추출 후 공통화 제안** 흐름을 따른다(아래 §2.3).

2. **중복 컴포넌트를 만들지 않는다.**  
   - 공통 모듈이 있으면 해당 모듈 사용을 **추천**하고, 없으면 **core-component-manager**에게 공통화 후보·적재적소 배치 제안을 요청한 뒤, **core-coder**가 추출·배치를 수행한다.

3. **표준 경로를 따른다.**  
   - 레이아웃: AdminCommonLayout + ContentArea/ContentHeader/ContentSection·ContentCard.  
   - 모달: UnifiedModal.  
   - API: StandardizedApi.  
   - 알림: NotificationContext·UnifiedNotification.  
   - 로딩: UnifiedLoading.

### 2.2 상황별 선택 가이드

| 상황 | 사용할 공통 모듈 |
|------|------------------|
| 어드민·ERP·상담사 전체 페이지 레이아웃 | **AdminCommonLayout** |
| 페이지 본문 상단 제목·부제·주요 버튼 | **ContentHeader** (ContentArea 내부) |
| 본문을 섹션/카드 단위로 구분 | **ContentSection**, **ContentCard** |
| KPI 숫자·차트 한 줄 배치 | **ContentKpiRow** |
| 모든 모달 (확인·폼·상세 등) | **UnifiedModal** |
| 확인/취소 2버튼 다이얼로그만 필요 | **ConfirmModal** |
| 모달·폼에서 소수 옵션 선택 (결제방법·상태 등) | **BadgeSelect** |
| 드롭다운 선택 (공통코드 등) | **CustomSelect** |
| API 호출 (GET/POST/PUT/DELETE) | **StandardizedApi** |
| 알림 개수·목록·새로고침 | **NotificationContext** (useNotification) |
| 페이지·섹션 로딩 표시 | **UnifiedLoading** |
| 빈 목록/빈 검색 결과 | **EmptyState** |
| 리스트+테이블 뷰 공통 | **ListTableView** |
| 카드 하단 버튼 그룹 | **CardActionGroup**, **ActionButton** |
| 상태·회기·알림 개수 배지 | **StatusBadge**, **RemainingSessionsBadge**, **NotificationBadge** |
| 프로필 이미지 표시/입력 | **Avatar**, **ProfileImageInput** |

### 2.3 공통 모듈이 없을 때 흐름

1. **검토**: `docs/standards/COMMON_MODULES_USAGE_GUIDE.md`(본 문서)와 `docs/project-management/COMPONENT_COMMONIZATION_CANDIDATES.md`에서 유사 모듈 여부 확인.  
2. **제안**: **core-component-manager**에게 "이 기능에 쓸 공통 컴포넌트/유틸이 있는지, 없으면 추출·공통화 후보 제안" 요청.  
3. **확정**: 기획·사용자 확인 후 **core-coder**가 추출·공통 모듈 배치(common 또는 dashboard-v2 등) 수행.  
4. **갱신**: 필요 시 component-manager가 `COMPONENT_COMMONIZATION_CANDIDATES.md` 및 본 가이드 목록 갱신.

---

## 3. 기존 문서와의 관계

| 문서 | 역할 | 본 가이드와의 관계 |
|------|------|--------------------|
| **COMPONENT_COMMONIZATION_CANDIDATES.md** | 공통화 **후보** 목록·Phase·우선순위 제안 | 본 가이드는 **이미 공통으로 쓰는 모듈** 사용법. 후보 문서는 통합·추출 대상 정리. |
| **COMPONENT_STRUCTURE_STANDARD.md** | 컴포넌트 계층·구조·레이아웃 원칙 | 본 가이드의 레이아웃·공통 컴포넌트는 이 표준과 동일하게 적용. |
| **NOTIFICATION_SYSTEM_STANDARD.md** | 알림 시스템 표준 | NotificationContext·UnifiedNotification 사용 시 해당 표준 준수. |
| **API_CALL_STANDARD.md** | API 호출 필수 규칙 | StandardizedApi 사용은 해당 표준과 동일. |
| **ADMIN_COMMON_LAYOUT.md** | AdminCommonLayout 상세 | AdminCommonLayout 사용 시 해당 문서 참고. |
| **COMMON_COMPONENTS_UNIFICATION_GUIDE.md** | 통합 방향·표준 컴포넌트 제안 | 본 가이드는 "지금 쓸 수 있는 공통 모듈" 중심; 통합 가이드는 장기 통합 시 참고. |

- **차이**: 본 가이드는 **즉시 적용 가능한 공통 모듈 목록·사용법**. 공통화 후보·통합 가이드는 **추가 통합·리팩터 시** 참조.

---

## 4. 서브에이전트 안내

- **디자이너(core-designer)**: 시안·스펙 작성 시 "공통 모듈 사용"을 전제로, AdminCommonLayout·ContentHeader·UnifiedModal·BadgeSelect 등으로 화면 구조·요소를 명시.  
- **퍼블리셔(core-publisher)**: 마크업 시 공통 컴포넌트의 BEM·클래스 구조를 `COMMON_MODULES_USAGE_GUIDE` 및 디자인 시스템과 맞춤.  
- **코더(core-coder)**: 새 기능 구현 시 본 가이드 §1·§2를 참고해 공통 모듈 우선 사용.  
- **컴포넌트 매니저(core-component-manager)**: 공통화 후보·적재적소 배치 제안 시 본 가이드 목록과 COMPONENT_COMMONIZATION_CANDIDATES를 함께 참고해 중복·배치 제안.

**스킬 문서**: `.cursor/skills/core-solution-common-modules/SKILL.md` — 공통 모듈 사용 태스크 시 해당 스킬을 참조하라.
