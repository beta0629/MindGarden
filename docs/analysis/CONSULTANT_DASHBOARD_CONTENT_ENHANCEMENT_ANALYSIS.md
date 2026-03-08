# 상담사 대시보드 컨텐츠 강화 기술 분석

**작성일**: 2026-03-09  
**작성자**: Core Coder  
**목적**: 기존 DB 스키마와 API를 활용한 상담사 대시보드 컨텐츠 구현 가능성 분석

---

## 1. 현재 상태 분석

### 1.1 현재 대시보드 구성

**컴포넌트**: `frontend/src/components/dashboard-v2/consultant/ConsultantDashboardV2.js`

**현재 표시 컨텐츠**:
- 주요 통계 (4개 카드): 오늘의 상담, 신규 내담자, 안읽은 메시지, 평균 평점
- 최근 일정 (오늘·어제)
- 다가오는 상담 (7일 이내)
- 최근 알림 (시스템 공지)
- 주간 상담 현황 (막대 차트)

**현재 API 호출**:
- `DASHBOARD_API.CONSULTANT_STATS` → `/api/v1/schedules/today/statistics`
- `DASHBOARD_API.CONSULTANT_SCHEDULES` → `/api/v1/schedules`
- `DASHBOARD_API.CONSULTANT_UPCOMING_SCHEDULES` → `/api/v1/schedules/upcoming`
- `RATING_API.CONSULTANT_STATS` → `/api/v1/ratings/consultant/{id}/stats`
- `/api/v1/system-notifications/active`

### 1.2 기존 DB 스키마 (활용 가능한 테이블)

| 테이블명 | 주요 필드 | 용도 |
|---------|---------|------|
| `schedules` | consultant_id, date, start_time, end_time, status, consultation_type, duration_minutes | 일정 관리 |
| `consultations` | client_id, consultant_id, status, consultation_date, session_number, risk_level, priority | 상담 기본 정보 |
| `consultation_records` | consultation_id, session_date, session_number, progress_score, risk_assessment, goal_achievement, is_session_completed | 상담일지 (상세 기록) |
| `consultant_ratings` | consultant_id, client_id, schedule_id, heart_score, comment, rating_tags, rated_at | 상담사 평가 |
| `consultant_performance` | consultant_id, performance_date, completion_rate, avg_rating, total_revenue, performance_score, grade | 상담사 성과 (일별·월별) |
| `consultation_messages` | consultant_id, client_id, sender_type, is_read, is_urgent, is_important, sent_at | 상담사-내담자 메시지 |
| `alerts` | user_id, type, priority, status, title, content, created_at | 알림 시스템 |
| `daily_statistics` | stat_date, total_consultations, completed_consultations, cancelled_consultations, total_revenue, avg_rating | 일별 통계 (전체) |
| `clients` | name, email, phone, birth_date, gender, medical_history | 내담자 정보 |
| `payments` | payer_id, amount, status, method, approved_at, refunded_at | 결제 정보 |

---

## 2. 구현 가능한 컨텐츠 목록

### 2.1 Phase 1: 기존 데이터 활용 (API 수정 불필요 또는 최소)

#### A. 상담 성과 및 통계

| 컨텐츠 | 데이터 소스 | 구현 난이도 | API 개발 필요 | 설명 |
|--------|------------|------------|-------------|------|
| **월간 완료율** | `consultant_performance.completion_rate` | 하 | 기존 API 확장 | 이번 달 완료율 추이 (일별 그래프) |
| **성과 등급 표시** | `consultant_performance.grade` | 하 | 기존 API 확장 | S급/A급/B급 등급 배지 표시 |
| **주간 수익 통계** | `consultant_performance.total_revenue` | 하 | 신규 API | 주간 수익 합계 및 추이 |
| **월간 수익 통계** | `consultant_performance.total_revenue` | 하 | 신규 API | 월간 수익 합계 및 전월 대비 증감 |
| **평균 세션 시간** | `consultation_records.session_duration_minutes` | 중 | 신규 API | 최근 30일 평균 세션 시간 |
| **상담 유형별 분포** | `schedules.consultation_type` | 하 | 신규 API | 개인/가족/부부/집단 상담 비율 (파이 차트) |

#### B. 내담자 관련 인사이트

| 컨텐츠 | 데이터 소스 | 구현 난이도 | API 개발 필요 | 설명 |
|--------|------------|------------|-------------|------|
| **활성 내담자 수** | `consultant_performance.unique_clients` | 하 | 기존 API 확장 | 현재 상담 중인 내담자 수 |
| **재방문 내담자 비율** | `consultant_performance.repeat_clients` | 하 | 기존 API 확장 | 재방문 내담자 / 전체 내담자 |
| **신규 내담자 목록** | `clients.created_at`, `consultations` | 중 | 신규 API | 최근 7일 신규 내담자 목록 (이름, 첫 상담일) |
| **내담자 위험도 분포** | `consultation_records.risk_assessment` | 중 | 신규 API | LOW/MEDIUM/HIGH/CRITICAL 분포 (막대 차트) |
| **과제 미제출 내담자** | `consultation_records.homework_assigned`, `homework_due_date` | 중 | 신규 API | 과제 기한 지난 내담자 목록 |
| **다음 회기 예정 내담자** | `consultation_records.next_session_date` | 하 | 신규 API | 다음 회기 예정일이 가까운 내담자 TOP 5 |

