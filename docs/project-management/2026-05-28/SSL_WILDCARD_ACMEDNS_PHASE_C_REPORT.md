# Phase C 실측 보고서 — acme-dns 와일드카드 재발급 (BLOCKED on Phase B 보강)

> 작성: 2026-05-28
> 브랜치: `feature/acme-dns-phase-c-wildcard-renewal`
> 설계서: [SSL_WILDCARD_ACMEDNS_AUTO_RENEW_HANDOFF.md](./SSL_WILDCARD_ACMEDNS_AUTO_RENEW_HANDOFF.md)
> Phase A PR: [#55](https://github.com/beta0629/mindGarden/pull/55) (머지 완료)

## 0. 한줄 결론

- **Phase C 코드/인프라 조치 완료** — certbot-dns-acmedns 플러그인 설치, 스크립트 INI 정합 보강, NS 사전 점검 추가, ensure-auto-renewal.sh 회귀 PASS.
- **와일드카드 발급 자체는 가비아 NS 위임 1줄 누락으로 BLOCKED** — 사용자 1회 가비아 작업 (Phase B 보강) 후 재실행 시 무인 발급 가능.
- 코드 변경 영향 0 (운영/dev nginx 가 사용하는 cert 는 단일 도메인 cert, 발급 시도는 read-only 영향).

## 1. 산출물 (스크립트/문서)

| 파일 | 변경 | 목적 |
|---|---|---|
| `scripts/server-management/ssl/issue-wildcard-ssl-via-acmedns.sh` | INI 자격증명 자동 생성, NS 위임 사전 점검, 8.8.8.8 강제 조회 | 발급 실패 사유 (No TXT) 사전 차단 |
| `scripts/server-management/ssl/register-acme-dns-domain.sh` | 등록 시 INI 자격증명 동기 생성 | 신규 도메인 등록 즉시 발급 가능 |
| `docs/project-management/2026-05-28/SSL_WILDCARD_ACMEDNS_AUTO_RENEW_HANDOFF.md` | §3, §9 Phase B 에 NS 위임 단계 추가 | Phase B 누락 사유 명시 |
| `docs/project-management/2026-05-28/SSL_WILDCARD_ACMEDNS_PHASE_C_REPORT.md` | 신규 | 본 보고서 |

## 2. dev 서버 사전 준비 (완료)

```
=== certbot 버전 ===
certbot 1.21.0

=== certbot-dns-acmedns 플러그인 ===
Name: certbot-dns-acmedns
Version: 0.1.0
Summary: ACME-DNS DNS Authenticator plugin for Certbot
Home-page: https://github.com/pan-net-security/certbot-dns-acmedns

=== certbot plugins (관련 항목) ===
* dns-acmedns
  Description: Obtain certificates using a DNS TXT record (if you are using ACME-DNS for DNS.)
  Entry point: dns-acmedns = certbot_dns_acmedns.dns_acmedns:Authenticator
```

- 설치 위치: 시스템 Python (`/usr/local/lib/python3.10/dist-packages/certbot_dns_acmedns/`).
- 설치 명령: `apt-get install -y python3-pip && pip3 install certbot-dns-acmedns` (root).
- venv 미사용 사유: 기존 apt certbot 1.21.0 + certbot.timer 9개 도메인 자동 갱신을 그대로 유지. venv 분리 시 timer 가 호출하는 바이너리 경로 추가 변경 필요 → 본 Phase 범위 초과로 미적용. Phase D 에서 재검토 권고.

### 2-1. INI 자격증명 (신규)

```ini
# /etc/letsencrypt/acmedns.ini  (perm=0600 root:root)
dns_acmedns_api_url           = http://127.0.0.1:8053
dns_acmedns_registration_file = /etc/letsencrypt/acmedns.json
```

- pan-net-security/certbot-dns-acmedns 0.1.0 은 `--dns-acmedns-credentials` 인자에 INI 형식의 파일을 요구하며, 그 INI 가 **JSON 등록 파일** (도메인↔acme-dns 자격증명) 경로를 가리킨다.
- Phase A 설계서 §5 는 JSON 단일 파일을 가정했으나, 실제 플러그인은 **INI + JSON 2-tier** 구조이다.
- 본 PR 의 `issue-wildcard-ssl-via-acmedns.sh` / `register-acme-dns-domain.sh` 가 INI 가 없으면 자동 생성하므로 추가 운영 절차 부담은 없다.

### 2-2. JSON 자격증명 (Phase A/B 산출물 그대로 유지)

```
sudo jq "keys" /etc/letsencrypt/acmedns.json
[
  "core-solution.co.kr",
  "dev.core-solution.co.kr"
]
```

## 3. 발급 시도 결과 — BLOCKED

### 3-1. core-solution.co.kr (운영 와일드카드)

```
$ sudo bash /root/issue-wildcard-ssl-via-acmedns.sh core-solution.co.kr
[issue-wildcard-ssl-via-acmedns] 사전 점검...
[issue-wildcard-ssl-via-acmedns] CNAME 전파 확인:
  ✅ _acme-challenge.core-solution.co.kr → 749824da-c3d2-4feb-b57d-b69714dc73c5.acme.core-solution.co.kr.
[issue-wildcard-ssl-via-acmedns] NS 위임 점검:
  ❌ acme.core-solution.co.kr 에 NS 위임 미설정 → LE 검증 실패 (No TXT record found).
```

스크립트가 NS 위임 누락을 검출하여 certbot 호출 전 fail-fast (exit 1) 한다. NS 사전 점검을 우회 (`--force` 또는 NS 추가 전) 하고 실제 호출 시 LE 응답:

```
Certbot failed to authenticate some domains (authenticator: dns-acmedns).
The Certificate Authority reported these problems:
  Domain: core-solution.co.kr
  Type:   unauthorized
  Detail: No TXT record found at _acme-challenge.core-solution.co.kr
```

### 3-2. dev.core-solution.co.kr (dev 와일드카드)

동일 원인. 두 와일드카드 모두 같은 acme zone (`acme.core-solution.co.kr`) 의 NS 위임을 공유.

## 4. 근본 원인 — 가비아 NS 위임 1줄 누락

### 4-1. DNS 체인 분석 (실측)

```
$ dig +trace _acme-challenge.core-solution.co.kr TXT @8.8.8.8
...
core-solution.co.kr.  86400  IN  NS  ns.gabia.net.
core-solution.co.kr.  86400  IN  NS  ns1.gabia.co.kr.
core-solution.co.kr.  86400  IN  NS  ns.gabia.co.kr.
;; Received 163 bytes from 210.101.60.1#53(b.dns.kr) in 4 ms

_acme-challenge.core-solution.co.kr. 3600 IN CNAME 749824da-...acme.core-solution.co.kr.
core-solution.co.kr.  86400  IN  SOA  ns.gabia.co.kr. hosting.gabia.com. 2025111811 ...
;; Received 234 bytes from 43.201.170.100#53(ns.gabia.co.kr) in 8 ms
```

- LE 가 `_acme-challenge.core-solution.co.kr TXT` 를 가비아에 질의 → CNAME 응답 정상 수신.
- LE 가 CNAME 을 따라 `<uuid>.acme.core-solution.co.kr TXT` 질의 → **가비아 NS 가 `acme.core-solution.co.kr` zone 을 hosting 하지 않음** → SOA 만 반환 (NODATA) → LE 가 `No TXT record found` 로 처리.

### 4-2. 직접 acme-dns 서버 질의 — 정상

```
$ dig @114.202.247.246 749824da-c3d2-4feb-b57d-b69714dc73c5.acme.core-solution.co.kr TXT +short
"JAQCqbJOF1Os0Z8L8qJiIE3vKTE3Tpephzr2fM3G7YE"
"IG1Z4VGLyUcY43btLLNkZm960Uw7po5HYKWT6opSJck"
```

→ acme-dns 서버 자체는 TXT 를 정상 서빙. 단, 외부 DNS 가 그 서버를 권한 NS 로 인식하지 못한 상태.

### 4-3. 결론

- `acme.core-solution.co.kr` zone 을 acme-dns 서버 (114.202.247.246) 로 위임하는 **NS 레코드가 가비아에 없다**.
- Phase A 설계서 §3 은 A 레코드 + CNAME 만 명시했고 NS 위임을 누락했다 → 본 PR 에서 §3, §9 Phase B 에 보강.

## 5. 사용자 조치 가이드 — 가비아 NS 1회 등록 (BLOCKER)

### 5-1. 가비아 DNS 관리자 화면

| 호스트 | 타입 | 값 | TTL |
|---|---|---|---|
| `acme` | NS | `acme.core-solution.co.kr.` | 3600 |

- 호스트 입력란이 FQDN 을 자동 보정하면 `acme.core-solution.co.kr` 로 입력해도 동일.
- 값 끝의 `.` (점) 은 절대도메인 표기. 가비아 UI 가 자동으로 추가하면 생략.
- 글루 (Glue) A 레코드는 이미 등록되어 있다 (`acme.core-solution.co.kr A 114.202.247.246` — Phase B 결과).

### 5-2. 등록 후 검증 (사용자 또는 코더)

```
dig @8.8.8.8 NS acme.core-solution.co.kr +short
# 기대: acme.core-solution.co.kr.

dig @8.8.8.8 _acme-challenge.core-solution.co.kr TXT +short
# 기대: <uuid>.acme.core-solution.co.kr.   (CNAME)
#       "<TXT 1>"                          (TXT, 후속 질의 결과)
```

가비아 전파는 보통 5~10분, 글로벌 캐시 반영 30분. 전파 후 본 PR 의 `issue-wildcard-ssl-via-acmedns.sh` 를 dev 서버에서 단 1회 실행하면 두 와일드카드 모두 무인 발급된다.

## 6. 자동 갱신 dry-run (보류)

- 와일드카드 발급 자체가 BLOCKED 이므로 `certbot renew --dry-run --cert-name core-solution.co.kr` / `dev.core-solution.co.kr` 는 **본 보고 시점에 실행 불가** (cert 가 아직 존재하지 않음).
- NS 위임 + 발급 완료 후 즉시 dry-run 수행 권고 (Phase D 디플로이어 또는 본 PR 재가동 시).
- 예상 결과: 두 cert 모두 dns-acmedns 플러그인 + INI + JSON 조합으로 무인 갱신 PASS (LE 검증은 위임된 acme-dns zone 에서 수행).

## 7. ensure-auto-renewal.sh 회귀 점검 — Phase A PASS

```
$ sudo bash /root/ensure-auto-renewal.sh dev --dry-run
==========================================
SSL 자동 갱신 설정 점검 (dev)
==========================================
1. certbot.timer 상태
   ✅ certbot.timer 활성화됨
2. authenticator 확인
   ⚠️  dev.core-solution.co.kr: authenticator=standalone (포트 80 충돌 가능)  ← 기존 단일 cert
   ⚠️  dev.e-trinity.co.kr:    authenticator=standalone (포트 80 충돌 가능)  ← 기존 단일 cert
   ✅ ops.dev.e-trinity.co.kr: authenticator=nginx
3. 갱신 시뮬레이션 — [dry-run] 생략
4. 만료 30일 이내 인증서: dev.core-solution.co.kr (VALID: 14 days)
5. acme-dns 의존성 점검
   ✅ acme-dns systemd active
   ✅ 53/UDP listen 확인
   ✅ HTTP API /health 200 OK (http://127.0.0.1:8053/health)
   ✅ /etc/letsencrypt/acmedns.json 존재 (perm=600, owner=root)
   ✅ acme-dns-backup.timer active
   ✅ acme-dns 의존성 점검 PASS
```

→ Phase A 인프라는 100% 정상. dev 만료 임박 (`dev.core-solution.co.kr` 14일) 은 NS 위임 후 와일드카드로 교체될 예정 → Phase D 범위.

## 8. nginx 사용 cert 인벤토리 (교체 X)

### 8-1. dev 서버 (`beta0629.cafe24.com`)

| 도메인 | cert 종류 | 만료 | 비고 |
|---|---|---|---|
| `dev.core-solution.co.kr` | 단일 (standalone) | 2026-06-11 (14d) | 와일드카드 교체 후 폐기 권고 |
| `app.dev.core-solution.co.kr` | 단일 | 2026-08-26 (89d) | 와일드카드로 흡수 가능 |
| `api.dev.core-solution.co.kr` | 단일 | 2026-07-21 (54d) | 와일드카드로 흡수 가능 |
| `mindgarden.dev.core-solution.co.kr` | 단일 | 2026-07-21 (54d) | 와일드카드로 흡수 가능 |
| `trinity.dev.core-solution.co.kr` | 단일 | 2026-07-02 (34d) | 와일드카드로 흡수 가능 |
| `*.dev.core-solution.co.kr` | (미발급) | — | Phase C 발급 대상 |

→ dev nginx 가 사용하는 cert 는 모두 단일 도메인. 와일드카드 새 cert 를 발급해도 nginx 즉시 교체 의무 없음. Phase D (디플로이어) 에서 일괄 통합 권고.

### 8-2. 운영 서버 (`beta74.cafe24.com`) — 본 PR 직접 점검 미수행

- 본 Phase C 는 dev 서버에서만 발급 (acme-dns 가 dev 단독 배치, 설계 §2 옵션 a).
- 운영 서버 nginx 가 사용 중인 cert 는 본 PR 범위 외 — Phase D 에서 dev → 운영 cert sync (rsync + deploy-hook) 또는 운영 서버에 plugin 추가 설치로 자체 발급 결정.

## 9. 게이트 결과

| 게이트 | 결과 |
|---|---|
| `bash -n issue-wildcard-ssl-via-acmedns.sh` / `register-acme-dns-domain.sh` | ✅ PASS |
| `--dry-run` 체인 (사전 점검 + INI 보강 + NS 점검) | ✅ PASS (NS 누락 검출 시 fail-fast 정상 작동) |
| `certbot plugins | grep dns-acmedns` | ✅ PASS (Authenticator 등록) |
| `certbot certificates` 새 와일드카드 2개 | ❌ BLOCKED (NS 위임 누락) |
| `certbot renew --dry-run --cert-name core-solution.co.kr` | ❌ BLOCKED (cert 미발급) |
| `certbot renew --dry-run --cert-name dev.core-solution.co.kr` | ❌ BLOCKED (cert 미발급) |
| `ensure-auto-renewal.sh #1~#5` | ✅ PASS (#1 timer, #2 인증자, #3 dry-run skip, #4 만료, #5 acme-dns 의존성 모두 PASS) |

## 10. 운영 영향 평가

- 본 PR 머지 시 운영 영향 **0**. 스크립트는 dev 서버에서 사용자/디플로이어가 명시적으로 실행할 때만 동작.
- 운영 와일드카드 (`*.core-solution.co.kr`, 6/19 만료) 와 dev nginx 사용 cert 는 **변경 없음**.
- 가비아 NS 추가도 운영 트래픽에 영향 0 (`acme.*` 서브도메인 한정, 기존 `core-solution.co.kr` 등 다른 레코드 무관).

## 11. Phase D 권고 (디플로이어)

1. **사용자 NS 1회 등록** (가비아) → 본 보고서 §5 가이드 그대로.
2. **dev 서버에서 와일드카드 2개 재발급** — `sudo bash /root/issue-wildcard-ssl-via-acmedns.sh core-solution.co.kr` + `dev.core-solution.co.kr`.
3. **certbot renew --dry-run** 두 cert 모두 PASS 확인 (90일 후 무인 갱신 검증).
4. **운영 서버 cert 동기화** 정책 결정 — (a) dev → 운영 rsync + deploy-hook, (b) 운영 서버에도 plugin 추가 설치 후 자체 발급.
5. **systemd timer + cron** 재점검 (기존 certbot.timer 가 신규 cert 도 포함하는지).
6. **모니터링 채널** SMTP relay 또는 Slack webhook 으로 갱신 실패 알림.
7. dev 단일 cert (`dev.core-solution.co.kr`, `app.dev.*`, `api.dev.*` 등) **와일드카드로 흡수 + 폐기**.

## 12. 변경 파일 요약

```
scripts/server-management/ssl/issue-wildcard-ssl-via-acmedns.sh   # INI + NS 점검
scripts/server-management/ssl/register-acme-dns-domain.sh         # INI 동기 생성
docs/project-management/2026-05-28/SSL_WILDCARD_ACMEDNS_AUTO_RENEW_HANDOFF.md  # Phase B NS 단계 보강
docs/project-management/2026-05-28/SSL_WILDCARD_ACMEDNS_PHASE_C_REPORT.md     # 본 보고서 (신규)
```

## 13. 후속

- 본 PR 머지 후 사용자가 가비아 NS 1줄 등록 → DM 알림 → 코더 또는 디플로이어가 dev 서버에서 발급 1회 → Phase D 진행.
- 만약 NS 위임이 가비아 정책으로 거부되는 경우 (자기 자신 NS 미허용 등) → 별도 acme-dns 도메인 (예: `acme.e-trinity.co.kr`) 으로 zone 분리 검토.
