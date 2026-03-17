# GNB 통합 알림 · 관리자 통합(시스템 공지+메시지) 컴포넌트 구성안

**대상**: (1) GNB 통합 알림 (배지 = 공통 알림 미읽음 + 본인 메시지 미읽음, 드롭다운 = 공지+메시지 통합)  
(2) 관리자 통합 화면 (시스템 공지 + 메시지 관리 단일 페이지 리뉴얼)  
**산출**: 컴포넌트 구성 제안 · 재사용 vs 신규 · 적재적소 배치 · 중복 정리 제안  
**담당**: core-component-manager (제안·문서화만, 코드 작성은 core-coder 위임)  
**전달**: 기획(core-planner) → 디자이너·코더 전달용

---

## 1. 현재 구조 요약

### 1.1 데이터 소스(API) 정리

| 구분 | API | 용도 |
|------|-----|------|
| **alerts** | `GET/PUT /api/v1/alerts`, `GET /api/v1/alerts/unread-count` | GNB NotificationDropdown 전용 (Alert 엔티티) |
| **시스템 공지** | `GET /api/v1/system-notifications`, `.../unread-count`, `.../admin/*` | 공지 목록·상세·관리, NotificationContext(unreadSystemCount) |
| **메시지** | `GET /api/v1/consultation-messages/*`, `.../unread-count` | 메시지 목록·상세·관리, NotificationContext(unreadMessageCount) |

- **NotificationContext**: `unreadCount = unreadMessageCount + unreadSystemCount` 로 이미 “공지+메시지” 통합 카운트 제공.
- **GNB NotificationDropdown**: 현재 **alerts** API만 사용. 공지·메시지와 별도 체계.

### 1.2 GNB 쪽 알림/메시지 관련 컴포넌트

| 위치 | 컴포넌트 | 역할 | 비고 |
|------|----------|------|------|
| `dashboard-v2/atoms/NotificationBadge.js` | NotificationBadge | **Atom** – `count` prop으로 숫자 배지만 표시 | 단일 소스 권장 (개수 전용) |
| `dashboard-v2/molecules/NotificationDropdown.js` | NotificationDropdown | **Molecule** – 트리거 + 배지 + 드롭 패널, **alerts** API만 사용 | GNB(GnbRight), MobileGnb에서 사용 |
| `common/NotificationBadge.js` | NotificationBadge | 레거시 – NotificationContext 연동, 모달 포함, totalCount = 메시지+공지 | **@deprecated** (개수만 쓰면 dashboard-v2/atoms 사용) |
| `notifications/UnifiedNotifications.js` | UnifiedNotifications | **Page** – `/notifications` 전용, 탭(시스템 공지 \| 메시지) | 공지·메시지 통합 표시 이미 구현 |

### 1.3 관리자 쪽 시스템 공지·메시지 컴포넌트

| 위치 | 컴포넌트 | 라우트 | 역할 |
|------|----------|--------|------|
| `admin/SystemNotificationManagement.js` | SystemNotificationManagement | `/admin/system-notifications` | 시스템 공지 CRUD, 필터, 목록, 작성/수정 모달 |
| `admin/AdminMessages.js` | AdminMessages | `/admin/messages` | 메시지 전체 목록, 검색·필터(유형/상태), 카드 목록, 상세 모달 |
| `notifications/SystemNotifications.js` | SystemNotifications | `/system-notifications` | (사용자용) 공지 목록·상세, AdminCommonLayout 사용 |

**공통 사용 컴포넌트**: AdminCommonLayout, MGCard, UnifiedModal, BadgeSelect, UnifiedLoading, sessionManager, notificationManager, permissionUtils.

---

## 2. GNB 통합 알림용 컴포넌트 구성안

### 2.1 요구사항 대응

- **배지**: 공통 알림 미읽음 + 본인 메시지 미읽음 **통합 카운트**.
- **드롭다운**: 공통 알림 + 메시지 **통합 표시** (탭 또는 섹션).

### 2.2 배지

| 항목 | 제안 |
|------|------|
| **재사용** | `dashboard-v2/atoms/NotificationBadge` – 그대로 재사용. `count={통합미읽음}` 만 전달. |
| **통합 카운트 소스** | (A) **NotificationContext** 이미 `unreadCount = unreadMessageCount + unreadSystemCount` 제공 → 이를 쓰면 “공지+메시지” 통합 배지 가능. (B) **alerts**를 포함하려면 백엔드에서 통합 unread-count API 제공 또는 프론트에서 alerts + Context 값 합산. |
| **위치** | Atom은 **dashboard-v2/atoms** 유지 (GNB가 dashboard-v2 레이아웃이므로). |
| **common/NotificationBadge** | 레거시·deprecated. 통합 배지 전환 후 GNB에서는 사용 중단하고, 필요 시 **common** 쪽은 제거 또는 “모달 연동형” 별도 컴포넌트로만 유지 권장. |

### 2.3 드롭다운

