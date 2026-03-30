# 위젯 API 연동 확인 문서

**작성일**: 2025-11-22  
**버전**: 1.0.0  
**목적**: 위젯 시스템과 PL/SQL 프로시저, ERP 시스템 연동 상태 확인

---

## 📋 개요

위젯 시스템이 실제 백엔드 API, PL/SQL 프로시저, ERP 시스템과 제대로 연동되는지 확인하고, 필요한 수정 사항을 정리합니다.

---

## 🔍 확인 항목

### 1. PL/SQL 프로시저 연동

#### 1.1 온보딩 승인 프로시저
- **프로시저명**: `ProcessOnboardingApproval`
- **위치**: `V15__create_process_onboarding_approval_procedure.sql`
- **호출 위치**: `OnboardingServiceImpl.processApproval()`
- **상태**: ✅ 연동 완료

**프로시저 호출 흐름:**
```java
// OnboardingServiceImpl.java
CallableStatement cs = connection.prepareCall(
    "{CALL ProcessOnboardingApproval(?, ?, ?, ?, ?, ?, ?, ?)}"
);
cs.setLong(1, request.getId());
cs.setString(2, tenantId);
cs.setString(3, request.getTenantName());
cs.setString(4, request.getBusinessType());
cs.setString(5, approvedBy);
cs.setString(6, note);
cs.registerOutParameter(7, Types.BOOLEAN);
cs.registerOutParameter(8, Types.VARCHAR);
cs.execute();
```

**프로시저가 수행하는 작업:**
1. 테넌트 생성/활성화 (`CreateOrActivateTenant`)
2. 카테고리 매핑 설정 (`SetupTenantCategoryMapping`)
3. 기본 컴포넌트 활성화 (`ActivateDefaultComponents`)
4. 기본 요금제 구독 생성 (`CreateDefaultSubscription`)
5. 기본 역할 템플릿 적용 (`ApplyDefaultRoleTemplates`)
6. ERD 자동 생성 (`GenerateErdOnOnboardingApproval`)

#### 1.2 관리자 계정 생성
- **위치**: `OnboardingServiceImpl.createTenantAdminAccount()`
- **상태**: ✅ Java 서비스에서 처리 (PL/SQL 아님)
- **참고**: PL/SQL 프로시저에는 포함되지 않음, Java에서 별도 처리

---

### 2. ERP 시스템 연동

#### 2.1 ERP 컨트롤러
- **파일**: `ErpController.java`
- **기본 경로**: `/api/erp`
- **상태**: ✅ 연동 완료

**주요 엔드포인트:**
- `GET /api/erp/purchase-requests` - 구매 요청 목록
- `GET /api/erp/purchase-requests/requester/{requesterId}` - 요청자별 구매 요청
- `POST /api/erp/purchase-requests/{id}/approve-admin` - 관리자 승인
- `POST /api/erp/purchase-requests/{id}/approve-super-admin` - 수퍼 관리자 승인
- `GET /api/erp/purchase-requests/pending-admin` - 관리자 승인 대기
- `GET /api/erp/purchase-requests/pending-super-admin` - 수퍼 관리자 승인 대기

#### 2.2 ERP 서비스
- **파일**: `ErpServiceImpl.java`
- **주요 기능:**
  - 구매 요청 관리
  - 승인 프로세스
  - 지출 거래 자동 생성 (`createPurchaseExpenseTransaction`)

#### 2.3 ERP 위젯 연동 확인

**PurchaseRequestWidget:**
- ✅ API 엔드포인트: `/api/erp/purchase-requests/requester/{userId}`
- ✅ 상태: 연동 가능

---

### 3. 위젯 API 엔드포인트 매핑 확인

#### 3.1 공통 위젯

