# Admin 모바일 MVP — 자동 스모크 준비 (Task K / O)

**실행 일시:** 2026-05-16 (로컬) · **§6 갱신:** 2026-05-20 (G4+C3 스모크 · `develop` @ `24b901caf` · §6.2 아래) · 이전: 2026-05-18 (`d95768075`, §10.8 **3/3 PASS**)  
**커밋:** 게이트 문서만 — `docs(admin-mvp): §10.8 게이트·§6 d957680 APK·운영 스모크 기록`  
**Task O (2026-05-16):** `npm run test:utils`·`tsc --noEmit` PASS; `app/(admin)` 내 `AdminMobilePlaceholderScreen` 0건  
**JWT SSOT:** `46fe1c0be` — 로그인·복구 시 JWT 역할로 admin/staff 홈 라우팅 · **운영 API (2026-05-18):** `d95768075` — 어드민 운영 탭·STAFF 일정; `test:utils` **36** tests PASS @ §10.8

## 환경

| 항목 | 결과 |
|------|------|
| 디바이스 | `emulator-5554` (`adb devices` → `device`) |
| 패키지 / Activity | `com.mindgardenmobile` / `.MainActivity` |
| APK 경로 | `expo-app/android/app/build/outputs/apk/release/app-release.apk` (~132MB, 2026-05-16 19:57) |
| 재설치 | `cd expo-app && npm run android:apk:install` — 성공 (설치·실행 완료) |
| dev APK 재빌드 | **미실행** (설치 성공, 모듈 resolve 오류 없음) |

## 번들 설정 (`assets/app.config`)

- **`extra.apiBaseUrl`:** `https://dev.core-solution.co.kr` (APK 내 `assets/app.config` 확인)

## Logcat (앱 기동 후 ~30초, 필터 요약)

필터: `error|exception|AdminRoleGate|Unable to resolve` → **매칭 없음**

추가 ReactNativeJS:

- `expo-background-fetch: This library is deprecated. Use expo-background-task instead.` (경고 1건)

**판단:** 치명적 JS 오류·`Unable to resolve`·`AdminRoleGate` 관련 로그 없음.

## 수동 스모크 — 사용자가 할 일

> 저장소에 ADMIN/STAFF 계정·비밀번호를 넣지 않음. 아래는 기기에서 직접 수행.

1. 에뮬레이터(또는 실기기)에서 **MindGarden** 앱이 최신 release APK로 실행 중인지 확인.
2. **ADMIN 또는 STAFF** 권한 계정으로 로그인 (테넌트·자격 증명은 팀 내부 채널 사용).
3. 로그인 후 **관리자 탭/홈** 진입 — `AdminRoleGate`에 의해 비관리자는 차단되는지 확인.
4. MVP 범위 화면 스팟 체크 (테스트 플랜 문서 기준):
   - **홈** — `/(admin)/(home)` 대시·알림·오늘 일정·바로가기 로드
   - **검수** — `/(admin)/(review)` 대기 큐 목록 (ADMIN만; STAFF는 탭 숨김)
   - **운영 허브** — `/(admin)/(operation)` 메뉴 4종 노출 (ADMIN: 스케줄·사용자·기록·마음날씨 / STAFF: 마음날씨 항목 없음)
   - **스케줄** — `/(admin)/(operation)/schedule` 오늘 일정 목록·당겨서 새로고침
   - **사용자** *(Phase 2)* — `/(admin)/(operation)/users` 역할 필터·검색·상세 모달(읽기 전용)
   - **상담일지** *(Phase 2)* — `/(admin)/(operation)/records` 상담사 선택 → 목록 → `records/[id]` 상세
   - **마음날씨** *(Phase 2, ADMIN)* — `/(admin)/(operation)/mind-weather` 요약·카드 목록 (STAFF 진입 시 차단 UX)
   - **메시지** — `/(admin)/(messages)` 웹 어드민 안내·외부 링크 CTA (네이티브 채팅 아님)
   - **더보기** — `/(admin)/(more)` 프로필·알림 설정 `notification-settings`·로그아웃
