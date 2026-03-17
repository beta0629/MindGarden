# 관리자 알림·메시지 통합 페이지 — Phase 1 확정 UI/UX 스펙

**버전**: Phase 1 (확정)  
**대상**: `/admin/notifications` 통합 페이지 (시스템 공지 + 메시지 관리)  
**용도**: 퍼블리셔·코더 구현용 최종 스펙 (코드 작성 없음, 스펙만 정의)  
**참조**: 어드민 대시보드 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample), B0KlA·`mindgarden-design-system.pen`, `unified-design-tokens.css`, `PENCIL_DESIGN_GUIDE.md`

**종합 소스**:
- `docs/design-system/ADMIN_NOTIFICATIONS_UNIFIED_UI_PROPOSAL.md` (디자인 제안)
- `docs/project-management/ADMIN_NOTIFICATIONS_EXTRACT_AND_PLACEMENT_PROPOSAL.md` (컴포넌트 추출·배치 제안)
- `docs/design-system/GNB_AND_ADMIN_NOTIFICATION_UI_SPEC.md` §2 (관리자 통합 페이지)

---

## 1. 개요 및 블록 순서

### 1.1 목적

관리자가 **한 화면에서 공지·메시지를 탭 전환으로 관리**할 수 있도록, **단일 URL `/admin/notifications`** 에서 B0KlA·unified-design-tokens 기반의 **동일한 목록/카드 패턴**으로 시각·구조를 통일한다.

### 1.2 구현용 블록 순서 (필수)

| 순서 | 블록 | 설명 |
|------|------|------|
| 1 | AdminCommonLayout | 좌측 LNB 260px + 메인 영역 |
| 2 | ContentHeader | 제목 "알림·메시지 관리" + 부제 + 우측 액션(공지 작성 조건부) |
| 3 | 탭 바 | 시스템 공지 \| 메시지 (role="tablist") |
| 4 | 탭 패널(공지) | 단일 섹션 블록: 필터 → 목록(카드) → (클릭 시) 공지 작성/수정 모달 |
| 5 | 탭 패널(메시지) | 단일 섹션 블록: 필터 → 목록(카드) → (클릭 시) 메시지 상세 모달 |

**원칙**: 공지 탭과 메시지 탭은 **동일한 블록 순서**(필터 → 목록 → 모달)를 유지하여 학습 비용을 낮춘다.

---

## 2. ContentHeader

