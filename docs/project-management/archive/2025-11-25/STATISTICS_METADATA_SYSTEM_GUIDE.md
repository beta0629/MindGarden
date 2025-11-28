# 통계 데이터 메타데이터 시스템 가이드

통계 데이터를 자동 생성하고, 하드코딩 없이 메타데이터 기반으로 작동하는 시스템 설계 가이드입니다.

## 📋 목차
1. [문제점 분석](#문제점-분석)
2. [메타데이터 기반 통계 시스템 설계](#메타데이터-기반-통계-시스템-설계)
3. [통계 자동 생성 시스템](#통계-자동-생성-시스템)
4. [하드코딩 제거 전략](#하드코딩-제거-전략)
5. [구현 가이드](#구현-가이드)

---

## 문제점 분석

### 현재 하드코딩된 부분

1. **통계 계산 로직 하드코딩**
   ```java
   // ❌ 하드코딩 예시
   BigDecimal totalRevenue = daySchedules.stream()
       .filter(s -> ScheduleStatus.COMPLETED.equals(s.getStatus()))
       .map(s -> BigDecimal.valueOf(50000)) // 하드코딩된 기본 세션비
       .reduce(BigDecimal.ZERO, BigDecimal::add);
   ```

2. **통계 항목 하드코딩**
   - 통계 항목이 서비스 코드에 직접 정의됨
   - 새로운 통계 추가 시 코드 수정 필요

3. **통계 계산 규칙 하드코딩**
   - 계산 로직이 서비스에 직접 구현됨
   - 업종별/테넌트별 커스터마이징 어려움

---

## 메타데이터 기반 통계 시스템 설계

### 1. 통계 메타데이터 테이블 구조

```sql
-- 통계 정의 테이블
CREATE TABLE statistics_definitions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36),
    statistic_code VARCHAR(100) NOT NULL,
    statistic_name_ko VARCHAR(200),
    statistic_name_en VARCHAR(200),
    category VARCHAR(50), -- 'SCHEDULE', 'CONSULTANT', 'CLIENT', 'REVENUE' 등
    calculation_type VARCHAR(50), -- 'COUNT', 'SUM', 'AVG', 'CUSTOM'
    data_source_type VARCHAR(50), -- 'SCHEDULE', 'MAPPING', 'CONSULTATION', 'ERP'
    calculation_rule JSON, -- 계산 규칙 (메타데이터)
    aggregation_period VARCHAR(20), -- 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_code (tenant_id, statistic_code),
    INDEX idx_category (category)
);

-- 통계 계산 규칙 예시 (calculation_rule JSON)
{
  "type": "SUM",
  "source": "SCHEDULE",
  "filter": {
    "status": "COMPLETED",
    "dateRange": "TODAY"
  },
  "field": "revenue",
  "defaultValue": 0,
  "formula": null
}

-- 또는 복잡한 계산
{
  "type": "CUSTOM",
  "formula": "totalConsultations * averagePrice * (1 - discountRate)",
  "variables": {
    "totalConsultations": {
      "type": "COUNT",
      "source": "SCHEDULE",
      "filter": { "status": "COMPLETED" }
    },
    "averagePrice": {
      "type": "AVG",
      "source": "MAPPING",
      "field": "packagePrice"
    },
    "discountRate": {
      "type": "CONSTANT",
      "value": 0.1
    }
  }
}

-- 통계 생성 이력 테이블
CREATE TABLE statistics_generation_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36),
    statistic_code VARCHAR(100),
    generation_date DATE,
    period_start DATE,
    period_end DATE,
    calculated_value DECIMAL(20, 2),
    raw_data JSON, -- 계산에 사용된 원본 데이터
    calculation_time_ms INT,
    status VARCHAR(20), -- 'SUCCESS', 'FAILED', 'PARTIAL'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tenant_date (tenant_id, generation_date),
    INDEX idx_statistic (statistic_code, generation_date)
);
```

### 2. 통계 메타데이터 예시

#### 기본 통계 정의

```json
[
  {
    "statisticCode": "TOTAL_CONSULTATIONS_TODAY",
    "statisticNameKo": "오늘 총 상담 수",
    "statisticNameEn": "Total Consultations Today",
    "category": "SCHEDULE",
    "calculationType": "COUNT",
    "dataSourceType": "SCHEDULE",
    "calculationRule": {
      "type": "COUNT",
      "source": "SCHEDULE",
      "filter": {
        "date": "TODAY",
        "status": ["SCHEDULED", "IN_PROGRESS", "COMPLETED"]
      }
    },
    "aggregationPeriod": "DAILY"
  },
  {
    "statisticCode": "COMPLETED_CONSULTATIONS_TODAY",
    "statisticNameKo": "오늘 완료된 상담 수",
    "statisticNameEn": "Completed Consultations Today",
    "category": "SCHEDULE",
    "calculationType": "COUNT",
    "dataSourceType": "SCHEDULE",
    "calculationRule": {
      "type": "COUNT",
      "source": "SCHEDULE",
      "filter": {
        "date": "TODAY",
        "status": "COMPLETED"
      }
    },
    "aggregationPeriod": "DAILY"
  },
  {
    "statisticCode": "TOTAL_REVENUE_TODAY",
    "statisticNameKo": "오늘 총 수익",
    "statisticNameEn": "Total Revenue Today",
    "category": "REVENUE",
    "calculationType": "SUM",
    "dataSourceType": "SCHEDULE",
    "calculationRule": {
      "type": "SUM",
      "source": "SCHEDULE",
      "filter": {
        "date": "TODAY",
        "status": "COMPLETED"
      },
      "field": "revenue",
      "fallback": {
        "type": "LOOKUP",
        "source": "MAPPING",
        "field": "packagePrice",
        "join": {
          "from": "schedule.mappingId",
          "to": "mapping.id"
        }
      }
    },
    "aggregationPeriod": "DAILY"
  },
  {
    "statisticCode": "AVERAGE_CONSULTATION_DURATION",
    "statisticNameKo": "평균 상담 시간",
    "statisticNameEn": "Average Consultation Duration",
    "category": "SCHEDULE",
    "calculationType": "AVG",
    "dataSourceType": "SCHEDULE",
    "calculationRule": {
      "type": "AVG",
      "source": "SCHEDULE",
      "filter": {
        "status": "COMPLETED",
        "dateRange": "LAST_30_DAYS"
      },
      "field": "durationMinutes"
    },
    "aggregationPeriod": "DAILY"
  }
]
```

---

## 통계 자동 생성 시스템

### 1. 통계 생성 서비스 인터페이스

```java
public interface StatisticsMetadataService {
    
    /**
     * 통계 정의 조회
     */
    List<StatisticsDefinition> getStatisticsDefinitions(String tenantId, String category);
    
    /**
     * 통계 정의 생성/수정
     */
    StatisticsDefinition saveStatisticsDefinition(String tenantId, StatisticsDefinition definition);
    
    /**
     * 통계 값 계산 (메타데이터 기반)
     */
    BigDecimal calculateStatistic(String tenantId, String statisticCode, LocalDate date, Map<String, Object> params);
    
    /**
     * 일별 통계 자동 생성 (배치)
     */
    void generateDailyStatistics(String tenantId, LocalDate date);
    
    /**
     * 통계 생성 이력 조회
     */
    List<StatisticsGenerationLog> getGenerationLogs(String tenantId, String statisticCode, LocalDate startDate, LocalDate endDate);
}
```

### 2. 통계 계산 엔진

```java
@Service
@RequiredArgsConstructor
public class StatisticsCalculationEngine {
    
    private final ScheduleRepository scheduleRepository;
    private final MappingRepository mappingRepository;
    private final ConsultationRepository consultationRepository;
    private final ErpService erpService;
    
    /**
     * 메타데이터 기반 통계 계산
     */
    public BigDecimal calculate(StatisticsDefinition definition, LocalDate date, Map<String, Object> params) {
        CalculationRule rule = definition.getCalculationRule();
        
        switch (rule.getType()) {
            case "COUNT":
                return calculateCount(rule, date, params);
            case "SUM":
                return calculateSum(rule, date, params);
            case "AVG":
                return calculateAverage(rule, date, params);
            case "CUSTOM":
                return calculateCustom(rule, date, params);
            default:
                throw new IllegalArgumentException("Unknown calculation type: " + rule.getType());
        }
    }
    
    private BigDecimal calculateCount(CalculationRule rule, LocalDate date, Map<String, Object> params) {
        List<?> data = fetchData(rule.getSource(), rule.getFilter(), date, params);
        return BigDecimal.valueOf(data.size());
    }
    
    private BigDecimal calculateSum(CalculationRule rule, LocalDate date, Map<String, Object> params) {
        List<?> data = fetchData(rule.getSource(), rule.getFilter(), date, params);
        
        return data.stream()
            .map(item -> extractFieldValue(item, rule.getField(), rule.getFallback()))
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    private BigDecimal calculateAverage(CalculationRule rule, LocalDate date, Map<String, Object> params) {
        List<?> data = fetchData(rule.getSource(), rule.getFilter(), date, params);
        
        if (data.isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal sum = data.stream()
            .map(item -> extractFieldValue(item, rule.getField(), rule.getFallback()))
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return sum.divide(BigDecimal.valueOf(data.size()), 2, RoundingMode.HALF_UP);
    }
    
    private BigDecimal calculateCustom(CalculationRule rule, LocalDate date, Map<String, Object> params) {
        // 변수 계산
        Map<String, BigDecimal> variables = new HashMap<>();
        for (Map.Entry<String, VariableDefinition> entry : rule.getVariables().entrySet()) {
            variables.put(entry.getKey(), calculateVariable(entry.getValue(), date, params));
        }
        
        // 수식 평가
        return evaluateFormula(rule.getFormula(), variables);
    }
    
    private List<?> fetchData(String sourceType, FilterDefinition filter, LocalDate date, Map<String, Object> params) {
        switch (sourceType) {
            case "SCHEDULE":
                return fetchScheduleData(filter, date, params);
            case "MAPPING":
                return fetchMappingData(filter, date, params);
            case "CONSULTATION":
                return fetchConsultationData(filter, date, params);
            case "ERP":
                return fetchErpData(filter, date, params);
            default:
                throw new IllegalArgumentException("Unknown source type: " + sourceType);
        }
    }
    
    private List<Schedule> fetchScheduleData(FilterDefinition filter, LocalDate date, Map<String, Object> params) {
        String tenantId = (String) params.get("tenantId");
        
        // 필터 파싱 및 쿼리 생성
        Specification<Schedule> spec = buildScheduleSpecification(filter, date, tenantId);
        
        return scheduleRepository.findAll(spec);
    }
    
    // ... 다른 데이터 소스 fetch 메서드들
}
```

### 3. 통계 자동 생성 배치

```java
@Component
@RequiredArgsConstructor
public class StatisticsGenerationScheduler {
    
    private final StatisticsMetadataService statisticsMetadataService;
    private final StatisticsCalculationEngine calculationEngine;
    private final StatisticsGenerationLogRepository logRepository;
    
    /**
     * 매일 자정에 전날 통계 자동 생성
     */
    @Scheduled(cron = "0 0 1 * * ?") // 매일 새벽 1시
    public void generateDailyStatistics() {
        log.info("📊 일별 통계 자동 생성 시작");
        
        LocalDate yesterday = LocalDate.now().minusDays(1);
        List<String> tenantIds = tenantRepository.findAllActiveTenantIds();
        
        for (String tenantId : tenantIds) {
            try {
                statisticsMetadataService.generateDailyStatistics(tenantId, yesterday);
                log.info("✅ 통계 생성 완료: tenantId={}, date={}", tenantId, yesterday);
            } catch (Exception e) {
                log.error("❌ 통계 생성 실패: tenantId={}, date={}", tenantId, yesterday, e);
            }
        }
    }
    
    /**
     * 실시간 통계 업데이트 (이벤트 기반)
     */
    @EventListener
    public void onScheduleCompleted(ScheduleCompletedEvent event) {
        String tenantId = event.getTenantId();
        LocalDate date = event.getScheduleDate();
        
        // 관련 통계만 재계산
        List<StatisticsDefinition> affectedStats = 
            statisticsMetadataService.getStatisticsDefinitions(tenantId, "SCHEDULE");
        
        for (StatisticsDefinition definition : affectedStats) {
            try {
                BigDecimal value = calculationEngine.calculate(definition, date, 
                    Map.of("tenantId", tenantId));
                
                // 통계 값 저장 또는 업데이트
                saveStatisticsValue(tenantId, definition.getStatisticCode(), date, value);
                
                log.debug("📊 통계 업데이트: code={}, value={}", 
                    definition.getStatisticCode(), value);
            } catch (Exception e) {
                log.error("❌ 통계 계산 실패: code={}", definition.getStatisticCode(), e);
            }
        }
    }
}
```

---

## 하드코딩 제거 전략

### 1. 기존 하드코딩 제거

#### Before (하드코딩)

```java
// ❌ 하드코딩된 통계 계산
public DailyStatistics updateDailyStatistics(LocalDate date, String branchCode) {
    List<Schedule> daySchedules = scheduleRepository.findByDateAndBranchCode(date, branchCode);
    
    statistics.setTotalConsultations(daySchedules.size());
    
    long completedCount = daySchedules.stream()
        .filter(s -> ScheduleStatus.COMPLETED.equals(s.getStatus()))
        .count();
    statistics.setCompletedConsultations((int) completedCount);
    
    // ❌ 하드코딩된 기본 세션비
    BigDecimal totalRevenue = daySchedules.stream()
        .filter(s -> ScheduleStatus.COMPLETED.equals(s.getStatus()))
        .map(s -> BigDecimal.valueOf(50000)) // 하드코딩!
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    statistics.setTotalRevenue(totalRevenue);
    
    return statistics;
}
```

#### After (메타데이터 기반)

```java
// ✅ 메타데이터 기반 통계 계산
public DailyStatistics updateDailyStatistics(LocalDate date, String branchCode) {
    String tenantId = TenantContextHolder.getTenantId();
    
    // 통계 정의 조회 (메타데이터)
    List<StatisticsDefinition> definitions = 
        statisticsMetadataService.getStatisticsDefinitions(tenantId, "SCHEDULE");
    
    DailyStatistics statistics = new DailyStatistics();
    statistics.setStatDate(date);
    statistics.setBranchCode(branchCode);
    
    Map<String, Object> params = Map.of(
        "tenantId", tenantId,
        "branchCode", branchCode,
        "date", date
    );
    
    // 메타데이터 기반으로 통계 계산
    for (StatisticsDefinition definition : definitions) {
        BigDecimal value = calculationEngine.calculate(definition, date, params);
        
        // 통계 코드에 따라 필드 설정 (리플렉션 또는 매핑)
        setStatisticsField(statistics, definition.getStatisticCode(), value);
    }
    
    return statistics;
}
```

### 2. 통계 위젯 Config (메타데이터 기반)

```json
{
  "id": "widget-consultation-stats",
  "type": "summary-statistics",
  "config": {
    "title": "상담 통계",
    "dataSource": {
      "type": "api",
      "url": "/api/v1/statistics/calculate",
      "params": {
        "statisticCodes": [
          "TOTAL_CONSULTATIONS_TODAY",
          "COMPLETED_CONSULTATIONS_TODAY",
          "TOTAL_REVENUE_TODAY",
          "AVERAGE_CONSULTATION_DURATION"
        ],
        "date": "${today}",
        "tenantId": "${user.tenantId}"
      },
      "refreshInterval": 60000
    },
    "statistics": [
      {
        "key": "TOTAL_CONSULTATIONS_TODAY",
        "label": "오늘 총 상담",
        "format": "number",
        "icon": "bi-calendar-check"
      },
      {
        "key": "COMPLETED_CONSULTATIONS_TODAY",
        "label": "완료된 상담",
        "format": "number",
        "icon": "bi-check-circle"
      },
      {
        "key": "TOTAL_REVENUE_TODAY",
        "label": "오늘 수익",
        "format": "currency",
        "icon": "bi-currency-dollar"
      },
      {
        "key": "AVERAGE_CONSULTATION_DURATION",
        "label": "평균 상담 시간",
        "format": "number",
        "suffix": "분",
        "icon": "bi-clock"
      }
    ]
  }
}
```

### 3. 통계 API 엔드포인트

```java
@RestController
@RequestMapping("/api/v1/statistics")
@RequiredArgsConstructor
public class StatisticsController extends BaseApiController {
    
    private final StatisticsMetadataService statisticsMetadataService;
    private final StatisticsCalculationEngine calculationEngine;
    
    /**
     * 통계 값 계산 (메타데이터 기반)
     */
    @PostMapping("/calculate")
    public ResponseEntity<ApiResponse<Map<String, BigDecimal>>> calculateStatistics(
            @RequestBody StatisticsCalculationRequest request) {
        
        String tenantId = TenantContextHolder.getTenantId();
        LocalDate date = request.getDate() != null ? request.getDate() : LocalDate.now();
        
        Map<String, BigDecimal> results = new HashMap<>();
        
        for (String statisticCode : request.getStatisticCodes()) {
            StatisticsDefinition definition = 
                statisticsMetadataService.getStatisticsDefinition(tenantId, statisticCode);
            
            if (definition == null) {
                log.warn("통계 정의를 찾을 수 없음: statisticCode={}", statisticCode);
                continue;
            }
            
            BigDecimal value = calculationEngine.calculate(
                definition, 
                date, 
                Map.of("tenantId", tenantId)
            );
            
            results.put(statisticCode, value);
        }
        
        return success(results);
    }
    
    /**
     * 통계 정의 목록 조회
     */
    @GetMapping("/definitions")
    public ResponseEntity<ApiResponse<List<StatisticsDefinitionResponse>>> getStatisticsDefinitions(
            @RequestParam(required = false) String category) {
        
        String tenantId = TenantContextHolder.getTenantId();
        List<StatisticsDefinition> definitions = 
            statisticsMetadataService.getStatisticsDefinitions(tenantId, category);
        
        List<StatisticsDefinitionResponse> responses = definitions.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
        
        return success(responses);
    }
}
```

---

## 구현 가이드

### Phase 1: 메타데이터 테이블 및 엔티티 생성 (1주)

1. `StatisticsDefinition` 엔티티 생성
2. `StatisticsGenerationLog` 엔티티 생성
3. Repository 생성
4. 초기 통계 정의 데이터 삽입

### Phase 2: 통계 계산 엔진 구현 (1주)

1. `StatisticsCalculationEngine` 구현
2. 데이터 소스별 fetch 메서드 구현
3. 계산 타입별 로직 구현 (COUNT, SUM, AVG, CUSTOM)

### Phase 3: 통계 자동 생성 시스템 (1주)

1. `StatisticsMetadataService` 구현
2. 배치 스케줄러 구현
3. 이벤트 기반 실시간 업데이트

### Phase 4: 하드코딩 제거 및 마이그레이션 (1주)

1. 기존 하드코딩된 통계 계산 로직 제거
2. 메타데이터 기반으로 전환
3. 통계 위젯 Config 업데이트

---

## 체크리스트

### 하드코딩 제거 확인

- [ ] 모든 통계 계산 로직이 메타데이터 기반인가?
- [ ] 하드코딩된 값(예: 기본 세션비)이 제거되었는가?
- [ ] 통계 항목이 DB에 정의되어 있는가?
- [ ] 통계 계산 규칙이 JSON으로 정의되어 있는가?
- [ ] 새로운 통계 추가 시 코드 수정 없이 가능한가?
- [ ] 테넌트별/업종별 커스터마이징이 가능한가?

---

## 요약

1. **메타데이터 기반 설계**: 모든 통계 정의를 DB에 저장
2. **자동 생성 시스템**: 배치 및 이벤트 기반 통계 자동 생성
3. **하드코딩 완전 제거**: 모든 값과 규칙을 메타데이터로 관리
4. **확장 가능한 구조**: 새로운 통계 추가 시 코드 수정 불필요
5. **테넌트별 커스터마이징**: 각 테넌트별 통계 정의 가능

**절대 하드코딩 없이 모든 통계를 메타데이터로 관리합니다!**


