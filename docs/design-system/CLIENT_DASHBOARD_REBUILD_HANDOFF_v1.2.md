# 내담자 대시보드 v1.2 Rebuild 핸드오프 (Design Spec)

**상태**: v1.2 Rebuild (Design Handoff)  
**작성자**: `core-designer` (디자인 전용 서브에이전트)  
**SSOT**: `PENCIL_DESIGN_GUIDE.md`, `mindgarden-design-system.pen`, `pencil-new.pen`, `unified-design-tokens.css`

---

## 1. 개요 및 목표

기존 v1.1(Freeze)의 파편화된 UI와 클래스를 전면 폐기하고, 아토믹 기반의 신규 디자인 시스템(B0KlA)과 어드민 대시보드 레이아웃 표준을 내담자(Client) 톤앤매너로 이식하여 전면 재구현(Rebuild)합니다.

- **디자인 톤**: 관리자 대시보드의 "섹션 블록(`mg-v2-section-block`) + 좌측 악센트" 구조를 차용하되, 내담자 특성에 맞춰 둥근 모서리(16px)와 부드러운 서페이스(`var(--mg-color-surface-main)`)를 강조하여 편안한 여백 중심의 레이아웃을 제공합니다.
- **핵심 원칙**: 하드코딩된 픽셀/색상값을 배제하고 100% 토큰과 공통 클래스 기반으로 재설계.

---

## 2. Before & After 와이어프레임

### ❌ Before (현재 엉망인 상태)
- **레이아웃**: 단일 통짜 페이지에 인라인 스타일과 구형 유틸리티 클래스가 혼재.
- **컴포넌트**: `div` 지옥, 카드 간격 불규칙, 반응형 붕괴(모바일에서 카드가 잘리거나 겹침).
- **시각 요소**: 일관성 없는 버튼 색상, 테두리 두께 불일치, 하드코딩된 `#ccc`, `#f5f5f5` 색상.
- **구조**:
  ```text
  [ 구형 헤더 ]
  [ 환영 메시지 (마진 0, 여백 부족) ]
  [ KPI - 정렬 틀어짐 ]  [ 예약 카드 - 높이 다름 ]
  [ 구형 테이블 형태의 복잡한 결제/상담 내역 ]
  ```

### 🟢 After (목표 레이아웃 - B0KlA 어드민 스타일 차용)
- **레이아웃**: 최대 너비 `1200px` 중앙 정렬 (모바일 `100%`). 섹션 블록(`mg-v2-section-block`) 단위의 명확한 구획.
- **컴포넌트**: 아토믹 컴포넌트 조합. 섹션 타이틀 좌측에 4px 악센트 바.
- **구조**:
  ```text
  +---------------------------------------------------------------+
  | [Breadcrumb] 내 대시보드                                        |
  | [Title] 환영합니다, OOO님                 [MGButton: 새 일정 예약] |
  +---------------------------------------------------------------+
  | [mg-v2-section-block: bg-surface-main, radius-16, gap-16]     |
  | ┃ (Accent: var(--mg-color-primary-main)) 예정된 상담 세션         |
  | +--------------------+ +--------------------+                 |
  | | [Card] 10/12(목)   | | [Card] 사전 설문   |                 |
  | +--------------------+ +--------------------+                 |
  +---------------------------------------------------------------+
  | [mg-v2-section-block: bg-surface-main, radius-16]             |
  | ┃ (Accent: var(--mg-color-accent-main)) 나의 현황               |
  | [ KPI: 잔여 이용권 2회 ] [ KPI: 작성한 일지 5건 ]                   |
  +---------------------------------------------------------------+
  | [mg-v2-section-block: bg-surface-main, radius-16]             |
  | ┃ (Accent: var(--mg-color-secondary-main)) 상담사 메시지         |
  | [ Message List Row ]                                          |
  +---------------------------------------------------------------+
  ```

---

## 3. 섹션별 컴포넌트 트리 (Atomic)

전체 페이지 래퍼: `<div class="mg-v2-layout-main bg-[var(--mg-color-background-main)]">`

### 3.1 상단 바 (Page Header) ➔ `Organism`
기존 공통 모듈을 최우선 재사용.
- **`ContentHeader`**
  - **Breadcrumb** (`Atom`): 12px, `var(--mg-color-text-secondary)`
  - **Title** (`Atom`): 24px, fontWeight 600, `var(--mg-color-text-main)`
  - **MGButton** (`Atom`): `primary` variant, height 40px, radius 10px

