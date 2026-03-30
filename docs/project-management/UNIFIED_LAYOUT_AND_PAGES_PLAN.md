# 통일 레이아웃 및 전 페이지 적용·이모지 제거 기획

**문서 버전**: 1.0.0  
**작성일**: 2025-03-04  
**담당**: core-planner (기획만 수행, 구현·디자인은 해당 서브에이전트 위임)

---

## 1. 제목·목표

- **제목**: 현재까지의 레이아웃을 새롭게 구성해 모든 페이지를 통일감 있게 만들고, 이모지는 전부 제거한다.
- **목표**: (1) ERP·어드민·공통 레이아웃을 일관된 구조와 토큰으로 통일하고, (2) UI 텍스트·라벨·버튼·아이콘에서 이모지를 제거하여 Lucide/Feather 등 아이콘 컴포넌트로 대체한다. 기획 → 디자이너 → 코더 순서로 서브에이전트를 활용한다.

---

## 2. 범위

### 2.1 포함 범위

| 구분 | 포함 대상 |
|------|-----------|
| **ERP** | 대시보드, 구매/재무/예산/세금/환불/급여/원장/정산/통합재무 등 **목록·상세·폼** 페이지 |
| **어드민** | 어드민 대시보드 및 각 관리(사용자/권한/공통코드/시스템설정 등) **목록·상세** 페이지 |
| **공통 레이아웃** | AdminCommonLayout, DesktopLayout, MobileLayout, B0KlA 카드/그리드 등 |
| **이모지 제거** | 전 프론트엔드(상수·위젯·메시지·폼·모달·라벨·버튼 문구 포함) |

### 2.2 점검 대상 페이지·컴포넌트 목록

아래는 **점검·적용 대상**을 나열한 목록이다. “상세 페이지”는 해당 화면의 읽기/편집 뷰·모달·폼을 포함한다.

#### ERP 관련

| 페이지/라우트 | 컴포넌트 | 비고 |
|--------------|----------|------|
| ERP 대시보드 | `ErpDashboard.js` | 목록·카드·요약 |
| 구매 관리 | `PurchaseManagement.js` | 목록·필터 |
| 구매 요청 폼 | `PurchaseRequestForm.js` | 폼 |
| 재무 관리 | `FinancialManagement.js` | 목록·필터·폼 |
| 재무 트랜잭션 폼 | `FinancialTransactionForm.js`, `QuickExpenseForm.js` | 폼(이모지 사용 있음) |
| 예산 관리 | `BudgetManagement.js` | 목록·상세 |
| 세무 관리 | `ImprovedTaxManagement.js`, `TaxManagement.js` | 목록·상세 |
| 환불 관리 | `RefundManagement.js` 및 refund 하위(RefundHistoryTable, RefundFilters 등) | 목록·필터·상세 |
| 급여 관리 | `SalaryManagement.js`, `SalaryConfigModal.js`, `SalaryProfileFormModal.js` | 목록·상세·폼 |
| 아이템(원장) 관리 | `ItemManagement.js` | 목록·상세·폼 |
| 통합 재무 대시보드 | `IntegratedFinanceDashboard.js` | /admin/erp/financial |
| 승인 대시보드 | `AdminApprovalDashboard.js`, `SuperAdminApprovalDashboard.js` | 목록·상세 |
| ERP 공통 | `ErpHeader.js`, `ErpCard.js`, `ErpButton.js`, `ErpModal.js` | 공통 컴포넌트 |
| ERP 캘린더/리포트 | `FinancialCalendarView.js`, `ErpReportModal.js` | 뷰·모달 |

#### 어드민 대시보드 및 관리

