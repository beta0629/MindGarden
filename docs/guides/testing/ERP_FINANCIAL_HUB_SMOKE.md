# ERP 재무·환불 허브 수동 스모크

`frontend/src/components` 전역에서 `<MGButton`을 사용하는 파일에 대해
`erpMgButtonProps`(`buildErpMgButtonClassName`, `ERP_MG_BUTTON_LOADING_TEXT`) 적용 작업(P4-04 계열)이 완료되었다.

수동 스모크 아래 번호 목록은 기능 회귀 검증용이며, 버튼 스타일·로딩 문구는 P4와 일치한다.

UI 변경 후 빠른 확인용. **브라우저 개발자 도구 콘솔·네트워크**를 연 상태에서 진행한다.

1. `/erp/financial` 진입 → 페이지 로드·레이아웃 정상.
2. `/erp/refund-management`로 이동(탭/메뉴) → 로드 정상.
3. 다시 `/erp/financial`로 전환 → 두 경로 간 탭 전환이 끊김 없이 동작.
4. **FinancialManagement**에서 거래·달력·대시보드(또는 동일 역할) 탭을 순서대로 전환 → 각 탭 콘텐츠 표시.
5. 달력 뷰에서 **이전** 이동 → 기간/월이 기대대로 바뀜.
6. **다음** 이동 → 동일하게 반영.
7. **새로고침**(또는 달력 새로고침 컨트롤) → 데이터 재요청 후 화면 유지·갱신.
8. 콘솔에 **치명 오류**(빨간 스택, 미처리 예외) 없음.
9. 네트워크 요청 헤더·바디에서 **`tenantId` 전달 방식이 기존과 동일**함(변경 PR 기준 회귀 없음).
10. 재무·환불 관련 API 호출 패턴·엔드포인트가 **기존과 동일**(불필요한 추가/누락 없음).
11. `/erp/salary`(세금은 `?tab=tax` 등 **실제 앱 라우트** 기준)에서 급여·세금 화면 **탭 전환**, 상단 **헤더 버튼** 클릭 → 콘솔 무오류(8번 기준).
12. **ImprovedTaxManagement**에서 **pill 탭** 전환 시 화면·스크롤 정상, 콘솔 무오류.
13. **`/admin/mapping-management`**(또는 `adminRoutes` 등 프로젝트 표준 매핑 경로) **진입** → 목록 로드·**필터** 동작 확인.
14. 매핑 **생성/상세** 등 관련 **모달**을 열고 닫을 때 오버레이·본문 **레이아웃 깨짐 없음**.
15. 위 11~14 구간에서도 **9~10번과 동일**하게 `tenantId`·API 패턴 회귀 확인.
16. 관리자 **결제 확인** / **할인 결제 확인** 모달을 열고 닫고, **취소**·**확인** 버튼을 클릭할 때 콘솔 무오류(8번 기준).
17. **빌링** 구독·결제수단 화면에서 주요 `MGButton`(확인·저장 등) 동작 스모크.
18. **세션 관리** 화면(`SessionManagement` 등)에서 목록 표시·액션 버튼 스모크.
19. 위 16~18 구간에서도 **9~10번과 동일**하게 `tenantId`·API 패턴 회귀 확인.
20. **시스템 설정** 화면에서 목록·저장·취소 등 주요 버튼 스모크 → 콘솔 무오류(8번 기준).
21. **공통코드** 관리 화면에서 조회·저장·취소 등 주요 버튼 스모크 → 콘솔 무오류(8번 기준).
22. **직원·권한** 관련 화면에서 주요 액션 버튼 스모크 → 콘솔 무오류(8번 기준).
23. 관리자 **대시보드**에서 브랜딩·보안·캐시 모니터링 등 관련 버튼·링크 스모크 → 콘솔 무오류(8번 기준).
24. 위 20~23 구간에서도 **9~10번과 동일**하게 `tenantId`·API 패턴 회귀 확인.
25. **병렬 완료 배치 ERP-HUB 4파일** — `ErpDashboard`·`IntegratedFinanceDashboard`·`FinancialCalendarView` 및 동일 병렬 배치에 포함된 허브 권역 1파일(저장소 배치 SSOT) 기준으로 `/erp/dashboard`·`/erp/financial` 진입, 무음 새로고침·탭/뷰 전환·콘솔 무오류·`tenantId`/API 회귀 확인(상단 1~10·§ERP-P4-01/03과 **동일 경로·동일 기대**면 **한 번만**).
26. **어드민 경로** — `/admin/erp/financial`·`/admin/mapping-management` 등 `App.js`/`adminRoutes` 기준 **대표 2경로** 진입, LNB·본문·모달 오버레이·`tenantId`/API 패턴 확인(상단 13~15·§UI-01·§ERP-P4-03 4번과 중복 시 생략).
27. **대시보드 QuickActions** — `QuickActions`·`QuickActionsWidget`·GNB `QuickActionsDropdown` 등에서 주요 버튼·드롭다운 열기/닫기 시 콘솔 무오류·레이아웃 깨짐 없음(§G8-B5b·G8-B6a·G8-B13b·상단 23번과 **동일 경로·동일 기대**면 한쪽만).
28. **UI-01 병렬 B1/B2/B3/C** 직후 — `AdminCommonLayout`·의도적 비적용·ACL 래퍼 경로에서 LNB·본문 스크롤·이중 헤더·권한/`ComingSoon` 분기 화면 스모크(§UI-01·상단 20~24와 중복 시 생략).
29. **ERP-P4-05-DASH 4파일** 배치 — `dashboard/widgets`·대시보드 패널 계열에서 네이티브 새로고침·검색 등이 `MGButton`/`erpMgButtonProps` 패턴과 일치하는지 확인(상단 23·G8-B13a·G8-B14·구역 ERP-P4-05 비고와 중복 시 생략).
30. **ERP-P4-05 잔여** — 병렬 **ERP-P4-05-DASH-B/C**·**ERP-P4-05-ERP-A/B** 완료 직후, 인벤토리 잔여 ERP 화면에서 네이티브 새로고침·검색·툴바 트리거가 `MGButton`/`erpMgButtonProps`·무음 조회 패턴과 일치하는지 확인(상단 29·§ERP-P4-03·G8-B13a·G8-B14·구역 ERP-P4-05 비고와 **동일 경로·동일 기대**면 생략).
31. **종합관리 2화면** — `ConsultantComprehensiveManagement`·`ClientComprehensiveManagement` 진입·탭·주요 액션 버튼 스모크 → 콘솔 무오류·`tenantId`/API 회귀(상단 22·G8-B8a·§UI-01과 **동일 경로·동일 기대**면 생략).
32. **웰니스** — `WellnessManagement` 등(저장소 라우트 기준) 진입·주요 `MGButton`/`erpMgButtonProps`·콘솔 무오류·`tenantId`/API 회귀(G8-B12b·G8-B16b·상단 스모크와 **동일 경로·동일 기대**면 생략).
33. **권한** — `PermissionManagement`·`MenuPermissionManagement` 등에서 조회·저장·취소·탭 스모크 → 콘솔 무오류(상단 22·§UI-01 권한·`ComingSoon` 분기와 **동일 경로·동일 기대**면 생략).
34. **위젯 대시보드** — `WidgetBasedAdminDashboard`·`dashboard/widgets`·패널 계열에서 새로고침·검색·툴바·`MGButton` 패턴 일치(상단 23·29·G8-B9b·G8-B13a/b·G8-B14와 **동일 경로·동일 기대**면 생략).
35. **클라이언트** — `ClientDashboard`·`components/client`·`pages/client` 등 대표 경로에서 주요 버튼·탭 스모크 → 콘솔 무오류·`tenantId`/API 회귀(상단 31·G8-B15a와 **동일 경로·동일 기대**면 생략).
36. **헤더** — `UnifiedHeader`·`MGHeader`·GNB/드롭다운(알림·프로필·QuickActions 등) 열기/닫기·콘솔 무오류(상단 27·G8-B5a·G8-B6a와 **동일 경로·동일 기대**면 생략).
37. **태블릿 로그인** — `TabletLogin`·`TabletRegister` 등 태블릿 인증 화면에서 제출·보조 버튼·콘솔 무오류(G8-B2a·G8-B4b와 **동일 경로·동일 기대**면 생략).
38. **AdminDashboardV2** — V2 관리자 대시보드(`dashboard-v2/AdminDashboardV2`, `App.js`/`adminRoutes` 기준)에서 「관리 기능」그리드·타일 라벨이 누락·깨짐 없이 표시(상단 23·G8-B7a·27번과 **동일 경로·동일 기대**면 생략).
39. **레거시 AdminDashboard** — `admin/AdminDashboard.js` 등 레거시 관리자 대시보드 경로에서 「관리 기능」그리드·라벨이 동일하게 표시(상단 23·G8-B9a와 **동일 경로·동일 기대**면 생략).

