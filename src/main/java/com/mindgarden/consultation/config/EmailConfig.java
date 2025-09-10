package com.mindgarden.consultation.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.scheduling.annotation.EnableAsync;

import java.util.Properties;

/**
 * 이메일 설정 Configuration
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-10
 */
@Configuration
@EnableAsync
public class EmailConfig {
    
    @Value("${spring.mail.host:}")
    private String host;
    
    @Value("${spring.mail.port:587}")
    private int port;
    
    @Value("${spring.mail.username:}")
    private String username;
    
    @Value("${spring.mail.password:}")
    private String password;
    
    @Value("${spring.mail.properties.mail.smtp.auth:true}")
    private boolean auth;
    
    @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}")
    private boolean starttlsEnable;
    
    @Value("${spring.mail.properties.mail.smtp.ssl.trust:}")
    private String sslTrust;
    
    @Value("${spring.mail.properties.mail.smtp.connectiontimeout:5000}")
    private int connectionTimeout;
    
    @Value("${spring.mail.properties.mail.smtp.timeout:5000}")
    private int timeout;
    
    @Value("${spring.mail.properties.mail.smtp.writetimeout:5000}")
    private int writeTimeout;
    
    /**
     * JavaMailSender Bean 설정
     */
    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        
        // SMTP 서버 설정
        mailSender.setHost(host);
        mailSender.setPort(port);
        mailSender.setUsername(username);
        mailSender.setPassword(password);
        
        // SMTP 프로퍼티 설정
        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", auth);
        props.put("mail.smtp.starttls.enable", starttlsEnable);
        
        if (sslTrust != null && !sslTrust.isEmpty()) {
            props.put("mail.smtp.ssl.trust", sslTrust);
        }
        
        // 타임아웃 설정
        props.put("mail.smtp.connectiontimeout", connectionTimeout);
        props.put("mail.smtp.timeout", timeout);
        props.put("mail.smtp.writetimeout", writeTimeout);
        
        // 디버그 모드 (개발 환경에서만)
        props.put("mail.debug", false);
        
        return mailSender;
    }
}
