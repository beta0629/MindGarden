# API 엔드포인트 표준화 문서

## 📋 개요

MindGarden Admin Dashboard 위젯에서 사용할 API 엔드포인트들을 표준화하고 정리한 문서입니다.

**기본 경로**: `/api/admin` (레거시) 및 `/api/v1/admin` (표준)

---

## 🎯 위젯별 필요 API 엔드포인트

### 1. 오늘의 통계 위젯 (TodayStatsWidget)

| 목적 | 엔드포인트 | 상태 | 설명 |
|------|------------|------|------|
| 오늘의 상담 통계 | `GET /api/admin/today-stats` | ❌ 미구현 | 오늘 예약/완료/대기 상담 수 |

**필요한 응답 구조**:
```json
{
  "success": true,
  "data": {
    "totalToday": 15,
    "completedToday": 8,
    "pendingToday": 7,
    "date": "2025-11-28"
  }
}
```

### 2. 시스템 개요 위젯 (SystemOverviewWidget)

| 목적 | 엔드포인트 | 상태 | 설명 |
|------|------------|------|------|
| 상담사 통계 | `GET /api/admin/consultants/with-stats` | ✅ 구현됨 | 전체 상담사 수 및 통계 |
| 내담자 통계 | `GET /api/admin/clients/with-stats` | ✅ 구현됨 | 전체 내담자 수 및 통계 |
| 매칭 통계 | `GET /api/admin/mappings/stats` | ❌ 미구현 | 전체/활성 매칭 수 |

**현재 구현된 엔드포인트**:
- ✅ `/api/admin/consultants/with-stats` - 상담사 통계
- ✅ `/api/admin/clients/with-stats` - 내담자 통계
- ❌ `/api/admin/mappings/stats` - 매칭 통계 (신규 필요)

### 3. 빠른 작업 위젯 (QuickActionsWidget)

| 목적 | 엔드포인트 | 상태 | 설명 |
|------|------------|------|------|
| 네비게이션만 사용 | - | ✅ 구현됨 | 클라이언트 사이드 라우팅 |

### 4. 입금 확인 대기 알림 위젯 (PendingDepositsWidget)

| 목적 | 엔드포인트 | 상태 | 설명 |
|------|------------|------|------|
| 입금 대기 통계 | `GET /api/admin/pending-deposit-stats` | ❌ 미구현 | 대기 건수, 금액, 시간 |

**현재 구현된 관련 엔드포인트**:
- ✅ `/api/admin/mappings/pending-deposit` - 입금 대기 매칭 목록

**필요한 새 엔드포인트**:
```json
// GET /api/admin/pending-deposit-stats
{
  "success": true,
  "data": {
    "count": 5,
    "totalAmount": 750000,
    "oldestHours": 24,
    "averageWaitTime": 12.5
  }
}
```

### 5. 휴가 통계 위젯 (VacationStatsWidget)

| 목적 | 엔드포인트 | 상태 | 설명 |
|------|------------|------|------|
| 휴가 통계 | `GET /api/admin/vacation-statistics` | ✅ 구현됨 | 상담사별 휴가 현황 |

### 6. 상담사 평가 통계 위젯 (RatingStatsWidget)

| 목적 | 엔드포인트 | 상태 | 설명 |
|------|------------|------|------|
| 평가 통계 | `GET /api/admin/consultant-rating-stats` | ✅ 구현됨 | 평점 및 평가 현황 |

### 7. 환불 현황 위젯 (RefundStatsWidget)

| 목적 | 엔드포인트 | 상태 | 설명 |
|------|------------|------|------|
| 환불 통계 | `GET /api/admin/refund-statistics` | ✅ 구현됨 | 최근 환불 통계 |

### 8. 상담 완료 통계 위젯 (ConsultationStatsWidget)

| 목적 | 엔드포인트 | 상태 | 설명 |
|------|------------|------|------|
| 상담 완료 통계 | `GET /api/admin/statistics/consultation-completion` | ❌ 미구현 | 월별 완료 현황 |

### 9. 시스템 상태 위젯 (SystemStatusWidget)

| 목적 | 엔드포인트 | 상태 | 설명 |
|------|------------|------|------|
| 시스템 상태 | `GET /api/admin/system-status` | ❌ 미구현 | 서버/DB 상태 |

### 10. 시스템 알림 위젯 (NotificationWidget)

| 목적 | 엔드포인트 | 상태 | 설명 |
|------|------------|------|------|
| 활성 알림 | `GET /api/system-notifications/active` | ✅ 구현됨 | 공지사항 및 알림 |

---

## 🔧 구현 필요한 새 엔드포인트

### 1. 오늘의 통계 API
```java
@GetMapping("/today-stats")
public ResponseEntity<ApiResponse<Map<String, Object>>> getTodayStats(HttpSession session) {
    // 오늘 날짜의 예약/완료/대기 상담 수 조회
}
```

