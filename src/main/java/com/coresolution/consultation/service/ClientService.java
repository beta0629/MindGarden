package com.coresolution.consultation.service;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.Client;

/**
 * 클라이언트 관리 서비스 인터페이스
 * BaseService를 상속하여 공통 CRUD 메서드 제공
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
public interface ClientService extends BaseService<Client, Long> {
    
    // ==================== 클라이언트 조회 메서드 ====================
    
    /**
     * 이메일로 클라이언트 조회
     */
    Optional<Client> findByEmail(String email);
    
    /**
     * 이름으로 클라이언트 검색
     */
    List<Client> findByNameContaining(String name);
    
    /**
     * 전화번호로 클라이언트 검색
     */
    List<Client> findByPhoneContaining(String phone);
    
    /**
     * 성별로 클라이언트 조회
     */
    List<Client> findByGender(String gender);
    
    /**
     * 선호 언어로 클라이언트 조회
     */
    List<Client> findByPreferredLanguage(String language);
    
    /**
     * 긴급 연락처 여부로 클라이언트 조회
     */
    List<Client> findByIsEmergencyContact(Boolean isEmergencyContact);
}

