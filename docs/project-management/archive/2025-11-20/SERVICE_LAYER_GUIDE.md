# 서비스 레이어 개발 가이드

**작성일**: 2025-11-20  
**버전**: 1.0.0  
**상태**: 완료

---

## 📋 개요

CoreSolution 플랫폼의 서비스 레이어 개발 시 따라야 할 표준 가이드입니다.

---

## 🏗️ 서비스 레이어 구조

### 기본 구조

```
src/main/java/com/coresolution/
├── consultation/
│   └── service/
│       ├── UserService.java          # 인터페이스
│       └── impl/
│           └── UserServiceImpl.java  # 구현체
└── core/
    └── service/
        ├── TenantRoleService.java    # 인터페이스
        └── impl/
            └── TenantRoleServiceImpl.java  # 구현체
```

### 네이밍 규칙

- **인터페이스**: `*Service` (예: `UserService`, `BranchService`)
- **구현체**: `*ServiceImpl` (예: `UserServiceImpl`, `BranchServiceImpl`)
- **패키지**: `service` (인터페이스), `service.impl` (구현체)

---

## 📝 서비스 인터페이스 작성 가이드

### 기본 구조

```java
package com.coresolution.consultation.service;

/**
 * 사용자 관리 서비스 인터페이스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-20
 */
public interface UserService extends BaseService<User, Long> {
    
    // ==================== 기본 조회 메서드 ====================
    
    /**
     * ID로 사용자 조회
     * 
     * @param id 사용자 ID
     * @return 사용자 (Optional)
     */
    Optional<User> findById(Long id);
    
    /**
     * 이메일로 사용자 조회
     * 
     * @param email 이메일
     * @return 사용자 (Optional)
     */
    Optional<User> findByEmail(String email);
    
    // ==================== 비즈니스 로직 메서드 ====================
    
    /**
     * 사용자 생성
     * 
     * @param request 사용자 생성 요청
     * @param createdBy 생성자
     * @return 생성된 사용자
     * @throws ValidationException 검증 실패 시
     */
    User createUser(UserCreateRequest request, String createdBy);
}
```

### 규칙

1. **JavaDoc 필수**: 모든 public 메서드에 JavaDoc 작성
2. **메서드 그룹화**: 관련 메서드를 섹션으로 구분
3. **예외 명시**: `@throws` 태그로 예외 명시
4. **BaseService 확장**: 가능한 경우 BaseService 확장

---

## 📝 서비스 구현체 작성 가이드

### 기본 구조

```java
package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 사용자 관리 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-20
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    // ==================== 기본 조회 메서드 ====================
    
    @Override
    @Transactional(readOnly = true)
    public Optional<User> findById(Long id) {
        log.debug("사용자 조회: id={}", id);
        return userRepository.findById(id);
    }
    
    // ==================== 비즈니스 로직 메서드 ====================
    
    @Override
    public User createUser(UserCreateRequest request, String createdBy) {
        log.info("사용자 생성: email={}, createdBy={}", request.getEmail(), createdBy);
        
        // 검증
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ValidationException("이미 사용 중인 이메일입니다.");
        }
        
        // 엔티티 생성
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setCreatedBy(createdBy);
        user.setCreatedAt(LocalDateTime.now());
        
        // 저장
        return userRepository.save(user);
    }
}
```

### 규칙

1. **클래스 레벨 어노테이션**
   - `@Slf4j`: 로깅
   - `@Service`: Spring 서비스 빈
   - `@Transactional`: 트랜잭션 관리
   - `@RequiredArgsConstructor`: 생성자 주입

2. **읽기 전용 메서드**
   - `@Transactional(readOnly = true)` 추가

3. **로깅**
   - `log.debug()`: 디버그 정보
   - `log.info()`: 비즈니스 로직 시작/완료
   - `log.warn()`: 경고 상황
   - `log.error()`: 오류 상황

4. **예외 처리**
   - 비즈니스 예외는 커스텀 예외 사용
   - `EntityNotFoundException`: 엔티티를 찾을 수 없을 때
   - `ValidationException`: 검증 실패 시

---

## 🔧 Base 서비스 활용

### BaseService 활용

```java
public interface UserService extends BaseService<User, Long> {
    // BaseService의 메서드 자동 상속
    // - findAllActive()
    // - findActiveById()
    // - save()
    // - update()
    // - softDeleteById()
    // 등
}
```

### BaseTenantEntityService 활용

```java
@Service
@Transactional
public class BranchServiceImpl extends BaseTenantEntityServiceImpl<Branch, Long> 
        implements BranchService {
    
    private final BranchRepository branchRepository;
    
    public BranchServiceImpl(
            BranchRepository branchRepository,
            TenantAccessControlService accessControlService) {
        super(branchRepository, accessControlService);
        this.branchRepository = branchRepository;
    }
    
    // ==================== BaseTenantEntityServiceImpl 추상 메서드 구현 ====================
    
    @Override
    protected Optional<Branch> findEntityById(Long id) {
        return branchRepository.findById(id);
    }
    
    @Override
    protected List<Branch> findEntitiesByTenantAndBranch(String tenantId, Long branchId) {
        if (branchId != null) {
            return branchRepository.findAllByTenantIdAndBranchId(tenantId, branchId);
        } else {
            return branchRepository.findAllByTenantId(tenantId);
        }
    }
}
```

