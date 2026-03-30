# DTO 표준화 검증 가이드

**작성일**: 2025-11-20  
**버전**: 1.0.0  
**상태**: 완료

---

## 📋 개요

Phase 2.3 명확성 개선에서 생성된 Deprecated DTO 사용을 감지하고, 새 표준 DTO 사용을 강제하는 검증 시스템입니다.

---

## 🔍 검증 대상

### Deprecated DTO → 표준 DTO 매핑

| Deprecated DTO | 표준 DTO | 이유 |
|---------------|----------|------|
| `PaymentRequest` | `PaymentCreateRequest` | 결제 생성 요청임을 명확히 표현 |
| `EmailRequest` | `EmailSendRequest` | 이메일 발송 요청임을 명확히 표현 |
| `AuthRequest` | `LoginRequest` | 로그인 요청임을 명확히 표현 |

---

## 🛠️ 검증 도구

### 1. Node.js 검증 스크립트

**파일**: `scripts/validate-dto-standardization.js`

**기능**:
- Java 소스 코드에서 Deprecated DTO 사용 감지
- import 문, 타입 참조, 변수 선언 등 모든 사용처 검사
- 상세한 에러 리포트 및 마이그레이션 가이드 제공

**실행 방법**:
```bash
# 직접 실행
node scripts/validate-dto-standardization.js

# 또는 실행 권한 부여 후
chmod +x scripts/validate-dto-standardization.js
./scripts/validate-dto-standardization.js
```

**출력 예시**:
```
========================================
DTO 표준화 검증 시작
========================================

📁 Java 파일 스캔 중...
✅ 828개의 Java 파일 발견

🔍 Deprecated DTO 사용 검사 중...

========================================
검증 결과
========================================

❌ 3개의 Deprecated DTO 사용이 발견되었습니다.

📄 src/main/java/com/coresolution/consultation/controller/PaymentController.java
  Line 57:1 - [ERROR] Deprecated DTO 사용: PaymentRequest
    PaymentRequest는 PaymentCreateRequest로 명확화되었습니다.
    → com.coresolution.consultation.dto.PaymentCreateRequest 사용을 권장합니다.

========================================
마이그레이션 가이드
========================================

PaymentRequest → PaymentCreateRequest
  import com.coresolution.consultation.dto.PaymentRequest;
  ↓
  import com.coresolution.consultation.dto.PaymentCreateRequest;
```

### 2. Checkstyle 규칙

**파일**: `checkstyle.xml`

**추가된 규칙**:
- `PaymentRequest` 사용 감지 및 경고
- `EmailRequest` 사용 감지 및 경고
- `AuthRequest` 사용 감지 및 경고

**실행 방법**:
```bash
# Maven을 통한 Checkstyle 실행
mvn checkstyle:check
```

### 3. Maven 빌드 통합

**파일**: `pom.xml`

**통합 위치**: `validate` phase

**자동 실행**:
```bash
# Maven 빌드 시 자동 실행
mvn validate

# 또는 전체 빌드 시
mvn clean install
```

**설정**:
```xml
<plugin>
    <groupId>org.codehaus.mojo</groupId>
    <artifactId>exec-maven-plugin</artifactId>
    <version>3.1.0</version>
    <executions>
        <execution>
            <id>validate-dto-standardization</id>
            <phase>validate</phase>
            <goals>
                <goal>exec</goal>
            </goals>
            <configuration>
                <executable>node</executable>
                <arguments>
                    <argument>scripts/validate-dto-standardization.js</argument>
                </arguments>
            </configuration>
        </execution>
    </executions>
</plugin>
```

---

## 📝 마이그레이션 가이드

### PaymentRequest → PaymentCreateRequest

**변경 전**:
```java
import com.coresolution.consultation.dto.PaymentRequest;

@PostMapping
public ResponseEntity<?> createPayment(@Valid @RequestBody PaymentRequest request) {
    // ...
}
```

**변경 후**:
```java
import com.coresolution.consultation.dto.PaymentCreateRequest;

@PostMapping
public ResponseEntity<?> createPayment(@Valid @RequestBody PaymentCreateRequest request) {
    // ...
}
```

### EmailRequest → EmailSendRequest

**변경 전**:
```java
import com.coresolution.consultation.dto.EmailRequest;

public void sendEmail(EmailRequest request) {
    // ...
}
```

**변경 후**:
```java
import com.coresolution.consultation.dto.EmailSendRequest;

public void sendEmail(EmailSendRequest request) {
    // ...
}
```

### AuthRequest → LoginRequest

**변경 전**:
```java
import com.coresolution.consultation.dto.AuthRequest;

@PostMapping("/login")
public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request) {
    // ...
}
```

**변경 후**:
```java
import com.coresolution.consultation.dto.LoginRequest;

@PostMapping("/login")
public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
    // ...
}
```

---

## ✅ 검증 체크리스트

### 개발자 체크리스트

- [ ] 새 코드 작성 시 Deprecated DTO 사용하지 않기
- [ ] 기존 코드 마이그레이션 시 표준 DTO 사용
- [ ] 빌드 전 `mvn validate` 실행하여 검증 통과 확인

