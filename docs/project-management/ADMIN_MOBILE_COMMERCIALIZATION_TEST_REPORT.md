# Admin Mobile — 상용화 C2 품질 게이트 테스트 리포트

**작성일**: 2026-05-20  
**작성자**: core-tester (C3 테스터 게이트 · 병렬 배치 **6/6**)  
**Phase**: **C3** — G4 human·iOS IPA **`79fbcd1b`** (human 설치) · C3-06 **PENDING**  
**상태**: **CONDITIONAL** — G2 **PASS**; G1·G3·G4 **CONDITIONAL**  
**기준 브랜치**: `develop` @ **`35765024b`** (문서 HEAD; 코드 SSOT 동일)

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

**종합 판정**: **CONDITIONAL** — G2 **PASS** (`tsc` 0 + `test:utils` **196/196**). 상용화 최소선(G1 PASS + G2 PASS + G3 CONDITIONAL+ + G4 PASS) **미충족** — G1·G4 **human-only** 잔여.

| 게이트 | 이름 | 판정 | 근거 (2026-05-20 · `35765024b` · 배치 **6/6**) |
|--------|------|------|--------------------------------------------------|
| **G1** | 역할·라우팅 | **CONDITIONAL** *(변경 없음)* | 정적·Jest green; §6.2 수동·Maestro **미검** — 팀 ADMIN/STAFF 계정 없음 |
| **G2** | 자동·API | **PASS** | `npx tsc --noEmit` **0 errors** (~5s); `npm run test:utils` **34 suites, 196 tests** PASS (~10s) — **`pushNavigation.test.ts`·`notificationServiceNavigate.test.ts` 포함** |
| **G3** | 디자인·표시 | **CONDITIONAL** *(변경 없음)* | adminTheme 코드 OK; 패리티·safeDisplay(일정 raw)·디자이너 체크리스트 미완 |
| **G4** | 수동·E2E | **CONDITIONAL** *(변경 없음)* | `admin-mvp-smoke-prep` **PASS** (`emulator-5554`); §6.4 **M7–M10** 수동 절차·Pass 기준 **문서화** · 실행 **SKIP**(팀 계정); iOS IPA **`79fbcd1b`** human 설치 가능 · Maestro CLI **skip** |

---

## 2. Top 3 블로커

1. **G4 수동·Maestro 미실행** — §6.2 #1–#7·C3 UAT(U3·**U4 웹 CTA**·U5) **PENDING**; prep·APK **PASS** — 팀 계정·`MAESTRO_*` 또는 §5.4 M2–M10 수동 ([`SMOKE_RUN` §6.2](./ADMIN_MOBILE_MVP_SMOKE_RUN.md)).
2. **G3 패리티·표시 경계 미완** — 디자이너 §5 **6/6 미체크**; `ScheduleCard` raw 필드; `AdminFabActionSheet` 스케줄 허브만.
3. **G1 수동 미검** — ADMIN/STAFF/CONSULTANT/CLIENT 역할·cold start §2.1 **PENDING** (Jest만 green).

**해소됨 (G2)**: ~~`tsc` 5 errors~~ — `AdminMappingPaymentConfirmModal` **삭제**, `(client)/(shop)/index.tsx` FlashList `estimatedItemSize` 제거 → **`tsc` 0 + `test:utils` 192/192 PASS**.

---

## 3. C3-06 / C3-07 상태 (배치 **6/6**)

| ID | 항목 | 판정 | 근거 |
|----|------|------|------|
| **C3-06** | G4 스모크 §6.2 #1–#7 + U3–U5 (U4=웹 CTA M7–M10) | **PENDING** | prep·G2 green; **팀 ADMIN/STAFF**·매칭 시드 없음 → §6.4·§6.5 수동만; iOS IPA **`79fbcd1b`** (human 설치) |
| **C3-07** | `pushNavigation.ts` + Jest · NotificationService | **PASS** | `pushNavigation.test.ts`·`notificationServiceNavigate.test.ts` **PASS**; ADMIN `payment_completed` E2E **비대상** ([`PAYMENT UAT`](./PAYMENT_SCHEDULE_NOTIFICATION_PUSH_UAT_REPORT.md) §8.3) |

