package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Optional;
import com.coresolution.consultation.constant.InstitutionLinkConstants;
import com.coresolution.consultation.dto.InstitutionLinkContractCreateRequest;
import com.coresolution.consultation.dto.InstitutionLinkContractResponse;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.InstitutionLinkContract;
import com.coresolution.consultation.entity.PartnerInstitution;
import com.coresolution.consultation.exception.ValidationException;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.InstitutionLinkContractRepository;
import com.coresolution.consultation.repository.PartnerInstitutionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 타기관 연계 등록이 회기 매핑 테이블이 아닌 신규 테이블로 가는지 검증.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("InstitutionLinkContractServiceImpl")
class InstitutionLinkContractServiceImplTest {

    private static final String TENANT_ID = "tenant-institution-link-1";

    @Mock
    private InstitutionLinkContractRepository institutionLinkContractRepository;

    @Mock
    private PartnerInstitutionRepository partnerInstitutionRepository;

    @Mock
    private ClientRepository clientRepository;

    @InjectMocks
    private InstitutionLinkContractServiceImpl service;

    @Test
    @DisplayName("타기관 연계 insert 는 institution_link_contracts 로만 저장된다")
    void create_insertsIntoInstitutionLinkContractTable() {
        when(clientRepository.findByTenantIdAndIdIncludingDeleted(TENANT_ID, 9L))
                .thenReturn(Optional.of(client(9L, "최가을")));
        when(partnerInstitutionRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT_ID, 3L))
                .thenReturn(Optional.of(institution(3L)));
        when(institutionLinkContractRepository.save(any(InstitutionLinkContract.class)))
                .thenAnswer(invocation -> {
                    InstitutionLinkContract entity = invocation.getArgument(0);
                    entity.setId(41L);
                    return entity;
                });

        InstitutionLinkContractCreateRequest request = InstitutionLinkContractCreateRequest.builder()
                .clientId(9L)
                .institutionId(3L)
                .periodStart(LocalDate.of(2026, 9, 1))
                .prepaidAmount(200_000L)
                .monthlyAmount(500_000L)
                .build();

        InstitutionLinkContractResponse saved = service.create(TENANT_ID, request);

        ArgumentCaptor<InstitutionLinkContract> captor = ArgumentCaptor.forClass(InstitutionLinkContract.class);
        verify(institutionLinkContractRepository).save(captor.capture());
        InstitutionLinkContract persisted = captor.getValue();
        assertThat(persisted.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(persisted.getClientId()).isEqualTo(9L);
        assertThat(persisted.getInstitutionId()).isEqualTo(3L);
        assertThat(persisted.getPrepaidAmount()).isEqualTo(200_000L);
        assertThat(persisted.getMonthlyAmount()).isEqualTo(500_000L);
        assertThat(persisted.getStatus()).isEqualTo(InstitutionLinkConstants.STATUS_ACTIVE);
        assertThat(persisted.getSourceMappingId()).isNull();
        assertThat(fieldNames(InstitutionLinkContract.class))
                .doesNotContain("remainingSessions", "usedSessions", "totalSessions");
        assertThat(saved.getId()).isEqualTo(41L);
        assertThat(saved.getMonthlyDocument().getDocumentEmail()).isEqualTo("docs@partner.example");
        assertThat(saved.getClientName()).isEqualTo("최가을");
    }

    @Test
    @DisplayName("tenantId 없으면 저장하지 않는다")
    void create_requiresTenantId() {
        InstitutionLinkContractCreateRequest request = InstitutionLinkContractCreateRequest.builder()
                .clientId(2L)
                .institutionId(3L)
                .prepaidAmount(1L)
                .monthlyAmount(2L)
                .build();

        assertThatThrownBy(() -> service.create(" ", request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("tenantId는 필수입니다.");
        verify(institutionLinkContractRepository, never()).save(any());
    }

    @Test
    @DisplayName("기관 없으면 ValidationException")
    void create_requiresInstitutionId() {
        InstitutionLinkContractCreateRequest request = InstitutionLinkContractCreateRequest.builder()
                .clientId(2L)
                .prepaidAmount(1L)
                .monthlyAmount(2L)
                .build();

        assertThatThrownBy(() -> service.create(TENANT_ID, request))
                .isInstanceOf(ValidationException.class);
        verify(institutionLinkContractRepository, never()).save(any());
    }

    @Test
    @DisplayName("회기 매핑 엔티티와 필드가 섞이지 않는다")
    void contractEntity_isSeparateFromSessionMapping() {
        assertThat(InstitutionLinkContract.class.getSuperclass().getSimpleName())
                .isEqualTo("BaseEntity");
        assertThat(ConsultantClientMapping.class.getDeclaredFields())
                .extracting(Field::getName)
                .contains("remainingSessions");
        assertThat(fieldNames(InstitutionLinkContract.class))
                .doesNotContain("remainingSessions");
    }

    private static Client client(Long id, String name) {
        Client client = new Client();
        client.setId(id);
        client.setName(name);
        client.setTenantId(TENANT_ID);
        client.setIsDeleted(false);
        return client;
    }

    private static PartnerInstitution institution(Long id) {
        PartnerInstitution institution = PartnerInstitution.builder()
                .name("연계기관")
                .contactName("담당자")
                .documentEmail("docs@partner.example")
                .build();
        institution.setId(id);
        institution.setTenantId(TENANT_ID);
        institution.setIsDeleted(false);
        return institution;
    }

    private static String[] fieldNames(Class<?> type) {
        return Arrays.stream(type.getDeclaredFields()).map(Field::getName).toArray(String[]::new);
    }
}
