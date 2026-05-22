package com.coresolution.consultation.service.impl;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.dto.TestNotificationAlimtalkTemplate;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.exception.AlimtalkTemplateFetchException;
import com.coresolution.consultation.integration.solapi.KakaoSolapiCredentialResolver;
import com.coresolution.consultation.integration.solapi.SolapiCredentials;
import com.coresolution.consultation.integration.solapi.SolapiKakaoTemplateClient;
import com.coresolution.consultation.repository.AdminTestNotificationLogRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.TenantKakaoAlimtalkSettingsRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.KakaoAlimTalkService;
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * {@link AdminTestNotificationServiceImpl} 알림톡 템플릿 조회 단위 테스트.
 *
 * <p>다음 두 가지 보강을 검증한다.
 * <ul>
 *   <li>enum 모드 — tenant 매칭 row 없고 코어({@code tenant_id IS NULL}) row만 있을 때 코어 폴백이
 *       반환된다(같은 {@code code_value} 중복은 테넌트 우선으로 dedup).</li>
 *   <li>live 모드 — 솔라피 응답이 실패면 {@link AlimtalkTemplateFetchException}을 던져 어드민이
 *       errorCode·errorMessage를 그대로 받을 수 있다.</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-22
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("어드민 테스트 발송 — 알림톡 템플릿 조회")
class AdminTestNotificationServiceImplAlimtalkTemplateTest {

    private static final String TENANT_ID = "tenant-incheon-counseling-001";
    private static final String CODE_GROUP = "ALIMTALK_TEMPLATE";

    @Mock
    private UserRepository userRepository;
    @Mock
    private CommonCodeRepository commonCodeRepository;
    @Mock
    private AdminTestNotificationLogRepository logRepository;
    @Mock
    private AdminTestNotificationLogger logger;
    @Mock
    private AdminTestNotificationRateLimiter rateLimiter;
    @Mock
    private SmsAuthService smsAuthService;
    @Mock
    private KakaoAlimTalkService kakaoAlimTalkService;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;
    @Mock
    private KakaoSolapiCredentialResolver solapiCredentialResolver;
    @Mock
    private SolapiKakaoTemplateClient solapiKakaoTemplateClient;
    @Mock
    private TenantKakaoAlimtalkSettingsRepository tenantKakaoAlimtalkSettingsRepository;

