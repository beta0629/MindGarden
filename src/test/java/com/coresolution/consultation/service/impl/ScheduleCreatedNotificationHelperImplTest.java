package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ScheduleCreatedNotificationCopy;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.util.ConsultationMessageTypeCodes;
import com.coresolution.core.context.TenantContextHolder;
import java.time.LocalDate;
import java.time.LocalTime;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleCreatedNotificationHelper")
class ScheduleCreatedNotificationHelperImplTest {

    private static final String TENANT_ID = "tenant-schedule-created-notify";

    @Mock
    private ConsultationMessageService consultationMessageService;
    @Mock
    private MobilePushDispatchService mobilePushDispatchService;
    @Mock
    private CommonCodeService commonCodeService;

    @InjectMocks
    private ScheduleCreatedNotificationHelperImpl helper;

    @Captor
    private ArgumentCaptor<String> messageTypeCaptor;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        when(commonCodeService.getCodeValue("ROLE", UserRole.CONSULTANT.name())).thenReturn("CONSULTANT");
        when(commonCodeService.getCodeValue("ROLE", UserRole.CLIENT.name())).thenReturn("CLIENT");
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("BOOKED: messageType APPOINTMENT·NEW_APPOINTMENT(각 ≤20자)")
    void notifyScheduleCreated_booked_usesCanonicalMessageTypes() {
        when(commonCodeService.getCodeValue("MESSAGE_TYPE", ScheduleCreatedNotificationCopy.COMMON_CODE_KEY_CLIENT))
                .thenReturn("APPOINTMENT_CONFIRMATION");
        when(commonCodeService.getCodeValue(
                        "MESSAGE_TYPE", ScheduleCreatedNotificationCopy.COMMON_CODE_KEY_CONSULTANT))
                .thenReturn("NEW_APPOINTMENT");

        Schedule schedule = bookedSchedule();
        helper.notifyScheduleCreated(schedule, true);

        verify(consultationMessageService, org.mockito.Mockito.times(2))
                .sendMessage(
                        any(),
                        any(),
                        any(),
                        any(),
                        any(),
                        any(),
                        messageTypeCaptor.capture(),
                        eq(false),
                        eq(false));

        assertThat(messageTypeCaptor.getAllValues())
                .containsExactly(
                        ScheduleCreatedNotificationCopy.MESSAGE_TYPE_CLIENT,
                        ScheduleCreatedNotificationCopy.MESSAGE_TYPE_CONSULTANT);
        messageTypeCaptor.getAllValues().forEach(type -> assertThat(type.length())
                .isLessThanOrEqualTo(ConsultationMessageTypeCodes.MAX_MESSAGE_TYPE_LENGTH));

        verify(mobilePushDispatchService).dispatchBookingConfirmed(eq(TENANT_ID), eq(schedule), isNull());
    }

    private static Schedule bookedSchedule() {
        Schedule schedule = new Schedule();
        schedule.setId(200L);
        schedule.setTenantId(TENANT_ID);
        schedule.setConsultantId(10L);
        schedule.setClientId(20L);
        schedule.setDate(LocalDate.of(2026, 6, 1));
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(10, 50));
        schedule.setStatus(ScheduleStatus.BOOKED);
        return schedule;
    }
}
