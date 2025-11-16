# MySQL 데이터베이스 설치 가이드

## 📋 개요

MindGarden 프로젝트는 **MySQL 8.x**를 사용합니다.

## 🚀 설치 방법

### 방법 1: MySQL 공식 설치 프로그램 (권장)

1. **MySQL 다운로드**
   - https://dev.mysql.com/downloads/mysql/
   - Windows용 MySQL Installer 다운로드

2. **설치 과정**
   - 설치 유형: "Developer Default" 또는 "Server only" 선택
   - 포트: 3306 (기본값)
   - Root 비밀번호 설정 (기억해두세요!)
   - Windows 서비스로 등록: **체크**

3. **PATH 환경 변수 확인**
   - 설치 후 PowerShell 재시작 필요
   - 또는 MySQL이 설치된 경로를 PATH에 추가

### 방법 2: Chocolatey 사용

```powershell
choco install mysql
```

### 방법 3: XAMPP/WAMP (개발용)

- XAMPP: https://www.apachefriends.org/
- WAMP: https://www.wampserver.com/
- 간단한 설치이지만 프로덕션 환경에는 부적합

## 🗄️ 데이터베이스 생성

MySQL 설치 및 서비스 시작 후, 다음 SQL 명령으로 데이터베이스를 생성하세요:

```sql
CREATE DATABASE mind_garden 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

## ⚙️ 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하거나 환경 변수를 설정하세요:

```bash
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
```

또는 PowerShell에서:

```powershell
$env:DB_USERNAME="root"
$env:DB_PASSWORD="your_mysql_password"
```

## 🔧 설정 확인

### MySQL 서비스 상태 확인

```powershell
Get-Service -Name "*mysql*"
```

### MySQL 서비스 시작

```powershell
Start-Service MySQL80  # 또는 설치된 서비스 이름
```

### MySQL 연결 테스트

```powershell
mysql -u root -p
```

## 📝 참고

- 기본 포트: 3306
- 문자셋: utf8mb4
- 콜레이션: utf8mb4_unicode_ci
- Hibernate가 자동으로 테이블을 생성합니다 (`ddl-auto: update`)

