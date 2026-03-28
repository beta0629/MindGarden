package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
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

    @Mock
    private UserRepository userRepository;
    @Mock
    private ClientRepository clientRepository;
    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;

    @InjectMocks
    private ClientStatsServiceImpl clientStatsService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT);
        lenient().when(encryptionUtil.safeDecrypt(anyString()))
            .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("getAllClientsWithStatsByTenant: user·clients 테넌트 일치 시 findByTenantIdAndId로 차량번호 복사")
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
        when(clientRepository.findByTenantIdAndId(TENANT, CLIENT_USER_ID)).thenReturn(Optional.of(row));
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
        when(clientRepository.findByTenantIdAndId(TENANT, CLIENT_USER_ID)).thenReturn(Optional.empty());
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
        when(clientRepository.findByTenantIdAndId(TENANT, CLIENT_USER_ID)).thenReturn(Optional.empty());
        when(mappingRepository.findByClientIdAndStatusNot(eq(TENANT), eq(CLIENT_USER_ID), any()))
            .thenReturn(Collections.emptyList());
        when(scheduleRepository.countByClientId(TENANT, CLIENT_USER_ID)).thenReturn(0L);

        Map<String, Object> result = clientStatsService.getClientWithStats(TENANT, CLIENT_USER_ID);

        assertNotNull(result.get("client"));
        assertEquals(0L, result.get("currentConsultants"));
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
}
