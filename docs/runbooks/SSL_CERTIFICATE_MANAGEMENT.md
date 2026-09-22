# SSL 인증서 관리 런북 — SSOT

> **최종 갱신**: 2026-09-22  
> **전제**: NS가 Cloudflare로 이전 완료. **Cloudflare 엣지 자동갱신이 기본**.  
> **Obsolete 경로**: 가비아 DNS + acme-dns 셀프호스팅 (구경로, §5 참고)

---

## 1. 현행 인프라 개요

| 항목 | 값 |
|---|---|
| 네임서버 | **Cloudflare** (`core-solution.co.kr`, `e-trinity.co.kr` 모두) |
| 엣지 인증서 | Cloudflare Universal SSL 또는 Advanced Certificate Manager (ACM) |
| 오리진 인증서 | 경우에 따라 Let's Encrypt (certbot) 또는 Cloudflare Origin CA |
| 이전 DNS | 가비아 (NS 이전 완료, Obsolete) |
| 이전 자동갱신 | acme-dns 셀프호스팅 (Obsolete) |

---

## 2. 인증서 분기 판별표

클라이언트가 보는 인증서와 오리진 서버 인증서는 별개입니다.  
아래 분기표를 따라 현재 상태를 판별하고 조치합니다.

### 2-A. Cloudflare Universal / ACM 자동갱신 (기본 — PASS)

| 조건 | 설명 |
|---|---|
| Cloudflare 프록시 (🟠 Proxied) 활성 | DNS 레코드가 Proxied 상태 |
| 엣지 인증서 Issuer | `Google Trust Services`, `Cloudflare Inc ECC CA-3`, 또는 `DigiCert` |
| 갱신 | **Cloudflare가 자동 갱신** — 운영자 개입 불필요 |

**PASS 판별**: `curl -vI https://<도메인> 2>&1 | grep -i issuer` 로 Issuer 확인.  
Cloudflare CA 또는 Google Trust Services이면 **자동갱신 PASS**, 추가 조치 없음.

### 2-B. Custom Certificate 업로드 (Let's Encrypt 등)

| 조건 | 설명 |
|---|---|
| 엣지 인증서 Issuer | `Let's Encrypt` (`R3`, `R10`, `R11`, `E5`, `E6` 등), 또는 `ISRG Root` |
| Cloudflare Dashboard → SSL/TLS → Edge Certificates | "Custom" 타입으로 표시 |
| 갱신 | **Cloudflare가 자동갱신하지 않음** |

**조치가 필요한 경우**:
- LE 인증서를 Cloudflare에 Custom Certificate로 업로드한 상태
- 만료 전에 LE 재발급 → Cloudflare API 또는 Dashboard에서 재업로드 필요
- 또는 Custom Certificate 삭제 후 Universal/ACM으로 전환 권장

**권장**: Custom LE 업로드를 제거하고 Cloudflare Universal/ACM 자동갱신으로 전환.

### 2-C. DNS-Only / 오리진 직접 접속 (certbot 경로)

| 조건 | 설명 |
|---|---|
| DNS 레코드가 DNS-Only (⬜ 회색 구름) | Cloudflare 프록시 미사용 |
| 또는 `mindgarden.dev.*` 등 오리진 IP 직접 노출 | 클라이언트가 오리진 서버에 직접 연결 |
| 오리진 인증서 | Let's Encrypt (certbot) |
| 갱신 | **서버의 certbot 자동갱신 필요** |

**조치**:
- `certbot.timer` 활성화 확인
- `authenticator = nginx` 확인 (standalone 금지)
- `certbot renew --dry-run` 통과 확인
- 와일드카드의 경우 DNS-01 검증 필요 (Cloudflare DNS plugin 또는 수동)

---

## 3. 점검 체크리스트

### 3-1. Cloudflare 엣지 확인 (모든 도메인)

```bash
for domain in core-solution.co.kr e-trinity.co.kr \
              app.core-solution.co.kr api.core-solution.co.kr \
              dev.core-solution.co.kr mindgarden.dev.core-solution.co.kr; do
  echo "--- $domain ---"
  curl -sI "https://$domain" 2>/dev/null | grep -i 'cf-ray\|server:'
  echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null \
    | openssl x509 -noout -issuer -dates 2>/dev/null
  echo
done
```

**판별 기준**:
- `cf-ray` 헤더 존재 → Cloudflare 프록시 경유 (§2-A 또는 §2-B)
- `cf-ray` 없음 → DNS-Only 또는 오리진 직접 (§2-C)
- `issuer` 가 Cloudflare/Google Trust → §2-A (자동갱신 PASS)
- `issuer` 가 Let's Encrypt → §2-B (Custom 업로드) 또는 §2-C (오리진 certbot)