| 항목 | 제안 |
|------|------|
| **재사용** | `dashboard-v2/molecules/NotificationDropdown` – 패널 구조·포지셔닝·트리거·배지 래퍼는 재사용. **내부 콘텐츠**만 “통합(공지+메시지)”로 확장. |
| **확장 vs 신규** | **기존 NotificationDropdown 확장** 권장: 탭(또는 섹션)으로 “공지” / “메시지” 구분, 각 탭에서 기존에 가까운 API 호출 (system-notifications, consultation-messages). alerts는 기획 결정에 따라 “알림” 탭으로 유지 또는 제거. |
| **데이터** | 공지: `system-notifications` (목록/unread-count). 메시지: `consultation-messages` (역할별 엔드포인트). 통합 미읽음: NotificationContext 또는 신규 통합 API. |
| **계층** | Molecule 유지. 내부에 “탭 헤더” + “공지 리스트” + “메시지 리스트”를 Molecules/Atoms로 분리하면 재사용·테스트에 유리. |

### 2.4 아토믹 디자인 배치(GNB)

| 계층 | 컴포넌트 | 위치 | 비고 |
|------|----------|------|------|
| **Atom** | NotificationBadge | `dashboard-v2/atoms/` | count 전용, 유지 |
| **Atom** | NavIcon (기존) | `dashboard-v2/atoms/` | 트리거 아이콘, 유지 |
| **Molecule** | NotificationDropdown | `dashboard-v2/molecules/` | 확장: 탭/섹션 + 공지 리스트 + 메시지 리스트 |
| **Molecule** | (선택) NotificationListRow / MessageListRow | `dashboard-v2/molecules/` 또는 `common/` | 드롭다운 내 한 행 재사용 가능하면 추출 |
| **Organism** | GnbRight | `dashboard-v2/molecules/` (또는 organisms) | 기존처럼 NotificationDropdown 포함 |

### 2.5 common vs dashboard-v2

