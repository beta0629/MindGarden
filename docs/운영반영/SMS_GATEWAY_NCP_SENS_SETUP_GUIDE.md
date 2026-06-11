# SMS 게이트웨이 NCP SENS 운영 셋업 가이드

> **PR #224** (`feat/sms-gateway-service-extraction`, commit `dae955f55`, develop 머지: `123aeb6b0`) 후속 가이드.
> **PR #224 후속** (`feat/sms-gateway-ncp-sens-formal`) 에서 `SmsGatewayServiceImpl#invokeNaverCloudGateway` 가 NCP SENS API 를 SignatureV2 로 정식 호출하도록 구현됨.
> 본 문서는 **운영자(deployer)** 가 NCP SENS 콘솔에서 4종 키를 발급받아 **GitHub Secrets** 에 등록하고, 워크플로 재실행으로 운영 환경에 자동 반영하기까지의 절차를 단계별로 정리한다.

---

## 0. 한 줄 요약

| 항목 | 값 |
| --- | --- |
| 발신 채널 | NCP SENS (Naver Cloud Platform Simple & Easy Notification Service) |
| 인증 방식 | SignatureV2 (HmacSHA256 + Base64) |
| BE 진입 조건 | `NCP_ACCESS_KEY` / `NCP_SECRET_KEY` / `NCP_SMS_SERVICE_ID` / `NCP_SMS_SENDER_NUMBER` **4종 모두** 채워졌을 때 |
| 4종 누락 시 동작 | **stub 모드 자동 fallback** — 데스크탑 사용자에게 SMS 미발송 + 운영 ERROR 로그 1회 |
| 변경 워크플로 | `.github/workflows/deploy-production.yml`, `.github/workflows/deploy-backend-dev.yml` |
| 관련 파일 | `src/main/resources/application.yml` 의 `sms.gateway.ncp.*` |

---

## 1. NCP SENS 콘솔 셋업 (운영자 1회 작업)

### 1.1 NCP 계정 준비
1. <https://www.ncloud.com> 에서 코어솔루션 운영 계정으로 로그인.
2. 결제 수단(법인 카드 또는 무통장) 등록 — SMS 건당 과금 (SMS ≈ 9원, LMS ≈ 28원).
3. **마이페이지 → 인증키 관리** 진입.

### 1.2 Access Key / Secret Key 발급 (NCP IAM)
1. `신규 API 인증키 생성` 클릭.
2. 발급된 **Access Key ID** → `NCP_ACCESS_KEY` 로 사용.
3. 발급된 **Secret Key** → `NCP_SECRET_KEY` 로 사용 (**최초 1회만 확인 가능, 즉시 복사**).
4. **권한 정책**: NCP 콘솔 권한과 별개로, SignatureV2 는 본 키 쌍으로 모든 SENS API 호출이 가능하므로 별도 IAM 정책 부여 불필요.
5. (권장) **Sub Account** 를 생성해 SENS 전용 키를 따로 발급하면 키 노출 사고 시 영향 범위를 최소화할 수 있다.

### 1.3 SENS 서비스 등록 + Service ID 확보
1. NCP 콘솔 → **Services → AI·Application Service → Simple & Easy Notification Service** 진입.
2. `Project` → `프로젝트 등록` 클릭하여 신규 프로젝트 생성 (예: `mindgarden-prod`).
3. 프로젝트 진입 → **SMS** 탭 → `서비스 등록` 클릭.
   - 서비스명: `mindgarden-sms-prod`
   - 등록 후 부여되는 **Service ID** (예: `ncp:sms:kr:1234567890:mindgarden-sms-prod`) → `NCP_SMS_SERVICE_ID` 로 사용.
   - **주의**: `ncp:sms:kr:...` 형식 전체를 그대로 복사해 사용한다. 일부만 잘라쓰면 SignatureV2 검증은 통과해도 발송 요청에서 404 가 발생한다.

### 1.4 발신번호 등록 (필수)
> ⚠️ 한국 SMS 정책상 **사전 등록된 발신번호만 사용 가능**. 미등록 발신번호는 401/403 으로 거부됨.

1. SENS 프로젝트 → **Project → Sender Phone** 진입.
2. `발신번호 등록 신청` 클릭.
3. **등록 서류** (택1):
   - **개인사업자/법인 명의 통신서비스 가입증명원** (KT/SKT/LGU+ 마이페이지에서 발급).
   - **세금계산서** (휴대폰/일반전화 발신번호 인증 시).
