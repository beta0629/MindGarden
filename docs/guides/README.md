# MindGarden 프로젝트 문서

**최종 업데이트**: 2025년 11월 28일

---

## 🚨 **CI/BI 변경 대비 디자인 표준화** (신규 추가)

### 필수 가이드 ⭐ **CI/BI 작업 전 필수 완료**

1. **[⚡ 빠른 시작 가이드](QUICK_START_GUIDE.md)** 🚀 **실무진 필수**
   - 3단계로 끝내는 하드코딩 제거
   - 30분 현황 파악 + 3시간 자동 변환
   - CI/BI 적용 방법 및 문제 해결

2. **[🎨 완전 가이드](CI_BI_DESIGN_STANDARDIZATION_GUIDE.md)** ⭐ **상세 매뉴얼**
   - 현황 분석 및 문제점 정리
   - 단계별 실행 가이드 (Phase 1-3)
   - 자동화 도구 사용법 및 검증 방법
   - CI/BI 적용 프로세스 및 문제 해결

3. **[📊 하드코딩 현황 분석](CI_BI_PREPARATION_HARDCODED_VALUES.md)** 📋 **분석 리포트**
   - 50개 파일, 400+ 하드코딩 색상 발견
   - 브랜딩 관련 위험 파일 목록
   - Phase별 작업 체크리스트

4. **[🔧 디자인 표준화 분석](DESIGN_STANDARDIZATION_ANALYSIS.md)** 📈 **기술 분석**
   - 5개 CSS 변수 파일 중복 문제
   - 자동화 도구 및 예상 효과
   - 단계별 구현 계획

### 자동화 도구 🛠️

- `scripts/detect-hardcoded-colors.js` - 하드코딩 색상 탐지
- `scripts/convert-hardcoded-colors.js` - 하드코딩 색상 자동 변환
- `scripts/create-unified-css-variables.js` - 통합 CSS 변수 시스템 생성

### 🎯 **CI/BI 변경 시 혜택**
- **변경 시간**: 2-3일 → 1시간 (87% 단축)
- **수정 파일**: 50개 → 1개 (98% 감소)
- **누락 위험**: 높음 → 0% (완전 제거)

---

## 📚 문서 구조

MindGarden 프로젝트의 모든 문서는 목적에 따라 카테고리별로 구성되어 있습니다.

---

## 🎨 디자인 시스템 v2.0 (Design System)

### 필수 문서 ⭐

모든 디자인 시스템 문서는 `design-system-v2/` 폴더에 있습니다.

1. **[실전 적용 플랜](design-system-v2/IMPLEMENTATION_PLAN.md)** 🚀 **구현 시 필수**
   - Phase 1-5 상세 실행 계획
   - 공통 컴포넌트 라이브러리 구축
   - 페이지 마이그레이션 전략
   - 체크리스트 및 일정

2. **[디자인 시스템 가이드](design-system-v2/MINDGARDEN_DESIGN_SYSTEM_GUIDE.md)** ⭐ **최우선 참고**
   - 18개 컴포넌트 사용법
   - 색상, 타이포그래피, 레이아웃
   - 대시보드 레이아웃 가이드
   - 코드 예시 포함

3. **[디자인 시스템 아키텍처](design-system-v2/DESIGN_SYSTEM_ARCHITECTURE.md)** ⭐ **개발자 필독**
   - CSS 아키텍처
   - 컴포넌트 패턴
   - 테마 시스템
   - 마이그레이션 가이드

4. **[문서 구조 가이드](design-system-v2/DOCUMENT_STRUCTURE_GUIDE.md)**
   - 문서 관리 및 구조
   - 역할별 필수 문서
   - 백업 정책

5. **[문서 재구조화 리포트](design-system-v2/2025-10-14-DOCUMENTATION_RESTRUCTURE_REPORT.md)**
   - 작업 완료 사항
   - 백업 내역
   - 다음 단계

### 쇼케이스

- **디자인 시스템 쇼케이스**: `http://localhost:3000/design-system`
- **CSS 파일**: `/frontend/src/styles/mindgarden-design-system.css`
- **컴포넌트**: `/frontend/src/components/mindgarden/`
- **테마**: `/frontend/src/themes/defaultTheme.js`