## 4. 다음 위임 권고 (3줄)

1. **human**: iOS IPA **`79fbcd1b`**(또는 최신 dev APK) 설치 + 팀 ADMIN/STAFF로 §6.5·§6.4 M7–M10 실행 → Pass 기록.
2. **core-tester (C3)**: G4 U3–**U4 웹 CTA**·U5 + §6.2 #1–#7; Maestro 설치 시 M1–M6 자동 ([§5.1 Maestro](#51-g1--역할라우팅-수동)).
3. **core-coder (C4 병렬)**: G3 `ScheduleCard` safeDisplay·`AdminFabActionSheet` — G4 PASS 전 C4 Dedupe CI 착수 금지 ([`ORCHESTRATION`](./ADMIN_MOBILE_COMMERCIALIZATION_ORCHESTRATION.md) §7).

---

## 5. 자동 게이트 실행 (`35765024b` · 배치 **6/6** · 2026-05-20)

```bash
cd expo-app && npx tsc --noEmit
cd expo-app && npm run test:utils   # pushNavigation + notificationServiceNavigate 포함
bash expo-app/scripts/admin-mvp-smoke-prep.sh --skip-install
```

| 순서 | 명령 | 결과 | 상세 |
|------|------|------|------|
| 1 | `npx tsc --noEmit` | **PASS** | exit **0** — **0** errors (~5s) |
| 2 | `npm run test:utils` | **PASS** | **34** suites, **196** tests, ~10s — includes **`pushNavigation.test.ts`**, **`notificationServiceNavigate.test.ts`** |
| 3 | `admin-mvp-smoke-prep.sh --skip-install` @ HEAD | **PASS** | `emulator-5554`; APK **132M** (mtime 2026-05-19 02:23 KST); embedded `apiBaseUrl` `https://dev.core-solution.co.kr`; logcat 5s — AdminRoleGate·Unable to resolve **0**; RN `registerToken` permission_denied 경고 2건 |

**배치 6**: G2 **196/196** 회귀 **PASS**. G4 prep **PASS**; **M7–M10** 실행 **SKIP** (팀 계정·시드) — §6.4 수동 절차 유효. **R10-B** dev FE+API Playwright **2 passed** (~8s); **R10-A** 로컬 **8080 BLOCKED** (webServer timeout). **§8.5** L1 journal **BLOCKED** · dev health **200** 자동만.

**배치 2 `tsc` 오류 (해소됨 · 참고)**

| 파일 | 건수 | 내용 |
|------|------|------|
| ~~`AdminMappingPaymentConfirmModal.tsx`~~ | ~~4~~ | **파일 삭제** — 웹 CTA로 대체 |
| ~~`(client)/(shop)/index.tsx`~~ | ~~1~~ | `estimatedItemSize` prop **제거** |

**미실행 (본 배치 범위 외)**: `check-hardcoding-enhanced.js` (G3 §17), Maven `BwAdminContentCommunityMvcSmokeIntegrationTest`, Maestro flow (`which maestro` → not found).

---

## 6. G1 / G4 — 미검 항목·재현 절차

출처: [`ADMIN_MOBILE_MVP_TEST_PLAN.md`](./ADMIN_MOBILE_MVP_TEST_PLAN.md) §2.1·§3·§4.2·§5.1·§6.2 · C2 UAT §6(본 리포트).

### 6.1 G1 — 역할·라우팅 (수동)

| ID | 체크리스트 | 재현 절차 |
|----|------------|-----------|
| G1-01 | ADMIN → admin 홈만 | dev APK 설치 → 테넌트 선택 → ADMIN 로그인 → `안녕하세요`·admin 5탭; client/consultant 홈 **아님** 확인 |
| G1-02 | STAFF 검수 탭 없음 | 로그아웃 → STAFF 로그인 → 바텀탭에 **검수 없음**; deep link `/(admin)/(review)` 시 fallback/안내·크래시 없음 |
| G1-03 | CONSULTANT/CLIENT admin 경로 차단 | 각 역할 로그인 후 `/(admin)/(home)` 수동 진입 시도 → 로그인/권한 없음·admin 셸 미노출 |
| G1-04 | Cold start 역할 유지 | `adb shell pm clear com.mindgardenmobile` → 재로그인 전 복구 시나리오 또는 kill 후 재실행 → 동일 역할 홈 |
| G1-05 | 로그아웃 스택 초기화 | admin에서 로그아웃 → `/(auth)/login`; 재로그인 시 이전 admin 스택 없음 |
| G1-06 | 테넌트 A/B PATCH 격리 | (백엔드) 테넌트 A 세션으로 B `postId` PATCH → 404/403 ([`BW4`](./BW4_COMMUNITY_API_SURFACE.md)) |

