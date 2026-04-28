# 운영 Core 백엔드 블루그린 — 반영 후 스모크·검증 런북

**전제**: 단일 호스트, `mindgarden_core_backend` upstream, 포트 **8080(blue)** / **8081(green)**, 트래픽 표시 `/etc/mindgarden/active-backend`, 스니펫 `/etc/nginx/snippets/mindgarden-core-backend-upstream.conf`.  
**SSOT**: [PRODUCTION_BLUE_GREEN_BACKEND_CUTOVER.md](./PRODUCTION_BLUE_GREEN_BACKEND_CUTOVER.md) · [deployment/README-BLUEGREEN.md](../../deployment/README-BLUEGREEN.md) · [`.github/workflows/deploy-production.yml`](../../.github/workflows/deploy-production.yml).

**테스트 게이트(코드 배치)**: 코드 변경이 수반된 작업은 [CORE_PLANNER_DELEGATION_ORDER.md](../project-management/CORE_PLANNER_DELEGATION_ORDER.md)에 따라 **core-tester** 검증 후 완료로 본다. 본 문서는 **운영·스테이징 점검 창**의 수동·반수동 검증에 해당한다.

---

## 1) 수동·반수동 스모크 체크리스트 (한국어)

| 단계 | 점검 항목 | 기대·판정 | 비고 |
|------|-----------|------------|------|
| **(a) 전환 전** | `curl -sS http://127.0.0.1:8080/actuator/health` | HTTP 200, 본문에 `status`(예: UP) | 블루 슬롯; SSH로 호스트 접속 |
| **(a) 전환 전** | `curl -sS http://127.0.0.1:8081/actuator/health` | 동일 | 그린 슬롯; 한쪽만 기동 중이면 비기동 포트는 실패가 정상일 수 있음 — **배포 직전**에는 비활성 슬롯도 워크플로에서 재기동됨 |
| **(a) 전환 전** | `sudo cat /etc/mindgarden/active-backend` | 한 줄 `blue` 또는 `green` | [CUTOVER](./PRODUCTION_BLUE_GREEN_BACKEND_CUTOVER.md) |
| **(a) 전환 전** | `sudo cat /etc/nginx/snippets/mindgarden-core-backend-upstream.conf` | `server 127.0.0.1:8080` 또는 `8081` 한 줄 | 현재 트래픽과 일치하는지 확인 |
| **(b) dispatch 1회** | GitHub → Actions → **Core Solution 운영 배포** → `Run workflow` | `deploy_ref` = **main**만 허용 | 워크플로 상단 가드 |
| **(b) dispatch 1회** | `workflow_dispatch` 가정: 변경 감지 | 수동 실행 시 **백엔드·프론트·설정·SQL 플래그가 모두 true**로 간주되어 전체 배포 경로 | `changed-files` 스텝: dispatch면 `backend_changed=true` 등 |
| **(b) dispatch 1회** | SSH 연결 테스트 스텝 | 성공 | `PRODUCTION_HOST` / `PRODUCTION_USER` / `PRODUCTION_SSH_KEY` |
| **(b) dispatch 1회** | JAR 업로드 → **블루그린 백엔드·Nginx 적용** | 비활성 슬롯에 JAR 복사 → `systemctl restart mindgarden-core-<inactive>` → **비활성 포트** `actuator/health` 재시도 통과 → 스니펫·`active-backend` 갱신 → `core-solution-prod.conf` 배포 경로 존재 시 `nginx -t`·`reload` | `mindgarden.service` 활성 시 **즉시 실패** |
| **(b) dispatch 1회** | **헬스체크** 잡 | `active-backend` 기준 포트·유닛·localhost `/actuator/health`·`/login` 응답 | [deploy-production.yml](../../.github/workflows/deploy-production.yml) `🏥 헬스체크` |
| **(c) 전환 후(공인)** | 공인 HTTPS로 **API** 1건 (예: 인증 없이 가능한 헬스 또는 공개 메타) | 2xx, 기대 JSON | 실제 호스트명은 테넌트·도메인 정책에 따름; `api.*` vhost는 [core-solution-prod.conf](../../config/nginx/core-solution-prod.conf)의 `error_log` 경로와 대응 |
| **(c) 전환 후(공인)** | API 2건째 (테넌트 헤더·Bearer 필요 시) | 200 / 401이 스펙대로 | [API_DESIGN_STANDARD.md](../standards/API_DESIGN_STANDARD.md), [TESTING_STANDARD.md](../standards/TESTING_STANDARD.md) — 통합 테스트 관례 참고 |
| **(c) 전환 후(공인)** | **OAuth**: apex 콜백·세션 쿠키 도메인 | 로그인 플로우 1회: 리다이렉트·콜백 URL이 등록 클라이언트와 일치, 세션 유지 | 워크플로 주석: `SESSION_COOKIE_DOMAIN` — [mindgarden.prod-env.example](../../deployment/mindgarden.prod-env.example) |
| **(c) 전환 후(공인)** | 브라우저에서 `/login/oauth2/*` 또는 앱이 사용하는 콜백 경로 | 302/200 체인 정상, 오류 페이지 없음 | Nginx는 `/oauth2/`, `/login/oauth2/` 를 동일 upstream으로 프록시 ([README-BLUEGREEN](../../deployment/README-BLUEGREEN.md)) |
| **(d) 롤백 1회** | 이전 슬롯 포트로 **스니펫** 복구: `server 127.0.0.1:<이전_포트>;` | 파일만 선행 편집 | [CUTOVER 롤백 요지](./PRODUCTION_BLUE_GREEN_BACKEND_CUTOVER.md) |
| **(d) 롤백 1회** | `echo <이전슬롯> \| sudo tee /etc/mindgarden/active-backend` | `blue`/`green` 이 트래픽과 일치 | 표시용·운영 런북 정합 |
| **(d) 롤백 1회** | `sudo nginx -t` | 구문 검사 통과 | 실패 시 이전 스니펫 백업에서 복원 |
| **(d) 롤백 1회** | `sudo systemctl reload nginx` | 에러 없이 reload | 방화벽 변경 없음 |
| **(d) 롤백 1회** | `curl -sS http://127.0.0.1:<이전_포트>/actuator/health` | UP | 트래픽이 다시 이전 JVM으로 향하는지 확인 |

