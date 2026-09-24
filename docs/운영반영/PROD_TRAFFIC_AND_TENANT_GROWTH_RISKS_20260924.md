# 운영 트래픽·테넌트 증가 시 병목과 해결 방향

**작성일**: 2026-09-24  
**상태**: 기록. 아래 「아직 열린 구조」는 구현하지 않는다.  
**대상**: 운영 백엔드 한 슬롯(블루 8080 / 그린 8081), 웹 로그인, 관리자 대시보드  
**근거**: 2026-09-24 운영 체감과 저장소 설정. 풀 크기·타임아웃·헬스·페이지 크기·폴링 간격은 코드 값을 따른다.

이 문서는 테넌트가 1개일 때 이미 보이는 느린 로그인과, 테넌트·동시 사용자가 늘면 같은 구조가 커지는 지점을 남긴다. 코드 기능은 바꾸지 않았다.

250,000원 장부와 온라인 상품 화면 변경은 이 문서 범위 밖이다.

## 지금 체감되는 것

제일 큰 문제는 백엔드 배포 뒤에 로그인이 매우 느려지는 것이다.

같은 아이디로 여러 명이 동시에 로그인하는 것은 허용된 상태다. 느린 로그인의 원인으로 두지 않는다.

배포가 없던 시점에도 로그인 중·로그인 직후 튕김이 있었다. 2026-09-24 현재 그 튕김은 없다.

같은 날 샵 운영 배포 `b0566b777` 직후 사용자는 새로고침이 느렸고, 이어서 화면이 정상화되고 속도도 양호한 것을 확인했다. 그 확인에서 로그인을 다시 하지는 않았다.

상담 데이터 건수로 로그인이 느리다고 설명하지 않는다.

## 테넌트가 늘면 커지는 것

트래픽은 블루/그린 중 한 JVM만 받는다. 그 JVM의 DB 연결 풀 기본 상한은 10이다. 테넌트와 동시 사용자가 늘면 이 10개가 공유 병목이 된다.

관리자 대시보드의 상담 완료 통계는 상담사 수만큼 쿼리를 반복한다. 테넌트마다 그 반복이 곱해진다.

로그인 이후 세션 확인과 읽지 않은 알림 폴링은 동시 접속 수만큼 `current-user`·알림·메시지 API를 늘린다.

웹 세션이 Redis에 있으면 Redis가 느릴 때 인증 API가 같이 느려진다.

## 이미 운영에 반영된 수정

아래는 해결된 항목이다. 이 문서에서 다시 고치지 않는다.

- `66b0931db`: env 동기화가 양쪽 슬롯을 4번 재시작하지 않는다. 트래픽이 없는 슬롯만 1회 재시작한다. GitHub Actions run `35979668251`에서 env 8종은 no-op, green 1회, blue는 재시작하지 않았다.
- `579517a83`: 무효 HttpSession에서 SecurityFilter가 필터 체인을 재시도하지 않는다. 로그인 버튼이 죽은 세션 때문에 끝나지 않던 경로다.
- `fa093106c`: 로그인 버튼이 `checkSession`을 끝까지 기다리지 않는다. 프론트 번들 `main.e2e49651.js` 이후다.
- `2eda73665`: 로그인 직후 백그라운드 401이 유예 중에 사용자를 지우지 않는다. 번들 `main.84feaf87.js`. 프론트 run `35996992497` success.
- `3d0194643`: SNS 웹 콜백이 raw `JSESSIONID`로 Spring Session Base64 쿠키를 덮어쓰지 않는다. 백엔드 run `35999211291` success. 휴대폰 로그인은 원래 그 Set-Cookie를 쓰지 않는다.

이 커밋들은 운영 라인 `release/prod`에 있다.

## 아직 열린 구조

구현하지 않는다. 방향만 적는다.

### 1. DB 연결 풀이 작고, 새 JVM의 첫 요청이 오래 기다린다

운영 프로파일 `src/main/resources/application-prod.yml`은 환경 변수가 없을 때 다음을 쓴다.

- `spring.datasource.hikari.maximum-pool-size`: `${HIKARI_MAXIMUM_POOL_SIZE:10}` → 10
- `spring.datasource.hikari.minimum-idle`: `${HIKARI_MINIMUM_IDLE:5}` → 5
- `spring.datasource.hikari.connection-timeout`: `${HIKARI_CONNECTION_TIMEOUT_MS:30000}` → 30000ms (30초)

