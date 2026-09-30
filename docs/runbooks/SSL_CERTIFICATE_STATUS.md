# SSL 인증서 현황 — SSOT (Single Source of Truth)

> **최종 실측일**: 2026-09-22
> **이 문서가 SSL 인증서·DNS 구성의 유일 정본(SSOT)입니다.**
> 구 가비아+acme-dns 경로 문서는 Obsolete입니다.

---

## 1. 네임서버 (확정)

| 도메인 | NS 1 | NS 2 | 비고 |
|---|---|---|---|
| `core-solution.co.kr` | `decker.ns.cloudflare.com` | `vida.ns.cloudflare.com` | Cloudflare |
| `e-trinity.co.kr` | `decker.ns.cloudflare.com` | `vida.ns.cloudflare.com` | Cloudflare |

## 2. 인증서 실측 — 운영/개발 매트릭스 (2026-09-22 클라이언트 관측)

### 2-1. 운영 (Cloudflare proxy 경유)

| 인증서 | 적용 호스트 (실측) | Issuer | SAN | notAfter (GMT) | server | cf-ray |
|---|---|---|---|---|---|---|
| `*.core-solution.co.kr` + apex | `mindgarden.core-solution.co.kr`, `core-solution.co.kr` | LE YE2 | `*.core-solution.co.kr`, `core-solution.co.kr` | 2026-10-24 16:37:10 | `cloudflare` | 있음 |
| `*.e-trinity.co.kr` + apex | `ops.e-trinity.co.kr`, `e-trinity.co.kr` | LE YE1 | `*.e-trinity.co.kr`, `e-trinity.co.kr` | 2026-10-25 00:58:57 | `cloudflare` | 있음 |

### 2-2. 개발 (Cloudflare 미경유, nginx 직접)

| 인증서 | 적용 호스트 (실측) | Issuer | SAN | notAfter (GMT) | server | cf-ray |
|---|---|---|---|---|---|---|
| 단일 호스트 | `mindgarden.dev.core-solution.co.kr` | LE YR1 | `mindgarden.dev.core-solution.co.kr` | 2026-11-18 18:16:57 | `nginx/1.18.0` | 없음 |

> `*.dev.core-solution.co.kr` 와일드카드 인증서 존재 여부는 dev 서버 접속 없이 미확인. 실측된 호스트만 기재.

## 3. 미확정 사항 (TBD)

아래 항목은 2026-09-22 시점 미확인이며, 추정·단정하지 않습니다.

- **인증서 갱신 주체**: Cloudflare Universal/ACM 자동 갱신인지, Custom Certificate 업로드인지, 오리진 서버 자체 갱신인지 미확정.
- **dev 서버 인증서 갱신 자동화 여부**: certbot timer가 실제로 동작 중인지 서버 접속 없이 확인 불가.
- **dev 와일드카드 인증서**: `*.dev.core-solution.co.kr` 와일드카드가 dev 서버에 존재하는지 미확인 (서버 접속 필요).

## 4. 아키텍처 요약

```
[운영 도메인] ──(Cloudflare proxy)──▶ 오리진 서버
  core-solution.co.kr   cf-ray ✅  server: cloudflare
  e-trinity.co.kr       cf-ray ✅  server: cloudflare

[개발 도메인] ──(Cloudflare 미경유)──▶ dev 서버 직접
  *.dev.core-solution.co.kr   cf-ray ✗  server: nginx/1.18.0
```

## 5. 구경로 (Obsolete)

아래 문서·스크립트는 가비아 NS + acme-dns 셀프호스팅 기반으로 작성되었으며, Cloudflare NS 전환 후 **Obsolete**입니다.

| 경로 | 설명 |
|---|---|
| `docs/runbooks/SSL_ACME_DNS_GABIA_SETUP.md` | Phase B 가비아 DNS 등록 가이드 |
| `docs/project-management/2026-05-28/SSL_WILDCARD_ACMEDNS_AUTO_RENEW_HANDOFF.md` | acme-dns 설계서 |
| `docs/project-management/archive/GABIA_DNS_AUTO_SSL_GUIDE.md` | 가비아 자동 SSL 가이드 |
| `docs/project-management/archive/WILDCARD_SSL_DNS_SETUP.md` | 와일드카드 DNS 설정 가이드 |
| `docs/project-management/archive/SSL_CERTIFICATE_SETUP.md` | SSL 인증서 발급 가이드 |
| `docs/guides/deployment/SSL_AUTO_RENEWAL_SETUP.md` | 자동 갱신 설정 가이드 (가비아 전제) |

## 6. 변경 이력

| 날짜 | 내용 |
|---|---|
| 2026-09-22 | SSOT 신설. 확정 팩트(NS, 인증서 실측)만 기재. 미확정은 §3 TBD. |
| 2026-09-22 | §2 운영/개발 매트릭스 분리. dev 와일드카드 미확인 TBD 추가. |
