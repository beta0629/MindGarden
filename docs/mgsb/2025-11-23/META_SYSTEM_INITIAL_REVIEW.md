# 메타 시스템 초기 단계 검토 문서

**작성일**: 2025-11-23  
**버전**: 1.0.0  
**목적**: 초기 단계(온보딩)에서 필요한 메타 시스템 및 외부 시스템 도입 요소 검토

---

## 📋 개요

온보딩부터 실제 서비스 사용까지의 전체 플로우에서 필요한 메타 시스템 요소와 외부 시스템 연동 메타데이터를 검토하고, 부족한 부분을 식별합니다.

**핵심 원칙**: 
> **온보딩에서 등록하면 실제 코어솔루션에서 사용 가능하게 만드는 것이 최우선**
> → 모든 메타데이터는 온보딩 시점에 자동으로 생성되어야 함

---

## 🎯 1월 심사/발표를 위한 최소 기능 (MVP)

**목표**: 예비 창업자 심사 및 PPT 발표를 위한 데모 가능한 최소 기능

**기간**: 2025년 1월까지

### 필수 기능 (반드시 구현)

#### 1. 온보딩 플로우 완성 ⭐⭐⭐
- [x] Trinity 홈페이지에서 온보딩 요청 생성
- [ ] 온보딩 승인 프로세스 (자동 또는 수동)
- [ ] 테넌트 자동 생성
- [ ] 기본 관리자 계정 생성
- [ ] 기본 역할 템플릿 적용
- [ ] 기본 대시보드 자동 생성

**예상 시간**: 3-5일

#### 2. 기본 대시보드 표시 ⭐⭐
- [ ] 역할별 대시보드 라우팅
- [ ] 기본 위젯 3-5개 표시 (통계, 일정, 알림 등)
- [ ] 대시보드 레이아웃 기본 구조

**예상 시간**: 2-3일

#### 3. 테넌트 초기화 메타데이터 (최소) ⭐
- [ ] `Tenant.settings_json` 기본 구조 정의
- [ ] 온보딩 시 기본값 자동 생성
- [ ] 기본 기능 활성화 설정 (상담, 예약 등)

**예상 시간**: 1-2일

#### 4. 기본 컴포넌트 활성화 ⭐
- [ ] 업종별 기본 컴포넌트 자동 활성화
- [ ] 컴포넌트 상태 표시

**예상 시간**: 1일

### 선택 기능 (있으면 좋음, 없어도 데모 가능)

- [ ] PG 설정 (결제 시스템은 데모에서 제외 가능)
- [ ] ERP 연동 (ERP는 데모에서 제외 가능)
- [ ] 상세 모니터링 (기본 통계만 있으면 됨)
- [ ] 고급 보안 설정 (기본 보안만 있으면 됨)

### 데모 시나리오

1. **온보딩 데모** (5분)
   - Trinity 홈페이지에서 온보딩 요청 생성
   - 관리자 승인 (또는 자동 승인)
   - 테넌트 생성 확인

2. **대시보드 데모** (5분)
   - 관리자 로그인
   - 역할별 대시보드 표시
   - 기본 위젯 동작 확인

3. **메타 시스템 개념 설명** (5분)
   - 설정 기반 자동화 설명
   - 업종별 자동 설정 설명
   - 확장 가능성 설명

### 1월 심사를 위한 작업 우선순위

**P0 - 필수 (1주 내 완료)**:
1. 온보딩 플로우 완성 (3-5일)
2. 기본 대시보드 표시 (2-3일)
3. 테넌트 초기화 메타데이터 최소 구현 (1-2일)
4. 기본 컴포넌트 활성화 (1일)

**총 예상 시간**: 7-11일 (약 1.5-2주)

**P1 - 선택 (시간 여유 있을 때)**:
- PG 설정 (결제 데모 필요 시)
- 상세 모니터링 위젯
- 추가 위젯 (3-5개)

**참고**: 
- 심사/발표용이므로 완벽한 구현보다는 **데모 가능한 수준**이면 충분
- 메타 시스템의 **개념과 확장 가능성**을 보여주는 것이 중요
- 실제 운영에 필요한 고급 기능은 심사 후 단계적으로 추가

---

## ✅ 현재 구현된 메타 시스템 요소

### 1. 대시보드 메타데이터

**테이블**: `tenant_dashboards`  
**필드**: `dashboard_config` (JSON)

**용도**:
- 대시보드 레이아웃 설정
- 위젯 구성 및 위치
- 테마 설정
- 권한 설정

**상태**: ✅ 구현 완료  
**문서**: `META_SYSTEM_DASHBOARD_SCHEMA.md`

### 2. 비즈니스 규칙 엔진

**테이블**: `business_rule_mappings`  
**필드**: `condition_json`, `action_json` (JSON)

**용도**:
- 역할 체크 로직
- 상태 전이 로직
- 계산 로직

**상태**: ✅ 구현 완료 (V38, V39 마이그레이션)

### 3. 업종 카테고리 메타데이터

**테이블**: `business_categories`, `business_category_items`  
**필드**: 
- `metadata_json` (JSON)
- `settings_json` (JSON)
- `default_components_json` (JSON)
- `recommended_plan_ids_json` (JSON)
- `default_role_template_ids_json` (JSON)
- `onboarding_flow_json` (JSON)
- `feature_flags_json` (JSON)

