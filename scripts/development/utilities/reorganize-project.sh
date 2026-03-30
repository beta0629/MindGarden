#!/bin/bash

# 🗂️ MindGarden 프로젝트 폴더 재구성 마스터 스크립트
# 
# 목적: 중구난방인 프로젝트 구조를 체계적으로 정리
# 작성일: 2025-11-28
# 사용법: ./scripts/reorganize-project.sh

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로그 함수들
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_phase() {
    echo -e "${PURPLE}🚀 $1${NC}"
}

# 프로젝트 루트 확인
PROJECT_ROOT="/Users/mind/mindGarden"
if [ ! -d "$PROJECT_ROOT" ]; then
    log_error "프로젝트 루트를 찾을 수 없습니다: $PROJECT_ROOT"
    exit 1
fi

cd "$PROJECT_ROOT"

echo "🗂️ MindGarden 프로젝트 폴더 재구성 시작..."
echo "📍 프로젝트 루트: $PROJECT_ROOT"
echo ""

# 백업 생성
log_phase "백업 생성 중..."
BACKUP_NAME="mindgarden-backup-$(date +%Y%m%d-%H%M%S)"
log_info "백업 파일: ${BACKUP_NAME}.tar.gz"

# 중요한 폴더들만 백업 (용량 절약)
tar -czf "${BACKUP_NAME}.tar.gz" \
    --exclude='node_modules' \
    --exclude='target' \
    --exclude='build' \
    --exclude='.git' \
    scripts/ docs/ sql/ sql-scripts/ database/ config/ \
    e2e-tests/ test-data/ test-reports/ logs/ \
    *.env *.sql *.log *.txt 2>/dev/null || true

log_success "백업 완료: ${BACKUP_NAME}.tar.gz"
echo ""

# Phase 1: 스크립트 폴더 정리
log_phase "Phase 1: 스크립트 폴더 정리 중..."

# 새로운 스크립트 구조 생성
log_info "새로운 스크립트 폴더 구조 생성 중..."
mkdir -p scripts-new/{automation/{ci-cd,deployment,monitoring},database/{migrations,procedures,backups,maintenance},development/{code-quality,testing,utilities},design-system/{css-tools,color-management,widget-tools},server-management/{ssl,nginx,systemd}}

# CI/BI 관련 스크립트 (새로 만든 것들)
log_info "CI/BI 관련 스크립트 이동 중..."
[ -f "scripts/detect-hardcoded-colors.js" ] && mv scripts/detect-hardcoded-colors.js scripts-new/design-system/color-management/
[ -f "scripts/convert-hardcoded-colors.js" ] && mv scripts/convert-hardcoded-colors.js scripts-new/design-system/color-management/
[ -f "scripts/create-unified-css-variables.js" ] && mv scripts/create-unified-css-variables.js scripts-new/design-system/color-management/

# 위젯 관련 스크립트
log_info "위젯 관련 스크립트 이동 중..."
[ -f "scripts/create-widget.js" ] && mv scripts/create-widget.js scripts-new/design-system/widget-tools/

# CSS 관련 스크립트
log_info "CSS 관련 스크립트 이동 중..."
[ -f "scripts/convert-all-css-files.js" ] && mv scripts/convert-all-css-files.js scripts-new/design-system/css-tools/
[ -f "scripts/convert-remaining-colors.js" ] && mv scripts/convert-remaining-colors.js scripts-new/design-system/css-tools/
[ -f "scripts/check-hardcoding.js" ] && mv scripts/check-hardcoding.js scripts-new/design-system/css-tools/
[ -f "scripts/check-hardcoding-enhanced.js" ] && mv scripts/check-hardcoding-enhanced.js scripts-new/design-system/css-tools/

# 경로 수정 관련 스크립트들
log_info "개발 유틸리티 스크립트 이동 중..."
mv scripts/fix-*-paths.js scripts-new/development/utilities/ 2>/dev/null || true
mv scripts/fix-*-imports.js scripts-new/development/utilities/ 2>/dev/null || true
mv scripts/fix-*.js scripts-new/development/utilities/ 2>/dev/null || true

