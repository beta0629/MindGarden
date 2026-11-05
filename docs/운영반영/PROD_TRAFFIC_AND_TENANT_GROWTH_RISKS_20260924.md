# 운영 트래픽·테넌트 증가 시 병목과 해결 방향

**작성일**: 2026-09-24  
**갱신**: 2026-09-25. 완료와 추후를 나눈다. 다음 작업은 **추후** 절만 보고 시작한다.  
**상태**: 완료는 구현이 있는 항목이다. 추후는 숫자·슬롯·이전을 아직 바꾸지 않은 항목이다.  
**대상**: 운영 백엔드 한 슬롯(블루 8080 / 그린 8081), 웹 로그인, 관리자 대시보드  
**근거**: 2026-09-24 운영 체감과 저장소 설정. 풀 크기·타임아웃·폴링 간격은 코드 값을 따른다.

이 문서는 테넌트가 1개일 때 이미 보이는 느린 로그인과, 테넌트·동시 사용자가 늘면 같은 구조가 커지는 지점을 남긴다.

250,000원 장부와 온라인 상품 화면 변경은 이 문서 범위 밖이다. 완료·추후에 넣지 않는다.

같은 아이디로 여러 명이 동시에 로그인하는 것은 허용된 상태다. 느린 로그인의 원인으로 두지 않고, 완료·추후 목록에도 넣지 않는다.

## 지금 체감되는 것

제일 큰 문제는 백엔드 배포 뒤에 로그인이 매우 느려지는 것이다.

배포가 없던 시점에도 로그인 중·로그인 직후 튕김이 있었다. 2026-09-24 현재 그 튕김은 없다.

같은 날 샵 운영 배포 `b0566b777` 직후 사용자는 새로고침이 느렸고, 이어서 화면이 정상화되고 속도도 양호한 것을 확인했다. 그 확인에서 로그인을 다시 하지는 않았다.

상담 데이터 건수로 로그인이 느리다고 설명하지 않는다.

## 완료

아래는 구현이 있는 항목이다. 이 문서에서 다시 고치지 않는다.

### 운영 라인에 있는 수정

- `66b0931db`: env 동기화가 양쪽 슬롯을 4번 재시작하지 않는다. 트래픽이 없는 슬롯만 1회 재시작한다. GitHub Actions run `35979668251`에서 env 8종은 no-op, green 1회, blue는 재시작하지 않았다.
- `579517a83`: 무효 HttpSession에서 SecurityFilter가 필터 체인을 재시도하지 않는다. 로그인 버튼이 죽은 세션 때문에 끝나지 않던 경로다.
- `fa093106c`: 로그인 버튼이 `checkSession`을 끝까지 기다리지 않는다. 프론트 번들 `main.e2e49651.js` 이후다.
- `2eda73665`: 로그인 직후 백그라운드 401이 유예 중에 사용자를 지우지 않는다. 번들 `main.84feaf87.js`. 프론트 run `35996992497` success.
- `3d0194643`: SNS 웹 콜백이 raw `JSESSIONID`로 Spring Session Base64 쿠키를 덮어쓰지 않는다. 백엔드 run `35999211291` success. 휴대폰 로그인은 원래 그 Set-Cookie를 쓰지 않는다.

이 커밋들은 운영 라인 `release/prod`에 있다.

### 브랜치에 있는 수정

브랜치 `cursor/prod-readiness-warmup-7f13`. 완료의 의미는 구현이 이 브랜치에 있다는 것이다. 운영 반영 여부는 배포 진행.

- `0bf2883de`: 트래픽 전환 전 `GET /api/v1/health/readiness`. DB 연결을 1회 열고 Redis `PING`이 `PONG`인지 본다. 실패하면 nginx 전환을 하지 않는다. 프로브는 `DeploySlotReadinessProbe`, 경로는 `DeploySlotReadinessController`, 게이트는 `.github/workflows/deploy-production.yml`. `/actuator/health`와 `/api/v1/health/server`의 프로세스 생존 확인은 그대로다.
- `386ee4069`: 상담 완료 통계를 tenantId 필수 `GROUP BY`로 집계한다. `ScheduleRepository.countCompletedByConsultantIdsAndDateBetween`, `countCompletedByDateForConsultantIds`. 대시보드 응답 필드는 유지한다. `AdminServiceImpl.getConsultationCompletionStatistics`.
- `386ee4069`: 세션 확인 5분·미읽음 10초는 값을 바꾸지 않고 `frontend/src/constants/clientPollingIntervals.js` 한 곳으로 모았다. `SESSION_CHECK_INTERVAL_MS`, `UNREAD_POLLING_INTERVAL_MS`.
- `386ee4069`: 클라우드 이전용 설정 키의 경계만 모았다. 기본값은 현재 운영과 같다. 실제 서버 이전은 하지 않았다. 키는 `MG_BACKEND_BIND_HOST`(127.0.0.1), `MG_BLUE_PORT`(8080), `MG_GREEN_PORT`(8081), `MG_ACTIVE_BACKEND_FILE`(`/etc/mindgarden/active-backend`), `MG_LOCAL_DB_HOST`(localhost). 세션을 옮길 때는 기존 `REDIS_HOST`, `DB_HOST`, `DB_PORT`, `DB_NAME`을 쓴다. Spring Session Redis는 유지한다. 위치는 `.github/workflows/deploy-production.yml` 머리 주석과 `scripts/ops/assert-prod-slot-host-defaults.sh`.

