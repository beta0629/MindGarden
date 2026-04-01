# 운영 헬스체크·디스크·로그 정리 배치 (기획 위임 기록)

**작성**: 2026-04-02  
**목적**: 운영에서 **헬스 점검**, **디스크 확인**, **로그 삭제/로테이션**을 자동화하는 배치 도입을 **core-planner**에 위임한 산출 보관.  
**참조**: `.cursor/skills/core-solution-deployment/SKILL.md`, `.cursor/skills/core-solution-server-status/SKILL.md`, `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`, `.github/workflows/deploy-production.yml`

---

## 1. 목표·비목표

**목표**: 운영(필수)·개발(선택)에서 디스크·서비스·HTTP를 주기 점검하고, 임계 초과 시 알림·요약 보고. 로그는 보존 일수·안전 규칙에 따라 로테이션·오래된 아카이브 삭제로 디스크 고갈 예방. **첫 도입은 읽기 전용 점검 + dry-run 정리** 후 실삭제 활성화 권장.

**비목표**: 앱 기능·부하 테스트 전체, DB 백업 전체, 민감정보 그대로 채널 알림, `rm -rf` 광역 삭제, 저장소에 호스트·키·비밀 하드코딩.

**기준 호스트(스킬)**: 운영 `root@beta74.cafe24.com`, `mindgarden.service`, `/var/log/mindgarden/`, `journalctl -u mindgarden.service` · 개발 `root@beta0629.cafe24.com`, `mindgarden-dev`, `/var/www/mindgarden-dev/logs/` (옵션).

---

## 2. 실행 방식 비교

| 구분 | (A) GHA `schedule` + SSH | (B) 서버 `cron` + 셸 | (C) `systemd` timer |
|------|-------------------------|----------------------|----------------------|
| 장점 | 중앙 감사, 버전관리, 팀 공유 | GH 의존 없음 | 부팅 후 스케줄 복구, journal 이력 |
| 단점 | Runner·GH 장애, SSH 시크릿 | 서버별 드리프트 | 유닛 배포 별도 |
| 시크릿 | `PRODUCTION_*` 등 `deploy-production.yml`과 동일 패턴 권장 | 로컬이면 CI 불필요 | 로컬이면 (B)와 유사 |

**권장**: 핵심은 **(B) 또는 (C) 서버 로컬 실행**; **(A)**는 HTTP만 외부 확인 또는 주간 요약 보조. **헬스/정리 워크플로는 `deploy-production.yml`과 분리**한 별도 YAML.

---

## 3. 헬스체크 항목 (우선순위)

| 우선 | 항목 |
|------|------|
| P0 | HTTP 헬스(`/actuator/health` 등 — 운영 노출은 Go-Live 3.4·3.5 정합) |
| P0 | `systemctl is-active mindgarden.service` |
| P0 | `df -h` (/, /var, 로그·앱 마운트) — 임계치는 운영 합의 |
| P1 | `df -i` inode |
| P1 | 로그 디렉터리 용량: `/var/log/mindgarden/`, `/var/www/mindgarden/` 등 **변수화·안전 경로만** |
| P2 | JVM/메모리·`memory-alert.log` (선택) |
| P2 | `journalctl` / `application.log` 마지막 N줄 — **PII·토큰 마스킹** 후 요약만 알림 |

---

## 4. 로그 정리 정책 초안

- 보존 예시(합의 필요): 롤 plain 14일, gzip 30일 등 **이중 단계**.
- **삭제 금지**: 현재 쓰기 중 파일·락·타 서비스(nginx/mysql) 트리 전체 — **합의된 glob만**.
- **journalctl**: `vacuum`은 별도 합의·한도.
- **dry-run**: 1~2주 삭제 **목록만 출력**; 실삭제는 플래그·환경 변수로만.
- **실패**: `set -euo pipefail`, 삭제 전 개수·바이트 로그; 롤백 불가이므로 보수적 glob.

---

## 5. 서브에이전트 배분

1. **shell** — 원격 스냅샷·스크립트 배치 후보 경로  
2. **core-debugger** — 임계치·알림 문구·마스킹 규칙(코드 수정 없음)  
3. **core-coder** — GHA(선택) + `scripts/ops/*`, env만, DRY_RUN 기본  
4. **core-tester** — dry-run job, 실삭제 0건 검증  

**병렬**: **explore**(기존 스크립트 인벤토리) ∥ shell

---

## 6. 복붙용 위임 프롬프트

### explore

