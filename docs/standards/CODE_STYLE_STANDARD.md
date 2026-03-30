# 코드 스타일 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-03  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 코드 스타일 및 포맷팅 표준입니다.  
일관된 코드 스타일로 가독성과 유지보수성을 향상시킵니다.

### 참조 문서
- [백엔드 코딩 표준](./BACKEND_CODING_STANDARD.md)
- [디자인 중앙화 표준](./DESIGN_CENTRALIZATION_STANDARD.md)

### 도구 설정
- **Java Checkstyle**: `checkstyle.xml`
- **JavaScript ESLint**: `frontend/.eslintrc.js`
- **Prettier**: `frontend/.prettierrc.js`

---

## 🎯 코드 스타일 원칙

### 1. 일관성
```
프로젝트 전체에서 동일한 스타일 유지
```

**원칙**:
- ✅ 팀 전체 동일한 스타일
- ✅ 자동 포맷팅 도구 사용
- ✅ 코드 리뷰 시 스타일 확인

### 2. 가독성
```
다른 개발자가 쉽게 이해할 수 있는 코드
```

**원칙**:
- ✅ 명확한 변수명 사용
- ✅ 적절한 주석 작성
- ✅ 복잡한 로직은 분리

### 3. 자동화
```
포맷팅 및 스타일 검사 자동화
```

**원칙**:
- ✅ IDE 자동 포맷팅 설정
- ✅ Pre-commit hook으로 검사
- ✅ CI/CD 파이프라인에서 검증

---

## ☕ Java 코드 스타일

### 1. 네이밍 규칙

#### 클래스명
```java
// ✅ 권장: PascalCase
public class UserService { }
public class CommonCodeController { }
public class PersonalDataEncryptionUtil { }

// ❌ 금지
public class userService { }
public class common_code_controller { }
```

#### 메서드명
```java
// ✅ 권장: camelCase
public void createUser() { }
public UserResponse findById(Long id) { }
public boolean isActive() { }

// ❌ 금지
public void CreateUser() { }
public void create_user() { }
```

#### 변수명
```java
// ✅ 권장: camelCase
String userName;
Long userId;
List<UserResponse> userList;

// ❌ 금지
String user_name;
Long user_id;
List<UserResponse> UserList;
```

#### 상수명
```java
// ✅ 권장: UPPER_SNAKE_CASE
public static final String DEFAULT_STATUS = "ACTIVE";
public static final int MAX_RETRY_COUNT = 3;

// ❌ 금지
public static final String defaultStatus = "ACTIVE";
public static final int maxRetryCount = 3;
```

### 2. 들여쓰기 및 공백

#### 들여쓰기
```java
// ✅ 권장: 4칸 스페이스 (탭 사용 금지)
public class UserService {
    public void createUser() {
        if (condition) {
            // 4칸 들여쓰기
        }
    }
}

// ❌ 금지: 탭 문자 사용
public class UserService {
	public void createUser() {
		if (condition) {
			// 탭 사용 금지
		}
	}
}
```

#### 공백 규칙
```java
// ✅ 권장: 연산자 주변 공백
int sum = a + b;
if (a == b) { }
for (int i = 0; i < 10; i++) { }

// ✅ 권장: 메서드 파라미터
public void method(String param1, String param2) { }

// ✅ 권장: 메서드 호출
method(param1, param2);

// ❌ 금지: 공백 없음
int sum=a+b;
if(a==b){ }
public void method(String param1,String param2){ }
```

### 3. 중괄호 규칙

#### K&R 스타일 (권장)
```java
// ✅ 권장: 여는 중괄호는 같은 줄
public void method() {
    if (condition) {
        // 코드
    }
}

// ❌ 금지: Allman 스타일
public void method()
{
    if (condition)
    {
        // 코드
    }
}
```

#### 단일 문장 중괄호
```java
// ✅ 권장: 단일 문장도 중괄호 사용
if (condition) {
    doSomething();
}

// ⚠️ 허용: 단일 문장 중괄호 생략 (간단한 경우만)
if (condition) doSomething();

// ❌ 금지: 복잡한 로직에서 중괄호 생략
if (condition)
    doSomething();
    doAnotherThing();  // 버그 가능성
```

### 4. 줄 길이 제한

```java
// ✅ 권장: 최대 120자 (가독성 고려)
String message = "이것은 매우 긴 메시지입니다. " +
    "하지만 여러 줄로 나누어 가독성을 높였습니다.";

// ❌ 금지: 200자 이상의 한 줄
String veryLongMessage = "이것은 정말로 매우 긴 메시지입니다. 이 메시지는 200자를 넘어서고 있습니다. 이것은 가독성을 해칩니다. 좋지 않은 스타일입니다.";
```

### 5. Import 정리

