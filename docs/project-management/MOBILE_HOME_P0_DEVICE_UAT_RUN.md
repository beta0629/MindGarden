# 모바일 홈 P0 — 실기기·Maestro UAT 실행 가이드

**작성일:** 2026-05-22  
**작성:** core-tester  
**기준 구현:** `d67b827fb` (`develop`) · SSR `getMmkv.ts` 가드(워킹트리, coder 완료)  
**SSOT:**  
- 어드민·스태프: [`ADMIN_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md`](./ADMIN_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md) §8  
- 상담사: [`CONSULTANT_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md`](./CONSULTANT_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md) §8  
- 카피: `expo-app/src/constants/adminHomeCopy.ts`, `consultantHomeCopy.ts`

**자동 테스트 리포트:**  
- [`ADMIN_MOBILE_HOME_CONTENT_ENHANCEMENT_TEST_REPORT.md`](./ADMIN_MOBILE_HOME_CONTENT_ENHANCEMENT_TEST_REPORT.md)  
- [`CONSULTANT_MOBILE_HOME_CONTENT_ENHANCEMENT_TEST_REPORT.md`](./CONSULTANT_MOBILE_HOME_CONTENT_ENHANCEMENT_TEST_REPORT.md)

---

## 1. 사전 준비

| 항목 | 내용 |
|------|------|
| 앱 | `com.mindgardenmobile` — dev release APK 권장 (`expo-app/scripts/build-android-apk-dev.sh`, [`ADMIN_MOBILE_MVP_SMOKE_RUN.md`](./ADMIN_MOBILE_MVP_SMOKE_RUN.md)) |
| API | APK `extra.apiBaseUrl` = `https://dev.core-solution.co.kr` (dev 빌드) |
| 계정 | **ADMIN** 1회 · **STAFF** 1회 · **CONSULTANT** 1회 (팀 내부 채널, 저장소·문서에 비밀번호 금지) |
| Maestro | [설치](https://maestro.mobile.dev/) 후 `adb devices`에 기기 `device` 표시 |
| Maestro 상세 | [`expo-app/.maestro/README.md`](../expo-app/.maestro/README.md) |

### 1.1 Maestro 환경 변수 (`MAESTRO_*`)

`export MAESTRO_*=...` 또는 `maestro test -e KEY=value`. 자세한 표는 [`.maestro/README.md`](../expo-app/.maestro/README.md).

| 변수 | 역할 |
|------|------|
| `MAESTRO_ADMIN_EMAIL` / `MAESTRO_ADMIN_PASSWORD` | ADMIN 로그인 |
| `MAESTRO_STAFF_EMAIL` / `MAESTRO_STAFF_PASSWORD` | STAFF 로그인 |
| `MAESTRO_CONSULTANT_EMAIL` / `MAESTRO_CONSULTANT_PASSWORD` | 상담사 로그인 (이메일 또는 휴대폰) |
| `MAESTRO_TENANT_SEARCH` / `MAESTRO_TENANT_NAME` | 테넌트 미캐시 시 선택 |

세션·테넌트가 MMKV에 남아 있으면 로그인 subflow는 건너뛸 수 있습니다.

### 1.2 Maestro 실행 명령 (P0 홈 스모크)

```bash
cd expo-app

# ADMIN — 홈 P0 assert + 검수·운영 회귀
export MAESTRO_ADMIN_EMAIL='…' MAESTRO_ADMIN_PASSWORD='…'
# 필요 시 MAESTRO_TENANT_SEARCH / MAESTRO_TENANT_NAME
maestro test .maestro/flows/admin-mvp-smoke.yaml

# STAFF — 검수 탭 없음 assert 포함
export MAESTRO_STAFF_EMAIL='…' MAESTRO_STAFF_PASSWORD='…'
maestro test .maestro/flows/admin-mvp-smoke-staff.yaml

# CONSULTANT — 홈 P0 assert (초안)
export MAESTRO_CONSULTANT_EMAIL='…' MAESTRO_CONSULTANT_PASSWORD='…'
maestro test .maestro/flows/consultant-home-p0-smoke.yaml
```

**로컬 Maestro 시도 (2026-05-22):** `maestro` CLI **미설치** → 아래 §2~§4는 **수동 UAT 절차**로 수행. CLI 설치 후 위 명령으로 스모크 보조 가능.

---

## 2. ADMIN — §8 UAT (실기기)

**역할:** `ROLE_ADMIN` · **화면:** `/(admin)/(home)`  
**Maestro 보조:** `admin-mvp-smoke.yaml` (홈: `안녕하세요`, `읽지 않은 알림`, `오늘 일정` ↔ `ADMIN_MOBILE_HOME_COPY`)

| # | P | 체크 | 기대 UI·동선 | Maestro / 수동 | 결과 | 실패 시 기록 |
|---|-----|------|----------------|----------------|------|--------------|
| 1 | P0 | 요약 | 인사 아래 `오늘 N건의 일정, M건의 처리 대기` (`buildAdminHomeSummaryLine`) | 수동 (N·M 가변) | ☐ PASS ☐ FAIL | |
| 2 | P0 | 일정 미리보기 | 일정 ≥1 → 카드 1~3건, read-only; 탭 시 스케줄 상세와 일치 | 수동 | ☐ PASS ☐ FAIL | |
| 3 | P0 | TopBar 알림 | unread 시 Bell 배지 → 알림 설정(`notification-settings`) | 수동 | ☐ PASS ☐ FAIL | |
| 4 | P0 | 빠른 액션 | `일정 등록`→create, `스케줄`→schedule index, `메시지`→messages | 수동 (+ yaml: `운영 지표`, `빠른 액션`, `일정 등록` 스크롤 후) | ☐ PASS ☐ FAIL | |
| 5 | P0 | STAFF 회귀 | — | **STAFF 표 §3** | — | |
| 6 | P1 | 매칭 KPI | 권한 있을 때만 대기 건수 | **P0 범위 외** — 미구현 | N/A | |
| 7 | P1 | 검수 KPI/배너 | 검수 대기>0 → 검수 탭 | yaml: `검수`→`커뮤니티 검수` (MVP 회귀) | ☐ PASS ☐ FAIL | |
| 8 | P0 | 오프라인/에러 | API 실패 시 스켈레톤→empty, 크래시 없음 | 수동 (비행기 모드 등) | ☐ PASS ☐ FAIL | |

**실행자 / 일시:** _______________  
**빌드·커밋:** _______________

---

## 3. STAFF — §8 UAT (실기기)

**역할:** `ROLE_STAFF` · **Maestro:** `admin-mvp-smoke-staff.yaml` (`assertNotVisible: 검수`)

| # | P | 체크 | 기대 UI·동선 | Maestro / 수동 | 결과 | 실패 시 기록 |
|---|-----|------|----------------|----------------|------|--------------|
| 1 | P0 | 요약 | ADMIN과 동일 홈 P0 (역할 분기 없음) | 수동 | ☐ PASS ☐ FAIL | |
| 2 | P0 | 일정 미리보기 | 동일 | 수동 | ☐ PASS ☐ FAIL | |
| 3 | P0 | TopBar 알림 | 동일 | 수동 | ☐ PASS ☐ FAIL | |
| 4 | P0 | 빠른 액션 | 3종 라우트 정상 | 수동 | ☐ PASS ☐ FAIL | |
| 5 | P0 | STAFF 회귀 | **검수 탭·검수 KPI 없음**; 운영·홈 크래시 없음 | yaml `assertNotVisible: 검수` + 운영→사용자 조회 | ☐ PASS ☐ FAIL | |
| 8 | P0 | 오프라인/에러 | 동일 | 수동 | ☐ PASS ☐ FAIL | |

**실행자 / 일시:** _______________

---

## 4. CONSULTANT — §8 UAT (실기기)

**역할:** 상담사 · **화면:** `/(consultant)/(home)`  
**Maestro 보조:** `consultant-home-p0-smoke.yaml` (고정 카피: `핵심 지표`, `오늘의 스케줄`, `빠른 액션`, `일정 추가`, `근무 설정`)

| # | P | 체크 | 기대 UI·동선 | Maestro / 수동 | 결과 | 실패 시 기록 |
|---|-----|------|----------------|----------------|------|--------------|
| 1 | P0 | 요약 | 인사 `안녕하세요, {이름}님!`; 0건 `오늘 예정된 상담이 없어요.` / 양수 `오늘 N건의 상담이 예정되어 있습니다.` | 수동 (이름·N 가변) | ☐ PASS ☐ FAIL | |
| 2 | P0 | 미작성 일지 | pending>0 → `미작성 일지 N건이 있습니다.` + `바로가기 >` → 일지 탭; COMPLETED만이면 배너 없음 | 수동 (데이터 조건) | ☐ PASS ☐ FAIL | |
| 3 | P0 | 오늘 스케줄 | 카드·입장/일지 액션 기존과 동일 | 수동 | ☐ PASS ☐ FAIL | |
| 4 | P0 | 빠른 액션 | `일정 추가`→스케줄, `근무 설정`→availability | yaml + 수동 탭 | ☐ PASS ☐ FAIL | |
| 5 | P0 | TopBar 알림 | unread 배지 → 알림 화면 | 수동 | ☐ PASS ☐ FAIL | |
| 6 | P1 | KPI 메시지 | 안읽은 메시지 KPI | P0: 2칸 KPI 존재 — 수동 확인 | ☐ PASS ☐ FAIL | |
| 7 | P1 | 다음 상담 | 강조 카드 | **P0 범위 외** — 미구현 | N/A | |
| 8 | P0 | 오프라인/에러 | 스켈레톤→empty, 크래시 없음 | 수동 | ☐ PASS ☐ FAIL | |

**실행자 / 일시:** _______________

---

## 5. copy ↔ Maestro assert 정합 (2026-05-22)

| 소스 | Maestro assert | 일치 |
|------|----------------|------|
| `ADMIN_MOBILE_HOME_COPY.GREETING` → `안녕하세요` | `admin-mvp-smoke*.yaml` | ✅ |
| `UNREAD_NOTIFICATIONS` | `읽지 않은 알림` | ✅ |
| `TODAY_SCHEDULES` | `오늘 일정` | ✅ |
| `KPI_SECTION_TITLE` → `운영 지표` | `admin-mvp-smoke.yaml` (P0 확장) | ✅ |
| `QUICK_LINKS_TITLE` / `QUICK_CREATE_SCHEDULE` | `빠른 액션` / `일정 등록` | ✅ |
| `CONSULTANT_HOME_COPY.KPI_SECTION_TITLE` | `핵심 지표` | ✅ |
| `SCHEDULE_SECTION_TITLE` | `오늘의 스케줄` | ✅ |
| `QUICK_ACTIONS_TITLE` / quick labels | `빠른 액션` / `일정 추가` / `근무 설정` | ✅ |

**core-coder 위임:** assert 불일치 **없음**. 양수 요약 `오늘 N건의 상담이 예정되어 있습니다.` 는 `consultantHomeKpi.ts` 인라인 — 운영 하드코딩 게이트 시 `consultantHomeCopy.ts` 이전은 TEST_REPORT §8 core-coder 목록(P2) 참고.

---

## 6. UAT 완료 후

1. 위 표에서 P0 항목 **PASS** 체크.  
2. [`ADMIN_MOBILE_HOME_CONTENT_ENHANCEMENT_TEST_REPORT.md`](./ADMIN_MOBILE_HOME_CONTENT_ENHANCEMENT_TEST_REPORT.md) §3·§6 — 실기기 **PASS** 갱신.  
3. [`CONSULTANT_MOBILE_HOME_CONTENT_ENHANCEMENT_TEST_REPORT.md`](./CONSULTANT_MOBILE_HOME_CONTENT_ENHANCEMENT_TEST_REPORT.md) §3·§9 — 동일.  
4. 전체 P0 DoD: 양쪽 §8 P0(ADMIN 1~5·8, STAFF 5, CONSULTANT 1~5·8) 완료 시 **CONDITIONAL PASS → PASS** 전환.

---

## 7. 실패 시 공통

- Logcat: [`ADMIN_MOBILE_MVP_SMOKE_RUN.md`](./ADMIN_MOBILE_MVP_SMOKE_RUN.md) §6.3  
- Metro/MMKV: [`EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md`](./EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md)  
- Maestro 플로우·변수: [`expo-app/.maestro/README.md`](../expo-app/.maestro/README.md)

---

*문서 버전: 1.0 | 코드 변경 없음(문서·Maestro yaml만)*