#### C. 평가 및 피드백

| 컨텐츠 | 데이터 소스 | 구현 난이도 | API 개발 필요 | 설명 |
|--------|------------|------------|-------------|------|
| **최근 평가 목록** | `consultant_ratings` | 하 | 기존 API 확장 | 최근 10개 평가 (하트 점수, 코멘트, 날짜) |
| **하트 점수 분포** | `consultant_ratings.heart_score` | 하 | 기존 API 확장 | 1~5점 분포 (막대 차트) |
| **인기 평가 태그** | `consultant_ratings.rating_tags` | 중 | 기존 API 확장 | 자주 받은 태그 TOP 5 (워드 클라우드 또는 태그 목록) |
| **평가 추이** | `consultant_ratings.rated_at` | 중 | 신규 API | 최근 30일 평가 개수 및 평균 점수 추이 |
| **높은 평가 하이라이트** | `consultant_ratings` (heart_score >= 4) | 하 | 기존 API 확장 | 4점 이상 평가 중 코멘트가 있는 최근 3개 |

#### D. 일정 및 시간 관리

| 컨텐츠 | 데이터 소스 | 구현 난이도 | API 개발 필요 | 설명 |
|--------|------------|------------|-------------|------|
| **이번 주 일정 요약** | `schedules` | 하 | 기존 API 확장 | 이번 주 총 일정 수, 확정/대기/완료 건수 |
| **월간 일정 캘린더 뷰** | `schedules` | 중 | 기존 API 확장 | 월간 캘린더에 일정 표시 (히트맵 형태) |
| **가장 바쁜 시간대** | `schedules.start_time` | 중 | 신규 API | 최근 30일 가장 많이 예약된 시간대 TOP 3 |
| **평균 일일 상담 건수** | `schedules` | 하 | 신규 API | 최근 30일 평균 일일 상담 건수 |
| **취소율** | `schedules.status = CANCELLED` | 하 | 신규 API | 최근 30일 취소율 (%) |
| **노쇼율** | `schedules.status = NO_SHOW` | 하 | 신규 API | 최근 30일 노쇼율 (%) |

#### E. 메시지 및 커뮤니케이션

| 컨텐츠 | 데이터 소스 | 구현 난이도 | API 개발 필요 | 설명 |
|--------|------------|------------|-------------|------|
| **안읽은 메시지 목록** | `consultation_messages` (is_read = false) | 하 | 신규 API | 안읽은 메시지 최근 5개 (발신자, 제목, 시간) |
| **긴급 메시지** | `consultation_messages` (is_urgent = true) | 하 | 신규 API | 긴급 메시지 목록 (우선 표시) |
| **답장 대기 메시지** | `consultation_messages` (status = SENT, 답장 없음) | 중 | 신규 API | 답장하지 않은 메시지 개수 및 목록 |
| **평균 응답 시간** | `consultation_messages.sent_at`, `read_at`, `replied_at` | 중 | 신규 API | 메시지 수신 후 평균 응답 시간 |

#### F. 알림 및 액션 아이템

| 컨텐츠 | 데이터 소스 | 구현 난이도 | API 개발 필요 | 설명 |
|--------|------------|------------|-------------|------|
| **미작성 상담일지** | `schedules` (status = COMPLETED), `consultation_records` | 중 | 신규 API | 완료된 상담 중 일지 미작성 건수 및 목록 |
| **긴급 알림** | `alerts` (priority = URGENT, CRITICAL) | 하 | 기존 API 확장 | 긴급 알림 목록 (우선 표시) |
| **오늘의 할 일** | 복합 (미작성 일지, 답장 대기, 과제 확인 등) | 중 | 신규 API | 오늘 처리해야 할 액션 아이템 체크리스트 |

---

### 2.2 Phase 2: API 확장 (중급 난이도)

#### G. 진행도 및 목표 달성

| 컨텐츠 | 데이터 소스 | 구현 난이도 | API 개발 필요 | 설명 |
|--------|------------|------------|-------------|------|
| **내담자별 진행도** | `consultation_records.progress_score` | 중 | 신규 API | 내담자별 최근 진행도 점수 (0-100) 및 추이 |
| **목표 달성도 통계** | `consultation_records.goal_achievement` | 중 | 신규 API | LOW/MEDIUM/HIGH/EXCELLENT 분포 |
| **평균 진행도 점수** | `consultation_records.progress_score` | 중 | 신규 API | 전체 내담자 평균 진행도 점수 |
| **진행도 향상 내담자** | `consultation_records.progress_score` (증가 추세) | 상 | 신규 API | 최근 진행도가 향상된 내담자 TOP 5 |
| **진행도 저하 내담자** | `consultation_records.progress_score` (감소 추세) | 상 | 신규 API | 최근 진행도가 저하된 내담자 (주의 필요) |

