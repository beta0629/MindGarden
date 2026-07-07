# Seq 28 — prod 스모크 검증 체크리스트

**역할**: ADMIN (ERP·어드민 LNB 접근 권한)  
**환경**: prod — `https://mindgarden.core-solution.co.kr`  
**배포 기준**: develop `cb9ca7249` (parallel-4 #506~#522 · dark P1-j~l · G5-02 · G1-02 · header P2) · prior develop `eacb047d5` (#473+#471+#480+#481 28g-p6~p8 · #485+#482 G-14 header · #486 dark C-2) · prod `ef19718e2` (#467 28g-p5 + #470 28g-p5b) · prod FE run `TBD` (deploy queued `28840058342`) · **parallel-4 prod sign-off 없음** · **Phase2 (G-10 BE) 미착수**  
**dev FE (parallel-4)**: run `28853779280` queued · ref develop `cb9ca7249` (#522 dormant-users hotfix merge)  
**선행 (A~D)**: main `37f50830b` · prod FE run `28838028601` — 2026-07-07 sign-off 유지  
**선행 (E)**: 브라우저 개발자 도구 **콘솔·네트워크** 열고 진행. 치명 오류(빨간 스택) 없을 것.

**참조**: [ADMIN_IMPLEMENTATION_PROGRESS_CHECKLIST](../../project-management/2026-06-30/ADMIN_IMPLEMENTATION_PROGRESS_CHECKLIST.md) · [Compact Row 스펙](../../design-system/SCREEN_SPEC_INTEGRATED_SCHEDULE_COMPACT_ROW.md) · [28g Phase 2 Client Pilot 스펙](../../design-system/SCREEN_SPEC_28G_PHASE2_SAVED_VIEW_CLIENT_PILOT.md)

---

## 공통 선행

1. ADMIN 계정으로 로그인 → LNB·GNB 정상 표시.
2. `https://mindgarden.core-solution.co.kr/actuator/health` (또는 동일 테넌트 API 헬스) **200** 확인(선택).
3. 콘솔에 React #130·미처리 예외 없음.

---

## A. 휴면 LNB + 페이지 (Seq **28c** · **28f-lnb**)

| 단계 | 동작 | 기대 결과 | 스크린샷 |
|------|------|-----------|----------|
| A1 | LNB **사용자** 하위에서 **「휴면 사용자」** 메뉴 확인 | 메뉴 노출(`ADM_DORMANT_USERS` · Flyway `V20260706_001`) | LNB 확대(메뉴 라벨·아이콘) |
| A2 | **휴면 사용자** 클릭 | URL `/admin/lifecycle/dormant-users` · 페이지 제목 **「휴면 사용자 관리」** | 전체 화면(헤더+본문) |
| A3 | 레이아웃 확인 | **AdminCommonLayout** — LNB·GNB·본문 이중 헤더·가로 스크롤 깨짐 없음 | LNB+ContentHeader |
| A4 | 목록 로드 | 로딩 후 테이블 또는 빈 상태(「휴면 사용자가 없습니다」) · 네트워크 `GET /api/v1/admin/lifecycle/dormant-users` **2xx** | 목록/빈 상태 |
| A5 | (데이터 있을 때) 행·페이지네이션 | ID·역할·휴면 진입 등 컬럼 표시 · 이전/다음 동작 | 테이블 1페이지 |

**Sign-off 28c + 28f-lnb**

- [x] A1~A5 통과 — 휴면 LNB·페이지·AdminCommonLayout prod OK

---

## B. 통합일정 compact row (Seq **28f**)

경로: `/admin/mapping-management` → 통합일정(좌측 사이드바 380px)

| 단계 | 동작 | 기대 결과 | 스크린샷 |
|------|------|-----------|----------|
| B1 | 최초 진입(또는 시크릿 창) | 사이드바 **Comfortable(기본)** — 여유 카드/로우 · DensityToggle **비활성**(`aria-pressed=false`) | 사이드바 기본 밀도 |
| B2 | DensityToggle **ON** (Compact) | 행 높이 축소(32~36px급) · 이름 말줄임+`title` 툴팁 · 20+ row 시 이름 **완전 소실 없음** | Compact ON 상태 |
| B3 | 토글 **OFF** 복귀 | Comfortable로 즉시 전환 | 토글 OFF |
| B4 | Compact ON → **새로고침** | Compact **유지**(localStorage `useViewModePreference` · pageId `admin.integrated-schedule.sidebar-density`) | 새로고침 후 Compact |
| B5 | 시크릿/다른 브라우저 | 기본 **Comfortable**(토글 OFF만이 기본 정책) | — |

**Sign-off 28f**

- [x] B1~B5 통과 — compact row 토글 ON만·기본 comfortable prod OK

---

## C. viewMode persist (Seq **28b** · **28d** · **28e**)

공통: 보기 전환 후 **F5 새로고침** → 선택한 모드 유지. 다른 탭/화면 설정과 **격리**.

### C1. 사용자 관리 (28b) — `/admin/user-management`

| 탭 | URL | 기본 모드 | 검증 |
|----|-----|-----------|------|
| 내담자 | `?type=client` | smallCard | list/card 전환 → 새로고침 → 유지 |
| 상담사 | `?type=consultant` | list | 동일 |
| 스태프 | `?type=staff` | list | 동일 |

스크린샷: 각 탭에서 전환 **전/후** + 새로고침 **후** (3탭 중 대표 1탭 이상).

### C2. 매칭 관리 (28d) — `/admin/mapping-management`

| 단계 | 동작 | 기대 결과 |
|------|------|-----------|
| C2-1 | 진입 | 기본 **table** |
| C2-2 | **card**로 전환 → 새로고침 | card 유지 |
| C2-3 | **table** 복귀 → 새로고침 | table 유지 |

스크린샷: ViewModeToggle + table/card 각 1장.

### C3. ERP 재무 (28e) — `/erp/financial`

| 단계 | 동작 | 기대 결과 |
|------|------|-----------|
| C3-1 | 거래 목록 영역 진입 | 기본 **table** |
| C3-2 | **card** 전환 → 새로고침 | card 유지 |

스크린샷: 재무 거래 목록 ViewModeToggle.

**Sign-off 28b · 28d · 28e**

- [x] C1 내담자/상담사/스태프 중 **1탭 이상** persist OK
- [x] C2 매칭 table↔card persist OK
- [x] C3 ERP 재무 table↔card persist OK

---

## D. Saved View silent persist (Seq **28g-p2** · **28g-p2b** · **28g-p3** · **28g-p4**)

공통: 필터·viewMode 변경 후 **F5 새로고침** → debounced localStorage persist 복원. save/load UI **없음**(silent).

### D1. 사용자 관리 (28g-p2 · 28g-p2b) — `/admin/user-management`

| 탭 | URL | 검증 |
|----|-----|------|
| 내담자 | `?type=client` | 필터 1개 이상 변경 + viewMode 전환 → 새로고침 → 필터·viewMode 유지 |
| 상담사 | `?type=consultant` | 동일 |
| 스태프 | `?type=staff` | 동일 |

### D2. 매칭 관리 (28g-p3) — `/admin/mapping-management`

| 단계 | 동작 | 기대 결과 |
|------|------|-----------|
| D2-1 | 필터 1개 이상 변경 + table↔card 전환 | 즉시 UI 반영 |
| D2-2 | **F5 새로고침** | 필터·viewMode **유지** |

### D3. ERP 재무 (28g-p4) — `/erp/financial`

| 단계 | 동작 | 기대 결과 |
|------|------|-----------|
| D3-1 | 거래 목록 필터 1개 이상 변경 + table↔card 전환 | 즉시 UI 반영 |
| D3-2 | **F5 새로고침** | 필터·viewMode **유지** · pageId `erp.financial.transactions` |

**Sign-off 28g-p2~p4**

- [x] D1 client/consultant/staff 중 **1탭 이상** saved view F5 restore OK
- [x] D2 매칭 필터+viewMode F5 restore OK
- [x] D3 ERP 재무 필터+viewMode F5 restore OK

---

## E. Saved View named views — Client pilot (Seq **28g-p5** · **28g-p5b**)

경로: `/admin/user-management?type=client` (`ClientComprehensiveManagement`)

### E1. Named view save/load (28g-p5)

| 단계 | 동작 | 기대 결과 | 스크린샷 |
|------|------|-----------|----------|
| E1-1 | 내담자 탭 진입 | `SavedViewControls` — **기본값** Chip 활성(`aria-pressed=true`) · **현재 뷰 저장** 버튼 | saved view row |
| E1-2 | 필터 1개+ viewMode 변경 후 **현재 뷰 저장** | UnifiedModal **「현재 뷰 저장」** · 이름 입력(≤20자) | 모달 |
| E1-3 | 저장 확인 | 새 `SavedViewChip` 렌더 · localStorage `mg.savedView.v1:{tenantId}:{userId}:admin.user-management.client` **배열 스키마 v1** | Chip row |
| E1-4 | 저장 Chip 클릭 | 해당 payload(필터·viewMode) 즉시 반영 · Chip 활성 | Chip ON |
| E1-5 | **기본값** Chip 클릭 | 필터 초기화 · default viewMode 복귀 | 기본값 활성 |
| E1-6 | **F5 새로고침** | active view · payload **유지** | 새로고침 후 |

**Sign-off 28g-p5**

- [ ] E1-1~E6 통과 — Client named view save/load prod OK

### E2. Saved view delete chip (28g-p5b)

| 단계 | 동작 | 기대 결과 | 스크린샷 |
|------|------|-----------|----------|
| E2-1 | 사용자 저장 Chip **dismiss(×)** 확인 | **기본값** Chip에는 dismiss **없음** | dismiss 버튼 |
| E2-2 | dismiss 클릭 | UnifiedModal **「저장된 뷰 삭제」** confirm | confirm 모달 |
| E2-3 | 삭제 confirm | Chip 제거 · active가 삭제 대상이면 **기본값**+payload reset · localStorage 갱신 | Chip row |

**Sign-off 28g-p5b**

- [x] E2-1~E3 통과 — Client saved view delete chip prod OK

---

## F. Saved View named views — Consultant pilot (Seq **28g-p6**)

경로: `/admin/user-management?type=consultant` (`ConsultantComprehensiveManagement`)

### F1. Named view save/load (28g-p6)

| 단계 | 동작 | 기대 결과 | 스크린샷 |
|------|------|-----------|----------|
| F1-1 | 상담사 탭 진입 | `SavedViewControls` — **기본값** Chip 활성(`aria-pressed=true`) · **현재 뷰 저장** 버튼 | saved view row |
| F1-2 | 필터 1개+ viewMode 변경 후 **현재 뷰 저장** | UnifiedModal **「현재 뷰 저장」** · 이름 입력(≤20자) | 모달 |
| F1-3 | 저장 확인 | 새 `SavedViewChip` 렌더 · localStorage `mg.savedView.v1:{tenantId}:{userId}:admin.user-management.consultant` **배열 스키마 v1** | Chip row |
| F1-4 | 저장 Chip 클릭 | 해당 payload(필터·viewMode) 즉시 반영 · Chip 활성 | Chip ON |
| F1-5 | **기본값** Chip 클릭 | 필터 초기화 · default viewMode 복귀 | 기본값 활성 |
| F1-6 | **F5 새로고침** | active view · payload **유지** | 새로고침 후 |

**Sign-off 28g-p6 consultant**

- [ ] F1-1~F6 통과 — Consultant named view save/load OK

### F2. Saved view delete chip (28g-p6)

| 단계 | 동작 | 기대 결과 | 스크린샷 |
|------|------|-----------|----------|
| F2-1 | 사용자 저장 Chip **dismiss(×)** 확인 | **기본값** Chip에는 dismiss **없음** | dismiss 버튼 |
| F2-2 | dismiss 클릭 | UnifiedModal **「저장된 뷰 삭제」** confirm | confirm 모달 |
| F2-3 | 삭제 confirm | Chip 제거 · active가 삭제 대상이면 **기본값**+payload reset · localStorage 갱신 | Chip row |

**Sign-off 28g-p6 consultant delete**

- [ ] F2-1~F3 통과 — Consultant saved view delete chip OK

---

## G. Saved View named views — Staff pilot (Seq **28g-p6**)

경로: `/admin/user-management?type=staff` (`StaffManagement`)

### G1. Named view save/load (28g-p6)

| 단계 | 동작 | 기대 결과 | 스크린샷 |
|------|------|-----------|----------|
| G1-1 | 스태프 탭 진입 | `SavedViewControls` — **기본값** Chip 활성 · **현재 뷰 저장** 버튼 | saved view row |
| G1-2 | 필터 1개+ viewMode 변경 후 **현재 뷰 저장** | UnifiedModal **「현재 뷰 저장」** · 이름 입력(≤20자) | 모달 |
| G1-3 | 저장 확인 | 새 `SavedViewChip` 렌더 · localStorage `mg.savedView.v1:{tenantId}:{userId}:admin.user-management.staff` **배열 스키마 v1** | Chip row |
| G1-4 | 저장 Chip 클릭 | 해당 payload(필터·viewMode) 즉시 반영 · Chip 활성 | Chip ON |
| G1-5 | **기본값** Chip 클릭 | 필터 초기화 · default viewMode 복귀 | 기본값 활성 |
| G1-6 | **F5 새로고침** | active view · payload **유지** | 새로고침 후 |

**Sign-off 28g-p6 staff**

- [ ] G1-1~G6 통과 — Staff named view save/load OK

### G2. Saved view delete chip (28g-p6)

| 단계 | 동작 | 기대 결과 | 스크린샷 |
|------|------|-----------|----------|
| G2-1 | 사용자 저장 Chip **dismiss(×)** 확인 | **기본값** Chip에는 dismiss **없음** | dismiss 버튼 |
| G2-2 | dismiss 클릭 | UnifiedModal **「저장된 뷰 삭제」** confirm | confirm 모달 |
| G2-3 | 삭제 confirm | Chip 제거 · active가 삭제 대상이면 **기본값**+payload reset · localStorage 갱신 | Chip row |

**Sign-off 28g-p6 staff delete**

- [ ] G2-1~G3 통과 — Staff saved view delete chip OK

---

## H. Saved View named views — Mapping list pilot (Seq **28g-p7**)

경로: `/admin/mapping-management` (`MappingListBlock`)

### H1. Named view save/load (28g-p7)

| 단계 | 동작 | 기대 결과 | 스크린샷 |
|------|------|-----------|----------|
| H1-1 | 매칭 관리 목록 영역 진입 | `SavedViewControls` — **기본값** Chip 활성 · **현재 뷰 저장** 버튼 | saved view row |
| H1-2 | 필터 1개+ table↔card 전환 후 **현재 뷰 저장** | UnifiedModal **「현재 뷰 저장」** · 이름 입력(≤20자) | 모달 |
| H1-3 | 저장 확인 | 새 `SavedViewChip` 렌더 · localStorage `mg.savedView.v1:{tenantId}:{userId}:admin.mapping-management.list` **배열 스키마 v1** | Chip row |
| H1-4 | 저장 Chip 클릭 | 해당 payload(필터·viewMode) 즉시 반영 · Chip 활성 | Chip ON |
| H1-5 | **기본값** Chip 클릭 | 필터 초기화 · default viewMode(table) 복귀 | 기본값 활성 |
| H1-6 | **F5 새로고침** | active view · payload **유지** | 새로고침 후 |

**Sign-off 28g-p7 mapping**

- [ ] H1-1~H6 통과 — Mapping named view save/load OK

### H2. Saved view delete chip (28g-p7)

| 단계 | 동작 | 기대 결과 | 스크린샷 |
|------|------|-----------|----------|
| H2-1 | 사용자 저장 Chip **dismiss(×)** 확인 | **기본값** Chip에는 dismiss **없음** | dismiss 버튼 |
| H2-2 | dismiss 클릭 | UnifiedModal **「저장된 뷰 삭제」** confirm | confirm 모달 |
| H2-3 | 삭제 confirm | Chip 제거 · active가 삭제 대상이면 **기본값**+payload reset · localStorage 갱신 | Chip row |

**Sign-off 28g-p7 mapping delete**

- [ ] H2-1~H3 통과 — Mapping saved view delete chip OK

---

## I. Saved View named views — Integrated schedule pilot (Seq **28g-p8a**)

경로: `/admin/mapping-management` → 좌측 통합일정 사이드바 (`IntegratedMatchingSchedule`)

### I1. Named view save/load (28g-p8a)

| 단계 | 동작 | 기대 결과 | 스크린샷 |
|------|------|-----------|----------|
| I1-1 | 통합일정 사이드바 진입 | `SavedViewControls` — **기본값** Chip 활성 · **현재 뷰 저장** 버튼 | saved view row |
| I1-2 | 필터 1개+ density(comfortable↔compact) 변경 후 **현재 뷰 저장** | UnifiedModal **「현재 뷰 저장」** · 이름 입력(≤20자) | 모달 |
| I1-3 | 저장 확인 | 새 `SavedViewChip` 렌더 · localStorage `mg.savedView.v1:{tenantId}:{userId}:admin.integrated-schedule.sidebar` **배열 스키마 v1** | Chip row |
| I1-4 | 저장 Chip 클릭 | 해당 payload(필터·density) 즉시 반영 · Chip 활성 | Chip ON |
| I1-5 | **기본값** Chip 클릭 | 필터 초기화 · default density(comfortable) 복귀 | 기본값 활성 |
| I1-6 | **F5 새로고침** | active view · payload **유지** | 새로고침 후 |

**Sign-off 28g-p8a integrated**

- [ ] I1-1~I6 통과 — Integrated schedule named view save/load OK

### I2. Saved view delete chip (28g-p8a)

| 단계 | 동작 | 기대 결과 | 스크린샷 |
|------|------|-----------|----------|
| I2-1 | 사용자 저장 Chip **dismiss(×)** 확인 | **기본값** Chip에는 dismiss **없음** | dismiss 버튼 |
| I2-2 | dismiss 클릭 | UnifiedModal **「저장된 뷰 삭제」** confirm | confirm 모달 |
| I2-3 | 삭제 confirm | Chip 제거 · active가 삭제 대상이면 **기본값**+payload reset · localStorage 갱신 | Chip row |

**Sign-off 28g-p8a integrated delete**

- [ ] I2-1~I3 통과 — Integrated schedule saved view delete chip OK

---

## J. Saved View named views — ERP Financial pilot (Seq **28g-p8b**)

경로: `/erp/financial` (`FinancialManagement` 거래 목록)

### J1. Named view save/load (28g-p8b)

| 단계 | 동작 | 기대 결과 | 스크린샷 |
|------|------|-----------|----------|
| J1-1 | ERP 재무 거래 목록 진입 | `SavedViewControls` — **기본값** Chip 활성 · **현재 뷰 저장** 버튼 | saved view row |
| J1-2 | 필터 1개+ table↔card 전환 후 **현재 뷰 저장** | UnifiedModal **「현재 뷰 저장」** · 이름 입력(≤20자) | 모달 |
| J1-3 | 저장 확인 | 새 `SavedViewChip` 렌더 · localStorage `mg.savedView.v1:{tenantId}:{userId}:erp.financial.transactions` **배열 스키마 v1** | Chip row |
| J1-4 | 저장 Chip 클릭 | 해당 payload(필터·viewMode) 즉시 반영 · Chip 활성 | Chip ON |
| J1-5 | **기본값** Chip 클릭 | 필터 초기화 · default viewMode(table) 복귀 | 기본값 활성 |
| J1-6 | **F5 새로고침** | active view · payload **유지** | 새로고침 후 |

**Sign-off 28g-p8b ERP**

- [ ] J1-1~J6 통과 — ERP Financial named view save/load OK

### J2. Saved view delete chip (28g-p8b)

| 단계 | 동작 | 기대 결과 | 스크린샷 |
|------|------|-----------|----------|
| J2-1 | 사용자 저장 Chip **dismiss(×)** 확인 | **기본값** Chip에는 dismiss **없음** | dismiss 버튼 |
| J2-2 | dismiss 클릭 | UnifiedModal **「저장된 뷰 삭제」** confirm | confirm 모달 |
| J2-3 | 삭제 confirm | Chip 제거 · active가 삭제 대상이면 **기본값**+payload reset · localStorage 갱신 | Chip row |

**Sign-off 28g-p8b ERP delete**

- [ ] J2-1~J3 통과 — ERP Financial saved view delete chip OK

---

## Jest 게이트 (자동 — prod 수동 전제)

| Suite | 파일 |
|-------|------|
| 휴면 페이지 | `DormantUsersPage.smoke.test.js` |
| viewMode SSOT | `useViewModePreference.test.js` |
| 매칭 SidePeek·persist | `MappingListBlock.sidePeek.test.js` |
| ERP 기본 모드 | `FinancialManagement.defaultViewMode.test.js` |
| Compact 밀도 | `DensityToggle.test.js` · `MatchingScheduleList.compactDensity.test.js` |
| Client saved view UI (28g-p5/p5b) | `clientComprehensiveManagement.savedView.test.js` |
| Consultant/Staff saved view UI (28g-p6) | `consultantComprehensiveManagement.savedView.test.js` · `staffManagement.savedView.test.js` |
| Mapping saved view UI (28g-p7) | `mappingManagement.savedView.test.js` |
| Integrated schedule saved view UI (28g-p8a) | `integratedSchedule.savedView.test.js` |
| ERP Financial saved view UI (28g-p8b) | `financialManagement.savedView.test.js` |

로컬: `cd frontend && CI=true npx craco test --watchAll=false --testPathPattern="DormantUsersPage.smoke|useViewModePreference|MappingListBlock.sidePeek|FinancialManagement.defaultViewMode|DensityToggle|MatchingScheduleList.compactDensity|clientComprehensiveManagement.savedView|consultantComprehensiveManagement.savedView|staffManagement.savedView|mappingManagement.savedView|integratedSchedule.savedView|financialManagement.savedView"`

---

## 최종 sign-off (사용자)

| 항목 | Seq | 완료 |
|------|-----|------|
| 휴면 LNB + AdminCommonLayout 페이지 | 28c · 28f-lnb | [x] |
| 통합일정 compact row (ON만·기본 comfortable) | 28f | [x] |
| viewMode persist (user / mapping / ERP) | 28b · 28d · 28e | [x] |
| Saved View silent persist (client/consultant/staff/mapping/ERP) | 28g-p2~p4 | [x] |
| Saved View named views — client save/load | 28g-p5 | [ ] |
| Saved View client delete chip | 28g-p5b | [x] |
| Saved View named views — consultant | 28g-p6 | [ ] |
| Saved View named views — staff | 28g-p6 | [ ] |
| Saved View named views — mapping list | 28g-p7 | [ ] |
| Saved View named views — integrated schedule | 28g-p8a | [ ] |
| Saved View named views — ERP financial | 28g-p8b | [ ] |

**검수자 / 일자**: 사용자 / 2026-07-07 (A~D · 28g-p5b) · 28g-p5 prod pending · **F~J dev 배포 후 검수 pending** · **parallel-4 (dark P1-j~l · G5-02 · G1-02 · header P2) dev smoke pending** — develop `cb9ca7249` · prod sign-off 없음
