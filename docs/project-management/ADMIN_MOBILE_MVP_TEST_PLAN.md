# Admin Mobile MVP — 테스트 게이트 계획

**작성일**: 2026-05-16  
**작성자**: core-tester  
**상태**: §10.8 자동 게이트 **3/3 PASS** @ `d95768075` (2026-05-18); §6.2 운영·검수 회귀·Maestro **skip** (APK·자격 증명)  
**기준 기획**: [`EXPO_NATIVE_APP_PLAN.md`](./EXPO_NATIVE_APP_PLAN.md) §2.4 Admin Mobile MVP  
**API 표면**: [`BW4_COMMUNITY_API_SURFACE.md`](./BW4_COMMUNITY_API_SURFACE.md)

---

## 1. 범위·목표

| 항목 | 내용 |
|------|------|
| **대상** | 단일 Expo 앱 내 어드민·스태프 모바일 MVP (`app/(admin)/`, `app/(staff)/` 예정) |
| **목표** | 역할별 셸·라우팅·커뮤니티 검수 API 계약 준수, 상담사·내담자 회귀 없음 |
| **비범위** | ERP·웹 전용 설정·인프라 모니터링, Expo E2E 자동화(별도 TBD) |

---

## 2. 역할 매트릭스 (Role matrix)

로그인 후 `useAuthStore`·JWT·`app/index.tsx` 분기가 아래를 만족해야 한다.

| 역할 | 백엔드 | Expo `role` (예상) | 진입 셸 | 커뮤니티 검수 탭 | 금지 |
|------|--------|-------------------|---------|------------------|------|
| **ADMIN** | `ROLE_ADMIN` / `UserRole.ADMIN` | `admin` | `/(admin)/(home)` | **표시** — `GET/PATCH` admin community API | — |
| **STAFF** | `ROLE_STAFF` / `UserRole.STAFF` | `staff` | `/(staff)/(home)` 또는 admin 셸 내 스태프 IA | **숨김** (검수는 ADMIN 전용, BW-4) | `moderation-queue`, `PATCH .../moderation` 호출 |
| **CONSULTANT** | `ROLE_CONSULTANT` 등 | `consultant` | `/(consultant)/(home)` | 해당 없음 | `/(admin)/*`, `/(staff)/*` 직접 URL·딥링크 |
| **CLIENT** | `ROLE_CLIENT` | `client` | `/(client)/(home)` | 해당 없음 | `/(admin)/*`, `/(staff)/*` 직접 URL·딥링크 |

### 2.1 게이트 체크리스트 — 역할

- [ ] ADMIN 로그인 → `/(admin)/(home)` (또는 기획된 admin 홈)만 노출, client/consultant 홈으로 떨어지지 않음
- [ ] STAFF 로그인 → admin **홈·알림·스케줄 라이트** 등 MVP 탭 접근 가능, **「검수」 탭·화면 라우트 없음** (탭 바·LNB에 항목 없음 + `href` 직접 입력 시 리다이렉트 또는 403 UX)
- [ ] CONSULTANT·CLIENT 로그인 → 기존과 동일하게 `/(consultant)/(home)` / `/(client)/(home)` 만
- [ ] CLIENT·CONSULTANT가 `/(admin)/(home)` 등 admin 경로 수동 진입 시 → 로그인 화면, 역할 홈, 또는 「권한 없음」 처리 (admin 셸 미노출)
- [ ] 루트 `_layout.tsx` `Stack`에 `(admin)`·`(staff)` 등록 후에도 비권한 역할은 스택에 진입하지 않음

### 2.2 백엔드 역할 (통합 테스트 권장)

- [x] `ROLE_STAFF` + 세션 → `GET /api/v1/admin/community/moderation-queue` → **403** *(자동: `BwAdminContentCommunityMvcSmokeIntegrationTest#moderationQueue_whenStaff_returns403`, 2026-05-16)*
- [x] `ROLE_ADMIN` + 세션·`X-Tenant-ID`/테넌트 컨텍스트 → **200** *(자동: 동일 클래스 `#moderationQueue_returns200`)*
- [ ] 테넌트 A 세션으로 테넌트 B `postId` PATCH → **404 또는 403** ([`BW4_COMMUNITY_API_SURFACE.md`](./BW4_COMMUNITY_API_SURFACE.md))

