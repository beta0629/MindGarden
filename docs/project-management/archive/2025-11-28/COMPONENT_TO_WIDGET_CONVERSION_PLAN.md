# 컴포넌트→위젯 전환 계획서

## 🎯 목표
AdminDashboard의 기존 컴포넌트들을 재사용 가능한 위젯으로 체계적으로 전환

## 📊 현재 상태 분석

### ✅ 이미 위젯화된 컴포넌트
- `StatisticsWidget` - 통계 데이터 표시
- `QuickActionsWidget` - 빠른 액션 버튼
- `MessageWidget` - 메시지 표시
- `SimpleTestWidget` - 테스트용 위젯

### 🔄 위젯화 대상 컴포넌트 (우선순위순)

#### **Phase 1: 핵심 통계 위젯 (1-2일)**
1. **SystemOverviewWidget** 
   - 기존: `DashboardSection` + `StatCard` 그리드
   - 데이터: 상담사/내담자/매칭/활성매칭 수
   - API: `/api/admin/consultants/with-stats`, `/api/admin/clients/with-stats`, `/api/admin/mappings`

2. **TodayStatsWidget**
   - 기존: 상단 3개 StatCard (총 사용자, 예약된 상담, 완료된 상담)
   - 데이터: 오늘의 통계
   - API: `/api/schedules/today/statistics`

3. **PendingDepositWidget**
   - 기존: 입금 확인 대기 알림 섹션
   - 데이터: 입금 대기 건수, 금액, 최장 대기시간
   - API: `/api/admin/mappings/pending-deposit`

#### **Phase 2: 상세 통계 위젯 (2-3일)**
4. **VacationStatsWidget**
   - 기존: 휴가 현황 아코디언 섹션
   - 데이터: 상담사별 휴가 통계
   - API: `/api/admin/vacation-statistics`

5. **ConsultantRatingWidget**
   - 기존: `ConsultantRatingStatistics` 컴포넌트
   - 데이터: 상담사 평가 통계
   - API: `/api/admin/consultant-rating-stats`

6. **RefundStatsWidget**
   - 기존: 환불 현황 섹션
   - 데이터: 환불 통계
   - API: `/api/admin/refund-statistics`

7. **ConsultationCompletionWidget**
   - 기존: 상담 완료 통계 섹션 + 차트
   - 데이터: 월별 상담 완료 현황
   - API: `/api/admin/statistics/consultation-completion`

#### **Phase 3: 관리 기능 위젯 (2-3일)**
8. **ManagementActionsWidget**
   - 기존: mg-management-grid 카드들
   - 기능: 스케줄 관리, 회기 관리, 상담사 관리 등
   - 동적 권한 체크 포함

9. **SystemStatusWidget**
   - 기존: `SystemStatus` 컴포넌트
   - 데이터: 서버/DB 상태
   - API: `/api/health/server`, `/api/health/database`

10. **SystemToolsWidget**
    - 기존: `SystemTools` 컴포넌트
    - 기능: 로그 보기, 캐시 초기화, 백업 생성 등

#### **Phase 4: 고급 기능 위젯 (3-4일)**
11. **ERPManagementWidget**
    - 기존: ERP 관리 섹션
    - 권한별 동적 표시

12. **BranchManagementWidget**
    - 기존: 지점 관리 섹션
    - HQ 권한 전용

13. **ComplianceWidget**
    - 기존: 컴플라이언스 관리 섹션
    - 관리자 전용

14. **FinanceManagementWidget**
    - 기존: 재무 관리 섹션
    - 재무 권한 전용

## 🛠 위젯 구현 표준

### **위젯 파일 구조**
```
frontend/src/components/dashboard/widgets/admin/
├── SystemOverviewWidget.js
├── TodayStatsWidget.js
├── PendingDepositWidget.js
├── VacationStatsWidget.js
├── ConsultantRatingWidget.js
├── RefundStatsWidget.js
├── ConsultationCompletionWidget.js
├── ManagementActionsWidget.js
├── SystemStatusWidget.js
├── SystemToolsWidget.js
├── ERPManagementWidget.js
├── BranchManagementWidget.js
├── ComplianceWidget.js
└── FinanceManagementWidget.js
```

### **위젯 표준 구조**
```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../../utils/api';
import '../Widget.css';

const [WidgetName]Widget = ({ widget, user }) => {
  const navigate = useNavigate();
  const config = widget.config || {};
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 데이터 로드
  const loadData = async () => {
    // API 호출 로직
  };

  // 권한 체크
  const hasPermission = () => {
    // 권한 확인 로직
  };

  useEffect(() => {
    if (hasPermission()) {
      loadData();
    }
  }, []);

  if (!hasPermission()) {
    return null; // 권한 없으면 숨김
  }

  return (
    <div className="widget widget-[name]">
      <div className="widget-header">
        <div className="widget-title">{config.title}</div>
      </div>
      <div className="widget-body">
        {/* 위젯 내용 */}
      </div>
    </div>
  );
};

export default [WidgetName]Widget;
```

