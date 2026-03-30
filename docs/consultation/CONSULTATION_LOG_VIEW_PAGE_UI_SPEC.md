# 상담일지 조회 전용 화면 — Phase 1 UI/UX 스펙

**버전**: 1.0.0  
**대상**: Phase 1 (레이아웃 + 목록 뷰만)  
**참조**: [기획서](./CONSULTATION_LOG_VIEW_PAGE_PLAN.md) §9, §11, §13  
**디자인 기준**: 어드민 대시보드 샘플, B0KlA·unified-design-tokens, PENCIL_DESIGN_GUIDE

---

## 1. 페이지 전체 레이아웃

매칭관리 페이지(`MappingManagement.js` + `MappingManagementPage.js`)와 **동일 구조**를 사용한다.

```
AdminCommonLayout (title="상담일지 조회")
└── [본문 컨테이너] .mg-v2-ad-b0kla .mg-v2-consultation-log-view (또는 동일 네이밍 규칙)
    └── .mg-v2-ad-b0kla__container
        └── ContentArea
            ├── ContentHeader (제목·부제목·액션)
            ├── [필터 영역] ConsultationLogFilterSection
            └── [목록 블록] ConsultationLogListBlock (카드 그리드)
```

- **최상위 클래스**: `mg-v2-ad-b0kla` + 페이지 식별 클래스(예: `mg-v2-consultation-log-view`).
- **컨테이너**: `mg-v2-ad-b0kla__container` (매칭관리와 동일).
- **본문 순서**: ContentHeader → 필터 섹션 → 목록(카드) 섹션. Phase 1에서는 뷰 전환 탭(캘린더|목록|테이블) 없음.

---

## 2. ContentHeader 스펙

| 항목 | 스펙 |
|------|------|
| **제목(title)** | "상담일지 조회" |
| **부제목(subtitle)** | "상담일지를 검색하고 목록에서 클릭해 수정할 수 있습니다." (또는 기획서 취지에 맞는 한 줄 설명) |
| **액션(actions)** | Phase 1에서는 **없음**. (추후 "이 날짜에 일지 작성" 등 추가 시 우측 버튼 배치) |

- **컴포넌트**: `ContentHeader` (dashboard-v2/content).
- **클래스**: `mg-v2-content-header`, `mg-v2-content-header__title`, `mg-v2-content-header__subtitle`.
- **토큰**: 제목 `var(--ad-b0kla-title-color)`, 부제목 `var(--ad-b0kla-subtitle-color)` (ContentHeader.css 기준). 폰트 Noto Sans KR, 제목 28px/700, 부제목 15px.

---

## 3. 필터 영역 (ConsultationLogFilterSection)

### 3.1 구성

| 순서 | 필터 | 타입 | 역할별 노출 | 비고 |
|------|------|------|-------------|------|
| 1 | 상담사 | 셀렉트(단일) | **관리자(ADMIN)만** 노출 | 상담사 역할이면 **비노출** (본인 고정) |
| 2 | 내담자 | 셀렉트 또는 검색형 입력 | 공통 | 옵션 목록 또는 검색 API 연동 |
| 3 | 기간 시작일 | date input (날짜 선택) | 공통 | placeholder 예: "시작일" |
| 4 | 기간 종료일 | date input (날짜 선택) | 공통 | placeholder 예: "종료일" |

- **레이아웃**: 한 줄에 배치(데스크톱). 모바일에서는 세로 쌓기 또는 2열 그리드 권장.
- **섹션 래퍼**: `ContentSection` 사용 시 `noCard={true}`(plain) 또는 카드 스타일 중 기획·매칭관리 톤에 맞게 선택. 클래스 예: `mg-v2-consultation-log-filter`.

### 3.2 디자인 토큰·스타일

| 요소 | 토큰/클래스 |
|------|-------------|
| 섹션 배경(카드 사용 시) | `var(--ad-b0kla-card-bg)` / `var(--mg-color-surface-main)` |
| 테두리 | `var(--ad-b0kla-border)` / `var(--mg-color-border-main)` |
| 라벨 | 12px, `var(--mg-color-text-secondary)` |
| 입력 배경 | B0KlA input 스타일 (unified-design-tokens·AdminDashboardB0KlA.css) |
| placeholder | 보조 텍스트 색 `var(--mg-color-text-secondary)` |

### 3.3 라벨·placeholder (권장)

- **상담사**: 라벨 "상담사", placeholder "전체" 또는 "상담사 선택".
- **내담자**: 라벨 "내담자", placeholder "전체" 또는 "내담자 선택/검색".
- **기간**: 라벨 "기간", 시작일 placeholder "시작일", 종료일 placeholder "종료일".

### 3.4 역할별 동작

- **관리자**: 상담사 셀렉트 표시. 값 미지정 시 전체 상담사 대상 조회.
- **상담사**: 상담사 필터 UI **비노출**. API 호출 시 항상 본인 `consultantId`로 제한.

---

## 4. 목록(카드) 블록 (ConsultationLogListBlock)

### 4.1 블록 구조