| 페이지/라우트 | 컴포넌트 | 비고 |
|--------------|----------|------|
| 어드민 대시보드 | `AdminDashboardV2.js`, `WidgetBasedAdminDashboard.js`, `AdminDashboard.js` | B0KlA·위젯 |
| 사용자 관리 | `UserManagementPage.js`, `UserManagement.js` | 목록·상세·폼(이모지 사용 있음) |
| 권한 관리 | `PermissionManagement.js` | 목록·상세 |
| 권한 그룹 | `PermissionGroupManagement.js` | 목록·상세 |
| 메뉴 권한 | `MenuPermissionManagement.js` | 목록·상세 |
| 공통코드 | `CommonCodeManagement.js`, `TenantCommonCodeManager` | 목록·상세·폼 |
| 패키지 요금 | `PackagePricingListPage.js`, `PackagePricingDetailPage.js` | 목록·상세·폼 |
| 계좌 관리 | `AccountManagement.js` | 목록·상세 |
| 스케줄 | `UnifiedScheduleComponent` (AdminCommonLayout 내) | 목록·캘린더 |
| 통합 스케줄링 | `IntegratedMatchingSchedule` | 목록·상세 |
| 상담일지 조회 | `ConsultationLogView.js` | 목록·상세 |
| 매핑 관리 | `MappingManagement.js`, mapping 하위(MappingCard, MappingDetailModal 등) | 목록·상세·모달(이모지 사용 있음) |
| 세션 관리 | `SessionManagement.js` | 목록·상세 |
| 대시보드 관리 | `DashboardManagement.js` | 목록·상세 |
| 시스템 알림 | `SystemNotificationManagement.js` | 목록·상세 |
| 시스템 설정 | `SystemConfigManagement.js` | 목록·상세 |
| 웰니스 관리 | `WellnessManagement.js` | 목록·상세 |
| 심리검사 관리 | `PsychAssessmentManagement.js` | 목록·상세 |
| 브랜딩 관리 | `BrandingManagementPage.js`, `BrandingManagement.js` | 목록·상세 |
| 메시지 | `AdminMessages.js` | 목록·상세 |
| 캐시/보안/API 모니터링 | `CacheMonitoringDashboard.js`, `SecurityMonitoringDashboard.js`, `ApiPerformanceMonitoring.js` | 대시보드형 |
| 테넌트 코드 | `TenantCodeManagement.js` | 목록·상세(이모지 사용 있음) |
| 컴플라이언스 | `ComplianceMenu.js`, `ComplianceDashboard.js` | 목록·상세 |

#### 공통 레이아웃·템플릿

| 구분 | 경로/컴포넌트 | 비고 |
|------|----------------|------|
| 어드민 공통 레이아웃 | `AdminCommonLayout.js` | GNB·LNB·children 래퍼 |
| 데스크톱/모바일 템플릿 | `DesktopLayout.js`, `MobileLayout.js`, `DesktopLayout.css`, `MobileLayout.css` | LNB·메인 영역 |
| 대시보드 V2 템플릿 | `dashboard-v2/templates/index.js` | 내보내기 |
| 메뉴 상수 | `dashboard-v2/constants/menuItems.js` | LNB 메뉴(이미 Lucide 아이콘 사용) |
| B0KlA·카드/그리드 | `AdminDashboard/AdminDashboardB0KlA.css`, 위젯 그리드 | 어드민 대시보드 시각 스타일 |

#### 기타 이모지 사용 파일(예시)

- `ClientMessageScreen.js`, `ConsultantMessageScreen.js` (메시지 타입 아이콘·라벨)
- `ConsultationRecordView.js` (빈 상태 아이콘)
- `UserManagement.js` (역할 아이콘)
- `QuickExpenseForm.js` (카테고리 아이콘)
- `tenantCodeConstants.js` (페이지 타이틀·플레이스홀더)
- `MappingCard.js`, `MappingDetailModal.js`
- 기타: grep/검색으로 이모지 포함 파일 추가 점검 권장

---

## 3. 레이아웃 통일 원칙 (제안)

### 3.1 메인 레이아웃 구조 제안

- **권장**: **영역별 2~3가지 템플릿만 허용**하는 방식.
  - **이유**: ERP는 데이터 밀도·필터·액션이 많고, 어드민 대시보드는 카드/위젯 위주이며, 클라이언트/상담사 대시보드는 또 다른 흐름이 있어, 한 가지 구조로만 통일하면 오히려 사용성·유지보수성이 떨어질 수 있음.
- **제안 구조**:
  1. **어드민·ERP 공통**: **상단 GNB + 좌측 LNB + 메인 콘텐츠**  
     - `AdminCommonLayout` + `DesktopLayout` / `MobileLayout` 기반.  
     - ERP 페이지도 동일하게 AdminCommonLayout(또는 동일 GNB/LNB를 쓰는 공통 레이아웃)으로 감싸서, “ERP 대시보드 / 구매 / 재무 / …” 메뉴가 LNB에 일관되게 노출되도록 한다.
  2. **클라이언트/상담사 대시보드**: 기존 역할별 레이아웃 유지하되, **헤더·카드·버튼·타이포·색상**만 `unified-design-tokens.css`·B0KlA와 정렬한다.
  3. **공개/인증 전용**(로그인·회원가입·리셋 비밀번호 등): 풀페이지 레이아웃 유지, 토큰만 통일.

