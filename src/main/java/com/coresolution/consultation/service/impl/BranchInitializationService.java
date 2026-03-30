package com.coresolution.consultation.service.impl;

import java.time.LocalTime;
import com.coresolution.consultation.entity.Branch;
import com.coresolution.consultation.repository.BranchRepository;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Branch 테이블 초기 데이터 생성 서비스
 * 표준화 2025-12-06: 지점 개념 제거로 인해 비활성화됨
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-09-19
 * @deprecated 지점 개념이 제거되어 더 이상 사용하지 않음. tenantId 기반으로만 동작합니다.
 */
@Deprecated
@Slf4j
@Service
@RequiredArgsConstructor
public class BranchInitializationService {
    
    private final BranchRepository branchRepository;
    
    // CommandLineRunner 제거 - 더 이상 초기화 작업을 수행하지 않음
    // 표준화 2025-12-06: 지점 개념이 제거되어 더 이상 지점 초기화를 수행하지 않음
    // log.warn("⚠️ BranchInitializationService는 더 이상 사용하지 않습니다. 지점 개념이 제거되었습니다.");
    
    /**
     * 본점 데이터 초기화
     * 표준화 2025-12-06: 지점 개념 제거로 인해 비활성화됨
     * @deprecated 지점 개념이 제거되어 더 이상 사용하지 않음
     */
    @Deprecated
    private void initializeMainBranch() {
        // 표준화 2025-12-06: 지점 개념이 제거되어 더 이상 실행하지 않음
        log.warn("⚠️ initializeMainBranch()는 더 이상 사용하지 않습니다. 지점 개념이 제거되었습니다.");
        return;
        /*
        // 아래 코드는 비활성화됨
        try {
            // 표준화 2025-12-06: branchCode 대신 지점 유형이 MAIN인 지점을 찾음
            var existingBranches = branchRepository.findByBranchTypeAndIsDeletedFalseOrderByBranchName(Branch.BranchType.MAIN);
            var existingBranch = existingBranches.stream()
                .filter(b -> "본점".equals(b.getBranchName()))
                .findFirst();
            
            if (existingBranch.isPresent()) {
                Branch branch = existingBranch.get();
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                if (branch.getBranchStatus() != Branch.BranchStatus.ACTIVE) {
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    branch.setBranchStatus(Branch.BranchStatus.ACTIVE);
                    branch.setBranchName("본점");
                    branchRepository.save(branch);
                    log.info("✅ 본점 상태를 ACTIVE로 변경: {}", branch.getBranchStatus());
                } else {
                    log.info("✅ 본점이 이미 ACTIVE 상태입니다");
                }
                return;
            }
            
            Branch mainBranch = Branch.builder()
                .branchCode(null) // 표준화 2025-12-06: branchCode는 더 이상 사용하지 않음
                .branchName("본점")
                .branchType(Branch.BranchType.MAIN)
                .postalCode("06234")
                .address("서울특별시 강남구 테헤란로 123")
                .addressDetail("1층")
                .phoneNumber("02-1234-5678")
                .email("main@mindgarden.com")
                .operatingStartTime(LocalTime.of(9, 0))
                .operatingEndTime(LocalTime.of(18, 0))
                .maxConsultants(50)
                .maxClients(1000)
                .description("마인드가든 본점")
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .branchStatus(Branch.BranchStatus.ACTIVE)
                .build();
            
            Branch savedBranch = branchRepository.save(mainBranch);
            log.info("✅ 본점 생성 완료: ID={}, 지점명={}", savedBranch.getId(), savedBranch.getBranchName());
            
        } catch (Exception e) {
            log.error("❌ 본점 생성 실패", e);
        }
        */
    }
}
