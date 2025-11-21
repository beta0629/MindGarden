# 가비아 DNS를 사용한 와일드카드 SSL 인증서 자동 발급 가이드

## 개요

가비아는 DNS API를 제공하지 않으므로, DNS TXT 레코드를 수동으로 추가해야 합니다. 하지만 이 가이드의 스크립트를 사용하면 DNS 전파를 자동으로 확인하여 인증서 발급 과정을 간소화할 수 있습니다.

## 장점

- ✅ DNS 전파 자동 확인 (수동 대기 불필요)
- ✅ 명확한 안내 메시지
- ✅ 인증서 발급 후 자동 정리 안내
- ✅ Enter 키 입력 최소화 (DNS 전파 확인 후 자동 진행)

## 사용 방법

### 1. 스크립트 준비

```bash
cd /Users/mind/mindGarden
chmod +x scripts/certbot-hooks/*.sh
```

### 2. 와일드카드 SSL 인증서 발급

```bash
# 운영 서버 접속
ssh root@beta74.cafe24.com

# 스크립트 복사 (또는 직접 서버에서 실행)
cd /root
# scripts/certbot-hooks/ 디렉토리를 서버로 복사

# 인증서 발급 실행
./issue-wildcard-ssl-gabia-auto.sh core-solution.co.kr
```

### 3. DNS TXT 레코드 추가

스크립트가 실행되면 다음 정보가 표시됩니다:

```
==========================================
가비아 DNS TXT 레코드 정보
==========================================
도메인: core-solution.co.kr
Challenge 도메인: _acme-challenge.core-solution.co.kr
TXT 값: [Certbot이 생성한 값]

📋 가비아 DNS 관리 페이지에서 다음 TXT 레코드를 추가하세요:
  호스트: _acme-challenge
  타입: TXT
  값: [표시된 값]
  TTL: 300 (또는 기본값)
```

**가비아 DNS 관리 페이지에서:**
1. `core-solution.co.kr` 도메인 선택
2. DNS 레코드 추가
3. 위 정보로 TXT 레코드 추가

### 4. DNS 전파 자동 확인

스크립트가 자동으로 DNS 전파를 확인합니다 (최대 5분):

```
DNS 전파 확인 중...

대기 중... (1/30) - _acme-challenge.core-solution.co.kr 확인 중...
대기 중... (2/30) - _acme-challenge.core-solution.co.kr 확인 중...
✅ DNS TXT 레코드 확인 완료!
   확인된 값: "[TXT 값]"
```

### 5. 인증서 발급 완료

DNS 전파가 확인되면 Certbot이 자동으로 인증서를 발급합니다.

### 6. TXT 레코드 정리 안내

인증서 발급 완료 후, 스크립트가 TXT 레코드 삭제 안내를 표시합니다:

```
==========================================
가비아 DNS TXT 레코드 정리 안내
==========================================
도메인: core-solution.co.kr
Challenge 도메인: _acme-challenge.core-solution.co.kr

📋 가비아 DNS 관리 페이지에서 다음 TXT 레코드를 삭제하세요:
  호스트: _acme-challenge
  타입: TXT
  값: [이전에 추가한 값]

   (인증서 발급이 완료되었으므로 더 이상 필요하지 않습니다)
```

## 스크립트 구조

### `gabia-dns-auth-hook.sh`
- Certbot의 `--manual-auth-hook`으로 사용
- DNS TXT 레코드 정보 표시
- DNS 전파 자동 확인

### `gabia-dns-cleanup-hook.sh`
- Certbot의 `--manual-cleanup-hook`으로 사용
- 인증서 발급 완료 후 TXT 레코드 삭제 안내

### `issue-wildcard-ssl-gabia-auto.sh`
- 전체 프로세스를 실행하는 메인 스크립트
- Hook 스크립트를 자동으로 연결

## 주의사항

1. **DNS 전파 시간**: DNS TXT 레코드가 전파되는데 보통 5-10분이 소요됩니다.
2. **수동 작업 필요**: 가비아 DNS API가 없으므로, TXT 레코드 추가/삭제는 수동으로 해야 합니다.
3. **Enter 키 입력**: DNS 전파 확인 후 Certbot이 "Press Enter to Continue"를 표시하면 Enter를 눌러야 합니다.

## 개선 방안

완전 자동화를 원하시면:
1. **DNS 제공업체 변경**: Cloudflare, Route53 등 DNS API를 제공하는 업체로 변경
2. **Certbot DNS 플러그인 사용**: `certbot-dns-cloudflare`, `certbot-dns-route53` 등
3. **자동 갱신 설정**: 인증서 갱신 시에도 동일한 과정이 필요합니다.

## 참고

- Certbot 공식 문서: https://eff-certbot.readthedocs.io/
- 가비아 DNS 관리: https://www.gabia.com/