즉, “한 가지 메인 레이아웃”이 아니라 **“어드민/ERP용 1종 + 역할별 대시보드 1종 + 공개 1종”** 수준의 2~3가지 템플릿으로 통일하는 것을 제안한다.

### 3.2 페이지 유형별 공통 구조 제안

| 유형 | 공통 구조 | 비고 |
|------|-----------|------|
| **목록 페이지** | ContentHeader(제목 + 검색/필터 + 주요 액션 버튼) + ContentArea(테이블 또는 카드 그리드) + 필요 시 페이징/정렬 | 반응형: 테이블 → 카드형 전환 또는 스크롤 테이블 |
| **상세 페이지** | ContentHeader(제목 + 뒤로가기/편집 버튼) + 블록 단위 섹션(카드/필드 그룹) + 하단 액션 | 읽기 전용·편집 모드 공통 블록 재사용 |
| **폼 페이지(등록/수정)** | ContentHeader(제목) + 폼 영역(섹션 나눔) + 하단 제출/취소 | UnifiedModal 내 폼이면 모달 스펙 준수 |

위는 `docs/layout/README.md`, `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md`, `AdminCommonLayout` 기반으로 정리한 것이다.

### 3.3 이모지 제거 원칙

- **아이콘**: 모든 이모지는 **Lucide React**(또는 프로젝트에서 채택한 Feather/Lucide 등) **아이콘 컴포넌트**로 대체한다.  
  - 예: 💰 → `DollarSign`, 📋 → `ClipboardList`, 🔔 → `Bell`, ✅ → `Check`, ❌ → `X` 등.
- **텍스트/라벨/버튼 문구**: 문구 내 이모지(예: "📊 대시보드", "✅ 저장")는 **이모지 없이 텍스트만** 사용하고, 필요 시 아이콘은 컴포넌트로 별도 배치한다.
- **상수·메시지 타입·역할 라벨**: `UserManagement.js`의 역할 아이콘, `ConsultantMessageScreen.js`의 메시지 타입 아이콘, `QuickExpenseForm.js`의 카테고리 아이콘 등은 모두 **icon: 'emoji'** → **icon: LucideIcon** 형태로 변경한다.
- **빈 상태/에러 상태**: "📭 메시지 없음", "⚠️ 오류" 등은 **아이콘 컴포넌트 + 텍스트**로 통일한다.

---

## 4. 의존성·순서

- **선행 작업**: 없음. 기획 문서 확정 후 Phase B → Phase C 순서로 진행하면 된다.
- **참조 문서·스킬**:
  - `docs/layout/README.md`, `docs/layout/ADMIN_COMMON_LAYOUT.md`
  - `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md`, `unified-design-tokens.css`
  - B0KlA·어드민 대시보드 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample)
  - 스킬: `/core-solution-planning`, `/core-solution-design-handoff`, `/core-solution-frontend`, `/core-solution-atomic-design`, `/core-solution-unified-modal`

---

## 5. Phase 목록 및 전달 프롬프트

### Phase A: 기획 (현재 완료)

- **담당**: core-planner  
- **산출물**: 본 문서(대상 페이지 목록, 레이아웃 원칙, 이모지 제거 원칙, 디자이너/코더 전달용 요약 및 프롬프트 초안).

### Phase B: 디자이너 — 통일 레이아웃 스펙 및 이모지 금지 명시

- **담당**: **core-designer**
- **목표**: 통일된 레이아웃 스펙(와이어프레임 수준), 컴포넌트 구조, 토큰(B0KlA / unified-design-tokens), **이모지 사용 금지** 명시. 코드 작성 없음.

#### Phase B — 디자이너용 프롬프트 (전달용)

