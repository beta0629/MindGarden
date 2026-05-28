# 어드민 LNB 정보 아키텍처(IA) 재설계 — 디자인 핸드오프

**일자**: 2026-05-28
**오케스트레이션**: `core-designer` (Phase 2)
**상태**: **완료** — Phase 3 (`core-coder`) 위임 대기
**참조**: `docs/project-management/2026-05-28/ADMIN_LNB_IA_RESTRUCTURE_PLAN.md` (사용자 결재 완료)

---

## §1 아이콘 매핑 (lucide-react 기준)

각 1차 및 2차 메뉴에 사용할 Lucide 아이콘 매핑입니다.

| 메뉴명 | 레벨 | Lucide 아이콘 | 비고 |
|---|---|---|---|
| **대시보드** | 1차 (단독) | `LayoutDashboard` | |
| **통합 스케줄** | 1차 (단독) | `CalendarDays` | `Calendar` 대안 가능 |
| **알림·메시지** | 1차 (단독) | `Bell` | |
| └ 상담일지 조회 | 2차 | `FileText` | |
| **매칭·결제·환불** | 1차 (그룹) | `CreditCard` | |
| ├ 매칭 관리(환불·취소) | 2차 | `Link2` | |
| ├ 결제/구독 관리 | 2차 | `Repeat` | |
| ├ 결제 수단 | 2차 | `Wallet` | |
| └ PG 승인(운영) | 2차 | `ShieldCheck` | |
| **사용자 관리** | 1차 (그룹) | `Users` | |
| ├ 사용자 목록 | 2차 | `User` | |
| ├ 계좌 관리 | 2차 | `BookUser` | |
| └ 탈퇴 대기/휴면 | 2차 | `UserMinus` | `Snowflake` 대안 가능 |
| **콘텐츠·커뮤니티** | 1차 (그룹) | `Layers` | |
| ├ 커뮤니티 검수 큐 | 2차 | `Inbox` | |
| ├ 심리교육·힐링 마스터 | 2차 | `BookOpen` | |
| ├ 마음 날씨 관측 | 2차 | `CloudSun` | |
| ├ 마음 정원 관측 | 2차 | `Flower2` | |
| └ 푸시 설정 모니터링 | 2차 | `Send` | |
| **쇼핑·리워드** | 1차 (그룹) | `ShoppingBag` | |
| ├ 상품(SKU) 관리 | 2차 | `Package` | |
| ├ 리워드 정책 | 2차 | `Gift` | |
| └ 온라인 주문 | 2차 | `Receipt` | |
| **운영·재무 (ERP)** | 1차 (그룹) | `Briefcase` | |
| ├ 운영 현황 | 2차 | `LineChart` | |
| ├ 조달·품목 | 2차 | `ShoppingCart` | |
| ├ 거래·정산 | 2차 | `Calculator` | |
| ├ 예산 관리 | 2차 | `PieChart` | |
| ├ 급여 관리 | 2차 | `Banknote` | |
| └ 승인 센터 | 2차 | `CheckSquare` | |
| **시스템·설정** | 1차 (그룹) | `Settings` | |
| ├ 테넌트 프로필 | 2차 | `Building` | |
| ├ 브랜딩 | 2차 | `Palette` | |
| ├ 시스템 설정 | 2차 | `Sliders` | |
| ├ 공통코드 | 2차 | `Code` | |
| ├ PG 설정 | 2차 | `CreditCard` | |
| ├ AI 프로바이더 | 2차 | `Bot` | |
| ├ 패키지 요금 관리 | 2차 | `Tags` | |
| ├ 알림 채널 (서브그룹) | 2차 | `MessageSquare` | 하위: 카카오/SMS/테스트/수동/템플릿 |
| └ 컴플라이언스 | 2차 | `FileWarning` | |

---

## §2 그룹 시각 위계 (확장/축소 UX)

LNB 메뉴의 시각적 계층 구조 및 인터랙션 스펙입니다.

- **1차 단독 메뉴 및 그룹 헤더**:
  - 좌측 패딩: `var(--mg-spacing-12)`
  - 아이콘 크기: `18px`
  - 텍스트: `var(--font-size-md)`, `font-weight: 500`
  - 그룹 헤더 우측 아이콘: `ChevronRight` (16px) → 확장 시 `ChevronDown`
