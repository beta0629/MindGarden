package com.coresolution.core.service.impl.academy;

import com.coresolution.core.domain.academy.Course;
import com.coresolution.core.dto.academy.CourseRequest;
import com.coresolution.core.dto.academy.CourseResponse;
import com.coresolution.core.repository.academy.CourseRepository;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.academy.CourseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 강좌 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {
    
    private final CourseRepository courseRepository;
    private final TenantAccessControlService accessControlService;
    
    @Override
    @Transactional(readOnly = true)
    public List<CourseResponse> getCourses(String tenantId, Long branchId, String category, String subject) {
        log.debug("강좌 목록 조회: tenantId={}, branchId={}, category={}, subject={}", tenantId, branchId, category, subject);
        
        List<Course> courses;
        
        if (branchId != null) {
            courses = courseRepository.findActiveCoursesByTenantIdAndBranchId(tenantId, branchId);
        } else {
            courses = courseRepository.findActiveCoursesByTenantId(tenantId);
        }
        
        // 카테고리 필터링
        if (category != null && !category.isEmpty()) {
            courses = courses.stream()
                    .filter(c -> category.equals(c.getCategory()))
                    .collect(Collectors.toList());
        }
        
        // 과목 필터링
        if (subject != null && !subject.isEmpty()) {
            courses = courses.stream()
                    .filter(c -> subject.equals(c.getSubject()))
                    .collect(Collectors.toList());
        }
        
        return courses.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public CourseResponse getCourse(String tenantId, String courseId) {
        log.debug("강좌 상세 조회: tenantId={}, courseId={}", tenantId, courseId);
        
        Course course = courseRepository.findByCourseIdAndIsDeletedFalse(courseId)
                .orElseThrow(() -> new IllegalArgumentException("강좌를 찾을 수 없습니다: " + courseId));
        
        // 접근 제어 검증
        if (!course.getTenantId().equals(tenantId)) {
            accessControlService.validateTenantAccess(tenantId);
        }
        
        return toResponse(course);
    }
    
    @Override
    public CourseResponse createCourse(String tenantId, CourseRequest request, String createdBy) {
        log.info("강좌 생성: tenantId={}, name={}, createdBy={}", tenantId, request.getName(), createdBy);
        
        // 중복 확인
        if (courseRepository.existsByCourseIdAndIsDeletedFalse(request.getName())) {
            throw new IllegalStateException("이미 존재하는 강좌명입니다: " + request.getName());
        }
        
        Course course = Course.builder()
                .courseId(UUID.randomUUID().toString())
                .branchId(request.getBranchId())
                .name(request.getName())
                .nameKo(request.getNameKo())
                .nameEn(request.getNameEn())
                .description(request.getDescription())
                .descriptionKo(request.getDescriptionKo())
                .descriptionEn(request.getDescriptionEn())
                .category(request.getCategory())
                .level(request.getLevel())
                .subject(request.getSubject())
                .pricingPolicy(request.getPricingPolicy() != null ? request.getPricingPolicy() : Course.PricingPolicy.FIXED)
                .basePrice(request.getBasePrice())
                .currency(request.getCurrency() != null ? request.getCurrency() : "KRW")
                .pricingDetailsJson(request.getPricingDetailsJson())
                .durationMonths(request.getDurationMonths())
                .totalSessions(request.getTotalSessions())
                .sessionDurationMinutes(request.getSessionDurationMinutes())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .metadataJson(request.getMetadataJson())
                .settingsJson(request.getSettingsJson())
                .build();
        
        course.setTenantId(tenantId);
        course.setCreatedBy(createdBy);
        course.setUpdatedBy(createdBy);
        
        Course saved = courseRepository.save(course);
        log.info("강좌 생성 완료: courseId={}", saved.getCourseId());
        
        return toResponse(saved);
    }
    
    @Override
    public CourseResponse updateCourse(String tenantId, String courseId, CourseRequest request, String updatedBy) {
        log.info("강좌 수정: tenantId={}, courseId={}, updatedBy={}", tenantId, courseId, updatedBy);
        
        Course course = courseRepository.findByCourseIdAndIsDeletedFalse(courseId)
                .orElseThrow(() -> new IllegalArgumentException("강좌를 찾을 수 없습니다: " + courseId));
        
        // 접근 제어 검증
        if (!course.getTenantId().equals(tenantId)) {
            accessControlService.validateTenantAccess(tenantId);
        }
        
        // 수정
        if (request.getBranchId() != null) {
            course.setBranchId(request.getBranchId());
        }
        if (request.getName() != null) {
            course.setName(request.getName());
        }
        if (request.getNameKo() != null) {
            course.setNameKo(request.getNameKo());
        }
        if (request.getNameEn() != null) {
            course.setNameEn(request.getNameEn());
        }
        if (request.getDescription() != null) {
            course.setDescription(request.getDescription());
        }
        if (request.getDescriptionKo() != null) {
            course.setDescriptionKo(request.getDescriptionKo());
        }
        if (request.getDescriptionEn() != null) {
            course.setDescriptionEn(request.getDescriptionEn());
        }
        if (request.getCategory() != null) {
            course.setCategory(request.getCategory());
        }
        if (request.getLevel() != null) {
            course.setLevel(request.getLevel());
        }
        if (request.getSubject() != null) {
            course.setSubject(request.getSubject());
        }
        if (request.getPricingPolicy() != null) {
            course.setPricingPolicy(request.getPricingPolicy());
        }
        if (request.getBasePrice() != null) {
            course.setBasePrice(request.getBasePrice());
        }
        if (request.getCurrency() != null) {
            course.setCurrency(request.getCurrency());
        }
        if (request.getPricingDetailsJson() != null) {
            course.setPricingDetailsJson(request.getPricingDetailsJson());
        }
        if (request.getDurationMonths() != null) {
            course.setDurationMonths(request.getDurationMonths());
        }
        if (request.getTotalSessions() != null) {
            course.setTotalSessions(request.getTotalSessions());
        }
        if (request.getSessionDurationMinutes() != null) {
            course.setSessionDurationMinutes(request.getSessionDurationMinutes());
        }
        if (request.getIsActive() != null) {
            course.setIsActive(request.getIsActive());
        }
        if (request.getDisplayOrder() != null) {
            course.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getMetadataJson() != null) {
            course.setMetadataJson(request.getMetadataJson());
        }
        if (request.getSettingsJson() != null) {
            course.setSettingsJson(request.getSettingsJson());
        }
        
        course.setUpdatedBy(updatedBy);
        
        Course updated = courseRepository.save(course);
        log.info("강좌 수정 완료: courseId={}", updated.getCourseId());
        
        return toResponse(updated);
    }
    
    @Override
    public void deleteCourse(String tenantId, String courseId, String deletedBy) {
        log.info("강좌 삭제: tenantId={}, courseId={}, deletedBy={}", tenantId, courseId, deletedBy);
        
        Course course = courseRepository.findByCourseIdAndIsDeletedFalse(courseId)
                .orElseThrow(() -> new IllegalArgumentException("강좌를 찾을 수 없습니다: " + courseId));
        
        // 접근 제어 검증
        if (!course.getTenantId().equals(tenantId)) {
            accessControlService.validateTenantAccess(tenantId);
        }
        
        course.delete();
        course.setUpdatedBy(deletedBy);
        
        courseRepository.save(course);
        log.info("강좌 삭제 완료: courseId={}", courseId);
    }
    
    @Override
    public CourseResponse toggleCourseStatus(String tenantId, String courseId, boolean isActive, String updatedBy) {
        log.info("강좌 상태 변경: tenantId={}, courseId={}, isActive={}, updatedBy={}", tenantId, courseId, isActive, updatedBy);
        
        Course course = courseRepository.findByCourseIdAndIsDeletedFalse(courseId)
                .orElseThrow(() -> new IllegalArgumentException("강좌를 찾을 수 없습니다: " + courseId));
        
        // 접근 제어 검증
        if (!course.getTenantId().equals(tenantId)) {
            accessControlService.validateTenantAccess(tenantId);
        }
        
        course.setIsActive(isActive);
        course.setUpdatedBy(updatedBy);
        
        Course updated = courseRepository.save(course);
        log.info("강좌 상태 변경 완료: courseId={}, isActive={}", courseId, isActive);
        
        return toResponse(updated);
    }
    
    /**
     * Course 엔티티를 CourseResponse DTO로 변환
     */
    private CourseResponse toResponse(Course course) {
        return CourseResponse.builder()
                .courseId(course.getCourseId())
                .tenantId(course.getTenantId())
                .branchId(course.getBranchId())
                .name(course.getName())
                .nameKo(course.getNameKo())
                .nameEn(course.getNameEn())
                .description(course.getDescription())
                .descriptionKo(course.getDescriptionKo())
                .descriptionEn(course.getDescriptionEn())
                .category(course.getCategory())
                .level(course.getLevel())
                .subject(course.getSubject())
                .pricingPolicy(course.getPricingPolicy())
                .basePrice(course.getBasePrice())
                .currency(course.getCurrency())
                .pricingDetailsJson(course.getPricingDetailsJson())
                .durationMonths(course.getDurationMonths())
                .totalSessions(course.getTotalSessions())
                .sessionDurationMinutes(course.getSessionDurationMinutes())
                .isActive(course.getIsActive())
                .displayOrder(course.getDisplayOrder())
                .metadataJson(course.getMetadataJson())
                .settingsJson(course.getSettingsJson())
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .build();
    }
}

