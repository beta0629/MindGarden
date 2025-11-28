# 마인드가든 위젯 유기적 통합 계획서

**작성일:** 2025-11-27  
**작성자:** AI Assistant  
**목표:** 위젯을 마인드가든 핵심 컴포넌트처럼 유기적으로 연동  

## 📋 현재 상황 분석

### ✅ 완료된 작업
- StatisticsGridWidget: 실제 API 연결
- ManagementGridWidget: 관리 페이지 연결
- 관리자용 기본 템플릿 제공
- JavaScript 오류 해결

### ❌ 부족한 부분 (유기적 연동 관점)
1. **데이터 실시간 동기화 부족**
   - 위젯 간 데이터 공유 없음
   - 상태 변경 시 자동 업데이트 없음
   - 전역 상태 관리 부재

2. **기능적 상호작용 부족**
   - 위젯에서 액션 수행 시 다른 위젯 반영 안됨
   - 드릴다운 기능 부족
   - 컨텍스트 전환 기능 없음

3. **사용자 경험 일관성 부족**
   - 위젯별 독립적 로딩 상태
   - 통합된 에러 처리 없음
   - 일관성 없는 인터랙션 패턴

## 🎯 유기적 통합 목표

### 1. **데이터 레이어 통합**
- 실시간 데이터 동기화
- 위젯 간 상태 공유
- 캐시 전략 통합

### 2. **기능적 연동**
- 위젯 간 액션 전파
- 드릴다운 네비게이션
- 컨텍스트 인식 기능

### 3. **사용자 경험 통합**
- 일관된 로딩/에러 상태
- 통합된 알림 시스템
- 반응형 레이아웃

## 🏗️ 아키텍처 설계

### Phase 1: 데이터 레이어 통합 (1-2주)

#### 1.1 전역 상태 관리 시스템
```javascript
// WidgetDataContext.js
const WidgetDataContext = createContext({
  // 통계 데이터
  statistics: {
    consultants: [],
    clients: [],
    mappings: [],
    sessions: [],
    loading: false,
    lastUpdated: null
  },
  
  // 액션 디스패처
  actions: {
    refreshStatistics: () => {},
    updateConsultant: (id, data) => {},
    updateClient: (id, data) => {},
    createMapping: (data) => {},
    // ... 기타 액션들
  },
  
  // 실시간 업데이트 구독
  subscriptions: {
    onStatisticsUpdate: (callback) => {},
    onUserAction: (callback) => {},
    // ... 기타 구독
  }
});
```

#### 1.2 실시간 데이터 동기화
```javascript
// useRealtimeData.js
const useRealtimeData = (dataType, filters = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // WebSocket 또는 Server-Sent Events 연결
    const subscription = realtimeService.subscribe(dataType, filters, {
      onData: setData,
      onLoading: setLoading,
      onError: setError
    });
    
    return () => subscription.unsubscribe();
  }, [dataType, filters]);
  
  return { data, loading, error };
};
```

#### 1.3 통합 캐시 시스템
```javascript
// WidgetCacheManager.js
class WidgetCacheManager {
  constructor() {
    this.cache = new Map();
    this.subscribers = new Map();
  }
  
  // 캐시 데이터 가져오기
  get(key) {
    return this.cache.get(key);
  }
  
  // 캐시 데이터 설정 및 구독자 알림
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: 5 * 60 * 1000 // 5분
    });
    
    // 구독자들에게 알림
    const subscribers = this.subscribers.get(key) || [];
    subscribers.forEach(callback => callback(data));
  }
  
  // 구독 등록
  subscribe(key, callback) {
    const subscribers = this.subscribers.get(key) || [];
    subscribers.push(callback);
    this.subscribers.set(key, subscribers);
    
    return () => {
      const updated = subscribers.filter(cb => cb !== callback);
      this.subscribers.set(key, updated);
    };
  }
}
```

### Phase 2: 위젯 간 기능적 연동 (2-3주)