### 3.2 다음 일정 및 액션 ➔ `Organism`
- **`SectionBlock`** (`mg-v2-section-block`): padding 24px, gap 16px, borderRadius 16px, background `var(--mg-color-surface-main)`, border `1px solid var(--mg-color-border-main)`
  - **SectionTitle** (`Molecule`): 좌측 악센트 바 (width 4px, bg `var(--mg-color-primary-main)`, radius 2px) + TitleText(16px, bold, `var(--mg-color-text-main)`)
  - **CardGrid** (`Template`): `grid-cols-1 md:grid-cols-2 gap-4`
    - **ActionCard** (`Molecule`): padding 20px, borderRadius 12px, border `1px solid var(--mg-color-border-main)`
      - **CardLabel** (`Atom`): 12px, `var(--mg-color-text-secondary)`
      - **CardValue** (`Atom`): 18px, bold
      - **MGButton** (`Atom`): `outline` 또는 `ghost` variant

### 3.3 나의 현황 (KPI) ➔ `Organism`
- **`SectionBlock`** (`mg-v2-section-block`)
  - **SectionTitle** (`Molecule`): 악센트 바 (bg `var(--mg-color-accent-main)`)
  - **KpiGrid** (`Template`): `grid-cols-2 md:grid-cols-3 gap-4`
    - **KpiCard** (`Molecule`)
      - **KpiLabel** (`Atom`): 12px, `var(--mg-color-text-secondary)`
      - **KpiValue** (`Atom`): 24px, bold, `var(--mg-color-text-main)`

### 3.4 빠른 메뉴 (Quick Menu) ➔ `Organism`
- Desktop: `mg-v2-section-block` 하단에 가로 정렬된 아이콘 버튼 리스트 (`QuickMenuRow`)
- Mobile: 하단 고정 바 형태(`BottomNavigation`)로 분기 처리

---

## 4. 제거할 Legacy 클래스 및 패턴 (Anti-Patterns)

`core-coder`는 Rebuild 시 아래 사항들을 반드시 코드베이스에서 걷어내야 합니다.

1. **제거 대상 CSS/클래스**
   - `client-dash-old-wrapper`, `dash-card-legacy`, `box-shadow-heavy` 등 v1.1 이전 유틸리티 클래스 전면 삭제.
   - 인라인 스타일 속성 (`style={{ margin: '10px', backgroundColor: '#f0f0f0' }}` 등) 엄격히 금지.
   - 하드코딩된 색상 유틸리티 (`bg-gray-100`, `text-gray-800` 등). 반드시 `bg-[var(--mg-color-surface-main)]` 등의 커스텀 테마 토큰 사용.

2. **제거 대상 패턴**
   - **의미 없는 div 중첩 지옥**: 시맨틱 HTML(section, article, header 등) 및 Flex/Grid 레이아웃을 통해 DOM 뎁스 최소화.
   - **커스텀 오버레이/모달**: 독자적으로 만든 모달은 모두 폐기하고 공통 `UnifiedModal` 모듈로 교체.
   - **하드코딩된 여백**: 컴포넌트 내부에 강제 부여된 margin 대신, 부모 컨테이너의 Grid/Flex `gap`을 통해 컴포넌트 간격을 제어.

---

## 5. Coder 1 PR 완료 정의 (Definition of Done)

해당 스펙을 바탕으로 `core-coder`가 구현을 마친 후 PR을 올릴 때의 통과 조건입니다.

- [ ] **토큰 100% 매핑**: 모든 색상, 간격, 테두리, 타이포그래피에 하드코딩(hex, rgb, 픽셀 강제 주입 등) 없이 `var(--mg-*)` 디자인 토큰 및 `mg-v2-*` 클래스가 적용되었는가?
- [ ] **레이아웃 구조 일치**: `mg-v2-section-block`을 사용하여 명확한 구획(패딩 24px, 둥근 테두리 16px)과 좌측 악센트 바(폭 4px)가 포함된 섹션 타이틀이 구현되었는가?
- [ ] **반응형 작동 여부**: Desktop(1280px 기준, 중앙 정렬 1200px 폭) 및 Mobile(768px 이하, 단일 컬럼, 좌우 16px 패딩) 레이아웃에서 시각적 붕괴나 가로 스크롤 이슈 없이 작동하는가?
- [ ] **레거시 완전 제거**: Client Dashboard 진입점 및 하위 뎁스에서 v1.1 이하의 잔재 클래스 및 인라인 스타일이 1건도 발견되지 않는가?
- [ ] **공통 모듈 정상 연동**: 버튼(`MGButton`), 헤더(`ContentHeader`) 등 기존에 정의된 공통 컴포넌트를 일관되게 재사용하였는가?
