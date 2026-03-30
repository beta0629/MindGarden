# 공통 레이아웃 시스템

> AdminCommonLayout 및 권한별 GNB/LNB 통합 문서  
> @author MindGarden | @since 2025-02-22

## 개요

마인드가든 프로젝트의 상세 페이지들은 **GNB(상단 글로벌 네비게이션) + LNB(좌측 로컬 네비게이션)** 를 통합한 공통 레이아웃(`AdminCommonLayout`)을 사용합니다.

- **목적**: SimpleLayout 제거, 전체 상세 페이지 UI/UX 일관성 확보
- **기준**: 매칭 관리 페이지 레이아웃을 기준으로 공통화

## 폴더 구조

```
docs/layout/
├── README.md                 # 본 문서 (개요 및 인덱스)
├── ADMIN_COMMON_LAYOUT.md    # AdminCommonLayout 컴포넌트 상세
├── MENU_ITEMS.md             # 권한별 메뉴 상수 가이드
└── MIGRATION_GUIDE.md        # SimpleLayout → AdminCommonLayout 마이그레이션
```

## 관련 파일 경로

| 구분 | 경로 |
|------|------|
| 공통 레이아웃 | `frontend/src/components/layout/AdminCommonLayout.js` |
| 메뉴 상수 | `frontend/src/components/dashboard-v2/constants/menuItems.js` |
| DesktopLayout | `frontend/src/components/dashboard-v2/templates/DesktopLayout.js` |
| MobileLayout | `frontend/src/components/dashboard-v2/templates/MobileLayout.js` |

## 문서 목록

1. **[ADMIN_COMMON_LAYOUT.md](./ADMIN_COMMON_LAYOUT.md)** – AdminCommonLayout Props, 사용법, 내부 동작
2. **[MENU_ITEMS.md](./MENU_ITEMS.md)** – DEFAULT_MENU_ITEMS, CLIENT_MENU_ITEMS 등 권한별 메뉴 정의
3. **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** – SimpleLayout 제거 및 AdminCommonLayout 적용 방법

## 적용 현황

| 권한 | 메뉴 상수 | 적용 페이지 예시 |
|------|-----------|------------------|
| Admin | DEFAULT_MENU_ITEMS | 매칭 관리, 스케줄 관리, 회기 관리, 설정 등 |
| Client | CLIENT_MENU_ITEMS | 대시보드, 스케줄, 회기 관리, 결제 내역, 설정 |
| Consultant | CONSULTANT_MENU_ITEMS | 대시보드, 스케줄, 상담 기록, 가능 시간, 메시지 |
| ERP | ERP_MENU_ITEMS | 구매, 재무, 예산, 세무 관리 |
| HQ | HQ_MENU_ITEMS | 지점 관리, 지점별 재무, 통합 재무, 보고서 |

## 유지 페이지 (SimpleLayout 사용)

- 인증: `ResetPassword`, `HeadquartersLogin`, `BranchSpecificLogin` 등
- 랜딩/결제: `Homepage`, `BillingCallback`
- 테스트: `test/*`

## 서브에이전트 활용

레이아웃·AdminCommonLayout·메뉴 상수·스케줄 헤더 등 **공통 레이아웃 관련 수정** 시:

| 작업 | 서브에이전트 | 스킬 |
|------|--------------|------|
| AdminCommonLayout, menuItems 수정 | core-coder | /core-solution-frontend, /core-solution-atomic-design |
| 헤더·LNB·GNB 비주얼 설계 | core-designer | (시안 정의) |
| 레이아웃 적용 페이지 교체 | core-coder | /core-solution-frontend |
