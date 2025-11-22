# PL/SQL 및 ERP 시스템 연동 상태

**작성일**: 2025-11-22  
**버전**: 1.0.0  
**목적**: PL/SQL 프로시저와 ERP 시스템 연동 상태 및 위젯 연동 확인

---

## 📋 개요

위젯 시스템이 PL/SQL 프로시저와 ERP 시스템과 제대로 연동되는지 확인하고, 실제 존재하는 API 엔드포인트로 위젯을 업데이트합니다.

---

## ✅ PL/SQL 프로시저 연동 상태

### 1. 온보딩 승인 프로시저

**프로시저명**: `ProcessOnboardingApproval`  
**위치**: `V15__create_process_onboarding_approval_procedure.sql`  
**호출 위치**: `OnboardingServiceImpl.processApproval()`  
**상태**: ✅ 연동 완료

**프로시저가 수행하는 작업:**
1. ✅ 테넌트 생성/활성화 (`CreateOrActivateTenant`)
2. ✅ 카테고리 매핑 설정 (`SetupTenantCategoryMapping`)
3. ✅ 기본 컴포넌트 활성화 (`ActivateDefaultComponents`)
4. ✅ 기본 요금제 구독 생성 (`CreateDefaultSubscription`)
5. ✅ 기본 역할 템플릿 적용 (`ApplyDefaultRoleTemplates`)
6. ✅ ERD 자동 생성 (`GenerateErdOnOnboardingApproval`)

**Java 서비스에서 추가 처리:**
- ✅ 관리자 계정 생성 (`createTenantAdminAccount`)
- ✅ 기본 대시보드 생성 (`createDefaultDashboards`)
- ✅ 구독 tenant_id 업데이트 (`updateSubscriptionTenantId`)

### 2. 매칭 관리 PL/SQL 프로시저

**프로시저명**: `UpdateMappingInfo`  
**위치**: `PlSqlMappingSyncController`  
**상태**: ✅ 연동 완료

**주요 기능:**
- 매칭 정보 수정 (패키지명, 가격, 회기수)
- ERP 시스템과 동기화
- 권한 체크 (`checkMappingUpdatePermission`)

---

## ✅ ERP 시스템 연동 상태

### 1. ERP 컨트롤러

**파일**: `ErpController.java`  
**기본 경로**: `/api/erp`, `/api/v1/erp`  
**상태**: ✅ 연동 완료

**주요 엔드포인트:**

#### 구매 요청 관리
- ✅ `GET /api/erp/purchase-requests` - 구매 요청 목록
- ✅ `GET /api/erp/purchase-requests/requester/{requesterId}` - 요청자별 구매 요청
- ✅ `GET /api/erp/purchase-requests/pending-admin` - 관리자 승인 대기
- ✅ `GET /api/erp/purchase-requests/pending-super-admin` - 수퍼 관리자 승인 대기
- ✅ `POST /api/erp/purchase-requests/{id}/approve-admin` - 관리자 승인
- ✅ `POST /api/erp/purchase-requests/{id}/approve-super-admin` - 수퍼 관리자 승인

#### 아이템 관리
- ✅ `GET /api/erp/items` - 아이템 목록
- ✅ `GET /api/erp/items/{id}` - 아이템 상세
- ✅ `POST /api/erp/items` - 아이템 생성
- ✅ `PUT /api/erp/items/{id}` - 아이템 수정

#### 재무 거래
- ✅ 구매 요청 승인 시 자동으로 지출 거래 생성 (`createPurchaseExpenseTransaction`)

### 2. ERP 위젯 연동

**PurchaseRequestWidget:**
- ✅ API 엔드포인트: `/api/erp/purchase-requests/requester/{userId}`
- ✅ 상태: 연동 완료

---

## ✅ 실제 존재하는 API 엔드포인트 확인

### 1. 매칭 관리 API

**컨트롤러**: `AdminController.java`  
**기본 경로**: `/api/admin`

| 위젯에서 사용 | 실제 엔드포인트 | 상태 |
|-------------|---------------|------|
| `/api/admin/mappings` | ✅ `GET /api/admin/mappings` | ✅ 존재 |
| `/api/admin/mappings/pending-deposit` | ✅ `GET /api/admin/mappings/pending-deposit` | ✅ 존재 |
| `/api/admin/mappings/consultant/{consultantId}/clients` | ✅ `GET /api/admin/mappings/consultant/{consultantId}/clients` | ✅ 존재 |

### 2. 회기 관리 API

**컨트롤러**: `AdminController.java`, `SessionExtensionController.java`  
**기본 경로**: `/api/admin`

| 위젯에서 사용 | 실제 엔드포인트 | 상태 |
|-------------|---------------|------|
| `/api/admin/sessions` | ✅ `GET /api/admin/sessions` | ✅ 존재 |
| `/api/admin/session-extensions/requests` | ✅ `GET /api/admin/session-extensions/requests` | ✅ 존재 |

