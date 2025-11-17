# 🚀 빠른 시작 가이드

## 📋 필수 설정 (최초 1회)

### 1. 환경 설정 파일 복사

#### macOS / Linux
```bash
cp env.local.example .env.local
cp src/main/resources/application-local.yml.example src/main/resources/application-local.yml
```

#### Windows
```cmd
copy env.local.example .env.local
copy src\main\resources\application-local.yml.example src\main\resources\application-local.yml
```

### 2. 환경 변수 설정

`.env.local` 파일을 열어서 실제 개발 서버 DB 정보로 수정:

```bash
DB_HOST=your-dev-db-host          # 개발 서버 DB 호스트 주소
DB_PORT=3306
DB_NAME=core_solution
DB_USERNAME=mindgarden_dev
DB_PASSWORD=MindGardenDev2025!@#  # 실제 비밀번호로 변경
```

### 3. 환경 변수 로드

#### macOS / Linux
```bash
source scripts/load-env.sh
```

#### Windows (PowerShell)
```powershell
.\scripts\load-env.ps1
```

#### Windows (CMD)
```cmd
call scripts\load-env.bat
```

### 4. 애플리케이션 실행

```bash
# 백엔드 실행
./gradlew bootRun

# 또는 Maven 사용 시
mvn spring-boot:run
```

## 📚 상세 가이드

- [로컬 환경 설정 가이드](docs/mgsb/LOCAL_ENV_SETUP.md) - 맥/윈도우 상세 설정 방법
- [개발 서버 설정 가이드](docs/mgsb/DEV_SERVER_SETUP.md) - 개발 서버 환경 설정

## ⚠️ 중요 사항

- `.env.local` 파일은 Git에 커밋되지 않습니다 (보안)
- 모든 개발자는 개발 서버의 데이터베이스를 사용합니다
- 로컬 PC에 MySQL 설치가 필요 없습니다

