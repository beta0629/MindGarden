package com.coresolution.consultation.controller;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.HashMap;
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
 * Admin mapping write 엔드포인트(reject / use-session / extend-sessions) 응답 직렬화 회귀 가드.
 *
 * <p>raw ConsultantClientMapping 엔티티를 ApiResponse 에 실으면 LAZY User 그래프 Jackson 직렬화 시
 * LazyInitializationException(500) 이 발생할 수 있다. 컨트롤러가
 * {@link ConsultantClientMappingResponse} 를 반환하는지와 ObjectMapper 직렬화 무예외를 검증한다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-04
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminController mapping write LazyInit 가드 (reject/use-session/extend-sessions)")
class AdminControllerMappingWriteLazyInitGuardTest {

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
    @DisplayName("POST /api/v1/admin/mappings/{id}/reject — DTO 응답 + Jackson 직렬화 성공")
    void rejectMapping_returnsDtoWrappedInApiResponse_andSerializes() {
        ConsultantClientMappingResponse serviceResponse = sampleDto("TERMINATED");
        String reason = "테스트 거부 사유";
        when(adminService.rejectMapping(eq(MAPPING_ID), eq(reason))).thenReturn(serviceResponse);

        Map<String, Object> request = new HashMap<>();
        request.put("reason", reason);

        ResponseEntity<ApiResponse<ConsultantClientMappingResponse>> response =
                controller.rejectMapping(MAPPING_ID, request);

        assertDtoApiResponseSerializes(response);
    }

    @Test
    @DisplayName("POST /api/v1/admin/mappings/{id}/use-session — DTO 응답 + Jackson 직렬화 성공")
    void useSession_returnsDtoWrappedInApiResponse_andSerializes() {
        ConsultantClientMappingResponse serviceResponse = sampleDto("ACTIVE");
        when(adminService.useSession(eq(MAPPING_ID))).thenReturn(serviceResponse);

        ResponseEntity<ApiResponse<ConsultantClientMappingResponse>> response =
                controller.useSession(MAPPING_ID);

        assertDtoApiResponseSerializes(response);
    }

    @Test
    @DisplayName("POST /api/v1/admin/mappings/{id}/extend-sessions — DTO 응답 + Jackson 직렬화 성공")
    void extendSessions_returnsDtoWrappedInApiResponse_andSerializes() {
        ConsultantClientMappingResponse serviceResponse = sampleDto("ACTIVE");
        Integer additionalSessions = 5;
        String packageName = "연장 패키지";
        Long packagePrice = 250_000L;
        when(adminService.extendSessions(eq(MAPPING_ID), eq(additionalSessions), eq(packageName), eq(packagePrice)))
                .thenReturn(serviceResponse);

        Map<String, Object> request = new HashMap<>();
        request.put("additionalSessions", additionalSessions);
        request.put("packageName", packageName);
        request.put("packagePrice", packagePrice);

        ResponseEntity<ApiResponse<ConsultantClientMappingResponse>> response =
                controller.extendSessions(MAPPING_ID, request);

        assertDtoApiResponseSerializes(response);
    }

    private ConsultantClientMappingResponse sampleDto(String status) {
        return ConsultantClientMappingResponse.builder()
                .id(MAPPING_ID)
                .consultantId(CONSULTANT_ID)
                .clientId(CLIENT_ID)
                .status(status)
                .totalSessions(10)
                .remainingSessions(7)
                .packageName("테스트 패키지")
                .packagePrice(300_000L)
                .build();
    }

    private void assertDtoApiResponseSerializes(
            ResponseEntity<ApiResponse<ConsultantClientMappingResponse>> response) {
        assertEquals(HttpStatus.OK, response.getStatusCode());

        ApiResponse<ConsultantClientMappingResponse> body = response.getBody();
        assertNotNull(body, "응답 body 는 null 이면 안 된다");
        assertTrue(body.isSuccess(), "성공 응답이어야 한다");
        assertInstanceOf(ApiResponse.class, body, "응답 body 는 ApiResponse 여야 한다");
        assertInstanceOf(ConsultantClientMappingResponse.class, body.getData(),
                "응답 data 는 raw entity 가 아닌 ConsultantClientMappingResponse 여야 한다");
        assertEquals(CONSULTANT_ID, body.getData().getConsultantId());
        assertEquals(CLIENT_ID, body.getData().getClientId());

        assertDoesNotThrow(() -> objectMapper.writeValueAsString(body),
                "Jackson 직렬화는 Lazy proxy 없이 성공해야 한다");
    }
}