- **2차 메뉴 (확장 시)**:
  - 좌측 패딩: `var(--mg-spacing-36)` (1차 패딩 + 24px 들여쓰기)
  - 아이콘 크기: `16px`
  - 텍스트: `var(--font-size-md)`, `font-weight: 400`
- **상태별 시각 피드백**:
  - **활성 (Current Page)**: `--mg-color-primary-50` 배경 + `--mg-color-primary-700` 텍스트 + 좌측 4px `--mg-color-primary-500` accent bar
  - **Hover**: `--mg-color-surface-hover` 배경

---

## §3 토큰 매트릭스

SSOT 토큰(`unified-design-tokens.css`) 기반의 상태별 색상 매트릭스입니다. (D11 가드: 신규 hex 추가 금지)

| 상태 | Background | Text | Accent | Border |
|---|---|---|---|---|
| **Default** | `transparent` | `var(--color-text-secondary)` | none | none |
| **Hover** | `var(--mg-color-surface-hover)` | `var(--color-text-primary)` | none | none |
| **Active** | `var(--mg-color-primary-50)` (Light)<br>`var(--mg-color-primary-900)` (Dark) | `var(--mg-color-primary-700)` (Light)<br>`var(--mg-color-primary-100)` (Dark) | 4px `var(--mg-color-primary-500)` 좌측 bar | none |
| **Focus-visible** | (Active와 동일) +<br>`box-shadow: 0 0 0 2px var(--mg-color-primary-300)` | (Active와 동일) | (Active와 동일) | (Active와 동일) |

> **토큰 신설 권고 (Phase 3 Coder 대상)**:
> 현재 SSOT에 `--mg-color-primary-500`, `--mg-color-primary-700`, `--mg-color-primary-900` 등의 일부 세부 스텝 토큰이 명시적으로 정의되어 있지 않을 수 있습니다. 이 경우 **절대 새로운 Hex 값을 하드코딩하지 말고**, 기존 SSOT 내 존재하는 Primary 계열 Hex 값(예: `--mg-color-primary-main`, `--mg-color-primary-dark` 등)을 참조하여 해당 토큰명(`--mg-color-primary-500` 등)을 CSS 변수로 매핑/신설하여 사용하십시오. 다크 모드 Cascade 시에도 기존 다크 모드용 Hex를 조합하여 구성합니다.

---

## §4 너비·반응형

- **데스크탑 (1280px 이상)**: LNB 너비 `240px` 고정
- **태블릿 (768px ~ 1279px)**: LNB Drawer (햄버거 메뉴) 형태로 제공
- **모바일 (767px 이하)**: LNB Drawer 제공 + 1차 8개 메뉴 중 우선순위 상위 3개만 Bottom Navigation 표시 (단, 모바일/Expo 정합은 Q7 별도 트랙으로 진행하므로 본 핸드오프에서는 데스크탑/태블릿 웹 환경을 우선 적용)

---

## §5 i18n 키 매트릭스

메뉴명 다국어 처리를 위한 `admin.json` 기준 i18n Key Path 입니다. Phase 3 코더는 아래 키를 시드 및 번역 파일에 추가/매핑해야 합니다.

- **대시보드**: `admin:lnb.dashboard`
- **통합 스케줄**: `admin:lnb.integratedSchedule` (신설)
- **알림·메시지**: `admin:lnb.notifications`
  - 상담일지 조회: `admin:lnb.notifications.consultationLogs` (신설)
- **매칭·결제·환불**: `admin:lnb.groups.matchingPaymentRefund` (신설)
  - 매칭 관리: `admin:lnb.matchingPaymentRefund.mapping`
  - 결제/구독 관리: `admin:lnb.matchingPaymentRefund.subscriptions`
  - 결제 수단: `admin:lnb.matchingPaymentRefund.paymentMethods`
  - PG 승인(운영): `admin:lnb.matchingPaymentRefund.pgApproval` (신설)