## 추후

이 절이 다음 작업의 시작점이다. 테넌트와 동시 사용자가 늘면 아직 커지는 것은 풀 10을 나눠 쓰는 한 JVM, `/api/` 60초 안의 느린 응답, 접속 수에 비례하는 폴링, Redis가 느릴 때의 인증 API다. 상담 완료 통계의 상담사별 반복 쿼리는 완료로 옮겼다.

각 항목은 왜 아직인지와, 나중에 어느 파일을 고치면 되는지를 한 줄로 적는다.

- **Hikari 풀.** 상한 10, `connection-timeout` 30000ms, `minimum-idle` 5는 그대로이며 숫자를 키우는 작업은 하지 않았다. 레디니스는 전환 전에 연결을 한 번 열 뿐 풀 크기를 바꾸지 않는다. 나중에 용량 값을 정한 뒤 `src/main/resources/application-prod.yml`의 `HIKARI_MAXIMUM_POOL_SIZE`, `HIKARI_MINIMUM_IDLE`, `HIKARI_CONNECTION_TIMEOUT_MS`만 바꾼다.
- **단일 슬롯.** 레디니스 게이트는 완료이고, 트래픽은 여전히 블루/그린 중 한 JVM만 받는다. 나중에 동시 처리 한도를 용량 값으로 적기 전에는 `.github/workflows/deploy-production.yml`의 upstream 한 줄과 `MG_ACTIVE_BACKEND_FILE`이 가리키는 활성 슬롯 파일을 슬롯 분할로 바꾸지 않는다.
- **nginx `/api/` 60초.** 타임아웃을 늘리지 않는다. 코어 vhost의 `location /api/`는 `config/nginx/core-solution-prod.conf`가 `config/nginx/snippets/mindgarden-core-proxy-params.conf`의 `proxy_read_timeout`·`proxy_send_timeout` 60초를 include한다. 나중에 느린 API는 이 숫자를 키우는 대신 위의 Hikari 용량으로 줄인다. `apply.e-trinity.co.kr`과 `ops.e-trinity.co.kr`의 120초는 이 항목이 아니다.
- **폴링 간격 값.** 5분·10초 자체는 바꾸지 않았고, 상수 위치만 완료다. 동시 접속이 늘면 `current-user`·알림·메시지 API가 접속 수만큼 늘어난다. 나중에 간격이나 구독 방식을 볼 때는 `frontend/src/constants/clientPollingIntervals.js`의 `SESSION_CHECK_INTERVAL_MS`와 `UNREAD_POLLING_INTERVAL_MS`만 수정한다.
- **쿠키 형식.** 형식을 통일하면 재로그인을 강요하므로 계속 범위 밖이다. SNS 웹 콜백이 raw `JSESSIONID`로 쿠키를 덮어쓰지 않는 수정은 완료다. 재로그인을 수용하는 결정이 있기 전에는 `DefaultCookieSerializer`의 `useBase64Encoding`과 쿠키 이름을 바꾸지 않고, 운영 값은 `release/prod`의 `src/main/resources/application-prod.yml`(`spring.session.store-type: redis`, namespace `mindgarden:session`)을 유지한다.
- **클라우드 서버 이전.** 설정 키 경계만 완료이고 서버는 옮기지 않았다. 나중에 `.github/workflows/deploy-production.yml`에서 `REDIS_HOST`, `DB_HOST`, `DB_PORT`, `DB_NAME`과 슬롯 키 `MG_BACKEND_BIND_HOST`, `MG_BLUE_PORT`, `MG_GREEN_PORT`, `MG_ACTIVE_BACKEND_FILE`, `MG_LOCAL_DB_HOST`만 바꾸고, Spring Session Redis와 쿠키 형식은 유지한다. 키를 비우면 기본값은 현재 운영과 같다.

## 참조

- `src/main/resources/application-prod.yml` — 운영 Hikari 풀·Redis 세션
- `src/main/java/com/coresolution/consultation/health/DeploySlotReadinessProbe.java` — DB 연결 1회, Redis PING
- `src/main/java/com/coresolution/consultation/controller/DeploySlotReadinessController.java` — `GET /api/v1/health/readiness`
- `.github/workflows/deploy-production.yml` — 레디니스 후 nginx 전환, 슬롯·이전 키
- `scripts/ops/assert-prod-slot-host-defaults.sh` — 슬롯 키 기본값
- `src/main/java/com/coresolution/consultation/repository/ScheduleRepository.java` — tenantId 필수 완료 건수 GROUP BY
- `config/nginx/snippets/mindgarden-core-proxy-params.conf` — `/api/` 60초
- `config/nginx/core-solution-prod.conf` — 코어 vhost `/api/` include
- `frontend/src/constants/clientPollingIntervals.js` — 5분 세션 확인, 10초 미읽음
