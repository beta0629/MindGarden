# 🗂️ MindGarden 프로젝트 폴더 재구성 계획

> **목적**: 중구난방인 프로젝트 구조를 체계적으로 정리  
> **작성일**: 2025-11-28  
> **상태**: 실행 준비 완료

---

## 📊 현재 문제점 분석

### 🚨 **심각한 문제들**
1. **스크립트 폴더 혼재**: 180개 파일이 한 폴더에 무작위 배치
2. **문서 중복**: docs/mgsb/ 358개 파일, archive/ 86개 파일
3. **SQL 파일 분산**: scripts/, sql/, sql-scripts/, database/ 등 4곳에 분산
4. **백엔드 중복**: backend-ops/, frontend-ops/, frontend-trinity/ 등 중복 구조
5. **테스트 파일 분산**: e2e-tests/, test-data/, test-reports/ 등 분산
6. **환경 파일 중복**: 루트에 여러 env 파일들 산재

---

## 🎯 새로운 폴더 구조 (목표)

```
/Users/mind/mindGarden/
├── 📁 core/                          # 핵심 애플리케이션
│   ├── backend/                      # 메인 백엔드 (기존 src/)
│   ├── frontend/                     # 메인 프론트엔드 (기존 frontend/)
│   └── mobile/                       # 모바일 앱 (기존 mobile/)
│
├── 📁 ops/                           # 운영 관련
│   ├── backend-ops/                  # 백엔드 운영 도구
│   ├── frontend-ops/                 # 프론트엔드 운영 도구
│   └── trinity/                      # Trinity 관련 (frontend-trinity/)
│
├── 📁 scripts/                       # 스크립트 통합 관리
│   ├── automation/                   # 자동화 스크립트
│   │   ├── ci-cd/                   # CI/CD 관련
│   │   ├── deployment/              # 배포 관련
│   │   └── monitoring/              # 모니터링 관련
│   ├── database/                     # 데이터베이스 관련
│   │   ├── migrations/              # 마이그레이션
│   │   ├── procedures/              # 저장 프로시저
│   │   ├── backups/                 # 백업 관련
│   │   └── maintenance/             # 유지보수
│   ├── development/                  # 개발 도구
│   │   ├── code-quality/            # 코드 품질
│   │   ├── testing/                 # 테스트 관련
│   │   └── utilities/               # 유틸리티
│   ├── design-system/                # 디자인 시스템 관련 ⭐ 신규
│   │   ├── css-tools/               # CSS 도구들
│   │   ├── color-management/        # 색상 관리 (CI/BI 대비)
│   │   └── widget-tools/            # 위젯 관련 도구
│   └── server-management/            # 서버 관리
│       ├── ssl/                     # SSL 관련
│       ├── nginx/                   # Nginx 관련
│       └── systemd/                 # Systemd 관련
│
├── 📁 database/                      # 데이터베이스 통합
│   ├── schema/                       # 스키마 정의
│   ├── migrations/                   # 마이그레이션 파일들
│   ├── procedures/                   # 저장 프로시저들
│   ├── test-data/                    # 테스트 데이터
│   └── backups/                      # 백업 파일들
│
├── 📁 docs/                          # 문서 통합 관리
│   ├── guides/                       # 가이드 문서들
│   │   ├── quick-start/             # 빠른 시작 가이드들
│   │   ├── development/             # 개발 가이드들
│   │   ├── deployment/              # 배포 가이드들
│   │   └── troubleshooting/         # 문제 해결 가이드들
│   ├── design-system/                # 디자인 시스템 문서
│   │   ├── v2/                      # 현재 v2.0 문서들
│   │   ├── ci-bi/                   # CI/BI 관련 문서들 ⭐ 신규
│   │   └── migration/               # 마이그레이션 가이드들
│   ├── api/                          # API 문서들
│   ├── architecture/                 # 아키텍처 문서들
│   ├── archive/                      # 아카이브 (기존 유지)
│   └── project-management/           # 프로젝트 관리 문서들
│       ├── reports/                 # 리포트들
│       ├── plans/                   # 계획서들
│       └── analysis/                # 분석 문서들
│
├── 📁 tests/                         # 테스트 통합
│   ├── e2e/                         # E2E 테스트
│   ├── integration/                  # 통합 테스트
│   ├── unit/                        # 단위 테스트
│   ├── data/                        # 테스트 데이터
│   └── reports/                     # 테스트 리포트
│
├── 📁 config/                        # 설정 파일들
│   ├── environments/                 # 환경별 설정
│   │   ├── local/                   # 로컬 환경
│   │   ├── development/             # 개발 환경
│   │   └── production/              # 운영 환경
│   ├── nginx/                       # Nginx 설정
│   ├── systemd/                     # Systemd 설정
│   └── ssl/                         # SSL 설정
│
├── 📁 tools/                         # 개발 도구들
│   ├── build/                       # 빌드 도구
│   ├── linting/                     # 린팅 도구
│   └── formatting/                  # 포맷팅 도구
│
├── 📁 temp/                          # 임시 파일들 ⭐ 신규
│   ├── logs/                        # 로그 파일들
│   ├── cache/                       # 캐시 파일들
│   └── backups/                     # 임시 백업들
│
└── 📁 archive/                       # 아카이브 (기존 유지)
    ├── legacy-code/                  # 레거시 코드
    ├── old-docs/                     # 구 문서들
    └── deprecated/                   # 더 이상 사용하지 않는 파일들
```