```text
[디자이너용 프롬프트]

다음 기획 문서를 바탕으로 "통일 레이아웃 및 전 페이지 적용" 설계를 진행해 주세요. 코드 작성은 하지 마세요.

참조 문서:
- docs/project-management/UNIFIED_LAYOUT_AND_PAGES_PLAN.md (본 기획서)
- docs/layout/README.md, docs/design-system/RESPONSIVE_LAYOUT_SPEC.md
- frontend/src/styles/unified-design-tokens.css
- B0KlA·어드민 대시보드 샘플: https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample
- mindgarden-design-system.pen (B0KlA)

요청 사항:
1. 레이아웃 통일 스펙
   - 어드민/ERP 공통: GNB + LNB + 메인 콘텐츠 구조를 유지하되, ContentHeader / ContentArea / 목록(테이블·카드)/상세/폼 블록의 배치를 와이어프레임 수준으로 정의해 주세요.
   - 목록 페이지·상세 페이지·폼 페이지(등록/수정)별 공통 블록 구조를 문서로 정리해 주세요.
   - DesktopLayout, MobileLayout에서의 LNB(드로어)·메인 영역 너비·패딩·브레이크포인트를 RESPONSIVE_LAYOUT_SPEC과 맞게 명시해 주세요.

2. 컴포넌트 구조
   - AdminCommonLayout, DesktopLayout, MobileLayout 하위에 올 공통 영역(헤더, 본문, 카드/그리드)을 아토믹 계층(Atoms/Molecules/Organisms)으로 정리해 주세요.
   - B0KlA 카드·그리드·버튼 스타일을 사용하는 영역을 구분해 주세요.

3. 디자인 토큰
   - unified-design-tokens.css 및 B0KlA(mg-v2-ad-b0kla__*) 클래스 사용 처를 스펙에 반영해 주세요.
   - 색상·여백·타이포는 토큰만 사용하도록 명시해 주세요.

4. 이모지 사용 금지
   - 모든 UI에서 이모지 사용을 금지하고, 아이콘은 Lucide(또는 프로젝트 표준) 아이콘 컴포넌트로만 사용한다고 스펙에 명시해 주세요.
   - 메시지 타입·역할·카테고리·빈 상태·에러 상태 등 기존 이모지 사용처를 "아이콘 컴포넌트 매핑표" 형태로 정리해 주세요(예: 💬 → MessageCircle, 📋 → ClipboardList).

산출물:
- docs/design-system/ 또는 docs/project-management/ 아래에 "통일 레이아웃 스펙" 문서(와이어프레임·블록 구조·토큰·이모지→아이콘 매핑표)를 작성해 주세요. 코더가 이 문서만 보고 구현할 수 있을 정도로 구체적으로 작성해 주세요.
```

### Phase C: 코더 — 스펙 반영·이모지 제거·통일감 구현

- **담당**: **core-coder**
- **목표**: Phase B에서 산출한 통일 레이아웃 스펙에 따라 각 페이지에 레이아웃 적용, 이모지 전부 제거 후 Lucide(또는 채택 아이콘) 컴포넌트로 대체, 통일감 구현.

#### Phase C — 코더용 프롬프트 (전달용)

```text
[코더용 프롬프트]

Phase B(core-designer)에서 산출한 "통일 레이아웃 스펙" 문서를 기준으로 아래 작업을 진행해 주세요.

참조:
- docs/project-management/UNIFIED_LAYOUT_AND_PAGES_PLAN.md
- Phase B 산출물: docs/design-system/ 또는 docs/project-management/ 내 "통일 레이아웃 스펙" 문서
- 스킬: /core-solution-frontend, /core-solution-atomic-design, /core-solution-unified-modal
- AdminCommonLayout: 모든 어드민·ERP 페이지는 AdminCommonLayout으로 감싸고, 본문은 children, title/loading 등만 페이지별 지정.

작업 범위:
1. 레이아웃 적용
   - UNIFIED_LAYOUT_AND_PAGES_PLAN.md의 "점검 대상 페이지·컴포넌트 목록"에 있는 ERP·어드민 페이지에 대해, 스펙에 정의된 ContentHeader/ContentArea/목록·상세·폼 구조를 적용해 주세요.
   - AdminCommonLayout을 아직 쓰지 않는 어드민/ERP 페이지가 있으면 AdminCommonLayout으로 감싸 주세요.
   - DesktopLayout, MobileLayout, B0KlA 카드/그리드는 스펙과 unified-design-tokens.css에 맞게 수정해 주세요.

2. 이모지 제거
   - 프론트엔드 전역에서 라벨·버튼·상수·메시지 타입·역할·카테고리·빈 상태·에러 상태 등에 사용된 이모지를 모두 제거하고, 스펙의 "이모지→아이콘 매핑표"에 따라 Lucide React(또는 프로젝트 표준) 아이콘 컴포넌트로 교체해 주세요.
   - 예: UserManagement.js 역할 icon, ConsultantMessageScreen/ClientMessageScreen 메시지 타입 icon, QuickExpenseForm 카테고리 icon, tenantCodeConstants, MappingCard 등 이모지 사용처 전부.

3. 통일감
   - 색상·여백·타이포는 unified-design-tokens.css 및 B0KlA 클래스만 사용하고, 하드코딩 색상/폰트를 제거해 주세요.

완료 기준:
- 목록에 있는 모든 ERP·어드민 페이지가 동일한 레이아웃 원칙(상단 헤더 + LNB + 콘텐츠)과 토큰을 따르고,
- UI에 이모지가 남아 있지 않으며,
- 공통 레이아웃(AdminCommonLayout, DesktopLayout, MobileLayout)이 스펙과 일치하는지 확인해 주세요.
```

