package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.dto.PartnerInstitutionCreateRequest;
import com.coresolution.consultation.dto.PartnerInstitutionResponse;
import com.coresolution.consultation.entity.PartnerInstitution;
import com.coresolution.consultation.repository.PartnerInstitutionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 연계 기관 마스터 저장 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PartnerInstitutionServiceImpl")
class PartnerInstitutionServiceImplTest {

    private static final String TENANT_ID = "tenant-institution-master-1";

    @Mock
    private PartnerInstitutionRepository partnerInstitutionRepository;

    @InjectMocks
    private PartnerInstitutionServiceImpl service;

    @Test
    @DisplayName("기관 저장 시 월말 문서 수신 이메일을 남긴다")
    void create_persistsDocumentEmail() {
        when(partnerInstitutionRepository.save(any(PartnerInstitution.class)))
                .thenAnswer(invocation -> {
                    PartnerInstitution entity = invocation.getArgument(0);
                    entity.setId(11L);
                    return entity;
                });

        PartnerInstitutionCreateRequest request = PartnerInstitutionCreateRequest.builder()
                .name("마음연계센터")
                .contactName("김담당")
                .contactPhone("010-0000-0000")
                .documentEmail("monthly@partner.example")
                .build();

        PartnerInstitutionResponse saved = service.create(TENANT_ID, request);

        ArgumentCaptor<PartnerInstitution> captor = ArgumentCaptor.forClass(PartnerInstitution.class);
        verify(partnerInstitutionRepository).save(captor.capture());
        PartnerInstitution persisted = captor.getValue();
        assertThat(persisted.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(persisted.getDocumentEmail()).isEqualTo("monthly@partner.example");
        assertThat(saved.getMonthlyDocument().getDocumentEmail()).isEqualTo("monthly@partner.example");
        assertThat(saved.getMonthlyDocument().getInstitutionName()).isEqualTo("마음연계센터");
    }

    @Test
    @DisplayName("tenantId 없으면 저장하지 않는다")
    void create_requiresTenantId() {
        PartnerInstitutionCreateRequest request = PartnerInstitutionCreateRequest.builder()
                .name("기관")
                .contactName("담당")
                .documentEmail("a@b.c")
                .build();

        assertThatThrownBy(() -> service.create(null, request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("tenantId는 필수입니다.");
    }
}