- **래퍼**: `ContentSection` + `ContentCard` (또는 `ContentSection` 카드 스타일). 매칭관리 `MappingListBlock`과 동일하게 카드형 섹션으로 감쌈.
- **클래스**: `mg-v2-consultation-log-list-block`, 내부 그리드 `mg-v2-consultation-log-list-block__grid`.

### 4.2 카드 그리드

| 브레이크포인트 | 열 수 | gap (열/행) |
|----------------|-------|--------------|
| 데스크톱 (1280px~) | 2~3열 | 24px (RESPONSIVE_LAYOUT_SPEC §2.3) |
| 태블릿 (768px~1279px) | 2열 | 20px |
| 모바일 (~767px) | 1열 | 16px |

- **그리드**: CSS Grid 사용. `grid-template-columns`: 데스크톱 `repeat(3, 1fr)` 또는 `repeat(auto-fill, minmax(320px, 1fr))`, 태블릿 `repeat(2, 1fr)`, 모바일 `1fr`.
- **gap**: `var(--mg-layout-gap)` 또는 responsive-layout-tokens의 섹션 gap (모바일 12px, 태블릿 16px, 데스크톱 20~24px).

### 4.3 카드 항목 (한 건당)

카드 내부 구성 및 표시 순서:

| 순서 | 항목 | 표시 | 비고 |
|------|------|------|------|
| 1 | 세션일자 | sessionDate (YYYY-MM-DD 또는 ko-KR 포맷) | 14~16px, `var(--mg-color-text-main)` |
| 2 | 회기 | sessionNumber + "회기" | 14px |
| 3 | 내담자명 | clientName | 14px, 굵게 또는 본문 |
| 4 | 상담사명 | consultantName | 14px, `var(--mg-color-text-secondary)` |
| 5 | 완료여부 | 뱃지 | 완료: `--mg-success-*`, 미완료: `--mg-warning-*` (아래 §4.4) |
| 6 | 작성일(또는 수정일) | createdAt 또는 updatedAt | 12px, `var(--mg-color-text-secondary)` |

