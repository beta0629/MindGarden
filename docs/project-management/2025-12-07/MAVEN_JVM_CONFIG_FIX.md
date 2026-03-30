# Maven 실행 오류 해결: .mvn/jvm.config 주석 문제

**작성일**: 2025-12-07  
**문제**: Windows Git Bash에서 `mvn spring-boot:run` 실행 시 "기본 클래스 #을(를) 찾거나 로드할 수 없습니다" 오류 발생

---

## 🔍 문제 원인

Windows Git Bash 환경에서 Maven이 `.mvn/jvm.config` 파일을 읽을 때, 주석(`#`)이 Java 옵션으로 전달되어 Java가 `#`을 클래스 이름으로 인식하려고 시도했습니다.

**오류 메시지**:
```
오류: 기본 클래스 #을(를) 찾거나 로드할 수 없습니다.
원인: java.lang.ClassNotFoundException: #
```

**원인 분석**:
- Maven의 `concat_lines` 함수가 `.mvn/jvm.config` 파일을 읽을 때 `tr -s '\r\n' '  '` 명령을 사용
- Windows Git Bash에서 이 명령이 주석을 제대로 필터링하지 못함
- 주석이 그대로 `MAVEN_OPTS`에 포함되어 Java 실행 시 전달됨

---

## ✅ 해결 방법

`.mvn/jvm.config` 파일에서 **모든 주석을 제거**했습니다.

**수정 전**:
```
# Maven JVM 최적화 설정 (16GB RAM, 8코어 CPU)
# 이 설정은 Maven 빌드 시 사용됩니다.
-Xmx4g
...
```

**수정 후**:
```
-Xmx4g
-Xms2g
-XX:+UseG1GC
...
```

---

## 📝 참고 사항

1. **`.mvn/jvm.config` 파일 형식**:
   - 주석(`#`)을 사용하면 Windows Git Bash에서 문제가 발생할 수 있음
   - 주석이 필요하면 별도 문서로 관리 권장

2. **Maven JVM 설정**:
   - 각 옵션은 한 줄에 하나씩 작성
   - 빈 줄은 무시됨
   - 주석은 제거하는 것이 안전

3. **다른 환경에서의 동작**:
   - Linux/macOS에서는 주석이 정상적으로 처리될 수 있음
   - Windows Git Bash에서만 문제 발생 가능

---

**최종 업데이트**: 2025-12-07