**용도**:
- 업종별 기본 컴포넌트 자동 활성화
- 업종별 추천 요금제
- 업종별 기본 역할 템플릿
- 업종별 온보딩 플로우 설정
- 업종별 Feature Flag 기본값

**상태**: ✅ 구현 완료

### 4. 시스템 설정

**테이블**: `system_config`  
**필드**: `config_key`, `config_value`, `category`

**용도**:
- OpenAI API 설정
- 웰니스 자동 발송 설정
- 환율 설정
- 기타 시스템 전역 설정

**상태**: ✅ 구현 완료

### 5. 컴포넌트 메타데이터

**테이블**: `tenant_components`  
**필드**: 
- `settings_json` (JSON)
- `feature_flags_json` (JSON)

**용도**:
- 컴포넌트별 설정
- 컴포넌트별 Feature Flag

**상태**: ✅ 구현 완료

### 6. 테넌트 메타데이터

**테이블**: `tenants`  
**필드**: 
- `settings_json` (JSON)
- `branding_json` (JSON)

**용도**:
- 테넌트별 설정
- 브랜딩 정보 (로고, 색상 등)

**상태**: ✅ 필드 존재, **스키마 정의 필요** ⚠️

### 7. 시스템 모니터링 (현재: ADMIN/OPS 전용)

**테이블**: 없음 (실시간 메트릭)  
**컨트롤러**: `SystemMonitoringController`  
**권한**: ADMIN, OPS 역할만 접근 가능

**용도**:
- 시스템 상태 조회
- 메모리/CPU 사용량
- 데이터베이스 상태
- API 응답 시간 통계

**상태**: ✅ 구현 완료, **테넌트 뷰 없음** ⚠️

---

## ⚠️ 초기 단계에서 필요한 메타 시스템 요소

### 0. 입점사(테넌트) 모니터링 뷰 시스템 ⭐⭐⭐

**현재 상태**: 시스템 모니터링은 ADMIN/OPS 전용, 테넌트가 자신의 시스템 상태를 볼 수 없음

**필요한 기능**:

1. **테넌트별 시스템 상태 모니터링**
   - 테넌트별 서비스 상태 (상담, 학원, ERP 등)
   - 테넌트별 데이터베이스 연결 상태
   - 테넌트별 API 응답 시간

2. **테넌트별 사용량 모니터링**
   - 컴포넌트별 사용량 (`component_usage_daily` 기반)
   - 사용자 수 추적
   - 저장 공간 사용량
   - API 호출 수

3. **테넌트별 성능 모니터링**
   - 평균 응답 시간
   - 에러율
   - 트랜잭션 처리량

4. **테넌트별 알림/경고 시스템**
   - 사용량 한도 경고
   - 서비스 장애 알림
   - 성능 저하 알림

**필요한 메타데이터 구조**:

```json
{
  "version": "1.0",
  "monitoring": {
    "enabled": true,
    "refresh_interval_seconds": 30,
    "retention_days": 90,
    "alerts": {
      "usage_limit_warning": {
        "enabled": true,
        "threshold_percent": 80,
        "notification_channels": ["email", "dashboard"]
      },
      "service_down": {
        "enabled": true,
        "notification_channels": ["email", "sms"]
      },
      "performance_degradation": {
        "enabled": true,
        "response_time_threshold_ms": 1000,
        "notification_channels": ["dashboard"]
      }
    }
  },
  "metrics": {
    "components": {
      "enabled": true,
      "tracked_components": ["consultation", "academy", "erp", "wellness"]
    },
    "api": {
      "enabled": true,
      "track_endpoints": true,
      "track_response_times": true
    },
    "database": {
      "enabled": true,
      "track_query_times": false,
      "track_connection_pool": true
    }
  },
  "dashboard": {
    "default_widgets": [
      "usage_summary",
      "component_status",
      "api_performance",
      "recent_errors"
    ],
    "customizable": true
  }
}
```

**필요한 테이블/엔티티**:

1. **테넌트 모니터링 설정** (`Tenant.settings_json.monitoring`에 포함)
2. **테넌트 메트릭 저장소** (기존 `component_usage_daily` 활용 + 확장)
3. **테넌트 알림 설정** (`Tenant.settings_json.monitoring.alerts`에 포함)
4. **테넌트 서비스 상태 테이블** (신규, 선택적)

**필요한 API 엔드포인트**:

```
GET /api/v1/tenant/monitoring/status
  - 테넌트별 서비스 상태 조회
  - 컴포넌트별 활성화 상태
  - 데이터베이스 연결 상태

GET /api/v1/tenant/monitoring/usage
  - 컴포넌트별 사용량 조회
  - 사용자 수, 저장 공간, API 호출 수
  - 기간별 통계 (일/주/월)

GET /api/v1/tenant/monitoring/performance
  - 평균 응답 시간
  - 에러율
  - 트랜잭션 처리량

GET /api/v1/tenant/monitoring/alerts
  - 활성 알림 목록
  - 알림 이력

POST /api/v1/tenant/monitoring/settings
  - 모니터링 설정 업데이트
  - 알림 설정 변경
```

