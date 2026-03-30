# 트랜잭션 표준화 가이드

**작성일**: 2025-11-20  
**버전**: 1.0.0  
**상태**: 분석 완료

---

## 📋 개요

CoreSolution 플랫폼의 서비스 레이어에서 트랜잭션 관리 패턴을 표준화하여 일관성과 유지보수성을 향상시킵니다.

---

## 🔍 현재 트랜잭션 사용 현황

### 통계

- **@Transactional 사용**: 363개 매치 (72개 파일)
- **@Transactional(readOnly = true) 사용**: 258개 매치 (37개 파일)
- **클래스 레벨 @Transactional**: 20개 파일

### 사용 패턴

1. **클래스 레벨 @Transactional** (대부분)
   ```java
   @Service
   @Transactional
   public class UserServiceImpl implements UserService {
       // 모든 메서드가 기본 트랜잭션 설정 사용
   }
   ```

2. **클래스 레벨 @Transactional(readOnly = true)** (읽기 전용 서비스)
   ```java
   @Service
   @Transactional(readOnly = true)
   public class MenuServiceImpl implements MenuService {
       // 모든 메서드가 읽기 전용
   }
   ```

3. **클래스 레벨 @Transactional + 메서드 레벨 오버라이드** (BaseServiceImpl 패턴)
   ```java
   @Transactional
   public abstract class BaseServiceImpl<T, ID> {
       @Transactional(readOnly = true)
       public List<T> findAllActive() {
           // 읽기 전용 메서드
       }
       
       public T save(T entity) {
           // 쓰기 메서드 (클래스 레벨 설정 사용)
       }
   }
   ```

4. **특수 설정** (일부 서비스)
   ```java
   @Transactional(rollbackFor = Exception.class)
   public class StatisticsServiceImpl implements StatisticsService {
       // 모든 예외에 대해 롤백
   }
   ```

---

## 🎯 표준화 목표

1. **일관된 트랜잭션 패턴**
   - 클래스 레벨 `@Transactional` 기본 사용
   - 읽기 전용 메서드는 `@Transactional(readOnly = true)` 오버라이드

2. **명확한 트랜잭션 범위**
   - 서비스 메서드 단위로 트랜잭션 관리
   - 필요시 메서드 레벨 오버라이드

3. **성능 최적화**
   - 읽기 전용 메서드는 `readOnly = true` 사용
   - 불필요한 트랜잭션 방지

---

## 📝 표준화 규칙

### 규칙 1: 클래스 레벨 @Transactional 사용

**권장 패턴:**
```java
@Service
@Transactional
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    // 모든 메서드가 기본 트랜잭션 설정 사용
}
```

**이유:**
- 대부분의 서비스 메서드가 트랜잭션이 필요함
- 코드 중복 감소
- 일관성 유지

### 규칙 2: 읽기 전용 메서드는 @Transactional(readOnly = true) 오버라이드

**권장 패턴:**
```java
@Service
@Transactional
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    
    @Override
    @Transactional(readOnly = true)
    public List<User> findAll() {
        // 읽기 전용 메서드
    }
    
    @Override
    public User save(User user) {
        // 쓰기 메서드 (클래스 레벨 설정 사용)
    }
}
```

**이유:**
- 읽기 전용 트랜잭션은 성능 최적화
- 데이터베이스 레벨에서 읽기 전용 힌트 제공
- 쓰기 작업 방지

### 규칙 3: 읽기 전용 서비스는 클래스 레벨 @Transactional(readOnly = true)

**권장 패턴:**
```java
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MenuServiceImpl implements MenuService {
    // 모든 메서드가 읽기 전용
}
```

**이유:**
- 서비스 전체가 읽기 전용인 경우
- 코드 간결성

### 규칙 4: 특수한 롤백 정책은 명시적으로 지정

**권장 패턴:**
```java
@Service
@Transactional(rollbackFor = Exception.class)
@RequiredArgsConstructor
public class StatisticsServiceImpl implements StatisticsService {
    // 모든 예외에 대해 롤백
}
```

**이유:**
- 기본적으로는 RuntimeException과 Error만 롤백
- 체크 예외도 롤백이 필요한 경우 명시

### 규칙 5: 트랜잭션 전파는 기본값 사용 (필요시만 명시)

**권장 패턴:**
```java
@Service
@Transactional
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processInNewTransaction() {
        // 새로운 트랜잭션에서 실행
    }
}
```

