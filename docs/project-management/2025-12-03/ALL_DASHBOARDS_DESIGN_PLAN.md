# 5개 대시보드 통합 디자인 개선 계획

**작성일:** 2025-12-03  
**목표:** 5개 대시보드 디자인 표준화 및 일관성 확보  
**우선순위:** 🔥 최우선  
**참조 표준:** 
- [디자인 중앙화 표준](../../standards/DESIGN_CENTRALIZATION_STANDARD.md)
- [API 설계 표준](../../standards/API_DESIGN_STANDARD.md)
- [테넌트 역할 시스템 표준](../../standards/TENANT_ROLE_SYSTEM_STANDARD.md)

---

## 📌 대상 대시보드

**⚠️ 중요: 브랜치/본사 개념 제거됨**
- ❌ BRANCH_ADMIN, BRANCH_SUPER_ADMIN, BRANCH_MANAGER → 제거
- ❌ HQ_ADMIN, SUPER_HQ_ADMIN, HQ_MASTER → 제거
- ✅ 테넌트 기반 시스템으로 통일
- ✅ 역할: ADMIN, CONSULTANT, CLIENT, STAFF, PARENT

### 1. Admin Dashboard (관리자 대시보드)
- **파일:** `frontend/src/components/admin/AdminDashboard.js`
- **CSS:** `frontend/src/components/admin/AdminDashboard.new.css`
- **역할:** ADMIN (테넌트 관리자)
- **등급:** ADMIN_MANAGER, ADMIN_DIRECTOR, ADMIN_EXECUTIVE, ADMIN_SUPER
- **주요 기능:**
  - 테넌트 전체 통계
  - 사용자 관리
  - 매칭 관리
  - 시스템 도구
  - 권한 관리
  - 등급별 권한 차등 적용

### 2. Consultant Dashboard (상담사 대시보드)
- **파일:** `frontend/src/components/consultant/ConsultantDashboard.js`
- **CSS:** `frontend/src/components/consultant/ConsultantDashboard.css`
- **역할:** CONSULTANT
- **등급:** CONSULTANT_JUNIOR, CONSULTANT_SENIOR, CONSULTANT_EXPERT, CONSULTANT_MASTER
- **주요 기능:**
  - 나의 상담 일정
  - 내담자 관리
  - 상담 기록
  - 평가 및 피드백
  - 수입 통계
  - 등급별 배지 및 혜택 표시

### 3. Client Dashboard (내담자 대시보드)
- **파일:** `frontend/src/components/client/ClientDashboard.js`
- **CSS:** `frontend/src/components/client/ClientDashboard.css`
- **역할:** CLIENT
- **등급:** CLIENT_BRONZE, CLIENT_SILVER, CLIENT_GOLD, CLIENT_PLATINUM
- **주요 기능:**
  - 나의 상담 일정
  - 상담사 정보
  - 상담 기록
  - 웰니스 컨텐츠
  - 결제 내역
  - 등급별 혜택 및 할인 표시

### 4. ERP Dashboard (ERP 대시보드)
- **파일:** `frontend/src/components/erp/ErpDashboard.js`
- **CSS:** `frontend/src/components/erp/ErpDashboard.css`
- **역할:** ADMIN (ERP 권한 보유)
- **주요 기능:**
  - 구매 요청 관리
  - 승인 처리
  - 예산 관리
  - 재무 통계
  - 주문 관리

### 5. HQ Dashboard (본사 대시보드)
- **파일:** `frontend/src/components/hq/HqDashboard.js`
- **CSS:** `frontend/src/components/hq/HqDashboard.css`
- **역할:** ⚠️ **사용 안 함** (브랜치/본사 개념 제거됨)
- **대체:** Admin Dashboard로 통합 예정
- **주요 기능:**
  - ~~지점 관리~~ → 테넌트 관리
  - ~~전체 통계~~ → 테넌트 통계
  - 성과 분석
  - 재무 보고서
  - 시스템 설정