### 3. 일정 관리 API

**컨트롤러**: `ScheduleController.java`  
**기본 경로**: `/api/schedules`, `/api/v1/schedules`

| 위젯에서 사용 | 실제 엔드포인트 | 상태 |
|-------------|---------------|------|
| `/api/schedules/today/statistics` | ✅ `GET /api/schedules/today/statistics` | ✅ 존재 |
| `/api/schedules` | ✅ `GET /api/schedules` | ✅ 존재 |

### 4. ERP API

**컨트롤러**: `ErpController.java`  
**기본 경로**: `/api/erp`, `/api/v1/erp`

| 위젯에서 사용 | 실제 엔드포인트 | 상태 |
|-------------|---------------|------|
| `/api/erp/purchase-requests/requester/{userId}` | ✅ `GET /api/erp/purchase-requests/requester/{userId}` | ✅ 존재 |

---

## 🔧 위젯 API 엔드포인트 수정 사항

### 1. MappingManagementWidget
- ✅ `/api/admin/mappings` - 확인 완료
- ✅ 파라미터 지원 추가

### 2. SessionManagementWidget
- ✅ `/api/admin/sessions` - 확인 완료
- ✅ `/api/admin/session-extensions/requests` - 확인 완료
- ✅ 응답 데이터 구조 처리 개선

### 3. ScheduleRegistrationWidget
- ✅ `/api/schedules/today/statistics` - 확인 완료
- ✅ userId, userRole 파라미터 추가

### 4. PendingDepositWidget
- ✅ `/api/admin/mappings/pending-deposit` - 확인 완료
- ✅ 파라미터 지원 추가

---

## 📝 확인 필요 사항

### 1. 아직 확인되지 않은 API

다음 API 엔드포인트들은 실제 존재 여부 확인이 필요합니다:

1. **메시지 관련**
   - `/api/messages/{userId}`
   - `/api/consultation-messages/client/{userId}`

2. **알림 관련**
   - `/api/notifications/{userId}`
   - `/api/notifications/{id}/read`

3. **결제 관련**
   - `/api/payments/sessions/{userId}`

4. **힐링 컨텐츠**
   - `/api/healing/content`
   - `/api/healing/refresh`

5. **상담 관련**
   - `/api/v1/consultation/summary`
   - `/api/v1/consultation/schedule`
   - `/api/v1/consultation/stats`
   - `/api/consultant/{consultantId}/consultation-records`

6. **시스템 관련**
   - `/api/health/status`
   - `/api/health/server`
   - `/api/health/database`
   - `/api/admin/cache/clear`
   - `/api/admin/backup/create`
   - `/api/admin/permissions`
   - `/api/admin/logs/recent`

7. **통계 관련**
   - `/api/admin/statistics/summary`
   - `/api/admin/statistics/overall`
   - `/api/admin/statistics/trends`

### 2. PL/SQL 프로시저 호출

위젯에서 직접 PL/SQL 프로시저를 호출해야 하는 경우:

```json
{
  "dataSource": {
    "type": "plsql",
    "procedure": "ProcessOnboardingApproval",
    "params": {
      "p_request_id": 1,
      "p_tenant_id": "tenant-123"
    }
  }
}
```

**현재 상태**: 위젯은 API를 통해 간접적으로 PL/SQL 프로시저를 호출합니다. 직접 호출은 백엔드 서비스를 통해 처리됩니다.

### 3. ERP 시스템 직접 연동

위젯에서 ERP 시스템과 직접 연동하는 경우:

```json
{
  "dataSource": {
    "type": "erp",
    "endpoint": "purchase-requests",
    "params": {
      "requesterId": 123
    }
  }
}
```

**현재 상태**: 위젯은 `/api/erp` 엔드포인트를 통해 ERP 시스템과 연동합니다.

---

## ✅ 완료된 작업

1. ✅ PL/SQL 프로시저 연동 확인
2. ✅ ERP 시스템 연동 확인
3. ✅ 매칭 관리 API 확인 및 위젯 수정
4. ✅ 회기 관리 API 확인 및 위젯 수정
5. ✅ 일정 관리 API 확인 및 위젯 수정
6. ✅ 입금 확인 대기 API 확인 및 위젯 수정

---

## 📚 참고 문서

- [위젯 API 연동 확인](./WIDGET_API_INTEGRATION_CHECK.md)
- [완전한 위젯 목록](./COMPLETE_WIDGET_LIST.md)
- [상담소 특화 관리 위젯](./CONSULTATION_ADMIN_WIDGET_LIST.md)
- [PL/SQL 아키텍처](../CORE_SOLUTION_PLSQL_ARCHITECTURE.md)
- [온보딩 프로세스](../ONBOARDING_ADMIN_ACCOUNT_PROCESS.md)

