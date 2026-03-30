# YAML 중복 키 오류 해결

**작성일**: 2025-12-07  
**문제**: `application-local.yml` 파일에서 중복된 `spring:` 키로 인한 오류

---

## 🔍 문제 원인

`application-local.yml` 파일에 `spring:` 키가 두 번 나타났습니다:
- 14번째 줄: `spring:` (메인 설정)
- 93번째 줄: `spring:` (스케줄링 설정)

YAML에서는 같은 키가 중복될 수 없어 `DuplicateKeyException`이 발생했습니다.

**오류 메시지**:
```
org.yaml.snakeyaml.constructor.DuplicateKeyException: while constructing a mapping
found duplicate key spring
 in 'reader', line 93, column 1:
    spring:
    ^
```

---

## ✅ 해결 방법

93번째 줄의 `spring:` 블록을 제거하고, 그 내용(`task.scheduling.enabled`)을 첫 번째 `spring:` 블록 안으로 병합했습니다.

**수정 전**:
```yaml
spring:
  # ... 기타 설정 ...

# 스케줄러 비활성화 (로컬 개발 환경 - 무한루프 방지)
scheduler:
  # ... 스케줄러 설정 ...

# Spring 스케줄링 비활성화 (로컬 개발 환경)
spring:  # ❌ 중복!
  task:
    scheduling:
      enabled: false
```

**수정 후**:
```yaml
spring:
  # ... 기타 설정 ...
  
  # Spring 스케줄링 비활성화 (로컬 개발 환경)
  task:
    scheduling:
      enabled: false

# 스케줄러 비활성화 (로컬 개발 환경 - 무한루프 방지)
scheduler:
  # ... 스케줄러 설정 ...
```

---

## 📝 참고 사항

1. **YAML 파일 구조**:
   - 같은 레벨에서 같은 키는 한 번만 사용 가능
   - 중첩된 구조에서는 부모 키 아래에 자식 키를 배치

2. **Spring Boot 설정**:
   - `spring.task.scheduling.enabled`는 `spring:` 블록 안에 있어야 함
   - `scheduler:`는 별도의 최상위 키로 유지

---

**최종 업데이트**: 2025-12-07

