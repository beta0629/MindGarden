# acme-dns 셀프호스팅 인프라 설계서 — Let's Encrypt 와일드카드 무인 갱신 정착

## 0. 배경

### 0-1. 현재 만료 매트릭스 (2026-05-28 기준)
- 운영 `*.core-solution.co.kr` — **6/19 만료, 잔여 22일**
- dev `*.dev.core-solution.co.kr` — **이미 만료 (-101일)**
- 자동 갱신 불가능: 가비아 DNS API 미제공으로 인해 90일마다 사용자의 가비아 TXT 수동 등록이 필요했습니다.

### 0-2. 사용자 결정
- **옵션 B 채택**: acme-dns 셀프호스팅을 구축하여 가비아 네임서버를 유지하면서 무인 갱신을 달성합니다.
- 이번 만료 사이클(운영 6/19, dev 이미 만료)은 수동으로 처리하며, 다음 만료 전까지 acme-dns를 정착시키는 것을 목표로 합니다.

### 0-3. 저장소 단서
- `scripts/server-management/ssl/issue-wildcard-ssl-prod.sh` — 운영 와일드카드 발급 (DNS-01 + expect)
- `scripts/server-management/ssl/issue-wildcard-ssl-dev.sh` — dev 와일드카드 발급
- `scripts/server-management/ssl/ensure-auto-renewal.sh` — 자동 갱신 점검 (systemd timer / cron / deploy-hook 확인)
- `scripts/deployment/certbot-renew-and-reload-nginx.sh` — manual_auth_hook 주석에 "완전 무인은 아님" 명시
- `.github/workflows/ssl-auto-renewal-check.yml` — workflow_dispatch 점검 (SCP 버그는 별도 PR 진행 중)

## 1. acme-dns 개요 및 원리

- **DNS-01 challenge 우회**: `_acme-challenge.core-solution.co.kr`을 acme-dns의 동적 서브도메인(예: `<uuid>.acme.core-solution.co.kr`)으로 CNAME 위임합니다.
- **수동 개입 최소화**: 사용자가 최초 1회만 가비아에 CNAME을 등록하면, 이후에는 acme-dns가 TXT 레코드를 자동 처리하여 certbot 검증을 통과합니다.
- **확장성**: 신규 와일드카드 도메인 추가 시에도 동일 인프라를 재사용(서브도메인별 acme-dns 계정 발급)할 수 있습니다.

## 2. 배치 위치 결정 매트릭스

| 옵션 | 위치 | 장점 | 단점 | 권장 여부 |
|---|---|---|---|---|
| (a) dev 서버 단독 | beta0629.cafe24.com:53 | 운영 영향 없음, 빠른 시작 | dev 다운 시 운영 갱신 영향 | **권장** (dev 다운 시 30일 갱신 유예 + 운영 영향 0) |
| (b) 운영 서버 단독 | beta74.cafe24.com:53 | 안정성 향상 | 운영 변경 부담 | 대안 (안정성) |
| (c) 별도 acme 서버 | 신규 호스트 | 격리도 최고 | 비용 및 관리 부담 증가 | |
| (d) 양쪽 (이중화) | 운영 + dev :53 | 고가용성(HA) | 동기화 복잡 | |

## 3. 도메인 설계

- **acme-dns 서비스 도메인**: `acme.core-solution.co.kr` (또는 `acme-internal.core-solution.co.kr`)
- **운영 와일드카드 CNAME**: `_acme-challenge.core-solution.co.kr` → `<uuid1>.acme.core-solution.co.kr`
- **dev 와일드카드 CNAME**: `_acme-challenge.dev.core-solution.co.kr` → `<uuid2>.acme.core-solution.co.kr`
- **가비아 등록 레코드 (최초 1회 수동)**:
  1. `acme.core-solution.co.kr` A 레코드 → acme-dns 서버 IP
  2. `_acme-challenge.core-solution.co.kr` CNAME → `<uuid1>.acme.core-solution.co.kr`
  3. `_acme-challenge.dev.core-solution.co.kr` CNAME → `<uuid2>.acme.core-solution.co.kr`

## 4. acme-dns 설치 및 설정

- **바이너리**: `acme-dns` (Go 기반 단일 바이너리, 약 10MB)
- **포트**: 53 (DNS UDP/TCP), 8080 (HTTP API)
- **데이터 저장**: SQLite (단순성 고려) 또는 PostgreSQL
- **서비스 관리**: systemd unit으로 관리
- **방화벽 설정**: UDP/TCP 53 외부 인바운드 허용, HTTP API 8080은 localhost만 허용
- **백업 정책**: SQLite DB 일일 백업

## 5. certbot 통합 방안

- **플러그인**: `certbot-dns-acmedns` (또는 `acmedns-client` 플러그인) 설치 (`pip3 install certbot-dns-acmedns`)
- **자격 증명 파일 (`/etc/letsencrypt/acmedns.json`)**:
  ```json
  {
    "core-solution.co.kr": {
      "username": "<acme-dns username>",
      "password": "<password>",
      "fulldomain": "<uuid1>.acme.core-solution.co.kr",
      "subdomain": "<uuid1>",
      "allowfrom": []
    },
    "dev.core-solution.co.kr": {
      "username": "<acme-dns username>",
      "password": "<password>",
      "fulldomain": "<uuid2>.acme.core-solution.co.kr",
      "subdomain": "<uuid2>",
      "allowfrom": []
    }
  }
  ```
