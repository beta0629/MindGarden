# MindGarden 어드민 — 시각화 플랫폼 스펙 (Visualization Platform Spec)

**작성일**: 2026-07-01  
**담당**: core-planner + core-designer  
**목적**: 단순 문서/핸드오프를 넘어 런타임 UI 및 어드민 전반에 폭넓은 시각화를 주입하기 위한 전략 및 스펙 정의  
**참조**: `ADMIN_PAGE_REGION_VISUALIZATION.md`, `ADMIN_COMMERCIAL_UX_PER_PAGE_ANALYSIS.md`

---

## §1 Executive Summary — 시각화 3층 정의

어드민 내 시각화(Visualization)는 단순 장식이 아닌 업무 판단과 인지 부하 감소를 위한 도구입니다. 이를 3개의 층(Layer)으로 정의하여 폭넓게 주입합니다.

- **L-A 문서/핸드오프 (Documentation & Handoff)**: 기존 `REGION_VISUALIZATION` 문서와 같이 개발자-디자이너 간 영역 맵, 와이어프레임, 레이아웃을 시각적으로 소통하는 층입니다.
- **L-B 인앱 정보 시각화 (In-App Information)**: 차트, 진행바(Progress), 상태 뱃지, 타임라인, Empty State 일러스트 등 데이터의 상태와 흐름을 런타임 UI에 직접 시각화하는 층입니다.
- **L-C 인앱 구조 시각화 (In-App Structure)**: 영역 하이라이트, Side Peek 패널, 밀도(Density) 토글 미리보기, 온보딩 코치마크 등 UI의 구조적 변화와 상호작용을 시각적으로 가이드하는 층입니다.

---

## §2 시각화 taxonomy (10 유형)

총 10가지의 시각화 유형을 정의하며, 장식 목적의 시각화는 배제합니다.

| 유형 | 목적 | B0KlA 토큰 | 사용 화면 예 | 구현 컴포넌트 후보 | 금지 사항 |
|---|---|---|---|---|---|
| **1. Progress / pipeline** | 회기, 결제, 매칭 등의 진행 상태 직관적 파악 | `var(--mg-color-primary)`, `var(--mg-bg-progress)` | 통합일정 카드, 매칭 목록 | `ProgressPipeline`, `SessionProgressIndicator` | 의미 없는 애니메이션 남용 금지 |
| **2. Count badge / sparkline** | 월간 일정 수, KPI 추이 등 작은 공간 내 데이터 요약 | `var(--mg-color-chart-*)` | 대시보드 위젯, ERP 테이블 | `MiniSparkline`, `BadgeSelect` | 과도한 축/눈금 표시 금지 |
| **3. Split layout affordance** | 캘린더와 사이드바 등 패널 간 경계 및 크기 조절 인지 | `var(--mg-border-divider)` | 통합일정, 매칭 관리 | `SplitPaneDivider` | 드래그 핸들 시인성 저하 금지 |
| **4. Side peek panel (360px)** | 목록 컨텍스트 유지하며 상세 정보 시각화 | `var(--mg-shadow-peek)` | 내담자 관리, 상담 일지 | `SidePeekShell` | 본문(Main) 영역 가림 금지 |
| **5. Region highlight** | Dev/검수 모드 시 영역 식별, 또는 신규 기능 첫 방문 가이드 | `var(--mg-color-highlight-bg)` | 통합일정 (dev 모드) | `RegionOverlay` | 운영(Prod) 환경 상시 노출 금지 |
| **6. Empty / zero state visual** | 데이터 없음 상태 시 다음 행동 유도 및 시각적 피로 완화 | `var(--mg-color-text-muted)` | 알림, 매칭 대기열 | `EmptyStateIllustration` | 너무 크거나 화려한 이미지 금지 |
| **7. Relationship graph** | 테넌트 네트워크, 매칭 관계 등 복잡한 관계망 시각화 | `var(--mg-color-network-*)` | 테넌트 프로필, 매칭 상세 | `NetworkVisualGraph`, `tenant-network-visual` | 노드 과다로 인한 성능 저하 금지 |
| **8. Calendar density heatmap** | 장기 일정의 밀도를 색상으로 표현하여 가용성 파악 | `var(--mg-color-heatmap-*)` | 통합일정 (월간 뷰) | `DensityHeatmap` | 명도 대비(Accessibility) 위반 금지 |
| **9. Filter chip + saved view visual** | 현재 적용된 필터 상태와 저장된 뷰를 시각적으로 분리 | `var(--mg-bg-chip-active)` | 환불 관리, 통합일정 | `SavedViewChips` | 칩 내부 텍스트 잘림(Truncation) 금지 |
| **10. Table row status stripe** | **[사용 금지]** 행 전체 배경색 변경으로 상태 표시 | N/A | (과거 사용됨) | N/A | **회귀 금지** (대신 Status 뱃지 사용) |

---

## §3 실제 페이지 주입 — 화면별 매핑 (P0 10화면)

