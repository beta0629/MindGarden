# 대시보드 데이터 표시 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-03  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 대시보드 데이터 표시 표준입니다.  
대시보드에서 데이터를 효율적으로 표시하고 상세 페이지로 이동하는 표준을 정의합니다.

### 참조 문서
- [데이터 리스트 관리 표준](./DATA_LIST_MANAGEMENT_STANDARD.md)
- [프론트엔드 개발 표준](./FRONTEND_DEVELOPMENT_STANDARD.md)
- [성능 최적화 표준](./PERFORMANCE_OPTIMIZATION_STANDARD.md)

### 구현 위치
- **통계 카드 컴포넌트**: `frontend/src/components/common/StatCard.js`
- **위젯 컴포넌트**: `frontend/src/components/dashboard/widgets/`
- **대시보드**: `frontend/src/components/admin/AdminDashboard.js`

---

## 🎯 대시보드 데이터 표시 원칙

### 1. 최신 데이터만 표시
```
대시보드 데이터가 많을 경우 최신 건 몇 개만 보여주기
```

**원칙**:
- ✅ 목록 데이터: 최대 5~10개만 표시
- ✅ 통계 데이터: 요약 정보만 표시
- ✅ 상세 페이지로 이동 링크 제공
- ❌ 대시보드에 모든 데이터 표시 금지

### 2. 링크 의무화
```
대시보드의 모든 카드/위젯은 상세 페이지로 이동 가능해야 함
```

**원칙**:
- ✅ 통계 카드: 클릭 시 상세 페이지 이동
- ✅ 목록 위젯: "더보기" 링크 제공
- ✅ 차트 위젯: 상세 페이지 링크 제공
- ❌ 링크 없는 카드/위젯 금지

### 3. 성능 최적화
```
대시보드 로딩 성능을 위해 데이터 제한
```

**원칙**:
- ✅ 초기 로딩: 최소한의 데이터만
- ✅ 지연 로딩: 필요 시 추가 데이터 로딩
- ✅ 캐싱 활용

---

## 📊 데이터 표시 규칙

### 1. 목록 데이터 표시

#### 최대 개수 제한
| 데이터 유형 | 대시보드 표시 개수 | 상세 페이지 |
|-----------|----------------|-----------|
| 최근 알림 | 5개 | 전체 목록 |
| 최근 메시지 | 5개 | 전체 목록 |
| 최근 일정 | 10개 | 전체 목록 |
| 최근 활동 | 5개 | 전체 목록 |
| 최근 사용자 | 5개 | 전체 목록 |

#### 구현 예시
```javascript
const RecentNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const MAX_DISPLAY = 5; // 대시보드 최대 표시 개수

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        // 최신 5개만 조회
        const response = await apiGet(
            `/api/v1/notifications?page=0&size=${MAX_DISPLAY}&sort=createdAt,desc`
        );
        
        if (response.success) {
            setNotifications(response.data.content || []);
        }
    };

    return (
        <div className="recent-notifications">
            <div className="widget-header">
                <h3>최근 알림</h3>
                <Link to="/notifications" className="view-all-link">
                    전체 보기 →
                </Link>
            </div>
            
            <div className="notifications-list">
                {notifications.map(notif => (
                    <NotificationItem key={notif.id} notification={notif} />
                ))}
            </div>
            
            {notifications.length === 0 && (
                <div className="empty-state">알림이 없습니다.</div>
            )}
        </div>
    );
};
```

### 2. 통계 데이터 표시

#### 통계 카드 구조
```javascript
const StatCard = ({ 
    title, 
    value, 
    icon, 
    linkTo,  // 필수: 상세 페이지 경로
    onClick   // 필수: 클릭 핸들러
}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (linkTo) {
            navigate(linkTo);
        } else if (onClick) {
            onClick();
        }
    };

    return (
        <div 
            className="stat-card stat-card--clickable"
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleClick();
                }
            }}
        >
            <div className="stat-card__icon">{icon}</div>
            <div className="stat-card__value">{value}</div>
            <div className="stat-card__title">{title}</div>
            <div className="stat-card__link">
                상세 보기 →
            </div>
        </div>
    );
};
```

