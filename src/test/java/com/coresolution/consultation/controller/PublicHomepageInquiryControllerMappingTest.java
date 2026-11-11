package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.util.Arrays;
import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * 공개 문의 컨트롤러에 GET 이 없음을 보장.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
class PublicHomepageInquiryControllerMappingTest {

    @Test
    void publicControllerHasPostOnlyNoGetMappings() {
        RequestMapping typeMapping = PublicHomepageInquiryController.class.getAnnotation(RequestMapping.class);
        assertThat(typeMapping.value()).containsExactly("/api/v1/public/tenants/{tenantSlug}/inquiries");

        Method[] methods = PublicHomepageInquiryController.class.getDeclaredMethods();
        long getCount = Arrays.stream(methods)
                .filter(m -> m.getAnnotation(GetMapping.class) != null)
                .count();
        long postCount = Arrays.stream(methods)
                .filter(m -> m.getAnnotation(PostMapping.class) != null)
                .count();
        assertThat(getCount).isZero();
        assertThat(postCount).isEqualTo(1);
    }
}