---

## 3. 라우팅·네비게이션

기획: 로그인 성공 → 역할별 홈. Admin MVP Top 8은 §2.4 참고.

### 3.1 진입 분기 (`app/index.tsx` 확장 예정)

| 조건 | 기대 Redirect |
|------|----------------|
| 테넌트 없음 | `/(auth)/tenant-select` |
| 미인증 | `/(auth)/login` |
| `role === 'admin'` | `/(admin)/(home)` |
| `role === 'staff'` | `/(staff)/(home)` *(또는 단일 admin 그룹 + staff 탭 필터 — 구현안과 일치시킬 것)* |
| `role === 'consultant'` | `/(consultant)/(home)` |
| 그 외 (client) | `/(client)/(home)` |

### 3.2 STAFF — 검수 탭 숨김

- [ ] Admin 바텀탭(또는 동등 IA) 정의에 **「커뮤니티 검수」** 항목이 `role === 'admin'` 일 때만 `href`·아이콘·라벨 노출
- [ ] STAFF로 `/(admin)/community-moderation` 등 검수 경로 deep link → 홈·더보기로 fallback 또는 권한 안내 (크래시 없음)
- [ ] ADMIN은 검수 목록·상세·승인/반려 액션까지 E2E 수동 1회 통과

### 3.3 게이트 체크리스트 — 라우팅

- [ ] Cold start(앱 킬 후 재실행) → SecureStore/MMKV 복구 후에도 역할 분기 유지
- [ ] 로그아웃 → `/(auth)/login`, admin 스택 히스토리 초기화
- [ ] `ApiEnvironmentBanner`·dev API URL이 admin API 호출에도 동일 적용

---

## 4. 커뮤니티 검수 API (모바일·백엔드 계약)

웹 어드민 일부는 레거시 `{ status: 'APPROVED'|'REJECTED' }` 를 쓸 수 있으나, **BW-4·Expo MVP는 `decision` 필드만** 사용한다.

| Method | Path | 본문 (PATCH) | 비고 |
|--------|------|--------------|------|
| GET | `/api/v1/admin/community/moderation-queue` | — | `@PreAuthorize("hasRole('ADMIN')")` |
| PATCH | `/api/v1/admin/community/posts/{postId}/moderation` | `{ "decision": "APPROVE" \| "REJECT", "reasonCode?": string, "note?": string }` | **`status` 키 사용 금지** (400/역직렬화 실패) |

DTO: `CommunityModerationPatchRequest` — `decision` enum `APPROVE` | `REJECT`.

### 4.1 Expo 클라이언트 검증 (수동 + 코드 리뷰)

- [x] 검수 승인 요청 JSON에 `"decision":"APPROVE"` 포함 *(자동: `buildCommunityModerationPatchBody` — `useAdminCommunityModeration.ts`, 2026-05-16)*
- [x] 반려 시 `"decision":"REJECT"` 및 선택 `reasonCode`/`note` *(자동: 동일 빌더·`note` optional)*
- [x] 요청 본문에 `"status":"APPROVED"` 등 **없음** (grep·네트워크 로그) *(자동: `expo-app` 전역 grep 0건, admin hooks는 `decision`만)*
- [ ] 응답 `ApiResponse` 형식 (`success`, `data`/`message`) 기존 `client.ts` 패턴과 일치

### 4.2 기능 시나리오

- [ ] 대기 큐 목록 로드 — 빈 목록·N건 목록
- [ ] 승인 후 해당 글이 `GET /api/v1/community` 피드에 노출 (테넌트·승인 상태)
- [ ] 반려 후 작성자 `GET /api/v1/community/{id}` 단건 조회 가능 (BW-4)
- [ ] 이미 처리된 `postId` 재 PATCH → 서비스 규칙에 따른 4xx (에러 메시지 표시)