#### 통계 카드 사용 예시
```javascript
const DashboardStats = () => {
    const navigate = useNavigate();
    
    const statCards = [
        {
            title: '총 상담사',
            value: stats.totalConsultants,
            icon: <UserIcon />,
            linkTo: '/admin/consultants',  // 필수
            onClick: () => navigate('/admin/consultants')
        },
        {
            title: '총 내담자',
            value: stats.totalClients,
            icon: <UsersIcon />,
            linkTo: '/admin/clients',  // 필수
            onClick: () => navigate('/admin/clients')
        },
        {
            title: '총 매칭',
            value: stats.totalMappings,
            icon: <LinkIcon />,
            linkTo: '/admin/mappings',  // 필수
            onClick: () => navigate('/admin/mappings')
        }
    ];

    return (
        <div className="dashboard-stats">
            {statCards.map(card => (
                <StatCard key={card.title} {...card} />
            ))}
        </div>
    );
};
```

### 3. 목록 위젯 표시

#### 목록 위젯 구조
```javascript
const ListWidget = ({ 
    title,
    items,
    maxDisplay = 5,
    linkTo,
    emptyMessage = "데이터가 없습니다."
}) => {
    const displayedItems = items.slice(0, maxDisplay);
    const hasMore = items.length > maxDisplay;

    return (
        <div className="list-widget">
            <div className="list-widget__header">
                <h3>{title}</h3>
                {linkTo && (
                    <Link to={linkTo} className="list-widget__link">
                        전체 보기 →
                    </Link>
                )}
            </div>
            
            <div className="list-widget__content">
                {displayedItems.length === 0 ? (
                    <div className="list-widget__empty">
                        {emptyMessage}
                    </div>
                ) : (
                    <ul className="list-widget__list">
                        {displayedItems.map(item => (
                            <ListItem key={item.id} item={item} />
                        ))}
                    </ul>
                )}
            </div>
            
            {hasMore && (
                <div className="list-widget__footer">
                    <Link to={linkTo} className="list-widget__more">
                        +{items.length - maxDisplay}개 더 보기 →
                    </Link>
                </div>
            )}
        </div>
    );
};
```

---

## 🔗 링크 의무화 규칙

### 1. 통계 카드 링크

#### 필수 요구사항
```javascript
// ✅ 권장: 링크와 클릭 핸들러 모두 제공
<StatCard
    title="총 상담사"
    value={stats.totalConsultants}
    linkTo="/admin/consultants"
    onClick={() => navigate('/admin/consultants')}
/>

// ❌ 금지: 링크 없음
<StatCard
    title="총 상담사"
    value={stats.totalConsultants}
    // linkTo 없음!
/>
```

#### 링크 경로 규칙
```javascript
// 통계 카드 링크 경로 패턴
const STAT_LINKS = {
    '총 상담사': '/admin/consultants',
    '총 내담자': '/admin/clients',
    '총 매칭': '/admin/mappings',
    '활성 매칭': '/admin/mappings?status=active',
    '오늘 일정': '/admin/schedules?date=today',
    '완료된 상담': '/admin/sessions?status=completed',
    '총 매출': '/admin/financial/revenue',
    '대기 중인 결제': '/admin/financial/payments?status=pending'
};
```

### 2. 목록 위젯 링크

#### "더보기" 링크 필수
```javascript
// ✅ 권장: "더보기" 링크 제공
<div className="list-widget">
    <div className="list-widget__header">
        <h3>최근 알림</h3>
        <Link to="/notifications">전체 보기 →</Link>
    </div>
    {/* 목록 내용 */}
</div>

// ❌ 금지: 링크 없음
<div className="list-widget">
    <h3>최근 알림</h3>
    {/* 링크 없음! */}
</div>
```

### 3. 차트 위젯 링크

#### 차트 클릭 시 상세 페이지 이동
```javascript
const ChartWidget = ({ data, linkTo }) => {
    const navigate = useNavigate();

    const handleChartClick = () => {
        if (linkTo) {
            navigate(linkTo);
        }
    };

    return (
        <div className="chart-widget">
            <div className="chart-widget__header">
                <h3>매출 통계</h3>
                <Link to={linkTo}>상세 보기 →</Link>
            </div>
            
            <div 
                className="chart-widget__chart"
                onClick={handleChartClick}
                role="button"
                tabIndex={0}
            >
                <LineChart data={data} />
            </div>
        </div>
    );
};
```

---

## 🚫 금지 사항

### 1. 링크 없는 카드/위젯 금지
```javascript
// ❌ 금지: 링크 없는 통계 카드
<StatCard
    title="총 상담사"
    value={stats.totalConsultants}
/>

// ✅ 권장: 링크 제공
<StatCard
    title="총 상담사"
    value={stats.totalConsultants}
    linkTo="/admin/consultants"
    onClick={() => navigate('/admin/consultants')}
/>
```

