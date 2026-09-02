package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ConsultantClientDetailResponse;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.Consultant;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

/**
 * {@link ConsultantServiceImpl} — consultant client API {@code profileImageUrl} SSOT 노출 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-02
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConsultantServiceImpl — profileImageUrl SSOT")
class ConsultantServiceImplProfileImageUrlTest {

    private static final String TENANT_ID = "test-tenant";
    private static final Long CONSULTANT_ID = 10L;
    private static final Long CLIENT_ID = 20L;
    private static final String PROFILE_IMAGE_URL = "https://cdn.example.com/avatars/client-20.png";

    @Mock
    private ConsultantRepository consultantRepository;
    @Mock
    private TenantAccessControlService accessControlService;
    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private ClientRepository clientRepository;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;

    @InjectMocks
    private ConsultantServiceImpl consultantService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        lenient().when(encryptionUtil.safeDecrypt(anyString()))
            .thenAnswer(invocation -> invocation.getArgument(0));

        Consultant consultant = new Consultant();
        consultant.setId(CONSULTANT_ID);
        consultant.setTenantId(TENANT_ID);
        lenient().when(consultantRepository.findByTenantIdAndId(TENANT_ID, CONSULTANT_ID))
            .thenReturn(Optional.of(consultant));
        lenient().when(scheduleRepository.findMaxCompletedSessionDateByConsultantAndClientIds(
            anyString(), anyLong(), anyList(), any()))
            .thenReturn(Collections.emptyList());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("findClientsByConsultantId: User.profileImageUrl을 Client.profileImageUrl로 노출")
    void findClientsByConsultantId_exposesProfileImageUrlFromUser() {
        User clientUser = buildClientUserWithProfileImage();
        ConsultantClientMapping mapping = buildActiveMapping(clientUser);

        when(mappingRepository.findByConsultantIdAndStatusNot(
            eq(TENANT_ID), eq(CONSULTANT_ID), eq(ConsultantClientMapping.MappingStatus.INACTIVE)))
            .thenReturn(List.of(mapping));

        Page<Client> page = consultantService.findClientsByConsultantId(
            CONSULTANT_ID, "ALL", null, PageRequest.of(0, 10));

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getProfileImageUrl()).isEqualTo(PROFILE_IMAGE_URL);
    }

    @Test
    @DisplayName("findClientByConsultantId: User.profileImageUrl을 detail DTO profileImageUrl로 노출")
    void findClientByConsultantId_exposesProfileImageUrlFromUser() {
        User clientUser = buildClientUserWithProfileImage();
        ConsultantClientMapping mapping = buildActiveMapping(clientUser);

        when(mappingRepository.findByConsultantIdAndStatusNot(
            eq(TENANT_ID), eq(CONSULTANT_ID), eq(ConsultantClientMapping.MappingStatus.INACTIVE)))
            .thenReturn(List.of(mapping));
        when(clientRepository.findByTenantIdAndId(TENANT_ID, CLIENT_ID))
            .thenReturn(Optional.empty());

        Optional<ConsultantClientDetailResponse> result =
            consultantService.findClientByConsultantId(CONSULTANT_ID, CLIENT_ID);

        assertThat(result).isPresent();
        assertThat(result.get().getProfileImageUrl()).isEqualTo(PROFILE_IMAGE_URL);
    }

    @Test
    @DisplayName("findClientsByConsultantId: User.profileImageUrl 없으면 null")
    void findClientsByConsultantId_nullWhenUserHasNoProfileImageUrl() {
        User clientUser = buildClientUserWithProfileImage();
        clientUser.setProfileImageUrl(null);
        ConsultantClientMapping mapping = buildActiveMapping(clientUser);

        when(mappingRepository.findByConsultantIdAndStatusNot(
            eq(TENANT_ID), eq(CONSULTANT_ID), eq(ConsultantClientMapping.MappingStatus.INACTIVE)))
            .thenReturn(List.of(mapping));

        Page<Client> page = consultantService.findClientsByConsultantId(
            CONSULTANT_ID, "ALL", null, PageRequest.of(0, 10));

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getProfileImageUrl()).isNull();
    }

    private User buildClientUserWithProfileImage() {
        User user = User.builder()
            .userId("client-20")
            .email("client@test.example")
            .password("password12")
            .name("테스트내담자")
            .role(UserRole.CLIENT)
            .build();
        user.setId(CLIENT_ID);
        user.setTenantId(TENANT_ID);
        user.setProfileImageUrl(PROFILE_IMAGE_URL);
        return user;
    }

    private ConsultantClientMapping buildActiveMapping(User clientUser) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setClient(clientUser);
        mapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
        mapping.setStartDate(LocalDateTime.now().minusDays(1));
        mapping.setUsedSessions(3);
        return mapping;
    }
}
