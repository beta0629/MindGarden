package com.coresolution.consultation.assessment.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.service.ai.privacy.AiPiiMaskingService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 심리검사 AI 보고서 — 내담자·담당 상담사 이름을 같은 테넌트에서 식별자로 모은다 (#1422 후속).
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("PsychAssessmentReportServiceImpl 이름 식별자 수집")
class PsychAssessmentReportMaskingIdentifiersTest {

    private static final String TENANT = "tenant-psych-mask";

    @Test
    @DisplayName("내담자 + 종료되지 않은 매칭의 상담사 id 로 같은 테넌트 이름을 조회한다")
    void resolvesClientAndConsultantNamesInTenant() {
        ConsultantClientMappingRepository mappings = mock(ConsultantClientMappingRepository.class);
        AiPiiMaskingService masking = mock(AiPiiMaskingService.class);
        User consultant = new User();
        consultant.setId(30L);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setConsultant(consultant);
        when(mappings.findByClientIdAndStatusNot(TENANT, 7L, ConsultantClientMapping.MappingStatus.TERMINATED))
                .thenReturn(List.of(mapping));
        when(masking.resolveUserIdentifiers(TENANT, 7L, 30L)).thenReturn(List.of("홍길순", "김상담"));
        PsychAssessmentReportServiceImpl service = service(mappings, masking);

        List<String> identifiers = ReflectionTestUtils.invokeMethod(service, "resolveMaskingIdentifiers", TENANT, 7L);

        assertThat(identifiers).containsExactly("홍길순", "김상담");
        verify(masking).resolveUserIdentifiers(TENANT, 7L, 30L);
    }

    @Test
    @DisplayName("내담자 없는 문서 — 조회 없이 빈 목록")
    void noClient_empty() {
        ConsultantClientMappingRepository mappings = mock(ConsultantClientMappingRepository.class);
        AiPiiMaskingService masking = mock(AiPiiMaskingService.class);

        List<String> identifiers = ReflectionTestUtils.invokeMethod(service(mappings, masking),
                "resolveMaskingIdentifiers", TENANT, null);

        assertThat(identifiers).isEmpty();
        verify(mappings, never()).findByClientIdAndStatusNot(ArgumentMatchers.any(), ArgumentMatchers.any(),
                ArgumentMatchers.any());
    }

    private static PsychAssessmentReportServiceImpl service(ConsultantClientMappingRepository mappings,
            AiPiiMaskingService masking) {
        PsychAssessmentReportServiceImpl service = new PsychAssessmentReportServiceImpl(
                null, null, null, null, null, null, masking, mappings, null);
        return service;
    }
}