**필요한 대시보드 위젯**:

1. **UsageSummaryWidget** - 사용량 요약
   - 총 사용자 수
   - 컴포넌트별 사용량
   - 저장 공간 사용량

2. **ComponentStatusWidget** - 컴포넌트 상태
   - 활성화된 컴포넌트 목록
   - 컴포넌트별 상태 (정상/경고/오류)

3. **ApiPerformanceWidget** - API 성능
   - 평균 응답 시간
   - 에러율
   - 요청 수 추이

4. **RecentErrorsWidget** - 최근 에러
   - 최근 에러 로그
   - 에러 유형별 통계

5. **UsageChartWidget** - 사용량 차트
   - 기간별 사용량 추이
   - 컴포넌트별 사용량 비교

**작업 필요**:
- [ ] 테넌트 모니터링 메타데이터 스키마 정의
- [ ] 테넌트 모니터링 API 구현 (`TenantMonitoringController`)
- [ ] 테넌트 모니터링 서비스 구현 (`TenantMonitoringService`)
- [ ] 테넌트 모니터링 대시보드 위젯 생성 (5개 위젯)
- [ ] 테넌트별 사용량 집계 로직 구현
- [ ] 테넌트별 알림 시스템 구현
- [ ] 테넌트 모니터링 권한 설정 (테넌트 관리자만 접근)
- [ ] 테넌트 모니터링 기본 대시보드 자동 생성 (온보딩 시)

**우선순위**: 🔥 P0 (온보딩 후 실제 사용 시 필수)

**참고**: 
- 기존 `SystemMonitoringController`는 ADMIN/OPS 전용으로 유지
- 테넌트 모니터링은 테넌트별로 격리된 데이터만 제공
- 테넌트 간 데이터 접근 불가 (멀티 테넌트 보안)

---

### 1. 테넌트 초기화 메타데이터 스키마 정의

**현재 상태**: `Tenant.settings_json` 필드는 존재하지만 스키마가 정의되지 않음

**필요한 스키마**:

```json
{
  "version": "1.0",
  "onboarding": {
    "completed_at": "2025-11-23T10:00:00Z",
    "onboarding_request_id": 123,
    "approved_by": "admin@example.com"
  },
  "features": {
    "consultation": true,
    "academy": false,
    "erp": true,
    "wellness": true
  },
  "limits": {
    "max_users": 50,
    "max_storage_gb": 100,
    "max_api_calls_per_month": 10000
  },
  "integrations": {
    "pg": {
      "enabled": true,
      "provider": "iamport",
      "config_id": "pg-config-uuid"
    },
    "erp": {
      "enabled": true,
      "sync_enabled": true,
      "sync_interval_minutes": 30
    },
    "email": {
      "enabled": true,
      "provider": "smtp",
      "config_id": "email-config-uuid"
    }
  },
  "notifications": {
    "email_enabled": true,
    "sms_enabled": false,
    "push_enabled": true
  },
  "security": {
    "password_policy": "standard",
    "mfa_required": false,
    "session_timeout_minutes": 30
  }
}
```

**작업 필요**:
- [ ] `Tenant.settings_json` 스키마 문서 작성
- [ ] 온보딩 시 기본값 자동 생성 로직 추가
- [ ] 설정 검증 로직 추가

**우선순위**: 🔥 P0 (온보딩 플로우 완성에 필수)

---

### 2. 외부 시스템 연동 메타데이터

#### 2.1 PG (결제 게이트웨이) 설정

**현재 상태**: `TenantPgConfiguration` 엔티티 존재, `settings_json` 필드 있음

**필요한 스키마**:

```json
{
  "version": "1.0",
  "provider": "iamport",
  "credentials": {
    "api_key": "encrypted_value",
    "api_secret": "encrypted_value",
    "merchant_id": "encrypted_value"
  },
  "features": {
    "subscription": true,
    "one_time_payment": true,
    "refund": true
  },
  "webhook": {
    "url": "https://api.example.com/webhooks/payment",
    "secret": "encrypted_value"
  },
  "approval": {
    "status": "approved",
    "approved_at": "2025-11-23T10:00:00Z",
    "approved_by": "admin@example.com"
  }
}
```

**작업 필요**:
- [ ] `TenantPgConfiguration.settings_json` 스키마 문서 작성
- [ ] 온보딩 시 PG 설정 자동 생성 로직 추가
- [ ] PG 설정 승인 프로세스 메타데이터 연동

**우선순위**: 🔥 P0 (결제 시스템 필수)

---

#### 2.2 ERP 연동 설정

**현재 상태**: ERP 시스템은 구현되어 있으나, 테넌트별 ERP 설정 메타데이터가 부족

**필요한 메타데이터**:

**옵션 1**: `Tenant.settings_json.integrations.erp`에 포함 (권장)
**옵션 2**: 별도 `tenant_erp_configurations` 테이블 생성

**필요한 스키마** (옵션 1 기준):

