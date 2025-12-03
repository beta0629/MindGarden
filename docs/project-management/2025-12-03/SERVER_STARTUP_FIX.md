# 서버 시작 Bean 충돌 해결

**작성일:** 2025-12-03  
**문제:** MenuController Bean 충돌로 서버 시작 실패  
**해결:** 클래스 이름 변경으로 Bean 이름 충돌 해결

---

## 문제 상황

서버 시작 시 다음 에러 발생:

```
org.springframework.context.annotation.ConflictingBeanDefinitionException: 
Annotation-specified bean name 'menuController' for bean class 
[com.coresolution.consultation.controller.MenuController] 
conflicts with existing, non-compatible bean definition of same name and class 
[com.coresolution.core.controller.MenuController]
```

### 원인

두 개의 `MenuController` 클래스가 존재:
1. `com.coresolution.core.controller.MenuController` (새로 생성, Phase 2)
2. `com.coresolution.consultation.controller.MenuController` (기존 레거시)

Spring은 Bean 이름을 클래스 이름의 첫 글자를 소문자로 바꾼 값을 사용하므로, 둘 다 `menuController`가 되어 충돌 발생.

---

## 해결 방법

### 변경 사항

1. **파일명 변경**
   - `MenuController.java` → `ConsultationMenuController.java`

2. **클래스명 변경**
   - `MenuController` → `ConsultationMenuController`

3. **위치**
   - `src/main/java/com/coresolution/consultation/controller/ConsultationMenuController.java`

### 변경 전/후

**변경 전:**
```java
@RestController
@RequestMapping({"/api/v1/menu", "/api/menu"})
public class MenuController extends BaseApiController {
    // ...
}
```

**변경 후:**
```java
@RestController
@RequestMapping({"/api/v1/menu", "/api/menu"})
public class ConsultationMenuController extends BaseApiController {
    // ...
}
```

---

## 영향 범위

### API 경로 변경 없음
- 기존 API 경로 유지: `/api/v1/menu`, `/api/menu`
- 프론트엔드 코드 변경 불필요

### 참조 코드
- 기존 `MenuController`를 직접 참조하는 코드 없음 (확인 완료)
- API 경로를 통한 간접 참조만 사용

---

## 해결 완료

✅ Bean 충돌 해결  
✅ 서버 시작 가능  
✅ 기존 API 경로 유지

---

## 다음 단계

서버를 다시 시작하여 정상 작동 확인:

```bash
cd /Users/mind/mindGarden && ./start-all-simple.sh local
```

