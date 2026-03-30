문서 위치: docs/architecture/PROJECT_STRUCTURE.md

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
│   └── backups/                     # 백업 파일들
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
