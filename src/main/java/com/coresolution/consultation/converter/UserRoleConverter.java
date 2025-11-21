package com.coresolution.consultation.converter;

import com.coresolution.consultation.constant.UserRole;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * UserRole enum과 데이터베이스 문자열 간의 변환기
 * 기존 데이터베이스 호환성을 위해 ROLE_ 접두사 처리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Converter(autoApply = true)
public class UserRoleConverter implements AttributeConverter<UserRole, String> {

    @Override
    public String convertToDatabaseColumn(UserRole userRole) {
        if (userRole == null) {
            return null;
        }
        return userRole.name();
    }

    @Override
    public UserRole convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return UserRole.CLIENT; // 기본값
        }
        
        // 기존 스프링 시큐리티 역할 형식 처리
        String normalizedRole = dbData.trim().toUpperCase();
        
        // ROLE_ 접두사 제거
        if (normalizedRole.startsWith("ROLE_")) {
            normalizedRole = normalizedRole.substring(5);
        }
        
        try {
            return UserRole.valueOf(normalizedRole);
        } catch (IllegalArgumentException e) {
            // 기존 데이터 호환성을 위한 매핑
            switch (normalizedRole) {
                case "USER":
                case "CUSTOMER":
                case "CLIENT":
                    return UserRole.CLIENT;
                case "CONSULTANT":
                case "COUNSELOR":
                    return UserRole.CONSULTANT;
                case "ADMIN":
                case "ADMINISTRATOR":
                    return UserRole.ADMIN;
                case "HQ_MASTER":
                case "SUPERADMIN":
                case "ROOT":
                    return UserRole.HQ_MASTER;
                default:
                    // 알 수 없는 역할은 기본값으로
                    System.err.println("알 수 없는 역할: " + dbData + " -> CLIENT로 변환");
                    return UserRole.CLIENT;
            }
        }
    }
}
