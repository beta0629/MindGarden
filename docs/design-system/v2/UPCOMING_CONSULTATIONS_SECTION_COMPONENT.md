# 다가오는 상담 섹션 — 컴포넌트 구조 예시

**작성일**: 2026-03-09  
**대상**: core-coder  
**목적**: JSX 구조 및 데이터 바인딩 가이드 제공  

---

## 1. 개요

이 문서는 "다가오는 상담" 섹션의 JSX 구조와 데이터 바인딩 방법을 제공합니다. core-coder는 이 구조를 참고하여 `ConsultantDashboardV2.js`에 구현합니다.

---

## 2. JSX 구조

### 2.1 카드 컨테이너

```jsx
{/* Section: 다가오는 상담 */}
<div className="dashboard-card">
  <div className="card-header">
    <h2 className="card-title">
      <Calendar size={18} className="card-title-icon" />
      다가오는 상담
    </h2>
    <button 
      className="mg-v2-btn mg-v2-btn-ghost mg-v2-btn-sm"
      onClick={() => navigate('/consultant/schedule')}
    >
      전체보기 <ChevronRight size={16} />
    </button>
  </div>
  <div className="card-body">
    {renderUpcomingSchedules()}
  </div>
</div>
```

### 2.2 렌더링 함수: `renderUpcomingSchedules()`

```jsx
const renderUpcomingSchedules = () => {
  // 로딩 상태
  if (loading) {
    return (
      <div className="empty-state">
        <div className="mg-v2-spinner"></div>
        <span className="empty-state-text">일정을 불러오는 중...</span>
      </div>
    );
  }
  
  // 데이터가 있을 때
  if (dashboardData.upcomingSchedules && dashboardData.upcomingSchedules.length > 0) {
    return (
      <div className="upcoming-schedule-list">
        {dashboardData.upcomingSchedules.slice(0, 5).map((schedule, idx) => {
          const isHighlighted = idx === 0; // 첫 번째 항목 강조
          const { dateStr, weekday, timeStr } = formatUpcomingSchedule(schedule);
          
          return (
            <div 
              key={schedule.id || `upcoming-schedule-${idx}`} 
              className={`upcoming-schedule-item ${isHighlighted ? 'upcoming-schedule-item--highlighted' : ''}`}
              onClick={() => handleScheduleClick(schedule.id)}
              role="button"
              tabIndex={0}
              aria-label={`${dateStr} ${timeStr} ${schedule.clientName} ${schedule.consultationType} ${schedule.status === 'CONFIRMED' ? '확정' : '대기'}`}
            >
              {/* 날짜/시간 영역 */}
              <div className="upcoming-schedule-date">
                <span className="upcoming-schedule-date__day">{dateStr}</span>
                <span className="upcoming-schedule-date__weekday">{weekday}</span>
                <span className="upcoming-schedule-date__time">{timeStr}</span>
              </div>
              
              {/* 상세 정보 영역 */}
              <div className="upcoming-schedule-details">
                <div className="upcoming-schedule-details__client">
                  {schedule.clientName || '내담자'}
                </div>
                <div className="upcoming-schedule-details__meta">
                  <Users size={12} />
                  {schedule.consultationType || '개인상담'}
                  {schedule.sessionNumber && ` · ${schedule.sessionNumber}회기`}
                </div>
              </div>
              
              {/* 상태 배지 */}
              <div className={`schedule-status ${schedule.status === 'CONFIRMED' ? 'status-confirmed' : 'status-pending'}`}>
                {schedule.status === 'CONFIRMED' ? '확정' : '대기'}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  
  // 빈 상태
  return (
    <div className="empty-state">
      <Calendar size={32} className="empty-state-icon" />
      <span className="empty-state-text">다가오는 상담이 없습니다.</span>
    </div>
  );
};
```

---

## 3. 데이터 포맷 함수

### 3.1 날짜/시간 포맷팅

```jsx
const formatUpcomingSchedule = (schedule) => {
  if (!schedule.date || !schedule.startTime) {
    return { dateStr: '', weekday: '', timeStr: '' };
  }
  
  // 날짜 파싱
  let dateObj;
  if (Array.isArray(schedule.date)) {
    // [2026, 3, 12] 형식
    const [year, month, day] = schedule.date;
    dateObj = new Date(year, month - 1, day);
  } else if (typeof schedule.date === 'string') {
    // "2026-03-12" 형식
    dateObj = new Date(schedule.date);
  } else {
    dateObj = new Date();
  }
  
  // 날짜 포맷: "03/12"
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const dateStr = `${month}/${day}`;
  
  // 요일 포맷: "수"
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[dateObj.getDay()];
  
  // 시간 파싱
  let timeStr = '';
  if (Array.isArray(schedule.startTime)) {
    // [14, 0, 0] 형식
    const [hours, minutes] = schedule.startTime;
    timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  } else if (typeof schedule.startTime === 'string') {
    // "14:00:00" 또는 "2026-03-12T14:00:00" 형식
    const timePart = schedule.startTime.includes('T') 
      ? schedule.startTime.split('T')[1] 
      : schedule.startTime;
    timeStr = timePart.substring(0, 5); // "14:00"
  }
  
  return { dateStr, weekday, timeStr };
};
```

### 3.2 클릭 핸들러

```jsx
const handleScheduleClick = (scheduleId) => {
  if (!scheduleId) return;
  
  // 상담일지 작성 화면 또는 상세 정보 화면으로 이동
  navigate(`/consultant/consultation-records?scheduleId=${scheduleId}`);
};
```

---

## 4. 상태 관리

