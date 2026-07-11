package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.entity.MobilePushDispatchDedup;
import com.coresolution.consultation.repository.MobilePushDispatchDedupRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

/**
 * {@link MobilePushDispatchDedupServiceImpl#tryClaim} 멱등·충돌 처리 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-07-11
 */
@ExtendWith(MockitoExtension.class)
class MobilePushDispatchDedupServiceImplTest {

    private static final String TENANT_ID = "tenant-a";
    private static final String PUSH_TYPE = "BOOKING_REMINDER";
    private static final String ENTITY_ID = "schedule-100";
    private static final String TIME_BUCKET = "2026-07-11T14";

    @Mock
    private MobilePushDispatchDedupRepository mobilePushDispatchDedupRepository;

    @InjectMocks
    private MobilePushDispatchDedupServiceImpl mobilePushDispatchDedupService;

    @Test
    @DisplayName("동일 키 이중 tryClaim: 첫 호출 true, 두 번째 false, rollback 예외 없음")
    void tryClaim_duplicateKey_returnsFalseWithoutPropagatingRollback() {
        when(mobilePushDispatchDedupRepository.existsByTenantIdAndPushTypeAndEntityIdAndTimeBucket(
                eq(TENANT_ID), eq(PUSH_TYPE), eq(ENTITY_ID), eq(TIME_BUCKET)))
                .thenReturn(false)
                .thenReturn(true);
        when(mobilePushDispatchDedupRepository.save(any(MobilePushDispatchDedup.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        assertThatCode(() -> {
            boolean first = mobilePushDispatchDedupService.tryClaim(
                    TENANT_ID, PUSH_TYPE, ENTITY_ID, TIME_BUCKET);
            boolean second = mobilePushDispatchDedupService.tryClaim(
                    TENANT_ID, PUSH_TYPE, ENTITY_ID, TIME_BUCKET);
            assertThat(first).isTrue();
            assertThat(second).isFalse();
        }).doesNotThrowAnyException();

        verify(mobilePushDispatchDedupRepository, times(1)).save(any(MobilePushDispatchDedup.class));
        verify(mobilePushDispatchDedupRepository, times(2))
                .existsByTenantIdAndPushTypeAndEntityIdAndTimeBucket(
                        TENANT_ID, PUSH_TYPE, ENTITY_ID, TIME_BUCKET);
    }

    @Test
    @DisplayName("동시성 레이스: save 시 DataIntegrityViolation → false만 반환, 예외 미전파")
    void tryClaim_dataIntegrityViolation_returnsFalseWithoutThrowing() {
        when(mobilePushDispatchDedupRepository.existsByTenantIdAndPushTypeAndEntityIdAndTimeBucket(
                eq(TENANT_ID), eq(PUSH_TYPE), eq(ENTITY_ID), eq(TIME_BUCKET)))
                .thenReturn(false);
        when(mobilePushDispatchDedupRepository.save(any(MobilePushDispatchDedup.class)))
                .thenThrow(new DataIntegrityViolationException("Duplicate entry uk_mpd_dedup"));

        assertThatCode(() -> {
            boolean claimed = mobilePushDispatchDedupService.tryClaim(
                    TENANT_ID, PUSH_TYPE, ENTITY_ID, TIME_BUCKET);
            assertThat(claimed).isFalse();
        }).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("필수 인자 누락 시 false, 저장소 미호출")
    void tryClaim_missingArgs_returnsFalseWithoutRepositoryCall() {
        assertThat(mobilePushDispatchDedupService.tryClaim(" ", PUSH_TYPE, ENTITY_ID, TIME_BUCKET))
                .isFalse();
        verify(mobilePushDispatchDedupRepository, never())
                .existsByTenantIdAndPushTypeAndEntityIdAndTimeBucket(
                        anyString(), anyString(), anyString(), anyString());
        verify(mobilePushDispatchDedupRepository, never()).save(any());
    }
}