```json
{
  "version": "1.0",
  "enabled": true,
  "sync_enabled": true,
  "sync_interval_minutes": 30,
  "modules": {
    "purchase": true,
    "accounting": true,
    "hr": false,
    "settlement": true,
    "reporting": true
  },
  "batch_schedule": {
    "purchase_sync": "0 */6 * * *",
    "accounting_sync": "0 2 * * *",
    "settlement_sync": "0 3 1 * *"
  },
  "mappings": {
    "business_type": "consultation",
    "category_mappings": {
      "consultation_fee": "ERP_CATEGORY_001",
      "package_fee": "ERP_CATEGORY_002"
    }
  }
}
```

**작업 필요**:
- [ ] ERP 연동 설정 스키마 정의
- [ ] 온보딩 시 업종별 ERP 기본 설정 자동 생성
- [ ] ERP 모듈 활성화/비활성화 메타데이터 관리

**우선순위**: 🔥 P0 (ERP 멀티 테넌트 전환과 연계)

---

#### 2.3 이메일 설정

**현재 상태**: `SystemConfig`에 전역 이메일 설정만 존재, 테넌트별 설정 부족

**필요한 메타데이터**:

**옵션 1**: `Tenant.settings_json.integrations.email`에 포함
**옵션 2**: 별도 `tenant_email_configurations` 테이블 생성

**필요한 스키마** (옵션 1 기준):

```json
{
  "version": "1.0",
  "enabled": true,
  "provider": "smtp",
  "credentials": {
    "host": "encrypted_value",
    "port": 587,
    "username": "encrypted_value",
    "password": "encrypted_value",
    "from_email": "noreply@example.com",
    "from_name": "MindGarden"
  },
  "features": {
    "transactional": true,
    "marketing": false,
    "templates": true
  }
}
```

**작업 필요**:
- [ ] 이메일 설정 스키마 정의
- [ ] 온보딩 시 기본 이메일 설정 자동 생성
- [ ] 테넌트별 이메일 템플릿 관리 메타데이터

**우선순위**: ⚠️ P1 (기본 기능이지만 온보딩 필수는 아님)

---

#### 2.4 PL/SQL 프로시저 연동 메타데이터

**현재 상태**: PL/SQL 프로시저는 하드코딩된 방식으로 호출됨

**필요한 메타데이터**:

**목적**: 프로시저 호출 설정을 메타데이터로 관리하여 유연성 확보

```json
{
  "version": "1.0",
  "procedures": {
    "ProcessOnboardingApproval": {
      "enabled": true,
      "timeout_seconds": 300,
      "retry_count": 3,
      "parameters": {
        "request_id": "number",
        "tenant_id": "string",
        "tenant_name": "string",
        "business_type": "string",
        "approved_by": "string",
        "note": "string"
      }
    },
    "UpdateMappingInfo": {
      "enabled": true,
      "timeout_seconds": 60,
      "retry_count": 1
    }
  }
}
```

**작업 필요**:
- [ ] PL/SQL 프로시저 메타데이터 스키마 정의
- [ ] 프로시저 호출 설정을 메타데이터 기반으로 변경
- [ ] 프로시저 호출 실패 시 재시도 로직 메타데이터 연동

**우선순위**: ⚠️ P2 (현재 하드코딩 방식도 작동하므로 낮은 우선순위)

---

### 3. Feature Flag 시스템 메타데이터

**현재 상태**: 
- `TenantComponent.feature_flags_json` 존재
- `BusinessCategoryItem.feature_flags_json` 존재
- 전역 Feature Flag 시스템 (`ops_feature_flag`) 존재

**필요한 통합**:

**목적**: 테넌트별, 컴포넌트별, 업종별 Feature Flag를 통합 관리

**필요한 메타데이터 구조**:

```json
{
  "version": "1.0",
  "flags": {
    "feature_new_dashboard": {
      "enabled": true,
      "scope": "tenant",
      "override": false
    },
    "feature_ai_insights": {
      "enabled": false,
      "scope": "component",
      "component_id": "ai-insights-component-id"
    },
    "feature_erp_realtime": {
      "enabled": true,
      "scope": "category",
      "category_id": "consultation-category-id"
    }
  },
  "inheritance": {
    "from_category": true,
    "from_plan": true,
    "from_component": true
  }
}
```

**작업 필요**:
- [ ] Feature Flag 통합 메타데이터 스키마 정의
- [ ] Feature Flag 상속 규칙 정의
- [ ] 온보딩 시 업종별 Feature Flag 자동 적용

**우선순위**: ⚠️ P1 (서비스 개선 단계에서 필요)

---

### 4. 온보딩 플로우 메타데이터

**현재 상태**: `BusinessCategoryItem.onboarding_flow_json` 필드 존재

**필요한 스키마 정의**:

```json
{
  "version": "1.0",
  "steps": [
    {
      "step_id": "basic_info",
      "order": 1,
      "required": true,
      "fields": ["tenant_name", "business_type", "contact_email"]
    },
    {
      "step_id": "business_category",
      "order": 2,
      "required": true,
      "fields": ["category_id", "item_id"]
    },
    {
      "step_id": "pricing_plan",
      "order": 3,
      "required": true,
      "fields": ["plan_id", "billing_cycle"]
    },
    {
      "step_id": "payment_method",
      "order": 4,
      "required": true,
      "fields": ["payment_provider", "payment_token"]
    },
    {
      "step_id": "pg_configuration",
      "order": 5,
      "required": false,
      "condition": {
        "business_type": ["consultation", "academy"]
      },
      "fields": ["pg_provider", "pg_credentials"]
    }
  ],
  "auto_approval": {
    "enabled": true,
    "conditions": {
      "risk_level": ["LOW"],
      "payment_method_required": true,
      "subscription_required": true
    }
  }
}
```

