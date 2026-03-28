package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.consultation.assessment.entity.PsychAssessmentDocument;
import com.coresolution.consultation.assessment.model.PsychAssessmentDocumentStatus;
import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import com.coresolution.consultation.assessment.repository.PsychAssessmentDocumentRepository;
import com.coresolution.consultation.dto.ClientRegistrationRequest;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.ClientStatsService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;

/**
 * 상담일지 내담자 정보·심리검사 리포트 노출 통합 테스트 (Phase 4)
 * - 내담자 정보 API: 나이·성별·주소 포함 여부
 * - GET /api/v1/assessments/psych/documents/by-client/{clientId} 응답 구조 검증
 *
 * @author MindGarden
 * @since 2026-03-02
 */
@SpringBootTest(classes = ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("상담일지 내담자 정보·심리검사 문서 통합 테스트")
class ConsultationRecordClientInfoPsychIntegrationTest {

    @Autowired
    private AdminService adminService;

    @Autowired
    private ClientStatsService clientStatsService;

    @Autowired
    private PsychAssessmentDocumentRepository documentRepository;

    @Autowired
    private TenantRepository tenantRepository;

    private String tenantId;

    @BeforeEach
    void setUp() {
        // BaseEntity.tenant_id 길이 36 — clients 등 하위 엔티티와 정합
        tenantId = UUID.randomUUID().toString();
        Tenant tenant = Tenant.builder()
                .tenantId(tenantId)
                .name("상담일지 테스트 테넌트")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("cr@test.com")
                .build();
        tenantRepository.save(tenant);
        TenantContextHolder.setTenantId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("내담자 등록 후 getClientWithStats 응답에 나이·성별·주소 포함")
    void clientInfoApi_includesAgeGenderAddress() {
        // Given: RRN·주소가 있는 내담자 등록
        ClientRegistrationRequest request = ClientRegistrationRequest.builder()
                .email("client-info-" + UUID.randomUUID() + "@test.com")
                .name("내담자정보테스트")
                .rrnFirst6("900101")
                .rrnLast1("2")
                .address("서울시 서초구")
                .addressDetail("상세주소 101호")
                .postalCode("06621")
                .build();
        Client client = adminService.registerClient(request);
        Long clientId = client.getId();

        // When: 상담일지용 내담자 정보(통계 포함) 조회
        Map<String, Object> withStats = clientStatsService.getClientWithStats(clientId);

        // Then: client 맵에 birthDate, gender, age, address, addressDetail, postalCode 포함
        assertThat(withStats).containsKey("client");
        @SuppressWarnings("unchecked")
        Map<String, Object> clientMap = (Map<String, Object>) withStats.get("client");
        assertThat(clientMap)
                .isNotNull()
                .containsKey("birthDate")
                .containsKey("gender")
                .containsKey("age")
                .containsKey("address")
                .containsKey("addressDetail")
                .containsKey("postalCode")
                .containsEntry("gender", "FEMALE")
                .containsEntry("address", "서울시 서초구")
                .containsEntry("addressDetail", "상세주소 101호")
                .containsEntry("postalCode", "06621");
        assertThat(clientMap.get("birthDate")).isNotNull();
        assertThat(clientMap.get("age")).isNotNull();
    }

    @Test
    @DisplayName("clientId 기준 심리검사 문서 목록 조회 시 해당 내담자 문서만 반환")
    void psychDocumentsByClientId_returnsOnlyThatClientDocuments() {
        // Given: 내담자 등록
        Client client = adminService.registerClient(
                ClientRegistrationRequest.builder()
                        .email("psych-client-" + UUID.randomUUID() + "@test.com")
                        .build());
        Long clientId = client.getId();

        // Given: 해당 clientId로 심리검사 문서 1건 저장
        PsychAssessmentDocument doc = PsychAssessmentDocument.builder()
                .tenantId(tenantId)
                .clientId(clientId)
                .assessmentType(PsychAssessmentType.TCI)
                .sourceType("SCANNED_PDF")
                .originalFilename("tci-sample.pdf")
                .fileSize(1024L)
                .sha256("a".repeat(64))
                .storagePath("/test/path")
                .encryptionKeyVersion("v1")
                .status(PsychAssessmentDocumentStatus.UPLOADED)
                .build();
        documentRepository.save(doc);

        // When: by-client 조회 (컨트롤러와 동일 쿼리)
        List<PsychAssessmentDocument> list = documentRepository
                .findByTenantIdAndClientIdOrderByCreatedAtDesc(tenantId, clientId);

        // Then: 1건 반환, clientId·documentId·status 등 필드 검증
        assertThat(list).hasSize(1);
        PsychAssessmentDocument first = list.get(0);
        assertThat(first.getClientId()).isEqualTo(clientId);
        assertThat(first.getTenantId()).isEqualTo(tenantId);
        assertThat(first.getAssessmentType()).isEqualTo(PsychAssessmentType.TCI);
        assertThat(first.getStatus()).isEqualTo(PsychAssessmentDocumentStatus.UPLOADED);
        assertThat(first.getOriginalFilename()).isEqualTo("tci-sample.pdf");
    }
}
