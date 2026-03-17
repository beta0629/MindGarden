# GNB 통합 알림 · 관리자 통합 페이지 — 퍼블 마크업 전달

**담당**: core-publisher (HTML 마크업만)  
**JS/React·스타일 연동**: core-coder 담당  
**참조**: `docs/design-system/GNB_AND_ADMIN_NOTIFICATION_UI_SPEC.md`, `docs/project-management/GNB_AND_ADMIN_NOTIFICATION_INTEGRATION_POLICY.md`

---

## 저장 위치

| 대상 | 파일 | 코더 반영 위치 제안 |
|------|------|---------------------|
| GNB 통합 알림 | `frontend/src/markup/gnb-notification-dropdown.html` | `frontend/src/components/dashboard-v2/molecules/NotificationDropdown.js` 확장 시 구조 참조 |
| 관리자 통합 페이지 | `frontend/src/markup/admin-notifications-page.html` | `frontend/src/components/admin/` 하위 통합 페이지(예: `AdminNotificationsPage.js` 또는 기존 레이아웃 내 children) |

---

## 1. GNB 통합 알림 — 사용 클래스·구조 요약

### 트리거·배지
- **래퍼**: `mg-v2-notification-trigger-wrapper`
- **트리거 버튼**: `mg-v2-notification-trigger` (aria-label, aria-expanded, aria-haspopup)
- **배지**: `mg-v2-notification-badge` (숫자 또는 99+, count≤0이면 미노출)

### 드롭다운 패널
- **패널**: `mg-v2-dropdown-panel`, `mg-v2-notification-dropdown__panel` (360px/모바일 320px, §1.2)
- **헤더**: `mg-v2-dropdown-panel__header` — 제목 `mg-v2-dropdown-panel__title`("알림"), 우측 "모두 읽음" `mg-v2-btn-text`, `mg-v2-btn-sm`
- **탭 바**: `mg-v2-notification-dropdown__tabs` (role="tablist")  
  - 탭 버튼: `mg-v2-notification-dropdown__tab`, 활성: `mg-v2-notification-dropdown__tab--active`  
  - 2탭: 시스템 공지 | 메시지
- **리스트**: `mg-v2-notification-list` (ul), 한 행: `li` > `button.mg-v2-notification-item`  
  - 미읽음: `mg-v2-notification-item--unread`  
  - 내부: `mg-v2-notification-item__unread-dot`, `__icon`, `__content`, `__header`, `__title`, `__time`, `__message` (발신은 `__message` 또는 `__sender`)
- **푸터**: `mg-v2-dropdown-panel__footer`, 링크 `mg-v2-dropdown-panel__footer-link` → `/notifications`
- **빈/로딩**: `mg-v2-notification-empty` (로딩 중… / 새로운 공지가 없습니다 / 새로운 메시지가 없습니다)

### 시맨틱·접근성
- nav(role="navigation"), button(aria-label), role="tablist"/"tab"/"tabpanel", aria-controls, aria-selected, aria-labelledby

---

## 2. 관리자 통합 페이지 — 사용 클래스·구조 요약

### 순서 (AdminCommonLayout children)
1. **ContentHeader**: `mg-v2-content-header`, `__left`(제목 `__title`, 부제 `__subtitle`), `__right`(공지 작성 버튼: `mg-v2-button`, `mg-v2-button--primary`)
2. **탭 바**: `mg-v2-ad-b0kla__tabs` (role="tablist"), `mg-v2-ad-b0kla__tab`, `mg-v2-ad-b0kla__tab--active` (시스템 공지 | 메시지)
3. **탭별 본문**  
   - **공지 블록**: `mg-v2-ad-b0kla__section`, `mg-v2-ad-b0kla__section-title`, `mg-v2-ad-b0kla__section-filters`, `mg-v2-ad-b0kla__section-body`, 테이블 `mg-v2-ad-b0kla__table`, 빈 행 `mg-v2-ad-b0kla__table-empty`  
   - **메시지 블록**: 동일 section·title·filters·body, 카드 그리드 `mg-v2-ad-b0kla__card-grid`, 카드 `mg-v2-card-container`(공통), 제목/메타/설명 등 B0KlA 카드 클래스

### 코더 작업
- 탭 전환(aria-selected, panel 표시/숨김), 필터·테이블·카드 데이터 바인딩, 공지 작성 버튼 조건부(탭·권한), 라우트 `/admin/notifications`, LNB 메뉴 "알림·메시지 관리" 연동.

---

## 3. 공통 참조

- **토큰**: `frontend/src/styles/unified-design-tokens.css`, `--mg-color-*`, `--ad-b0kla-*`
- **드롭다운 공통**: `frontend/src/components/dashboard-v2/styles/dropdown-common.css`
- **알림 드롭다운 기존 스타일**: `frontend/src/components/dashboard-v2/molecules/NotificationDropdown.css`
- **ContentHeader**: `frontend/src/components/dashboard-v2/content/ContentHeader.js` (기존 클래스 동일 사용)
