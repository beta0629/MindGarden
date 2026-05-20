# Admin Mobile — 상용화 C2 품질 게이트 테스트 리포트

**작성일**: 2026-05-20  
**작성자**: core-tester (C2 테스터 게이트 · 병렬 배치 **4/4**)  
**Phase**: **C2→C3** — P0 시각·표시 경계 + 결제 웹 CTA (`e52678ab7` 후 재검증)  
**상태**: **CONDITIONAL** — G2 **PASS**; G1·G3·G4 **CONDITIONAL**  
**기준 브랜치**: `develop` @ **`e52678ab7`** (`feat(expo-app): admin 매핑 웹 결제 CTA·G3 표시 경계·푸시 네비게이션`)

---

## SSOT

| 문서 | 용도 |
|------|------|
| [`ADMIN_MOBILE_COMMERCIALIZATION_ORCHESTRATION.md`](./ADMIN_MOBILE_COMMERCIALIZATION_ORCHESTRATION.md) | §7 G1~G4 · §6 디자인 10항 |
| [`ADMIN_MOBILE_MVP_TEST_PLAN.md`](./ADMIN_MOBILE_MVP_TEST_PLAN.md) | §2·§3·§6·§11 |
| [`ADMIN_MOBILE_MVP_SMOKE_RUN.md`](./ADMIN_MOBILE_MVP_SMOKE_RUN.md) | §6.2 수동·Maestro 로그 |
| [`ADMIN_MOBILE_COMMERCIALIZATION_DESIGN_HANDOFF.md`](./ADMIN_MOBILE_COMMERCIALIZATION_DESIGN_HANDOFF.md) | §5 패리티 A(60%) 6항 |

---

## 1. 게이트 종합 (G1~G4)

**종합 판정**: **CONDITIONAL** — G2 **PASS** (`tsc` 0 + `test:utils` 192/192). 상용화 최소선(G1 PASS + G2 PASS + G3 CONDITIONAL+ + G4 PASS) **미충족** — G1·G4 수동·Maestro 잔여.

| 게이트 | 이름 | 판정 | 근거 (2026-05-20 · `e52678ab7` · 배치 **4/4**) |
|--------|------|------|--------------------------------------------------|
| **G1** | 역할·라우팅 | **CONDITIONAL** | 정적·Jest green; §6.2 수동·Maestro **미검** |
| **G2** | 자동·API | **PASS** | `npx tsc --noEmit` **0 errors** (~18s); `npm run test:utils` **33 suites, 192 tests** PASS (~15s) |
| **G3** | 디자인·표시 | **CONDITIONAL** | adminTheme 코드 OK; 패리티·safeDisplay(일정 raw)·디자이너 체크리스트 미완 |
| **G4** | 수동·E2E | **CONDITIONAL** | `admin-mvp-smoke-prep` **PASS** (`emulator-5554`); §5.4 **M7–M10** 웹 CTA **미검** (팀 계정·Maestro 없음); Maestro CLI **skip** |

---

## 2. Top 3 블로커

1. **G4 수동·Maestro 미실행** — §6.2 #1–#7·C3 UAT(U3·**U4 웹 CTA**·U5) **PENDING**; prep·APK **PASS** — 팀 계정·`MAESTRO_*` 또는 §5.4 M2–M10 수동 ([`SMOKE_RUN` §6.2](./ADMIN_MOBILE_MVP_SMOKE_RUN.md)).
2. **G3 패리티·표시 경계 미완** — 디자이너 §5 **6/6 미체크**; `ScheduleCard` raw 필드; `AdminFabActionSheet` 스케줄 허브만.
3. **G1 수동 미검** — ADMIN/STAFF/CONSULTANT/CLIENT 역할·cold start §2.1 **PENDING** (Jest만 green).

**해소됨 (G2)**: ~~`tsc` 5 errors~~ — `AdminMappingPaymentConfirmModal` **삭제**, `(client)/(shop)/index.tsx` FlashList `estimatedItemSize` 제거 → **`tsc` 0 + `test:utils` 192/192 PASS**.

---

## 3. 다음 위임 권고 (3줄)

