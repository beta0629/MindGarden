# 인라인 카드 렌더링 → 공통 컴포넌트 전환 체크리스트

**최종 갱신**: 2026-05-11  
**작성**: core-coder (코딩 전용 서브에이전트)  
**관련 공통 컴포넌트**: `ProfileCard`, `ConsultantCard`  
**참조**: `docs/standards/COMMON_MODULES_USAGE_GUIDE.md`, `docs/project-management/COMMON_UI_ENCAPSULATION_PLAN.md`

---

## 공통 컴포넌트 위치

| 컴포넌트 | 파일 경로 |
|----------|----------|
| ProfileCard | `frontend/src/components/ui/Card/ProfileCard.js` |
| ConsultantCard | `frontend/src/components/ui/Card/ConsultantCard.js` |
| CSS | `frontend/src/components/admin/ProfileCard.css` |

---

## 완료 항목

- [x] `frontend/src/components/admin/ConsultantComprehensiveManagement.js` → **ConsultantCard** (`admin-list`, `admin-compact` variant) 전환 완료
- [x] `frontend/src/components/admin/ClientComprehensiveManagement/ClientOverviewTab.js` → **ProfileCard** (`list`, `compact` variant) 전환 완료
- [x] `frontend/src/components/admin/StaffManagement.js` → **ProfileCard** (`list`, `compact` variant) 전환 완료

---

## 미전환 항목 (12건)

### 우선순위: 높음 — ProfileCard로 바로 대체 가능

- [ ] **#1** `frontend/src/components/dashboard/ConsultantClientSection.js` (214~256행)
  - **카드 유형**: 대시보드 내담자 카드
  - **인라인 패턴**: `.map()` 내부 Avatar+이름+이메일+상태뱃지+통계 인라인
  - **대체 방안**: ProfileCard

- [ ] **#2** `frontend/src/components/dashboard/widgets/ConsultantClientWidget.js` (201~249행)
  - **카드 유형**: 위젯 내담자 카드
  - **인라인 패턴**: `.map()` 내부 Avatar+이름+이메일+상태뱃지+통계 인라인 (#1과 중복 코드)
  - **대체 방안**: ProfileCard

- [ ] **#3** `frontend/src/components/dashboard/widgets/consultation/ConsultantClientWidget.js` (98~166행)
  - **카드 유형**: 위젯 내담자 리스트 아이템
  - **인라인 패턴**: `.map()` 내부 Avatar+이름+상태+세션수+버튼 인라인
  - **대체 방안**: ProfileCard compact

- [ ] **#4** `frontend/src/components/schedule/ConsultantStatus.js` (193~218행)
  - **카드 유형**: 상담사 현황 카드
  - **인라인 패턴**: `.map()` 내부 Avatar+이름+이메일+전화+전문분야+상태뱃지 인라인
  - **대체 방안**: ProfileCard

- [ ] **#5** `frontend/src/components/admin/SessionManagement.js` (392~432행)
  - **카드 유형**: 빠른 회기 추가 카드
  - **인라인 패턴**: `.map()` 내부 Avatar+내담자명+상담사명+회기수 인라인
  - **대체 방안**: ProfileCard compact

- [ ] **#6** `frontend/src/components/admin/SessionManagement.js` (488~519행)
  - **카드 유형**: 내담자 검색 결과 카드
  - **인라인 패턴**: `.map()` 내부 Avatar+이름+활성매핑수 인라인
  - **대체 방안**: ProfileCard compact

### 우선순위: 중간

- [ ] **#8** `frontend/src/components/admin/AdminDashboard.js` (1119~1159행)
  - **카드 유형**: 상담사별 휴가 현황 카드
  - **인라인 패턴**: `.map()` 내부 MGCard래퍼+Avatar+이름+이메일+휴가일수+최근휴가 인라인
  - **대체 방안**: ProfileCard

- [ ] **#11** `frontend/src/components/admin/VacationStatistics.js` (308~363행)
  - **카드 유형**: 상담사 휴가 현황 카드
  - **인라인 패턴**: `.map()` 내부 Avatar+이름+이메일+휴가일수+유형뱃지+최근휴가 인라인
  - **대체 방안**: ProfileCard

### 우선순위: 낮음 — 구조 상이, 별도 검토

- [ ] **#7** `frontend/src/components/admin/AdminDashboard.js` (930~953행)
  - **카드 유형**: 우수 상담사 평점 카드
  - **인라인 패턴**: `.map()` 내부 Avatar+이름+평점+바차트 인라인
  - **대체 방안**: 구조 상이 — 순위뱃지+평점바 포함, 별도 검토 필요

- [ ] **#12** `frontend/src/components/ui/Statistics/ConsultationCompletionStatsView.js` (127~192행)
  - **카드 유형**: 상담사별 통계 카드
  - **인라인 패턴**: `.map()` 내부 mg-v2-card+순위뱃지+이름+등급+전문분야+완료건수/총건수/완료율 인라인
  - **대체 방안**: 구조 상이 — 아바타 없음, 순위+3단통계 특수 레이아웃. 별도 검토 필요

### 별도 컴포넌트 필요

- [ ] **#9** `frontend/src/components/admin/ClientComprehensiveManagement/ClientConsultationTab.js` (25~53행)
  - **카드 유형**: 상담 이력 카드
  - **인라인 패턴**: `renderConsultationCard` 인라인 함수, `mg-v2-card` 직접 사용
  - **대체 방안**: 별도 컴포넌트 필요 (프로필이 아닌 상담 정보 중심)

- [ ] **#10** `frontend/src/components/admin/ClientComprehensiveManagement/ClientMappingTab.js` (26~107행)
  - **카드 유형**: 매핑 카드
  - **인라인 패턴**: `renderMappingCard` 인라인 함수, CardContainer래퍼+mg-v2-card-header/content/footer 직접 사용
  - **대체 방안**: 별도 컴포넌트 필요 (기존 MappingCard 2개와 통합 검토)

---

## 참고: 통합 검토 대상 별도 컴포넌트

이미 별도 파일로 존재하지만 중복·통합 검토가 필요한 컴포넌트:

| 컴포넌트 | 파일 경로 | 비고 |
|----------|----------|------|
| ClientCard | `components/consultant/molecules/ClientCard.js` | 상담사 측 내담자 카드, `ui/Card/ClientCard.js`와 중복 |
| MappingCard (Admin) | `components/admin/MappingCard.js` | Admin용 매핑 카드 |
| MappingCard (상세) | `components/admin/mapping/MappingCard.js` | Mapping 상세 카드 (더 복잡한 구조) |

---

## 전환 가이드라인

### ProfileCard props 매핑 방법

```jsx
<ProfileCard
  variant="list"          // 'list' | 'compact' | 'card'
  avatarUrl={user.avatarUrl}
  name={user.name}
  email={user.email}
  phone={user.phone}
  status={user.status}
  statusLabel={statusLabel}
  badges={[{ label: '...', variant: '...' }]}
  stats={[{ label: '회기수', value: count }]}
  onClick={() => handleClick(user.id)}
  actions={<Button>상세</Button>}
/>
```

### 전환 절차

1. 대상 파일의 인라인 카드 마크업을 확인하고, ProfileCard / ConsultantCard props와 매핑
2. 필요 시 공통 컴포넌트에 variant·prop 추가 (최소한으로)
3. 인라인 마크업을 공통 컴포넌트 호출로 교체
4. 관련 인라인 CSS 제거 (공통 컴포넌트 CSS로 대체)
5. 시각적 회귀가 없는지 브라우저에서 검증
6. 완료 후 이 체크리스트의 `- [ ]`를 `- [x]`로 갱신
