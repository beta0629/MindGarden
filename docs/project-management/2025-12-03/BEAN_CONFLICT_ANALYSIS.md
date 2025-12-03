# Bean 충돌 문제 분석 및 해결

**작성일:** 2025-12-03  
**문제:** 표준화 작업 후 Bean 충돌 발생  
**원인:** 레거시 코드와 표준화 코드의 공존

---

## 문제 상황

표준화 작업을 진행하면서 새로운 표준화 코드(`core` 패키지)를 추가했지만, 기존 레거시 코드(`consultation` 패키지)가 그대로 남아있어 Bean 이름 충돌이 발생했습니다.

### 충돌 발생 항목

#### 1. MenuController 충돌
- **레거시**: `com.coresolution.consultation.controller.MenuController`
- **표준화**: `com.coresolution.core.controller.MenuController`
- **해결**: 레거시를 `ConsultationMenuController`로 이름 변경

#### 2. MenuService/ServiceImpl 충돌
- **레거시 인터페이스**: `com.coresolution.consultation.service.MenuService`
- **표준화 인터페이스**: `com.coresolution.core.service.MenuService`
- **레거시 구현**: `com.coresolution.consultation.service.impl.MenuServiceImpl`
- **표준화 구현**: `com.coresolution.core.service.impl.MenuServiceImpl`
- **해결**: 레거시 구현을 `ConsultationMenuServiceImpl`로 이름 변경

---

## 왜 이런 문제가 발생했나?

### 표준화 전략의 한계

표준화 작업 시 새로운 표준화 코드를 추가했지만, 기존 레거시 코드를 완전히 제거하지 않았습니다. 

**기존 레거시 코드의 용도:**
- `consultation.MenuService`: 공통 코드 기반 동적 메뉴 (Map 반환)
- `consultation.MenuController`: 레거시 API 경로 제공 (`/api/v1/menu`, `/api/menu`)

**새 표준화 코드의 용도:**
- `core.MenuService`: menus 테이블 기반 메뉴 (MenuDTO 반환)
- `core.MenuController`: 표준화 API 경로 제공 (`/api/v1/menus`)

### Spring Bean 이름 규칙

Spring은 클래스 이름의 첫 글자를 소문자로 바꾼 값을 Bean 이름으로 사용합니다:
- `MenuController` → Bean 이름: `menuController`
- `MenuServiceImpl` → Bean 이름: `menuServiceImpl`

패키지가 달라도 **클래스 이름이 같으면 Bean 이름이 충돌**합니다.

---

## 해결 방법

### 방법 1: 클래스 이름 변경 (적용 완료)

레거시 클래스의 이름을 변경하여 Bean 이름 충돌 방지:

```java
// 변경 전
public class MenuController { }
public class MenuServiceImpl { }

// 변경 후
public class ConsultationMenuController { }
public class ConsultationMenuServiceImpl { }
```

**장점:**
- 간단하고 명확함
- Bean 이름 자동으로 변경됨

**단점:**
- 기존 코드에서 직접 참조하는 경우 수정 필요

### 방법 2: Bean 이름 명시 (보조 방법)

`@Service`, `@RestController` 어노테이션에 Bean 이름 명시:

```java
@Service("coreMenuService")
public class MenuServiceImpl implements MenuService { }

@Service("consultationMenuService")
public class ConsultationMenuServiceImpl implements MenuService { }
```

**장점:**
- 클래스 이름 변경 불필요

**단점:**
- 명시적으로 Bean 이름 관리 필요
- 실수로 같은 이름 사용 가능

---

## 적용된 해결책

### 1. MenuController
- ✅ 레거시: `MenuController` → `ConsultationMenuController`로 변경
- ✅ 표준화: `MenuController` 유지 (core 패키지)

### 2. MenuService
- ✅ 레거시 구현: `MenuServiceImpl` → `ConsultationMenuServiceImpl`로 변경
- ✅ 표준화 구현: `MenuServiceImpl` 유지 (core 패키지, Bean 이름: `coreMenuService`)

### 3. API 경로 구분
- 레거시 API: `/api/v1/menu`, `/api/menu` (ConsultationMenuController)
- 표준화 API: `/api/v1/menus` (MenuController)

---

## 향후 개선 방안

### 단계적 마이그레이션 전략

1. **Phase 1: 공존** (현재)
   - 레거시 코드와 표준화 코드 공존
   - Bean 이름 충돌 방지

2. **Phase 2: 마이그레이션**
   - 프론트엔드 코드를 표준화 API로 전환
   - 레거시 API 사용량 감소

3. **Phase 3: 레거시 제거**
   - 레거시 코드 사용 중지 확인
   - 레거시 코드 제거

### 권장사항

**표준화 작업 시:**
1. ✅ 새 코드 추가 전 기존 코드 위치 확인
2. ✅ Bean 이름 충돌 검사
3. ✅ 레거시 코드와의 호환성 유지
4. ✅ 단계적 마이그레이션 계획 수립

**코드 리뷰 체크리스트:**
- [ ] Bean 이름 충돌 검사
- [ ] 레거시 코드 영향도 분석
- [ ] API 경로 중복 확인
- [ ] 프론트엔드 영향도 확인

---

## 결론

**문제 원인:**
- 레거시 코드와 표준화 코드의 공존
- Spring Bean 이름 충돌

**해결 완료:**
- ✅ 클래스 이름 변경으로 Bean 충돌 해결
- ✅ API 경로 구분 유지

**향후:**
- 단계적 마이그레이션으로 레거시 코드 제거 예정

