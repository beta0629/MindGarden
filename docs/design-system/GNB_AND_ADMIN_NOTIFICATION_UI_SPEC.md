# GNB 통합 알림 · 관리자 통합 페이지 UI/UX 리뉴얼 스펙

**대상**: (1) GNB 통합 알림(배지+드롭다운) (2) 관리자 통합 페이지(시스템 공지+메시지 관리)  
**담당**: core-designer (디자인·레이아웃·비주얼만, 코드 작성 없음)  
**전달**: 기획(core-planner) 보고 → 코더 구현용 스펙  
**참조**: B0KlA·어드민 대시보드 샘플, `PENCIL_DESIGN_GUIDE.md`, `unified-design-tokens.css`, `GNB_AND_ADMIN_NOTIFICATION_COMPONENT_PROPOSAL.md`

---

## 0. 사용자 관점 요구사항 반영 요약

| 구분 | 사용성 | 정보 노출 | 레이아웃 |
|------|--------|-----------|----------|
| **GNB** | 한 번에 공지+메시지 미확인 개수 확인 → 드롭다운에서 탭으로 구분해 훑어보기 → 전체 보기는 /notifications | 배지: 통합 미읽음 개수만. 드롭다운: 공지/메시지 각 최근 N건, 제목·발신·시간 | 우측 벨+배지 → 클릭 시 드롭다운(탭: 공지 \| 메시지, 리스트+푸터 "알림 전체 보기") |
| **관리자** | 한 화면에서 공지·메시지 탭 전환으로 관리. 읽음 처리·전체 보기·공지 작성 등 자주 쓰는 동작 배치 명시 | 역할별 권한 유지(SYSTEM_NOTIFICATION_MANAGE 등). 공지 CRUD·메시지 조회/필터 | AdminCommonLayout + 상단 탭(시스템 공지 \| 메시지) + 탭별 목록·필터·액션·모달 |

---

## 1. GNB 통합 알림

### 1.1 배지 스펙

| 항목 | 스펙 | 토큰/클래스 |
|------|------|-------------|
| **위치** | 벨 아이콘 우측 상단. 트리거 버튼 기준 `top: 8px`, `right: 8px` (기존 `NotificationBadge` 유지) | `mg-v2-notification-trigger-wrapper` 내부, `mg-v2-notification-badge` |
| **표시 값** | 통합 미읽음 개수. 0 이하일 때 배지 비표시. 1~99는 숫자, **100 이상은 "99+"** | 로직: `displayCount = count > 99 ? '99+' : count` |
| **크기** | min-width 18px, height 18px, padding 0 4px. 폰트 11px, fontWeight 600 | `mg-v2-notification-badge` (기존 유지) |
| **색상** | 배경: `var(--mg-color-error-500)` 또는 #EF4444. 글자: #FFFFFF | 시인성 유지 |
| **형태** | border-radius 9px (원형에 가까운 pill), 한 줄 텍스트 | `mg-v2-notification-badge` |
| **접근성** | `aria-label="읽지 않은 알림 {count}개"` (99+일 때는 "읽지 않은 알림 99개 이상") | 코더 구현 시 반영 |

**배지 데이터 소스**: 통합 미읽음 = 공지 미읽음 + 메시지 미읽음. NotificationContext `unreadCount` 또는 백엔드 통합 unread-count API 한 소스만 사용(기획 확정).

---

### 1.2 드롭다운 패널 레이아웃

