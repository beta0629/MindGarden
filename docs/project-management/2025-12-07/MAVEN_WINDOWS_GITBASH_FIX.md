# Windows Git Bash에서 Maven 실행 오류 해결 방법

**작성일**: 2025-12-07  
**문제**: Windows Git Bash에서 `mvn spring-boot:run` 실행 시 "기본 클래스 #을(를) 찾거나 로드할 수 없습니다" 오류 발생

---

## 🔍 문제 원인

Windows Git Bash 환경에서 Maven이 Java를 실행할 때 인코딩 문제로 인해 mainClass를 "#"으로 읽는 문제가 발생합니다.

**오류 메시지**:
```
오류: 기본 클래스 #을(를) 찾거나 로드할 수 없습니다.
원인: java.lang.ClassNotFoundException: #
```

---

## ✅ 해결 방법

### 방법 1: Windows CMD 사용 (권장)

Windows Git Bash 대신 **Windows CMD** 또는 **PowerShell**을 사용하세요:

```cmd
cd F:\Trinity\workspace\MindGarden
mvn spring-boot:run -Dspring.profiles.active=local -Dmaven.test.skip=true
```

### 방법 2: cmd.exe를 통해 실행

Git Bash에서 `cmd.exe`를 통해 실행:

```bash
cd /f/Trinity/workspace/MindGarden
cmd.exe //c "cd /d F:\Trinity\workspace\MindGarden && mvn spring-boot:run -Dspring.profiles.active=local -Dmaven.test.skip=true"
```

### 방법 3: JAVA_TOOL_OPTIONS 제거

`JAVA_TOOL_OPTIONS` 환경 변수를 제거하고 실행:

```bash
cd /f/Trinity/workspace/MindGarden
unset JAVA_TOOL_OPTIONS
export LANG=ko_KR.UTF-8
export LC_ALL=ko_KR.UTF-8
mvn spring-boot:run -Dspring.profiles.active=local -Dmaven.test.skip=true
```

### 방법 4: Maven Wrapper 사용 (mvnw.cmd)

Maven Wrapper가 있다면 사용:

```bash
cd /f/Trinity/workspace/MindGarden
cmd.exe //c "cd /d F:\Trinity\workspace\MindGarden && mvnw.cmd spring-boot:run -Dspring.profiles.active=local"
```

---

## 📝 참고 사항

1. **Windows Git Bash의 한계**: Windows Git Bash는 일부 Java/Maven 실행 시 인코딩 문제가 발생할 수 있습니다.

2. **권장 환경**: 
   - Windows CMD
   - PowerShell
   - WSL (Windows Subsystem for Linux)

3. **기존 문서 참조**:
   - `docs/guides/development/DEV_ENV_SETUP.md` - Windows 개발 환경 설정
   - `start-local.sh` - 로컬 실행 스크립트 (Windows Git Bash에서 cmd.exe 사용)

---

**최종 업데이트**: 2025-12-07

