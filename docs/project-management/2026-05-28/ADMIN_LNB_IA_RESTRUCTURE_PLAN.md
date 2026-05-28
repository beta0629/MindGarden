# 어드민 LNB 정보 아키텍처(IA) 재설계 — 기획 합의서

**일자**: 2026-05-28
**오케스트레이션**: `core-planner` (위임 — 본 문서가 곧 분배실행 표)
**상태**: **DRAFT** — 사용자 컴펜(Q1~Q10) 결재 대기 → 결재 후 Phase 2 (`core-designer`) / Phase 3 (`core-coder`) 위임
**브랜치**: `docs/admin-lnb-ia-restructure`
**산출물 위치**: `docs/project-management/2026-05-28/ADMIN_LNB_IA_RESTRUCTURE_PLAN.md`

---

## 0. 배경 및 목적

### 0.1 사용자 보고 (P1 UX)
> 메뉴들이 많이 늘어났는데 모두 정리가 필요. 메뉴 트리 재배치, 그룹화, 서브메뉴에서도 현재 메뉴가 노출 적합 되도록 진행.
>
> **"매칭 관리" 메뉴는 1차 노출에 부적합** — 사용자가 자주 가는 곳은 **"통합 스케줄링"**, "매칭 관리" 는 환불·취소 등 특수 케이스 시에만 진입. 1차 LNB 자리는 "통합 스케줄링" 이 차지하고 매칭 관리는 보조/하위로 이동.

### 0.2 본 합의서의 범위 / 비범위
| 범위 | 비범위 |
|------|--------|
| 어드민 LNB(ADMIN_ONLY) 1차/2차 정보 아키텍처 재정의 | CLIENT / CONSULTANT / HQ LNB (별도 트랙) |
| `menus` 테이블 시드 (Flyway) + `DEFAULT_MENU_ITEMS` 폴백 일치 | 모바일(Expo) 앱 LNB 동기화 (Q7 결재 후 별도 트랙 권장) |
| 어드민 라우트(`adminRoutes.js`) 매핑 정합 | 권한 매트릭스 자체 재설계 (현 `required_role` 체계 유지) |
| i18n 메뉴 라벨 키 갱신 | 페이지 본문 레이아웃 변경 (이미 §ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF Phase 1~6 완료) |

### 0.3 핵심 SSOT 룰 (위배 금지)
- **`menus` 테이블이 SSOT**. `MenuServiceImpl.getLnbMenus()` 가 ADMIN/STAFF 에게 `menu_location='ADMIN_ONLY'` + `required_role IN ('ADMIN','STAFF','CONSULTANT','CLIENT')` 로 노출.
- 프론트 `DEFAULT_MENU_ITEMS` 는 **API 실패 시 폴백 전용** — 평상시 DB 메뉴 사용.
- 변경은 Flyway 마이그(`V202606xx_xxx__lnb_*.sql`) + 멱등 INSERT/UPDATE 로만 처리.

---

## §1 현재 LNB 인벤토리 (전수)

> 본 절은 `core-planner` 가 explore 위임 대신 `Grep` / `Read` 로 직접 1차 수집한 결과입니다. Phase 1 (explore) 위임 시 동일 범위 재검증 후 확장 보고 받기를 권합니다.

### 1.1 DB 시드 SSOT — 어드민 LNB 1차 (depth=0)

| menu_code | 표시명 | path | role | sort | 활성 | 마이그 |
|-----------|--------|------|------|------|------|--------|
| `ADM_DASHBOARD` | 대시보드 | `/admin/dashboard-v2` | STAFF | 10 | ✅ | V20260225_001 |
| `ADM_MAPPING` | 매칭 관리 | `/admin/mapping-management` | STAFF | 20 | ✅ | V20260225_001 |
| `ADM_USERS` | 사용자/권한 | `#` (그룹) | STAFF | 30 | ✅ | V20260225_001 |
| `ADM_SHOP` | 쇼핑·리워드 | `/admin/shop/catalog-skus` | STAFF | 35 | ✅ | V20260521_001 |
| `ADM_BILLING` | 결제/구독 | `/admin/billing/subscriptions` | ADMIN | 38 | ✅ | V20260606_001 |
| `ADM_ERP` | 운영·재무 | `/erp/dashboard` | ADMIN | 40 | ✅ | V20260225_001 + V20260409_001 |
| `ADM_SETTINGS` | 설정 | `#` (그룹) | STAFF | 50 | ✅ | V20260225_001 |
| `ADM_REPORTS` | 보고서 | `#` (그룹) | STAFF | 60 | ❌ **비활성** | V20260322_001 |
| `ADM_NOTIFICATIONS` | 알림 | `/admin/system-notifications` ⚠ | STAFF | 70 | ✅ | V20260225_001 |

**1차 활성 = 8개** (그 중 그룹 헤더 3개: `ADM_USERS`, `ADM_SETTINGS`, `ADM_ERP`, `ADM_SHOP`, `ADM_BILLING` — 실제 자식 가진 그룹 5개).

### 1.2 DB 시드 SSOT — 어드민 LNB 2차 (depth=1)

**`ADM_USERS` 하위**
| menu_code | 표시명 | path | sort | 활성 | 마이그 |
|-----------|--------|------|------|------|--------|
| `ADM_USERS_LIST` | 사용자 관리 | `/admin/user-management` | 1 | ✅ | V20260225_001 |
| `ADM_PERMISSIONS` | 권한 관리 | `/admin/permissions` | 2 | ❌ **비활성** | V20260323_001 (리다이렉트 → `/admin/user-management`) |
| `ADM_ACCOUNTS` | 계좌 관리 | `/admin/accounts` | 3 | ✅ | V20260225_001 |

**`ADM_SHOP` 하위**
| menu_code | 표시명 | path | sort | 활성 | 마이그 |
|-----------|--------|------|------|------|--------|
| `ADM_SHOP_CATALOG` | 상품(SKU) 관리 | `/admin/shop/catalog-skus` | 1 | ✅ | V20260521_001 |
| `ADM_SHOP_POINT_POLICIES` | 리워드 정책 | `/admin/shop/point-policies` | 2 | ✅ | V20260521_001 |
| `ADM_SHOP_ORDERS` | 온라인 주문 | `/admin/shop/orders` | 3 | ✅ | V20260521_001 |