### 2. 대시보드에 모든 데이터 표시 금지
```javascript
// ❌ 금지: 모든 데이터 표시
const response = await apiGet('/api/v1/notifications?size=1000');
setNotifications(response.data);

// ✅ 권장: 최신 몇 개만 표시
const response = await apiGet('/api/v1/notifications?page=0&size=5');
setNotifications(response.data.content);
```

### 3. 로딩 지연 방지
```javascript
// ❌ 금지: 대량 데이터 로딩으로 인한 지연
const loadAllData = async () => {
    const [users, consultants, clients, schedules] = await Promise.all([
        apiGet('/api/v1/users?size=1000'),
        apiGet('/api/v1/consultants?size=1000'),
        apiGet('/api/v1/clients?size=1000'),
        apiGet('/api/v1/schedules?size=1000')
    ]);
};

// ✅ 권장: 필요한 만큼만 로딩
const loadDashboardData = async () => {
    const [stats, recentNotifications] = await Promise.all([
        apiGet('/api/v1/dashboard/stats'),
        apiGet('/api/v1/notifications?page=0&size=5')
    ]);
};
```

---

## ✅ 체크리스트

### 대시보드 위젯 구현 시
- [ ] 목록 데이터: 최대 5~10개만 표시
- [ ] 통계 카드: 상세 페이지 링크 제공 (필수)
- [ ] 목록 위젯: "더보기" 링크 제공 (필수)
- [ ] 차트 위젯: 상세 페이지 링크 제공 (필수)
- [ ] 로딩 상태 표시
- [ ] 빈 상태 표시
- [ ] 에러 처리

### 통계 카드 구현 시
- [ ] `linkTo` prop 제공 (필수)
- [ ] `onClick` 핸들러 제공 (필수)
- [ ] 클릭 가능한 스타일 적용
- [ ] 접근성 지원 (키보드 네비게이션)

### 목록 위젯 구현 시
- [ ] 최대 표시 개수 제한
- [ ] "더보기" 링크 제공
- [ ] 전체 항목 수 표시 (선택)
- [ ] 빈 상태 메시지

---

## 💡 베스트 프랙티스

### 1. 위젯 표준 구조
```javascript
const StandardWidget = ({ 
    title,
    data,
    maxDisplay = 5,
    linkTo,
    emptyMessage
}) => {
    return (
        <div className="widget">
            {/* 헤더 */}
            <div className="widget__header">
                <h3 className="widget__title">{title}</h3>
                {linkTo && (
                    <Link to={linkTo} className="widget__link">
                        전체 보기 →
                    </Link>
                )}
            </div>
            
            {/* 콘텐츠 */}
            <div className="widget__content">
                {data.length === 0 ? (
                    <div className="widget__empty">{emptyMessage}</div>
                ) : (
                    <WidgetContent data={data.slice(0, maxDisplay)} />
                )}
            </div>
            
            {/* 푸터 (더 많은 데이터 있을 때) */}
            {data.length > maxDisplay && linkTo && (
                <div className="widget__footer">
                    <Link to={linkTo} className="widget__more">
                        +{data.length - maxDisplay}개 더 보기 →
                    </Link>
                </div>
            )}
        </div>
    );
};
```

### 2. 통계 카드 그리드
```javascript
const StatCardsGrid = ({ stats }) => {
    const statCards = [
        {
            id: 'consultants',
            title: '총 상담사',
            value: stats.totalConsultants,
            icon: <UserIcon />,
            linkTo: '/admin/consultants',
            color: 'blue'
        },
        // ... 더 많은 카드
    ];

    return (
        <div className="stat-cards-grid">
            {statCards.map(card => (
                <StatCard
                    key={card.id}
                    {...card}
                    onClick={() => navigate(card.linkTo)}
                />
            ))}
        </div>
    );
};
```

### 3. 로딩 및 에러 처리
```javascript
const DashboardWidget = ({ endpoint, maxDisplay = 5 }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await apiGet(`${endpoint}?size=${maxDisplay}`);
            setData(response.data.content || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <WidgetSkeleton />;
    if (error) return <WidgetError message={error} onRetry={loadData} />;
    if (data.length === 0) return <WidgetEmpty />;

    return <WidgetContent data={data} />;
};
```

---

## 📞 문의

대시보드 데이터 표시 표준 관련 문의:
- 프론트엔드 팀
- UX 팀

**최종 업데이트**: 2025-12-03

