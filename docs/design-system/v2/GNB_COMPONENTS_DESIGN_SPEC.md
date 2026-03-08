# GNB 컴포넌트 디자인 스펙 (역할별 기능 명세 기반)

**작성일**: 2026-03-09  
**최종 수정**: 2026-03-09  
**작성자**: Core Designer  
**목적**: 역할별 GNB 기능 명세를 기반으로 NotificationDropdown, QuickActionsDropdown, ProfileDropdown 컴포넌트의 UI/UX 설계 및 코더 전달용 handoff 문서

**참조**:
- 펜슬 가이드: `docs/design-system/PENCIL_DESIGN_GUIDE.md`
- 반응형 레이아웃: `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md`
- 어드민 대시보드 샘플: https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample
- 기존 GnbRight: `frontend/src/components/dashboard-v2/molecules/GnbRight.js`
- 디자인 토큰: `frontend/src/styles/unified-design-tokens.css`

---

## 0. 전체 GNB 구조 및 배치 우선순위

### 0.1 사용자 관점 우선 원칙

**사용성**:
- 각 역할이 자주 쓰는 기능을 빠르게 접근 (최대 2클릭)
- ADMIN: 시스템 관리, 사용자 관리, 통계 확인
- CONSULTANT: 일지 작성, 일정 확인
- CLIENT: 예약, 알림 확인
- STAFF: 일정 관리, 알림 확인

**정보 노출 범위**:
- 알림 개수 (badge)
- 프로필 이름·아바타
- 민감 정보는 드롭다운 내부에만 표시

**시스템 특성**:
- 현재 시스템은 테넌트 단위의 독립적인 어드민
- 테넌트 정보는 세션에서 자동 관리
- 각 테넌트는 독립적인 사용자·데이터 관리

### 0.2 GnbRight 배치 순서 (좌→우)

```
┌────────────────────────────────────────────────────────┐
│ [로고] [메뉴]          [검색] [알림] [빠른액션] [프로필] │
└────────────────────────────────────────────────────────┘
```

**우측 정렬 요소 (GnbRight)**:
1. **SearchInput** (300px) — 통합 검색
2. **NotificationDropdown** (Bell 아이콘 + badge) — 알림
3. **QuickActionsDropdown** (Zap 아이콘, 역할별) — 빠른 액션
4. **ProfileDropdown** (User 아이콘 + 이름) — 프로필·로그아웃

**간격**:
- 요소 간 gap: 12px (데스크톱), 8px (모바일)
- 아이콘 버튼: 44×44px (터치 영역 최소)

### 0.3 반응형 전략

| 브레이크포인트 | 레이아웃 | 비고 |
|---------------|---------|------|
| **모바일** (375px) | 햄버거 메뉴 + 우측 알림·프로필만 표시 | 검색·빠른액션은 드로어 내부 |
| **태블릿** (768px) | 검색 축소(200px) + 알림·빠른액션·프로필 | 테넌트는 드롭다운 |
| **데스크톱** (1280px+) | 전체 표시 (검색 300px) | 모든 요소 표시 |

---

## 1. NotificationDropdown 컴포넌트 스펙

### 1.1 개요

**목적**: 사용자에게 실시간 알림을 표시하고, 읽지 않은 알림 개수를 badge로 노출  
**위치**: GnbRight 내, SearchInput 다음  
**역할별 차이**: 모든 역할 공통 (알림 내용만 역할별로 다름)

### 1.2 트리거 버튼 (Atom)

**컴포넌트명**: `NotificationTrigger`

