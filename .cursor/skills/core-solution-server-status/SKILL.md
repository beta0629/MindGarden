---
name: core-solution-server-status
description: 개발·운영 서버 상태·에러 로그 확인, 긴급 복구, 원인 분석 후 core-coder 조치 연계. shell → core-debugger → core-coder 워크플로우.
---

# 서버 상태 전용 스킬 (Server Status & Recovery)

개발 서버·운영 서버의 **상태 확인**, **에러 로그 수집**, **긴급 복구**, **원인 분석 후 core-coder 즉시 조치**까지 한 흐름으로 수행할 때 이 스킬을 적용합니다.

## 적용 시점

- "개발 서버 죽어 있어", "운영 서버 502", "서버 상태 확인해줘"
- "에러 로그 확인 후 원인 찾아서 코더한테 조치 시켜줘"
- 배포 후 헬스체크 실패·기동 실패 시 원인 파악 및 복구
- 긴급 상황 대비 복구 절차 수행

## 서브에이전트 워크플로우 (필수 순서)

| 단계 | 서브에이전트 | 역할 |
|------|--------------|------|
| **1. 상태·로그·복구** | **shell** | SSH로 대상 서버 접속, 서비스 상태 확인, 에러 로그 수집(tail/journalctl). 필요 시 백업 복원·재시작. |
| **2. 원인 분석·태스크 작성** | **core-debugger** | 수집된 로그·스택트레이스 해석, 근본 원인 요약, **core-coder용 즉시 조치 태스크** 작성. 코드 수정은 하지 않음. |
| **3. 코드·설정 조치** | **core-coder** | core-debugger가 전달한 태스크 설명·수정 제안대로 코드/설정 수정. |

- **shell**은 로그·상태만 확인하고 복구 명령 실행. 원인 해석은 **core-debugger**에 맡긴다.
- **core-debugger**는 로그 내용을 바탕으로 원인과 수정 방향을 정리하고, **core-coder에게 넘길 태스크 설명**을 구체적으로 작성한다.
- **core-coder**는 해당 태스크만 수행한다.

## 대상 서버·경로 (참고)

| 구분 | 서비스/호스트 | 서비스명 | 로그·경로 |
|------|----------------|----------|-----------|
| **개발** | beta0629.cafe24.com 등 (SSH 설정 참고) | mindgarden-dev.service | /var/www/mindgarden-dev/logs/error.log, /var/log/mindgarden/dev-error.log, journalctl -u mindgarden-dev.service |
| **운영** | beta74.cafe24.com 등 (배포 워크플로 참고) | 해당 systemd 서비스명 | 운영 서버 로그 경로(배포 가이드 참조) |

- SSH 호스트·계정은 로컬 `~/.ssh/config` 또는 CI secrets(DEV_SERVER_HOST 등) 기준. shell 서브에이전트는 로컬 SSH 설정을 사용할 수 있음.

## 1단계: shell — 상태·로그·복구 체크리스트

다음 순서로 실행하도록 shell 서브에이전트에 지시한다.

### 1.1 상태 확인

- `sudo systemctl status <서비스명> --no-pager`
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health` (개발 서버 포트가 8080인 경우)

### 1.2 에러 로그 수집 (기동 실패·502 등)

- **journalctl**: `sudo journalctl -u <서비스명> --no-pager -n 400`
- **애플리케이션 로그**: `sudo tail -200 /var/www/mindgarden-dev/logs/error.log` (개발)
- **stderr**: `sudo tail -200 /var/log/mindgarden/dev-error.log` (개발)

### 1.3 긴급 복구 (서비스 중지/기동 실패 시)

- **백업 복원 후 재시작** (개발 서버 예시):
  - `LATEST=$(ls -t /var/www/mindgarden-dev/backups/app.jar.backup.* 2>/dev/null | head -1)`
  - `[ -n "$LATEST" ] && sudo cp "$LATEST" /var/www/mindgarden-dev/app.jar && sudo systemctl restart mindgarden-dev.service`
- 15~20초 대기 후 다시 health 확인

### 1.4 산출

- 서비스 상태(active/failed), health 응답 코드, 복구 적용 여부, **에러 로그 마지막 부분(예외 메시지·스택 요약)** 을 정리해 반환.

## 2단계: core-debugger — 원인 분석·core-coder용 태스크

- **입력**: 1단계에서 수집한 로그·예외 메시지·상태 요약.
- **수행**: 로그·스택트레이스 해석, 근본 원인 1~2문장 요약, **수정 제안(파일·라인·변경 방향)** 및 **core-coder에게 전달할 태스크 설명** 작성. 코드 직접 수정은 하지 않음.
- **참조**: `/core-solution-debug` 스킬, `docs/troubleshooting/DEV_DEPLOYMENT_STABILITY_CHECKLIST.md`, `docs/troubleshooting/ONBOARDING_DEV_DEPLOY_FAILURE_ANALYSIS.md` 등.

## 3단계: core-coder — 즉시 조치

- **입력**: core-debugger가 작성한 **태스크 설명** 및 수정 제안.
- **수행**: 해당 내용대로 코드·설정만 수정. 서버 재배포는 CI/수동 절차에 따름.

## 참조 문서

- `docs/troubleshooting/DEV_DEPLOYMENT_STABILITY_CHECKLIST.md` — 개발 배포·검증·점검
- `docs/troubleshooting/ONBOARDING_DEV_DEPLOY_FAILURE_ANALYSIS.md` — 온보딩 배포 실패 시
- `docs/troubleshooting/DEV_OAUTH2_APPLE_PROVIDER_ISSUE.md` — OAuth2 기동 오류
- `docs/standards/SUBAGENT_USAGE.md` — 서브에이전트 매핑 (서버 상태·복구 행 추가됨)

## 요약

- **서버 상태·에러 로그 확인·긴급 복구** → **shell**로 상태/로그/복구 실행.
- **원인 찾아서 코더에게 조치** → **core-debugger**로 원인·태스크 작성 → **core-coder**로 즉시 수정.
- 이 스킬은 위 3단계( shell → core-debugger → core-coder )를 한 번에 요청할 때 적용한다.