4. 평일 영업일 기준 **1\~2일** 내 승인 (NCP CS 검토).
5. 승인된 발신번호 (예: `0212345678` 또는 `01012345678`) → `NCP_SMS_SENDER_NUMBER` 로 사용.
   - 형식: `'-'` 제거, 국가코드 제외 (예: `+82-10-1234-5678` → `01012345678`).

---

## 2. GitHub Secrets 등록 (운영자 1회 작업)

### 2.1 등록 위치
- Repository → **Settings → Secrets and variables → Actions → New repository secret**
- URL: <https://github.com/{ORG}/{REPO}/settings/secrets/actions>

### 2.2 등록 키 4종

| Secret 이름 | 값 출처 | 예시 형식 |
| --- | --- | --- |
| `NCP_ACCESS_KEY` | §1.2 Access Key ID | `ABCD1234EFGH5678` (20자 영숫자) |
| `NCP_SECRET_KEY` | §1.2 Secret Key | `aBcDeFgHiJkL...` (40자 영숫자) |
| `NCP_SMS_SERVICE_ID` | §1.3 Service ID | `ncp:sms:kr:1234567890:mindgarden-sms-prod` |
| `NCP_SMS_SENDER_NUMBER` | §1.4 발신번호 | `0212345678` (숫자만, `-` 없음) |

### 2.3 환경 분리 (선택)
- 본 가이드는 **운영(prod) 1세트** 기준. 개발(dev) 환경에서도 실제 SMS 발송을 원하면 동일 4종을 등록한다.
- 운영/개발에서 같은 NCP 프로젝트를 공유해도 무방하나, 권장: **별도 NCP 프로젝트** 로 dev/prod 격리.
- GitHub Environment Secret 으로 분리하려면 `production` / `development` Environment 를 만들고 각각 4종 등록 + 워크플로 `environment:` 지정 필요 (현재 미적용).

---

## 3. 워크플로 자동 주입 (코드 변경 완료)

### 3.1 변경된 워크플로

| 워크플로 | step 이름 | 대상 env 파일 | restart |
| --- | --- | --- | --- |
| `deploy-production.yml` | `📱 NCP SENS SMS env 자동 주입 + 검증` | `/etc/mindgarden/prod-from-dev.env` | blue + green 양쪽 |
| `deploy-backend-dev.yml` | `📱 NCP SENS SMS env 자동 주입 + 검증` | `/etc/mindgarden/dev.env` | 통합 restart step 1회 |

### 3.2 동작 정책 (Apple/Google OAuth step 과 동일 패턴)

1. **Pre-check**: GitHub Secret 4종이 모두 채워졌는지 확인. **1개라도 비면 `::notice` 로 skip + 배포는 성공**.
2. **백업**: `prod-from-dev.env` / `dev.env` 를 `*.bak.YYYYMMDD_HHMMSS` 로 백업.
3. **멱등 갱신**: `KEY="VALUE"` 형식으로 기존 라인을 `sed` 로 in-place 치환, 없으면 append.
4. **권한 보호**: `chmod 600 root:root`.
5. **노출 없는 길이만 표시**: `(N chars)` 만 출력, 값 자체는 절대 echo 금지.
6. **재시작**: 운영은 `mindgarden-core-{blue,green}.service` 양쪽, dev 는 통합 restart step 이 1회만 실행 (P2 transient 502 차단).
7. **프로세스 env 검증**: active 슬롯의 `/proc/PID/environ` 에 4종 모두 들어갔는지 길이로 확인. 누락 시 `::error`.

### 3.3 application.yml 설정 (이미 반영됨)

```yaml
sms:
  gateway:
    ncp:
      access-key: ${NCP_ACCESS_KEY:}
      secret-key: ${NCP_SECRET_KEY:}
      service-id: ${NCP_SMS_SERVICE_ID:}
      sender-number: ${NCP_SMS_SENDER_NUMBER:}
```

`SmsGatewayServiceImpl#isStubMode()` 가 4종 중 하나라도 비면 `true` 반환 → `invokeStubGateway()` 로 fallback (운영 ERROR 로그 1회만 출력).

---

## 4. 운영 적용 절차 (사용자 액션 순서)