---

## 🎯 공통 디자인 목표

### 1. 일관성 (Consistency)
- 모든 대시보드가 동일한 디자인 언어 사용
- 색상, 타이포그래피, 간격 통일
- 컴포넌트 재사용 극대화

### 2. 직관성 (Intuitiveness)
- 역할별 특성을 고려한 레이아웃
- 명확한 정보 계층 구조
- 쉬운 네비게이션

### 3. 효율성 (Efficiency)
- 빠른 로딩 속도
- 최소한의 클릭으로 목표 달성
- 반응형 디자인

### 4. 접근성 (Accessibility)
- WCAG 2.1 AA 준수
- 키보드 네비게이션
- 스크린 리더 지원

---

## 📋 Phase별 실행 계획

### Phase 1: 공통 디자인 시스템 구축 (1일, 8시간)

#### 1.1 디자인 토큰 정의
**파일:** `frontend/src/styles/design-tokens-v3.css` (기존 확장)

**⚠️ 중요: 기존 표준 준수**
- ✅ **기존 파일 활용**: `frontend/src/styles/unified-design-tokens.css` (1,026개 변수 이미 존재)
- ✅ **BEM 네이밍 규칙**: `mg-{component}-{element}--{modifier}` 준수
- ✅ **변수 네이밍 규칙**: `--mg-{category}-{property}-{variant}` 준수
- ✅ **기존 색상 시스템**: Primary (50-900), Semantic, Neutral 이미 정의됨

**작업 내용:**
- [ ] **기존 변수 확인 및 활용** (unified-design-tokens.css 정독)
- [ ] **역할별 Primary 색상 추가** (기존 변수 확장)
  ```css
  /* 기존 --mg-primary-500 활용 + 역할별 추가 */
  --mg-admin-primary: var(--mg-primary-500);
  --mg-consultant-primary: var(--mg-success);
  --mg-client-primary: var(--mg-info);
  /* ⚠️ ERP, HQ 색상 제거 (브랜치/본사 개념 제거) */
  ```
- [ ] **등급별 색상 추가** (배지 및 혜택 표시용)
  ```css
  /* 내담자 등급 */
  --mg-grade-client-bronze: #cd7f32;
  --mg-grade-client-silver: #c0c0c0;
  --mg-grade-client-gold: #ffd700;
  --mg-grade-client-platinum: #e5e4e2;
  
  /* 상담사 등급 */
  --mg-grade-consultant-junior: var(--mg-info);
  --mg-grade-consultant-senior: var(--mg-success);
  --mg-grade-consultant-expert: var(--mg-warning);
  --mg-grade-consultant-master: var(--mg-primary-600);
  
  /* 관리자 등급 */
  --mg-grade-admin-manager: var(--mg-gray-500);
  --mg-grade-admin-director: var(--mg-primary-500);
  --mg-grade-admin-executive: var(--mg-primary-700);
  --mg-grade-admin-super: var(--mg-primary-900);
  ```
- [ ] **대시보드 특화 변수 추가** (기존 간격/타이포그래피 활용)
- [ ] **위젯 시스템 변수 확인** (이미 정의되어 있음)
- [ ] **기존 표준과 충돌 없는지 검증**

**참조:**
- 기존 색상: `--mg-primary-{50-900}`, `--mg-gray-{50-900}`
- 기존 간격: `--mg-spacing-{0-16}` (0.25rem ~ 4rem)
- 기존 타이포그래피: `--mg-font-size-{xs-4xl}`, `--mg-font-weight-{light-bold}`
- 기존 레이아웃: `--mg-border-radius-{none-full}`, `--mg-shadow-{sm-xl}`

**예상 시간:** 1시간 (기존 활용으로 시간 단축)

#### 1.2 공통 컴포넌트 스타일
**파일:** `frontend/src/styles/dashboard-common-v3.css`