**`ADM_BILLING` 하위**
| menu_code | 표시명 | path | sort | 활성 | 마이그 |
|-----------|--------|------|------|------|--------|
| `ADM_BILLING_SUBSCRIPTIONS` | 구독 관리 | `/admin/billing/subscriptions` | 1 | ✅ | V20260606_001 |
| `ADM_BILLING_PAYMENT_METHODS` | 결제 수단 | `/admin/billing/payment-methods` | 2 | ✅ | V20260606_001 |

**`ADM_ERP` 하위** (V20260409_001 라벨/sort 정규화)
| menu_code | 표시명 | path | sort | 활성 |
|-----------|--------|------|------|------|
| `ERP_DASHBOARD` | 운영 현황 | `/erp/dashboard` | 1 | ✅ |
| `ERP_PURCHASE` | 조달·품목 | `/erp/purchase` | 2 | ✅ |
| `ERP_FINANCIAL` | 거래·정산 | `/erp/financial` | 3 | ✅ |
| `ERP_BUDGET` | 예산 관리 | `/erp/budget` | 4 | ✅ |
| `ERP_SALARY` | 급여 관리 | `/erp/salary` | 5 | ✅ |
| `ERP_APPROVALS` | 승인 센터 | `/erp/approvals` | 6 | ✅ |
| `ERP_TAX` | 세무 관리 | `/erp/tax` | 99 | ❌ 소프트 숨김 |

**`ADM_SETTINGS` 하위** (V20260415·V20260422·V20260424·V20260425·V20260526·V20260530 누적)
| menu_code | 표시명 | path | sort | 활성 | 비고 |
|-----------|--------|------|------|------|------|
| `ADM_SETTINGS_TENANT` | 테넌트 프로필 | `/tenant/profile` | 1 | ✅ | |
| `ADM_SETTINGS_BRANDING` | 브랜딩 | `/admin/branding` | 2 | ✅ | |
| `ADM_SETTINGS_SYSTEM` | 시스템 설정 | `/admin/system-config` | 3 | ✅ | |
| `ADM_SETTINGS_CODES` | 공통코드 | `/admin/common-codes` | 4 | ✅ | |
| `ADM_SETTINGS_TENANT_CODES` | 테넌트 공통코드 | `/admin/tenant-common-codes` | 5 | ✅ | |
| `ADM_SETTINGS_PG` | PG 설정 | `/tenant/pg-configuration` | 6 | ✅ | path 단수형 (`-s` 불일치 — §1.4 참조) |
| `ADM_SETTINGS_KAKAO_ALIMTALK` | 카카오 알림톡 | `/admin/kakao-alimtalk-settings` | 7 | ✅ | |
| `ADM_SETTINGS_TENANT_SMS` | 문자 메시지(SMS) | `/admin/tenant-sms-settings` | 8 | ✅ | |
| `ADM_SETTINGS_TEST_NOTIFICATION` | 알림 테스트 발송 | `/admin/test-notification` | 9 | ✅ | |
| `ADM_SETTINGS_MANUAL_NOTIFICATION` | 수동 알림 발송 | `/admin/manual-notification` | 10 | ✅ | |
| `ADM_SETTINGS_SMS_TEMPLATE` | SMS 템플릿 관리 | `/admin/sms-templates` | 11 | ✅ | V20260530_001 |
| `ADM_SETTINGS_AI_PROVIDER` | AI 프로바이더 관리 | `/admin/system/ai-providers` | 13 | ✅ | V20260530_002 |
| `ADM_REPORTS_COMP` | 컴플라이언스 | `/admin/compliance` | 11→12→5 (마지막 V20260322_001) | ✅ | **ADM_SETTINGS 로 이동** (원래 ADM_REPORTS 하위) |

**현 `ADM_SETTINGS` 하위 활성 = 13개** (≈ 너무 많음 — 그룹 내 재분리 필요, §2.7 참조)

### 1.3 코드 측 정의 (프론트엔드)

#### 1.3.1 `frontend/src/constants/adminRoutes.js`
- 라우트 상수 SSOT. 31개 경로 + deprecated 항목 (CONSULTANT_COMPREHENSIVE, CLIENT_COMPREHENSIVE, SYSTEM_NOTIFICATIONS, MESSAGES).

#### 1.3.2 `frontend/src/components/dashboard-v2/constants/menuItems.js`
- **`DEFAULT_MENU_ITEMS`** : LNB API 실패 시 폴백. **현재 9개 1차 + 다수 2차** 정의.
- **DB SSOT 와 불일치 (폴백 only 항목)** — 운영 환경에서 API 가 살아있을 땐 노출 안 됨 ⚠:

| 폴백 1차 라벨 | path | DB 시드 존재 여부 |
|---------------|------|-------------------|
| 통합 스케줄 센터 | `/admin/integrated-schedule` | ❌ **DB 미존재** (핵심!) |
| 상담일지 조회 | `/admin/consultation-logs` | ❌ **DB 미존재** |
| 콘텐츠·커뮤니티 (그룹, 5 children) | `/admin/community-moderation` 외 | ❌ **DB 미존재** |
| 알림·메시지 관리 | `/admin/notifications` | DB 는 `/admin/system-notifications` (구) |

| 폴백 설정 그룹 내 항목 (DB 미존재) |
|------------------------------------|
| 패키지 요금 관리 (`/admin/package-pricing`) |
| PG 승인(운영) (`/admin/ops/pg-approval`) |
| 컴플라이언스 (`/admin/compliance`) — DB 는 ADM_REPORTS_COMP 로 존재함 (중복 표기) |

#### 1.3.3 `frontend/src/constants/menu.js`
- **레거시 상수** (`ADMIN_MENU_ITEMS.MAIN/SUB`) — Bootstrap icon 기반, 현행 B0KlA LNB 와 무관. 후속 정리(=삭제 or deprecate 주석) 권장.

