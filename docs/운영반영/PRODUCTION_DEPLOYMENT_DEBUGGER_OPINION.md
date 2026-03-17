# 회의에 제출할 디버거 의견 — 운영 서버 반영 준비

**작성**: core-debugger (디버깅·원인 분석만, 코드 수정 없음)  
**목적**: 운영 반영 회의에서 예상 리스크·점검 항목·롤백 시 확인사항 제시  
**참조**: `../standards/DEPLOYMENT_STANDARD.md`, `../troubleshooting/DEV_DEPLOYMENT_STABILITY_CHECKLIST.md`, `../standards/ERROR_HANDLING_STANDARD.md`, `../standards/LOGGING_STANDARD.md`

---

## 1. 운영 반영 시 예상 리스크·장애 시나리오

### 1.1 최근 변경(공통 배지, B0KlA, 알림/메시지)으로 인한 런타임·UI 오류 가능성

| 구분 | 시나리오 | 가능 원인 | 확인 방법 |
|------|----------|-----------|-----------|
| **알림/메시지** | `/admin/notifications`, `/notifications` 진입 시 **TypeError: n.filter is not a function** | API 응답이 `ApiResponse.data`로 `{ notifications, totalElements, ... }` 객체를 주는데, 프론트에서 배열로 가정하고 `setNotifications(response)` 후 `.filter()` 호출. `SystemNotificationListBlock`, `AdminMessageListBlock`에서 `response.data`가 아닌 `response`를 배열로 쓰는 경로 있음. | 해당 페이지 접속 후 브라우저 콘솔·Network 탭에서 응답 구조와 state에 들어간 값 타입 확인. |
| **알림 필터** | 통합알림 필터(타입/읽음 등) 적용 시 **TypeError** 또는 빈 목록 | 위와 동일하게 목록 state가 배열이 아닐 때 `.filter` 호출. 또는 쿼리 파라미터와 백엔드 DTO/파라미터 불일치. | 필터 변경 후 API 요청 URL/body와 응답, 프론트 state 확인. |
| **공통 배지 모듈** | 배지가 안 보이거나 스타일 깨짐, **import 경로/심볼 오류** | `Badge.js`·`Badge.css` 경로 오류, 빌드 시 tree-shaking으로 미포함, 또는 `PipelineStepBadge` 등에서 공통 Badge 대신 로컬 구현과 혼용. | 운영 빌드 산출물에 `Badge*` 포함 여부, 런타임 콘솔 에러 확인. |
| **B0KlA(관리자 대시보드)** | 대시보드 차트 **“기간 내 데이터가 없습니다”**만 표시 | `GET /api/v1/admin/statistics/consultation-completion` 응답의 `monthlyData`/`weeklyData`가 비어 있거나, 기간/tenant 조건으로 운영 DB에 데이터가 없음. 백엔드 `getConsultationMonthlyTrend`/`getConsultationWeeklyTrend` 인자·집계 로직이 운영과 맞는지. | 동일 API를 운영 URL로 호출해 응답 JSON 확인. DB에 해당 기간 상담 완료/예약 데이터 존재 여부 확인. |
| **UnifiedModal** | 모달이 안 뜨거나 레이아웃 깨짐 | 공통 모달로 통합 과정에서 일부 페이지가 여전히 커스텀 오버레이/래퍼 사용, 또는 CSS 로드 순서/디자인 토큰 미반영. | 모달 사용 화면(알림, 매핑, ERP 등)에서 열기/닫기 및 스타일 확인. |
| **NotificationContext** | 알림 배지/드롭다운이 갱신되지 않거나 500 | Context에서 쓰는 API 경로·tenantId·세션이 운영과 다름. 또는 백엔드 알림 API 예외 시 전역 처리 미흡. | 헤더 알림 아이콘 클릭 시 API 호출·응답 코드·콘솔 에러 확인. |

### 1.2 환경 차이(API URL, CORS, 세션, 빌드 모드)로 인한 이슈

| 구분 | 시나리오 | 가능 원인 | 확인 방법 |
|------|----------|-----------|-----------|
| **API Base URL** | 프론트에서 404/네트워크 에러 | 운영에서 상대 경로 `/api/v1/...`가 다른 도메인/포트로 가거나, 프록시/nginx 설정이 운영과 다름. | 브라우저 Network에서 요청 URL이 기대한 호스트/경로인지 확인. |
| **CORS** | API 호출 시 CORS 에러 | 운영 백엔드 `allowedOrigins`에 운영 프론트 도메인이 없거나, credentials 포함 시 설정 불일치. | 동일 도메인에서 호출 시 CORS 발생 여부, Preflight 응답 헤더 확인. |
| **세션** | 로그인 후 API 호출 시 401/세션 끊김 | 세션 도메인/경로/보안 쿠키 설정이 운영과 다름. 또는 로드밸런서/스티키 세션 미적용. | 로그인 → 주요 API 1~2개 호출 후 쿠키·응답 상태코드 확인. |
| **빌드 모드** | 번들 크기·캐시·에러 메시지 차이 | 개발은 `development`, 운영은 `production` 빌드. minify 시 변수명이 `n` 등으로 바뀌어 스택만 보면 추적 어려움. | 운영 빌드 시 source map 비활성화 여부 확인(필요 시 디버깅용으로만 임시 활성화). |

