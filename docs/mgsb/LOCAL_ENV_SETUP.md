# 로컬 개발 환경 설정 가이드

작성일: 2025-01-XX

---

## 📋 개요

이 가이드는 노트북과 데스크탑 등 여러 기기에서 동일한 개발 서버 DB를 사용하도록 환경을 설정하는 방법을 안내합니다.

**중요**: 모든 개발자는 개발 서버의 데이터베이스를 사용합니다. 로컬 PC에 MySQL을 설치할 필요가 없습니다.

---

## 🚀 빠른 시작

### 1단계: 예시 파일 복사

#### macOS / Linux
```bash
# 프로젝트 루트 디렉토리에서
cp env.local.example .env.local
cp src/main/resources/application-local.yml.example src/main/resources/application-local.yml
```

#### Windows
```cmd
# 프로젝트 루트 디렉토리에서
copy env.local.example .env.local
copy src\main\resources\application-local.yml.example src\main\resources\application-local.yml
```

### 2단계: 환경 변수 설정

`.env.local` 파일을 열어서 실제 개발 서버 DB 정보로 수정합니다:

```bash
# .env.local
DB_HOST=your-dev-db-host          # 개발 서버 DB 호스트 주소
DB_PORT=3306
DB_NAME=mind_garden
DB_USERNAME=mindgarden_dev
DB_PASSWORD=MindGardenDev2025!@#  # 실제 비밀번호로 변경
```

### 3단계: 환경 변수 로드

#### macOS / Linux (Bash/Zsh)
```bash
# 프로젝트 루트에서 실행
export $(cat .env.local | grep -v '^#' | xargs)

# 또는 .bashrc / .zshrc에 추가 (영구 설정)
echo 'export $(cat ~/mindGarden/.env.local | grep -v "^#" | xargs)' >> ~/.zshrc
source ~/.zshrc
```

#### Windows (PowerShell)
```powershell
# .env.local 파일을 읽어서 환경 변수로 설정
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "User")
    }
}

# PowerShell 재시작 후 적용
```

#### Windows (CMD)
```cmd
# .env.local 파일을 읽어서 환경 변수로 설정하는 배치 파일 생성
# set-env.bat 파일 생성 후 실행
for /f "tokens=1,2 delims==" %%a in (.env.local) do set %%a=%%b
```

### 4단계: 애플리케이션 실행

```bash
# Spring Boot 실행
./gradlew bootRun

# 또는 Maven 사용 시
mvn spring-boot:run
```

---

## 📝 상세 설정 방법

### 방법 1: .env.local 파일 사용 (권장)

`.env.local` 파일을 만들고 환경 변수를 설정한 후, 실행 전에 로드합니다.

**장점**:
- Git에 커밋되지 않음 (보안)
- 여러 기기에서 동일한 설정 파일 사용 가능
- 버전 관리 가능 (예시 파일만 Git에 커밋)

**단점**:
- 실행 전에 환경 변수를 로드해야 함

### 방법 2: 시스템 환경 변수 설정

시스템 레벨에서 환경 변수를 설정합니다.

#### macOS / Linux
```bash
# ~/.zshrc 또는 ~/.bashrc에 추가
export DB_HOST=your-dev-db-host
export DB_PORT=3306
export DB_NAME=mind_garden
export DB_USERNAME=mindgarden_dev
export DB_PASSWORD=MindGardenDev2025!@#

# 적용
source ~/.zshrc
```

#### Windows
1. 시스템 속성 → 고급 → 환경 변수
2. 사용자 변수 또는 시스템 변수에 추가:
   - `DB_HOST=your-dev-db-host`
   - `DB_PORT=3306`
   - `DB_NAME=mind_garden`
   - `DB_USERNAME=mindgarden_dev`
   - `DB_PASSWORD=MindGardenDev2025!@#`

**장점**:
- 한 번 설정하면 계속 사용 가능
- IDE에서도 자동으로 인식

**단점**:
- 시스템 전역 설정이므로 다른 프로젝트와 충돌 가능

### 방법 3: IDE에서 환경 변수 설정

#### IntelliJ IDEA
1. Run → Edit Configurations
2. Environment variables에 추가:
   ```
   DB_HOST=your-dev-db-host;DB_PORT=3306;DB_NAME=mind_garden;DB_USERNAME=mindgarden_dev;DB_PASSWORD=MindGardenDev2025!@#
   ```

