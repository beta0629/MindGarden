# Seq 28 — prod 스모크 검증 체크리스트

**역할**: ADMIN (ERP·어드민 LNB 접근 권한)  
**환경**: prod — `https://mindgarden.core-solution.co.kr`  
**배포 기준**: main `b7927be01` · Seq28 batch `061edcc0f` · prod BE run `28788111673` · prod FE run `28788111979`  
**선행**: 브라우저 개발자 도구 **콘솔·네트워크** 열고 진행. 치명 오류(빨간 스택) 없을 것.

**참조**: [ADMIN_IMPLEMENTATION_PROGRESS_CHECKLIST](../../project-management/2026-06-30/ADMIN_IMPLEMENTATION_PROGRESS_CHECKLIST.md) · [Compact Row 스펙](../../design-system/SCREEN_SPEC_INTEGRATED_SCHEDULE_COMPACT_ROW.md)

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

- [ ] A1~A5 통과 — 휴면 LNB·페이지·AdminCommonLayout prod OK

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

- [ ] B1~B5 통과 — compact row 토글 ON만·기본 comfortable prod OK

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

- [ ] C1 내담자/상담사/스태프 중 **1탭 이상** persist OK
- [ ] C2 매칭 table↔card persist OK
- [ ] C3 ERP 재무 table↔card persist OK

---

## Jest 게이트 (자동 — prod 수동 전제)

| Suite | 파일 |
|-------|------|
| 휴면 페이지 | `DormantUsersPage.smoke.test.js` |
| viewMode SSOT | `useViewModePreference.test.js` |
| 매칭 SidePeek·persist | `MappingListBlock.sidePeek.test.js` |
| ERP 기본 모드 | `FinancialManagement.defaultViewMode.test.js` |
| Compact 밀도 | `DensityToggle.test.js` · `MatchingScheduleList.compactDensity.test.js` |

로컬: `cd frontend && CI=true npx craco test --watchAll=false --testPathPattern="DormantUsersPage.smoke|useViewModePreference|MappingListBlock.sidePeek|FinancialManagement.defaultViewMode|DensityToggle|MatchingScheduleList.compactDensity"`

---

## 최종 sign-off (사용자)

| 항목 | Seq | 완료 |
|------|-----|------|
| 휴면 LNB + AdminCommonLayout 페이지 | 28c · 28f-lnb | [ ] |
| 통합일정 compact row (ON만·기본 comfortable) | 28f | [ ] |
| viewMode persist (user / mapping / ERP) | 28b · 28d · 28e | [ ] |

**검수자 / 일자**: _______________
