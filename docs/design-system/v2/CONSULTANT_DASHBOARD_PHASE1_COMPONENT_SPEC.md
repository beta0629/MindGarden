# 상담사 대시보드 Phase 1 컨텐츠 컴포넌트 구조 명세

**작성일**: 2026-03-09  
**작성자**: Core Designer  
**목적**: Phase 1 컨텐츠 4개의 React 컴포넌트 구조, Props, 상태 관리 명세

**참조**:
- 디자인 스펙: `docs/design-system/v2/CONSULTANT_DASHBOARD_PHASE1_DESIGN_SPEC.md`
- CSS 스펙: `docs/design-system/v2/CONSULTANT_DASHBOARD_PHASE1_CSS_SPEC.md`
- 아토믹 디자인: `docs/design-system/ATOMIC_DESIGN_SYSTEM.md`

---

## 0. 컴포넌트 계층 구조 (아토믹 디자인)

```
Organisms (대시보드 섹션)
├── QuickActionBar (빠른 액션 바)
├── IncompleteRecordsAlert (미작성 상담일지 알림)
├── NextConsultationCard (다음 상담 준비 카드)
└── UrgentClientsSection (긴급 확인 필요 내담자)

Molecules (재사용 가능한 블록)
├── InfoBlock (정보 블록: 라벨 + 값)
├── UrgentClientCard (긴급 내담자 카드)
└── Badge (배지)

Atoms (기본 요소)
├── Button (버튼)
├── Icon (아이콘)
└── Spinner (로딩 스피너)
```

---

## 1. QuickActionBar (빠른 액션 바)

### 1.1 컴포넌트 개요

**파일 경로**: `frontend/src/components/dashboard-v2/consultant/QuickActionBar.js`  
**타입**: Organism  
**목적**: 자주 사용하는 동작을 1클릭으로 접근

### 1.2 Props 인터페이스

```typescript
interface QuickActionBarProps {
  onNavigate: (path: string) => void; // 네비게이션 함수
  className?: string; // 추가 CSS 클래스
}
```

### 1.3 컴포넌트 구조

```jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Zap, FileText, Calendar, Users, MessageSquare } from 'lucide-react';

const QuickActionBar = ({ onNavigate, className = '' }) => {
  const actions = [
    {
      id: 'create-record',
      label: '상담일지 작성',
      icon: FileText,
      path: '/consultant/consultation-records?action=create',
      variant: 'primary'
    },
    {
      id: 'view-schedule',
      label: '일정 조회',
      icon: Calendar,
      path: '/consultant/schedule',
      variant: 'outline'
    },
    {
      id: 'manage-clients',
      label: '내담자 관리',
      icon: Users,
      path: '/consultant/clients',
      variant: 'outline'
    },
    {
      id: 'check-messages',
      label: '메시지 확인',
      icon: MessageSquare,
      path: '/consultant/messages',
      variant: 'outline'
    }
  ];

  return (
    <div className={`mg-v2-quick-action-bar ${className}`}>
      <div className="mg-v2-quick-action-bar__title">
        <Zap size={18} />
        빠른 액션
      </div>
      <div className="mg-v2-quick-action-bar__actions">
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              className={`mg-v2-btn mg-v2-btn-${action.variant} mg-v2-btn-md`}
              onClick={() => onNavigate(action.path)}
              type="button"
              aria-label={action.label}
            >
              <Icon size={16} />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

QuickActionBar.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default QuickActionBar;
```

### 1.4 사용 예시

```jsx
import QuickActionBar from './QuickActionBar';
import { useNavigate } from 'react-router-dom';

const ConsultantDashboard = () => {
  const navigate = useNavigate();
  
  return (
    <QuickActionBar onNavigate={navigate} />
  );
};
```

---

## 2. IncompleteRecordsAlert (미작성 상담일지 알림)

### 2.1 컴포넌트 개요

**파일 경로**: `frontend/src/components/dashboard-v2/consultant/IncompleteRecordsAlert.js`  
**타입**: Organism  
**목적**: 미작성 일지 알림 및 바로 작성 유도

### 2.2 Props 인터페이스