### **위젯 설정 표준**
```javascript
// DynamicDashboard.js에서 사용할 기본 설정
const defaultAdminWidgets = [
  {
    id: 'system-overview',
    type: 'system-overview',
    position: { row: 1, col: 1, colspan: 2, rowspan: 1 },
    config: {
      title: '시스템 개요',
      refreshInterval: 30000
    }
  },
  // ... 다른 위젯들
];
```

## 🔄 전환 프로세스

### **각 위젯별 전환 단계**
1. **기존 컴포넌트 분석** - 데이터 소스, API, 권한 체크 파악
2. **위젯 구현** - 표준 구조로 새 위젯 생성
3. **WidgetRegistry 등록** - 위젯 타입 등록
4. **개별 테스트** - 단일 위젯으로 테스트
5. **통합 테스트** - 전체 대시보드에서 테스트
6. **기존 코드 정리** - 사용하지 않는 컴포넌트 제거

### **테스트 방법**
```javascript
// 개별 위젯 테스트용 임시 설정
const testSingleWidget = {
  version: '1.0',
  layout: { type: 'grid', columns: 1, gap: 'md' },
  widgets: [
    {
      id: 'test-widget',
      type: 'system-overview', // 테스트할 위젯 타입
      position: { row: 1, col: 1, colspan: 1, rowspan: 1 },
      config: { title: '테스트 위젯' }
    }
  ]
};
```

## 📅 일정 계획

### **Week 1: Phase 1 (핵심 통계 위젯)**
- Day 1: SystemOverviewWidget, TodayStatsWidget
- Day 2: PendingDepositWidget + 테스트

### **Week 2: Phase 2 (상세 통계 위젯)**
- Day 3-4: VacationStatsWidget, ConsultantRatingWidget
- Day 5: RefundStatsWidget, ConsultationCompletionWidget

### **Week 3: Phase 3 (관리 기능 위젯)**
- Day 6-7: ManagementActionsWidget
- Day 8: SystemStatusWidget, SystemToolsWidget

### **Week 4: Phase 4 (고급 기능 위젯)**
- Day 9-10: ERPManagementWidget, BranchManagementWidget
- Day 11-12: ComplianceWidget, FinanceManagementWidget

## ⚠️ 주의사항

### **권한 처리**
- 각 위젯은 사용자 권한을 체크해야 함
- 권한이 없으면 위젯을 렌더링하지 않음
- 동적 권한 체크 (`PermissionChecks` 활용)

### **API 호출 최적화**
- 불필요한 중복 API 호출 방지
- 캐싱 및 리프레시 간격 설정
- 에러 처리 및 로딩 상태 관리

### **CSS 일관성**
- 기존 MindGarden 디자인 시스템 준수
- `mg-` 접두사 사용
- CSS 변수 활용

### **데이터 플로우**
- 위젯 간 데이터 공유 최소화
- 각 위젯은 독립적으로 동작
- 전역 상태 관리 신중히 사용

## 🎯 성공 기준

1. **기능성**: 기존 AdminDashboard와 동일한 기능 제공
2. **성능**: API 호출 최적화로 로딩 시간 단축
3. **재사용성**: 다른 역할(Consultant, Client)에서도 활용 가능
4. **유지보수성**: 컴포넌트 분리로 코드 관리 용이
5. **확장성**: 새로운 위젯 추가 용이

## 📝 완료 체크리스트

### Phase 1
- [ ] SystemOverviewWidget 구현
- [ ] TodayStatsWidget 구현  
- [ ] PendingDepositWidget 구현
- [ ] Phase 1 통합 테스트

### Phase 2
- [ ] VacationStatsWidget 구현
- [ ] ConsultantRatingWidget 구현
- [ ] RefundStatsWidget 구현
- [ ] ConsultationCompletionWidget 구현
- [ ] Phase 2 통합 테스트

### Phase 3
- [ ] ManagementActionsWidget 구현
- [ ] SystemStatusWidget 구현
- [ ] SystemToolsWidget 구현
- [ ] Phase 3 통합 테스트

### Phase 4
- [ ] ERPManagementWidget 구현
- [ ] BranchManagementWidget 구현
- [ ] ComplianceWidget 구현
- [ ] FinanceManagementWidget 구현
- [ ] Phase 4 통합 테스트

### 최종 검증
- [ ] 모든 위젯 WidgetRegistry 등록
- [ ] 기존 AdminDashboard 대체 완료
- [ ] 권한별 위젯 표시 테스트
- [ ] API 성능 최적화 확인
- [ ] 브라우저 테스트 (Chrome, Safari, Firefox)
- [ ] 모바일 반응형 테스트
- [ ] 문서화 완료