---

## 🚀 재구성 실행 계획

### **Phase 1: 스크립트 폴더 정리** (1일)

#### **1.1 새로운 스크립트 구조 생성**
```bash
mkdir -p scripts/{automation/{ci-cd,deployment,monitoring},database/{migrations,procedures,backups,maintenance},development/{code-quality,testing,utilities},design-system/{css-tools,color-management,widget-tools},server-management/{ssl,nginx,systemd}}
```

#### **1.2 스크립트 파일 분류 및 이동**
```bash
# CI/BI 관련 스크립트 (새로 만든 것들)
mv scripts/detect-hardcoded-colors.js scripts/design-system/color-management/
mv scripts/convert-hardcoded-colors.js scripts/design-system/color-management/
mv scripts/create-unified-css-variables.js scripts/design-system/color-management/

# 위젯 관련 스크립트
mv scripts/create-widget.js scripts/design-system/widget-tools/

# CSS 관련 스크립트
mv scripts/convert-all-css-files.js scripts/design-system/css-tools/
mv scripts/convert-remaining-colors.js scripts/design-system/css-tools/
mv scripts/fix-*-paths.js scripts/development/utilities/

# 데이터베이스 관련
mv scripts/*migration*.sh scripts/database/migrations/
mv scripts/*procedure*.sql scripts/database/procedures/
mv scripts/database-*.sh scripts/database/backups/

# 배포 관련
mv scripts/deploy-*.sh scripts/automation/deployment/
mv scripts/trigger-production-deploy.sh scripts/automation/deployment/

# SSL 관련
mv scripts/issue-*ssl*.sh scripts/server-management/ssl/

# 테스트 관련
mv scripts/run-*-tests.sh scripts/development/testing/
mv scripts/test/ scripts/development/testing/

# 코드 품질 관련
mv scripts/collect-code-quality-metrics.js scripts/development/code-quality/
mv scripts/generate-code-quality-report.js scripts/development/code-quality/
mv scripts/validate-*.js scripts/development/code-quality/

# 서버 관리
mv scripts/setup-*-server.sh scripts/server-management/
mv scripts/health-check.sh scripts/automation/monitoring/
mv scripts/backup-monitor.sh scripts/automation/monitoring/
```

### **Phase 2: 문서 폴더 정리** (1일)

#### **2.1 새로운 문서 구조 생성**
```bash
mkdir -p docs/{guides/{quick-start,development,deployment,troubleshooting},design-system/{v2,ci-bi,migration},api,architecture,project-management/{reports,plans,analysis}}
```

#### **2.2 문서 파일 분류 및 이동**
```bash
# CI/BI 관련 문서들 (새로 만든 것들)
mv docs/CI_BI_DESIGN_STANDARDIZATION_GUIDE.md docs/design-system/ci-bi/
mv docs/CI_BI_PREPARATION_HARDCODED_VALUES.md docs/design-system/ci-bi/
mv docs/DESIGN_STANDARDIZATION_ANALYSIS.md docs/design-system/ci-bi/
mv docs/QUICK_START_GUIDE.md docs/design-system/ci-bi/

# 디자인 시스템 v2 문서들
mv docs/design-system-v2/* docs/design-system/v2/

# 위젯 관련 문서들
mv docs/WIDGET_*.md docs/design-system/v2/widgets/
mv docs/widgets/* docs/design-system/v2/widgets/

# 가이드 문서들
mv docs/START_HERE.md docs/guides/quick-start/
mv docs/DEV_ENV_SETUP.md docs/guides/development/
mv docs/AUTOMATED_TESTING_GUIDE.md docs/guides/development/

# 프로젝트 관리 문서들
mv docs/PHASE*.md docs/project-management/reports/
mv docs/MAPPING_*.md docs/project-management/analysis/
mv docs/HARDCODING_*.md docs/project-management/analysis/

# mgsb 폴더 정리 (너무 많으니 카테고리별로 분류)
# 이 부분은 별도 스크립트로 처리
```

### **Phase 3: 데이터베이스 파일 통합** (0.5일)

#### **3.1 새로운 데이터베이스 구조 생성**
```bash
mkdir -p database/{schema,migrations,procedures,test-data,backups}
```