- **카드 스타일**: 배경 `var(--mg-color-surface-main)` 또는 `var(--ad-b0kla-card-bg)`, 테두리 1px `var(--mg-color-border-main)`, border-radius 16px (또는 `var(--ad-b0kla-radius)`). 패딩 24px(기준), 브레이크포인트별 §2.2 참조.
- **선택**: 카드 왼쪽 **세로 악센트 바** 4px, `var(--mg-color-primary-main)` (#3D5246), radius 2px — 선택 사항이나 B0KlA 섹션 블록과 톤 통일 시 권장.

### 4.4 완료여부 뱃지

| 상태 | 표시 문구 | 토큰/색상 |
|------|-----------|-----------|
| 완료 (isSessionCompleted === true) | "완료" | `var(--mg-success-500)` 배경 또는 텍스트, 뱃지 클래스 `mg-v2-badge--success` 등 |
| 미완료 (false) | "미완료" | `var(--mg-warning-500)` 배경 또는 텍스트, 뱃지 클래스 `mg-v2-badge--warning` 등 |

- B0KlA·unified-design-tokens의 `--mg-success-*`, `--mg-warning-*` 사용. 기획서 §3.1·§4와 동일.

### 4.5 클릭 동작·접근성

- **클릭 가능 영역**: 카드 전체를 클릭 가능 영역으로 둠.
- **커서**: `cursor: pointer`.
- **동작**: 클릭 시 `ConsultationLogModal`을 **recordId**로 오픈(수정 모드). 기획서 §6 Option A 권장: 모달에 `recordId`(또는 `initialRecordId`) prop 추가 후, recordId가 있으면 단건 API로 로드해 수정 모드로 폼 세팅.
- **키보드/포커스**: 카드가 버튼 또는 role="button" + tabIndex={0} 등으로 포커스 가능하게 하면 접근성 향상.

### 4.6 빈 상태 (데이터 없음)

- **문구**: "등록된 상담일지가 없습니다." (또는 "조건에 맞는 상담일지가 없습니다.")
- **보조 문구**: "다른 필터를 적용해 보시거나, 스케줄에서 상담일지를 작성해 주세요."
- **아이콘**: FileText 또는 List (lucide-react) 등, 48px 내외. 빈 상태 영역 중앙 배치.
- **스타일**: 매칭관리 `mg-v2-mapping-list-block__empty`와 동일 톤 — 아이콘 영역 배경 `var(--ad-b0kla-green-bg)`, 아이콘 색 `var(--ad-b0kla-green)`, 제목 1.125rem/700, 설명 14px 보조 텍스트.

---

## 5. 반응형 요약

| 항목 | 모바일 (375px~) | 태블릿 (768px~) | 데스크톱 (1280px~) |
|------|------------------|------------------|---------------------|
| 페이지/섹션 패딩 | 16px | 20px | 24~32px |
| 카드 그리드 열 수 | 1 | 2 | 2~3 |
| 그리드 gap | 16px | 20px | 24px |
| 터치 영역 | 최소 44×44px | — | — |

- **참조**: `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md` §2.2, §2.3, §4.

---

## 6. 모달 (ConsultationLogModal) 연동

- **사용 컴포넌트**: 기존 `ConsultationLogModal` 재사용.
- **Phase 1 권장**: 기획서 §6 **Option A** — 모달에 `recordId`(또는 `initialRecordId`) prop 추가. `recordId`가 있으면 `scheduleData` 없이 `GET /api/admin/consultation-records/{recordId}`(관리자) 또는 상담사용 단건 API로 조회 후, 응답으로 폼·client·psych 세팅하여 수정 모드로 표시.
- **클릭 시**: 목록 카드 클릭 → `ConsultationLogModal`에 `isOpen={true}`, `recordId={선택한 record.id}`, `onClose`, `onSave`(저장 후 목록 refetch) 전달.
- **UnifiedModal**: ConsultationLogModal이 이미 UnifiedModal을 사용하는지 프로젝트 규칙에 맞게 유지. 코더는 `core-solution-unified-modal` 스킬 참조.

---

## 7. 사용 토큰·클래스 정리

| 용도 | 토큰/클래스 |
|------|-------------|
| 페이지 배경/본문 | `mg-v2-ad-b0kla`, `mg-v2-ad-b0kla__container` |
| 헤더 제목/부제목 | `mg-v2-content-header__title`, `mg-v2-content-header__subtitle`, `var(--ad-b0kla-title-color)`, `var(--ad-b0kla-subtitle-color)` |
| 섹션/카드 배경·테두리 | `var(--mg-color-surface-main)`, `var(--ad-b0kla-card-bg)`, `var(--ad-b0kla-border)` |
| 본문 텍스트 | `var(--mg-color-text-main)` |
| 보조 텍스트 | `var(--mg-color-text-secondary)` |
| 완료 뱃지 | `var(--mg-success-500)` 또는 `mg-v2-badge--success` |
| 미완료 뱃지 | `var(--mg-warning-500)` 또는 `mg-v2-badge--warning` |
| 카드 radius | `var(--ad-b0kla-radius)` (16px) |
| 세로 악센트 바 | 4px, `var(--mg-color-primary-main)`, radius 2px |

- **공통**: `unified-design-tokens.css`, `AdminDashboardB0KlA.css`, `responsive-layout-tokens.css` 사용. 매칭관리 페이지와 시각적 톤 통일.

---

## 8. 구현 시 확인 사항 (코더 체크리스트)

- **파일·위치**
  - 페이지 래퍼: AdminCommonLayout으로 감싼 컨테이너 컴포넌트 생성 (예: `ConsultationLogView.js` 또는 `ConsultationLogViewPage.js`). 경로는 라우트 규칙에 맞게 (예: `admin/consultation-logs`, `consultant/consultation-logs`).
  - 본문: 매칭관리와 동일하게 `ContentArea` 안에 `ContentHeader` + 필터 섹션 + 목록 블록 배치. 필터·목록은 organisms 또는 동일 구조로 분리 가능.

- **사용 컴포넌트**
  - `AdminCommonLayout`, `ContentArea`, `ContentHeader`, `ContentSection`(또는 `ContentCard`), 기존 `ConsultationLogModal`.
  - 필터: 셀렉트·date input은 B0KlA·unified-design-tokens 적용. 내담자 셀렉트/검색은 API 연동(내담자 목록 또는 검색 API) 후 옵션 구성.

- **API 호출 시점**
  - 목록: 페이지 마운트 및 필터 변경 시 `GET /api/admin/consultation-records` (consultantId, clientId, page, size). 역할이 상담사면 consultantId=본인 고정 또는 상담사 전용 API 호출.
  - 기간 필터: Phase 1에서 백엔드에 startDate/endDate가 없으면 프론트에서 필터링하거나, Phase 2에서 API 확장 후 연동.
  - 모달 오픈 시: recordId 기준 `GET /api/admin/consultation-records/{recordId}` (또는 상담사용 단건 API) 호출 후 모달에 데이터 전달.

- **모달 연동**
  - 목록 카드 클릭 시 `ConsultationLogModal`에 `recordId` 전달. Option A 적용 시 모달 내부에서 recordId로 단건 조회 후 수정 모드 세팅.
  - 저장 후: 모달 닫기 + 목록 refetch.

- **역할별**
  - 관리자: 상담사 셀렉트 노출, consultantId 미지정 시 전체 조회.
  - 상담사: 상담사 필터 비노출, API는 본인 consultantId로만 조회.

- **반응형**
  - 카드 그리드: 데스크톱 2~3열, 태블릿 2열, 모바일 1열. gap·패딩은 responsive-layout-tokens 또는 RESPONSIVE_LAYOUT_SPEC §2.2, §2.3 준수.

- **스타일**
  - `mg-v2-ad-b0kla`, `mg-v2-content-header`, `mg-v2-content-section`, `ad-b0kla-*` 등 기존 B0KlA 클래스·토큰 사용. 완료/미완료는 `--mg-success-*`, `--mg-warning-*` 사용.
