# 로컬 환경에서 서브도메인 기반 SNS 가입 테스트 가이드

## 개요

로컬 환경(`localhost`)에서 서브도메인 기반 SNS 간편 가입 기능을 테스트하는 방법을 안내합니다.

**작성일**: 2025-12-15  
**버전**: 1.0.0

## 문제 상황

서브도메인 기반 tenant_id 자동 감지 기능이 추가되면서, 로컬 환경(`localhost:3000`)에서는 서브도메인이 없어 테스트가 어려워졌습니다.

## 해결 방법

로컬 환경에서도 테스트할 수 있도록 3가지 방법을 제공합니다:

### 방법 1: URL 파라미터로 tenantId 전달 (가장 간단)

**사용법**:
```
http://localhost:3000/login?tenantId=tenant-incheon-counseling-001
```

**장점**:
- 별도 설정 불필요
- 즉시 테스트 가능
- 여러 테넌트를 빠르게 테스트 가능

**동작 방식**:
- URL 파라미터의 `tenantId`를 최우선으로 사용
- `sessionStorage`에 저장되어 SNS 로그인 시 자동 사용

### 방법 2: 환경 변수로 테스트용 tenantId 지정

**설정 방법**:

1. `.env` 파일 생성 또는 수정:
```bash
# frontend/.env
REACT_APP_TEST_TENANT_ID=tenant-incheon-counseling-001
```

2. 개발 서버 재시작:
```bash
npm start
```

**장점**:
- 한 번 설정하면 계속 사용 가능
- URL에 파라미터를 추가할 필요 없음

**주의사항**:
- `localhost` 또는 `127.0.0.1`에서만 동작
- 프로덕션 환경에서는 무시됨

### 방법 3: /etc/hosts 설정으로 로컬 서브도메인 사용 (가장 실제 환경과 유사)

**설정 방법**:

1. `/etc/hosts` 파일 수정 (macOS/Linux):
```bash
sudo nano /etc/hosts
```

2. 다음 줄 추가:
```
127.0.0.1 mindgarden.localhost
127.0.0.1 test.localhost
```

3. 브라우저에서 접근:
```
http://mindgarden.localhost:3000/login
```

**장점**:
- 실제 서브도메인 환경과 가장 유사
- 서브도메인 감지 로직을 그대로 테스트 가능

**주의사항**:
- `/etc/hosts` 파일 수정 권한 필요
- Windows는 `C:\Windows\System32\drivers\etc\hosts` 파일 수정

## 우선순위

tenant_id 감지 우선순위:

1. **URL 파라미터** (`?tenantId=xxx`) - 최우선
2. **환경 변수** (`REACT_APP_TEST_TENANT_ID`) - 로컬 환경에서만
3. **서브도메인 감지** - 실제 서브도메인 또는 로컬 서브도메인

## 테스트 시나리오

### 시나리오 1: URL 파라미터 사용

1. 브라우저에서 접근:
   ```
   http://localhost:3000/login?tenantId=tenant-incheon-counseling-001
   ```

2. 콘솔 확인:
   ```
   🔧 URL 파라미터에서 tenantId 감지 (로컬 테스트용): tenantId=tenant-incheon-counseling-001
   ```

3. SNS 로그인 클릭 후 회원가입 모달에서 tenantId 확인

### 시나리오 2: 환경 변수 사용

1. `.env` 파일 설정:
   ```bash
   REACT_APP_TEST_TENANT_ID=tenant-incheon-counseling-001
   ```

2. 개발 서버 재시작:
   ```bash
   npm start
   ```

3. 브라우저에서 접근:
   ```
   http://localhost:3000/login
   ```

4. 콘솔 확인:
   ```
   🔧 환경 변수에서 tenantId 감지 (로컬 개발용): tenantId=tenant-incheon-counseling-001
   ```

### 시나리오 3: 로컬 서브도메인 사용

1. `/etc/hosts` 파일 수정:
   ```
   127.0.0.1 mindgarden.localhost
   ```

2. 브라우저에서 접근:
   ```
   http://mindgarden.localhost:3000/login
   ```

3. 콘솔 확인:
   ```
   🔍 서브도메인 감지: subdomain=mindgarden
   ✅ 서브도메인으로 tenant_id 조회 성공: tenantId=tenant-incheon-counseling-001
   ```

## 백엔드 로컬 환경 지원

백엔드의 `extractTenantIdFromSubdomain()` 메서드도 로컬 환경을 지원합니다:

**지원하는 패턴**:
- `*.dev.core-solution.co.kr`
- `*.core-solution.co.kr`
- `*.dev.m-garden.co.kr`
- `*.m-garden.co.kr`
- `*.localhost` (로컬 환경)
- `*.127.0.0.1` (로컬 환경)

## 주의사항

1. **환경 변수는 로컬에서만 동작**: `localhost` 또는 `127.0.0.1`에서만 적용됩니다.

2. **서브도메인 조회 실패**: 로컬 서브도메인을 사용하더라도 백엔드 데이터베이스에 해당 서브도메인으로 등록된 테넌트가 있어야 합니다.

3. **개발 서버 재시작**: 환경 변수를 변경한 경우 개발 서버를 재시작해야 합니다.

4. **브라우저 캐시**: 때때로 브라우저 캐시를 지워야 할 수 있습니다.

## 빠른 테스트 명령어

### URL 파라미터로 즉시 테스트
```bash
# Chrome/Edge
open "http://localhost:3000/login?tenantId=tenant-incheon-counseling-001"

# Firefox
firefox "http://localhost:3000/login?tenantId=tenant-incheon-counseling-001"
```

### 환경 변수 설정 후 테스트
```bash
# .env 파일 생성
echo "REACT_APP_TEST_TENANT_ID=tenant-incheon-counseling-001" > frontend/.env

# 개발 서버 시작
cd frontend && npm start
```

### 로컬 서브도메인 설정
```bash
# macOS/Linux
sudo sh -c 'echo "127.0.0.1 mindgarden.localhost" >> /etc/hosts'

# Windows (PowerShell 관리자 권한)
Add-Content C:\Windows\System32\drivers\etc\hosts "127.0.0.1 mindgarden.localhost"
```

## 디버깅

### 콘솔 로그 확인

브라우저 개발자 도구 콘솔에서 다음 로그를 확인할 수 있습니다:

- `🔧 URL 파라미터에서 tenantId 감지`: URL 파라미터 사용
- `🔧 환경 변수에서 tenantId 감지`: 환경 변수 사용
- `🔍 서브도메인 감지`: 서브도메인 감지 시도
- `✅ 서브도메인으로 tenant_id 조회 성공`: 성공
- `⚠️ 서브도메인으로 테넌트를 찾을 수 없음`: 실패
- `💡 로컬 환경: 서브도메인 없음`: 안내 메시지

### sessionStorage 확인

브라우저 개발자 도구 → Application → Session Storage에서:
- `subdomain_tenant_id`: 감지된 tenant_id
- `subdomain`: 감지된 서브도메인

## 관련 문서

- [서브도메인 기반 SNS 간편 가입 기능](./SUBDOMAIN_SNS_SIGNUP_FEATURE.md)
- [와일드카드 도메인 설정 가이드](../2025-12-12/WILDCARD_DNS_SETUP_REQUIRED.md)

