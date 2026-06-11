# 2026-06-11 배포 후속 운영 가이드 (통합)

> 작성일: 2026-06-11 (KST)
> 작성: core-coder (디버거 [운영 에러로그 진단](d678a0a4-fffb-4f4f-9925-0266d0e5fdfb) §3·§4 + 2026-06-11 누적 배포 PR 시리즈 후속)
> 분류: 운영(go-live) 후속 모니터링·운영 데이터 보정·인프라 등록·메트릭 알람
> 상태: PR #213·#214·#215·#216·#217·#218·#219 main 반영 완료 후 단일 통합 운영 가이드

---

## 0. 개요

이번 세션(2026-06-11) 의 운영 P0+P1+P2+P3 누적 배포가 모두 `main` 에 반영된 직후 운영팀·사용자·DevOps 가 **각자 분담으로 처리해야 하는 후속 작업**을 한곳에 통합한다.

본 가이드는 **자정 직후 모니터링(§1)**, **P1 운영 데이터 보정 3건(§2)**, **GitHub Secrets 4종 등록(§3)**, **Prometheus 알람 설정(§4)**, **누적 PR 시리즈 요약(§5)** 의 5개 절로 구성된다.

### 0.1 절대 원칙

- 본 문서의 모든 SQL 은 **SELECT 만** 포함한다. 보정용 INSERT/UPDATE/DELETE 와 운영 BE 재시작은 가이드(설명)만 제공하며 자동 실행 명령은 포함하지 않는다.
- 운영 DB DROP/RENAME 절차는 본 문서 범위 밖이며, 별도 가이드(`MIND_GARDEN_LEGACY_CLEANUP_GUIDE.md`) 를 참조한다.
- 코드 변경 없음. 본 작업은 docs 작성만 포함한다.

### 0.2 책임자 매핑

| 절 | 주제 | 책임자 |
|---|---|---|
| §1 | 자정 직후 통계 프로시저 모니터링 | 운영팀 |
| §2 | P1 운영 데이터 보정 (부가세·alert·5월 급여) | 운영팀 |
| §3 | GitHub Secrets 4종 등록 | 사용자(Repo Admin) |
| §4 | Prometheus 알람 설정 | 운영팀 / DevOps |
| §5 | 누적 배포 PR 시리즈 요약 | 참고용 |

### 0.3 관련 문서

- `docs/운영반영/MIND_GARDEN_LEGACY_CLEANUP_GUIDE.md` — mind_garden 스키마 잔존 객체 DROP/RENAME 절차 (운영 DBA 수동)
- `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` — 운영 반영 전 종합 체크리스트
- `docs/standards/DEPLOYMENT_STANDARD.md` — 배포 프로세스 표준
- `docs/troubleshooting/DEV_DEPLOYMENT_STABILITY_CHECKLIST.md` — 배포 안정성 점검

---

## §1. 자정 직후 모니터링 — PR #217 적용 후 (운영팀)

### 1.1 목적

PR #217 (PlSql catalog 명시 + readOnly 충돌 해소 + mind_garden 재적재 차단) 적용 이후 첫 자정 배치에서 다음 두 표준 프로시저가 정상 종료되는지 확인한다.

- `UpdateAllBranchDailyStatistics` — 00:00 KST 자정 배치
- `DailyPerformanceMonitoring` — 00:05 KST 직후

이전 장애에서는 `Unable to determine the correct call signature` 예외로 100% 실패했으나, catalog 명시 fix 적용 후 정상 종료되어야 한다.

### 1.2 모니터링 시각

| 시각 (KST) | 작업 |
|---|---|
| 2026-06-12 00:01 ~ 00:10 | 1차 로그 확인 (자정 배치 직후) |
| 2026-06-12 02:00 ~ 02:10 | 2차 확인 (재무·통계 후속 배치 후) |
| 2026-06-13 00:01 ~ 00:10 | 3차 확인 (재발 여부) |

### 1.3 모니터링 명령

운영 서버 SSH 후 다음 명령으로 자정 직후 로그를 추출한다.