- **dashboard-v2**: GNB에 붙는 배지·드롭다운은 레이아웃 소속이므로 **dashboard-v2/atoms**, **dashboard-v2/molecules** 유지.
- **common**: “알림” 도메인에서 **페이지/모달** 수준 공통이 있으면 **common** 또는 **notifications/** 에 두고, **배지 숫자만** 쓰는 Atom은 dashboard-v2 단일 소스 유지.

---

## 3. 관리자 통합(시스템 공지+메시지)용 컴포넌트 구성안

### 3.1 요구사항 대응

- **시스템 공지 관리** + **메시지 관리**를 **하나의 관리 화면**으로 통합·리뉴얼.
- 재사용 블록 vs 신규 블록, 중복 정리 제안.

### 3.2 현재 컴포넌트·블록 정리

| 페이지 | 사용 블록/패턴 | 비고 |
|--------|----------------|------|
| SystemNotificationManagement | AdminCommonLayout, 헤더(제목+액션), 필터(대상/상태), 테이블/카드 목록, 작성/수정 모달, 공지 폼 필드 | 공지 CRUD 전용 |
| AdminMessages | AdminCommonLayout, 헤더(제목+요약), 검색+BadgeSelect 필터, 메시지 카드 그리드, 상세 모달 | 메시지 조회·상세 |

**중복·유사**  
- 공통: AdminCommonLayout, 카드형 목록, 필터 영역, UnifiedModal 기반 상세.  
- **헤더 패턴**: “제목 + 부제/요약 + (선택) 액션” 구조가 두 페이지에서 유사.  
- **필터 패턴**: 검색 + 드롭다운/BadgeSelect 조합.  
- **목록**: 한 페이지는 공지 목록(테이블/카드), 한 페이지는 메시지 카드 그리드. 도메인만 다르고 레이아웃 패턴은 통일 가능.

### 3.3 통합 관리 페이지 블록 제안

| 블록 | 재사용 vs 신규 | 제안 |
|------|----------------|------|
| **레이아웃** | 재사용 | **AdminCommonLayout** 그대로 사용. |
| **상단 헤더** | 재사용 추출 | “관리 제목 + 부제(공지 N건 · 메시지 N건)” 등 – **common** 또는 **admin** 공통 **Molecule**로 추출 권장 (현재 인라인 구조를 컴포넌트화). |
| **탭(공지 \| 메시지)** | 신규 또는 재사용 | 통합 페이지 상단에 “시스템 공지” \| “메시지” 탭. 기존 **UnifiedNotifications**의 탭 UI와 유사하면 **common** 탭 컴포넌트 재사용. |
| **공지 목록 블록** | 재사용(추출) | **SystemNotificationManagement**에서 “목록 + 필터 + 액션(작성/수정/삭제/게시)” 부분을 **Organism**으로 분리 → `admin/organisms/SystemNotificationListBlock` 등. 통합 페이지의 “공지” 탭에서 사용. |
| **메시지 목록 블록** | 재사용(추출) | **AdminMessages**에서 “검색+필터 + 메시지 카드 그리드”를 **Organism**으로 분리 → `admin/organisms/AdminMessageListBlock` 등. 통합 페이지의 “메시지” 탭에서 사용. |
| **공지 작성/수정 모달** | 재사용(추출) | **SystemNotificationManagement**의 모달+폼을 **Molecule/Organism**으로 분리 → `admin/molecules/SystemNotificationFormModal` 등. |
| **메시지 상세 모달** | 재사용 | **AdminMessages**의 UnifiedModal + 상세 내용 그대로 재사용. |

### 3.4 중복 정리 제안

- **헤더·필터·카드 레이아웃**: 두 페이지에서 반복되는 패턴이므로 **공통 Organism**(예: `AdminSectionHeader`, `AdminFilterBar`, `AdminCardList`)으로 추출 시 유지보수·일관성에 유리. 기존 **COMPONENT_COMMONIZATION_CANDIDATES** 등과 정합성 맞출 것.
- **시스템 공지 목록**과 **메시지 목록**은 **도메인만 다르고** “필터 + 목록 + 상세” 구조가 같으므로, 가능하면 **같은 목록/카드 스타일**을 쓰고 **데이터·컬럼/필드만** 다르게 주입하는 형태로 통일 제안.

### 3.5 적재적소 배치

| 구분 | 제안 |
|------|------|
| **common** | 탭 UI, 공통 필터 바(검색+선택), 카드 그리드 래퍼, UnifiedModal, BadgeSelect, MGCard 등 **도메인 무관** UI. |
| **admin** | 시스템 공지·메시지 **도메인** 블록: SystemNotificationListBlock, AdminMessageListBlock, SystemNotificationFormModal, 통합 페이지용 Template. |
| **페이지/라우트** | (1) **통합 페이지 1개** 권장: 예) `/admin/notifications` 또는 `/admin/notifications-management` 에 “시스템 공지” \| “메시지” 탭. (2) 기존 `/admin/system-notifications`, `/admin/messages` 는 통합 페이지로 리다이렉트하거나, 단기적으로는 통합 페이지와 병존 후 점진 이전. |

### 3.6 라우트·블록 구성 요약

- **통합 관리 페이지 (신규)**  
  - **Route**: 예) `/admin/notifications` (또는 기획에서 정한 경로).  
  - **구성**: AdminCommonLayout + [탭: 시스템 공지 \| 메시지] + (탭별) SystemNotificationListBlock / AdminMessageListBlock + (기존과 동일) 공지 폼 모달·메시지 상세 모달.

---

## 4. 중복 정리·적재적소 요약

### 4.1 GNB

- **NotificationBadge**: **단일 소스** – `dashboard-v2/atoms/NotificationBadge` 만 사용. common/NotificationBadge는 deprecated, 통합 전환 후 제거 또는 “모달 연동형” 별도 유지.
- **통합 배지 숫자**: NotificationContext(unreadCount) 또는 백엔드 통합 unread-count API로 **한 소스**만 사용.
- **드롭다운**: **NotificationDropdown 한 곳**에서 “공지+메시지”(+ 필요 시 alerts) 통합 표시하도록 확장. 드롭다운 전용 작은 리스트 행은 필요 시 Molecule로 추출해 재사용.

### 4.2 관리자

- **시스템 공지 관리**와 **메시지 관리**를 **한 통합 페이지**로 묶고, “공지 블록”과 “메시지 블록”을 각각 Organism으로 분리해 재사용.
- **공통 UI**(헤더, 필터, 카드 목록 패턴)는 **common** 또는 **admin** 공통 Molecule/Organism으로 추출해 **중복 제거**.
- **레이아웃·모달·폼 컴포넌트**: 기존 AdminCommonLayout, UnifiedModal, MGCard, BadgeSelect 등 **적재적소 유지** (common/admin 구분은 위 표 준수).

### 4.3 문서·기획 연계

- **기획(core-planner)**: 배지/드롭다운에 “alerts” 포함 여부, 통합 관리 페이지 라우트명·메뉴 위치 결정 후 디자이너·코더에 전달.
- **디자이너**: GNB 통합 드롭다운(탭/섹션), 관리자 통합 페이지(탭·목록·모달) 스펙·와이어프레임 작성 시 본 구성안 참고.
- **core-coder**: 배치·추출·통합 반영 후, 필요 시 **COMPONENT_INVENTORY**·**COMPONENT_PLACEMENT_PROPOSAL** 갱신을 component-manager에 요청.

---

## 5. 체크리스트 (기획·코더 전달용)

- [ ] GNB 배지: 통합 카운트 소스 확정 (NotificationContext vs 통합 API vs alerts 포함 여부)
- [ ] GNB 드롭다운: 기존 NotificationDropdown 확장으로 “공지+메시지” 탭/섹션 반영
- [ ] common/NotificationBadge: GNB에서 제거 후 deprecated 정리 또는 모달 전용으로 한정
- [ ] 관리자: 통합 페이지 라우트 및 메뉴 항목 확정
- [ ] 관리자: SystemNotificationListBlock, AdminMessageListBlock 등 Organism 추출 범위 확정
- [ ] 공통 헤더/필터/카드 블록: common vs admin 배치 및 네이밍 확정

---

*문서 끝.*
