# 개발 서버 온보딩 사이클 검증 가이드

## 1. 전체 사이클 자동 검증 (권장)

SSH 접속 후 다음 명령어 실행:

```bash
ssh root@beta0629.cafe24.com
cd /root/scripts/test
chmod +x verify-onboarding-dev-server.sh
./verify-onboarding-dev-server.sh
```

이 스크립트는:
1. 온보딩 요청 생성
2. 온보딩 승인
3. 테넌트 생성 확인
4. 역할 생성 확인
5. 대시보드 생성 확인
6. 관리자 계정 생성 확인
7. 역할 할당 확인

모든 단계를 자동으로 검증합니다.

## 2. 기존 테넌트 상태 확인

이미 생성된 테넌트의 상태를 확인하려면:

```bash
ssh root@beta0629.cafe24.com
cd /root/scripts/test
chmod +x check-onboarding-status.sh

# 최근 생성된 테넌트 확인
./check-onboarding-status.sh --latest

# 특정 테넌트 확인
./check-onboarding-status.sh <TENANT_ID> [EMAIL]
```

## 3. SQL 직접 확인

DB에서 직접 확인하려면:

```bash
ssh root@beta0629.cafe24.com
mysql -h beta0629.cafe24.com -u mindgarden_dev -p core_solution < /root/scripts/test/mvp-verification.sql
```

SQL 실행 전에 `@TENANT_ID`와 `@EMAIL` 변수를 수정해야 합니다.

## 4. 문제 해결

### 역할 생성 실패 시
- `ProcessOnboardingApproval` 프로시저에서 `ApplyDefaultRoleTemplates` 호출 확인
- `role_template_mappings` 테이블에 업종 매핑 확인

### 대시보드 생성 실패 시
- `OnboardingServiceImpl.decideInternal()` 메서드에서 `createDefaultDashboards()` 호출 확인
- 로그 확인: `tail -f /var/log/mindgarden/application.log`

### 관리자 계정 생성 실패 시
- `OnboardingServiceImpl.createTenantAdminAccount()` 메서드 확인
- 비밀번호 해시 생성 로직 확인

### 역할 할당 실패 시
- `assignAdminRoleToUser()` 메서드 확인
- '관리자' 역할 이름으로 `TenantRole` 검색 로직 확인