| 화면 (ID) | L-B 시각화 (정보) | L-C 구조 시각화 (구조) | 우선순위 |
|---|---|---|---|
| **G1-01. 통합 일정 관리** | 카드 내 `SessionProgress`, 필터 세그먼트 Visual | `SidePeekShell`, `DensityToggle` Preview, (옵션) Dev 모드 Region Overlay | **P0** |
| **G2-01. 내담자 종합 관리** | 활성 서비스 뱃지, 상태 Pipeline | `SidePeekShell` (결제/예약 이력) | **P0** |
| **G2-02. 상담사 종합 관리** | 가동률 Sparkline, 활성 상태 뱃지 | `SidePeekShell` (자격/일정 대조) | **P0** |
| **G2-03. 스태프 관리** | 권한 레벨 뱃지 | `SidePeekShell` (권한 트리 구조 시각화) | **P0** |
| **G1-04. 매칭 목록** | 매칭 진행 상태 Pipeline | `SidePeekShell` (요구사항 대조) | P1 |
| **G2-04. 사용자 권한 관리** | 활성/휴면 상태 뱃지 | `SidePeekShell` (접속 로그 타임라인) | P1 |
| **G2-05. 상담사용 내담자 목록** | 다음 예약 D-day 뱃지 | `SidePeekShell` (Progress Note 프리뷰) | P1 |
| **G3-01. 거래·정산** | 결제 승인/실패 상태 뱃지 | `SidePeekShell` (에러 로그 대조) | P1 |
| **G3-02. 급여 관리** | 급여 증감 Sparkline | `SidePeekShell` (월별 상세 건수) | P1 |
| **G3-06. PG 설정** | 연동 상태 뱃지 | (모달 사용으로 Side Peek 불필요) | P1 |

---

## §4 공통 컴ponent SSOT 제안

새로운 시각화 요소를 도입할 때 하드코딩을 배제하고 기존 컴포넌트 생태계와 통합합니다. (core-component-manager 관점)

1. **`VisualizationPanel`**: 차트 및 그래프를 담는 공통 컨테이너. 기존 `ChartWidget`을 추상화하여 사용.
2. **`ProgressPipeline`**: 기존 `SessionProgressIndicator`를 확장하여 결제/매칭 등 다목적 파이프라인 시각화 지원.
3. **`SidePeekShell`**: 우측 360px 고정 패널. `AdminCommonLayout`과 연동하여 본문을 밀어내거나 덮는 애니메이션 처리.
4. **`DensityPreviewToggle`**: Comfortable/Compact 전환 시 변경될 레이아웃을 아이콘으로 미리 보여주는 토글 컴포넌트.

**원칙**: 
- 기존 컴포넌트(`SessionProgressIndicator`, `tenant-network-visual` 등) 우선 재사용. 중복 생성 금지.
- React + B0KlA Design Tokens(`var(--mg-*)`) 필수 사용. 하드코딩 금지.

---

## §5 Phase 로드맵 (구현 순)

- **Phase V0: 통합일정 Pilot**
  - `SidePeekShell` 프로토타입 적용 (peek).
  - 사이드바 카드 내 `SessionProgressIndicator` 주입 (SessionProgress on card).
  - `DensityPreviewToggle` 적용 및 레이아웃 변화 시각화 (density toggle preview).
- **Phase V1: G2 사용자 관리 (내담자/상담사/스태프)**
  - G3 사용자 3탭 list progress/status 주입.
  - 상세 정보 조회를 위한 `SidePeekShell` 확산.
- **Phase V2: G3 ERP 및 기타 화면**
  - ERP table mini-sparkline / status pill 일괄 적용.
  - Empty State Illustration 전역 적용.

> **정책**: 각 Phase는 `core-designer` (핸드오프/스펙) → `core-coder` (구현) → `core-tester` (검증) 파이프라인을 엄격히 따르며, Good SHA 기반으로 배포합니다.

---

## §6 디자이너 의견 (core-designer)

- **「폭넓게」의 경계**: 시각화는 단순히 화면을 예쁘게 꾸미는 장식이 아닙니다. **업무 판단을 돕는 시각화(Actionable Visualization)**만이 어드민에 존재해야 합니다. 예를 들어, 숫자로만 된 가동률 대신 미니 Sparkline을 넣는 것은 추이를 즉각적으로 판단하게 돕지만, 의미 없는 배경 패턴은 인지 부하만 가중시킵니다.
- **통합일정 Compact Row 교훈**: 2026-06-30의 롤백 사태는 '압축'에만 매몰되어 '정보의 시각적 계층'을 무시했기 때문입니다. 시각화를 통해 **내담자 이름과 결제/상태**를 더욱 강조(Highlight)하고, 덜 중요한 정보는 Side Peek로 넘겨야 합니다. 시각화는 밀도를 높이면서도 가독성을 잃지 않게 하는 핵심 도구입니다.

---

## §7 PER_PAGE / REGION 문서 연동

본 스펙은 기존 분석 문서들과 강하게 결합됩니다.

- `ADMIN_COMMERCIAL_UX_PER_PAGE_ANALYSIS.md`의 각 화면 분석 항목 하단에 **「권장 시각화 유형」**을 추가하여 본 문서의 Taxonomy와 매핑 완료.
- `ADMIN_PAGE_REGION_VISUALIZATION.md`의 레이아웃 정의 시, `R-SIDEBAR` 및 `R-PEEK` 영역이 본 문서의 `SidePeekShell`과 동일한 SSOT임을 보장합니다.
