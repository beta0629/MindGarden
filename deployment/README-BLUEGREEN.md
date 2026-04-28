# MindGarden Core 운영 — 블루그린(단일 호스트·듀얼 포트) 예시

**범위**: Core 백엔드 JVM 두 개(서로 다른 `SERVER_PORT`) + Nginx가 API만 upstream 전환.  
**정적 프론트**: `config/nginx/core-solution-prod.conf` 의 `root /var/www/mindgarden/frontend` 는 **그대로** 유지한다([무중단 갭·로드맵](../docs/deployment/ZERO_DOWNTIME_GAP_AND_ROADMAP.md) 부록과 동일 전제).

**저장소 산출물**

| 경로 | 설명 |
|------|------|
| `deployment/systemd/mindgarden-core-blue.service.example` | 블루 슬롯 systemd 예시 |
| `deployment/systemd/mindgarden-core-green.service.example` | 그린 슬롯 systemd 예시 |
| `config/nginx/snippets/upstream-mindgarden-core-api-bluegreen.conf.example` | `upstream` + 주석 가이드 |

공통 비밀·DB·OAuth 등은 **`/etc/mindgarden/prod.env`**(또는 기존 호스트 관례에 맞는 경로)만 사용하고, 저장소에는 예시 파일 `deployment/mindgarden.prod-env.example` 만 둔다.

---

## 기존 `mindgarden.service` 와의 관계

운영 자동 배포는 **`deploy-production`** 의 블루그린 SSH 구간을 따른다([PRODUCTION_BLUE_GREEN_BACKEND_CUTOVER.md](../docs/deployment/PRODUCTION_BLUE_GREEN_BACKEND_CUTOVER.md), [ZERO_DOWNTIME_GAP_AND_ROADMAP.md](../docs/deployment/ZERO_DOWNTIME_GAP_AND_ROADMAP.md)). 레거시 **`mindgarden.service`** 와는 병행하지 않는다.

**마이그레이션 요약**

1. Nginx를 `127.0.0.1:8080` 단일 프록시에서 **upstream 블루그린**으로 바꾸기 전에, 먼저 **비활성 슬롯 하나**(예: 그린 **8081**)에 JAR 배포·기동·`curl -sf http://127.0.0.1:8081/actuator/health` 로 검증. (슬롯 고정 포트: blue **8080**, green **8081**.)
2. upstream에서 **현재 단일 인스턴스 포트(예: 8080)** 를 활성으로 두거나, 비활성 슬롯 포트로 전환한 뒤 `nginx -t` && `systemctl reload nginx`.
3. **`mindgarden.service` 중지·비활성화** (`sudo systemctl disable --now mindgarden.service`) 후, `mindgarden-core-blue` / `mindgarden-core-green` 만 사용. (이름 충돌 방지: 기존 유닛 파일명은 호스트에 그대로 두지 말고 백업 후 제거하거나 `mindgarden.service` 를 래퍼로 두지 말 것 — 이중 기동 방지.)

서비스 유닛 이름은 호스트 정책에 맞게 바꿔도 된다. 본 README의 `mindgarden-core-*` 는 **예시 네이밍**이다.

---

## 슬롯 전환(운영자 표시) 파일 형식

저장소는 **강제 포맷을 정하지 않는다**. 운영팀이 아래 중 하나로 표준화하면 된다.

| 방식 | 설명 |
|------|------|
| **Nginx만 편집** | `upstream` 블록에서 `weight` 또는 `server` 줄 주석으로 활성 슬롯만 남긴다. 변경 후 반드시 `nginx -t` 후 `reload`. |
| **심볼릭 링크** | `/etc/nginx/conf.d/active-core-upstream.conf` → `upstream-active-blue.conf` / `upstream-active-green.conf` 등으로 스왑. GitOps 시에는 링크 대상만 변경. |
| **한 줄 텍스트** | 예: `/etc/mindgarden/active_core_slot` 에 `blue` 또는 `green` 만 기록해 **문서/런북 상의 표시**로 쓰고, 실제 전환은 여전히 Nginx/systemd 에 반영(자동화 시 deployer 가 이 파일을 읽도록 합의). |

`SPRING_APPLICATION_JSON` 으로 포트를 넣는 방식도 가능하나, 본 저장소 예시는 **`SERVER_PORT` 환경변수**(`application.yml` 의 `server.port: ${SERVER_PORT:8080}`)를 권장한다.

---

## 최초 배포 순서(요약)

1. `/etc/mindgarden/prod.env` 준비(`deployment/mindgarden.prod-env.example` 참고). **블루그린 시 `SERVER_PORT` 는 비워 두고** 유닛 파일의 `Environment=SERVER_PORT=...` 로만 구분하는 것을 권장.
2. 디렉터리 생성: 예) `/var/www/mindgarden/core-blue`, `core-green` 에 각각 `app.jar`(또는 동일 빌드 아티팩트명) 배치.
3. `deployment/systemd/*.service.example` 를 `/etc/systemd/system/` 에 복사 후 `User`/`WorkingDirectory`/`ExecStart`·힙 크기를 호스트에 맞게 수정.
4. `systemctl daemon-reload && systemctl enable --now mindgarden-core-blue` (또는 그린 한쪽만 먼저).
5. Nginx: `http {}` 안에 `config/nginx/snippets/upstream-mindgarden-core-api-bluegreen.conf.example` 를 참고해 **`/etc/nginx/snippets/mindgarden-core-backend-upstream.conf`** 를 두고, `core-solution-prod.conf` 의 **`include`** 및 **`/api/`·`/actuator/`·`/oauth2/`·`/login/oauth2/`** 의 `proxy_pass http://mindgarden_core_backend;` 를 유지한다(저장소 vhost는 이미 해당 upstream 이름 사용). **SPA `root`·`location /`·`location ^~ /static/` 는 변경하지 않는다.**
6. `sudo nginx -t && sudo systemctl reload nginx`
7. 나머지 슬롯 기동 → 헬스 확인 → upstream 에서 트래픽을 원하는 슬롯으로 전환.

---

## 롤백

1. **Nginx**: 이전에 동작하던 슬롯으로 `upstream` 의 `weight`/`server` 줄을 되돌리거나, 심볼릭 링크를 이전 대상으로 복구 → `nginx -t` → `reload`.
2. **JVM**: 문제 슬롯만 `systemctl stop mindgarden-core-<slot>.service` 후, 이전 JAR로 바이너리 교체·재기동(슬롯별 `WorkingDirectory` 백업 정책은 운영 런북에 따름).

CI/CD 자동화는 [GITHUB_ACTIONS_WORKFLOW_INDEX.md](../docs/deployment/GITHUB_ACTIONS_WORKFLOW_INDEX.md) 및 `core-deployer` 합의 후 별도 반영한다.
