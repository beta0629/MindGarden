# NTP 영구 복구 계획 (2026-06-14)

## 1. 점검 결과 요약 (운영 SSH 실측)

- **drift**: 시스템 시계 약 **-247초** (4분 7초 느림)
- **`timedatectl`**: `System clock synchronized: no`
- **`systemd-timesyncd`**: active 이나 기본 `ntp.ubuntu.com` 30분 주기 timeout 누적
- **추정 원인**: 호스팅(cafe24) 측 **UDP 123 outbound 차단** 으로 외부 NTP 응답 미수신
- **영향**: 예약/리마인더/세션 만료/감사 로그 타임스탬프 신뢰도 저하

## 2. 영구 복구 절차 (운영 적용은 별도 `core-deployer` 작업)

```bash
# Step 1. 정본 적용
sudo cp deployment/systemd-timesyncd/timesyncd.conf /etc/systemd/timesyncd.conf
sudo chown root:root /etc/systemd/timesyncd.conf && sudo chmod 644 /etc/systemd/timesyncd.conf

# Step 2. 재시작
sudo systemctl restart systemd-timesyncd

# Step 3. 동기화 확인 (§3 차단 해제 후)
timedatectl status                                # 기대: System clock synchronized: yes
journalctl -u systemd-timesyncd -n 50 --no-pager
```

## 3. 선행 의뢰 (호스팅사)

- **cafe24 측 UDP 123 outbound 차단 해제 문의**
  - 대상: `time.bora.net:123`, `time.kriss.re.kr:123`, `*.kr.pool.ntp.org:123`
  - 사유: 운영 서버 시계 동기화 복구 (감사 로그/예약 시스템 정합성)

## 4. 보조 즉시 보정 (선택, 차단 해제 전 임시)

```bash
sudo hwclock --hctosys   # RTC → 시스템 시간 (4분 step jump → BE 영향 주의)
```

> 대규모 step jump 는 트랜잭션·세션 만료 계산에 영향. 운영 시간대 회피 권장.

## 5. 모니터링 (별도 PR)

- drift > 60s 시 Discord 알림 (LogWatcher 또는 systemd cron)
- 점검 주기: 1시간 / Daily 요약 09:00 KST

## 6. 다음 단계 체크리스트

- [ ] 본 PR 머지
- [ ] cafe24 UDP 123 차단 해제 문의·확인
- [ ] `core-deployer` 가 §2 절차로 운영 적용
- [ ] `core-tester` 가 `timedatectl status` / `journalctl` 결과 검증
- [ ] drift 알림 PR 진행
