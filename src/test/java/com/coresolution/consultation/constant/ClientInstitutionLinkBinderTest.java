package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.PartnerInstitution;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.PartnerInstitutionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 내담자는 기관 마스터 FK만 가진다. 기관 행을 복제하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ClientInstitutionLinkBinder")
class ClientInstitutionLinkBinderTest {

    private static final String TENANT_ID = "tenant-institution-bind-1";

    @Mock
    private PartnerInstitutionRepository partnerInstitutionRepository;

    @Test
    @DisplayName("같은 기관 id를 여러 내담자에 연결하고 기관 행은 저장하지 않는다")
    void bind_setsFkWithoutSavingInstitution() {
        PartnerInstitution institution = PartnerInstitution.builder()
                .name("마음연계센터")
                .contactName("김담당")
                .contactPhone("010-1111-2222")
                .documentEmail("doc@partner.example")
                .build();
        institution.setId(11L);
        institution.setTenantId(TENANT_ID);
        when(partnerInstitutionRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT_ID, 11L))
                .thenReturn(Optional.of(institution));

        Client first = new Client();
        Client second = new Client();
        ClientInstitutionLinkBinder.bind(first, 11L, partnerInstitutionRepository, TENANT_ID);
        ClientInstitutionLinkBinder.bind(second, 11L, partnerInstitutionRepository, TENANT_ID);

        assertThat(first.getPartnerInstitutionId()).isEqualTo(11L);
        assertThat(second.getPartnerInstitutionId()).isEqualTo(11L);
        assertThat(first.getInstitutionName()).isEqualTo("마음연계센터");
        verify(partnerInstitutionRepository).findByTenantIdAndIdAndIsDeletedFalse(TENANT_ID, 11L);
        verify(partnerInstitutionRepository, never()).save(any());
    }

    @Test
    @DisplayName("tenantId 없이 연결하지 않는다")
    void bind_requiresTenantId() {
        Client client = new Client();
        assertThatThrownBy(() -> ClientInstitutionLinkBinder.bind(client, 1L, partnerInstitutionRepository, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("tenantId는 필수입니다.");
    }

    @Test
    @DisplayName("테넌트에 없는 기관은 거부")
    void bind_rejectsMissingInstitution() {
        when(partnerInstitutionRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT_ID, 99L))
                .thenReturn(Optional.empty());
        Client client = new Client();
        assertThatThrownBy(() -> ClientInstitutionLinkBinder.bind(client, 99L, partnerInstitutionRepository, TENANT_ID))
                .isInstanceOf(EntityNotFoundException.class);
    }
}
