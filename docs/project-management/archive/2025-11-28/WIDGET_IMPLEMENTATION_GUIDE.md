# 위젯 구현 가이드

## 📋 개요

MindGarden Admin Dashboard 위젯을 구현할 때 따라야 할 표준 가이드라인입니다.

---

## 🎯 위젯 구현 표준

### 1. 파일 명명 규칙
```
{WidgetName}Widget.js
```
- 예: `TodayStatsWidget.js`, `SystemOverviewWidget.js`

### 2. 기본 위젯 구조
```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../../utils/ajax';
import '../Widget.css';

const {WidgetName}Widget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const config = widget.config || {};

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet('/api/endpoint');
      setData(response);
    } catch (err) {
      console.error('위젯 데이터 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="widget widget-{widget-type}">
        <div className="widget-header">
          <div className="widget-title">{config.title || '로딩 중...'}</div>
        </div>
        <div className="widget-body">
          <div className="loading-spinner">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="widget widget-{widget-type}">
        <div className="widget-header">
          <div className="widget-title">{config.title || '오류'}</div>
        </div>
        <div className="widget-body">
          <div className="error-message">데이터를 불러올 수 없습니다: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="widget widget-{widget-type}">
      <div className="widget-header">
        <div className="widget-title">{config.title}</div>
        {config.subtitle && (
          <div className="widget-subtitle">{config.subtitle}</div>
        )}
      </div>
      <div className="widget-body">
        {/* 위젯 내용 */}
      </div>
    </div>
  );
};

export default {WidgetName}Widget;
```

### 3. CSS 클래스 명명 규칙
- 위젯 컨테이너: `widget widget-{type}`
- 헤더: `widget-header`
- 제목: `widget-title`
- 부제목: `widget-subtitle`
- 본문: `widget-body`
- 로딩: `loading-spinner`
- 오류: `error-message`

---

## 📊 통계 위젯 구현 패턴

### StatCard 사용 예시
```javascript
import StatCard from '../../ui/Card/StatCard';
import { Users, Calendar, CheckCircle } from 'lucide-react';

// 위젯 본문에서
<div className="mg-stats-grid">
  <StatCard
    icon={<Users />}
    value={data.totalUsers}
    label="총 사용자"
    onClick={() => navigate('/admin/users')}
  />
  <StatCard
    icon={<Calendar />}
    value={data.totalAppointments}
    label="예약 수"
    onClick={() => navigate('/admin/appointments')}
  />
</div>
```

---

## 🔧 API 연동 패턴

