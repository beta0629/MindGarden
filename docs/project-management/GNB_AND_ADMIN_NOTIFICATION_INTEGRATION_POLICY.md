# GNB 공통 알림·메시지 통합 및 관리자 페이지 통합 정책

**목표**: (1) GNB 공통 알림과 메시지 기능 통합 (2) 관리자 페이지에서 시스템 공지와 메시지 관리 통합·레이아웃 리뉴얼·고도화  
**기획 산출**: 통합 정책·API 정리·분배실행 표  
**참조**: `GNB_AND_ADMIN_NOTIFICATION_COMPONENT_PROPOSAL.md`, `docs/design-system/GNB_AND_ADMIN_NOTIFICATION_UI_SPEC.md`  
**연계**: GNB **빠른 액션·LNB·DB 메뉴** 동기화·카테고리 재정비는 기획 지휘서 **[GNB_LNB_MENU_SYNCHRONIZATION_DIRECTIVE.md](./GNB_LNB_MENU_SYNCHRONIZATION_DIRECTIVE.md)** 를 따름.

---

## 1. GNB 통합 정책

### 1.1 배지 카운트

| 항목 | 정책 |
|------|------|
| **수식** | 배지 = **(공통 알림 미읽음)** + **(본인 계정 메시지 미읽음)** |
| **공통 알림** | 시스템 공지(`system-notifications`) 미읽음 개수 |
| **본인 메시지** | consultation-messages 기준 본인(역할별) 미읽음 개수 |
| **표시 규칙** | 0 이하 시 배지 비표시. 1~99 숫자, 100 이상은 **"99+"** |
| **데이터 소스** | **NotificationContext** `unreadCount` (= `unreadSystemCount` + `unreadMessageCount`) 사용. 단일 소스 유지. 백엔드 통합 unread-count API 도입 시 전환 가능 |

- 기존 GNB는 `/api/v1/alerts`·`/api/v1/alerts/unread-count`만 사용. 통합 후 **배지**는 위 수식(공지+메시지)으로 전환. **alerts**는 드롭다운에서 별도 탭으로 둘지 제거할지는 선택(현재 스펙은 공지|메시지 2탭).

### 1.2 드롭다운 내용

| 항목 | 정책 |
|------|------|
| **구성** | **탭 2개**: **시스템 공지** \| **메시지** (디자인 스펙 §1.3) |
| **공지 탭** | `GET /api/v1/system-notifications` (역할별·페이지) 최근 N건. 한 행: 아이콘·제목·시간·발신/부가·미읽음 도트 |
| **메시지 탭** | `GET /api/v1/consultation-messages/*` (역할별 엔드포인트) 최근 N건. 동일 한 행 스펙 |
| **헤더** | "알림" + "모두 읽음"(미읽음 > 0일 때만) |
| **푸터** | "알림 전체 보기" → `/notifications` |
| **스펙 상세** | `docs/design-system/GNB_AND_ADMIN_NOTIFICATION_UI_SPEC.md` §1 절 준수 |

---

## 2. 관리자 통합 정책 (IA·메뉴·URL)

### 2.1 URL·라우트

| 항목 | 정책 |
|------|------|
| **통합 페이지** | **단일 URL**: `/admin/notifications` |
| **기존 경로** | `/admin/system-notifications`, `/admin/messages` → **통합 페이지로 리다이렉트** 또는 단기 병존 후 통합 이전 |
| **라우트 상수** | `adminRoutes.js`(또는 해당 파일)에 `NOTIFICATIONS: '/admin/notifications'` 추가. 기존 SYSTEM_NOTIFICATIONS, MESSAGES는 리다이렉트용으로 유지 가능 |

### 2.2 메뉴(IA)

| 항목 | 정책 |
|------|------|
| **LNB** | **"알림·메시지 관리"** 단일 메뉴, 경로 `/admin/notifications` |
| **기존 메뉴** | "시스템 공지"(또는 "알림")·"메시지 관리" 별도 항목은 **통합 메뉴로 대체** 또는 리다이렉트 |
| **권한** | 기존 `SYSTEM_NOTIFICATION_MANAGE` 등 역할별 권한 유지. 공지 CRUD·메시지 조회/필터만 해당 권한에 따라 노출 |

### 2.3 페이지 구성

| 영역 | 정책 |
|------|------|
| **레이아웃** | **AdminCommonLayout** 필수. 본문은 children, title/loading 등만 페이지별 지정 |
| **상단** | ContentHeader: 제목 "알림·메시지 관리", 부제 "시스템 공지 N건 · 메시지 N건" 등 |
| **탭** | **시스템 공지** \| **메시지** (상단 탭, B0KlA·토큰 준수) |
| **공지 탭** | 필터(대상/상태) + 목록(테이블 또는 카드) + "공지 작성" 버튼. 작성/수정/삭제/발행/아카이브 모달 |
| **메시지 탭** | 검색 + 유형/상태 필터 + 메시지 카드 그리드. 클릭 시 상세 모달(읽음 처리) |
| **스펙 상세** | `docs/design-system/GNB_AND_ADMIN_NOTIFICATION_UI_SPEC.md` §2 절 준수 |

---

## 3. API 정리