---

## 5. 회귀 — 상담사·내담자 (Regression)

Admin MVP 머지 전·후 **필수** 스모크. 자동화는 기존 Expo 유닛 + 백엔드 통합, 화면은 수동.

### 5.1 Expo (수동 체크리스트)

| 영역 | CLIENT | CONSULTANT |
|------|--------|------------|
| 홈 | `/(client)/(home)` 로드 | `/(consultant)/(home)` 로드 |
| 커뮤니티 피드 | `/(client)/(more)/community` — 검수 대기 배지·시드/ API 병합 | `/(consultant)/(more)/community` 동일 |
| 마음날씨 | wellness 탭 | inbox·KPI 등 기존 more 플로우 |
| 메시지·알림 | 기존 훅·푸시 시나리오 1건 | 동일 |
| 로그인·테넌트 | tenant-select → login → 홈 | 동일 |

- [x] `npm run test:utils` (Jest) — 4 suites green (`adminRole`, `communityFeedMerge`, `dateFormat`, `resolveTenantIdForApi`), 24 tests *(2026-05-16; Task O 재확인)*
- [ ] Admin/STAFF 계정으로 로그인해도 consultant/client **스토어 persist buster**가 타 역할 데이터를 오염시키지 않음 (로그아웃 후 client 재로그인)

### 5.2 백엔드 (기존 스위트)

- [ ] `ConsultantSessionStatisticsControllerIntegrationTest` *(본 게이트 실행 범위 외)*
- [ ] `MindWeatherControllerInboxIntegrationTest` *(본 게이트 실행 범위 외)*
- [x] `BwAdminContentCommunityMvcSmokeIntegrationTest` — 7 tests green: queue 200, STAFF queue **403**, PATCH `decision` 200, PATCH `status` **400**, 명상 목록 등 *(2026-05-16)*

---

## 6. Android Dev APK — 수동 스모크 절차

> **2026-05-18 게이트**: `develop` @ **`d95768075`** — 운영 API·STAFF 일정 반영 후 **dev APK 재빌드·재설치** 필수 (`npm run android:apk:dev` → `android:apk:install`). 이전 @ `46fe1c0be` APK는 prep·`pm clear`만 완료 — §6.2 #1–#7·Maestro **수동·Maestro 대기** ([`SMOKE_RUN` §6](./ADMIN_MOBILE_MVP_SMOKE_RUN.md#6-빌드재설치--admin-로그인-후-client-셸-회귀)). 운영·검수 탭 수정 검수 후 **로그아웃·재로그인** 필수.

Dev API가 번들에 박힌 **release APK** 기준 ([`expo-app/scripts/build-android-apk-dev.sh`](../expo-app/scripts/build-android-apk-dev.sh)).

### 6.1 빌드·설치

```bash
cd expo-app
npm run android:apk:dev          # EXPO_PUBLIC_API_BASE_URL=https://dev.core-solution.co.kr
npm run android:apk:install      # adb 기기 1대 연결
# 또는 일괄: npm run android:apk:dev:install
```

선택: Metro 개발 시 `npm run dev:android` + `npm run adb:reverse-metro` (APK 스모크와 별도).

### 6.2 스모크 시나리오 (기기 1대, dev 테넌트)

