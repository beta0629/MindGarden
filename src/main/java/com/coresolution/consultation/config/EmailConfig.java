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

        // @Value로 주입받은 값 사용 (Spring Boot가 -D 옵션과 환경 변수를 자동으로 처리)
        // SMTP 서버 설정
        mailSender.setHost(host != null && !host.isEmpty() ? host : "smtp.gmail.com");
        mailSender.setPort(port > 0 ? port : 587);
        mailSender.setUsername(userId);
        mailSender.setPassword(password);
        
        // 디버그: 이메일 설정 로그 (비밀번호는 마스킹)
        System.out.println("=== EmailConfig Debug ===");
        System.out.println("Host (@Value): " + host);
        System.out.println("Port (@Value): " + port);
        System.out.println("UserId (@Value): " + userId);
        System.out.println("Password length (@Value): " + (password != null ? password.length() : 0));
        System.out.println("Host (final): " + mailSender.getHost());
        System.out.println("Port (final): " + mailSender.getPort());
        System.out.println("UserId (final): " + mailSender.getUsername());
        System.out.println("Password is empty: " + (password == null || password.isEmpty()));
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
