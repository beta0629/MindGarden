package com.coresolution.consultation.config;

import java.util.Properties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.scheduling.annotation.EnableAsync;

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

    @Autowired
    private Environment environment;

    @Value("${spring.mail.host:}")
    private String host;

    @Value("${spring.mail.port:587}")
    private int port;

    @Value("${spring.mail.userId:}")
    private String userId;

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

        // 환경 변수에서 직접 읽기 (가장 확실한 방법)
        // 우선순위: 환경 변수 > @Value > 기본값
        String mailHost = System.getenv("MAIL_HOST");
        if (mailHost == null || mailHost.isEmpty()) {
            mailHost = host != null && !host.isEmpty() ? host : "smtp.gmail.com";
        }
        
        String mailPortStr = System.getenv("MAIL_PORT");
        int mailPort = 587;
        if (mailPortStr != null && !mailPortStr.isEmpty()) {
            try {
                mailPort = Integer.parseInt(mailPortStr);
            } catch (NumberFormatException e) {
                mailPort = port > 0 ? port : 587;
            }
        } else {
            mailPort = port > 0 ? port : 587;
        }
        
        String mailUserId = System.getenv("MAIL_USERNAME");
        if (mailUserId == null || mailUserId.isEmpty()) {
            mailUserId = userId != null && !userId.isEmpty() ? userId : "";
        }
        
        String mailPassword = System.getenv("MAIL_PASSWORD");
        // MAIL_PASSWORD에서 따옴표 제거 (환경 변수 파일에서 따옴표 포함되어 있을 수 있음)
        if (mailPassword != null) {
            mailPassword = mailPassword.replaceAll("^['\"]+|['\"]+$", "");
        }
        if (mailPassword == null || mailPassword.isEmpty()) {
            mailPassword = password != null && !password.isEmpty() ? password : "";
        }
        
        // SMTP 서버 설정
        mailSender.setHost(mailHost);
        mailSender.setPort(mailPort);
        mailSender.setUsername(mailUserId);
        mailSender.setPassword(mailPassword);
        
        // 디버그: 이메일 설정 로그 (비밀번호는 마스킹)
        System.out.println("=== EmailConfig Debug ===");
        System.out.println("MAIL_HOST (env): " + System.getenv("MAIL_HOST"));
        System.out.println("MAIL_USERNAME (env): " + System.getenv("MAIL_USERNAME"));
        System.out.println("MAIL_PASSWORD length (env): " + (System.getenv("MAIL_PASSWORD") != null ? System.getenv("MAIL_PASSWORD").length() : 0));
        System.out.println("Host (final): " + mailSender.getHost());
        System.out.println("Port (final): " + mailSender.getPort());
        System.out.println("UserId (final): " + mailSender.getUsername());
        System.out.println("Password length (final): " + (mailPassword != null ? mailPassword.length() : 0));
        System.out.println("Password is empty: " + (mailPassword == null || mailPassword.isEmpty()));
        System.out.println("========================");

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
