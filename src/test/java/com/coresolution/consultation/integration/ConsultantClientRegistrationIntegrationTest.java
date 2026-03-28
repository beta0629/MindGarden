package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.consultation.dto.ClientRegistrationRequest;
import com.coresolution.consultation.dto.ConsultantRegistrationRequest;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.Consultant;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;

/**
 * 상담사·내담자 등록 API 통합 테스트 (Phase 4)
 * rrnFirst6, rrnLast1, address, workHistory 등록 후 User/Consultant·Client 반영 검증
 *
 * @author MindGarden
 * @since 2026-03-02
 */
@SpringBootTest(classes = ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("상담사·내담자 등록 통합 테스트")
class ConsultantClientRegistrationIntegrationTest {

    @Autowired
    private AdminService adminService;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private ConsultantRepository consultantRepository;

    private String tenantId;

    @BeforeEach
    void setUp() {
        // BaseEntity.tenant_id 컬럼 길이 36 — 접두사+UUID 조합은 DB 제약 초과하므로 UUID만 사용
        tenantId = UUID.randomUUID().toString();
        Tenant tenant = Tenant.builder()
                .tenantId(tenantId)
                .name("등록 테스트 테넌트")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("reg@test.com")
                .build();
        tenantRepository.save(tenant);
        TenantContextHolder.setTenantId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Nested
    @DisplayName("상담사 등록 (rrn·주소·경력)")
    class ConsultantRegistration {

        @Test
        @DisplayName("ConsultantRegistrationRequest에 rrnFirst6, rrnLast1, address, workHistory 포함 POST 등록 시 User/Consultant에 birthDate, gender, address 반영")
        void registerConsultant_withRrnAndAddress_reflectsOnUserAndConsultant() {
            // Given
            ConsultantRegistrationRequest request = ConsultantRegistrationRequest.builder()
                    .email("consultant-rrn-" + UUID.randomUUID() + "@test.com")
                    .name("상담사이름")
                    .phone("010-1111-2222")
                    .rrnFirst6("900101")
                    .rrnLast1("1")
                    .address("서울시 강남구 테헤란로 123")
                    .addressDetail("101동 1001호")
                    .postalCode("06134")
                    .qualifications("임상심리사 1급")
                    .workHistory("2020-2025 A상담센터 수석상담사")
                    .specialization("청소년상담")
                    .build();

            // When
            User result = adminService.registerConsultant(request);

            // Then: User(Consultant)에 birthDate, gender, address 반영
            assertThat(result).isNotNull();
            assertThat(result.getBirthDate()).isEqualTo(java.time.LocalDate.of(1990, 1, 1));
            assertThat(result.getGender()).isEqualTo("MALE");
            assertThat(result.getAddress()).isEqualTo("서울시 강남구 테헤란로 123");
            assertThat(result.getAddressDetail()).isEqualTo("101동 1001호");
            assertThat(result.getPostalCode()).isEqualTo("06134");

            Consultant consultant = consultantRepository.findById(result.getId()).orElse(null);
            assertThat(consultant).isNotNull();
            assertThat(consultant.getCertification()).isEqualTo("임상심리사 1급");
            assertThat(consultant.getWorkHistory()).isEqualTo("2020-2025 A상담센터 수석상담사");
        }

        @Test
        @DisplayName("상담사 등록 시 주민번호 없이 주소·경력만 저장 가능")
        void registerConsultant_withoutRrn_onlyAddressAndWorkHistory() {
            ConsultantRegistrationRequest request = ConsultantRegistrationRequest.builder()
                    .email("consultant-no-rrn-" + UUID.randomUUID() + "@test.com")
                    .name("상담사B")
                    .address("경기도 성남시")
                    .addressDetail("상세주소")
                    .postalCode("12345")
                    .workHistory("5년 경력")
                    .build();

            User result = adminService.registerConsultant(request);

            assertThat(result).isNotNull();
            assertThat(result.getAddress()).isEqualTo("경기도 성남시");
            assertThat(result.getAddressDetail()).isEqualTo("상세주소");
            assertThat(result.getPostalCode()).isEqualTo("12345");
            Consultant c = consultantRepository.findById(result.getId()).orElse(null);
            assertThat(c).isNotNull();
            assertThat(c.getWorkHistory()).isEqualTo("5년 경력");
            assertThat(result.getBirthDate()).isNull();
            assertThat(result.getGender()).isNull();
        }
    }

    @Nested
    @DisplayName("내담자 등록 (rrn·주소)")
    class ClientRegistration {

        @Test
        @DisplayName("ClientRegistrationRequest에 rrn·주소 포함 등록 시 Client에 birthDate, gender, addressDetail, postalCode 반영")
        void registerClient_withRrnAndAddress_reflectsOnClient() {
            ClientRegistrationRequest request = ClientRegistrationRequest.builder()
                    .email("client-rrn-" + UUID.randomUUID() + "@test.com")
                    .name("내담자이름")
                    .rrnFirst6("050531")
                    .rrnLast1("4")
                    .address("부산시 해운대구 우동 100")
                    .addressDetail("202동 505호")
                    .postalCode("48094")
                    .build();

            Client result = adminService.registerClient(request);

            assertThat(result).isNotNull();
            assertThat(result.getBirthDate()).isEqualTo(java.time.LocalDate.of(2005, 5, 31));
            assertThat(result.getGender()).isEqualTo("FEMALE");
            assertThat(result.getAddress()).isNotNull();
            assertThat(result.getAddressDetail()).isEqualTo("202동 505호");
            assertThat(result.getPostalCode()).isEqualTo("48094");
        }

        @Test
        @DisplayName("내담자 등록 시 주민번호 없이 주소만 저장 가능")
        void registerClient_withoutRrn_onlyAddress() {
            ClientRegistrationRequest request = ClientRegistrationRequest.builder()
                    .email("client-no-rrn-" + UUID.randomUUID() + "@test.com")
                    .address("인천시 연수구")
                    .addressDetail("301호")
                    .postalCode("22001")
                    .build();

            Client result = adminService.registerClient(request);

            assertThat(result).isNotNull();
            assertThat(result.getAddressDetail()).isEqualTo("301호");
            assertThat(result.getPostalCode()).isEqualTo("22001");
            assertThat(result.getBirthDate()).isNull();
            assertThat(result.getGender()).isNull();
        }
    }
}
