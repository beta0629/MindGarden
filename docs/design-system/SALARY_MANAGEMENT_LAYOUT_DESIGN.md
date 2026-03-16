# 급여 관리 시스템 — 레이아웃·비주얼 설계 (B0KlA 기준)

**버전**: 1.0.0  
**작성일**: 2025-03-16  
**담당**: core-designer  
**참조**: `docs/project-management/SALARY_MANAGEMENT_RENEWAL_SURVEY.md`, `docs/design-system/REFUND_MANAGEMENT_LAYOUT_DESIGN.md`, `PENCIL_DESIGN_GUIDE.md`, 어드민 대시보드 샘플 https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample  
**범위**: 급여 관리 메인 + 급여 프로필 통합. 레이아웃·와이어프레임·정보 계층만 제안. 코드 작성 없음.

---

## 1. 목표·범위

### 1.1 목표

- **급여 관리** 페이지(`/erp/salary`)를 B0KlA(마인드가든 어드민 대시보드) 스타일로 **새 레이아웃**으로 설계한다.
- 관리자(ADMIN)가 **급여 프로필 조회·등록·수정**, **급여 계산 실행·미리보기·내역 조회**, **세금 통계 조회**를 할 때 흐름이 명확하고, 자주 쓰는 동작(상담사 선택, 기간 선택, 계산 실행)이 눈에 띄게 배치되도록 한다.
- **정보 노출**: 급여 프로필(등급, 기본급, 옵션, 사업자 여부 등), 급여 계산(기본/옵션/총 급여, 세금, 실지급액), 세금 통계는 **관리자만** 노출. 역할별 권한은 기존과 동일 유지.

### 1.2 범위

| 포함 | 제외 |
|------|------|
| 급여 관리 메인 페이지 전면 레이아웃 재구성 | 다른 ERP 페이지 레이아웃 변경 |
| ContentHeader + ContentArea, KPI/필터/탭/테이블·카드 배치 | API·비즈니스 로직 구현 |
| 급여 프로필 카드 그리드·등급·급여 테이블·옵션 폼(모달) 레이아웃 | — |
| B0KlA·unified-design-tokens·반응형(모바일·태블릿·데스크톱) | — |

### 1.3 단일 소스·토큰

- **디자인 단일 소스**: `mindgarden-design-system.pen`, `pencil-new.pen`, `unified-design-tokens.css`
- **색상**: `var(--mg-color-*)`, `var(--ad-b0kla-*)` 토큰만 사용. hex 직접 사용 금지.
- **레이아웃**: 사이드바 260px, 상단 바 56~64px, 본문 패딩 24~32px. 섹션은 **섹션 블록**(배경·테두리·radius·좌측 악센트) 단위.
- **타이포**: Noto Sans KR. 제목 20~24px/600, 본문 14~16px, 라벨/캡션 12px.

### 1.4 적용 체크리스트 (PENCIL_DESIGN_GUIDE)

- [x] 색상은 팔레트·토큰만 사용
- [x] 레이아웃: 사이드바 + 메인, 상단 바(브레드크럼·제목·액션), 본문 섹션 블록
- [x] 섹션 블록: 배경·테두리·radius·좌측 세로 악센트(4px) + 제목
- [x] 카드·메트릭: 숫자 24px/600, 라벨 12px, 좌측 악센트로 구분
- [x] 스펙에 토큰명·클래스명(`var(--mg-*)`, `mg-v2-*`) 명시

---

## 2. 급여 관리 메인 — 페이지 구조 (정보 계층)

전체는 **AdminCommonLayout** 내 **ContentHeader** + **ContentArea**로, 순서는 아래와 같이 고정한다.

