package com.coresolution.core.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI (Swagger) 설정
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Configuration
public class OpenApiConfig {
    
    @Bean
    public OpenAPI coreSolutionOpenAPI() {
        Server devServer = new Server();
        devServer.setUrl("http://localhost:8080");
        devServer.setDescription("개발 서버");
        
        Server prodServer = new Server();
        prodServer.setUrl("https://core-solution.co.kr");
        prodServer.setDescription("운영 서버");
        
        Contact contact = new Contact();
        contact.setEmail("support@core-solution.co.kr");
        contact.setName("CoreSolution Support");
        
        License license = new License()
                .name("Proprietary")
                .url("https://core-solution.co.kr/license");
        
        Info info = new Info()
                .title("CoreSolution API")
                .version("1.0.0")
                .contact(contact)
                .description("CoreSolution 테넌트 PG 설정 관리 API 문서")
                .license(license);
        
        return new OpenAPI()
                .info(info)
                .servers(List.of(devServer, prodServer));
    }
    
    /**
     * 프로덕션 API 그룹 (테스트 컨트롤러 제외)
     */
    @Bean
    public GroupedOpenApi publicApi() {
        return GroupedOpenApi.builder()
                .group("public-api")
                .pathsToMatch("/api/**")
                .pathsToExclude(
                    "/api/test/**",
                    "/api/local-test/**",
                    "/api/payment-test/**"
                )
                .build();
    }
    
    /**
     * 테스트 API 그룹 (개발 환경에서만 표시)
     */
    @Bean
    public GroupedOpenApi testApi() {
        return GroupedOpenApi.builder()
                .group("test-api")
                .pathsToMatch(
                    "/api/test/**",
                    "/api/local-test/**",
                    "/api/payment-test/**"
                )
                .build();
    }
}

