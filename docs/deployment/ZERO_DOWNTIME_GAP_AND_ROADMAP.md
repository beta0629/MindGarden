# 무중단(블루그린·동등) 요구 대비 — 현재 갭·절차 정합·인프라 질문 (SSOT)

**문서 유형**: 배포 아키텍처 갭 분석 · core-planner·core-deployer 사전 조사 정합  
**근거**: 저장소 워크플로·인덱스·Go-Live 체크리스트·배포 스킬만 (Secrets·실 URL·키 **추측 없음**).  
**유지보수**: 워크플로 `on:`·잡 구조가 바뀌면 본 문서의 단계명 인용을 동기화한다.

---

## 한 줄 결론

현재 파이프라인은 **단일 인스턴스(systemd) 정지 후 배포·동일 디렉터리 덮어쓰기**가 중심이라, **블루그린·롤링·트래픽 분할 수준의 무중단은 저장소 기준으로 미구현(No)** 에 가깝다. 백업·헬스·(개발) 롤백은 **부분(Partial)** 이다.

---

## 1. 현재 방식 요약 (저장소 기준)

- **Core 운영 (`deploy-production.yml`)**: `main` push(paths·온보딩 제외 Java 등) 및 `workflow_dispatch`(`deploy_ref`는 `main`만). GitHub에서 Maven·프론트 빌드 후 SSH로 `PRODUCTION_HOST` 등 Secrets 경유. **백엔드**: 비활성 슬롯 JAR 반영 → `mindgarden-core-{blue,green}.service` 재시작 → localhost `actuator/health` → **Nginx upstream 스니펫** 갱신 → `nginx -t`·`reload` → `active-backend` 갱신(레거시 `mindgarden.service` 전면 stop 패턴은 제거). 상세: [PRODUCTION_BLUE_GREEN_BACKEND_CUTOVER.md](./PRODUCTION_BLUE_GREEN_BACKEND_CUTOVER.md).
- **Core 개발 백엔드 (`deploy-backend-dev.yml`)**: `develop` push(paths) 또는 dispatch. **`mindgarden-dev.service` 중지** → 백업 → JAR·유틸·systemd 업로드 → **재시작** → `localhost:8080/actuator/health` 재시도; 기동 실패 시 **최신 JAR 백업으로 롤백** 시도.
- **정적 사이트 SSH 공통 (`reusable-static-site-ssh-deploy.yml`)**: 원격 `/var/www/backups/...`에 **기존 `remote_html_dir` tar 백업** → **동일 `remote_html_dir`에 SCP 덮어쓰기** → 권한·`index.html` 존재 확인 → (선택) `nginx -t` 후 **원격에서 `curl` 헬스**(문서화된 공개 URL은 [GITHUB_ACTIONS_WORKFLOW_INDEX.md](./GITHUB_ACTIONS_WORKFLOW_INDEX.md) 표 참고).
- **운영 통합 (`deploy-unified-production.yml`)**: `workflow_dispatch`로 `deploy-production`·Trinity/Ops 프론트·Ops 백엔드·프로시저 워크플로를 **순차 디스패치 + `gh run watch`**. 무중단을 추가하지 않고 **실행 순서만 오케스트레이션**한다.
- **Go-Live·배포 표준**: [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) 7절(수동 게이트·롤백·다운타임 공지), [DEPLOYMENT_STANDARD.md](../standards/DEPLOYMENT_STANDARD.md)·[DEV_DEPLOYMENT_STABILITY_CHECKLIST.md](../troubleshooting/DEV_DEPLOYMENT_STABILITY_CHECKLIST.md)는 스킬 [`core-solution-deployment`](../../.cursor/skills/core-solution-deployment/SKILL.md)에서 교차 참조.

---

## 2. 무중단 요구 대비 평가 (No / Partial / Yes) + 워크플로 근거