| # | 단계 | 기대 결과 | 2026-05-18 @ `46fe1c0be` |
|---|------|-----------|---------------------------|
| 1 | ADMIN 계정 로그인 | Admin 홈, API 배너에 dev URL | [ ] manual pending (Maestro skip: no `MAESTRO_*`) |
| 2 | 검수 탭 → 대기 목록 | 200, 목록 UI (빈/있음) | [ ] manual pending |
| 3 | 항목 1건 승인 | PATCH body에 `decision:APPROVE`; 성공 토스트/목록 갱신 | [ ] manual pending |
| 4 | (선택) 반려 1건 | `decision:REJECT`; 사유 입력 UX | [ ] manual pending |
| 5 | 로그아웃 → STAFF 로그인 | 검수 탭 **없음** | [ ] manual pending (Maestro skip) |
| 6 | 로그아웃 → CONSULTANT 로그인 | `/(consultant)/(home)`, admin URL 불가 | [ ] manual pending (플로우 없음) |
| 7 | CLIENT 로그인 | 커뮤니티 피드·검수 대기 배지 기존 동작 | [ ] manual pending (플로우 없음) |

**§6.1 자동 prep (동일 일자):** [x] `admin-mvp-smoke-prep.sh` exit 0 · [x] `adb devices` · [x] `npm run test:utils` 34 tests · [x] `pm clear` 후 테넌트 선택·dev 배너 (ADMIN 홈 `안녕하세요` assert는 미실행)

### 6.3 실패 시 수집

- [ ] `adb logcat` React Native/axios 에러
- [ ] 요청 URL·본문(JSON) — **`decision` vs `status` 혼동 여부**
- [ ] `ApiEnvironmentBanner` 표시 base URL

---

## 7. 자동화 계층

### 7.1 Expo

