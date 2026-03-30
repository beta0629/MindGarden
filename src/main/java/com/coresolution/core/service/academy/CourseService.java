package com.coresolution.core.service.academy;

import com.coresolution.core.dto.academy.CourseRequest;
import com.coresolution.core.dto.academy.CourseResponse;

import java.util.List;

/**
 * 강좌 서비스 인터페이스
 * 학원 시스템의 강좌 관리 비즈니스 로직
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
public interface CourseService {
    
    /**
     * 강좌 목록 조회
     */
    List<CourseResponse> getCourses(String tenantId, Long branchId, String category, String subject);
    
    /**
     * 강좌 상세 조회
     */
    CourseResponse getCourse(String tenantId, String courseId);
    
    /**
     * 강좌 생성
     */
    CourseResponse createCourse(String tenantId, CourseRequest request, String createdBy);
    
    /**
     * 강좌 수정
     */
    CourseResponse updateCourse(String tenantId, String courseId, CourseRequest request, String updatedBy);
    
    /**
     * 강좌 삭제 (소프트 삭제)
     */
    void deleteCourse(String tenantId, String courseId, String deletedBy);
    
    /**
     * 강좌 활성화/비활성화
     */
    CourseResponse toggleCourseStatus(String tenantId, String courseId, boolean isActive, String updatedBy);
}

