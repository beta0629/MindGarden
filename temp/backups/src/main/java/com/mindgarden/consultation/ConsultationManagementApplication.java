package com.mindgarden.consultation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 통합 상담관리 시스템 메인 애플리케이션
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
@EnableScheduling
public class ConsultationManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConsultationManagementApplication.class, args);
    }
}
