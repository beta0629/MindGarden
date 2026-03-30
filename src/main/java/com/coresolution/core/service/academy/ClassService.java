package com.coresolution.core.service.academy;

import com.coresolution.core.domain.academy.Class;
import com.coresolution.core.dto.academy.ClassRequest;
import com.coresolution.core.dto.academy.ClassResponse;

import java.util.List;

/**
 * 반 서비스 인터페이스
 * 학원 시스템의 반(Class) 관리 비즈니스 로직
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
public interface ClassService {
    
    /**
     * 반 목록 조회
     */
    List<ClassResponse> getClasses(String tenantId, Long branchId, String courseId, Class.ClassStatus status);
    
    /**
     * 반 상세 조회
     */
    ClassResponse getClass(String tenantId, String classId);
    
    /**
     * 반 생성
     */
    ClassResponse createClass(String tenantId, ClassRequest request, String createdBy);
    
    /**
     * 반 수정
     */
    ClassResponse updateClass(String tenantId, String classId, ClassRequest request, String updatedBy);
    
    /**
     * 반 삭제 (소프트 삭제)
     */
    void deleteClass(String tenantId, String classId, String deletedBy);
    
    /**
     * 반 상태 변경
     */
    ClassResponse updateClassStatus(String tenantId, String classId, Class.ClassStatus status, String updatedBy);
    
    /**
     * 모집 중인 반 목록 조회
     */
    List<ClassResponse> getRecruitingClasses(String tenantId, Long branchId);
    
    /**
     * 정원 확인 및 등록 가능 여부 확인
     */
    boolean canEnroll(String tenantId, String classId);
}