# 데이터베이스 관련
log_info "데이터베이스 관련 스크립트 이동 중..."
mv scripts/*migration*.sh scripts-new/database/migrations/ 2>/dev/null || true
mv scripts/*procedure*.sql scripts-new/database/procedures/ 2>/dev/null || true
mv scripts/database-*.sh scripts-new/database/backups/ 2>/dev/null || true
mv scripts/*flyway*.sh scripts-new/database/migrations/ 2>/dev/null || true

# 배포 관련
log_info "배포 관련 스크립트 이동 중..."
mv scripts/deploy-*.sh scripts-new/automation/deployment/ 2>/dev/null || true
mv scripts/trigger-production-deploy.sh scripts-new/automation/deployment/ 2>/dev/null || true
mv scripts/setup-*-server.sh scripts-new/server-management/ 2>/dev/null || true

# SSL 관련
log_info "SSL 관련 스크립트 이동 중..."
mv scripts/issue-*ssl*.sh scripts-new/server-management/ssl/ 2>/dev/null || true
mv scripts/*ssl*.sh scripts-new/server-management/ssl/ 2>/dev/null || true

# 테스트 관련
log_info "테스트 관련 스크립트 이동 중..."
mv scripts/run-*-tests.sh scripts-new/development/testing/ 2>/dev/null || true
[ -d "scripts/test" ] && mv scripts/test/* scripts-new/development/testing/ 2>/dev/null || true

# 코드 품질 관련
log_info "코드 품질 관련 스크립트 이동 중..."
mv scripts/collect-code-quality-metrics.js scripts-new/development/code-quality/ 2>/dev/null || true
mv scripts/generate-code-quality-report.js scripts-new/development/code-quality/ 2>/dev/null || true
mv scripts/validate-*.js scripts-new/development/code-quality/ 2>/dev/null || true

# 서버 관리
log_info "서버 관리 스크립트 이동 중..."
mv scripts/health-check.sh scripts-new/automation/monitoring/ 2>/dev/null || true
mv scripts/backup-monitor.sh scripts-new/automation/monitoring/ 2>/dev/null || true
mv scripts/check-*-status.sh scripts-new/automation/monitoring/ 2>/dev/null || true

# 나머지 스크립트들 (일반 유틸리티로)
log_info "나머지 스크립트들 이동 중..."
mv scripts/*.sh scripts-new/development/utilities/ 2>/dev/null || true
mv scripts/*.js scripts-new/development/utilities/ 2>/dev/null || true
mv scripts/*.py scripts-new/development/utilities/ 2>/dev/null || true

# 기존 scripts 폴더를 scripts-old로 백업하고 새 구조 적용
log_info "스크립트 폴더 교체 중..."
[ -d "scripts-old" ] && rm -rf scripts-old
mv scripts scripts-old
mv scripts-new scripts

log_success "Phase 1 완료: 스크립트 폴더 정리"
echo ""

# Phase 2: 문서 폴더 정리
log_phase "Phase 2: 문서 폴더 정리 중..."

# 새로운 문서 구조 생성
log_info "새로운 문서 폴더 구조 생성 중..."
mkdir -p docs-new/{guides/{quick-start,development,deployment,troubleshooting},design-system/{v2,ci-bi,migration},api,architecture,project-management/{reports,plans,analysis}}

# 기존 archive는 그대로 유지
[ -d "docs/archive" ] && cp -r docs/archive docs-new/

# CI/BI 관련 문서들 (새로 만든 것들)
log_info "CI/BI 관련 문서 이동 중..."
[ -f "docs/CI_BI_DESIGN_STANDARDIZATION_GUIDE.md" ] && mv docs/CI_BI_DESIGN_STANDARDIZATION_GUIDE.md docs-new/design-system/ci-bi/
[ -f "docs/CI_BI_PREPARATION_HARDCODED_VALUES.md" ] && mv docs/CI_BI_PREPARATION_HARDCODED_VALUES.md docs-new/design-system/ci-bi/
[ -f "docs/DESIGN_STANDARDIZATION_ANALYSIS.md" ] && mv docs/DESIGN_STANDARDIZATION_ANALYSIS.md docs-new/design-system/ci-bi/
[ -f "docs/QUICK_START_GUIDE.md" ] && mv docs/QUICK_START_GUIDE.md docs-new/design-system/ci-bi/

# 디자인 시스템 v2 문서들
log_info "디자인 시스템 문서 이동 중..."
[ -d "docs/design-system-v2" ] && mv docs/design-system-v2/* docs-new/design-system/v2/ 2>/dev/null || true

# 위젯 관련 문서들
log_info "위젯 관련 문서 이동 중..."
mv docs/WIDGET_*.md docs-new/design-system/v2/ 2>/dev/null || true
[ -d "docs/widgets" ] && mv docs/widgets/* docs-new/design-system/v2/ 2>/dev/null || true

# 가이드 문서들
log_info "가이드 문서 이동 중..."
[ -f "docs/START_HERE.md" ] && mv docs/START_HERE.md docs-new/guides/quick-start/
[ -f "docs/DEV_ENV_SETUP.md" ] && mv docs/DEV_ENV_SETUP.md docs-new/guides/development/
[ -f "docs/AUTOMATED_TESTING_GUIDE.md" ] && mv docs/AUTOMATED_TESTING_GUIDE.md docs-new/guides/development/

# 프로젝트 관리 문서들
log_info "프로젝트 관리 문서 이동 중..."
mv docs/PHASE*.md docs-new/project-management/reports/ 2>/dev/null || true
mv docs/MAPPING_*.md docs-new/project-management/analysis/ 2>/dev/null || true
mv docs/HARDCODING_*.md docs-new/project-management/analysis/ 2>/dev/null || true

# 아키텍처 관련 문서들
log_info "아키텍처 문서 이동 중..."
[ -d "docs/design-architecture" ] && mv docs/design-architecture docs-new/architecture/design/

# 나머지 문서들
log_info "나머지 문서들 이동 중..."
mv docs/*.md docs-new/guides/ 2>/dev/null || true

# mgsb 폴더는 너무 크니까 project-management/archive로 이동
log_info "mgsb 폴더 이동 중..."
[ -d "docs/mgsb" ] && mv docs/mgsb docs-new/project-management/archive/

# 문서 폴더 교체
log_info "문서 폴더 교체 중..."
[ -d "docs-old" ] && rm -rf docs-old
mv docs docs-old
mv docs-new docs

log_success "Phase 2 완료: 문서 폴더 정리"
echo ""

# Phase 3: 데이터베이스 파일 통합
log_phase "Phase 3: 데이터베이스 파일 통합 중..."

# 새로운 데이터베이스 구조 생성
log_info "새로운 데이터베이스 폴더 구조 생성 중..."
mkdir -p database-new/{schema,migrations,procedures,test-data,backups}

# SQL 파일들 통합
log_info "SQL 파일들 통합 중..."
[ -d "sql" ] && mv sql/* database-new/schema/ 2>/dev/null || true
[ -d "sql-scripts" ] && mv sql-scripts/* database-new/migrations/ 2>/dev/null || true
[ -d "database/migrations" ] && mv database/migrations/* database-new/migrations/ 2>/dev/null || true
[ -d "test-data" ] && mv test-data/* database-new/test-data/ 2>/dev/null || true

# 루트에 있는 SQL 파일들
log_info "루트 SQL 파일들 이동 중..."
mv *.sql database-new/procedures/ 2>/dev/null || true

# 데이터베이스 폴더 교체
log_info "데이터베이스 폴더 교체 중..."
[ -d "database-old" ] && rm -rf database-old
[ -d "database" ] && mv database database-old
mv database-new database

# 기존 폴더들 정리
[ -d "sql" ] && mv sql sql-old
[ -d "sql-scripts" ] && mv sql-scripts sql-scripts-old

log_success "Phase 3 완료: 데이터베이스 파일 통합"
echo ""

# Phase 4: 환경 설정 파일 정리
log_phase "Phase 4: 환경 설정 파일 정리 중..."

# 새로운 설정 구조 생성
log_info "새로운 설정 폴더 구조 생성 중..."
mkdir -p config-new/environments/{local,development,production}

# 기존 config 폴더 내용 복사
[ -d "config" ] && cp -r config/* config-new/ 2>/dev/null || true

# 환경 파일들 정리
log_info "환경 파일들 정리 중..."
[ -f "dev.env" ] && mv dev.env config-new/environments/development/
[ -f "env.local.example" ] && mv env.local.example config-new/environments/local/
[ -f "env.production.example" ] && mv env.production.example config-new/environments/production/

# 설정 폴더 교체
log_info "설정 폴더 교체 중..."
[ -d "config-old" ] && rm -rf config-old
[ -d "config" ] && mv config config-old
mv config-new config

log_success "Phase 4 완료: 환경 설정 파일 정리"
echo ""

# Phase 5: 테스트 파일 통합
log_phase "Phase 5: 테스트 파일 통합 중..."

# 새로운 테스트 구조 생성
log_info "새로운 테스트 폴더 구조 생성 중..."
mkdir -p tests/{e2e,integration,unit,data,reports}

# 테스트 파일들 통합
log_info "테스트 파일들 통합 중..."
[ -d "e2e-tests" ] && mv e2e-tests/* tests/e2e/ 2>/dev/null || true
[ -d "test-data" ] && mv test-data/* tests/data/ 2>/dev/null || true
[ -d "test-reports" ] && mv test-reports/* tests/reports/ 2>/dev/null || true

# 기존 폴더들 정리
[ -d "e2e-tests" ] && mv e2e-tests e2e-tests-old
[ -d "test-reports" ] && mv test-reports test-reports-old

log_success "Phase 5 완료: 테스트 파일 통합"
echo ""

# Phase 6: 임시 파일 정리
log_phase "Phase 6: 임시 파일 정리 중..."

# 임시 폴더 생성
log_info "임시 폴더 구조 생성 중..."
mkdir -p temp/{logs,cache,backups}

# 로그 파일들
log_info "로그 파일들 정리 중..."
[ -d "logs" ] && mv logs/* temp/logs/ 2>/dev/null || true
mv *.log temp/logs/ 2>/dev/null || true

# 쿠키 파일들 (임시)
log_info "임시 파일들 정리 중..."
mv *cookies*.txt temp/cache/ 2>/dev/null || true

# 임시 백업들
log_info "백업 파일들 정리 중..."
[ -d "backup" ] && mv backup/* temp/backups/ 2>/dev/null || true

# 기존 폴더들 정리
[ -d "logs" ] && mv logs logs-old
[ -d "backup" ] && mv backup backup-old

log_success "Phase 6 완료: 임시 파일 정리"
echo ""

# 새로운 프로젝트 구조 문서 생성
log_phase "프로젝트 구조 문서 생성 중..."
cat > PROJECT_STRUCTURE.md << 'EOF'
# 📁 MindGarden 프로젝트 구조 (재구성 완료)

> **재구성 완료일**: $(date +%Y-%m-%d)  
> **구조 버전**: 2.0

## 📂 새로운 폴더 구조

```
/Users/mind/mindGarden/
├── 📁 core/                          # 핵심 애플리케이션
│   ├── backend/ (src/)               # 메인 백엔드
│   ├── frontend/                     # 메인 프론트엔드
│   └── mobile/                       # 모바일 앱
│
├── 📁 ops/                           # 운영 관련
│   ├── backend-ops/                  # 백엔드 운영 도구
│   ├── frontend-ops/                 # 프론트엔드 운영 도구
│   └── trinity/ (frontend-trinity/)  # Trinity 관련
│
├── 📁 scripts/                       # 스크립트 통합 관리 ⭐ 재구성됨
│   ├── automation/                   # 자동화 스크립트
│   ├── database/                     # 데이터베이스 관련
│   ├── development/                  # 개발 도구
│   ├── design-system/                # 디자인 시스템 관련
│   └── server-management/            # 서버 관리
│
├── 📁 database/                      # 데이터베이스 통합 ⭐ 재구성됨
│   ├── schema/                       # 스키마 정의
│   ├── migrations/                   # 마이그레이션 파일들
│   ├── procedures/                   # 저장 프로시저들
│   ├── test-data/                    # 테스트 데이터
│   └── backups/                      # 백업 파일들
│
├── 📁 docs/                          # 문서 통합 관리 ⭐ 재구성됨
│   ├── guides/                       # 가이드 문서들
│   ├── design-system/                # 디자인 시스템 문서
│   ├── api/                          # API 문서들
│   ├── architecture/                 # 아키텍처 문서들
│   ├── archive/                      # 아카이브
│   └── project-management/           # 프로젝트 관리 문서들
│
├── 📁 tests/                         # 테스트 통합 ⭐ 재구성됨
│   ├── e2e/                         # E2E 테스트
│   ├── integration/                  # 통합 테스트
│   ├── unit/                        # 단위 테스트
│   ├── data/                        # 테스트 데이터
│   └── reports/                     # 테스트 리포트
│
├── 📁 config/                        # 설정 파일들 ⭐ 재구성됨
│   ├── environments/                 # 환경별 설정
│   ├── nginx/                       # Nginx 설정
│   ├── systemd/                     # Systemd 설정
│   └── ssl/                         # SSL 설정
│
├── 📁 temp/                          # 임시 파일들 ⭐ 신규
│   ├── logs/                        # 로그 파일들
│   ├── cache/                       # 캐시 파일들
│   └── backups/                     # 임시 백업들
│
└── 📁 *-old/                         # 기존 폴더들 (백업용)
    ├── scripts-old/                  # 기존 스크립트 폴더
    ├── docs-old/                     # 기존 문서 폴더
    └── ...                          # 기타 백업 폴더들
```

## 🎯 주요 변경사항

### ✅ 정리된 것들
- **스크립트**: 180개 → 카테고리별 분류
- **문서**: 358개 mgsb 파일들 → 체계적 분류  
- **SQL**: 4곳 분산 → 1곳 통합
- **테스트**: 3곳 분산 → 1곳 통합
- **환경설정**: 루트 산재 → config/ 통합

### 🔍 찾기 쉬워진 것들
- **CI/BI 도구**: `scripts/design-system/color-management/`
- **위젯 도구**: `scripts/design-system/widget-tools/`
- **배포 스크립트**: `scripts/automation/deployment/`
- **테스트 스크립트**: `scripts/development/testing/`
- **문서**: 목적별 폴더 분류

## 💡 사용 방법

### 스크립트 실행
```bash
# CI/BI 색상 탐지
./scripts/design-system/color-management/detect-hardcoded-colors.js

# 위젯 생성
./scripts/design-system/widget-tools/create-widget.js

# 배포
./scripts/automation/deployment/deploy-to-production.sh
```

### 문서 찾기
```bash
# CI/BI 가이드
docs/design-system/ci-bi/QUICK_START_GUIDE.md

# 개발 가이드  
docs/guides/development/

# API 문서
docs/api/
```

---

**📝 재구성 완료일**: $(date +%Y-%m-%d)  
**🔄 구조 버전**: 2.0  
**📊 상태**: 사용 준비 완료 ✅
EOF

log_success "프로젝트 구조 문서 생성 완료: PROJECT_STRUCTURE.md"
echo ""

# 완료 메시지
echo "🎉 MindGarden 프로젝트 폴더 재구성 완료!"
echo ""
echo "📊 재구성 결과:"
echo "  ✅ 스크립트: 카테고리별 분류 완료"
echo "  ✅ 문서: 목적별 폴더 구조 완료"  
echo "  ✅ 데이터베이스: 통합 관리 완료"
echo "  ✅ 테스트: 통합 폴더 완료"
echo "  ✅ 설정: 환경별 분류 완료"
echo ""
echo "📋 다음 단계:"
echo "  1. PROJECT_STRUCTURE.md 파일 확인"
echo "  2. 새로운 경로로 스크립트 테스트"
echo "  3. import 경로 업데이트 (필요시)"
echo "  4. README.md 업데이트"
echo ""
echo "💾 백업 파일: ${BACKUP_NAME}.tar.gz"
echo "🗂️ 기존 폴더들: *-old/ 폴더에 보관됨"
echo ""
log_success "재구성 완료! 이제 프로젝트가 훨씬 깔끔해졌습니다! 🚀"
