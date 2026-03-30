# 관리자 "알림·메시지 관리" 통합 페이지 리뉴얼 UI/UX 제안

**대상**: `/admin/notifications` 통합 페이지 (시스템 공지 + 메시지 관리)  
**담당**: core-designer (디자인·비주얼·레이아웃만, 코드 작성 없음)  
**참조**: 어드민 대시보드 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample), B0KlA·`mindgarden-design-system.pen`, `unified-design-tokens.css`, `PENCIL_DESIGN_GUIDE.md`  
**관련 문서**: `GNB_AND_ADMIN_NOTIFICATION_UI_SPEC.md` §2, `GNB_AND_ADMIN_NOTIFICATION_COMPONENT_PROPOSAL.md` §3

---

## 1. 제안 개요

관리자가 **한 화면에서 공지·메시지를 탭 전환으로 관리**할 수 있도록, 기존 시스템 공지·메시지 관리 화면을 **단일 URL `/admin/notifications`** 로 통합하고, B0KlA·unified-design-tokens 기반의 **동일한 목록/카드 패턴**으로 시각·구조를 통일하는 리뉴얼 제안이다.

---

## 2. 사용성(UX) 제안

### 2.1 한 화면에서의 탭 전환

- **탭 2개**: **시스템 공지** | **메시지**
- 탭 클릭만으로 전환, URL 쿼리 유지 권장: `?tab=system` | `?tab=messages` (구현 시 코더 반영)
- 탭 전환 시 **필터·목록·모달**이 탭별로 전환되며, **동일한 블록 순서**(필터 → 목록 → 상세/작성 모달)를 유지해 학습 비용을 낮춘다.

### 2.2 자주 쓰는 동작 배치

| 동작 | 배치 위치 | 비고 |
|------|-----------|------|
| **공지 작성** | ContentHeader 우측 (공지 탭 활성 시만 표시) | 주조 버튼, 권한 `SYSTEM_NOTIFICATION_MANAGE` 있을 때만 노출 |
| **필터(대상/상태·검색)** | 탭별 본문 블록 **상단 한 줄** | 좌측: 필터·검색, 우측: 선택 시 "일괄 읽음" 등 (메시지 탭) |
| **읽음 처리** | 목록 행/카드 내 "읽음" 버튼 또는 상세 모달 열 때 자동 읽음 | 메시지 탭에서 빈도 높음 |
| **전체 보기/내보내기** | 메시지 탭 시 ContentHeader 우측에 "내보내기" 등 (기획 확정) | 공지 탭과 시각적 균형 |

- **우선순위**: 공지 작성 > 필터/검색 > 읽음 처리 > 상세 보기 순으로 상단·좌측에 가깝게 배치한다.

---

## 3. 정보 노출·권한

### 3.1 역할별 권한 유지

- **SYSTEM_NOTIFICATION_MANAGE**: 공지 탭 노출, "공지 작성" 버튼, 공지 목록의 수정/삭제/게시 액션 표시
- **메시지 조회 권한**: 메시지 탭·메시지 목록·필터 범위 노출 (기존 AdminMessages 권한과 동일)
- 권한 없으면 해당 탭 자체를 숨기거나 비활성 처리 (기획 확정)

### 3.2 공지 CRUD·메시지 조회/필터 범위

- **공지**: CRUD 전체. 필터는 대상(전체/역할별), 상태(전체/게시중/만료 등), 검색(제목/내용) 지원
- **메시지**: 조회·필터·상세. 필터는 검색(제목/내용/발신·수신자), 유형(전체/일반/후속조치 등), 상태(전체/읽음/미읽음)
- 목록 컬럼/카드 필드는 기존 스펙(§2.5, §2.6)을 유지하되, **시각 패턴만 통일**한다.

---

## 4. 레이아웃 제안 (블록 순서·배치)

### 4.1 전체 구조

