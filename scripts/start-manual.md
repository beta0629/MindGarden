# MindGarden 수동 실행 가이드

## 방법 1: npm concurrently 사용 (가장 간단)

프로젝트 루트에서:

```powershell
npm start
```

이 명령어는 백엔드와 프론트엔드를 자동으로 함께 실행합니다.

## 방법 2: 별도 터미널에서 실행

### 터미널 1: 백엔드
```powershell
cd F:\Trinity\workspace\MindGarden
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### 터미널 2: 프론트엔드
```powershell
cd F:\Trinity\workspace\MindGarden\frontend
npm start
```

## 방법 3: PowerShell 스크립트 사용

```powershell
.\scripts\start-simple.ps1
```

## 접속 주소

- 백엔드 API: http://localhost:8080
- 프론트엔드: http://localhost:3000

## 종료 방법

- Ctrl+C를 누르면 실행 중인 프로세스가 종료됩니다.
- 여러 터미널을 사용한 경우 각 터미널에서 Ctrl+C를 눌러주세요.

