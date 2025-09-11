# MindGarden 상담 관리 시스템

## 📚 문서

모든 프로젝트 문서는 `docs/` 폴더에 있습니다:

- **[프로젝트 개요](docs/README.md)** - 시스템 소개 및 주요 기능
- **[개발 가이드](docs/DEVELOPMENT_GUIDE.md)** - 개발 환경 설정 및 코딩 표준
- **[환경 설정](docs/ENVIRONMENT_SETUP.md)** - 로컬/운영 환경 설정 가이드
- **[API 설계](docs/API_DESIGN.md)** - REST API 명세서
- **[시스템 설계](docs/SYSTEM_DESIGN.md)** - 아키텍처 및 설계 문서
- **[운영 가이드](docs/OPERATION_DEPLOYMENT_GUIDE.md)** - 배포 및 운영 가이드
- **[급여 관리 시스템](docs/SALARY_MANAGEMENT_SYSTEM.md)** - 급여 계산 및 관리 시스템 가이드

## 🚀 빠른 시작

```bash
# 백엔드 실행
mvn spring-boot:run -Dspring-boot.run.profiles=local

# 프론트엔드 실행
cd frontend
npm install
npm start
```

## ⚠️ 중요: 설정 파일 백업

**개발 환경 설정이 손실될 경우를 대비해 백업본을 제공합니다:**

### 로컬 개발 환경
- **원본**: `src/main/resources/application-local.yml`
- **백업본**: `src/main/resources/application-local.yml.backup`

### 운영 환경
- **원본**: `src/main/resources/application-prod.yml`
- **백업본**: `src/main/resources/application-prod.yml.backup`

**설정 파일 복원:**
```bash
# 로컬 환경 복원
cp src/main/resources/application-local.yml.backup src/main/resources/application-local.yml

# 운영 환경 복원
cp src/main/resources/application-prod.yml.backup src/main/resources/application-prod.yml
```

## 📁 프로젝트 구조

```
mindGarden/
├── docs/                    # 📚 모든 문서
├── src/                     # 🔧 백엔드 소스코드
├── frontend/                # 🎨 프론트엔드 소스코드
├── README.md               # 📖 이 파일
└── pom.xml                 # 📦 Maven 설정
```

자세한 내용은 [프로젝트 개요](docs/README.md)를 참조하세요.