```
AdminCommonLayout
  └─ 메인 영역
       ├─ 1. ContentHeader (제목 + 부제 + 우측 액션)
       ├─ 2. 탭 바 (시스템 공지 | 메시지)
       └─ 3. 탭별 본문: 단일 섹션 블록
            ├─ 3-1. 필터 영역 (가로 1줄)
            ├─ 3-2. 목록 영역 (테이블 또는 카드 그리드)
            └─ (클릭 시) 모달: 공지 작성/수정 | 메시지 상세
```

### 4.2 ContentHeader

| 항목 | 스펙 | 토큰/클래스 |
|------|------|-------------|
| 제목 | "알림·메시지 관리". 28px, fontWeight 700 | `var(--ad-b0kla-title-color)` 또는 `var(--mg-color-text-main)`, `mg-v2-content-header__title` |
| 부제/요약 | 예: "시스템 공지 N건 · 메시지 N건" 또는 "공지 작성과 메시지 조회를 한 화면에서 관리합니다." 15px | `var(--ad-b0kla-subtitle-color)` 또는 `var(--mg-color-text-secondary)`, `mg-v2-content-header__subtitle` |
| 우측 액션 | 공지 탭: "공지 작성" (주조). 메시지 탭: "내보내기" 등(기획 확정). 권한에 따라 표시 | `mg-v2-content-header__right`. 버튼: height 40px, radius 10px, `var(--mg-color-primary-main)` |

### 4.3 탭 바 (시스템 공지 | 메시지)

| 항목 | 스펙 | 토큰/클래스 |
|------|------|-------------|
| 위치 | ContentHeader 아래, 본문 섹션 블록 위. gap 16px~24px | `mg-v2-ad-b0kla__tabs` 또는 공통 탭 컴포넌트 |
| 탭 수 | 2개: **시스템 공지** \| **메시지** | |
| 비활성 | 16px, `var(--mg-color-text-secondary)`. padding 12px 20px, 최소 높이 44px | 터치 영역 확보 |
| 활성 | 16px, fontWeight 600, `var(--mg-color-text-main)` + 하단 4px 악센트 바 `var(--mg-color-primary-main)`, border-radius 2px | B0KlA 섹션 제목 악센트와 동일 톤 |

### 4.4 탭별 본문 — 공지·메시지 **동일 블록 패턴**

두 탭 모두 **같은 섹션 블록** 안에 **필터 → 목록** 순서로 배치하여, 전환 시에도 레이아웃이 동일하게 보이도록 한다.