| 용도 | 메서드 | 엔드포인트 | 비고 |
|------|--------|------------|------|
| **GNB 배지 통합 카운트** | (프론트) | NotificationContext `unreadSystemCount` + `unreadMessageCount` | 단일 소스. 백엔드 통합 시 전환 |
| **GNB 드롭다운 공지 목록** | GET | `/api/v1/system-notifications?page=0&size=10` (역할별) | 기존 |
| **GNB 드롭다운 메시지 목록** | GET | `/api/v1/consultation-messages/consultant/{id}` 등 역할별 | 기존 |
| **공지 읽음 처리** | PUT | 기존 system-notifications read API | 기존 |
| **메시지 읽음 처리** | PUT | 기존 consultation-messages read API | 기존 |
| **관리자 공지 목록** | GET | `/api/v1/system-notifications/admin/all?targetType=...&status=...&page=0&size=50` | 기존 |
| **관리자 공지 CRUD** | POST/PUT/DELETE | `/api/v1/system-notifications/admin`, `.../admin/{id}` 등 | 기존 |
| **관리자 메시지 목록** | GET | `/api/v1/consultation-messages/all` | 기존 |

---

## 4. 분배실행 표 (퍼블리셔 → 코더)

### Phase 4 — 퍼블리셔 (core-publisher)

**담당**: core-publisher  
**전달 프롬프트 요약**:  
기획·디자인 산출물을 바탕으로 **아토믹 디자인 기반 HTML 마크업** 작성.

- **대상 1**: GNB 통합 알림 영역 — 벨 트리거 + 배지 + 드롭다운 패널(탭: 시스템 공지 | 메시지, 헤더·한 행·푸터). `docs/design-system/GNB_AND_ADMIN_NOTIFICATION_UI_SPEC.md` §1 절 클래스·구조 준수. BEM·시맨틱 HTML. JS/React·스타일 연동은 코더 담당으로 명시.
- **대상 2**: 관리자 통합 페이지 — AdminCommonLayout 내부, ContentHeader + 탭(시스템 공지 | 메시지) + 탭별 본문(공지 목록 블록, 메시지 목록 블록) 플레이스홀더. `GNB_AND_ADMIN_NOTIFICATION_UI_SPEC.md` §2 절. JS/React·스타일 연동은 코더 담당.

**참조**: `/core-solution-publisher`, `/core-solution-atomic-design`, `unified-design-tokens.css`, B0KlA.

---

### Phase 5 — 코더 (core-coder)

**담당**: core-coder  
**전달 프롬프트 요약**:  
기획·디자인·퍼블리셔 산출물에 따라 **실제 구현**.

- **GNB 배지**: 공통 알림(시스템 공지) + 본인 메시지 미읽음 통합 카운트 연동. NotificationContext `unreadCount`(unreadSystemCount + unreadMessageCount) 사용. `dashboard-v2/atoms/NotificationBadge` 재사용, count만 통합 값 전달. 99+ 규칙 적용.
- **GNB 드롭다운**: `dashboard-v2/molecules/NotificationDropdown` 확장. 탭 "시스템 공지" | "메시지", 각 탭에서 system-notifications·consultation-messages API 호출, 한 행 스펙(§1.5)·헤더·푸터 반영. 퍼블리셔 HTML 마크업·UI 스펙 문서 반영.
- **관리자 통합 페이지**: `/admin/notifications` 단일 페이지·라우트 추가. AdminCommonLayout 사용, title "알림·메시지 관리". 상단 탭(시스템 공지 | 메시지) + 탭별 SystemNotificationManagement 기반 블록 / AdminMessages 기반 블록 통합(기존 컴포넌트 추출·재사용). LNB 메뉴 "알림·메시지 관리" 추가, 기존 시스템 공지/메시지 메뉴는 통합으로 대체 또는 리다이렉트. `GNB_AND_ADMIN_NOTIFICATION_COMPONENT_PROPOSAL.md`, `GNB_AND_ADMIN_NOTIFICATION_UI_SPEC.md` 반영.
- **common/NotificationBadge**: GNB에서 제거 후 deprecated 정리 또는 모달 전용 한정(컴포넌트 제안서 반영).

**참조**: `/core-solution-frontend`, `/core-solution-api`, `docs/standards/FRONTEND_DEVELOPMENT_STANDARD.md`, MindGarden 코드 스타일.

---

## 5. 완료 기준·체크리스트

- [ ] GNB 배지: 통합 카운트(공지+메시지) 표시, 99+ 규칙, NotificationContext 연동
- [ ] GNB 드롭다운: 2탭(시스템 공지 | 메시지), 각 API 연동, 한 행·헤더·푸터 스펙 반영
- [ ] 관리자: `/admin/notifications` 단일 페이지, AdminCommonLayout, 탭·목록·모달 동작
- [ ] LNB: "알림·메시지 관리" 메뉴 추가, 기존 경로 리다이렉트 또는 통합 대체
- [ ] common/NotificationBadge: GNB에서 제거·deprecated 정리
- [ ] 반응형: 드롭다운 360px/320px, 관리자 탭·목록 모바일 대응

---

*기획(core-planner) 산출. 퍼블리셔·코더는 위 Phase 4·5 프롬프트로 호출.*
