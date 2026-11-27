package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Method;
import java.util.Arrays;
import com.coresolution.consultation.sct.controller.PublicSctIdentityOtpDevController;
import com.coresolution.consultation.sct.service.impl.SctIdentityOtpDevCodeStoreImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * 운영/default 프로필에 OTP 코드 노출 경로가 없음을 증명.
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
    @DisplayName("DevController 는 @Profile(\"dev\") 이며 dev-code 매핑만 보유")
    void devControllerIsDevProfileOnly() throws Exception {
        Profile profile = PublicSctIdentityOtpDevController.class.getAnnotation(Profile.class);
        assertTrue(profile != null);
        assertTrue(Arrays.asList(profile.value()).contains("dev"));

        RequestMapping typeMapping = PublicSctIdentityOtpDevController.class
                .getAnnotation(RequestMapping.class);
        assertTrue(Arrays.asList(typeMapping.value()).contains("/api/v1/public/sct"));

        Method peek = PublicSctIdentityOtpDevController.class
                .getDeclaredMethod("peekDevCode", String.class);
        GetMapping get = peek.getAnnotation(GetMapping.class);
        assertTrue(get != null);
        assertTrue(Arrays.asList(get.value()).contains("/{token}/identity/otp/dev-code"));
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
}
