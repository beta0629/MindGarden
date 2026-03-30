# 패키지 구조 및 폴더명 변경 계획

## 1. 현재 상태

### 1.1 현재 패키지 구조
```
src/main/java/com/
├── coresolution/
│   └── core/                    # 코어 패키지 (신규)
│       ├── domain/              # 도메인 엔티티
│       ├── service/             # 서비스
│       ├── controller/          # 컨트롤러
│       └── ...
├── mindgarden/
│   ├── consultation/            # 상담소 모델 (기존, 500+ 파일)
│   │   ├── entity/             # 68개 엔티티
│   │   ├── repository/         # 60개 Repository
│   │   ├── service/            # 195개 Service
│   │   ├── controller/         # 76개 Controller
│   │   └── ...
│   ├── core/                   # 중복 패키지 (삭제 필요)
│   └── user/                   # 사용자 모듈
```

### 1.2 문제점
- `com.mindgarden` 패키지명이 브랜딩과 불일치 (코어솔루션으로 변경 필요)
- `com.mindgarden.core`와 `com.coresolution.core` 중복
- 패키지 구조가 일관되지 않음

## 2. 변경 후 목표 구조

### 2.1 목표 패키지 구조
```
src/main/java/com/
└── coresolution/
    ├── core/                    # 코어 패키지 (공통 기능)
    │   ├── domain/              # 공통 도메인
    │   │   ├── Tenant.java
    │   │   ├── BusinessCategory.java
    │   │   └── ...
    │   ├── service/             # 공통 서비스
    │   │   ├── BaseTenantService.java
    │   │   └── ...
    │   ├── controller/          # 공통 컨트롤러
    │   ├── context/             # 컨텍스트
    │   └── ...
    ├── consultation/            # 상담소 모델 (기존 consultation)
    │   ├── domain/              # 상담소 도메인
    │   │   ├── entity/          # 엔티티
    │   │   └── ...
    │   ├── service/             # 상담소 서비스
    │   ├── controller/          # 상담소 컨트롤러
    │   └── ...
    ├── academy/                 # 학원 모델 (향후 확장)
    │   └── ...
    └── user/                    # 사용자 모듈
        └── ...
```

## 3. 마이그레이션 전략

### 3.1 단계별 전략

**Phase 1: 폴더 구조 변경 (우선)**
1. `com.mindgarden.consultation` → `com.coresolution.consultation` 폴더 이동
2. `com.mindgarden.user` → `com.coresolution.user` 폴더 이동
3. `com.mindgarden.core` 중복 패키지 정리

**Phase 2: 패키지 선언 변경**
1. 모든 `.java` 파일의 `package` 선언 변경
2. 모든 `import` 문 변경

**Phase 3: 설정 파일 업데이트**
1. `application.yml` 패키지 스캔 경로 변경
2. `pom.xml` 설정 확인
3. 컴포넌트 스캔 경로 업데이트

**Phase 4: 테스트 및 검증**
1. 컴파일 오류 수정
2. 테스트 실행
3. 런타임 검증

## 4. 상세 마이그레이션 계획

### 4.1 Phase 1: 폴더 구조 변경

#### Step 1: consultation 패키지 이동
```bash
# 폴더 이동
mv src/main/java/com/mindgarden/consultation \
   src/main/java/com/coresolution/consultation
```

#### Step 2: user 패키지 이동
```bash
# 폴더 이동
mv src/main/java/com/mindgarden/user \
   src/main/java/com/coresolution/user
```

#### Step 3: 중복 core 패키지 정리
```bash
# com.mindgarden.core 확인 후 삭제 (이미 com.coresolution.core 존재)
# 필요시 파일 병합
```

### 4.2 Phase 2: 패키지 선언 변경

#### 변경 대상
- `com.mindgarden.consultation.*` → `com.coresolution.consultation.*`
- `com.mindgarden.user.*` → `com.coresolution.user.*`

#### 자동화 스크립트
```bash
# 모든 Java 파일에서 패키지 선언 변경
find src/main/java/com/coresolution/consultation -name "*.java" \
  -exec sed -i '' 's/package com\.mindgarden\.consultation/package com.coresolution.consultation/g' {} \;

# 모든 Java 파일에서 import 문 변경
find src/main/java -name "*.java" \
  -exec sed -i '' 's/import com\.mindgarden\.consultation/import com.coresolution.consultation/g' {} \;
```

### 4.3 Phase 3: 설정 파일 업데이트

#### application.yml
```yaml
spring:
  jpa:
    packages-to-scan:
      - com.coresolution.core.domain
      - com.coresolution.consultation.domain.entity
      - com.coresolution.academy.domain
```

#### Component Scan 설정
```java
@ComponentScan(basePackages = {
    "com.coresolution.core",
    "com.coresolution.consultation",
    "com.coresolution.academy",
    "com.coresolution.user"
})
```

## 5. 주의사항

### 5.1 하위 호환성
- 기존 API 경로는 유지 (`/api/admin/**`, `/api/erp/**` 등)
- 점진적 전환으로 기존 기능 유지

### 5.2 Git 관리
- 큰 변경은 별도 브랜치에서 진행
- 단계별 커밋으로 롤백 가능하도록

### 5.3 테스트
- 각 단계마다 컴파일 및 테스트 실행
- 런타임 오류 즉시 수정

## 6. 실행 순서

1. **폴더 구조 변경** (우선)
2. **패키지 선언 변경**
3. **import 문 변경**
4. **설정 파일 업데이트**
5. **컴파일 및 테스트**