1. **core-coder (C3)**: `schedule/index` `ScheduleCard`에 `toDisplayString` 적용; `user-management/index` → `AdminFabActionSheet` 마이그레이션 — G3 safeDisplay·C2-07 잔여.
2. **core-tester (C3)**: dev APK 빌드 후 G4 U3(4·5스텝 위저드)·**U4(매칭 카드 웹 Secondary CTA → 통합 스케줄)**·U5 STAFF 검수 없음 수동 스모크; §6.2 #1–#7 병행.
3. **core-coder (C3)**: `pushNavigation.ts`·`NotificationService` 연동 WIP 커밋 후 Jest(`pushNavigation.test.ts`) green 유지 — G2 회귀 없음 확인.

---

## 4. 자동 게이트 실행 (`e52678ab7` · 배치 **4/4** · 2026-05-20)

```bash
cd expo-app && npm run test:utils
cd expo-app && npx tsc --noEmit
bash expo-app/scripts/admin-mvp-smoke-prep.sh
```

| 순서 | 명령 | 결과 | 상세 |
|------|------|------|------|
| 1 | `npm run test:utils` | **PASS** | 33 suites, **192** tests, ~15s |
| 2 | `npx tsc --noEmit` | **PASS** | exit **0** — **0** errors (~18s). `npm run tsc` 스크립트 **없음** — SSOT는 `npx tsc --noEmit` |
| 3 | `admin-mvp-smoke-prep.sh` @ HEAD | **PASS** | `emulator-5554`; APK **132M** (mtime 2026-05-19 02:23 KST); 설치 생략(기존 설치); embedded `apiBaseUrl` `https://dev.core-solution.co.kr`; logcat 필터 **매칭 없음** |

**배치 4**: G2 회귀 **PASS** 유지. G4 prep **PASS**; **M7–M10** 수동·팀 계정 **미실행** → G4 **CONDITIONAL** 유지.

**배치 2 `tsc` 오류 (해소됨 · 참고)**

| 파일 | 건수 | 내용 |
|------|------|------|
| ~~`AdminMappingPaymentConfirmModal.tsx`~~ | ~~4~~ | **파일 삭제** — 웹 CTA로 대체 |
| ~~`(client)/(shop)/index.tsx`~~ | ~~1~~ | `estimatedItemSize` prop **제거** |

**미실행 (본 배치 범위 외)**: `check-hardcoding-enhanced.js` (G3 §17), Maven `BwAdminContentCommunityMvcSmokeIntegrationTest`, Maestro flow (`which maestro` → not found).

---

## 5. G1 / G4 — 미검 항목·재현 절차

출처: [`ADMIN_MOBILE_MVP_TEST_PLAN.md`](./ADMIN_MOBILE_MVP_TEST_PLAN.md) §2.1·§3·§4.2·§5.1·§6.2 · C2 UAT §6(본 리포트).

### 5.1 G1 — 역할·라우팅 (수동)

| ID | 체크리스트 | 재현 절차 |
|----|------------|-----------|
| G1-01 | ADMIN → admin 홈만 | dev APK 설치 → 테넌트 선택 → ADMIN 로그인 → `안녕하세요`·admin 5탭; client/consultant 홈 **아님** 확인 |
| G1-02 | STAFF 검수 탭 없음 | 로그아웃 → STAFF 로그인 → 바텀탭에 **검수 없음**; deep link `/(admin)/(review)` 시 fallback/안내·크래시 없음 |
| G1-03 | CONSULTANT/CLIENT admin 경로 차단 | 각 역할 로그인 후 `/(admin)/(home)` 수동 진입 시도 → 로그인/권한 없음·admin 셸 미노출 |
| G1-04 | Cold start 역할 유지 | `adb shell pm clear com.mindgardenmobile` → 재로그인 전 복구 시나리오 또는 kill 후 재실행 → 동일 역할 홈 |
| G1-05 | 로그아웃 스택 초기화 | admin에서 로그아웃 → `/(auth)/login`; 재로그인 시 이전 admin 스택 없음 |
| G1-06 | 테넌트 A/B PATCH 격리 | (백엔드) 테넌트 A 세션으로 B `postId` PATCH → 404/403 ([`BW4`](./BW4_COMMUNITY_API_SURFACE.md)) |

**Maestro (선택)**: `export MAESTRO_ADMIN_EMAIL=…` → `maestro test expo-app/.maestro/flows/admin-mvp-smoke.yaml` · STAFF는 `admin-mvp-smoke-staff.yaml`. **배치 3/4**: CLI **미설치** (`which maestro` → not found), `MAESTRO_*` **미설정** → **skip** · §5.2 수동 체크리스트만 유효.