5. API 호출이 **dev** (`https://dev.core-solution.co.kr`) 로 가는지(환경 배너·네트워크 프록시 등 팀 관례대로) 확인.
6. 이상 시: `adb logcat -c` 후 재현 → `adb logcat -d | grep -iE 'ReactNativeJS|error|AdminRoleGate'` 캡처.

## 참고 명령 (재현)

```bash
adb devices
cd expo-app && npm run android:apk:install
adb shell am start -n com.mindgardenmobile/.MainActivity
adb logcat -d -t 200 | grep -iE 'error|exception|AdminRoleGate|Unable to resolve' | tail -30
unzip -p expo-app/android/app/build/outputs/apk/release/app-release.apk assets/app.config | python3 -c "import sys,json; print(json.load(sys.stdin)['extra']['apiBaseUrl'])"
```

## Phase 2 rebuild (Task N, 2026-05-16)

| 항목 | 결과 |
|------|------|
| 명령 | `cd expo-app && npm run android:apk:dev` |
| 빌드 | **성공** (1회차, Gradle `assembleRelease` ~3m 55s, 총 ~4m) |
| 재시도 | 없음 (Metro resolve·AdminRoleGate 오류 없음) |
| APK | `expo-app/android/app/build/outputs/apk/release/app-release.apk` (~132MB, 20:09) |
| `extra.apiBaseUrl` | `https://dev.core-solution.co.kr` (`unzip -p … assets/app.config` 확인) |
| 설치 | `npm run android:apk:install` → `emulator-5554` **성공** (설치·`MainActivity` 실행) |

관련: `docs/project-management/ADMIN_MOBILE_MVP_TEST_PLAN.md`

## Automated prep run (Task W)

- **일시**: 2026-05-16 (스크립트 `admin-mvp-smoke-prep.sh --force-install`)
- **adb device**: `emulator-5554` (device)
- **APK**: `app-release.apk` ~132M, mtime 20:09:53 — 설치·`MainActivity` 기동 성공
- **apiBaseUrl (APK embedded)**: `https://dev.core-solution.co.kr`
- **logcat (5s, ReactNativeJS|error|AdminRoleGate|Unable to resolve)**: **E 2** (TaskPersister, chromium WebView); AdminRoleGate·Unable to resolve **0**
- **RN 주의**: `(messages)` 라우트 경고 1건; `expo-background-fetch` deprecation 경고
- **prep 결과**: exit 0 — 수동 스모크 체크리스트는 스크립트 출력 기준

## Post-CI smoke prep (Task AP)

- **일시**: 2026-05-17 (`admin-mvp-smoke-prep.sh --force-install`)
- **prep exit**: **1** — `adb devices`에 `device` 없음, 설치·logcat 미실행
- **adb device**: *(none)*
- **apiBaseUrl (로컬 release APK `assets/app.config`)**: `https://dev.core-solution.co.kr`
- **logcat (error|AdminRoleGate|Unable to resolve)**: **N/A** (기기 없어 수집 안 함)
- **다음**: 에뮬레이터/실기기 연결 후 동일 스크립트 재실행

## 6. 빌드·재설치 — admin 로그인 후 client 셸 회귀

> **증상**: ADMIN(또는 STAFF) 계정인데 로그인·복구 후 `/(client)/(home)` 등 **내담자 셸**로 진입. 운영·검수 탭에서 **401/빈 목록** 또는 STAFF **일정 미표시**.  
> **원인**: JWT 라우팅 SSOT·**운영 API** 이전에 빌드된 **구 APK** (`46fe1c0be` 이하) 또는 SecureStore/MMKV·세션에 남은 **이전 역할·토큰**과 `navigateAfterAuth`·`useApiQueryReady`·백엔드 STAFF 스코프 불일치.  
> **기준 수정**: `develop` @ **`d95768075`** (`fix(expo,backend): 어드민 운영 API ready·STAFF 일정 조회`). JWT 홈 라우팅 SSOT는 `46fe1c0be` 유지.