**작업 필요**:
- [ ] 온보딩 플로우 스키마 문서 작성
- [ ] 업종별 온보딩 플로우 기본값 설정
- [ ] 온보딩 플로우 동적 렌더링 로직 구현

**우선순위**: 🔥 P0 (온보딩 플로우 완성에 필수)

---

### 5. 컴포넌트 활성화 메타데이터

**현재 상태**: `TenantComponent.settings_json` 필드 존재

**필요한 스키마 정의**:

```json
{
  "version": "1.0",
  "component_id": "consultation-component-id",
  "activation": {
    "activated_at": "2025-11-23T10:00:00Z",
    "activated_by": "system",
    "activation_reason": "onboarding_default"
  },
  "configuration": {
    "max_sessions_per_month": 100,
    "session_duration_minutes": 60,
    "features": {
      "video_call": true,
      "chat": true,
      "file_sharing": true
    }
  },
  "dependencies": {
    "required_components": ["payment-component-id"],
    "optional_components": ["wellness-component-id"]
  },
  "limits": {
    "max_users": 50,
    "max_storage_gb": 10
  }
}
```

**작업 필요**:
- [ ] 컴포넌트 설정 스키마 문서 작성
- [ ] 업종별 기본 컴포넌트 설정 자동 생성
- [ ] 컴포넌트 의존성 검증 로직 메타데이터 연동

**우선순위**: 🔥 P0 (온보딩 시 컴포넌트 자동 활성화에 필수)

---

### 7. 감사(Audit) 로깅 메타데이터

**현재 상태**: 
- `AuditLoggingConfig` 존재 (전역 설정)
- `SecurityAlertService` 존재
- 테넌트별 감사 로깅 설정 부족

**필요한 메타데이터**:

```json
{
  "version": "1.0",
  "audit": {
    "enabled": true,
    "log_levels": ["INFO", "WARN", "ERROR"],
    "events": {
      "login": true,
      "logout": true,
      "permission_change": true,
      "data_access": true,
      "data_modification": true,
      "security_event": true
    },
    "retention_days": 365,
    "pii_masking": true,
    "export_enabled": true
  }
}
```

**작업 필요**:
- [ ] 테넌트별 감사 로깅 설정 메타데이터 스키마 정의
- [ ] 테넌트별 감사 로그 필터링 로직 구현
- [ ] 테넌트별 감사 로그 조회 API 구현

**우선순위**: ⚠️ P1 (보안 및 규정 준수)

---

### 8. 백업/복구 설정 메타데이터

**현재 상태**: 백업 정책이 하드코딩되어 있음 (일일 전체 백업, 시간별 증분 백업)

**필요한 메타데이터**:

```json
{
  "version": "1.0",
  "backup": {
    "enabled": true,
    "schedule": {
      "full_backup": {
        "enabled": true,
        "cron": "0 2 * * *",
        "retention_days": 30
      },
      "incremental_backup": {
        "enabled": true,
        "interval_hours": 1,
        "retention_days": 7
      }
    },
    "encryption": {
      "enabled": true,
      "algorithm": "AES-256"
    },
    "storage": {
      "type": "s3",
      "bucket": "tenant-backups",
      "region": "ap-northeast-2"
    },
    "restore": {
      "test_enabled": true,
      "test_schedule": "0 0 1 * *"
    }
  }
}
```

**작업 필요**:
- [ ] 테넌트별 백업 설정 메타데이터 스키마 정의
- [ ] 백업 스케줄러 메타데이터 기반 동적 실행
- [ ] 백업 상태 모니터링 API 구현

**우선순위**: ⚠️ P1 (데이터 보호 필수)

---

### 9. 보안 설정 메타데이터 (확장)

**현재 상태**: 
- `Tenant.settings_json.security`에 기본 보안 설정만 있음
- MFA, 세션 관리 등 상세 설정 부족

**필요한 확장 메타데이터**:

```json
{
  "version": "1.0",
  "security": {
    "password_policy": {
      "min_length": 8,
      "require_uppercase": true,
      "require_lowercase": true,
      "require_numbers": true,
      "require_special_chars": true,
      "expiration_days": 90,
      "history_count": 5
    },
    "mfa": {
      "enabled": false,
      "required_for_admin": true,
      "methods": ["totp", "sms", "email"],
      "backup_codes_count": 10
    },
    "session": {
      "timeout_minutes": 30,
      "max_concurrent_sessions": 5,
      "remember_me_enabled": true,
      "remember_me_days": 30
    },
    "ip_whitelist": {
      "enabled": false,
      "ips": []
    },
    "rate_limiting": {
      "enabled": true,
      "login_attempts": 5,
      "login_window_minutes": 15,
      "api_requests_per_minute": 100
    }
  }
}
```