#### H. 비교 및 벤치마킹

| 컨텐츠 | 데이터 소스 | 구현 난이도 | API 개발 필요 | 설명 |
|--------|------------|------------|-------------|------|
| **전체 평균과 비교** | `consultant_performance`, `daily_statistics` | 중 | 신규 API | 내 완료율/평점 vs 전체 평균 |
| **등급별 상담사 분포** | `consultant_performance.grade` | 하 | 신규 API | S급/A급/B급 등 등급별 상담사 수 |
| **내 순위** | `consultant_performance.performance_score` | 중 | 신규 API | 전체 상담사 중 성과 순위 (TOP 10% 등) |

#### I. 시간대별 분석

| 컨텐츠 | 데이터 소스 | 구현 난이도 | API 개발 필요 | 설명 |
|--------|------------|------------|-------------|------|
| **시간대별 상담 분포** | `schedules.start_time` | 중 | 신규 API | 오전/오후/저녁 시간대별 상담 건수 (히트맵) |
| **요일별 상담 분포** | `schedules.date` | 하 | 신규 API | 월~일 요일별 평균 상담 건수 |
| **월별 상담 추이** | `schedules.date` | 하 | 신규 API | 최근 6개월 월별 상담 건수 (라인 차트) |

---

### 2.3 Phase 3: 신규 기능 (고급 난이도)

#### J. 예측 및 인사이트

| 컨텐츠 | 데이터 소스 | 구현 난이도 | API 개발 필요 | 설명 |
|--------|------------|------------|-------------|------|
| **이번 달 예상 수익** | `consultant_performance.total_revenue` (추세 분석) | 상 | 신규 API + 로직 | 최근 추세 기반 이번 달 예상 수익 |
| **목표 달성률** | `consultant_performance` + 목표 설정 기능 | 상 | 신규 API + 테이블 | 월간 목표 대비 현재 달성률 (%) |
| **상담 패턴 분석** | `schedules`, `consultation_records` | 상 | 신규 API + 분석 로직 | 가장 많이 다루는 이슈, 선호 상담 방법 등 |

#### K. 실시간 알림 및 액션

| 컨텐츠 | 데이터 소스 | 구현 난이도 | API 개발 필요 | 설명 |
|--------|------------|------------|-------------|------|
| **실시간 알림 배지** | `alerts`, `consultation_messages` | 중 | WebSocket 또는 폴링 | 새 메시지, 알림 실시간 표시 |
| **오늘의 추천 액션** | 복합 (미작성 일지, 긴급 메시지 등) | 상 | 신규 API + 우선순위 로직 | AI 기반 또는 규칙 기반 추천 액션 |

#### L. 내담자 관리 도구

| 컨텐츠 | 데이터 소스 | 구현 난이도 | API 개발 필요 | 설명 |
|--------|------------|------------|-------------|------|
| **내담자 상태 요약** | `consultation_records.client_condition`, `risk_assessment` | 중 | 신규 API | 각 내담자 최근 상태 및 위험도 한눈에 보기 |
| **장기 미방문 내담자** | `schedules.date` (마지막 상담일 기준) | 중 | 신규 API | 30일 이상 미방문 내담자 목록 |
| **회기 진행 현황** | `consultation_records.session_number` | 중 | 신규 API | 내담자별 현재 회기 및 총 회기 수 |

---

## 3. 기술적 구현 전략

### 3.1 API 설계 방향

#### 신규 API 엔드포인트 제안

```java
// 1. 상담사 성과 상세 API
GET /api/v1/consultants/{consultantId}/performance/summary
  - 응답: 월간 완료율, 등급, 수익, 평균 세션 시간, 상담 유형별 분포

// 2. 상담사 평가 상세 API
GET /api/v1/consultants/{consultantId}/ratings/summary
  - 응답: 하트 점수 분포, 인기 태그, 최근 평가, 평가 추이

// 3. 상담사 내담자 인사이트 API
GET /api/v1/consultants/{consultantId}/clients/insights
  - 응답: 활성 내담자 수, 재방문 비율, 신규 내담자, 위험도 분포, 장기 미방문

// 4. 상담사 메시지 요약 API
GET /api/v1/consultants/{consultantId}/messages/summary
  - 응답: 안읽은 메시지, 긴급 메시지, 답장 대기, 평균 응답 시간

// 5. 상담사 액션 아이템 API
GET /api/v1/consultants/{consultantId}/action-items
  - 응답: 미작성 일지, 과제 미제출 내담자, 긴급 알림, 오늘의 할 일

// 6. 상담사 시간 분석 API
GET /api/v1/consultants/{consultantId}/time-analysis
  - 응답: 시간대별 분포, 요일별 분포, 월별 추이

// 7. 상담사 대시보드 통합 API (권장)
GET /api/v1/consultants/{consultantId}/dashboard
  - 응답: 위 모든 데이터를 한 번에 조회 (병렬 처리)
```

