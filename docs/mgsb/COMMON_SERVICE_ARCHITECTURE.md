# 공통 서비스 아키텍처 설계

## 1. 개요

각 업종(학원, 상담소, 카페, 요식업 등)마다 서비스를 중복 생성하는 것은 비효율적입니다.
공통화할 수 있는 부분을 추출하여 Generic BaseService를 만들고, 업종별 비즈니스 로직만 오버라이드하는 방식으로 개선합니다.

## 2. 공통화 가능한 부분

### 2.1 CRUD 기본 로직
- ✅ 목록 조회 (tenant_id, branch_id 필터링)
- ✅ 상세 조회 (tenant_id 검증)
- ✅ 생성 (tenant_id 자동 설정, created_by 설정)
- ✅ 수정 (tenant_id 검증, updated_by 설정)
- ✅ 삭제 (소프트 삭제, tenant_id 검증)

### 2.2 접근 제어
- ✅ TenantAccessControlService 통합
- ✅ tenant_id 일치 검증
- ✅ 운영 포털 관리자 권한 확인

### 2.3 DTO 변환
- ✅ Entity → Response DTO 변환 (기본 필드)
- ✅ Request DTO → Entity 변환 (기본 필드)

### 2.4 공통 유틸리티
- ✅ UUID 생성
- ✅ 날짜/시간 처리
- ✅ 로깅 패턴

## 3. 업종별로 다른 부분 (오버라이드 필요)

### 3.1 비즈니스 로직
- ❌ 학원: 정원 확인, 등록 가능 여부, 출석률 계산
- ❌ 상담소: 상담 예약, 세션 관리, 결제 연동
- ❌ 카페: 재고 관리, 주문 처리, 포인트 적립
- ❌ 요식업: 메뉴 관리, 주문 처리, 배달 연동

### 3.2 검증 로직
- ❌ 학원: 정원 초과 확인, 수강 기간 검증
- ❌ 상담소: 상담사 스케줄 확인, 중복 예약 방지
- ❌ 카페: 재고 확인, 주문 가능 시간 검증
- ❌ 요식업: 배달 가능 지역 확인, 주문 최소 금액 검증

### 3.3 상태 관리
- ❌ 학원: 반 상태 (PLANNING → RECRUITING → IN_PROGRESS → COMPLETED)
- ❌ 상담소: 상담 상태 (SCHEDULED → IN_PROGRESS → COMPLETED → CANCELLED)
- ❌ 카페: 주문 상태 (PENDING → CONFIRMED → PREPARING → READY → COMPLETED)
- ❌ 요식업: 주문 상태 (PENDING → CONFIRMED → COOKING → DELIVERING → DELIVERED)

## 4. 설계 방안

### 4.1 Generic BaseService 구조

```java
// 공통 CRUD 서비스 인터페이스
public interface BaseTenantService<T extends BaseEntity, ID, REQ, RES> {
    // 공통 CRUD
    List<RES> findAll(String tenantId, Long branchId);
    RES findById(String tenantId, ID id);
    RES create(String tenantId, REQ request, String createdBy);
    RES update(String tenantId, ID id, REQ request, String updatedBy);
    void delete(String tenantId, ID id, String deletedBy);
    
    // 업종별 비즈니스 로직 (선택적 오버라이드)
    default void validateBusinessRules(String tenantId, REQ request) {
        // 기본 구현: 빈 메서드
    }
    
    default void beforeCreate(String tenantId, REQ request) {
        // 기본 구현: 빈 메서드
    }
    
    default void afterCreate(String tenantId, T entity) {
        // 기본 구현: 빈 메서드
    }
}
```

### 4.2 Generic BaseServiceImpl 구현

```java
@Slf4j
@Transactional
public abstract class BaseTenantServiceImpl<T extends BaseEntity, ID, REQ, RES> 
        implements BaseTenantService<T, ID, REQ, RES> {
    
    protected final JpaRepository<T, ID> repository;
    protected final TenantAccessControlService accessControlService;
    
    // 추상 메서드: 하위 클래스에서 구현
    protected abstract T toEntity(REQ request);
    protected abstract RES toResponse(T entity);
    protected abstract ID extractId(T entity);
    protected abstract String extractTenantId(T entity);
    
    @Override
    public RES create(String tenantId, REQ request, String createdBy) {
        // 공통 검증
        validateTenantAccess(tenantId);
        
        // 업종별 비즈니스 로직 검증
        validateBusinessRules(tenantId, request);
        
        // 생성 전 훅
        beforeCreate(tenantId, request);
        
        // 엔티티 변환 및 저장
        T entity = toEntity(request);
        entity.setTenantId(tenantId);
        entity.setCreatedBy(createdBy);
        entity.setUpdatedBy(createdBy);
        
        T saved = repository.save(entity);
        
        // 생성 후 훅
        afterCreate(tenantId, saved);
        
        return toResponse(saved);
    }
    
    // ... 나머지 공통 메서드들
}
```

