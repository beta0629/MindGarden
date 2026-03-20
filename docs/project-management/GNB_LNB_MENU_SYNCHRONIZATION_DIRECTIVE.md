# GNB · LNB 메뉴 동기화 및 카테고리 재정비 — 기획 지휘서

**문서 유형**: core-planner 주관 · 전 에이전트 공통 작업 지시  
**버전**: 1.0.6  
**작성일**: 2026-02-13  
**개정**: 2026-02-13 — quick-action vs LNB 라벨 정합 검사(`verify:quick-action-labels`) 추가
**상태**: 승인 후 실행 (코드 변경은 **core-coder**만 수행)

### 구현 위임 원칙 (필독)

- **GNB/LNB 동기화에 대한 프론트·백엔드 코드 수정은 `core-coder`에게만 위임**한다.
- 기획·디버거·일반 코딩 어시스턴트는 본 문서의 **브리프·체크리스트**를 갱신하거나 회의를 진행할 수 있으나, **`gnbQuickActions.js`·`menuItems.js`·메뉴 API 등 직접 패치하지 않는다.**
- 구현 착수 전: 기획이 **§7 결정 기록**에 SSOT 옵션·카테고리를 기입한 뒤 core-coder에게 티켓을 넘긴다.

---

## 1. 배경·목표

- 사용자 경험: **GNB**(검색·알림·**빠른 액션**·프로필)와 **LNB**(좌측/모바일 드로어 메뉴)가 **다른 URL·다른 명칭**을 가리키면 신뢰가 떨어지고 404·빈 화면이 발생한다.
- 기술 부채: 메뉴 정보가 **여러 소스**에 흩어져 **현행화(동기화)**가 자동으로 되지 않는다.

**목표**

1. **단일 진실 공급원(SSOT)** 에 대해 기획이 결정하고, 구현·DB·폴백이 그에 따름.
2. **카테고리(그룹)** 를 재정비해 역할별 정보 구조가 직관적인지 검증.
3. GNB는 LNB의 “요약 진입” 역할만 하거나, **명시적으로 중복 허용 목록**만 유지.

---

## 2. 현행 구조 (코드 기준, 2026-02-13)

| 구분 | 소스 위치 | 비고 |
|------|-----------|------|
| **LNB (운영 경로)** | API `GET /api/v1/menus/lnb` → 백엔드 `MenuService` | 테넌트·권한 반영 |
| **LNB 폴백** | `frontend/src/components/dashboard-v2/constants/menuItems.js` (`DEFAULT_MENU_ITEMS` 등) | API 실패 시 |
| **GNB 빠른 액션** | `frontend/src/constants/gnbQuickActions.js` | 역할별 **별도 상수** |
| **GNB 로고** | `DesktopGnb` → `ADMIN_ROUTES.DASHBOARD` | 어드민 기준 링크 |
| **알림** | `NotificationDropdown` | 메뉴와 무관 |
| **프로필 드롭다운** | `ProfileDropdown` → `/mypage`, `/settings` | 역할·LNB와 불일치 가능 |

**핵심 리스크**: LNB는 DB, GNB 빠른 액션은 **프론트 하드코딩**이라 배포·DB 변경과 **동기화되지 않음**.

---

## 3. 검증된 경로 불일치·오류 (즉시 수정 후보)

아래는 `App.js` 라우트와 `gnbQuickActions.js` 대조 결과(ADMIN/CLIENT 일부). **기획·테스터가 클릭 검증으로 재확인**할 것.

| 역할 | 빠른 액션 라벨 | `gnbQuickActions.js` 경로 | LNB 폴백 또는 실서비스 경로(참고) | 판단 |
|------|----------------|---------------------------|-----------------------------------|------|
| ADMIN | 사용자 관리 | `/admin/users` | `menuItems.js`: `/admin/user-management` | **불일치** (라우트 미존재 가능성 높음) |
| ADMIN | 시스템 설정 | `/admin/settings` | LNB 자식: `/admin/system-config` | **불일치** (둘 다 존재할 수 있으나 **기획적으로 하나로 통일** 필요) |
| ADMIN | 통계 리포트 | `/admin/reports` | LNB: `/admin/statistics` | **불일치** |
| ADMIN | 백업 관리 | `/admin/backup` | LNB 폴백에 **없음** | **정책 결정** (노출 여부·경로) |
| CLIENT | 상담 예약 | `/client/booking` | `App.js`에 해당 path **미검색** | **오류 가능성 높음** |
| CLIENT | 상담 기록 | `/client/records` | LNB: `/client/session-management` 등 | **불일치** |