---

## 🚀 시작하기 (Getting Started)

### 새 개발자 온보딩

1. [환경 설정](setup/ENVIRONMENT_SETUP.md)
2. [프로젝트 구조](setup/PROJECT_STRUCTURE.md)
3. [개발 가이드](development/DEVELOPMENT_GUIDE.md)
4. [코딩 표준](development/CODING_STANDARDS.md)

### 빠른 시작

```bash
# 백엔드
cd /Users/mind/mindGarden
mvn spring-boot:run

# 프론트엔드
cd frontend
npm install
npm start
```

---

## 📖 개발 가이드 (Development)

### 프론트엔드

- [React 개발 가이드](development/REACT_GUIDE.md)
- [컴포넌트 구조](development/COMPONENT_STRUCTURE.md)
- [상태 관리](development/STATE_MANAGEMENT.md)
- [라우팅](development/ROUTING.md)

### 백엔드

- [Spring Boot 가이드](development/BACKEND_GUIDE.md)
- [API 설계](api/API_DESIGN.md)
- [데이터베이스](database/DATABASE_GUIDE.md)
- [보안](security/SECURITY_GUIDE.md)

---

## 🏗️ 아키텍처 (Architecture)

### 시스템 설계

- [시스템 아키텍처](architecture/SYSTEM_ARCHITECTURE.md)
- [디자인 시스템 아키텍처](DESIGN_SYSTEM_ARCHITECTURE.md)
- [데이터베이스 스키마](architecture/DATABASE_SCHEMA.md)
- [인증 & 권한](architecture/AUTH_SYSTEM.md)

### 통합

- [ERP 통합](integration/ERP_INTEGRATION.md)
- [OAuth2](integration/OAUTH2.md)
- [결제 시스템](integration/PAYMENT_SYSTEM.md)

---

## 🎯 기능 명세 (Features)

### 사용자 역할별

- [관리자 기능](features/ADMIN_FEATURES.md)
- [상담사 기능](features/CONSULTANT_FEATURES.md)
- [내담자 기능](features/CLIENT_FEATURES.md)

### 주요 기능

- [상담 관리](features/CONSULTATION_MANAGEMENT.md)
- [일정 관리](features/SCHEDULE_MANAGEMENT.md)
- [재무 관리](features/FINANCE_MANAGEMENT.md)
- [급여 관리](features/SALARY_MANAGEMENT.md)
- [휴가 관리](features/VACATION_MANAGEMENT.md)

---

## 🔐 보안 (Security)

- [보안 가이드](security/SECURITY_GUIDE.md)
- [인증 시스템](security/AUTHENTICATION.md)
- [권한 관리](security/AUTHORIZATION.md)
- [데이터 보호](security/DATA_PROTECTION.md)

---

## 🚢 배포 (Deployment)

- [배포 가이드](deployment/DEPLOYMENT_GUIDE.md)
- [CI/CD](deployment/CI_CD.md)
- [환경 변수](deployment/ENVIRONMENT_VARIABLES.md)
- [서버 설정](deployment/SERVER_SETUP.md)

---

## 🧪 테스트 (Testing)

- [테스트 가이드](testing/TESTING_GUIDE.md)
- [단위 테스트](testing/UNIT_TESTS.md)
- [통합 테스트](testing/INTEGRATION_TESTS.md)
- [E2E 테스트](testing/E2E_TESTS.md)

---

## 📊 API 문서 (API Documentation)

- [API 레퍼런스](api/API_REFERENCE.md)
- [REST API](api/REST_API.md)
- [에러 코드](api/ERROR_CODES.md)
- [예시 요청/응답](api/EXAMPLES.md)

---

## 🔧 유지보수 (Maintenance)

- [문제 해결](troubleshooting/TROUBLESHOOTING.md)
- [성능 최적화](maintenance/PERFORMANCE.md)
- [데이터베이스 백업](maintenance/BACKUP.md)
- [로그 관리](maintenance/LOGGING.md)

---

## 📝 변경 이력 (Changelog)