| 항목 | 스펙 | BEM/클래스 | 디자인 토큰 |
|------|------|------------|-------------|
| **컨테이너** | 상단 고정. 패딩 24px(좌우)·16px(상하). 하단 1px 구분선 | `mg-v2-content-header`, `mg-v2-content-header__wrapper` | 배경 `var(--mg-color-background-main)` (#FAF9F7), 구분선 `var(--mg-color-border-main)` |
| **제목** | "알림·메시지 관리". 28px, fontWeight 700 | `mg-v2-content-header__title` | `var(--ad-b0kla-title-color)` 또는 `var(--mg-color-text-main)` (#2C2C2C) |
| **부제/요약** | 예: "시스템 공지 N건 · 메시지 N건" 또는 "공지 작성과 메시지 조회를 한 화면에서 관리합니다." 15px | `mg-v2-content-header__subtitle` | `var(--ad-b0kla-subtitle-color)` 또는 `var(--mg-color-text-secondary)` (#5C6B61) |
| **우측 액션** | 공지 탭 활성 시: "공지 작성"(주조 버튼). 메시지 탭: "내보내기" 등(기획 확정). 권한 SYSTEM_NOTIFICATION_MANAGE 있을 때만 공지 작성 노출 | `mg-v2-content-header__right` | 버튼: height 40px, radius 10px, `var(--mg-color-primary-main)` (#3D5246), 텍스트 `var(--mg-color-background-main)` |

**접근성**: 페이지 메인 래퍼에 `aria-labelledby`로 제목 id 연결 권장. 제목에 고유 `id` 부여.

---

## 3. 탭 바 (시스템 공지 | 메시지)

| 항목 | 스펙 | BEM/클래스 | 디자인 토큰 |
|------|------|------------|-------------|
| **컨테이너** | ContentHeader 아래, 본문 섹션 블록 위. gap 16px~24px | `mg-v2-ad-b0kla__tabs` | 배경 투명, 메인 영역과 동일 |
| **탭 버튼** | 2개: **시스템 공지** \| **메시지**. 좌측 정렬 | `mg-v2-ad-b0kla__tab` | — |
| **비활성 탭** | 16px, padding 12px 20px, 최소 높이 44px(터치) | `mg-v2-ad-b0kla__tab` | `var(--mg-color-text-secondary)` (#5C6B61) |
| **활성 탭** | 16px, fontWeight 600. 하단 4px 악센트 바 | `mg-v2-ad-b0kla__tab--active` | 텍스트 `var(--mg-color-text-main)` (#2C2C2C), 악센트 `var(--mg-color-primary-main)` (#3D5246), border-radius 2px |

**접근성**:
- 탭 바 컨테이너: `role="tablist"`, `aria-label="알림·메시지 탭"` (또는 동일 의미)
- 각 탭: `role="tab"`, `aria-selected="true"|"false"`, `aria-controls`(해당 tabpanel id)
- 탭 패널: `role="tabpanel"`, `aria-labelledby`(해당 탭 버튼 id), `id`로 탭의 `aria-controls`와 매칭
- 키보드: 화살표로 탭 이동, Enter/Space로 선택

**URL**: 전환 시 쿼리 유지 권장 `?tab=system` \| `?tab=messages` (구현 시 코더 반영).

---

## 4. 탭별 본문 — 공통 섹션 블록 구조

두 탭 모두 **동일한 섹션 블록 1개** 안에 **필터 → 목록** 순서로 배치한다.

### 4.1 감싸기 (섹션 블록)

| 항목 | 스펙 | BEM/클래스 | 디자인 토큰 |
|------|------|------------|-------------|
| **컨테이너** | 배경·테두리·radius·패딩·gap 통일 | `mg-v2-ad-b0kla__section`, `mg-v2-ad-b0kla__card` | 배경 `var(--mg-color-surface-main)` (#F5F3EF), 테두리 1px `var(--mg-color-border-main)` (#D4CFC8), border-radius 16px, padding 24px, 내부 gap 16px |

### 4.2 블록 제목 (선택)

| 항목 | 스펙 | BEM/클래스 | 디자인 토큰 |
|------|------|------------|-------------|
| **제목** | "공지 목록" / "메시지 목록". 왼쪽 세로 악센트 4px + 제목 텍스트 | `mg-v2-ad-b0kla__section-title` | 악센트: 4px 폭, `var(--mg-color-primary-main)`, radius 2px. 제목: 16px, fontWeight 600, `var(--mg-color-text-main)` |

### 4.3 필터 영역

| 항목 | 스펙 | BEM/클래스 | 비고 |
|------|------|------------|------|
| **레이아웃** | 가로 1줄. 좌측: 검색/필터 컨트롤, 우측: (메시지 탭) "일괄 읽음" 등 | `mg-v2-ad-b0kla__section-filters` | 공지·메시지 동일 패턴, 내용만 탭별 상이 |
| **공지 필터** | 대상(전체/역할별)·상태(전체/게시중/만료 등)·검색(제목/내용). BadgeSelect 또는 드롭다운 | `mg-v2-ad-b0kla__filter-select`, 기존 필터 패턴 | AdminFilterBar 추출 시 동일 클래스로 통일 |
| **메시지 필터** | 검색(제목/내용/발신·수신자) + 유형(전체/일반/후속조치 등) + 상태(전체/읽음/미읽음) | 동일 `mg-v2-ad-b0kla__section-filters` | BadgeSelect·입력창. 우측 "일괄 읽음" 버튼(선택 시) |

**접근성**: 필터 영역 `role="search"` 또는 `aria-label="목록 필터"`. 검색/선택 컨트롤에 `aria-label` 또는 `<label>` 연결.

---

## 5. 목록 영역 — 공지·메시지 동일 카드 패턴 (확정)

**확정 방안**: 공지 탭과 메시지 탭 모두 **카드 그리드**로 통일. 테이블이 아닌 **동일 카드 스타일**을 사용한다.

### 5.1 목록 컨테이너

| 항목 | 스펙 | BEM/클래스 | 디자인 토큰 |
|------|------|------------|-------------|
| **래퍼** | 빈 상태 + 카드 그리드. 레이아웃만 담당 | `mg-v2-ad-notifications__list`, `mg-v2-ad-notifications__card-grid` | gap 16px~24px (RESPONSIVE_LAYOUT_SPEC §2.3 준수) |
| **빈 상태** | "등록된 공지가 없습니다." / "메시지가 없습니다." 14px, 중앙 정렬 | `mg-v2-notification-empty`, `mg-v2-ad-b0kla__table-empty` 유사 | `var(--mg-color-text-secondary)` (#5C6B61) |

### 5.2 카드 공통 스펙 (공지·메시지 동일)

| 항목 | 스펙 | BEM/클래스 | 디자인 토큰 |
|------|------|------------|-------------|
| **카드 컨테이너** | 배경·테두리·radius·패딩·좌측 악센트 | `mg-v2-ad-notifications__card`, MGCard 활용 시 동일 시각 적용 | 배경 `var(--mg-color-surface-main)`, 테두리 1px `var(--mg-color-border-main)`, radius 10px~12px, padding 16px~20px |
| **좌측 악센트 바** | 폭 4px, 세로 전체. 공지: 주조/상태별 색. 메시지: 미읽음 시 포인트 | `mg-v2-ad-notifications__card-accent` | 주조 `var(--mg-color-primary-main)`, 미읽음 강조 `var(--mg-color-accent-main)` (#8B7355) |
| **제목** | 1줄 말줄임 | `mg-v2-ad-notifications__card-title` | 14px, fontWeight 600, `var(--mg-color-text-main)` |
| **메타/보조** | 대상·상태·날짜 또는 발신→수신·시간 | `mg-v2-ad-notifications__card-meta` | 12px, `var(--mg-color-text-secondary)` |
| **액션** | 공지: 수정/삭제/게시. 메시지: 읽음/상세. 카드 내 또는 호버 시 | `mg-v2-ad-notifications__card-actions` | 버튼 height 36px~40px, radius 8px~10px. 주조/아웃라인 B0KlA 유지 |

### 5.3 공지 카드 필드

| 필드 | 비고 |
|------|------|
| 제목, 대상(배지), 상태(배지), 등록일, 액션(수정/삭제/게시·보관) | 역할별 권한에 따라 액션 표시. SYSTEM_NOTIFICATION_MANAGE 필요 |

### 5.4 메시지 카드 필드

| 필드 | 비고 |
|------|------|
| 발신→수신, 제목, 일부 내용(말줄임), 시간, 미읽음 표시(도트/배지), 클릭 시 상세 모달 | 읽음 처리: 카드 내 "읽음" 버튼 또는 상세 모달 열 때 자동 |

**접근성**: 카드 목록은 `<ul>`/`<li>` 또는 `role="list"`/`role="listitem"`. 빈 상태는 `aria-live="polite"` 또는 스크린리더가 읽을 수 있는 텍스트로 제공. "읽음", "수정" 등 버튼에 `aria-label` 또는 가시 텍스트로 목적 명시.

---

## 6. 모달

### 6.1 공통

- **컴포넌트**: 모든 모달은 **UnifiedModal** 사용 필수. 커스텀 오버레이/래퍼 금지.
- **스타일**: B0KlA 모달. 오버레이·패널 색상·radius는 `mg-modal.mg-v2-ad-b0kla`, `unified-modals.css`·B0KlA 유지.

### 6.2 공지 작성/수정 모달

| 항목 | 스펙 | BEM/클래스 |
|------|------|------------|
| **제목** | "공지 작성" / "공지 수정" | `mg-modal__header`, `mg-v2-ad-b0kla-modal__title` |
| **폼 필드** | 대상, 제목, 내용, 유형, 중요/긴급 체크, 만료일 | `mg-v2-ad-b0kla-modal__body`, `mg-v2-ad-b0kla__form-*` 등 기존 B0KlA 폼 클래스 |
| **버튼** | 취소(아웃라인) + 저장(주조) | `mg-modal__actions`, 주조 height 40px, radius 10px |

### 6.3 메시지 상세 모달

| 항목 | 스펙 | BEM/클래스 |
|------|------|------------|
| **제목** | "메시지 상세" 또는 메시지 제목 | `mg-modal__header` |
| **본문** | 발신/수신, 제목, 본문, 발송일. 읽음 처리 반영 | `mg-v2-ad-b0kla-modal__body` |
| **버튼** | 닫기 | `mg-modal__actions` |

**접근성**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`(제목), `aria-describedby`(본문 요약 시). 포커스 트랩·닫기 시 포커스 복귀.

---

## 7. 반응형 브레이크포인트

`docs/design-system/RESPONSIVE_LAYOUT_SPEC.md` §1·§2 및 `PENCIL_DESIGN_GUIDE.md` §3 기준.

| 브레이크포인트 | 최소 너비 | 탭 | 필터 | 목록(카드 열 수) | 비고 |
|----------------|-----------|-----|------|------------------|------|
| **모바일** | 375px | 가로 스크롤 또는 2단 누적 | 세로 쌓기(검색 → BadgeSelect) | 1열 | 터치 영역 최소 44px. ContentHeader: 제목·부제 줄바꿨, 액션 버튼 하단 wrap 가능 |
| **태블릿** | 768px | 2개 가로 유지 | 가로 1줄 | 2열 | 패딩 20px, gap 16px (RESPONSIVE_LAYOUT_SPEC §2.2) |
| **데스크톱** | 1280px | 2개 가로 | 가로 1줄 | 3~4열 | 본문 패딩 24px |
| **Full HD** | 1920px | 동일 | 동일 | 4~6열 | 컨테이너 max-width 1440px |
| **2K·4K** | 2560px, 3840px | 동일 | 동일 | 6~8열 / max-width 1920px 유지 | RESPONSIVE_LAYOUT_SPEC §2.2, §2.3. 4K에서도 본문 max-width 제한 |

---

## 8. 접근성 요구사항 요약

| 영역 | 요구사항 |
|------|----------|
| **탭** | role="tablist", role="tab", aria-selected, aria-controls, role="tabpanel", aria-labelledby. 키보드 화살표·Enter/Space |
| **ContentHeader** | 제목 id, 메인 aria-labelledby (선택) |
| **필터** | role="search" 또는 aria-label="목록 필터". 검색/선택에 aria-label 또는 label |
| **목록** | list/listitem 또는 ul/li. 빈 상태 aria-live="polite". 버튼 aria-label 또는 가시 텍스트 |
| **모달** | role="dialog", aria-modal="true", aria-labelledby, aria-describedby. 포커스 트랩·닫기 시 포커스 복귀 |

---

## 9. 디자인 토큰 참조 (요약)

| 용도 | 토큰 |
|------|------|
| 배경(메인) | `var(--mg-color-background-main)` (#FAF9F7) |
| 서페이스/카드 | `var(--mg-color-surface-main)` (#F5F3EF) |
| 주조 | `var(--mg-color-primary-main)` (#3D5246) |
| 포인트(미읽음 등) | `var(--mg-color-accent-main)` (#8B7355) |
| 본문 텍스트 | `var(--mg-color-text-main)` (#2C2C2C) |
| 보조 텍스트 | `var(--mg-color-text-secondary)` (#5C6B61) |
| 테두리 | `var(--mg-color-border-main)` (#D4CFC8) |

타이포: Noto Sans KR. 제목 20~28px 600~700, 본문 14~16px, 라벨/캡션 12px.  
버튼: 주조 height 40px, radius 10px; 아웃라인 테두리 #D4CFC8.

---

## 10. 컴포넌트 추출·배치 참조 (코더용)

구현 시 아래 Organism/Molecule 배치를 참조한다. 상세는 `ADMIN_NOTIFICATIONS_EXTRACT_AND_PLACEMENT_PROPOSAL.md` 참조.

| 블록 | 배치 | 용도 |
|------|------|------|
| **ContentHeader** | 기존 dashboard-v2/content | 제목 + 부제 + 우측 액션 |
| **AdminSectionHeader** | admin/molecules (또는 common) | 탭 콘텐츠 상단 "공지 목록"/"메시지 목록" (선택) |
| **AdminFilterBar** | common/molecules | 검색 + 필터 조합. 공지/메시지 필터 옵션만 props로 |
| **AdminCardList** | common/molecules | 빈 상태 + 카드 그리드 레이아웃 |
| **SystemNotificationListBlock** | admin/organisms | 필터 + 공지 카드 목록 + 공지 작성/수정 모달 |
| **AdminMessageListBlock** | admin/organisms | 필터 + 메시지 카드 그리드 + 메시지 상세 모달 |
| **SystemNotificationFormModal** | admin/molecules | UnifiedModal + 공지 폼 전체 |
| **UnifiedModal** | 기존 | 모든 모달 래퍼 필수 |

---

## 11. IA·URL·권한 (참조)

- **URL**: `/admin/notifications`. LNB 단일 메뉴 "알림·메시지 관리". 브레드크럼: 홈 > 알림·메시지 관리.
- **권한**: SYSTEM_NOTIFICATION_MANAGE → 공지 탭·공지 작성·공지 수정/삭제/게시 노출. 메시지 조회 권한 → 메시지 탭·목록·필터 노출.

---

## 12. Phase 1 확정 체크리스트

- [x] ContentHeader·탭·필터·목록·모달 블록 순서·구조·BEM·디자인 토큰 명시
- [x] 공지·메시지 동일 목록/카드 패턴(카드 통일) 확정
- [x] 반응형 브레이크포인트(375~3840) 및 터치 44px 명시
- [x] 접근성(aria, role) 요구사항 명시
- [x] 퍼블리셔·코더가 구현에 바로 쓸 수 있는 수준의 스펙

---

**문서 끝.**  
구현 시 본 스펙과 `GNB_AND_ADMIN_NOTIFICATION_UI_SPEC.md` §2, `ADMIN_NOTIFICATIONS_EXTRACT_AND_PLACEMENT_PROPOSAL.md`, `unified-design-tokens.css`·B0KlA 클래스를 함께 참조할 것.
