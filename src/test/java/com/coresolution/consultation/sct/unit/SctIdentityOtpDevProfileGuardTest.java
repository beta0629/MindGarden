package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.controller.AdminSctIdentityOtpDevController;
import com.coresolution.consultation.sct.service.impl.SctIdentityOtpDevCodeStoreImpl;
import com.coresolution.consultation.sct.service.impl.SctIdentityOtpDevPeekServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Profile;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * 운영/default 프로필·공개 경로에 OTP 코드 노출이 없음을 증명.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
class SctIdentityOtpDevProfileGuardTest {

    @Test
    @DisplayName("DevCodeStoreImpl 은 @Profile(\"dev\") 만")
    void devCodeStoreIsDevProfileOnly() {
        Profile profile = SctIdentityOtpDevCodeStoreImpl.class.getAnnotation(Profile.class);
        assertTrue(profile != null);
        assertTrue(Arrays.asList(profile.value()).contains("dev"));
        assertFalse(Arrays.asList(profile.value()).contains("default"));
        assertFalse(Arrays.asList(profile.value()).contains("prod"));
    }

    @Test
    @DisplayName("DevPeekServiceImpl 은 @Profile(\"dev\") 만")
    void peekServiceIsDevProfileOnly() {
        Profile profile = SctIdentityOtpDevPeekServiceImpl.class.getAnnotation(Profile.class);
        assertTrue(profile != null);
        assertTrue(Arrays.asList(profile.value()).contains("dev"));
        assertFalse(Arrays.asList(profile.value()).contains("prod"));
    }

    @Test
    @DisplayName("Admin DevController 는 @Profile(\"dev\") + ADMIN + 관리자 경로")
    void adminDevControllerIsDevProfileAndAdminOnly() throws Exception {
        Profile profile = AdminSctIdentityOtpDevController.class.getAnnotation(Profile.class);
        assertTrue(profile != null);
        assertTrue(Arrays.asList(profile.value()).contains("dev"));

        RequestMapping typeMapping = AdminSctIdentityOtpDevController.class
                .getAnnotation(RequestMapping.class);
        assertTrue(Arrays.asList(typeMapping.value()).contains("/api/v1/admin/sct/invitations"));
        assertFalse(Arrays.asList(typeMapping.value()).contains(SctConstants.PUBLIC_API_PREFIX));

        Method peek = AdminSctIdentityOtpDevController.class
                .getDeclaredMethod("peekDevCode", Long.class);
        GetMapping get = peek.getAnnotation(GetMapping.class);
        assertTrue(get != null);
        assertTrue(Arrays.asList(get.value()).contains("/{invitationId}/identity/otp/dev-code"));

        PreAuthorize preAuthorize = peek.getAnnotation(PreAuthorize.class);
        assertTrue(preAuthorize != null);
        assertTrue(preAuthorize.value().contains("ADMIN"));
    }

    @Test
    @DisplayName("공개 PublicSctIdentityOtpDevController 클래스는 존재하지 않음")
    void publicDevControllerClassRemoved() {
        try {
            Class.forName(
                    "com.coresolution.consultation.sct.controller.PublicSctIdentityOtpDevController");
            assertFalse(true, "PublicSctIdentityOtpDevController must be removed from public API");
        } catch (ClassNotFoundException expected) {
            assertTrue(true);
        }
    }

    @Test
    @DisplayName("PublicSctController 에는 평문 코드 조회 매핑 없음")
    void publicControllerHasNoDevCodeMapping() {
        Method[] methods = com.coresolution.consultation.sct.controller.PublicSctController.class
                .getDeclaredMethods();
        for (Method method : methods) {
            GetMapping get = method.getAnnotation(GetMapping.class);
            if (get == null) {
                continue;
            }
            for (String path : get.value()) {
                assertFalse(path.contains("dev-code"), "unexpected path: " + path);
            }
        }
    }

    @Test
    @DisplayName("SecurityConfig 는 공개 OTP dev-code 경로를 denyAll")
    void securityConfigDeniesPublicDevCodePath() throws Exception {
        Path securityConfig = Path.of("src/main/java/com/coresolution/consultation/config/SecurityConfig.java");
        String source = Files.readString(securityConfig);
        assertTrue(source.contains(SctConstants.PUBLIC_OTP_DEV_CODE_DENY_PATTERN)
                        || source.contains("/api/v1/public/sct/*/identity/otp/dev-code"),
                "SecurityConfig must deny public OTP dev-code path");
        assertTrue(source.contains("denyAll()"), "SecurityConfig must call denyAll for public OTP peek");
    }
}
