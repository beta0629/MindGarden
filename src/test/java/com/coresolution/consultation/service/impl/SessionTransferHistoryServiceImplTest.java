package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.SessionSuccessionConstants;
import com.coresolution.consultation.constant.SessionTransferHistoryConstants;
import com.coresolution.consultation.dto.SessionTransferHistoryItemResponse;
import com.coresolution.consultation.dto.SessionTransferHistoryResponse;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.AuditLogRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingHistoryRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 회기 승계·이관 이력 서비스 — 양방향 표시, 합계 미변경.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SessionTransferHistoryServiceImpl")
class SessionTransferHistoryServiceImplTest {

    private static final String TENANT = "tenant-st-hist-" + UUID.randomUUID();
    private static final Long CLIENT_SUNHEE = 1001L;
    private static final Long CLIENT_YERIN = 1002L;
    private static final Long MAPPING_SUNHEE = 5001L;
    private static final Long MAPPING_YERIN = 5002L;

    @Mock
    private AuditLogRepository auditLogRepository;
    @Mock
    private ConsultantClientMappingHistoryRepository mappingHistoryRepository;
    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private UserPersonalDataCacheService userPersonalDataCacheService;
    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private SessionTransferHistoryServiceImpl service;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("내담자 조회 — 임선희→예린 6회 승계, 예린→임선희 5회 이관을 모두 표시한다")
    void findByClientId_bothDirections() {
        User sunhee = user(CLIENT_SUNHEE, "임선희");
        User yerin = user(CLIENT_YERIN, "김예린");
        ConsultantClientMapping mappingSunhee = mapping(MAPPING_SUNHEE, sunhee, 11);

        when(mappingRepository.findAllByTenantIdAndClientIdWithDetails(eq(TENANT), eq(CLIENT_SUNHEE)))
                .thenReturn(List.of(mappingSunhee));
        when(auditLogRepository.findByTenantIdAndActionAndEntityType(
                eq(TENANT),
                eq(AuditAction.MAPPING_SESSION_SUCCESSION),
                eq(SessionSuccessionConstants.ENTITY_TYPE_MAPPING)))
                .thenReturn(List.of(
                        audit(31L, LocalDateTime.of(2026, 3, 1, 10, 0),
                                MAPPING_SUNHEE, MAPPING_YERIN, 6, CLIENT_SUNHEE, CLIENT_YERIN),
                        audit(32L, LocalDateTime.of(2026, 4, 2, 9, 0),
                                MAPPING_YERIN, MAPPING_SUNHEE, 5, CLIENT_YERIN, CLIENT_SUNHEE)));
        when(mappingRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT), any()))
                .thenReturn(List.of(
                        mappingSunhee,
                        mapping(MAPPING_YERIN, yerin, 5)));
        when(mappingHistoryRepository.findByTenantIdAndMappingIdInOrderByCreatedAtDesc(eq(TENANT), any()))
                .thenReturn(List.of());
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT), any()))
                .thenReturn(List.of(sunhee, yerin));
        when(userPersonalDataCacheService.getDecryptedUserData(any(User.class)))
                .thenAnswer(invocation -> {
                    User user = invocation.getArgument(0);
                    return Map.of("name", user.getName());
                });

        SessionTransferHistoryResponse response = service.findByClientId(CLIENT_SUNHEE);

        assertThat(response.getItems()).hasSize(2);
        SessionTransferHistoryItemResponse first = response.getItems().get(0);
        SessionTransferHistoryItemResponse second = response.getItems().get(1);
        assertThat(first.getHeadline()).isEqualTo("김예린 → 임선희: 5회 이관");
        assertThat(first.getDirection()).isEqualTo(SessionTransferHistoryConstants.DIRECTION_INCOMING);
        assertThat(second.getHeadline()).isEqualTo("임선희 → 김예린: 6회 승계");
        assertThat(second.getDirection()).isEqualTo(SessionTransferHistoryConstants.DIRECTION_OUTGOING);
        assertThat(second.getFromMappingId()).isEqualTo(MAPPING_SUNHEE);
        assertThat(first.getFromMappingId()).isEqualTo(MAPPING_YERIN);
    }

    @Test
    @DisplayName("매핑 조회 — 테넌트에 없으면 EntityNotFoundException")
    void findByMappingId_missing_throws() {
        when(mappingRepository.findByTenantIdAndId(eq(TENANT), eq(MAPPING_SUNHEE)))
                .thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.findByMappingId(MAPPING_SUNHEE))
                .isInstanceOf(EntityNotFoundException.class);
        verify(auditLogRepository, never()).findByTenantIdAndActionAndEntityType(any(), any(), any());
    }

    @Test
    @DisplayName("tenantId 없으면 조회하지 않는다")
    void findByClientId_requiresTenant() {
        TenantContextHolder.clear();
        assertThatThrownBy(() -> service.findByClientId(CLIENT_SUNHEE))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(SessionTransferHistoryConstants.MSG_TENANT_REQUIRED);
    }

    @Test
    @DisplayName("clientId null 이면 IllegalArgumentException")
    void findByClientId_nullClient() {
        assertThatThrownBy(() -> service.findByClientId(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private AuditLog audit(
            Long id,
            LocalDateTime at,
            Long sourceMappingId,
            Long targetMappingId,
            int sessionCount,
            Long sourceClientId,
            Long targetClientId) {
        String json = String.format(
                "{\"sourceMappingId\":%d,\"targetMappingId\":%d,\"sessionCount\":%d,"
                        + "\"sourceClientId\":%d,\"targetClientId\":%d}",
                sourceMappingId, targetMappingId, sessionCount, sourceClientId, targetClientId);
        return AuditLog.builder()
                .id(id)
                .tenantId(TENANT)
                .action(AuditAction.MAPPING_SESSION_SUCCESSION)
                .entityType(SessionSuccessionConstants.ENTITY_TYPE_MAPPING)
                .entityId(sourceMappingId)
                .metadataJson(json)
                .createdAt(at)
                .build();
    }

    private ConsultantClientMapping mapping(Long id, User client, int remaining) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(id);
        mapping.setTenantId(TENANT);
        mapping.setClient(client);
        mapping.setRemainingSessions(remaining);
        mapping.setTotalSessions(remaining);
        mapping.setNotes("");
        return mapping;
    }

    private User user(Long id, String name) {
        User user = new User();
        user.setId(id);
        user.setTenantId(TENANT);
        user.setName(name);
        return user;
    }
}
