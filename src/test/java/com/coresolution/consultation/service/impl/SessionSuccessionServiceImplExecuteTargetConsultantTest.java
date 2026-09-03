package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collection;
import java.util.Collections;
import java.util.Optional;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.SessionSuccessionRequest;
import com.coresolution.consultation.dto.SessionSuccessionResponse;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 회기 승계 실행 — 타깃 상담사가 소스와 다를 때 타깃 매핑에 저장되는지 검증.
 *
 * @author CoreSolution
 * @since 2026-09-03
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SessionSuccessionServiceImpl.execute — 타깃 상담사 영속")
class SessionSuccessionServiceImplExecuteTargetConsultantTest {

    private static final String TENANT = "tenant-succession-consultant";

    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AdminService adminService;
    @Mock
    private AuditLogService auditLogService;
    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private SessionSuccessionServiceImpl sessionSuccessionService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("소스와 다른 targetConsultantId → 신규 타깃 매핑 consultant 가 그 값으로 저장")
    void execute_differentTargetConsultant_persistsOnNewTargetMapping() {
        User sourceConsultant = consultant(10L, "소스상담");
        User targetConsultant = consultant(11L, "타깃상담");
        User sourceClient = client(20L, "이전당사자");
        User beneficiary = client(21L, "수혜자");

        ConsultantClientMapping source = activeMapping(100L, sourceConsultant, sourceClient, 5);

        when(mappingRepository.findByTenantIdAndId(TENANT, 100L)).thenReturn(Optional.of(source));
        when(scheduleRepository.countOccupyingConsultationSchedulesForMapping(
                eq(TENANT), eq(100L), eq(10L), eq(20L), any(Collection.class)))
                .thenReturn(0L);
        when(userRepository.findByTenantIdAndId(TENANT, 21L)).thenReturn(Optional.of(beneficiary));
        when(userRepository.findByTenantIdAndId(TENANT, 11L)).thenReturn(Optional.of(targetConsultant));
        when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
                TENANT, 11L, 21L))
                .thenReturn(Collections.emptyList());
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> {
            ConsultantClientMapping m = inv.getArgument(0);
            if (m.getId() == null) {
                m.setId(200L);
            }
            return m;
        });

        SessionSuccessionRequest request = SessionSuccessionRequest.builder()
                .targetConsultantId(11L)
                .beneficiaryClientId(21L)
                .sessionCount(3)
                .build();

        SessionSuccessionResponse response = sessionSuccessionService.execute(
                100L, request, 1L, "ADMIN");

        ArgumentCaptor<ConsultantClientMapping> saveCaptor =
                ArgumentCaptor.forClass(ConsultantClientMapping.class);
        verify(mappingRepository, org.mockito.Mockito.atLeast(2)).save(saveCaptor.capture());

        ConsultantClientMapping targetSaved = saveCaptor.getAllValues().stream()
                .filter(m -> m.getConsultant() != null
                        && Long.valueOf(11L).equals(m.getConsultant().getId()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("타깃 상담사 11 로 저장된 매핑이 없습니다"));

        assertThat(targetSaved.getClient().getId()).isEqualTo(21L);
        assertThat(targetSaved.getRemainingSessions()).isEqualTo(3);
        assertThat(response.getTargetMapping().getConsultantId()).isEqualTo(11L);
        assertThat(response.getSourceMapping().getConsultantId()).isEqualTo(10L);
        assertThat(response.getTransferredCount()).isEqualTo(3);
        // 점유 스케줄 일괄 이전 경로 없음
        verify(scheduleRepository, org.mockito.Mockito.never())
                .save(any());
    }

    private static User consultant(Long id, String name) {
        User u = new User();
        u.setId(id);
        u.setName(name);
        u.setRole(UserRole.CONSULTANT);
        return u;
    }

    private static User client(Long id, String name) {
        User u = new User();
        u.setId(id);
        u.setName(name);
        u.setRole(UserRole.CLIENT);
        return u;
    }

    private static ConsultantClientMapping activeMapping(
            Long id, User consultant, User client, int remaining) {
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setId(id);
        m.setTenantId(TENANT);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setRemainingSessions(remaining);
        m.setUsedSessions(0);
        m.setTotalSessions(remaining);
        m.setPackageName("패키지");
        m.setPackagePrice(100000L);
        m.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
        return m;
    }
}