---

## 6. 리스크·제약

- **기존 라우트·역할**: ERP/어드민 라우트 구조와 권한은 유지하고, 레이아웃·비주얼·이모지만 변경한다.
- **멀티테넌트·권한**: tenantId·역할 체크 로직은 건드리지 않는다.
- **일부 페이지 미적용**: 공개·테스트·랜딩 페이지는 레이아웃 통일 범위에서 제외하거나, 토큰만 적용할 수 있다(필요 시 기획 보완).
- **이모지 검색**: 유니코드 범위가 넓어, grep으로 일부만 잡힐 수 있음. Phase C에서 "이모지", "icon: '", "icon:\s*['\"]" 등 추가 검색으로 누락 없이 제거할 것.

---

## 7. 단계별 완료 기준·체크리스트

### Phase A (기획)

- [x] 대상 페이지·컴포넌트 목록이 ERP/어드민/공통 레이아웃을 포함해 나열됨
- [x] 레이아웃 통일 원칙(2~3가지 템플릿, 목록/상세/폼 공통 구조)이 제안됨
- [x] 이모지 제거 원칙(아이콘 컴포넌트 대체, 텍스트에서 제거)이 명시됨
- [x] Phase B·C용 "디자이너용 프롬프트", "코더용 프롬프트"가 문서에 포함됨

### Phase B (디자이너)

- [ ] 통일 레이아웃 스펙 문서가 작성됨(와이어프레임·블록 구조·토큰)
- [ ] 이모지 사용 금지 및 이모지→아이콘 매핑표가 스펙에 포함됨
- [ ] 코더가 스펙만 보고 구현 가능한 수준으로 구체화됨

### Phase C (코더)

- [ ] 목록에 있는 ERP·어드민 페이지에 동일 레이아웃 원칙이 적용됨
- [ ] AdminCommonLayout 미적용 페이지가 없음(해당되는 경우)
- [ ] UI에서 이모지가 제거되고 Lucide(또는 표준) 아이콘으로 대체됨
- [ ] 색상·여백·타이포가 unified-design-tokens·B0KlA 기준으로 통일됨

---

## 8. 실행 요청문

다음 순서로 서브에이전트를 호출해 주세요.

1. **Phase B**  
   - **서브에이전트**: **core-designer**  
   - **전달할 프롬프트**: 위 §5의 **「Phase B — 디자이너용 프롬프트」** 블록 전체를 그대로 전달하세요.  
   - **산출물**: 통일 레이아웃 스펙 문서(와이어프레임, 컴포넌트 구조, 토큰, 이모지 금지·아이콘 매핑표).

2. **Phase C** (Phase B 산출물 확정 후)  
   - **서브에이전트**: **core-coder**  
   - **전달할 프롬프트**: 위 §5의 **「Phase C — 코더용 프롬프트」** 블록 전체를 전달하고, Phase B에서 작성된 스펙 문서 경로를 프롬프트에 함께 적어 주세요.  
   - **작업**: 스펙에 따른 레이아웃 적용, 이모지 제거 및 아이콘 교체, 통일감 구현.

기획은 여기까지이며, 실제 디자인·코드 수정은 core-designer와 core-coder가 수행합니다.