#### Import 순서
```java
// 1. Java 표준 라이브러리
import java.util.List;
import java.util.Map;

// 2. 서드파티 라이브러리
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

// 3. 프로젝트 내부 패키지
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
```

#### Wildcard Import 금지
```java
// ❌ 금지: Wildcard Import
import java.util.*;
import org.springframework.web.bind.annotation.*;

// ✅ 권장: 명시적 Import
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
```

### 6. 어노테이션 순서

```java
// ✅ 권장: 어노테이션 순서
@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController { }

// 어노테이션 순서 규칙:
// 1. Lombok 어노테이션 (@Slf4j, @Getter, @Setter 등)
// 2. Spring 어노테이션 (@RestController, @Service 등)
// 3. 설정 어노테이션 (@RequestMapping, @Transactional 등)
// 4. 의존성 주입 (@RequiredArgsConstructor, @Autowired 등)
```

---

## 💻 JavaScript/React 코드 스타일

### 1. 네이밍 규칙

#### 컴포넌트명
```javascript
// ✅ 권장: PascalCase
const UserProfile = () => { };
export default UserProfile;

// ❌ 금지
const userProfile = () => { };
const user_profile = () => { };
```

#### 함수명/변수명
```javascript
// ✅ 권장: camelCase
const getUserName = () => { };
const userName = "홍길동";
const userList = [];

// ❌ 금지
const get_user_name = () => { };
const UserName = "홍길동";
```

#### 상수명
```javascript
// ✅ 권장: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = "/api/v1";

// ❌ 금지
const maxRetryCount = 3;
const apiBaseUrl = "/api/v1";
```

### 2. 들여쓰기 및 공백

#### 들여쓰기
```javascript
// ✅ 권장: 2칸 스페이스
function example() {
  if (condition) {
    // 2칸 들여쓰기
  }
}

// ❌ 금지: 탭 문자 사용
function example() {
	if (condition) {
		// 탭 사용 금지
	}
}
```

#### 공백 규칙
```javascript
// ✅ 권장: 연산자 주변 공백
const sum = a + b;
if (a === b) { }
for (let i = 0; i < 10; i++) { }

// ✅ 권장: 객체 리터럴
const obj = { key: 'value' };
const arr = [1, 2, 3];

// ✅ 권장: 함수 선언
function example(param1, param2) { }
const arrow = (param1, param2) => { };
```

### 3. 세미콜론

```javascript
// ✅ 권장: 세미콜론 사용
const name = "홍길동";
function example() {
  return true;
}

// ❌ 금지: 세미콜론 생략
const name = "홍길동"
function example() {
  return true
}
```

### 4. 따옴표 규칙

```javascript
// ✅ 권장: 작은따옴표 (single quote)
const message = 'Hello World';
const template = `템플릿 ${variable}`;

// ❌ 금지: 큰따옴표 (일관성 유지)
const message = "Hello World";
```

### 5. 화살표 함수

```javascript
// ✅ 권장: 화살표 함수 사용
const getUserName = (user) => {
  return user.name;
};

// ✅ 권장: 단일 표현식은 간단히
const getUserName = (user) => user.name;

// ❌ 금지: function 키워드 (최신 스타일)
function getUserName(user) {
  return user.name;
}
```

### 6. JSX 스타일

```javascript
// ✅ 권장: JSX 속성
<Button onClick={handleClick} disabled={isLoading}>
  클릭
</Button>

// ✅ 권장: 여러 속성은 여러 줄
<Button
  onClick={handleClick}
  disabled={isLoading}
  variant="primary"
>
  클릭
</Button>

// ❌ 금지: 인라인 스타일
<div style={{ backgroundColor: '#fff', padding: '10px' }}>
  내용
</div>

// ✅ 권장: CSS 클래스 사용
<div className="mg-container">
  내용
</div>
```

---

## 📝 주석 작성 규칙

### 1. JavaDoc 주석

#### 클래스 주석
```java
/**
 * 사용자 관리 서비스
 * 
 * 사용자 생성, 수정, 삭제 및 조회 기능을 제공합니다.
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-12-03
 */
@Service
public class UserService { }
```

#### 메서드 주석
```java
/**
 * 사용자 생성
 * 
 * @param request 생성 요청 DTO
 * @param createdBy 생성자 ID
 * @return 생성된 사용자 응답
 * @throws ValidationException 입력값 검증 실패 시
 */
public UserResponse create(UserCreateRequest request, String createdBy) {
    // 구현
}
```

### 2. 인라인 주석

```java
// ✅ 권장: 명확한 설명
// 테넌트 ID로 필터링하여 사용자 목록 조회
List<User> users = userRepository.findByTenantId(tenantId);

// ❌ 금지: 당연한 내용 주석
// 사용자 목록 조회
List<User> users = userRepository.findAll();

// ✅ 권장: 복잡한 로직 설명
// 키 로테이션: 활성 키가 아닌 경우 재암호화
if (!encryptionUtil.isEncryptedWithActiveKey(encryptedText)) {
    String reencrypted = encryptionUtil.ensureActiveKeyEncryption(encryptedText);
    user.setPhone(reencrypted);
}
```

