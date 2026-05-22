# Maestro — Expo Admin Mobile MVP

Admin MVP 스모크 E2E 초안. 수동 체크리스트는 [`docs/project-management/ADMIN_MOBILE_MVP_SMOKE_RUN.md`](../../docs/project-management/ADMIN_MOBILE_MVP_SMOKE_RUN.md), 게이트 계획은 [`docs/project-management/ADMIN_MOBILE_MVP_TEST_PLAN.md`](../../docs/project-management/ADMIN_MOBILE_MVP_TEST_PLAN.md) §7.1.

**저장소에 실제 비밀번호·ADMIN 계정을 넣지 마세요.** CI/로컬은 환경 변수·Maestro Cloud Secrets만 사용합니다.

## 사전 요구

| 항목 | 내용 |
|------|------|
| CLI | [Maestro](https://maestro.mobile.dev/) 설치 |
| 기기 | Android 에뮬레이터/실기기 (`adb devices`) |
| 앱 | `com.mindgardenmobile` — dev release APK 권장 ([`scripts/build-android-apk-dev.sh`](../scripts/build-android-apk-dev.sh), [`ADMIN_MOBILE_MVP_SMOKE_RUN.md`](../../docs/project-management/ADMIN_MOBILE_MVP_SMOKE_RUN.md)) |
| 계정 | **ROLE_ADMIN** → `admin-mvp-smoke.yaml`. **STAFF** → `admin-mvp-smoke-staff.yaml` (검수 탭 없음) |

## 환경 변수

`maestro test -e KEY=value` 또는 셸에서 `export MAESTRO_*=...` (Maestro가 `MAESTRO_` 접두사 변수를 플로우에 노출).

| 변수 | 필수 | 용도 |
|------|------|------|
| `MAESTRO_ADMIN_EMAIL` | ADMIN 로그인 시 | 이메일/휴대폰 (로그인 placeholder와 동일) |
| `MAESTRO_ADMIN_PASSWORD` | ADMIN 로그인 시 | 비밀번호 (**커밋·README 예시 값 금지**) |
| `MAESTRO_STAFF_EMAIL` | STAFF 로그인 시 | STAFF 플로우 전용 (`admin-mvp-smoke-staff.yaml`) |
| `MAESTRO_STAFF_PASSWORD` | STAFF 로그인 시 | STAFF 비밀번호 (**커밋·README 예시 값 금지**) |
| `MAESTRO_CONSULTANT_EMAIL` | CONSULTANT 로그인 시 | 이메일 또는 휴대폰 (`consultant-home-p0-smoke.yaml`) |
| `MAESTRO_CONSULTANT_PASSWORD` | CONSULTANT 로그인 시 | 비밀번호 (**커밋·README 예시 값 금지**) |
| `MAESTRO_TENANT_SEARCH` | 테넌트 미캐시 시 | 기관 검색어(서브도메인·기관명 일부) |
| `MAESTRO_TENANT_NAME` | 테넌트 미캐시 시 | 목록에서 탭할 **표시 이름** (카드 `accessibilityLabel`의 기관명) |

이미 테넌트·ADMIN 세션이 APK/MMKV에 남아 있으면 로그인 변수 없이 `launchApp`만으로 통과할 수 있습니다.

## 실행

```bash
cd expo-app

# 기기에 APK 설치 후 (한 번)
# npm run android:apk:dev:install

export MAESTRO_ADMIN_EMAIL='your-admin@example.com'
export MAESTRO_ADMIN_PASSWORD='***'   # 팀 비밀 관리 채널에서만 공유
export MAESTRO_TENANT_SEARCH='dev'    # 필요 시
export MAESTRO_TENANT_NAME='Dev Tenant Display Name'  # 필요 시

maestro test .maestro/flows/admin-mvp-smoke.yaml
```

**STAFF** (검수 탭 없음 — `admin-mvp-smoke-staff.yaml`):

```bash
cd expo-app

export MAESTRO_STAFF_EMAIL='your-staff@example.com'
export MAESTRO_STAFF_PASSWORD='***'
export MAESTRO_TENANT_SEARCH='dev'    # 필요 시
export MAESTRO_TENANT_NAME='Dev Tenant Display Name'  # 필요 시

maestro test .maestro/flows/admin-mvp-smoke-staff.yaml
```

**CONSULTANT** (홈 P0 — `consultant-home-p0-smoke.yaml`):

```bash
cd expo-app

export MAESTRO_CONSULTANT_EMAIL='010xxxxxxxx'   # 또는 이메일
export MAESTRO_CONSULTANT_PASSWORD='***'
export MAESTRO_TENANT_SEARCH='dev'    # 필요 시
export MAESTRO_TENANT_NAME='Dev Tenant Display Name'  # 필요 시

maestro test .maestro/flows/consultant-home-p0-smoke.yaml
```

실기기 UAT 체크리스트: [`docs/project-management/MOBILE_HOME_P0_DEVICE_UAT_RUN.md`](../../docs/project-management/MOBILE_HOME_P0_DEVICE_UAT_RUN.md).

또는 인라인:

```bash
maestro test .maestro/flows/admin-mvp-smoke.yaml \
  -e MAESTRO_ADMIN_EMAIL="$MAESTRO_ADMIN_EMAIL" \
  -e MAESTRO_ADMIN_PASSWORD="$MAESTRO_ADMIN_PASSWORD"
```

## 플로우

| 파일 | 역할 |
|------|------|
| [`flows/admin-mvp-smoke.yaml`](flows/admin-mvp-smoke.yaml) | ADMIN: 홈 P0 assert → 검수 탭 → 운영 → 사용자 조회 |
| [`flows/admin-mvp-smoke-staff.yaml`](flows/admin-mvp-smoke-staff.yaml) | STAFF: 홈 P0 assert → 검수 탭 **없음** assert → 운영 → 사용자 조회 |
| [`flows/consultant-home-p0-smoke.yaml`](flows/consultant-home-p0-smoke.yaml) | CONSULTANT: 홈 P0 assert (KPI·스케줄·빠른 액션) |
| [`flows/subflows/admin-credentials-login.yaml`](flows/subflows/admin-credentials-login.yaml) | ADMIN 테넌트 선택(선택) + ID/PW 로그인 |
| [`flows/subflows/admin-credentials-login-staff.yaml`](flows/subflows/admin-credentials-login-staff.yaml) | STAFF 로그인 (`MAESTRO_STAFF_EMAIL` / `MAESTRO_STAFF_PASSWORD`) |
| [`flows/subflows/consultant-credentials-login.yaml`](flows/subflows/consultant-credentials-login.yaml) | CONSULTANT 로그인 (`MAESTRO_CONSULTANT_EMAIL` / `MAESTRO_CONSULTANT_PASSWORD`) |

STAFF 셸은 바텀탭 **「검수」가 숨김** (`app/(admin)/_layout.tsx`, `isStaffRole`). ADMIN 플로우를 STAFF 계정에 돌리면 `검수` 탭 단계에서 실패합니다.

## assert에 쓰는 UI 문구 (코드 상수)

- 어드민 홈: `adminHomeCopy.ts` → `ADMIN_MOBILE_HOME_COPY` — `안녕하세요`, `읽지 않은 알림`, `오늘 일정`, `운영 지표`, `빠른 액션`, `일정 등록`
- 상담사 홈: `consultantHomeCopy.ts` → `CONSULTANT_HOME_COPY` — `핵심 지표`, `오늘 상담`, `안읽은 메시지`, `오늘의 스케줄`, `빠른 액션`, `일정 추가`, `근무 설정`
- 탭: `ADMIN_MOBILE_COPY.TAB_REVIEW` → `검수`, `TAB_OPERATION` → `운영`
- 검수: `ADMIN_COMMUNITY_MODERATION_COPY.PAGE_TITLE` → `커뮤니티 검수`
- 사용자: `ADMIN_MOBILE_OPERATION_COPY.USERS` → `사용자 조회`; 검색 placeholder는 `ADMIN_USER_MANAGEMENT_COPY.SEARCH_PLACEHOLDER`

## 실패 시

- `adb logcat` — [`ADMIN_MOBILE_MVP_SMOKE_RUN.md`](../../docs/project-management/ADMIN_MOBILE_MVP_SMOKE_RUN.md) §6.3
- API base: APK `extra.apiBaseUrl` = `https://dev.core-solution.co.kr` (dev APK 빌드 스크립트)