```bash
# 운영 BE 호스트로 SSH (호스트명은 운영팀 환경에 맞게 치환)
ssh PRODUCTION '
  sudo journalctl -u mindgarden-core-blue.service --since "@00:00" | \
    grep -iE "UpdateAllBranch|DailyPerformance|Unable to determine the correct call signature"
'
```

> `mindgarden-core-blue.service` 가 blue/green 중 비활성이면 `mindgarden-core-green.service` 또는 현재 활성 systemd unit 명으로 치환한다.

### 1.4 기대 결과

다음 3가지가 모두 충족되어야 한다.

| 항목 | 기대 |
|---|---|
| `UpdateAllBranchDailyStatistics` 호출 | 정상 종료 INFO 로그 1건+ |
| `DailyPerformanceMonitoring` 호출 | 정상 종료 INFO 로그 1건+ |
| `Unable to determine the correct call signature` 라인 | **0건** |

### 1.5 재발 시 대응

위 기대 결과 중 하나라도 어긋나면 `mind_garden` 스키마 잔존 객체가 여전히 metadata 충돌을 일으키는 신호다. 다음 절차로 진행한다.

1. `docs/운영반영/MIND_GARDEN_LEGACY_CLEANUP_GUIDE.md` §2.1 의 **잔존 객체 목록 확인 SQL** 을 운영 DB 에서 SELECT 로 실행한다.
2. `mind_garden` 스키마에 동명 프로시저가 남아있으면 같은 가이드 §3 백업 후 §4 DBA 수동 DROP/RENAME 절차를 진행한다.
3. 코드 측 catalog 명시(PR #217) 가 실제 빌드에 반영되었는지 운영 BE 의 `mindgarden-core.jar` 빌드 시각 또는 `actuator/info` 로 재확인한다.

---

## §2. P1 운영 데이터 보정 3건 (운영팀)

### 2.0 공통 원칙

- 본 절의 SQL 은 **모두 SELECT 만** 포함한다. 보정용 INSERT/UPDATE 는 운영팀이 ERP 화면 또는 별도 검토 후 직접 실행한다.
- 보정 후에는 다음 자동 배치(02:00 또는 다음 자정)에서 자동 통과되는지 확인한다.
- 운영 DB 직접 UPDATE 가 필요하면 사전 백업(`mysqldump` 또는 점단 스냅샷) 후 진행한다.

---

### §2.1 P1-B 부가세 1,409원 차이 보정 — `tenant-incheon-counseling-001`

#### 2.1.1 배경

`financial_period` 의 `total_tax` (실제 합산) 와 `expected_tax` (이론값) 간 차이(`tax_diff_amount`) 가 0 이 아닌 행이 잔존하며, 인천 상담센터 테넌트 기준 누적 약 1,409원의 결제·환불·할인 계산 누락 가능성이 있다.

#### 2.1.2 운영 DB 조회 SQL (SELECT only)

```sql
USE core_solution;

-- 차이 발생 일자·테넌트 식별
SELECT
  fp.id,
  fp.tenant_id,
  fp.period_year,
  fp.period_month,
  fp.period_day,
  fp.total_revenue,
  fp.total_tax,
  fp.expected_tax,
  fp.tax_diff_amount
FROM financial_period fp
WHERE fp.tenant_id = 'tenant-incheon-counseling-001'
  AND fp.tax_diff_amount IS NOT NULL
  AND fp.tax_diff_amount != 0
ORDER BY fp.period_year DESC, fp.period_month DESC, fp.period_day DESC
LIMIT 10;
```

#### 2.1.3 차이 원인 후보

- 결제·환불·할인 거래 중 **부가세 계산 누락** (특히 일부 환불 거래에서 음수 부가세 미계상)
- ERP 연동 거래의 `vat_amount` 미설정
- 할인 적용 시점 부가세 재계산 누락

#### 2.1.4 보정 절차 (운영팀 선택)

| 절차 | 안전성 | 비고 |
|---|---|---|
| (a) ERP 화면에서 누락 거래를 식별·재등록 또는 부가세 수동 보정 | 안전 (감사 흔적 자동 기록) | 권장 |
| (b) 운영 DB 직접 UPDATE 로 부가세 보정 | 신중 (사전 백업 필수, 감사 로그 직접 입력) | ERP 화면 미지원 케이스만 |

#### 2.1.5 보정 후 확인

다음 02:00 KST 재무 통계 배치(`UpdateAllBranchDailyStatistics` 후속) 에서 `tax_diff_amount` 가 0 으로 정정되거나 0 에 가깝게 감소하는지 §2.1.2 SQL 로 재확인.

---

### §2.2 P1-C `session_recovery_alerts` 2건 미해결

#### 2.2.1 배경

세션 회복 알람(`session_recovery_alerts`) 중 `resolved_at IS NULL` 인 행이 2건 남아있다. 매핑 또는 스케줄 ID 와의 정합성을 확인 후 해소한다.

#### 2.2.2 운영 DB 조회 SQL

```sql
USE core_solution;

SELECT
  id,
  schedule_id,
  mapping_id,
  alert_type,
  resolved_at,
  created_at
FROM session_recovery_alerts
WHERE resolved_at IS NULL
ORDER BY created_at DESC
LIMIT 20;
```

#### 2.2.3 처리 옵션

| 옵션 | 안전성 | 비고 |
|---|---|---|
| **(a) 매핑 수동 복구** | 가장 안전. 근본 원인 해결. | `schedule_id` 와 `mapping_id` 의 무결성 확인 후 매핑 데이터 복원 |
| **(b) `resolved_at` 직접 설정** | 회피만. alert 만 사라지고 근본 처리 X. | 비상 시 (사용자 가시성 차단 목적) 만 사용 |

#### 2.2.4 옵션 (a) 매핑 복구 시 점검 SQL

```sql
USE core_solution;

-- alert 대상 schedule 의 상태 확인
SELECT
  s.id          AS schedule_id,
  s.tenant_id,
  s.status,
  s.start_at,
  s.end_at,
  cm.id         AS mapping_id,
  cm.client_id,
  cm.consultant_id
FROM schedule s
LEFT JOIN consultant_client_mapping cm ON cm.id = s.mapping_id
WHERE s.id IN (
  SELECT schedule_id FROM session_recovery_alerts WHERE resolved_at IS NULL
);
```

매핑 복구는 ERP 화면(상담사·내담자 매핑 관리) 또는 별도 운영 점검 절차로 진행한다.

---

### §2.3 P1-D 5월 급여 배치 수동 실행 — `tenant-incheon-counseling-001`

#### 2.3.1 배경

`salary_batch` 의 2026-05 분이 미실행 상태로 남아있을 가능성이 있다. 자동 배치 누락(스케줄 누락 또는 데이터 락) 여부를 먼저 확인하고, 미실행이면 BE 운영 endpoint 또는 ERP 화면에서 수동 트리거한다.

#### 2.3.2 운영 DB 조회 SQL

```sql
USE core_solution;

-- 5월(2026-5) 급여 배치 상태 확인
SELECT
  id,
  tenant_id,
  batch_year,
  batch_month,
  status,
  started_at,
  finished_at,
  created_at
FROM salary_batch
WHERE tenant_id = 'tenant-incheon-counseling-001'
  AND batch_year = 2026
  AND batch_month = 5;
```

#### 2.3.3 처리 결정 트리

| 상태 | 처리 |
|---|---|
| 결과가 없음 | 5월 배치 미실행 — 운영 BE 의 `SalaryBatch` 트리거 endpoint 또는 ERP 화면에서 수동 실행 |
| `status = 'FAILED'` | 실패 원인 로그 확인 후 재실행 |
| `status = 'IN_PROGRESS'` 가 1시간 이상 지속 | 락 의심 — 운영팀 점검 |
| `status = 'DONE'` | 정상 완료 (별도 작업 불필요) |

#### 2.3.4 수동 트리거 옵션

- **(권장) ERP 운영 화면**: 인사·급여 메뉴 → 월별 급여 배치 → 2026-05 → 수동 실행
- **(대안) BE endpoint**: 운영 BE `SalaryBatchController` 의 수동 트리거 endpoint (사전 인증 + tenant 헤더 필요) — 정확한 경로·파라미터는 백엔드 표준 문서 또는 `core-coder` 위임으로 확인

#### 2.3.5 실행 후 확인

```sql
-- 재실행 후 결과 재확인
SELECT id, tenant_id, batch_year, batch_month, status, finished_at
FROM salary_batch
WHERE tenant_id = 'tenant-incheon-counseling-001'
  AND batch_year = 2026
  AND batch_month = 5
ORDER BY created_at DESC
LIMIT 5;
```

`status = 'DONE'` 이고 `finished_at` 이 채워졌으면 정상 완료.

---

## §3. GitHub Secrets 4종 등록 가이드 — PR #216 활성화 (사용자)

### 3.1 목적

PR #216 으로 OAuth 4종(Kakao·Naver·Google·Apple) callback URL 의 **사전 등록(REGISTERED_URLS) 검증**이 표준화되었다. 검증을 실제 활성화하려면 GitHub Repository Secrets 4종을 등록해야 한다. 미등록 시 graceful skip (기존 동작 유지) 되므로 등록 전에도 회귀는 발생하지 않는다.

### 3.2 등록 위치

> GitHub Repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### 3.3 등록할 4종 Secret (디버거 보고서 기준 추정값)

| Secret 이름 | 값 형식 (콤마 구분, 공백 없음) |
|---|---|
| `KAKAO_REGISTERED_URLS` | `https://core-solution.co.kr/api/auth/kakao/callback,https://dev.core-solution.co.kr/api/auth/kakao/callback` |
| `NAVER_REGISTERED_URLS` | `https://core-solution.co.kr/api/auth/naver/callback,https://dev.core-solution.co.kr/api/auth/naver/callback` |
| `GOOGLE_REGISTERED_URLS` | `https://core-solution.co.kr/api/v1/auth/google/callback,https://dev.core-solution.co.kr/api/v1/auth/google/callback` |
| `APPLE_REGISTERED_URLS` | `https://core-solution.co.kr/api/v1/auth/apple/callback,https://dev.core-solution.co.kr/api/v1/auth/apple/callback` |

> **중요**: 위 값은 디버거 보고서 추정 기준이다. **반드시 실제 4개 Console 에 등록된 callback/redirect URL 값과 1:1 일치해야** 한다. 한 글자라도 다르면 검증 단계에서 차단된다.

### 3.4 Console 별 실제 등록값 확인 (사용자 수행)

각 Console 에서 등록된 callback/redirect URL 을 **전부** 추출하여 §3.3 의 값과 1:1 비교한 뒤 Secret 에 입력한다. 운영·개발 두 도메인 모두 포함한다.

| Console | URL | 확인 항목 |
|---|---|---|
| **Kakao Developers** | `https://developers.kakao.com` → 내 애플리케이션 → 해당 앱 → **카카오 로그인** → **Redirect URI** | 등록된 Redirect URI **전부** |
| **Naver Developers** | `https://developers.naver.com` → Application → 해당 애플리케이션 → **API 설정** → **Callback URL** | 등록된 Callback URL **전부** |
| **Google Cloud Console** | `https://console.cloud.google.com` → APIs & Services → **Credentials** → OAuth 2.0 Client ID (Web application) → **Authorized redirect URIs** | 등록된 redirect URI **전부** |
| **Apple Developer** | `https://developer.apple.com/account` → Certificates, IDs & Profiles → **Identifiers** → Service ID → Sign in with Apple → **Configure** → **Return URLs** | 등록된 Return URL **전부** |

### 3.5 등록 후 검증 활성화 시점

| 시점 | 동작 |
|---|---|
| Secrets 미등록 (현재) | graceful skip — 기존 동작 유지, 회귀 없음 |
| Secrets 등록 후 다음 BE 배포 부터 | callback URL 검증 활성화 — 등록되지 않은 URL 요청은 차단 |

배포 후 5분 내 첫 OAuth 로그인 흐름(운영·개발 각 1회) 으로 회귀 없는지 검증한다.

### 3.6 등록 형식 주의사항

- 값은 **콤마(`,`) 로 구분**, 공백·줄바꿈 없음.
- `https://` 포함, 경로 끝에 `/` 없음 (Console 등록값과 동일하게).
- 한 값에 동일 URL 을 중복 등록하지 않는다.
- 추가 도메인(예: `staging.`, `qa.`) 사용 시 콤마로 이어 붙인다.

---

## §4. Prometheus 알람 설정 — PR #218 메트릭 활성화 (운영팀 / DevOps)

### 4.1 목적

PR #218 로 OAuth tenant 결락 분기가 `ERROR` → `WARN` 으로 강등되고, Micrometer Counter `oauth2_callback_tenant_unresolved_total` 가 메트릭으로 노출되었다. 본 메트릭을 Prometheus 알람으로 임계 모니터링한다.

### 4.2 메트릭 스펙

| 항목 | 값 |
|---|---|
| 메트릭 이름 | `oauth2_callback_tenant_unresolved_total` |
| 타입 | Counter (단조 증가) |
| 라벨 | `reason` (예: `state_decode_failed`, `state_missing`, `tenant_lookup_failed` 등) |
| 단위 | 호출 건수 |

### 4.3 알람 규칙 (권장 임계)

저장 경로 예시: `prometheus/alerts/oauth2.yml` (운영 Prometheus 구성에 맞춰 조정)

```yaml
groups:
  - name: oauth2_tenant_unresolved
    interval: 1m
    rules:
      - alert: OAuth2CallbackTenantUnresolvedHigh
        expr: sum(rate(oauth2_callback_tenant_unresolved_total[5m])) > 0.05
        for: 10m
        labels:
          severity: P3
        annotations:
          summary: "OAuth tenant 결락 baseline 초과 (시간당 10건+)"
          description: |
            최근 5분 평균 rate 가 0.05 req/s (시간당 약 180건) 를 초과하여
            10분 이상 지속되었습니다. baseline 봇·크롤러 노이즈 또는
            클라이언트 회귀 가능성. application.log 의 WARN 라인 분석 필요.

      - alert: OAuth2CallbackTenantUnresolvedDecodeFailed
        expr: sum(rate(oauth2_callback_tenant_unresolved_total{reason="state_decode_failed"}[5m])) > 0.02
        for: 5m
        labels:
          severity: P2
        annotations:
          summary: "OAuth state_decode_failed 발생 — 회귀 가능성"
          description: |
            state 파라미터 디코딩 실패 rate 가 0.02 req/s 를 초과합니다.
            OAuth state 서명 키 회귀·테넌트 식별 회귀 가능성이 높습니다.
          runbook: "ssh 운영 BE 호스트 → journalctl 로 application.log 분석 + core-debugger 위임"
```

### 4.4 임계 근거

| 임계 | 근거 |
|---|---|
| 5분 평균 0.05 req/s (P3) | 봇·크롤러 baseline (시간당 약 180건) 초과 — 클라이언트 회귀 가능성 |
| 5분 평균 0.02 req/s (P2 - `state_decode_failed`) | 서명 키·디코더 회귀 또는 공격 시도 — 즉시 분석 필요 |

운영 환경 트래픽 특성에 따라 ±50% 범위 내에서 조정한다.

### 4.5 확인 endpoint

알람 등록 전후로 다음 endpoint 로 메트릭 노출이 정상인지 확인한다.

```bash
# 운영 BE actuator (사전 인증 필요)
curl -sS https://app.core-solution.co.kr/actuator/metrics/oauth2_callback_tenant_unresolved_total | jq

# /actuator/prometheus 텍스트 포맷 (Prometheus scrape 와 동일)
curl -sS https://app.core-solution.co.kr/actuator/prometheus | grep oauth2_callback_tenant_unresolved
```

> 운영 actuator endpoint 노출 정책은 `PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` 의 Actuator 절을 따른다.

### 4.6 Grafana 대시보드 (선택)

알람 외에 시각 모니터링을 추가하려면 Grafana 패널을 추가한다.

```promql
# 5분 rate (req/s)
sum(rate(oauth2_callback_tenant_unresolved_total[5m]))

# reason 라벨별 분포
sum(rate(oauth2_callback_tenant_unresolved_total[5m])) by (reason)
```

### 4.7 알람 발화 시 1차 대응

1. Grafana 또는 `/actuator/prometheus` 로 `reason` 라벨 분포 확인.
2. `reason=state_decode_failed` 가 다수면 OAuth state 서명 키 회귀 또는 외부 공격 시도 의심 — core-debugger 위임.
3. `reason=tenant_lookup_failed` 가 다수면 사용자 매핑·테넌트 데이터 회귀 — 운영 DB 사용자·테넌트 매핑 점검.
4. 일시적 spike (5분 내 자연 감소) 면 봇·캐시 미스 가능성 — 30분 추적 후 자동 마감.

---

## §5. 누적 배포 PR 시리즈 요약 (참고)

이번 세션(2026-06-11) 에 운영 `main` 으로 누적 반영된 PR 시리즈는 다음 7건이다. 본 가이드의 모든 후속 작업은 아래 PR 들의 운영 활성화·검증을 전제로 한다.

| PR | 영역 | main SHA | 후속 작업 |
|---|---|---|---|
| **#213** | nginx apex OAuth callback proxy 예외 | `f57eeada1` | (없음 — nginx 배포 완료 시 즉시 활성) |
| **#214** | Apple SIWA BE GET fallback 매핑 | `abc76a7b6` | (없음 — 코드 반영 즉시 활성) |
| **#215** | SecurityConfig CORS callback path 우회 | (PR #216 직전) | (없음 — 코드 반영 즉시 활성) |
| **#216** | OAuth 4종 REGISTERED_URLS 표준화 + nginx legacy proxy | `be7d96b45` | **§3** Secrets 4종 등록 |
| **#217** | PlSql catalog 명시 + readOnly 충돌 해소 + mind_garden 차단 | `83b8e9e39` | **§1** 자정 직후 모니터링 / `MIND_GARDEN_LEGACY_CLEANUP_GUIDE.md` |
| **#218** | OAuth tenant_id 결락 진단 보강 (ERROR→WARN + Counter) | `f45ef932a` | **§4** Prometheus 알람 등록 |
| **#219** | dev BE 워크플로 5+ restart 1회 통합 | `a131b7e10` | (없음 — 워크플로 변경 즉시 활성) |

### 5.1 별도 후속 작업 (본 가이드 범위 외)

| 항목 | 가이드 |
|---|---|
| `mind_garden` 스키마 DROP/RENAME | `docs/운영반영/MIND_GARDEN_LEGACY_CLEANUP_GUIDE.md` |
| 운영 반영 전 전체 체크리스트 재확인 | `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` |

---

## §6. 작업 완료 체크리스트

| # | 항목 | 책임자 | 완료 표시 |
|---|---|---|---|
| 1 | §1 자정 직후 모니터링 1차 (2026-06-12 00:01) | 운영팀 | ☐ |
| 2 | §1 자정 직후 모니터링 2차·3차 | 운영팀 | ☐ |
| 3 | §2.1 부가세 1,409원 차이 보정 | 운영팀 | ☐ |
| 4 | §2.2 session_recovery_alerts 2건 처리 | 운영팀 | ☐ |
| 5 | §2.3 5월 급여 배치 수동 실행 | 운영팀 | ☐ |
| 6 | §3 GitHub Secrets 4종 등록 (Console 값 1:1 확인) | 사용자 | ☐ |
| 7 | §3 등록 후 OAuth 4종 회귀 검증 | 사용자 / 운영팀 | ☐ |
| 8 | §4 Prometheus 알람 규칙 등록 | DevOps | ☐ |
| 9 | §4 Grafana 대시보드 추가 (선택) | DevOps | ☐ |

---

## §7. 변경 이력

| 일시 | 작성·갱신 | 내용 |
|---|---|---|
| 2026-06-11 | core-coder | 초안 작성 (§1~§5 + 체크리스트) |
