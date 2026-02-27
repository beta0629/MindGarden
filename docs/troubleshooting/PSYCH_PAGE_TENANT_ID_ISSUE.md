# 심리검사 페이지만 tenantId를 못 받는 이유

## 요약

**심리검사 페이지만** tenantId 미설정으로 400(TENANT_ID_REQUIRED)이 나거나 목록이 비어 보이는 이유는 **위젯이 다른 페이지와 다르게 “user 준비 전에” API를 호출하기 때문**입니다.

---

## 1. 다른 페이지와의 차이

### 다른 관리자/대시보드 페이지

- **CommonDashboard / DynamicDashboard**: `currentUser` 또는 `dashboardUser`가 있을 때만 `loadDashboard()` / `loadDashboardData()` 호출.
- **데이터 로드 시점**: `useEffect(..., [currentUser?.id])` 등으로 **user가 세팅된 뒤**에 API 호출.
- **결과**: 세션이 이미 한 번 이상 읽힌 상태에서 요청이 나가므로, 서버 세션에 User·tenantId가 채워진 뒤에 tenantId 필요 API가 호출됨.

### 심리검사 페이지 (PsychAssessmentManagement)

- **useWidget** 사용: `dataSource.type: 'multi-api'`, `endpoints`: `/psych/stats`, `/psych/documents/recent`.
- **옵션**: `immediate: true` → **마운트 직후 곧바로** 위 두 API를 호출.
- **useWidget 훅 내부**: 초기 로드 `useEffect` 의존성 배열이 `[immediate, type, config.defaultValue]` 이고 **user는 의존성에 없음**.
- **결과**: user/session이 아직 준비되지 않은 상태에서도 **즉시** `/psych/documents/recent` 등이 호출될 수 있음.

---

## 2. 왜 “이 페이지만” 문제가 되는가

| 구분 | 다른 페이지 | 심리검사 페이지 |
|------|-------------|------------------|
| 데이터 로드 조건 | user 존재 시에만 로드 | **user 여부와 무관하게** 마운트 시 즉시 로드 |
| 첫 요청 시점 | 대개 user 세팅 후 | **마운트 직후(가능한 한 빠르게)** |
| tenantId 필요 API | 보통 그 전에 다른 API로 세션 한 번 읽힘 | **이 페이지의 첫 요청이 곧바로** tenantId 필요 API |

- **직접 URL로 `/admin/psych-assessments` 진입**하거나, **로그인 직후 이 페이지만** 먼저 열면  
  → 앱 기준으로 “이 페이지에서 나가는 첫 요청”이 **stats + documents/recent**가 됨.  
- 그 시점에 서버 세션에 User는 있어도 **tenantId가 아직 채워지지 않았거나**,  
  필터에서 tenantId를 복구하기 전에 요청이 처리되면 **400(TENANT_ID_REQUIRED)** 또는 빈 목록으로 이어질 수 있음.
- 다른 페이지는 “user 있을 때만 로드” 또는 “메뉴/공통 API가 먼저 호출”이라, 같은 서버 세션이라도 **이미 한 번 읽힌 뒤**에 tenantId 필요 API가 호출되는 경우가 많음.

즉, **위젯 + immediate: true** 조합으로 인해 **다른 페이지보다 “너무 이른 시점”에 tenantId 필요 API가 호출**되는 것이 이 페이지만 문제가 되는 핵심입니다.

---

## 3. 수정 방향 (구현됨)

- **심리검사 페이지**: `useWidget`에 **user가 있을 때만** 즉시 로드하도록 변경.  
  - 예: `immediate: !!user` (또는 `!!user?.id`).  
  - user가 null → `immediate: false` → 마운트 시 요청 안 나감.  
  - user 세팅됨 → `immediate: true`로 바뀜 → 그때 초기 로드 effect가 다시 돌며 API 호출.  
- 이렇게 하면 **다른 페이지와 비슷하게** “user(세션) 준비 후”에만 `/psych/documents/recent` 등이 호출되어, tenantId를 받아오지 못하는 현상이 줄어듭니다.

---

## 4. 백엔드 보완 (기존 적용 사항)

- **TenantContextFilter**: 세션 User에 tenantId가 없으면 `UserRepository`로 DB 조회 후 세션 보완.  
- **AuthController**: 로그인·중복 로그인 확인 성공 시 세션 User에 tenantId 설정.  

위까지 적용된 상태에서, **프론트에서 호출 시점만 user 준비 후로 지연**하면 “이 페이지만 tenantId를 못 받는” 현상이 명확히 완화됩니다.
