---
name: core-solution-local-ai-ops-log-watch
description: 로컬 AI(Ollama/LM Studio 등)로 운영 로그를 감시·요약·이상 탐지하고 Cursor 핸드오프만 수행한다. 자동 코드 수정·자동 배포·운영 직접 패치 금지. "로컬 AI로 운영 로그 감시", "Ollama로 prod 로그 분석", "배치 오류 실시간 감시" 요청 시 사용.
---

# Core Solution 로컬 AI 운영 로그 감시

로컬 AI(Ollama, LM Studio 등)로 **운영 로그 감시·요약·이상 탐지·핸드오프**만 수행한다.

**자동 코드 수정·자동 배포·운영 직접 패치 금지.**

## 적용 시점 (트리거)

- "로컬 AI로 운영 로그 감시"
- "Ollama로 prod 로그 분석"
- "배치 오류 실시간 감시"
- "LM Studio로 journalctl 요약"
- blue/green 유닛 ERROR·WARN·배치 실패 패턴을 로컬 LLM으로 분류할 때

## 목적·범위

| 허용 | 금지 |
|------|------|
| journalctl 수집·마스킹·로컬 LLM 요약 | 원문 로그 무단 외부(클라우드 LLM) 전송 |
| 이상 패턴 분류·배치 실패 요약 | 자동 코드 수정·자동 배포·운영 핫패치 |
| 재현/조사 체크리스트 초안 | `--no-verify`, 운영 DB 임의 DELETE |
| Cursor 서브에이전트 핸드오프 제안 | 자동 merge/push |

## 운영 유닛 (정본)

운영 SSH: `root@beta74.cafe24.com`

| 유닛 | systemd 이름 | 비고 |
|------|----------------|------|
| **blue** | `mindgarden-core-blue.service` | 포트 8080 전형 |
| **green** | `mindgarden-core-green.service` | 포트 8081 전형 |

- **레거시** `mindgarden.service` 는 정리 대상·비활성 가능. 감시 기본값은 **blue + green 둘 다**.
- `scripts/ops/prod-health-snapshot.sh` 기본은 **blue+green** (`MG_SERVICE_NAMES`). 단일만 보려면 `MG_SERVICE_NAME=mindgarden-core-blue.service`(또는 green).

## 워크플로

### 1. shell — journalctl (blue/green 둘 다)

```bash
# 상태
ssh root@beta74.cafe24.com 'systemctl is-active mindgarden-core-blue.service mindgarden-core-green.service'

# 최근 N줄 (유닛별 구분)
ssh root@beta74.cafe24.com 'journalctl -u mindgarden-core-blue.service --no-pager -n 400'
ssh root@beta74.cafe24.com 'journalctl -u mindgarden-core-green.service --no-pager -n 400'

# 기간 지정 예
ssh root@beta74.cafe24.com 'journalctl -u mindgarden-core-blue.service --since "2026-07-27 00:00:00" --no-pager -p err..warning'
ssh root@beta74.cafe24.com 'journalctl -u mindgarden-core-green.service --since "2026-07-27 00:00:00" --no-pager -p err..warning'
```

선택: `scripts/ops/prod-health-snapshot.sh` — 기본 한 번 호출로 blue+green(8080/8081) 스냅샷. 단일만이면 `MG_SERVICE_NAME=…`.

### 2. PII·시크릿 마스킹 (로컬 LLM 전달 전 필수)

전달 전 반드시 마스킹:

- 비밀번호, 토큰, API 키, Authorization / Bearer / JWT
- DB URL·커넥션 문자열의 credential
- 이메일, 전체 전화번호(중간 마스킹), 주민번호·카드번호
- 개인명·상담 내용 등 PII가 로그에 있으면 `[REDACTED]`

`prod-health-snapshot.sh` 의 redact 파이프가 있으면 활용하되, **부족하면 추가 마스킹 후** 로컬 AI에만 전달.

### 3. 로컬 AI 역할

로컬 LLM(Ollama/LM Studio)에 **마스킹된** 로그 조각만 넣고:

1. 이상 패턴 분류 (기동 실패 / DB·Flyway / 배치 / HTTP 5xx / OOM 등)
2. 배치 실패 요약 (잡 이름, 시각, 테넌트 힌트는 ID만, 반복 여부)
3. 재현·조사 체크리스트 초안
4. blue vs green **동일 시각 중복 실행** 여부 플래그

### 4. Cursor 핸드오프 (승인 게이트)

```
수집·마스킹·로컬 요약
  → core-debugger (원인 분석만)
  → 사용자 승인 후 core-coder (수정)
  → 별도 지시 시에만 core-deployer
```

- 이 스킬 자체는 **수정·배포를 실행하지 않는다.**
- 메인 어시스턴트는 `.cursor/rules/mindgarden-subagents.mdc` 위임 규칙을 따른다.

## 이중 스케줄 주의 (blue/green)

blue·green **둘 다** `@Scheduled` 가 살아 있으면 **배치 중복 실행** 가능.

- 로그를 **유닛별로 구분**해 수집·집계한다.
- 동일 cron 시각에 같은 잡 메시지(`SalaryBatchMonitor`, `SessionDeductionRecovery`, `DailyFinancialClose` 등)가 **양쪽 유닛**에 찍히면 이중 스케줄 의심 → 런북·표준 문서와 대조.
- 활성 트래픽 슬롯과 스케줄러 활성 슬롯이 다를 수 있으므로, `systemctl is-active` + 로그 타임스탬프를 함께 본다.

## 기존 스킬·문서 연계

| 연계 | 경로·스킬 |
|------|-----------|
| 서버 상태·SSH·복구 | `/core-solution-server-status` |
| 원인 분석·재현 | `/core-solution-debug` |
| CI/배포 실패 분류 | `/core-solution-github-ci-triage` |
| 배치 ERROR 런북 | `docs/troubleshooting/PROD_BATCH_ERRORS_RUNBOOK_20260626.md` |
| 배치 스케줄러 표준 | `docs/standards/BATCH_SCHEDULER_STANDARD.md` |
| 헬스 스냅샷(유닛명 주의) | `scripts/ops/prod-health-snapshot.sh` |
| blue/green 컷오버 | `docs/deployment/PRODUCTION_BLUE_GREEN_BACKEND_CUTOVER.md` |

## 금지 사항

- 원문(마스킹 전) 로그를 클라우드/외부 LLM·채팅에 무단 전송
- `--no-verify` 로 커밋·푸시
- 운영 DB 임의 `DELETE` / 파괴적 DDL
- 자동 merge / 자동 push / 승인 없는 배포
- “로컬 AI가 고쳤다”고 가정한 핫패치·JAR 교체

## 출력 템플릿

```markdown
# 로컬 AI 운영 로그 감시 요약

## 기간
- since / until (KST):

## 유닛
| 유닛 | is-active | ERROR 건수 | WARN 건수 |
|------|-----------|------------|-----------|
| mindgarden-core-blue | | | |
| mindgarden-core-green | | | |

## 상위 패턴
1.
2.
3.

## 배치 관련 이슈
- 잡/모니터 이름:
- 반복 여부:
- blue/green 동시 실행 의:

## 로컬 AI 분류 (한 줄)
-

## 권장 위임
| 다음 단계 | agent | 비고 |
|-----------|-------|------|
| 원인 분석 | core-debugger | |
| 수정 (승인 후) | core-coder | |
| 배포 (별도 지시) | core-deployer | |

## 마스킹·전송
- [ ] PII/시크릿 마스킹 완료
- [ ] 외부 LLM 미전송 (로컬만)
```

## 사용 예

**예 1** — 사용자: "로컬 AI로 운영 로그 감시해줘"

1. blue/green journalctl 수집 → 마스킹 → Ollama 요약  
2. 위 템플릿으로 보고 → 이상 있으면 `core-debugger` 위임 제안만

**예 2** — 사용자: "Ollama로 prod 배치 오류 실시간 감시"

1. `--since` 최근 1~6h, `SalaryBatchMonitor` / `SessionDeductionRecovery` 등 키워드 필터  
2. 유닛별 중복 `@Scheduled` 여부 표기  
3. 런북 `PROD_BATCH_ERRORS_RUNBOOK_20260626.md` 와 대조 후 핸드오프