CONSULTANT/STAFF는 상대적으로 실제 라우트와 근접하나, **명칭·모달 ID** 는 LNB와 별개로 유지 중.

---

## 4. 카테고리 재정비안 (기획 초안 — 확정 전)

역할 **ADMIN(테넌트 관리자)** 기준 예시. 최종 명칭·순서는 기획 승인.

| 대분류(카테고리) | 포함 LNB 그룹(안) | GNB에서 할 일 |
|------------------|-------------------|---------------|
| **홈·일감** | 대시보드, 통합 스케줄, 상담일지, 알림 | 빠른 액션: 최대 3~5개만, **LNB 1차 메뉴와 동일 path** |
| **사람·권한** | 사용자/권한, 계좌 | 동일 |
| **운영·재무(ERP)** | 운영 현황, 구매, 수입·지출, 예산, 급여, 세무 | ERP는 **한 묶음** 유지 |
| **설정·코드** | 테넌트, 시스템, 공통코드, 패키지, PG | “설정” 하위로 정리 |
| **보고·컴플라이언스** | 통계, 컴플라이언스 | 명칭 통일(“통계 리포트” vs “통계”) |

**원칙**

- GNB 빠른 액션 = **“자주 쓰는 LNB 항목의 복제”** 일 때만 허용, path는 **문자 단위 동일**.
- LNB에 없는 항목을 GNB만 노출 = **기획 명시 + 라우트 존재 증명** 없으면 금지.

---

## 5. SSOT 후보 (기획이 선택)

| 옵션 | 설명 | 장점 | 단점 |
|------|------|------|------|
| **A. DB 일원화** | LNB API 응답에서 `quickAction: true` 플래그로 GNB 노출 | 운영에서 메뉴 편집 시 GNB 자동 반영 | 백엔드·어드민 UI 작업 |
| **B. 프론트 단일 모듈** | `menuItems.js`(또는 `navigation.manifest.js`)에서 LNB 폴백 + GNB 파생 | 구현 단순 | DB 메뉴와 여전히 2갈래면 동기 이슈 잔존 |
| **C. A+B 하이브리드** | 평소 DB, 빌드/폴백은 단일 manifest + CI 검증 스크립트 | 안정성 | 유지보수 규칙 엄격히 |

**기획 지휘**: 릴리즈 일정 내 **한 옵션 확정** → 본 문서 `결정 기록`에 기입.

---

## 6. 전 에이전트 작업 지시 (오케스트레이션)

### Phase 0 — 현행 인벤토리 (병렬, 1~2일)

| 담당 | 산출물 |
|------|--------|
| **core-planner** | 본 문서 §4 카테고리 확정안 v0.2, SSOT 옵션(A/B/C) 선택 |
| **core-component-manager** | “LNB에만 있음 / GNB만 있음 / 둘 다” 중복 맵 1페이지 |
| **core-tester** | 역할별 **빠른 액션 전 항목** 클릭 → 200 여부·실제 화면 표 스프레드시트 |
| **core-debugger** | 404·권한 거부 시 예상 로그 위치 · 재현 순서 |
| **shell** | (선택) 스테이징에서 `menus/lnb` 응답 샘플 JSON 보관 경로 |

### Phase 1 — 설계 동결

| 담당 | 산출물 |
|------|--------|
| **core-planner** | SSOT 결정 + GNB 노출 최대 개수 + 명칭 사전(한글) |
| **core-designer** | 메뉴 깊이·그룹 접기 정책과 시각적 일관(아이콘 중복 최소화) |
| **core-coder** | 구현 태스크 쪼개기·마이그레이션(옵션 A 시) |

### Phase 2 — 구현 (**core-coder 전담**)

| 담당 | 내용 |
|------|------|
| **core-coder** | `gnbQuickActions.js` 경로를 LNB/DB와 정렬 또는 API 연동; `ProfileDropdown` 역할별 목적지 정리 |
| **core-coder** | (옵션 A) Menu 테이블/API 스키마·시드 |
| **shell** | DB 시드·배포 순서 문서 반영 (코더 지시에 따름) |

**금지**: Phase 2 코드 변경을 core-coder 외 역할이 대신 적용하지 않는다.

### Phase 3 — 검증

| 담당 | 내용 |
|------|------|
| **core-tester** | 회귀: 역할×(LNB + GNB 빠른 액션 + 프로필) 매트릭스 전부 통과 |
| **core-debugger** | 롤백 시 메뉴 캐시·세션 영향 여부 |