```css
/* ===== 공통 대시보드 레이아웃 ===== */
.mg-dashboard-layout {
    min-height: 100vh;
    background: var(--mg-bg-dashboard);
    padding: var(--mg-spacing-xl);
}

/* ===== 대시보드 헤더 ===== */
.mg-dashboard-header {
    background: var(--mg-bg-card);
    border-radius: var(--mg-radius-lg);
    padding: var(--mg-spacing-xl);
    margin-bottom: var(--mg-spacing-xl);
    box-shadow: var(--mg-shadow-md);
}

.mg-dashboard-title {
    font-size: var(--mg-font-xxl);
    font-weight: var(--mg-font-bold);
    color: var(--mg-text-primary);
    margin: 0;
}

.mg-dashboard-subtitle {
    font-size: var(--mg-font-md);
    color: var(--mg-text-secondary);
    margin: var(--mg-spacing-xs) 0 0 0;
}

/* ===== 통계 카드 그리드 ===== */
.mg-dashboard-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--mg-spacing-lg);
    margin-bottom: var(--mg-spacing-xl);
}

/* ===== 통계 카드 ===== */
.mg-stat-card {
    background: var(--mg-bg-card);
    border-radius: var(--mg-radius-lg);
    padding: var(--mg-spacing-xl);
    box-shadow: var(--mg-shadow-md);
    transition: all var(--mg-transition-normal) var(--mg-easing);
    cursor: pointer;
}

.mg-stat-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--mg-shadow-xl);
}

.mg-stat-card-gradient {
    background: var(--card-gradient);
    color: white;
}

.mg-stat-card-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--mg-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--mg-spacing-md);
    font-size: var(--mg-font-xl);
}

.mg-stat-card-value {
    font-size: var(--mg-font-xxxl);
    font-weight: var(--mg-font-bold);
    margin-bottom: var(--mg-spacing-xs);
}

.mg-stat-card-label {
    font-size: var(--mg-font-md);
    opacity: 0.9;
}

/* ===== 섹션 ===== */
.mg-dashboard-section {
    background: var(--mg-bg-card);
    border-radius: var(--mg-radius-lg);
    padding: var(--mg-spacing-xl);
    margin-bottom: var(--mg-spacing-xl);
    box-shadow: var(--mg-shadow-md);
}

.mg-section-header {
    display: flex;
    align-items: center;
    gap: var(--mg-spacing-md);
    margin-bottom: var(--mg-spacing-lg);
    padding-bottom: var(--mg-spacing-md);
    border-bottom: 2px solid var(--mg-border);
}

.mg-section-title {
    font-size: var(--mg-font-xl);
    font-weight: var(--mg-font-semibold);
    color: var(--mg-text-primary);
    margin: 0;
}

.mg-section-subtitle {
    font-size: var(--mg-font-sm);
    color: var(--mg-text-secondary);
    margin: var(--mg-spacing-xs) 0 0 0;
}

/* ===== 관리 기능 그리드 ===== */
.mg-management-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--mg-spacing-lg);
}

.mg-management-card {
    background: var(--mg-bg-card);
    border-radius: var(--mg-radius-lg);
    padding: var(--mg-spacing-xl);
    border: 1px solid var(--mg-border);
    transition: all var(--mg-transition-normal) var(--mg-easing);
    cursor: pointer;
}

.mg-management-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--mg-shadow-lg);
    border-color: var(--card-primary);
}

.mg-management-icon {
    width: 64px;
    height: 64px;
    border-radius: var(--mg-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--mg-spacing-md);
    background: var(--card-gradient);
    color: white;
    font-size: var(--mg-font-xxl);
}

.mg-management-title {
    font-size: var(--mg-font-lg);
    font-weight: var(--mg-font-semibold);
    color: var(--mg-text-primary);
    margin-bottom: var(--mg-spacing-sm);
}

.mg-management-description {
    font-size: var(--mg-font-sm);
    color: var(--mg-text-secondary);
    line-height: 1.5;
}

/* ===== 반응형 ===== */
@media (max-width: 768px) {
    .mg-dashboard-layout {
        padding: var(--mg-spacing-md);
    }
    
    .mg-dashboard-stats,
    .mg-management-grid {
        grid-template-columns: 1fr;
    }
    
    .mg-dashboard-title {
        font-size: var(--mg-font-xl);
    }
    
    .mg-stat-card-value {
        font-size: var(--mg-font-xxl);
    }
}
```