| 위젯 타입 | 위젯에서 사용하는 API | 실제 존재 여부 | 상태 |
|----------|---------------------|---------------|------|
| `message` | `/api/consultation-messages/client/{userId}` | ✅ 존재 | ✅ |
| `notification` | `/api/system-notifications/active` | ✅ 존재 | ✅ |
| `schedule` | `/api/schedules` 또는 `/api/schedules/today/statistics` | ✅ 존재 | ✅ |
| `rating` | `/api/ratings/{targetId}/stats` | ✅ 존재 | ✅ |
| `payment` | `/api/admin/mappings/client?clientId={userId}` | ✅ 존재 | ✅ |
| `healing-card` | `/api/healing/content` | ✅ 존재 | ✅ |
| `purchase-request` | `/api/erp/purchase-requests/requester/{userId}` | ✅ 존재 | ✅ |

#### 3.2 상담소 특화 위젯

| 위젯 타입 | 위젯에서 사용하는 API | 실제 존재 여부 | 상태 |
|----------|---------------------|---------------|------|
| `consultation-summary` | `/api/v1/consultation/summary` | ❓ 확인 필요 | ⚠️ |
| `consultation-schedule` | `/api/v1/consultation/schedule` | ❓ 확인 필요 | ⚠️ |
| `consultation-stats` | `/api/v1/consultations/statistics/overall` | ✅ 존재 | ✅ |
| `consultation-record` | `/api/consultant/{consultantId}/consultation-records` | ❓ 확인 필요 | ⚠️ |
| `consultant-client` | `/api/admin/mappings/consultant/{consultantId}/clients` | ✅ 존재 | ✅ |
| `mapping-management` | `/api/admin/mappings` | ✅ 존재 | ✅ |
| `session-management` | `/api/admin/session-extensions/requests` | ✅ 존재 | ✅ |
| `schedule-registration` | `/api/schedules/today/statistics` | ✅ 존재 | ✅ |
| `pending-deposit` | `/api/admin/mappings/pending-payment` | ✅ 존재 | ✅ |

#### 3.3 관리자 위젯

| 위젯 타입 | 위젯에서 사용하는 API | 실제 존재 여부 | 상태 |
|----------|---------------------|---------------|------|
| `system-status` | `/api/health/server`, `/api/health/database` | ✅ 존재 | ✅ |
| `system-tools` | `/api/admin/cache/clear` | ❓ 확인 필요 | ⚠️ |
| `permission` | `/api/admin/permissions` | ❓ 확인 필요 | ⚠️ |
| `statistics-grid` | `/api/admin/statistics/overall` | ✅ 존재 | ✅ |

---

## ✅ 확인 완료된 API 엔드포인트

### 1. 메시지 관련
- ✅ `/api/consultation-messages/client/{userId}` - `ConsultationMessageController.getClientMessages()`
- ✅ `/api/consultation-messages/{messageId}` - `ConsultationMessageController.getMessage()`
- ✅ `/api/consultation-messages/{messageId}/read` - `ConsultationMessageController.markAsRead()`

### 2. 알림 관련
- ✅ `/api/system-notifications/active` - `SystemNotificationController.getActiveNotifications()`
- ✅ `/api/system-notifications/{notificationId}/read` - `SystemNotificationController.markAsRead()`

### 3. 결제 관련
- ✅ `/api/admin/mappings/client?clientId={userId}` - `AdminController.getMappingsByClientId()`
- ✅ `/api/payments/payer/{payerId}` - `PaymentController.getPaymentsByPayerId()`

### 4. 힐링 컨텐츠
- ✅ `/api/healing/content` - `HealingContentController.getHealingContent()`
- ✅ `/api/healing/refresh` - `HealingContentController.refreshHealingContent()`

### 5. 시스템 헬스 체크
- ✅ `/api/health/server` - `SystemHealthController.checkServerHealth()`
- ✅ `/api/health/database` - `SystemHealthController.checkDatabaseHealth()`
- ✅ `/api/health/actuator` - `SystemHealthController.actuatorHealth()`

### 6. 상담 통계
- ✅ `/api/v1/consultations/statistics/overall` - `ConsultationController.getOverallConsultationStatistics()`
- ✅ `/api/admin/statistics/overall` - `StatisticsController.getOverallStatistics()`

