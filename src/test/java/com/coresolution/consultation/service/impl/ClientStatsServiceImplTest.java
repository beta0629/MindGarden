package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Arrays;
import com.coresolution.consultation.constant.ClientProfileContextFields;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.ClientEngagementTypeConstants;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.security.access.AccessDeniedException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link ClientStatsServiceImpl} 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-03-29
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ClientStatsServiceImpl")
class ClientStatsServiceImplTest {

    private static final String TENANT = "TENANT-MAIN001";
    private static final String VEHICLE_PLATE = "12가3456";
    private static final Long CLIENT_USER_ID = 71L;
    private static final Long CONSULTANT_USER_ID = 5L;

    @Mock
    private UserRepository userRepository;
    @Mock
    private ClientRepository clientRepository;
    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private ConsultationRecordRepository consultationRecordRepository;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;

    @Mock
    private UserPersonalDataCacheService userPersonalDataCacheService;

    @InjectMocks
    private ClientStatsServiceImpl clientStatsService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT);
        lenient().when(encryptionUtil.safeDecrypt(anyString()))
            .thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(scheduleRepository.findDistinctConsultantIdsByClientId(anyString(), anyLong()))
            .thenReturn(Collections.emptyList());
        lenient().when(scheduleRepository.findMaxCompletedSessionDateByClientIds(
            anyString(), any(), any())).thenReturn(Collections.emptyList());
        lenient().when(scheduleRepository.existsByTenantIdAndConsultantIdAndClientIdAndIsDeletedFalse(
            anyString(), anyLong(), anyLong())).thenReturn(false);
        lenient().when(consultationRecordRepository.existsByTenantIdAndConsultantIdAndClientIdAndIsDeletedFalse(
            anyString(), anyLong(), anyLong())).thenReturn(false);
        lenient().when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
            anyString(), anyLong(), anyLong())).thenReturn(Collections.emptyList());
        lenient().when(userRepository.saveAndFlush(any(User.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("getAllClientsWithStatsByTenant: DELETED_BY_ADMIN·ANONYMIZED·HARD_DELETED 내담자는 목록에서 제외")
    void getAllClientsWithStatsByTenant_excludesDeletedLifecycleStates() {
        User active = buildListClientUser(101L, "활성", LifecycleState.ACTIVE);
        User deletedByAdmin = buildListClientUser(102L, "삭제대기", LifecycleState.DELETED_BY_ADMIN);
        User anonymized = buildListClientUser(103L, "익명", LifecycleState.ANONYMIZED);
        User hardDeleted = buildListClientUser(104L, "하드삭제", LifecycleState.HARD_DELETED);

        when(userRepository.findByRole(TENANT, UserRole.CLIENT))
            .thenReturn(Arrays.asList(active, deletedByAdmin, anonymized, hardDeleted));
        when(clientRepository.findByTenantIdAndIdIncludingDeleted(eq(TENANT), anyLong()))
            .thenReturn(Optional.empty());
        when(mappingRepository.findByClientIdAndStatusNot(anyString(), anyLong(), any()))
            .thenReturn(Collections.emptyList());
        when(scheduleRepository.countByClientId(anyString(), anyLong())).thenReturn(0L);

        List<Map<String, Object>> result = clientStatsService.getAllClientsWithStatsByTenant(TENANT);

        assertEquals(1, result.size());
        @SuppressWarnings("unchecked")
        Map<String, Object> clientMap = (Map<String, Object>) result.get(0).get("client");
        assertEquals(101L, clientMap.get("id"));
        assertEquals(LifecycleState.ACTIVE.name(), clientMap.get("lifecycleState"));
    }

    private User buildListClientUser(Long id, String name, LifecycleState lifecycleState) {
        User user = User.builder()
            .userId("client-" + id)
            .email("c" + id + "@test.example")
            .password("password12")
            .name(name)
            .role(UserRole.CLIENT)
            .build();
        user.setId(id);
        user.setTenantId(TENANT);
        user.setLifecycleState(lifecycleState);
        return user;
    }

    @Test
    @DisplayName("getAllClientsWithStatsByTenant: user·clients 테넌트 일치 시 IncludingDeleted로 차량번호 복사")
    void getAllClientsWithStatsByTenant_copiesVehiclePlateWhenTenantsAlign() {
        User user = User.builder()
            .userId("client-71")
            .email("c@test.example")
            .password("password12")
            .name("홍길동")
            .role(UserRole.CLIENT)
            .build();
        user.setId(CLIENT_USER_ID);
        user.setTenantId(TENANT);

        Client row = new Client();
        row.setId(CLIENT_USER_ID);
        row.setTenantId(TENANT);
        row.setVehiclePlate(VEHICLE_PLATE);

        when(userRepository.findByRole(TENANT, UserRole.CLIENT))
            .thenReturn(Collections.singletonList(user));
        when(clientRepository.findByTenantIdAndIdIncludingDeleted(TENANT, CLIENT_USER_ID))
            .thenReturn(Optional.of(row));
        when(mappingRepository.findByClientIdAndStatusNot(anyString(), anyLong(), any()))
            .thenReturn(Collections.emptyList());
        when(scheduleRepository.countByClientId(anyString(), anyLong())).thenReturn(0L);

        List<Map<String, Object>> result = clientStatsService.getAllClientsWithStatsByTenant(TENANT);

        assertNotNull(result);
        assertEquals(1, result.size());
        @SuppressWarnings("unchecked")
        Map<String, Object> clientMap = (Map<String, Object>) result.get(0).get("client");
        assertNotNull(clientMap);
        assertEquals(VEHICLE_PLATE, clientMap.get("vehiclePlate"));
    }

    @Test
    @DisplayName("getAllClientsWithStatsByTenant: users.tenant_id와 clients 행 불일치 시 차량번호 미설정")
    void getAllClientsWithStatsByTenant_skipsVehiclePlateWhenClientRowNotInUserTenant() {
        User user = User.builder()
            .userId("client-71")
            .email("c@test.example")
            .password("password12")
            .name("홍길동")
            .role(UserRole.CLIENT)
            .build();
        user.setId(CLIENT_USER_ID);
        user.setTenantId(TENANT);

        when(userRepository.findByRole(TENANT, UserRole.CLIENT))
            .thenReturn(Collections.singletonList(user));
        when(clientRepository.findByTenantIdAndIdIncludingDeleted(TENANT, CLIENT_USER_ID))
            .thenReturn(Optional.empty());
        when(mappingRepository.findByClientIdAndStatusNot(anyString(), anyLong(), any()))
            .thenReturn(Collections.emptyList());
        when(scheduleRepository.countByClientId(anyString(), anyLong())).thenReturn(0L);

        List<Map<String, Object>> result = clientStatsService.getAllClientsWithStatsByTenant(TENANT);

        assertNotNull(result);
        assertEquals(1, result.size());
        @SuppressWarnings("unchecked")
        Map<String, Object> clientMap = (Map<String, Object>) result.get(0).get("client");
        assertNotNull(clientMap);
        assertNull(clientMap.get("vehiclePlate"));
    }

    @Test
    @DisplayName("getClientWithStats: tenantId·client 단건 조회 및 통계 조립")
    void getClientWithStats_success() {
        User user = User.builder()
            .userId("c1")
            .email("e@test.com")
            .password("pw")
            .name("이름")
            .role(UserRole.CLIENT)
            .build();
        user.setId(CLIENT_USER_ID);
        user.setTenantId(TENANT);
        user.setIsActive(true);

        when(userRepository.findByTenantIdAndId(TENANT, CLIENT_USER_ID)).thenReturn(Optional.of(user));
        when(clientRepository.findByTenantIdAndIdIncludingDeleted(TENANT, CLIENT_USER_ID))
            .thenReturn(Optional.empty());
        when(mappingRepository.findByClientIdAndStatusNot(eq(TENANT), eq(CLIENT_USER_ID), any()))
            .thenReturn(Collections.emptyList());
        when(scheduleRepository.countByClientId(TENANT, CLIENT_USER_ID)).thenReturn(0L);

        Map<String, Object> result = clientStatsService.getClientWithStats(TENANT, CLIENT_USER_ID);

        assertNotNull(result.get("client"));
        assertEquals(0L, result.get("currentConsultants"));
    }

    @Test
    @DisplayName("getClientWithStats: clients 행의 partnerInstitutionId를 with-stats client 맵에 포함한다")
    void getClientWithStats_includesPartnerInstitutionIdFromClientsRow() {
        User user = User.builder()
            .userId("c-inst")
            .email("inst@test.com")
            .password("pw")
            .name("최가을")
            .role(UserRole.CLIENT)
            .build();
        user.setId(CLIENT_USER_ID);
        user.setTenantId(TENANT);
        user.setIsActive(true);

        Client clientsRow = new Client();
        clientsRow.setId(CLIENT_USER_ID);
        clientsRow.setTenantId(TENANT);
        clientsRow.setEngagementType(ClientEngagementTypeConstants.INSTITUTION_LINK);
        clientsRow.setPartnerInstitutionId(1L);
        clientsRow.setInstitutionName("인천광역시 자립지원전담기관");
        clientsRow.setInstitutionPrepaid(true);
        clientsRow.setInstitutionPrepaidAmount(100000L);

        when(userRepository.findByTenantIdAndId(TENANT, CLIENT_USER_ID)).thenReturn(Optional.of(user));
        when(clientRepository.findByTenantIdAndIdIncludingDeleted(TENANT, CLIENT_USER_ID))
            .thenReturn(Optional.of(clientsRow));
        when(mappingRepository.findByClientIdAndStatusNot(eq(TENANT), eq(CLIENT_USER_ID), any()))
            .thenReturn(Collections.emptyList());
        when(scheduleRepository.countByClientId(TENANT, CLIENT_USER_ID)).thenReturn(0L);

        Map<String, Object> result = clientStatsService.getClientWithStats(TENANT, CLIENT_USER_ID);

        @SuppressWarnings("unchecked")
        Map<String, Object> clientMap = (Map<String, Object>) result.get("client");
        assertNotNull(clientMap);
        assertEquals(1L, clientMap.get("partnerInstitutionId"));
        assertEquals(ClientEngagementTypeConstants.INSTITUTION_LINK, clientMap.get("engagementType"));
        assertEquals(Boolean.TRUE, clientMap.get("institutionPrepaid"));
        assertEquals("인천광역시 자립지원전담기관", clientMap.get("institutionName"));
    }

    @Test
    @DisplayName("getClientWithStats: 매칭 없고 일정만 있으면 스케줄 상담사 distinct로 currentConsultants 반영")
    void getClientWithStats_countsConsultantsFromSchedulesWhenMappingsEmpty() {
        User user = User.builder()
            .userId("c1")
            .email("e@test.com")
            .password("pw")
            .name("이름")
            .role(UserRole.CLIENT)
            .build();
        user.setId(CLIENT_USER_ID);
        user.setTenantId(TENANT);
        user.setIsActive(true);

        when(userRepository.findByTenantIdAndId(TENANT, CLIENT_USER_ID)).thenReturn(Optional.of(user));
        when(clientRepository.findByTenantIdAndIdIncludingDeleted(TENANT, CLIENT_USER_ID))
            .thenReturn(Optional.empty());
        when(mappingRepository.findByClientIdAndStatusNot(eq(TENANT), eq(CLIENT_USER_ID), any()))
            .thenReturn(Collections.emptyList());
        when(scheduleRepository.findDistinctConsultantIdsByClientId(TENANT, CLIENT_USER_ID))
            .thenReturn(Collections.singletonList(5L));
        when(scheduleRepository.countByClientId(TENANT, CLIENT_USER_ID)).thenReturn(1L);

        Map<String, Object> result = clientStatsService.getClientWithStats(TENANT, CLIENT_USER_ID);

        assertEquals(1L, result.get("currentConsultants"));
    }

    @Test
    @DisplayName("getClientWithStats: tenantId 공백이면 IllegalArgumentException")
    void getClientWithStats_blankTenant_throws() {
        assertThrows(IllegalArgumentException.class,
            () -> clientStatsService.getClientWithStats("  ", CLIENT_USER_ID));
    }

    @Test
    @DisplayName("getClientWithStats: 해당 테넌트에 User 없으면 EntityNotFoundException")
    void getClientWithStats_notFound_throws() {
        when(userRepository.findByTenantIdAndId(TENANT, CLIENT_USER_ID)).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class,
            () -> clientStatsService.getClientWithStats(TENANT, CLIENT_USER_ID));
    }

    @Test
    @DisplayName("getAllClientsWithStatsByTenant: birthDate 없고 User.age 있으면 목록 age에 반영")
    void getAllClientsWithStatsByTenant_ageFallbackFromUserWhenNoBirthDate() {
        User user = User.builder()
            .userId("client-71")
            .email("c@test.example")
            .password("password12")
            .name("홍길동")
            .role(UserRole.CLIENT)
            .build();
        user.setId(CLIENT_USER_ID);
        user.setTenantId(TENANT);
        user.setBirthDate(null);
        user.setAge(34);

        when(userRepository.findByRole(TENANT, UserRole.CLIENT))
            .thenReturn(Collections.singletonList(user));
        when(clientRepository.findByTenantIdAndIdIncludingDeleted(TENANT, CLIENT_USER_ID))
            .thenReturn(Optional.empty());
        when(mappingRepository.findByClientIdAndStatusNot(anyString(), anyLong(), any()))
            .thenReturn(Collections.emptyList());
        when(scheduleRepository.countByClientId(anyString(), anyLong())).thenReturn(0L);

        List<Map<String, Object>> result = clientStatsService.getAllClientsWithStatsByTenant(TENANT);

        assertEquals(1, result.size());
        @SuppressWarnings("unchecked")
        Map<String, Object> clientMap = (Map<String, Object>) result.get(0).get("client");
        assertEquals(34, clientMap.get("age"));
    }

    @Test
    @DisplayName("getAllClientsWithStatsByTenant: notes 비어 있고 memo만 있으면 notes 키에 memo 표시")
    void getAllClientsWithStatsByTenant_notesFallsBackToMemo() {
        User user = User.builder()
            .userId("client-71")
            .email("c@test.example")
            .password("password12")
            .name("홍길동")
            .role(UserRole.CLIENT)
            .build();
        user.setId(CLIENT_USER_ID);
        user.setTenantId(TENANT);
        user.setNotes(null);
        user.setMemo("  레거시메모  ");

        when(userRepository.findByRole(TENANT, UserRole.CLIENT))
            .thenReturn(Collections.singletonList(user));
        when(clientRepository.findByTenantIdAndIdIncludingDeleted(TENANT, CLIENT_USER_ID))
            .thenReturn(Optional.empty());
        when(mappingRepository.findByClientIdAndStatusNot(anyString(), anyLong(), any()))
            .thenReturn(Collections.emptyList());
        when(scheduleRepository.countByClientId(anyString(), anyLong())).thenReturn(0L);

        List<Map<String, Object>> result = clientStatsService.getAllClientsWithStatsByTenant(TENANT);

        @SuppressWarnings("unchecked")
        Map<String, Object> clientMap = (Map<String, Object>) result.get(0).get("client");
        assertEquals("레거시메모", clientMap.get("notes"));
    }

    @Test
    @DisplayName("getClientWithStats: 역할이 CLIENT가 아니면 EntityNotFoundException")
    void getClientWithStats_nonClientRole_throws() {
        User consultant = User.builder()
            .userId("co1")
            .email("co@test.com")
            .password("pw")
            .name("상담사")
            .role(UserRole.CONSULTANT)
            .build();
        consultant.setId(CLIENT_USER_ID);
        consultant.setTenantId(TENANT);

        when(userRepository.findByTenantIdAndId(TENANT, CLIENT_USER_ID)).thenReturn(Optional.of(consultant));

        assertThrows(EntityNotFoundException.class,
            () -> clientStatsService.getClientWithStats(TENANT, CLIENT_USER_ID));
    }

    @Test
    @DisplayName("updateClientContextNotes: 관리자는 FULL 등급으로 메모 저장 가능")
    void updateClientContextNotes_admin_fullTier_savesNotes() {
        User clientUser = buildClientUserForContext();
        User admin = User.builder()
            .userId("admin1")
            .email("a@test.com")
            .password("pw")
            .name("관리자")
            .role(UserRole.ADMIN)
            .build();
        admin.setId(200L);
        admin.setTenantId(TENANT);

        when(userRepository.findByTenantIdAndId(TENANT, CLIENT_USER_ID)).thenReturn(Optional.of(clientUser));
        when(clientRepository.findByTenantIdAndIdIncludingDeleted(TENANT, CLIENT_USER_ID))
            .thenReturn(Optional.empty());
        when(mappingRepository.findByClientIdAndStatusNot(eq(TENANT), eq(CLIENT_USER_ID), any()))
            .thenReturn(Collections.emptyList());
        when(scheduleRepository.countByClientId(TENANT, CLIENT_USER_ID)).thenReturn(0L);

        String notes = "관리자가 저장한 메모";
        Map<String, Object> out = clientStatsService.updateClientContextNotes(TENANT, CLIENT_USER_ID, admin, notes);

        assertEquals(CLIENT_USER_ID, out.get("clientId"));
        assertEquals(notes, out.get("notes"));
        verify(userPersonalDataCacheService).evictUserPersonalDataCache(eq(TENANT), eq(CLIENT_USER_ID));
    }

    @Test
    @DisplayName("updateClientContextNotes: 상담사 매칭(FULL)이면 메모 저장 가능")
    void updateClientContextNotes_consultant_mappingFull_savesNotes() {
        User clientUser = buildClientUserForContext();
        User consultant = User.builder()
            .userId("co1")
            .email("co@test.com")
            .password("pw")
            .name("상담사")
            .role(UserRole.CONSULTANT)
            .build();
        consultant.setId(CONSULTANT_USER_ID);
        consultant.setTenantId(TENANT);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
        mapping.setConsultant(consultant);

        when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
            TENANT, CONSULTANT_USER_ID, CLIENT_USER_ID)).thenReturn(List.of(mapping));
        when(userRepository.findByTenantIdAndId(TENANT, CLIENT_USER_ID)).thenReturn(Optional.of(clientUser));
        when(clientRepository.findByTenantIdAndIdIncludingDeleted(TENANT, CLIENT_USER_ID))
            .thenReturn(Optional.empty());
        when(mappingRepository.findByClientIdAndStatusNot(eq(TENANT), eq(CLIENT_USER_ID), any()))
            .thenReturn(Collections.emptyList());
        when(scheduleRepository.countByClientId(TENANT, CLIENT_USER_ID)).thenReturn(0L);

        String notes = "매칭 상담사 메모";
        Map<String, Object> out = clientStatsService.updateClientContextNotes(
            TENANT, CLIENT_USER_ID, consultant, notes);

        assertEquals(CLIENT_USER_ID, out.get("clientId"));
        assertEquals(notes, out.get("notes"));
        verify(userPersonalDataCacheService).evictUserPersonalDataCache(eq(TENANT), eq(CLIENT_USER_ID));
    }

    @Test
    @DisplayName("updateClientContextNotes: 상담사 일정 연계만(STANDARD)이어도 메모 저장 가능")
    void updateClientContextNotes_consultant_scheduleStandardTier_savesNotes() {
        User clientUser = buildClientUserForContext();
        User consultant = User.builder()
            .userId("co1")
            .email("co@test.com")
            .password("pw")
            .name("상담사")
            .role(UserRole.CONSULTANT)
            .build();
        consultant.setId(CONSULTANT_USER_ID);
        consultant.setTenantId(TENANT);

        when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
            TENANT, CONSULTANT_USER_ID, CLIENT_USER_ID)).thenReturn(Collections.emptyList());
        when(scheduleRepository.existsByTenantIdAndConsultantIdAndClientIdAndIsDeletedFalse(
            TENANT, CONSULTANT_USER_ID, CLIENT_USER_ID)).thenReturn(true);
        when(userRepository.findByTenantIdAndId(TENANT, CLIENT_USER_ID)).thenReturn(Optional.of(clientUser));
        when(clientRepository.findByTenantIdAndIdIncludingDeleted(TENANT, CLIENT_USER_ID))
            .thenReturn(Optional.empty());
        when(mappingRepository.findByClientIdAndStatusNot(eq(TENANT), eq(CLIENT_USER_ID), any()))
            .thenReturn(Collections.emptyList());
        when(scheduleRepository.countByClientId(TENANT, CLIENT_USER_ID)).thenReturn(0L);

        String notes = "일정 연계 메모";
        Map<String, Object> out = clientStatsService.updateClientContextNotes(
            TENANT, CLIENT_USER_ID, consultant, notes);

        assertEquals(CLIENT_USER_ID, out.get("clientId"));
        assertEquals(notes, out.get("notes"));
        verify(userPersonalDataCacheService).evictUserPersonalDataCache(eq(TENANT), eq(CLIENT_USER_ID));
    }

    @Test
    @DisplayName("updateClientContextNotes: 상담사 매칭·일정·상담기록 없으면 AccessDenied")
    void updateClientContextNotes_consultant_noLink_throwsAccessDenied() {
        User consultant = User.builder()
            .userId("co1")
            .email("co@test.com")
            .password("pw")
            .name("상담사")
            .role(UserRole.CONSULTANT)
            .build();
        consultant.setId(CONSULTANT_USER_ID);
        consultant.setTenantId(TENANT);

        when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
            TENANT, CONSULTANT_USER_ID, CLIENT_USER_ID)).thenReturn(Collections.emptyList());
        when(scheduleRepository.existsByTenantIdAndConsultantIdAndClientIdAndIsDeletedFalse(
            TENANT, CONSULTANT_USER_ID, CLIENT_USER_ID)).thenReturn(false);
        when(consultationRecordRepository.existsByTenantIdAndConsultantIdAndClientIdAndIsDeletedFalse(
            TENANT, CONSULTANT_USER_ID, CLIENT_USER_ID)).thenReturn(false);

        assertThrows(AccessDeniedException.class,
            () -> clientStatsService.updateClientContextNotes(TENANT, CLIENT_USER_ID, consultant, "x"));
    }

    @Test
    @DisplayName("getClientContextProfile: ACTIVE 복수 매핑 시 NonUnique 없이 최신 ACTIVE 선택")
    void getClientContextProfile_multipleActiveMappings_selectsLatestWithoutNonUnique() {
        User clientUser = buildClientUserForContext();
        User consultant = buildConsultantCaller();

        ConsultantClientMapping olderActive = buildMapping(
            10L, ConsultantClientMapping.MappingStatus.ACTIVE,
            LocalDateTime.of(2026, 4, 1, 9, 0), LocalDateTime.of(2026, 4, 1, 9, 0));
        ConsultantClientMapping newerActive = buildMapping(
            11L, ConsultantClientMapping.MappingStatus.ACTIVE,
            LocalDateTime.of(2026, 4, 10, 9, 0), LocalDateTime.of(2026, 4, 10, 9, 0));

        when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
            TENANT, CONSULTANT_USER_ID, CLIENT_USER_ID))
            .thenReturn(List.of(olderActive, newerActive));
        stubClientStatsLookups(clientUser);

        Map<String, Object> profile = clientStatsService.getClientContextProfile(
            TENANT, CLIENT_USER_ID, consultant);

        assertEquals(ClientProfileContextFields.TIER_FULL,
            profile.get(ClientProfileContextFields.VISIBILITY_TIER));
        assertEquals(ClientProfileContextFields.REASON_MAPPING_ACTIVE,
            profile.get(ClientProfileContextFields.ACCESS_REASON));
        verify(mappingRepository).findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
            TENANT, CONSULTANT_USER_ID, CLIENT_USER_ID);
        verify(mappingRepository, never()).findActiveOrExhaustedByTenantIdAndConsultantIdAndClientId(
            anyString(), anyLong(), anyLong());
    }

    @Test
    @DisplayName("getClientContextProfile: ACTIVE+SESSIONS_EXHAUSTED 복수 시 ACTIVE 우선(최신 선택 기준)")
    void getClientContextProfile_activeAndExhausted_prefersActive() {
        User clientUser = buildClientUserForContext();
        User consultant = buildConsultantCaller();

        ConsultantClientMapping olderActive = buildMapping(
            10L, ConsultantClientMapping.MappingStatus.ACTIVE,
            LocalDateTime.of(2026, 4, 1, 9, 0), LocalDateTime.of(2026, 4, 1, 9, 0));
        ConsultantClientMapping newerExhausted = buildMapping(
            20L, ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED,
            LocalDateTime.of(2026, 5, 1, 9, 0), LocalDateTime.of(2026, 5, 1, 9, 0));

        when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
            TENANT, CONSULTANT_USER_ID, CLIENT_USER_ID))
            .thenReturn(List.of(olderActive, newerExhausted));
        stubClientStatsLookups(clientUser);

        Map<String, Object> profile = clientStatsService.getClientContextProfile(
            TENANT, CLIENT_USER_ID, consultant);

        assertEquals(ClientProfileContextFields.TIER_FULL,
            profile.get(ClientProfileContextFields.VISIBILITY_TIER));
        assertEquals(ClientProfileContextFields.REASON_MAPPING_ACTIVE,
            profile.get(ClientProfileContextFields.ACCESS_REASON));
    }

    @Test
    @DisplayName("getClientContextProfile: SESSIONS_EXHAUSTED 복수 시 최신 회기소진 매핑 근거 반환")
    void getClientContextProfile_multipleExhausted_selectsLatestExhausted() {
        User clientUser = buildClientUserForContext();
        User consultant = buildConsultantCaller();

        ConsultantClientMapping olderExhausted = buildMapping(
            30L, ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED,
            LocalDateTime.of(2026, 3, 1, 9, 0), LocalDateTime.of(2026, 3, 1, 9, 0));
        ConsultantClientMapping newerExhausted = buildMapping(
            31L, ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED,
            LocalDateTime.of(2026, 6, 1, 9, 0), LocalDateTime.of(2026, 6, 1, 9, 0));

        when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
            TENANT, CONSULTANT_USER_ID, CLIENT_USER_ID))
            .thenReturn(List.of(olderExhausted, newerExhausted));
        stubClientStatsLookups(clientUser);

        Map<String, Object> profile = clientStatsService.getClientContextProfile(
            TENANT, CLIENT_USER_ID, consultant);

        assertEquals(ClientProfileContextFields.TIER_FULL,
            profile.get(ClientProfileContextFields.VISIBILITY_TIER));
        assertEquals(ClientProfileContextFields.REASON_SESSIONS_EXHAUSTED,
            profile.get(ClientProfileContextFields.ACCESS_REASON));
    }

    @Test
    @DisplayName("getClientContextProfile: 테넌트 격리 — 매핑 조회에 호출자 tenantId만 사용")
    void getClientContextProfile_tenantIsolation_queriesWithCallerTenantOnly() {
        User clientUser = buildClientUserForContext();
        User consultant = buildConsultantCaller();
        String otherTenant = "TENANT-OTHER999";

        ConsultantClientMapping mapping = buildMapping(
            11L, ConsultantClientMapping.MappingStatus.ACTIVE,
            LocalDateTime.of(2026, 4, 10, 9, 0), LocalDateTime.of(2026, 4, 10, 9, 0));

        when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
            eq(TENANT), eq(CONSULTANT_USER_ID), eq(CLIENT_USER_ID)))
            .thenReturn(List.of(mapping));
        when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
            eq(otherTenant), eq(CONSULTANT_USER_ID), eq(CLIENT_USER_ID)))
            .thenReturn(Collections.emptyList());
        stubClientStatsLookups(clientUser);

        Map<String, Object> profile = clientStatsService.getClientContextProfile(
            TENANT, CLIENT_USER_ID, consultant);
        assertEquals(ClientProfileContextFields.REASON_MAPPING_ACTIVE,
            profile.get(ClientProfileContextFields.ACCESS_REASON));

        assertThrows(AccessDeniedException.class,
            () -> clientStatsService.getClientContextProfile(otherTenant, CLIENT_USER_ID, consultant));

        verify(mappingRepository).findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
            TENANT, CONSULTANT_USER_ID, CLIENT_USER_ID);
        verify(mappingRepository).findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
            otherTenant, CONSULTANT_USER_ID, CLIENT_USER_ID);
    }

    @Test
    @DisplayName("getClientContextProfile: 상담사 매칭·일정·상담기록 없으면 AccessDenied")
    void getClientContextProfile_consultant_noLink_throwsAccessDenied() {
        User consultant = buildConsultantCaller();

        when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
            TENANT, CONSULTANT_USER_ID, CLIENT_USER_ID)).thenReturn(Collections.emptyList());
        when(scheduleRepository.existsByTenantIdAndConsultantIdAndClientIdAndIsDeletedFalse(
            TENANT, CONSULTANT_USER_ID, CLIENT_USER_ID)).thenReturn(false);
        when(consultationRecordRepository.existsByTenantIdAndConsultantIdAndClientIdAndIsDeletedFalse(
            TENANT, CONSULTANT_USER_ID, CLIENT_USER_ID)).thenReturn(false);

        assertThrows(AccessDeniedException.class,
            () -> clientStatsService.getClientContextProfile(TENANT, CLIENT_USER_ID, consultant));
    }

    @Test
    @DisplayName("getClientContextProfile: 내담자 역할은 타인 프로필 조회 불가(AccessDenied)")
    void getClientContextProfile_clientRole_throwsAccessDenied() {
        User clientCaller = buildClientUserForContext();
        clientCaller.setId(999L);

        assertThrows(AccessDeniedException.class,
            () -> clientStatsService.getClientContextProfile(TENANT, CLIENT_USER_ID, clientCaller));
        verify(mappingRepository, never()).findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
            anyString(), anyLong(), anyLong());
    }

    @Test
    @DisplayName("with-stats: MAX COMPLETED schedule.date → lastSessionDate + updatedAt 보정")
    void getAllClientsWithStatsByTenant_appliesCompletedRecentActivitySsot() {
        User user = buildListClientUser(CLIENT_USER_ID, "활성", LifecycleState.ACTIVE);
        user.setUpdatedAt(LocalDateTime.of(2026, 1, 1, 10, 0));
        LocalDate lastCompleted = LocalDate.of(2026, 9, 5);

        when(userRepository.findByRole(TENANT, UserRole.CLIENT))
            .thenReturn(Collections.singletonList(user));
        when(clientRepository.findByTenantIdAndIdIncludingDeleted(eq(TENANT), anyLong()))
            .thenReturn(Optional.empty());
        when(mappingRepository.findByClientIdAndStatusNot(anyString(), anyLong(), any()))
            .thenReturn(Collections.emptyList());
        when(scheduleRepository.countByClientId(anyString(), anyLong())).thenReturn(0L);
        when(scheduleRepository.findMaxCompletedSessionDateByClientIds(
                eq(TENANT), any(), eq(ScheduleStatus.COMPLETED)))
            .thenReturn(List.<Object[]>of(new Object[] {CLIENT_USER_ID, lastCompleted}));

        List<Map<String, Object>> result = clientStatsService.getAllClientsWithStatsByTenant(TENANT);

        @SuppressWarnings("unchecked")
        Map<String, Object> clientMap = (Map<String, Object>) result.get(0).get("client");
        assertEquals(lastCompleted, clientMap.get("lastSessionDate"));
        assertEquals(lastCompleted.atTime(LocalTime.MAX), clientMap.get("updatedAt"));
    }

    private User buildClientUserForContext() {
        User user = User.builder()
            .userId("c1")
            .email("e@test.com")
            .password("pw")
            .name("내담자")
            .role(UserRole.CLIENT)
            .build();
        user.setId(CLIENT_USER_ID);
        user.setTenantId(TENANT);
        user.setIsActive(true);
        return user;
    }

    private User buildConsultantCaller() {
        User consultant = User.builder()
            .userId("co1")
            .email("co@test.com")
            .password("pw")
            .name("상담사")
            .role(UserRole.CONSULTANT)
            .build();
        consultant.setId(CONSULTANT_USER_ID);
        consultant.setTenantId(TENANT);
        return consultant;
    }

    private ConsultantClientMapping buildMapping(
            Long id,
            ConsultantClientMapping.MappingStatus status,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(id);
        mapping.setStatus(status);
        mapping.setCreatedAt(createdAt);
        mapping.setUpdatedAt(updatedAt);
        return mapping;
    }

    private void stubClientStatsLookups(User clientUser) {
        when(userRepository.findByTenantIdAndId(TENANT, CLIENT_USER_ID)).thenReturn(Optional.of(clientUser));
        when(clientRepository.findByTenantIdAndIdIncludingDeleted(TENANT, CLIENT_USER_ID))
            .thenReturn(Optional.empty());
        when(mappingRepository.findByClientIdAndStatusNot(eq(TENANT), eq(CLIENT_USER_ID), any()))
            .thenReturn(Collections.emptyList());
        when(scheduleRepository.countByClientId(TENANT, CLIENT_USER_ID)).thenReturn(0L);
    }
}
