package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.config.ScheduleChangeNotificationProperties;
import com.coresolution.consultation.constant.ScheduleChangeNotificationPendingStatus;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Consultant;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.ScheduleChangeNotificationPending;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ScheduleChangeNotificationPendingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.core.context.TenantContextHolder;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link ScheduleChangeNotificationDebounceServiceImpl} 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-07-19
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleChangeNotificationDebounceServiceImpl")
class ScheduleChangeNotificationDebounceServiceImplTest {

    private static final String TENANT_ID = "tenant-debounce-001";
    private static final Long SCHEDULE_ID = 501L;
    private static final Long CLIENT_ID = 11L;
    private static final Long CONSULTANT_ID = 22L;
    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");
    private static final Instant FIXED_INSTANT = Instant.parse("2026-07-19T03:00:00Z");

    @Mock
    private ScheduleChangeNotificationPendingRepository pendingRepository;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ConsultantRepository consultantRepository;
    @Mock
    private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock
    private NotificationService notificationService;

    private ScheduleChangeNotificationProperties properties;
    private Clock clock;
    private ScheduleChangeNotificationDebounceServiceImpl service;

    @BeforeEach
    void setUp() {
        properties = new ScheduleChangeNotificationProperties();
        properties.setDebounceMinutes(10);
        clock = Clock.fixed(FIXED_INSTANT, ZONE);
        service = new ScheduleChangeNotificationDebounceServiceImpl(
                pendingRepository,
                scheduleRepository,
                userRepository,
                consultantRepository,
                userPersonalDataCacheService,
                notificationService,
                properties,
                clock);
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private Schedule scheduleAt(LocalDate date, LocalTime start, LocalTime end) {
        Schedule s = new Schedule();
        s.setId(SCHEDULE_ID);
        s.setTenantId(TENANT_ID);
        s.setClientId(CLIENT_ID);
        s.setConsultantId(CONSULTANT_ID);
        s.setStatus(ScheduleStatus.CONFIRMED);
        s.setDate(date);
        s.setStartTime(start);
        s.setEndTime(end);
        return s;
    }

    @Test
    @DisplayName("enqueue: PENDING 없으면 신규 fire_at=now+debounce")
    void enqueue_createsPendingWithFireAt() {
        Schedule schedule = scheduleAt(LocalDate.of(2026, 5, 21), LocalTime.of(14, 0), LocalTime.of(15, 0));
        when(pendingRepository.existsByTenantIdAndScheduleIdAndSlotVersionAndStatusAndIsDeletedFalse(
                        any(), any(), any(), eq(ScheduleChangeNotificationPendingStatus.SENT)))
                .thenReturn(false);
        when(pendingRepository.findFirstByTenantIdAndScheduleIdAndStatusAndIsDeletedFalse(
                        eq(TENANT_ID), eq(SCHEDULE_ID), eq(ScheduleChangeNotificationPendingStatus.PENDING)))
                .thenReturn(Optional.empty());
        when(pendingRepository.save(any(ScheduleChangeNotificationPending.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        service.enqueueScheduleChanged(
                TENANT_ID, schedule, LocalDate.of(2026, 5, 20), LocalTime.of(10, 0));

        ArgumentCaptor<ScheduleChangeNotificationPending> captor =
                ArgumentCaptor.forClass(ScheduleChangeNotificationPending.class);
        verify(pendingRepository).save(captor.capture());
        ScheduleChangeNotificationPending saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(ScheduleChangeNotificationPendingStatus.PENDING);
        assertThat(saved.getFireAt()).isEqualTo(LocalDateTime.now(clock).plusMinutes(10));
        assertThat(saved.getPreviousDate()).isEqualTo(LocalDate.of(2026, 5, 20));
        assertThat(saved.getPreviousStartTime()).isEqualTo(LocalTime.of(10, 0));
        assertThat(saved.getSlotVersion()).isEqualTo("2026-05-21|14:00|15:00");
    }

    @Test
    @DisplayName("enqueue: 기존 PENDING 있으면 fire_at 연장·slotVersion 갱신·previous 유지")
    void enqueue_extendsFireAtOnRechange() {
        Schedule schedule = scheduleAt(LocalDate.of(2026, 5, 22), LocalTime.of(16, 0), LocalTime.of(17, 0));
        ScheduleChangeNotificationPending existing = ScheduleChangeNotificationPending.builder()
                .tenantId(TENANT_ID)
                .scheduleId(SCHEDULE_ID)
                .fireAt(LocalDateTime.now(clock).plusMinutes(3))
                .previousDate(LocalDate.of(2026, 5, 20))
                .previousStartTime(LocalTime.of(10, 0))
                .slotVersion("2026-05-21|14:00|15:00")
                .status(ScheduleChangeNotificationPendingStatus.PENDING)
                .build();
        existing.setId(77L);

        when(pendingRepository.existsByTenantIdAndScheduleIdAndSlotVersionAndStatusAndIsDeletedFalse(
                        any(), any(), any(), eq(ScheduleChangeNotificationPendingStatus.SENT)))
                .thenReturn(false);
        when(pendingRepository.findFirstByTenantIdAndScheduleIdAndStatusAndIsDeletedFalse(
                        eq(TENANT_ID), eq(SCHEDULE_ID), eq(ScheduleChangeNotificationPendingStatus.PENDING)))
                .thenReturn(Optional.of(existing));
        when(pendingRepository.save(any(ScheduleChangeNotificationPending.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        service.enqueueScheduleChanged(
                TENANT_ID, schedule, LocalDate.of(2026, 5, 21), LocalTime.of(14, 0));

        assertThat(existing.getFireAt()).isEqualTo(LocalDateTime.now(clock).plusMinutes(10));
        assertThat(existing.getPreviousDate()).isEqualTo(LocalDate.of(2026, 5, 20));
        assertThat(existing.getSlotVersion()).isEqualTo("2026-05-22|16:00|17:00");
        verify(pendingRepository).save(existing);
    }

    @Test
    @DisplayName("processDue: fire_at 경과 시 최신 슬롯으로 sendScheduleChanged 1회")
    void processDue_sendsOnceWithLatestSlot() {
        ScheduleChangeNotificationPending pending = ScheduleChangeNotificationPending.builder()
                .tenantId(TENANT_ID)
                .scheduleId(SCHEDULE_ID)
                .fireAt(LocalDateTime.now(clock).minusMinutes(1))
                .previousDate(LocalDate.of(2026, 5, 20))
                .previousStartTime(LocalTime.of(10, 0))
                .slotVersion("2026-05-21|14:00|15:00")
                .status(ScheduleChangeNotificationPendingStatus.PENDING)
                .build();
        pending.setId(1L);

        Schedule latest = scheduleAt(LocalDate.of(2026, 5, 22), LocalTime.of(16, 0), LocalTime.of(17, 0));
        User client = new User();
        client.setId(CLIENT_ID);
        client.setTenantId(TENANT_ID);
        Consultant consultant = new Consultant();
        consultant.setId(CONSULTANT_ID);
        consultant.setTenantId(TENANT_ID);
        consultant.setName("조재은");

        when(pendingRepository.findDuePending(
                        eq(ScheduleChangeNotificationPendingStatus.PENDING), any(LocalDateTime.class)))
                .thenReturn(List.of(pending));
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID))
                .thenReturn(Optional.of(latest));
        when(pendingRepository.existsByTenantIdAndScheduleIdAndSlotVersionAndStatusAndIsDeletedFalse(
                        eq(TENANT_ID),
                        eq(SCHEDULE_ID),
                        eq("2026-05-22|16:00|17:00"),
                        eq(ScheduleChangeNotificationPendingStatus.SENT)))
                .thenReturn(false);
        when(userRepository.findByTenantIdAndId(TENANT_ID, CLIENT_ID)).thenReturn(Optional.of(client));
        when(consultantRepository.findByTenantIdAndId(TENANT_ID, CONSULTANT_ID))
                .thenReturn(Optional.of(consultant));
        when(pendingRepository.save(any(ScheduleChangeNotificationPending.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        int processed = service.processDuePending();

        assertThat(processed).isEqualTo(1);
        verify(notificationService).sendScheduleChanged(
                eq(client), any(), eq("2026-05-20 10:00"), eq("2026-05-22 16:00"));
        assertThat(pending.getStatus()).isEqualTo(ScheduleChangeNotificationPendingStatus.SENT);
        assertThat(pending.getSlotVersion()).isEqualTo("2026-05-22|16:00|17:00");
    }

    @Test
    @DisplayName("processDue: CANCELLED 이면 send 스킵")
    void processDue_skipsWhenCancelled() {
        ScheduleChangeNotificationPending pending = ScheduleChangeNotificationPending.builder()
                .tenantId(TENANT_ID)
                .scheduleId(SCHEDULE_ID)
                .fireAt(LocalDateTime.now(clock).minusMinutes(1))
                .previousDate(LocalDate.of(2026, 5, 20))
                .previousStartTime(LocalTime.of(10, 0))
                .slotVersion("2026-05-21|14:00|15:00")
                .status(ScheduleChangeNotificationPendingStatus.PENDING)
                .build();
        pending.setId(2L);

        Schedule cancelled = scheduleAt(LocalDate.of(2026, 5, 21), LocalTime.of(14, 0), LocalTime.of(15, 0));
        cancelled.setStatus(ScheduleStatus.CANCELLED);

        when(pendingRepository.findDuePending(
                        eq(ScheduleChangeNotificationPendingStatus.PENDING), any(LocalDateTime.class)))
                .thenReturn(List.of(pending));
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID))
                .thenReturn(Optional.of(cancelled));
        when(pendingRepository.save(any(ScheduleChangeNotificationPending.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        int processed = service.processDuePending();

        assertThat(processed).isEqualTo(1);
        verify(notificationService, never()).sendScheduleChanged(any(), any(), any(), any());
        assertThat(pending.getStatus()).isEqualTo(ScheduleChangeNotificationPendingStatus.SKIPPED_CANCELLED);
    }

    @Test
    @DisplayName("processDue: 동일 slotVersion SENT 있으면 SKIPPED_DUPLICATE")
    void processDue_skipsDuplicateSlotVersion() {
        ScheduleChangeNotificationPending pending = ScheduleChangeNotificationPending.builder()
                .tenantId(TENANT_ID)
                .scheduleId(SCHEDULE_ID)
                .fireAt(LocalDateTime.now(clock).minusMinutes(1))
                .previousDate(LocalDate.of(2026, 5, 20))
                .previousStartTime(LocalTime.of(10, 0))
                .slotVersion("2026-05-21|14:00|15:00")
                .status(ScheduleChangeNotificationPendingStatus.PENDING)
                .build();
        pending.setId(3L);

        Schedule latest = scheduleAt(LocalDate.of(2026, 5, 21), LocalTime.of(14, 0), LocalTime.of(15, 0));

        when(pendingRepository.findDuePending(
                        eq(ScheduleChangeNotificationPendingStatus.PENDING), any(LocalDateTime.class)))
                .thenReturn(List.of(pending));
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID))
                .thenReturn(Optional.of(latest));
        when(pendingRepository.existsByTenantIdAndScheduleIdAndSlotVersionAndStatusAndIsDeletedFalse(
                        eq(TENANT_ID),
                        eq(SCHEDULE_ID),
                        eq("2026-05-21|14:00|15:00"),
                        eq(ScheduleChangeNotificationPendingStatus.SENT)))
                .thenReturn(true);
        when(pendingRepository.save(any(ScheduleChangeNotificationPending.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        int processed = service.processDuePending();

        assertThat(processed).isEqualTo(1);
        verify(notificationService, never()).sendScheduleChanged(any(), any(), any(), any());
        assertThat(pending.getStatus()).isEqualTo(ScheduleChangeNotificationPendingStatus.SKIPPED_DUPLICATE);
    }
}