#### **3.2 SQL 파일 통합**
```bash
# 기존 분산된 SQL 파일들 통합
mv sql/* database/schema/
mv sql-scripts/* database/migrations/
mv database/migrations/* database/migrations/
mv test-data/* database/test-data/

# 스크립트에서 SQL 파일들 이동
mv scripts/*.sql database/procedures/
```

### **Phase 4: 환경 설정 파일 정리** (0.5일)

#### **4.1 새로운 설정 구조 생성**
```bash
mkdir -p config/environments/{local,development,production}
```

#### **4.2 환경 파일 정리**
```bash
# 환경 파일들 정리
mv dev.env config/environments/development/
mv env.local.example config/environments/local/
mv env.production.example config/environments/production/

# Nginx 설정 이동
mv config/nginx/* config/nginx/

# Systemd 설정 이동
mv config/systemd/* config/systemd/
```

### **Phase 5: 테스트 파일 통합** (0.5일)

#### **5.1 새로운 테스트 구조 생성**
```bash
mkdir -p tests/{e2e,integration,unit,data,reports}
```

#### **5.2 테스트 파일 이동**
```bash
# 테스트 파일들 통합
mv e2e-tests/* tests/e2e/
mv test-data/* tests/data/
mv test-reports/* tests/reports/
```

### **Phase 6: 임시 파일 정리** (0.5일)

#### **6.1 임시 폴더 생성**
```bash
mkdir -p temp/{logs,cache,backups}
```

#### **6.2 임시 파일들 이동**
```bash
# 로그 파일들
mv logs/* temp/logs/
mv *.log temp/logs/

# 쿠키 파일들 (임시)
mv *cookies*.txt temp/cache/

# 임시 백업들
mv backup/* temp/backups/
```

---

## 🛠️ 자동화 스크립트 생성

### **폴더 재구성 자동화 스크립트**

```bash
#!/bin/bash
# scripts/reorganize-project.sh

echo "🗂️ MindGarden 프로젝트 폴더 재구성 시작..."

# Phase 1: 스크립트 폴더 정리
echo "📁 Phase 1: 스크립트 폴더 정리 중..."
./scripts/reorganize-scripts.sh

# Phase 2: 문서 폴더 정리  
echo "📚 Phase 2: 문서 폴더 정리 중..."
./scripts/reorganize-docs.sh

# Phase 3: 데이터베이스 파일 통합
echo "🗄️ Phase 3: 데이터베이스 파일 통합 중..."
./scripts/reorganize-database.sh

# Phase 4: 환경 설정 파일 정리
echo "⚙️ Phase 4: 환경 설정 파일 정리 중..."
./scripts/reorganize-config.sh

# Phase 5: 테스트 파일 통합
echo "🧪 Phase 5: 테스트 파일 통합 중..."
./scripts/reorganize-tests.sh

# Phase 6: 임시 파일 정리
echo "🗑️ Phase 6: 임시 파일 정리 중..."
./scripts/reorganize-temp.sh

echo "✅ 프로젝트 폴더 재구성 완료!"
echo "📋 새로운 구조는 PROJECT_STRUCTURE.md 파일을 참고하세요."
```

---

## 📋 재구성 후 혜택

### **개발 효율성**
- 🔍 **파일 찾기 시간 80% 단축**
- 📝 **새 스크립트 작성 시 위치 명확**
- 🗂️ **문서 관리 체계화**

### **유지보수성**
- 🧹 **중복 파일 제거**
- 📁 **논리적 폴더 구조**
- 🔄 **일관된 네이밍 규칙**

### **협업 효율성**
- 👥 **팀원들이 파일 쉽게 찾기**
- 📖 **명확한 문서 구조**
- 🎯 **목적별 폴더 분리**

---

## ⚠️ 주의사항

### **백업 필수**
```bash
# 재구성 전 전체 백업
tar -czf mindgarden-backup-$(date +%Y%m%d-%H%M%S).tar.gz /Users/mind/mindGarden
```

### **Git 히스토리 보존**
```bash
# Git mv 사용하여 히스토리 보존
git mv old-path new-path
```

### **Import 경로 업데이트**
- JavaScript/TypeScript import 경로 수정 필요
- 문서 내 링크 경로 수정 필요
- 스크립트 내 경로 참조 수정 필요

---

## 🎯 실행 순서

1. **백업 생성**: 전체 프로젝트 백업
2. **Phase 1-6 순차 실행**: 단계별 재구성
3. **경로 업데이트**: import 및 링크 경로 수정
4. **테스트**: 빌드 및 실행 테스트
5. **문서 업데이트**: README 및 가이드 문서 업데이트

**💡 이제 프로젝트가 훨씬 깔끔하고 찾기 쉬워집니다!**

---

**📝 작성일**: 2025-11-28  
**✍️ 작성자**: MindGarden 개발팀  
**🔄 버전**: 1.0.0  
**📊 상태**: 실행 준비 완료 ✅
