package com.coresolution.consultation.integration;

import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.consultation.constant.MobilePushPlatform;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.mobilepush.MobilePushSettingsPatchRequest;
import com.coresolution.consultation.dto.mobilepush.MobilePushSettingsPayload;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.MobilePushTokenRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.MobilePushService;
import com.coresolution.consultation.util.MobilePushTokenHasher;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 모바일 푸시 토큰·설정의 테넌트 스코프 격리 검증.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@SpringBootTest(classes = ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("MobilePushService 테넌트 격리")
class MobilePushServiceTenantIsolationIntegrationTest {

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private MobilePushService mobilePushService;

    @Autowired
    private MobilePushTokenRepository mobilePushTokenRepository;

    private String tenantId1;
    private String tenantId2;
    private User userOne;

    @BeforeEach
    void setUp() {
        tenantId1 = UUID.randomUUID().toString();
        tenantRepository.save(Tenant.builder()
                .tenantId(tenantId1)
                .name("푸시 테스트 테넌트1")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("mp1@test.com")
                .build());

        tenantId2 = UUID.randomUUID().toString();
        tenantRepository.save(Tenant.builder()
                .tenantId(tenantId2)
                .name("푸시 테스트 테넌트2")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("mp2@test.com")
                .build());

        userOne = new User();
        userOne.setUserId("mp-u-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10));
        userOne.setEmail("mp-client-" + UUID.randomUUID() + "@test.com");
        userOne.setPassword(passwordEncoder.encode("password12ab"));
        userOne.setName("푸시테스트");
        userOne.setRole(UserRole.CLIENT);
        userOne.setTenantId(tenantId1);
        userOne.setIsActive(true);
        userOne.setIsPasswordChanged(true);
        userOne = userRepository.save(userOne);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("동일 토큰 문자열은 다른 테넌트 컨텍스트에서 조회되지 않는다")
    void tokenScopedByTenantId() {
        String raw = "fcm-or-apns-token-" + UUID.randomUUID();
        String hash = MobilePushTokenHasher.sha256Hex(raw);

        TenantContextHolder.setTenantId(tenantId1);
        mobilePushService.registerToken(tenantId1, userOne.getId(), raw, MobilePushPlatform.ANDROID, null);

        assertThat(mobilePushTokenRepository
                .findByTenantIdAndUserIdAndTokenSha256AndIsDeletedFalse(tenantId1, userOne.getId(), hash))
                .isPresent();
        assertThat(mobilePushTokenRepository
                .findByTenantIdAndUserIdAndTokenSha256AndIsDeletedFalse(tenantId2, userOne.getId(), hash))
                .isEmpty();
    }

    @Test
    @DisplayName("설정 갱신은 테넌트·사용자 단위로 분리된다")
    void settingsScopedPerTenantAndUser() {
        MobilePushSettingsPatchRequest patch = new MobilePushSettingsPatchRequest();
        patch.setMessage(false);

        mobilePushService.patchSettings(tenantId1, userOne.getId(), patch);

        MobilePushSettingsPayload t1 = mobilePushService.getSettings(tenantId1, userOne.getId());
        assertThat(t1.isMessage()).isFalse();

        MobilePushSettingsPayload t2defaults = mobilePushService.getSettings(tenantId2, userOne.getId());
        assertThat(t2defaults.isMessage()).isTrue();
    }
}