**이유:**
- 기본값(REQUIRED)이 대부분의 경우 적합
- 특수한 경우만 명시적으로 지정

---

## ✅ 표준화 체크리스트

### 서비스 구현체 작성 시

- [ ] 클래스 레벨 `@Transactional` 추가
- [ ] 읽기 전용 메서드에 `@Transactional(readOnly = true)` 추가
- [ ] 특수한 롤백 정책이 필요한 경우 명시
- [ ] 트랜잭션 전파가 필요한 경우 명시

### 리팩토링 시

- [ ] 기존 트랜잭션 설정 확인
- [ ] 읽기 전용 메서드 식별 및 `readOnly = true` 추가
- [ ] 불필요한 트랜잭션 제거
- [ ] 테스트 및 검증

---

## 📊 현재 상태 분석

### 잘 적용된 서비스

1. **BaseServiceImpl** ✅
   - 클래스 레벨 `@Transactional`
   - 읽기 전용 메서드에 `@Transactional(readOnly = true)`

2. **MenuServiceImpl** ✅
   - 클래스 레벨 `@Transactional(readOnly = true)`
   - 읽기 전용 서비스에 적합

3. **StatisticsServiceImpl** ✅
   - 클래스 레벨 `@Transactional(rollbackFor = Exception.class)`
   - 특수한 롤백 정책 명시

### 개선이 필요한 서비스

1. **UserServiceImpl**
   - 클래스 레벨 `@Transactional` 사용 중 ✅
   - 읽기 전용 메서드에 `@Transactional(readOnly = true)` 추가 필요

2. **AdminServiceImpl**
   - 클래스 레벨 `@Transactional` 사용 중 ✅
   - 읽기 전용 메서드에 `@Transactional(readOnly = true)` 추가 필요

3. **ErpServiceImpl**
   - 클래스 레벨 `@Transactional` 사용 중 ✅
   - 읽기 전용 메서드에 `@Transactional(readOnly = true)` 추가 필요

---

## 🔄 마이그레이션 가이드

### 단계 1: 읽기 전용 메서드 식별

```java
// Before
@Override
public List<User> findAll() {
    return userRepository.findAll();
}

// After
@Override
@Transactional(readOnly = true)
public List<User> findAll() {
    return userRepository.findAll();
}
```

### 단계 2: 읽기 전용 서비스 확인

```java
// Before
@Service
@Transactional
public class MenuServiceImpl implements MenuService {
    // 모든 메서드가 읽기 전용
}

// After
@Service
@Transactional(readOnly = true)
public class MenuServiceImpl implements MenuService {
    // 모든 메서드가 읽기 전용
}
```

### 단계 3: 특수한 롤백 정책 확인

```java
// Before
@Service
@Transactional
public class StatisticsServiceImpl implements StatisticsService {
    // 체크 예외도 롤백이 필요한 경우
}

// After
@Service
@Transactional(rollbackFor = Exception.class)
public class StatisticsServiceImpl implements StatisticsService {
    // 체크 예외도 롤백
}
```

---

## ⚠️ 주의사항

### 1. 읽기 전용 트랜잭션의 제한사항

- `@Transactional(readOnly = true)`는 쓰기 작업을 방지하지 않음
- 데이터베이스 레벨에서 힌트만 제공
- 애플리케이션 레벨에서 쓰기 방지는 별도 구현 필요

### 2. 트랜잭션 전파 주의

- `REQUIRES_NEW`는 새로운 트랜잭션을 생성하므로 주의
- `NESTED`는 중첩 트랜잭션을 생성 (일부 DB만 지원)

### 3. 성능 고려

- 읽기 전용 트랜잭션은 성능 최적화에 도움
- 하지만 과도한 사용은 오히려 성능 저하 가능

---

## 📝 다음 단계

1. **읽기 전용 메서드 식별 및 표준화**
   - 각 서비스의 읽기 전용 메서드에 `@Transactional(readOnly = true)` 추가
   - 우선순위: 자주 사용되는 서비스부터

2. **읽기 전용 서비스 확인**
   - 서비스 전체가 읽기 전용인 경우 클래스 레벨 `@Transactional(readOnly = true)` 적용

3. **특수한 롤백 정책 확인**
   - 체크 예외도 롤백이 필요한 서비스 확인
   - `rollbackFor = Exception.class` 적용

4. **문서화**
   - 트랜잭션 표준화 가이드 배포
   - 코드 리뷰 체크리스트 업데이트

---

**마지막 업데이트**: 2025-11-20