**TABLET-P4-05 병합**: 태블릿 인증 스모크는 위 **37번**과 **동일 범위**이므로 별도 번호를 두지 않는다(37번만 수행).

**중복 생략**: 위 번호·§「다음 단계」·「위임 직후 보강 스모크」끼리 **동일 경로·동일 기대**이면 한 번만 수행한다.

---

## 다음 단계 (병렬 검증 게이트 — 기준 2026-04-15)

P4-04 및 전역 `erpMgButtonProps`(병렬 블록 **P4-GLOBAL**) 완료 직후, **ERP-P4-01** · **ERP-P4-03** · **UI-01** 는 동일 **검증 게이트**(수동 스모크·회귀·`core-tester` 확인)에 묶는다. 역할: **ADMIN**. 경로는 `frontend/src/App.js`·`frontend/src/constants/adminRoutes.js` 등 저장소 라우트 정의를 기준으로 일반화한다.

### ERP-P4-01 — `UnifiedLoading` 인라인·섹션 로딩

1. `/admin/erp/financial` 진입 → 통합 재무 대시보드 로드, 차트·표·KPI 구간 갱신 시 **전체 화면 덮는 단일 오버레이**보다 **섹션·카드 단위** 로딩·`aria-busy`가 우선하는지 확인.
2. `/erp/financial` → `FinancialManagement`에서 **거래·달력·대시보드(또는 동일 역할) 탭** 전환 시 본문 영역만 로딩 표시·레이아웃 유지.
3. `/erp/dashboard` 또는 `/erp/salary`(세금은 `?tab=tax` 등 **실제 앱 라우트** 기준) 중 1곳 — 목록·요약 구간의 인라인 로딩·스켈레톤이 페이지 전체를 가리지 않는지 확인(**아래 6~7·9와 중복 시 한쪽만**).
4. 거래·급여·프로필 등 **모달**을 열어 저장·조회 로딩 시 **모달 본문**만 `UnifiedLoading` 등으로 표시되고 앱 전체가 멈추지 않는지 확인.
5. `/erp/refund-management`(환불 허브) — 목록·필터 영역 로딩이 **인라인·섹션** 우선인지 확인(상단 2번·9~10번 기준과 함께).
6. `/erp/dashboard`(ERP 대시보드) — KPI·차트·요약 구간 갱신 시 **전면 단일 오버레이**보다 본문·섹션 단위 로딩이 우선하는지 확인.
7. `/erp/salary`(급여) — 본문·탭 영역 로딩이 동일 기준인지 확인.
8. `/erp/financial` **달력** 탭(캘린더 뷰) — 기간 이동·갱신 시 레이아웃 유지·로딩 표시(상단 스모크 4~7번·2번과 연계, 중복 시 한쪽만).
9. `/erp/salary?tab=tax` 또는 **`/erp/tax`** → `?tab=tax` 리다이렉트(세무) — pill·탭 전환 시 본문만 로딩·콘솔 무오류.

