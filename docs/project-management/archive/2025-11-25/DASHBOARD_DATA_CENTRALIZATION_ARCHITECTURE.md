# 대시보드 데이터 중앙화 아키텍처

대시보드 위젯의 데이터가 중앙화되고, ERP 및 스케줄 시스템과 연동되는 아키텍처를 정의합니다.

## 📋 목차
1. [데이터 중앙화 원칙](#데이터-중앙화-원칙)
2. [대시보드 위젯 데이터 흐름](#대시보드-위젯-데이터-흐름)
3. [ERP 연동 구조](#erp-연동-구조)
4. [스케줄 등록 연동](#스케줄-등록-연동)
5. [통합 데이터 흐름](#통합-데이터-흐름)
6. [구현 가이드](#구현-가이드)

---

## 데이터 중앙화 원칙

### 핵심 원칙

1. **단일 데이터 코어 유지**
   - 모든 운영/결제/정산/AI/로그 데이터는 공통 DB 클러스터(테넌트 파티셔닝)에서 관리
   - 대시보드 위젯의 모든 데이터는 중앙 DB에서 조회
   - 외부 서비스(RAG, BI, Data Lake)는 CDC 또는 API를 통해 읽기 전용으로 연계

2. **데이터 생성 지점 통합**
   - 웹/앱/운영 포털/모바일 앱에서 발생하는 모든 트랜잭션은 API Gateway → 중앙 서비스 → DB 순으로 흐름
   - 대시보드 위젯에서 생성/수정/삭제하는 모든 데이터는 중앙 서비스를 통해 처리

3. **메타데이터·코드 관리 일원화**
   - 공통 코드, 요금제, 템플릿, Feature Flag, 권한 정책 등은 `core-domain` 레이어 하위 central registry 테이블로 유지
   - 테넌트별 커스텀 설정도 중앙 저장소에 버전 관리

4. **로그/감사 데이터 중앙 저장**
   - 대시보드 위젯의 모든 작업 로그는 중앙 인덱스에 수집
   - 규제·감사 목적 자료는 중앙 테이블에만 기록

---

## 대시보드 위젯 데이터 흐름

### 기본 구조

```
┌─────────────────────────────────────────────────────────┐
│              대시보드 위젯 (Frontend)                    │
│  - StatisticsWidget, TableWidget, FormWidget 등         │
└────────────────────┬────────────────────────────────────┘
                     │ API 호출
                     ↓
┌─────────────────────────────────────────────────────────┐
│              API Gateway / Controller                   │
│  - TenantDashboardController                            │
│  - ResourceController (위젯별 리소스)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              중앙 서비스 레이어 (Service)                │
│  - TenantDashboardService                               │
│  - ErpService (ERP 연동)                                │
│  - ScheduleService (스케줄 연동)                        │
│  - ResourceService (리소스별 CRUD)                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              중앙 데이터베이스 (core_solution)          │
│  - tenants, tenant_roles, tenant_dashboards            │
│  - erp_*, schedules, consultations, academy_*          │
│  - 모든 업종별 데이터 통합 관리                         │
└─────────────────────────────────────────────────────────┘
```

### 위젯 데이터 소스 설정

모든 위젯은 중앙 API를 통해 데이터를 조회합니다:

```javascript
// 위젯 Config 예제
{
  "type": "table",
  "config": {
    "title": "사용자 목록",
    "dataSource": {
      "type": "api",
      "url": "/api/v1/users",  // 중앙 API 엔드포인트
      "params": {
        "tenantId": "${user.tenantId}",  // 자동 주입
        "page": 0,
        "size": 10
      }
    },
    "actions": {
      "create": {
        "url": "/api/v1/users",  // 중앙 API
        "method": "POST"
      },
      "update": {
        "url": "/api/v1/users/{id}",
        "method": "PUT"
      },
      "delete": {
        "url": "/api/v1/users/{id}",
        "method": "DELETE"
      }
    }
  }
}
```

---

## ERP 연동 구조

### ERP 데이터 중앙화

ERP 관련 모든 데이터는 중앙 DB에 저장되고, 대시보드 위젯을 통해 조회/관리됩니다.

#### 1. ERP 위젯 데이터 흐름

```
┌─────────────────────────────────────────────────────────┐
│              ERP 위젯 (Frontend)                        │
│  - ErpStatsGridWidget                                   │
│  - ErpManagementGridWidget                              │
│  - PurchaseRequestWidget                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              ERP API (Controller)                       │
│  - ErpController                                        │
│  - PurchaseRequestController                            │
│  - BudgetController                                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              ERP 서비스 (Service)                        │
│  - ErpServiceImpl                                       │
│  - PL/SQL 프로시저 호출 (필요시)                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              중앙 데이터베이스                           │
│  - erp_purchase_requests                                │
│  - erp_purchase_orders                                   │
│  - erp_budgets                                           │
│  - erp_financial_transactions                            │
│  - erp_accounting_entries                                │
└─────────────────────────────────────────────────────────┘
```

#### 2. ERP 위젯 Config 예제

```javascript
// ERP 통계 위젯
{
  "type": "erp-stats-grid",
  "config": {
    "title": "ERP 통계",
    "dataSource": {
      "type": "api",
      "url": "/api/erp/finance/dashboard",  // 중앙 ERP API
      "params": {
        "branchCode": "${user.branchCode}",  // 자동 주입
        "date": "${today}"
      },
      "refreshInterval": 60000  // 1분마다 새로고침
    }
  }
}

// 구매 요청 위젯
{
  "type": "purchase-request",
  "config": {
    "title": "구매 요청",
    "dataSource": {
      "type": "api",
      "url": "/api/erp/purchase-requests",  // 중앙 ERP API
      "params": {
        "status": "PENDING"
      }
    },
    "actions": {
      "create": {
        "url": "/api/erp/purchase-requests",
        "method": "POST"
      },
      "update": {
        "url": "/api/erp/purchase-requests/{id}",
        "method": "PUT"
      },
      "approve": {
        "url": "/api/erp/purchase-requests/{id}/approve",
        "method": "POST"
      }
    }
  }
}
```

#### 3. ERP 데이터 생성 시 자동 연동

```java
// ErpServiceImpl.java
@Transactional
public PurchaseRequestResponse createPurchaseRequest(
        String tenantId, 
        PurchaseRequestRequest request, 
        String createdBy) {
    
    // 1. 중앙 DB에 구매 요청 저장
    PurchaseRequest purchaseRequest = purchaseRequestRepository.save(
        PurchaseRequest.builder()
            .tenantId(tenantId)
            .itemName(request.getItemName())
            .amount(request.getAmount())
            .status(PurchaseRequestStatus.PENDING)
            .build()
    );
    
    // 2. ERP 회계 분개 자동 생성 (PL/SQL 프로시저 호출)
    if (request.getAutoCreateJournalEntry()) {
        erpProcedureService.createJournalEntryForPurchaseRequest(
            tenantId, 
            purchaseRequest.getId()
        );
    }
    
    // 3. 예산 체크 및 업데이트
    budgetService.checkAndReserveBudget(tenantId, request.getAmount());
    
    // 4. 대시보드 위젯 자동 새로고침 트리거 (WebSocket 또는 이벤트)
    dashboardEventService.notifyWidgetRefresh("erp-stats-grid", tenantId);
    
    return toResponse(purchaseRequest);
}
```

---

## 스케줄 등록 연동

### 스케줄 데이터 중앙화

스케줄 관련 모든 데이터는 중앙 DB에 저장되고, 대시보드 위젯을 통해 조회/등록됩니다.

#### 1. 스케줄 위젯 데이터 흐름

```
┌─────────────────────────────────────────────────────────┐
│              스케줄 위젯 (Frontend)                      │
│  - ScheduleWidget                                        │
│  - ScheduleRegistrationWidget                           │
│  - ConsultationScheduleWidget                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              스케줄 API (Controller)                     │
│  - ScheduleController                                   │
│  - ConsultationScheduleController                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              스케줄 서비스 (Service)                     │
│  - ScheduleServiceImpl                                  │
│  - ConsultationScheduleService                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              중앙 데이터베이스                           │
│  - schedules                                             │
│  - consultation_sessions                                │
│  - class_schedules (학원)                                │
└─────────────────────────────────────────────────────────┘
```

#### 2. 스케줄 등록 시 자동 연동

```java
// ScheduleServiceImpl.java
@Transactional
public ScheduleResponse createSchedule(
        String tenantId, 
        ScheduleRequest request, 
        String createdBy) {
    
    // 1. 중앙 DB에 스케줄 저장
    Schedule schedule = scheduleRepository.save(
        Schedule.builder()
            .tenantId(tenantId)
            .scheduledDate(request.getScheduledDate())
            .scheduledTime(request.getScheduledTime())
            .consultantId(request.getConsultantId())
            .clientId(request.getClientId())
            .status(ScheduleStatus.SCHEDULED)
            .build()
    );
    
    // 2. ERP 연동: 상담 수수료 자동 계산 및 예약
    if (request.getMappingId() != null) {
        erpService.reserveConsultationFee(
            tenantId, 
            request.getMappingId(), 
            schedule.getId()
        );
    }
    
    // 3. 알림 발송 (공통 알림 서비스)
    notificationService.sendScheduleCreatedNotification(schedule);
    
    // 4. 대시보드 위젯 자동 새로고침
    dashboardEventService.notifyWidgetRefresh("schedule", tenantId);
    dashboardEventService.notifyWidgetRefresh("consultation-summary", tenantId);
    
    return toResponse(schedule);
}
```

#### 3. 스케줄 위젯 Config 예제

```javascript
// 스케줄 등록 위젯
{
  "type": "schedule-registration",
  "config": {
    "title": "일정 등록",
    "dataSource": {
      "type": "api",
      "url": "/api/schedules",  // 중앙 스케줄 API
      "params": {
        "date": "${today}",
        "userId": "${user.id}"
      },
      "refreshInterval": 30000  // 30초마다 새로고침
    },
    "actions": {
      "create": {
        "url": "/api/schedules",
        "method": "POST",
        "onSuccess": {
          "refreshWidgets": ["schedule", "consultation-summary"],
          "notifyErp": true  // ERP 자동 연동
        }
      },
      "update": {
        "url": "/api/schedules/{id}",
        "method": "PUT"
      },
      "cancel": {
        "url": "/api/schedules/{id}/cancel",
        "method": "POST"
      }
    }
  }
}
```

---

## 통합 데이터 흐름

### 시나리오: 스케줄 등록 → ERP 연동 → 대시보드 업데이트

```
1. 사용자가 대시보드 위젯에서 스케줄 등록
   ↓
2. ScheduleController.createSchedule() 호출
   ↓
3. ScheduleServiceImpl.createSchedule()
   ├─ 중앙 DB에 스케줄 저장 (schedules 테이블)
   ├─ ERP 연동: 상담 수수료 예약 (erp_financial_transactions)
   ├─ 알림 발송 (notifications 테이블)
   └─ 이벤트 발행: "schedule.created"
   ↓
4. DashboardEventService
   ├─ "schedule" 위젯 새로고침 트리거
   ├─ "consultation-summary" 위젯 새로고침 트리거
   └─ "erp-stats-grid" 위젯 새로고침 트리거 (ERP 연동)
   ↓
5. 위젯들이 자동으로 최신 데이터 조회
   ├─ ScheduleWidget: /api/schedules?date=today
   ├─ ConsultationSummaryWidget: /api/consultations/summary
   └─ ErpStatsGridWidget: /api/erp/finance/dashboard
```

### 시나리오: 구매 요청 생성 → ERP 회계 분개 → 대시보드 업데이트

```
1. 사용자가 대시보드 위젯에서 구매 요청 생성
   ↓
2. ErpController.createPurchaseRequest() 호출
   ↓
3. ErpServiceImpl.createPurchaseRequest()
   ├─ 중앙 DB에 구매 요청 저장 (erp_purchase_requests)
   ├─ PL/SQL 프로시저 호출: 회계 분개 자동 생성
   │  └─ erp_accounting_entries 테이블에 분개 생성
   ├─ 예산 체크 및 예약 (erp_budgets)
   └─ 이벤트 발행: "purchase-request.created"
   ↓
4. DashboardEventService
   ├─ "purchase-request" 위젯 새로고침
   ├─ "erp-stats-grid" 위젯 새로고침
   └─ "erp-management-grid" 위젯 새로고침
   ↓
5. 위젯들이 자동으로 최신 데이터 조회
```

---

## 구현 가이드

### 1. 위젯에서 중앙 API 사용

모든 위젯은 중앙 API 엔드포인트를 사용합니다:

```javascript
// 위젯 컴포넌트
const MyWidget = ({ widget, user }) => {
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  
  const loadData = async () => {
    // tenantId는 자동으로 주입됨 (TenantContextFilter)
    const response = await apiGet(dataSource.url, {
      ...dataSource.params,
      // user 정보는 자동으로 세션에서 가져옴
    });
    
    setData(response);
  };
};
```

### 2. 백엔드에서 중앙 데이터 조회

모든 서비스는 중앙 DB에서 데이터를 조회합니다:

```java
@Service
@RequiredArgsConstructor
public class ResourceServiceImpl implements ResourceService {
    
    private final ResourceRepository resourceRepository;
    
    @Override
    @Transactional(readOnly = true)
    public List<ResourceResponse> getResources(String tenantId, int page, int size) {
        // tenantId는 TenantContextHolder에서 자동 주입
        // 중앙 DB에서 조회
        return resourceRepository.findByTenantIdAndIsDeletedFalse(
            tenantId, 
            PageRequest.of(page, size)
        ).stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
    }
}
```

### 3. ERP 연동 서비스

```java
@Service
@RequiredArgsConstructor
public class ErpIntegrationService {
    
    private final ErpService erpService;
    private final DashboardEventService dashboardEventService;
    
    /**
     * 스케줄 생성 시 ERP 연동
     */
    @Transactional
    public void integrateScheduleWithErp(Schedule schedule) {
        // 1. 상담 수수료 계산
        BigDecimal consultationFee = calculateConsultationFee(schedule);
        
        // 2. ERP 재무 거래 생성
        FinancialTransaction transaction = FinancialTransaction.builder()
            .tenantId(schedule.getTenantId())
            .transactionType("CONSULTATION_FEE")
            .amount(consultationFee)
            .scheduleId(schedule.getId())
            .status(TransactionStatus.RESERVED)
            .build();
        
        erpService.createFinancialTransaction(transaction);
        
        // 3. 대시보드 위젯 새로고침 트리거
        dashboardEventService.notifyWidgetRefresh("erp-stats-grid", schedule.getTenantId());
    }
}
```

### 4. 스케줄 등록 서비스

```java
@Service
@RequiredArgsConstructor
public class ScheduleRegistrationService {
    
    private final ScheduleService scheduleService;
    private final ErpIntegrationService erpIntegrationService;
    private final DashboardEventService dashboardEventService;
    
    /**
     * 스케줄 등록 (ERP 연동 포함)
     */
    @Transactional
    public ScheduleResponse registerSchedule(
            String tenantId, 
            ScheduleRequest request, 
            String createdBy) {
        
        // 1. 스케줄 생성 (중앙 DB)
        ScheduleResponse schedule = scheduleService.createSchedule(
            tenantId, 
            request, 
            createdBy
        );
        
        // 2. ERP 연동
        if (request.getMappingId() != null) {
            erpIntegrationService.integrateScheduleWithErp(
                scheduleService.getSchedule(schedule.getId())
            );
        }
        
        // 3. 대시보드 위젯 새로고침
        dashboardEventService.notifyWidgetRefresh("schedule", tenantId);
        dashboardEventService.notifyWidgetRefresh("consultation-summary", tenantId);
        
        return schedule;
    }
}
```

### 5. 대시보드 이벤트 서비스

```java
@Service
@RequiredArgsConstructor
public class DashboardEventService {
    
    private final SimpMessagingTemplate messagingTemplate;
    
    /**
     * 위젯 새로고침 트리거
     */
    public void notifyWidgetRefresh(String widgetType, String tenantId) {
        // WebSocket을 통해 실시간 새로고침
        messagingTemplate.convertAndSend(
            "/topic/dashboard/" + tenantId + "/widget/" + widgetType,
            Map.of("action", "refresh", "timestamp", System.currentTimeMillis())
        );
    }
}
```

---

## 데이터 중앙화 체크리스트

### 위젯 개발 시

- [ ] 위젯이 중앙 API 엔드포인트를 사용하는가?
- [ ] `tenantId`가 자동으로 주입되는가?
- [ ] 데이터 생성/수정/삭제 시 중앙 서비스를 통해 처리하는가?
- [ ] ERP 연동이 필요한 경우 `ErpIntegrationService`를 사용하는가?
- [ ] 스케줄 연동이 필요한 경우 `ScheduleRegistrationService`를 사용하는가?
- [ ] 다른 위젯과 데이터 동기화가 필요한 경우 이벤트를 발행하는가?

### 백엔드 개발 시

- [ ] 모든 데이터가 중앙 DB(`core_solution`)에 저장되는가?
- [ ] `TenantContextHolder`를 통해 `tenantId`를 관리하는가?
- [ ] ERP 연동이 필요한 경우 `ErpService`를 사용하는가?
- [ ] 스케줄 연동이 필요한 경우 `ScheduleService`를 사용하는가?
- [ ] 데이터 변경 시 관련 위젯에 이벤트를 발행하는가?

---

## 요약

1. **데이터 중앙화**: 모든 데이터는 `core_solution` DB에 저장
2. **ERP 연동**: ERP 위젯은 중앙 ERP API를 통해 데이터 조회/생성
3. **스케줄 연동**: 스케줄 위젯은 중앙 스케줄 API를 통해 데이터 조회/등록
4. **자동 동기화**: 데이터 변경 시 관련 위젯 자동 새로고침
5. **통합 흐름**: 스케줄 등록 → ERP 연동 → 대시보드 업데이트가 자동으로 연동

모든 위젯은 중앙 API를 통해 데이터를 조회하고, 데이터 생성/수정/삭제 시 자동으로 ERP 및 스케줄 시스템과 연동됩니다.


