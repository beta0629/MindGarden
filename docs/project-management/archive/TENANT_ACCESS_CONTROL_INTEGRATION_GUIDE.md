# 테넌트 접근 제어 서비스 통합 가이드

## 1. 개요

### 1.1 목적
- 모든 서비스에서 일관된 테넌트 접근 제어 적용
- `TenantAccessControlService`를 통한 중앙화된 접근 제어
- 코드 중복 제거 및 보안 강화

### 1.2 적용 대상
- 모든 Service 구현체
- 특히 CRUD 작업을 수행하는 서비스
- 외부 API를 호출하는 서비스

## 2. 통합 패턴

### 2.1 기본 패턴

**서비스에 TenantAccessControlService 주입:**
```java
@Service
@RequiredArgsConstructor
public class ConsultationServiceImpl implements ConsultationService {
    
    private final ConsultationRepository consultationRepository;
    private final TenantAccessControlService accessControlService; // 추가
    
    // ...
}
```

### 2.2 조회 메서드에 적용

**이전:**
```java
public Consultation findById(Long id) {
    return consultationRepository.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("상담을 찾을 수 없습니다: " + id));
}
```

**이후:**
```java
public Consultation findById(Long id) {
    Consultation consultation = consultationRepository.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("상담을 찾을 수 없습니다: " + id));
    
    // 테넌트 접근 제어
    if (consultation.getTenantId() != null) {
        accessControlService.validateTenantAccess(consultation.getTenantId());
    }
    
    return consultation;
}
```

### 2.3 생성 메서드에 적용

**이전:**
```java
public Consultation create(ConsultationRequest request) {
    Consultation consultation = toEntity(request);
    return consultationRepository.save(consultation);
}
```

**이후:**
```java
public Consultation create(ConsultationRequest request) {
    Consultation consultation = toEntity(request);
    
    // 테넌트 ID 자동 설정 (TenantContextHolder에서)
    String tenantId = TenantContextHolder.getTenantId();
    if (tenantId != null) {
        consultation.setTenantId(tenantId);
    }
    
    // 테넌트 접근 제어
    if (consultation.getTenantId() != null) {
        accessControlService.validateTenantAccess(consultation.getTenantId());
    }
    
    return consultationRepository.save(consultation);
}
```

### 2.4 수정 메서드에 적용

**이전:**
```java
public Consultation update(Long id, ConsultationRequest request) {
    Consultation consultation = consultationRepository.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("상담을 찾을 수 없습니다: " + id));
    
    // 업데이트 로직
    updateEntity(consultation, request);
    
    return consultationRepository.save(consultation);
}
```

**이후:**
```java
public Consultation update(Long id, ConsultationRequest request) {
    Consultation consultation = consultationRepository.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("상담을 찾을 수 없습니다: " + id));
    
    // 테넌트 접근 제어
    if (consultation.getTenantId() != null) {
        accessControlService.validateTenantAccess(consultation.getTenantId());
    }
    
    // 업데이트 로직
    updateEntity(consultation, request);
    
    return consultationRepository.save(consultation);
}
```

### 2.5 삭제 메서드에 적용

**이전:**
```java
public void delete(Long id) {
    Consultation consultation = consultationRepository.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("상담을 찾을 수 없습니다: " + id));
    
    consultationRepository.delete(consultation);
}
```

**이후:**
```java
public void delete(Long id) {
    Consultation consultation = consultationRepository.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("상담을 찾을 수 없습니다: " + id));
    
    // 테넌트 접근 제어
    if (consultation.getTenantId() != null) {
        accessControlService.validateTenantAccess(consultation.getTenantId());
    }
    
    consultationRepository.delete(consultation);
}
```

### 2.6 목록 조회 메서드에 적용

**이전:**
```java
public List<Consultation> findAll() {
    return consultationRepository.findAll();
}
```

**이후:**
```java
public List<Consultation> findAll() {
    // BaseRepository의 테넌트 필터링 메서드 사용
    return consultationRepository.findAllActiveByCurrentTenant();
}
```

## 3. 적용 우선순위

### 3.1 Phase 1: 핵심 서비스 (우선)
1. `ConsultationServiceImpl`
2. `ClientServiceImpl`
3. `ConsultantServiceImpl`
4. `PaymentServiceImpl`
5. `ScheduleServiceImpl`

### 3.2 Phase 2: ERP 서비스
1. `ErpServiceImpl`
2. `FinancialTransactionServiceImpl`
3. `SalaryManagementServiceImpl`

### 3.3 Phase 3: 기타 서비스
1. 나머지 모든 서비스 구현체

## 4. 주의사항

### 4.1 HQ 관리자 처리
- HQ 관리자는 모든 테넌트에 접근 가능
- `TenantAccessControlService.hasOpsRole()`로 확인
- 테넌트 컨텍스트가 없어도 전체 조회 가능

### 4.2 테넌트 ID 자동 설정
- 생성 시 `TenantContextHolder.getTenantId()`로 자동 설정
- 수정 시에는 기존 테넌트 ID 유지

### 4.3 성능 고려
- 접근 제어는 필수이지만, 불필요한 중복 검증은 피해야 함
- Repository 레벨 필터링과 함께 사용하여 효율성 확보

## 5. 테스트

### 5.1 단위 테스트
- 테넌트 접근 허용 시나리오
- 테넌트 접근 거부 시나리오
- HQ 관리자 접근 시나리오

### 5.2 통합 테스트
- 멀티테넌트 환경에서 데이터 격리 검증
- 테넌트 간 데이터 접근 불가 검증

