# 통계 하드코딩 제거 가이드

## 현재 하드코딩 위치

### StatisticsServiceImpl.java

1. **라인 93**: `BigDecimal.valueOf(50000)` - 기본 세션비 하드코딩
   ```java
   .map(s -> BigDecimal.valueOf(50000)) // 기본 세션비 50,000원으로 설정
   ```

2. **라인 253**: `BigDecimal.valueOf(50000)` - 기본 세션비 하드코딩
   ```java
   .map(s -> BigDecimal.valueOf(50000)) // 기본 세션비 50,000원으로 설정
   ```

3. **라인 568**: `BigDecimal.valueOf(50000)` - 기본 세션비 하드코딩
   ```java
   .map(s -> BigDecimal.valueOf(50000)) // 기본 세션비
   ```

## 제거 전략

### 1. 메타데이터 기반 전환

기존 하드코딩된 `50000` 값을 메타데이터 시스템을 통해 동적으로 가져오도록 변경:

```java
// 기존 코드
.map(s -> BigDecimal.valueOf(50000))

// 변경 후
.map(s -> getSessionFee(s)) // 메타데이터 기반 세션비 조회
```

### 2. 세션비 조회 로직

`ConsultantClientMapping`에서 `packagePrice`를 조회하고, 회기당 단가를 계산:

```java
private BigDecimal getSessionFee(Schedule schedule) {
    if (schedule.getMappingId() == null) {
        // 매핑이 없으면 메타데이터에서 기본값 조회
        return getDefaultSessionFee();
    }
    
    ConsultantClientMapping mapping = mappingRepository.findById(schedule.getMappingId())
        .orElse(null);
    
    if (mapping == null || mapping.getPackagePrice() == null) {
        return getDefaultSessionFee();
    }
    
    // 회기당 단가 계산
    if (mapping.getTotalSessions() != null && mapping.getTotalSessions() > 0) {
        return BigDecimal.valueOf(mapping.getPackagePrice())
            .divide(BigDecimal.valueOf(mapping.getTotalSessions()), 2, RoundingMode.HALF_UP);
    }
    
    return getDefaultSessionFee();
}

private BigDecimal getDefaultSessionFee() {
    // 메타데이터에서 기본 세션비 조회
    String tenantId = TenantContextHolder.getTenantId();
    try {
        StatisticsDefinition definition = statisticsMetadataService
            .getStatisticsDefinition(tenantId, "DEFAULT_SESSION_FEE");
        // 통계 정의에서 기본값 조회 (또는 CommonCode에서 조회)
        return BigDecimal.valueOf(50000); // 임시 기본값
    } catch (Exception e) {
        log.warn("기본 세션비 조회 실패, 기본값 사용: 50000", e);
        return BigDecimal.valueOf(50000);
    }
}
```

### 3. CommonCode 활용

기본 세션비를 CommonCode로 관리:

```sql
-- CommonCode에 기본 세션비 추가
INSERT INTO common_codes (code_group, code, name_ko, name_en, value, display_order, is_active)
VALUES ('SYSTEM_CONFIG', 'DEFAULT_SESSION_FEE', '기본 세션비', 'Default Session Fee', '50000', 1, true);
```

### 4. 점진적 마이그레이션

1. **1단계**: 메타데이터 시스템과 기존 시스템 병행 운영
2. **2단계**: 기존 코드에 메타데이터 조회 로직 추가 (Fallback 유지)
3. **3단계**: 모든 통계가 메타데이터 기반으로 전환되면 하드코딩 제거

## 구현 예시

### StatisticsServiceImpl 수정

```java
@Autowired
private StatisticsMetadataService statisticsMetadataService;

@Autowired
private ConsultantClientMappingRepository mappingRepository;

private BigDecimal calculateRevenue(List<Schedule> schedules) {
    return schedules.stream()
        .filter(s -> ScheduleStatus.COMPLETED.equals(s.getStatus()))
        .map(this::getSessionFee)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
}

private BigDecimal getSessionFee(Schedule schedule) {
    // 1. 매핑에서 회기당 단가 조회
    if (schedule.getMappingId() != null) {
        Optional<ConsultantClientMapping> mappingOpt = 
            mappingRepository.findById(schedule.getMappingId());
        
        if (mappingOpt.isPresent()) {
            ConsultantClientMapping mapping = mappingOpt.get();
            if (mapping.getPackagePrice() != null && 
                mapping.getTotalSessions() != null && 
                mapping.getTotalSessions() > 0) {
                
                return BigDecimal.valueOf(mapping.getPackagePrice())
                    .divide(BigDecimal.valueOf(mapping.getTotalSessions()), 
                            2, RoundingMode.HALF_UP);
            }
        }
    }
    
    // 2. 메타데이터에서 기본값 조회
    return getDefaultSessionFeeFromMetadata();
}

private BigDecimal getDefaultSessionFeeFromMetadata() {
    String tenantId = TenantContextHolder.getTenantId();
    
    // CommonCode에서 조회 시도
    try {
        CommonCode defaultFee = commonCodeRepository
            .findByCodeGroupAndCode("SYSTEM_CONFIG", "DEFAULT_SESSION_FEE")
            .orElse(null);
        
        if (defaultFee != null && defaultFee.getValue() != null) {
            return new BigDecimal(defaultFee.getValue());
        }
    } catch (Exception e) {
        log.warn("기본 세션비 조회 실패", e);
    }
    
    // 최종 Fallback
    return BigDecimal.valueOf(50000);
}
```

## 체크리스트

- [ ] `StatisticsServiceImpl`에 메타데이터 서비스 주입
- [ ] `getSessionFee()` 메서드 구현
- [ ] `getDefaultSessionFeeFromMetadata()` 메서드 구현
- [ ] CommonCode에 기본 세션비 추가
- [ ] 하드코딩된 `50000` 값 제거 (3곳)
- [ ] 테스트 및 검증

## 주의사항

1. **하위 호환성**: 기존 코드가 동작하도록 Fallback 메커니즘 유지
2. **성능**: 매핑 조회 시 N+1 문제 방지 (Batch 조회 고려)
3. **데이터 무결성**: 매핑이 없는 스케줄에 대한 처리 방안 필요