| 영역 | 스펙 | 토큰/클래스 |
|------|------|-------------|
| 감싸기 | 섹션 블록 1개. 배경 `var(--mg-color-surface-main)` (#F5F3EF), 테두리 1px `var(--mg-color-border-main)` (#D4CFC8), border-radius 16px, padding 24px, gap 16px | B0KlA 섹션. `mg-v2-ad-b0kla__section`, `mg-v2-ad-b0kla__card` 등 |
| 블록 제목(선택) | "공지 목록" / "메시지 목록". 왼쪽 세로 악센트 4px `var(--mg-color-primary-main)`, radius 2px + 제목 16px 600 | `mg-v2-ad-b0kla__section-title`, `mg-v2-ad-b0kla-modal__section-accent` 유사 |
| 필터 | 가로 1줄. 좌측: BadgeSelect/드롭다운/검색 입력. 우측: (메시지 탭) "일괄 읽음" 등 | 기존 필터 패턴, 동일 클래스로 통일 |
| 목록 | **통일 패턴**: 테이블 또는 카드 그리드 중 **하나의 시각 패턴**으로 통일 권장 (아래 4.5 참조) | 테이블: B0KlA 테이블. 카드: MGCard + 좌측 악센트 4px |
| 빈 상태 | "등록된 공지가 없습니다." / "메시지가 없습니다." 14px `var(--mg-color-text-secondary)`, 중앙 정렬 | `mg-v2-notification-empty` 유사 |

### 4.5 공지 탭과 메시지 탭의 **동일 목록/카드 패턴** 통일 방안

- **옵션 A — 카드 통일**: 공지도 테이블 대신 **카드 그리드**로 표시. 카드 1장에 제목, 대상/상태, 등록일, 액션(수정/삭제/게시). 메시지 카드와 동일한 카드 높이·패딩·좌측 악센트 바(4px)를 사용하면 **시각적 일관성** 최대.
- **옵션 B — 테이블 통일**: 메시지도 **테이블**로 표시. 컬럼: 발신→수신, 제목, 일부 내용, 시간, 읽음, 액션. 공지 테이블과 동일한 행 높이·패딩·헤더 스타일 적용.
- **권장**: **옵션 A(카드 통일)**. 어드민 샘플의 카드·메트릭 패턴과 맞고, 모바일에서도 1열 카드로 자연스럽게 반응하며, "목록 블록 1개 + 동일 카드 스타일"로 코더 구현이 단순해진다.
- 카드 공통 스펙: 배경 `var(--mg-color-surface-main)`, 테두리 1px `var(--mg-color-border-main)`, radius 10px~12px, padding 16px~20px, **좌측 악센트 4px** (공지는 주조/상태별, 메시지는 미읽음 시 포인트). 제목 14px 600, 보조 텍스트 12px `var(--mg-color-text-secondary)`.

### 4.6 모달

| 모달 | 스펙 | 비고 |
|------|------|------|
| 공지 작성/수정 | UnifiedModal + B0KlA. 필드: 대상, 제목, 내용, 유형, 중요/긴급, 만료일. 버튼: 취소(아웃라인) + 저장(주조) | `mg-v2-ad-b0kla`, `mg-v2-ad-b0kla-modal__*` |
| 메시지 상세 | UnifiedModal. 읽음 처리. 발신/수신, 제목, 본문, 시간. 닫기 | 동일 B0KlA 모달 스타일 |
| 공통 | 오버레이·패널 색상·radius는 UnifiedModal·B0KlA 유지 | design-handoff 스킬 참조 |

---

## 5. 반응형 방향

| 브레이크포인트 | 레이아웃·배치 |
|----------------|---------------|
| **모바일 (375px~)** | 탭: 가로 스크롤 또는 2단 누적. 목록: **1열 카드**. 필터: 세로 쌓기(검색 → BadgeSelect). 터치 영역 최소 44px. ContentHeader: 제목·부제 줄바꿈, 액션 버튼 하단으로 wrap 가능 |
| **태블릿 (768px~)** | 탭: 2개 가로 유지. 목록: **2열 카드**. 필터: 가로 1줄 유지. 패딩·gap은 RESPONSIVE_LAYOUT_SPEC의 태블릿 값(20px, gap 16px) |
| **데스크톱 (1280px~)** | 탭 2개 가로. 목록: **3~4열 카드**. 필터 가로 1줄. ContentHeader wrap 시 액션 아래로. 본문 패딩 24px |
| **Full HD·2K·4K** | 컨테이너 max-width·패딩·섹션 gap은 `RESPONSIVE_LAYOUT_SPEC.md` §2.2, §2.3 준수. 4K에서도 본문 max-width 제한 유지 |

- **RESPONSIVE_LAYOUT_SPEC** 브레이크포인트(375, 768, 1280, 1920, 2560, 3840) 및 PENCIL_DESIGN_GUIDE 반응형 체크리스트를 따른다.

---

## 6. 접근성(aria, role) 방향

- **탭**: 탭 바 컨테이너에 `role="tablist"`, 각 탭에 `role="tab"`, `aria-selected`, `aria-controls`(해당 패널 id). 탭 패널에 `role="tabpanel"`, `aria-labelledby`(탭 버튼 id). 키보드: 화살표로 탭 이동, Enter/Space로 선택.
- **ContentHeader**: 제목에 `id` 부여, 메인 래퍼에 `aria-labelledby`로 페이지 제목과 연결 (필요 시).
- **필터**: 검색/선택 컨트롤에 `aria-label` 또는 `<label>` 연결. 필터 영역은 `role="search"` 또는 `aria-label="목록 필터"` 등으로 영역 식별.
- **목록**: 테이블이면 `<table>`, `<th>`, `<td>` 시맨틱 유지. 카드 목록이면 `<ul>`/`<li>` 또는 `role="list"`/`role="listitem"`. "빈 상태"는 `aria-live="polite"` 또는 스크린리더가 읽을 수 있는 텍스트로 제공.
- **모달**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`(제목), `aria-describedby`(본문 요약 시). 포커스 트랩·닫기 시 포커스 복귀.
- **버튼**: "공지 작성", "읽음", "닫기" 등에 `aria-label` 또는 가시 텍스트로 목적 명시.

---

## 7. 비주얼·토큰 요약

- **색상**: PENCIL_DESIGN_GUIDE·B0KlA 팔레트만 사용. 배경 `var(--mg-color-background-main)`, 서페이스 `var(--mg-color-surface-main)`, 주조 `var(--mg-color-primary-main)`, 본문 `var(--mg-color-text-main)`, 보조 `var(--mg-color-text-secondary)`, 테두리 `var(--mg-color-border-main)`.
- **타이포**: Noto Sans KR. 제목 20~28px 600~700, 본문 14~16px, 라벨/캡션 12px.
- **섹션 블록**: 배경 #F5F3EF, 테두리 1px #D4CFC8, radius 16px, 좌측 악센트 바 4px #3D5246.
- **버튼**: 주조 height 40px, radius 10px; 아웃라인 테두리 #D4CFC8.

---

## 8. 코더 구현용 블록 순서 요약

1. AdminCommonLayout
2. 메인: ContentHeader(제목 "알림·메시지 관리" + 부제 + 우측 "공지 작성" 조건부)
3. 탭 바: 시스템 공지 | 메시지 (role="tablist", aria)
4. (탭=공지) 공지 목록 블록: 필터 → 카드/테이블 목록 → (클릭) 공지 작성/수정 모달
5. (탭=메시지) 메시지 목록 블록: 검색/필터 → 메시지 카드 그리드 → (클릭) 메시지 상세 모달

---

## 9. 체크리스트 (디자이너·기획 검토용)

- [ ] 사용성: 탭 전환·공지 작성·필터·읽음 처리 배치가 명시되었는가?
- [ ] 정보 노출: 역할별 권한(SYSTEM_NOTIFICATION_MANAGE 등), 공지 CRUD·메시지 조회/필터 범위가 유지되는가?
- [ ] 레이아웃: AdminCommonLayout + ContentHeader + 탭 + 탭별 본문(필터·목록·모달) 순서와 B0KlA·토큰이 명시되었는가?
- [ ] 통일: 공지 탭과 메시지 탭이 동일한 목록/카드 패턴(권장: 카드 통일)으로 구조 통일 방안이 제시되었는가?
- [ ] 반응형: 모바일·태블릿·데스크톱 방향과 터치 44px, 브레이크포인트 참조가 제시되었는가?
- [ ] 접근성: 탭/헤더/필터/목록/모달에 대한 aria, role 방향이 제시되었는가?
- [ ] 비주얼: unified-design-tokens·B0KlA·PENCIL_DESIGN_GUIDE 기준 색상·타이포·섹션 블록이 요약되었는가?

---

**문서 끝.**  
기획(core-planner) 검토 후 코더(core-coder) 구현 시 `GNB_AND_ADMIN_NOTIFICATION_UI_SPEC.md` §2, `GNB_AND_ADMIN_NOTIFICATION_COMPONENT_PROPOSAL.md` §3과 함께 참조할 것.