**작업 내용:**
- [ ] 공통 레이아웃 스타일
- [ ] 공통 컴포넌트 스타일
- [ ] 반응형 스타일
- [ ] 애니메이션 스타일

**예상 시간:** 3시간

#### 1.3 역할별 테마 파일
**파일:** `frontend/src/styles/themes/`

- `admin-theme.css` - 관리자 테마 (테넌트 관리자)
- `consultant-theme.css` - 상담사 테마
- `client-theme.css` - 내담자 테마
- ~~`erp-theme.css`~~ - (Admin 테마에 통합)
- ~~`hq-theme.css`~~ - (제외됨 - 브랜치/본사 개념 제거)

```css
/* admin-theme.css */
.dashboard-admin {
    --card-primary: var(--mg-admin-primary);
    --card-gradient: var(--mg-admin-gradient);
}

/* consultant-theme.css */
.dashboard-consultant {
    --card-primary: var(--mg-consultant-primary);
    --card-gradient: var(--mg-consultant-gradient);
}

/* client-theme.css */
.dashboard-client {
    --card-primary: var(--mg-client-primary);
    --card-gradient: var(--mg-client-gradient);
}

/* ⚠️ ERP와 HQ 테마는 제외됨 */
/* ERP 기능은 Admin Dashboard에 통합 */
/* HQ는 브랜치/본사 개념 제거로 사용 안 함 */
```

**예상 시간:** 1시간

#### 1.4 공통 문서 작성
**파일:** `docs/design-system-v3/`

- `DESIGN_TOKENS.md` - 디자인 토큰 가이드
- `COMPONENT_LIBRARY.md` - 공통 컴포넌트 라이브러리
- `THEME_SYSTEM.md` - 테마 시스템 가이드
- `RESPONSIVE_DESIGN.md` - 반응형 디자인 가이드

**예상 시간:** 2시간

---

### Phase 2: 각 대시보드 개선 (4일, 32시간)

#### 2.1 Admin Dashboard 개선 (1일, 8시간)

**작업 내용:**
- [ ] 기존 CSS 분석 및 하드코딩 추출
- [ ] 디자인 토큰 적용
- [ ] 컴포넌트 스타일 통일
- [ ] 차트 추가 (라인, 바, 파이)
- [ ] 애니메이션 추가
- [ ] 반응형 개선
- [ ] 브라우저 테스트

**주요 개선 사항:**
- 통계 카드 그라데이션 배경
- 관리 기능 카드 호버 효과
- 시스템 상태 시각화
- 차트 추가
- **등급 배지 표시** (ADMIN_MANAGER ~ ADMIN_SUPER)
- **등급별 권한 차등 표시** (접근 가능/불가능 기능 시각화)

**예상 시간:** 8시간

#### 2.2 Consultant Dashboard 개선 (1일, 8시간)

**작업 내용:**
- [ ] 기존 CSS 분석
- [ ] 디자인 토큰 적용
- [ ] 상담사 테마 적용
- [ ] 일정 캘린더 개선
- [ ] 내담자 목록 개선
- [ ] 수입 통계 차트 추가
- [ ] 반응형 개선

**주요 개선 사항:**
- 상담 일정 카드 디자인
- 내담자 프로필 카드
- 평가 및 피드백 UI
- 수입 통계 차트
- **등급 배지 표시** (JUNIOR ~ MASTER)
- **등급별 혜택 표시** (수수료율, 우선 배정 등)
- **등급 업그레이드 진행률** (다음 등급까지 필요한 조건)