이 10과 30초는 HikariCP 라이브러리 기본값(`maximumPoolSize` 10, `connectionTimeout` 30000ms)과 같다. 베이스 `src/main/resources/application.yml`은 `maximum-pool-size: 8`, `connection-timeout: 5000`이지만, 운영은 prod 프로파일이 위의 10과 30000ms로 덮어쓴다. 같은 베이스 파일의 `initialization-fail-timeout: -1`은 prod가 덮어쓰지 않아서, DB 연결이 바로 되지 않아도 JVM 기동은 막지 않는다.

배포로 새 JVM이 뜨면 첫 요청은 풀에서 연결을 받을 때까지 최대 30초를 기다릴 수 있다. 테넌트와 동시 사용자가 늘면 풀 10이 공유 병목이다.

해결 방향: 트래픽을 넘기기 전에 DB 연결을 실제로 한 번 연다. 레디니스가 DB와 Redis를 통과한 뒤에만 nginx를 전환한다. 풀 크기는 테넌트가 늘 때 별도 용량 값으로 정한다. 이 문서에서 풀 크기를 바꾸지 않는다.

### 2. 트래픽은 슬롯 하나만 받는다

활성 슬롯은 파일 `/etc/mindgarden/active-backend`에 적힌다. blue는 8080, green은 8081이다. 배포 워크플로는 헬스가 통과한 비활성 슬롯으로 upstream을 옮기고, 라이브 upstream은 서버 하나다.

해결 방향: 전환 전에 그 슬롯을 웜업한다. 테넌트가 늘면 한 JVM이 받을 수 있는 동시 처리 한도를 용량 값으로 문서에 적고, 그 한도를 넘기 전에 풀·레디니스·대시보드 쿼리(1·3·5)를 먼저 본다.

### 3. 전환에 쓰는 헬스가 DB·Redis 준비와 같지 않다

`GET /api/v1/health/server`(`SystemHealthController.checkServerHealth`)는 DB 연결을 열지 않고 Redis도 보지 않는다. 프로세스 응답으로 `healthy`를 반환한다.

`GET /actuator/health`는 운영 설정에서 DB·Redis 인디케이터를 끄지 않는다. `src/main/resources/application.yml`의 `management.endpoint.health.show-details`는 `when-authorized`라서, 인증 없는 호출은 컴포넌트(db, redis)를 본문에 보여 주지 않고 합산 `status`만 받는다. `.github/workflows/deploy-production.yml`은 이 URL의 HTTP 성공만 보고 nginx upstream을 전환한다. 풀을 미리 채우는 단계는 없다.

그래서 프로세스는 살아 있는데 로그인 요청은 연결을 기다릴 수 있다.

해결 방향: 전환 게이트용 레디니스에 DB와 Redis 확인을 넣는다. 통과한 뒤에만 nginx를 바꾼다. 지금 쓰는 `/actuator/health`와 `/api/v1/health/server`의 용도(프로세스가 살아 있는지)는 유지한다. DB를 보는 별도 경로 `GET /api/v1/health/database`는 이미 있으나, 배포 전환 조건은 그 경로가 아니다.

### 4. nginx `/api/`는 60초 뒤 504가 난다

MindGarden 코어 vhost(`core-solution.co.kr`의 인증 경로, `app.core-solution.co.kr`, 테넌트 서브도메인)에서 `/api/`의 `proxy_read_timeout`과 `proxy_send_timeout`은 60초다. 파일은 `config/nginx/core-solution-prod.conf`다. 오리진이 그 시간을 넘기면 nginx가 504를 반환한다. `apply.e-trinity.co.kr`과 `ops.e-trinity.co.kr`의 `/api/`는 120초이며 이 항목의 대상이 아니다.

해결 방향: 느린 API를 60초까지 끌지 않도록 위의 1(연결 웜업·풀)과 아래 5(대시보드 집계)를 먼저 한다. 타임아웃 숫자 자체를 늘리는 것은 해결책으로 두지 않는다.

### 5. 관리자 대시보드가 통계가 끝날 때까지 로딩이다