**Maestro (선택)**: 아래 [§6.1.1 Maestro 설치·환경 변수](#611-maestro-설치환경-변수-비밀번호-저장소-금지) 참고. **배치 5/5**: CLI **미설치** (`which maestro` → not found), `MAESTRO_*` **unset** → **skip** · §6.2 수동 체크리스트만 유효.

#### 6.1.1 Maestro 설치·환경 변수 (비밀번호 저장소 금지)

> SSOT: [`expo-app/.maestro/README.md`](../../expo-app/.maestro/README.md) · **커밋·README에 실제 비밀번호·ADMIN 계정 금지** — 팀 비밀 관리 채널·Maestro Cloud Secrets만.

**설치 (macOS · 본 배치 미실행)**

```bash
# 방법 A — 공식 스크립트
curl -Ls "https://get.maestro.mobile.dev" | bash

# 방법 B — Homebrew
brew tap mobile-dev-inc/tap && brew install maestro

# 확인
which maestro && maestro --version
```

**선행**: `adb devices` · `com.mindgardenmobile` dev release APK ([`admin-mvp-smoke-prep.sh`](../../expo-app/scripts/admin-mvp-smoke-prep.sh) 또는 `npm run android:apk:dev:install`).

**환경 변수 템플릿** (`export` 또는 `maestro test -e KEY=value`)

| 변수 | 필수 | 용도 |
|------|------|------|
| `MAESTRO_ADMIN_EMAIL` | ADMIN flow | 이메일/휴대폰 (로그인 placeholder와 동일) |
| `MAESTRO_ADMIN_PASSWORD` | ADMIN flow | 비밀번호 — **저장소·문서 예시 값 금지** |
| `MAESTRO_STAFF_EMAIL` | STAFF flow | `admin-mvp-smoke-staff.yaml` |
| `MAESTRO_STAFF_PASSWORD` | STAFF flow | STAFF 비밀번호 — **저장소 금지** |
| `MAESTRO_TENANT_SEARCH` | 테넌트 미캐시 시 | 기관 검색어(서브도메인·기관명 일부) |
| `MAESTRO_TENANT_NAME` | 테넌트 미캐시 시 | 목록에서 탭할 **표시 이름** |

```bash
cd expo-app
export MAESTRO_ADMIN_EMAIL='your-admin@example.com'
export MAESTRO_ADMIN_PASSWORD='***'   # 팀 채널에서만 공유
export MAESTRO_TENANT_SEARCH='dev'    # 필요 시
export MAESTRO_TENANT_NAME='Dev Tenant Display Name'  # 필요 시

maestro test .maestro/flows/admin-mvp-smoke.yaml
# STAFF: maestro test .maestro/flows/admin-mvp-smoke-staff.yaml
# (MAESTRO_STAFF_EMAIL / MAESTRO_STAFF_PASSWORD)
```

**한계**: flow는 홈·검수·운영·사용자 조회(M1–M6)만 — **스케줄·매칭·웹 CTA(M7–M10) flow 없음** → U4/U5는 §6.4 수동 필수.

### 6.2 G4 — §6.2 스모크 + C2 UAT

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
| G4-11 | U4 결제 **웹 CTA** | Sprint 1c: `PENDING_PAYMENT`/`DEPOSIT_PENDING` 카드 → **「웹에서 결제 확인」/「웹에서 입금 확인」** Secondary → `openAdminWebIntegratedSchedule()` (~~`AdminMappingPaymentConfirmModal`~~ **삭제**) | **SKIP** (배치 6 — M7–M9; Jest **PASS**) |
| G4-12 | U5 STAFF·웹 CTA | STAFF: 검수 탭 없음; `canManageMappings=false` 시 Primary·웹 CTA **미노출**; ADMIN은 Primary(가예약 일정)+웹 Secondary 병행 | **SKIP** (배치 6 — M10) |

**선행**: [`SMOKE_RUN` §6.1–6.2](./ADMIN_MOBILE_MVP_SMOKE_RUN.md) — C2·운영 API 반영 APK, 로그아웃·재로그인, `MAESTRO_*` 또는 팀 계정.

**Maestro 갭 (문서·코드)**: `admin-mvp-smoke*.yaml` — 홈·검수·운영·사용자 조회 위주; **스케줄·매칭·결제 3단계 flow 없음** (오케스트레이션 §5 기술부채 ③).

### 6.3 G4 — 검수·API 시나리오 (§4.2)

| 항목 | 재현 | 상태 |
|------|------|------|
| 큐 빈/다건 | 검수 탭 진입·목록 | **미검** |
| 승인 후 피드 노출 | 승인 → community 피드 확인 | **미검** |
| 반려 후 단건 조회 | 반려 → 작성자 단건 API | **미검** |
| 중복 PATCH 4xx | 처리된 `postId` 재 PATCH | **미검** |
| persist buster | admin 로그아웃 → client 재로그인 데이터 오염 없음 | **미검** |

### 6.4 G4 — Maestro 수동 대체 (배치 5/5 · CLI skip)

> **2026-05-20 (배치 5):** `admin-mvp-smoke-prep.sh --skip-install` **PASS** (`emulator-5554`, `app-release.apk` @ **`2643b8852`** HEAD). `maestro` CLI **미설치**, `MAESTRO_*` **unset** → Maestro flow **skip**; 아래를 §6.2·**U4/U5** 대체 절차로 사용.

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

Maestro 설치·`MAESTRO_*` 템플릿: [§6.1.1](#611-maestro-설치환경-변수-비밀번호-저장소-금지).

### 6.5 G4 — IPA·human 설치 후 체크리스트 (C3-06)

> **선행**: iOS IPA **`79fbcd1b`** (human 설치) 또는 dev APK @ HEAD + 팀 ADMIN/STAFF 계정. 팀 계정·매칭 시드 없으면 아래는 **수동 절차·Pass 기준만** 적용하고 실행 행은 **SKIP**.

**M7–M10 실행 기록 (배치 6/6 · 팀 계정 없음)**

| ID | Pass 기준 (요약) | 실행 | 결과 |
|----|------------------|------|------|
| **M7** | `PENDING_PAYMENT` 카드 → **「웹에서 결제 확인」** → 통합 스케줄 URL · 네이티브 결제 모달 **없음** | **SKIP** | 팀 ADMIN·매칭 시드 없음 |
| **M8** | `DEPOSIT_PENDING` → **「웹에서 입금 확인」** → 웹 `confirm-deposit` 후 앱 새로고침 | **SKIP** | 동일 |
| **M9** | `mapping/create` 5스텝 후 **「웹에서 결제 확인」** → `openAdminWebIntegratedSchedule` | **SKIP** | 동일 |
| **M10** | STAFF: 검수 탭 없음 · `canManageMappings=false` 시 Primary·웹 CTA **숨김** | **SKIP** | STAFF 계정 없음 |

| 순서 | ID | 작업 | 담당 | Pass 기록 |
|------|-----|------|------|-----------|
| 0 | — | iOS IPA **`79fbcd1b`** 또는 dev APK 설치 · `apiBaseUrl` dev 확인 | human | [ ] |
| 1 | G4-01 | §6.2 #1 ADMIN 로그인·홈·dev URL 배너 | human/tester | [ ] |
| 2 | G4-02–04 | §6.2 #2–#4 검수 큐·승인·(선택) 반려 | human/tester | [ ] |
| 3 | G4-05 | §6.2 #5 STAFF — 검수 탭 **없음** | human/tester | [ ] |
| 4 | G4-08–10 | U1 홈 시각 · U2 스케줄 허브 · U3 4·5스텝 위저드 | human/tester | [ ] |
| 5 | M7–M9 | **U4 웹 CTA** — `PENDING_PAYMENT`/`DEPOSIT_PENDING` → Secondary → 통합 스케줄 URL · 네이티브 결제 모달 **없음** | human/tester | [ ] |
| 6 | M10 | **U5 STAFF** — `canManageMappings=false` 시 Primary·웹 CTA **숨김** | human/tester | [ ] |
| 7 | (선택) | Maestro M1–M6 — [§6.1.1](#611-maestro-설치환경-변수-비밀번호-저장소-금지) | tester | [ ] skip if no CLI |
| 8 | — | 본 문서·[`SMOKE_RUN` §6.2](./ADMIN_MOBILE_MVP_SMOKE_RUN.md) Pass/Fail 기록 → C3-06 **해소** | core-tester | [ ] |

**푸시 UAT (CLIENT · 별도 트랙)**: ADMIN G4와 병렬 가능 — [`PAYMENT_SCHEDULE UAT`](./PAYMENT_SCHEDULE_NOTIFICATION_PUSH_UAT_REPORT.md) §8.5.1 · §8.5 라이브 **NOT RUN** 유지.

### 6.6 G4 **PASS** 전환 조건 (human-only 잔여 시 1표)

| # | 조건 | 담당 | Pass 증빙 |
|---|------|------|-----------|
| 1 | §6.5 표 **순서 0–6** 전항 **PASS** (M7–M10 포함) — 실기기·팀 ADMIN/STAFF | human/tester | 본 문서 §6.5 `[x]` · [`SMOKE_RUN` §6.2](./ADMIN_MOBILE_MVP_SMOKE_RUN.md) G4 행 |
| 2 | §6.2 **G4-01~07** + **G4-08~12** (U1–U5) 수동 **PASS** (또는 합리적 **SKIP** 사유 기록) | human/tester | §6.2 표 상태 열 |
| 3 | (선택) Maestro M1–M6 — CLI·`MAESTRO_*` 있으면 **PASS**; 없으면 **SKIP** 명시 | tester | §6.1.1 |
| 4 | **core-tester**가 §6.2·§6.5·오케스트레이션 **B-C3-06** → **PASS** 갱신 | core-tester | `ADMIN_MOBILE_COMMERCIALIZATION_ORCHESTRATION.md` §7 |
| 5 | G4 게이트 행 본 문서 §1 → **PASS** (G1·G3는 별도 — G4만 human 완료로도 G4 단독 PASS 가능) | core-tester | §1 게이트 표 |

> **G4 PASS ≠ 상용화 GO**: G1 PASS + G2 PASS + G3 CONDITIONAL+ + **G4 PASS** 전체 최소선은 오케스트레이션 §7 유지.

---

## 7. G3 — 문서 vs 코드 갭 (수정 없음 · 보고만)

| 주제 | 문서 (SSOT) | 코드 (WIP HEAD) | 갭 |
|------|-------------|------------------------------|-----|
| **adminTheme** | 오케스트레이션 §3: 「**adminTheme 없음**」, admin/staff → `clientTheme` 폴백 | `tokens.ts` `ADMIN_COLORS`; `admin-theme.ts` `adminTheme`; `resolveThemeForRole` admin/staff → `adminTheme`; Jest `resolveThemeForRole.test.ts` | 문서 **구식** — C1/C2 **코드 완료**, G3는 **디자이너·실기기** 검증 잔여 |
| **패리티 60%** | §6 #6 · 디자인 §5: 6항 중 **≥4** · 핸드오프 §5 **전항 `[ ]`** | 홈 `showAccentBar`, `#3D5246`/`#FAF9F7` 토큰·테스트; 스케줄/등록/결제 **수동 대조 없음** | **정적 ~4/6 추정**, **공식 PASS 없음** → G3 CONDITIONAL |
| **users vs user-management** | §5 P2: `(operation)/users/*` **레거시** | `user-management/*`만 존재; `users/` 디렉터리 **0**; 허브·create 경로 SSOT `user-management` | **코드·스모크 문서 정합** (C4: `admin-mvp-smoke-prep.sh`, `ADMIN_MOBILE_MVP_SMOKE_RUN.md`) |
| **safeDisplay** | §6 #4 · 코더 §6 #9 | messages·mapping 등 적용; `schedule/index` `ScheduleCard` `consultationType`/`status` **raw** | **부분 갭** — #130 실기기 미검 |
| **AdminFabActionSheet** | 코더 §6 #7 · 컴포넌트 감사 | `schedule/index`만 사용; `user-management/index` 인라인 FAB | **CONDITIONAL** (C2-07) |
| **결제 3단계 UI** | 컴포넌트 감사·디자인 핸드오프: `AdminMappingPaymentConfirmModal` | **삭제** — `AdminMappingListCard` **웹 Secondary CTA** (`shouldShowWebPaymentCta`); `AdminMappingDepositConfirmModal` **미연결** | 문서·감사 **갱신 필요** (C3-04) |

---

## 8. C2 정적 검증 요약 (참고)

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

## 9. Orchestration §7 스냅샷 갱신 제안

| 게이트 | 2026-05-18 (문서) | **2026-05-20 (배치 6/6 · `35765024b`)** |
|--------|-------------------|------------------------------------------|
| G1 | CONDITIONAL | **CONDITIONAL** *(변경 없음 — 수동 미검)* |
| G2 | PASS (@ `d95768075`) | **PASS** (`tsc` **0**; `test:utils` **196/196** incl. `pushNavigation`·`notificationServiceNavigate`) |
| G3 | CONDITIONAL | **CONDITIONAL** *(변경 없음)* |
| G4 | CONDITIONAL | **CONDITIONAL** *(prep PASS; M7–M10 **SKIP** — §6.6 human Pass 후 전환)* |

---

## 10. 변경 이력

| 날짜 | 변경 |
|------|------|
| 2026-05-18 | 초안·C2 재검증 — Jest 18/99, tsc FAIL 4건, G3 STATIC 4/6 |
| 2026-05-20 | **C2 테스터 게이트 1/4** — `develop` `24b901caf`; Jest **31/167** PASS; **tsc 6** FAIL; G1~G4 표·Top3·미검·G3 갭·core-coder 3줄 |
| 2026-05-20 | **C2 테스터 게이트 2/4** — Jest **33/192** PASS; **tsc 5** FAIL (G2 **FAIL 유지**); Maestro CLI·env 없음 → G4 CONDITIONAL; PAYMENT UAT §8 `test:utils` 갱신 연동 |
| 2026-05-20 | **C2 테스터 게이트 3/4** — **G2 PASS** (`tsc` 0); §2 G2 해소·§3 C3 위임 3줄; U4 **웹 CTA**; 오케스트레이션 §7 C3 체크리스트 연동 |
| 2026-05-20 | **G4+C3 스모크 (core-tester)** — `adb`+`admin-mvp-smoke-prep` **PASS**; `test:utils` 192/192·`tsc` 0; Maestro **skip**; §5.4 M7–M10 U4/U5 웹 CTA 수동 절차; [`SMOKE_RUN` §6.2](./ADMIN_MOBILE_MVP_SMOKE_RUN.md) 갱신 |
| 2026-05-20 | **C2 테스터 게이트 4/4** — `e52678ab7`; `test:utils` **192/192**·`npx tsc --noEmit` **0**; `admin-mvp-smoke-prep` **PASS**; G4 **M7–M10** **미검**(팀 계정·Maestro 없음) → **CONDITIONAL** 유지 |
| 2026-05-20 | **배치 4 재실행** — G2 회귀 재확인 (~15s Jest, ~18s tsc); prep **PASS**; M7–M10·Maestro **미변경** |
| 2026-05-20 | **C3 테스터 게이트 5/5** — `2643b8852`; `tsc` **0**·`test:utils` **192/192** (`pushNavigation.test.ts`); prep **PASS**; **C3-06 PENDING**·**C3-07 Jest PASS**; §6.1.1 Maestro 설치·`MAESTRO_*` 템플릿; §6.5 IPA finished 후 G4 체크리스트; G1/G4 **CONDITIONAL 유지** |
| 2026-05-20 | **C3 테스터 게이트 6/6** — `35765024b`; `tsc` **0**·`test:utils` **196/196**; prep **PASS**; M7–M10 **SKIP**(팀 계정); R10-B dev **2 passed**; R10-A·로컬 **8080 BLOCKED**; §6.6 G4 PASS 전환 1표; PAYMENT §8.5 dev health **200**·L1 **BLOCKED** |
