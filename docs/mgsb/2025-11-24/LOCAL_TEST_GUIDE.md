# 로컬 테스트 가이드

## 개요

로컬 개발 환경에서 위젯 및 대시보드 기능을 테스트한 후 서버에 배포하는 워크플로우입니다.

## 빠른 시작

### 1. 환경 변수 설정

```bash
# .env.local 파일이 없으면 복사
cp env.local.example .env.local
```

`.env.local` 파일에 개발 서버 DB 정보 설정:
```bash
DB_HOST=beta0629.cafe24.com
DB_PORT=3306
DB_NAME=core_solution
DB_USERNAME=mindgarden_dev
DB_PASSWORD=실제_비밀번호
```

### 2. 윈도우에서 실행

#### 방법 1: 한 번에 실행 (권장)
```bat
start-all.bat
```

#### 방법 2: 개별 실행
```bat
:: 백엔드만
start-server.bat

:: 프론트엔드만 (새 터미널)
cd frontend
npm install
npm start
```

### 3. 맥/Linux에서 실행

```bash
# 백엔드
./mvnw spring-boot:run -Dspring.profiles.active=local

# 프론트엔드 (새 터미널)
cd frontend
npm install
npm start
```

## 접속 주소

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8080

## 로컬 테스트 체크리스트

### 위젯 기능 테스트

1. ✅ 로그인
   - URL: http://localhost:3000/login
   - 테스트 계정 사용 (TEST_ACCOUNTS.md 참조)

2. ✅ 대시보드 관리 메뉴 접근
   - 메뉴: "대시보드 관리" (`/admin/dashboards`)

3. ✅ 대시보드 생성
   - "대시보드 생성" 버튼 클릭
   - 역할 선택, 이름 입력
   - 위젯 추가 (기본/특화 위젯)

4. ✅ 위젯 드래그 앤 드롭
   - 시각 편집 모드에서 위젯 위치 변경
   - 위젯 순서 변경

5. ✅ 위젯 설정
   - 위젯 클릭하여 설정 모달 열기
   - 위치, config JSON, visibility 설정

6. ✅ 대시보드 저장
   - "저장" 버튼 클릭
   - 성공 메시지 확인

### 오류 확인 사항

- [ ] `dashboardConfig`에 `version`, `layout` 필드 포함 확인
- [ ] 위젯 구조에 `id`, `type`, `position` (row, col) 필수 필드 확인
- [ ] JSON 파싱 오류 없음 확인
- [ ] 500 Internal Server Error 없음 확인
- [ ] 404 Not Found 오류 없음 확인

## 로컬 테스트 후 배포

### 1. 커밋 및 푸시

```bash
git add .
git commit -m "feat: 위젯 기능 개선"
git push origin develop
```

### 2. GitHub Actions 자동 배포

- `develop` 브랜치에 푸시하면 자동으로 개발 서버에 배포됩니다.
- 배포 완료 후 https://dev.core-solution.co.kr 에서 확인

### 3. 배포 후 확인

1. 서버 로그 확인
   ```bash
   ssh root@beta0629.cafe24.com
   journalctl -u mindgarden-dev -f
   ```

2. 헬스 체크
   ```bash
   curl https://dev.core-solution.co.kr/api/health
   ```

3. 실제 기능 테스트
   - https://dev.core-solution.co.kr/login
   - 위젯 기능 재테스트

## 문제 해결

### 백엔드가 시작되지 않는 경우

1. 포트 8080이 사용 중인지 확인
   ```bash
   # 윈도우
   netstat -ano | findstr :8080
   
   # 맥/Linux
   lsof -i :8080
   ```

2. Java 버전 확인 (JDK 17 필요)
   ```bash
   java -version
   ```

3. 환경 변수 로드 확인
   ```bash
   # 윈도우 (PowerShell)
   .\scripts\load-env.ps1
   
   # 맥/Linux
   source scripts/load-env.sh
   ```

### 프론트엔드가 시작되지 않는 경우

1. 포트 3000이 사용 중인지 확인
2. `node_modules` 재설치
   ```bash
   cd frontend
   rm -rf node_modules
   npm install
   ```

### 데이터베이스 연결 오류

1. `.env.local` 파일의 DB 정보 확인
2. 개발 서버 DB 접근 권한 확인
3. 방화벽 설정 확인

## 참고 문서

- [개발 환경 설정 가이드](../DEV_ENV_SETUP.md)
- [빠른 시작 가이드](../../QUICK_START.md)
- [테스트 계정 목록](./TEST_ACCOUNTS.md)
- [위젯 드래그 앤 드롭 테스트](./WIDGET_DRAG_AND_DROP_TEST.md)