### 1.4 중복·정합 이슈 (Phase 3 코더에게 일괄 처리 요청)

| # | 이슈 | 영향 |
|---|------|------|
| **DUP-1** | **통합 스케줄 vs 매칭 관리** — 사용자 의도: 1차 = 통합 스케줄, 매칭은 보조 | 본 IA 재설계의 핵심 (§3) |
| **DUP-2** | **알림 path 불일치** — DB `/admin/system-notifications` vs Fallback `/admin/notifications` (deprecated → 신 경로로 통일 필요) | `adminRoutes.js` `SYSTEM_NOTIFICATIONS` 가 deprecated 표시. DB 시드 갱신 필요 |
| **DUP-3** | **DB 미존재 1차 5종** (통합 스케줄·상담일지·콘텐츠·커뮤니티·푸시 모니터링·알림) — API 가 살아있을 땐 노출 안 됨 ⚠ | **운영 영향 大** — Phase 3 마이그에서 일괄 추가 |
| **DUP-4** | **사용자/권한 그룹** — `ADM_PERMISSIONS` 비활성, `ADM_USERS_LIST` + `ADM_ACCOUNTS` 만 활성 (Q8: 탈퇴 대기·휴면 화면 신설 필요한지) | 라이프사이클 페이지 신설 결정 (Q8) |
| **DUP-5** | **설정 그룹 13개 → 너무 많음** (§2.7) — 알림 4종 (카카오·SMS·테스트·수동), 시스템 5종, 컴플라이언스 1종 — 서브그룹 또는 별도 그룹 분리 검토 | §2.7 권고 |
| **DUP-6** | **PG path 단수형 불일치** — DB `/tenant/pg-configuration` (단수) vs FE Fallback `/tenant/pg-configurations` (복수). `ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §4 가 이 버그 명시 | Phase 3 마이그에서 path 통일 |
| **DUP-7** | **레거시 `menu.js`** (`ADMIN_MENU_ITEMS.MAIN/SUB`) — Bootstrap Icon 기반, 현행 미사용 의심 | 의존성 정리 후 삭제/deprecated 주석 |

---

## §2 그룹화 제안 (5 그룹 권장 + Q1 컴펜)

### 2.1 그룹화 원칙
1. **운영 빈도** (매일 / 주 / 월 / 케이스 발생 시) 기준.
2. **5단계 비즈니스 파이프라인** (`/core-solution-business-flow`): 매칭 → 입금 → 권한 → 스케줄 → 회계 — **2단계(입금)·3단계(권한)·5단계(회계)** 가 같은 그룹 ("운영·재무") 인지, 분리("결제/구독" + "운영·재무") 인지 합의 필요.
3. **1차 노출 메뉴 수 ≤ 8개** (260px LNB · 모바일 드로어 가독성. Q10 컴펜).
4. **그룹 헤더는 클릭 시 첫 자식으로 이동** (현 `DesktopLnb` 동작) 또는 펼침 토글.

### 2.2 권장 그룹 (5 그룹) — planner 1차안

> **굵게** = 1차 LNB 노출 (그룹 헤더 또는 단독 메뉴). 들여쓰기 = 펼쳤을 때 노출.

#### **G1. 운영(매일)** — 매일 쓰는 메뉴
- **대시보드** (`/admin/dashboard-v2`, `ADM_DASHBOARD`)
- **통합 스케줄** (`/admin/integrated-schedule`) ← **신설** (현재 DB 미존재, 1차 신설)
- **알림·메시지** (`/admin/notifications`) — DB path 갱신 (DUP-2)
  - 상담일지 조회 (`/admin/consultation-logs`) ← **신설** (DB 미존재 → 추가)

#### **G2. 매칭·결제·환불** — 케이스 발생 시 (5단계 파이프라인 1·2·5)
- **매칭/회기 관리** (그룹 헤더) ← **재배치** (현 1차 `ADM_MAPPING` → 그룹 내부로)
  - 매칭 관리(환불·취소) (`/admin/mapping-management`, `ADM_MAPPING`)
  - 결제/구독 관리 (`/admin/billing/subscriptions`, `ADM_BILLING_SUBSCRIPTIONS`)
  - 결제 수단 (`/admin/billing/payment-methods`, `ADM_BILLING_PAYMENT_METHODS`)
  - PG 승인(운영) (`/admin/ops/pg-approval`) ← **신설** (DB 미존재 → 추가)

> §3 컴펜 Q2 에 따라 매칭 관리를 **통합 스케줄 페이지 내부 보조 액션**으로도 동시 노출(C 안) 가능.

#### **G3. 사용자 관리** — 케이스 발생 시 (사용자 라이프사이클)
- **사용자 관리** (그룹 헤더)
  - 사용자 목록 (`/admin/user-management`, `ADM_USERS_LIST`)
  - 계좌 관리 (`/admin/accounts`, `ADM_ACCOUNTS`)
  - (선택, Q8) 탈퇴 대기 / 휴면 — 신설 필요 시 별도 페이지

#### **G4. 콘텐츠/커뮤니티** — 일/주 (모더레이션)
- **콘텐츠·커뮤니티** (그룹 헤더) ← **DB 신설**
  - 커뮤니티 검수 큐 (`/admin/community-moderation`)
  - 심리교육·힐링 마스터 (`/admin/content-master`)
  - 마음 날씨 관측 (`/admin/wellness/mind-weather-observability`)
  - 마음 정원 관측 (`/admin/wellness/mind-garden-observability`)
  - 푸시 설정 모니터링 (`/admin/push-monitoring`)

#### **G5. 쇼핑·리워드** — 별도 그룹 유지 (옵션 — Q1 에 따라 G2 흡수 가능)
- **쇼핑·리워드** (그룹 헤더)
  - 상품(SKU) 관리 (`/admin/shop/catalog-skus`, `ADM_SHOP_CATALOG`)
  - 리워드 정책 (`/admin/shop/point-policies`, `ADM_SHOP_POINT_POLICIES`)
  - 온라인 주문 (`/admin/shop/orders`, `ADM_SHOP_ORDERS`)

#### **G6. 운영·재무 (ERP)** — 주/월 (5단계 파이프라인 5단계)
- **운영·재무** (그룹 헤더)
  - 운영 현황 (`/erp/dashboard`, `ERP_DASHBOARD`)
  - 조달·품목 (`/erp/purchase`, `ERP_PURCHASE`)
  - 거래·정산 (`/erp/financial`, `ERP_FINANCIAL`)
  - 예산 관리 (`/erp/budget`, `ERP_BUDGET`)
  - 급여 관리 (`/erp/salary`, `ERP_SALARY`)
  - 승인 센터 (`/erp/approvals`, `ERP_APPROVALS`)

#### **G7. 시스템 / 설정** — 월/세팅 시 (분할 권장 — Q6)
- **시스템·설정** (그룹 헤더)
  - 테넌트 프로필 / 브랜딩 / 시스템 설정 / 공통코드(글로벌·테넌트) / PG / AI 프로바이더
  - 알림 채널 (서브그룹 — Q4): 카카오 알림톡 / SMS / 알림 테스트 / 수동 알림 / SMS 템플릿
  - 패키지 요금 관리
  - 컴플라이언스 (선택 — Q5 결과에 따라 G6 ERP 인접 또는 G7 유지)

**1차 노출 합계 = 7개 그룹 헤더 + 단독 메뉴 2개 (대시보드·통합 스케줄·알림·메시지) — 단독 3개 + 그룹 5개 = 총 8개** (Q10 가드라인 ≤8 통과)

### 2.3 IA 매트릭스 한눈에 (시각화 요약)

```
LNB (260px)
├─ 대시보드               [단독]
├─ 통합 스케줄            [단독]  ← 신설 1차
├─ 알림·메시지            [단독]  ← DB path 갱신
│   └ 상담일지 조회        [G1 하위]
├─ 매칭·결제·환불         [그룹]  ← 매칭은 여기로 이동 (현 1차에서 강등)
│   ├ 매칭 관리(환불·취소)
│   ├ 결제/구독 관리
│   ├ 결제 수단
│   └ PG 승인(운영)
├─ 사용자 관리            [그룹]
│   ├ 사용자 목록
│   ├ 계좌 관리
│   └ 탈퇴 대기/휴면      (Q8 결재 시)
├─ 콘텐츠·커뮤니티        [그룹]  ← DB 신설
│   ├ 커뮤니티 검수 큐
│   ├ 심리교육·힐링 마스터
│   ├ 마음 날씨 관측
│   ├ 마음 정원 관측
│   └ 푸시 설정 모니터링
├─ 쇼핑·리워드            [그룹]
│   ├ 상품 SKU 관리
│   ├ 리워드 정책
│   └ 온라인 주문
├─ 운영·재무 (ERP)         [그룹]
│   ├ 운영 현황 / 조달·품목 / 거래·정산 / 예산 / 급여 / 승인 센터
└─ 시스템·설정            [그룹]
    ├ 테넌트 프로필 / 브랜딩 / 시스템 설정 / 공통코드(글로벌·테넌트)
    ├ PG 설정 / AI 프로바이더 / 패키지 요금
    ├ 알림 채널 (서브그룹: 카카오/SMS/테스트/수동/템플릿) — Q4
    └ 컴플라이언스