- **콘솔 (#130)**: 위 경로에서 탭·모달·로딩 전환 중 **Minified React error #130** / **Objects are not valid as a React child** 가 **0건**이어야 한다(동적 값은 `safeDisplay`·문자열화 등 표시 경계 준수).
- **네트워크 실패 시**: 요청 실패·타임아웃·오프라인 시 **화면 전체가 백지/크래시하지 않고**, 에러 배너·토스트·재시도 등 **기존 `StandardizedApi`/UI 패턴**으로 복구 가능해야 한다.

### ERP-P4-03 — `ErpFilterToolbar` 도입·정렬·반응형

1. `/erp/financial` — `ErpFilterToolbar`의 필터·**목록 새로고침(무음 조회 포함)** 동작, 좁은 뷰포트에서 툴바가 깨지거나 필수 컨트롤이 사라지지 않는지 확인.
2. `/erp/items` 및 `/erp/budget` — 필터·정렬(또는 동일 역할 컨트롤) 조작 후 목록·요약이 기대대로 갱신되는지 확인.
3. `/erp/refund-management` — 환불 필터(`RefundFilterBlock`/`RefundFilters` 등)와 툴바 연동·무음 조회 버튼 회귀.
4. `/admin/erp/financial` — 통합 대시보드에서 해당 화면에 배치된 필터·툴바가 목록·차트와 **동일 `tenantId`/API 패턴**으로 연동되는지 확인(상단 번호 9~10·15와 동일 기준).
5. `/erp/dashboard` — `ErpFilterToolbar`(또는 동일 역할 컨트롤)가 있으면 필터·**목록 새로고침(무음 조회)**·좁은 뷰포트에서 필수 컨트롤 유지(1~3번·상단 스모크와 중복 시 한쪽만).
6. `/erp/salary`(·`?tab=tax` / `/erp/tax`) — 급여·세무 영역에서 툴바·필터·무음 조회·pill 탭 전환 시 목록·요약 갱신·반응형(11~12번·P4-01 7·9번과 연계).

- **콘솔 (#130)**: 필터 변경·정렬·새로고침 연속 조작 시 **#130 0건**(필터 값·API 필드가 JSX에 객체 그대로 노출되지 않음).
- **네트워크 실패 시**: 필터 적용·새로고침 실패 시에도 **목록 영역·에러 안내**가 일관되고, 무한 로딩·미처리 예외 없이 사용자가 재시도 가능해야 한다.

### 위임 직후 보강 스모크 (2026-04-16) — ERP-P4-03-PAGES-B · ERP-P4-01-MEDIUM

병렬 위임 **ERP-P4-03-PAGES-B**(세무·품목·구매요청·환불필터)·**ERP-P4-01-MEDIUM**(결제수단·급여모달·ERP 위젯) 직후 확인용. 위 **ERP-P4-01**·**ERP-P4-03** 번호 항목·상단 스모크와 **동일 경로·동일 기대**면 **한 번만** 수행한다.

- **세무**: `?tab=tax` / `/erp/tax`(저장소 라우트 기준) — pill·툴바·본문 로딩·#130 0건.
- **품목**: `/erp/items` — `ErpFilterToolbar`·목록 갱신·좁은 뷰포트 필수 컨트롤.
- **구매요청**: 구매요청 화면(`PurchaseRequestForm` 등, `App.js`/`adminRoutes` 기준 경로) — 필터·무음 조회·저장 흐름.
- **환불 필터**: `/erp/refund-management` — `RefundFilterBlock`/`RefundFilters`·툴바·무음 조회 연동.
- **결제수단**: 빌링·결제수단 등록·구독 화면 — 주요 `MGButton`·`tenantId`/API 패턴(상단 17·19번과 겹치면 생략).
- **급여 모달**: 급여·프로필 계열 모달 — 본문만 `UnifiedLoading`·전면 단일 오버레이 없음(P4-01 4·7번과 겹치면 생략).
- **ERP 위젯**: `/erp/dashboard`·관리자 대시보드의 ERP 위젯 — 갱신·버튼·섹션 로딩(P4-01 6번·G8-B13a 경로와 겹치면 생략).

### UI-01 — 관리자 공통 레이아웃(`AdminCommonLayout` 등) 미적용 페이지 정리

1. `AdminCommonLayout`이 주입된 **일반 관리자 경로**(예: `/admin/mapping-management`, `/admin/user-management` 등 `App.js`/`adminRoutes`에 정의된 경로) 1~2곳 — **LNB·본문 폭·스크롤**이 동일 셸 규칙을 따르는지 확인.
2. **의도적 비적용** 페이지 1곳(예: `/admin/integrated-schedule`의 `IntegratedMatchingSchedule`) — SSOT(`ONGOING_WORK_MASTER_PROGRESS_CHECKLIST.md` UI-01 표)에 따라 별도 셸이어도 **이중 헤더·레이아웃 깨짐 없음**.
3. 미적용 정리 대상 후보 1곳(예: 직원·설정 계열) — 레이아웃 적용 후 **헤더·본문·모달**이 콘텐츠 영역 안에서만 스크롤되는지 확인.
4. 권한·`ComingSoon` 분기 경로 — **이중 래핑 제거** 후 빈 화면·잘못된 폭 없이 안내 또는 콘텐츠 표시.

- **콘솔 (#130)**: 레이아웃 전환·LNB 이동·모달 열기 시 **#130 0건**(헤더/푸터·브레드크럼 등에 객체가 직접 렌더되지 않음).
- **네트워크 실패 시**: 페이지 셸은 유지되고, API 실패는 **해당 섹션·토스트**로 한정되며 전역 라우터 크래시가 없어야 한다.

---

변경일: 2026-04-16 (「다음 단계」ERP-P4-01·P4-03 경로 보강; **위임 직후 보강 스모크** P4-03-PAGES-B·P4-01-MEDIUM 한 줄씩 추가; **병렬 완료 배치** ERP-HUB 4·어드민 경로·QuickActions·UI-01-B1/B2/B3·**UI-01-C**·ERP-P4-05-DASH 스모크 25~29·**ERP-P4-05 잔여(DASH-B/C·ERP-A/B)·종합관리 2화면** 스모크 30~31·**ERP-P4-05-REM-ADMIN / REM-CLIENT / REM-MISC** 위임 직후 스모크 **32~37**(웰니스·권한·위젯 대시보드·클라이언트·헤더·태블릿 로그인)·**AdminDashboardV2·레거시 AdminDashboard 「관리 기능」그리드·라벨** 스모크 **38~39**·중복 생략 안내; **TABLET-P4-05**는 **37번**과 병합(별도 번호 없음); 기준 2026-04-15 병렬 게이트 유지)