### 3.2 성능 최적화 전략

#### A. 병렬 API 호출
```javascript
// 프론트엔드에서 Promise.all로 병렬 호출
const [stats, ratings, insights, messages, actionItems] = await Promise.all([
  StandardizedApi.get('/api/v1/consultants/{id}/performance/summary'),
  StandardizedApi.get('/api/v1/consultants/{id}/ratings/summary'),
  StandardizedApi.get('/api/v1/consultants/{id}/clients/insights'),
  StandardizedApi.get('/api/v1/consultants/{id}/messages/summary'),
  StandardizedApi.get('/api/v1/consultants/{id}/action-items')
]);
```

**장점**: 
- 총 응답 시간 = 가장 느린 API 응답 시간 (순차 호출 대비 5배 빠름)
- 각 API 독립적으로 실패 처리 가능

**단점**: 
- 백엔드 부하 증가 (5개 API 동시 처리)

#### B. 통합 API (권장)
```java
// 백엔드에서 한 번에 조회 후 응답
@GetMapping("/api/v1/consultants/{consultantId}/dashboard")
public ResponseEntity<ApiResponse<ConsultantDashboardData>> getConsultantDashboard(
    @PathVariable Long consultantId
) {
    // 병렬 처리 (CompletableFuture 또는 @Async)
    CompletableFuture<PerformanceSummary> performanceFuture = 
        CompletableFuture.supplyAsync(() -> performanceService.getSummary(consultantId));
    CompletableFuture<RatingSummary> ratingFuture = 
        CompletableFuture.supplyAsync(() -> ratingService.getSummary(consultantId));
    // ... 나머지 데이터
    
    // 모든 Future 완료 대기
    CompletableFuture.allOf(performanceFuture, ratingFuture, ...).join();
    
    // 통합 응답
    ConsultantDashboardData data = ConsultantDashboardData.builder()
        .performance(performanceFuture.get())
        .ratings(ratingFuture.get())
        // ...
        .build();
    
    return success(data);
}
```

**장점**: 
- 프론트엔드 API 호출 1회
- 백엔드에서 병렬 처리로 성능 최적화
- 트랜잭션 관리 용이

**단점**: 
- API 응답 크기 증가
- 일부 데이터 실패 시 전체 실패 가능 (예외 처리 필요)

#### C. 캐싱 전략

**Redis 캐싱 적용 대상**:
- `consultant_performance` (일별 성과) → 1시간 캐시
- `consultant_ratings` 통계 (평균 점수, 분포) → 30분 캐시
- `daily_statistics` → 1일 캐시

**실시간 데이터 (캐싱 불가)**:
- `schedules` (오늘·다가오는 일정)
- `consultation_messages` (안읽은 메시지)
- `alerts` (최근 알림)

```java
@Cacheable(value = "consultant-performance", key = "#consultantId + '-' + #date")
public PerformanceSummary getPerformanceSummary(Long consultantId, LocalDate date) {
    // ...
}
```

### 3.3 데이터 조회 최적화

#### A. Repository 쿼리 최적화

**문제점**: N+1 쿼리 발생 가능
```java
// ❌ 나쁜 예: N+1 쿼리
List<Schedule> schedules = scheduleRepository.findByTenantIdAndConsultantId(tenantId, consultantId);
for (Schedule schedule : schedules) {
    String clientName = clientRepository.findById(schedule.getClientId()).get().getName(); // N번 조회
}
```

**해결책**: JOIN FETCH 또는 DTO Projection
```java
// ✅ 좋은 예: JOIN FETCH
@Query("SELECT s FROM Schedule s " +
       "LEFT JOIN FETCH s.client " +
       "WHERE s.tenantId = :tenantId AND s.consultantId = :consultantId")
List<Schedule> findByTenantIdAndConsultantIdWithClient(
    @Param("tenantId") String tenantId, 
    @Param("consultantId") Long consultantId
);

// ✅ 또는 DTO Projection
@Query("SELECT new com.coresolution.consultation.dto.ScheduleWithClientDTO(" +
       "s.id, s.date, s.startTime, s.endTime, s.status, c.name) " +
       "FROM Schedule s JOIN Client c ON s.clientId = c.id " +
       "WHERE s.tenantId = :tenantId AND s.consultantId = :consultantId")
List<ScheduleWithClientDTO> findSchedulesWithClientNames(
    @Param("tenantId") String tenantId, 
    @Param("consultantId") Long consultantId
);
```

#### B. 인덱스 활용

**기존 인덱스 (활용 가능)**:
- `idx_schedules_consultant_id` (schedules)
- `idx_consultation_records_consultant_id` (consultation_records)
- `idx_performance_consultant` (consultant_performance)

