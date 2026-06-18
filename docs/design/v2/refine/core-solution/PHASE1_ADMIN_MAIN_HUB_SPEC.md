# Phase 1: 어드민 메인 허브(`/`) 상용화 UI/UX 스펙

**1. 개요 및 배경**
- **목적**: 기존 혼재된 메인 허브(`/`)를 Greenfield 상용화 수준으로 재설계. "예약부터 회기, 정산까지. 센터 운영의 모든 것을 한곳에서."라는 Identity 메시지를 즉각적으로 체감할 수 있는 실무 밀착형 어드민 대시보드 구현.
- **적용 대상**: Phase 1은 **어드민(ADMIN)** 역할 단일 대상. (상담사·내담자는 Phase 4 확장)
- **제약 사항**: React/CSS/HTML 사전 작성 금지. SaaS Blue(`#3B82F6`), Legacy button, 중앙 고정 narrow column 레이아웃 절대 금지.

**2. 레이아웃/아이디어 (선정안)**
- **구조**: App shell Greenfield (GNB + 260px 좌측 사이드바 + 유동적인 메인 ContentArea). `AdminDashboardV2`의 IA 밀도를 상용화 기준으로 시각화.
- **선택 이유**: 다업종/다기능 확장에 유리한 좌측 고정 네비게이션과 상단 퀵 액션 구조 적용. B0KlA 샘플의 악센트 바/radius 규칙을 Rebuild 수준으로 적용.

**3. 세부 UI/UX 스펙**

### 3.1. 전역 레이아웃 및 Viewport
- **Desktop (1440px)**
  - `GNB`: 높이 64px, z-index 1000, Shield H2 로고 배치.
  - `LNB`: 너비 260px, 배경 `--mg-v2-color-surface-sidebar`, 본문 영역 스크롤 시 고정.
  - `ContentArea`: 패딩 32px(`--mg-v2-space-8`), 배경 `--mg-v2-color-surface-bg`.
- **Mobile (375px)**
  - `LNB` → 햄버거 메뉴를 통한 드로어 모달로 변환. 터치 타겟 최소 44px. 가로 스크롤 없음.
  - KPI 및 위젯: 1열 스택(Column) 레이아웃.

### 3.2. 블록 와이어 (레이아웃)
```ascii
+-----------------------------------------------------------+
| [Shield Logo] GNB (64px)       [검색] [알림] [프로필/설정]|
+----------------+------------------------------------------+
| LNB (260px)    | ContentHeader (Breadcrumb, Title, Action)|
| - 대시보드     +------------------------------------------+
| - 통합스케줄   | [KPI 1]        [KPI 2]        [KPI 3]    | <- Hero/KPI 행
| - 내담자관리   +-----------------------+------------------+
| - 정산관리     | [ 파이프라인/메인차트]| [입금 확인 대기] | <- 섹션 블록 (Grid)
| - ...          |                       |                  |
|                +-----------------------+------------------+
|                | [오늘 예정 스케줄]    | [미작성 일지]    |
+----------------+-----------------------+------------------+
```

### 3.3. 핵심 KPI (사용자 확정 2026-06-18)
어드민 허브 접속 후 3초 내 파악을 위한 최상단 3 KPI. AdminDashboardV2 데이터 정합성을 바탕으로 도출.
**3D Flip/Rotate 인터랙션 적용 (`KpiFlipCard`)**: 클릭/탭 시 Y축 180도 회전하여 앞면(요약) ↔ 뒷면(상세) 전환. 동시 1장만 flipped 상태 유지.

1. **오늘 상담 일정**
   - **앞면**: 오늘 예정된 전체 예약 및 완료 건수 추이 요약
   - **뒷면**: 시간대별 미니 타임라인 또는 CONFIRMED/COMPLETED/CANCELLED breakdown + 「일정 보기」 CTA
2. **상담사별 오늘 일정**
   - **앞면**: 상담사별 오늘 건수 요약
   - **뒷면**: 상담사 리스트 (이름, N건, 다음 일정 시각) + chip 클릭 → integrated-schedule filter deep link
3. **신규 상담 접수**
   - **앞면**: 신규 등록 내담자 및 최초 배정 대기 건수
   - **뒷면**: 신규 내담자 목록 (이름, 접수일, 배정 상태) + 「배정하기」 CTA

