# MindGarden Admin Dashboard 위젯 전환 계획

## 📋 개요

기존 MindGarden AdminDashboard의 컴포넌트들을 위젯 기반 시스템으로 단계적 전환하는 계획입니다.

**목표**: 하나씩 차근차근 안정적인 위젯 전환을 통한 동적 대시보드 구현

---

## 🎯 전환 우선순위

### 1단계: 핵심 기본 위젯 (우선순위 높음)
| 순번 | 위젯명 | 상태 | 설명 | API 엔드포인트 |
|------|--------|------|------|----------------|
| 1 | 환영 메시지 위젯 | ✅ 완료 | 관리자 환영 메시지 | - |
| 2 | 오늘의 통계 위젯 | 🔄 대기 | 예약/완료 상담 수 | `/api/admin/today-stats` |
| 3 | 시스템 개요 위젯 | 🔄 대기 | 상담사/내담자/매칭 수 | `/api/admin/consultants/with-stats`<br>`/api/admin/clients/with-stats`<br>`/api/admin/mappings/stats` |
| 4 | 빠른 작업 위젯 | 🔄 대기 | 관리 기능 버튼들 | - |

### 2단계: 알림 및 중요 통계 위젯
| 순번 | 위젯명 | 상태 | 설명 | API 엔드포인트 |
|------|--------|------|------|----------------|
| 5 | 입금 확인 대기 알림 위젯 | 🔄 대기 | 결제 대기 건수/금액 | `/api/admin/pending-deposit-stats` |
| 6 | 휴가 통계 위젯 | 🔄 대기 | 상담사 휴가 현황 | `/api/admin/vacation-statistics` |
| 7 | 상담사 평가 통계 위젯 | 🔄 대기 | 평점 및 평가 현황 | `/api/admin/consultant-rating-stats` |
| 8 | 환불 현황 위젯 | 🔄 대기 | 최근 환불 통계 | `/api/admin/refund-statistics` |

### 3단계: 고급 통계 및 시스템 관리 위젯
| 순번 | 위젯명 | 상태 | 설명 | API 엔드포인트 |
|------|--------|------|------|----------------|
| 9 | 상담 완료 통계 위젯 | 🔄 대기 | 월별 완료 현황 | `/api/admin/statistics/consultation-completion` |
| 10 | 시스템 상태 위젯 | 🔄 대기 | 서버/DB 상태 | `/api/admin/system-status` |
| 11 | 시스템 도구 위젯 | 🔄 대기 | 관리자 도구 모음 | - |
| 12 | 권한 관리 위젯 | 🔄 대기 | 사용자 권한 설정 | `/api/admin/permissions` |

### 4단계: 부가 기능 위젯
| 순번 | 위젯명 | 상태 | 설명 | API 엔드포인트 |
|------|--------|------|------|----------------|
| 13 | 시스템 알림 위젯 | 🔄 대기 | 공지사항/알림 관리 | `/api/system-notifications/active` |

---

## 🔧 기술적 구현 방식

### 위젯 구조
```javascript
// 위젯 기본 구조
{
  id: 'widget-unique-id',
  type: 'widget-type-name',
  position: { row: 1, col: 1, colspan: 2, rowspan: 1 },
  config: {
    title: '위젯 제목',
    subtitle: '위젯 부제목',
    // 위젯별 고유 설정
  }
}
```

### 파일 구조
```
frontend/src/components/dashboard/widgets/
├── admin/                          # 관리자 전용 위젯
│   ├── TodayStatsWidget.js        # 오늘의 통계
│   ├── SystemOverviewWidget.js    # 시스템 개요
│   ├── QuickActionsWidget.js      # 빠른 작업
│   ├── PendingDepositsWidget.js   # 입금 대기 알림
│   ├── VacationStatsWidget.js     # 휴가 통계
│   ├── RatingStatsWidget.js       # 평가 통계
│   ├── RefundStatsWidget.js       # 환불 현황
│   ├── ConsultationStatsWidget.js # 상담 완료 통계
│   ├── SystemStatusWidget.js      # 시스템 상태
│   ├── SystemToolsWidget.js       # 시스템 도구
│   ├── PermissionWidget.js        # 권한 관리
│   └── NotificationWidget.js      # 시스템 알림
├── common/                         # 공통 위젯
│   ├── MessageWidget.js           # 메시지 위젯 ✅
│   ├── StatisticsWidget.js        # 통계 위젯
│   └── ...
└── WidgetRegistry.js              # 위젯 등록 관리
```

---

## 📊 현재 상태

### ✅ 완료된 작업
- [x] 무한 로딩 문제 해결
- [x] 테넌트 계정 로그인 성공
- [x] 기본 위젯 시스템 구축
- [x] 환영 메시지 위젯 구현 및 테스트

### 🔄 진행 중인 작업
- [ ] 오늘의 통계 위젯 구현 (다음 단계)

### 📋 대기 중인 작업
- 위 우선순위 표 참조

---

## 🚨 주의사항

### 안전한 전환을 위한 원칙
1. **하나씩 차근차근**: 한 번에 하나의 위젯만 작업
2. **개별 테스트**: 각 위젯 추가 후 반드시 브라우저 테스트
3. **점진적 확장**: 기본 기능 확인 후 고급 기능 추가
4. **롤백 가능**: 문제 발생 시 이전 상태로 복원 가능하도록 관리

### 테스트 절차
1. 위젯 구현 완료
2. WidgetRegistry에 등록
3. DynamicDashboard 설정 업데이트
4. 브라우저에서 로그인 테스트
5. 위젯 렌더링 및 데이터 로드 확인
6. 다음 위젯으로 진행

---

## 📝 변경 이력

| 날짜 | 작업자 | 변경 내용 |
|------|--------|-----------|
| 2025-11-28 | Assistant | 초기 문서 작성 및 위젯 전환 계획 수립 |
| 2025-11-28 | Assistant | 환영 메시지 위젯 구현 완료 |

---

## 🔗 관련 문서

- [ORGANIC_WIDGET_INTEGRATION_PLAN.md](./ORGANIC_WIDGET_INTEGRATION_PLAN.md) - 유기적 위젯 통합 계획
- [CURRENT_SYSTEM_ANALYSIS_AND_IMPROVEMENTS.md](./CURRENT_SYSTEM_ANALYSIS_AND_IMPROVEMENTS.md) - 현재 시스템 분석
- [WIDGET_SYSTEM_SUCCESS_REPORT.md](./WIDGET_SYSTEM_SUCCESS_REPORT.md) - 위젯 시스템 성공 보고서
