package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.entity.SystemNotification;
import com.coresolution.consultation.repository.SystemNotificationReadRepository;
import com.coresolution.consultation.repository.SystemNotificationRepository;
import com.coresolution.core.context.TenantContextHolder;
import java.util.Collections;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

/**
 * {@link SystemNotificationServiceImpl} 테넌트 격리 검증.
 *
 * @author CoreSolution
 * @since 2026-06-26
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SystemNotificationServiceImpl — 테넌트 격리")
class SystemNotificationServiceImplTenantScopeTest {

    private static final String TENANT_001 = "tenant-incheon-counseling-001";
    private static final String TENANT_002 = "tenant-incheon-counseling-002";

    @Mock
    private SystemNotificationRepository systemNotificationRepository;

    @Mock
    private SystemNotificationReadRepository systemNotificationReadRepository;

    @InjectMocks
    private SystemNotificationServiceImpl systemNotificationService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_002);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("getAllNotificationsForAdmin: 현재 테넌트 ID로 findAllForAdminByTenantId 호출")
    void getAllNotificationsForAdmin_usesTenantScopedRepository() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<SystemNotification> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);
        when(systemNotificationRepository.findAllForAdminByTenantId(
                eq(TENANT_002), isNull(), isNull(), eq(pageable)))
            .thenReturn(emptyPage);

        Page<SystemNotification> result =
            systemNotificationService.getAllNotificationsForAdmin(null, null, pageable);

        assertThat(result.getTotalElements()).isZero();
        verify(systemNotificationRepository).findAllForAdminByTenantId(
            eq(TENANT_002), isNull(), isNull(), eq(pageable));
        verify(systemNotificationRepository, never()).findAllForAdmin(any(), any(), any());
    }

    @Test
    @DisplayName("getAllNotificationsForAdmin: 다른 테넌트 공지는 조회 결과에 포함되지 않음")
    void getAllNotificationsForAdmin_returnsOnlyCurrentTenantRows() {
        Pageable pageable = PageRequest.of(0, 20);
        SystemNotification tenant002Notice = new SystemNotification();
        tenant002Notice.setId(1L);
        tenant002Notice.setTenantId(TENANT_002);
        tenant002Notice.setTitle("002 전용 공지");

        Page<SystemNotification> scopedPage =
            new PageImpl<>(Collections.singletonList(tenant002Notice), pageable, 1);
        when(systemNotificationRepository.findAllForAdminByTenantId(
                eq(TENANT_002), eq("ALL"), eq("PUBLISHED"), eq(pageable)))
            .thenReturn(scopedPage);

        Page<SystemNotification> result =
            systemNotificationService.getAllNotificationsForAdmin("ALL", "PUBLISHED", pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).allMatch(n -> TENANT_002.equals(n.getTenantId()));
        verify(systemNotificationRepository, never()).findAllForAdmin(any(), any(), any());
    }

    @Test
    @DisplayName("createNotification: TenantContextHolder 테넌트 ID를 엔티티에 설정")
    void createNotification_setsTenantIdFromContext() {
        SystemNotification input = new SystemNotification();
        input.setTargetType("ALL");
        input.setTitle("신규 공지");
        input.setContent("내용");

        when(systemNotificationRepository.save(any(SystemNotification.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        SystemNotification created = systemNotificationService.createNotification(input);

        ArgumentCaptor<SystemNotification> captor = ArgumentCaptor.forClass(SystemNotification.class);
        verify(systemNotificationRepository).save(captor.capture());
        assertThat(created.getTenantId()).isEqualTo(TENANT_002);
        assertThat(captor.getValue().getTenantId()).isEqualTo(TENANT_002);
    }

    @Test
    @DisplayName("createNotification: 001 컨텍스트에서는 001 tenantId로 저장")
    void createNotification_usesSessionTenantNotOtherTenant() {
        TenantContextHolder.setTenantId(TENANT_001);

        SystemNotification input = new SystemNotification();
        input.setTargetType("ALL");
        input.setTitle("001 공지");
        input.setContent("001 내용");

        when(systemNotificationRepository.save(any(SystemNotification.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        SystemNotification created = systemNotificationService.createNotification(input);

        assertThat(created.getTenantId()).isEqualTo(TENANT_001);
        assertThat(created.getTenantId()).isNotEqualTo(TENANT_002);
    }
}
