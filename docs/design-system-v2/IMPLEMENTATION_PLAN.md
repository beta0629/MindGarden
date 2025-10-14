# MindGarden 디자인 시스템 통합 마스터 플랜

> **📅 작성일**: 2025-10-13  
> **📝 최종 수정**: 2025-10-13  
> **📊 버전**: 1.0  
> **👤 작성자**: AI Assistant + User
> 
> **⚠️ 중요: 이 파일은 MindGarden 디자인 개편의 마스터 플랜입니다.**
> 
> **모든 디자인 작업 시작 전 반드시 이 파일을 먼저 읽고 계획을 따라야 합니다.**

## 📋 프로젝트 개요

### 현재 상황 (2025-10-13 기준)
- **문제점**: 316개 CSS 파일, 디자인 일관성 부족, 하드코딩, CSS 충돌
- **운영 상태**: 데이터 수집 중 - 오류 발생 시 영향 큼
- **목표**: 11개 대시보드 레이아웃 통일 및 일관성 확보
- **⚠️ 중요 발견**: 실제 구현된 가이드라인 CSS 파일이 없음 (문서만 있음)

### 핵심 원칙
1. ❌ **새로운 CSS 파일 절대 생성 금지**
2. ❌ **하드코딩 절대 금지** (색상, 크기, 스타일)
3. ❌ **임의 판단 금지** - 반드시 사용자에게 먼저 물어보기
4. ✅ **기존 가이드라인만 사용**
5. ✅ **CSS 변수만 사용**
6. ✅ **컴포넌트 재사용**

## 🎯 11개 대시보드 목록

### 관리자 대시보드
1. **Admin Dashboard** (`/admin`)
   - TodayStatistics
   - ConsultantRatingStatistics
   - VacationStatistics
   - ConsultationCompletionStats
   - PermissionManagement
   - SystemStatus

### 상담사 대시보드
2. **Consultant Dashboard** (`/consultant`)
   - 일정 관리
   - 내담자 목록
   - 상담 기록
   - 평점 관리

### 내담자 대시보드
3. **Client Dashboard** (`/client`)
   - 상담 신청
   - 상담 이력
   - 결제 관리

### 지점 관리자 대시보드
4. **Branch Admin Dashboard** (`/branch-admin`)
   - 지점 통계
   - 상담사 관리
   - 매출 관리

### 본사 관리자 대시보드
5. **HQ Admin Dashboard** (`/hq-admin`)
   - 전체 통계
   - 지점 관리
   - 시스템 설정

### 재무 대시보드
6. **Finance Dashboard** (`/finance`)
   - 수입/지출 관리
   - 급여 관리
   - 재무 보고서

### ERP 통합 대시보드
7. **ERP Integration Dashboard** (`/erp`)
   - PL/SQL 연동
   - 재무 데이터 동기화

### 급여 관리 대시보드
8. **Salary Management Dashboard** (`/salary`)
   - 급여 계산
   - 급여 명세서
   - 세금 관리

### 휴가 관리 대시보드
9. **Vacation Management Dashboard** (`/vacation`)
   - 휴가 신청
   - 휴가 승인
   - 휴가 통계

### 세션 관리 대시보드
10. **Session Management Dashboard** (`/session`)
    - 활성 세션
    - 세션 이력
    - 보안 모니터링

### 시스템 모니터링 대시보드
11. **System Monitoring Dashboard** (`/system`)
    - 서버 상태
    - 메모리 사용량
    - 로그 모니터링

## 📐 5단계 실행 계획

### Phase 1: 기반 구축 ✅ (완료)
**목표**: 디자인 시스템 기반 마련

**작업 내용:**
- [x] 기존 가이드라인 문서 검토
  - `docs/DESIGN_GUIDE.md`
  - `docs/MINDGARDEN_DESIGN_CONSISTENCY_PLAN.md`
  - `frontend/src/styles/design-system/admin-design-guidelines.css`
- [x] CSS 변수 확장
  - 상태별 색상 (requested, assigned, in-progress, completed, cancelled)
  - 결제 상태 색상 (pending, completed, failed, refunded)
  - 사용자 상태 색상 (active, inactive, suspended)
  - 등급별 색상 (junior, senior, expert, master)
  - 역할별 색상 (client, consultant, admin, branch-admin, hq-admin)
  - 휴가 유형별 색상 (annual, sick, personal, maternity, paternity)
- [x] 색상 유틸리티 함수 작성
  - `frontend/src/utils/colorUtils.js`

**결과물:**
- `frontend/src/styles/00-core/_variables.css` (확장됨)
- `frontend/src/utils/colorUtils.js` (신규)

### Phase 2: 공통 컴포넌트 생성 ✅ (완료)
**목표**: 재사용 가능한 레이아웃 컴포넌트 생성

**작업 내용:**
- [x] StatCard 컴포넌트
  - Props: title, value, icon, trend, color, onClick
  - 반응형 디자인
  - 호버 효과
- [x] DashboardSection 컴포넌트
  - Props: title, icon, children, collapsible
  - 일관된 섹션 스타일