### 1.3 DB/캐시/스케줄러·외부 연동 실패 시나리오

| 구분 | 시나리오 | 가능 원인 | 확인 방법 |
|------|----------|-----------|-----------|
| **DB** | 기동 실패 또는 Flyway 실패 | 마이그레이션 미반영·순서 충돌·운영 DB 사용자 권한. | 기동 로그에서 Flyway, Hibernate, connection 관련 예외 확인. |
| **DB** | tenantId 누락/잘못된 tenant 데이터 노출 | 세션에서 tenantId 추출 실패 시 null 전파. 멀티테넌트 격리 위반. | 권한이 다른 tenant 데이터가 보이지 않는지 샘플 조회. |
| **캐시** | 권한/설정 변경 후에도 이전 값 적용 | `userPermissions` 등 캐시 evict 조건이 운영 경로와 다름. 또는 분산 캐시 미사용 시 서버 재시작 전까지 유지. | 권한 변경 후 재로그인 또는 서비스 재시작으로 갱신 여부 확인. |
| **스케줄러** | 배치/스케줄 작업 실패 | 타임존·DB 연결·외부 API 연동 실패. 로그만 남고 알림 없을 수 있음. | 스케줄러 로그·에러 로그 파일에서 예외 검색. |
| **외부 연동** | 결제·ERP·메일 등 실패 | 운영 전용 키/엔드포인트 미설정, IP 화이트리스트, 방화벽. | 해당 기능 실행 후 로그·응답 코드 확인. |

---

## 2. 배포 전에 확인하면 좋은 로그·설정·헬스체크 항목

- **설정**
  - 운영용 `application.yml` / `application-prod.yml`(또는 해당 프로파일): DB URL·계정, JWT/암호화 키, OAuth2 redirect/도메인, CORS allowedOrigins.
  - 프론트: 운영 빌드 시 사용하는 API base URL(또는 proxy) 및 `REACT_APP_*` 등 환경 변수.
- **로그**
  - 기동 직후: `journalctl -u <서비스명> --no-pager -n 300`, 서버 내 `logs/error.log`(또는 `dev-error.log` 등) tail — Flyway, DataSource, OAuth2, Security 관련 예외 여부.
  - 로깅 표준: 에러 시 `log.error("...", e)` 형태로 스택 포함 여부, 민감 정보 마스킹 여부.
- **헬스체크**
  - `GET /actuator/health` (및 필요 시 `liveness`/`readiness`) 응답 200 및 body 상태(UP).
  - DB/캐시 등 의존성 포함 시 해당 항목 상태 확인.
- **CI/배포 워크플로**
  - JAR 내부에 해당 프로파일용 `application-*.yml` 포함 여부(개발용 검증과 동일하게 운영용도 필요 시 검증).
  - paths 트리거: 설정/리소스 변경 시 배포가 실제로 돌도록 paths 포함 여부.

---

## 3. 롤백 시 확인할 사항

- **로그**: 롤백 전후로 `journalctl` 및 애플리케이션 `error.log`를 한 번씩 저장해 두면, 롤백 원인(기동 실패·헬스체크 실패 등)과 롤백 후 정상 기동 여부를 나중에 추적하기 쉽다.
- **캐시 비우기**: 권한/설정 캐시를 쓰는 경우, 롤백 후에도 이전 버전 코드가 남아 있으므로 서비스 재시작으로 메모리 캐시는 비워진다. 외부(Redis 등) 캐시를 쓰면 필요 시 해당 키 evict 또는 TTL 확인.
- **DB 롤백 필요 여부**: 이번 배포에서 Flyway 마이그레이션을 실행했다면, 롤백 시 JAR만 이전으로 되돌려도 DB 스키마는 그대로다. 데이터 복구가 필요하면 마이그레이션용 롤백 스크립트·백업 복원 절차를 미리 정해 두고, 필요할 때만 실행한다.

---

## 4. 요약 (회의 발언용)

- **리스크**: 최근 알림/메시지 목록 API 응답 구조와 프론트 배열 가정 불일치로 인한 `filter` TypeError, B0KlA 차트용 API의 운영 데이터 부재, 공통 배지·UnifiedModal·NotificationContext 의존 경로/환경 차이가 주요 의심 구간이다. 환경 차이(API URL, CORS, 세션, 빌드)와 DB/캐시/스케줄러·외부 연동 실패도 배포 전 시나리오로 점검하는 것이 좋다.
- **배포 전**: 운영용 설정·환경 변수, 기동 및 에러 로그, `actuator/health`, CI에서 프로파일 설정 검증 및 paths 트리거를 확인한다.
- **롤백 시**: 로그 보관, 필요 시 캐시 비우기(재시작 또는 외부 캐시 evict), Flyway 적용 여부에 따라 DB 롤백 필요 여부를 구분해 둔다.

이 문서는 **코드 수정·배포 실행 없이** 디버거 관점의 의견 정리만 포함한다. 실제 수정·배포는 core-coder 및 배포 담당과 협의해 진행한다.
