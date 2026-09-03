package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.coresolution.consultation.entity.Consultant;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link ConsultantStatsServiceImpl#getAllConsultantsWithStatsByTenant(String)} 배치 집계 parity 검증.
 *
 * <p>요구사항:
 * <ul>
 *   <li>상담사별 currentClients (매칭 count 의미)</li>
 *   <li>상담사별 매칭 count (baseline 동일 계산)</li>
 *   <li>평가 통계/스케줄 통계 (with-stats statistics 필드)</li>
 * </ul>
 * </p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConsultantStatsServiceImpl — getAllConsultantsWithStatsByTenant parity")
class ConsultantStatsServiceImplGetAllConsultantsWithStatsByTenantParityTest {

    private static final String TENANT_ID = "tenant-consultant-stats-parity-test";

    @Mock
    private ConsultantRepository consultantRepository;

    @Mock
    private ConsultantClientMappingRepository mappingRepository;

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private ConsultantRatingService consultantRatingService;

    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;

    @InjectMocks
    private ConsultantStatsServiceImpl consultantStatsService;

    @Test
    @DisplayName("baseline(루프/개별 조회) vs 배치 결과 숫자 동일성")
    void getAllConsultantsWithStatsByTenant_parityWithBatchAggregation() {
        Consultant c1 = new Consultant();
        c1.setId(1L);
        c1.setIsActive(true);
        c1.setIsDeleted(false);
        c1.setMaxClients(5);
        c1.setTotalClients(12);

        Consultant c2 = new Consultant();
        c2.setId(2L);
        c2.setIsActive(true);
        c2.setIsDeleted(false);
        c2.setMaxClients(8);
        c2.setTotalClients(20);

        when(consultantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Arrays.asList(c1, c2));

        List<ConsultantClientMapping.MappingStatus> currentStatuses = Arrays.asList(
                ConsultantClientMapping.MappingStatus.ACTIVE,
                ConsultantClientMapping.MappingStatus.PAYMENT_CONFIRMED
        );

        // ---- baseline stubs (기존 per-consultant 조회 의미) ----
        when(mappingRepository.countByConsultantIdAndStatusIn(TENANT_ID, 1L, currentStatuses))
                .thenReturn(3L);
        when(mappingRepository.countByConsultantIdAndStatusIn(TENANT_ID, 2L, currentStatuses))
                .thenReturn(0L);

        when(scheduleRepository.countByConsultantId(TENANT_ID, 1L))
                .thenReturn(10L);
        when(scheduleRepository.countByConsultantId(TENANT_ID, 2L))
                .thenReturn(0L);

        Map<String, Object> ratingStats1 = new HashMap<>();
        ratingStats1.put("averageHeartScore", 4.2);
        ratingStats1.put("totalRatingCount", 7L);
        when(consultantRatingService.getConsultantRatingStats(1L))
                .thenReturn(ratingStats1);

        Map<String, Object> ratingStats2 = new HashMap<>();
        ratingStats2.put("averageHeartScore", 0.0);
        ratingStats2.put("totalRatingCount", 0L);
        when(consultantRatingService.getConsultantRatingStats(2L))
                .thenReturn(ratingStats2);

        // ---- batch stubs (새 배치 group-by 결과) ----
        when(mappingRepository.countCurrentClientsByConsultantIdsAndStatusIn(
                eq(TENANT_ID),
                anyList(),
                anyList()))
                .thenReturn(Arrays.asList(
                        new Object[] { 1L, 3L },
                        new Object[] { 2L, 0L }
                ));

        when(scheduleRepository.countSchedulesByConsultantIds(eq(TENANT_ID), anyList()))
                .thenReturn(Arrays.asList(
                        new Object[] { 1L, 10L },
                        new Object[] { 2L, 0L }
                ));

        Map<Long, Map<String, Object>> batchRatings = new HashMap<>();
        batchRatings.put(1L, ratingStats1);
        batchRatings.put(2L, ratingStats2);
        when(consultantRatingService.getConsultantRatingStatsByConsultantIds(anyList()))
                .thenReturn(batchRatings);

        // ---- baseline 계산 (이전 루프/개별 조회 방식 재현) ----
        Map<Long, Map<String, Object>> expectedByConsultantId = new HashMap<>();
        for (Long consultantId : Arrays.asList(1L, 2L)) {
            long expectedCurrentClients = mappingRepository.countByConsultantIdAndStatusIn(
                    TENANT_ID,
                    consultantId,
                    currentStatuses
            );

            long expectedTotalSessions = scheduleRepository.countByConsultantId(TENANT_ID, consultantId);
            long expectedCompletedSessions = scheduleRepository.countByConsultantId(TENANT_ID, consultantId);

            double completionRate = expectedTotalSessions > 0
                    ? (double) expectedCompletedSessions / expectedTotalSessions * 100
                    : 0;
            double expectedCompletionRate = Math.round(completionRate * 10.0) / 10.0;

            Map<String, Object> rating = consultantRatingService.getConsultantRatingStats(consultantId);
            double expectedAverageRating = rating != null
                    ? ((Number) rating.getOrDefault("averageHeartScore", 0.0)).doubleValue()
                    : 0.0;
            long expectedTotalRatings = rating != null
                    ? ((Number) rating.getOrDefault("totalRatingCount", 0L)).longValue()
                    : 0L;

            Map<String, Object> expected = new HashMap<>();
            expected.put("currentClients", expectedCurrentClients);
            expected.put("totalSessions", expectedTotalSessions);
            expected.put("completedSessions", expectedCompletedSessions);
            expected.put("completionRate", expectedCompletionRate);
            expected.put("averageRating", expectedAverageRating);
            expected.put("totalRatings", expectedTotalRatings);

            expectedByConsultantId.put(consultantId, expected);
        }

        // ---- 새 배치 방식 호출 ----
        List<Map<String, Object>> actual = consultantStatsService.getAllConsultantsWithStatsByTenant(TENANT_ID);
        assertThat(actual).hasSize(2);

        for (Map<String, Object> item : actual) {
            Map<String, Object> consultantMap = (Map<String, Object>) item.get("consultant");
            Long consultantId = ((Number) consultantMap.get("id")).longValue();

            Map<String, Object> expected = expectedByConsultantId.get(consultantId);
            assertThat(expected).isNotNull();

            assertThat(((Number) item.get("currentClients")).longValue())
                    .isEqualTo(((Number) expected.get("currentClients")).longValue());

            Map<String, Object> stats = (Map<String, Object>) item.get("statistics");
            assertThat(((Number) stats.get("totalSessions")).longValue())
                    .isEqualTo(((Number) expected.get("totalSessions")).longValue());
            assertThat(((Number) stats.get("completedSessions")).longValue())
                    .isEqualTo(((Number) expected.get("completedSessions")).longValue());
            assertThat(((Number) stats.get("completionRate")).doubleValue())
                    .isEqualTo((double) expected.get("completionRate"));
            assertThat(((Number) stats.get("averageRating")).doubleValue())
                    .isEqualTo((double) expected.get("averageRating"));
            assertThat(((Number) stats.get("totalRatings")).longValue())
                    .isEqualTo(((Number) expected.get("totalRatings")).longValue());
        }
    }
}

