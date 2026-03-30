# CoreSolution 패키지명 마이그레이션 계획

> **작성일:** 2025-01-XX  
> **목적:** `com.mindgarden` → `com.coresolution` 패키지명 변경  
> **도메인:** `core-solution.co.kr`  
> **영향 범위:** 전체 Java 소스 코드, Maven 설정, 설정 파일  
> **핵심 원칙:** 
> - 기존 `mindGarden`은 상담소 모델 (consultation 모델)
> - 전체를 CoreSolution으로 통일하여 관리
> - `com.coresolution` 패키지로 전체 시스템 관리

## 1. 현재 상태

### 1.1 현재 패키지 구조
```
com.mindgarden.consultation/     # 상담소 모델 (기존 MindGarden)
com.mindgarden.core/             # 신규 Core 패키지 (Week 0에서 생성)
```

### 1.2 변경 후 패키지 구조
```
com.coresolution.core/           # Core 패키지 (멀티테넌시, 공통 기능)
com.coresolution.consultation/   # 상담소 모델 (기존 consultation, CoreSolution으로 관리)
com.coresolution.academy/        # 학원 모델 (향후 확장)
com.coresolution.foodservice/    # 요식업 모델 (향후 확장)
```

### 1.3 패키지 구조 원칙
- **`com.coresolution.core`**: 모든 업종에서 공통으로 사용하는 기능
  - 멀티테넌시 (Tenant, TenantContext)
  - 공통 엔티티 (BaseEntity 확장)
  - 공통 유틸리티
- **`com.coresolution.consultation`**: 상담소 모델 (기존 MindGarden)
- **`com.coresolution.{업종}`**: 향후 확장되는 업종별 모듈

### 1.3 패키지명 결정
- **도메인**: `core-solution.co.kr`
- **권장 패키지명**: `com.coresolution`
  - 이유: 도메인을 역순으로 변환 (`co.kr` → `com`, `core-solution` → `coresolution`)
  - 대안: `com.core.solution` (하지만 하이픈(-)은 패키지명에 사용 불가)

## 2. 마이그레이션 전략

### 2.1 점진적 마이그레이션 (권장)

**Phase 1: 신규 코드는 새 패키지 사용**
- ✅ 이미 완료: `com.mindgarden.core` 패키지 생성
- 다음 단계: `com.mindgarden.core` → `com.coresolution.core` 변경

**Phase 2: 기존 패키지 점진적 마이그레이션**
- `com.mindgarden.consultation` → `com.coresolution.consultation`
- 모듈 단위로 점진적 변경

**Phase 3: 완전 전환**
- 모든 코드가 `com.coresolution` 패키지 사용
- `com.mindgarden` 패키지 제거

### 2.2 일괄 마이그레이션 (빠른 전환)

**장점:**
- 일관성 있는 패키지 구조
- 명확한 브랜딩

**단점:**
- 모든 파일 수정 필요 (수백 개 파일)
- Git 히스토리 복잡도 증가
- 리팩토링 리스크

## 3. 상세 마이그레이션 계획

### 3.1 변경 대상

#### 3.1.1 Java 소스 파일
- 모든 `.java` 파일의 `package` 선언
- 모든 `import` 문
- 예상 파일 수: 500+ 파일

#### 3.1.2 Maven 설정
- `pom.xml`: `groupId` 변경
  ```xml
  <!-- 변경 전 -->
  <groupId>com.mindgarden</groupId>
  <artifactId>consultation-management-system</artifactId>
  
  <!-- 변경 후 -->
  <groupId>com.coresolution</groupId>
  <artifactId>core-solution</artifactId>
  ```

#### 3.1.3 설정 파일
- `application.yml`: 패키지 스캔 경로
  ```yaml
  # 변경 전
  spring:
    jpa:
      packages-to-scan: com.mindgarden.consultation.entity
  
  # 변경 후
  spring:
    jpa:
      packages-to-scan: com.coresolution.core.domain, com.coresolution.consultation.entity
  ```

#### 3.1.4 기타 설정
- SQL 파일의 패키지 참조 (있는 경우)
- 로그 설정 파일
- 테스트 설정

### 3.2 마이그레이션 단계