**추가 인덱스 제안**:
```sql
-- 상담일지 진행도 조회 최적화
CREATE INDEX idx_consultation_records_consultant_progress 
ON consultation_records(consultant_id, session_date, progress_score);

-- 메시지 안읽음 조회 최적화
CREATE INDEX idx_consultation_messages_consultant_unread 
ON consultation_messages(consultant_id, is_read, created_at);

-- 평가 통계 조회 최적화
CREATE INDEX idx_consultant_ratings_consultant_score 
ON consultant_ratings(consultant_id, heart_score, rated_at);
```

---

## 4. 실시간성 요구사항

### 4.1 실시간 업데이트 필요

| 컨텐츠 | 갱신 주기 | 구현 방법 |
|--------|----------|----------|
| 안읽은 메시지 | 실시간 | WebSocket 또는 5초 폴링 |
| 긴급 알림 | 실시간 | WebSocket 또는 10초 폴링 |
| 오늘의 일정 | 1분 | 1분 폴링 또는 페이지 포커스 시 갱신 |

### 4.2 주기적 갱신으로 충분

| 컨텐츠 | 갱신 주기 | 구현 방법 |
|--------|----------|----------|
| 주요 통계 (완료율, 평점 등) | 5분 | 5분 폴링 또는 페이지 로드 시 |
| 주간·월간 통계 | 1시간 | 페이지 로드 시 + Redis 캐시 |
| 성과 등급 | 1일 | 페이지 로드 시 + 배치 작업 |

### 4.3 정적 데이터 (페이지 로드 시만)

| 컨텐츠 | 갱신 주기 | 구현 방법 |
|--------|----------|----------|
| 월별 추이 | 페이지 로드 | 초기 로드 시 1회 |
| 비교 통계 (전체 평균) | 페이지 로드 | 초기 로드 시 1회 + 캐시 |

---

## 5. 단계별 구현 우선순위

### Phase 1: 기존 데이터 활용 (1-2주)

**목표**: API 수정 최소화, 기존 데이터로 즉시 구현 가능한 컨텐츠

**우선순위 1 (즉시 구현 가능)**:
1. ✅ 월간 완료율 (기존 `consultant_performance` 활용)
2. ✅ 성과 등급 표시 (기존 `consultant_performance.grade`)
3. ✅ 최근 평가 목록 (기존 `RATING_API.CONSULTANT_STATS` 확장)
4. ✅ 하트 점수 분포 (기존 API 확장)
5. ✅ 이번 주 일정 요약 (기존 `schedules` 집계)

**우선순위 2 (간단한 API 추가)**:
6. 안읽은 메시지 목록 (신규 API: `GET /api/v1/consultants/{id}/messages/unread`)
7. 미작성 상담일지 (신규 API: `GET /api/v1/consultants/{id}/incomplete-records`)
8. 취소율·노쇼율 (신규 API: `GET /api/v1/consultants/{id}/cancellation-stats`)

**백엔드 작업**:
- Repository 메서드 추가 (기존 테이블 활용)
- Service 레이어 집계 로직
- Controller 엔드포인트 추가

**프론트엔드 작업**:
- 새 섹션 컴포넌트 추가 (아토믹 디자인 준수)
- 차트 라이브러리 도입 (Chart.js 또는 Recharts)
- `StandardizedApi` 호출 추가

---

### Phase 2: API 확장 (2-3주)

**목표**: 복합 데이터 조회 및 분석 로직 추가

**우선순위 3 (중급 난이도)**:
9. 내담자별 진행도 추이 (신규 API + 차트)
10. 시간대별 상담 분포 (신규 API + 히트맵)
11. 요일별·월별 상담 추이 (신규 API + 라인 차트)
12. 전체 평균과 비교 (신규 API + 벤치마킹 로직)
13. 인기 평가 태그 (JSON 파싱 + 집계)

**백엔드 작업**:
- 복합 쿼리 작성 (JOIN, GROUP BY, 집계 함수)
- DTO 클래스 추가 (Response 객체)
- 통계 계산 로직 (Service 레이어)

**프론트엔드 작업**:
- 고급 차트 컴포넌트 (히트맵, 라인 차트, 워드 클라우드)
- 비교 UI (내 성과 vs 평균)
- 필터링 및 정렬 기능

---

### Phase 3: 신규 기능 (3-4주)

**목표**: 예측, 실시간 알림, AI 기반 인사이트

**우선순위 4 (고급 난이도)**:
14. 실시간 알림 배지 (WebSocket 또는 Server-Sent Events)
15. 오늘의 추천 액션 (규칙 기반 우선순위 로직)
16. 이번 달 예상 수익 (추세 분석 알고리즘)
17. 목표 달성률 (목표 설정 기능 + 테이블 추가)

**백엔드 작업**:
- WebSocket 설정 (Spring WebSocket)
- 예측 알고리즘 (선형 회귀 또는 이동 평균)
- 목표 관리 테이블 및 API 추가

