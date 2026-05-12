# 인라인 카드 렌더링 → 공통 컴포넌트 전환 체크리스트

**최종 갱신**: 2026-05-12  
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

## 전환 완료 항목 (12건) — 2026-05-12 완료

### ProfileCard 전환 (8건)

- [x] **#1** `ConsultantClientSection.js` → ProfileCard (list)
- [x] **#2** `widgets/ConsultantClientWidget.js` → ProfileCard (list)
- [x] **#3** `widgets/consultation/ConsultantClientWidget.js` → ProfileCard (compact)
- [x] **#4** `ConsultantStatus.js` → ProfileCard (list)
- [x] **#5** `SessionManagement.js` 빠른 회기 추가 → ProfileCard (compact)
- [x] **#6** `SessionManagement.js` 내담자 검색 → ProfileCard (compact)
- [x] **#8** `AdminDashboard.js` 휴가 현황 → ProfileCard (list)
- [x] **#11** `VacationStatistics.js` 휴가 현황 → ProfileCard (list)

### 별도 컴포넌트 추출 (4건)

- [x] **#7** `AdminDashboard.js` 우수 상담사 평점 → **ConsultantRatingCard** (`ui/Card/`)
- [x] **#9** `ClientConsultationTab.js` 상담 이력 → **ConsultationRecordCard** (`ui/Card/`)
- [x] **#10** `ClientMappingTab.js` 매칭 상세 → **MappingDetailCard** (`ui/Card/`)
- [x] **#12** `ConsultationCompletionStatsView.js` 상담사 통계 → **ConsultantStatsCard** (`ui/Card/`)

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