- [x] DashboardGrid 컴포넌트
  - Props: columns, gap, children
  - 반응형 그리드 레이아웃

**결과물:**
- `frontend/src/components/common/StatCard.js` + `.css`
- `frontend/src/components/layout/DashboardSection.js` + `.css`
- `frontend/src/components/layout/DashboardGrid.js` + `.css`

### Phase 3: 테스트 및 검증 ✅ (완료)
**목표**: 컴포넌트 동작 확인

**작업 내용:**
- [x] 테스트 페이지 생성
  - `frontend/src/pages/ComponentTestPage.js`
  - 모든 컴포넌트 사용 예시
- [x] 라우트 추가
  - `/test/components`
- [ ] **진행 중**: 브라우저 테스트
  - 시각적 확인
  - 반응형 확인
  - 인터랙션 확인

**결과물:**
- `frontend/src/pages/ComponentTestPage.js` + `.css`
- 테스트 URL: `http://localhost:3000/test/components`

### Phase 4: 점진적 마이그레이션 (대기 중)
**목표**: 한 번에 하나씩 안전하게 마이그레이션

#### 4.1 Admin Dashboard (최우선)
**순서:**
0. **레이아웃 구조 먼저 적용** - mg-dashboard-layout 전체 구조 (헤더, 통계 그리드, 콘텐츠 영역)
1. TodayStatistics → StatCard 변환
2. ConsultantRatingStatistics → DashboardSection + StatCard
3. VacationStatistics → DashboardSection + 테이블
4. ConsultationCompletionStats → DashboardSection + 차트
5. PermissionManagement → DashboardSection + 폼

**각 단계마다:**
- [ ] 기존 코드 백업
- [ ] 컴포넌트 교체
- [ ] 브라우저 테스트
- [ ] 기능 동작 확인
- [ ] 반응형 확인
- [ ] 콘솔 오류 확인
- [ ] 커밋 및 푸시

#### 4.2 Consultant Dashboard
- [ ] 일정 관리 섹션
- [ ] 내담자 목록 섹션
- [ ] 상담 기록 섹션
- [ ] 평점 관리 섹션

#### 4.3 Client Dashboard
- [ ] 상담 신청 섹션
- [ ] 상담 이력 섹션
- [ ] 결제 관리 섹션

#### 4.4 Branch Admin Dashboard
- [ ] 지점 통계 섹션
- [ ] 상담사 관리 섹션
- [ ] 매출 관리 섹션

#### 4.5 HQ Admin Dashboard
- [ ] 전체 통계 섹션
- [ ] 지점 관리 섹션
- [ ] 시스템 설정 섹션

#### 4.6 나머지 대시보드
- [ ] Finance Dashboard
- [ ] ERP Integration Dashboard
- [ ] Salary Management Dashboard
- [ ] Vacation Management Dashboard
- [ ] Session Management Dashboard
- [ ] System Monitoring Dashboard

### Phase 5: 안정화 및 최적화 (대기 중)
**목표**: 정리 및 성능 최적화

**작업 내용:**
- [ ] 사용하지 않는 CSS 파일 식별
- [ ] 중복 스타일 제거
- [ ] CSS 번들 크기 최적화
- [ ] 성능 측정 및 개선
- [ ] 문서화 업데이트
- [ ] 최종 테스트

## 🔧 기술 가이드

### 컴포넌트 사용 패턴

#### StatCard 사용 예시
```jsx
import StatCard from '../common/StatCard';
import { FaCalendar } from 'react-icons/fa';

<StatCard
  title="오늘의 상담"
  value={statistics.todayConsultations}
  icon={<FaCalendar />}
  trend={{ value: 12, isPositive: true }}
  color="primary"
  onClick={() => handleCardClick('consultations')}
/>
```

#### DashboardSection 사용 예시
```jsx
import DashboardSection from '../layout/DashboardSection';
import { FaChartLine } from 'react-icons/fa';

<DashboardSection
  title="통계 현황"
  icon={<FaChartLine />}
  collapsible={true}
>
  {/* 섹션 내용 */}
</DashboardSection>
```

#### DashboardGrid 사용 예시
```jsx
import DashboardGrid from '../layout/DashboardGrid';

<DashboardGrid columns={4} gap="lg">
  <StatCard {...} />
  <StatCard {...} />
  <StatCard {...} />
  <StatCard {...} />
</DashboardGrid>
```

### CSS 변수 사용

```css
/* ✅ 올바른 방법 */
.my-component {
  color: var(--primary-600);
  background: var(--status-completed-bg);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}

/* ❌ 잘못된 방법 */
.my-component {
  color: #0ea5e9;
  background: #f0f9ff;
  padding: 16px;
  border-radius: 8px;
}
```

### 색상 유틸리티 사용

```jsx
import { getStatusColor, getStatusLabel } from '../utils/colorUtils';

const statusColor = getStatusColor('completed');
const statusLabel = getStatusLabel('completed');

<span style={{ color: statusColor }}>
  {statusLabel}
</span>
```