1. **§1** 절차로 NCP SENS 콘솔에서 키 4종 발급 + 발신번호 등록.
2. **§2** 절차로 GitHub Secrets 4종 등록.
3. **본 PR (`feat/sms-gateway-ncp-sens-formal`) develop 머지 → main 머지 → 운영 배포 워크플로 트리거**.
   - 또는 이미 머지된 상태라면 GitHub Actions → `Production - Deploy MindGarden Service` workflow → `Run workflow` 수동 실행.
4. 워크플로 로그에서 다음 라인 확인:
   ```
   ✅ prod.env NCP SENS 4종 갱신 완료 — 길이만 표시:
      NCP_ACCESS_KEY = (20 chars)
      NCP_SECRET_KEY = (40 chars)
      NCP_SMS_SERVICE_ID = (47 chars)
      NCP_SMS_SENDER_NUMBER = (10 chars)
   🎉 active 슬롯 (mindgarden-core-blue.service) 에 NCP_* 4종 모두 주입 완료 — SmsGatewayServiceImpl.isStubMode()=false 로 운영 NCP SENS 정식 발송 진입 가능
   ```
5. **운영 검수**: 데스크탑 사용자 계정으로 로그인 시도 → SMS OTP 수신 확인.
6. 운영 로그에서 `[OPS-ALERT] SMS stub mode in production` ERROR 가 더 이상 출력되지 않는지 확인.

---

## 5. 환경변수 검증 (서버 측)

운영자가 직접 SSH 접속해서 검증할 수 있는 명령:

```bash
# 1) prod.env 에 4종이 들어있는지 (값 노출 없이 길이만)
sudo grep -E "^NCP_" /etc/mindgarden/prod-from-dev.env \
  | awk -F= '{key=$1; rest=substr($0, length(key)+2); gsub(/^"|"$/, "", rest); printf "%s = (%d chars)\n", key, length(rest)}'

# 2) active 슬롯 (blue/green) 프로세스 env 에 4종이 들어갔는지
ACTIVE=$(sudo cat /etc/mindgarden/active-backend | tr -d '[:space:]')
UNIT="mindgarden-core-${ACTIVE}.service"
PID=$(systemctl show -p MainPID --value "$UNIT")
for k in NCP_ACCESS_KEY NCP_SECRET_KEY NCP_SMS_SERVICE_ID NCP_SMS_SENDER_NUMBER; do
  len=$(sudo cat "/proc/$PID/environ" | tr '\0' '\n' | awk -F= -v K="$k" 'BEGIN{f=0} $1==K {v=substr($0,length(K)+2); print length(v); f=1; exit} END{if(!f) print ""}')
  echo "$k = (${len:-MISSING} chars)"
done

# 3) BE actuator 로 stub 여부 간접 확인 (sms.gateway.ncp.* 가 settings 로 노출되지 않으므로 /actuator/health 의 status: UP 만 확인)
curl -s http://127.0.0.1:8080/actuator/health | jq .
```

---

## 6. 트러블슈팅

