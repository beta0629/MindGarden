# TCI/MMPI 심리검사 요약 블록 (내담자·상담일지) 화면 설계 스펙

**문서 목적**: 내담자 상세 및 상담일지 화면에서 제공되는 TCI/MMPI 심리검사 결과 요약 블록의 UI/UX 레이아웃 및 렌더링 제약사항을 정의합니다. (core-coder 전달용)

---

## 1. 제품 제약 및 렌더링 규칙 (필수)

### 1.1 조건부 노출 (Empty State 처리 방침)
- **원칙**: TCI 또는 MMPI 검사 데이터(진행 중 포함)가 **실제로 존재하는 경우에만** 해당 블록을 렌더링합니다.
- **데이터가 없을 경우**: 화면에서 **영역 자체를 노출하지 않습니다.**
  - "진행된 심리검사가 없습니다" 등의 Placeholder 영역이나 대형 Empty State(0건) 블록을 렌더링하지 않습니다.
- **로딩 실패 시**: 토스트(Toast) 메시지 등으로 에러를 알리고, 해당 블록을 숨김(비노출) 처리합니다.

### 1.2 동일 IA 패턴 (TCI / MMPI)
- 두 검사 모두 **동일한 UI 구조 및 레이아웃(Information Architecture)**을 사용합니다.
- 구분 방식: 아이콘과 라벨(텍스트)만으로 검사 유형(TCI / MMPI)을 구분합니다.

---

## 2. 화면별 노출 스펙

### 2.1 내담자 상세 (Client Detail / Client Card)
내담자 상세 뷰 내에 배치되는 '심리검사 요약 블록'입니다.

- **위치**: 내담자 기본 정보 하단 또는 관련 탭 내 독립된 **섹션 블록**.
- **구조**:
  - **섹션 블록 컨테이너**: `var(--mg-color-surface-main)` 배경, `16px` border-radius, `var(--mg-color-border-main)` 1px 테두리.
  - **섹션 제목 영역**:
    - 좌측 세로 악센트 바 (`4px` 너비, `var(--mg-color-primary-main)`).
    - 제목 텍스트: "심리검사 리포트" (16px, fontWeight 600, `var(--mg-color-text-main)`).
  - **콘텐츠 영역 (항목 리스트/카드)**:
    - **검사 메타데이터**: 아이콘(TCI/MMPI), 검사 종류명, 최근 검사 일자, 상태 배지(완료/분석중 등).
    - **액션 그룹 (우측 정렬)**:
      1. `리포트 보기` (Primary Button)
      2. `인쇄` (Outline Button)
      3. `MD 다운로드` (Outline/Icon Button)

| 정보/액션 요소 | 역할/설명 | 디자인 토큰 / 스타일 |
| --- | --- | --- |
| **블록 배경/테두리** | 섹션 구분을 위한 카드 형태 | `var(--mg-color-surface-main)`, 테두리 `var(--mg-color-border-main)` |
| **좌측 세로 악센트** | 섹션 제목 강조 | `var(--mg-color-primary-main)`, 너비 4px, 반경 2px |
| **검사 유형 아이콘/라벨** | TCI와 MMPI 시각적 구분 | 14px, `var(--mg-color-text-main)` |
| **메타데이터 (일자 등)** | 최신 검사 일시 및 정보 | 12px, `var(--mg-color-text-secondary)` |
| **상태 배지** | BadgeSelect 공통 모듈 활용 | 상태별 컬러 토큰 (진행중, 완료 등) |
| **리포트 보기 버튼** | 결과 뷰어 또는 모달 진입 | `var(--mg-color-primary-main)` 배경 주조 버튼 |
| **인쇄 / MD 다운로드** | Phase 1 출력용 부가 액션 | Outline 버튼 (`var(--mg-color-border-main)`) |

### 2.2 상담일지 화면 (Consultation Log)
상담일지 작성 또는 조회 시 우측 패널 또는 상단 요약 영역에 제공되는 축소형 블록.

- **구조 (최소화/축소형)**:
  - 공간 차지를 최소화하기 위해 메타데이터 요약 및 **[리포트 보기] 링크(또는 아이콘 버튼)** 수준으로만 구성합니다.
  - 배경색만 미세하게 다르게 주거나 얇은 테두리 카드로 제공.
  - **액션 제약**: 인쇄 및 MD 다운로드는 상담일지 뷰에서 제외하고, '리포트 보기(새 창/모달)'에 집중합니다.
- **빈 값 처리**: 마찬가지로 검사 이력이 없으면 이 작은 영역도 그리지 않습니다.

### 2.3 인쇄 뷰 (Print View - Phase 1)
'인쇄' 액션 시 제공되는 전용 출력 레이아웃 스펙입니다.

- **인쇄 전용 헤더 요소**:
  - 내담자 식별 정보 (이름, 생년월일 또는 ID 등 마스킹 처리된 정보).
  - 검사 종류 (TCI / MMPI) 및 검사 일시.
  - 리포트 출력 일시 및 출력자(또는 기관) 명.
- **스타일 제약**:
  - 배경색 제거 (`#FFFFFF` 강제).
  - 테두리 및 텍스트 색상을 고대비(블랙/다크그레이)로 설정 (`var(--mg-color-text-main)`).
  - 불필요한 UI 액션(버튼, 네비게이션) `display: none` 처리.

---

## 3. 컴포넌트 단위 스펙 (공통)

### 3.1 레이아웃 및 반응형 (Responsive)
- **데스크톱 (1280px 이상)**: 카드 내 액션 버튼(인쇄, MD 다운로드, 보기)을 가로로 길게 배치 (Flex Row).
- **모바일/태블릿 (768px 이하)**: 
  - 버튼 그룹을 하단으로 분리(Flex Column)하거나 아이콘 전용 버튼으로 축소.
  - 터치 영역 최소 `44px` 보장.

### 3.2 디자인 토큰 및 클래스 매핑
공통 B0KlA 톤(AdminDashboardB0KlA.css, unified-design-tokens.css)을 활용합니다.

- **컨테이너 (섹션 블록)**: `.mg-v2-section-block`
  - `background-color: var(--mg-color-surface-main);`
  - `border: 1px solid var(--mg-color-border-main);`
  - `border-radius: 16px; padding: 24px;`
- **타이포그래피**:
  - 제목: `font-size: 16px; font-weight: 600; color: var(--mg-color-text-main);`
  - 보조/일자: `font-size: 12px; color: var(--mg-color-text-secondary);`
- **버튼**:
  - 주조 액션(리포트 보기): `background-color: var(--mg-color-primary-main); color: #FAF9F7;`
  - 부조 액션(인쇄, 다운로드): `background-color: transparent; border: 1px solid var(--mg-color-border-main);`

---

## 4. 코더(core-coder) 구현 시 주의사항
1. **데이터 Fetch 결과 검증**: `data === null`, `data.length === 0`일 때 컴포넌트 트리 자체에서 `return null;` 처리하세요.
2. **모듈 재사용**: ContentHeader, AdminCommonLayout, BadgeSelect 등 기존 프로젝트 공통 컴포넌트를 최우선으로 사용하여 조립하세요.
3. **조건부 렌더링 하드코딩 금지**: 검사 유형(TCI/MMPI) 구분을 위해 문자열에 의존하기보다, 서버에서 내려오는 타입 코드를 기반으로 아이콘/라벨 렌더링을 매핑하세요.
