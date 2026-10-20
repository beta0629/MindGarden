package com.coresolution.consultation.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import lombok.Data;

/**
 * 임시 비밀번호 생성 설정. 길이·문자군 SSOT 는 {@code security.temp-password} (application.yml).
 *
 * @author CoreSolution
 * @since 2026-10-14
 */
@Data
@Component
@ConfigurationProperties(prefix = "security.temp-password")
public class TemporaryPasswordProperties {

    /** 생성 길이. 로그인 저장 정책 최소·최대 안이어야 한다. */
    private int length = 16;

    /** 정책 거절 시 재시도 횟수. */
    private int maxAttempts = 128;

    /** 소문자 문자군. */
    private String lowercase = "abcdefghijklmnopqrstuvwxyz";

    /** 대문자 문자군. */
    private String uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    /** 숫자 문자군. */
    private String digits = "0123456789";

    /** 특수문자 문자군. {@code PasswordPolicy.LOGIN_PASSWORD_ALLOWED_SPECIALS} 부분집합. */
    private String specials = "@$!%*?&";

    /** SMS 템플릿 키. 로그·감사에만 쓰고 본문은 남기지 않는다. */
    private String smsTemplateKey = "CLIENT_TEMP_PASSWORD_SMS";

    /**
     * 발송 본문. 자리표시자 {centerName} {loginId} {tempPassword} {loginUrl}.
     * 비어 있으면 발송하지 않는다.
     */
    private String smsTemplate = "";

    /** {loginUrl} 에 넣을 로그인 주소. */
    private String loginUrl = "";
}