**프론트엔드 작업**:
- WebSocket 클라이언트 연결
- 실시간 업데이트 UI
- 목표 설정 모달 (UnifiedModal 사용)

---

## 6. 성능 고려사항

### 6.1 데이터 조회 전략

| 전략 | 적용 대상 | 예상 효과 |
|------|----------|----------|
| **병렬 API 호출** | 독립적인 통계 데이터 | 응답 시간 5배 단축 |
| **Redis 캐싱** | 성과·평가 통계 | DB 부하 80% 감소 |
| **DTO Projection** | 복합 조회 (JOIN) | 메모리 사용량 50% 감소 |
| **인덱스 추가** | 자주 조회되는 필드 | 쿼리 속도 10배 향상 |
| **배치 작업** | 일별 성과 집계 | 실시간 계산 부하 제거 |

### 6.2 로딩 전략

#### A. 초기 로딩 (Critical Path)
```javascript
// 1차: 필수 데이터만 먼저 로드 (1초 이내)
- 오늘의 일정
- 주요 통계 (오늘의 상담, 신규 내담자, 안읽은 메시지, 평균 평점)

// 2차: 부가 데이터 지연 로드 (2-3초)
- 주간 상담 현황
- 최근 알림
- 다가오는 상담

// 3차: 상세 통계 지연 로드 (3-5초)
- 월간 완료율
- 평가 분포
- 시간대별 분석
```

#### B. Lazy Loading
```javascript
// 스크롤 시 추가 데이터 로드
- 최근 평가 목록 (무한 스크롤)
- 내담자 목록 (페이지네이션)
```

#### C. Skeleton UI
```javascript
// 로딩 중 Skeleton 표시
<div className="mg-v2-skeleton mg-v2-skeleton--card"></div>
```

### 6.3 예상 성능 지표

| 시나리오 | 현재 | Phase 1 | Phase 2 | Phase 3 |
|---------|------|---------|---------|---------|
| **API 호출 수** | 5개 | 8개 | 12개 | 15개 + WebSocket |
| **초기 로딩 시간** | 1.5초 | 2.0초 | 2.5초 | 3.0초 |
| **전체 로딩 시간** | 2.0초 | 3.5초 | 5.0초 | 6.0초 |
| **DB 쿼리 수** | 10개 | 20개 | 35개 | 50개 |
| **캐시 적용 후 쿼리 수** | - | 8개 | 15개 | 20개 |

---

## 7. 기술 스택 및 라이브러리

### 7.1 프론트엔드

| 기능 | 라이브러리 | 용도 |
|------|-----------|------|
| **차트** | Chart.js 또는 Recharts | 막대·라인·파이 차트 |
| **날짜 처리** | dayjs (기존 사용 중) | 날짜 포맷, 계산 |
| **아이콘** | lucide-react (기존 사용 중) | 아이콘 표시 |
| **실시간 통신** | Socket.IO 또는 SockJS | WebSocket 연결 |

### 7.2 백엔드

| 기능 | 기술 | 용도 |
|------|------|------|
| **캐싱** | Spring Cache + Redis | 통계 데이터 캐싱 |
| **비동기 처리** | @Async + CompletableFuture | 병렬 데이터 조회 |
| **WebSocket** | Spring WebSocket + STOMP | 실시간 알림 |
| **배치 작업** | Spring Batch 또는 @Scheduled | 일별 성과 집계 |

---

## 8. 멀티테넌트 고려사항

### 8.1 tenantId 필터링 (필수)

**모든 Repository 메서드는 tenantId 필터링 필수**:
```java
// ✅ 올바른 예
List<Schedule> findByTenantIdAndConsultantId(String tenantId, Long consultantId);

// ❌ 금지 (보안 위험)
List<Schedule> findByConsultantId(Long consultantId);
```

### 8.2 TenantContextHolder 활용

```java
@Service
public class ConsultantStatsService {
    
    public PerformanceSummary getSummary(Long consultantId) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            throw new IllegalStateException("테넌트 정보가 없습니다.");
        }
        
        // tenantId 필터링 적용
        return performanceRepository.findByTenantIdAndConsultantId(tenantId, consultantId);
    }
}
```

---

## 9. 구현 체크리스트

### Phase 1 체크리스트

#### 백엔드
- [ ] `ConsultantStatsService` 생성 (성과 요약 조회)
- [ ] `ConsultantRatingService` 확장 (평가 분포, 인기 태그)
- [ ] `ConsultantMessageService` 생성 (메시지 요약)
- [ ] Repository 메서드 추가 (tenantId 필터링 필수)
- [ ] DTO 클래스 작성 (Response 객체)
- [ ] Controller 엔드포인트 추가 (`/api/v1/consultants/{id}/...`)
- [ ] 단위 테스트 작성 (Service, Repository)