### 3.4. Core Flow Pipeline (5단계)
- **문제**: Wide 스크린(1440~2560)에서 5단계 카드가 중앙에 몰려(center cluster) 양쪽에 과도한 여백(dead space)이 발생하는 이슈.
- **목표**: 컨테이너 **전체 너비 균등 분배** (equal flex / grid 5col / space-between + stretch connector) 적용.
- **단계 목록**: 매칭 → 입금 확인 → 회기 권한 → 스케줄 → 자동 차감/회계
- **반응형 대응**:
  - 데스크톱/태블릿: 전체 너비 균등 분배
  - 모바일 (375px): 가로 스크롤(Horizontal scroll) 지원
- **시각 스펙**: B0KlA 토큰 및 Calm Forest 팔레트 적용.
- **구현 시점: Phase 3 only** — 선행 hotfix 절대 금지 (이번 디자인 개편 시 일괄 반영).

### 3.5. 컴포넌트 매핑 (B0KlA 재사용 vs Rebuild)
| 영역 | 판정 | 설명 | 사용 토큰/클래스 예시 |
|------|------|------|-----------------------|
| 메인 레이아웃 셸 | **Rebuild** | Greenfield 레이아웃. 중앙 고정 narrow 컬럼 폐기, Full width 대응 | `var(--mg-v2-color-surface-bg)` |
| GNB/LNB | **Refactor** | B0KlA 구조 유지, 시각 토큰만 `--mg-v2-*` 로 정합 | `var(--mg-v2-color-surface-sidebar)` |
| KPI 카드 / 위젯 래퍼 | **Refactor** | 배경 `#F5F3EF`, radius 16px, 좌측 악센트 바 | `mg-v2-ad-b0kla__card`, `var(--mg-v2-shadow-sm)` |
| Primary 버튼 | **Refactor** | `MGButton` (40px, radius 10px) 100% 사용 | `var(--mg-v2-color-primary-main)` |
| 모달 오버레이 | **Refactor** | `UnifiedModal`로 모두 수렴. 커스텀 모달 폐기 | `var(--mg-v2-z-modal-backdrop)` |

### 3.6. 시각 및 토큰 스펙 (참조용)
- **타이포그래피**: `var(--mg-v2-font-family-base)` (Noto Sans KR 등). 제목 `24px` Bold, 본문 `16px`, 라벨 `12px` (`var(--mg-v2-font-size-*)`). 텍스트 색상 순수 Black 금지 (`var(--mg-v2-color-text-primary)`).
- **색상**: Calm Forest 단일 팔레트. 주조색 `var(--mg-v2-color-primary-main)` (`#3D5246`).
- **간격/그리드**: 모든 간격은 8px 기반 (`var(--mg-v2-space-*)`). 섹션간 최소 gap 24px~32px.
- **Shadow/Radius**: 카드 Radius `16px` (`var(--mg-v2-radius-xl)`), 기본 카드 그림자 `var(--mg-v2-shadow-sm)`.

**4. 상호작용 및 상태 (States)**
- **Hover/Focus**: 클릭 가능한 모든 카드/버튼에 `:hover` (`var(--mg-v2-color-state-hover)`) 및 2px 포커스 링 적용.
- **Empty State**: 위젯 데이터가 없을 경우 "일정/알림이 없습니다" 형태의 일러스트+텍스트+CTA 버튼 1프레임 노출. 빈 화면 방치 금지. (상담사별 일정 KPI의 경우: "오늘 배정된 상담 일정이 없습니다")
- **Loading State**: 전체 로딩 시 `UnifiedLoading` 스피너 또는 카드별 스켈레톤 UI 노출.
- **Dark Mode**: Phase 1에서는 Light 시안 우선 도출 시에도 Dark 토큰(`[data-theme="dark"]`) 매핑 연동 구조를 명시 (또는 Dual 1벌).

**5. 상용화 품질 바 체크리스트**
- [ ] 하드코딩된 패딩/마진/z-index/HEX 컬러 값 존재 여부 (모두 `var(--mg-v2-*)`로 치환)
- [ ] SaaS Blue (`#3B82F6`) 잔존 여부 검사 (0건 필수)
- [ ] `prefers-reduced-motion` 및 대비(Contrast) WCAG AA 등급 충족 여부
- [ ] 모바일(375px) 대응 시 터치 타겟(44px 이상) 보장 및 수평 스크롤 발생 점검

**6. 참조 및 다음 단계**
- **다음 단계**: (1) 사용자 검수(KPI 3건 확정 포함) → (2) Phase 3 `core-coder`(`claude-4.6-opus-high-thinking`) 위임.
- **참조 문서**: 
  - `docs/design/v2/DESIGN_V2_TOKEN_SSOT.md`
  - `frontend/src/styles/unified-design-tokens.css`
  - `frontend/src/components/dashboard-v2/AdminDashboardV2.js`