### 7. 일정 관련
- ✅ `/api/schedules/today/statistics` - `ScheduleController` (확인됨)

### 8. 회기 관련
- ✅ `/api/admin/session-extensions/requests` - `SessionExtensionController` (확인됨)

---

## ⚠️ 확인 필요 사항

### 1. API 엔드포인트 존재 여부 확인

다음 API 엔드포인트들이 실제로 존재하는지 확인이 필요합니다:

1. **상담 관련**
   - `/api/v1/consultation/summary`
   - `/api/v1/consultation/schedule`
   - `/api/consultant/{consultantId}/consultation-records`

2. **시스템 관리 관련**
   - `/api/admin/cache/clear`
   - `/api/admin/backup/create`
   - `/api/admin/permissions`
   - `/api/admin/logs/recent`

3. **통계 관련**
   - `/api/admin/statistics/summary`
   - `/api/admin/statistics/trends`

### 2. PL/SQL 프로시저 호출 확인

- ✅ `ProcessOnboardingApproval` - 온보딩 승인 프로세스
- ❓ 다른 PL/SQL 프로시저 호출이 필요한지 확인 필요

### 3. ERP 시스템 연동 확인

- ✅ 구매 요청 API - 연동 완료
- ❓ ERP 재무 시스템 연동 확인 필요
- ❓ ERP 보고서 생성 API 확인 필요

---

## 🔧 수정 필요 사항

### 1. 위젯 API 엔드포인트 수정

위젯에서 사용하는 API 엔드포인트가 실제로 존재하지 않을 경우, 다음 중 하나를 수행해야 합니다:

1. **백엔드 API 생성**: 필요한 API 엔드포인트를 백엔드에 생성
2. **위젯 수정**: 위젯의 API 엔드포인트를 실제 존재하는 엔드포인트로 수정
3. **폴백 처리**: API가 없을 경우 정적 데이터나 다른 소스 사용

### 2. 데이터 소스 설정 표준화

모든 위젯의 `dataSource` 설정을 표준화:

```json
{
  "dataSource": {
    "type": "api",  // "api" | "static" | "plsql" | "erp"
    "url": "/api/endpoint",
    "params": {},
    "refreshInterval": 60000,
    "method": "GET"  // "GET" | "POST" | "PUT" | "DELETE"
  }
}
```

### 3. PL/SQL 프로시저 호출 위젯

PL/SQL 프로시저를 직접 호출하는 위젯이 필요한 경우:

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

### 4. ERP 시스템 연동 위젯

ERP 시스템과 직접 연동하는 위젯:

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

---

## 📝 다음 단계

1. **API 엔드포인트 존재 여부 확인**
   - 모든 위젯에서 사용하는 API 엔드포인트 목록 작성
   - 백엔드 컨트롤러에서 실제 존재 여부 확인
   - 존재하지 않는 API는 생성 또는 위젯 수정

2. **PL/SQL 프로시저 호출 테스트**
   - `ProcessOnboardingApproval` 프로시저 호출 테스트
   - 다른 필요한 PL/SQL 프로시저 확인

3. **ERP 시스템 연동 테스트**
   - 구매 요청 API 연동 테스트
   - 재무 시스템 연동 확인
   - 보고서 생성 API 확인

4. **위젯 데이터 소스 설정 업데이트**
   - 실제 존재하는 API 엔드포인트로 위젯 수정
   - 데이터 소스 타입 표준화

5. **에러 처리 강화**
   - API 호출 실패 시 폴백 처리
   - 사용자에게 명확한 에러 메시지 표시

---

## 📚 참고 문서

- [위젯 아키텍처](./WIDGET_ARCHITECTURE.md)
- [완전한 위젯 목록](./COMPLETE_WIDGET_LIST.md)
- [상담소 특화 관리 위젯](./CONSULTATION_ADMIN_WIDGET_LIST.md)
- [PL/SQL 아키텍처](../CORE_SOLUTION_PLSQL_ARCHITECTURE.md)
- [온보딩 프로세스](../ONBOARDING_ADMIN_ACCOUNT_PROCESS.md)