#### 프론트엔드
- [ ] `constants/api.js`에 새 API 엔드포인트 추가
- [ ] 차트 라이브러리 설치 (Chart.js 또는 Recharts)
- [ ] 새 섹션 컴포넌트 작성 (아토믹 디자인 준수)
- [ ] `ConsultantDashboardV2.js` 수정 (새 API 호출 추가)
- [ ] CSS 스타일 추가 (`ConsultantDashboard.css`)
- [ ] 로딩 상태 처리 (Skeleton UI)
- [ ] 에러 처리 (빈 데이터, API 실패)

#### 성능
- [ ] Redis 캐시 설정 (`@Cacheable` 적용)
- [ ] 병렬 API 호출 (`Promise.all`)
- [ ] 인덱스 추가 (마이그레이션 파일)

---

## 10. 예상 리소스 및 난이도

### 10.1 개발 공수 추정

| Phase | 백엔드 | 프론트엔드 | 테스트 | 총 공수 |
|-------|--------|-----------|--------|---------|
| Phase 1 | 3일 | 3일 | 1일 | 7일 |
| Phase 2 | 4일 | 4일 | 2일 | 10일 |
| Phase 3 | 5일 | 5일 | 3일 | 13일 |
| **합계** | **12일** | **12일** | **6일** | **30일** |

### 10.2 난이도별 분류

| 난이도 | 컨텐츠 개수 | 예시 |
|--------|------------|------|
| **하** | 15개 | 월간 완료율, 등급 표시, 최근 평가, 이번 주 일정 요약 |
| **중** | 12개 | 내담자 진행도, 시간대별 분포, 평균 응답 시간, 미작성 일지 |
| **상** | 5개 | 예상 수익, 목표 달성률, 진행도 추세 분석, 실시간 알림 |

---

## 11. 기술적 제약사항 및 리스크

### 11.1 제약사항

1. **멀티테넌트 원칙**: 모든 쿼리에 tenantId 필터링 필수
2. **StandardizedApi 사용**: 프론트엔드 API 호출 시 반드시 사용
3. **디자인 토큰**: 하드코딩 색상·간격 금지, `var(--mg-*)` 사용
4. **아토믹 디자인**: 컴포넌트 계층 구조 준수
5. **UnifiedModal**: 모달 사용 시 통일된 컴포넌트 사용

### 11.2 리스크

| 리스크 | 영향도 | 완화 방안 |
|--------|--------|----------|
| **대시보드 로딩 속도 저하** | 높음 | Redis 캐싱, 병렬 호출, Lazy Loading |
| **DB 부하 증가** | 중간 | 인덱스 추가, 배치 작업, 캐싱 |
| **복잡한 쿼리 성능 저하** | 중간 | DTO Projection, 쿼리 최적화, 인덱스 |
| **실시간 기능 서버 부하** | 높음 | WebSocket 연결 수 제한, 폴링 주기 조정 |
| **멀티테넌트 격리 위반** | 치명적 | 코드 리뷰, 자동 테스트, tenantId 검증 |

---

## 12. 권장 구현 순서

### Step 1: 기반 작업 (1일)
1. 차트 라이브러리 설치 및 설정
2. Redis 캐시 설정
3. 새 API 엔드포인트 상수 추가 (`constants/api.js`)

### Step 2: 성과 통계 (2일)
4. 백엔드: `ConsultantPerformanceRepository` 메서드 추가
5. 백엔드: `ConsultantStatsService` 생성 및 API
6. 프론트엔드: 월간 완료율, 등급 표시 컴포넌트

### Step 3: 평가 통계 (2일)
7. 백엔드: `ConsultantRatingRepository` 메서드 추가 (분포, 인기 태그)
8. 백엔드: `ConsultantRatingService` 확장 및 API
9. 프론트엔드: 하트 점수 분포, 최근 평가, 인기 태그 컴포넌트

### Step 4: 메시지 및 액션 아이템 (2일)
10. 백엔드: `ConsultationMessageRepository` 메서드 추가
11. 백엔드: `ConsultantActionItemService` 생성 (미작성 일지, 긴급 메시지)
12. 프론트엔드: 안읽은 메시지, 미작성 일지, 오늘의 할 일 컴포넌트

### Step 5: 시간 분석 (2일)
13. 백엔드: 시간대별·요일별·월별 통계 API
14. 프론트엔드: 시간 분석 차트 컴포넌트 (히트맵, 라인 차트)

### Step 6: 내담자 인사이트 (2일)
15. 백엔드: 내담자 진행도, 위험도, 장기 미방문 API
16. 프론트엔드: 내담자 인사이트 컴포넌트

### Step 7: 최적화 및 테스트 (2일)
17. 인덱스 추가 (마이그레이션 파일)
18. 캐싱 적용 및 검증
19. 통합 테스트 및 성능 테스트
20. UI/UX 개선 (로딩 상태, 에러 처리)

---

## 13. 예상 결과물

### 13.1 Phase 1 완료 후 대시보드 구성