**구조**:
- 클래스: `mg-v2-nav-icon mg-v2-notification-trigger`
- 크기: 44×44px (터치 영역)
- 아이콘: Bell (lucide-react), 22px, strokeWidth 1.8
- 색상: `var(--mg-color-text-main)` (#2C2C2C)
- hover: 배경 `var(--mg-color-surface-main)` (#F5F3EF), border-radius 10px

**Badge (읽지 않은 알림 개수)**:
- 클래스: `mg-v2-notification-badge`
- 위치: 우측 상단 (absolute, top: 8px, right: 8px)
- 크기: 18×18px (최소), 숫자가 2자리 이상이면 너비 자동 확장
- 배경: `var(--mg-color-error-500)` (#EF4444)
- 텍스트: #FFFFFF, 11px, fontWeight 600
- border-radius: 9px (원형)
- 조건: count > 0일 때만 표시, count > 99이면 "99+"

### 1.3 드롭다운 패널 (Molecule)

**컴포넌트명**: `NotificationDropdownPanel`

**컨테이너**:
- 클래스: `mg-v2-dropdown-panel mg-v2-notification-dropdown`
- 위치: absolute, top: calc(100% + 8px), right: 0
- 너비: 360px (데스크톱), 320px (모바일)
- 최대 높이: 480px
- 배경: `var(--mg-color-surface-main)` (#F5F3EF)
- 테두리: 1px solid `var(--mg-color-border-main)` (#D4CFC8)
- border-radius: 16px
- 그림자: `0 8px 24px rgba(0, 0, 0, 0.12)`
- z-index: 1000

**헤더**:
- 클래스: `mg-v2-dropdown-panel__header`
- 패딩: 16px 20px
- 테두리 하단: 1px solid `var(--mg-color-border-main)`
- display: flex, justify-content: space-between, align-items: center

**헤더 좌측 (제목)**:
- 텍스트: "알림"
- 폰트: Noto Sans KR, 16px, fontWeight 600
- 색상: `var(--mg-color-text-main)` (#2C2C2C)

**헤더 우측 (전체 읽음 처리 버튼)**:
- 클래스: `mg-v2-btn-text mg-v2-btn-sm`
- 텍스트: "모두 읽음"
- 폰트: 12px, fontWeight 500
- 색상: `var(--mg-color-primary-main)` (#3D5246)
- hover: 밑줄 추가

**알림 리스트**:
- 클래스: `mg-v2-notification-list`
- 스크롤: overflow-y: auto
- 최대 높이: 400px
- 패딩: 0

**알림 항목 (NotificationItem)**:
- 클래스: `mg-v2-notification-item` + `--unread` (읽지 않은 경우)
- 패딩: 12px 20px
- 테두리 하단: 1px solid `var(--mg-color-border-main)`
- hover: 배경 `var(--mg-color-background-main)` (#FAF9F7)
- cursor: pointer

**알림 항목 구조**:
```
┌────────────────────────────────────────┐
│ [아이콘] [제목]              [시간]      │
│          [내용 미리보기]                │
│          [읽지 않음 인디케이터]          │
└────────────────────────────────────────┘
```

**알림 항목 - 아이콘**:
- 크기: 32×32px
- 배경: 원형, 알림 타입별 색상
  - 일반: `var(--mg-color-primary-light)` (#4A6354)
  - 긴급: `var(--mg-color-error-500)` (#EF4444)
  - 정보: `var(--mg-color-info-500)` (파란색)
- 아이콘 색상: #FFFFFF, 16px

**알림 항목 - 제목**:
- 폰트: Noto Sans KR, 14px, fontWeight 600
- 색상: `var(--mg-color-text-main)` (#2C2C2C)
- 최대 1줄, overflow: ellipsis

**알림 항목 - 시간**:
- 폰트: 11px, fontWeight 400
- 색상: `var(--mg-color-text-secondary)` (#5C6B61)
- 우측 정렬

**알림 항목 - 내용**:
- 폰트: 13px, fontWeight 400
- 색상: `var(--mg-color-text-secondary)` (#5C6B61)
- 최대 2줄, overflow: ellipsis
- margin-top: 4px

**읽지 않음 인디케이터**:
- 클래스: `mg-v2-notification-item__unread-dot`
- 크기: 8×8px
- 배경: `var(--mg-color-primary-main)` (#3D5246)
- border-radius: 4px (원형)
- 위치: 좌측 상단 (absolute, left: 8px, top: 16px)

**빈 상태**:
- 클래스: `mg-v2-notification-empty`
- 텍스트: "새로운 알림이 없습니다"
- 폰트: 14px, 색상 `var(--mg-color-text-secondary)`
- 패딩: 40px 20px
- 텍스트 중앙 정렬

**푸터 (전체 보기 링크)**:
- 클래스: `mg-v2-dropdown-panel__footer`
- 패딩: 12px 20px
- 테두리 상단: 1px solid `var(--mg-color-border-main)`
- 텍스트: "알림 전체 보기"
- 폰트: 13px, fontWeight 500
- 색상: `var(--mg-color-primary-main)` (#3D5246)
- 텍스트 중앙 정렬
- hover: 밑줄 추가

---

## 2. QuickActionsDropdown 컴포넌트 스펙

### 2.1 개요

**목적**: 역할별로 자주 사용하는 기능을 빠른 액션으로 제공 (최대 2클릭)  
**위치**: GnbRight 내, NotificationDropdown 다음  
**역할별 차이**: 역할에 따라 표시되는 액션 목록이 다름

### 2.2 트리거 버튼 (Atom)

**컴포넌트명**: `QuickActionsTrigger`

**구조**:
- 클래스: `mg-v2-nav-icon mg-v2-quick-actions-trigger`
- 크기: 44×44px
- 아이콘: Zap (lucide-react), 22px, strokeWidth 1.8
- 색상: `var(--mg-color-text-main)` (#2C2C2C)
- hover: 배경 `var(--mg-color-surface-main)` (#F5F3EF), border-radius 10px

### 2.3 드롭다운 패널 (Molecule)

**컨테이너**:
- 클래스: `mg-v2-dropdown-panel mg-v2-quick-actions-dropdown`
- 위치: absolute, top: calc(100% + 8px), right: 0
- 너비: 280px
- 배경: `var(--mg-color-surface-main)` (#F5F3EF)
- 테두리: 1px solid `var(--mg-color-border-main)` (#D4CFC8)
- border-radius: 16px
- 그림자: `0 8px 24px rgba(0, 0, 0, 0.12)`
- z-index: 1000

**헤더**:
- 클래스: `mg-v2-dropdown-panel__header`
- 패딩: 16px 20px
- 테두리 하단: 1px solid `var(--mg-color-border-main)`
- 텍스트: "빠른 액션"
- 폰트: Noto Sans KR, 16px, fontWeight 600
- 색상: `var(--mg-color-text-main)` (#2C2C2C)

**액션 리스트**:
- 클래스: `mg-v2-quick-actions-list`
- 패딩: 8px 0

**액션 항목 (QuickActionItem)**:
- 클래스: `mg-v2-quick-action-item`
- 패딩: 12px 20px
- display: flex, align-items: center, gap: 12px
- hover: 배경 `var(--mg-color-background-main)` (#FAF9F7)
- cursor: pointer

**액션 항목 구조**:
```
┌────────────────────────────────┐
│ [아이콘] [라벨]          [→]   │
└────────────────────────────────┘
```

**액션 항목 - 아이콘**:
- 크기: 20×20px
- 색상: `var(--mg-color-primary-main)` (#3D5246)
- lucide-react 아이콘 사용

**액션 항목 - 라벨**:
- 폰트: Noto Sans KR, 14px, fontWeight 500
- 색상: `var(--mg-color-text-main)` (#2C2C2C)

**액션 항목 - 화살표**:
- 아이콘: ChevronRight (lucide-react), 16px
- 색상: `var(--mg-color-text-secondary)` (#5C6B61)
- margin-left: auto

### 2.4 역할별 빠른 액션 목록

#### ADMIN (관리자)

| 순서 | 아이콘 | 라벨 | 액션 |
|-----|--------|------|------|
| 1 | LayoutDashboard | 대시보드 보기 | /admin/dashboard 이동 |
| 2 | Users | 사용자 관리 | /admin/users 이동 |
| 3 | Settings | 시스템 설정 | /admin/settings 이동 |
| 4 | FileText | 통계 리포트 | /admin/reports 이동 |
| 5 | Database | 백업 관리 | /admin/backup 이동 |

#### CONSULTANT (상담사)

| 순서 | 아이콘 | 라벨 | 액션 |
|-----|--------|------|------|
| 1 | FileEdit | 상담일지 작성 | 일지 작성 모달 열기 |
| 2 | Calendar | 일정 확인 | /consultant/schedule 이동 |
| 3 | Users | 내담자 관리 | /consultant/clients 이동 |
| 4 | MessageSquare | 메시지 발송 | 메시지 모달 열기 |
| 5 | Clock | 휴가 신청 | 휴가 모달 열기 |

#### CLIENT (내담자)

| 순서 | 아이콘 | 라벨 | 액션 |
|-----|--------|------|------|
| 1 | CalendarPlus | 상담 예약 | /client/booking 이동 |
| 2 | Calendar | 내 일정 | /client/schedule 이동 |
| 3 | FileText | 상담 기록 | /client/records 이동 |
| 4 | Star | 상담사 평가 | 평가 모달 열기 |

#### STAFF (사무원)

| 순서 | 아이콘 | 라벨 | 액션 |
|-----|--------|------|------|
| 1 | Calendar | 일정 관리 | /staff/schedule 이동 |
| 2 | Users | 내담자 관리 | /staff/clients 이동 |
| 3 | FileText | 기록 조회 | /staff/records 이동 |
| 4 | Bell | 알림 발송 | 알림 모달 열기 |

---

## 3. ProfileDropdown 컴포넌트 스펙

### 3.1 개요

**목적**: 사용자 프로필 정보 표시 및 계정 관련 액션 제공 (설정, 로그아웃)  
**위치**: GnbRight 내, QuickActionsDropdown 다음  
**역할별 차이**: 공통 (역할 표시만 다름)

### 3.2 트리거 버튼 (Molecule)

**컴포넌트명**: `ProfileTrigger`

**구조**:
- 클래스: `mg-v2-profile-trigger`
- display: flex, align-items: center, gap: 8px
- 패딩: 6px 12px 6px 6px
- 높이: 44px
- border-radius: 22px (pill 형태)
- 배경: transparent
- hover: 배경 `var(--mg-color-surface-main)` (#F5F3EF)
- cursor: pointer

**아바타**:
- 클래스: `mg-v2-profile-trigger__avatar`
- 크기: 32×32px
- border-radius: 16px (원형)
- 배경: `var(--mg-color-primary-main)` (#3D5246) — 이미지 없을 때
- 텍스트: 이름 첫 글자, 14px, fontWeight 600, #FFFFFF
- 이미지: object-fit: cover

**이름**:
- 클래스: `mg-v2-profile-trigger__name`
- 폰트: Noto Sans KR, 14px, fontWeight 500
- 색상: `var(--mg-color-text-main)` (#2C2C2C)
- 최대 너비: 120px, overflow: ellipsis
- 모바일에서 숨김 (display: none)

**드롭다운 아이콘**:
- 아이콘: ChevronDown (lucide-react), 16px
- 색상: `var(--mg-color-text-secondary)` (#5C6B61)
- 모바일에서 숨김

### 3.3 드롭다운 패널 (Molecule)

**컨테이너**:
- 클래스: `mg-v2-dropdown-panel mg-v2-profile-dropdown`
- 위치: absolute, top: calc(100% + 8px), right: 0
- 너비: 260px
- 배경: `var(--mg-color-surface-main)` (#F5F3EF)
- 테두리: 1px solid `var(--mg-color-border-main)` (#D4CFC8)
- border-radius: 16px
- 그림자: `0 8px 24px rgba(0, 0, 0, 0.12)`
- z-index: 1000

**프로필 헤더**:
- 클래스: `mg-v2-profile-dropdown__header`
- 패딩: 20px
- 테두리 하단: 1px solid `var(--mg-color-border-main)`

**프로필 헤더 구조**:
```
┌────────────────────────────┐
│ [아바타]                    │
│ [이름]                      │
│ [이메일]                    │
│ [역할 배지]                 │
└────────────────────────────┘
```

**프로필 헤더 - 아바타**:
- 크기: 56×56px
- border-radius: 28px (원형)
- 배경: `var(--mg-color-primary-main)` (#3D5246)
- 텍스트: 이름 첫 글자, 24px, fontWeight 600, #FFFFFF
- margin-bottom: 12px

**프로필 헤더 - 이름**:
- 폰트: Noto Sans KR, 16px, fontWeight 600
- 색상: `var(--mg-color-text-main)` (#2C2C2C)
- margin-bottom: 4px

**프로필 헤더 - 이메일**:
- 폰트: 13px, fontWeight 400
- 색상: `var(--mg-color-text-secondary)` (#5C6B61)
- margin-bottom: 8px

**프로필 헤더 - 역할 배지**:
- 클래스: `mg-v2-badge mg-v2-badge-role`
- 패딩: 4px 10px
- border-radius: 6px
- 폰트: 11px, fontWeight 600
- 배경·색상 (역할별):
  - ADMIN: 배경 #3D5246, 텍스트 #FFFFFF
  - CONSULTANT: 배경 #6B7F72, 텍스트 #FFFFFF
  - CLIENT: 배경 #8B7355, 텍스트 #FFFFFF
  - STAFF: 배경 #D4CFC8, 텍스트 #2C2C2C

**메뉴 리스트**:
- 클래스: `mg-v2-profile-dropdown__menu`
- 패딩: 8px 0

**메뉴 항목 (ProfileMenuItem)**:
- 클래스: `mg-v2-profile-menu-item`
- 패딩: 12px 20px
- display: flex, align-items: center, gap: 12px
- hover: 배경 `var(--mg-color-background-main)` (#FAF9F7)
- cursor: pointer

**메뉴 항목 구조**:
```
┌────────────────────────────┐
│ [아이콘] [라벨]             │
└────────────────────────────┘
```

**메뉴 항목 - 아이콘**:
- 크기: 18×18px
- 색상: `var(--mg-color-text-main)` (#2C2C2C)

**메뉴 항목 - 라벨**:
- 폰트: Noto Sans KR, 14px, fontWeight 500
- 색상: `var(--mg-color-text-main)` (#2C2C2C)

**공통 메뉴 항목**:
1. User 아이콘 + "내 정보" → /mypage
2. Settings 아이콘 + "설정" → /settings
3. LogOut 아이콘 + "로그아웃" → 로그아웃 처리 (색상: `var(--mg-color-error-500)`)

---

## 4. 드롭다운 공통 스타일 및 인터랙션

### 4.1 드롭다운 애니메이션

**등장 (fade-in + slide-down)**:
- 초기: opacity 0, transform: translateY(-8px)
- 최종: opacity 1, transform: translateY(0)
- duration: 200ms
- easing: cubic-bezier(0.4, 0, 0.2, 1)

**사라짐 (fade-out)**:
- opacity: 0
- duration: 150ms

### 4.2 오버레이 (모바일)

**모바일에서 드롭다운 열릴 때**:
- 클래스: `mg-v2-dropdown-overlay`
- 위치: fixed, top: 0, left: 0, right: 0, bottom: 0
- 배경: rgba(0, 0, 0, 0.4)
- z-index: 999
- 클릭 시 드롭다운 닫기

### 4.3 스크롤바 스타일

**드롭다운 내부 스크롤**:
- 너비: 6px
- 배경: `var(--mg-color-border-main)` (#D4CFC8)
- thumb 배경: `var(--mg-color-primary-main)` (#3D5246)
- thumb border-radius: 3px
- hover: thumb 배경 `var(--mg-color-primary-light)` (#4A6354)

---

## 5. 반응형 브레이크포인트 정의

### 5.1 데스크톱 (1280px+)

**GnbRight 전체**:
- 모든 요소 표시
- SearchInput: 300px
- gap: 12px

**드롭다운**:
- 표준 너비 (NotificationDropdown 360px, QuickActionsDropdown 280px, ProfileDropdown 260px)

### 5.2 태블릿 (768px ~ 1279px)

**GnbRight**:
- SearchInput: 200px (축소)
- 이름·텍스트 일부 숨김
- gap: 10px

**드롭다운**:
- 너비 유지

### 5.3 모바일 (375px ~ 767px)

**GnbRight**:
- SearchInput 숨김 (햄버거 메뉴 내부로 이동)
- 알림·프로필만 표시
- QuickActionsDropdown은 햄버거 메뉴 내부
- gap: 8px

**드롭다운**:
- 너비: 320px (화면 너비 - 32px)
- 최대 너비: calc(100vw - 32px)
- 오버레이 추가

**ProfileTrigger (모바일)**:
- 아바타만 표시 (32×32px)
- 이름·드롭다운 아이콘 숨김

---

## 6. 접근성 (Accessibility)

### 6.1 키보드 네비게이션

- **Tab**: 트리거 버튼 → 드롭다운 항목 순회
- **Enter/Space**: 트리거 버튼 클릭, 항목 선택
- **Escape**: 드롭다운 닫기
- **Arrow Up/Down**: 드롭다운 내 항목 이동

### 6.2 ARIA 속성

**트리거 버튼**:
- `aria-label`: "알림", "빠른 액션", "프로필 메뉴"
- `aria-expanded`: true/false (드롭다운 열림 상태)
- `aria-haspopup`: "menu"

**드롭다운 패널**:
- `role`: "menu"
- `aria-labelledby`: 트리거 버튼 id

**드롭다운 항목**:
- `role`: "menuitem"
- `tabindex`: 0

### 6.3 스크린 리더

- Badge 숫자: `aria-label="읽지 않은 알림 {count}개"`
- 빈 상태: `role="status"`, `aria-live="polite"`

---

## 7. 상태 관리 및 인터랙션

### 7.1 드롭다운 열림/닫힘

**열림 조건**:
- 트리거 버튼 클릭
- 키보드 Enter/Space

**닫힘 조건**:
- 외부 영역 클릭 (overlay 클릭 포함)
- Escape 키
- 항목 선택 후 (액션 실행)
- 다른 드롭다운 열릴 때

**동시 열림 방지**:
- 하나의 드롭다운만 열림
- 새 드롭다운 열 때 기존 드롭다운 자동 닫기

### 7.2 알림 읽음 처리

**자동 읽음**:
- 알림 항목 클릭 시 자동으로 읽음 처리
- API 호출: `/api/v1/alerts/{id}/read` (PUT)

**전체 읽음**:
- "모두 읽음" 버튼 클릭
- API 호출: `/api/v1/alerts/read-all` (PUT)
- 성공 시 badge 숫자 0으로 업데이트

---

## 8. 디자인 토큰 사용 요약

### 8.1 색상 토큰

| 용도 | 토큰명 | 참조값 |
|------|--------|--------|
| 주조 (Primary) | `var(--mg-color-primary-main)` | #3D5246 |
| 주조 밝음 | `var(--mg-color-primary-light)` | #4A6354 |
| 보조 (Secondary) | `var(--mg-color-secondary-main)` | #6B7F72 |
| 포인트 (Accent) | `var(--mg-color-accent-main)` | #8B7355 |
| 메인 배경 | `var(--mg-color-background-main)` | #FAF9F7 |
| 서페이스/카드 | `var(--mg-color-surface-main)` | #F5F3EF |
| 테두리 | `var(--mg-color-border-main)` | #D4CFC8 |
| 본문 텍스트 | `var(--mg-color-text-main)` | #2C2C2C |
| 보조 텍스트 | `var(--mg-color-text-secondary)` | #5C6B61 |
| 에러 | `var(--mg-color-error-500)` | #EF4444 |
| 정보 | `var(--mg-color-info-500)` | 파란색 |

### 8.2 간격 토큰

| 용도 | 값 | 비고 |
|------|-----|------|
| 드롭다운 패딩 | 20px | 좌우 여백 |
| 항목 패딩 | 12px 20px | 상하·좌우 |
| 항목 gap | 12px | 아이콘-텍스트 간격 |
| 요소 gap | 12px (데스크톱), 8px (모바일) | GnbRight 내 요소 간격 |

### 8.3 radius 토큰

| 용도 | 값 |
|------|-----|
| 드롭다운 패널 | 16px |
| 버튼·트리거 | 10px |
| 아바타 | 50% (원형) |
| Badge | 50% (pill) |

### 8.4 그림자 토큰

| 용도 | 값 |
|------|-----|
| 드롭다운 | `0 8px 24px rgba(0, 0, 0, 0.12)` |
| hover | `0 4px 12px rgba(0, 0, 0, 0.08)` |

---

## 9. 컴포넌트 계층 구조 (아토믹 디자인)

### 9.1 Atoms (원자)

- **NavIcon**: 44×44px 아이콘 버튼 (기존)
- **SearchInput**: 300px 검색바 (기존)
- **Badge**: 알림 개수 표시 (신규)
- **Avatar**: 프로필 아바타 (신규)

### 9.2 Molecules (분자)

- **NotificationTrigger**: Bell 아이콘 + Badge
- **QuickActionsTrigger**: Zap 아이콘
- **ProfileTrigger**: Avatar + 이름 + ChevronDown
- **NotificationItem**: 알림 항목 (아이콘 + 제목 + 내용 + 시간)
- **QuickActionItem**: 빠른 액션 항목 (아이콘 + 라벨 + 화살표)
- **ProfileMenuItem**: 프로필 메뉴 항목 (아이콘 + 라벨)

### 9.3 Organisms (유기체)

- **NotificationDropdown**: NotificationTrigger + NotificationDropdownPanel
- **QuickActionsDropdown**: QuickActionsTrigger + QuickActionsDropdownPanel
- **ProfileDropdown**: ProfileTrigger + ProfileDropdownPanel

### 9.4 Molecules (조합)

- **GnbRight**: SearchInput + NotificationDropdown + QuickActionsDropdown + ProfileDropdown

---

## 10. CSS 클래스 네이밍 규칙

### 10.1 BEM 패턴

```
mg-v2-{component}
mg-v2-{component}__{element}
mg-v2-{component}--{modifier}
```

### 10.2 GNB 컴포넌트 클래스 목록

**드롭다운 공통**:
- `mg-v2-dropdown-panel`: 드롭다운 패널 공통
- `mg-v2-dropdown-panel__header`: 헤더
- `mg-v2-dropdown-panel__footer`: 푸터
- `mg-v2-dropdown-overlay`: 모바일 오버레이

**NotificationDropdown**:
- `mg-v2-notification-trigger`
- `mg-v2-notification-badge`
- `mg-v2-notification-dropdown`
- `mg-v2-notification-list`
- `mg-v2-notification-item`
- `mg-v2-notification-item--unread`
- `mg-v2-notification-item__unread-dot`
- `mg-v2-notification-empty`

**QuickActionsDropdown**:
- `mg-v2-quick-actions-trigger`
- `mg-v2-quick-actions-dropdown`
- `mg-v2-quick-actions-list`
- `mg-v2-quick-action-item`

**ProfileDropdown**:
- `mg-v2-profile-trigger`
- `mg-v2-profile-trigger__avatar`
- `mg-v2-profile-trigger__name`
- `mg-v2-profile-dropdown`
- `mg-v2-profile-dropdown__header`
- `mg-v2-profile-dropdown__menu`
- `mg-v2-profile-menu-item`
- `mg-v2-badge-role`

---

## 11. 사용자 시나리오 및 플로우

### 11.1 ADMIN - 대시보드 보기

1. 우측 상단 QuickActionsDropdown 클릭 (Zap 아이콘)
2. 드롭다운 열림 → "대시보드 보기" 항목 클릭 (LayoutDashboard 아이콘)
3. 대시보드 페이지로 이동 (/admin/dashboard)

### 11.2 CONSULTANT - 상담일지 작성

1. 우측 상단 QuickActionsDropdown 클릭 (Zap 아이콘)
2. 드롭다운 열림 → "상담일지 작성" 항목 클릭 (FileEdit 아이콘)
3. 일지 작성 모달 열림

### 11.3 CLIENT - 상담 예약

1. 우측 상단 QuickActionsDropdown 클릭
2. 드롭다운 열림 → "상담 예약" 항목 클릭 (CalendarPlus 아이콘)
3. 예약 페이지로 이동 (/client/booking)

### 11.4 모든 역할 - 알림 확인

1. 우측 상단 NotificationDropdown 클릭 (Bell 아이콘 + badge)
2. 드롭다운 열림 → 알림 리스트 표시
3. 알림 항목 클릭 → 해당 페이지로 이동 + 읽음 처리
4. "모두 읽음" 클릭 → 전체 읽음 처리 + badge 0

### 11.5 모든 역할 - 로그아웃

1. 우측 상단 ProfileDropdown 클릭 (아바타 + 이름)
2. 드롭다운 열림 → "로그아웃" 항목 클릭 (LogOut 아이콘, 빨간색)
3. 로그아웃 처리 → 로그인 페이지로 이동

---

## 12. 디자이너 숙지 체크리스트

설계 완료 후 확인:

- [x] **단일 소스**: `mindgarden-design-system.pen`, `pencil-new.pen` 기준 색상·간격 사용
- [x] **색상**: 펜슬 가이드 팔레트 (`var(--mg-*)` 토큰) 준수
- [x] **레이아웃**: GNB 높이 64px, 우측 정렬, gap 12px
- [x] **드롭다운**: 배경·테두리·radius·그림자 일관성
- [x] **타이포**: Noto Sans KR, 제목 16px/600, 본문 14px/500, 라벨 12px/400
- [x] **반응형**: 모바일(375px)~4K(3840px) 브레이크포인트 검토
- [x] **토큰 명시**: 모든 색상·간격에 `var(--mg-*)` 토큰 사용
- [x] **재사용**: 기존 NavIcon, SearchInput 재사용
- [x] **접근성**: ARIA 속성, 키보드 네비게이션, 터치 영역 44px 이상

---

## 13. 코더 전달 사항

### 13.1 구현 우선순위

1. **Phase 1**: NotificationDropdown, ProfileDropdown (공통 기능)
2. **Phase 2**: QuickActionsDropdown (역할별 분기)
3. **Phase 3**: 반응형 최적화 (모바일·태블릿)

### 13.2 필수 라이브러리

- **lucide-react**: 아이콘 (Bell, Zap, User, LayoutDashboard, Database, ChevronDown, ChevronRight, LogOut, FileEdit, Calendar, Users, Settings, Star 등)
- **React**: useState, useEffect, useRef (드롭다운 외부 클릭 감지)

### 13.3 API 엔드포인트 (참조)

| 기능 | 메서드 | 엔드포인트 | 비고 |
|------|--------|-----------|------|
| 알림 목록 조회 | GET | `/api/v1/alerts` | 페이징·필터 지원 |
| 알림 읽음 처리 | PUT | `/api/v1/alerts/{id}/read` | 단일 알림 |
| 전체 읽음 처리 | PUT | `/api/v1/alerts/read-all` | 전체 알림 |

### 13.4 주의사항

- **드롭다운 외부 클릭 감지**: `useRef` + `useEffect`로 document 클릭 이벤트 리스닝
- **애니메이션**: CSS transition 사용 (200ms cubic-bezier)
- **z-index 관리**: 드롭다운 1000, 오버레이 999
- **역할별 분기**: `sessionManager.getUser().role`로 역할 확인 후 QuickActionsDropdown 내용 변경
- **모바일 오버레이**: 모바일에서 드롭다운 열릴 때 오버레이 추가 (배경 클릭 시 닫기)
- **테넌트 관리**: 테넌트 정보는 세션에서 자동 관리되며, 별도 전환 UI 불필요

---

## 14. 디자인 파일 업데이트 (Pencil)

### 14.1 pencil-new.pen 추가 컴포넌트

**Molecules 섹션에 추가**:
1. **NotificationItem**: 알림 항목 (아이콘 + 제목 + 내용 + 시간 + 읽지 않음 dot)
2. **QuickActionItem**: 빠른 액션 항목 (아이콘 + 라벨 + 화살표)
3. **ProfileMenuItem**: 프로필 메뉴 항목 (아이콘 + 라벨)
4. **DropdownPanel**: 드롭다운 패널 공통 (배경·테두리·radius·그림자)

**Atoms 섹션에 추가**:
1. **Badge**: 알림 개수 표시 (원형, 빨간색 배경)
2. **Avatar**: 프로필 아바타 (원형, 이미지 또는 첫 글자)

### 14.2 mindgarden-design-system.pen 업데이트

**GNB 섹션 추가**:
- 기존 "Layout & Responsive" 섹션에 "GNB Components" 하위 섹션 추가
- 3개 드롭다운 컴포넌트 시각화 (NotificationDropdown, QuickActionsDropdown, ProfileDropdown)
- 역할별 빠른 액션 목록 표 추가

---

## 15. 구현 체크리스트 (코더용)

### Phase 1: 공통 컴포넌트

- [ ] Badge 컴포넌트 생성 (`atoms/Badge.js`)
- [ ] Avatar 컴포넌트 생성 (`atoms/Avatar.js`)
- [ ] DropdownPanel 공통 컴포넌트 생성 (`molecules/DropdownPanel.js`)
- [ ] 드롭다운 외부 클릭 감지 훅 (`hooks/useClickOutside.js`)

### Phase 2: NotificationDropdown

- [ ] NotificationTrigger 컴포넌트 (`molecules/NotificationTrigger.js`)
- [ ] NotificationItem 컴포넌트 (`molecules/NotificationItem.js`)
- [ ] NotificationDropdown 컴포넌트 (`organisms/NotificationDropdown.js`)
- [ ] 알림 API 연동 (`/api/v1/alerts`)
- [ ] 읽음 처리 기능
- [ ] CSS 작성 (`NotificationDropdown.css`)

### Phase 3: ProfileDropdown

- [ ] ProfileTrigger 컴포넌트 (`molecules/ProfileTrigger.js`)
- [ ] ProfileMenuItem 컴포넌트 (`molecules/ProfileMenuItem.js`)
- [ ] ProfileDropdown 컴포넌트 (`organisms/ProfileDropdown.js`)
- [ ] 로그아웃 기능 연동
- [ ] CSS 작성 (`ProfileDropdown.css`)

### Phase 4: QuickActionsDropdown

- [ ] QuickActionsTrigger 컴포넌트 (`molecules/QuickActionsTrigger.js`)
- [ ] QuickActionItem 컴포넌트 (`molecules/QuickActionItem.js`)
- [ ] QuickActionsDropdown 컴포넌트 (`organisms/QuickActionsDropdown.js`)
- [ ] 역할별 액션 목록 상수 (`constants/quickActions.js`)
- [ ] CSS 작성 (`QuickActionsDropdown.css`)

### Phase 5: GnbRight 통합

- [ ] GnbRight 컴포넌트 업데이트 (3개 드롭다운 추가)
- [ ] 드롭다운 동시 열림 방지 로직
- [ ] 반응형 CSS 추가 (모바일·태블릿)
- [ ] 접근성 속성 추가 (ARIA)
- [ ] 키보드 네비게이션 구현

### Phase 6: 테스트 및 최적화

- [ ] 역할별 기능 테스트 (ADMIN, CONSULTANT, CLIENT, STAFF)
- [ ] 반응형 테스트 (375px ~ 3840px)
- [ ] 접근성 테스트 (키보드, 스크린 리더)
- [ ] 성능 최적화 (드롭다운 lazy loading)
- [ ] 브라우저 호환성 테스트

---

## 16. 디자인 QA 체크리스트

설계 완료 후 검증:

- [x] 펜슬 가이드(PENCIL_DESIGN_GUIDE.md) 색상·레이아웃 기준 준수
- [x] 어드민 대시보드 샘플과 비주얼 일관성
- [x] 모든 색상·간격에 디자인 토큰 사용 (`var(--mg-*)`)
- [x] 터치 영역 44px 이상 (모바일 접근성)
- [x] 드롭다운 너비·높이·패딩 일관성
- [x] 역할별 빠른 액션 목록 정의
- [x] 반응형 브레이크포인트 6단계 검토
- [x] 아토믹 디자인 계층 구조 준수 (Atoms → Organisms)
- [x] BEM 네이밍 규칙 준수
- [x] 사용자 시나리오 2클릭 이내 달성

---

## 17. 참고 이미지 (어드민 대시보드 샘플)

**GNB 우측 영역**:
- 검색바 (300px, 좌측 Search 아이콘)
- 캘린더 아이콘 (44×44px, Bell 대신 Calendar 사용 중)
- 알림 아이콘 (44×44px, Bell)
- 테마 아이콘 (44×44px, Moon)

**색상 톤**:
- 배경: #FAF9F7 (밝은 크림)
- 아이콘: #2C2C2C (다크 그레이)
- hover: #F5F3EF (약간 어두운 크림)

**샘플과의 차이점**:
- 샘플은 단순 아이콘 버튼만 표시
- 본 스펙은 드롭다운 패널 추가 (알림 리스트, 빠른 액션, 프로필 메뉴, 테넌트 전환)

---

## 18. 추가 고려사항

### 18.1 알림 실시간 업데이트

- WebSocket 또는 폴링으로 알림 개수 실시간 업데이트
- 새 알림 도착 시 badge 숫자 증가 + 애니메이션 (scale 1.2 → 1.0)

### 18.2 드롭다운 위치 자동 조정

- 화면 우측 끝에서 드롭다운이 잘릴 경우 자동으로 좌측 정렬
- `getBoundingClientRect()`로 위치 계산 후 `right` 또는 `left` 동적 설정

### 18.3 빠른 액션 커스터마이징

- 향후 사용자가 빠른 액션 항목을 직접 설정할 수 있도록 확장 가능
- 설정 페이지에서 액션 순서·표시 여부 조정

### 18.4 향후 확장 가능성

- **Super Admin 역할 추가 시**: 테넌트 전환 기능 재검토 가능
- **멀티 테넌트 관리 필요 시**: TenantSwitcher 컴포넌트 추가 고려

---

## 19. 마무리

본 스펙은 **역할별 GNB 기능 명세**를 기반으로 3개 드롭다운 컴포넌트(NotificationDropdown, QuickActionsDropdown, ProfileDropdown)의 UI/UX를 정의했습니다.

**핵심 원칙**:
1. **사용자 관점 우선**: 자주 쓰는 기능 2클릭 이내 접근
2. **역할별 맞춤**: ADMIN은 시스템 관리, CONSULTANT는 일지 작성 등
3. **디자인 일관성**: 펜슬 가이드·어드민 샘플과 동일한 비주얼 언어
4. **반응형**: 모바일~4K 모든 해상도 지원
5. **접근성**: 키보드·스크린 리더·터치 영역 44px 이상

**시스템 특성**:
- 현재 시스템은 테넌트 단위의 독립적인 어드민
- 테넌트 정보는 세션에서 자동 관리
- TenantSwitcher 컴포넌트는 제외 (향후 Super Admin 역할 추가 시 재검토)

**다음 단계**:
- core-coder에게 본 스펙 전달 → 컴포넌트 구현
- 구현 완료 후 디자이너 QA (비주얼 일관성 검증)
- 사용자 테스트 → 피드백 반영

---

**작성 완료**: 2026-03-09  
**최종 수정**: 2026-03-09 (TenantSwitcher 제거)  
**전달 대상**: core-coder (컴포넌트 구현 담당)