| 순서 | 영역 | 역할 |
|------|------|------|
| 0 | **ContentHeader** | 페이지 제목 "급여 관리", 부제, 액션(급여 기산일 설정, 기간 선택 등) |
| 1 | **급여 KPI/통계 카드 영역** | 프로필 수, 계산 완료 건수 등 — 선택 시 2~4열 카드 |
| 2 | **필터·제어 영역** | 기간, 상담사, 급여일, **급여 계산 실행** 버튼(눈에 띄게) |
| 3 | **탭 또는 단일 흐름** | "급여 프로필" \| "급여 계산" \| "세금 관리" |
| 4 | **탭별 콘텐츠** | 급여 프로필: 카드 그리드 / 급여 계산: 미리보기·계산 내역 / 세금 관리: 세금 통계·내역 |

---

## 3. 섹션별 레이아웃·와이어프레임

### 3.1 ContentHeader (상단 바)

- **위치**: 메인 영역 최상단. 배경 `var(--mg-color-background-main)`, 하단 1px `var(--mg-color-border-main)`.
- **구성**:
  - 좌: 브레드크럼(예: ERP > 급여 관리)
  - 중/좌: 제목 **「급여 관리」** (20~24px, fontWeight 600, `var(--mg-color-text-main)`)
  - 부제(선택): **「상담사 급여 프로필 및 계산 관리」** (14px, `var(--mg-color-text-secondary)`)
  - 우: **급여 기산일 설정** 버튼(설정 아이콘, 아웃라인 또는 주조), **기간 선택** `<select>` (월 단위, API/공통코드 기반 동적 목록 권장. 하드코딩 2025-01~2025-09 대체)
- **클래스·토큰**: 기존 ContentHeader / `mg-v2-content-header`, `mg-v2-content-header__title`, `mg-v2-content-header__subtitle`, `mg-v2-content-header__right`. 버튼: `mg-v2-button`, `mg-v2-button-outline` 또는 주조.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ERP > 급여 관리               급여 관리                    [기산일 설정] [2025-03 ▼] │
│ 상담사 급여 프로필 및 계산 관리                                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 급여 KPI/통계 카드 영역 (선택)