### 4.1 상태 추가

```jsx
const [dashboardData, setDashboardData] = useState({
  stats: { /* ... */ },
  todaySchedules: [],
  upcomingSchedules: [], // 추가
  recentNotifications: [],
  weeklyStats: []
});
```

### 4.2 API 호출 (fetchDashboardData 내)

```jsx
// 3. 다가오는 상담 조회
let upcomingResponse;
try {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 7); // 오늘 + 7일
  
  upcomingResponse = await StandardizedApi.get('/api/v1/consultant/schedules/upcoming', {
    userId: currentUser.id,
    userRole: 'CONSULTANT',
    startDate: today.toISOString().split('T')[0], // "2026-03-09"
    endDate: endDate.toISOString().split('T')[0],  // "2026-03-16"
    limit: 5
  });
} catch (upcomingErr) {
  console.warn('다가오는 상담 API 실패, 빈 목록 사용:', upcomingErr?.message || upcomingErr);
  upcomingResponse = { schedules: [] };
}

// 데이터 가공
let upcomingSchedules = [];
if (upcomingResponse) {
  if (Array.isArray(upcomingResponse)) {
    upcomingSchedules = upcomingResponse;
  } else if (upcomingResponse.schedules && Array.isArray(upcomingResponse.schedules)) {
    upcomingSchedules = upcomingResponse.schedules;
  } else if (upcomingResponse.data && Array.isArray(upcomingResponse.data)) {
    upcomingSchedules = upcomingResponse.data;
  }
}

// 날짜/시간 기준 정렬 (가까운 순)
upcomingSchedules = upcomingSchedules.sort((a, b) => {
  const dateA = Array.isArray(a.date) 
    ? new Date(a.date[0], a.date[1] - 1, a.date[2]) 
    : new Date(a.date);
  const dateB = Array.isArray(b.date) 
    ? new Date(b.date[0], b.date[1] - 1, b.date[2]) 
    : new Date(b.date);
  
  if (dateA.getTime() !== dateB.getTime()) {
    return dateA - dateB;
  }
  
  // 같은 날이면 시간 비교
  const getTimeValue = (time) => {
    if (Array.isArray(time)) return time[0] * 60 + time[1];
    if (typeof time === 'string') {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    }
    return 0;
  };
  
  return getTimeValue(a.startTime) - getTimeValue(b.startTime);
});

// 상태 업데이트
setDashboardData({
  stats: { /* ... */ },
  todaySchedules: schedules,
  upcomingSchedules: upcomingSchedules, // 추가
  recentNotifications: activeNotifications,
  weeklyStats: weeklyStatsData
});
```

---

## 5. 접근성 (Accessibility)

### 5.1 ARIA 속성

```jsx
<div 
  className="dashboard-card"
  role="region"
  aria-label="다가오는 상담"
>
  {/* ... */}
</div>
```

### 5.2 키보드 이벤트

```jsx
<div 
  className="upcoming-schedule-item"
  onClick={() => handleScheduleClick(schedule.id)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleScheduleClick(schedule.id);
    }
  }}
  role="button"
  tabIndex={0}
  aria-label={`${dateStr} ${timeStr} ${schedule.clientName} ${schedule.consultationType} ${schedule.status === 'CONFIRMED' ? '확정' : '대기'}`}
>
  {/* ... */}
</div>
```

---

## 6. 레이아웃 배치 (consultant-main-grid 내)

### 6.1 기존 구조 (3열)

```jsx
<section className="consultant-main-grid">
  
  {/* Section A: 최근 일정 (오늘·어제) */}
  <div className="dashboard-card">
    {/* ... */}
  </div>

  {/* Section B: 다가오는 상담 (신규) */}
  <div className="dashboard-card">
    {/* ... */}
  </div>

  {/* Section C: 최근 알림 */}
  <div className="dashboard-card">
    {/* ... */}
  </div>

  {/* Section D: 주간 상담 현황 (전체 너비) */}
  <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
    {/* ... */}
  </div>

</section>
```

### 6.2 반응형 고려

- **데스크톱 (1280px~)**: 3열 그리드 → A, B, C 가로 배치
- **태블릿 (768px~1024px)**: 2열 그리드 → A, B 첫 행 / C, D 둘째 행
- **모바일 (~768px)**: 1열 그리드 → A, B, C, D 세로 스택

---

## 7. 완료 체크리스트

- [ ] `ConsultantDashboardV2.js`에 JSX 구조 추가
- [ ] `formatUpcomingSchedule()` 함수 구현
- [ ] `handleScheduleClick()` 함수 구현
- [ ] `fetchDashboardData()`에 API 호출 추가
- [ ] `upcomingSchedules` 상태 추가
- [ ] `renderUpcomingSchedules()` 함수 구현
- [ ] ARIA 속성 및 키보드 이벤트 추가
- [ ] 반응형 레이아웃 테스트
- [ ] 빈 상태 및 로딩 상태 처리
- [ ] 브라우저 테스트 (Chrome, Safari, Firefox)

---

## 8. 참조

- `docs/design-system/v2/UPCOMING_CONSULTATIONS_SECTION_SPEC.md` — 화면설계서
- `docs/design-system/v2/UPCOMING_CONSULTATIONS_SECTION_CSS.md` — CSS 스타일 정의
- `frontend/src/components/dashboard-v2/consultant/ConsultantDashboardV2.js` — 기존 컴포넌트
- `frontend/src/utils/standardizedApi.js` — API 호출 유틸

---

**작성 완료일**: 2026-03-09  
**작성자**: core-designer  
**다음 단계**: core-coder가 구현