#### 2.1 위젯 액션 시스템
```javascript
// WidgetActionSystem.js
class WidgetActionSystem {
  constructor() {
    this.actionHandlers = new Map();
    this.eventBus = new EventTarget();
  }
  
  // 액션 등록
  registerAction(actionType, handler) {
    this.actionHandlers.set(actionType, handler);
  }
  
  // 액션 실행
  async executeAction(actionType, payload, sourceWidget) {
    const handler = this.actionHandlers.get(actionType);
    if (!handler) return;
    
    try {
      const result = await handler(payload);
      
      // 다른 위젯들에게 액션 완료 알림
      this.eventBus.dispatchEvent(new CustomEvent('actionCompleted', {
        detail: { actionType, payload, result, sourceWidget }
      }));
      
      return result;
    } catch (error) {
      this.eventBus.dispatchEvent(new CustomEvent('actionError', {
        detail: { actionType, payload, error, sourceWidget }
      }));
      throw error;
    }
  }
  
  // 이벤트 구독
  subscribe(eventType, callback) {
    this.eventBus.addEventListener(eventType, callback);
    return () => this.eventBus.removeEventListener(eventType, callback);
  }
}
```

#### 2.2 드릴다운 네비게이션
```javascript
// DrilldownNavigator.js
const DrilldownNavigator = {
  // 통계에서 상세 페이지로 드릴다운
  drilldownFromStats: (statType, filters) => {
    const routes = {
      'consultants': '/admin/consultants',
      'clients': '/admin/clients',
      'mappings': '/admin/mappings',
      'sessions': '/admin/sessions'
    };
    
    const route = routes[statType];
    if (route) {
      // 필터 정보를 URL 파라미터로 전달
      const params = new URLSearchParams(filters);
      navigate(`${route}?${params.toString()}`);
    }
  },
  
  // 관리 기능에서 생성/수정 모달로 드릴다운
  drilldownToModal: (modalType, context) => {
    const modalManager = getModalManager();
    modalManager.openModal(modalType, context);
  }
};
```

#### 2.3 컨텍스트 인식 기능
```javascript
// WidgetContext.js
const WidgetContext = {
  // 현재 선택된 컨텍스트
  current: {
    selectedConsultant: null,
    selectedClient: null,
    selectedBranch: null,
    dateRange: { start: null, end: null },
    filters: {}
  },
  
  // 컨텍스트 변경
  setContext: (key, value) => {
    WidgetContext.current[key] = value;
    
    // 모든 위젯에게 컨텍스트 변경 알림
    widgetEventBus.emit('contextChanged', {
      key, value, context: WidgetContext.current
    });
  },
  
  // 컨텍스트 기반 데이터 필터링
  applyContextFilters: (data) => {
    let filtered = data;
    
    if (WidgetContext.current.selectedBranch) {
      filtered = filtered.filter(item => 
        item.branchId === WidgetContext.current.selectedBranch
      );
    }
    
    if (WidgetContext.current.dateRange.start) {
      filtered = filtered.filter(item => 
        new Date(item.createdAt) >= WidgetContext.current.dateRange.start
      );
    }
    
    return filtered;
  }
};
```

### Phase 3: 사용자 경험 통합 (1-2주)

#### 3.1 통합 로딩/에러 상태
```javascript
// UnifiedStateManager.js
const UnifiedStateManager = {
  // 전역 로딩 상태
  loading: {
    widgets: new Set(),
    isGlobalLoading: () => UnifiedStateManager.loading.widgets.size > 0,
    
    start: (widgetId) => {
      UnifiedStateManager.loading.widgets.add(widgetId);
      eventBus.emit('loadingStateChanged', true);
    },
    
    end: (widgetId) => {
      UnifiedStateManager.loading.widgets.delete(widgetId);
      if (UnifiedStateManager.loading.widgets.size === 0) {
        eventBus.emit('loadingStateChanged', false);
      }
    }
  },
  
  // 통합 에러 처리
  error: {
    show: (error, widgetId) => {
      notificationManager.show(
        `위젯 오류 (${widgetId}): ${error.message}`,
        'error'
      );
    },
    
    handle: (error, widgetId, retryCallback) => {
      console.error(`Widget ${widgetId} error:`, error);
      
      // 자동 재시도 로직
      if (error.code === 'NETWORK_ERROR' && retryCallback) {
        setTimeout(() => retryCallback(), 3000);
      }
    }
  }
};
```

#### 3.2 통합 알림 시스템
```javascript
// WidgetNotificationSystem.js
const WidgetNotificationSystem = {
  // 위젯 액션 완료 알림
  onActionSuccess: (actionType, result) => {
    const messages = {
      'CREATE_CONSULTANT': '상담사가 성공적으로 등록되었습니다.',
      'UPDATE_CLIENT': '내담자 정보가 업데이트되었습니다.',
      'CREATE_MAPPING': '새로운 매칭이 생성되었습니다.'
    };
    
    const message = messages[actionType] || '작업이 완료되었습니다.';
    notificationManager.show(message, 'success');
  },
  
  // 실시간 데이터 업데이트 알림
  onDataUpdate: (dataType, count) => {
    if (count > 0) {
      notificationManager.show(
        `${dataType} 데이터가 업데이트되었습니다. (${count}건)`,
        'info',
        { duration: 3000 }
      );
    }
  }
};
```

