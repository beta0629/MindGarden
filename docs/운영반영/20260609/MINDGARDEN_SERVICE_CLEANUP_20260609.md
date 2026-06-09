# 운영 systemd 정리 — `mindgarden.service`

## 1. 작업 개요

| 항목 | 내용 |
|------|------|
| 작업 일시 (KST) | 2026-06-09 (화) 18:03 ~ 18:06 |
| 작업자 | core-shell (운영 SSH, 위임 실행) |
| 작업 대상 호스트 | `root@beta74.cafe24.com` (운영) |
| 작업 사유 | 운영 트래픽이 `mindgarden-core-blue` / `mindgarden-core-green` 로 이미 이전된 상태에서, 1개월째 `failed`로 잔존 중이던 레거시 `mindgarden.service` 유닛을 안전하게 정리하여 `systemctl --failed` 노이즈를 제거하고 향후 자동 기동 위험을 차단 |
| 변경 범위 | systemd 유닛 1개 (`mindgarden.service`) + drop-in 디렉토리 1개 (`/etc/systemd/system/mindgarden.service.d/`) |
| 영향 범위 | 0 — blue/green은 별도 유닛이며 이번 작업에서 재시작·중지하지 않음 |

## 2. 정리 전 상태 (Read-only 조사)

### 2.1 `systemctl --failed`

```
● crypto-trading.service loaded failed failed Crypto Trading Application
● mindgarden.service     loaded failed failed MindGarden Consultation System
2 loaded units listed.
```

### 2.2 `systemctl status mindgarden.service` 핵심 라인

```
Loaded: loaded (/etc/systemd/system/mindgarden.service; disabled; vendor preset: enabled)
Drop-In: /etc/systemd/system/mindgarden.service.d
         └─90-prod-from-dev-envfile.conf
Active: failed (Result: exit-code) since Sat 2026-05-09 13:19:59 KST; 1 month 0 days ago
Main PID: 3515825 (code=exited, status=143)
```

- `disabled` 상태(자동 시작 비활성)였으나 last run에서 `status=143` (SIGTERM, blue/green 컷오버 시 stop 수행 흔적)으로 종료되어 이후 `failed` 상태로 잔존.
- Drop-in `90-prod-from-dev-envfile.conf` 가 `EnvironmentFile=/etc/mindgarden/prod-from-dev.env` 를 추가하던 구성 (블루그린 유닛도 동일 envfile을 사용).

### 2.3 `failed` 추정 원인

- 2026-05-09 컷오버 절차에서 blue/green을 `multi-user.target.wants/`에 등록한 뒤 `mindgarden.service`를 stop 했으나, 마지막 종료 코드가 `143`이라 systemd가 unit을 `failed (exit-code)` 로 기록.
- 이후 `disable`만 적용되어 자동 시작은 막혔지만 `reset-failed` 가 호출되지 않아 1개월간 `failed` 목록에 잔존.

## 3. 의존성 / 자동 트리거 점검 결과

| 점검 항목 | 결과 |
|-----------|------|
| `systemctl list-dependencies --reverse mindgarden.service` | `mindgarden.service` 자기 자신만 표시 — **이 유닛에 의존하는 다른 유닛 없음** |
| `systemctl list-timers --all \| grep -i mindgarden` | **없음** |
| `/etc/cron*` 내 `mindgarden.service` / `systemctl ... mindgarden ` 참조 | **없음** (blue/green 제외) |
| `/etc/systemd/system/multi-user.target.wants/` 내 심볼릭 링크 | `mindgarden-core-blue.service`, `mindgarden-core-green.service` **만 존재** (레거시 `mindgarden.service` 링크 없음 — 이미 disabled) |
| `systemctl list-unit-files \| grep mindgarden` | `mindgarden-core-blue.service enabled`, `mindgarden-core-green.service enabled`, `mindgarden.service disabled` |

→ **외부 트리거·의존성 없음. 안전 정리 가능.**

## 4. blue/green 정상 가동 확인 (정리 직전)

```
$ systemctl is-active mindgarden-core-blue mindgarden-core-green
active
active

mindgarden-core-blue : Active: active (running) since Tue 2026-06-09 16:43:38 KST
                       Drop-In: 50-expo-push.conf, 90-envfile.conf, 91-instance-id.conf, 92-lifecycle-phase3-4-5.conf
                       포트 8080
mindgarden-core-green: Active: active (running) since Tue 2026-06-09 16:43:38 KST
                       포트 8081
```

## 5. 정리 절차 — 실행한 명령과 결과

### 5.1 백업

```bash
cp /etc/systemd/system/mindgarden.service /root/backup-mindgarden-service-20260609.bak
cp -r /etc/systemd/system/mindgarden.service.d /root/backup-mindgarden-service.d-20260609.bak
```

결과:

- `/root/backup-mindgarden-service-20260609.bak` (1703 bytes)
- `/root/backup-mindgarden-service.d-20260609.bak/90-prod-from-dev-envfile.conf` (170 bytes)

### 5.2 stop / disable / reset-failed

```bash
systemctl stop mindgarden.service          # 이미 inactive — no-op
systemctl disable mindgarden.service       # 이미 disabled — no-op
systemctl reset-failed mindgarden.service  # failed 카운터 리셋
```

### 5.3 mask (1차 시도) — unit 파일이 일반 파일이라 실패

```
Failed to mask unit: File /etc/systemd/system/mindgarden.service already exists.
```