| 영역 | 판정 | 근거(단계·잡명 수준) |
|------|------|----------------------|
| **Core 백엔드 운영** | **Partial** (BG 저장소 반영 후) | `deploy-production.yml` — 단일 `mindgarden.service` stop/start 제거. **이중 JVM**(blue/green 포트)·**upstream 스니펫 + reload** 로 트래픽 전환. 다만 **DB Flyway·호환 expand/contract**·**프론트 원자 스왑**은 여전히 별도 합의·절차 필요 → 완전 무중단 아님. |
| **Core 백엔드 개발** | **No** (복구는 Partial) | `deploy-backend-dev.yml` — `🚀 개발 서버 배포 준비`에서 **stop**, `🔄 개발 서버 서비스 재시작`에서 **stop/start**; 무중단 아님. **Partial**: 기동 실패 시 **이전 JAR 복사·재시작** 롤백 분기 존재. |
| **정적 프론트(재사용 SSH)** | **No~Partial** | `reusable-static-site-ssh-deploy.yml` — **`📤 정적 파일 업로드 SCP`**가 **동일 루트에 overwrite**; 원자적 디렉터리 스왑(예: `release` → `current` symlink 전환) 없음. **Partial**: 배포 전 **tar 백업**, 배포 후 **헬스 URL curl**. |
| **통합 운영 오케스트레이션** | **No** | `deploy-unified-production.yml` — `orchestrate` 잡이 하위 워크플로를 **순차 실행**할 뿐, 트래픽 드레인/카나리/BG 없음. |
| **LB·헬스 드레인(저장소 외)** | **미기술** | 본 저장소 YAML만으로는 **ALB/Nginx upstream 다중 백엔드·드레인** 존재 여부를 단정할 수 없음 → 인프라 질문으로 상향. |

---

## 3. Go-Live 체크리스트 7.x 등과의 갭

| 체크리스트 | 요지 | 현재 저장소와의 갭 |
|------------|------|-------------------|
| [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) **7.3** | 운영 배포 **수동 게이트** | `deploy-production.yml`·`deploy-unified-production.yml`가 **`workflow_dispatch`** — **정합(Yes)**. |
| 동일 **7.4** | **롤백**: 이전 JAR·정적 백업 경로·복구·헬스 | 운영: JAR·프론트 **백업 스크립트 존재**; 자동 롤백 잡은 **핵심으로 명시되지 않음** — **Partial**. 개발: JAR **자동 롤백 시도** — **Partial**. 정적: **tar 보관(개수 제한)** — **Partial**. |
| 동일 **7.5** | 배포 중 **다운타임 공지** 채널(기획) | GitHub Actions·워크플로에 **공지 연동 단계 없음** — **갭: 프로세스/도구는 체크리스트 외부**에서 운영 필요. |
| 동일 **5.2** | 마이그레이션 **스테이징·dry-run** | 워크플로 본문은 **Flyway를 “배포 후 로그로 확인”** 수준; **무중단 DB 전략과의 정합은 문서만으로 불충분** — **갭·Partial**. |
| [core-solution-deployment 스킬](../../.cursor/skills/core-solution-deployment/SKILL.md) | 실패 시 **로그·롤백 절차** | 개발 백엔드에 롤백 분기 있음; 운영 통합은 **하위 런 성공/실패 watch**; **앱 레벨 무중단과는 별개** — 스킬 취지와 **부분 정합**. |

---

## 4. 권장 (한 단락씩)

**개발(`develop`·`deploy-backend-dev` 등)**  
단일 `mindgarden-dev` 인스턴스와 **stop/start** 전제이므로, “무중단”을 요구하면 **스테이징 인스턴스·포트 분리·Nginx upstream 2대** 같은 **인프라측 이중화** 없이는 CI만으로는 달성 불가하다. 당장은 **배포 시간대·연결 정리·헬스·JAR 롤백**으로 **다운타임·복구 리스크를 문서화**하고, 무중단이 목표면 **개발도 BG/롤링 대상 토폴로지**를 먼저 합의하는 것이 순서다.