## 🔧 구체적 구현 계획

### Week 1-2: 데이터 레이어 통합

#### 백엔드 작업
1. **실시간 데이터 API 개선**
   ```java
   @RestController
   @RequestMapping("/api/realtime")
   public class RealtimeDataController {
       
       @GetMapping("/statistics/stream")
       public SseEmitter streamStatistics() {
           // Server-Sent Events로 실시간 통계 스트리밍
       }
       
       @GetMapping("/notifications/stream")  
       public SseEmitter streamNotifications() {
           // 실시간 알림 스트리밍
       }
   }
   ```

2. **캐시 전략 개선**
   ```java
   @Service
   public class WidgetDataCacheService {
       
       @Cacheable(value = "widgetData", key = "#dataType + ':' + #tenantId")
       public Object getCachedData(String dataType, String tenantId) {
           // 위젯별 캐시 데이터 관리
       }
       
       @CacheEvict(value = "widgetData", allEntries = true)
       public void invalidateCache(String tenantId) {
           // 데이터 변경 시 캐시 무효화
       }
   }
   ```

#### 프론트엔드 작업
1. **WidgetDataProvider 구현**
   ```javascript
   // components/dashboard/WidgetDataProvider.js
   const WidgetDataProvider = ({ children }) => {
     const [globalState, dispatch] = useReducer(widgetDataReducer, initialState);
     
     // 실시간 데이터 구독
     useEffect(() => {
       const eventSource = new EventSource('/api/realtime/statistics/stream');
       eventSource.onmessage = (event) => {
         const data = JSON.parse(event.data);
         dispatch({ type: 'UPDATE_STATISTICS', payload: data });
       };
       
       return () => eventSource.close();
     }, []);
     
     return (
       <WidgetDataContext.Provider value={{ state: globalState, dispatch }}>
         {children}
       </WidgetDataContext.Provider>
     );
   };
   ```

2. **위젯 기본 클래스 리팩토링**
   ```javascript
   // components/dashboard/widgets/BaseWidget.js
   class BaseWidget extends Component {
     constructor(props) {
       super(props);
       this.widgetId = props.widget.id;
       this.dataType = props.widget.config.dataType;
     }
     
     componentDidMount() {
       // 전역 상태 구독
       this.unsubscribe = widgetDataContext.subscribe(
         this.dataType, 
         this.handleDataUpdate
       );
       
       // 로딩 상태 등록
       UnifiedStateManager.loading.start(this.widgetId);
     }
     
     componentWillUnmount() {
       this.unsubscribe?.();
       UnifiedStateManager.loading.end(this.widgetId);
     }
     
     handleDataUpdate = (newData) => {
       this.setState({ data: newData });
       UnifiedStateManager.loading.end(this.widgetId);
     }
   }
   ```

### Week 3-4: 위젯 간 기능적 연동

#### 1. **액션 시스템 구현**
   ```javascript
   // utils/WidgetActionRegistry.js
   const WidgetActionRegistry = {
     // 상담사 생성 액션
     'CREATE_CONSULTANT': async (data) => {
       const result = await apiPost('/api/admin/consultants', data);
       
       // 관련 위젯들 업데이트
       widgetEventBus.emit('consultantCreated', result);
       widgetEventBus.emit('statisticsInvalidate', ['consultants']);
       
       return result;
     },
     
     // 매칭 생성 액션  
     'CREATE_MAPPING': async (data) => {
       const result = await apiPost('/api/admin/mappings', data);
       
       // 관련 위젯들 업데이트
       widgetEventBus.emit('mappingCreated', result);
       widgetEventBus.emit('statisticsInvalidate', ['mappings', 'consultants', 'clients']);
       
       return result;
     }
   };
   ```

#### 2. **드릴다운 기능 구현**
   ```javascript
   // components/dashboard/widgets/enhanced/StatisticsGridWidget.js
   const EnhancedStatisticsGridWidget = ({ widget, user }) => {
     const handleStatClick = (statType, value) => {
       // 컨텍스트 설정
       WidgetContext.setContext('selectedStat', { type: statType, value });
       
       // 드릴다운 네비게이션
       DrilldownNavigator.drilldownFromStats(statType, {
         tenantId: user.tenantId,
         dateRange: WidgetContext.current.dateRange
       });
     };
     
     return (
       <div className="enhanced-statistics-widget">
         {statCards.map(card => (
           <StatCard
             key={card.title}
             {...card}
             onClick={() => handleStatClick(card.type, card.value)}
             interactive={true}
           />
         ))}
       </div>
     );
   };
   ```