#### Step 1: 신규 Core 패키지 변경 (우선)
```bash
# com.mindgarden.core → com.coresolution.core
- Tenant.java
- TenantRepository.java
- TenantContext.java
- TenantContextHolder.java
- TenantIdentifierResolver.java
- HibernateMultiTenancyConfig.java
```

#### Step 2: Maven 설정 변경
- `pom.xml`의 `groupId` 변경
- `artifactId` 변경 (선택적)

#### Step 3: 애플리케이션 메인 클래스 변경
- `ConsultationManagementApplication.java` 패키지 변경
- `@ComponentScan` 경로 업데이트

#### Step 4: 점진적 모듈 마이그레이션
- Entity 패키지부터 시작
- Repository → Service → Controller 순서

#### Step 5: 설정 파일 업데이트
- `application.yml` 패키지 스캔 경로
- 기타 설정 파일

## 4. 실행 계획

### 4.1 즉시 실행 (Week 0 Day 3-4)

**우선순위: 신규 Core 패키지**
- `com.mindgarden.core` → `com.coresolution.core` 변경
- 영향 범위: 6개 파일 (작은 범위)
- 리스크: 낮음

### 4.2 단기 계획 (Week 1-2)

**Maven 설정 변경**
- `groupId` 변경
- `artifactId` 변경 (선택적)

### 4.3 중기 계획 (Week 3-6)

**점진적 패키지 마이그레이션**
- 모듈 단위로 점진적 변경
- 각 모듈 변경 후 테스트

### 4.4 장기 계획 (Week 7+)

**완전 전환**
- 모든 코드가 `com.coresolution` 사용
- `com.mindgarden` 패키지 제거

## 5. 주의사항

### 5.1 Git 히스토리
- 패키지명 변경은 파일 이동으로 인식됨
- `git mv` 사용 권장

### 5.2 IDE 설정
- IntelliJ IDEA: Refactor → Move 사용
- Eclipse: Refactor → Rename 사용

### 5.3 빌드 및 테스트
- 각 단계마다 빌드 및 테스트 필수
- CI/CD 파이프라인 확인

### 5.4 데이터베이스
- 데이터베이스는 패키지명과 무관
- 테이블명, 컬럼명 변경 불필요

## 6. 체크리스트

### 6.1 신규 Core 패키지 변경 (우선)
- [ ] `com.mindgarden.core.domain` → `com.coresolution.core.domain`
- [ ] `com.mindgarden.core.repository` → `com.coresolution.core.repository`
- [ ] `com.mindgarden.core.context` → `com.coresolution.core.context`
- [ ] `com.mindgarden.core.multitenancy` → `com.coresolution.core.multitenancy`
- [ ] `com.mindgarden.core.config` → `com.coresolution.core.config`
- [ ] 모든 import 문 업데이트
- [ ] 빌드 및 테스트 통과

### 6.2 Maven 설정 변경
- [ ] `pom.xml`의 `groupId` 변경
- [ ] `pom.xml`의 `artifactId` 변경 (선택적)
- [ ] 빌드 확인

### 6.3 애플리케이션 메인 클래스
- [ ] `ConsultationManagementApplication.java` 패키지 변경
- [ ] `@ComponentScan` 경로 업데이트
- [ ] 애플리케이션 실행 확인

### 6.4 점진적 마이그레이션
- [ ] Entity 패키지 마이그레이션
- [ ] Repository 패키지 마이그레이션
- [ ] Service 패키지 마이그레이션
- [ ] Controller 패키지 마이그레이션
- [ ] DTO 패키지 마이그레이션
- [ ] Config 패키지 마이그레이션

## 7. 참고사항

### 7.1 패키지명 규칙
- Java 패키지명은 소문자만 사용
- 하이픈(-) 사용 불가 → 언더스코어(_) 또는 카멜케이스 사용
- `core-solution` → `coresolution` 또는 `core_solution` (하지만 언더스코어는 권장하지 않음)

### 7.2 도메인 변환 규칙
- `core-solution.co.kr` → `com.coresolution`
- 역순 변환: `co.kr` → `com`, `core-solution` → `coresolution`

### 7.3 대안 패키지명
- `com.coresolution` (권장)
- `com.coresolution.core` (더 명확하지만 길음)
- `com.core.solution` (하지만 도메인과 다름)