**예상 시간:** 8시간

#### 2.3 Client Dashboard 개선 (1일, 8시간)

**작업 내용:**
- [ ] 기존 CSS 분석
- [ ] 디자인 토큰 적용
- [ ] 내담자 테마 적용
- [ ] 상담 일정 카드 개선
- [ ] 웰니스 컨텐츠 카드 개선
- [ ] 상담사 정보 카드 개선
- [ ] 반응형 개선

**주요 개선 사항:**
- 부드러운 색상 팔레트
- 친근한 UI/UX
- 웰니스 컨텐츠 카드
- 상담 기록 타임라인
- **등급 배지 표시** (BRONZE ~ PLATINUM)
- **등급별 혜택 표시** (할인율, 우선 예약 등)
- **등급 업그레이드 진행률** (다음 등급까지 필요한 상담 횟수/경험치)
- **등급별 전용 컨텐츠 잠금/해제 표시**

**예상 시간:** 8시간

#### 2.4 ERP Dashboard 개선 (0.5일, 4시간)

**작업 내용:**
- [ ] 기존 CSS 분석
- [ ] 디자인 토큰 적용
- [ ] ERP 테마 적용
- [ ] 구매 요청 카드 개선
- [ ] 승인 프로세스 시각화
- [ ] 예산 차트 추가
- [ ] 반응형 개선

**주요 개선 사항:**
- 구매 요청 상태 표시
- 승인 프로세스 플로우
- 예산 사용 차트
- 주문 관리 테이블

**예상 시간:** 4시간

#### ~~2.5 HQ Dashboard 개선~~ (제외됨)

**⚠️ 작업 제외 사유:**
- 브랜치/본사 개념이 제거되어 HQ Dashboard는 더 이상 사용하지 않음
- HQ Dashboard의 기능은 Admin Dashboard로 통합 예정
- 테넌트 기반 시스템으로 통일

**대체 작업:**
- [ ] HQ Dashboard 파일 삭제 또는 Deprecated 표시
- [ ] Admin Dashboard에 통합 기능 추가 (필요 시)
- [ ] 라우팅에서 HQ 경로 제거

**예상 시간:** ~~4시간~~ → 0시간 (작업 제외)

---

### Phase 3: 통합 테스트 및 최적화 (1일, 8시간)

#### 3.1 크로스 브라우저 테스트
**작업 내용:**
- [ ] Chrome 테스트
- [ ] Safari 테스트
- [ ] Firefox 테스트
- [ ] Edge 테스트
- [ ] 모바일 브라우저 테스트

**예상 시간:** 2시간

#### 3.2 반응형 테스트
**작업 내용:**
- [ ] 데스크탑 (1920px+)
- [ ] 노트북 (1366px)
- [ ] 태블릿 (768px)
- [ ] 모바일 (375px)

**예상 시간:** 2시간

#### 3.3 성능 최적화
**작업 내용:**
- [ ] CSS 최적화 (중복 제거)
- [ ] 번들 크기 확인
- [ ] 로딩 속도 개선
- [ ] 이미지 최적화

**예상 시간:** 2시간

#### 3.4 접근성 검증
**작업 내용:**
- [ ] ARIA 레이블 추가
- [ ] 키보드 네비게이션 테스트
- [ ] 색상 대비 확인
- [ ] 스크린 리더 테스트

**예상 시간:** 2시간

---

## 📊 전체 일정

