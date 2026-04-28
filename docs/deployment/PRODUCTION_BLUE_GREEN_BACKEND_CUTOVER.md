# 운영 Core 백엔드 — 단일 호스트 블루그린 전환 (저장소 SSOT)

**범위**: GitHub Actions [`.github/workflows/deploy-production.yml`](../../.github/workflows/deploy-production.yml) 의 **백엔드 SSH 구간**만 블루그린. 프론트 SCP·빌드·권한·표준 프로시저 등은 기존과 동일.  
**Secrets**: `PRODUCTION_HOST` / `PRODUCTION_USER` / `PRODUCTION_SSH_KEY` 등 기존 `PRODUCTION_*` 유지 ([`core-solution-deployment`](../../.cursor/skills/core-solution-deployment/SKILL.md)).

---

## 아키텍처 요약

| 항목 | 값 |
|------|-----|
| 슬롯 이름 | `blue`, `green` |
| 트래픽 기준 파일 | `/etc/mindgarden/active-backend` (한 줄: `blue` 또는 `green`) |
| JAR 경로 | `/var/www/mindgarden/releases/blue/app.jar`, `.../green/app.jar` |
| 수신 업로드 | `/var/www/mindgarden/releases/incoming/consultation-management-system-1.0.0.jar` → 비활성 슬롯으로 복사 후 삭제 |
| 포트 | blue **8080**, green **8081** (고정; systemd `Environment=SERVER_PORT`) |
| systemd | `mindgarden-core-blue.service`, `mindgarden-core-green.service` ([예시](../../deployment/systemd/mindgarden-core-blue.service.example)) |
| Nginx | `upstream mindgarden_core_backend` 는 **`/etc/nginx/snippets/mindgarden-core-backend-upstream.conf`** 에만 정의. vhost는 `include` 로 참조 ([`core-solution-prod.conf`](../../config/nginx/core-solution-prod.conf)). 전환 시 **`nginx -t` 후 `systemctl reload nginx` 만** (방화벽·`ufw`/`iptables` 변경 없음). |

### 배포 순서 (의사코드)

1. `mindgarden.service` 가 active 이면 **즉시 실패** — 레거시와 병행 금지.
2. `active-backend` 로 현재 트래픽 슬롯 결정 → **비활성** 슬롯에 JAR 설치.
3. `systemctl restart mindgarden-core-<inactive>.service`
4. `curl http://127.0.0.1:<inactive_port>/actuator/health` 재시도 → 실패 시 **upstream 전환 없이** exit 1.
5. 스니펫에 `server 127.0.0.1:<inactive_port>;` 기록 → `active-backend` 를 비활성 이름으로 갱신.
6. `core-solution-prod.conf` 복사 → `nginx -t` → `reload`.
7. (선택) 구 슬롯 `systemctl stop` — 워크플로 주석으로 안내(롤백·메모리 정책은 운영 합의).

---

## Nginx·심볼릭 링크 정합

[ZERO_DOWNTIME_GAP_AND_ROADMAP.md 부록](./ZERO_DOWNTIME_GAP_AND_ROADMAP.md) 과 동일 원칙:

- **upstream 스니펫만** Actions가 덮어쓴다. `core-solution-prod.conf` 의 `include` 경로는 **서버 절대경로** `/etc/nginx/snippets/...` 고정.
- 백엔드 변경이 없는 실행에서 **저장소 기본 스니펫으로 운영 upstream 을 덮어쓰지 않음** (트래픽 포트 유지).
- 정적 `root` 심볼릭 스왑은 본 문서 범위 밖(프론트는 기존 `/var/www/mindgarden/frontend/` 직접 배포 유지).

---

## 운영 1회 수동 작업 체크리스트

1. **레거시 중지**: `sudo systemctl disable --now mindgarden.service` (백업·다운타임 창은 운영 공지 절차에 따름).
2. **디렉터리**: `sudo mkdir -p /var/www/mindgarden/releases/{blue,green,incoming}` 및 소유권(배포 사용자·`mindgarden` 등 호스트 표준).
3. **systemd**: `deployment/systemd/mindgarden-core-blue.service.example` 등을 `/etc/systemd/system/` 에 복사, `prod.env` 의 `SERVER_PORT` 는 비우거나 유닛 `Environment=` 가 우선되도록 정리 후 `daemon-reload` / `enable`.
4. **최초 스니펫**: 트래픽을 줄 슬롯 포트로 `/etc/nginx/snippets/mindgarden-core-backend-upstream.conf` 생성 (예: 기존이 8080 단일이면 blue 기준).
5. **active-backend**: `echo blue | sudo tee /etc/mindgarden/active-backend` (또는 실제 트래픽 슬롯).
6. **Nginx**: 저장소 반영된 `core-solution-prod.conf` 배포 후 **`sudo nginx -t` → `reload`**.
7. **검증**: `curl -sS http://127.0.0.1:8080/actuator/health` 및 8081(그린) 기동 스모크.
8. 그다음부터 **GitHub Actions** `deploy-production` 만으로 블루그린 반복.

### 롤백(요지)

- JAR·유닛은 이전 슬롯에 그대로 있으면, `active-backend` 와 스니펫의 `server 127.0.0.1:<이전_포트>;` 를 맞춘 뒤 **`nginx -t` + `reload`** 로 트래픽만 되돌린다(DB·Flyway는 별도 [Go-Live 체크리스트](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) 준수).

---

## 변경·추가된 저장소 경로 (PR 기준)

- `.github/workflows/deploy-production.yml`
- `config/nginx/core-solution-prod.conf`
- `config/nginx/snippets/mindgarden-core-backend-upstream.conf` (신규)
- `deployment/systemd/mindgarden-core-blue.service.example` / `mindgarden-core-green.service.example`
- `docs/deployment/ZERO_DOWNTIME_GAP_AND_ROADMAP.md` (정합 문구)
- `docs/deployment/GITHUB_ACTIONS_WORKFLOW_INDEX.md` (한 줄 보강)
- 본 문서 `docs/deployment/PRODUCTION_BLUE_GREEN_BACKEND_CUTOVER.md`