#### VS Code
`.vscode/launch.json` 파일 생성:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "java",
      "name": "Spring Boot",
      "request": "launch",
      "env": {
        "DB_HOST": "your-dev-db-host",
        "DB_PORT": "3306",
        "DB_NAME": "mind_garden",
        "DB_USERNAME": "mindgarden_dev",
        "DB_PASSWORD": "MindGardenDev2025!@#"
      }
    }
  ]
}
```

---

## 🔧 자동화 스크립트

### macOS / Linux: 자동 환경 변수 로드 스크립트

`scripts/load-env.sh` 파일 생성:
```bash
#!/bin/bash
# 환경 변수 자동 로드 스크립트

ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env.local 파일이 없습니다."
    echo "💡 .env.local.example을 복사하여 .env.local을 만드세요."
    exit 1
fi

# 환경 변수 로드
export $(cat "$ENV_FILE" | grep -v '^#' | xargs)

echo "✅ 환경 변수가 로드되었습니다."
echo "📋 DB_HOST: $DB_HOST"
echo "📋 DB_NAME: $DB_NAME"
echo "📋 DB_USERNAME: $DB_USERNAME"
```

사용법:
```bash
chmod +x scripts/load-env.sh
source scripts/load-env.sh
./gradlew bootRun
```

### Windows: 자동 환경 변수 로드 배치 파일

`scripts/load-env.bat` 파일 생성:
```batch
@echo off
REM 환경 변수 자동 로드 스크립트

if not exist .env.local (
    echo .env.local 파일이 없습니다.
    echo .env.local.example을 복사하여 .env.local을 만드세요.
    exit /b 1
)

for /f "tokens=1,2 delims==" %%a in (.env.local) do (
    set %%a=%%b
)

echo 환경 변수가 로드되었습니다.
echo DB_HOST: %DB_HOST%
echo DB_NAME: %DB_NAME%
echo DB_USERNAME: %DB_USERNAME%
```

사용법:
```cmd
scripts\load-env.bat
gradlew bootRun
```

---

## ✅ 확인 방법

### 환경 변수 확인

#### macOS / Linux
```bash
echo $DB_HOST
echo $DB_USERNAME
echo $DB_PASSWORD
```

#### Windows (CMD)
```cmd
echo %DB_HOST%
echo %DB_USERNAME%
echo %DB_PASSWORD%
```

#### Windows (PowerShell)
```powershell
$env:DB_HOST
$env:DB_USERNAME
$env:DB_PASSWORD
```

### 데이터베이스 연결 테스트

애플리케이션 실행 후 로그에서 다음을 확인:
```
HikariPool-1 - Starting...
HikariPool-1 - Start completed.
```

또는 Health Check 엔드포인트:
```bash
curl http://localhost:8080/actuator/health
```

---

## 🔒 보안 주의사항

1. **`.env.local` 파일은 절대 Git에 커밋하지 마세요**
   - `.gitignore`에 이미 포함되어 있습니다
   - 실수로 커밋한 경우 즉시 비밀번호 변경

2. **비밀번호는 강력하게 설정**
   - 최소 12자 이상
   - 대소문자, 숫자, 특수문자 포함

3. **환경 변수 파일 권한 설정 (Linux/macOS)**
   ```bash
   chmod 600 .env.local
   ```

4. **공유하지 마세요**
   - `.env.local` 파일을 다른 사람과 공유하지 마세요
   - 예시 파일(`.env.local.example`)만 공유

---

## 🐛 문제 해결

### 환경 변수가 로드되지 않음

**증상**: `DB_PASSWORD`가 비어있음

**해결 방법**:
1. `.env.local` 파일이 올바른 위치에 있는지 확인
2. 환경 변수 로드 스크립트가 실행되었는지 확인
3. 터미널을 재시작

### 데이터베이스 연결 실패

**증상**: `Communications link failure`

**해결 방법**:
1. `DB_HOST`가 올바른지 확인
2. 개발 서버 DB에 네트워크 접근 가능한지 확인
3. 방화벽 설정 확인
4. VPN 연결 필요 여부 확인

### Windows에서 환경 변수가 적용되지 않음

**해결 방법**:
1. PowerShell 또는 CMD를 관리자 권한으로 실행
2. 시스템 재시작
3. IDE 재시작

---

## 📚 관련 문서

- [개발 서버 설정 가이드](./DEV_SERVER_SETUP.md)
- [운영 환경 설정 가이드](./internal-ops/ENV_PRODUCTION_SETUP.md)

---

## 📋 체크리스트

새로운 기기에서 개발 환경 설정 시:

- [ ] `.env.local.example` 복사하여 `.env.local` 생성
- [ ] `application-local.yml.example` 복사하여 `application-local.yml` 생성
- [ ] `.env.local`에 실제 개발 서버 DB 정보 입력
- [ ] 환경 변수 로드 스크립트 실행 또는 시스템 환경 변수 설정
- [ ] 환경 변수 확인 (`echo $DB_HOST` 등)
- [ ] 애플리케이션 실행 및 DB 연결 확인
- [ ] Health Check 엔드포인트 응답 확인