→ `/etc/systemd/system/`은 admin이 설치한 위치이고 mask는 unit 경로에 `/dev/null` 심볼릭 링크 생성을 요구함. 백업 보존 상태에서 **파일 제거 후 mask** 처리.

### 5.4 unit 파일·drop-in 제거 + daemon-reload + mask

```bash
rm /etc/systemd/system/mindgarden.service
rm -rf /etc/systemd/system/mindgarden.service.d
systemctl daemon-reload
systemctl mask mindgarden.service
```

결과:

```
removed '/etc/systemd/system/mindgarden.service'
removed '/etc/systemd/system/mindgarden.service.d/90-prod-from-dev-envfile.conf'
removed directory '/etc/systemd/system/mindgarden.service.d'
Unit mindgarden.service does not exist, proceeding anyway.
Created symlink /etc/systemd/system/mindgarden.service → /dev/null.
```

→ 이후 누가 `systemctl start mindgarden.service` 를 호출해도 `Unit mindgarden.service is masked.` 로 거부됨 (실수 방지 가드).

## 6. 검증 결과

| 검증 항목 | 명령 | 결과 |
|-----------|------|------|
| `failed` 리스트에서 제거 | `systemctl list-units --type=service --state=failed \| grep -i mindgarden` | **OK: 매치 없음** (`crypto-trading.service` 만 잔존, 본 작업 범위 외) |
| unit-file 상태 | `systemctl list-unit-files \| grep -i mindgarden` | `mindgarden.service masked / enabled (preset)` (mask 적용 확인) |
| blue/green 가동 | `systemctl is-active mindgarden-core-blue mindgarden-core-green` | `active` / `active` |
| blue 헬스 (포트 8080) | `curl http://localhost:8080/actuator/health` | **HTTP 200** |
| green 헬스 (포트 8081) | `curl http://localhost:8081/actuator/health` | **HTTP 200** |

→ **완료 조건 모두 충족, blue/green 영향 0.**

## 7. 백업 파일 경로 (운영 호스트 `beta74.cafe24.com`)

- 원 unit 파일: `/root/backup-mindgarden-service-20260609.bak`
- drop-in 디렉토리: `/root/backup-mindgarden-service.d-20260609.bak/90-prod-from-dev-envfile.conf`

## 8. 롤백 절차

블루그린 컷오버 자체를 되돌릴 일이 생긴 경우에만 사용. 일반 배포에서는 사용하지 않음.

```bash
ssh root@beta74.cafe24.com bash <<'ROLLBACK'
set -e
# 1) mask 해제
systemctl unmask mindgarden.service
# 2) unit 파일 복원
cp /root/backup-mindgarden-service-20260609.bak /etc/systemd/system/mindgarden.service
# 3) drop-in 복원
mkdir -p /etc/systemd/system/mindgarden.service.d
cp /root/backup-mindgarden-service.d-20260609.bak/90-prod-from-dev-envfile.conf \
   /etc/systemd/system/mindgarden.service.d/90-prod-from-dev-envfile.conf
# 4) daemon-reload
systemctl daemon-reload
# 5) (필요 시) enable + start
# systemctl enable --now mindgarden.service
# 주의: blue/green 과 동일 포트(8080)를 점유하므로 사전에 blue 를 멈춰야 함
ROLLBACK
```

## 9. 추가 권장 액션 (이번 위임 범위 외 — 후속 코더 위임 필요)

레거시 `mindgarden.service` 참조가 저장소 내 다음 위치에 잔존. 운영에서 unit이 mask 되어 무해하지만, **장기적으로 정리** 권장:

| 파일 | 라인 | 현 의도 | 권장 조치 |
|------|------|---------|-----------|
| `.github/workflows/deploy-production.yml` | 12, 241, 614, 615, 1212, 1213, 1215, 1311 | "레거시 mindgarden.service 가 동작 중이면 에러/폴백" 가드 | **유지 가능** (이미 mask 되어 항상 inactive). 다만 1212–1215의 폴백 분기는 향후 데드 코드. 별도 클린업 PR로 처리 |
| `scripts/check-production-status.sh` | 11, 15 | 운영 상태 확인 스크립트가 `mindgarden.service` 도 함께 출력 | blue/green 으로 교체 권장 |
| `scripts/ops/prod-health-snapshot.sh` | 7 | `MG_SERVICE_NAME="${MG_SERVICE_NAME:-mindgarden.service}"` 기본값 | 기본값을 blue로 변경하거나 `mindgarden-core-active` 별칭 사용 검토 |
| `deployment/deploy-production.sh` | 181 | 가이드 텍스트 (`/etc/systemd/system/mindgarden.service:`) | blue/green 가이드로 갱신 |
| `deployment/systemd/mindgarden-core-blue.service.example` | — | 참조 파일이며 변경 불필요 | — |

다른 잔존 `failed` 유닛: `crypto-trading.service` (본 위임 범위 외, 별도 점검 권장).

## 10. 완료 조건 체크리스트

- [x] `systemctl list-units --type=service --state=failed` 에 `mindgarden.service` 없음
- [x] `mindgarden-core-blue` / `mindgarden-core-green` 둘 다 `active (running)`
- [x] 백업 파일 경로 확보 (`/root/backup-mindgarden-service-20260609.bak`, `/root/backup-mindgarden-service.d-20260609.bak/`)
- [x] 운영 일지 작성 (본 문서)

## 11. 참고

- 본 작업은 OAuth phone OTP SSOT 정책 작업과 무관. 그 범위 파일은 본 작업에서 일절 수정하지 않음.
- blue/green 서비스 재시작 없음. 트래픽·세션 영향 0.
