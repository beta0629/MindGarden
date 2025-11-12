# MindGarden Identity & SSO Architecture

## 1. 목표 및 범위

- **목표:** 여러 업종(학원, 미용, 배달 등)을 지원하는 MindGarden 플랫폼에서 단일 로그인 경험을 제공하고, 데이터 및 보안 정책을 중앙화한다.
- **범위:** 인증 방식, 계정 모델, 토큰/세션 설계, RBAC/정책, 소셜 로그인 연동, 감사/모니터링, 향후 확장 로드맵.

## 2. 상위 구성도

```
┌──────────────┐        ┌─────────────────┐
│  Web Client  │        │  Mobile Client  │
└──────┬───────┘        └───────┬────────┘
       │ OAuth2 / ID/PW                │
       ▼                               ▼
             ┌────────────────────────────┐
             │      Auth Server (SSO)     │
             │  - Spring Security + OAuth2│
             │  - Kakao/Naver OAuth Client│
             │  - Bcrypt + MFA            │
             └────────┬──────────┬────────┘
                      │          │
                      │ JWT/Session
                      │
        ┌─────────────▼────────────┐
        │    API Gateway / BE      │
        │  (JWT 검증 + TenantCtx) │
        └─────────────┬────────────┘
                      │
     ┌────────────────▼────────────────┐
     │     Central DB (Identity Hub)   │
     │  auth_user / auth_user_social   │
     │  role_permissions / policy_rules│
     │  refresh_token_store / audit_log│
     └────────────────┬────────────────┘
                      │
      ┌───────────────▼───────────────┐
      │ Security Alerts / SIEM / APM  │
      └───────────────────────────────┘
```

## 3. 계정 및 데이터 모델

### 3.1 핵심 테이블

| 테이블 | 주요 컬럼 | 설명 |
| --- | --- | --- |
| `auth_user` | `auth_user_id`, `login_id`, `password_hash`, `status`, `mfa_secret`, `last_login_at` | 모든 사용자 계정(직원/소비자 공통) |
| `auth_user_social` | `auth_user_id`, `provider`, `provider_user_id`, `email`, `profile` | Kakao/Naver 등 소셜 계정 매핑 |
| `staff_account` | `staff_id`, `auth_user_id`, `tenant_id`, `branch_id`, `role`, `permissions_cache` | HQ/지점 관리자/스태프 |
| `consumer_account` | `consumer_id`, `auth_user_id`, `tenant_id`, `consent_flags`, `marketing_consent` | 학부모/일반 회원 |
| `role_permissions` | `role`, `permission_code`, `is_active` | 기본 RBAC 매트릭스 |
| `policy_rules` | `rule_id`, `expression`, `effect` | 업종/지점/시간 기반 정책 (ABAC 확장) |
| `refresh_token_store` | `token_id`, `auth_user_id`, `device_id`, `expires_at`, `ip`, `revoked` | Refresh Token 및 기기 정보 |
| `audit_log` | `audit_id`, `auth_user_id`, `action`, `resource`, `metadata`, `created_at` | 로그인/세션 감사 로그 |
| `security_event` | `event_id`, `severity`, `category`, `details`, `created_at` | 보안 이벤트 및 알림 (연동용) |

> 모든 테이블은 `tenant_id`, `branch_id`, `created_at`, `created_by`, `updated_at`, `deleted_at` 메타 필드를 포함 (HQ/HQ-Admin은 `tenant_id=NULL`).

### 3.2 계정과 테넌트 관계

```
auth_user 1 ─── 1 staff_account (직원)
          └─── 1 consumer_account (소비자)

tenant 1 ─── N staff_account
tenant 1 ─── N consumer_account
branch 1 ─── N staff_account
```

## 4. 인증 플로우

### 4.1 자체 ID/PW 로그인

1. 클라이언트가 `POST /api/auth/login`으로 `login_id`, `password`, `tenantKey` 전달
2. Auth 서버가 `auth_user` 검증 → 비밀번호(bcrypt) 확인 → MFA(필요 시)
3. AccessToken(JWT, 만료 1h), RefreshToken(만료 14d), Session Cookie(옵션) 발급
4. RefreshToken은 `refresh_token_store`에 저장, `device_id/IP`와 함께 관리
5. 로그인/토큰 발급 이벤트를 `audit_log`/`security_event`에 기록