```typescript
interface IncompleteRecordsAlertProps {
  count: number; // 미작성 일지 개수
  schedules?: Array<{
    scheduleId: number;
    clientName: string;
    consultationDate: string;
  }>; // 미작성 일지 목록 (선택)
  onAction: () => void; // "바로 작성하기" 클릭 시 동작
  className?: string;
}
```

### 2.3 컴포넌트 구조

```jsx
import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, FileText } from 'lucide-react';

const IncompleteRecordsAlert = ({ 
  count, 
  schedules = [], 
  onAction, 
  className = '' 
}) => {
  // 조건부 렌더링: count가 0이면 표시하지 않음
  if (count === 0) return null;

  return (
    <div className={`mg-v2-alert mg-v2-alert--warning ${className}`}>
      <div className="mg-v2-alert__content">
        <AlertTriangle size={24} className="mg-v2-alert__icon" />
        <div className="mg-v2-alert__text">
          <div className="mg-v2-alert__text-title">
            미작성 상담일지 {count}건
          </div>
          <div className="mg-v2-alert__text-subtitle">
            완료된 상담의 일지를 작성해 주세요.
          </div>
        </div>
      </div>
      <div className="mg-v2-alert__action">
        <button
          className="mg-v2-btn mg-v2-btn-primary mg-v2-btn-md"
          onClick={onAction}
          type="button"
          aria-label={`미작성 상담일지 ${count}건 작성하기`}
        >
          <FileText size={16} />
          바로 작성하기
        </button>
      </div>
    </div>
  );
};

IncompleteRecordsAlert.propTypes = {
  count: PropTypes.number.isRequired,
  schedules: PropTypes.arrayOf(
    PropTypes.shape({
      scheduleId: PropTypes.number.isRequired,
      clientName: PropTypes.string.isRequired,
      consultationDate: PropTypes.string.isRequired
    })
  ),
  onAction: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default IncompleteRecordsAlert;
```

### 2.4 사용 예시

```jsx
import IncompleteRecordsAlert from './IncompleteRecordsAlert';
import { useNavigate } from 'react-router-dom';

const ConsultantDashboard = () => {
  const navigate = useNavigate();
  const [incompleteRecords, setIncompleteRecords] = useState({ count: 0, schedules: [] });

  useEffect(() => {
    // API 호출
    fetchIncompleteRecords();
  }, []);

  const handleAction = () => {
    navigate('/consultant/consultation-records?filter=incomplete');
  };

  return (
    <IncompleteRecordsAlert 
      count={incompleteRecords.count}
      schedules={incompleteRecords.schedules}
      onAction={handleAction}
    />
  );
};
```

---

## 3. NextConsultationCard (다음 상담 준비 카드)

### 3.1 컴포넌트 개요

**파일 경로**: `frontend/src/components/dashboard-v2/consultant/NextConsultationCard.js`  
**타입**: Organism  
**목적**: 오늘/내일 예정된 다음 상담 정보 표시

### 3.2 Props 인터페이스

```typescript
interface NextConsultationCardProps {
  consultation: {
    scheduleId: number;
    clientId: number;
    clientName: string;
    startTime: string; // ISO 8601 형식
    endTime: string;
    sessionNumber: number;
    isToday: boolean; // true: 오늘, false: 내일
  } | null;
  onViewPreviousRecords: (clientId: number) => void; // "이전 일지 보기"
  onViewDetails: (scheduleId: number) => void; // "상세보기"
  className?: string;
}
```

### 3.3 컴포넌트 구조

```jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Calendar, FileText, ChevronRight } from 'lucide-react';

const NextConsultationCard = ({ 
  consultation, 
  onViewPreviousRecords, 
  onViewDetails, 
  className = '' 
}) => {
  // 조건부 렌더링: consultation이 null이면 표시하지 않음
  if (!consultation) return null;

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className={`mg-v2-next-consultation-card ${className}`}>
      <div className="mg-v2-next-consultation-card__header">
        <div className="mg-v2-next-consultation-card__title">
          <Calendar size={18} />
          다음 상담 준비
        </div>
        <div className={`mg-v2-badge mg-v2-badge--primary`}>
          {consultation.isToday ? '오늘' : '내일'}
        </div>
      </div>

      <div className="mg-v2-next-consultation-card__body">
        <div className="mg-v2-info-block">
          <div className="mg-v2-info-block__label">내담자</div>
          <div className="mg-v2-info-block__value">{consultation.clientName}</div>
        </div>
        
        <div className="mg-v2-info-block">
          <div className="mg-v2-info-block__label">시간</div>
          <div className="mg-v2-info-block__value">
            {formatTime(consultation.startTime)} - {formatTime(consultation.endTime)}
          </div>
        </div>
        
        <div className="mg-v2-info-block">
          <div className="mg-v2-info-block__label">회기</div>
          <div className="mg-v2-info-block__value">{consultation.sessionNumber}회기</div>
        </div>
      </div>

      <div className="mg-v2-next-consultation-card__footer">
        <button
          className="mg-v2-btn mg-v2-btn-outline mg-v2-btn-sm"
          onClick={() => onViewPreviousRecords(consultation.clientId)}
          type="button"
          aria-label={`${consultation.clientName} 이전 일지 보기`}
        >
          <FileText size={16} />
          이전 일지 보기
        </button>
        <button
          className="mg-v2-btn mg-v2-btn-primary mg-v2-btn-sm"
          onClick={() => onViewDetails(consultation.scheduleId)}
          type="button"
          aria-label={`${consultation.clientName} 상담 상세보기`}
        >
          상세보기
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

NextConsultationCard.propTypes = {
  consultation: PropTypes.shape({
    scheduleId: PropTypes.number.isRequired,
    clientId: PropTypes.number.isRequired,
    clientName: PropTypes.string.isRequired,
    startTime: PropTypes.string.isRequired,
    endTime: PropTypes.string.isRequired,
    sessionNumber: PropTypes.number.isRequired,
    isToday: PropTypes.bool.isRequired
  }),
  onViewPreviousRecords: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default NextConsultationCard;
```

### 3.4 사용 예시

```jsx
import NextConsultationCard from './NextConsultationCard';
import { useNavigate } from 'react-router-dom';

const ConsultantDashboard = () => {
  const navigate = useNavigate();
  const [nextConsultation, setNextConsultation] = useState(null);

  useEffect(() => {
    // API 호출: 오늘/내일 상담 조회
    fetchNextConsultation();
  }, []);

  const handleViewPreviousRecords = (clientId) => {
    navigate(`/consultant/consultation-records?clientId=${clientId}`);
  };

  const handleViewDetails = (scheduleId) => {
    navigate(`/consultant/consultation-records?scheduleId=${scheduleId}`);
  };

  return (
    <NextConsultationCard 
      consultation={nextConsultation}
      onViewPreviousRecords={handleViewPreviousRecords}
      onViewDetails={handleViewDetails}
    />
  );
};
```

---

## 4. UrgentClientsSection (긴급 확인 필요 내담자)

### 4.1 컴포넌트 개요

**파일 경로**: `frontend/src/components/dashboard-v2/consultant/UrgentClientsSection.js`  
**타입**: Organism  
**목적**: 위험도 높거나 진행도 저하된 내담자 알림

### 4.2 Props 인터페이스

```typescript
interface UrgentClientsSectionProps {
  clients: Array<{
    clientId: number;
    clientName: string;
    sessionNumber: number;
    lastConsultationDate: string; // YYYY-MM-DD
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    mainIssue: string;
  }>;
  onViewAllClients: () => void; // "전체보기" 클릭
  onViewClientDetails: (clientId: number) => void; // 카드 클릭
  className?: string;
}
```

### 4.3 컴포넌트 구조