### Week 5-6: 사용자 경험 통합

#### 1. **통합 로딩 시스템**
   ```javascript
   // components/dashboard/UnifiedLoadingOverlay.js
   const UnifiedLoadingOverlay = () => {
     const [isLoading, setIsLoading] = useState(false);
     
     useEffect(() => {
       const unsubscribe = UnifiedStateManager.loading.subscribe(setIsLoading);
       return unsubscribe;
     }, []);
     
     if (!isLoading) return null;
     
     return (
       <div className="unified-loading-overlay">
         <div className="loading-spinner">
           <UnifiedLoading message="데이터를 동기화하는 중..." />
         </div>
       </div>
     );
   };
   ```

#### 2. **반응형 위젯 레이아웃**
   ```javascript
   // components/dashboard/ResponsiveWidgetGrid.js
   const ResponsiveWidgetGrid = ({ widgets, onLayoutChange }) => {
     const [layout, setLayout] = useState([]);
     const [breakpoint, setBreakpoint] = useState('lg');
     
     const handleLayoutChange = (newLayout) => {
       setLayout(newLayout);
       onLayoutChange?.(newLayout);
       
       // 레이아웃 변경을 다른 위젯들에게 알림
       widgetEventBus.emit('layoutChanged', { layout: newLayout, breakpoint });
     };
     
     return (
       <ResponsiveReactGridLayout
         className="responsive-widget-grid"
         layouts={{ lg: layout, md: layout, sm: layout }}
         breakpoints={{ lg: 1200, md: 996, sm: 768 }}
         cols={{ lg: 12, md: 10, sm: 6 }}
         onLayoutChange={handleLayoutChange}
         onBreakpointChange={setBreakpoint}
       >
         {widgets.map(widget => (
           <div key={widget.id} data-grid={widget.layout}>
             <WidgetRenderer widget={widget} />
           </div>
         ))}
       </ResponsiveReactGridLayout>
     );
   };
   ```

## 📊 성공 지표 (KPI)

### 기술적 지표
1. **데이터 동기화 지연시간 < 500ms**
2. **위젯 로딩 시간 < 2초**
3. **메모리 사용량 증가 < 20%**
4. **API 호출 횟수 50% 감소** (캐시 효과)

### 사용자 경험 지표
1. **위젯 간 상호작용 성공률 > 95%**
2. **드릴다운 네비게이션 사용률 > 60%**
3. **에러 발생률 < 1%**
4. **사용자 만족도 > 4.5/5**

## 🚀 배포 전략

### Phase 1 배포 (Week 2)
- 데이터 레이어 통합
- 기존 위젯과 호환성 유지
- A/B 테스트 진행

### Phase 2 배포 (Week 4)  
- 위젯 간 연동 기능
- 점진적 롤아웃
- 사용자 피드백 수집

### Phase 3 배포 (Week 6)
- 전체 기능 통합
- 성능 최적화
- 전면 배포

## 🔍 리스크 관리

### 기술적 리스크
1. **성능 저하**: 실시간 동기화로 인한 부하
   - **대응**: 캐시 전략 강화, 배치 업데이트
   
2. **메모리 누수**: 이벤트 리스너 정리 미흡
   - **대응**: 자동 정리 시스템, 메모리 모니터링

3. **데이터 불일치**: 동시 업데이트 충돌
   - **대응**: 낙관적 잠금, 충돌 해결 로직

### 사용자 경험 리스크
1. **학습 곡선**: 새로운 인터랙션 패턴
   - **대응**: 점진적 도입, 사용자 가이드
   
2. **기존 워크플로우 변경**: 사용자 혼란
   - **대응**: 기존 방식 병행 지원, 교육 자료

## 📝 다음 단계

### 즉시 시작 (이번 주)
1. WidgetDataContext 기본 구조 설계
2. BaseWidget 클래스 리팩토링 시작
3. 실시간 데이터 API 설계

### 다음 주
1. 프로토타입 구현 시작
2. 성능 테스트 환경 구축
3. 사용자 테스트 계획 수립

---

**🎯 목표: 위젯이 단순한 UI 컴포넌트가 아닌, 마인드가든의 핵심 비즈니스 로직과 완전히 통합된 유기적 시스템이 되도록 한다.**