### 4.2 소셜 로그인 (Kakao/Naver)

1. 클라이언트가 `/oauth2/authorization/kakao` 또는 `/oauth2/authorization/naver`
2. Provider 인증 후 Auth 서버로 Callback → `auth_user_social`에 매핑된 계정 찾기
3. 기존 계정이 없으면 Sign-up 동의 화면 → `auth_user`, `consumer_account` 생성
4. 이후 AccessToken/RefreshToken 발급 플로우는 동일

### 4.3 SSO/Token 흐름

- AccessToken(JWT) payload

  ```json
  {
    "sub": "auth_user_id",
    "tenantId": "uuid",
    "branchId": "uuid",
    "role": "HQ_ADMIN",
    "permissions": ["reservation:view", "settlement:download"],
    "iat": 1731392400,
    "exp": 1731396000
  }
  ```

- Refresh Token 로테이션: 매번 Refresh 시 새 토큰 발급 + 기존 토큰 `revoked=true`
- 웹 클라이언트는 HttpOnly/SameSite Cookie 사용, 모바일/파트너 API는 Bearer Token 사용
- Token 검증/권한 체크는 API Gateway 또는 Backend Filter에서 수행 후 `TenantContext` 주입

## 5. RBAC 및 정책 엔진

- **RBAC 기본 정책**  
  - `HQ_ADMIN`: 모든 테넌트/지점 데이터 접근, 정책 등록  
  - `TENANT_OWNER`: 특정 테넌트의 모든 권한, 지점 관리  
  - `BRANCH_MANAGER`: 지점 관리, 결제 승인, 강좌/직원 관리  
  - `STAFF`: 상담, 수강 등록, 출결 기록, 일부 알림  
  - `CONSUMER`: 예약, 결제, 마이 페이지
- **정책 엔진(Policy Rules)**  
  - JSON/YAML 기반 표현식(예: `if tenant.businessType == 'ACADEMY' && request.hour < 22`)  
  - `ALLOW/DENY`로 평가, API 호출 전에 적용  
  - 20% 커스터마이징 요구사항은 정책으로 대응하여 코드 커스터마이징을 최소화

## 6. 보안·감사

- **Security Alerts**
  - 로그인 실패, 다중 로그인 감지, 비정상 IP, MFA 실패 → `SecurityAlertService` → Slack/이메일 알림
- **Audit Logging**
  - 로그인/로그아웃/토큰 재발급/Acl 변경 → `audit_log` 테이블 기록
  - SIEM(AWS Security Hub, ELK 등) 연동 및 장기 보관
- **세션/기기 관리**
  - `refresh_token_store`에서 기기별 토큰 관리 → 강제 로그아웃, 기기 등록/해지 지원
- **데이터 보호**
  - 비밀번호는 bcrypt, MFA Secret은 KMS/Secrets Manager에 암호화 저장
  - 개인정보(이메일/전화)는 `PersonalDataEncryptionUtil`로 암호화된 상태 유지

## 7. 운영/확장 로드맵

| 분기 | 내용 |
| --- | --- |
| Q1 | 통합 Auth 서비스 배포, 소셜 로그인(카카오/네이버) + ID/PW + MFA 적용 |
| Q2 | 파트너/HQ OIDC Provider 기능, OAuth Client 발급/승인 워크플로우 제공 |
| Q3 | 정책 엔진 고도화(시간/지점/업종별 규칙), Admin Portal 설정 UI |
| Q4 | 서드파티 연동(API 키 관리), SAML 연동(HQ Legacy 시스템), Device Fingerprint |

## 8. 중앙화 데이터와의 연계

- Auth 관련 모든 데이터(`auth_user`, `auth_user_social`, `refresh_token_store`, `audit_log`, `security_event`)는 **중앙 DB**에 저장하여 멀티 업종에도 일관된 인증 경험 제공.
- PL/SQL 배치에서 정산이나 통계 데이터를 처리할 때 Auth 정보와 FK로 연결하여 사용자/테넌트 기반 집계가 가능하도록 설계.
- `TenantContext`와 연동되어 데이터 접근 제어와 SSO 권한이 일관되게 적용된다.

