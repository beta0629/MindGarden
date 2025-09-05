package com.mindgarden.consultation.service;

import com.mindgarden.consultation.dto.SuperAdminCreateRequest;
import com.mindgarden.consultation.entity.User;
import org.springframework.http.ResponseEntity;

/**
 * 수퍼어드민 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-05
 */
public interface SuperAdminService {
    
    /**
     * 수퍼어드민 계정 생성
     * 
     * @param request 수퍼어드민 생성 요청
     * @return 생성된 수퍼어드민 사용자
     */
    User createSuperAdmin(SuperAdminCreateRequest request);
    
    /**
     * 수퍼어드민 목록 조회
     * 
     * @return 수퍼어드민 목록
     */
    ResponseEntity<?> getSuperAdminList();
}
