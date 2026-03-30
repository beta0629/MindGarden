package com.coresolution.consultation.service;

/**
 * 사용자 ID(UserId) 생성기 인터페이스
 * 테넌트별 사용자 ID 자동 생성 전략을 정의
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-08
 */
public interface UserIdGenerator {
    
    /**
     * 테넌트별 고유한 사용자 ID 생성
     * 이메일 기반으로 사용자 ID을 생성하며, 테넌트 내에서 중복되지 않도록 보장
     * 
     * @param email 사용자 이메일 주소 (필수)
     * @param tenantId 테넌트 ID (필수, 테넌트별 중복 체크용)
     * @return 생성된 사용자 ID (테넌트 내에서 고유함이 보장됨)
     * @throws IllegalArgumentException email 또는 tenantId가 null이거나 비어있는 경우
     */
    String generateUniqueUserId(String email, String tenantId);
    
    /**
     * 이름 기반 사용자 ID 생성 (이메일이 없는 경우 대체)
     * 
     * @param name 사용자 이름
     * @param tenantId 테넌트 ID
     * @return 생성된 사용자 ID
     */
    default String generateUniqueUsernameFromName(String name, String tenantId) {
        throw new UnsupportedOperationException("이름 기반 사용자 ID 생성은 아직 구현되지 않았습니다.");
    }
}