| Phase | 대시보드 | 예상 시간 | 우선순위 |
|-------|---------|----------|---------|
| Phase 1 | 공통 시스템 | 8시간 (1일) | 🔥 최우선 |
| Phase 2.1 | Admin | 8시간 (1일) | ⭐ 높음 |
| Phase 2.2 | Consultant | 8시간 (1일) | ⭐ 높음 |
| Phase 2.3 | Client | 8시간 (1일) | ⭐ 높음 |
| Phase 2.4 | ERP | 4시간 (0.5일) | 📊 중간 |
| Phase 2.5 | HQ | 4시간 (0.5일) | 📊 중간 |
| Phase 3 | 통합 테스트 | 8시간 (1일) | ✅ 필수 |

**총 예상 시간:** 48시간 (6일)

---

## ✅ 체크리스트

### Phase 1: 공통 시스템
- [ ] 디자인 토큰 정의 완료
- [ ] 공통 컴포넌트 스타일 완료
- [ ] 역할별 테마 파일 완료
- [ ] 공통 문서 작성 완료

### Phase 2: 각 대시보드
- [ ] Admin Dashboard 개선 완료
- [ ] Consultant Dashboard 개선 완료
- [ ] Client Dashboard 개선 완료
- [ ] ERP Dashboard 개선 완료 (또는 Admin에 통합)
- [ ] ~~HQ Dashboard 개선 완료~~ (제외됨 - 브랜치/본사 개념 제거)

### Phase 3: 통합 테스트
- [ ] 크로스 브라우저 테스트 완료
- [ ] 반응형 테스트 완료
- [ ] 성능 최적화 완료
- [ ] 접근성 검증 완료

---

## 🚨 주의사항

### 필수 준수 사항 (표준 문서 기반)
1. ✅ **CSS 변수만 사용** - 하드코딩 절대 금지 ([디자인 중앙화 표준](../../standards/DESIGN_CENTRALIZATION_STANDARD.md))
2. ✅ **BEM 네이밍 규칙** - `mg-{component}-{element}--{modifier}` 준수
3. ✅ **역할별 테마 적용** - 각 대시보드의 정체성 유지
4. ✅ **컴포넌트 재사용** - 공통 컴포넌트 최대한 활용 (`frontend/src/components/ui/`)
5. ✅ **다중 테넌트 지원** - 테넌트별 데이터 격리 ([테넌트 역할 시스템 표준](../../standards/TENANT_ROLE_SYSTEM_STANDARD.md))
6. ✅ **반응형 디자인** - 모든 기기 대응 (기존 브레이크포인트 활용)
7. ✅ **접근성** - WCAG 2.1 AA 준수
8. ✅ **테넌트 브랜딩** - CSS 변수 오버라이드로 브랜딩 지원

### 금지 사항 (표준 문서 기반)
1. ❌ **인라인 스타일** - style 속성 사용 금지
2. ❌ **하드코딩된 색상** - 직접 값 금지 (예: `#3b82f6` → `var(--mg-primary-500)`)
3. ❌ **중복 코드** - DRY 원칙 준수
4. ❌ **!important 남용** - 명시도 조정으로 해결
5. ❌ **임의의 CSS 파일 생성** - 기존 구조 활용
6. ❌ **브랜치 개념 사용** - 테넌트 기반만 사용
7. ❌ **하드코딩된 역할/권한** - 동적 조회 필수

### 표준 준수 체크리스트
- [ ] `unified-design-tokens.css` 변수 활용 확인
- [ ] BEM 네이밍 규칙 준수 확인
- [ ] 테넌트 ID 기반 데이터 조회 확인
- [ ] 역할 동적 조회 확인
- [ ] 소프트 삭제 구현 확인
- [ ] API 버전 관리 (`/api/v1/`) 확인

---

## 📚 참고 문서

- [Admin Dashboard 개선 계획](./ADMIN_DASHBOARD_DESIGN_IMPROVEMENT_PLAN.md)
- [테넌트 생성 테스트 계획](./TENANT_CREATION_TEST_PLAN.md)
- [TODO 리스트](./TODO.md)

---

**작성자:** AI Assistant  
**최종 수정:** 2025-12-03  
**다음 단계:** Phase 1 공통 시스템 구축 시작