---

## 🔄 트랜잭션 관리

### 기본 패턴

```java
@Service
@Transactional  // 클래스 레벨 기본 설정
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    
    @Override
    @Transactional(readOnly = true)  // 읽기 전용 메서드
    public List<User> findAll() {
        return userRepository.findAll();
    }
    
    @Override  // 쓰기 메서드 (클래스 레벨 설정 사용)
    public User save(User user) {
        return userRepository.save(user);
    }
}
```

### 읽기 전용 서비스

```java
@Service
@Transactional(readOnly = true)  // 모든 메서드가 읽기 전용
@RequiredArgsConstructor
public class MenuServiceImpl implements MenuService {
    // 모든 메서드가 읽기 전용
}
```

### 특수한 롤백 정책

```java
@Service
@Transactional(rollbackFor = Exception.class)  // 모든 예외에 대해 롤백
@RequiredArgsConstructor
public class StatisticsServiceImpl implements StatisticsService {
    // 체크 예외도 롤백
}
```

---

## ⚠️ 예외 처리

### 커스텀 예외 사용

```java
// 엔티티를 찾을 수 없을 때
return userRepository.findById(id)
    .orElseThrow(() -> new EntityNotFoundException("User", id));

// 검증 실패 시
if (email == null) {
    throw new ValidationException("이메일은 필수입니다.");
}

if (age < 0) {
    throw new ValidationException("age", age, "나이는 0 이상이어야 합니다.");
}
```

### 예외 메시지

- **사용자 친화적**: 한국어로 명확하게 작성
- **보안**: 민감한 정보 포함하지 않음
- **일관성**: 유사한 상황에서 일관된 메시지

---

## 📊 로깅 패턴

### 로그 레벨 사용 가이드

```java
// DEBUG: 디버그 정보 (개발 환경)
log.debug("사용자 조회: id={}", id);

// INFO: 비즈니스 로직 시작/완료
log.info("사용자 생성: email={}, createdBy={}", email, createdBy);

// WARN: 경고 상황 (비즈니스 예외)
log.warn("사용자를 찾을 수 없습니다: id={}", id);

// ERROR: 오류 상황 (시스템 예외)
log.error("사용자 생성 실패: email={}", email, e);
```

### 로깅 규칙

1. **파라미터 로깅**: 민감한 정보(비밀번호, 개인정보) 제외
2. **구조화된 로깅**: 키-값 쌍으로 로깅
3. **예외 로깅**: 예외 발생 시 스택 트레이스 포함

---

## ✅ 코드 리뷰 체크리스트

### 서비스 인터페이스

- [ ] 인터페이스와 구현체 분리
- [ ] JavaDoc 작성
- [ ] 메서드 그룹화 (섹션 주석)
- [ ] 예외 명시 (`@throws` 태그)
- [ ] BaseService 확장 (가능한 경우)

### 서비스 구현체

- [ ] 클래스 레벨 어노테이션 (`@Slf4j`, `@Service`, `@Transactional`, `@RequiredArgsConstructor`)
- [ ] 읽기 전용 메서드에 `@Transactional(readOnly = true)` 추가
- [ ] 로깅 적절히 사용
- [ ] 커스텀 예외 사용
- [ ] 예외 메시지 사용자 친화적
- [ ] Base 서비스 활용 (가능한 경우)

### 트랜잭션

- [ ] 클래스 레벨 `@Transactional` 사용
- [ ] 읽기 전용 메서드에 `@Transactional(readOnly = true)` 추가
- [ ] 특수한 롤백 정책 명시 (필요시)

### 예외 처리

- [ ] 비즈니스 예외는 커스텀 예외 사용
- [ ] `EntityNotFoundException` 사용 (엔티티를 찾을 수 없을 때)
- [ ] `ValidationException` 사용 (검증 실패 시)
- [ ] 예외 메시지 사용자 친화적
- [ ] 예외는 GlobalExceptionHandler에서 처리

---

## 🔗 관련 문서

- [Base 서비스 활용 현황 분석](./BASE_SERVICE_USAGE_ANALYSIS.md)
- [트랜잭션 표준화 가이드](./TRANSACTION_STANDARDIZATION_GUIDE.md)
- [예외 처리 표준화 가이드](./EXCEPTION_HANDLING_STANDARDIZATION_GUIDE.md)
- [서비스 레이어 표준화 계획](./SERVICE_LAYER_STANDARDIZATION_PLAN.md)

---

**마지막 업데이트**: 2025-11-20

