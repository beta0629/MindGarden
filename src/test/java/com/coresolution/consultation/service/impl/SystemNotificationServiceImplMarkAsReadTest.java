package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.entity.SystemNotification;
import com.coresolution.consultation.entity.SystemNotificationRead;
import com.coresolution.consultation.repository.SystemNotificationReadRepository;
import com.coresolution.consultation.repository.SystemNotificationRepository;
import com.coresolution.core.context.TenantContextHolder;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

/**
 * {@link SystemNotificationServiceImpl#markAsRead} 테넌트 finder·tenantId·UK 멱등 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-10-21
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SystemNotificationServiceImpl — markAsRead")
class SystemNotificationServiceImplMarkAsReadTest {

    private static final String TENANT_ID = "tenant-incheon-counseling-002";
    private static final Long NOTIFICATION_ID = 42L;
    private static final Long USER_ID = 7L;
    private static final String USER_ROLE = "CLIENT";

    @Mock
    private SystemNotificationRepository systemNotificationRepository;

    @Mock
    private SystemNotificationReadRepository systemNotificationReadRepository;

    @InjectMocks
    private SystemNotificationServiceImpl systemNotificationService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        stubVisibleNotification();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("tenant finder 사용 — deprecated finder never, tenant finder 호출")
    void markAsRead_usesTenantScopedFinder() {
        when(systemNotificationReadRepository.findByTenantIdAndNotificationIdAndUserId(
                TENANT_ID, NOTIFICATION_ID, USER_ID))
            .thenReturn(Optional.empty());
        when(systemNotificationReadRepository.saveAndFlush(any(SystemNotificationRead.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        systemNotificationService.markAsRead(NOTIFICATION_ID, USER_ID, USER_ROLE);

        verify(systemNotificationReadRepository).findByTenantIdAndNotificationIdAndUserId(
            TENANT_ID, NOTIFICATION_ID, USER_ID);
        verify(systemNotificationReadRepository, never())
            .findByNotificationIdAndUserId(anyLong(), anyLong());
    }

    @Test
    @DisplayName("신규 읽음 행에 TenantContext tenantId 설정")
    void markAsRead_newRow_setsTenantIdFromContext() {
        when(systemNotificationReadRepository.findByTenantIdAndNotificationIdAndUserId(
                TENANT_ID, NOTIFICATION_ID, USER_ID))
            .thenReturn(Optional.empty());
        when(systemNotificationReadRepository.saveAndFlush(any(SystemNotificationRead.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        systemNotificationService.markAsRead(NOTIFICATION_ID, USER_ID, USER_ROLE);

        ArgumentCaptor<SystemNotificationRead> captor =
            ArgumentCaptor.forClass(SystemNotificationRead.class);
        verify(systemNotificationReadRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getTenantId()).isEqualTo(TENANT_ID);
        assertThat(captor.getValue().getNotificationId()).isEqualTo(NOTIFICATION_ID);
        assertThat(captor.getValue().getUserId()).isEqualTo(USER_ID);
        assertThat(captor.getValue().getIsRead()).isTrue();
    }

    @Test
    @DisplayName("UK 충돌 멱등 — saveAndFlush DIV 후 재조회로 성공, 예외 미전파")
    void markAsRead_ukCollision_isIdempotent() {
        SystemNotificationRead racedRow = new SystemNotificationRead();
        racedRow.setTenantId(TENANT_ID);
        racedRow.setNotificationId(NOTIFICATION_ID);
        racedRow.setUserId(USER_ID);
        racedRow.markAsRead();

        when(systemNotificationReadRepository.findByTenantIdAndNotificationIdAndUserId(
                TENANT_ID, NOTIFICATION_ID, USER_ID))
            .thenReturn(Optional.empty())
            .thenReturn(Optional.of(racedRow));
        when(systemNotificationReadRepository.saveAndFlush(any(SystemNotificationRead.class)))
            .thenThrow(new DataIntegrityViolationException("Duplicate entry uk"));

        assertThatCode(() ->
            systemNotificationService.markAsRead(NOTIFICATION_ID, USER_ID, USER_ROLE))
            .doesNotThrowAnyException();

        verify(systemNotificationReadRepository, times(1))
            .saveAndFlush(any(SystemNotificationRead.class));
        verify(systemNotificationReadRepository, times(2))
            .findByTenantIdAndNotificationIdAndUserId(TENANT_ID, NOTIFICATION_ID, USER_ID);
        verify(systemNotificationReadRepository, never()).save(any(SystemNotificationRead.class));
    }

    @Test
    @DisplayName("UK 충돌 후 재조회도 없으면 DataIntegrityViolationException 재전파")
    void markAsRead_ukCollision_withoutRow_rethrows() {
        when(systemNotificationReadRepository.findByTenantIdAndNotificationIdAndUserId(
                TENANT_ID, NOTIFICATION_ID, USER_ID))
            .thenReturn(Optional.empty());
        when(systemNotificationReadRepository.saveAndFlush(any(SystemNotificationRead.class)))
            .thenThrow(new DataIntegrityViolationException("Duplicate entry uk"));

        assertThatThrownBy(() ->
            systemNotificationService.markAsRead(NOTIFICATION_ID, USER_ID, USER_ROLE))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("동시성 — 두 스레드가 동시에 markAsRead, 성공 insert 1회·둘 다 예외 없이 완료")
    void markAsRead_concurrentRace_bothCompleteIdempotently() throws Exception {
        AtomicInteger findEmptyCount = new AtomicInteger(0);
        AtomicInteger saveCalls = new AtomicInteger(0);
        SystemNotificationRead inserted = new SystemNotificationRead();
        inserted.setId(1L);
        inserted.setTenantId(TENANT_ID);
        inserted.setNotificationId(NOTIFICATION_ID);
        inserted.setUserId(USER_ID);
        inserted.markAsRead();

        when(systemNotificationReadRepository.findByTenantIdAndNotificationIdAndUserId(
                eq(TENANT_ID), eq(NOTIFICATION_ID), eq(USER_ID)))
            .thenAnswer(invocation -> {
                // 첫 두 번의 선조회(스레드당 1회)는 empty → 레이스. 이후는 present(충돌 재조회).
                if (findEmptyCount.getAndIncrement() < 2) {
                    return Optional.empty();
                }
                return Optional.of(inserted);
            });
        when(systemNotificationReadRepository.saveAndFlush(any(SystemNotificationRead.class)))
            .thenAnswer(invocation -> {
                int n = saveCalls.incrementAndGet();
                if (n == 1) {
                    return invocation.getArgument(0);
                }
                throw new DataIntegrityViolationException("Duplicate entry uk");
            });

        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<?> first = pool.submit(() -> {
                await(start);
                TenantContextHolder.setTenantId(TENANT_ID);
                try {
                    systemNotificationService.markAsRead(NOTIFICATION_ID, USER_ID, USER_ROLE);
                } finally {
                    TenantContextHolder.clear();
                }
            });
            Future<?> second = pool.submit(() -> {
                await(start);
                TenantContextHolder.setTenantId(TENANT_ID);
                try {
                    systemNotificationService.markAsRead(NOTIFICATION_ID, USER_ID, USER_ROLE);
                } finally {
                    TenantContextHolder.clear();
                }
            });
            start.countDown();

            assertThatCode(() -> {
                first.get(5, TimeUnit.SECONDS);
                second.get(5, TimeUnit.SECONDS);
            }).doesNotThrowAnyException();
        } finally {
            pool.shutdownNow();
        }

        assertThat(saveCalls.get()).isEqualTo(2);
        verify(systemNotificationReadRepository, times(2))
            .saveAndFlush(any(SystemNotificationRead.class));
        // 선조회 2 + 충돌 스레드 재조회 1
        verify(systemNotificationReadRepository, times(3))
            .findByTenantIdAndNotificationIdAndUserId(TENANT_ID, NOTIFICATION_ID, USER_ID);
    }

    @Test
    @DisplayName("markAllAsRead — 헬퍼로 신규 행 tenantId 설정 회귀")
    void markAllAsRead_newRows_setTenantIdViaHelper() {
        when(systemNotificationRepository.findUnreadNotificationIdsByTenantIdAndUser(
                eq(TENANT_ID), eq(USER_ID), any()))
            .thenReturn(List.of(NOTIFICATION_ID));
        when(systemNotificationReadRepository.findByTenantIdAndNotificationIdAndUserId(
                TENANT_ID, NOTIFICATION_ID, USER_ID))
            .thenReturn(Optional.empty());
        when(systemNotificationReadRepository.saveAll(any()))
            .thenAnswer(invocation -> invocation.getArgument(0));

        systemNotificationService.markAllAsRead(USER_ID, USER_ROLE);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<SystemNotificationRead>> captor = ArgumentCaptor.forClass(List.class);
        verify(systemNotificationReadRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(1);
        assertThat(captor.getValue().get(0).getTenantId()).isEqualTo(TENANT_ID);
        assertThat(captor.getValue().get(0).getNotificationId()).isEqualTo(NOTIFICATION_ID);
        assertThat(captor.getValue().get(0).getUserId()).isEqualTo(USER_ID);
        assertThat(captor.getValue().get(0).getIsRead()).isTrue();
    }

    private void stubVisibleNotification() {
        SystemNotification visible = new SystemNotification();
        visible.setId(NOTIFICATION_ID);
        visible.setTenantId(TENANT_ID);
        visible.setTargetType("ALL");
        visible.setIsDeleted(false);
        // markAllAsRead 등 가시성 stub 미사용 테스트와 공유
        lenient().when(systemNotificationRepository.findByTenantIdAndId(TENANT_ID, NOTIFICATION_ID))
            .thenReturn(Optional.of(visible));
    }

    private static void await(CountDownLatch latch) {
        try {
            if (!latch.await(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("start latch timeout");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(e);
        }
    }
}
