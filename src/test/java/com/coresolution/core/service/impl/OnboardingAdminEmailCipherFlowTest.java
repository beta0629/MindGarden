package com.coresolution.core.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockingDetails;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;
import javax.sql.DataSource;
import com.coresolution.consultation.converter.EmailAttributeConverter;
import com.coresolution.consultation.converter.PersonalDataEncryptionContextHolder;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.impl.UserServiceImpl;
import com.coresolution.consultation.util.PersonalDataEncryptionKeyProvider;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.constant.OnboardingConstants;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.OnboardingAdminEmailCipher;
import com.coresolution.core.service.TenantDashboardService;
import com.coresolution.consultation.util.OAuth2DomainUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.invocation.Invocation;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;
import jakarta.persistence.EntityManager;

/**
 * 프로시저 경로와 Java 직접 INSERT 가 같은 암호문을 users.email 에 넣고,
 * 로그인 이메일 조회가 그 값을 찾는지 확인한다.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("온보딩 관리자 이메일 암호문 저장")
class OnboardingAdminEmailCipherFlowTest {

    private static final String PLAIN_EMAIL = "admin@example.com";
    private static final String TENANT = "tenant-email-cipher";

    @Mock
    private JdbcTemplate jdbcTemplate;
    @Mock
    private EntityManager entityManager;
    @Mock
    private ApplicationContext applicationContext;
    @Mock
    private PlatformTransactionManager transactionManager;
    @Mock
    private TenantDashboardService tenantDashboardService;
    @Mock
    private OAuth2DomainUtil oauth2DomainUtil;
    @Mock
    private DataSource dataSource;
    @Mock
    private Connection connection;
    @Mock
    private Statement statement;
    @Mock
    private CallableStatement callableStatement;
    @Mock
    private ResultSet resultSet;
    @Mock
    private Environment environment;

    @InjectMocks
    private OnboardingApprovalServiceImpl approvalService;

    private PersonalDataEncryptionUtil encryptionUtil;

    @BeforeEach
    void setUpEncryption() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("test");
        PersonalDataEncryptionKeyProvider provider = new PersonalDataEncryptionKeyProvider(env);
        ReflectionTestUtils.setField(provider, "keyVersions", "k1:unit-test-encryption-key-32-bytes!!");
        ReflectionTestUtils.setField(provider, "ivVersions", "k1:unit-test-iv-16!");
        ReflectionTestUtils.setField(provider, "activeKeyId", "");
        ReflectionTestUtils.setField(provider, "legacyKey", "");
        ReflectionTestUtils.setField(provider, "legacyIv", "");
        provider.initialize();
        encryptionUtil = new PersonalDataEncryptionUtil(provider);
        ReflectionTestUtils.setField(PersonalDataEncryptionContextHolder.class, "instance", encryptionUtil);
    }

    @AfterEach
    void tearDown() {
        ReflectionTestUtils.setField(PersonalDataEncryptionContextHolder.class, "instance", null);
        TenantContextHolder.clear();
        OnboardingDecisionDeadline.close();
    }

    @Test
    @DisplayName("프로시저 인자는 암호문이고 로그인 조회 바인딩과 같다")
    void procedurePath_storesCipher_andLoginLookupMatches() throws Exception {
        OnboardingAdminEmailCipher.Prepared prepared = OnboardingAdminEmailCipher.prepare(PLAIN_EMAIL);
        stubProcedureCallThatTimesOut();

        approvalService.processOnboardingApproval(11L, TENANT, "기관", "CONSULTATION", "ops",
                "승인", PLAIN_EMAIL, "stored-hash", "label");

        verify(callableStatement).setString(7, prepared.cipher());
        verify(callableStatement).setString(11, "admin");
        assertStoredCipherMatchesLogin(prepared.cipher());
    }

    @Test
    @DisplayName("Java 직접 INSERT 의 email 은 암호문이고 로그인 조회 바인딩과 같다")
    void javaPath_storesCipher_andLoginLookupMatches() {
        OnboardingAdminEmailCipher.Prepared prepared = OnboardingAdminEmailCipher.prepare(PLAIN_EMAIL);
        OnboardingApprovalServiceImpl direct = new OnboardingApprovalServiceImpl(jdbcTemplate, null,
                null, null, new ObjectMapper(), null, null, null, null);
        try {
            ReflectionTestUtils.invokeMethod(direct, "createAdminAccountDirectly", TENANT, PLAIN_EMAIL,
                    prepared.cipher(), "기관", "stored-hash", "ops", "CONSULTATION");
        } catch (RuntimeException ignored) {
            // 원장 역할 행이 없으면 INSERT 이후 실패한다. email 인자는 그 전에 확정된다.
        }

        String insertedEmail = null;
        for (Invocation invocation : mockingDetails(jdbcTemplate).getInvocations()) {
            Object[] args = invocation.getArguments();
            if ("update".equals(invocation.getMethod().getName()) && args.length > 3
                    && String.valueOf(args[0]).contains("INSERT INTO users")) {
                insertedEmail = (String) args[3];
            }
        }
        assertThat(insertedEmail).isEqualTo(prepared.cipher());
        assertStoredCipherMatchesLogin(prepared.cipher());
    }

    @Test
    @DisplayName("반례: 암호화 유틸이 없으면 프로시저를 호출하지 않고 승인을 막는다")
    void missingCipher_blocksBeforeProcedure() throws Exception {
        ReflectionTestUtils.setField(PersonalDataEncryptionContextHolder.class, "instance", null);

        assertThatThrownBy(() -> approvalService.processOnboardingApproval(12L, TENANT, "기관",
                "CONSULTATION", "ops", "승인", PLAIN_EMAIL, "stored-hash", "label"))
                .isInstanceOf(OnboardingApprovalBlockedException.class)
                .hasMessage(OnboardingConstants.ERROR_ONBOARDING_ADMIN_EMAIL_ENCRYPTION_UNAVAILABLE);
        verify(dataSource, org.mockito.Mockito.never()).getConnection();
    }

    @Test
    @DisplayName("반례: 다른 테넌트에만 있는 암호문 이메일은 현재 테넌트 로그인으로 찾지 않는다")
    void loginLookup_otherTenantMisses() {
        OnboardingAdminEmailCipher.Prepared prepared = OnboardingAdminEmailCipher.prepare(PLAIN_EMAIL);
        UserRepository userRepository = mock(UserRepository.class);
        when(userRepository.findByTenantIdAndEmail(TENANT, PLAIN_EMAIL)).thenReturn(Optional.empty());
        when(userRepository.findByTenantId(TENANT)).thenReturn(List.of());
        TenantContextHolder.setTenantId(TENANT);

        Optional<User> found = loginService(userRepository).findByEmail(PLAIN_EMAIL);

        assertThat(found).isEmpty();
        assertThat(prepared.cipher()).doesNotContain("@");
    }

    private void assertStoredCipherMatchesLogin(String storedCipher) {
        assertThat(storedCipher).isNotEqualTo(PLAIN_EMAIL);
        assertThat(storedCipher).doesNotContain("@");
        assertThat(new EmailAttributeConverter().convertToDatabaseColumn(PLAIN_EMAIL)).isEqualTo(storedCipher);
        assertThat(encryptionUtil.safeDecrypt(storedCipher)).isEqualTo(PLAIN_EMAIL);

        User loaded = new User();
        loaded.setEmail(encryptionUtil.safeDecrypt(storedCipher));
        UserRepository userRepository = mock(UserRepository.class);
        when(userRepository.findByTenantIdAndEmail(TENANT, PLAIN_EMAIL)).thenReturn(Optional.empty());
        when(userRepository.findByTenantId(TENANT)).thenReturn(List.of(loaded));
        TenantContextHolder.setTenantId(TENANT);

        Optional<User> found = loginService(userRepository).findByEmail(PLAIN_EMAIL);

        assertThat(found).contains(loaded);
    }

    private UserServiceImpl loginService(UserRepository userRepository) {
        UserServiceImpl userService = new UserServiceImpl();
        ReflectionTestUtils.setField(userService, "userRepository", userRepository);
        ReflectionTestUtils.setField(userService, "encryptionUtil", encryptionUtil);
        return userService;
    }

    private void stubProcedureCallThatTimesOut() throws SQLException {
        when(jdbcTemplate.getDataSource()).thenReturn(dataSource);
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.execute(anyString())).thenReturn(false);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        when(resultSet.next()).thenReturn(false);
        when(connection.prepareCall(anyString())).thenReturn(callableStatement);
        when(callableStatement.execute()).thenThrow(new SQLException(
                "Statement cancelled due to timeout or client request", "HY000", 0));
        when(applicationContext.getEnvironment()).thenReturn(environment);
        when(environment.getActiveProfiles()).thenReturn(new String[] {"dev"});
        when(oauth2DomainUtil.resolveEnvironmentTenantDomainSuffix(any(String[].class)))
                .thenReturn(".dev.core-solution.co.kr");
    }
}
