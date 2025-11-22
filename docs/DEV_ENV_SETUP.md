## 코어(Core) 솔루션 개발 환경 세팅 가이드

코어(Core) 솔루션을 **윈도우 / 맥 모두에서 동일하게** 개발·배포할 수 있도록, 필수 세팅과 브랜치/배포 전략을 정리한 문서입니다.

---

### 1. 개발용 브랜치 / 운영용 브랜치 정책

- **develop 브랜치**
  - 일상적인 개발 작업용 브랜치
  - “개발에 반영해” → 이 브랜치에 커밋/푸시
  - GitHub Actions: `develop` 푸시 시 **개발 서버(dev) 자동 배포**

- **main 브랜치**
  - 운영(실 서비스) 반영용 브랜치
  - “운영 반영해” → `develop`에서 충분히 테스트된 코드를 `main`으로 머지한 뒤 사용
  - 운영 배포 워크플로(`deploy-production.yml`)는 **수동 실행(버튼)** 으로만 동작

요약:
- **개발 반영** → `develop`  
- **운영 반영** → `main`

---

### 2. 공통 개발 환경 요구 사항

- **Git**
- **JDK 17**
  - 예: Eclipse Adoptium Temurin 17 (권장)
- **Node.js 20 이상**
  - `react-router@7.x` 등에서 Node 20을 요구
- **npm (Node 설치 시 포함)**
- **MySQL 8 (또는 원격 개발 DB 접근 권한)**  
  - 로컬 DB를 사용하거나, `.env.local` / `application-local.yml`을 통해 개발용 DB에 접속

---

### 3. 로컬 환경 변수 / 설정 파일

#### 3-1. 윈도우/맥 공통: `.env.local`

프로젝트 루트(`MindGarden/`)에 **커밋하지 않는** `.env.local` 파일을 생성합니다.

```env
# DB
DB_HOST=your-dev-db-host
DB_PORT=3306
DB_NAME=mindgarden_dev
DB_USERNAME=mindgarden_dev
DB_PASSWORD=your-secure-password

# 기타 필요한 비밀 값들 (예: OpenAI 키 등)
OPENAI_API_KEY=sk-xxxxx
```

- 실제 비밀번호/키는 **절대 Git에 커밋하지 않고** 이 파일로만 관리합니다.

#### 3-2. `application-local.yml`

`src/main/resources/application-local.yml`에서 DB 비밀번호는 환경 변수로 읽도록 되어 있습니다.

```yaml
spring:
  datasource:
    url: jdbc:mysql://...
    username: mindgarden_dev
    password: ${DB_PASSWORD:}  # 환경 변수 또는 .env.local에서 로드
```

- 윈도우/맥 모두 `start-server` 스크립트가 `.env.local`을 로드한 뒤 스프링 부트를 실행합니다.

---

### 4. 윈도우 개발 환경

#### 4-1. 저장소 클론

```bat
cd F:\Trinity\workspace
git clone https://github.com/beta0629/MindGarden.git
cd MindGarden
```

#### 4-2. JDK 17 설치 및 JAVA_HOME

- Temurin JDK 17 설치 후, `JAVA_HOME`을 해당 경로로 설정
- `start-server.ps1` / `start-server.bat` 에서 JAVA_HOME 확인 및 보완 로직이 포함되어 있음

#### 4-3. 백엔드/프론트 한 번에 실행 (`start-all.bat`)

루트에서:

```bat
start-all.bat
```

- 포트 8080(백엔드), 3000(프론트) 사용 중인 프로세스를 먼저 종료
- `start-server.ps1`로 백엔드 실행 (`./mvnw.cmd spring-boot:run -Dspring.profiles.active=local`)
- `frontend`에서 `npm start` 실행

개별 실행도 가능:

```bat
:: 백엔드만
start-server.bat

:: 프론트만
cd frontend
npm install
npm start
```

---

### 5. 맥 개발 환경

#### 5-1. 저장소 클론

```bash
cd ~/workspace
git clone https://github.com/beta0629/MindGarden.git
cd MindGarden
```

#### 5-2. JDK 17 / Node 20 설치

예시 (Homebrew):

```bash
brew install temurin17
brew install node@20
```

필요 시:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
```

#### 5-3. 백엔드 실행 (맥)

```bash
cd ~/workspace/MindGarden
./mvnw spring-boot:run -Dspring.profiles.active=local
```

#### 5-4. 프론트 실행 (맥)

```bash
cd ~/workspace/MindGarden/frontend
npm install
npm start
```

브라우저에서:
- 백엔드: `http://localhost:8080`
- 프론트: `http://localhost:3000`

---

### 6. GitHub Actions / 배포 파이프라인 개요

#### 6-1. 개발 서버 배포 (`.github/workflows/deploy-dev.yml`)

- **트리거**
  - `push` to `develop` (추후 필요 시 `main` 포함 여부 조정)
  - `workflow_dispatch` (수동 실행)
- 주요 단계
  - 리포지토리 체크아웃
  - Node 20 설정 후 `frontend` 빌드 (`npm install`, `npm run build:ci` 등)
  - `mvn package`로 백엔드 JAR 빌드
  - `appleboy/scp-action`으로 원격 개발 서버에 빌드 산출물 복사
  - `appleboy/ssh-action`으로 systemd 서비스 재시작 및 헬스 체크

#### 6-2. 운영 배포 (`.github/workflows/deploy-production.yml`)

- **트리거**
  - `workflow_dispatch` (수동 실행 전용)
- 정책
  - `main` 브랜치 기준으로 빌드/배포
  - 실수 방지를 위해 **자동 운영 배포는 사용하지 않음**

---

### 7. 새 PC / 새 개발자 온보딩 체크리스트

1. Git 설치 및 GitHub 계정 세팅
2. JDK 17 설치 및 `JAVA_HOME` 세팅
3. Node.js 20 이상 설치
4. 저장소 클론: `git clone ...`
5. 루트에 `.env.local` 생성 (DB, OpenAI 등 비밀 값 설정)
6. `frontend`에서 `npm install`
7. 윈도우는 `start-all.bat`, 맥은 개별 명령으로 백엔드/프론트 실행
8. 브랜치 전략 숙지:
   - 개발 작업: `develop`
   - 운영 반영: `main` (+ 운영 배포 워크플로 수동 실행)

이 문서를 기준으로 하면, **맥이든 윈도우든 “동일한 절차”로 환경을 맞추고**,  