```
역할: explore. 저장소에서 운영 헬스·로그·배포와 겹치는 기존 자산만 인벤토리한다.

참조: .cursor/skills/core-solution-deployment/SKILL.md, .cursor/skills/core-solution-server-status/SKILL.md, .github/workflows/deploy-production.yml

할 일:
- scripts/**, deployment/** 에서 clean/rotate/health/check/log 관련 셸·문서 검색
- nginx 설정 경로·액세스 로그 언급 여부(코드/문서)
- application-prod·logback에서 파일 로그 경로·롤링 정책 요약
산출: 파일 경로 목록 + “재사용 vs 신규” 한 줄 권고. 코드 대량 수정 금지.
```

### core-coder

```
역할: core-coder. 운영 헬스·디스크·로그 정리 자동화를 저장소에 반영한다.

참조: .cursor/skills/core-solution-deployment/SKILL.md, docs/standards/DEPLOYMENT_STANDARD.md, docs/troubleshooting/DEV_DEPLOYMENT_STABILITY_CHECKLIST.md, docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md (6.4, 8.1, 3.5)

완료 조건:
- (선택) .github/workflows/ 에 배포와 분리된 schedule 워크플로: SSH는 PRODUCTION_HOST/USER/SSH_KEY 등 기존 패턴, 호스트·경로는 secrets/env만
- scripts/ops/ (또는 합의 경로) 에 읽기 전용 점검 스크립트 + 로그 정리는 기본 DRY_RUN=1, 실삭제는 명시적 플래그
- 비밀·PII를 echo/Actions 로그에 남기지 않음; 하드코딩 호스트/IP 금지
- deploy-production.yml 과 트리거·책임 분리 문서 한 줄(주석 또는 README 일부)

운영 서비스명 mindgarden.service, 로그 예: /var/log/mindgarden/application.log, journalctl -u mindgarden.service (스킬 기준)
```

### core-tester

```
역할: core-tester. 헬스/로그 OPS 자동화 검증한다.

참조: .cursor/skills/core-solution-testing/SKILL.md, core-solution-deployment SKILL

시나리오:
- GHA: DRY_RUN/schedule job이 실패 없이 완료하고, 로그에 민감값 없음
- 로컬 또는 dev SSH: 스크립트 --dry-run 만 실행 시 파일 삭제 0건
- 임계치 시뮬레이션(모의 exit/테스트 플래그) 시 알림 훅이 호출되는지(모킹 가능)
산출: 통과/실패 표 + 재현 명령. 프로덕 실삭제 테스트는 사용자 승인 하에만.
```

### core-debugger

```
역할: core-debugger. 디스크·서비스 다운·로그 폭증 시 운영 런북에 넣을 임계치·알림 문구·판단 순서를 제안한다. 코드 수정 없음.

입력: core-solution-server-status SKILL의 SSH 호스트·로그 경로, journalctl/application.log 위치.

산출: P0/P1 임계 표, 에러 tail 시 마스킹 정규식 제안, 오탐 완화 조건.
```

---

## 7. 리스크·보안

- SSH 키: GitHub Secrets 전용, PR·로그에 키 금지.
- 최소 권한: 합의된 디렉터리·glob만; `rm` 대상 변수 검증, `rm -rf` 금지.
- 알림: 요약·exit·임계 이름만; 스택·쿼리·연락처 마스킹.
- Actuator 외부 노출은 Go-Live 3.4와 정합.
- 배포 워크플로와 헬스 워크플로 **책임 분리**.

---

## 8. 실행 순서 (호출 주체)

**explore ∥ shell** → **core-debugger** → **core-coder** → **core-tester** → 기획이 사용자에게 **임계치·보존 일수·실행 방식(A/B/C) 확정안** 취합.

---

본 문서는 core-planner 위임 응답을 정리한 것이다. 진행 시 §6을 Task에 복사해 사용한다.

---

## 9. 구현 산출 (2026-04-02)

- `scripts/ops/prod-health-snapshot.sh` — 읽기 전용 스냅샷(환경변수만)
- `scripts/ops/prod-log-cleanup.sh` — 기본 DRY_RUN, 실삭제는 `EXECUTE=1` / `--execute`
- `scripts/ops/README.md` — 사용법·환경변수·`deploy-production`과 분리 안내
- `.github/workflows/ops-health-snapshot.yml` — **스케줄·dispatch job은 스냅샷만** 실행; 로그 cleanup 미호출
- (갱신) 스냅샷: **코어 솔루션**(로컬 actuator + 공개 엣지) + **OPS 포털**(공개 URL) + 선택 `ops-backend` systemd — `scripts/ops/README.md` 참조
