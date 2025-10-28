# 상담사/내담자 정보 통합 관리 개선안

## 문제점

### 현재 상황
1. **중복 계산 로직**
   - 백엔드: `AdminServiceImpl.java`에서 `currentClients` 계산 (매핑 기반)
   - 프론트엔드: 여러 컴포넌트에서 각자 계산
   - 데이터 일관성 보장 어려움

2. **데이터 필드 혼선**
   - `consultant.currentClients`: 백엔드에서 계산한 값 (매핑 기반)
   - `consultant.totalClients`: DB 필드 (제대로 업데이트 안 됨)
   - 프론트엔드에서 혼동 발생

3. **재사용성 부족**
   - 여러 곳에서 동일한 계산 로직 중복 구현
   - 유지보수 어려움

## 해결 방안

### 1. 백엔드 통합 API 구현

#### API 엔드포인트
```
GET /api/admin/consultants/with-stats
- 상담사 기본 정보
- currentClients (활성 매핑 수)
- totalClients (DB 필드 업데이트 자동)
- recentMappings (최근 매핑 정보)
- statistics (통계 정보)
```

#### Service 레이어
```java
@Service
public class ConsultantStatsService {
    
    /**
     * 상담사 정보 + 통계 정보 통합 조회
     */
    public Map<String, Object> getConsultantWithStats(Long consultantId) {
        Consultant consultant = consultantRepository.findById(consultantId);
        
        // 활성 매핑 수 계산
        long currentClients = mappingRepository.countByConsultantIdAndStatusIn(
            consultantId,
            List.of(MappingStatus.ACTIVE, MappingStatus.PAYMENT_CONFIRMED)
        );
        
        // 최근 매핑 정보
        List<Mapping> recentMappings = mappingRepository
            .findByConsultantIdOrderByCreatedAtDesc(consultantId, PageRequest.of(0, 5));
        
        // 통계 정보
        Map<String, Object> stats = calculateConsultantStats(consultantId);
        
        return Map.of(
            "consultant", consultant,
            "currentClients", currentClients,
            "maxClients", consultant.getMaxClients(),
            "recentMappings", recentMappings,
            "statistics", stats
        );
    }
    
    /**
     * 상담사 목록 + 통계 정보 일괄 조회
     */
    public List<Map<String, Object>> getAllConsultantsWithStats() {
        List<Consultant> consultants = consultantRepository.findAll();
        
        return consultants.stream()
            .map(consultant -> {
                long currentClients = calculateCurrentClients(consultant.getId());
                Map<String, Object> stats = calculateConsultantStats(consultant.getId());
                
                return Map.of(
                    "consultant", consultant,
                    "currentClients", currentClients,
                    "statistics", stats
                );
            })
            .collect(Collectors.toList());
    }
    
    /**
     * 통계 정보 계산
     */
    private Map<String, Object> calculateConsultantStats(Long consultantId) {
        // 상담 완료율
        long totalSessions = scheduleRepository.countByConsultantId(consultantId);
        long completedSessions = scheduleRepository.countByConsultantIdAndStatus(consultantId, "COMPLETED");
        double completionRate = totalSessions > 0 ? (double) completedSessions / totalSessions * 100 : 0;
        
        // 평균 상담 시간
        Duration avgDuration = scheduleRepository.getAvgConsultationDuration(consultantId);
        
        return Map.of(
            "totalSessions", totalSessions,
            "completedSessions", completedSessions,
            "completionRate", Math.round(completionRate * 10.0) / 10.0,
            "averageDuration", avgDuration.toMinutes()
        );
    }
}
```

### 2. 프론트엔드 공통 유틸 함수

#### `utils/consultantHelper.js`
```javascript
/**
 * 상담사 정보 + 통계 정보 통합 조회
 */
export const getConsultantWithStats = async (consultantId) => {
    try {
        const response = await apiGet(`/api/admin/consultants/${consultantId}/with-stats`);
        if (response.success) {
            return response.data;
        }
        return null;
    } catch (error) {
        console.error('상담사 정보 조회 실패:', error);
        return null;
    }
};

/**
 * 전체 상담사 목록 + 통계 정보 조회
 */
export const getAllConsultantsWithStats = async () => {
    try {
        const response = await apiGet('/api/admin/consultants/with-stats');
        if (response.success) {
            return response.data;
        }
        return [];
    } catch (error) {
        console.error('상담사 목록 조회 실패:', error);
        return [];
    }
};

/**
 * 상담사 클라이언트 수 포맷팅
 */
export const formatConsultantClientCount = (consultant) => {
    const current = consultant.currentClients || 0;
    const max = consultant.maxClients || 0;
    
    if (max > 0) {
        return `${current}/${max}명`;
    }
    return `${current}명`;
};

/**
 * 상담사 통계 요약 정보
 */
export const getConsultantStatsSummary = (consultant) => {
    const stats = consultant.statistics || {};
    
    return {
        totalSessions: stats.totalSessions || 0,
        completedSessions: stats.completedSessions || 0,
        completionRate: stats.completionRate || 0,
        currentClients: consultant.currentClients || 0,
        maxClients: consultant.maxClients || 0
    };
};
```

### 3. 마이그레이션 전략

#### Phase 1: 백엔드 통합 API 구현
- [ ] `ConsultantStatsService` 구현
- [ ] 통합 API 엔드포인트 추가
- [ ] 기존 API 호환성 유지

#### Phase 2: 프론트엔드 공통 함수 구현
- [ ] `consultantHelper.js` 생성
- [ ] 기존 컴포넌트에서 공통 함수 사용하도록 전환
- [ ] 데이터 구조 표준화

#### Phase 3: 점진적 마이그레이션
- [ ] `ConsultantComprehensiveManagement.js` 마이그레이션
- [ ] `ConsultantCard.js` 마이그레이션
- [ ] 기타 관련 컴포넌트 마이그레이션

#### Phase 4: 정리 및 최적화
- [ ] 레거시 코드 제거
- [ ] 성능 최적화
- [ ] 문서화

### 4. 예상 효과

#### 일관성
- ✅ 모든 곳에서 동일한 데이터 구조 사용
- ✅ 계산 로직 중복 제거
- ✅ 데이터 불일치 방지

#### 유지보수성
- ✅ 한 곳에서 관리
- ✅ 로직 변경 시 한 곳만 수정
- ✅ 버그 수정 용이

#### 성능
- ✅ 중복 API 호출 제거
- ✅ 캐싱 가능
- ✅ 데이터베이스 쿼리 최적화

## 구현 우선순위

1. **높음**: 백작업 데이터 일관성 문제 해결
2. **중간**: 프론트엔드 중복 코드 제거
3. **낮음**: 성능 최적화 (필요시)

## 참고 사항

- 기존 API와의 호환성 유지 필수
- 점진적 마이그레이션으로 안전성 확보
- 인라인 스타일 작업 완료 후 진행

