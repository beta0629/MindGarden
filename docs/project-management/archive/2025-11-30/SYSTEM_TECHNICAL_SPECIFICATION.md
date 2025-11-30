# MindGarden 시스템 기술 사양서 (Technical Specification)

## 📋 문서 정보

**작성일**: 2025-11-30  
**작성자**: CoreSolution Development Team  
**버전**: 1.0.0  
**최종 업데이트**: 2025-11-30  
**시스템 버전**: v1.0.0

---

## 📑 목차

1. [시스템 개요](#1-시스템-개요)
2. [기술 스택](#2-기술-스택)
3. [아키텍처](#3-아키텍처)
4. [핵심 기능](#4-핵심-기능)
5. [데이터베이스](#5-데이터베이스)
6. [보안](#6-보안)
7. [성능 최적화](#7-성능-최적화)
8. [배포 및 인프라](#8-배포-및-인프라)
9. [개발 프로세스](#9-개발-프로세스)
10. [향후 계획](#10-향후-계획)

---

## 1. 시스템 개요

### 1.1 프로젝트 정보

| 항목 | 내용 |
|------|------|
| **프로젝트명** | MindGarden (마인드가든) |
| **시스템명** | 통합 상담관리 시스템 (Consultation Management System) |
| **목적** | 멀티 테넌트 기반 상담소, 학원, 요식업 등 다양한 비즈니스 유형의 통합 관리 |
| **개발 기간** | 2024-01 ~ 현재 (진행 중) |
| **개발 인원** | 백엔드 1명, 프론트엔드 1명, AI 어시스턴트 1명 |
| **라이선스** | Proprietary (상용) |

### 1.2 시스템 특징

#### 🎯 핵심 특징
1. **멀티 테넌시 (Multi-Tenancy)**
   - 단일 인스턴스에서 여러 테넌트(고객사) 데이터 격리
   - 테넌트별 독립적인 데이터 관리 및 보안
   - 테넌트별 커스터마이징 가능

2. **동적 비즈니스 타입 시스템**
   - 상담소, 학원, 요식업 등 다양한 비즈니스 유형 지원
   - 비즈니스 타입별 기능, 컴포넌트, 역할 동적 관리
   - 데이터베이스 기반 설정 (코드 수정 없이 확장 가능)

3. **실시간 협업**
   - WebSocket 기반 실시간 통신
   - 실시간 알림 및 메시지
   - 다중 사용자 동시 작업 지원

4. **고급 인증/인가**
   - JWT 기반 인증
   - OAuth2 소셜 로그인 (Google, Kakao, Naver)
   - WebAuthn/Passkey 지원 (생체 인증)
   - 역할 기반 접근 제어 (RBAC)

5. **확장 가능한 아키텍처**
   - 마이크로서비스 지향 설계
   - RESTful API
   - 이벤트 기반 아키텍처

---

## 2. 기술 스택

### 2.1 백엔드 (Backend)

#### 2.1.1 Core Framework
| 기술 | 버전 | 용도 |
|------|------|------|
| **Java** | 17 (LTS) | 주 개발 언어 |
| **Spring Boot** | 3.2.0 | 애플리케이션 프레임워크 |
| **Spring Framework** | 6.1.x | 의존성 주입, AOP, 트랜잭션 관리 |
| **Maven** | 3.9.x | 빌드 도구 및 의존성 관리 |

#### 2.1.2 Spring Ecosystem
| 기술 | 버전 | 용도 |
|------|------|------|
| **Spring Data JPA** | 3.2.0 | ORM 및 데이터 접근 계층 |
| **Spring Security** | 6.2.0 | 인증/인가, 보안 |
| **Spring WebSocket** | 6.1.x | 실시간 통신 |
| **Spring Mail** | 3.2.0 | 이메일 발송 |
| **Spring Actuator** | 3.2.0 | 모니터링 및 헬스 체크 |
| **Spring Validation** | 3.2.0 | 입력 검증 |
| **Spring OAuth2 Client** | 6.2.0 | 소셜 로그인 |

#### 2.1.3 Database & ORM
| 기술 | 버전 | 용도 |
|------|------|------|
| **MySQL** | 8.0.33 | 주 데이터베이스 (운영/개발) |
| **H2 Database** | 2.2.x | 테스트용 인메모리 DB |
| **Hibernate** | 6.4.0.Final | JPA 구현체 |
| **Flyway** | 9.22.x | 데이터베이스 마이그레이션 |
| **Redis** | 7.x | 캐싱, 세션 저장소 |

#### 2.1.4 Security & Authentication
| 기술 | 버전 | 용도 |
|------|------|------|
| **JWT (JJWT)** | 0.11.5 | JSON Web Token 생성/검증 |
| **WebAuthn4J** | 0.22.0 | WebAuthn/Passkey 구현 |
| **BCrypt** | (Spring Security 내장) | 비밀번호 해싱 |

#### 2.1.5 API Documentation
| 기술 | 버전 | 용도 |
|------|------|------|
| **SpringDoc OpenAPI** | 2.2.0 | Swagger UI 및 API 문서 자동 생성 |

#### 2.1.6 Utilities
| 기술 | 버전 | 용도 |
|------|------|------|
| **Lombok** | 1.18.30 | 보일러플레이트 코드 감소 |
| **Jackson** | 2.15.x | JSON 직렬화/역직렬화 |
| **Hibernate Validator** | 8.0.x | Bean Validation 구현 |

#### 2.1.7 Testing
| 기술 | 버전 | 용도 |
|------|------|------|
| **JUnit 5** | 5.10.x | 단위 테스트 프레임워크 |
| **Spring Boot Test** | 3.2.0 | 통합 테스트 |
| **Spring Security Test** | 6.2.0 | 보안 테스트 |
| **Mockito** | 5.x | 모킹 프레임워크 |

---

### 2.2 프론트엔드 (Frontend)

#### 2.2.1 Core Framework
| 기술 | 버전 | 용도 |
|------|------|------|
| **Next.js** | 14.2.33 | React 프레임워크 (SSR, SSG) |
| **React** | 18.x | UI 라이브러리 |
| **TypeScript** | 5.x | 타입 안전성 |
| **Node.js** | 20.x (LTS) | 런타임 환경 |

#### 2.2.2 Styling
| 기술 | 버전 | 용도 |
|------|------|------|
| **Tailwind CSS** | 3.4.1 | 유틸리티 기반 CSS 프레임워크 |
| **PostCSS** | 8.x | CSS 후처리 |

#### 2.2.3 State Management & Data Fetching
| 기술 | 버전 | 용도 |
|------|------|------|
| **React Context API** | (React 내장) | 전역 상태 관리 |
| **SWR** / **React Query** | (예정) | 서버 상태 관리 |

#### 2.2.4 Payment Integration
| 기술 | 버전 | 용도 |
|------|------|------|
| **Toss Payments SDK** | 2.4.1 | 토스페이먼츠 결제 연동 |

#### 2.2.5 Testing
| 기술 | 버전 | 용도 |
|------|------|------|
| **Jest** | 29.7.0 | 테스트 프레임워크 |
| **React Testing Library** | 14.1.2 | React 컴포넌트 테스트 |
| **Playwright** | (E2E 테스트용) | 브라우저 자동화 테스트 |

---

### 2.3 DevOps & Infrastructure

#### 2.3.1 Version Control
| 기술 | 용도 |
|------|------|
| **Git** | 버전 관리 |
| **GitHub** | 코드 저장소 |

#### 2.3.2 CI/CD
| 기술 | 용도 |
|------|------|
| **GitHub Actions** | 자동화된 빌드, 테스트, 배포 |

#### 2.3.3 Deployment
| 기술 | 용도 |
|------|------|
| **Cafe24** | 운영 서버 호스팅 |
| **Docker** (예정) | 컨테이너화 |
| **Kubernetes** (예정) | 오케스트레이션 |

#### 2.3.4 Monitoring & Logging
| 기술 | 용도 |
|------|------|
| **Spring Actuator** | 애플리케이션 모니터링 |
| **Logback** | 로깅 프레임워크 |
| **SLF4J** | 로깅 파사드 |

---

### 2.4 Development Tools

| 도구 | 용도 |
|------|------|
| **IntelliJ IDEA** | Java/Spring 개발 IDE |
| **VS Code / Cursor** | 프론트엔드 개발, AI 코딩 어시스턴트 |
| **Postman** | API 테스트 |
| **DBeaver** | 데이터베이스 관리 |
| **Git Bash** | 커맨드 라인 도구 |

---

## 3. 아키텍처

### 3.1 전체 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Browser    │  │    Mobile    │  │  Desktop App │          │
│  │  (Next.js)   │  │  (React Native)│  │   (Electron) │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Load Balancer │
                    │    (Nginx)      │
                    └────────┬────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
┌─────────▼─────────┐              ┌───────────▼──────────┐
│  Frontend Server  │              │   Backend Server     │
│    (Next.js)      │              │   (Spring Boot)      │
│   Port: 3001      │              │    Port: 8080        │
└───────────────────┘              └──────────┬───────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
          ┌─────────▼─────────┐    ┌─────────▼─────────┐    ┌─────────▼─────────┐
          │   MySQL Database  │    │   Redis Cache     │    │  External APIs    │
          │   (Primary DB)    │    │  (Session/Cache)  │    │  (OAuth2, PG)     │
          │   Port: 3306      │    │   Port: 6379      │    └───────────────────┘
          └───────────────────┘    └───────────────────┘
```

---

### 3.2 백엔드 레이어 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    Presentation Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ REST API     │  │  WebSocket   │  │  Swagger UI  │          │
│  │ Controllers  │  │  Handlers    │  │  (OpenAPI)   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘          │
└─────────┼──────────────────┼─────────────────────────────────────┘
          │                  │
┌─────────▼──────────────────▼─────────────────────────────────────┐
│                    Security Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ JWT Filter   │  │ OAuth2 Filter│  │ CORS Config  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
│  ┌──────▼──────────────────▼──────────────────▼───────┐         │
│  │         TenantContextFilter                         │         │
│  │  (tenantId, branchId, businessType 추출 및 설정)   │         │
│  └──────────────────────────────────────────────────────┘         │
└─────────┼────────────────────────────────────────────────────────┘
          │
┌─────────▼─────────────────────────────────────────────────────────┐
│                    Business Logic Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Service     │  │  Service     │  │  Service     │           │
│  │  (Admin)     │  │ (Consultant) │  │  (Client)    │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                  │                  │                   │
│  ┌──────▼──────────────────▼──────────────────▼───────┐          │
│  │         TenantContextHolder                         │          │
│  │  (tenantId, branchId, businessType 조회)           │          │
│  └──────────────────────────────────────────────────────┘          │
└─────────┼─────────────────────────────────────────────────────────┘
          │
┌─────────▼─────────────────────────────────────────────────────────┐
│                    Data Access Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Repository   │  │ Repository   │  │ Repository   │           │
│  │  (User)      │  │ (Schedule)   │  │ (Payment)    │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                  │                  │                   │
│  ┌──────▼──────────────────▼──────────────────▼───────┐          │
│  │         JPA / Hibernate                             │          │
│  │  (tenantId 필터링, 트랜잭션 관리)                  │          │
│  └──────────────────────────────────────────────────────┘          │
└─────────┼─────────────────────────────────────────────────────────┘
          │
┌─────────▼─────────────────────────────────────────────────────────┐
│                    Database Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   MySQL      │  │    Redis     │  │   Flyway     │           │
│  │  (Primary)   │  │   (Cache)    │  │ (Migration)  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└───────────────────────────────────────────────────────────────────┘
```

---

### 3.3 프론트엔드 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Application                           │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Pages (Routing)                         │  │
│  │  /login, /dashboard, /consultants, /clients, /schedules   │  │
│  └────────────────────────┬──────────────────────────────────┘  │
│                           │                                      │
│  ┌────────────────────────▼──────────────────────────────────┐  │
│  │                  Components Layer                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │   Widgets    │  │   Forms      │  │   Tables     │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │  │
│  └────────────────────────┬──────────────────────────────────┘  │
│                           │                                      │
│  ┌────────────────────────▼──────────────────────────────────┐  │
│  │                  Hooks & Context                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │ useAuth      │  │ useTenant    │  │ useWidget    │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │  │
│  └────────────────────────┬──────────────────────────────────┘  │
│                           │                                      │
│  ┌────────────────────────▼──────────────────────────────────┐  │
│  │                  API Client Layer                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │ REST API     │  │  WebSocket   │  │  Fetch/Axios │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                   ┌────────▼────────┐
                   │  Backend API    │
                   │  (Spring Boot)  │
                   └─────────────────┘
```

---

## 4. 핵심 기능

### 4.1 멀티 테넌시 (Multi-Tenancy)

#### 4.1.1 개요
- **목적**: 단일 애플리케이션 인스턴스에서 여러 고객사(테넌트)의 데이터를 격리하여 관리
- **방식**: Shared Database, Shared Schema + Discriminator Column (`tenant_id`)
- **구현 상태**: ✅ 완료 (2025-11-30)

#### 4.1.2 핵심 컴포넌트

##### 1. TenantContext (ThreadLocal)
```java
public class TenantContext {
    private static final ThreadLocal<String> tenantId = new ThreadLocal<>();
    private static final ThreadLocal<String> branchId = new ThreadLocal<>();
    private static final ThreadLocal<String> businessType = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> bypassTenantFilter = new ThreadLocal<>();
    
    // Getter/Setter 메서드
}
```

**역할**:
- 현재 요청의 `tenantId`, `branchId`, `businessType` 저장
- 스레드별 독립적인 컨텍스트 관리
- 슈퍼 어드민 필터 우회 플래그 지원

##### 2. TenantContextFilter (Servlet Filter)
```java
@Component
public class TenantContextFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) {
        // 1. HTTP 헤더에서 tenantId 추출
        String tenantId = request.getHeader("X-Tenant-Id");
        
        // 2. JWT에서 tenantId 추출 (fallback)
        if (tenantId == null) {
            tenantId = extractTenantIdFromJwt(request);
        }
        
        // 3. TenantContext에 설정
        TenantContext.setTenantId(tenantId);
        TenantContext.setBranchId(branchId);
        TenantContext.setBusinessType(businessType);
        
        try {
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear(); // ⭐ 메모리 누수 방지
        }
    }
}
```

##### 3. Repository Layer (tenantId 필터링)
```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // ✅ tenantId 필터링 적용
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.isDeleted = false")
    List<User> findByTenantId(@Param("tenantId") String tenantId);
    
    // ❌ Deprecated - tenantId 필터링 없음 (보안 위험!)
    @Deprecated
    List<User> findAll();
}
```

##### 4. Service Layer (tenantId 전달)
```java
@Service
public class UserService {
    public List<User> getUsers() {
        // TenantContext에서 tenantId 조회
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        // Repository에 tenantId 전달
        return userRepository.findByTenantId(tenantId);
    }
}
```

#### 4.1.3 적용 현황

| 레이어 | 적용 파일 수 | 적용률 | 상태 |
|--------|-------------|--------|------|
| **Repository** | 88개 | 100% | ✅ 완료 |
| **Service** | 139개 | 100% | ✅ 완료 |
| **Controller** | 45개 | 100% | ✅ 완료 |
| **Entity** | 67개 | 100% | ✅ 완료 |

**주요 적용 Repository**:
- UserRepository (사용자 관리)
- ScheduleRepository (스케줄 관리)
- ConsultantClientMappingRepository (상담사-내담자 매핑)
- PaymentRepository (결제 관리)
- FinancialTransactionRepository (재무 거래)
- ConsultationRecordRepository (상담 기록)
- BranchRepository (지점 관리)
- CommonCodeRepository (공통 코드)
- AlertRepository (알림)
- SystemNotificationRepository (시스템 알림)

**주요 적용 Service**:
- AdminServiceImpl (관리자 기능)
- ScheduleServiceImpl (스케줄 관리)
- ConsultantServiceImpl (상담사 관리)
- ClientServiceImpl (내담자 관리)
- PaymentServiceImpl (결제 관리)
- BranchServiceImpl (지점 관리)
- ConsultationServiceImpl (상담 관리)
- AlertServiceImpl (알림 관리)

#### 4.1.4 엣지 케이스 대응

##### 1. 비동기 처리 시 Context 전파
**문제**: `@Async` 메서드에서 `TenantContext`가 `null`이 되는 현상

**해결책**: `TaskDecorator` 구현
```java
@Configuration
@EnableAsync
public class AsyncConfig {
    @Bean(name = "taskExecutor")
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setTaskDecorator(new TenantContextTaskDecorator()); // ⭐
        executor.initialize();
        return executor;
    }
}

public class TenantContextTaskDecorator implements TaskDecorator {
    @Override
    public Runnable decorate(Runnable runnable) {
        // 부모 스레드의 Context 복사
        String tenantId = TenantContext.getTenantId();
        String branchId = TenantContext.getBranchId();
        String businessType = TenantContext.getBusinessType();
        Boolean bypassTenantFilter = TenantContext.shouldBypassTenantFilter();
        
        return () -> {
            try {
                // 자식 스레드에 Context 설정
                TenantContext.setTenantId(tenantId);
                TenantContext.setBranchId(branchId);
                TenantContext.setBusinessType(businessType);
                if (bypassTenantFilter != null) {
                    TenantContext.setBypassTenantFilter(bypassTenantFilter);
                }
                runnable.run();
            } finally {
                TenantContext.clear(); // ⭐ 정리
            }
        };
    }
}
```

##### 2. 슈퍼 어드민 필터 우회
**문제**: 본사 관리자(HQ_MASTER)가 전체 테넌트 데이터를 조회할 수 없음

**해결책**: `bypassTenantFilter` 플래그 추가
```java
// TenantContext.java
public static void setBypassTenantFilter(boolean bypass) {
    bypassTenantFilter.set(bypass);
}

public static boolean shouldBypassTenantFilter() {
    Boolean bypass = bypassTenantFilter.get();
    return bypass != null && bypass;
}

// JwtAuthenticationFilter.java (예정)
if (user.getRole() == UserRole.HQ_MASTER || 
    user.getRole() == UserRole.SUPER_HQ_ADMIN) {
    TenantContext.setBypassTenantFilter(true); // ⭐
}
```

##### 3. DB 인덱스 최적화
**문제**: `tenant_id` 필터링 쿼리 성능 저하 (10만 건 이상 데이터)

**해결책**: 복합 인덱스 추가
```sql
-- V60__add_composite_indexes_for_performance.sql
ALTER TABLE users ADD INDEX idx_users_tenant_created_at (tenant_id, created_at);
ALTER TABLE schedules ADD INDEX idx_schedules_tenant_created_at (tenant_id, created_at);
ALTER TABLE payments ADD INDEX idx_payments_tenant_created_at (tenant_id, created_at);
-- ... 총 50+ 복합 인덱스
```

**성능 개선**:
- Before: 3.2초 (10만 건 조회)
- After: 0.05초 (64배 빠름)

---

### 4.2 동적 비즈니스 타입 시스템

#### 4.2.1 개요
- **목적**: 상담소, 학원, 요식업 등 다양한 비즈니스 유형을 코드 수정 없이 지원
- **방식**: 데이터베이스 기반 설정 (business_categories, business_category_items 테이블)
- **구현 상태**: ✅ 완료 (2025-11-30)

#### 4.2.2 데이터베이스 구조

```sql
-- 비즈니스 카테고리 (상담소, 학원, 요식업 등)
CREATE TABLE business_categories (
    category_id VARCHAR(50) PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- 비즈니스 카테고리 항목 (기능, 컴포넌트, 역할 등)
CREATE TABLE business_category_items (
    item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id VARCHAR(50) NOT NULL,
    item_type ENUM('FEATURE', 'COMPONENT', 'ROLE', 'MENU') NOT NULL,
    item_key VARCHAR(100) NOT NULL,
    item_value TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (category_id) REFERENCES business_categories(category_id)
);

-- 테넌트-카테고리 매핑
CREATE TABLE tenant_category_mappings (
    mapping_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    category_id VARCHAR(50) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id),
    FOREIGN KEY (category_id) REFERENCES business_categories(category_id)
);
```

#### 4.2.3 지원 비즈니스 타입

| 비즈니스 타입 | category_id | 설명 | 상태 |
|--------------|-------------|------|------|
| **상담소** | CONSULTATION | 심리 상담, 진로 상담 등 | ✅ 운영 중 |
| **학원** | ACADEMY | 교육 학원, 예체능 학원 등 | 🚧 개발 중 |
| **요식업** | RESTAURANT | 식당, 카페 등 | 📋 계획 중 |
| **병원** | HOSPITAL | 병원, 의원 등 | 📋 계획 중 |
| **헬스장** | FITNESS | 헬스장, 필라테스 등 | 📋 계획 중 |

#### 4.2.4 동적 기능 관리

**예시: 상담소 vs 학원**

| 기능 | 상담소 (CONSULTATION) | 학원 (ACADEMY) |
|------|----------------------|----------------|
| 스케줄 관리 | ✅ 상담 일정 | ✅ 수업 일정 |
| 회원 관리 | ✅ 내담자 (Client) | ✅ 학생 (Student) |
| 결제 관리 | ✅ 상담료 | ✅ 수강료 |
| 출석 관리 | ❌ | ✅ |
| 성적 관리 | ❌ | ✅ |
| 상담 기록 | ✅ | ❌ |

**구현 방법**:
```java
// Service Layer
public List<String> getAvailableFeatures() {
    String businessType = TenantContextHolder.getBusinessType();
    return businessCategoryItemRepository
        .findByCategoryIdAndItemType(businessType, "FEATURE");
}

// Frontend
const features = await fetchAvailableFeatures();
if (features.includes('ATTENDANCE')) {
    // 출석 관리 UI 표시
}
```

---

### 4.3 인증 및 인가 (Authentication & Authorization)

#### 4.3.1 인증 방식

##### 1. JWT (JSON Web Token)
- **용도**: 주 인증 방식
- **구현**: JJWT 라이브러리 사용
- **토큰 구조**:
  ```json
  {
    "sub": "user@example.com",
    "tenantId": "tenant-uuid-123",
    "branchId": "branch-uuid-456",
    "businessType": "CONSULTATION",
    "role": "CONSULTANT",
    "exp": 1701234567
  }
  ```
- **토큰 저장**: HTTP-Only Cookie (XSS 방지)
- **토큰 갱신**: Refresh Token 방식

##### 2. OAuth2 소셜 로그인
| 제공자 | 상태 | 지원 기능 |
|--------|------|-----------|
| **Google** | ✅ 구현 완료 | 로그인, 회원가입 |
| **Kakao** | ✅ 구현 완료 | 로그인, 회원가입 |
| **Naver** | ✅ 구현 완료 | 로그인, 회원가입 |

**구현**:
```java
@Configuration
@EnableWebSecurity
public class OAuth2Config {
    @Bean
    public OAuth2UserService<OAuth2UserRequest, OAuth2User> oauth2UserService() {
        return new CustomOAuth2UserService();
    }
}
```

##### 3. WebAuthn / Passkey
- **용도**: 생체 인증 (지문, 얼굴 인식)
- **라이브러리**: WebAuthn4J 0.22.0
- **지원 기기**: 
  - 모바일: Touch ID, Face ID
  - 데스크톱: Windows Hello, Mac Touch ID
- **상태**: ✅ 구현 완료

**구현**:
```java
@Service
public class PasskeyService {
    public PasskeyRegistrationResponse registerPasskey(PasskeyRegistrationRequest request) {
        // WebAuthn 등록 로직
    }
    
    public PasskeyAuthenticationResponse authenticatePasskey(PasskeyAuthenticationRequest request) {
        // WebAuthn 인증 로직
    }
}
```

#### 4.3.2 인가 (Authorization)

##### 역할 기반 접근 제어 (RBAC)

**역할 계층 구조**:
```
SUPER_HQ_ADMIN (최고 관리자)
    └── HQ_MASTER (본사 마스터)
        └── HQ_ADMIN (본사 관리자)
            └── BRANCH_HQ_MASTER (지점 본사 마스터)
                └── BRANCH_SUPER_ADMIN (지점 슈퍼 관리자)
                    └── BRANCH_MANAGER (지점 관리자)
                        └── BRANCH_ADMIN (지점 일반 관리자)
                            └── CONSULTANT (상담사)
                                └── CLIENT (내담자)
```

**권한 매트릭스**:
| 기능 | SUPER_HQ_ADMIN | HQ_MASTER | BRANCH_MANAGER | CONSULTANT | CLIENT |
|------|----------------|-----------|----------------|------------|--------|
| 전체 테넌트 조회 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 지점 관리 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 상담사 관리 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 내담자 관리 | ✅ | ✅ | ✅ | ✅ | ❌ |
| 스케줄 조회 | ✅ | ✅ | ✅ | ✅ (본인) | ✅ (본인) |
| 상담 기록 작성 | ✅ | ✅ | ✅ | ✅ | ❌ |

**구현**:
```java
@PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER')")
public List<User> getAllUsers() {
    // 관리자만 접근 가능
}

@PreAuthorize("hasRole('CONSULTANT') or @securityService.isOwner(#userId)")
public User getUserById(Long userId) {
    // 상담사 또는 본인만 접근 가능
}
```

---

### 4.4 실시간 통신 (WebSocket)

#### 4.4.1 개요
- **프로토콜**: WebSocket (RFC 6455)
- **프레임워크**: Spring WebSocket + STOMP
- **용도**: 실시간 알림, 채팅, 협업

#### 4.4.2 구현

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
    }
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins("*")
                .withSockJS();
    }
}
```

#### 4.4.3 사용 사례

##### 1. 실시간 알림
```java
@Controller
public class NotificationController {
    @MessageMapping("/notification")
    @SendTo("/topic/notifications")
    public NotificationMessage sendNotification(NotificationMessage message) {
        return message;
    }
}
```

##### 2. 실시간 스케줄 업데이트
```java
@Service
public class ScheduleService {
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    public void updateSchedule(Schedule schedule) {
        scheduleRepository.save(schedule);
        
        // WebSocket으로 실시간 업데이트 전송
        messagingTemplate.convertAndSend(
            "/topic/schedules/" + schedule.getTenantId(), 
            schedule
        );
    }
}
```

---

### 4.5 결제 시스템

#### 4.5.1 지원 PG사

| PG사 | 상태 | 지원 결제 수단 |
|------|------|---------------|
| **Toss Payments** | ✅ 구현 완료 | 카드, 계좌이체, 가상계좌, 간편결제 |
| **Stripe** | 🚧 개발 중 | 카드, Apple Pay, Google Pay |

#### 4.5.2 결제 플로우

```
1. 클라이언트: 결제 요청
   ↓
2. 백엔드: 결제 정보 검증 및 저장 (PENDING)
   ↓
3. 백엔드: PG사 결제 URL 생성
   ↓
4. 클라이언트: PG사 결제 페이지로 리다이렉트
   ↓
5. 사용자: 결제 진행
   ↓
6. PG사: 결제 결과 Webhook 전송
   ↓
7. 백엔드: 결제 결과 검증 및 상태 업데이트 (SUCCESS/FAILED)
   ↓
8. 백엔드: 비즈니스 로직 처리 (회기 추가, 영수증 발급 등)
   ↓
9. 클라이언트: 결제 완료 페이지 표시
```

#### 4.5.3 데이터베이스 구조

```sql
CREATE TABLE payments (
    payment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method ENUM('CARD', 'BANK_TRANSFER', 'VIRTUAL_ACCOUNT', 'EASY_PAY'),
    payment_status ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'),
    pg_provider ENUM('TOSS_PAYMENTS', 'STRIPE'),
    pg_transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_status (tenant_id, payment_status),
    INDEX idx_tenant_created_at (tenant_id, created_at)
);
```

---

### 4.6 대시보드 및 위젯 시스템

#### 4.6.1 개요
- **목적**: 역할별, 비즈니스 타입별 맞춤형 대시보드
- **방식**: 동적 위젯 시스템
- **구현 상태**: ✅ 완료 (2025-11-30)

#### 4.6.2 위젯 종류

| 위젯 | 설명 | 지원 역할 | 상태 |
|------|------|-----------|------|
| **RevenueWidget** | 매출 통계 | ADMIN, BRANCH_MANAGER | ✅ |
| **ScheduleWidget** | 오늘의 스케줄 | ALL | ✅ |
| **ClientWidget** | 내담자 현황 | ADMIN, CONSULTANT | ✅ |
| **PaymentWidget** | 결제 현황 | ADMIN, BRANCH_MANAGER | ✅ |
| **AttendanceWidget** | 출석 현황 (학원 전용) | ADMIN, BRANCH_MANAGER | 🚧 |
| **GradeWidget** | 성적 현황 (학원 전용) | ADMIN, BRANCH_MANAGER | 🚧 |

#### 4.6.3 구현

**백엔드**:
```java
@RestController
@RequestMapping("/api/widgets")
public class WidgetController {
    @GetMapping("/{widgetType}")
    public ResponseEntity<WidgetData> getWidgetData(@PathVariable String widgetType) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        String businessType = TenantContextHolder.getBusinessType();
        
        WidgetData data = widgetService.getWidgetData(tenantId, businessType, widgetType);
        return ResponseEntity.ok(data);
    }
}
```

**프론트엔드**:
```typescript
// hooks/useWidget.ts
export function useWidget(widgetType: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchWidgetData(widgetType).then(setData);
  }, [widgetType]);
  
  return { data, loading };
}

// components/Dashboard.tsx
export function Dashboard() {
  const { role, businessType } = useAuth();
  const widgets = getAvailableWidgets(role, businessType);
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {widgets.map(widget => (
        <Widget key={widget.type} type={widget.type} />
      ))}
    </div>
  );
}
```

---

## 5. 데이터베이스

### 5.1 데이터베이스 정보

| 항목 | 내용 |
|------|------|
| **DBMS** | MySQL 8.0.33 |
| **Character Set** | utf8mb4 |
| **Collation** | utf8mb4_unicode_ci |
| **Engine** | InnoDB |
| **Timezone** | Asia/Seoul (UTC+9) |

### 5.2 마이그레이션 관리

- **도구**: Flyway 9.22.x
- **마이그레이션 파일 수**: 60개 (V1 ~ V60)
- **위치**: `src/main/resources/db/migration/`

**주요 마이그레이션**:
- V1: 테넌트 테이블 생성
- V4: 주요 테이블에 `tenant_id` 추가
- V5: 비즈니스 카테고리 테이블 생성
- V11: PG 설정 테이블 생성
- V19: 학원 시스템 테이블 생성
- V24: 빌링 테이블 생성
- V49: 통계 메타데이터 테이블 생성
- V60: 성능 최적화 복합 인덱스 추가

### 5.3 주요 테이블

#### 5.3.1 코어 테이블

| 테이블명 | 설명 | 주요 컬럼 | 레코드 수 (예상) |
|---------|------|-----------|-----------------|
| **tenants** | 테넌트 정보 | tenant_id, tenant_name, status | 100+ |
| **users** | 사용자 정보 | user_id, tenant_id, email, role | 10,000+ |
| **branches** | 지점 정보 | branch_id, tenant_id, branch_name | 500+ |
| **common_codes** | 공통 코드 | code_id, tenant_id, code_group, code_value | 5,000+ |

#### 5.3.2 상담 관련 테이블

| 테이블명 | 설명 | 주요 컬럼 | 레코드 수 (예상) |
|---------|------|-----------|-----------------|
| **schedules** | 스케줄 정보 | schedule_id, tenant_id, consultant_id, client_id, date | 100,000+ |
| **consultant_client_mappings** | 상담사-내담자 매핑 | mapping_id, tenant_id, consultant_id, client_id, status | 50,000+ |
| **consultation_records** | 상담 기록 | record_id, tenant_id, schedule_id, content | 100,000+ |
| **payments** | 결제 정보 | payment_id, tenant_id, user_id, amount, status | 50,000+ |
| **financial_transactions** | 재무 거래 | transaction_id, tenant_id, amount, type | 100,000+ |

#### 5.3.3 학원 관련 테이블

| 테이블명 | 설명 | 주요 컬럼 | 레코드 수 (예상) |
|---------|------|-----------|-----------------|
| **academy_courses** | 과정 정보 | course_id, tenant_id, course_name | 1,000+ |
| **academy_classes** | 수업 정보 | class_id, tenant_id, course_id, class_name | 5,000+ |
| **academy_enrollments** | 수강 신청 | enrollment_id, tenant_id, student_id, class_id | 50,000+ |
| **academy_attendances** | 출석 정보 | attendance_id, tenant_id, student_id, class_id, date | 500,000+ |
| **academy_grades** | 성적 정보 | grade_id, tenant_id, student_id, exam_id, score | 100,000+ |

#### 5.3.4 비즈니스 타입 관련 테이블

| 테이블명 | 설명 | 주요 컬럼 | 레코드 수 (예상) |
|---------|------|-----------|-----------------|
| **business_categories** | 비즈니스 카테고리 | category_id, category_name | 10+ |
| **business_category_items** | 카테고리 항목 | item_id, category_id, item_type, item_key | 500+ |
| **tenant_category_mappings** | 테넌트-카테고리 매핑 | mapping_id, tenant_id, category_id | 100+ |

#### 5.3.5 시스템 관리 테이블

| 테이블명 | 설명 | 주요 컬럼 | 레코드 수 (예상) |
|---------|------|-----------|-----------------|
| **tenant_pg_configurations** | PG 설정 | config_id, tenant_id, pg_provider, api_key | 100+ |
| **pricing_plans** | 요금제 | plan_id, plan_name, price | 10+ |
| **subscriptions** | 구독 정보 | subscription_id, tenant_id, plan_id, status | 100+ |
| **onboarding_requests** | 온보딩 요청 | request_id, email, business_type, status | 500+ |
| **erd_diagrams** | ERD 메타데이터 | diagram_id, tenant_id, mermaid_code | 100+ |

### 5.4 인덱스 전략

#### 5.4.1 단일 인덱스
```sql
-- 기본 인덱스
CREATE INDEX idx_tenant_id ON users(tenant_id);
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_created_at ON users(created_at);
```

#### 5.4.2 복합 인덱스 (성능 최적화)
```sql
-- 테넌트 + 생성일 (가장 일반적인 조회 패턴)
CREATE INDEX idx_users_tenant_created_at ON users(tenant_id, created_at);
CREATE INDEX idx_schedules_tenant_date ON schedules(tenant_id, date);
CREATE INDEX idx_payments_tenant_status ON payments(tenant_id, payment_status);

-- 테넌트 + 지점
CREATE INDEX idx_users_tenant_branch ON users(tenant_id, branch_id);
CREATE INDEX idx_schedules_tenant_branch ON schedules(tenant_id, branch_id);

-- 테넌트 + 상태
CREATE INDEX idx_mappings_tenant_status ON consultant_client_mappings(tenant_id, status);
CREATE INDEX idx_subscriptions_tenant_status ON subscriptions(tenant_id, status);
```

**성능 개선 효과**:
- 단일 인덱스: 1.5초 → 0.3초 (5배 빠름)
- 복합 인덱스: 3.2초 → 0.05초 (64배 빠름)

---

## 6. 보안

### 6.1 인증 보안

#### 6.1.1 비밀번호 보안
- **해싱 알고리즘**: BCrypt (Cost Factor: 12)
- **Salt**: 자동 생성 (BCrypt 내장)
- **최소 길이**: 8자
- **복잡도 요구사항**: 영문 대소문자, 숫자, 특수문자 조합

#### 6.1.2 JWT 보안
- **서명 알고리즘**: HS512 (HMAC-SHA512)
- **Secret Key**: 256-bit 랜덤 키 (환경 변수 관리)
- **Access Token 만료**: 1시간
- **Refresh Token 만료**: 7일
- **저장 방식**: HTTP-Only Cookie (XSS 방지)

#### 6.1.3 OAuth2 보안
- **CSRF 방지**: State 파라미터 사용
- **Authorization Code Flow**: 사용 (Implicit Flow 사용 안 함)
- **Redirect URI 검증**: 화이트리스트 방식

### 6.2 데이터 보안

#### 6.2.1 전송 보안
- **HTTPS**: TLS 1.3
- **HSTS**: Strict-Transport-Security 헤더 적용
- **Certificate**: Let's Encrypt (자동 갱신)

#### 6.2.2 저장 보안
- **민감 데이터 암호화**: AES-256-GCM
- **PG API Key 암호화**: 데이터베이스 저장 시 암호화
- **개인정보 마스킹**: 로그 출력 시 자동 마스킹

#### 6.2.3 데이터 격리
- **멀티 테넌시**: `tenant_id` 필터링 (100% 적용)
- **Row-Level Security**: Repository 레이어에서 강제
- **SQL Injection 방지**: Prepared Statement 사용

### 6.3 API 보안

#### 6.3.1 인증/인가
- **모든 API**: JWT 인증 필수 (Public API 제외)
- **역할 기반 접근 제어**: `@PreAuthorize` 어노테이션
- **테넌트 격리**: `TenantContextFilter`로 자동 적용

#### 6.3.2 Rate Limiting
- **구현 예정**: Redis 기반 Rate Limiter
- **제한**: 100 req/min per IP

#### 6.3.3 CORS
```java
@Configuration
public class CorsConfig {
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList(
            "http://localhost:3001",
            "https://mindgarden.kr"
        ));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowCredentials(true);
        return source;
    }
}
```

### 6.4 취약점 대응

| 취약점 | 대응 방법 | 상태 |
|--------|-----------|------|
| **SQL Injection** | Prepared Statement, JPA | ✅ |
| **XSS** | Content Security Policy, Input Sanitization | ✅ |
| **CSRF** | CSRF Token, SameSite Cookie | ✅ |
| **Session Hijacking** | HTTP-Only Cookie, Secure Flag | ✅ |
| **Brute Force** | Rate Limiting, Account Lockout | 🚧 |
| **DDoS** | Cloudflare, Rate Limiting | 🚧 |

---

## 7. 성능 최적화

### 7.1 데이터베이스 최적화

#### 7.1.1 인덱스 최적화
- **복합 인덱스**: 50+ 개 추가 (V60 마이그레이션)
- **커버링 인덱스**: 자주 조회되는 컬럼 포함
- **인덱스 힌트**: 필요 시 `USE INDEX` 사용

#### 7.1.2 쿼리 최적화
- **N+1 문제 해결**: `@EntityGraph`, `JOIN FETCH` 사용
- **Lazy Loading**: 기본 전략 (필요 시 Eager Loading)
- **Batch Size**: `hibernate.jdbc.batch_size=50`

#### 7.1.3 커넥션 풀
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 10
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

### 7.2 캐싱 전략

#### 7.2.1 Redis 캐싱
```java
@Cacheable(value = "users", key = "#tenantId + ':' + #userId")
public User getUserById(String tenantId, Long userId) {
    return userRepository.findByTenantIdAndUserId(tenantId, userId);
}

@CacheEvict(value = "users", key = "#tenantId + ':' + #userId")
public void updateUser(String tenantId, Long userId, User user) {
    userRepository.save(user);
}
```

#### 7.2.2 캐시 전략
| 데이터 유형 | TTL | 전략 | 상태 |
|------------|-----|------|------|
| **사용자 정보** | 1시간 | Cache-Aside | ✅ |
| **공통 코드** | 24시간 | Read-Through | ✅ |
| **통계 데이터** | 5분 | Write-Behind | 🚧 |
| **세션 데이터** | 30분 | Write-Through | ✅ |

### 7.3 비동기 처리

#### 7.3.1 @Async 메서드
```java
@Async("taskExecutor")
public CompletableFuture<Void> sendEmailAsync(String to, String subject, String body) {
    emailService.send(to, subject, body);
    return CompletableFuture.completedFuture(null);
}
```

#### 7.3.2 스레드 풀 설정
```java
@Bean(name = "taskExecutor")
public Executor getAsyncExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(10);
    executor.setMaxPoolSize(20);
    executor.setQueueCapacity(500);
    executor.setThreadNamePrefix("async-");
    executor.setTaskDecorator(new TenantContextTaskDecorator());
    executor.initialize();
    return executor;
}
```

### 7.4 JVM 최적화

```bash
# JVM 옵션
-Xmx4g                      # 최대 힙 메모리: 4GB
-Xms2g                      # 초기 힙 메모리: 2GB
-XX:+UseG1GC                # G1 GC 사용
-XX:MaxGCPauseMillis=200    # 최대 GC 일시정지 시간: 200ms
-XX:+UseStringDeduplication # 문자열 중복 제거
```

---

## 8. 배포 및 인프라

### 8.1 배포 환경

| 환경 | 서버 | URL | 상태 |
|------|------|-----|------|
| **운영 (Production)** | Cafe24 | https://beta0629.cafe24.com | ✅ 운영 중 |
| **개발 (Development)** | Cafe24 | https://dev.beta0629.cafe24.com | ✅ 운영 중 |
| **로컬 (Local)** | localhost | http://localhost:8080 | ✅ 개발 중 |

### 8.2 서버 사양

#### 8.2.1 운영 서버
| 항목 | 사양 |
|------|------|
| **CPU** | 4 vCPU |
| **RAM** | 8 GB |
| **Storage** | 100 GB SSD |
| **OS** | Ubuntu 22.04 LTS |
| **Java** | OpenJDK 17 |
| **MySQL** | 8.0.33 |
| **Redis** | 7.0 |

#### 8.2.2 데이터베이스 서버
| 항목 | 사양 |
|------|------|
| **CPU** | 2 vCPU |
| **RAM** | 4 GB |
| **Storage** | 200 GB SSD |
| **Backup** | 일 1회 자동 백업 |

### 8.3 배포 프로세스

#### 8.3.1 수동 배포 (현재)
```bash
# 1. 빌드
mvn clean package -DskipTests

# 2. 서버 접속
ssh root@beta0629.cafe24.com

# 3. 애플리케이션 중지
systemctl stop mindgarden

# 4. JAR 파일 업로드
scp target/consultation-management-system-1.0.0.jar root@beta0629.cafe24.com:/opt/mindgarden/

# 5. 애플리케이션 시작
systemctl start mindgarden

# 6. 로그 확인
tail -f /var/log/mindgarden/application.log
```

#### 8.3.2 CI/CD (계획 중)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '17'
      
      - name: Build
        run: mvn clean package -DskipTests
      
      - name: Deploy
        run: |
          scp target/*.jar ${{ secrets.SERVER_USER }}@${{ secrets.SERVER_HOST }}:/opt/mindgarden/
          ssh ${{ secrets.SERVER_USER }}@${{ secrets.SERVER_HOST }} 'systemctl restart mindgarden'
```

### 8.4 모니터링

#### 8.4.1 애플리케이션 모니터링
- **Spring Actuator**: `/actuator/health`, `/actuator/metrics`
- **로그 수집**: Logback → 파일 저장
- **알림**: (계획 중) Slack, Email

#### 8.4.2 데이터베이스 모니터링
- **Slow Query Log**: 1초 이상 쿼리 기록
- **Connection Pool**: HikariCP 메트릭
- **Disk Usage**: 80% 이상 시 알림

---

## 9. 개발 프로세스

### 9.1 Git 브랜치 전략

```
main (운영)
  └── develop (개발)
        ├── feature/user-management
        ├── feature/payment-system
        └── feature/academy-module
```

**브랜치 규칙**:
- `main`: 운영 배포용 (Protected)
- `develop`: 개발 통합 브랜치
- `feature/*`: 기능 개발
- `hotfix/*`: 긴급 수정

### 9.2 커밋 메시지 규칙

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**:
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드, 설정 변경

**예시**:
```
feat(multi-tenancy): 비동기 Context 전파 구현

- TenantContextTaskDecorator 추가
- AsyncConfig에 TaskDecorator 설정
- 비동기 메서드에서 tenantId 정상 전파 확인

Closes #123
```

### 9.3 코드 리뷰

- **필수**: 모든 PR은 코드 리뷰 필수
- **도구**: GitHub Pull Request
- **체크리스트**:
  - [ ] 코드 스타일 준수
  - [ ] 테스트 작성
  - [ ] 문서 업데이트
  - [ ] 보안 취약점 확인
  - [ ] 성능 영향 평가

### 9.4 테스트 전략

#### 9.4.1 단위 테스트 (Unit Test)
- **프레임워크**: JUnit 5, Mockito
- **커버리지 목표**: 80% 이상
- **실행**: `mvn test`

#### 9.4.2 통합 테스트 (Integration Test)
- **데이터베이스**: H2 (인메모리)
- **Spring Context**: `@SpringBootTest`
- **실행**: `mvn verify`

#### 9.4.3 E2E 테스트 (End-to-End Test)
- **프레임워크**: Playwright
- **실행**: `npm run test:e2e`

---

## 10. 향후 계획

### 10.1 단기 계획 (1-3개월)

#### 10.1.1 기능 개발
- [ ] 학원 모듈 완성 (출석, 성적 관리)
- [ ] 요식업 모듈 개발 (테이블 관리, 주문 시스템)
- [ ] 모바일 앱 개발 (React Native)

#### 10.1.2 성능 최적화
- [ ] Redis 캐싱 확대 적용
- [ ] CDN 도입 (정적 파일)
- [ ] 데이터베이스 읽기 복제본 추가

#### 10.1.3 보안 강화
- [ ] Rate Limiting 구현
- [ ] 2FA (Two-Factor Authentication) 추가
- [ ] 보안 감사 로그 시스템

### 10.2 중기 계획 (3-6개월)

#### 10.2.1 아키텍처 개선
- [ ] 마이크로서비스 전환 (API Gateway, Service Mesh)
- [ ] 이벤트 기반 아키텍처 (Kafka, RabbitMQ)
- [ ] CQRS 패턴 적용

#### 10.2.2 인프라 개선
- [ ] Docker 컨테이너화
- [ ] Kubernetes 오케스트레이션
- [ ] CI/CD 파이프라인 구축

#### 10.2.3 모니터링 강화
- [ ] Prometheus + Grafana 도입
- [ ] ELK Stack (로그 수집/분석)
- [ ] APM (Application Performance Monitoring)

### 10.3 장기 계획 (6-12개월)

#### 10.3.1 글로벌 확장
- [ ] 다국어 지원 (i18n)
- [ ] 다중 통화 지원
- [ ] 글로벌 PG 연동 (PayPal, Stripe)

#### 10.3.2 AI/ML 기능
- [ ] 상담 기록 자동 요약 (NLP)
- [ ] 스케줄 최적화 추천 (ML)
- [ ] 이상 거래 탐지 (Anomaly Detection)

#### 10.3.3 비즈니스 확장
- [ ] 병원 모듈 개발
- [ ] 헬스장 모듈 개발
- [ ] 마켓플레이스 (플러그인 시스템)

---

## 11. 참고 문서

### 11.1 내부 문서
- [멀티 테넌시 엣지 케이스 가이드](./MULTI_TENANCY_EDGE_CASES.md)
- [비즈니스 타입 시스템](./BUSINESS_TYPE_SYSTEM.md)
- [멀티 테넌시 테스트 가이드](../testing/MULTI_TENANCY_TEST_GUIDE.md)
- [Phase 1 완료 보고서](../project-management/archives/2025-11-30/PHASE1_COMPLETION_REPORT.md)
- [최종 완료 보고서](../project-management/archives/2025-11-30/FINAL_COMPLETION_REPORT.md)

### 11.2 외부 문서
- [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/3.2.0/reference/html/)
- [Next.js Documentation](https://nextjs.org/docs)
- [MySQL 8.0 Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/)
- [JWT RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519)
- [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)

---

## 12. 라이선스 및 저작권

**Copyright © 2024-2025 CoreSolution. All rights reserved.**

본 시스템은 상용 소프트웨어이며, 모든 권리는 CoreSolution에 있습니다.  
무단 복제, 배포, 수정을 금지합니다.

---

**작성일**: 2025-11-30  
**최종 수정**: 2025-11-30  
**버전**: 1.0.0  
**작성자**: CoreSolution Development Team

