package com.coresolution.consultation.controller;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.coresolution.consultation.dto.ConsultantClientMappingResponse;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.ClientStatsService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.consultation.service.ConsultantStatsService;
import com.coresolution.consultation.service.ConsultationRecordService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.MenuService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.RoleCommonCodeAuthorizationService;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.erp.ErpService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.OnboardingService;
import com.coresolution.core.util.StatusCodeHelper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * {@link AdminController#getPendingPaymentMappings} /
 * {@link AdminController#getPaymentConfirmedMappings} 응답 직렬화 회귀 가드.
 *
 * <p>회귀 배경: raw {@code ConsultantClientMapping} 엔티티를 {@code data.mappings} 에 실으면
 * consultant/client 연관 User 의 LAZY 연관({@code userSocialAccounts} 등)이 Jackson 직렬화
 * 시점에 열리며 {@code LazyInitializationException} → HTTP 500 이 발생한다
 * ({@code spring.jpa.open-in-view=false}). 이 테스트는 컨트롤러가 scalar 기반
 * {@link ConsultantClientMappingResponse} DTO 목록을 ApiResponse 로 래핑해 반환하는지와
 * ObjectMapper 직렬화가 예외 없이 성공하는지를 검증한다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-08
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminController pending-payment / payment-confirmed LazyInit 가드")
class AdminControllerGetPendingPaymentMappingsLazyInitGuardTest {

    private static final Long MAPPING_ID = Math.abs(UUID.randomUUID().getMostSignificantBits());
    private static final Long CONSULTANT_ID = Math.abs(UUID.randomUUID().getLeastSignificantBits());
    private static final Long CLIENT_ID = Math.abs(UUID.randomUUID().getMostSignificantBits() >>> 1);

    @Mock private AdminService adminService;
    @Mock private BranchService branchService;
    @Mock private ScheduleService scheduleService;
    @Mock private ConsultationRecordService consultationRecordService;
    @Mock private DynamicPermissionService dynamicPermissionService;
    @Mock private MenuService menuService;
    @Mock private FinancialTransactionService financialTransactionService;
    @Mock private ErpService erpService;
    @Mock private ConsultantRatingService consultantRatingService;
    @Mock private UserSocialAccountRepository userSocialAccountRepository;
    @Mock private UserService userService;
    @Mock private StoredProcedureService storedProcedureService;
    @Mock private PersonalDataEncryptionUtil personalDataEncryptionUtil;
    @Mock private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock private ConsultantStatsService consultantStatsService;
    @Mock private ClientStatsService clientStatsService;
    @Mock private CommonCodeService commonCodeService;
    @Mock private RoleCommonCodeAuthorizationService roleCommonCodeAuthorizationService;
    @Mock private StatusCodeHelper statusCodeHelper;
    @Mock private OnboardingService onboardingService;
    @Mock private RealTimeStatisticsService realTimeStatisticsService;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private AdminController controller;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Test
    @DisplayName("GET /api/v1/admin/mappings/pending-payment — DTO 목록 + Jackson 직렬화 성공")
    void getPendingPaymentMappings_returnsDtoListWrappedInApiResponse_andSerializes() {
        ConsultantClientMappingResponse dto = sampleDto("PENDING_PAYMENT", "PENDING");
        when(adminService.getPendingPaymentMappings()).thenReturn(List.of(dto));

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.getPendingPaymentMappings();

        assertListResponse(response, "PENDING_PAYMENT");
    }

    @Test
    @DisplayName("GET /api/v1/admin/mappings/payment-confirmed — DTO 목록 + Jackson 직렬화 성공")
    void getPaymentConfirmedMappings_returnsDtoListWrappedInApiResponse_andSerializes() {
        ConsultantClientMappingResponse dto = sampleDto("PAYMENT_CONFIRMED", "CONFIRMED");
        when(adminService.getPaymentConfirmedMappings()).thenReturn(List.of(dto));

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.getPaymentConfirmedMappings();

        assertListResponse(response, "PAYMENT_CONFIRMED");
    }

    private ConsultantClientMappingResponse sampleDto(String status, String paymentStatus) {
        return ConsultantClientMappingResponse.builder()
                .id(MAPPING_ID)
                .consultantId(CONSULTANT_ID)
                .clientId(CLIENT_ID)
                .status(status)
                .paymentStatus(paymentStatus)
                .totalSessions(10)
                .remainingSessions(10)
                .packageName("표준 10회기")
                .packagePrice(500_000L)
                .paymentAmount(500_000L)
                .build();
    }

    @SuppressWarnings("unchecked")
    private void assertListResponse(
            ResponseEntity<ApiResponse<Map<String, Object>>> response,
            String expectedStatus) {
        assertEquals(HttpStatus.OK, response.getStatusCode());

        ApiResponse<Map<String, Object>> body = response.getBody();
        assertNotNull(body, "응답 body 는 null 이면 안 된다");
        assertTrue(body.isSuccess(), "성공 응답이어야 한다");
        assertInstanceOf(ApiResponse.class, body, "응답 body 는 ApiResponse 여야 한다");

        Map<String, Object> data = body.getData();
        assertNotNull(data, "data 는 null 이면 안 된다");
        assertEquals(1, data.get("count"));

        Object mappingsObj = data.get("mappings");
        assertInstanceOf(List.class, mappingsObj, "mappings 는 List 여야 한다");
        List<?> mappings = (List<?>) mappingsObj;
        assertEquals(1, mappings.size());
        assertInstanceOf(ConsultantClientMappingResponse.class, mappings.get(0),
                "mappings 요소는 raw entity 가 아닌 ConsultantClientMappingResponse 여야 한다");

        ConsultantClientMappingResponse first = (ConsultantClientMappingResponse) mappings.get(0);
        assertEquals(CONSULTANT_ID, first.getConsultantId());
        assertEquals(CLIENT_ID, first.getClientId());
        assertEquals(expectedStatus, first.getStatus());
        assertEquals(500_000L, first.getPackagePrice());
        assertEquals(500_000L, first.getPaymentAmount());

        assertDoesNotThrow(() -> objectMapper.writeValueAsString(body),
                "Jackson 직렬화는 Lazy proxy 없이 성공해야 한다");
    }
}