### CI/CD 통합

- [ ] Maven `validate` phase에서 자동 검증
- [ ] 검증 실패 시 빌드 중단
- [ ] 검증 결과를 CI 리포트에 포함

### 코드 리뷰

- [ ] Pull Request에서 Deprecated DTO 사용 여부 확인
- [ ] 검증 스크립트 실행 결과 확인
- [ ] 마이그레이션 가이드 준수 여부 확인

---

## 🚨 에러 해결

### 검증 실패 시

1. **에러 메시지 확인**: 어떤 Deprecated DTO가 사용되었는지 확인
2. **파일 위치 확인**: 에러가 발생한 파일과 라인 번호 확인
3. **마이그레이션 수행**: 위의 마이그레이션 가이드에 따라 수정
4. **재검증**: 수정 후 다시 검증 스크립트 실행

### 일반적인 문제

**문제**: `PaymentRequest`를 여전히 사용하고 있음
**해결**: `PaymentCreateRequest`로 변경

**문제**: import 문만 변경했는데 여전히 타입 참조에서 사용
**해결**: 모든 타입 참조를 새 DTO로 변경

**문제**: DTO 파일 자체에서 에러 발생
**해결**: DTO 파일은 검증에서 제외되므로 무시 가능 (Deprecated 표시된 파일)

---

## 📊 검증 통계

검증 스크립트는 다음 정보를 제공합니다:

- 총 검사한 Java 파일 수
- 발견된 Deprecated DTO 사용 수
- 파일별 에러 상세 정보
- 마이그레이션 가이드

---

## 🔄 자동 검증 통합

### 1. Git Pre-commit Hook 통합

**파일**: `.husky/pre-commit`

**자동 실행**: Git 커밋 시 자동으로 모든 표준화 작업 검증 실행

### 2. 서버 실행 시 검증 통합

**파일**: 
- `scripts/start-backend.sh` - 백엔드 서버 실행 시
- `scripts/start-all.sh` - 전체 서버 실행 시

**자동 실행**: 서버 실행 전 자동으로 표준화 검증 실행

**검증 항목**:
1. **DTO 표준화 검증** (필수) - Deprecated DTO 사용 감지
2. **Checkstyle 검증** (필수) - Java 코드 품질 검증

**동작 방식**:
- 서버 실행 전 표준화 검증 자동 실행
- 검증 실패 시 서버 실행 중단
- 검증 통과 시에만 서버 실행 진행

**사용 예시**:
```bash
# 백엔드 서버 실행 (자동 검증 포함)
./scripts/start-backend.sh local

# 전체 서버 실행 (자동 검증 포함)
./scripts/start-all.sh local dev
```

**검증 실패 시**:
```
❌ DTO 표준화 검증 실패
❌ Checkstyle 검증 실패
⚠️  서버 실행을 중단합니다.
```

**검증 항목** (2025-11-20 표준화 작업 전체):
1. **Phase 1: Controller 표준화** - BaseApiController 상속 여부 확인
2. **Phase 2: DTO 표준화** - Deprecated DTO 사용 감지 (필수)
3. **Phase 3: 권한 관리 표준화** - SecurityUtils, PermissionMatrix 사용 감지
4. **Phase 4: API 경로 표준화** - 레거시 /api/ 경로 사용 감지
5. **Phase 5: 서비스 레이어 표준화** - ServiceImpl 인터페이스 존재 여부 확인
6. **Phase 6: 로깅 표준화** - (로깅 패턴은 코드 리뷰에서 확인)
7. **Checkstyle 검증** - Java 코드 품질 검증
8. **하드코딩 검증** - 하드코딩 패턴 감지 (경고)
9. **커밋 메시지 검사** - 커밋 메시지 품질 검증

**설정 방법**:
```bash
# .husky/pre-commit 파일에 실행 권한 부여
chmod +x .husky/pre-commit

# 또는 Git hooks 디렉토리에 직접 링크
ln -s ../../.husky/pre-commit .git/hooks/pre-commit
```

**동작 방식**:
- 커밋 시 자동으로 `scripts/validate-dto-standardization.js` 실행
- Deprecated DTO 사용이 발견되면 커밋 중단
- 모든 검증 통과 시에만 커밋 진행

**우회 방법** (비상 시):
```bash
# 검증을 건너뛰고 커밋 (권장하지 않음)
git commit --no-verify -m "커밋 메시지"
```

---

## 🔗 관련 문서

- [DTO 표준화 분석](./DTO_STANDARDIZATION_ANALYSIS.md)
- [표준화 계획](./CORESOLUTION_STANDARDIZATION_PLAN.md)
- [오늘 할 일 체크리스트](./TODAY_TODO_CHECKLIST.md)

---

## 📝 변경 이력

- **2025-11-20**: Phase 2.3 명확성 개선 검증 시스템 구축 완료
  - Node.js 검증 스크립트 생성
  - Checkstyle 규칙 추가
  - Maven 빌드 통합
  - Git pre-commit hook 통합

