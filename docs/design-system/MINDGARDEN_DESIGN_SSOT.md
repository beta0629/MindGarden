# MindGarden Design SSOT (Single Source of Truth)

## 1. 문서 지위
본 문서는 MindGarden 프로젝트의 디자인 토큰, 레이아웃, 공통 패턴에 대한 **단일 진입점(SSOT)** 역할을 수행합니다. 모든 UI/UX 설계 및 프론트엔드 구현은 본 문서의 기준을 최우선으로 따릅니다.

## 2. P0~P6 롤아웃 우선순위 (Rollout Priority)
| 단계 | 대상 | 설명 |
|---|---|---|
| **P0** | 디자인 토큰 (Tokens) | 색상, 타이포그래피, 간격 등 기초 변수 정의 및 적용 |
| **P1** | 셸/내비게이션 (Shell/Nav) | GNB, LNB, AdminCommonLayout 등 최상위 레이아웃 구조 |
| **P2** | ContentArea | 페이지 본문 영역의 기본 패딩, 여백, 컨테이너 규격 |
| **P3** | ErpPageShell | ERP 도메인 특화 셸 및 공통 레이아웃 패턴 |
| **P4** | 분자 (Molecules) | 버튼 그룹, 입력 폼, 필터 툴바 등 복합 UI 요소 |
| **P5** | 오거니즘 (Organisms) | 테이블, 데이터 그리드, 대시보드 위젯 등 독립적 기능 단위 |
| **P6** | 검증 (Validation) | 전체 UI 일관성, 반응형, 접근성 및 토큰 적용 여부 최종 검증 |

## 3. 레퍼런스 화면 명세
### 1순위: `/admin/user-management` (기본 골든 패스)
- **구조**: `AdminCommonLayout` + `ContentHeader`
- **설명**: 표준적인 관리자 페이지의 기본 형태를 정의합니다.

### 2순위: `/erp/financial` (복합 패턴)
- **구조**: `ErpPageShell` + `ErpHubTabs`
- **설명**: 복잡한 ERP 화면에서 탭 기반의 뷰 전환을 처리하는 패턴입니다.

### 💡 핵심: ContentHeader vs ErpHubTabs 역할 분리
- **ContentHeader**: 페이지 전역 액션(예: 저장, 등록, 엑셀 다운로드 등) 및 페이지 타이틀을 담당합니다.
- **ErpHubTabs**: 페이지 내 하위 뷰 전환(예: 수입/지출/환불 탭 전환)을 전담하며, 전역 액션을 포함하지 않습니다.

## 4. 기존 문서 정리 정책
문서 간의 역할 충돌을 방지하기 위해 다음과 같이 역할을 분리합니다.
- **`ERP_FINANCIAL_MANAGEMENT_UI_SPEC.md`**: 구현 세부 사항에 대한 **정본(SSOT)**. 실제 코드 레벨의 스펙과 동작을 정의합니다.
- **`SCREEN_SPEC_ERP_FINANCIAL_RENEWAL.md`**: 리뉴얼 **스코프 및 기획 의도**. 무엇을 왜 바꾸는지에 대한 히스토리와 범위를 다룹니다.

## 5. Core-Coder 체크리스트
프론트엔드 개발자(core-coder)는 UI 구현 시 다음 10가지 항목을 필수로 점검해야 합니다.
1. [ ] **디자인 토큰 사용**: 하드코딩된 색상/사이즈 대신 반드시 CSS 변수(토큰)를 사용했는가?
2. [ ] **AdminCommonLayout 경유**: 모든 관리자/ERP 페이지가 `AdminCommonLayout`을 래퍼로 사용하고 있는가?
3. [ ] **이모지 사용 금지**: UI 텍스트 및 코드 내에 불필요한 이모지가 포함되지 않았는가?
4. [ ] **하드코딩 금지**: 텍스트, 다국어, 주요 설정값이 컴포넌트 내부에 하드코딩되지 않았는가?
5. [ ] **역할 분리 준수**: `ContentHeader`와 `ErpHubTabs`의 역할(전역 액션 vs 뷰 전환)이 혼재되지 않았는가?
6. [ ] **아토믹 디자인 준수**: 컴포넌트가 적절한 계층(Atoms, Molecules, Organisms)으로 분리되었는가?
7. [ ] **반응형 대응**: ContentArea 및 내부 요소들이 다양한 해상도에서 깨짐 없이 렌더링되는가?
8. [ ] **접근성(a11y) 고려**: 버튼, 폼 요소 등에 적절한 aria 속성 및 키보드 네비게이션이 지원되는가?
9. [ ] **공통 모듈 재사용**: 기존에 구현된 공통 컴포넌트(예: UnifiedModal, Badge)를 중복 개발하지 않고 재사용했는가?
10. [ ] **테넌트 격리(Tenant Isolation)**: API 호출 및 데이터 렌더링 시 테넌트 ID가 올바르게 처리되고 있는가?