**작업 필요**:
- [ ] 보안 설정 메타데이터 스키마 확장
- [ ] MFA 설정 관리 API 구현
- [ ] 세션 관리 메타데이터 기반 로직 구현

**우선순위**: ⚠️ P1 (보안 강화)

---

### 10. 알림 채널 설정 메타데이터

**현재 상태**: 
- `User.notificationPreferences` 존재 (사용자 레벨)
- 테넌트 레벨 알림 채널 설정 부족

**필요한 메타데이터**:

```json
{
  "version": "1.0",
  "notifications": {
    "channels": {
      "email": {
        "enabled": true,
        "smtp_config_id": "email-config-uuid",
        "from_email": "noreply@example.com",
        "from_name": "MindGarden"
      },
      "sms": {
        "enabled": false,
        "provider": "twilio",
        "config_id": "sms-config-uuid"
      },
      "push": {
        "enabled": true,
        "provider": "fcm",
        "config_id": "push-config-uuid"
      },
      "slack": {
        "enabled": false,
        "webhook_url": "encrypted_value",
        "channel": "#alerts"
      }
    },
    "templates": {
      "onboarding_welcome": "template-uuid-1",
      "payment_success": "template-uuid-2",
      "service_alert": "template-uuid-3"
    },
    "default_preferences": {
      "email_enabled": true,
      "sms_enabled": false,
      "push_enabled": true
    }
  }
}
```

**작업 필요**:
- [ ] 테넌트별 알림 채널 설정 메타데이터 스키마 정의
- [ ] 알림 채널 관리 API 구현
- [ ] 알림 템플릿 관리 시스템 구현

**우선순위**: ⚠️ P1 (사용자 경험 개선)

---

### 11. 다국어/지역화 설정 메타데이터

**현재 상태**: 
- `lang_code` 필드 존재 (기본값: 'ko')
- 테넌트별 다국어 설정 부족

**필요한 메타데이터**:

```json
{
  "version": "1.0",
  "localization": {
    "default_language": "ko",
    "supported_languages": ["ko", "en", "ja", "zh"],
    "timezone": "Asia/Seoul",
    "date_format": "YYYY-MM-DD",
    "time_format": "HH:mm:ss",
    "currency": {
      "code": "KRW",
      "symbol": "₩",
      "decimal_places": 0
    },
    "number_format": {
      "decimal_separator": ".",
      "thousands_separator": ","
    },
    "translations": {
      "custom": true,
      "custom_translations": {
        "ko": {
          "welcome_message": "환영합니다"
        },
        "en": {
          "welcome_message": "Welcome"
        }
      }
    }
  }
}
```

**작업 필요**:
- [ ] 테넌트별 지역화 설정 메타데이터 스키마 정의
- [ ] 다국어 리소스 관리 시스템 구현
- [ ] 지역화 설정 기반 UI 렌더링 로직 구현

**우선순위**: ⚠️ P2 (글로벌 확장 시 필요)

---

### 12. 웹훅 설정 메타데이터

**현재 상태**: 
- PG 웹훅 설정만 존재 (`TenantPgConfiguration.webhook_url`)
- 다른 시스템 웹훅 설정 부족

**필요한 메타데이터**:

```json
{
  "version": "1.0",
  "webhooks": {
    "enabled": true,
    "endpoints": [
      {
        "id": "webhook-uuid-1",
        "name": "Payment Webhook",
        "url": "https://api.example.com/webhooks/payment",
        "secret": "encrypted_value",
        "events": ["payment.success", "payment.failed", "payment.refunded"],
        "retry_count": 3,
        "timeout_seconds": 30,
        "active": true
      },
      {
        "id": "webhook-uuid-2",
        "name": "User Webhook",
        "url": "https://api.example.com/webhooks/user",
        "secret": "encrypted_value",
        "events": ["user.created", "user.updated", "user.deleted"],
        "retry_count": 3,
        "timeout_seconds": 30,
        "active": false
      }
    ],
    "signing": {
      "algorithm": "HMAC-SHA256",
      "header_name": "X-Webhook-Signature"
    }
  }
}
```

**작업 필요**:
- [ ] 웹훅 설정 메타데이터 스키마 정의
- [ ] 웹훅 관리 API 구현
- [ ] 웹훅 발송 시스템 구현

**우선순위**: ⚠️ P1 (외부 시스템 연동)

---

### 13. API 키/인증 설정 메타데이터

**현재 상태**: 외부 API 연동을 위한 API 키 관리 시스템 부족

**필요한 메타데이터**:

```json
{
  "version": "1.0",
  "api_keys": {
    "external_apis": [
      {
        "id": "api-key-uuid-1",
        "name": "OpenAI API",
        "provider": "openai",
        "api_key": "encrypted_value",
        "base_url": "https://api.openai.com/v1",
        "rate_limit": {
          "requests_per_minute": 60,
          "tokens_per_minute": 90000
        },
        "active": true
      },
      {
        "id": "api-key-uuid-2",
        "name": "Kakao Alimtalk API",
        "provider": "kakao",
        "api_key": "encrypted_value",
        "base_url": "https://kapi.kakao.com",
        "rate_limit": {
          "requests_per_minute": 100
        },
        "active": true
      }
    ],
    "internal_apis": {
      "enabled": true,
      "key_rotation_days": 90,
      "key_format": "mg_{tenant_id}_{random}"
    }
  }
}
```