### 5.2 G4 — §6.2 스모크 + C2 UAT

| ID | 시나리오 | 재현 절차 | 상태 |
|----|----------|-----------|------|
| G4-01 | §6.2 #1 ADMIN 로그인·홈 | §6.1 `android:apk:dev` @ 최신 HEAD → install → ADMIN 로그인 → dev URL 배너·홈 KPI | **미검** |
| G4-02 | §6.2 #2 검수 큐 | 검수 탭 → 대기 목록 로드(빈/있음) | **미검** |
| G4-03 | §6.2 #3 승인 1건 | 항목 승인 → PATCH `decision:APPROVE` (프록시/logcat) | **미검** |
| G4-04 | §6.2 #4 반려 (선택) | `decision:REJECT` + 사유 UX | **미검** |
| G4-05 | §6.2 #5 STAFF | STAFF 로그인 → 검수 탭 **없음** | **미검** |
| G4-06 | §6.2 #6 CONSULTANT | consultant 홈만; admin URL 불가 | **미검** |
| G4-07 | §6.2 #7 CLIENT | client 홈·커뮤니티 배지 회귀 | **미검** |
| G4-08 | U1 ADMIN 홈 시각 | `/(admin)/(home)` StatCard accent·admin 배경 | **미검** |
| G4-09 | U2 스케줄 허브 | 세그먼트·목록·FAB 시트 | **미검** |
| G4-10 | U3 위저드 | `schedule/create` 4스텝 · `mapping/create` 5스텝 | **미검** |
| G4-11 | U4 결제 **웹 CTA** | Sprint 1c: `PENDING_PAYMENT`/`DEPOSIT_PENDING` 카드 → **「웹에서 결제 확인」/「웹에서 입금 확인」** Secondary → `openAdminWebIntegratedSchedule()` (~~`AdminMappingPaymentConfirmModal`~~ **삭제**) | **미검** (Jest **PASS**: `adminMappingSettlement`·`openAdminWebMappingPayment`) |
| G4-12 | U5 STAFF·웹 CTA | STAFF: 검수 탭 없음; `canManageMappings=false` 시 Primary·웹 CTA **미노출**; ADMIN은 Primary(가예약 일정)+웹 Secondary 병행 | **미검** |

**선행**: [`SMOKE_RUN` §6.1–6.2](./ADMIN_MOBILE_MVP_SMOKE_RUN.md) — C2·운영 API 반영 APK, 로그아웃·재로그인, `MAESTRO_*` 또는 팀 계정.

**Maestro 갭 (문서·코드)**: `admin-mvp-smoke*.yaml` — 홈·검수·운영·사용자 조회 위주; **스케줄·매칭·결제 3단계 flow 없음** (오케스트레이션 §5 기술부채 ③).

### 5.4 G4 — Maestro 수동 대체 (배치 3/4 · CLI skip)

> **2026-05-20:** `admin-mvp-smoke-prep.sh --force-install` **PASS** (`emulator-5554`, `app-release.apk` @ `24b901caf` 트리). `maestro` CLI **미설치** (`which maestro` → not found), `MAESTRO_*` **unset** → Maestro flow **skip**; 아래를 §6.2·**U4/U5** 대체 절차로 사용.

| ID | `admin-mvp-smoke.yaml` 단계 | 수동 재현 |
|----|----------------------------|-----------|
| M1 | `launchApp` | prep 완료 시 생략 가능 — 미실행 시 `cd expo-app && npm run android:apk:install` |
| M2 | `admin-credentials-login` subflow | 테넌트 선택 → ADMIN 로그인 |
| M3 | `assertVisible: '안녕하세요'` | 관리 홈 KPI·인사말 표시 |
| M4 | `assertVisible: '읽지 않은 알림'`·`'오늘 일정'` | 홈 StatCard 영역 |
| M5 | `tapOn: '검수'` → `'커뮤니티 검수'` | 검수 탭·헤더 (STAFF는 탭 **없음** — `admin-mvp-smoke-staff.yaml`) |
| M6 | `tapOn: '운영'` → `'사용자 조회'` | 운영 허브 스크롤·사용자 조회 진입·검색 placeholder |
| M7 | *(Maestro 갭 · U4)* | **운영 → 스케줄** → **매칭** 탭 → `PENDING_PAYMENT` 카드 확인 → **「웹에서 결제 확인」** 탭 → 인앱/외부 브라우저에 **통합 스케줄** URL (`integrated-schedule` 또는 매칭 관리) · **네이티브 결제 모달 없음** |
| M8 | *(U4 · DEPOSIT_PENDING)* | 동일 카드에서 **「웹에서 입금 확인」** Secondary만 노출; 웹에서 `confirm-deposit`·`approve` 완료 후 앱 **당겨서 새로고침** |
| M9 | *(U4 · mapping/create Step 5)* | 5스텝 완료 후 **「웹에서 결제 확인」** Tertiary/Secondary — `mapping/create.tsx` `openAdminWebIntegratedSchedule` |
| M10 | *(U5 · STAFF)* | STAFF 로그인 → 바텀탭 **검수 없음**; 스케줄·매칭 탭에서 `canManageMappings=false` → Primary·웹 CTA **숨김** (ADMIN과 대조) |

