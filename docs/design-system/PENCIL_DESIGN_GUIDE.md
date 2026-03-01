# 펜슬(Pencil) 디자인 가이드 — 디자이너 필수 숙지

**대상**: core-designer 및 디자인 산출물을 작성하는 모든 담당자  
**목적**: `mindgarden-design-system.pen`, `pencil-new.pen`을 단일 소스로 이해하고 숙지하여 **일관된 디자인·레이아웃**을 내기 위함.  
**참조**: 어드민 대시보드 샘플 https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample

---

## 1. 펜슬(.pen)이란 — 단일 소스

| 파일 | 역할 | 디자이너가 할 일 |
|------|------|------------------|
| **mindgarden-design-system.pen** | B0KlA 비주얼 스펙·레이아웃 프레임·색상·타이포·브레이크포인트 정의 | 모든 새 화면·컴포넌트 설계 시 **이 파일에 정의된 시각 언어만** 사용. 여기 없는 색·간격·레이아웃은 사용 금지. |
| **pencil-new.pen** | 아토믹 디자인 컴포넌트(버튼, 카드, 네비, 푸터, 색상, 간격, radius, 그림자 등) | 새 UI 설계 시 **이 안의 컴포넌트·토큰과 샘플 레이아웃**을 재사용. 임의 컴포넌트 생성 금지. |

- **코드 쪽 매핑**: 구현 시 `unified-design-tokens.css`, `AdminDashboardB0KlA.css`의 `var(--mg-*)`, `mg-v2-*` 클래스와 1:1 대응한다. 디자이너는 **토큰명·클래스명**을 스펙에 명시하면 코더가 그대로 적용한다.

---

## 2. 반드시 숙지할 비주얼 언어 (B0KlA)

### 2.1 색상 팔레트

설계 시 **아래 값 또는 이에 대응하는 토큰만** 사용한다. hex를 직접 쓰지 말고 **토큰명**을 명시한다.

| 용도 | 색상(참고) | 토큰 (우선 사용) |
|------|------------|------------------|
| 메인 배경 | #FAF9F7 | `var(--mg-color-background-main)` |
| 그라데이션 끝 | #F2EDE8 | 배경 그라데이션 시 토큰 참고 |
| 주조 (Primary) | #3D5246 | `var(--mg-color-primary-main)` |
| 주조 밝음 | #4A6354 | `var(--mg-color-primary-light)` |
| 보조 (Secondary) | #6B7F72 | `var(--mg-color-secondary-main)` |
| 포인트 (Accent) | #8B7355 | `var(--mg-color-accent-main)` |
| 본문 텍스트 | #2C2C2C | `var(--mg-color-text-main)` |
| 보조 텍스트 | #5C6B61 | `var(--mg-color-text-secondary)` |
| 서페이스/카드 | #F5F3EF | `var(--mg-color-surface-main)` |
| 테두리 | #D4CFC8 | `var(--mg-color-border-main)` |
| 사이드바(다크) | #2C2C2C | 다크 영역 고정값 |

### 2.2 레이아웃 구조 (어드민)

- **좌측 사이드바**: 고정 260px, 배경 #2C2C2C. 로고 상단 → 구분선 → 네비. 활성 메뉴 배경 #3D5246, 비활성 텍스트 rgba(255,255,255,0.7). 메뉴 항목 높이 44px, border-radius 10px.
- **메인 영역**
  - **상단 바**: 브레드크럼 + 페이지 제목 + 우측 주요 액션. 배경 #FAF9F7, 하단 1px 구분선. 높이 56~64px.
  - **본문**: 패딩 24~32px. 콘텐츠는 **섹션 블록** 단위로 구분.

### 2.3 섹션 블록

- 하나의 콘텐츠 구역 = 하나의 블록.
  - 배경: #F5F3EF (또는 `var(--mg-color-surface-main)`)
  - 테두리: 1px #D4CFC8, border-radius 16px
  - 패딩: 24px, 내부 gap 16px