```

### 2.4 우선순위 (자주 쓰는 순) — Q3 컴펜
| 순위 | 메뉴 | 빈도 가설 |
|------|------|-----------|
| 1 | 대시보드 | 매일 첫 진입 |
| 2 | 통합 스케줄 | 매일 다회 |
| 3 | 알림·메시지 | 매일 |
| 4 | 사용자 관리 | 주 단위 |
| 5 | 매칭·결제·환불 | 케이스 발생 시 (환불/취소) |
| 6 | 콘텐츠·커뮤니티 | 일~주 (모더레이션 빈도) |
| 7 | 쇼핑·리워드 | 주/월 (테넌트별 차이) |
| 8 | 운영·재무 ERP | 주/월 |
| 9 | 시스템·설정 | 월 단위 / 세팅 변경 시 |

→ Q3 결재로 정렬 확정.

---

## §3 매칭 관리 처리 (사용자 명시 요청)

### 3.1 현황
- **현 LNB 1차**: `ADM_MAPPING` (`/admin/mapping-management`, sort 20)
- **현 LNB 1차 미존재**: `/admin/integrated-schedule` (폴백 only)
- **사용자 의도**: 1차 = 통합 스케줄, 매칭 관리는 보조 (환불·취소 케이스)

### 3.2 변경 권고
- **1차 LNB 자리 = "통합 스케줄"** (`/admin/integrated-schedule`) 신설 (DB 시드 + sort 15 ~ 20)
- **`ADM_MAPPING` = G2 "매칭·결제·환불" 그룹 하위로 강등** (`parent_menu_id = ADM_MATCHING_REFUND.id`, depth=1, label "매칭 관리(환불·취소)")

### 3.3 진입 경로 옵션 (Q2)

| 옵션 | 설명 | 장점 | 단점 |
|------|------|------|------|
| **A** | LNB G2 "매칭·결제·환불" 그룹 하위 (`매칭 관리(환불·취소)`) | 단일 SSOT, 그룹 의미 명확 | 통합 스케줄 페이지에서 한 번 더 LNB 클릭 필요 |
| **B** | 통합 스케줄 페이지 내부의 보조 액션 버튼 (예: 헤더 액션 영역) | 컨텍스트 유지, 클릭 1회 | LNB 에서 직접 찾기 어려움 |
| **C** | A + B 동시 (LNB 하위 + 통합 스케줄 내부 진입) | 양쪽 모두 발견성 ↑ | UI 중복, 디자이너 추가 합의 필요 |

**planner 권고**: **C 안** (LNB G2 + 통합 스케줄 페이지 헤더 액션). 매칭 관리는 "잘 안 쓰지만 발견성은 중요한" 케이스이므로 양쪽 노출이 안전.
→ 디자이너(`core-designer`) 가 통합 스케줄 페이지 헤더 액션 UX 시안 작성 (§6 Phase 2).

---

## §4 변경 매트릭스 (영향 범위)

| 변경 | 대상 (파일·테이블) | 영향 | 담당 Phase |
|------|---------------------|------|------------|
| LNB DB 시드 마이그 신설 | `src/main/resources/db/migration/V202606xx_xxx__lnb_ia_restructure.sql` (정확 timestamp 는 코더가 결정 — V20260606_001 이후 안전) | `menus` 테이블 row 추가·UPDATE (멱등 `INSERT … WHERE NOT EXISTS` + `UPDATE WHERE menu_code=`) | **P3 core-coder** |
| 신규 1차/하위 메뉴 DB 시드 추가 | `ADM_INTEGRATED_SCHEDULE`, `ADM_CONSULTATION_LOGS`(서브), `ADM_MATCHING_REFUND` (그룹), `ADM_CONTENT` (그룹·5 children), `ADM_PG_OPS_APPROVAL`(서브), `ADM_PACKAGE_PRICING`(서브) | menus 테이블 row 신설 ≈ 13건 | **P3 core-coder** |
| 기존 메뉴 parent / sort 조정 | `ADM_MAPPING` → parent = `ADM_MATCHING_REFUND` / depth=1. `ADM_NOTIFICATIONS` path → `/admin/notifications` (DUP-2). `ADM_SETTINGS_PG` path 복수형 통일 (DUP-6) | UPDATE 약 10건 | **P3 core-coder** |
| 코드 폴백 갱신 | `frontend/src/components/dashboard-v2/constants/menuItems.js` `DEFAULT_MENU_ITEMS` | DB 시드와 1:1 정합 — IA 동일 트리 | **P3 core-coder** |
| 라우트 상수 검증 | `frontend/src/constants/adminRoutes.js` | `INTEGRATED_SCHEDULE`, `CONSULTATION_LOGS` 등 이미 존재 → 추가 없음 (검증만) | P3 core-coder |
| 레거시 상수 정리 | `frontend/src/constants/menu.js` `ADMIN_MENU_ITEMS` | deprecated 주석 또는 삭제 (의존성 grep 후) | **P3 core-coder** (별도 커밋 권장) |
| i18n 메뉴 라벨 키 | `frontend/src/locales/*/admin.json` `common.json` — 메뉴 라벨 키 갱신 ("매칭 관리" → "통합 스케줄" 등) | 한국어·영어 i18n 키 동기화 | **P3 core-coder** + Q9 컴펜 후 적용 |
| LNB 컴포넌트 | `frontend/src/components/dashboard-v2/organisms/DesktopLnb.js` (필요 시 그룹 헤더 펼침 default 정책 변경) | 현 코드 동작 유지 가능 — 변경 최소화 | **P3 core-coder** (선택) |
| 디자이너 핸드오프 | `docs/design-system/LNB_IA_HANDOFF_2026Q2.md` (별도 문서) — 아이콘 매핑·그룹 hover/active 색상·통합 스케줄 페이지 헤더 액션 시안 | 디자인 토큰·시각 위계 | **P2 core-designer** (gemini-3.1-pro) |
| 모바일(Expo) 동기화 | `expo-app/app/...` LNB 드로어 (Q7) | 별도 트랙 권장 — 본 PR 범위에서 분리 | (보류) |

---

## §5 사용자 컴펜 (Q1~Q10) — 결재 대기

> 본 합의서가 사용자 결재 후 Phase 2/3 위임을 위해 필요한 결정 사항. 메인 어시스턴트가 사용자와 단독으로 결재 진행.

### Q1. 그룹 개수
- 옵션: ① **3 그룹** (운영 / 매칭·결제 / 시스템) — 미니멀, 깊이 ↑
- 옵션: ② **4 그룹** (운영 / 매칭·결제 / 사용자·콘텐츠 / 시스템)
- 옵션: ③ **5 그룹** (운영 / 매칭·결제 / 사용자 / 콘텐츠 / 시스템) — 콘텐츠 분리
- **planner 권고: §2.2 의 5 그룹** + 단독 3 + 운영·재무·쇼핑 별도 = **G1·G2·G3·G4·G5·G6·G7** (= 7개 1차) ← Q10 가드라인 ≤8 통과

### Q2. 매칭 관리 진입 경로
- **A**: LNB G2 그룹 하위만
- **B**: 통합 스케줄 페이지 내부 보조 액션만
- **C** (planner 권고): A + B 동시

### Q3. 매일 자주 쓰는 메뉴 순위
- §2.4 의 가설 순위가 실제 사용자 의도와 일치하는지 확인. 다를 시 sort_order 조정.

### Q4. "메시지" / "알림" 그룹 분리 또는 통합
- 옵션 A: **단일 메뉴** `/admin/notifications` (현 통합 알림·메시지 관리 — planner 권고)
- 옵션 B: 시스템·설정 그룹 내 **알림 채널 서브그룹**으로 분리 (카카오·SMS·테스트·수동·템플릿) — §2.2 G7 의 계획
- 옵션 C: 알림·메시지를 G7 외부 별도 그룹 분리

### Q5. ERP/회계 그룹 노출 여부 (역할별)
- 현 DB: `ADM_ERP` 는 ADMIN 만 (`required_role='ADMIN'`).
- STAFF 는 `ERP_ACCESS` 권한 있을 때만 노출 (`MenuServiceImpl` 필터).
- Q5: STAFF 에게도 기본 ERP 그룹 노출할지 (현 정책 유지 추천).

### Q6. 시스템·환경 변수 하위 표시 깊이
- 현 `ADM_SETTINGS` 하위 13개 → 너무 많음 (§1.4 DUP-5).
- 옵션 A: 그대로 평면 (Q6=A)
- 옵션 B: 알림 채널 서브그룹화 (Q4=B 와 연동)
- 옵션 C: 시스템·설정 그룹을 G7-a (테넌트 운영 설정) + G7-b (시스템 운영 설정) 두 그룹으로 분리

### Q7. 모바일(Expo) LNB drawer 정합
- 옵션 A: 본 IA 와 동일 트리를 Expo 앱 드로어에도 즉시 적용
- 옵션 B: 본 PR 은 웹만, Expo 는 별도 트랙 (planner 권고 — 본 PR 범위 회피)
- Expo 앱 자체가 어드민 LNB 를 보여주지 않을 가능성도 검토 (CLIENT/CONSULTANT 위주)

### Q8. "탈퇴 대기" / "휴면" 위치
- 옵션 A: G3 사용자 관리 하위 (탈퇴 대기·휴면 페이지 신설)
- 옵션 B: 별도 G8 "라이프사이클" 그룹
- 옵션 C: 현재 페이지 없음 (Phase 5 이후 별도 작업)

### Q9. 결제/구독/알림톡 메뉴 정합 (V20260606_001)
- 옵션 A: 현 `ADM_BILLING` 1차 유지 → G2 (매칭·결제·환불) 그룹 하위로 이동 (planner 권고)
- 옵션 B: `ADM_BILLING` 1차 별도 유지 (관리자가 "결제" 자체로 진입하길 원할 시)

### Q10. 1차 메뉴 최대 항목 수 (디자인 가드라인)
- 옵션 A: **≤ 8개** (planner 권고, 260px LNB · 모바일 가독성)
- 옵션 B: ≤ 7개 (더 엄격)
- 옵션 C: ≤ 10개 (느슨)

---

## §6 위임 순서 (Phase 1 ~ Phase 5)

### Phase 1 (P1) — 인벤토리 전수 검증 (선택 — 본 §1 으로 대체 가능)
- **subagent**: `explore` (readonly)
- **입력**: 본 §1 결과 + `MenuServiceImpl.getLnbMenus()` 로직
- **태스크**: `menus` 테이블의 모든 `menu_location='ADMIN_ONLY'` row 를 SELECT 후 트리 빌드, 본 §1 인벤토리와 diff. 누락·오타·is_active=0 항목 보강 보고.
- **출력**: `docs/project-management/2026-05-28/ADMIN_LNB_IA_INVENTORY_VERIFY.md` (선택)
- **게이트**: 본 §1 와 90% 이상 일치 시 Phase 2 진행

### Phase 2 (P2) — 디자인 핸드오프 (`gemini-3.1-pro` 권장)
- **subagent**: `core-designer`
- **`model`**: `gemini-3.1-pro` (`.cursor/rules/mindgarden-subagents.mdc` §1.1)
- **입력**: 본 §2 (그룹화), §3 (매칭 처리), 사용자 결재 Q1~Q10 답
- **태스크**:
  1. 7개 1차 그룹 아이콘 매핑 (Lucide 또는 `Icon/Icon.js` 기존 키 재사용)
  2. 그룹 hover / active / focus 색상 (B0KlA `--ad-b0kla-*` 토큰 재사용)
  3. 그룹 헤더 펼침/접힘 인터랙션 (현 `DesktopLnb.css` 패턴 + ChevronDown 위치)
  4. 매칭 관리 옵션 C 인 경우, 통합 스케줄 페이지 헤더 액션 시안 (MGButton outline · `mg-v2-ad-b0kla__container` 정합)
  5. 모바일 드로어 동등 적용 (`MobileLnbDrawer`)
- **참조**: `docs/design-system/UNIFIED_LAYOUT_SPEC.md`, `docs/design-system/LNB_MENU_STRUCTURE_AND_PERMISSION_SPEC.md`, B0KlA 샘플 (`https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample`)
- **출력**: `docs/design-system/LNB_IA_HANDOFF_2026Q2.md` (시각 스펙·아이콘 표)
- **게이트**: planner 검수 후 P3 코더에게 전달

### Phase 3 (P3) — 구현 (`core-coder`)
- **subagent**: `core-coder`
- **입력**: §1 인벤토리, §2 그룹화 결재안, §3 매칭 처리 결정 (Q2), §4 변경 매트릭스, P2 디자인 핸드오프
- **태스크**:
  1. **Flyway 마이그**: `V202606xx_xxx__lnb_ia_restructure.sql` 신설 (정확 timestamp: V20260606_001 이후 안전 채번)
     - `INSERT … WHERE NOT EXISTS` 멱등 보장
     - `UPDATE menus SET parent_menu_id = …, sort_order = …, menu_path = … WHERE menu_code = …`
     - `INSERT IGNORE` 또는 `ON DUPLICATE KEY UPDATE` 권장 — 운영 영향 §7 준수
  2. **프론트 폴백 갱신**: `menuItems.js` `DEFAULT_MENU_ITEMS` 를 §2.3 트리와 1:1 정합
  3. **라우트 검증**: `adminRoutes.js` 의 `INTEGRATED_SCHEDULE`, `CONSULTATION_LOGS`, `COMMUNITY_MODERATION`, `CONTENT_MASTER`, `MIND_WEATHER_OBSERVABILITY`, `MIND_GARDEN_OBSERVABILITY`, `PUSH_MONITORING`, `PG_OPS_APPROVAL`, `PACKAGE_PRICING` 가 실제 라우트 매핑되어 있는지 검증
  4. **i18n 갱신**: 메뉴 라벨 키 (`admin.json` / `common.json`) — "통합 스케줄", "매칭·결제·환불" 신규 키 추가
  5. **레거시 정리** (별도 커밋): `frontend/src/constants/menu.js` `ADMIN_MENU_ITEMS` 가 더 이상 import 안 되면 삭제, 아니면 deprecated 주석
  6. **하드코딩 검사**: `config/shell-scripts/check-hardcode.sh` 통과 (운영 반영 게이트)
- **참조 스킬**: `/core-solution-frontend`, `/core-solution-database-first`, `/core-solution-encapsulation-modularization`
- **완료 조건**:
  - `cd frontend && npm run build:ci` 통과
  - `mvn flyway:info` 신규 마이그 PENDING 확인
  - 신규 마이그 로컬 적용 후 `SELECT menu_code, menu_name, menu_path, parent_menu_id, sort_order FROM menus WHERE menu_location='ADMIN_ONLY' AND is_active=1 ORDER BY parent_menu_id, sort_order` 결과가 §2.3 트리와 일치

### Phase 4 (P4) — 검증 (`core-tester`)
- **subagent**: `core-tester`
- **입력**: Phase 3 PR
- **태스크**:
  1. **시각 회귀**: ADMIN/STAFF 로그인 후 LNB 트리 스크린샷 회귀 (Storybook 또는 Cypress)
  2. **권한별 LNB 노출 매트릭스**: ADMIN / STAFF (with ERP_ACCESS) / STAFF (without ERP_ACCESS) / CONSULTANT / CLIENT — 각 역할별 노출 메뉴 list diff
  3. **API 회귀**: `GET /api/v1/menus/lnb` 응답이 §2.3 트리와 일치
  4. **링크 회귀**: 각 메뉴 클릭 시 라우트 매칭 (`adminRoutes.js` 일관)
  5. **모바일 드로어 회귀**: `MobileLnbDrawer` 동일 트리 노출
  6. **React #130 / safeDisplay 회귀**: LNB 렌더링에 객체 자식 0건 (콘솔 0 error)
- **참조 스킬**: `/core-solution-testing`
- **완료 조건**:
  - 모든 회귀 PASS
  - 권한별 노출 매트릭스 문서 산출 (`docs/project-management/2026-05-28/LNB_ROLE_VISIBILITY_MATRIX.md`)

### Phase 5 (P5) — 배포 (`core-deployer`)
- **subagent**: `core-deployer`
- **입력**: Phase 4 PASS 확인
- **태스크**:
  1. develop 머지 + FF (feature flag 불필요 — DB 시드 멱등이므로 즉시 반영 OK)
  2. dev 환경 Flyway 적용 + LNB 트리 시각 검증
  3. 운영 반영 체크리스트 (§7 참조)
  4. 롤백 시나리오: 마이그 revert 시드 (`menu_code` 별 sort_order/parent 원복 SQL)
- **참조**: `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`, `/core-solution-deployment`

---

## §7 운영 영향

### 7.1 DB 시드 마이그
- **멱등 필수**: `INSERT … WHERE NOT EXISTS (menu_code 기준)` + `UPDATE menus SET … WHERE menu_code = …`. `INSERT IGNORE` / `ON DUPLICATE KEY UPDATE` 도 허용.
- **다른 sort_order 재정렬 없음**: 신규 메뉴는 빈 slot 에 배치 (예: ADM_INTEGRATED_SCHEDULE sort 15, ADM_MATCHING_REFUND 그룹 헤더 sort 25 등). 기존 sort 는 영향 없음.
- **운영 반영 시점**: dev 검증 후 develop → main → 운영 자동 (`deploy-production` 워크플로우).

### 7.2 권한 매트릭스 회귀
- 신규 그룹 `ADM_MATCHING_REFUND` / `ADM_CONTENT` 의 `required_role` 결정 필요:
  - 매칭·결제·환불: 환불은 운영 임팩트 大 → ADMIN 권고
  - 콘텐츠·커뮤니티: 모더레이션 = STAFF OK
- 결정은 P3 코더가 마이그에 명시. Q5 답으로 ERP 추가 변경 가능.

### 7.3 사용자 즐겨찾기 / 최근 본 메뉴 정합
- 현 코드에 LNB 즐겨찾기 기능 존재 시: 즐겨찾기 키가 `menu_path` 기반인지 `menu_code` 기반인지 확인 후 마이그 영향 분석.
- `frontend/src/components/dashboard-v2/constants/menuItems.js` `buildAdminLnbFallbackQuickNavigateSpecs()` 와 정합 — 1차 메뉴 변경 시 GNB 퀵 네비도 자동 갱신됨 (현재 코드 구조).
- `ADMIN_LNB_QUICK_NAV_ID_BY_TO` Map 갱신 (P3 코더 작업 범위에 포함).

### 7.4 모바일(Expo) 메뉴와의 동기화
- Q7 결재 결과에 따라:
  - 옵션 B (planner 권고): 본 PR 은 웹만, Expo 는 별도 트랙
  - 옵션 A: Expo 동기화를 Phase 3 코더 작업에 포함 (`/core-solution-encapsulation-modularization` 준수 — 공통 LNB 데이터 SSOT 가 백엔드 API 라는 점은 동일)

### 7.5 하드코딩 가드 (운영 반영 게이트)
- `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` **§17** 의 하드코딩 0건 게이트 준수.
- 메뉴 라벨은 i18n 키로, 색상·아이콘은 디자인 토큰 / Lucide 키 상수로.

---

## §8 분배실행 표 (요약 — `core-planner` 분배만)

| Phase | subagent_type | model | 입력 | 출력 | 게이트 |
|-------|---------------|-------|------|------|--------|
| **P1** | `explore` (readonly) | (parent default) | 본 §1 인벤토리 | inventory verify md | 90% 일치 |
| **P2** | `core-designer` | `gemini-3.1-pro` | §2, §3, Q1~Q10 답 | LNB IA 디자인 핸드오프 md | planner 검수 |
| **P3** | `core-coder` | (parent default) | §4 매트릭스 + P2 산출 | Flyway 마이그 + 폴백 갱신 + i18n + 라우트 검증 | `npm run build:ci` + `mvn flyway:info` PASS |
| **P4** | `core-tester` | (parent default) | P3 PR | 회귀 결과 + 권한별 노출 매트릭스 md | 모든 회귀 PASS |
| **P5** | `core-deployer` | (parent default) | P4 PASS | develop 머지 + 운영 반영 | 운영 GO/NO-GO |

병렬 가능: **P1 과 P2 는 의존성 없음** → 사용자 Q1~Q10 결재와 동시에 P1 explore 가동 가능. P2 디자이너는 Q1~Q10 답 확정 후 가동.

---

## §9 동시 진행 PR 과의 영역 분리

| 동시 PR | 영역 충돌 여부 |
|---------|---------------|
| #66 cherry-pick (Option B v2 Path1 tenant idempotency) | ❌ 무관 (백엔드 트랜잭션) |
| #67 ClientModal SSOT 정합 | ❌ 무관 (모달 정합) |
| 도넛 차트 색상 (admin dashboard pipeline) | ❌ 무관 (대시보드 차트) |
| UserManagement i18n (tabtitle) | ⚠ **부분 정합** — Phase 3 i18n 라벨 갱신과 동일 파일 (`admin.json`) 수정 가능. Phase 3 머지 전 #67 머지 완료 가정. |
| 회기 권한·라이프사이클 Phase 2 beta | ⚠ Q8 ("탈퇴 대기"/"휴면") 위치와 정합 필요 — 결재 시 동시 트랙 합의 |

**핵심 룰**: 본 PR 은 **DB 시드 + 폴백 + i18n 라벨** 만 건드림. 페이지 본문·모달·API 코드는 **건드리지 않음**.

---

## §10 보고 형식 (planner 자체 보고용)

본 §10 은 planner 가 부모 어시스턴트에게 반환할 JSON 보고 템플릿.

```json
{
  "doc_path": "docs/project-management/2026-05-28/ADMIN_LNB_IA_RESTRUCTURE_PLAN.md",
  "branch": "docs/admin-lnb-ia-restructure",
  "commit_sha": "...",
  "pushed": false,
  "inventory_summary": {
    "total_admin_menus_db_active": 24,
    "total_admin_menus_code_fallback_first_level": 9,
    "duplicates_detected": [
      "DUP-1: 통합 스케줄 vs 매칭 관리 (1차 자리 교체 필요)",
      "DUP-2: 알림 path 불일치 (/admin/system-notifications vs /admin/notifications)",
      "DUP-3: 폴백 only 1차 5종 (통합 스케줄·상담일지·콘텐츠·커뮤니티 그룹·푸시 모니터링 — DB 미존재)",
      "DUP-4: 사용자/권한 그룹 자식 = USERS_LIST/ACCOUNTS 만 활성",
      "DUP-5: 설정 그룹 13개 자식 (서브그룹화 필요)",
      "DUP-6: PG path 단복수 (/tenant/pg-configuration vs /tenant/pg-configurations)",
      "DUP-7: 레거시 menu.js ADMIN_MENU_ITEMS (현행 미사용 의심)"
    ],
    "groups_proposed": [
      "G1 운영(매일): 대시보드/통합 스케줄/알림·메시지(+상담일지 하위)",
      "G2 매칭·결제·환불: 매칭 관리(환불·취소)/구독·결제 수단/PG 승인",
      "G3 사용자 관리: 사용자 목록/계좌/탈퇴·휴면(Q8)",
      "G4 콘텐츠·커뮤니티: 검수큐/심리교육·힐링/마음 날씨·정원/푸시",
      "G5 쇼핑·리워드: SKU/리워드 정책/온라인 주문",
      "G6 운영·재무 ERP: 운영현황/조달·품목/거래·정산/예산/급여/승인",
      "G7 시스템·설정: 테넌트 프로필·브랜딩·시스템·공통코드·PG·AI·패키지요금·알림채널 서브그룹·컴플라이언스"
    ]
  },
  "user_review_questions": [
    "Q1: 그룹 개수 (3 vs 4 vs 5/+ — planner 권고: 7 그룹 + 단독 3)",
    "Q2: 매칭 관리 진입 경로 (A·B·C — planner 권고: C)",
    "Q3: 매일 자주 쓰는 메뉴 순위 확정",
    "Q4: 알림·메시지 그룹 분리 또는 통합",
    "Q5: ERP/회계 그룹 STAFF 노출",
    "Q6: 시스템·설정 13개 평면 vs 서브그룹화",
    "Q7: Expo 앱 LNB 동기화 (planner 권고: B = 별도 트랙)",
    "Q8: 탈퇴 대기/휴면 메뉴 위치 (G3 vs G8 별도)",
    "Q9: ADM_BILLING 1차 유지 (A) vs G2 하위 강등 (B — planner 권고)",
    "Q10: 1차 메뉴 최대 항목 수 (planner 권고: ≤ 8)"
  ],
  "phase_delegation_order": [
    "Phase 1: explore (인벤토리 전수 검증 — 선택, 본 §1 으로 대체 가능)",
    "Phase 2: core-designer (gemini-3.1-pro) — Q1~Q10 결재 후",
    "Phase 3: core-coder — Flyway 마이그 + 폴백 + i18n + 라우트 검증",
    "Phase 4: core-tester — 시각 회귀 + 권한별 노출 매트릭스 + 모바일 회귀",
    "Phase 5: core-deployer — develop → 운영 반영"
  ],
  "next": "사용자 Q1~Q10 결재 → Phase 2 designer (gemini-3.1-pro) + Phase 3 coder 위임"
}
```

---

## 부록 A — 참조 문서·스킬

- `.cursor/skills/core-solution-planning/SKILL.md`
- `.cursor/skills/core-solution-atomic-design/SKILL.md`
- `.cursor/skills/core-solution-business-flow/SKILL.md`
- `.cursor/skills/core-solution-frontend/SKILL.md`
- `.cursor/skills/core-solution-encapsulation-modularization/SKILL.md`
- `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`
- `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` (§17 운영 게이트)
- `docs/design-system/LNB_MENU_STRUCTURE_AND_PERMISSION_SPEC.md`
- `docs/design-system/UNIFIED_LAYOUT_SPEC.md`
- `.cursor/rules/mindgarden-subagents.mdc` (디자인 배치 = gemini-3.1-pro)
- `src/main/resources/db/migration/V20260225_001__lnb_menu_structure.sql` (LNB 시작점)
- `src/main/resources/db/migration/V20260606_001__lnb_admin_billing_menus.sql` (최근 마이그)
- `src/main/java/com/coresolution/core/service/impl/MenuServiceImpl.java` (`getLnbMenus`)
- `frontend/src/components/dashboard-v2/constants/menuItems.js` (`DEFAULT_MENU_ITEMS`)
- `frontend/src/constants/adminRoutes.js` (라우트 상수 SSOT)

---

**문서 작성 완료 — 사용자 Q1~Q10 결재 대기.**
**Planner 는 본 합의서 산출 후 자동 종료.**