    private AdminTestNotificationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminTestNotificationServiceImpl(
            userRepository,
            commonCodeRepository,
            logRepository,
            logger,
            rateLimiter,
            smsAuthService,
            kakaoAlimTalkService,
            encryptionUtil,
            new ObjectMapper(),
            solapiCredentialResolver,
            solapiKakaoTemplateClient,
            tenantKakaoAlimtalkSettingsRepository);
    }

    @Test
    @DisplayName("enum 모드 — tenant row 없고 코어(NULL) row만 있을 때 코어 폴백 5건이 노출된다")
    void listCommonCodeTemplates_whenOnlyCoreRowsExist_returnsCoreFallback() {
        List<CommonCode> coreRows = List.of(
            buildCommonCode(null, "ATX_001", "결제 확인", 10, "{}"),
            buildCommonCode(null, "ATX_002", "예약 확정", 20, null),
            buildCommonCode(null, "ATX_003", "상담 안내", 30, null),
            buildCommonCode(null, "ATX_004", "후속 안내", 40, null),
            buildCommonCode(null, "ATX_005", "휴면 안내", 50, null));
        when(commonCodeRepository.findActiveByCodeGroupForTenantWithFallback(
                eq(CODE_GROUP), eq(TENANT_ID)))
            .thenReturn(coreRows);

        List<TestNotificationAlimtalkTemplate> result = service.listCommonCodeTemplates(TENANT_ID);

        assertThat(result).hasSize(5);
        assertThat(result).extracting(TestNotificationAlimtalkTemplate::getTemplateCode)
            .containsExactly("ATX_001", "ATX_002", "ATX_003", "ATX_004", "ATX_005");
        assertThat(result).allSatisfy(t -> {
            assertThat(t.getSource()).isEqualTo("COMMON_CODE");
            assertThat(t.getStatus()).isNull();
        });
    }

    @Test
    @DisplayName("enum 모드 — 같은 codeValue가 tenant·코어 양쪽에 있을 때 tenant row만 노출(dedup)")
    void listCommonCodeTemplates_whenDuplicateAcrossTenantAndCore_keepsTenantRow() {
        // 정렬 규약: tenant row(0) 먼저, 같은 sort_order 내 id ASC.
        List<CommonCode> mixedRows = List.of(
            buildCommonCode(TENANT_ID, "ATX_001", "테넌트 — 결제 확인", 10, "{}"),
            buildCommonCode(TENANT_ID, "ATX_010", "테넌트 — 신규 그룹 안내", 15, null),
            buildCommonCode(null, "ATX_001", "코어 — 결제 확인", 10, "{}"),
            buildCommonCode(null, "ATX_002", "코어 — 예약 확정", 20, null),
            buildCommonCode(null, "ATX_003", "코어 — 상담 안내", 30, null));
        when(commonCodeRepository.findActiveByCodeGroupForTenantWithFallback(
                eq(CODE_GROUP), eq(TENANT_ID)))
            .thenReturn(mixedRows);

        List<TestNotificationAlimtalkTemplate> result = service.listCommonCodeTemplates(TENANT_ID);

        assertThat(result).extracting(TestNotificationAlimtalkTemplate::getTemplateCode)
            .containsExactly("ATX_001", "ATX_010", "ATX_002", "ATX_003");
        assertThat(result).filteredOn(t -> "ATX_001".equals(t.getTemplateCode()))
            .singleElement()
            .extracting(TestNotificationAlimtalkTemplate::getTitle)
            .isEqualTo("테넌트 — 결제 확인");
    }

    @Test
    @DisplayName("enum 모드 — is_active=false row는 제외된다")
    void listCommonCodeTemplates_filtersInactiveRows() {
        CommonCode inactive = buildCommonCode(null, "ATX_INACTIVE", "비활성", 5, null);
        inactive.setIsActive(false);
        List<CommonCode> rows = List.of(
            inactive,
            buildCommonCode(null, "ATX_001", "결제 확인", 10, null));
        when(commonCodeRepository.findActiveByCodeGroupForTenantWithFallback(
                eq(CODE_GROUP), eq(TENANT_ID)))
            .thenReturn(rows);

        List<TestNotificationAlimtalkTemplate> result = service.listCommonCodeTemplates(TENANT_ID);

        assertThat(result).extracting(TestNotificationAlimtalkTemplate::getTemplateCode)
            .containsExactly("ATX_001");
    }

    @Test
    @DisplayName("live 모드 — 솔라피 자격증명 없으면 빈 리스트(에러 아님)")
    void listLiveAlimtalkTemplates_whenCredentialsMissing_returnsEmpty() {
        when(tenantKakaoAlimtalkSettingsRepository.findByTenantIdAndIsDeletedFalse(eq(TENANT_ID)))
            .thenReturn(Optional.empty());
        when(solapiCredentialResolver.resolveCredentials(any()))
            .thenReturn(new SolapiCredentials(null, null));

        List<TestNotificationAlimtalkTemplate> result = service.listLiveAlimtalkTemplates(TENANT_ID);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("live 모드 — 솔라피 4xx 응답이면 AlimtalkTemplateFetchException 발생")
    void listLiveAlimtalkTemplates_whenSolapi4xx_throwsAlimtalkTemplateFetchException() {
        when(tenantKakaoAlimtalkSettingsRepository.findByTenantIdAndIsDeletedFalse(eq(TENANT_ID)))
            .thenReturn(Optional.empty());
        when(solapiCredentialResolver.resolveCredentials(any()))
            .thenReturn(new SolapiCredentials("apiKey", "apiSecret"));
        when(solapiCredentialResolver.resolvePfId(any())).thenReturn(null);
        SolapiKakaoTemplateClient.Response failure = SolapiKakaoTemplateClient.Response
            .failure(400, "ValidationError", "pfId is required");
        when(solapiKakaoTemplateClient.list(any(), any())).thenReturn(failure);

        assertThatThrownBy(() -> service.listLiveAlimtalkTemplates(TENANT_ID))
            .isInstanceOf(AlimtalkTemplateFetchException.class)
            .hasMessageContaining("status=400")
            .hasMessageContaining("ValidationError")
            .hasMessageContaining("pfId is required")
            .satisfies(e -> {
                AlimtalkTemplateFetchException ex = (AlimtalkTemplateFetchException) e;
                assertThat(ex.getUpstreamStatus()).isEqualTo(400);
                assertThat(ex.getUpstreamErrorCode()).isEqualTo("ValidationError");
            });
    }

    private static CommonCode buildCommonCode(String tenantId, String codeValue, String codeLabel,
            int sortOrder, String extraData) {
        CommonCode code = new CommonCode();
        code.setTenantId(tenantId);
        code.setCodeGroup(CODE_GROUP);
        code.setCodeValue(codeValue);
        code.setCodeLabel(codeLabel);
        code.setKoreanName(codeLabel);
        code.setSortOrder(sortOrder);
        code.setIsActive(true);
        code.setExtraData(extraData);
        return code;
    }
}