```jsx
import React from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, ChevronRight, Users, Calendar } from 'lucide-react';
import UrgentClientCard from './UrgentClientCard'; // Molecule

const UrgentClientsSection = ({ 
  clients = [], 
  onViewAllClients, 
  onViewClientDetails, 
  className = '' 
}) => {
  // 조건부 렌더링: clients가 비어있으면 표시하지 않음
  if (clients.length === 0) return null;

  return (
    <div className={`mg-v2-urgent-clients-section ${className}`}>
      <div className="mg-v2-urgent-clients-section__header">
        <div className="mg-v2-urgent-clients-section__title">
          <AlertCircle size={18} />
          긴급 확인 필요 내담자
        </div>
        <button
          className="mg-v2-btn mg-v2-btn-ghost mg-v2-btn-sm"
          onClick={onViewAllClients}
          type="button"
          aria-label="긴급 내담자 전체보기"
        >
          전체보기 <ChevronRight size={16} />
        </button>
      </div>

      <div className="mg-v2-urgent-clients-section__body">
        {clients.slice(0, 5).map(client => (
          <UrgentClientCard
            key={client.clientId}
            client={client}
            onClick={() => onViewClientDetails(client.clientId)}
          />
        ))}
      </div>
    </div>
  );
};

UrgentClientsSection.propTypes = {
  clients: PropTypes.arrayOf(
    PropTypes.shape({
      clientId: PropTypes.number.isRequired,
      clientName: PropTypes.string.isRequired,
      sessionNumber: PropTypes.number.isRequired,
      lastConsultationDate: PropTypes.string.isRequired,
      riskLevel: PropTypes.oneOf(['CRITICAL', 'HIGH', 'MEDIUM']).isRequired,
      mainIssue: PropTypes.string.isRequired
    })
  ).isRequired,
  onViewAllClients: PropTypes.func.isRequired,
  onViewClientDetails: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default UrgentClientsSection;
```

### 4.4 사용 예시

```jsx
import UrgentClientsSection from './UrgentClientsSection';
import { useNavigate } from 'react-router-dom';

const ConsultantDashboard = () => {
  const navigate = useNavigate();
  const [urgentClients, setUrgentClients] = useState([]);

  useEffect(() => {
    // API 호출
    fetchUrgentClients();
  }, []);

  const handleViewAllClients = () => {
    navigate('/consultant/clients?filter=urgent');
  };

  const handleViewClientDetails = (clientId) => {
    navigate(`/consultant/clients/${clientId}`);
  };

  return (
    <UrgentClientsSection 
      clients={urgentClients}
      onViewAllClients={handleViewAllClients}
      onViewClientDetails={handleViewClientDetails}
    />
  );
};
```

---

## 5. UrgentClientCard (긴급 내담자 카드) — Molecule

### 5.1 컴포넌트 개요

**파일 경로**: `frontend/src/components/dashboard-v2/consultant/UrgentClientCard.js`  
**타입**: Molecule  
**목적**: 긴급 내담자 정보를 카드 형태로 표시

### 5.2 Props 인터페이스

```typescript
interface UrgentClientCardProps {
  client: {
    clientId: number;
    clientName: string;
    sessionNumber: number;
    lastConsultationDate: string;
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    mainIssue: string;
  };
  onClick: () => void;
  className?: string;
}
```

### 5.3 컴포넌트 구조

```jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Users, Calendar, ChevronRight } from 'lucide-react';

const UrgentClientCard = ({ client, onClick, className = '' }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}`;
  };

  const getRiskLevelLabel = (level) => {
    const labels = {
      CRITICAL: '매우 위험',
      HIGH: '위험',
      MEDIUM: '주의'
    };
    return labels[level] || level;
  };

  return (
    <div 
      className={`mg-v2-urgent-client-card ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
      aria-label={`${client.clientName} 상세보기`}
    >
      <div className="mg-v2-urgent-client-card__info">
        <div className="mg-v2-urgent-client-card__name">
          {client.clientName}
        </div>
        <div className="mg-v2-urgent-client-card__meta">
          <Users size={12} />
          {client.sessionNumber}회기
          <span style={{ margin: '0 4px' }}>·</span>
          <Calendar size={12} />
          {formatDate(client.lastConsultationDate)}
        </div>
        <div className="mg-v2-urgent-client-card__issue">
          {client.mainIssue}
        </div>
      </div>

      <div className="mg-v2-urgent-client-card__actions">
        <div className={`mg-v2-badge mg-v2-badge--${client.riskLevel.toLowerCase()}`}>
          {getRiskLevelLabel(client.riskLevel)}
        </div>
        <button
          className="mg-v2-btn mg-v2-btn-outline mg-v2-btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          type="button"
          aria-label={`${client.clientName} 상세보기`}
        >
          상세보기
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

UrgentClientCard.propTypes = {
  client: PropTypes.shape({
    clientId: PropTypes.number.isRequired,
    clientName: PropTypes.string.isRequired,
    sessionNumber: PropTypes.number.isRequired,
    lastConsultationDate: PropTypes.string.isRequired,
    riskLevel: PropTypes.oneOf(['CRITICAL', 'HIGH', 'MEDIUM']).isRequired,
    mainIssue: PropTypes.string.isRequired
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default UrgentClientCard;
```

---

## 6. InfoBlock (정보 블록) — Molecule

### 6.1 컴포넌트 개요

**파일 경로**: `frontend/src/components/dashboard-v2/molecules/InfoBlock.js`  
**타입**: Molecule  
**목적**: 라벨 + 값 형태의 정보 블록 (재사용 가능)

### 6.2 Props 인터페이스

```typescript
interface InfoBlockProps {
  label: string;
  value: string | number;
  className?: string;
}
```

### 6.3 컴포넌트 구조

```jsx
import React from 'react';
import PropTypes from 'prop-types';

const InfoBlock = ({ label, value, className = '' }) => {
  return (
    <div className={`mg-v2-info-block ${className}`}>
      <div className="mg-v2-info-block__label">{label}</div>
      <div className="mg-v2-info-block__value">{value}</div>
    </div>
  );
};

InfoBlock.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  className: PropTypes.string
};

export default InfoBlock;
```

---

## 7. 상태 관리 (ConsultantDashboardV2.js)

### 7.1 상태 구조

```javascript
const [dashboardData, setDashboardData] = useState({
  // 기존 상태 유지
  stats: { ... },
  todaySchedules: [],
  upcomingSchedules: [],
  recentNotifications: [],
  weeklyStats: [],
  
  // Phase 1 신규 상태
  incompleteRecords: {
    count: 0,
    schedules: []
  },
  nextConsultation: null,
  urgentClients: []
});
```

### 7.2 API 호출 (useEffect)

```javascript
useEffect(() => {
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 병렬 API 호출
      const [
        statsRes,
        schedulesRes,
        upcomingRes,
        incompleteRes, // 신규
        urgentClientsRes // 신규
      ] = await Promise.all([
        StandardizedApi.get(DASHBOARD_API.CONSULTANT_STATS),
        StandardizedApi.get(DASHBOARD_API.CONSULTANT_SCHEDULES),
        StandardizedApi.get(DASHBOARD_API.CONSULTANT_UPCOMING_SCHEDULES),
        StandardizedApi.get(`/api/v1/consultants/${user.id}/incomplete-records`),
        StandardizedApi.get(`/api/v1/consultants/${user.id}/urgent-clients`)
      ]);

      // 다음 상담 준비 카드: 오늘/내일 첫 번째 상담
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextConsultation = upcomingRes.schedules?.find(s => {
        const scheduleDate = new Date(s.date);
        return scheduleDate.toDateString() === today.toDateString() ||
               scheduleDate.toDateString() === tomorrow.toDateString();
      });

      setDashboardData({
        stats: statsRes,
        todaySchedules: schedulesRes.schedules,
        upcomingSchedules: upcomingRes.schedules,
        incompleteRecords: incompleteRes,
        nextConsultation: nextConsultation ? {
          ...nextConsultation,
          isToday: new Date(nextConsultation.date).toDateString() === today.toDateString()
        } : null,
        urgentClients: urgentClientsRes.clients || []
      });
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchAllData();
}, [user]);
```

### 7.3 렌더링 순서

```jsx
return (
  <AdminCommonLayout title="상담사 대시보드">
    <div className="consultant-dashboard-v2">
      
      {/* 웰컴 메시지 (기존) */}
      <WelcomeSection user={user} todaySchedules={dashboardData.stats.todaySchedules} />
      
      {/* Phase 1 신규 컨텐츠 */}
      <QuickActionBar onNavigate={navigate} />
      
      <IncompleteRecordsAlert 
        count={dashboardData.incompleteRecords.count}
        schedules={dashboardData.incompleteRecords.schedules}
        onAction={() => navigate('/consultant/consultation-records?filter=incomplete')}
      />
      
      <NextConsultationCard 
        consultation={dashboardData.nextConsultation}
        onViewPreviousRecords={(clientId) => navigate(`/consultant/consultation-records?clientId=${clientId}`)}
        onViewDetails={(scheduleId) => navigate(`/consultant/consultation-records?scheduleId=${scheduleId}`)}
      />
      
      {/* 주요 통계 카드 (기존) */}
      <StatCards stats={dashboardData.stats} />
      
      {/* Phase 1 신규 컨텐츠 */}
      <UrgentClientsSection 
        clients={dashboardData.urgentClients}
        onViewAllClients={() => navigate('/consultant/clients?filter=urgent')}
        onViewClientDetails={(clientId) => navigate(`/consultant/clients/${clientId}`)}
      />
      
      {/* 기존 섹션들 */}
      <RecentSchedules schedules={dashboardData.todaySchedules} />
      <UpcomingSchedules schedules={dashboardData.upcomingSchedules} />
      <RecentNotifications notifications={dashboardData.recentNotifications} />
      <WeeklyStats stats={dashboardData.weeklyStats} />
      
    </div>
  </AdminCommonLayout>
);
```

---

## 8. 에러 처리 및 로딩 상태

### 8.1 로딩 상태

```jsx
{loading ? (
  <div className="mg-v2-quick-action-bar" style={{ minHeight: '80px' }}>
    <div className="mg-v2-spinner"></div>
  </div>
) : (
  <QuickActionBar onNavigate={navigate} />
)}
```

### 8.2 에러 처리

```jsx
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      // API 호출
    } catch (err) {
      setError(err.message);
      console.error('API 호출 실패:', err);
    }
  };
  fetchData();
}, []);

{error && (
  <div className="mg-v2-alert mg-v2-alert--error">
    {error}
  </div>
)}
```

---

## 9. 테스트 케이스

### 9.1 QuickActionBar 테스트

```javascript
describe('QuickActionBar', () => {
  it('모든 버튼이 렌더링되는지 확인', () => {
    const { getByText } = render(<QuickActionBar onNavigate={jest.fn()} />);
    expect(getByText('상담일지 작성')).toBeInTheDocument();
    expect(getByText('일정 조회')).toBeInTheDocument();
    expect(getByText('내담자 관리')).toBeInTheDocument();
    expect(getByText('메시지 확인')).toBeInTheDocument();
  });

  it('버튼 클릭 시 onNavigate 호출', () => {
    const mockNavigate = jest.fn();
    const { getByText } = render(<QuickActionBar onNavigate={mockNavigate} />);
    fireEvent.click(getByText('상담일지 작성'));
    expect(mockNavigate).toHaveBeenCalledWith('/consultant/consultation-records?action=create');
  });
});
```

### 9.2 IncompleteRecordsAlert 테스트

```javascript
describe('IncompleteRecordsAlert', () => {
  it('count가 0이면 렌더링하지 않음', () => {
    const { container } = render(
      <IncompleteRecordsAlert count={0} onAction={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('count가 1 이상이면 렌더링', () => {
    const { getByText } = render(
      <IncompleteRecordsAlert count={3} onAction={jest.fn()} />
    );
    expect(getByText('미작성 상담일지 3건')).toBeInTheDocument();
  });
});
```

---

## 10. 코더 전달 체크리스트

- [ ] 컴포넌트 파일 생성 (QuickActionBar, IncompleteRecordsAlert, NextConsultationCard, UrgentClientsSection, UrgentClientCard)
- [ ] PropTypes 정의 (모든 props 타입 검증)
- [ ] 조건부 렌더링 (count, consultation, clients 체크)
- [ ] 이벤트 핸들러 연결 (onClick, onNavigate)
- [ ] 접근성: aria-label, role, tabIndex, onKeyPress
- [ ] 아이콘: lucide-react 사용
- [ ] CSS 클래스: mg-v2-* 형식
- [ ] API 연동: StandardizedApi 사용
- [ ] 에러 처리: try-catch, 빈 데이터 처리
- [ ] 로딩 상태: Spinner 표시
- [ ] 테스트: 단위 테스트 작성

---

**문서 종료**
