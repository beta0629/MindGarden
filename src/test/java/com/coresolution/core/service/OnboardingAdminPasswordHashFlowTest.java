package com.coresolution.core.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockingDetails;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.OnboardingStatus;
import com.coresolution.core.domain.onboarding.RiskLevel;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.repository.billing.TenantSubscriptionRepository;
import com.coresolution.core.repository.onboarding.OnboardingRequestRepository;
import com.coresolution.core.security.OnboardingAdminPasswordSupport;
import com.coresolution.core.security.PasswordService;
import com.coresolution.core.service.impl.OnboardingApprovalServiceImpl;
import com.coresolution.core.service.impl.OnboardingServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.invocation.Invocation;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 온보딩 관리자 비밀번호: 생성 시 BCrypt 해시 저장 → 승인 시 그 해시를 그대로 users 에 저장 → 원 비밀번호 로그인 성공.
 * 실제 {@link BCryptPasswordEncoder}·{@link PasswordService} 사용 (이중 해시 방지 증명).
 *
 * @author CoreSolution
 * @since 2026-10-03
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("온보딩 관리자 비밀번호 해시 저장·승인 흐름")
class OnboardingAdminPasswordHashFlowTest {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Mock
    private OnboardingRequestRepository repository;

    @Mock
    private OnboardingApprovalService approvalService;

    @Mock
    private AutoApprovalService autoApprovalService;

    @Mock
    private TenantSubscriptionRepository subscriptionRepository;

    @Mock
    private OnboardingPreValidationService preValidationService;

    @Mock
    private OnboardingErrorHandlingService errorHandlingService;

    @Mock
    private ApplicationContext applicationContext;

    @Mock
    private TenantRepository tenantRepository;

    @Spy
    private PasswordService passwordService = new PasswordService(passwordEncoder);

    @Mock
    private OnboardingServiceImpl onboardingWorkflowBean;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private OnboardingServiceImpl onboardingService;

    private String rawPassword;
    private String contactEmail;

    @BeforeEach
    void setUp() {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.initSynchronization();
        }
        rawPassword = generatePolicySafePassword();
        contactEmail = "e2e-" + System.nanoTime() + "@example.com";