### 2. 매칭 통계 API
```java
@GetMapping("/mappings/stats")
public ResponseEntity<ApiResponse<Map<String, Object>>> getMappingStats(HttpSession session) {
    // 전체 매칭 수, 활성 매칭 수, 완료 매칭 수 등
}
```

### 3. 입금 대기 통계 API
```java
@GetMapping("/pending-deposit-stats")
public ResponseEntity<ApiResponse<Map<String, Object>>> getPendingDepositStats(HttpSession session) {
    // 입금 대기 건수, 총 금액, 최장 대기 시간
}
```

### 4. 상담 완료 통계 API
```java
@GetMapping("/statistics/consultation-completion")
public ResponseEntity<ApiResponse<Map<String, Object>>> getConsultationCompletionStats(HttpSession session) {
    // 월별 상담 완료 현황, 완료율, 평균 시간
}
```

### 5. 시스템 상태 API
```java
@GetMapping("/system-status")
public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemStatus() {
    // 서버 상태, 데이터베이스 상태, 메모리 사용량 등
}
```

---

## 📊 현재 구현 상태 요약

### ✅ 구현 완료 (7개)
1. `/api/admin/consultants/with-stats` - 상담사 통계
2. `/api/admin/clients/with-stats` - 내담자 통계  
3. `/api/admin/vacation-statistics` - 휴가 통계
4. `/api/admin/consultant-rating-stats` - 평가 통계
5. `/api/admin/refund-statistics` - 환불 통계
6. `/api/admin/mappings/pending-deposit` - 입금 대기 목록
7. `/api/system-notifications/active` - 시스템 알림

### ❌ 구현 필요 (5개)
1. `/api/admin/today-stats` - 오늘의 통계
2. `/api/admin/mappings/stats` - 매칭 통계
3. `/api/admin/pending-deposit-stats` - 입금 대기 통계
4. `/api/admin/statistics/consultation-completion` - 상담 완료 통계
5. `/api/admin/system-status` - 시스템 상태

---

## 🎯 API 표준화 원칙

### 1. URL 구조
```
/api/admin/{resource}/{action}
/api/admin/{resource}/{id}/{action}
```

### 2. 응답 구조 표준화
```json
{
  "success": boolean,
  "message": "string",
  "data": object | array,
  "timestamp": "ISO 8601",
  "path": "string"
}
```

### 3. 오류 응답 표준화
```json
{
  "success": false,
  "message": "오류 메시지",
  "errorCode": "ERROR_CODE",
  "timestamp": "2025-11-28T14:30:00Z",
  "path": "/api/admin/endpoint"
}
```

### 4. 페이징 표준화
```json
{
  "success": true,
  "data": {
    "content": [],
    "totalElements": 100,
    "totalPages": 10,
    "currentPage": 0,
    "size": 10,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

## 🔗 프론트엔드 API 상수

### 기존 apiEndpoints.js 업데이트
```javascript
export const API_ENDPOINTS = {
  // 기존 엔드포인트들...
  
  // 위젯용 새 엔드포인트
  ADMIN_TODAY_STATS: '/api/admin/today-stats',
  ADMIN_MAPPINGS_STATS: '/api/admin/mappings/stats',
  ADMIN_PENDING_DEPOSIT_STATS: '/api/admin/pending-deposit-stats',
  ADMIN_CONSULTATION_COMPLETION_STATS: '/api/admin/statistics/consultation-completion',
  ADMIN_SYSTEM_STATUS: '/api/admin/system-status',
};
```

---

## 🚨 우선순위 구현 계획

### Phase 1: 즉시 구현 필요 (위젯 2-3번용)
1. **매칭 통계 API** (`/api/admin/mappings/stats`)
   - 기존 `/api/admin/mappings` 엔드포인트 활용
   - 통계 정보만 추출하여 새 엔드포인트 생성

### Phase 2: 단기 구현 (위젯 4-5번용)  
2. **오늘의 통계 API** (`/api/admin/today-stats`)
3. **입금 대기 통계 API** (`/api/admin/pending-deposit-stats`)

### Phase 3: 중기 구현 (위젯 8-9번용)
4. **상담 완료 통계 API** (`/api/admin/statistics/consultation-completion`)
5. **시스템 상태 API** (`/api/admin/system-status`)

---

## 📝 변경 이력

| 날짜 | 작업자 | 변경 내용 |
|------|--------|-----------|
| 2025-11-28 | Assistant | 초기 API 엔드포인트 표준화 문서 작성 |
| 2025-11-28 | Assistant | 현재 구현 상태 분석 및 필요 엔드포인트 정의 |

---

## 🔗 관련 문서

- [WIDGET_CONVERSION_PLAN.md](./WIDGET_CONVERSION_PLAN.md) - 위젯 전환 계획
- [WIDGET_IMPLEMENTATION_GUIDE.md](./WIDGET_IMPLEMENTATION_GUIDE.md) - 위젯 구현 가이드
- [WIDGET_CONVERSION_CHECKLIST.md](./WIDGET_CONVERSION_CHECKLIST.md) - 전환 체크리스트