- **발급 명령어 예시**:
  ```bash
  certbot certonly \
    --authenticator dns-acmedns \
    --dns-acmedns-credentials /etc/letsencrypt/acmedns.json \
    -d "*.core-solution.co.kr" -d "core-solution.co.kr"
  ```
- **자동 갱신**: 이후 기존의 systemd timer 또는 cron을 통해 `certbot renew` 자동 호출.

## 6. 마이그레이션 절차

1. **Phase 2-A**: acme-dns 설치
2. **Phase 2-B**: 사용자 1회 가비아에 `acme.core-solution.co.kr` A 레코드 등록
3. **Phase 2-B**: acme-dns register API로 운영/dev 각각 username/uuid 발급
4. **Phase 2-B**: 가비아 CNAME 2건 등록 (사용자 1회)
5. **Phase 2-C**: CNAME 전파 확인 (`dig` 명령 등)
6. **Phase 2-C**: certbot + acme-dns plugin을 사용해 운영 및 dev 와일드카드 신규 발급
7. **Phase 2-C**: nginx config의 `ssl_certificate` 경로 갱신 확인 (기존 경로 유지 시 변경 없음)
8. **Phase 2-D**: 90일 후 자동 갱신 검증 (만료 30일 전 dry-run을 통한 모니터링)

## 7. 롤백 계획

- **acme-dns 장애 시**: `manual_auth_hook` 모드로 일시 복귀하여 수동으로 TXT 등록 진행.
- **기존 방식 완전 회귀**: 가비아 CNAME 삭제 시 즉각 기존 수동 방식으로 회귀됨.
- **데이터 복구**: 데이터 손실 발생 시 일일 백업된 SQLite 복원.

## 8. 운영 및 모니터링

- **acme-dns 헬스 체크**: `curl http://localhost:8080/health`
- **DNS 응답 검증**: `dig @localhost <uuid>.acme.core-solution.co.kr TXT`
- **자동 갱신 점검**: 기존 `ensure-auto-renewal.sh` 스크립트를 확장하여 acme-dns 의존성 체크 로직 추가
- **알림 체계**: 갱신 실패 시(예: manual_auth_hook 시간 초과 또는 acme-dns 응답 실패) 슬랙 및 이메일 알림 발송

## 9. 작업 분할 및 위임 명세

### Phase A — core-coder 위임 (인프라 설치)
- `scripts/server-management/ssl/install-acme-dns.sh` 스크립트 신설
- `scripts/server-management/ssl/register-acme-dns-domain.sh` 스크립트 신설 (username/uuid 발급 및 가비아 CNAME 설정 안내 출력)
- `config/systemd/acme-dns.service` 신설
- `scripts/server-management/ssl/issue-wildcard-ssl-via-acmedns.sh` 신설 (기존 수동 발급 스크립트 `issue-wildcard-ssl-*.sh` 대체용)
- `scripts/server-management/ssl/ensure-auto-renewal.sh` 확장 (acme-dns 의존성 점검 로직 추가)
- 단위 테스트(스크립트 dry-run 검증) 작성 및 관련 문서 업데이트

### Phase B — 사용자 개입 (1회 가비아 작업)
- `acme.core-solution.co.kr` A 레코드 등록
- `_acme-challenge` CNAME 2건 등록

### Phase C — core-coder 위임 (인증서 마이그레이션)
- 운영 및 dev 와일드카드를 acme-dns plugin으로 재발급 연동
- nginx 설정 검증
- 자동 갱신 dry-run 테스트 수행

### Phase D — core-deployer 위임 (정착 및 모니터링)
- 운영 환경 반영
- 모니터링 연동

## 10. 일정 및 리스크

| 단계 | 예상 소요 | 사용자 의존도 | 리스크 |
|---|---|---|---|
| Phase A (설치) | 4-6시간 (코더) | 0 | 낮음 |
| Phase B (가비아) | 5-10분 (사용자) | 1회 | 0 |
| Phase C (마이그레이션) | 2-3시간 (코더) | 0 | 중 (기존 인증서 영향 최소화 필요) |
| Phase D (정착) | 30분 (디플로이어) | 0 | 낮음 |
| **총계** | **1-2 영업일** | **1회 5-10분** | — |

## 11. 사용자 결재 변수 (확인 필요)
1. **배치 위치**: (a) dev 단독, (b) 운영 단독, (c) 별도 서버, (d) 이중화
2. **acme 서비스 도메인 이름**: `acme.core-solution.co.kr` vs `acme-internal.core-solution.co.kr`
3. **데이터 저장소**: SQLite vs PostgreSQL
4. **백업 주기**: 일일 등 주기의 상세화
5. **모니터링 채널**: 슬랙 워크스페이스 내 특정 채널, 수신 이메일 지정 등