---

## 2) CI에서 자동화하기 적합한 것만

| 자동화 후보 | 설명 | 중복 방지 |
|-------------|------|-----------|
| **워크플로 내 이미 구현된 검증** | 비활성 슬롯 localhost 헬스, `nginx -t`, 트래픽 슬롯 기준 헬스 잡 | 동일 단계를 문서에만 반복 명시 |
| **`actionlint` / YAML 정적 검사** | 배포 YAML 품질 | **이미 deployer·CI에서 수행 중이면 추가 파이프라인 불필요** |
| **`workflow_dispatch` 후 `gh run watch`** | 통합 오케스트레이션 시 ([GITHUB_ACTIONS_WORKFLOW_INDEX.md](./GITHUB_ACTIONS_WORKFLOW_INDEX.md)) | 사람이 Actions UI만 보는 것보다 이탈 적음 |
| **새 JUnit** | 블루그린·듀얼 포트·Nginx 전환 자체는 **단위 테스트로 대체 불가** | 서비스·슬롯 Mock은 회귀 가치 낮음 → **권장하지 않음** |
| **새 Playwright(E2E)** | 공인 URL·OAuth·멀티 인스턴스·시크릿 필요 | [TESTING_STANDARD.md](../standards/TESTING_STANDARD.md) 피라미드에 맞게 **스테이징 전용** 브랜치·환경변수·시크릿으로만 문서화; 로컬 단일 8080만 대상 E2E는 **의미 없으므로 추가하지 않음** |

---

## 3) 권장 실행 순서 (운영·스테이징 공통 골격)

1. 점검 창 공지(필요 시) → SSH 접속 가능 확인.  
2. **(a)** localhost 헬스·`active-backend`·스니펫 일관성.  
3. **(b)** `workflow_dispatch` 실행(또는 push 트리거) → Actions 로그에서 블루그린·Nginx·헬스 스텝 성공 확인.  
4. **(c)** 공인 URL에서 API·OAuth 스모크.  
5. **(d)** (연습 또는 장애 시) 롤백 시나리오 1회 → 헬스 재확인.

---

## 4) Secrets·SSH 필요 여부

| 구분 | 필요 |
|------|------|
| GitHub Actions 실행 | `PRODUCTION_HOST`, `PRODUCTION_USER`, `PRODUCTION_SSH_KEY` (및 선택 `PRODUCTION_DB_*`, `PRODUCTION_DB_PASSWORD` 등 기존 [deploy-production.yml](../../.github/workflows/deploy-production.yml)) |
| 호스트에서 (a)(d) 수동 | 배포 계정 SSH + **sudo**(nginx·systemd·`/etc/mindgarden`) |
| 공인 (c) | 브라우저·`curl`; 별도 시크릿 없음(클라이언트 자격은 기존 정책) |

---

## 5) 실패 시 수집할 로그·경로

| 대상 | 명령·경로 |
|------|-----------|
| 블루 JVM | `sudo journalctl -u mindgarden-core-blue.service -n 120 --no-pager` |
| 그린 JVM | `sudo journalctl -u mindgarden-core-green.service -n 120 --no-pager` |
| 애플리케이션 파일 로그(워크플로 참조) | `tail -100 /var/www/mindgarden/logs/mindgarden-prod.log` (존재 시) |
| Nginx (API vhost 예시) | `/var/log/nginx/api.core-solution.co.kr.error.log`, `access.log` — vhost별 전체 목록은 [core-solution-prod.conf](../../config/nginx/core-solution-prod.conf) 내 `error_log` 지시문 |
| Nginx 전역(호스트 관례) | `/var/log/nginx/error.log` (있는 경우) |
| GitHub Actions | 실패 스텝 로그 전문(특히 **블루그린 백엔드·Nginx 적용**, **헬스체크**) |

---

## 6) `ONGOING_WORK_MASTER_PROGRESS_CHECKLIST.md`용 한 줄 메모 초안

`[2026-04-28] 운영 Core 백엔드 BG(8080/8081, active-backend, mindgarden_core_backend) 반영 후 검증: localhost 헬스·dispatch·공인 API/OAuth·롤백(nginx -t/reload) 완료 — 런북 docs/deployment/PRODUCTION_BLUE_GREEN_BACKEND_SMOKE.md`

(파일 본문에 반영은 **승인 후** 편집.)