| 유형 | 상태 | 비고 |
|------|------|------|
| Jest 유닛 (`src/utils/__tests__`) | **유지** | Admin 전용 스텁 **추가 안 함** (진행 중 `app/(admin)/` 와 충돌 방지) |
| `@testing-library/react-native` 화면 테스트 | 없음 | — |
| Maestro / Detox E2E | **초안 있음** (`expo-app/.maestro/flows/admin-mvp-smoke*.yaml`) | 2026-05-18 실행 **skip** — `MAESTRO_*` 미설정·CLI 미설치; [`SMOKE_RUN` §6.2](./ADMIN_MOBILE_MVP_SMOKE_RUN.md#62-실행-결과-2026-05-18-core-tester) |

> **결론**: repo convention상 expo-app 통합/E2E 패턴 미성숙 → **문서·수동 게이트만**. 코더 완료 후 `core-tester`가 Maestro 시나리오 초안을 별도 태스크로 제안 가능.

### 7.2 백엔드 Java

`AdminCommunityModerationControllerIntegrationTest` **파일은 없음**. 기존 스모크:

- **파일**: `src/test/java/com/coresolution/consultation/integration/BwAdminContentCommunityMvcSmokeIntegrationTest.java`
- **이미 있음**: GET moderation-queue 200, PATCH with `{"decision":"APPROVE"}` 200

**권장 추가 케이스** (동일 클래스 또는 신규 `AdminCommunityModerationControllerIntegrationTest.java`):

| @DisplayName (예) | 검증 | 게이트 |
|-------------------|------|--------|
| STAFF가 moderation-queue GET | 403 | ✅ 2026-05-16 |
| PATCH 본문 `{"status":"APPROVED"}` | 400 (validation) — **`decision` 아님** | ✅ 2026-05-16 |
| PATCH `{"decision":"REJECT","note":"..."}` | 200 + `moderatePost` 호출 |
| CLIENT가 moderation-queue GET | 403 |
| `@WithMockUser(roles={"ADMIN"})` 없이 PATCH | 403 |

DB 연동·감사 필드(`moderated_at`, `moderated_by_user_id`)는 `CommunityServiceImpl` 단위 또는 `@DataJpaTest` 확장 시 [`BW4_COMMUNITY_API_SURFACE.md`](./BW4_COMMUNITY_API_SURFACE.md) bullet 참고.

### 7.3 실행 명령 (게이트 전)

```bash
# 백엔드 — BW admin community 스모크만
mvn -q test -Dtest=BwAdminContentCommunityMvcSmokeIntegrationTest

# Expo 유닛
cd expo-app && npm run test:utils
```

---

## 8. 완료 정의 (Definition of Done)

- [ ] §2 역할 매트릭스·§3 라우팅·§4 API 계약 체크리스트 **전항목** 통과 (수동+자동 가능분)
- [ ] §5 consultant/client 회귀 수동 스모크 + `test:utils` green
- [ ] §6 Android dev APK ADMIN/STAFF/CONSULTANT/CLIENT 4역할 스모크 1회 이상 *(2026-05-18: prep·cold start만; #1–#7 manual/Maestro 대기)*
- [x] §7.2 백엔드 STAFF 403·`status` 본문 400 케이스 — `BwAdminContentCommunityMvcSmokeIntegrationTest` *(2026-05-16)*
- [ ] `core-coder` 구현 PR과 본 문서 버전·경로 링크를 PR 설명에 기재

### 8.1 자동 게이트 (Phase 2 — Task O, 2026-05-16)

- [x] `cd expo-app && npm run test:utils` — **PASS** (4 suites, 24 tests)
- [x] `cd expo-app && npx tsc --noEmit` — **PASS**
- [x] `app/(admin)` grep `AdminMobilePlaceholderScreen` — **0건** (컴포넌트 정의 파일만 `src/components/organisms/`에 존재)
- [x] MVP Top 8 라우트 파일 존재·플레이스홀더 컴포넌트 미사용 — 홈·검수·운영 허브·스케줄·기록·사용자·마음날씨·더보기 구현 화면; **메시지**는 웹 어드민 안내(`AdminMessagesScreen` + `Linking`)로 예외 허용

---

## 9. 참고 링크

| 문서·코드 | 용도 |
|-----------|------|
| `EXPO_NATIVE_APP_PLAN.md` §2.4 | MVP Top 8·Phase 2·분배 |
| `BW4_COMMUNITY_API_SURFACE.md` | 공개/어드민 API·테넌트·역할 bullet |
| `AdminCommunityModerationController.java` | GET queue, PATCH moderation |
| `CommunityModerationPatchRequest.java` | `decision` SSOT |
| `BwAdminContentCommunityMvcSmokeIntegrationTest.java` | 기존 MockMvc 스모크 |
| `frontend/.../buildCommunityModerationPatchBody` | 웹은 `status` — **모바일과 혼동 주의** |

---

## 10. Gate run log

| 항목 | 값 |
|------|-----|
| **날짜** | 2026-05-16 |
| **실행** | core-tester Task F (Admin MVP test gate) |

### 10.1 명령·결과 요약

| # | 명령 | 결과 |
|---|------|------|
| 1 | `cd expo-app && npm run test:utils` | **PASS** — 4 suites, 22 tests, ~3.6s |
| 2 | `expo-app` grep `"status":"APPROVED"` (admin hooks·PATCH) | **PASS** — 0건; PATCH는 `buildCommunityModerationPatchBody` → `{ decision }` only |
| 3 | `mvn -q -Dtest=BwAdminContentCommunityMvcSmokeIntegrationTest test` | **PASS** — 7 tests (STAFF GET 403, legacy `status` PATCH 400 포함) |
| 4 | `./mvnw` | N/A — 저장소에 Unix `mvnw` 없음 (`mvnw.cmd`만); 시스템 `mvn` 사용 |

### 10.2 자동화로 닫지 않은 항목

- §2.1·§3·§4.2·§5.1 수동 표 — 역할 로그인·라우팅·검수 UI·회귀 스모크
- §6 Android dev APK — **prep 완료** (2026-05-18 `emulator-5554`); §6.2 #1–#7 역할 스모크 **manual/Maestro 대기**

### 10.3 Task L — §5.2 백엔드 회귀 + 재실행 (2026-05-16)

| 항목 | 값 |
|------|-----|
| **날짜** | 2026-05-16 |
| **실행** | core-tester Task L (Admin MVP regression) |
| **환경** | macOS, 시스템 `mvn`, `expo-app` Jest (`jest.config.cjs`) |

| # | 명령 | 결과 | 소요 (wall) | 비고 |
|---|------|------|-------------|------|
| 1 | `mvn -q -Dtest=ConsultantSessionStatisticsControllerIntegrationTest test` | **PASS** | ~16.2s | 4 tests, 0 failures (Surefire) |
| 2 | `mvn -q -Dtest=MindWeatherControllerInboxIntegrationTest test` | **PASS** | ~18.1s | 3 tests, 0 failures (Surefire) |
| 3 | `cd expo-app && npm run test:utils` | **PASS** | ~3.3s | 4 suites, 24 tests |
| 4 | `mvn -q -Dtest=BwAdminContentCommunityMvcSmokeIntegrationTest test` | **PASS** | ~17.9s | 7 tests, 0 failures (Surefire; STAFF 403·legacy `status` PATCH 400 포함) |

**§5.2 백엔드 자동 게이트**: 위 #1·#2로 `ConsultantSessionStatistics*` / `MindWeather*` 통합 테스트 **완료**. 실패 없음 — 프로덕션·Expo 코드 변경 없음.

### 10.4 Task O — Phase 2 화면 인벤토리 + 자동 재실행 (2026-05-16)

| 항목 | 값 |
|------|-----|
| **날짜** | 2026-05-16 |
| **실행** | core-tester Task O (Admin MVP final audit) |
| **범위** | read-only — `app/(admin)/` 화면·문서만 |

| # | 명령·검사 | 결과 |
|---|-----------|------|
| 1 | `cd expo-app && npm run test:utils` | **PASS** — 4 suites, 24 tests (~3.9s) |
| 2 | `cd expo-app && npx tsc --noEmit` | **PASS** |
| 3 | grep `AdminMobilePlaceholderScreen` under `expo-app/app/(admin)` | **0건** |
| 4 | MVP Top 8 파일 존재 | **PASS** — `(home)/index`, `(review)/index`, `(messages)/index`, `(operation)/index`, `schedule`, `records/index`, `users`, `mind-weather`, `(more)/index` |

**미완 (수동)**: §2·§3 역할·라우팅, §4.2 검수 UI 시나리오, §6.2 #1–#7 (Maestro·팀 계정).

### 10.5 Local CI repro (Task AG)

**2026-05-17** · `develop` HEAD (local) · `code-quality-check.yml` 3게이트 · core-tester Task AG

| # | 명령 | exit | 결과 |
|---|------|------|------|
| 1 | `node scripts/design-system/css-tools/check-hardcoding-enhanced.js` | **0** | 오류 0, 경고 5449 (repo). **expo-app 위반 0** — 첫 expo 위반 N/A |
| 2 | `cd expo-app && npm run test:utils && npx tsc --noEmit` | **0** | PASS — 4 suites, 24 tests; `tsc --noEmit` clean |
| 3 | `mvn -q -Dtest=BwAdminContentCommunityMvcSmokeIntegrationTest test` | **0** | PASS (~18.8s wall) |

**3/3 PASS** — read-only; 프로덕션·Expo 코드 변경 없음.

### 10.6 Full mvn test (Task AN)

**2026-05-17** · `develop` HEAD `cb4bf8b57` (≥ `720c835c8`) · core-tester Task AN

**PASS** — `mvn -q test -Dspring.profiles.active=test` exit 0, ~11.2m wall; Surefire 816 run / 0 failures / 0 errors / 45 skipped (179 classes; includes `PlSqlSalaryManagementServiceImplSpecialSupportBranchTest`, `BwAdminContentCommunityMvcSmokeIntegrationTest`, `ConsultantSessionStatisticsControllerIntegrationTest`, `MindWeatherControllerInboxIntegrationTest`).

### 10.7 Admin MVP 자동 게이트 재실행 @ `46fe1c0be` (2026-05-18)

| 항목 | 값 |
|------|-----|
| **Task ID** | Admin MVP 자동 게이트 재실행 @ `46fe1c0be` |
| **날짜** | 2026-05-18 |
| **브랜치** | `develop` |
| **SHA** | `46fe1c0be` — `fix(expo): 로그인·복구 시 JWT 역할로 admin/staff 홈 라우팅 SSOT` |
| **실행** | core-tester (read-only; 프로덕션·Expo 코드 변경 없음) |
| **환경** | macOS, 시스템 `mvn`, `expo-app` Jest (`jest.config.cjs`) |

| # | 명령 | exit | 결과 | wall |
|---|------|------|------|------|
| 1 | `cd expo-app && npm run test:utils` | **0** | **PASS** — 5 suites, **34** tests (`adminRole`·`navigateAfterAuth`·`resolveTenantIdForApi`·`communityFeedMerge`·`dateFormat`) | ~5.4s |
| 2 | `cd expo-app && npx tsc --noEmit` | **0** | **PASS** — 타입 오류 없음 | ~4.7s |
| 3 | `mvn -q -Dtest=BwAdminContentCommunityMvcSmokeIntegrationTest test` | **0** | **PASS** — 7 tests, 0 failures (STAFF GET 403, legacy `status` PATCH 400 포함) | ~73s |
| 4 | `mvn -q test -Dspring.profiles.active=test` *(optional)* | **0** | **PASS** — Surefire **816** run / 0 failures / 0 errors / 45 skipped | ~12.0m |

**4/4 PASS** — §6 APK prep·`pm clear` cold start는 2026-05-18 [`SMOKE_RUN` §6.2](./ADMIN_MOBILE_MVP_SMOKE_RUN.md#62-실행-결과-2026-05-18-core-tester); §6.2 #1–#7·Maestro는 **manual/Maestro 대기**. 수동 잔여: §2·§3 — [`ADMIN_MOBILE_MVP_SMOKE_RUN.md` §6](./ADMIN_MOBILE_MVP_SMOKE_RUN.md#6-빌드재설치--admin-로그인-후-client-셸-회귀) (구 APK·캐시된 역할 시 **APK 재설치 + 로그아웃 후 재로그인** 필수).

### 10.8 Admin MVP 자동 게이트 @ `d95768075` (2026-05-18)

| 항목 | 값 |
|------|-----|
| **Task ID** | Admin MVP 자동 게이트 @ `d95768075` (운영 API ready·STAFF 일정) |
| **날짜** | 2026-05-18 |
| **브랜치** | `develop` |
| **SHA** | `d95768075` — `fix(expo,backend): 어드민 운영 API ready·STAFF 일정 조회` |
| **실행** | core-tester (게이트 @ `d95768075`; read-only, 프로덕션·Expo 코드 변경 없음) |
| **범위** | 어드민 운영 탭 API 연동(`useApiQueryReady`·스케줄/기록/사용자/마음날씨), 백엔드 `ScheduleServiceImpl` STAFF 일정 조회 스코프 |

| # | 명령 | exit | 결과 | wall |
|---|------|------|------|------|
| 1 | `cd expo-app && npm run test:utils` | **0** | **PASS** — 6 suites, **36** tests (`adminRole`·`navigateAfterAuth`·`jwtPayload`·`resolveTenantIdForApi`·`communityFeedMerge`·`dateFormat`) | ~3.6s |
| 2 | `cd expo-app && npx tsc --noEmit` | **0** | **PASS** — 타입 오류 없음 | ~11s (연속 실행) |
| 3 | `mvn -q -Dtest=ScheduleServiceImplAdminStaffScheduleScopeTest,BwAdminContentCommunityMvcSmokeIntegrationTest test` | **0** | **PASS** — **10** tests, 0 failures (`ScheduleServiceImpl` STAFF·ADMIN·CLIENT 스코프 **3** + BW admin community MockMvc **7**) | ~81s |

**3/3 PASS** — §6 Android dev APK는 **`d95768075` 기준 재빌드·재설치 필수** ([`SMOKE_RUN` §6](./ADMIN_MOBILE_MVP_SMOKE_RUN.md#6-빌드재설치--admin-로그인-후-client-셸-회귀)·운영·검수 화면 수정 반영 후 **로그아웃·재로그인**으로 JWT·tenant 재동기화. §6.2 운영·검수 회귀 스모크·Maestro는 [`SMOKE_RUN` §6.2 @ `d95768075`](./ADMIN_MOBILE_MVP_SMOKE_RUN.md#62-게이트-실행--d95768075-2026-05-18-core-tester) (**skip** — §6.1 APK 미빌드·`MAESTRO_*` 없음).

---

## 11. 상용화 품질 게이트 G1~G4 (부록)

MVP 자동 게이트(§10)는 **G2**에 해당한다. **상용화 릴리스** 판정은 [`ADMIN_MOBILE_COMMERCIALIZATION_ORCHESTRATION.md`](./ADMIN_MOBILE_COMMERCIALIZATION_ORCHESTRATION.md) §7 SSOT를 따른다.

| 게이트 | 본 문서 대응 | PASS 요약 |
|--------|--------------|-----------|
| **G1** | §2·§3 역할·라우팅 | ADMIN/STAFF/CONSULTANT/CLIENT 셸·검수 숨김·금지 경로 |
| **G2** | §10 `test:utils`·`tsc`·Maven | 0 failures (현재 §10.8 **PASS** @ `d95768075`) |
| **G3** | §8 인벤토리 + 상용화 §6 디자인 | adminTheme·패리티 60%·§17·safeDisplay |
| **G4** | §6.2·[`SMOKE_RUN`](./ADMIN_MOBILE_MVP_SMOKE_RUN.md) | dev APK·수동/Maestro 스모크 |

**종합 판정**: G1 PASS + G2 PASS + G3 CONDITIONAL 이상 + G4 PASS — 상세 PASS/CONDITIONAL/FAIL 표·현재 스냅샷은 상용화 문서 §7.

---

## 변경 이력

| 날짜 | 변경 |
|------|------|
| 2026-05-18 | §11 — 상용화 G1~G4 부록; SSOT [`ADMIN_MOBILE_COMMERCIALIZATION_ORCHESTRATION.md`](./ADMIN_MOBILE_COMMERCIALIZATION_ORCHESTRATION.md) |
| 2026-05-18 | §10.8 — 게이트 **3/3 PASS** @ `d95768075` (core-tester: `test:utils` 36·`tsc`·Maven STAFF 스코프+BW 10); §6.2 운영·검수 회귀 **skip** (APK·자격 증명) |
| 2026-05-18 | §10.8 — 게이트 PASS @ `d95768075` (`test:utils` 36·`tsc`); §6 APK `d957680` 재빌드·운영/검수 후 재로그인 안내 |
| 2026-05-18 | §6.2 — emulator prep·`test:utils`·`pm clear` cold start; Maestro skip (no `MAESTRO_*`); §6.2 #1–#7 manual pending |
| 2026-05-18 | §10.7 — Admin MVP 자동 게이트 재실행 PASS @ `46fe1c0be` (`test:utils` 34·`tsc`·BW MockMvc 7·full `mvn test` 816) |
| 2026-05-17 | §10.6 Task AN — Full `mvn test` (`spring.profiles.active=test`) PASS @ `cb4bf8b57` |
| 2026-05-17 | §10.5 Task AG — Local CI repro (`check-hardcoding`, expo `test:utils`+`tsc`, BW admin community MockMvc) |
| 2026-05-16 | §8.1·§10.4 Task O — Phase 2 Top 8 인벤토리, `test:utils`·`tsc --noEmit`·placeholder grep |
| 2026-05-16 | §10.3 Task L — §5.2 `ConsultantSessionStatistics*`·`MindWeather*` 통합 + `test:utils`·BW admin community 재실행 (전항목 PASS) |
| 2026-05-16 | §10 Gate run log — Task F 자동 게이트 1차 (Expo utils + BW admin community MockMvc) |
| 2026-05-16 | 초안 — core-tester 게이트 계획 (Expo E2E TBD, 스텁 없음) |
