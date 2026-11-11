package com.coresolution.consultation.config;

import java.util.ArrayList;
import java.util.List;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 센터 홈페이지(m-garden.co.kr) 공개 API 공통 설정.
 * <p>상담 상품·문의 등 {@code /api/v1/public/tenants/**} 경로가 공유한다.</p>
 *
 * @author MindGarden
 * @since 2026-11-11
 */
@Data
@ConfigurationProperties(prefix = "mindgarden.homepage.public-api")
public class HomepagePublicApiProperties {

    /**
     * CORS 허용 Origin 목록(exact). 기본은 운영·스테이징 홈페이지.
     */
    private List<String> allowedOrigins = new ArrayList<>(List.of(
            "https://m-garden.co.kr",
            "https://www.m-garden.co.kr",
            "https://staging.m-garden.co.kr"));
}
