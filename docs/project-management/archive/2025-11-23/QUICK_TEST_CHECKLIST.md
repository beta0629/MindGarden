# 빠른 테스트 체크리스트 (MVP)

**작성일**: 2025-11-23  
**목적**: 배포 후 빠르게 MVP 기능 테스트  
**예상 시간**: 10-15분

---

## 🚀 배포 확인

### 1. GitHub Actions 배포 상태 확인
- [ ] `deploy-backend-dev.yml` 워크플로우 실행 확인
- [ ] 백엔드 빌드 성공 확인
- [ ] 서버 배포 완료 확인

### 2. 서버 상태 확인
```bash
# SSH 접속
ssh root@beta0629.cafe24.com

# 백엔드 서비스 상태 확인
systemctl status mindgarden-dev.service

# Nginx 상태 확인
systemctl status nginx
```

---

## 🧪 빠른 테스트 (5분)

### 테스트 1: 온보딩 요청 생성

**API**: `POST https://apply.dev.e-trinity.co.kr/api/v1/onboarding/requests`

**요청 본문**:
```json
{
  "tenantName": "테스트 테넌트",
  "requestedBy": "test@example.com",
  "businessType": "CONSULTATION",
  "checklistJson": "{\"adminPassword\": \"test1234\", \"contactPhone\": \"010-1234-5678\"}"
}
```

**확인 사항**:
- [ ] 201 Created 응답
- [ ] `requestId` 반환 확인

---

### 테스트 2: 온보딩 승인 (Ops Portal)

**1. Ops Portal 로그인**
- URL: `https://ops.dev.e-trinity.co.kr/auth/login`
- 계정: `application-dev.yml`의 `ops.admin.username` / `ops.admin.password`

**2. 온보딩 요청 승인**
- 메뉴: "온보딩" → "대기 중인 요청"
- 테스트 요청 선택 → "승인" 클릭

**확인 사항**:
- [ ] 승인 성공 메시지
- [ ] 상태가 `APPROVED`로 변경됨

---

### 테스트 3: 테넌트 및 대시보드 확인

**API**: `GET https://ops.dev.e-trinity.co.kr/api/v1/ops/tenants`

**확인 사항**:
- [ ] 생성된 테넌트 목록에 테스트 테넌트 표시
- [ ] 테넌트 상태가 `ACTIVE`

**대시보드 확인**:
```sql
-- SSH 접속 후 MySQL 실행
SELECT 
    td.dashboard_id,
    td.dashboard_name,
    td.dashboard_type,
    td.dashboard_config
FROM tenant_dashboards td
WHERE td.tenant_id = '생성된_테넌트_ID'
  AND td.is_deleted = FALSE
ORDER BY td.display_order;
```

**확인 사항**:
- [ ] 역할별 대시보드 생성됨 (ADMIN, CLIENT, CONSULTANT 등)
- [ ] `dashboard_config`에 위젯 설정 포함됨
- [ ] 위젯 타입: `welcome`, `summary-statistics`, `activity-list` 등

---

### 테스트 4: 관리자 로그인 및 대시보드 접근

**1. 관리자 계정 확인**
- Ops Portal → "테넌트" → 테스트 테넌트 클릭
- 관리자 계정 정보 확인 (이메일, 비밀번호)

**2. 관리자 로그인**
- URL: `https://dev.core-solution.co.kr/login` (또는 테넌트별 도메인)
- 생성된 관리자 계정으로 로그인

**3. 대시보드 확인**
- 로그인 후 자동으로 대시보드로 이동
- 위젯 표시 확인:
  - [ ] Welcome 위젯 표시
  - [ ] 통계 요약 위젯 표시
  - [ ] 활동 목록 위젯 표시

---

## ✅ 최종 확인 체크리스트

### 온보딩 플로우
- [x] 온보딩 요청 생성 가능
- [x] 온보딩 승인 가능
- [x] 테넌트 자동 생성
- [x] 기본 대시보드 자동 생성 (위젯 포함)
- [x] 관리자 계정 자동 생성
- [ ] 관리자 로그인 및 대시보드 접근

### 대시보드 기능
- [x] 역할별 대시보드 라우팅 구현
- [x] 기본 위젯 자동 생성
- [x] 위젯 레지스트리 구현
- [ ] 실제 위젯 표시 확인

### 메타데이터
- [x] `settings_json.features` 자동 설정
- [x] 업종별 기능 활성화

---

## 🐛 문제 발생 시

### 문제 1: 배포 실패
- GitHub Actions 로그 확인
- 서버 로그 확인: `journalctl -u mindgarden-dev.service -n 100`

### 문제 2: 대시보드 위젯 미표시
- `dashboard_config` JSON 확인
- 브라우저 콘솔 에러 확인
- 위젯 컴포넌트 import 확인

### 문제 3: 관리자 계정 생성 실패
- `OnboardingServiceImpl.createTenantAdminAccount()` 로그 확인
- 이메일 중복 확인
- 비밀번호 해시 확인

---

## 📝 테스트 결과 기록

**테스트 일시**: _______________

**결과**:
- [ ] 성공
- [ ] 부분 성공 (문제: _______________)
- [ ] 실패 (문제: _______________)

**발견된 이슈**:
1. 
2. 
3. 

---

**마지막 업데이트**: 2025-11-23