- **사용자 관리**: `admin:lnb.groups.userManagement`
  - 사용자 목록: `admin:lnb.userManagement.list`
  - 계좌 관리: `admin:lnb.userManagement.accounts`
  - 탈퇴 대기/휴면: `admin:lnb.userManagement.withdrawalDormant` (신설)
- **콘텐츠·커뮤니티**: `admin:lnb.groups.contentCommunity` (신설)
  - 하위 메뉴들: `admin:lnb.contentCommunity.*`
- **쇼핑·리워드**: `admin:lnb.groups.shopReward`
- **운영·재무 (ERP)**: `admin:lnb.groups.erp`
- **시스템·설정**: `admin:lnb.groups.systemSettings`

---

## §6 권한 매트릭스

역할(ROLE)별 메뉴 노출 정책입니다. (`MenuServiceImpl` 및 프론트엔드 라우트 가드 기준)

- **HQ_ADMIN**: 전체 메뉴 노출
- **BRANCH_ADMIN**: G6 운영·재무(ERP) 제외 또는 일부 제한 (기획 합의서 권고에 따름)
- **STAFF**: G3 사용자 관리, G2 매칭 관리 일부, G4 콘텐츠 검수 큐 등 운영에 필요한 메뉴 위주 노출 (ERP_ACCESS 권한 여부에 따라 G6 노출 분기)
- **CONSULTANT**: 통합 스케줄(자기 일정), 알림·메시지, 상담일지 조회, 마음정원 등 상담사 관련 메뉴로 제한 노출

---

## §7 접근성 (WCAG 2.1 AA)

- **키보드 네비게이션**: `Tab` 키를 통한 포커스 이동, `Enter` / `Space` 키를 통한 확장/축소 및 링크 이동 지원
- **ARIA 속성**:
  - LNB 컨테이너: `role="navigation"`
  - 현재 활성화된 메뉴: `aria-current="page"`
  - 그룹 헤더 (확장/축소): `aria-expanded="true"` 또는 `"false"`
- **색 대비**: 활성 텍스트와 활성 배경 간의 명도 대비 4.5:1 이상 유지 (다크 모드 동일 기준 적용)

---

## §8 코더 위임 명세 (Phase 3)

Phase 3 `core-coder` 위임 시 수행해야 할 구체적인 변경 리스트입니다.

1. **Flyway 마이그레이션 (`V20260606_008__lnb_ia_restructure.sql` 등 적절한 timestamp)**:
   - `menus` 시드 UPDATE: path 정정 (DUP-2 `/admin/system-notifications` → `/admin/notifications`, DUP-6 PG path 단복수 통일)
   - `menus` 시드 INSERT: DUP-1 `통합 스케줄`, DUP-3 폴백 only 4종 등 신규 메뉴 추가
   - `menus` 시드 UPDATE: 그룹 재배치, 우선순위(`sort_order`), 서브그룹 설정
   - 비활성화 처리: 기존 1차 메뉴였던 `ADM_MAPPING` 등을 2차로 강등
2. **코드 상수 갱신**:
   - `frontend/src/constants/menu.js` (레거시 정리)
   - `frontend/src/components/dashboard-v2/constants/menuItems.js` (`DEFAULT_MENU_ITEMS` 폴백 갱신)
   - `frontend/src/constants/adminRoutes.js` (라우트 매핑 검증)
3. **폴백 (`DEFAULT_MENU_ITEMS`) 갱신**: DB 시드 권한 부재 시에도 동일한 IA가 노출되도록 트리 구조 동기화
4. **i18n 시드 추가**: §5에 명시된 신규 다국어 키를 `admin.json` 등에 추가
5. **LNB 컴포넌트 업데이트**: `DesktopLNB.js` (또는 동등 컴포넌트)에 그룹 확장/축소 UX 및 활성 상태 Accent Bar(`4px --mg-color-primary-500`) 시각 스펙 적용
6. **권한 분기**: `useSession().role` 기반의 노출 필터 로직 검증 및 적용 (통합 스케줄 페이지 헤더 액션에 매칭 관리 진입점 추가 포함)

---
*본 문서는 디자인 핸드오프 목적의 문서이며, 실제 코드 변경은 Phase 3 코더가 수행합니다.*