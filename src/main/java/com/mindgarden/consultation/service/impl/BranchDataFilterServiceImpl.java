package com.mindgarden.consultation.service.impl;

import java.util.List;
import java.util.stream.Collectors;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.entity.Branch;
import com.mindgarden.consultation.entity.ConsultationRecord;
import com.mindgarden.consultation.entity.Schedule;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.BranchDataFilterService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 지점별 데이터 필터링 서비스 구현체
 * 기존 권한 시스템을 건드리지 않고 지점별 데이터 격리만 담당
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-16
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BranchDataFilterServiceImpl implements BranchDataFilterService {
    
    
    @Override
    public List<User> filterConsultantsByBranch(User user, List<User> allConsultants) {
        if (user == null || allConsultants == null) {
            return List.of();
        }
        
        // 본사 관리자는 모든 지점 데이터 접근 가능
        if (isHeadquartersAdmin(user)) {
            log.debug("본사 관리자 - 모든 상담사 데이터 접근 허용");
            return allConsultants;
        }
        
        // 사용자의 지점코드 확인 (기존 구현 방식 참고)
        String userBranchCode = user.getBranchCode();
        if (userBranchCode == null || userBranchCode.trim().isEmpty()) {
            log.warn("사용자 지점코드 없음: {}", user.getUsername());
            return List.of();
        }
        
        // 지점코드로 상담사 필터링 (기존 UserController 방식 참고)
        List<User> filteredConsultants = allConsultants.stream()
            .filter(consultant -> userBranchCode.equals(consultant.getBranchCode()))
            .collect(Collectors.toList());
        
        log.debug("지점별 상담사 필터링 완료: 지점코드={}, 필터링된 상담사 수={}", 
                userBranchCode, filteredConsultants.size());
        
        return filteredConsultants;
    }
    
    @Override
    public List<User> filterClientsByBranch(User user, List<User> allClients) {
        if (user == null || allClients == null) {
            return List.of();
        }
        
        // 본사 관리자는 모든 지점 데이터 접근 가능
        if (isHeadquartersAdmin(user)) {
            log.debug("본사 관리자 - 모든 내담자 데이터 접근 허용");
            return allClients;
        }
        
        // 사용자의 지점코드 확인 (기존 구현 방식 참고)
        String userBranchCode = user.getBranchCode();
        if (userBranchCode == null || userBranchCode.trim().isEmpty()) {
            log.warn("사용자 지점코드 없음: {}", user.getUsername());
            return List.of();
        }
        
        // 지점코드로 내담자 필터링 (기존 UserController 방식 참고)
        List<User> filteredClients = allClients.stream()
            .filter(client -> userBranchCode.equals(client.getBranchCode()))
            .collect(Collectors.toList());
        
        log.debug("지점별 내담자 필터링 완료: 지점코드={}, 필터링된 내담자 수={}", 
                userBranchCode, filteredClients.size());
        
        return filteredClients;
    }
    
    @Override
    public List<?> filterConsultationRecordsByBranch(User user, List<?> allRecords) {
        if (user == null || allRecords == null) {
            return List.of();
        }
        
        // 본사 관리자는 모든 지점 데이터 접근 가능
        if (isHeadquartersAdmin(user)) {
            log.debug("본사 관리자 - 모든 상담 기록 데이터 접근 허용");
            return allRecords;
        }
        
        // 사용자의 지점 정보 조회
        Branch userBranch = getUserBranch(user);
        if (userBranch == null) {
            log.warn("사용자 지점 정보 없음: {}", user.getUsername());
            return List.of();
        }
        
        // 상담 기록을 지점별로 필터링 (지점코드 기반)
        List<?> filteredRecords = allRecords.stream()
            .filter(record -> {
                if (record instanceof ConsultationRecord) {
                    ConsultationRecord consultationRecord = (ConsultationRecord) record;
                    // 상담사 정보가 있는 경우 지점코드로 비교
                    if (consultationRecord.getConsultantId() != null) {
                        // TODO: 상담사 ID로 지점코드 조회하여 비교
                        return true; // 임시로 true 반환
                    }
                }
                return false;
            })
            .collect(Collectors.toList());
        
        log.debug("지점별 상담 기록 필터링 완료: 지점={}, 필터링된 기록 수={}", 
                userBranch.getBranchName(), filteredRecords.size());
        
        return filteredRecords;
    }
    
    @Override
    public List<?> filterSchedulesByBranch(User user, List<?> allSchedules) {
        if (user == null || allSchedules == null) {
            return List.of();
        }
        
        // 본사 관리자는 모든 지점 데이터 접근 가능
        if (isHeadquartersAdmin(user)) {
            log.debug("본사 관리자 - 모든 스케줄 데이터 접근 허용");
            return allSchedules;
        }
        
        // 사용자의 지점 정보 조회
        Branch userBranch = getUserBranch(user);
        if (userBranch == null) {
            log.warn("사용자 지점 정보 없음: {}", user.getUsername());
            return List.of();
        }
        
        // 스케줄을 지점별로 필터링 (지점코드 기반)
        List<?> filteredSchedules = allSchedules.stream()
            .filter(schedule -> {
                if (schedule instanceof Schedule) {
                    Schedule scheduleEntity = (Schedule) schedule;
                    // 상담사 정보가 있는 경우 지점코드로 비교
                    if (scheduleEntity.getConsultantId() != null) {
                        // TODO: 상담사 ID로 지점코드 조회하여 비교
                        return true; // 임시로 true 반환
                    }
                }
                return false;
            })
            .collect(Collectors.toList());
        
        log.debug("지점별 스케줄 필터링 완료: 지점={}, 필터링된 스케줄 수={}", 
                userBranch.getBranchName(), filteredSchedules.size());
        
        return filteredSchedules;
    }
    
    @Override
    public boolean canAccessBranchData(User user, Long targetBranchId) {
        if (user == null || targetBranchId == null) {
            return false;
        }
        
        // 본사 관리자는 모든 지점 데이터 접근 가능
        if (isHeadquartersAdmin(user)) {
            return true;
        }
        
        // 사용자의 지점 정보 조회
        Branch userBranch = getUserBranch(user);
        if (userBranch == null) {
            return false;
        }
        
        // 같은 지점인지 확인
        boolean canAccess = userBranch.getId().equals(targetBranchId);
        
        log.debug("지점 데이터 접근 권한 확인: 사용자={}, 사용자지점={}, 대상지점={}, 접근가능={}", 
                user.getUsername(), userBranch.getId(), targetBranchId, canAccess);
        
        return canAccess;
    }
    
    @Override
    public Branch getUserBranch(User user) {
        if (user == null) {
            return null;
        }
        
        return user.getBranch();
    }
    
    @Override
    public boolean hasBranchAccess(User user, Long branchId) {
        return canAccessBranchData(user, branchId);
    }
    
    /**
     * 본사 관리자인지 확인
     * @param user 사용자
     * @return 본사 관리자 여부
     */
    private boolean isHeadquartersAdmin(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        
        UserRole role = user.getRole();
        return role.isHeadquartersAdmin() || role.isMaster();
    }
}
