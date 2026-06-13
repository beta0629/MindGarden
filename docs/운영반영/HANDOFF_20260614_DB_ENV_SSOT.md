# 운영 인계 — DB / 환경변수 SSOT 단일화 Cutover

**작성일**: 2026-06-14 (KST)  
**대상**: 운영팀 / DevOps / Repo Admin  
**근거**: PR #300 (`DB_ENV_SSOT_POLICY.md` 명문화) · PR #301 (JWT_SECRET 회귀 가드) · PR #296 (deploy guard 평문 secret 거부)  
**관련 문서**: `docs/standards/DB_ENV_SSOT_POLICY.md`, `docs/standards/SYSTEMD_FALLBACK_DB_ENV_POLICY.md`, `DB_ENV_SSOT_PRECHECK_20260613.md`

---

## 1. 인계 목적

운영(`production`) 환경변수 SSOT를 **`/etc/mindgarden/prod.env` 단일 파일** 로 단일화한다. 본 인계는 PR-1 (표준 명문화) 머지 직후 운영팀이 수행할 **점진 cutover 절차 (PR-2 → PR-3 → PR-4)** 운영 액션을 정리한다.

## 2. 사전 조건

- [ ] PR #300 (표준 명문화) 가 `main` 에 머지되어 있다.
- [ ] `/etc/mindgarden/prod.env` 파일 perm `600`, owner `root:root` 확인.
- [ ] `/etc/mindgarden/prod-from-dev.env` 백업 사본 1개 이상 보존 (PR-4 cutover 직전 롤백용).
- [ ] GitHub Secrets 6종 (`JWT_SECRET`, `KAKAO_CLIENT_SECRET`, `NAVER_CLIENT_SECRET`, `PERSONAL_DATA_ENCRYPTION_KEY`, `PERSONAL_DATA_ENCRYPTION_IV`, `MINDGARDEN_DORMANT_PII_ENC_KEY`) 등록 확인.

## 3. 운영 액션 절차

### 3.1 사전 점검 (PR-2 머지 전)

```bash
# Step 1. 현재 운영 env 파일 키 인벤토리 (운영 SSH)
ssh PRODUCTION 'sudo grep -E "^[A-Z_]+=" /etc/mindgarden/prod.env | wc -l'           # 기대: 5
ssh PRODUCTION 'sudo grep -E "^[A-Z_]+=" /etc/mindgarden/prod-from-dev.env | wc -l'  # 기대: 60

# Step 2. systemd unit Environment= 평문 secret 잔존 확인 (있으면 PR-3 까지 차단)
ssh PRODUCTION '
  sudo grep -hE "^Environment=" /etc/systemd/system/mindgarden-core-{blue,green}.service \
       /etc/systemd/system/mindgarden-core-*.service.d/*.conf 2>/dev/null | \
    grep -iE "JWT_SECRET|CLIENT_SECRET|ENCRYPTION_(KEY|IV)|PII_ENC_KEY" || echo "OK: no plaintext secret"
'
```

### 3.2 PR-2 (composite action 통합) 머지 후

- 변경 없음. `deploy-production.yml` 4개 sync step 이 단일 composite action 으로 동작하는지 확인만.

```bash
# Step 3. 다음 운영 배포 후 sync 로그가 단일 action 호출 1회로 단순화 됐는지 확인
gh run view --log -R coresolution/mind-garden | grep -E "sync.*prod\.env" | head
```

### 3.3 PR-3 (unit 평문 secret 6종 제거) 머지 후

- 6종 secret 이 unit `Environment=` 에서 제거되고 `prod.env` 로 이동된다.
- 운영 적용 직후 BE 부팅 시 `EnvironmentValidationConfig` 가 6종 모두 검출하는지 확인.

```bash
ssh PRODUCTION '
  sudo journalctl -u mindgarden-core-blue.service --since "5 minutes ago" | \
    grep -iE "JWT_SECRET|PERSONAL_DATA_ENCRYPTION|PII_ENC_KEY|CLIENT_SECRET" | head
'
```

기대값: `❌ 필수 환경 변수 누락` 0건, `✅` 정상 로딩 로그만.

### 3.4 PR-4 (prod-from-dev.env → prod.env 단일화) 머지 후

- 60키 이전 + drop-in `90-envfile.conf` 제거 + 무중단 cutover.
- 반드시 `core-tester` 게이트 통과 후 운영팀 합의로 적용.

```bash
# Step 4. cutover 직후 환경변수 60+5=65종 prod.env 단일 로딩 확인
ssh PRODUCTION 'sudo grep -E "^[A-Z_]+=" /etc/mindgarden/prod.env | wc -l'   # 기대: 65 ± α
ssh PRODUCTION 'ls /etc/mindgarden/prod-from-dev.env 2>&1 | grep "No such"'  # 기대: No such file
ssh PRODUCTION 'sudo systemctl cat mindgarden-core-blue.service | grep EnvironmentFile'
# 기대: EnvironmentFile=/etc/mindgarden/prod.env 단일
```

## 4. 롤백 절차

| 단계 | 트리거 | 액션 |
|---|---|---|
| PR-3 후 | BE 부팅 실패 / `필수 환경 변수 누락` | unit 백업본으로 즉시 롤백, secret 평문 임시 복원 (운영 DBA + `core-deployer`) |
| PR-4 후 | env 키 누락으로 기능 장애 | `prod-from-dev.env.bak.<timestamp>` 복원, drop-in `90-envfile.conf` 재배치 |

롤백 시 GitHub Secrets 는 보존, env 파일만 복원.

## 5. 담당자 · 완료 조건

| 단계 | 담당 | 완료 시각 (KST) |
|---|---|---|
| §3.1 인벤토리 | 운영 DBA | PR-2 머지 전 D-1 |
| §3.2 sync 로그 확인 | DevOps | PR-2 머지 후 D+0 |
| §3.3 부팅 검증 | 운영팀 + `core-tester` | PR-3 머지 후 D+0 |
| §3.4 cutover 검증 | 운영팀 + DBA + `core-tester` | PR-4 머지 후 D+0, 익일 09:00 재확인 |

각 단계 GREEN 확인 후 다음 PR 진행. RED 시 즉시 §4 롤백.

## 6. 절대 금지

- 운영 secret 평문 본 문서·티켓·채팅 게시 금지.
- unit `Environment=JWT_SECRET=...` 등 평문 secret 인라인 부활 금지.
- PR-4 cutover 를 `core-tester` 게이트 없이 강행 금지.