### 3-2. 오리진 서버 certbot 확인 (§2-C 해당 시)

서버 SSH 접속 후 `ensure-auto-renewal.sh` 실행:

```bash
sudo bash /path/to/ensure-auto-renewal.sh [dev|prod]
```

또는 GitHub Actions workflow `ssl-auto-renewal-check.yml` 수동 실행.

### 3-3. 만료일 모니터링

```bash
scripts/deployment/check-ssl-cert-expiry.sh
```

---

## 4. Cloudflare 전환 후 오리진 인증서 전략

### 옵션 A: Cloudflare Origin CA (권장)

- Cloudflare Dashboard → SSL/TLS → Origin Server → Create Certificate
- 최대 15년 유효, Cloudflare 프록시 뒤에서만 유효
- 오리진 서버 nginx에 설치
- certbot 불필요, 갱신 주기 매우 김

### 옵션 B: Let's Encrypt 유지 (오리진)

- Cloudflare 프록시 뒤에서도 오리진 LE 인증서 사용 가능
- `certbot.timer` + `authenticator=nginx` 로 자동갱신
- Full (Strict) 모드에서 유효한 인증서 필요

### SSL/TLS 암호화 모드 설정

Cloudflare Dashboard → SSL/TLS → Overview:
- **Full (Strict)**: 오리진에 유효한 인증서 필수 (Origin CA 또는 LE)
- **Full**: 오리진 자체서명 허용
- **Flexible**: 오리진 HTTPS 불필요 (비권장)

---

## 5. Obsolete 경로 (가비아 DNS + acme-dns)

> ⚠️ 아래 문서·스크립트는 NS가 가비아였을 때의 구경로입니다.  
> NS가 Cloudflare로 이전된 현재, 참고용으로만 보존합니다.

| 문서/스크립트 | 상태 | 설명 |
|---|---|---|
| `docs/runbooks/SSL_ACME_DNS_GABIA_SETUP.md` | **Obsolete** | 가비아 DNS + acme-dns CNAME 등록 가이드 |
| `docs/guides/deployment/SSL_AUTO_RENEWAL_SETUP.md` | **Obsolete** | 가비아 시절 자동갱신 가이드 |
| `docs/project-management/2026-05-28/SSL_WILDCARD_ACMEDNS_AUTO_RENEW_HANDOFF.md` | **Obsolete** | acme-dns 셀프호스팅 설계서 |
| `docs/project-management/archive/WILDCARD_SSL_DNS_SETUP.md` | **Obsolete** | 가비아 DNS TXT 수동 등록 |
| `docs/project-management/archive/GABIA_DNS_AUTO_SSL_GUIDE.md` | **Obsolete** | 가비아 DNS 자동 SSL |
| `scripts/server-management/ssl/issue-wildcard-ssl-via-acmedns.sh` | **Obsolete** | acme-dns 기반 발급 |
| `scripts/server-management/ssl/install-acme-dns.sh` | **Obsolete** | acme-dns 설치 스크립트 |
| `scripts/server-management/ssl/register-acme-dns-domain.sh` | **Obsolete** | acme-dns 도메인 등록 |

---

## 6. 비상 대응 (인증서 만료 임박)

### Cloudflare 프록시 도메인 (§2-A)
→ Cloudflare가 자동 처리. Dashboard에서 Edge Certificate 상태 확인.

### Custom LE 업로드 (§2-B)
1. 오리진 서버에서 LE 재발급 (certbot)
2. Cloudflare Dashboard → SSL/TLS → Edge Certificates → Upload Custom Certificate
3. 또는 Custom Certificate 삭제하여 Universal SSL로 전환

### 오리진 직접 (§2-C)
1. `sudo certbot renew` (갱신 가능 시)
2. 실패 시 `sudo certbot certonly --nginx -d <도메인>`
3. `sudo systemctl reload nginx`

---

## 7. 관련 워크플로

| 워크플로 | 용도 |
|---|---|
| `.github/workflows/ssl-auto-renewal-check.yml` | 오리진 certbot 상태 + 인증서 만료/SAN/issuer 관측 |
| `scripts/deployment/check-ssl-cert-expiry.sh` | 오리진 LE 인증서 만료일 점검 |
| `scripts/server-management/ssl/ensure-auto-renewal.sh` | 오리진 certbot 자동갱신 설정 점검 |
