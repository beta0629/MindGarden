# NTP 모니터링 정책

**버전**: 1.0.0  
**최종 업데이트**: 2026-06-14  
**상태**: 공식 표준 (P0 표준 5종 묶음)

## 1. 정책 개요

운영 서버의 시스템 시계는 **drift 60초 이내** 로 유지한다. drift 초과는 예약·세션 만료·감사 로그 타임스탬프 신뢰도를 훼손하므로 즉시 알람·복구 절차를 가동한다. 본 정책은 [`NTP_RECOVERY_PLAN_20260614.md`](../운영반영/NTP_RECOVERY_PLAN_20260614.md) 의 영구 정책 정합 버전이다.

## 2. 임계값

| 항목 | 임계 | 액션 |
|---|---|---|
| drift | **60초 초과** | Discord P1 알람 + LogWatcher 기록 |
| drift | **300초 초과** | Discord P0 알람 + `core-deployer` 자동 호출 (수동 적용 대기) |
| `timedatectl synchronized` | `no` 1시간 지속 | Discord P1 알람 |
| `systemd-timesyncd` active | `inactive` 5분 지속 | Discord P0 알람 |

체크 주기: **1시간** + Daily 요약 09:00 KST.

## 3. NTP 서버 (한국)

운영 `/etc/systemd/timesyncd.conf` 의 `NTP=` 라인은 한국 NTP 풀을 명시한다 (`deployment/systemd-timesyncd/timesyncd.conf` 정본).

| 순위 | 서버 | 제공자 |
|---|---|---|
| 1 | `time.bora.net` | LG U+ |
| 2 | `time.kriss.re.kr` | 한국표준과학연구원 |
| 3 | `time.nuri.net` | 한국과학기술정보연구원 |
| 4 (fallback) | `kr.pool.ntp.org` | NTP Pool Project (KR) |

ubuntu 기본 `ntp.ubuntu.com` 만 의존 금지 — 한국 호스팅(cafe24) 환경에서 RTT 가 높고 호스트 측 차단 시 영향 큼.

## 4. 외부 UDP 123 차단 시 절차 (cafe24)

cafe24 등 한국 호스팅사가 UDP 123 outbound 를 차단하면 외부 NTP 응답이 미수신 되어 drift 가 누적된다.

1. **확인**: `sudo ss -uap state established 'sport = :123'` 로 ESTABLISHED 0건 + `journalctl -u systemd-timesyncd` 의 timeout 누적 확인.
2. **호스팅사 문의**: cafe24 고객센터에 **UDP 123 outbound 차단 해제** 요청.
   - 대상: `time.bora.net:123`, `time.kriss.re.kr:123`, `*.kr.pool.ntp.org:123`
   - 사유: 운영 서버 시계 동기화 (감사 로그·예약 시스템 정합성)
3. **임시 보정** (운영 시간대 외): `sudo hwclock --hctosys` (대규모 step jump 는 트랜잭션·세션 만료 계산에 영향 — 운영 시간대 회피).
4. **차단 해제 후**: `sudo systemctl restart systemd-timesyncd` 후 `timedatectl status` 의 `synchronized: yes` 확인.

## 5. 알람 채널·도구

- **Discord**: `#mindgarden-ops` 채널, LogWatcher (Phase 1 무료) 또는 systemd cron 으로 송신.
- **메트릭**: 향후 Prometheus `node_timex_offset_seconds` 메트릭 수집 + Grafana 알람 (별도 PR).
- **저장**: drift 측정값은 운영 감사 로그(`audit_*`) 1개월 보존.

## 6. 변경 절차

`timesyncd.conf` 변경은 **`core-deployer` 워크플로** 를 통해서만 적용. 운영 SSH 직접 편집 금지.

```bash
# 정본 적용 (NTP_RECOVERY_PLAN_20260614.md §2)
sudo cp deployment/systemd-timesyncd/timesyncd.conf /etc/systemd/timesyncd.conf
sudo chown root:root /etc/systemd/timesyncd.conf && sudo chmod 644 /etc/systemd/timesyncd.conf
sudo systemctl restart systemd-timesyncd
```

## 7. 참조

- [`NTP_RECOVERY_PLAN_20260614.md`](../운영반영/NTP_RECOVERY_PLAN_20260614.md) — 영구 복구 계획
- [`DEPLOYMENT_STANDARD.md`](./DEPLOYMENT_STANDARD.md) §systemd
- [`LOGGING_STANDARD.md`](./LOGGING_STANDARD.md) §감사 로그