### 6.1 SignatureV2 인증 실패 (HTTP 401)
- **원인 1**: Access Key / Secret Key 오타. **§1.2** 에서 재발급 후 GitHub Secret 갱신.
- **원인 2**: SignatureV2 메시지 포맷 불일치. `SmsGatewayServiceImpl#generateSignatureV2` 의 구현이 NCP 공식 가이드 (<https://api.ncloud-docs.com/docs/common-ncpapi>) 와 동일한지 단위 테스트(`SmsGatewayServiceImplTest#testSignatureV2Generation`)로 검증.
- **원인 3**: 서버 시간 동기화 문제. NCP 는 timestamp 가 현재 시각 기준 ±5분 이내여야 함. `timedatectl status` 로 NTP 동기 확인.

### 6.2 발신번호 미인증 (HTTP 400/403)
- **원인**: `NCP_SMS_SENDER_NUMBER` 가 §1.4 에서 등록·승인된 번호가 아님.
- **조치**: NCP SENS 콘솔 → **Project → Sender Phone** 에서 사용 중인 번호 상태 확인. `대기` 상태이면 승인 완료까지 대기.

### 6.3 Service ID 형식 오류 (HTTP 404)
- **원인**: `ncp:sms:kr:1234567890:mindgarden-sms-prod` 전체가 아닌 일부만 등록.
- **조치**: NCP SENS 콘솔 → **Project → SMS → 서비스 상세** 에서 `Service ID` 전체 문자열 복사 → GitHub Secret 갱신.

### 6.4 데스크탑 사용자 여전히 SMS 미수신
- **확인 1**: §5 §3 의 워크플로 로그에서 `NCP_* 4종 모두 주입 완료` 메시지 확인.
- **확인 2**: 운영 BE 로그 `tail -f /var/log/mindgarden/app.log | grep -E "SMS|NCP_SENS"` 로 `[NCP_SENS] HTTP 202 success` 출력 여부 확인.
- **확인 3**: `[OPS-ALERT] SMS stub mode in production` ERROR 가 보이면 isStubMode 가 여전히 true → §5 §1·§2 로 dev.env 와 프로세스 env 재검증.
- **확인 4**: AuditLog DB 에서 `action=OTP_SENT` 행 조회 시 `delivery_channel=SMS` (성공) 인지 `delivery_channel=FAILED` 인지 확인.

### 6.5 운영 NCP 과금/사용량 모니터링
- NCP 콘솔 → **My Page → 이용 명세서** 에서 일별 SMS 발송 건수/금액 확인.
- 임계치 초과 시 NCP 콘솔의 **알람 설정** 에서 일일 금액 알림 등록 권장.

---

## 7. 롤백 절차

NCP SENS 호출이 운영에서 문제를 일으킬 경우 **즉시 stub 모드** 로 되돌릴 수 있다.

### 7.1 일시 중단 (Secret 4종 중 1개만 비우기)
1. GitHub → **Settings → Secrets → Actions** → `NCP_ACCESS_KEY` (또는 임의 1개) → **Update** → 값을 빈 문자열 또는 더미값으로 변경.
2. 가장 최근 성공한 운영 배포 워크플로 → **Re-run all jobs** 클릭.
3. `NCP SENS env skip` notice 가 출력되고, BE 는 stub 모드로 회귀.

### 7.2 즉시 운영 서버 수동 회귀 (SSH)
```bash
# 1) prod.env 에서 NCP_* 라인 제거
sudo sed -i '/^NCP_/d' /etc/mindgarden/prod-from-dev.env

# 2) active 슬롯 재시작
ACTIVE=$(sudo cat /etc/mindgarden/active-backend | tr -d '[:space:]')
sudo systemctl restart "mindgarden-core-${ACTIVE}.service"

# 3) 30초 대기 후 stub 모드 진입 확인
sleep 30
sudo tail -n 200 /var/log/mindgarden/app.log | grep -E "SMS stub mode|isStubMode"
```

---

## 8. 후속 PR · 작업

- **expo-app OTP 핸들러** (`data.purpose === "OTP"` 분기 + `/api/v1/auth/otp/current` 호출 + 화면 표시): expo-app JS only 변경 → **OTA 배포 가능**, 별도 PR 권장.
- **Aligo / AWS SNS 어댑터** (`SmsGatewayServiceImpl#invokeAligoGateway`, `invokeAwsSnsGateway`): 본 PR 에서는 미구현(예외 throw). 추후 별도 PR 에서 구현 후 `sms.gateway.provider=ALIGO` 등으로 라우팅.
- **AuditLog 대시보드 OTP_SENT 필터**: 어드민 대시보드에서 `action=OTP_SENT` 필터 + `delivery_channel` 기준 집계 차트 추가.

---

## 9. 참고 링크

- NCP SENS SMS V2 API 공식 문서: <https://api.ncloud-docs.com/docs/ai-application-service-sens-smsv2>
- NCP SignatureV2 공식 가이드: <https://api.ncloud-docs.com/docs/common-ncpapi>
- PR #224 (SmsGatewayService SSOT 추출): `dae955f55`
- PR #224 후속 (본 PR — NCP SENS 정식 호출): `feat/sms-gateway-ncp-sens-formal`
- 관련 코드:
  - `src/main/java/com/coresolution/consultation/service/impl/SmsGatewayServiceImpl.java`
  - `src/main/java/com/coresolution/consultation/service/impl/OtpDeliveryServiceImpl.java`
  - `src/main/java/com/coresolution/consultation/controller/AuthController.java` (`/api/v1/auth/otp/current`)
  - `src/main/resources/application.yml` (`sms.gateway.ncp.*`)