| 항목 | 스펙 | 토큰/클래스 |
|------|------|-------------|
| **패널 너비** | 데스크톱 360px, 모바일 320px (max-width: calc(100vw - 32px)) | `mg-v2-notification-dropdown__panel` |
| **패널 높이** | min-height 240px, max-height min(480px, calc(100vh - 80px)). 모바일 max-height calc(100vh - 100px) | 기존 유지 |
| **배경** | `var(--mg-color-surface-main)` (#F5F3EF) | `dropdown-common.css` 패널 |
| **테두리** | 1px `var(--mg-color-border-main)` (#D4CFC8), border-radius 16px | `mg-v2-dropdown-panel` |
| **그림자** | 0 8px 24px rgba(0,0,0,0.12) | B0KlA 드롭다운 일관 |
| **GNB와 조화** | GNB 높이 64px(`--mg-layout-header-height`), 배경 #FAF9F7. 드롭다운은 패널만 #F5F3EF로 구분 | DesktopGnb.css 기준 |

---

### 1.3 드롭다운 탭 UI (공지 | 메시지)

| 항목 | 스펙 | 토큰/클래스 제안 |
|------|------|-----------------|
| **위치** | 패널 헤더 바로 아래. 헤더와 본문 리스트 사이에 탭 바 1줄 | 신규: `mg-v2-notification-dropdown__tabs` |
| **탭 구성** | 2개: **시스템 공지** \| **메시지**. 좌측 정렬, 동일 너비 또는 자동 폭 | `mg-v2-notification-dropdown__tab`, `mg-v2-notification-dropdown__tab--active` |
| **비활성 탭** | 글자 14px, `var(--mg-color-text-secondary)`. 배경 없음. padding 10px 16px | |
| **활성 탭** | 글자 14px, fontWeight 600, `var(--mg-color-text-main)`. 하단 2px 선: `var(--mg-color-primary-main)`, border-radius 2px | B0KlA 세로 악센트와 유사한 강조 |
| **탭 클릭 영역** | 최소 높이 40px (터치 44px 권장). 탭 간 구분선 선택 사항(1px `var(--mg-color-border-main)`) | 반응형 체크리스트 |

---

### 1.4 드롭다운 헤더

| 항목 | 스펙 | 토큰/클래스 |
|------|------|-------------|
| **영역** | 상단 고정. padding 16px 20px, border-bottom 1px `var(--mg-color-border-main)` | `mg-v2-dropdown-panel__header` (기존) |
| **제목** | "알림" 16px, fontWeight 600, `var(--mg-color-text-main)` | `mg-v2-dropdown-panel__title` |
| **우측 액션** | "모두 읽음" 버튼. 미읽음 > 0일 때만 표시. 12px, `var(--mg-color-primary-main)`, 텍스트 버튼 | `mg-v2-btn-text`, `mg-v2-btn-sm` (기존) |

---

### 1.5 한 행(공지/메시지 아이템) 스펙

**공지 한 행**

| 요소 | 스펙 | 토큰/클래스 |
|------|------|-------------|
| **행 높이** | padding 12px 20px. 최소 터치 영역 유지 | `mg-v2-notification-item` |
| **미읽음 표시** | 좌측 8px 원형 도트. `var(--mg-color-primary-main)`. 위치 left 8px, top 16px | `mg-v2-notification-item__unread-dot` (기존) |
| **아이콘** | 32×32px 원형, 배경 `var(--mg-color-primary-light)`, 아이콘 #FFFFFF. 공지 타입 아이콘(예: Bell·Info) | `mg-v2-notification-item__icon` |
| **제목** | 14px, fontWeight 600, `var(--mg-color-text-main)`. 1줄 말줄임 | `mg-v2-notification-item__title` |
| **시간** | 11px, `var(--mg-color-text-secondary)`. 행 헤더 우측 | `mg-v2-notification-item__time` |
| **발신/부가** | 선택: 13px, `var(--mg-color-text-secondary)`, 2줄 말줄임. 공지면 "시스템" 등 라벨 | `mg-v2-notification-item__message` (기존 활용) |
| **배경** | 기본 none. 미읽음: rgba(61,82,70,0.05). hover: `var(--mg-color-background-main)` | `mg-v2-notification-item--unread`, 기존 hover |

**메시지 한 행**

| 요소 | 스펙 | 비고 |
|------|------|------|
| **구조** | 공지 한 행과 동일 레이아웃. 아이콘은 메시지 타입(MessageSquare 등) | 동일 클래스 재사용 가능 |
| **제목** | 메시지 제목 또는 내용 요약 1줄 | |
| **발신** | 발신자 표시(예: "상담사명 → 내담자명"). 13px 보조 텍스트 | `mg-v2-notification-item__message` 또는 `mg-v2-notification-item__sender` (신규) |
| **시간** | 동일 11px | |

**리스트 공통**

- 각 탭별로 **최근 N건**(예: 5~10건)만 표시. 스크롤 시 동일 패널 내 max-height 400px, `overflow-y: auto`.
- 스크롤바: width 6px, track `var(--mg-color-border-main)`, thumb `var(--mg-color-primary-main)` (기존 유지).

---

### 1.6 드롭다운 푸터

| 항목 | 스펙 | 토큰/클래스 |
|------|------|-------------|
| **영역** | 패널 하단 고정. padding 12px 20px, border-top 1px `var(--mg-color-border-main)` | `mg-v2-dropdown-panel__footer` (기존) |
| **링크** | "알림 전체 보기" → `/notifications`. 13px, fontWeight 500, `var(--mg-color-primary-main)`. hover underline | `mg-v2-dropdown-panel__footer-link` (기존) |
| **표시 조건** | 리스트에 1건이라도 있으면 푸터 표시. 빈 리스트만 있으면 푸터 생략 가능(기획 확정) | |

---

### 1.7 빈 상태·로딩

| 상태 | 스펙 |
|------|------|
| **로딩** | 리스트 영역 중앙 "로딩 중..." 14px `var(--mg-color-text-secondary)`, padding 40px 20px |
| **공지 0건** | "새로운 공지가 없습니다" (탭이 공지일 때) |
| **메시지 0건** | "새로운 메시지가 없습니다" (탭이 메시지일 때) |
| **전체 0건** | 탭 전환 시 각 탭별 빈 메시지. 클래스 `mg-v2-notification-empty` (기존) |

---

### 1.8 GNB 통합 알림 블록 순서(코더 구현용)

1. 트리거: 벨 아이콘 + 배지(통합 count).
2. 패널 열림: 오버레이(모바일) + 패널(position fixed).
3. 패널 내부 순서: **헤더**(제목 + 모두 읽음) → **탭 바**(시스템 공지 | 메시지) → **리스트**(탭별 최근 N건, 한 행 스펙 위 참고) → **푸터**(알림 전체 보기).

---

## 2. 관리자 통합 페이지 (시스템 공지 + 메시지 관리)

### 2.1 URL · 진입 경로

| 항목 | 제안 |
|------|------|
| **URL** | `/admin/notifications` (또는 기획 확정명 `/admin/notifications-management`) |
| **LNB 메뉴** | **단일 메뉴** "알림·메시지 관리" (또는 "알림 관리"). 기존 "시스템 공지"·"메시지" 항목 제거 후 통합 메뉴 1개로 진입. |
| **라벨** | LNB 표시: "알림·메시지 관리". 브레드크럼: 홈 > 알림·메시지 관리. |

---

### 2.2 레이아웃 구조 (AdminCommonLayout 기준)

- **레이아웃**: `AdminCommonLayout` 그대로 사용. 좌측 LNB(260px) + 메인 영역.
- **메인 영역 순서**:
  1. **ContentHeader** (제목 + 부제/요약 + 액션)
  2. **탭 바** (시스템 공지 | 메시지)
  3. **탭별 본문** (공지 목록 블록 또는 메시지 목록 블록)

---

### 2.3 ContentHeader 영역

| 항목 | 스펙 | 토큰/클래스 |
|------|------|-------------|
| **제목** | "알림·메시지 관리". 28px, fontWeight 700, `var(--ad-b0kla-title-color)` | `mg-v2-content-header__title` |
| **부제/요약** | 예: "시스템 공지 N건 · 메시지 N건" 또는 "공지 작성과 메시지 조회를 한 화면에서 관리합니다." 15px, `var(--ad-b0kla-subtitle-color)` | `mg-v2-content-header__subtitle` |
| **우측 액션** | **공지** 탭 활성 시: "공지 작성" 버튼(주조 버튼). 권한 SYSTEM_NOTIFICATION_MANAGE 있을 때만 표시. **메시지** 탭에서는 버튼 숨김 또는 "내보내기" 등 (기획 확정) | `mg-v2-content-header__right`. 버튼: B0KlA 주조 버튼(height 40px, radius 10px, `var(--mg-color-primary-main)`) |

---

### 2.4 상단 탭 (시스템 공지 | 메시지)

| 항목 | 스펙 | 토큰/클래스 제안 |
|------|------|-----------------|
| **위치** | ContentHeader 아래, 본문 섹션 블록 위. 헤더와 1블록 간격(gap 16px~24px) | `mg-v2-ad-b0kla__tabs` 또는 공통 탭 컴포넌트 |
| **탭 수** | 2개: **시스템 공지** \| **메시지** | |
| **스타일** | 탭 버튼/링크 형태. 비활성: 16px, `var(--mg-color-text-secondary)`. 활성: 16px, fontWeight 600, `var(--mg-color-text-main)` + 하단 4px 악센트 바 `var(--mg-color-primary-main)`, border-radius 2px | B0KlA 섹션 제목 악센트와 동일 톤 |
| **탭 높이** | 최소 44px (터치). padding 12px 20px | |
| **전환** | 클릭 시 탭 전환, URL 쿼리 유지 권장(?tab=system \| messages) | 코더 구현 |

---

### 2.5 탭별 본문 — 공지 목록 블록

| 영역 | 스펙 | 토큰/클래스 |
|------|------|-------------|
| **감싸기** | 섹션 블록 1개. 배경 `var(--mg-color-surface-main)`, 테두리 1px `var(--mg-color-border-main)`, border-radius 16px, padding 24px, gap 16px | B0KlA 섹션 블록. `mg-v2-ad-b0kla__section` 등 |
| **블록 제목** | 선택: "공지 목록". 왼쪽 세로 악센트 4px, #3D5246, radius 2px + 제목 16px 600 | `mg-v2-ad-b0kla__section-title` |
| **필터** | 대상(전체/역할별)·상태(전체/게시중/만료 등). 검색 선택. BadgeSelect 또는 드롭다운. 배치: 블록 상단 가로, 좌측 필터·우측 "공지 작성" 반복 가능 | 기존 SystemNotificationManagement 필터 패턴 |
| **목록** | 테이블 또는 카드 목록. 컬럼: 제목, 대상, 상태, 등록일, 액션(수정/삭제/게시). 역할별 권한에 따라 액션 표시 | 테이블: B0KlA 테이블 스타일. 카드: MGCard, 좌측 악센트 4px |
| **빈 상태** | "등록된 공지가 없습니다." 14px `var(--mg-color-text-secondary)`, 중앙 정렬 | |

---

### 2.6 탭별 본문 — 메시지 목록 블록

| 영역 | 스펙 | 토큰/클래스 |
|------|------|-------------|
| **감싸기** | 동일 섹션 블록 (공지와 동일 시각) | |
| **필터** | 검색(제목/내용/발신·수신자) + 유형(전체/일반/후속조치 등) + 상태(전체/읽음/미읽음). BadgeSelect·입력창 | 기존 AdminMessages 필터 패턴 |
| **목록** | 카드 그리드 권장. 카드 1장: 발신→수신, 제목, 일부 내용, 시간, 미읽음 뱃지. 클릭 시 상세 모달 | MGCard, 그리드 gap 16px~24px |
| **반응형** | 모바일: 1열. 태블릿 2열. 데스크톱 3~4열. RESPONSIVE_LAYOUT_SPEC 브레이크포인트 준수 | |

---

### 2.7 모달

| 모달 | 스펙 | 비고 |
|------|------|------|
| **공지 작성/수정** | UnifiedModal + B0KlA 스타일. 필드: 대상, 제목, 내용, 유형, 중요/긴급, 만료일. 버튼: 취소(아웃라인) + 저장(주조) | 기존 SystemNotificationManagement 모달 추출·재사용 |
| **메시지 상세** | UnifiedModal. 읽음 처리. 표시: 발신/수신, 제목, 본문, 시간. 닫기 버튼 | 기존 AdminMessages 상세 모달 재사용 |
| **공통** | 오버레이·패널 색상·radius는 UnifiedModal·B0KlA 유지. 코드 작성 없음 | design-handoff 스킬 참조 |

---

### 2.8 반응형 요약

| 브레이크포인트 | 관리자 페이지 |
|----------------|----------------|
| **모바일 (375px~)** | 탭: 가로 스크롤 또는 2단 누적. 목록: 1열. 필터: 세로 쌓기. 터치 44px 이상 |
| **태블릿 (768px~)** | 탭 동일. 목록 2열. 필터 가로 유지 |
| **데스크톱 (1280px~)** | 탭 2개 가로. 목록 3~4열(메시지 카드). ContentHeader wrap 시 액션 아래로 |

---

### 2.9 관리자 페이지 블록 순서(코더 구현용)

1. AdminCommonLayout
2. 메인: ContentHeader(제목 "알림·메시지 관리" + 부제 + 우측 "공지 작성" 조건부)
3. 탭 바: 시스템 공지 | 메시지
4. (탭=공지) 공지 목록 블록: 필터 → 테이블/카드 목록 → (클릭) 공지 작성/수정 모달
5. (탭=메시지) 메시지 목록 블록: 검색/필터 → 메시지 카드 그리드 → (클릭) 메시지 상세 모달

---

## 3. IA·메뉴 제안 (core-planner 전달)

| 항목 | 제안 |
|------|------|
| **LNB 단일 메뉴** | 라벨: "알림·메시지 관리" (또는 "알림 관리"). 경로: `/admin/notifications`. 기존 `/admin/system-notifications`, `/admin/messages`는 통합 페이지로 리다이렉트 또는 단기 병존 후 이전. |
| **메뉴 위치** | 관리 영역 내 "시스템 설정"·"메시지" 인근. DB 기반 LNB(/api/v1/menus/lnb) 반영 시 해당 메뉴 1개 등록. |
| **권한** | SYSTEM_NOTIFICATION_MANAGE 있으면 공지 탭·공지 작성 노출. 메시지 조회는 기존 메시지 관리 권한과 정합성 유지. |

---

## 4. 완료 기준 체크리스트 (코더 구현 가능 여부)

- [ ] **GNB 배지**: 통합 미읽음 개수, 99+ 표시 규칙, 위치·크기·색상·클래스 명시됨.
- [ ] **GNB 드롭다운**: 패널 너비·높이·탭(공지|메시지)·한 행(아이콘·제목·발신·시간·읽음)·푸터 "알림 전체 보기" 구조와 토큰 명시됨.
- [ ] **관리자 페이지**: ContentHeader(제목·부제·액션)·탭(시스템 공지|메시지)·탭별 블록(필터·목록)·모달 관계와 B0KlA·토큰 참조 명시됨.
- [ ] **반응형**: 모바일 탭·목록·터치 영역 방향 제시됨.
- [ ] **IA**: LNB 단일 메뉴 라벨·경로 제안됨.

---

**문서 끝.**  
기획(core-planner) 검토 후 코더(core-coder) 구현 시 본 스펙과 `GNB_AND_ADMIN_NOTIFICATION_COMPONENT_PROPOSAL.md`를 함께 참조할 것.