- **역할**: 프로필 수, 계산 완료 건수 등 한눈에 파악. 선택 구현 시 사용.
- **구조**: 하나의 **섹션 블록** 안에 카드 2~4개를 가로 배치. 데스크톱 4열, 태블릿 2열, 모바일 1열.
- **섹션 블록**:
  - 배경: `var(--mg-color-surface-main)` (#F5F3EF)
  - 테두리: 1px `var(--mg-color-border-main)`, border-radius 16px
  - 패딩: 24px(데스크톱), 내부 gap 24px
  - 제목(선택): 좌측 **세로 악센트 바** 4px `var(--mg-color-primary-main)`, radius 2px + 텍스트 "급여 현황 요약" 16px/600
- **카드 1장 (Molecule)**:
  - **좌측 세로 악센트** 4px — primary / accent / secondary 구분
  - **숫자**: 24px, fontWeight 600, `var(--mg-color-text-main)`
  - **라벨**: 12px, `var(--mg-color-text-secondary)` (예: "등록 프로필 수", "계산 완료 건수")
- **클래스 제안**: `salary-kpi-block`, `salary-kpi-block__card`, `mg-v2-ad-b0kla__card`, `mg-v2-ad-b0kla__kpi-value`, `mg-v2-ad-b0kla__kpi-label`.

```
┌─ 급여 현황 요약 (세로 악센트 4px + 제목) ────────────────────────────────────────┐
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ (선택 4번째)                   │
│ │ ▌ 12         │ │ ▌ 24         │ │ ▌ 3          │                                │
│ │   등록 프로필  │ │   계산 완료   │ │   미계산     │                                │
│ └──────────────┘ └──────────────┘ └──────────────┘                                │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.3 필터·제어 영역

- **역할**: 기간·상담사·급여일 선택, **급여 계산 실행** 버튼을 눈에 띄게 배치. 자주 쓰는 동작이 명확히 보이도록.
- **구조**: 하나의 **섹션 블록**. 내부 1~2행.
  - **1행**: 필터 그룹 — **기간**(월 또는 시작일·종료일), **상담사**(드롭다운/멀티 선택), **급여 지급일**. 우측에 **「급여 계산 실행」** 주조 버튼(primary, height 40px, radius 10px).
  - **2행(선택)**: 미리보기 링크 또는 "미리보기" 버튼.
- **섹션 블록**: 배경·테두리·radius 16px, 패딩 24px. 제목: 세로 악센트 4px + "조회 조건" 또는 "급여 계산".
- **컨트롤**: select/date input은 `pencil-new.pen` 아토믹·디자인 토큰. **계산 실행** 버튼: `var(--mg-color-primary-main)` 배경, `mg-v2-button` 주조.
- **클래스 제안**: `salary-filter-block`, `salary-filter-block__group`, `salary-filter-block__run-calc` (계산 실행 버튼).

```
┌─ 조회 조건 (세로 악센트 4px + 제목) ─────────────────────────────────────────────┐
│ 기간 [2025-03 ▼]  상담사 [전체 ▼]  급여 지급일 [25일 ▼]     [급여 계산 실행]       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.4 탭 (급여 프로필 | 급여 계산 | 세금 관리)

- **역할**: 단일 흐름으로 세 가지 콘텐츠 전환. 기존 `mg-tabs` 패턴 또는 B0KlA pill/underline 탭.
- **구조**: 필터 블록 바로 아래, 하나의 **섹션 블록** 상단에 탭 메뉴. 탭 클릭 시 해당 패널만 표시.
- **탭 스타일**: B0KlA 기준 — 활성 `var(--mg-color-primary-main)` 배경 또는 하단 2px 악센트, 비활성 `var(--mg-color-text-secondary)`. 높이 44px, padding 12~14px, radius 10px.
- **클래스 제안**: `mg-tabs`, `mg-tab`, `mg-tab-active` (기존 유지) 또는 `mg-v2-ad-b0kla__pill-toggle`, `mg-v2-ad-b0kla__pill`, `mg-v2-ad-b0kla__pill--active`.

```
┌─ [급여 프로필] [급여 계산] [세금 관리] ───────────────────────────────────────────┐
│ (탭별 콘텐츠 영역)                                                                 │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.5 탭별 콘텐츠 영역

#### 3.5.1 급여 프로필 탭

- **역할**: 상담사별 급여 프로필 카드 그리드, 등급·급여 테이블 요약, "새 프로필 생성"·"편집/조회" 액션.
- **구조**: 동일 **섹션 블록** 내부.
  - **제목 행**: 세로 악센트 4px + "상담사 급여 프로필", 우측 **「새 프로필 생성」** 주조 버튼.
  - **빈 상태**: `salaryProfiles.length === 0` 시 안내 문구 + "지금 프로필 작성하기" 버튼. 클래스: `salary-profile-block__empty`, `salary-no-profiles-message`.
  - **프로필 그리드**: `salary-profile-block__grid` — 카드 한 장당 아래 3.6 급여 프로필 카드 스펙 적용.
- **클래스 제안**: `salary-profile-block`, `salary-profile-block__grid`, `salary-profile-block__empty`.

#### 3.5.2 급여 계산 탭

- **역할**: 계산 미리보기(상담사, 기간, 상담 건수, 총 급여, 세금, 실지급액), 계산 내역 목록(카드 또는 테이블), "세금 내역 보기", "출력" 액션.
- **구조**: 동일 **섹션 블록** 내부.
  - **미리보기**: `salary-calc-block__preview` — 계산 실행 후 1건 요약. 숫자 24px/600, 라벨 12px, 좌측 악센트 선택.
  - **계산 내역**: `salary-calc-block__list` → `salary-calc-block__card` (기간, 상태, 기본/옵션/총 급여, 세금, 실지급액, 상담 건수, "세금 내역 보기", "출력").
- **클래스 제안**: `salary-calc-block`, `salary-calc-block__preview`, `salary-calc-block__list`, `salary-calc-block__card`, `salary-calc-block__actions`.

#### 3.5.3 세금 관리 탭

- **역할**: 세금 통계(총 세금액, 세금 건수, 원천징수/지방소득세/부가세/국민연금/건강보험/장기요양/고용보험, 총 공제액), "세금 상세 내역 보기", "출력".
- **구조**: 동일 **섹션 블록** 내부.
  - **통계 카드**: `salary-tax-block__card` — KPI 카드 톤 유지. 빈 상태 시 "세금 통계를 조회하려면 …" 안내.
- **클래스 제안**: `salary-tax-block`, `salary-tax-block__card`, `salary-tax-block__empty`.

---

## 4. 급여 프로필 — 카드·등급·급여 테이블·옵션 폼(모달)

### 4.1 프로필 카드 그리드 (한 장)

- **역할**: 상담사별 프로필 요약. 카드 한 장당 상담사명, 등급, 기본급 요약, "편집/조회" 버튼.
- **구조 (Molecule)**:
  - 배경: `var(--mg-color-surface-main)` 또는 카드 배경, 테두리 1px `var(--mg-color-border-main)`, border-radius 16px.
  - **좌측 세로 악센트** 4px `var(--mg-color-primary-main)` (선택).
  - **상단**: 상담사명(16px/600), 이메일 또는 식별자(12px, secondary).
  - **중단**: 등급 라벨, 기본급 요약(숫자 24px/600, 라벨 12px).
  - **하단**: **「프로필 조회」** 또는 **「편집」** 버튼 — 아웃라인 또는 텍스트. 한 카드당 한두 개 액션.
- **클래스 제안**: `salary-profile-card`, `salary-profile-card__accent`, `salary-profile-card__name`, `salary-profile-card__meta`, `salary-profile-card__grade`, `salary-profile-card__base`, `salary-profile-card__actions`. 그리드 컨테이너: `salary-profile-block__grid` (grid, 데스크톱 3~4열, 태블릿 2열, 모바일 1열).

```
┌─ salary-profile-card ─────────────────┐
│ ▌ 김상담  kim@example.com               │
│   등급: A   기본급: 3,000,000원          │
│                    [프로필 조회] [편집]  │
└─────────────────────────────────────────┘
```

### 4.2 등급·급여 테이블 (탭 또는 블록 내)

- **역할**: 등급별 기본급·옵션 요약 테이블. 프로필 탭 내 서브 섹션이나 모달 내 표 형태.
- **구조**: **섹션 블록** 또는 테이블 전용 블록. 제목: 세로 악센트 4px + "등급별 급여". 테이블 헤더 12px secondary, 본문 14px main. 테두리·행 구분선 `var(--mg-color-border-main)`.
- **클래스 제안**: `salary-grade-table`, `salary-grade-table__row`, `mg-v2-ad-b0kla__table` (공통 테이블 룩).

### 4.3 옵션 폼 (모달)

- **역할**: 급여 프로필 생성/편집 시 등급, 기본급, 옵션(상담 단가 등), 사업자 여부 등 입력. **UnifiedModal** 사용 필수(core-solution-unified-modal).
- **구조**: 모달 내부 — 제목 "급여 프로필 등록" / "급여 프로필 수정", 폼 필드(라벨 12px, 입력 14px), 하단 "취소" 아웃라인 + "저장" 주조.
- **레이아웃**: 1~2열 폼 레이아웃. 섹션 구분 시 좌측 악센트 4px + 소제목. 토큰: `var(--mg-color-border-main)`, `var(--mg-spacing-md)`, `var(--mg-spacing-lg)`.
- **클래스 제안**: 모달 루트는 공통 `UnifiedModal`. 내부: `salary-profile-form`, `salary-profile-form__section`, `salary-profile-form__row`, `salary-profile-form__actions`. 기존 `SalaryProfileFormModal`·`ConsultantProfileModal` 구조와 연동 시 동일 클래스명으로 스타일 통일.

---

## 5. 반응형 동작

| 브레이크포인트 | KPI 블록 | 필터 | 탭 | 프로필 그리드 / 테이블 |
|----------------|----------|------|-----|------------------------|
| **모바일 (375px)** | 1열 세로 쌓기, 패딩 16px, gap 12px | 세로 쌓기, 풀폭 버튼, 계산 실행 버튼 상단 또는 고정 | 탭 가로 스크롤 또는 풀폭 스택 | 1열 카드, 테이블 가로 스크롤 또는 카드형 리스트 |
| **태블릿 (768px)** | 2열 그리드, 패딩 20px, gap 16px | 1~2행, 버튼 우측 정렬 | 탭 1행 | 2열 그리드, 테이블 가로 스크롤 허용 |
| **데스크톱 (1280px)** | 2~4열, 패딩 24px, gap 24px | 1행 가로 배치 | 탭 1행 | 3~4열 그리드, 전체 컬럼 노출 |
| **Full HD ~ 4K** | 4열 유지, 패딩·gap `RESPONSIVE_LAYOUT_SPEC.md` (28~40px) | 동일 | 동일 | 컨테이너 max-width 내 표시 |

- **RESPONSIVE_LAYOUT_SPEC.md**의 컨테이너 max-width·패딩·섹션 gap을 따른다.
- 터치 영역: 모바일에서 버튼·탭 최소 44px 높이 유지.

---

## 6. 토큰·클래스 요약 (코더 구현용)

### 6.1 공통 섹션 블록

- 배경: `var(--mg-color-surface-main)`
- 테두리: 1px `var(--mg-color-border-main)`
- border-radius: 16px
- 패딩: 24px(데스크톱), `var(--mg-spacing-lg)` 또는 24px
- 제목: 앞쪽 **세로 악센트 바** 4px `var(--mg-color-primary-main)`, radius 2px + 텍스트 16px/600 `var(--mg-color-text-main)`

### 6.2 카드·메트릭

- 숫자: 24px, fontWeight 600, `var(--mg-color-text-main)`
- 라벨: 12px, `var(--mg-color-text-secondary)`
- 좌측 악센트: 4px (primary / accent / secondary 구분)

### 6.3 버튼

- 주조: 배경 `var(--mg-color-primary-main)`, 텍스트 `var(--mg-color-surface-main)` 또는 #FAF9F7, height 40px, radius 10px
- 아웃라인: 배경 없음, 테두리 `var(--mg-color-border-main)`, height 40px, radius 10px
- 클래스: `mg-v2-button`, `mg-v2-button-outline` (기존 공통)

### 6.4 클래스 네이밍 제안 (BEM·mg-v2)

| 용도 | 클래스 |
|------|--------|
| 메인 래퍼 | `ContentArea` + `mg-v2-ad-b0kla salary-management__main` |
| KPI 블록 | `salary-kpi-block`, `salary-kpi-block__card` |
| 필터 블록 | `salary-filter-block`, `salary-filter-block__group`, `salary-filter-block__run-calc` |
| 탭 | `mg-tabs`, `mg-tab`, `mg-tab-active` 또는 `mg-v2-ad-b0kla__pill-toggle`, `mg-v2-ad-b0kla__pill`, `mg-v2-ad-b0kla__pill--active` |
| 급여 프로필 블록 | `salary-profile-block`, `salary-profile-block__grid`, `salary-profile-block__empty` |
| 프로필 카드 | `salary-profile-card`, `salary-profile-card__name`, `salary-profile-card__meta`, `salary-profile-card__grade`, `salary-profile-card__base`, `salary-profile-card__actions` |
| 급여 계산 블록 | `salary-calc-block`, `salary-calc-block__preview`, `salary-calc-block__list`, `salary-calc-block__card`, `salary-calc-block__actions` |
| 세금 관리 블록 | `salary-tax-block`, `salary-tax-block__card`, `salary-tax-block__empty` |
| 등급 테이블 | `salary-grade-table`, `salary-grade-table__row` |
| 프로필 폼(모달 내) | `salary-profile-form`, `salary-profile-form__section`, `salary-profile-form__row`, `salary-profile-form__actions` |
| 공통 카드/테이블 | `mg-v2-ad-b0kla__card`, `mg-v2-ad-b0kla__section`, `mg-v2-ad-b0kla__table` |

### 6.5 색상·간격 토큰 참조

- `var(--mg-color-background-main)` — 메인 배경
- `var(--mg-color-surface-main)` — 서페이스/카드
- `var(--mg-color-primary-main)` — 주조·악센트 바
- `var(--mg-color-accent-main)` — 포인트
- `var(--mg-color-secondary-main)` — 보조
- `var(--mg-color-text-main)` — 본문
- `var(--mg-color-text-secondary)` — 라벨/캡션
- `var(--mg-color-border-main)` — 테두리
- `var(--mg-spacing-md)`, `var(--mg-spacing-lg)`, `var(--mg-spacing-xl)` — 간격
- B0KlA 확장: `var(--ad-b0kla-*)` 필요 시 `unified-design-tokens.css` 참고

---

## 7. 완료 기준 (코더 구현용)

- **ContentHeader**: 제목 "급여 관리", 부제, 액션(기산일 설정, 기간 선택)이 스펙대로 배치되어 있다.
- **본문 순서**: (1) KPI 카드 영역(선택), (2) 필터·제어(기간, 상담사, 급여일, **급여 계산 실행** 버튼), (3) 탭 "급여 프로필" | "급여 계산" | "세금 관리", (4) 탭별 블록(프로필 그리드 / 계산 미리보기·내역 / 세금 통계)이 명확히 구분된다.
- **급여 프로필**: 카드 그리드·등급·급여 테이블·옵션 폼(모달) 레이아웃이 본 문서의 블록·영역·클래스명으로 구현 가능한 수준으로 정의되어 있다.
- **토큰·클래스**: 모든 색·간격·radius는 `var(--mg-*)` 또는 `var(--ad-b0kla-*)`로만 지정되어 있으며, 위 6.4 클래스명이 스펙에 명시되어 있다.
- **반응형**: 모바일 375px, 태블릿 768px, 데스크톱 1280px에서 KPI/필터/탭/그리드 배치가 RESPONSIVE_LAYOUT_SPEC 및 §5 표와 일치한다.

---

## 8. 참조 문서

| 문서 | 용도 |
|------|------|
| `docs/project-management/SALARY_MANAGEMENT_RENEWAL_SURVEY.md` | 현재 구조·개선 포인트·블록 분리 제안 |
| `docs/design-system/REFUND_MANAGEMENT_LAYOUT_DESIGN.md` | 환불 관리 레이아웃 패턴·섹션 블록·토큰 참고 |
| `docs/project-management/REFUND_MANAGEMENT_NEW_LAYOUT_SPEC.md` | ContentHeader/ContentArea·아토믹 목표 구조 참고 |
| `docs/design-system/PENCIL_DESIGN_GUIDE.md` | 펜슬 단일 소스·색상·레이아웃·체크리스트 |
| `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md` | 브레이크포인트·패딩·그리드 |
| `docs/design-system/v2/ADMIN_DASHBOARD_METRICS_VISUALIZATION_SPEC.md` | KPI 카드·B0KlA 일관성 참고 |
| 어드민 대시보드 샘플 (URL) | 비주얼·레이아웃 참고 |

---

**문서 끝.**  
코드 작성 없이 레이아웃·와이어프레임·정보 계층만 제안. 구현은 core-coder가 본 스펙과 공통 ContentHeader/ContentArea·UnifiedModal 규칙을 기준으로 진행.
