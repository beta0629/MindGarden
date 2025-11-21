package com.coresolution.consultation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 코어솔루션 통합 상담관리 시스템 메인 애플리케이션
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2024-12-19
 */
@SpringBootApplication
@ComponentScan(basePackages = {
    "com.coresolution.core",
    "com.coresolution.consultation",
    "com.coresolution.user"
})
@EntityScan(basePackages = {
    "com.coresolution.core.domain",
    "com.coresolution.consultation.entity",
    "com.coresolution.user.entity"
})
@EnableJpaRepositories(basePackages = {
    "com.coresolution.core.repository",
    "com.coresolution.consultation.repository",
    "com.coresolution.user.repository"
})
@EnableJpaAuditing
@EnableAsync
@EnableScheduling
public class ConsultationManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConsultationManagementApplication.class, args);
    }
}