### 6.1 dev APK 재빌드·설치

```bash
cd expo-app
npm run android:apk:dev          # EXPO_PUBLIC_API_BASE_URL=https://dev.core-solution.co.kr
npm run android:apk:install      # adb 기기 1대 — 또는 npm run android:apk:dev:install
# 일괄 준비(선택): ./scripts/admin-mvp-smoke-prep.sh --force-install
```

설치 후 `assets/app.config`의 `extra.apiBaseUrl`이 `https://dev.core-solution.co.kr` 인지 확인 ([§환경](#환경) `unzip -p` 명령 참고).

### 6.2 세션 초기화 (필수)

1. **`d95768075` 기준 dev APK 재빌드·재설치** — §6.1 (`android:apk:dev` → `android:apk:install` 또는 `admin-mvp-smoke-prep.sh --force-install`).
2. 앱 **로그아웃** — admin 스택·persist 히스토리·운영 API 캐시 초기화.
3. **동일 ADMIN/STAFF 계정으로 재로그인** — JWT에서 `role`/`actorRole`·`tenantId` 재동기화.
4. 기대: ADMIN → `/(admin)/(home)`·운영 탭(일정·기록·사용자·마음날씨) 200; STAFF → admin 셸 홈(검수 탭 없음)·**일정** 조회. CONSULTANT/CLIENT 회귀는 [`ADMIN_MOBILE_MVP_TEST_PLAN.md` §5](./ADMIN_MOBILE_MVP_TEST_PLAN.md#5-회귀--상담사내담자-regression) 참고.

**운영·검수 화면 수정 검수 후**에도 §6.1 APK가 최신이면 **로그아웃·재로그인(2–4)** 만으로 충분. client 셸·401 지속 시 `adb shell pm clear com.mindgardenmobile` 후 §6.1·6.2 전체 재실행.

### 6.3 스모크 전 자동 게이트 (로컬)

```bash
cd expo-app && npm run test:utils && npx tsc --noEmit
```

**2026-05-18 @ `d95768075`**: 6 suites, **36** tests PASS; `tsc --noEmit` clean ([`ADMIN_MOBILE_MVP_TEST_PLAN.md` §10.8](./ADMIN_MOBILE_MVP_TEST_PLAN.md#108-admin-mvp-자동-게이트-d95768075-2026-05-18)).

### §6 빌드 기록 (2026-05-18, 운영 API @ `d95768075`)

| 항목 | 값 |
|------|-----|
| **HEAD** | `d95768075` (`fix(expo,backend): 어드민 운영 API ready·STAFF 일정 조회`) |
| **명령** | `cd expo-app && npm run android:apk:dev` → **성공** (Gradle `assembleRelease` 4m 11s) |
| **APK** | `expo-app/android/app/build/outputs/apk/release/app-release.apk` (`app-release.apk`, ~132MB) |
| **빌드 시각** | 2026-05-18 11:07:27 KST |
| **embedded apiBaseUrl** | `https://dev.core-solution.co.kr` |
| **adb 설치** | `cd expo-app && npm run android:apk:install` → `emulator-5554` **성공** |
| **수동 설치** | `adb install -r expo-app/android/app/build/outputs/apk/release/app-release.apk` |
| **smoke prep** | `bash expo-app/scripts/admin-mvp-smoke-prep.sh` → exit **0** (AdminRoleGate·Unable to resolve **0**) |
| **검수 후** | 운영·검수 탭 반영 확인 → **로그아웃·재로그인** (§6.2) |

### §6 빌드 기록 — 이전 (JWT 라우팅 SSOT @ `46fe1c0be`)

| 항목 | 값 |
|------|-----|
| **HEAD** | `46fe1c0be` (`fix(expo): 로그인·복구 시 JWT 역할로 admin/staff 홈 라우팅 SSOT`) |
| **명령** | `cd expo-app && npm run android:apk:dev` → **성공** (Gradle `assembleRelease` 4m 14s) |
| **APK** | `expo-app/android/app/build/outputs/apk/release/app-release.apk` (`app-release.apk`, ~132MB) |
| **빌드 시각** | 2026-05-18 09:19:24 KST |
| **embedded apiBaseUrl** | `https://dev.core-solution.co.kr` |
| **adb 설치** | `cd expo-app && npm run android:apk:install` → `emulator-5554` **성공** |
| **수동 설치** | `adb install -r expo-app/android/app/build/outputs/apk/release/app-release.apk` |
| **smoke prep** | `bash expo-app/scripts/admin-mvp-smoke-prep.sh` → exit **0** (AdminRoleGate·Unable to resolve **0**) |

### §6.2 실행 결과 (2026-05-18, core-tester)

**기준 APK:** `d95768075` 빌드 (`app-release.apk`, mtime 2026-05-18 11:07:27 KST) · **embedded apiBaseUrl:** `https://dev.core-solution.co.kr`

| # | 항목 | 결과 | 일시 (KST) | 비고 |
|---|------|------|------------|------|
| P | `admin-mvp-smoke-prep.sh` | **pass** | 2026-05-18 11:07 | `emulator-5554` device; APK 재설치·MainActivity 기동; logcat 필터 매칭 없음(AdminRoleGate·Unable to resolve) |
| P | `adb devices` | **pass** | 2026-05-18 | `emulator-5554` `device` |
| P | `npm run test:utils` (§6.3) | **pass** | 2026-05-18 | 5 suites, **34** tests |
| S | Maestro `admin-mvp-smoke.yaml` | **skip** | 2026-05-18 | Maestro skipped (no `MAESTRO_*`); CLI 미설치 |
| S | Maestro `admin-mvp-smoke-staff.yaml` | **skip** | 2026-05-18 | 동일 |
| M | §6.2 #1 ADMIN 로그인·홈 | **manual pending** | — | 자격 증명·Maestro 없음; 기대 홈 카피 `안녕하세요` (`ADMIN_MOBILE_HOME_COPY.GREETING`) vs client 셸 구분 미검증 |
| M | §6.2 #2–#5 (검수·STAFF·승인/반려) | **manual pending** | — | Maestro·팀 계정 필요 |
| M | §6.2 #6 CONSULTANT 로그인 | **manual pending** | 2026-05-18 | Maestro 플로우 없음 — `/(consultant)/(home)` 수동 |
| M | §6.2 #7 CLIENT 로그인 | **manual pending** | 2026-05-18 | Maestro 플로우 없음 — `/(client)/(home)` 수동 |
| P | `pm clear` + cold start | **pass** (부분) | 2026-05-18 | 테넌트 선택 화면·`개발 서버 · dev.core-solution.co.kr` 배너 확인; ADMIN 재로그인·JWT 홈 라우팅은 **미실행** |

**JWT 홈 라우팅 (§6.2 #1):** `adb shell pm clear com.mindgardenmobile` 후 앱 기동 → 기관 선택 UI만 확인. ADMIN 재로그인 후 `/(admin)/(home)` vs `/(client)/(home)` 구분은 **팀 계정 또는 `MAESTRO_*` + Maestro CLI** 필요.

**다음 (수동/Maestro):** `export MAESTRO_ADMIN_EMAIL` 등 설정 + [Maestro 설치](https://maestro.mobile.dev/) 후 `maestro test expo-app/.maestro/flows/admin-mvp-smoke.yaml` · STAFF는 `admin-mvp-smoke-staff.yaml`.

### §6.2 게이트 실행 @ `d95768075` (2026-05-18, core-tester)

**기준 HEAD:** `d95768075` · **설치 APK:** `mindgarden-dev-release.apk` (mtime **2026-05-14** 16:31 KST) — §6.1 `android:apk:dev` **미실행**, `app-release.apk` 없음 · embedded `apiBaseUrl` **missing** (prep 출력)

| # | 항목 | 결과 | 일시 (KST) | 비고 |
|---|------|------|------------|------|
| P | `admin-mvp-smoke-prep.sh` | **pass** | 2026-05-18 11:04 | `emulator-5554`; APK 설치 생략(mtime ≤ 캐시); AdminRoleGate·Unable to resolve **0** |
| P | `npm run test:utils` + `tsc --noEmit` (§6.3) | **pass** | 2026-05-18 11:03 | 6 suites, **36** tests; `tsc` clean — [`TEST_PLAN` §10.8](./ADMIN_MOBILE_MVP_TEST_PLAN.md#108-admin-mvp-자동-게이트-d95768075-2026-05-18) |
| P | Maven `ScheduleServiceImplAdminStaffScheduleScopeTest` + `BwAdminContentCommunityMvcSmokeIntegrationTest` | **pass** | 2026-05-18 11:03–11:04 | **10** tests, 0 failures (~81s) |
| S | Maestro `admin-mvp-smoke.yaml` | **skip** | 2026-05-18 11:05 | `MAESTRO_*` 미설정; Maestro CLI 미설치 |
| S | 운영 회귀 — ADMIN 로그인 | **skip** | 2026-05-18 11:05 | 팀 자격 증명 없음; §6.1 `@ d95768075` APK 미빌드·구 APK(2026-05-14) |
| S | 운영 — **사용자 조회** 목록 로딩 종료(스켈레톤 아님) | **skip** | 2026-05-18 11:05 | 동일 — ADMIN 세션·최신 APK 선행 필요 |
| S | 운영 — **스케줄** 빈 상태·목록 표시 | **skip** | 2026-05-18 11:05 | 동일 |
| S | **검수** 탭 로딩 종료(대기 큐·스켈레톤 아님) | **skip** | 2026-05-18 11:05 | 동일 |

**판단:** 자동 게이트(Expo utils·`tsc`·Maven 10) **PASS**. 운영·검수 UI 회귀는 §6.1 APK 재빌드·재설치 + ADMIN 로그인(또는 `MAESTRO_*` + Maestro) 후 재실행. 실패 시 **core-coder** 위임(프로덕션 코드 수정 금지 — core-tester).

### §6.2 실행 결과 (2026-05-20, core-tester · G4+C3 스모크 · 배치 **5/5**)

**기준 HEAD:** `2643b8852` (`develop`) · **설치 APK:** `app-release.apk` (~132MB, mtime **2026-05-19** 02:23:33 KST) · **embedded apiBaseUrl:** `https://dev.core-solution.co.kr`

| # | 항목 | 결과 | 일시 (KST) | 비고 |
|---|------|------|------------|------|
| P | `adb devices` | **pass** | 2026-05-20 | `emulator-5554` `device` |
| P | `admin-mvp-smoke-prep.sh --skip-install` | **pass** | 2026-05-20 | exit **0**; MainActivity; logcat 5s — **매칭 없음** |
| P | `npm run test:utils` + `tsc --noEmit` | **pass** | 2026-05-20 | 33 suites, **192** tests (~45s); `pushNavigation.test.ts` **PASS**; `tsc` **0** errors (~24s) |
| S | Maestro `admin-mvp-smoke.yaml` | **skip** | 2026-05-20 | `which maestro` → not found; `MAESTRO_*` unset |
| S | Maestro `admin-mvp-smoke-staff.yaml` | **skip** | 2026-05-20 | 동일 |
| S | §6.2 #1–#7 · C3 U4 M7–M10 | **skip** | 2026-05-20 | EAS **`cbae858a` queue** — IPA finished 전 human C3-06 착수 금지 |

**Maestro**: 설치·`MAESTRO_*` 템플릿 → [`COMMERCIALIZATION_TEST_REPORT` §6.1.1](./ADMIN_MOBILE_COMMERCIALIZATION_TEST_REPORT.md#611-maestro-설치환경-변수-비밀번호-저장소-금지) · [`expo-app/.maestro/README.md`](../expo-app/.maestro/README.md).

**다음:** EAS **`cbae858a` finished** → §6.5 IPA 체크리스트 · §6.2 #1–#7 + M7–M10 수동.

### §6.2 실행 결과 (2026-05-20, core-tester · G4+C3 스모크 · 배치 3/4)

**기준 HEAD:** `24b901caf` (`develop`) · **설치 APK:** `app-release.apk` (~132MB, mtime **2026-05-19** 02:23:33 KST) · **embedded apiBaseUrl:** `https://dev.core-solution.co.kr`

| # | 항목 | 결과 | 일시 (KST) | 비고 |
|---|------|------|------------|------|
| P | `adb devices` | **pass** | 2026-05-20 22:53 | `emulator-5554` `device` |
| P | `admin-mvp-smoke-prep.sh --force-install` | **pass** | 2026-05-20 22:53 | exit **0**; `android:apk:install`·MainActivity; logcat 5s — AdminRoleGate·Unable to resolve **0**; RN deprecation 1건 |
| P | `npm run test:utils` + `tsc --noEmit` (§6.3) | **pass** | 2026-05-20 22:54 | 33 suites, **192** tests; `tsc` **0** errors |
| S | Maestro `admin-mvp-smoke.yaml` | **skip** | 2026-05-20 | `which maestro` → not found; `MAESTRO_*` unset |
| S | Maestro `admin-mvp-smoke-staff.yaml` | **skip** | 2026-05-20 | 동일 |
| S | §6.2 #1 ADMIN 로그인·홈 | **skip** | 2026-05-20 | 팀 자격 증명 없음 — cold start·테넌트 UI만 prep로 확인 |
| S | §6.2 #2–#5 (검수·승인/반려·STAFF) | **skip** | 2026-05-20 | Maestro·ADMIN 세션 선행 |
| S | §6.2 #6 CONSULTANT | **skip** | 2026-05-20 | Maestro 플로우 없음 |
| S | §6.2 #7 CLIENT | **skip** | 2026-05-20 | Maestro 플로우 없음 |
| S | C3 U4 웹 결제 CTA (`PENDING_PAYMENT` 카드) | **skip** | 2026-05-20 | ADMIN 로그인·매칭 시드 데이터 필요 — §5.4 M7–M9 ([`COMMERCIALIZATION_TEST_REPORT`](./ADMIN_MOBILE_COMMERCIALIZATION_TEST_REPORT.md)) |

**Maestro CLI (미설치 · 설치 가능 여부만):**

- macOS: [Maestro 설치 가이드](https://maestro.mobile.dev/getting-started/installing-maestro) — `curl -Ls "https://get.maestro.mobile.dev" \| bash` 또는 Homebrew `brew tap mobile-dev-inc/tap && brew install maestro`
- 실행 전: `export MAESTRO_ADMIN_EMAIL=… MAESTRO_ADMIN_PASSWORD=…` (저장소에 계정 없음)
- flow: `maestro test expo-app/.maestro/flows/admin-mvp-smoke.yaml` · STAFF: `admin-mvp-smoke-staff.yaml`
- **본 배치:** CLI 없음 → flow **미실행** (문서화만)

**다음:** ADMIN/STAFF 계정으로 §6.2 #1–#7 + C3 U4(웹 Secondary CTA) 수동; Maestro 설치 시 M1–M6 자동화.