**구식 시나리오 (금지):** ~~`PENDING_PAYMENT` → `AdminMappingPaymentConfirmModal` → `confirm-payment` POST~~ — 모달 **삭제**, 결제·입금·승인은 **웹 어드민** SSOT ([`ADMIN_MOBILE_MAPPING_PAYMENT_APPROVAL_ORCHESTRATION.md`](./ADMIN_MOBILE_MAPPING_PAYMENT_APPROVAL_ORCHESTRATION.md) Sprint 1c).

**Maestro 설치 (미실행 · 참고만):**

- macOS: `curl -Ls "https://get.maestro.mobile.dev" | bash` 또는 `brew install maestro` ([가이드](https://maestro.mobile.dev/getting-started/installing-maestro))
- 스케줄·매칭·웹 CTA는 flow **미포함** — M7–M9 수동 필수

**Maestro 설치 후 재실행**:

```bash
export MAESTRO_ADMIN_EMAIL=… MAESTRO_ADMIN_PASSWORD=…
maestro test expo-app/.maestro/flows/admin-mvp-smoke.yaml
maestro test expo-app/.maestro/flows/admin-mvp-smoke-staff.yaml
```

### 5.3 G4 — 검수·API 시나리오 (§4.2)

| 항목 | 재현 | 상태 |
|------|------|------|
| 큐 빈/다건 | 검수 탭 진입·목록 | **미검** |
| 승인 후 피드 노출 | 승인 → community 피드 확인 | **미검** |
| 반려 후 단건 조회 | 반려 → 작성자 단건 API | **미검** |
| 중복 PATCH 4xx | 처리된 `postId` 재 PATCH | **미검** |
| persist buster | admin 로그아웃 → client 재로그인 데이터 오염 없음 | **미검** |

---

## 6. G3 — 문서 vs 코드 갭 (수정 없음 · 보고만)

| 주제 | 문서 (SSOT) | 코드 (WIP HEAD) | 갭 |
|------|-------------|------------------------------|-----|
| **adminTheme** | 오케스트레이션 §3: 「**adminTheme 없음**」, admin/staff → `clientTheme` 폴백 | `tokens.ts` `ADMIN_COLORS`; `admin-theme.ts` `adminTheme`; `resolveThemeForRole` admin/staff → `adminTheme`; Jest `resolveThemeForRole.test.ts` | 문서 **구식** — C1/C2 **코드 완료**, G3는 **디자이너·실기기** 검증 잔여 |
| **패리티 60%** | §6 #6 · 디자인 §5: 6항 중 **≥4** · 핸드오프 §5 **전항 `[ ]`** | 홈 `showAccentBar`, `#3D5246`/`#FAF9F7` 토큰·테스트; 스케줄/등록/결제 **수동 대조 없음** | **정적 ~4/6 추정**, **공식 PASS 없음** → G3 CONDITIONAL |
| **users vs user-management** | §5 P2: `(operation)/users/*` **레거시 파일 잔존** | `user-management/*`만 존재; `users/` 디렉터리 **0**; 허브·create 경로 SSOT `user-management` | **코드 통합 완료**; 문서·`admin-mvp-smoke-prep.sh` 안내(구 `users` 경로) **갱신 필요** |
| **safeDisplay** | §6 #4 · 코더 §6 #9 | messages·mapping 등 적용; `schedule/index` `ScheduleCard` `consultationType`/`status` **raw** | **부분 갭** — #130 실기기 미검 |
| **AdminFabActionSheet** | 코더 §6 #7 · 컴포넌트 감사 | `schedule/index`만 사용; `user-management/index` 인라인 FAB | **CONDITIONAL** (C2-07) |
| **결제 3단계 UI** | 컴포넌트 감사·디자인 핸드오프: `AdminMappingPaymentConfirmModal` | **삭제** — `AdminMappingListCard` **웹 Secondary CTA** (`shouldShowWebPaymentCta`); `AdminMappingDepositConfirmModal` **미연결** | 문서·감사 **갱신 필요** (C3-04) |

---

## 7. C2 정적 검증 요약 (참고)

| ID | 항목 | 정적 판정 |
|----|------|-----------|
| C2-01 | adminTheme·tokens | **PASS** |
| C2-02 | ThemeProvider admin/staff | **PASS** |
| C2-03 | STAFF review 숨김 | **PASS** |
| C2-04 | 44pt | **PASS** (핵심 경로) |
| C2-05 | AdminWizardShell | **PASS** |
| C2-06 | AdminMappingListCard | **PASS** |
| C2-07 | AdminFabActionSheet | **CONDITIONAL** |
| C2-08 | 홈 StatCard accent | **PASS** (정적) |
| C2-09 | 1d 결제 utils | **PASS** (Jest) |

**G3 정적 6항 샘플**: G3-1~G3-5 **STATIC PASS** (코드); G3-6 **STATIC CONDITIONAL** (일정 raw 2필드); 실기기·디자이너 **PENDING**.

---

## 8. Orchestration §7 스냅샷 갱신 제안

| 게이트 | 2026-05-18 (문서) | **2026-05-20 (배치 4/4 · `e52678ab7`)** |
|--------|-------------------|------------------------------------------|
| G1 | CONDITIONAL | **CONDITIONAL** (수동 동일) |
| G2 | PASS (@ `d95768075`) | **PASS** (`tsc` **0**; `test:utils` **192/192**) |
| G3 | CONDITIONAL | **CONDITIONAL** (adminTheme 코드 OK · 패리티·safeDisplay 잔여) |
| G4 | CONDITIONAL | **CONDITIONAL** (prep **PASS**; §5.4 **M7–M10** 웹 CTA **미검** · 팀 계정 없음) |

---

## 9. 변경 이력

| 날짜 | 변경 |
|------|------|
| 2026-05-18 | 초안·C2 재검증 — Jest 18/99, tsc FAIL 4건, G3 STATIC 4/6 |
| 2026-05-20 | **C2 테스터 게이트 1/4** — `develop` `24b901caf`; Jest **31/167** PASS; **tsc 6** FAIL; G1~G4 표·Top3·미검·G3 갭·core-coder 3줄 |
| 2026-05-20 | **C2 테스터 게이트 2/4** — Jest **33/192** PASS; **tsc 5** FAIL (G2 **FAIL 유지**); Maestro CLI·env 없음 → G4 CONDITIONAL; PAYMENT UAT §8 `test:utils` 갱신 연동 |
| 2026-05-20 | **C2 테스터 게이트 3/4** — **G2 PASS** (`tsc` 0); §2 G2 해소·§3 C3 위임 3줄; U4 **웹 CTA**; 오케스트레이션 §7 C3 체크리스트 연동 |
| 2026-05-20 | **G4+C3 스모크 (core-tester)** — `adb`+`admin-mvp-smoke-prep` **PASS**; `test:utils` 192/192·`tsc` 0; Maestro **skip**; §5.4 M7–M10 U4/U5 웹 CTA 수동 절차; [`SMOKE_RUN` §6.2](./ADMIN_MOBILE_MVP_SMOKE_RUN.md) 갱신 |
| 2026-05-20 | **C2 테스터 게이트 4/4** — `e52678ab7`; `test:utils` **192/192**·`npx tsc --noEmit` **0**; `admin-mvp-smoke-prep` **PASS**; G4 **M7–M10** **미검**(팀 계정·Maestro 없음) → **CONDITIONAL** 유지 |
| 2026-05-20 | **배치 4 재실행** — G2 회귀 재확인 (~15s Jest, ~18s tsc); prep **PASS**; M7–M10·Maestro **미변경** |