- [변경 이력](CHANGELOG.md)
- [릴리즈 노트](releases/RELEASE_NOTES.md)
- [마이그레이션 가이드](migration/MIGRATION_GUIDE.md)

---

## 🗄️ 아카이브 (Archive)

이전 버전의 문서들은 `archive/` 폴더에 보관되어 있습니다:

- `archive/design-backup-2025-10-14/` - 2025년 10월 14일 이전 디자인 문서
- `archive/legacy-docs-backup-2025-10-14/` - 2025년 10월 14일 이전 레거시 문서

---

## 🔍 빠른 참조 (Quick Reference)

### 자주 찾는 문서

| 목적 | 문서 |
|------|------|
| **🔥 CI/BI 작업 전 필수** | **[⚡ 빠른 시작 가이드](QUICK_START_GUIDE.md)** |
| **🎨 디자인 표준화 상세** | **[🎨 완전 가이드](CI_BI_DESIGN_STANDARDIZATION_GUIDE.md)** |
| 디자인 시스템 구현 | [실전 적용 플랜](design-system-v2/IMPLEMENTATION_PLAN.md) |
| 디자인 작업 시작 | [디자인 시스템 가이드](design-system-v2/MINDGARDEN_DESIGN_SYSTEM_GUIDE.md) |
| 새 컴포넌트 생성 | [디자인 시스템 아키텍처](design-system-v2/DESIGN_SYSTEM_ARCHITECTURE.md) |
| 문서 구조 이해 | [문서 구조 가이드](design-system-v2/DOCUMENT_STRUCTURE_GUIDE.md) |
| API 개발 | [API 설계](api/API_DESIGN.md) |
| 배포 | [배포 가이드](deployment/DEPLOYMENT_GUIDE.md) |
| 문제 해결 | [문제 해결 가이드](troubleshooting/TROUBLESHOOTING.md) |

### 디자인 시스템 체크리스트

새 페이지/컴포넌트 작성 시:

- [ ] [디자인 시스템 쇼케이스](http://localhost:3000/design-system) 확인
- [ ] `mg-` 접두사 CSS 클래스 사용
- [ ] CSS Variables 사용 (색상, 간격 등)
- [ ] 반응형 고려 (모바일, 태블릿, 데스크탑)
- [ ] 테이블에 `data-label` 속성 추가
- [ ] 모달은 `ReactDOM.createPortal` 사용
- [ ] 접근성 고려 (ARIA 속성)

---

## 📞 문의 (Contact)

- **개발팀 리드**: development@mindgarden.com
- **디자인 관련**: design@mindgarden.com
- **시스템 이슈**: support@mindgarden.com

---

## 📌 중요 공지

### 🚨 2025년 11월 28일 - CI/BI 변경 대비 긴급 작업

**디자인 표준화 필수 완료**

- **50개 파일, 400+ 하드코딩 색상** 발견 → 즉시 수정 필요
- **5개 CSS 변수 파일** 중복 → 1개 통합 파일로 변경
- **CI/BI 작업 전 반드시 완료** 필요

**🚀 지금 바로 시작하세요:**
```bash
node scripts/detect-hardcoded-colors.js
```

**📚 필수 가이드:**
- [⚡ 빠른 시작 가이드](QUICK_START_GUIDE.md) - 실무진 필수
- [🎨 완전 가이드](CI_BI_DESIGN_STANDARDIZATION_GUIDE.md) - 상세 매뉴얼

### 2025년 10월 14일

**디자인 시스템 2.0 출시**

- 모든 디자인 작업은 [디자인 시스템 가이드](MINDGARDEN_DESIGN_SYSTEM_GUIDE.md) 참고
- 기존 디자인 문서는 `archive/` 폴더로 이동
- 18개 컴포넌트 완성 및 통일된 대시보드 레이아웃 제공
- 모바일 반응형 완벽 지원

**마이그레이션 진행 중**

현재 Admin Dashboard 마이그레이션 준비 중입니다. 새로운 디자인 시스템을 적용하지 않은 페이지는 점진적으로 업데이트될 예정입니다.

---

**문서 버전**: 2.1  
**마지막 검토일**: 2025년 11월 28일