### 4.3 업종별 서비스 구현 예시

```java
// 학원 강좌 서비스
@Service
public class CourseServiceImpl extends BaseTenantServiceImpl<Course, String, CourseRequest, CourseResponse> 
        implements CourseService {
    
    private final CourseRepository courseRepository;
    
    @Override
    protected Course toEntity(CourseRequest request) {
        return Course.builder()
                .courseId(UUID.randomUUID().toString())
                .name(request.getName())
                // ... 기본 필드 매핑
                .build();
    }
    
    @Override
    protected CourseResponse toResponse(Course course) {
        return CourseResponse.builder()
                .courseId(course.getCourseId())
                .name(course.getName())
                // ... 기본 필드 매핑
                .build();
    }
    
    // 학원 특화 비즈니스 로직
    @Override
    protected void validateBusinessRules(String tenantId, CourseRequest request) {
        // 정원 확인
        if (request.getCapacity() != null && request.getCapacity() <= 0) {
            throw new IllegalArgumentException("정원은 1명 이상이어야 합니다");
        }
        
        // 중복 강좌명 확인
        if (courseRepository.existsByNameAndTenantId(request.getName(), tenantId)) {
            throw new IllegalStateException("이미 존재하는 강좌명입니다");
        }
    }
    
    // 학원 특화 메서드
    public List<CourseResponse> getRecruitingCourses(String tenantId) {
        // 학원만의 특화 로직
    }
}
```

## 5. 마이그레이션 계획

### Phase 1: BaseService 생성
1. `BaseTenantService` 인터페이스 생성
2. `BaseTenantServiceImpl` 추상 클래스 생성
3. 공통 유틸리티 메서드 구현

### Phase 2: 기존 서비스 리팩토링
1. `CourseServiceImpl` → `BaseTenantServiceImpl` 상속으로 변경
2. 공통 로직 제거, 비즈니스 로직만 유지
3. 테스트 코드 수정

### Phase 3: 다른 업종 서비스 적용
1. 상담소 서비스 리팩토링
2. 카페 서비스 리팩토링
3. 요식업 서비스 리팩토링

## 6. 장점

1. **코드 중복 제거**: CRUD 로직이 한 곳에 집중
2. **일관성**: 모든 업종 서비스가 동일한 패턴 사용
3. **유지보수성**: 공통 로직 수정 시 한 곳만 수정
4. **테스트 용이성**: 공통 로직은 BaseService에서 한 번만 테스트
5. **확장성**: 새로운 업종 추가 시 BaseService 상속만 하면 됨

## 7. 공통화의 문제점 및 주의사항

### 7.1 문제점

#### 7.1.1 과도한 추상화로 인한 복잡도 증가
- **문제**: 너무 많은 레이어와 추상화로 인해 코드 이해가 어려워질 수 있음
- **영향**: 새로운 개발자가 코드베이스를 이해하는 데 시간이 오래 걸림
- **해결 방안**:
  - 공통화는 **80/20 원칙** 적용: 80% 공통 로직만 공통화
  - 명확한 문서화 및 예제 코드 제공
  - 과도한 추상화는 지양, 필요한 만큼만 추상화

#### 7.1.2 타입 안정성 문제
- **문제**: Generic 타입 사용 시 컴파일 타임 타입 체크가 약해질 수 있음
- **영향**: 런타임 에러 가능성 증가
- **해결 방안**:
  - 명확한 타입 제약 조건 설정 (`<T extends BaseEntity>`)
  - 추상 메서드로 타입 안정성 강제
  - 단위 테스트로 타입 안정성 검증

#### 7.1.3 디버깅 어려움
- **문제**: 스택 트레이스가 깊어져서 디버깅이 어려울 수 있음
- **영향**: 버그 추적 및 수정 시간 증가
- **해결 방안**:
  - 명확한 로깅 전략 (각 레이어별 로그)
  - 예외 메시지에 컨텍스트 정보 포함
  - 디버깅 모드 활성화 옵션 제공

#### 7.1.4 성능 오버헤드
- **문제**: 추가 레이어로 인한 메서드 호출 오버헤드
- **영향**: 대용량 처리 시 성능 저하 가능
- **해결 방안**:
  - 불필요한 레이어 제거
  - 성능 크리티컬한 부분은 직접 구현 허용
  - 프로파일링을 통한 실제 성능 측정