**운영(`main`·`deploy-production`·`deploy-unified-production`)**  
운영은 이미 **수동 디스패치 게이트**가 있으나, **서비스 중지 창**이 명시되어 있어 **사용자 체감 무중단과 상충**한다. 무중단을 제품 요구로 채택하면 **이중 systemd·소켓 활성화·컨테이너 오케스트레이션·Nginx `reload`만으로의 전환** 등 **플랫폼 설계 변경**과, 통합 워크플로의 **단계별 드레인·헬스 게이트** 정의가 필요하다(구현은 `core-coder`·인프라 합의 후).

---

## 5. 인프라·플랫폼 팀 질문 (5~8개, 추측 배제)

1. 운영 **Core API** 앞단에 **다중 백엔드 upstream**(예: 둘 이상의 JVM/호스트)이 존재하는가, 아니면 **단일 노드**인가?  
2. 배포 시 **트래픽 드레인**(기존 연결 종료 대기)·**헬스 불량 시 자동 제외**가 LB/프록시에 설정되어 있는가?  
3. 정적 자산(`html-*`·`/var/www/mindgarden/frontend`)에 대해 **원자적 릴리스**(예: 버전 디렉터리 + symlink 스왑)를 **Nginx 레벨에서 허용**하는가?  
4. **DB 마이그레이션(Flyway)** 을 앱 가동 중 적용할 때, **호환되는 이전·신규 앱 동시 가동**(expand/contract) 정책이 있는가?  
5. **systemd** 기준으로 **블루/그린 두 유닛**(포트 분리)과 **리버스 프록시 전환만 reload** 같은 패턴을 **현재 서버 표준**으로 쓸 수 있는가?  
6. `deploy-unified-production` 순서에서 **의도된 전역 다운타임 창**이 있는가, 아니면 **서비스별 독립 가용성** 목표인가?  
7. **온보딩 백엔드**([워크플로 인덱스](./GITHUB_ACTIONS_WORKFLOW_INDEX.md)에 “운영 전용 자동 없음” 기술)를 **Core JAR와 동일 무중단 기준**으로 묶을지, **별도 RTO**를 둘지?  
8. 운영 **헬스 소스**는 GitHub에서 보는 `localhost:8080/actuator/health`와 **외부 모니터링**이 동일한가(경로·인증·캐시 차이)?  

---

## 6. 다음 단계 (표: A~G 중 해당 행만)

| ID | 다음 단계 | 산출·완료 신호 |
|----|------------|----------------|
| **A** | 무중단 **RTO/RPO·범위**(Core만 / 정적 포함 / DB 포함) 기획 합의 | core-planner 티켓·승인 문구 |
| **B** | 인프라 토폴로지(위 질문) **답변 수집** | 방화벽·LB·디렉터리 스왑 가능 여부 문서화 |
| **C** | 합의된 토폴로지에 맞춰 **워크플로·서버 스크립트 변경안** 설계 | `core-coder` 위임 + `core-tester` 검증 항목 |
| **D** | **스테이징**에서 stop/start 대비 **드레인·스왑** 시뮬레이션 | 스모크·헬스 로그 증적 |
| **E** | [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) **7.4·7.5**에 **무중단/공지·롤백** 절차 문구 보강 | 체크리스트 개정 PR |
| **F** | 통합 배포(`deploy-unified-production`) **단계별 가용성 영향** 표기 | [GITHUB_ACTIONS_WORKFLOW_INDEX.md](./GITHUB_ACTIONS_WORKFLOW_INDEX.md) 보조 절 추가 |
| **G** | [DEPLOYMENT_STANDARD.md](../standards/DEPLOYMENT_STANDARD.md)에 **무중단 패턴**(채택 시) 한 절 반영 | 표준 문서 버전·날짜 |

