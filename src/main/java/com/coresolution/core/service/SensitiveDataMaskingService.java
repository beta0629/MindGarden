package com.coresolution.core.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.regex.Pattern;

/**
 * 민감정보 마스킹 서비스
 * AI 분석 전 개인정보 및 민감정보를 마스킹 처리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Slf4j
@Service
public class SensitiveDataMaskingService {
    
    // 정규식 패턴
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
    );
    
    private static final Pattern PHONE_PATTERN = Pattern.compile(
        "\\d{2,3}-\\d{3,4}-\\d{4}"
    );
    
    private static final Pattern CARD_PATTERN = Pattern.compile(
        "\\d{4}-\\d{4}-\\d{4}-\\d{4}"
    );
    
    private static final Pattern IP_PATTERN = Pattern.compile(
        "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b"
    );
    
    /**
     * 이벤트 상세 정보 마스킹
     */
    public Map<String, Object> maskEventDetails(Map<String, Object> eventDetails) {
        if (eventDetails == null) {
            return null;
        }
        
        for (Map.Entry<String, Object> entry : eventDetails.entrySet()) {
            String key = entry.getKey().toLowerCase();
            Object value = entry.getValue();
            
            if (value instanceof String) {
                String stringValue = (String) value;
                
                // 민감 필드 마스킹
                if (isSensitiveField(key)) {
                    eventDetails.put(entry.getKey(), maskSensitiveData(stringValue));
                } else {
                    // 일반 필드도 패턴 검사
                    eventDetails.put(entry.getKey(), maskPatterns(stringValue));
                }
            }
        }
        
        return eventDetails;
    }
    
    /**
     * 민감 필드 여부 확인
     */
    private boolean isSensitiveField(String fieldName) {
        return fieldName.contains("email") ||
               fieldName.contains("phone") ||
               fieldName.contains("card") ||
               fieldName.contains("password") ||
               fieldName.contains("secret") ||
               fieldName.contains("token") ||
               fieldName.contains("key") ||
               fieldName.contains("ssn") ||
               fieldName.contains("jumin") ||
               fieldName.contains("resident") ||
               fieldName.contains("account") ||
               fieldName.contains("bank");
    }
    
    /**
     * 민감 데이터 마스킹
     */
    private String maskSensitiveData(String value) {
        if (value == null || value.isEmpty()) {
            return value;
        }
        
        // 완전 마스킹 (처음 2자만 표시)
        if (value.length() <= 2) {
            return "**";
        }
        
        return value.substring(0, 2) + "*".repeat(Math.min(value.length() - 2, 8));
    }
    
    /**
     * 패턴 기반 마스킹
     */
    private String maskPatterns(String value) {
        if (value == null || value.isEmpty()) {
            return value;
        }
        
        String masked = value;
        
        // 이메일 마스킹: user@example.com → us**@ex******.com
        masked = EMAIL_PATTERN.matcher(masked).replaceAll(match -> {
            String email = match.group();
            int atIndex = email.indexOf('@');
            if (atIndex > 2) {
                String local = email.substring(0, 2) + "**";
                String domain = email.substring(atIndex + 1);
                int dotIndex = domain.lastIndexOf('.');
                if (dotIndex > 2) {
                    String domainName = domain.substring(0, 2) + "*".repeat(dotIndex - 2);
                    String tld = domain.substring(dotIndex);
                    return local + "@" + domainName + tld;
                }
            }
            return "**@**.**";
        });
        
        // 전화번호 마스킹: 010-1234-5678 → 010-****-5678
        masked = PHONE_PATTERN.matcher(masked).replaceAll(match -> {
            String phone = match.group();
            String[] parts = phone.split("-");
            if (parts.length == 3) {
                return parts[0] + "-****-" + parts[2];
            }
            return "***-****-****";
        });
        
        // 카드번호 마스킹: 1234-5678-9012-3456 → 1234-****-****-3456
        masked = CARD_PATTERN.matcher(masked).replaceAll(match -> {
            String card = match.group();
            String[] parts = card.split("-");
            if (parts.length == 4) {
                return parts[0] + "-****-****-" + parts[3];
            }
            return "****-****-****-****";
        });
        
        // IP 주소 부분 마스킹: 192.168.1.100 → 192.168.*.*
        masked = IP_PATTERN.matcher(masked).replaceAll(match -> {
            String ip = match.group();
            String[] parts = ip.split("\\.");
            if (parts.length == 4) {
                return parts[0] + "." + parts[1] + ".*.*";
            }
            return "*.*.*.*";
        });
        
        return masked;
    }
    
    /**
     * 텍스트 마스킹 (로그, 분석 결과 등)
     */
    public String maskText(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        
        return maskPatterns(text);
    }
    
    /**
     * 이메일 마스킹
     */
    public String maskEmail(String email) {
        if (email == null || email.isEmpty()) {
            return email;
        }
        
        int atIndex = email.indexOf('@');
        if (atIndex > 2) {
            String local = email.substring(0, 2) + "**";
            String domain = email.substring(atIndex);
            return local + domain;
        }
        
        return "**@**.**";
    }
    
    /**
     * 전화번호 마스킹
     */
    public String maskPhone(String phone) {
        if (phone == null || phone.isEmpty()) {
            return phone;
        }
        
        // 숫자만 추출
        String numbers = phone.replaceAll("[^0-9]", "");
        
        if (numbers.length() == 11) {
            // 010-1234-5678 → 010-****-5678
            return numbers.substring(0, 3) + "-****-" + numbers.substring(7);
        } else if (numbers.length() == 10) {
            // 02-1234-5678 → 02-****-5678
            return numbers.substring(0, 2) + "-****-" + numbers.substring(6);
        }
        
        return "***-****-****";
    }
    
    /**
     * IP 주소 마스킹
     */
    public String maskIpAddress(String ip) {
        if (ip == null || ip.isEmpty()) {
            return ip;
        }
        
        String[] parts = ip.split("\\.");
        if (parts.length == 4) {
            return parts[0] + "." + parts[1] + ".*.*";
        }
        
        return "*.*.*.*";
    }
    
    /**
     * 카드번호 마스킹
     */
    public String maskCardNumber(String cardNumber) {
        if (cardNumber == null || cardNumber.isEmpty()) {
            return cardNumber;
        }
        
        String numbers = cardNumber.replaceAll("[^0-9]", "");
        
        if (numbers.length() == 16) {
            // 1234-5678-9012-3456 → 1234-****-****-3456
            return numbers.substring(0, 4) + "-****-****-" + numbers.substring(12);
        }
        
        return "****-****-****-****";
    }
}