**작업 필요**:
- [ ] API 키 관리 메타데이터 스키마 정의
- [ ] API 키 관리 API 구현
- [ ] API 키 암호화 저장 및 로테이션 로직 구현

**우선순위**: ⚠️ P1 (외부 서비스 연동)

---

### 14. 데이터 보존 정책 메타데이터

**현재 상태**: 로그 보관 기간이 하드코딩되어 있음

**필요한 메타데이터**:

```json
{
  "version": "1.0",
  "data_retention": {
    "policies": {
      "audit_logs": {
        "retention_days": 365,
        "archive_enabled": true,
        "archive_after_days": 90
      },
      "user_data": {
        "retention_days": 2555,
        "anonymize_after_days": 1095,
        "delete_after_days": 2555
      },
      "transaction_logs": {
        "retention_days": 2555,
        "archive_enabled": true
      },
      "backup_files": {
        "retention_days": 30,
        "archive_enabled": false
      },
      "component_usage": {
        "retention_days": 730,
        "aggregate_after_days": 90
      }
    },
    "compliance": {
      "gdpr_enabled": false,
      "ccpa_enabled": false,
      "auto_deletion_enabled": true
    }
  }
}
```

**작업 필요**:
- [ ] 데이터 보존 정책 메타데이터 스키마 정의
- [ ] 데이터 보존 정책 기반 자동 삭제/아카이브 로직 구현
- [ ] 데이터 보존 정책 관리 API 구현

**우선순위**: ⚠️ P1 (규정 준수)

---

### 15. 테넌트별 커스터마이징 설정 (확장)

**현재 상태**: 
- `Tenant.branding_json` 존재
- UI 테마, 레이아웃 등 상세 설정 부족

**필요한 확장 메타데이터**:

```json
{
  "version": "1.0",
  "customization": {
    "ui": {
      "theme": {
        "mode": "light",
        "primary_color": "#007bff",
        "secondary_color": "#6c757d",
        "font_family": "Noto Sans KR",
        "font_size": "medium"
      },
      "layout": {
        "sidebar_position": "left",
        "sidebar_collapsed": false,
        "header_style": "default"
      },
      "features": {
        "dark_mode": true,
        "animations": true,
        "accessibility": true
      }
    },
    "branding": {
      "logo_url": "https://cdn.example.com/tenants/{tenant_id}/logo.png",
      "favicon_url": "https://cdn.example.com/tenants/{tenant_id}/favicon.ico",
      "company_name": "○○ 학원",
      "company_name_en": "OO Academy",
      "primary_color": "#FF6B6B",
      "secondary_color": "#4ECDC4"
    },
    "content": {
      "welcome_message": "환영합니다",
      "footer_text": "© 2025 MindGarden",
      "terms_url": "https://example.com/terms",
      "privacy_url": "https://example.com/privacy"
    }
  }
}
```

**작업 필요**:
- [ ] 커스터마이징 설정 메타데이터 스키마 확장
- [ ] UI 테마 관리 API 구현
- [ ] 커스터마이징 설정 기반 UI 렌더링 로직 구현

**우선순위**: ⚠️ P2 (사용자 경험 개선)

---

## 🔧 필요한 시스템 도입 검토

### 1. 메타데이터 검증 시스템

**목적**: JSON 스키마 검증을 통한 메타데이터 무결성 보장

**필요한 도구/라이브러리**:
- JSON Schema Validator (Java: `org.everit.json.schema`, JavaScript: `ajv`)
- 커스텀 검증 로직

**작업 필요**:
- [ ] JSON Schema Validator 도입
- [ ] 메타데이터 저장 시 자동 검증 로직 추가
- [ ] 검증 실패 시 에러 메시지 개선

**우선순위**: ⚠️ P1 (데이터 무결성 보장)

---

### 2. 메타데이터 버전 관리 시스템

**목적**: 메타데이터 변경 이력 추적 및 롤백 지원

**필요한 기능**:
- 메타데이터 변경 이력 저장
- 버전별 스키마 관리
- 롤백 기능

**작업 필요**:
- [ ] 메타데이터 변경 이력 테이블 생성
- [ ] 버전 관리 로직 구현
- [ ] 롤백 API 구현

**우선순위**: ⚠️ P2 (운영 안정성 향상)

---

### 3. 메타데이터 마이그레이션 시스템

**목적**: 메타데이터 스키마 변경 시 자동 마이그레이션

**필요한 기능**:
- 스키마 버전 감지
- 자동 마이그레이션 스크립트 실행
- 마이그레이션 롤백 지원

**작업 필요**:
- [ ] 메타데이터 마이그레이션 프레임워크 구축
- [ ] 마이그레이션 스크립트 템플릿 작성
- [ ] 마이그레이션 테스트 자동화

**우선순위**: ⚠️ P2 (장기 운영 필요)

---

### 4. 외부 시스템 연동 관리 시스템

**목적**: PG, ERP, Email 등 외부 시스템 연동 설정 통합 관리