        OnboardingPreValidationService.ValidationResult ok =
                new OnboardingPreValidationService.ValidationResult(true, Collections.emptyMap(),
                        Collections.emptyMap());
        lenient().when(autoApprovalService.canAutoApprove(any(OnboardingRequest.class))).thenReturn(false);
        lenient().when(autoApprovalService.checkAutoApprovalConditions(any(OnboardingRequest.class)))
                .thenReturn(new AutoApprovalService.AutoApprovalResult(false, "unit-test",
                        RiskLevel.LOW, false, false, true));
        lenient().when(preValidationService.validateBeforeApproval(any(Long.class))).thenReturn(ok);
        lenient().when(preValidationService.validateSystemMetadata(anyString())).thenReturn(ok);
        lenient().when(tenantRepository.findDeletedByContactEmailIgnoreCase(anyString()))
                .thenReturn(Collections.emptyList());
        lenient().when(applicationContext.getBean(OnboardingServiceImpl.class))
                .thenReturn(onboardingWorkflowBean);
        lenient().doReturn("{}").when(onboardingWorkflowBean)
                .initializeTenantAfterOnboardingInNewTransaction(anyString(), anyString(), anyString(),
                        any(Long.class));
        lenient().doNothing().when(onboardingWorkflowBean)
                .saveInitializationStatusInNewTransaction(any(Long.class), anyString(), anyString());
        lenient().when(errorHandlingService.executeWithRetry(any(), anyInt(), anyLong()))
                .thenAnswer(invocation -> {
                    OnboardingErrorHandlingService.OnboardingProcess process = invocation.getArgument(0);
                    try {
                        process.execute();
                        return OnboardingErrorHandlingService.ExecutionResult.success(1);
                    } catch (Exception e) {
                        return OnboardingErrorHandlingService.ExecutionResult.failure(1, e, e.getMessage());
                    }
                });
        lenient().when(repository.save(any(OnboardingRequest.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    /** 정책(대·소문자·숫자·허용 특수문자, 연속·반복 금지)을 만족하는 테스트 전용 무작위 값 */
    private static String generatePolicySafePassword() {
        List<Character> pool = new ArrayList<>(
                List.of('B', 'd', 'F', 'h', 'J', 'l', 'N', 'p', 'R', 't', 'V', 'x'));
        Collections.shuffle(pool, new SecureRandom());
        StringBuilder sb = new StringBuilder("Q7@");
        for (int i = 0; i < 9; i++) {
            sb.append(pool.get(i));
        }
        return sb.toString();
    }

    private OnboardingRequest createWithChecklist(String checklistJson) {
        OnboardingRequest saved = onboardingService.create("tenant-flow-test", "흐름 테스트 기관",
                contactEmail, RiskLevel.LOW, checklistJson, "CONSULTATION");
        saved.setId(501L);
        return saved;
    }

    private String storedPasswordOf(OnboardingRequest request) throws Exception {
        Map<String, Object> checklist = objectMapper.readValue(request.getChecklistJson(), MAP_TYPE);
        return (String) checklist.get("adminPassword");
    }

    private String checklistWithPassword(String password) throws Exception {
        Map<String, Object> checklist = new HashMap<>();
        checklist.put("adminPassword", password);
        checklist.put("brandName", "브랜드");
        return objectMapper.writeValueAsString(checklist);
    }

    private String approveAndCaptureHash(OnboardingRequest request) {
        when(repository.findActiveById(request.getId())).thenReturn(Optional.of(request));
        lenient().when(repository.findByTenantIdAndIdAndIsDeletedFalse(request.getTenantId(), request.getId()))
                .thenReturn(Optional.of(request));
        Map<String, Object> approvalResult = new HashMap<>();
        approvalResult.put("success", true);
        approvalResult.put("message", "ok");
        ArgumentCaptor<String> hashCaptor = ArgumentCaptor.forClass(String.class);
        when(approvalService.processOnboardingApproval(any(Long.class), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString(), hashCaptor.capture(),
                nullable(String.class))).thenReturn(approvalResult);

        OnboardingRequest result =
                onboardingService.decide(request.getId(), OnboardingStatus.APPROVED, "ops-actor", "승인");
        assertThat(result.getStatus()).isEqualTo(OnboardingStatus.APPROVED);
        return hashCaptor.getValue();
    }

    /** 실제 승인 서비스의 관리자 INSERT 경로가 users.password 에 넣는 값을 캡처한다 */
    private String insertedUsersPassword(String adminPasswordHash) {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        OnboardingApprovalServiceImpl approvalImpl = new OnboardingApprovalServiceImpl(jdbcTemplate, null,
                null, null, objectMapper, null, null, null, null);
        try {
            ReflectionTestUtils.invokeMethod(approvalImpl, "createAdminAccountDirectly", "tenant-flow-test",
                    contactEmail, "흐름 테스트 기관", adminPasswordHash, "ops-actor", "CONSULTATION");
        } catch (RuntimeException ignored) {
            // INSERT 이후 원장 역할 할당 단계는 목 환경에서 실패할 수 있다 — 비밀번호 검증과 무관
        }
        for (Invocation invocation : mockingDetails(jdbcTemplate).getInvocations()) {
            Object[] args = invocation.getArguments();
            if ("update".equals(invocation.getMethod().getName()) && args.length > 1
                    && String.valueOf(args[0]).contains("INSERT INTO users")) {
                return (String) args[4];
            }
        }
        throw new AssertionError("users INSERT 호출이 없음");
    }

    private Authentication loginWith(String email, String storedUsersPassword, String attemptPassword) {
        UserDetailsService userDetailsService = username -> User.withUsername(email)
                .password(storedUsersPassword).roles("ADMIN").build();
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider.authenticate(new UsernamePasswordAuthenticationToken(email, attemptPassword));
    }

    @Test
    @DisplayName("생성 후 DB 값은 평문이 아니고 BCrypt 해시이며 matches(raw, stored) 가 true")
    void create_storesBcryptHashNotPlaintext() throws Exception {
        OnboardingRequest saved = createWithChecklist(checklistWithPassword(rawPassword));

        String stored = storedPasswordOf(saved);
        assertThat(stored).isNotEqualTo(rawPassword);
        assertThat(saved.getChecklistJson()).doesNotContain(rawPassword);
        assertThat(OnboardingAdminPasswordSupport.isBcryptHash(stored)).isTrue();
        assertThat(passwordEncoder.matches(rawPassword, stored)).isTrue();
        assertThat(saved.toString()).doesNotContain(stored);
    }

    @Test
    @DisplayName("승인 시 저장 해시를 그대로 전달·INSERT 하고 원 비밀번호 로그인 성공 (이중 해시 없음)")
    void approve_usesStoredHashAsIs_andRawPasswordLoginSucceeds() throws Exception {
        OnboardingRequest saved = createWithChecklist(checklistWithPassword(rawPassword));
        String stored = storedPasswordOf(saved);

        String passedToApproval = approveAndCaptureHash(saved);
        assertThat(passedToApproval).isEqualTo(stored);
        verify(passwordService, times(1)).encodePassword(anyString());

        String usersPassword = insertedUsersPassword(passedToApproval);
        assertThat(usersPassword).isEqualTo(stored);

        Authentication auth = loginWith(contactEmail, usersPassword, rawPassword);
        assertThat(auth.isAuthenticated()).isTrue();
        assertThatThrownBy(() -> loginWith(contactEmail, usersPassword, rawPassword + "x"))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    @DisplayName("반례: 승인 두 번(이미 승인·테넌트 존재) — 재인코딩 없고 원 비밀번호 유지")
    void approveTwice_doesNotReencode() throws Exception {
        OnboardingRequest saved = createWithChecklist(checklistWithPassword(rawPassword));
        String stored = storedPasswordOf(saved);
        String first = approveAndCaptureHash(saved);
        assertThat(first).isEqualTo(stored);

        Tenant tenant = new Tenant();
        tenant.setTenantId(saved.getTenantId());
        lenient().when(tenantRepository.findByTenantIdAndIsDeletedFalse(saved.getTenantId()))
                .thenReturn(Optional.of(tenant));
        onboardingService.decide(saved.getId(), OnboardingStatus.APPROVED, "ops-actor", "재승인");

        verify(passwordService, times(1)).encodePassword(anyString());
        assertThat(storedPasswordOf(saved)).isEqualTo(stored);
        List<String> allPassed = new ArrayList<>();
        for (Invocation invocation : mockingDetails(approvalService).getInvocations()) {
            if ("processOnboardingApproval".equals(invocation.getMethod().getName())) {
                allPassed.add((String) invocation.getArguments()[7]);
            }
        }
        assertThat(allPassed).isNotEmpty().allMatch(stored::equals);
    }

    @Test
    @DisplayName("반례: 해시 문자열을 비밀번호로 넣어도 그대로 저장되지 않음 (정책 거부 또는 재인코딩 → 해시 주입 불가)")
    void create_hashShapedInput_isRejectedOrReEncoded() throws Exception {
        String hashValue = passwordEncoder.encode(generatePolicySafePassword());
        String hashShaped = checklistWithPassword(hashValue);

        // 솔트가 랜덤이라 비밀번호 정책 통과 여부가 달라짐 — 거부되든 재인코딩되든 입력값 그대로 저장되면 안 됨
        OnboardingRequest saved;
        try {
            saved = createWithChecklist(hashShaped);
        } catch (IllegalArgumentException rejected) {
            verify(repository, never()).save(any(OnboardingRequest.class));
            return;
        }
        Map<String, Object> checklist = objectMapper.readValue(saved.getChecklistJson(), MAP_TYPE);
        String stored = (String) checklist.get("adminPassword");
        assertThat(stored).isNotEqualTo(hashValue);
        assertThat(passwordEncoder.matches(hashValue, stored)).isTrue();
    }

    @Test
    @DisplayName("반례: 빈 비밀번호는 키를 제거하고 인코딩하지 않음 → 승인은 ON_HOLD")
    void create_blankPassword_removesKey_andApprovalHolds() throws Exception {
        OnboardingRequest saved = createWithChecklist(checklistWithPassword("   "));

        Map<String, Object> checklist = objectMapper.readValue(saved.getChecklistJson(), MAP_TYPE);
        assertThat(checklist).doesNotContainKey("adminPassword");
        verify(passwordService, never()).encodePassword(anyString());

        when(repository.findActiveById(saved.getId())).thenReturn(Optional.of(saved));
        OnboardingRequest result =
                onboardingService.decide(saved.getId(), OnboardingStatus.APPROVED, "ops-actor", "승인");
        assertThat(result.getStatus()).isEqualTo(OnboardingStatus.ON_HOLD);
        verify(approvalService, never()).processOnboardingApproval(any(), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString(), anyString(), nullable(String.class));
    }

    @Test
    @DisplayName("반례: null checklist 는 그대로 통과(인코딩 없음)")
    void create_nullChecklist_passesThrough() {
        OnboardingRequest saved = createWithChecklist(null);

        assertThat(saved.getChecklistJson()).isNull();
        verify(passwordService, never()).encodePassword(anyString());
    }

    @Test
    @DisplayName("반례: 정책 위반 비밀번호는 400(IllegalArgumentException)이고 저장하지 않음")
    void create_policyViolation_rejected() throws Exception {
        String weak = checklistWithPassword("short");

        assertThatThrownBy(() -> createWithChecklist(weak)).isInstanceOf(IllegalArgumentException.class);
        verify(repository, never()).save(any(OnboardingRequest.class));
    }

    @Test
    @DisplayName("레거시 평문 행은 승인 시 한 번만 해시되고 원 비밀번호로 로그인 가능")
    void approve_legacyPlaintextRow_encodedOnce() throws Exception {
        OnboardingRequest legacy = OnboardingRequest.builder().id(502L).tenantId("tenant-legacy")
                .tenantName("레거시 기관").requestedBy(contactEmail).riskLevel(RiskLevel.LOW)
                .checklistJson(checklistWithPassword(rawPassword)).businessType("CONSULTATION")
                .status(OnboardingStatus.PENDING).isDeleted(false).version(0L).build();

        String passed = approveAndCaptureHash(legacy);

        assertThat(OnboardingAdminPasswordSupport.isBcryptHash(passed)).isTrue();
        verify(passwordService, times(1)).encodePassword(rawPassword);
        assertThat(loginWith(contactEmail, passed, rawPassword).isAuthenticated()).isTrue();
    }
}