### 1. 단일 API 호출
```javascript
const loadData = async () => {
  try {
    setLoading(true);
    const response = await apiGet('/api/admin/stats');
    setData(response);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### 2. 다중 API 호출
```javascript
const loadData = async () => {
  try {
    setLoading(true);
    const [consultants, clients, mappings] = await Promise.all([
      apiGet('/api/admin/consultants/with-stats'),
      apiGet('/api/admin/clients/with-stats'),
      apiGet('/api/admin/mappings/stats')
    ]);
    
    setData({
      consultants: consultants.count || 0,
      clients: clients.count || 0,
      mappings: mappings.count || 0
    });
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### 3. 자동 새로고침
```javascript
useEffect(() => {
  loadData();
  
  // 5분마다 자동 새로고침
  const interval = setInterval(loadData, 5 * 60 * 1000);
  
  return () => clearInterval(interval);
}, []);
```

---

## 🎨 스타일링 가이드

### 1. MindGarden 디자인 시스템 사용
```css
/* CSS 변수 사용 */
.widget {
  background-color: var(--mg-white);
  border: 1px solid var(--mg-gray-300);
  border-radius: var(--mg-border-radius-md);
  padding: var(--mg-spacing-md);
  box-shadow: var(--mg-shadow-sm);
}

.widget-title {
  font-size: var(--mg-font-size-lg);
  font-weight: var(--mg-font-weight-semibold);
  color: var(--mg-gray-900);
}
```

### 2. 반응형 디자인
```css
.mg-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--mg-spacing-md);
}

@media (max-width: 768px) {
  .mg-stats-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## 🔗 위젯 등록

### WidgetRegistry.js에 추가
```javascript
// 위젯 import
import TodayStatsWidget from './admin/TodayStatsWidget';

// COMMON_WIDGETS에 추가
const COMMON_WIDGETS = {
  // ... 기존 위젯들
  'today-stats': TodayStatsWidget,
};
```

### DynamicDashboard 설정에 추가
```javascript
const defaultAdminDashboardConfig = {
  widgets: [
    // ... 기존 위젯들
    {
      id: 'admin-today-stats',
      type: 'today-stats',
      position: { row: 2, col: 1, colspan: 2, rowspan: 1 },
      config: {
        title: '오늘의 통계',
        subtitle: '오늘의 상담 현황 요약'
      }
    }
  ]
};
```

---

## ✅ 테스트 체크리스트

### 구현 완료 후 확인사항
- [ ] 위젯이 정상적으로 렌더링되는가?
- [ ] API 데이터가 올바르게 표시되는가?
- [ ] 로딩 상태가 적절히 표시되는가?
- [ ] 오류 상태가 적절히 처리되는가?
- [ ] 클릭 이벤트가 정상 작동하는가?
- [ ] 반응형 디자인이 적용되는가?
- [ ] 콘솔에 오류가 없는가?

### 브라우저 테스트
1. 페이지 새로고침 후 위젯 로딩 확인
2. 네트워크 탭에서 API 호출 확인
3. 콘솔에서 오류 메시지 확인
4. 모바일 뷰에서 반응형 확인

---

## 🚨 주의사항

### 1. 성능 최적화
- 불필요한 API 호출 방지
- 메모리 누수 방지 (useEffect cleanup)
- 적절한 로딩 상태 표시

### 2. 오류 처리
- API 오류에 대한 사용자 친화적 메시지
- 네트워크 오류 처리
- 데이터 형식 오류 처리

### 3. 접근성
- 적절한 ARIA 라벨
- 키보드 네비게이션 지원
- 색상 대비 준수

---

## 📝 예시: TodayStatsWidget 구현

다음 단계에서 구현할 `TodayStatsWidget`의 예시:

```javascript
import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock } from 'lucide-react';
import StatCard from '../../ui/Card/StatCard';
import { apiGet } from '../../../utils/ajax';
import '../Widget.css';

const TodayStatsWidget = ({ widget, user }) => {
  const [stats, setStats] = useState({
    totalToday: 0,
    completedToday: 0,
    pendingToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const config = widget.config || {};

  useEffect(() => {
    loadTodayStats();
  }, []);

  const loadTodayStats = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/api/admin/today-stats');
      setStats(response);
    } catch (err) {
      console.error('오늘의 통계 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="widget widget-today-stats">
        <div className="widget-header">
          <div className="widget-title">{config.title || '오늘의 통계'}</div>
        </div>
        <div className="widget-body">
          <div className="loading-spinner">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="widget widget-today-stats">
        <div className="widget-header">
          <div className="widget-title">{config.title || '오늘의 통계'}</div>
        </div>
        <div className="widget-body">
          <div className="error-message">데이터를 불러올 수 없습니다</div>
        </div>
      </div>
    );
  }

  return (
    <div className="widget widget-today-stats">
      <div className="widget-header">
        <div className="widget-title">{config.title || '오늘의 통계'}</div>
        {config.subtitle && (
          <div className="widget-subtitle">{config.subtitle}</div>
        )}
      </div>
      <div className="widget-body">
        <div className="mg-stats-grid">
          <StatCard
            icon={<Calendar />}
            value={stats.totalToday}
            label="예약된 상담"
            color="primary"
          />
          <StatCard
            icon={<CheckCircle />}
            value={stats.completedToday}
            label="완료된 상담"
            color="success"
          />
          <StatCard
            icon={<Clock />}
            value={stats.pendingToday}
            label="대기 중인 상담"
            color="warning"
          />
        </div>
      </div>
    </div>
  );
};

export default TodayStatsWidget;
```
