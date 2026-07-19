package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * STAFF·ADMIN 테넌트 전체 스케줄 조회 범위 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-05-18
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl STAFF·ADMIN 스케줄 조회 범위")
class ScheduleServiceImplAdminStaffScheduleScopeTest {

    @Mock
    private CommonCodeService commonCodeService;

    @Mock
    private ScheduleChangeNotificationDebounceService scheduleChangeNotificationDebounceService;
    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    @Test
    @DisplayName("STAFF는 테넌트 전체 스케줄 조회 권한을 가진다")
    void scheduleAdminSeesAllTenant_staffRole_returnsTrue() {
        boolean seesAll = Boolean.TRUE.equals(
                ReflectionTestUtils.invokeMethod(
                        scheduleService, "scheduleAdminSeesAllTenant", 99L, "STAFF"));

        assertTrue(seesAll);
    }

    @Test
    @DisplayName("ADMIN(상담 본인 일정만 아님)은 테넌트 전체 스케줄 조회 권한을 가진다")
    void scheduleAdminSeesAllTenant_adminRole_returnsTrue() {
        boolean seesAll = Boolean.TRUE.equals(
                ReflectionTestUtils.invokeMethod(
                        scheduleService, "scheduleAdminSeesAllTenant", 1L, "ADMIN"));

        assertTrue(seesAll);
    }

    @Test
    @DisplayName("CLIENT는 테넌트 전체 스케줄 조회 권한이 없다")
    void scheduleAdminSeesAllTenant_clientRole_returnsFalse() {
        boolean seesAll = Boolean.TRUE.equals(
                ReflectionTestUtils.invokeMethod(
                        scheduleService, "scheduleAdminSeesAllTenant", 2L, "CLIENT"));

        assertFalse(seesAll);
    }

    @Test
    @DisplayName("matchesClientScheduleRole은 CLIENT 및 공통코드 별칭을 대소문자 무시하고 허용한다")
    void matchesClientScheduleRole_clientVariants_returnsTrue() {
        when(commonCodeService.getCodeValue("ROLE", "CLIENT")).thenReturn("ROLE_CLIENT");

        assertTrue(Boolean.TRUE.equals(
                ReflectionTestUtils.invokeMethod(
                        scheduleService, "matchesClientScheduleRole", "CLIENT")));
        assertTrue(Boolean.TRUE.equals(
                ReflectionTestUtils.invokeMethod(
                        scheduleService, "matchesClientScheduleRole", "client")));
        assertTrue(Boolean.TRUE.equals(
                ReflectionTestUtils.invokeMethod(
                        scheduleService, "matchesClientScheduleRole", "ROLE_CLIENT")));
        assertTrue(Boolean.TRUE.equals(
                ReflectionTestUtils.invokeMethod(
                        scheduleService, "matchesClientScheduleRole", "role_client")));
        assertFalse(Boolean.TRUE.equals(
                ReflectionTestUtils.invokeMethod(
                        scheduleService, "matchesClientScheduleRole", "CONSULTANT")));
    }
}
