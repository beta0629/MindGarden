# Windows Git Bash 콘솔 한글 인코딩 문제

**작성일**: 2025-12-07  
**문제**: Windows Git Bash에서 Spring Boot 로그의 한글이 깨져서 표시됨

---

## 🔍 문제 현상

Windows Git Bash에서 `mvn spring-boot:run` 실행 시 콘솔에 한글이 깨져서 표시됩니다:

```
2025-12-07 23:49:01.367 [restartedMain] INFO  c.c.c.config.SecurityHeaderFilter - 蹂댁븞 ?ㅻ뜑 ?꾪꽣 珥덇린???꾨즺
```

---

## ✅ 해결 상태

### 현재 적용된 설정

1. **logback-spring.xml**
   - `charset=UTF-8` 설정
   - `withJansi=true` 설정 (Windows 콘솔 지원)

2. **application-local.yml**
   - `logging.charset.console: UTF-8` 설정
   - `logging.file.charset: UTF-8` 설정

3. **.mvn/jvm.config**
   - `-Dfile.encoding=UTF-8` 설정
   - `-Dconsole.encoding=UTF-8` 설정

### 기능적 영향

- ✅ **애플리케이션 기능**: 영향 없음
- ✅ **로그 파일**: UTF-8로 정상 저장됨 (한글 정상 표시)
- ⚠️ **콘솔 출력**: Windows Git Bash의 한계로 깨져서 표시됨

---

## 📝 권장 사항

### 1. 로그 파일 확인 (권장)

콘솔 출력이 깨져도 **로그 파일은 UTF-8로 정상 저장**되므로, 로그 파일을 직접 확인하세요:

```bash
# 로그 파일 확인
tail -f logs/coresolution.log

# 또는 텍스트 에디터로 열기 (UTF-8 인코딩)
```

### 2. Windows CMD 또는 PowerShell 사용

Windows Git Bash 대신 **Windows CMD** 또는 **PowerShell**을 사용하면 한글이 정상 표시됩니다:

```cmd
cd F:\Trinity\workspace\MindGarden
mvn spring-boot:run -Dspring.profiles.active=local -Dmaven.test.skip=true
```

### 3. IDE에서 실행

IntelliJ IDEA나 Eclipse 같은 IDE에서 실행하면 콘솔 인코딩이 정상적으로 설정됩니다.

### 4. WSL 사용

Windows Subsystem for Linux (WSL)을 사용하면 Linux 환경에서 정상적으로 한글이 표시됩니다.

---

## 🔧 추가 시도 사항

### Git Bash 설정 확인

Git Bash의 옵션에서 문자셋을 UTF-8로 설정:

1. Git Bash 우클릭 → Options
2. Text → Character set: UTF-8
3. Terminal → Character encoding: UTF-8

### 환경 변수 확인

```bash
export LANG=ko_KR.UTF-8
export LC_ALL=ko_KR.UTF-8
export JAVA_TOOL_OPTIONS="-Dfile.encoding=UTF-8 -Dconsole.encoding=UTF-8"
```

---

## 📌 결론

**기능적으로는 문제가 없습니다.** 콘솔 출력이 깨져도:
- 애플리케이션은 정상 작동
- 로그 파일은 UTF-8로 정상 저장
- API 응답도 UTF-8로 정상 처리

개발 편의성을 위해 Windows CMD, PowerShell, 또는 IDE를 사용하는 것을 권장합니다.

---

**최종 업데이트**: 2025-12-07

