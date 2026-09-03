package com.coresolution.consultation.controller;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;
import com.coresolution.consultation.dto.ConsultantClientMappingResponse;
import com.coresolution.consultation.entity.User;
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
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.OnboardingService;
import com.coresolution.core.util.StatusCodeHelper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * {@link AdminController#updateMapping(Long, ConsultantClientMappingCreateRequest, HttpSession)}
 * 응답 직렬화 회귀 가드.
 *
 * <p>회귀 배경: raw ConsultantClientMapping 엔티티를 응답에 실으면 consultant/client 연관 User 의
 * LAZY 연관(userSocialAccounts 등)이 Jackson 직렬화 시점에 열리면서 500 이 발생할 수 있다.
 * 이 테스트는 컨트롤러가 raw entity 대신 scalar 기반
 * {@link ConsultantClientMappingResponse} DTO 를 ApiResponse 로 래핑해 반환하는지와 실제
 * ObjectMapper 직렬화가 예외 없이 성공하는지를 함께 검증한다.</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminController updateMapping LazyInit 가드")
class AdminControllerUpdateMappingLazyInitGuardTest {

    private static final String TENANT_ID = "tenant-update-mapping-" + UUID.randomUUID();
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
    @Mock private HttpSession session;

    @InjectMocks
    private AdminController controller;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Test
    @DisplayName("PUT /api/v1/admin/mappings/{id} — DTO 응답 + Jackson 직렬화 성공")
    void updateMapping_returnsDtoWrappedInApiResponse_andSerializes() {
        // Given
        ConsultantClientMappingCreateRequest request = ConsultantClientMappingCreateRequest.builder()
                .consultantId(CONSULTANT_ID)
                .clientId(CLIENT_ID)
                .startDate(LocalDate.of(2026, 9, 3))
                .endDate(LocalDate.of(2026, 12, 3))
                .status("ACTIVE")
                .notes("직렬화 가드 테스트")
                .assignedBy("테스트 관리자")
                .paymentStatus("COMPLETED")
                .totalSessions(12)
                .remainingSessions(8)
                .packageName("라이트 패키지")
                .packagePrice(120000L)
                .paymentAmount(120000L)
                .paymentMethod("CARD")
                .paymentReference("REF-" + UUID.randomUUID())
                .paymentDate(LocalDateTime.of(2026, 9, 3, 14, 57))
                .approvedBy("테스트 관리자")
                .paymentTiming("ADVANCE")
                .build();

        ConsultantClientMappingResponse serviceResponse = ConsultantClientMappingResponse.builder()
                .id(MAPPING_ID)
                .consultantId(CONSULTANT_ID)
                .clientId(CLIENT_ID)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status("ACTIVE")
                .notes(request.getNotes())
                .assignedBy(request.getAssignedBy())
                .paymentStatus(request.getPaymentStatus())
                .totalSessions(request.getTotalSessions())
                .remainingSessions(request.getRemainingSessions())
                .packageName(request.getPackageName())
                .packagePrice(request.getPackagePrice())
                .paymentAmount(request.getPaymentAmount())
                .paymentMethod(request.getPaymentMethod())
                .paymentReference(request.getPaymentReference())
                .paymentDate(request.getPaymentDate())
                .approvedBy(request.getApprovedBy())
                .paymentTiming(request.getPaymentTiming())
                .build();

        when(adminService.updateMapping(eq(MAPPING_ID), eq(request), eq("관리자 테스트")))
                .thenReturn(serviceResponse);

        User admin = new User();
        admin.setTenantId(TENANT_ID);
        admin.setRole(UserRole.ADMIN);
        admin.setName("관리자 테스트");

        // When
        ResponseEntity<ApiResponse<ConsultantClientMappingResponse>> response;
        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(admin);
            response = controller.updateMapping(MAPPING_ID, request, session);
        }

        // Then
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
