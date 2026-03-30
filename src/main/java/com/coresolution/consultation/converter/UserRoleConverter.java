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
            return UserRole.CLIENT;
        }
        return UserRole.fromString(dbData);
    }
}