#### 7.1.5 유연성 저하
- **문제**: 모든 케이스를 커버하기 어려워 특수한 경우 처리에 제약
- **영향**: 특정 업종의 특수 요구사항 반영 어려움
- **해결 방안**:
  - 훅 메서드 제공으로 확장성 확보
  - 필요시 공통 로직 우회 가능하도록 설계
  - "공통화 우선, 예외 허용" 원칙

#### 7.1.6 학습 곡선
- **문제**: 새로운 개발자가 공통화 구조를 이해하는 데 시간 필요
- **영향**: 온보딩 시간 증가
- **해결 방안**:
  - 명확한 아키텍처 문서
  - 예제 코드 및 튜토리얼 제공
  - 코드 리뷰 시 구조 설명

#### 7.1.7 테스트 복잡도 증가
- **문제**: 공통 로직 테스트와 업종별 로직 테스트 분리 필요
- **영향**: 테스트 코드 작성 및 유지보수 비용 증가
- **해결 방안**:
  - BaseService는 한 번만 테스트
  - 업종별 서비스는 통합 테스트로 검증
  - Mock 객체 활용으로 테스트 격리

#### 7.1.8 리팩토링 어려움
- **문제**: 공통 로직 변경 시 모든 업종에 영향
- **영향**: 변경 리스크 증가, 회귀 테스트 범위 확대
- **해결 방안**:
  - 변경 전 모든 업종 영향도 분석
  - 하위 호환성 유지
  - 단계적 마이그레이션 전략

### 7.2 주의사항

1. **과도한 추상화 지양**
   - 공통화는 **필요한 만큼만** 수행
   - 모든 것을 공통화하려 하지 말 것
   - YAGNI 원칙 적용 (You Aren't Gonna Need It)

2. **업종별 특화 로직 분리**
   - 공통화와 특화 로직의 **경계를 명확히** 구분
   - 비즈니스 로직은 업종별로 독립적으로 유지
   - 공통 로직과 특화 로직이 섞이지 않도록 주의

3. **성능 고려**
   - Generic 타입 사용 시 타입 안정성과 성능 트레이드오프 고려
   - 성능 크리티컬한 부분은 직접 구현 허용
   - 실제 성능 측정 후 최적화

4. **하위 호환성 유지**
   - 공통 로직 변경 시 기존 업종 서비스에 영향 없도록 주의
   - Deprecated 메서드는 충분한 기간 유지
   - 마이그레이션 가이드 제공

5. **문서화 필수**
   - 공통화 구조에 대한 명확한 문서 작성
   - 각 훅 메서드의 사용 예제 제공
   - 아키텍처 결정 사항(ADR) 기록

6. **점진적 도입**
   - 한 번에 모든 서비스를 공통화하지 말 것
   - 하나의 업종부터 시작하여 검증 후 확장
   - 피드백 반영 후 다음 단계 진행

## 8. 공통화 적용 기준 (Decision Matrix)

### 8.1 공통화를 해야 하는 경우 ✅

- **3개 이상의 업종에서 동일한 로직 사용**
- **변경 빈도가 낮은 안정적인 로직**
- **표준화가 필요한 보안/접근 제어 로직**
- **CRUD 기본 패턴**

### 8.2 공통화를 하지 말아야 하는 경우 ❌

- **1-2개 업종에서만 사용하는 로직**
- **자주 변경되는 비즈니스 로직**
- **업종별로 크게 다른 처리 방식**
- **성능 크리티컬한 로직**

### 8.3 조건부 공통화 (훅 메서드 활용) ⚠️

- **기본 패턴은 같지만 세부 로직이 다른 경우**
- **확장 가능성이 있는 로직**
- **선택적 기능이 필요한 경우**

## 9. 마이그레이션 체크리스트

### Phase 1: BaseService 생성
- [ ] BaseTenantService 인터페이스 생성
- [ ] BaseTenantServiceImpl 추상 클래스 생성
- [ ] 공통 유틸리티 메서드 구현
- [ ] 단위 테스트 작성
- [ ] 문서화 완료

### Phase 2: Pilot 적용 (1개 업종)
- [ ] 1개 업종 서비스 리팩토링 (예: CourseService)
- [ ] 통합 테스트 작성
- [ ] 성능 테스트 수행
- [ ] 피드백 수집 및 개선

### Phase 3: 확장 적용
- [ ] 나머지 업종 서비스 리팩토링
- [ ] 전체 통합 테스트
- [ ] 성능 벤치마크
- [ ] 문서 업데이트

### Phase 4: 모니터링 및 최적화
- [ ] 프로덕션 모니터링
- [ ] 성능 메트릭 수집
- [ ] 사용자 피드백 수집
- [ ] 지속적 개선