**본 턴에서 생략된 행**: 없음 — 위 행은 전부 “무중단 요구가 채택된 경우”에 해당하는 **권장 순서**이며, 요구가 없으면 **A에서 범위 미적용**으로 종료하면 된다.

---

## 참조 링크 (저장소 내)

- [GITHUB_ACTIONS_WORKFLOW_INDEX.md](./GITHUB_ACTIONS_WORKFLOW_INDEX.md)  
- [PRODUCTION_BLUE_GREEN_BACKEND_CUTOVER.md](./PRODUCTION_BLUE_GREEN_BACKEND_CUTOVER.md)  
- [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md)  
- [`core-solution-deployment` 스킬](../../.cursor/skills/core-solution-deployment/SKILL.md)  
- 워크플로: `deploy-production.yml`, `deploy-backend-dev.yml`, `deploy-unified-production.yml`, `reusable-static-site-ssh-deploy.yml`

---

## 부록: 심볼릭 스왑 시 Nginx 주의 (저장소 경로 기준)

1. `config/nginx/core-solution-*.conf`·`dev.m-garden.co.kr.conf`의 `root`는 `/var/www/...` **고정 디렉터리**를 가정한다; 버전 디렉터리 + **`current` 심볼릭 링크**로 바꿀 때는 **`root`가 링크 경로를 가리키도록** 함께 바꿔야 한다.  
2. `reusable-static-site-ssh-deploy.yml`은 `/var/www/${remote_html_dir}/`에 **직접 SCP 덮어쓰기**만 하므로, 링크 스왑을 쓰려면 **배포 대상·Nginx `root`·워크플로 입력**을 한 세트로 맞출 것.  
3. 링크 교체 후에는 [NGINX_RATE_LIMIT_PUBLIC_API.md](./NGINX_RATE_LIMIT_PUBLIC_API.md)·[SEC01_PUBLIC_ONBOARDING_EDGE_AND_OPS.md](./SEC01_PUBLIC_ONBOARDING_EDGE_AND_OPS.md) 관례대로 **`nginx -t` 후 `reload`**를 두는 것이 저장소 정합과 맞다.  
4. 정적 서빙은 **짧은 구간 구버전 노출** 가능성이 있어 스왑만으로 즉시 전면 전환을 가정하지 말고 **`reload`·드레인**을 절차에 넣을 것.  
5. 운영 측 실제 `sites-enabled` 트리와 저장소 샘플이 다를 수 있으므로 반영 전 **`nginx -t`**로 문법·중복 `server_name` 등을 확인한다([BETA74_NGINX_HTTPS_APEX.md](./BETA74_NGINX_HTTPS_APEX.md) 등).
6. **Core 백엔드 블루그린**(단일 호스트·이중 포트): `upstream mindgarden_core_backend` 는 **`/etc/nginx/snippets/mindgarden-core-backend-upstream.conf`** 에만 두고, Actions는 헬스 통과 후 해당 파일만 갱신한 뒤 **`nginx -t` + `reload`** 한다. 저장소 `config/nginx/snippets/` 의 기본값은 **개발·문서용**이며, 트래픽 포트는 운영 서버의 스니펫·`/etc/mindgarden/active-backend` 가 SSOT이다([PRODUCTION_BLUE_GREEN_BACKEND_CUTOVER.md](./PRODUCTION_BLUE_GREEN_BACKEND_CUTOVER.md)).
6. **Core API 블루그린(단일 호스트·듀얼 포트)**: 정적 `root`는 유지하고 API·actuator·OAuth 경로만 `upstream` 으로 두 백엔드 중 활성 슬롯에 프록시하는 패턴은 저장소 예시 [deployment/README-BLUEGREEN.md](../../deployment/README-BLUEGREEN.md)·`config/nginx/snippets/upstream-mindgarden-core-api-bluegreen.conf.example`·`deployment/systemd/mindgarden-core-*.service.example` 를 참고한다(위 1~5항과 모순 없음).