- **섹션 제목**: 왼쪽 **세로 악센트 바** (폭 4px, #3D5246, radius 2px) + 제목 텍스트 16px, fontWeight 600, #2C2C2C.

### 2.4 타이포그래피

- **폰트**: Noto Sans KR (한글 우선).
- **제목**: 20~24px, fontWeight 600.
- **본문**: 14~16px.
- **라벨/캡션**: 12px, #5C6B61 (또는 `var(--mg-color-text-secondary)`).

### 2.5 카드·메트릭·버튼

- **카드/메트릭**: 숫자 24px/600, 라벨 12px. 카드 왼쪽 **세로 악센트**(4px, 주조/보조/포인트 중 하나)로 구분 가능.
- **주조 버튼**: 배경 #3D5246, 텍스트 #FAF9F7, padding 10–20px, height 40px, radius 10px.
- **아웃라인 버튼**: 배경 없음, 테두리 #D4CFC8.

---

## 3. 반응형·브레이크포인트 (펜슬 레이아웃 프레임)

`mindgarden-design-system.pen`의 **Layout & Responsive** 섹션과 동일한 기준을 따른다.

| 브레이크포인트 | 최소 너비 | 컨테이너 max-width | 비고 |
|----------------|-----------|--------------------|------|
| 모바일 | 375px | 100% | 터치 영역 44px 이상 |
| 태블릿 | 768px | 100% | 사이드바 드로어/오버레이 |
| 데스크톱 | 1280px | 1200px | 사이드바 260px 고정 |
| Full HD | 1920px | 1440px | |
| 2K | 2560px | 1680px | |
| 4K | 3840px | 1920px | 4K에서도 본문 max-width 제한 |

- 새 화면 설계 시 **6단계 브레이크포인트**를 모두 고려해 레이아웃·패딩·gap을 정한다.  
- 상세 수치: `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md` 참조.

---

## 4. 디자이너 숙지 체크리스트

설계 전·설계 시 아래를 확인하면 **일관된 디자인·레이아웃**이 유지된다.

- [ ] **단일 소스**: `mindgarden-design-system.pen`, `pencil-new.pen`에 있는 컴포넌트·색·간격만 사용했는가?
- [ ] **색상**: 위 팔레트(또는 `var(--mg-*)` 토큰)를 벗어난 값을 쓰지 않았는가?
- [ ] **레이아웃**: 사이드바 260px, 상단 바 56~64px, 본문 패딩 24~32px를 지켰는가?
- [ ] **섹션 블록**: 배경·테두리·radius·좌측 악센트 바로 구역을 구분했는가?
- [ ] **타이포**: Noto Sans KR, 제목/본문/라벨 크기·색상이 샘플과 일관되는가?
- [ ] **반응형**: 모바일~4K 브레이크포인트를 검토했는가? (특히 모바일 터치 44px, 4K max-width 1920)
- [ ] **토큰 명시**: 스펙에 `var(--mg-*)` 또는 `mg-v2-*` 클래스명을 적었는가? (코더가 추측하지 않도록)
- [ ] **재사용**: pencil-new.pen의 버튼·카드·네비 등 기존 컴포넌트를 재사용했는가?

---

## 5. 참조 문서·파일

| 문서/파일 | 용도 |
|-----------|------|
| **본 문서** | 디자이너 필수 숙지 — 펜슬 가이드 요약 |
| `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md` | 브레이크포인트·컨테이너·패딩·그리드·Pencil 레이아웃 프레임 상세 |
| `docs/design-system/ATOMIC_DESIGN_SYSTEM.md` | Atoms → Pages 계층, 컴포넌트 규칙 |
| `docs/standards/DESIGN_CENTRALIZATION_STANDARD.md` | 토큰·중앙화 원칙 (Premium/Glass 등 확장 시) |
| `frontend/src/styles/unified-design-tokens.css` | 구현용 토큰 목록 — 디자이너는 토큰명 참고만 (코드 수정 안 함) |
| `docs/design-system/v2/MATCHING_SCHEDULE_INTEGRATION_SPEC.md` | 스펙 문서 구조·섹션 블록·토큰 사용 예시 |

---

**요약**: 펜슬(.pen) 두 파일을 **디자인의 단일 소스**로 이해하고, 위 팔레트·레이아웃·타이포·반응형 기준을 지키면 일관된 디자인과 레이아웃이 나옵니다. 설계 시 항상 **토큰명·클래스명을 명시**해 코더가 그대로 구현할 수 있게 합니다.