`frontend/src/components/dashboard-v2/AdminDashboardV2.js`의 `loadStats`는 상담사·내담자·매칭·평점·`consultation-completion`·신규 내담자·요일별 통계를 `Promise.allSettled`로 모두 끝낸 뒤에 초기 로딩을 내린다.

`GET /api/v1/admin/statistics/consultation-completion`은 상담사마다 완료 건수와 총 건수를 따로 조회한다. 이어서 월 12·주 6·일 14·연 5 구간을 만들고, 각 구간의 완료 건수도 상담사 수만큼 다시 조회한다 (`AdminController.getConsultationCompletionStatistics`, `AdminServiceImpl`). 이전 측정은 상담사 5명에 SQL 약 125회(N+1)였다. 이번 문서에서 그 쿼리를 다시 재지 않았다. 집계를 `GROUP BY`로 바꾸는 작업은 이번에 의도적으로 미룬다.

대시보드 목록의 페이지 크기는 20이다. `frontend/src/constants/adminDashboard.js`의 `DEFAULTS.PAGE_SIZE`이며, `ADMIN_DASHBOARD_LIST_PAGE_SIZE`가 그 값을 쓴다.

해결 방향: 상담사별 반복 쿼리를 집계 쿼리로 바꾼다. 테넌트마다 이 쿼리가 곱해지므로, 테넌트가 늘기 전에 집계로 바꾸는 편이 맞다. 이번 범위에서는 쿼리를 수정하지 않는다.

### 6. 로그인 후 폴링이 접속 수만큼 API를 늘린다

`frontend/src/constants/session.js`의 `SESSION_CHECK_INTERVAL`은 `5 * 60 * 1000`(5분)이다. `SessionContext`는 이 간격으로 silent `checkSession`을 호출한다.

`frontend/src/constants/magicNumbers.js`의 `TIME_CONSTANTS.POLLING_INTERVAL`은 `10000`(10초)이다. `NotificationContext`는 이 간격으로 읽지 않은 메시지 수와 알림 수를 다시 조회한다.

동시 접속이 늘면 `current-user`·알림·메시지 API가 접속 수에 비례해 늘어난다.

해결 방향: 폴링 간격과 구독 방식은 테넌트가 늘 때 다시 본다. 지금은 간격을 바꾸지 않는다.

### 7. 웹 세션은 Redis에 있고, Redis가 느리면 로그인도 느려진다

운영 라인 `release/prod`의 `src/main/resources/application-prod.yml`은 `spring.session.store-type: redis`, namespace `mindgarden:session`이다. 쿠키 이름은 `JSESSIONID`다. Spring Session `DefaultCookieSerializer`는 `useBase64Encoding=true`이며, 운영 코드는 SNS 웹 콜백이 raw 세션 id로 그 쿠키를 덮어쓰지 않게 맞춰 두었다(`3d0194643`). 이 문서의 기준 트리 `main`의 같은 yml에는 `spring.session.store-type` 키가 아직 없다. 운영에서 쓰는 값은 `release/prod` 쪽이다.

같은 운영 yml의 Redis 클라이언트 `timeout`은 `2000ms`, Jedis 풀 `max-active`는 8이다. `main`과 `release/prod`가 이 두 값은 같다. Redis가 느리면 세션을 읽는 인증 API가 같이 느려진다.

해결 방향: Redis 지연을 레디니스와 알람에 포함한다. 쿠키 형식을 통일하는 작업은 재로그인을 강요하므로 이번 범위 밖이다.

## 참조

- `src/main/resources/application-prod.yml` — 운영 Hikari 풀·Redis 클라이언트
- `src/main/resources/application.yml` — 베이스 Hikari, Actuator `show-details`
- `src/main/java/com/coresolution/consultation/controller/SystemHealthController.java` — `/api/v1/health/server`
- `config/nginx/core-solution-prod.conf` — `/api/` 60초
- `.github/workflows/deploy-production.yml` — `/etc/mindgarden/active-backend`, 8080/8081, `/actuator/health` 후 전환
- `frontend/src/components/dashboard-v2/AdminDashboardV2.js` — `loadStats`
- `frontend/src/constants/session.js`, `frontend/src/constants/magicNumbers.js` — 5분 세션 확인, 10초 폴링