## 📊 진행 상황 추적

### 완료된 Phase
- ✅ Phase 1: 기반 구축 (100%)
- ✅ Phase 2: 공통 컴포넌트 생성 (100%)
- ✅ Phase 3: 테스트 페이지 생성 (80%)

### 현재 Phase
- 🔄 Phase 3: 브라우저 테스트 (진행 중)

### 대기 중인 Phase
- ⏳ Phase 4: 점진적 마이그레이션 (0%)
- ⏳ Phase 5: 안정화 및 최적화 (0%)

### 전체 진행률
- **완료**: 2.5 / 5 Phase (50%)
- **예상 소요 시간**: 
  - Phase 3 완료: 1일
  - Phase 4 완료: 10-15일 (11개 대시보드)
  - Phase 5 완료: 3-5일

## 🔒 안전 장치

### 커밋 전 체크리스트
- [ ] 브라우저에서 시각적 확인
- [ ] 모든 기능 동작 확인
- [ ] 반응형 확인 (모바일, 태블릿, 데스크톱)
- [ ] 콘솔 오류 없음
- [ ] React 경고 없음
- [ ] 기존 기능 영향 없음

### 롤백 절차
1. 문제 발견 시 즉시 중단
2. `git status` 확인
3. `git restore <파일>` 또는 `git reset --hard HEAD~1`
4. 브라우저 새로고침 확인
5. 문제 분석 후 재시도

## 📚 필수 참고 문서

### 반드시 읽어야 할 문서
1. **이 파일** (`v0-pure-css-prompt.plan.md`) - 마스터 플랜
2. `docs/DESIGN_GUIDE.md` - 디자인 시스템 전체 가이드
3. `docs/MINDGARDEN_DESIGN_CONSISTENCY_PLAN.md` - 일관성 강화 계획
4. `frontend/src/styles/design-system/admin-design-guidelines.css` - Admin 가이드라인

### 참고용 문서
- `docs/v0-dev/PURE_CSS_JAVASCRIPT_PROMPT.md` - v0.dev 프롬프트 (참고만)
- `docs/ADMIN_DASHBOARD_REDESIGN_PLAN.md` - Admin Dashboard 상세 계획

## ⚠️ 절대 금지 사항

### 하지 말아야 할 것
1. ❌ 새로운 CSS 파일 생성
2. ❌ 인라인 스타일 사용 (`style={{ ... }}`)
3. ❌ 하드코딩된 색상/크기 (`#0ea5e9`, `16px`)
4. ❌ 임의로 디자인 변경
5. ❌ 기존 가이드라인 무시
6. ❌ 사용자 확인 없이 진행
7. ❌ 여러 파일 동시 수정
8. ❌ 테스트 없이 커밋

### 반드시 해야 할 것
1. ✅ 작업 전 이 플랜 파일 확인
2. ✅ 기존 가이드라인 문서 참조
3. ✅ CSS 변수만 사용
4. ✅ 컴포넌트 재사용
5. ✅ 사용자에게 먼저 물어보기
6. ✅ 한 번에 하나씩 작업
7. ✅ 테스트 후 커밋
8. ✅ TODO 리스트 업데이트

## 🎯 성공 기준

### Phase별 성공 기준

**Phase 3 성공 기준:**
- [ ] 테스트 페이지가 정상적으로 로드됨
- [ ] 모든 컴포넌트가 시각적으로 올바르게 표시됨
- [ ] 반응형이 모든 디바이스에서 작동함
- [ ] 콘솔에 오류나 경고가 없음

**Phase 4 성공 기준:**
- [ ] 각 대시보드가 일관된 디자인을 가짐
- [ ] 모든 기능이 정상 작동함
- [ ] 성능 저하가 없음
- [ ] 사용자 피드백이 긍정적임

**Phase 5 성공 기준:**
- [ ] CSS 파일 수가 50% 이상 감소
- [ ] 번들 크기가 감소함
- [ ] 로딩 속도가 개선됨
- [ ] 유지보수성이 향상됨

## 📝 변경 이력

### 2025-10-13 (오후)
- **중요 발견**: 실제 가이드라인 CSS 파일이 존재하지 않음
- **문제**: `admin-design-guidelines.css` 파일이 없음 (문서만 있음)
- **결론**: Phase 0 추가 필요 - 가이드라인 CSS 파일 먼저 생성해야 함
- **현재 상태**: Phase 3 중단, Phase 0로 돌아가야 함

### 2025-10-13 (오전)
- 마스터 플랜 작성
- Phase 1-2 완료 (하지만 기준 없이 만듦)
- Phase 3 진행 중 (중단됨)
- 11개 대시보드 목록 정리
- 5단계 실행 계획 수립

---

**⚠️ 중요: 이 파일을 삭제하거나 수정하지 마세요!**

**모든 디자인 작업은 이 플랜을 기준으로 진행됩니다.**

**작업 시작 전 반드시 이 파일을 읽고 Phase 순서를 확인하세요.**

