package com.coresolution.core.service.impl.academy;

import com.coresolution.core.domain.academy.Class;
import com.coresolution.core.domain.academy.Course;
import com.coresolution.core.dto.academy.ClassRequest;
import com.coresolution.core.dto.academy.ClassResponse;
import com.coresolution.core.repository.academy.ClassRepository;
import com.coresolution.core.repository.academy.CourseRepository;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.academy.ClassService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 반 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ClassServiceImpl implements ClassService {
    
    private final ClassRepository classRepository;
    private final CourseRepository courseRepository;
    private final TenantAccessControlService accessControlService;
    
    @Override
    @Transactional(readOnly = true)
    public List<ClassResponse> getClasses(String tenantId, Long branchId, String courseId, Class.ClassStatus status) {
        log.debug("반 목록 조회: tenantId={}, branchId={}, courseId={}, status={}", tenantId, branchId, courseId, status);
        
        List<Class> classes;
        
        if (courseId != null && branchId != null) {
            classes = classRepository.findByTenantIdAndBranchIdAndCourseIdAndIsDeletedFalse(tenantId, branchId, courseId);
        } else if (branchId != null) {
            classes = classRepository.findByTenantIdAndBranchIdAndIsDeletedFalse(tenantId, branchId);
        } else if (courseId != null) {
            classes = classRepository.findByTenantIdAndCourseIdAndIsDeletedFalse(tenantId, courseId);
        } else {
            classes = classRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        }
        
        // 상태 필터링
        if (status != null) {
            classes = classes.stream()
                    .filter(c -> status.equals(c.getStatus()))
                    .collect(Collectors.toList());
        }
        
        return classes.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public ClassResponse getClass(String tenantId, String classId) {
        log.debug("반 상세 조회: tenantId={}, classId={}", tenantId, classId);
        
        Class classEntity = classRepository.findByClassIdAndIsDeletedFalse(classId)
                .orElseThrow(() -> new IllegalArgumentException("반을 찾을 수 없습니다: " + classId));
        
        // 접근 제어 검증
        if (!classEntity.getTenantId().equals(tenantId)) {
            accessControlService.validateTenantAccess(tenantId);
        }
        
        return toResponse(classEntity);
    }
    
    @Override
    public ClassResponse createClass(String tenantId, ClassRequest request, String createdBy) {
        log.info("반 생성: tenantId={}, name={}, courseId={}, createdBy={}", tenantId, request.getName(), request.getCourseId(), createdBy);
        
        // 강좌 존재 확인
        Course course = courseRepository.findByCourseIdAndIsDeletedFalse(request.getCourseId())
                .orElseThrow(() -> new IllegalArgumentException("강좌를 찾을 수 없습니다: " + request.getCourseId()));
        
        // 접근 제어 검증
        if (!course.getTenantId().equals(tenantId)) {
            accessControlService.validateTenantAccess(tenantId);
        }
        
        Class classEntity = Class.builder()
                .classId(UUID.randomUUID().toString())
                .branchId(request.getBranchId())
                .courseId(request.getCourseId())
                .name(request.getName())
                .nameKo(request.getNameKo())
                .nameEn(request.getNameEn())
                .description(request.getDescription())
                .teacherId(request.getTeacherId())
                .teacherName(request.getTeacherName())
                .capacity(request.getCapacity() != null ? request.getCapacity() : 10)
                .currentEnrollment(0)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .room(request.getRoom())
                .status(request.getStatus() != null ? request.getStatus() : Class.ClassStatus.DRAFT)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .optionsJson(request.getOptionsJson())
                .settingsJson(request.getSettingsJson())
                .build();
        
        classEntity.setTenantId(tenantId);
        classEntity.setCreatedBy(createdBy);
        classEntity.setUpdatedBy(createdBy);
        
        Class saved = classRepository.save(classEntity);
        log.info("반 생성 완료: classId={}", saved.getClassId());
        
        return toResponse(saved);
    }
    
    @Override
    public ClassResponse updateClass(String tenantId, String classId, ClassRequest request, String updatedBy) {
        log.info("반 수정: tenantId={}, classId={}, updatedBy={}", tenantId, classId, updatedBy);
        
        Class classEntity = classRepository.findByClassIdAndIsDeletedFalse(classId)
                .orElseThrow(() -> new IllegalArgumentException("반을 찾을 수 없습니다: " + classId));
        
        // 접근 제어 검증
        if (!classEntity.getTenantId().equals(tenantId)) {
            accessControlService.validateTenantAccess(tenantId);
        }
        
        // 수정
        if (request.getBranchId() != null) {
            classEntity.setBranchId(request.getBranchId());
        }
        if (request.getCourseId() != null) {
            classEntity.setCourseId(request.getCourseId());
        }
        if (request.getName() != null) {
            classEntity.setName(request.getName());
        }
        if (request.getNameKo() != null) {
            classEntity.setNameKo(request.getNameKo());
        }
        if (request.getNameEn() != null) {
            classEntity.setNameEn(request.getNameEn());
        }
        if (request.getDescription() != null) {
            classEntity.setDescription(request.getDescription());
        }
        if (request.getTeacherId() != null) {
            classEntity.setTeacherId(request.getTeacherId());
        }
        if (request.getTeacherName() != null) {
            classEntity.setTeacherName(request.getTeacherName());
        }
        if (request.getCapacity() != null) {
            classEntity.setCapacity(request.getCapacity());
        }
        if (request.getStartDate() != null) {
            classEntity.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            classEntity.setEndDate(request.getEndDate());
        }
        if (request.getRoom() != null) {
            classEntity.setRoom(request.getRoom());
        }
        if (request.getStatus() != null) {
            classEntity.setStatus(request.getStatus());
        }
        if (request.getIsActive() != null) {
            classEntity.setIsActive(request.getIsActive());
        }
        if (request.getOptionsJson() != null) {
            classEntity.setOptionsJson(request.getOptionsJson());
        }
        if (request.getSettingsJson() != null) {
            classEntity.setSettingsJson(request.getSettingsJson());
        }
        
        classEntity.setUpdatedBy(updatedBy);
        
        Class updated = classRepository.save(classEntity);
        log.info("반 수정 완료: classId={}", updated.getClassId());
        
        return toResponse(updated);
    }
    
    @Override
    public void deleteClass(String tenantId, String classId, String deletedBy) {
        log.info("반 삭제: tenantId={}, classId={}, deletedBy={}", tenantId, classId, deletedBy);
        
        Class classEntity = classRepository.findByClassIdAndIsDeletedFalse(classId)
                .orElseThrow(() -> new IllegalArgumentException("반을 찾을 수 없습니다: " + classId));
        
        // 접근 제어 검증
        if (!classEntity.getTenantId().equals(tenantId)) {
            accessControlService.validateTenantAccess(tenantId);
        }
        
        classEntity.delete();
        classEntity.setUpdatedBy(deletedBy);
        
        classRepository.save(classEntity);
        log.info("반 삭제 완료: classId={}", classId);
    }
    
    @Override
    public ClassResponse updateClassStatus(String tenantId, String classId, Class.ClassStatus status, String updatedBy) {
        log.info("반 상태 변경: tenantId={}, classId={}, status={}, updatedBy={}", tenantId, classId, status, updatedBy);
        
        Class classEntity = classRepository.findByClassIdAndIsDeletedFalse(classId)
                .orElseThrow(() -> new IllegalArgumentException("반을 찾을 수 없습니다: " + classId));
        
        // 접근 제어 검증
        if (!classEntity.getTenantId().equals(tenantId)) {
            accessControlService.validateTenantAccess(tenantId);
        }
        
        classEntity.setStatus(status);
        classEntity.setUpdatedBy(updatedBy);
        
        Class updated = classRepository.save(classEntity);
        log.info("반 상태 변경 완료: classId={}, status={}", classId, status);
        
        return toResponse(updated);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ClassResponse> getRecruitingClasses(String tenantId, Long branchId) {
        log.debug("모집 중인 반 목록 조회: tenantId={}, branchId={}", tenantId, branchId);
        
        List<Class> classes = classRepository.findRecruitingClassesByTenantIdAndBranchId(tenantId, branchId);
        
        return classes.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean canEnroll(String tenantId, String classId) {
        log.debug("등록 가능 여부 확인: tenantId={}, classId={}", tenantId, classId);
        
        Class classEntity = classRepository.findByClassIdAndIsDeletedFalse(classId)
                .orElseThrow(() -> new IllegalArgumentException("반을 찾을 수 없습니다: " + classId));
        
        // 접근 제어 검증
        if (!classEntity.getTenantId().equals(tenantId)) {
            accessControlService.validateTenantAccess(tenantId);
        }
        
        return classEntity.canEnroll();
    }
    
    /**
     * Class 엔티티를 ClassResponse DTO로 변환
     */
    private ClassResponse toResponse(Class classEntity) {
        return ClassResponse.builder()
                .classId(classEntity.getClassId())
                .tenantId(classEntity.getTenantId())
                .branchId(classEntity.getBranchId())
                .courseId(classEntity.getCourseId())
                .name(classEntity.getName())
                .nameKo(classEntity.getNameKo())
                .nameEn(classEntity.getNameEn())
                .description(classEntity.getDescription())
                .teacherId(classEntity.getTeacherId())
                .teacherName(classEntity.getTeacherName())
                .capacity(classEntity.getCapacity())
                .currentEnrollment(classEntity.getCurrentEnrollment())
                .startDate(classEntity.getStartDate())
                .endDate(classEntity.getEndDate())
                .room(classEntity.getRoom())
                .status(classEntity.getStatus())
                .isActive(classEntity.getIsActive())
                .optionsJson(classEntity.getOptionsJson())
                .settingsJson(classEntity.getSettingsJson())
                .createdAt(classEntity.getCreatedAt())
                .updatedAt(classEntity.getUpdatedAt())
                .build();
    }
}