---

## 7. 결정 기록 (기획 기입)

| 항목 | 내용 |
|------|------|
| 결정일 | |
| SSOT 옵션 | A / B / C |
| 카테고리 확정본 링크 | |
| GNB 빠른 액션 허용 목록 | |

### 7.1 core-coder 병행 반영 로그 (구현 진행 시 기입)

| 일자 | 내용 |
|------|------|
| 2026-02-13 | `gnbQuickActions`: ADMIN→`ADMIN_ROUTES`, CLIENT/STAFF 실경로 정합; `normalizeRoleForQuickActions`(`ROLE_*`·레거시 관리자→ADMIN); `QuickActionsDropdown`→`useSession`으로 역할 변경 시 목록 갱신; `ProfileDropdown`→`useSession`+동일 정규화로 마이페이지·설정 경로 정렬 |
| 2026-02-13 | `frontend`: `npm run verify:quick-action-routes` — 빠른액션·프로필 고정 경로 vs `App.js` |
| 2026-02-13 | `.github/workflows/code-quality-check.yml`에 검증 스텝 추가(PRs·push develop/main) |
| 2026-02-13 | 검증 스크립트가 `menuItems.js`(`DEFAULT/CLIENT/CONSULTANT/ERP`) `to` 경로도 함께 검사 |
| 2026-02-13 | `verify:quick-action-labels` 신설: 동일 path 기준 GNB 빠른액션 라벨 vs LNB 폴백 라벨 정합 검사 |
| (예정) | 기획 SSOT(A/B/C) 확정 후 DB 메뉴 단일화 또는 LNB 폴백·DB diff 스크립트 |

---

## 8. 참조 파일

- `frontend/src/components/dashboard-v2/constants/menuItems.js`
- `frontend/src/constants/gnbQuickActions.js`
- `frontend/src/components/layout/AdminCommonLayout.js`
- `frontend/src/components/dashboard-v2/molecules/QuickActionsDropdown.js`
- `frontend/src/components/dashboard-v2/molecules/ProfileDropdown.js`
- 백엔드: `MenuController`, `MenuService`

---

## 9. 문서 연계

- 운영 배포 스모크에 **메뉴 404 없음** 항목 추가 시: [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) 보완 제안.
- 알림/GNB 정책: [GNB_AND_ADMIN_NOTIFICATION_INTEGRATION_POLICY.md](./GNB_AND_ADMIN_NOTIFICATION_INTEGRATION_POLICY.md) (있는 경우 함께 갱신).

---

## 10. core-coder 구현 브리프 (위임용)

아래는 **기획 확정 전이라도** 안전하게 적용 가능한 **경로 정합** 작업 예시이다. 최종 SSOT·노출 목록은 §7과 합의 후 조정.

| 파일 | 작업 |
|------|------|
| `frontend/src/constants/gnbQuickActions.js` | ADMIN: `ADMIN_ROUTES` import 후 사용자 관리→`USER_MANAGEMENT`, 시스템 설정→`SYSTEM_CONFIG`, 통계→`STATISTICS`; 존재하지 않는 `/admin/backup` 등 제거 또는 기획이 정한 라우트로 교체; `MessageCircle` 등 아이콘은 라벨과 맞출 것 |
| 동일 | CLIENT: `/client/booking`·`/client/records` 등 `App.js`에 없는 path는 LNB(`menuItems.js`)와 동일한 실경로로 교체(예: 일정→`/client/schedule`, 회기→`/client/session-management`) |
| 동일 | STAFF: `App.js`에 `/staff/*` 부재 시, 접근 가능한 관리자 경로로 대체하거나 기획과 함께 항목 축소·빈 배열 — **권한 정합 필수** |
| `frontend/src/components/dashboard-v2/molecules/ProfileDropdown.js` | 역할별 `/mypage`·`/settings`가 LNB·`App.js`와 일치하는지 검토 후 수정 |
| (옵션 A 채택 시) 백엔드 메뉴 | `MenuService`·시드: GNB 빠른 액션 플래그 또는 별도 API |

**검증**: core-tester — 역할별 빠른 액션 전 항목 클릭·LNB 동일 화면 도달 여부.

**상태(2026-02-13)**: §10 표 중 `gnbQuickActions`·`ProfileDropdown`·`QuickActionsDropdown` 병행 반영 완료. SSOT(A/B/C) 및 LNB DB와의 완전 일치는 §7 기획 결정 후 추가 작업.

---

**문서 끝.** 개정 시 `결정 기록`·버전·날짜를 갱신할 것.
