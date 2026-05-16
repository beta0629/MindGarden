# Maestro — Expo Admin Mobile MVP

Admin MVP 스모크 E2E 초안. 수동 체크리스트는 [`docs/project-management/ADMIN_MOBILE_MVP_SMOKE_RUN.md`](../../docs/project-management/ADMIN_MOBILE_MVP_SMOKE_RUN.md), 게이트 계획은 [`docs/project-management/ADMIN_MOBILE_MVP_TEST_PLAN.md`](../../docs/project-management/ADMIN_MOBILE_MVP_TEST_PLAN.md) §7.1.

**저장소에 실제 비밀번호·ADMIN 계정을 넣지 마세요.** CI/로컬은 환경 변수·Maestro Cloud Secrets만 사용합니다.

## 사전 요구

| 항목 | 내용 |
|------|------|
| CLI | [Maestro](https://maestro.mobile.dev/) 설치 |
| 기기 | Android 에뮬레이터/실기기 (`adb devices`) |
| 앱 | `com.mindgardenmobile` — dev release APK 권장 ([`scripts/build-android-apk-dev.sh`](../scripts/build-android-apk-dev.sh), [`ADMIN_MOBILE_MVP_SMOKE_RUN.md`](../../docs/project-management/ADMIN_MOBILE_MVP_SMOKE_RUN.md)) |
| 계정 | **ROLE_ADMIN** (검수 탭 필요). STAFF는 검수 탭이 없어 본 플로우와 불일치 |

## 환경 변수

`maestro test -e KEY=value` 또는 셸에서 `export MAESTRO_*=...` (Maestro가 `MAESTRO_` 접두사 변수를 플로우에 노출).

| 변수 | 필수 | 용도 |
|------|------|------|
| `MAESTRO_ADMIN_EMAIL` | 로그인 시 | 이메일/휴대폰 (로그인 placeholder와 동일) |
| `MAESTRO_ADMIN_PASSWORD` | 로그인 시 | 비밀번호 (**커밋·README 예시 값 금지**) |
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

또는 인라인:

```bash
maestro test .maestro/flows/admin-mvp-smoke.yaml \
  -e MAESTRO_ADMIN_EMAIL="$MAESTRO_ADMIN_EMAIL" \
  -e MAESTRO_ADMIN_PASSWORD="$MAESTRO_ADMIN_PASSWORD"
```

## 플로우

| 파일 | 역할 |
|------|------|
| [`flows/admin-mvp-smoke.yaml`](flows/admin-mvp-smoke.yaml) | ADMIN: 홈 assert → 검수 탭 → 운영 → 사용자 조회 |
| [`flows/subflows/admin-credentials-login.yaml`](flows/subflows/admin-credentials-login.yaml) | 테넌트 선택(선택) + ID/PW 로그인 서브플로우 |

### STAFF 변형 (선택)

STAFF는 바텀탭 **「검수」가 숨김** (`app/(admin)/_layout.tsx`, `isStaffRole`). ADMIN 스모크를 그대로 돌리면 `검수` 탭 단계에서 실패합니다. STAFF 전용 플로우는 `admin-mvp-smoke-staff.yaml`로 분리해 검수 단계를 빼고, 운영 허브에서 **마음날씨** 메뉴가 없는지 등을 assert하는 방식을 권장합니다(아직 미추가 시 본 README만 참고).

## assert에 쓰는 UI 문구 (코드 상수)

- 홈: `ADMIN_MOBILE_HOME_COPY` — `안녕하세요`, `읽지 않은 알림`, `오늘 일정`
- 탭: `ADMIN_MOBILE_COPY.TAB_REVIEW` → `검수`, `TAB_OPERATION` → `운영`
- 검수: `ADMIN_COMMUNITY_MODERATION_COPY.PAGE_TITLE` → `커뮤니티 검수`
- 사용자: `ADMIN_MOBILE_OPERATION_COPY.USERS` → `사용자 조회`; 검색 placeholder는 `ADMIN_USER_MANAGEMENT_COPY.SEARCH_PLACEHOLDER`

## 실패 시

- `adb logcat` — [`ADMIN_MOBILE_MVP_SMOKE_RUN.md`](../../docs/project-management/ADMIN_MOBILE_MVP_SMOKE_RUN.md) §6.3
- API base: APK `extra.apiBaseUrl` = `https://dev.core-solution.co.kr` (dev APK 빌드 스크립트)
