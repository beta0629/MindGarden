# 멀티 비즈니스 타입 시스템 재설계 마스터 플랜

**작성일**: 2025-12-02  
**버전**: 2.0.0  
**목적**: 상담소 표준 기반 다중 업종(학원, 요식업, 병원 등) 지원 시스템 재설계

---

## 📋 목차

1. [현황 분석](#현황-분석)
2. [핵심 문제 정의](#핵심-문제-정의)
3. [위젯 vs 페이지 방식 비교](#위젯-vs-페이지-방식-비교)
4. [제안: 하이브리드 아키텍처](#제안-하이브리드-아키텍처)
5. [비즈니스 타입 확장 계획](#비즈니스-타입-확장-계획)
6. [통합 번들 시스템 재설계](#통합-번들-시스템-재설계)
7. [구현 로드맵](#구현-로드맵)

---

## 📊 현황 분석

### 1. 현재 지원 비즈니스 타입

| 타입 | 코드 | 구현 상태 | 완성도 |
|-----|------|----------|--------|
| **상담소** | `CONSULTATION` | ✅ 완료 | 95% |
| **학원** | `ACADEMY` | ⚠️ 부분 | 60% |
| **병원** | `HOSPITAL` | ❌ 미구현 | 0% |
| **요식업** | `FOOD_SERVICE` | ❌ 미구현 | 0% |
| **소매업** | `RETAIL` | ❌ 미구현 | 0% |

### 2. 현재 시스템 구조

#### A. 데이터베이스 레벨
```sql
-- tenants 테이블
CREATE TABLE tenants (
    tenant_id VARCHAR(36) PRIMARY KEY,
    business_type VARCHAR(50) NOT NULL,  -- CONSULTATION, ACADEMY, HOSPITAL...
    ...
);

-- business_categories 테이블 (이미 존재)
CREATE TABLE business_categories (
    category_id VARCHAR(50) PRIMARY KEY,
    business_type VARCHAR(50) NOT NULL,
    feature_flags_json JSON,
    ...
);
```

#### B. 백엔드 레벨
```java
// TenantContext에서 businessType 관리
public class TenantContext {
    private String tenantId;
    private String businessType;  // CONSULTATION, ACADEMY...
    private Map<String, Object> featureFlags;
}

// 업종별 기능 체크
@RequireBusinessType({"CONSULTATION", "ACADEMY"})
public void someMethod() { ... }
```

#### C. 프론트엔드 레벨
```javascript
// 위젯 레지스트리에서 업종별 위젯 분류
export const WIDGET_REGISTRY = {
  common: [...],  // 모든 업종 공통
  consultation: [...],  // 상담소 전용
  academy: [...],  // 학원 전용
};
```

### 3. 현재 문제점

#### 문제 1: 상담소 중심 설계
- **모든 엔티티가 상담소 기준**: `Consultant`, `Client`, `Consultation`, `ConsultationRecord`
- **학원/병원/요식업은 억지로 매핑**: 
  - 학원: Consultant → Teacher, Client → Student
  - 병원: Consultant → Doctor, Client → Patient
  - 요식업: Consultant → Chef, Client → Customer (?)
- **용어 혼란**: 코드는 `Consultant`인데 UI는 "강사", "의사", "셰프"

#### 문제 2: 위젯 시스템의 한계
- **7-10개 위젯이 동일한 API 호출** (중복)
- **업종별 위젯 분기 복잡**: `if (businessType === 'CONSULTATION') { ... }`
- **위젯 간 데이터 동기화 어려움**
- **성능 문제**: 10회 API 호출

#### 문제 3: 확장성 부족
- **새 업종 추가 시 전체 수정 필요**:
  - 엔티티 추가
  - API 추가
  - 위젯 추가
  - 라우팅 추가
- **하드코딩된 분기 로직 많음**

---

## 🎯 핵심 문제 정의

### 사용자 질문 요약

1. **"상담소를 표준으로 학원, 요식업, 병원 등 모델을 만들어야 할 것 같아"**
   - 현재: 상담소만 완성, 나머지는 부분 구현
   - 목표: 모든 업종을 동등하게 지원

2. **"비즈니스 타입도 추가해야 될 것 같은데?"**
   - 현재: CONSULTATION, ACADEMY만 실질 지원
   - 목표: HOSPITAL, FOOD_SERVICE, RETAIL 등 추가

3. **"위 문서와 통합으로 개선 계획이 있어야 될 것 같은데?"**
   - 현재: 위젯 의존성 분석 문서 (상담소만)
   - 목표: 모든 업종을 포괄하는 통합 계획

4. **"위젯 방식이 의미가 있나 하는 생각도 들긴 해"**
   - 현재: 위젯 기반 대시보드 (복잡, 중복 많음)
   - 고민: 페이지 기반으로 전환? 하이브리드?

---

## 🔍 위젯 vs 페이지 방식 비교

### 1. 위젯 방식 (현재)

#### 장점 ✅
- **유연성**: 사용자가 위젯 배치 커스터마이징 가능
- **재사용성**: 동일 위젯을 여러 대시보드에서 사용
- **모듈화**: 위젯 단위로 독립 개발 가능
- **실시간 업데이트**: 위젯별 새로고침 간격 설정

#### 단점 ❌
- **복잡성**: 위젯 간 데이터 공유 어려움
- **성능**: 중복 API 호출 (10회 → 3회로 개선 필요)
- **유지보수**: 위젯별 상태 관리 복잡
- **업종별 분기**: 각 위젯마다 `if (businessType)` 로직

#### 현재 구조
```
AdminDashboard
├─ WelcomeWidget (API 호출 1)
├─ SummaryPanelsWidget (API 호출 2)
├─ StatisticsGridWidget (API 호출 3-7)
├─ ErpManagementWidget (API 호출 8-10)
├─ ConsultationSummaryWidget
├─ SessionManagementWidget
└─ RecentActivitiesWidget

총 10회 API 호출
각 위젯이 독립적으로 데이터 로드
```

---

### 2. 페이지 방식 (대안)

#### 장점 ✅
- **단순성**: 페이지 단위로 데이터 로드 (1-2회 API 호출)
- **성능**: 데이터 중복 없음
- **명확성**: 업종별 페이지 분리 명확
- **유지보수**: 페이지 단위로 관리 쉬움

#### 단점 ❌
- **유연성 부족**: 사용자 커스터마이징 불가
- **재사용성 낮음**: 페이지 간 컴포넌트 중복
- **확장성**: 새 기능 추가 시 페이지 전체 수정
- **사용자 경험**: 전통적인 메뉴 기반 (덜 현대적)

#### 예시 구조
```
/admin/dashboard
  → 단일 API 호출로 모든 데이터 로드
  → 페이지 내에서 섹션별로 표시
  
/admin/consultants
  → 상담사 관리 전용 페이지
  
/admin/clients
  → 내담자 관리 전용 페이지
```

---

### 3. 하이브리드 방식 (제안) ⭐

#### 핵심 아이디어
- **대시보드는 위젯 기반** (유연성 유지)
- **기능 페이지는 전통 페이지** (단순성 확보)
- **업종별 번들 시스템** (성능 최적화)

#### 구조
```
┌─────────────────────────────────────────────┐
│           대시보드 (위젯 기반)                │
│  - 업종별 번들 시스템 (단일 API 호출)         │
│  - 위젯은 번들 데이터 공유                    │
│  - 사용자 커스터마이징 가능                   │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│         기능 페이지 (전통 페이지)             │
│  - 상담사 관리 페이지                        │
│  - 내담자 관리 페이지                        │
│  - 일정 관리 페이지                          │
│  - ERP 관리 페이지                           │
└─────────────────────────────────────────────┘
```

#### 장점 ✅
- ✅ 대시보드: 유연성 + 성능 (번들 시스템)
- ✅ 기능 페이지: 단순성 + 명확성
- ✅ 업종별 분리: 명확한 구조
- ✅ 확장성: 새 업종 추가 용이

---

## 🏗️ 제안: 하이브리드 아키텍처

### 1. 업종별 번들 시스템

#### 상담소 번들 (Consultation Bundle)
```javascript
const ConsultationBundle = {
  id: 'consultation-bundle',
  businessType: 'CONSULTATION',
  
  // 단일 API 호출
  coreAPI: '/api/consultation/core-bundle',
  
  // 제공 데이터
  provides: {
    entities: ['consultants', 'clients', 'consultations', 'sessions'],
    stats: ['totalConsultants', 'totalClients', 'todaySchedules'],
    erp: ['revenue', 'pendingPayments']
  },
  
  // 위젯 목록
  widgets: [
    'welcome',
    'summary-panels',
    'statistics-grid',
    'consultation-summary',
    'session-management',
    'recent-activities'
  ],
  
  // 기능 페이지
  pages: [
    '/consultants',
    '/clients',
    '/consultations',
    '/sessions',
    '/schedules'
  ]
};
```

#### 학원 번들 (Academy Bundle)
```javascript
const AcademyBundle = {
  id: 'academy-bundle',
  businessType: 'ACADEMY',
  
  // 단일 API 호출
  coreAPI: '/api/academy/core-bundle',
  
  // 제공 데이터
  provides: {
    entities: ['teachers', 'students', 'courses', 'classes', 'parents'],
    stats: ['totalTeachers', 'totalStudents', 'todayClasses'],
    billing: ['tuitionRevenue', 'pendingPayments']
  },
  
  // 위젯 목록
  widgets: [
    'welcome',
    'summary-panels',
    'statistics-grid',
    'class-summary',
    'attendance-management',
    'recent-activities'
  ],
  
  // 기능 페이지
  pages: [
    '/teachers',
    '/students',
    '/courses',
    '/classes',
    '/attendance',
    '/grades'
  ]
};
```

#### 병원 번들 (Hospital Bundle)
```javascript
const HospitalBundle = {
  id: 'hospital-bundle',
  businessType: 'HOSPITAL',
  
  // 단일 API 호출
  coreAPI: '/api/hospital/core-bundle',
  
  // 제공 데이터
  provides: {
    entities: ['doctors', 'patients', 'appointments', 'treatments'],
    stats: ['totalDoctors', 'totalPatients', 'todayAppointments'],
    billing: ['medicalRevenue', 'insuranceClaims']
  },
  
  // 위젯 목록
  widgets: [
    'welcome',
    'summary-panels',
    'statistics-grid',
    'appointment-summary',
    'treatment-management',
    'recent-activities'
  ],
  
  // 기능 페이지
  pages: [
    '/doctors',
    '/patients',
    '/appointments',
    '/treatments',
    '/prescriptions',
    '/medical-records'
  ]
};
```

#### 요식업 번들 (Restaurant Bundle)
```javascript
const RestaurantBundle = {
  id: 'restaurant-bundle',
  businessType: 'FOOD_SERVICE',
  
  // 단일 API 호출
  coreAPI: '/api/restaurant/core-bundle',
  
  // 제공 데이터
  provides: {
    entities: ['staff', 'customers', 'menus', 'orders', 'tables'],
    stats: ['totalStaff', 'todayOrders', 'tableOccupancy'],
    pos: ['dailySales', 'popularMenus']
  },
  
  // 위젯 목록
  widgets: [
    'welcome',
    'summary-panels',
    'statistics-grid',
    'order-summary',
    'table-management',
    'recent-activities'
  ],
  
  // 기능 페이지
  pages: [
    '/staff',
    '/menus',
    '/orders',
    '/tables',
    '/inventory',
    '/pos'
  ]
};
```

---

### 2. 공통 추상화 레이어

#### A. 엔티티 추상화

**문제**: 현재 모든 엔티티가 상담소 중심
```java
// 현재 (상담소 전용)
public class Consultant { ... }
public class Client { ... }
public class Consultation { ... }
```

**해결**: 공통 인터페이스 + 업종별 구현
```java
// 공통 인터페이스
public interface ServiceProvider {
    String getProviderId();
    String getProviderType();  // CONSULTANT, TEACHER, DOCTOR, CHEF
    String getName();
    String getSpecialty();
}

public interface ServiceReceiver {
    String getReceiverId();
    String getReceiverType();  // CLIENT, STUDENT, PATIENT, CUSTOMER
    String getName();
}

public interface ServiceSession {
    String getSessionId();
    ServiceProvider getProvider();
    ServiceReceiver getReceiver();
    LocalDateTime getSessionDate();
    String getStatus();
}

// 상담소 구현
@Entity
@Table(name = "consultants")
public class Consultant implements ServiceProvider {
    @Override
    public String getProviderType() {
        return "CONSULTANT";
    }
}

@Entity
@Table(name = "clients")
public class Client implements ServiceReceiver {
    @Override
    public String getReceiverType() {
        return "CLIENT";
    }
}

// 학원 구현
@Entity
@Table(name = "teachers")
public class Teacher implements ServiceProvider {
    @Override
    public String getProviderType() {
        return "TEACHER";
    }
}

@Entity
@Table(name = "students")
public class Student implements ServiceReceiver {
    @Override
    public String getReceiverType() {
        return "STUDENT";
    }
}

// 병원 구현
@Entity
@Table(name = "doctors")
public class Doctor implements ServiceProvider {
    @Override
    public String getProviderType() {
        return "DOCTOR";
    }
}

@Entity
@Table(name = "patients")
public class Patient implements ServiceReceiver {
    @Override
    public String getReceiverType() {
        return "PATIENT";
    }
}
```

#### B. 서비스 추상화

```java
// 공통 서비스 인터페이스
public interface BusinessBundleService {
    CoreStatsDTO getCoreStats(String tenantId);
    UserDataDTO getUserData(String tenantId, Long userId, String userRole);
    BillingDataDTO getBillingData(String tenantId);
}

// 상담소 구현
@Service
public class ConsultationBundleService implements BusinessBundleService {
    @Override
    public CoreStatsDTO getCoreStats(String tenantId) {
        return CoreStatsDTO.builder()
                .totalProviders(consultantRepository.countByTenantId(tenantId))
                .totalReceivers(clientRepository.countByTenantId(tenantId))
                .totalSessions(consultationRepository.countByTenantId(tenantId))
                .build();
    }
}

// 학원 구현
@Service
public class AcademyBundleService implements BusinessBundleService {
    @Override
    public CoreStatsDTO getCoreStats(String tenantId) {
        return CoreStatsDTO.builder()
                .totalProviders(teacherRepository.countByTenantId(tenantId))
                .totalReceivers(studentRepository.countByTenantId(tenantId))
                .totalSessions(classRepository.countByTenantId(tenantId))
                .build();
    }
}
```

#### C. 컨트롤러 추상화

```java
// 공통 번들 컨트롤러
@RestController
@RequestMapping("/api/bundle")
public class BusinessBundleController {
    
    @Autowired
    private Map<String, BusinessBundleService> bundleServices;
    
    @GetMapping("/core-stats")
    public ApiResponse<CoreStatsDTO> getCoreStats(
            @RequestParam String tenantId
    ) {
        // 테넌트의 businessType 조회
        String businessType = tenantService.getBusinessType(tenantId);
        
        // 업종별 서비스 선택
        BusinessBundleService service = bundleServices.get(businessType.toLowerCase() + "BundleService");
        
        if (service == null) {
            return ApiResponse.error("지원하지 않는 업종입니다: " + businessType);
        }
        
        CoreStatsDTO stats = service.getCoreStats(tenantId);
        return ApiResponse.success(stats);
    }
}
```

---

### 3. 프론트엔드 번들 시스템

#### A. 번들 레지스트리

```javascript
// frontend/src/bundles/BundleRegistry.js

export const BUSINESS_BUNDLES = {
  CONSULTATION: {
    id: 'consultation',
    name: '상담소',
    coreAPI: '/api/bundle/core-stats',
    entities: {
      provider: { name: '상담사', plural: '상담사들', route: '/consultants' },
      receiver: { name: '내담자', plural: '내담자들', route: '/clients' },
      session: { name: '상담', plural: '상담들', route: '/consultations' }
    },
    widgets: [
      'welcome',
      'summary-panels',
      'statistics-grid',
      'consultation-summary',
      'session-management',
      'recent-activities',
      'erp-management'
    ]
  },
  
  ACADEMY: {
    id: 'academy',
    name: '학원',
    coreAPI: '/api/bundle/core-stats',
    entities: {
      provider: { name: '강사', plural: '강사들', route: '/teachers' },
      receiver: { name: '학생', plural: '학생들', route: '/students' },
      session: { name: '수업', plural: '수업들', route: '/classes' },
      extra: { name: '학부모', plural: '학부모들', route: '/parents' }
    },
    widgets: [
      'welcome',
      'summary-panels',
      'statistics-grid',
      'class-summary',
      'attendance-management',
      'grade-management',
      'recent-activities',
      'billing-management'
    ]
  },
  
  HOSPITAL: {
    id: 'hospital',
    name: '병원',
    coreAPI: '/api/bundle/core-stats',
    entities: {
      provider: { name: '의사', plural: '의사들', route: '/doctors' },
      receiver: { name: '환자', plural: '환자들', route: '/patients' },
      session: { name: '진료', plural: '진료들', route: '/appointments' }
    },
    widgets: [
      'welcome',
      'summary-panels',
      'statistics-grid',
      'appointment-summary',
      'treatment-management',
      'prescription-management',
      'recent-activities',
      'medical-billing'
    ]
  },
  
  FOOD_SERVICE: {
    id: 'restaurant',
    name: '요식업',
    coreAPI: '/api/bundle/core-stats',
    entities: {
      provider: { name: '직원', plural: '직원들', route: '/staff' },
      receiver: { name: '고객', plural: '고객들', route: '/customers' },
      session: { name: '주문', plural: '주문들', route: '/orders' }
    },
    widgets: [
      'welcome',
      'summary-panels',
      'statistics-grid',
      'order-summary',
      'table-management',
      'menu-management',
      'recent-activities',
      'pos-integration'
    ]
  }
};
```

#### B. 번들 훅

```javascript
// frontend/src/hooks/useBusinessBundle.js

export const useBusinessBundle = (user) => {
  const businessType = user?.tenant?.businessType || 'CONSULTATION';
  const bundleConfig = BUSINESS_BUNDLES[businessType];
  
  if (!bundleConfig) {
    throw new Error(`지원하지 않는 업종: ${businessType}`);
  }
  
  // 단일 API 호출로 모든 데이터 로드
  const { data, loading, error, refresh } = useWidget({
    dataSource: {
      type: 'api',
      url: bundleConfig.coreAPI,
      params: { tenantId: user?.tenantId },
      cache: true,
      refreshInterval: 30000
    }
  }, user);
  
  return {
    bundle: bundleConfig,
    data,
    loading,
    error,
    refresh,
    
    // 헬퍼 메서드
    getEntityName: (type) => bundleConfig.entities[type]?.name,
    getEntityRoute: (type) => bundleConfig.entities[type]?.route,
    isWidgetAvailable: (widgetType) => bundleConfig.widgets.includes(widgetType)
  };
};
```

#### C. 범용 위젯

```javascript
// frontend/src/components/dashboard/widgets/UniversalWelcomeWidget.js

const UniversalWelcomeWidget = ({ widget, user }) => {
  const { bundle, data, loading, error } = useBusinessBundle(user);
  
  if (loading) return <Loading />;
  if (error) return <Error message={error} />;
  
  const providerName = bundle.getEntityName('provider');
  const receiverName = bundle.getEntityName('receiver');
  
  return (
    <BaseWidget widget={widget} user={user}>
      <h2>환영합니다, {user.name}님!</h2>
      <p>오늘 {bundle.entities.session.name}: {data.todaySessions}건</p>
      <p>총 {providerName}: {data.totalProviders}명</p>
      <p>총 {receiverName}: {data.totalReceivers}명</p>
    </BaseWidget>
  );
};
```

---

## 📊 비즈니스 타입 확장 계획

### 1. 추가할 비즈니스 타입

| 순번 | 타입 | 코드 | 우선순위 | 예상 기간 |
|-----|------|------|---------|----------|
| 1 | **병원** | `HOSPITAL` | 높음 | 3주 |
| 2 | **요식업** | `FOOD_SERVICE` | 중간 | 2주 |
| 3 | **소매업** | `RETAIL` | 낮음 | 2주 |
| 4 | **피트니스** | `FITNESS` | 낮음 | 2주 |
| 5 | **미용실** | `BEAUTY` | 낮음 | 1주 |

### 2. 업종별 핵심 엔티티 매핑

| 공통 개념 | 상담소 | 학원 | 병원 | 요식업 | 소매업 |
|----------|--------|------|------|--------|--------|
| **서비스 제공자** | 상담사 | 강사 | 의사 | 직원 | 판매원 |
| **서비스 수혜자** | 내담자 | 학생 | 환자 | 고객 | 고객 |
| **세션/거래** | 상담 | 수업 | 진료 | 주문 | 판매 |
| **기록** | 상담기록 | 수업일지 | 진료기록 | 주문내역 | 판매내역 |
| **일정** | 상담일정 | 수업일정 | 진료예약 | 예약 | - |
| **결제** | 상담료 | 수강료 | 진료비 | 주문금액 | 판매금액 |
| **추가 엔티티** | 회기 | 학부모, 성적 | 처방전, 검사 | 메뉴, 테이블 | 재고, 상품 |

### 3. 데이터베이스 마이그레이션 전략

#### 옵션 A: 업종별 테이블 (현재 방식)
```sql
-- 상담소
CREATE TABLE consultants (...);
CREATE TABLE clients (...);
CREATE TABLE consultations (...);

-- 학원
CREATE TABLE teachers (...);
CREATE TABLE students (...);
CREATE TABLE classes (...);

-- 병원
CREATE TABLE doctors (...);
CREATE TABLE patients (...);
CREATE TABLE appointments (...);
```

**장점**: 명확한 분리, 업종별 특화 필드 추가 용이  
**단점**: 테이블 수 폭증, 공통 로직 중복

#### 옵션 B: 통합 테이블 + 타입 필드 (제안) ⭐
```sql
-- 서비스 제공자 (상담사, 강사, 의사, 직원 등)
CREATE TABLE service_providers (
    provider_id BIGINT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    provider_type VARCHAR(50) NOT NULL,  -- CONSULTANT, TEACHER, DOCTOR, STAFF
    name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100),
    business_specific_data JSON,  -- 업종별 특화 데이터
    ...
);

-- 서비스 수혜자 (내담자, 학생, 환자, 고객 등)
CREATE TABLE service_receivers (
    receiver_id BIGINT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    receiver_type VARCHAR(50) NOT NULL,  -- CLIENT, STUDENT, PATIENT, CUSTOMER
    name VARCHAR(100) NOT NULL,
    business_specific_data JSON,
    ...
);

-- 세션/거래 (상담, 수업, 진료, 주문 등)
CREATE TABLE service_sessions (
    session_id BIGINT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    session_type VARCHAR(50) NOT NULL,  -- CONSULTATION, CLASS, APPOINTMENT, ORDER
    provider_id BIGINT,
    receiver_id BIGINT,
    session_date DATETIME,
    status VARCHAR(20),
    business_specific_data JSON,
    ...
);
```

**장점**: 테이블 수 최소화, 공통 로직 재사용, 확장 용이  
**단점**: JSON 필드 사용, 복잡한 쿼리

#### 옵션 C: 하이브리드 (권장) ⭐⭐
```sql
-- 공통 테이블 (모든 업종)
CREATE TABLE service_providers (...);  -- 공통 필드만
CREATE TABLE service_receivers (...);
CREATE TABLE service_sessions (...);

-- 업종별 확장 테이블
CREATE TABLE consultant_details (
    provider_id BIGINT PRIMARY KEY,
    license_number VARCHAR(50),
    specialties JSON,
    ...
    FOREIGN KEY (provider_id) REFERENCES service_providers(provider_id)
);

CREATE TABLE teacher_details (
    provider_id BIGINT PRIMARY KEY,
    subjects JSON,
    education_level VARCHAR(50),
    ...
    FOREIGN KEY (provider_id) REFERENCES service_providers(provider_id)
);

CREATE TABLE doctor_details (
    provider_id BIGINT PRIMARY KEY,
    medical_license VARCHAR(50),
    departments JSON,
    ...
    FOREIGN KEY (provider_id) REFERENCES service_providers(provider_id)
);
```

**장점**: 공통 + 특화 균형, 쿼리 성능 좋음, 확장 용이  
**단점**: 테이블 수 증가 (하지만 관리 가능)

---

## 🚀 구현 로드맵

### Phase 0: 설계 및 합의 (1주)
- [ ] 아키텍처 최종 확정
- [ ] 데이터베이스 스키마 설계
- [ ] API 명세 작성
- [ ] 프론트엔드 컴포넌트 구조 설계
- [ ] 팀 리뷰 및 승인

### Phase 1: 공통 추상화 레이어 구축 (2주)
- [ ] **백엔드**:
  - [ ] `ServiceProvider`, `ServiceReceiver`, `ServiceSession` 인터페이스
  - [ ] `BusinessBundleService` 인터페이스
  - [ ] `BusinessBundleController` 공통 컨트롤러
  - [ ] 데이터베이스 마이그레이션 (하이브리드 방식)
- [ ] **프론트엔드**:
  - [ ] `BundleRegistry` 생성
  - [ ] `useBusinessBundle` 훅
  - [ ] 범용 위젯 템플릿 (UniversalWelcomeWidget 등)

### Phase 2: 상담소 번들 마이그레이션 (2주)
- [ ] 기존 상담소 코드를 번들 시스템으로 마이그레이션
- [ ] `ConsultationBundleService` 구현
- [ ] 상담소 위젯 7개를 범용 위젯으로 전환
- [ ] 통합 테스트

### Phase 3: 학원 번들 완성 (2주)
- [ ] `AcademyBundleService` 구현
- [ ] 학원 전용 엔티티 (Teacher, Student, Class)
- [ ] 학원 위젯 구현
- [ ] 학부모 기능 추가
- [ ] 출석/성적 관리 기능

### Phase 4: 병원 번들 구현 (3주)
- [ ] `HospitalBundleService` 구현
- [ ] 병원 전용 엔티티 (Doctor, Patient, Appointment)
- [ ] 병원 위젯 구현
- [ ] 진료기록, 처방전 기능
- [ ] 의료보험 청구 기능

### Phase 5: 요식업 번들 구현 (2주)
- [ ] `RestaurantBundleService` 구현
- [ ] 요식업 전용 엔티티 (Staff, Customer, Order)
- [ ] 요식업 위젯 구현
- [ ] 메뉴 관리, 테이블 관리
- [ ] POS 연동

### Phase 6: 소매업 번들 구현 (2주)
- [ ] `RetailBundleService` 구현
- [ ] 소매업 전용 엔티티 (Staff, Customer, Sale)
- [ ] 소매업 위젯 구현
- [ ] 재고 관리, 상품 관리
- [ ] POS 연동

### Phase 7: 최적화 및 문서화 (1주)
- [ ] 성능 최적화
- [ ] 전체 통합 테스트
- [ ] 사용자 가이드 작성
- [ ] API 문서 업데이트

**총 소요 시간**: 약 15주 (3.5개월)

---

## 📊 기대 효과

### 1. 성능 개선

| 지표 | 현재 (상담소만) | 개선 (모든 업종) | 개선율 |
|-----|----------------|-----------------|--------|
| API 호출 수 | 10회 | 3회 | **70% 감소** |
| 로딩 시간 | 2초 | 0.5초 | **75% 단축** |
| 코드 중복 | 높음 | 낮음 | **80% 감소** |

### 2. 확장성 개선

| 항목 | 현재 | 개선 |
|-----|------|------|
| 새 업종 추가 시간 | 4주 | **1주** |
| 코드 수정 범위 | 전체 | **번들만** |
| 테스트 범위 | 전체 | **번들만** |

### 3. 유지보수성 개선

| 항목 | 현재 | 개선 |
|-----|------|------|
| 업종별 분기 로직 | 많음 | **최소화** |
| 공통 로직 재사용 | 낮음 | **높음** |
| 코드 가독성 | 중간 | **높음** |

---

## 🎯 결론 및 권장 사항

### 핵심 결정 사항

#### 1. 위젯 vs 페이지?
**답**: **하이브리드 방식** ⭐
- 대시보드: 위젯 기반 (유연성)
- 기능 페이지: 전통 페이지 (단순성)
- 번들 시스템: 성능 최적화

#### 2. 데이터베이스 구조?
**답**: **하이브리드 방식** ⭐
- 공통 테이블: `service_providers`, `service_receivers`, `service_sessions`
- 확장 테이블: `consultant_details`, `teacher_details`, `doctor_details`

#### 3. 우선순위?
**답**: **단계적 구현**
1. Phase 1-2: 공통 레이어 + 상담소 마이그레이션 (4주)
2. Phase 3: 학원 완성 (2주)
3. Phase 4: 병원 구현 (3주)
4. Phase 5-6: 요식업, 소매업 (4주)

### 즉시 시작 가능

**Phase 0 (설계 및 합의)**부터 시작하여 팀 리뷰 후 본격 구현을 권장합니다.

### 기대 효과 요약

- ✅ **성능**: 70% 향상
- ✅ **확장성**: 새 업종 추가 시간 75% 단축
- ✅ **유지보수성**: 코드 중복 80% 감소
- ✅ **사용자 경험**: 업종별 맞춤 UI
- ✅ **비즈니스 가치**: 5개 업종 지원 → 시장 확대

---

**최종 업데이트**: 2025-12-02  
**작성자**: CoreSolution Team  
**상태**: ✅ 설계 완료, 팀 리뷰 대기

---

## 📎 관련 문서

1. [상담소 위젯 의존성 분석](./CONSULTATION_CENTER_WIDGET_DEPENDENCY_ANALYSIS.md)
2. [비즈니스 타입 시스템](../../architecture/BUSINESS_TYPE_SYSTEM.md)
3. [업종별 컴포넌트 분리](../2025-11-26/BUSINESS_TYPE_COMPONENT_SEPARATION.md)
4. [테넌트 역할 시스템](../../standards/TENANT_ROLE_SYSTEM_STANDARD.md)