**상단 영역**:
- 웰컴 메시지 (기존 유지)
- 주요 통계 카드 (6개로 확장)
  - 오늘의 상담
  - 신규 내담자
  - 안읽은 메시지
  - 평균 평점
  - **월간 완료율** (신규)
  - **성과 등급** (신규)

**메인 그리드**:
- 최근 일정 (기존 유지)
- 다가오는 상담 (기존 유지)
- **미작성 상담일지** (신규)
- **최근 평가** (신규)
- 주간 상담 현황 (기존 유지)
- **하트 점수 분포** (신규)

### 13.2 Phase 2 완료 후 추가 섹션

- **내담자 인사이트**: 활성 내담자, 재방문 비율, 위험도 분포
- **시간 분석**: 시간대별·요일별 상담 분포 (히트맵)
- **월간 추이**: 최근 6개월 상담 건수 추이 (라인 차트)
- **비교 통계**: 내 성과 vs 전체 평균

### 13.3 Phase 3 완료 후 고급 기능

- **실시간 알림 배지**: 새 메시지, 긴급 알림 실시간 표시
- **오늘의 할 일**: AI 또는 규칙 기반 추천 액션
- **목표 달성률**: 월간 목표 대비 현재 달성률 (프로그레스 바)
- **예상 수익**: 이번 달 예상 수익 (추세 기반)

---

## 14. 참고 자료

### 14.1 표준 문서
- `docs/standards/BACKEND_CODING_STANDARD.md`
- `docs/standards/FRONTEND_DEVELOPMENT_STANDARD.md`
- `docs/standards/API_CALL_STANDARD.md`
- `docs/standards/API_INTEGRATION_STANDARD.md`
- `docs/standards/COMPONENT_STRUCTURE_STANDARD.md`
- `docs/standards/DATABASE_MIGRATION_STANDARD.md`

### 14.2 기존 컴포넌트 참조
- `frontend/src/components/dashboard-v2/consultant/ConsultantDashboardV2.js`
- `frontend/src/components/dashboard/widgets/` (위젯 참조)
- `frontend/src/components/consultant/` (상담사 관련 컴포넌트)

### 14.3 API 참조
- `frontend/src/constants/api.js`
- `src/main/java/com/coresolution/consultation/controller/ScheduleController.java`
- `src/main/java/com/coresolution/consultation/service/impl/ScheduleServiceImpl.java`

---

## 15. 결론 및 권장사항

### 15.1 즉시 구현 가능 (Phase 1)

**기존 데이터만으로 구현 가능한 컨텐츠 15개**:
- 월간 완료율, 성과 등급, 최근 평가, 하트 점수 분포, 이번 주 일정 요약
- 안읽은 메시지 목록, 미작성 상담일지, 취소율·노쇼율
- 활성 내담자 수, 재방문 비율, 평균 세션 시간
- 요일별 상담 분포, 긴급 알림, 높은 평가 하이라이트
- 이번 주 수익 통계

**장점**:
- DB 스키마 수정 불필요
- 기존 테이블 활용 (schedules, consultant_performance, consultant_ratings 등)
- API 개발 난이도 낮음 (Repository 메서드 + Service 집계)

**예상 기간**: 1-2주

### 15.2 API 확장 필요 (Phase 2)

**복합 데이터 조회 및 분석 로직 추가 (12개)**:
- 내담자별 진행도 추이, 시간대별 분포, 월별 추이
- 전체 평균과 비교, 인기 평가 태그
- 내담자 위험도 분포, 장기 미방문 내담자
- 과제 미제출 내담자, 평균 응답 시간

**예상 기간**: 2-3주

### 15.3 신규 기능 개발 (Phase 3)

**고급 기능 및 실시간 처리 (5개)**:
- 실시간 알림 배지 (WebSocket)
- 오늘의 추천 액션 (규칙 기반)
- 이번 달 예상 수익 (추세 분석)
- 목표 달성률 (목표 설정 기능 + 테이블 추가)

**예상 기간**: 3-4주

### 15.4 최종 권장사항

1. **Phase 1부터 순차 진행**: 기존 데이터 활용으로 빠른 성과 도출
2. **통합 API 우선 고려**: 병렬 호출보다 백엔드 통합 API가 성능·관리 측면에서 유리
3. **캐싱 전략 필수**: Redis 캐싱으로 DB 부하 최소화
4. **멀티테넌트 원칙 엄수**: 모든 쿼리에 tenantId 필터링 필수
5. **점진적 개선**: 사용자 피드백 받으며 Phase 2, 3 진행

---

## 16. 다음 단계

1. **Phase 1 구현 착수**: 즉시 구현 가능한 15개 컨텐츠 우선 개발
2. **사용자 피드백 수집**: Phase 1 배포 후 상담사 의견 수렴
3. **Phase 2 계획 수립**: 피드백 기반 우선순위 재조정
4. **성능 모니터링**: 대시보드 로딩 속도, DB 쿼리 성능 측정

---

**문서 종료**