### 3. TODO/FIXME 주석

```java
// ✅ 권장: TODO는 명확하게
// TODO: 2025-12-10까지 키 로테이션 완료 필요
// FIXME: 레거시 데이터 호환성 문제로 임시 처리

// ❌ 금지: 불명확한 TODO
// TODO: 나중에 수정
```

---

## 🔧 자동 포맷팅 설정

### 1. Java (IntelliJ IDEA)

#### 설정 경로
```
Preferences → Editor → Code Style → Java
```

#### 설정 값
- **Tab size**: 4
- **Indent**: 4
- **Continuation indent**: 8
- **Hard wrap at**: 120

### 2. JavaScript/React (VS Code)

#### Prettier 설정
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "none",
  "printWidth": 100
}
```

#### ESLint 설정
- 자동 포맷팅: 저장 시 자동 포맷
- 규칙 위반: 경고 표시

### 3. Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Java Checkstyle 검사
mvn checkstyle:check

# JavaScript/React 포맷팅 검사
cd frontend
npm run lint
```

---

## ✅ 체크리스트

### 코드 작성 시
- [ ] 네이밍 규칙 준수 (camelCase, PascalCase, UPPER_SNAKE_CASE)
- [ ] 들여쓰기 규칙 준수 (Java: 4칸, JavaScript: 2칸)
- [ ] 공백 규칙 준수 (연산자 주변, 쉼표 후)
- [ ] 줄 길이 제한 준수 (최대 120자)
- [ ] 중괄호 규칙 준수 (K&R 스타일)
- [ ] Import 정리 (순서, Wildcard 금지)
- [ ] JavaDoc 주석 작성 (클래스, public 메서드)

### 코드 리뷰 시
- [ ] 코드 스타일 일관성 확인
- [ ] 네이밍 규칙 준수 확인
- [ ] 주석 품질 확인
- [ ] 불필요한 코드 제거 확인

---

## 🚫 금지 사항

### 1. 탭 문자 사용 금지
```java
// ❌ 금지: 탭 문자
public class User {
	public void method() {
		// 탭 사용
	}
}

// ✅ 권장: 스페이스 사용
public class User {
    public void method() {
        // 4칸 스페이스
    }
}
```

### 2. 긴 줄 금지
```java
// ❌ 금지: 200자 이상의 한 줄
String message = "이것은 정말로 매우 긴 메시지입니다. 이 메시지는 200자를 넘어서고 있습니다. 이것은 가독성을 해칩니다. 좋지 않은 스타일입니다.";

// ✅ 권장: 여러 줄로 분리
String message = "이것은 정말로 매우 긴 메시지입니다. " +
    "이 메시지는 여러 줄로 나누어 가독성을 높였습니다.";
```

### 3. 매직 넘버 금지
```java
// ❌ 금지: 매직 넘버
if (retryCount > 3) { }

// ✅ 권장: 상수 사용
private static final int MAX_RETRY_COUNT = 3;
if (retryCount > MAX_RETRY_COUNT) { }
```

### 4. 불필요한 주석 금지
```java
// ❌ 금지: 당연한 내용 주석
// 사용자 목록 조회
List<User> users = userRepository.findAll();

// ✅ 권장: 의미 있는 주석 또는 주석 생략
List<User> users = userRepository.findAll();
```

---

## 💡 베스트 프랙티스

### 1. 변수명은 명확하게
```java
// ✅ 좋은 예: 의미가 명확함
List<User> activeUsers = userRepository.findByIsActiveTrue();
int totalUserCount = activeUsers.size();

// ❌ 나쁜 예: 의미가 불명확
List<User> list = userRepository.findByIsActiveTrue();
int count = list.size();
```

### 2. 메서드는 작게
```java
// ✅ 좋은 예: 작고 명확한 메서드
public UserResponse createUser(UserCreateRequest request) {
    validateRequest(request);
    User user = buildUser(request);
    User saved = saveUser(user);
    return buildResponse(saved);
}

// ❌ 나쁜 예: 큰 메서드
public UserResponse createUser(UserCreateRequest request) {
    // 100줄 이상의 코드...
}
```

### 3. 조건문은 명확하게
```java
// ✅ 좋은 예: 명확한 조건
if (user != null && user.isActive()) {
    // 처리
}

// ❌ 나쁜 예: 복잡한 조건
if (!(user == null || !user.isActive())) {
    // 처리
}
```

---

## 📞 문의

코드 스타일 표준 관련 문의:
- 백엔드 팀
- 프론트엔드 팀
- 아키텍처 팀

**최종 업데이트**: 2025-12-03