**필요한 기능**:
- 외부 시스템 설정 통합 관리 UI
- 연동 상태 모니터링
- 연동 실패 시 자동 재시도

**작업 필요**:
- [ ] 외부 시스템 연동 관리 API 구현
- [ ] 연동 상태 모니터링 대시보드
- [ ] 자동 재시도 로직 구현

**우선순위**: ⚠️ P1 (운영 효율성 향상)

---

## 📋 우선순위별 작업 계획

### 🔥 P0 - 최우선 (온보딩 플로우 완성)

**예상 시간**: 1-2주

0. **입점사(테넌트) 모니터링 뷰 시스템** (3일) ⭐⭐⭐
   - 테넌트 모니터링 메타데이터 스키마 정의
   - 테넌트 모니터링 API 구현
   - 테넌트 모니터링 대시보드 위젯 생성
   - 테넌트별 사용량 집계 로직 구현

1. **테넌트 초기화 메타데이터 스키마 정의** (2일)
   - `Tenant.settings_json` 스키마 문서 작성
   - 온보딩 시 기본값 자동 생성 로직 추가
   - 설정 검증 로직 추가

2. **PG 설정 메타데이터 스키마 정의** (1일)
   - `TenantPgConfiguration.settings_json` 스키마 문서 작성
   - 온보딩 시 PG 설정 자동 생성 로직 추가

3. **ERP 연동 설정 메타데이터** (2일)
   - ERP 연동 설정 스키마 정의
   - 온보딩 시 업종별 ERP 기본 설정 자동 생성

4. **온보딩 플로우 메타데이터 스키마 정의** (1일)
   - 온보딩 플로우 스키마 문서 작성
   - 업종별 온보딩 플로우 기본값 설정

5. **컴포넌트 활성화 메타데이터 스키마 정의** (1일)
   - 컴포넌트 설정 스키마 문서 작성
   - 업종별 기본 컴포넌트 설정 자동 생성

**참고**: 입점사 모니터링 시스템은 온보딩 완료 후 실제 서비스 사용 시점에 필수이므로, 온보딩 플로우와 함께 구현하는 것이 좋습니다.

---

### ⚠️ P1 - 중간 우선순위 (서비스 개선)

**예상 시간**: 3-4주

1. **이메일 설정 메타데이터** (2일)
2. **Feature Flag 통합 메타데이터** (3일)
3. **메타데이터 검증 시스템** (2일)
4. **외부 시스템 연동 관리 시스템** (3일)
5. **감사(Audit) 로깅 메타데이터** (2일)
6. **백업/복구 설정 메타데이터** (2일)
7. **보안 설정 메타데이터 확장** (3일)
8. **알림 채널 설정 메타데이터** (2일)
9. **웹훅 설정 메타데이터** (2일)
10. **API 키/인증 설정 메타데이터** (2일)
11. **데이터 보존 정책 메타데이터** (2일)

---

### ⚠️ P2 - 낮은 우선순위 (장기 운영)

**예상 시간**: 2-3주

1. **PL/SQL 프로시저 연동 메타데이터** (2일)
2. **메타데이터 버전 관리 시스템** (5일)
3. **메타데이터 마이그레이션 시스템** (5일)
4. **다국어/지역화 설정 메타데이터** (3일)
5. **테넌트별 커스터마이징 설정 확장** (2일)

---

## 📝 다음 단계

### 1월 심사/발표 준비 (즉시 시작)

1. **온보딩 플로우 완성** (최우선)
   - 온보딩 요청 생성 → 승인 → 테넌트 생성 전체 플로우 테스트
   - 관리자 계정 생성 확인
   - 기본 역할 템플릿 적용 확인

2. **기본 대시보드 구현**
   - 역할별 대시보드 라우팅
   - 기본 위젯 3-5개 구현 (통계, 일정, 알림)
   - 대시보드 레이아웃 기본 구조

3. **테넌트 초기화 메타데이터 최소 구현**
   - `Tenant.settings_json` 기본 구조만 정의
   - 온보딩 시 기본값 자동 생성

4. **데모 시나리오 준비**
   - 데모 데이터 준비
   - 데모 스크립트 작성
   - PPT 발표 자료 준비

### 장기 계획 (심사 후)

1. **P0 작업 완성**: 테넌트 초기화 메타데이터 스키마 정의부터 시작
2. **문서화**: 각 메타데이터 스키마에 대한 상세 문서 작성
3. **테스트**: 온보딩 플로우 전체 테스트 및 검증
4. **통합**: 메타데이터 기반 자동화 로직 통합
5. **P1 작업**: 서비스 개선 작업 단계별 진행

---

## 🔗 관련 문서

- `META_SYSTEM_DASHBOARD_SCHEMA.md` - 대시보드 메타데이터 스키마
- `MASTER_INTEGRATED_PLAN.md` - 종합 마스터 계획
- `ERP_MULTI_TENANT_INTEGRATION_STRATEGY.md` - ERP 멀티 테넌트 전환 전략
- `PLSQL_ERP_INTEGRATION_STATUS.md` - PL/SQL 및 ERP 연동 상태

---

**작성자**: AI Assistant  
**검토 필요**: 메타데이터 스키마 검토 및 승인

