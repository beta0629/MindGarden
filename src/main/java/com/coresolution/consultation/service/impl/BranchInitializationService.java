package com.coresolution.consultation.service.impl;


import com.coresolution.core.context.TenantContextHolder;
import java.time.LocalTime;
import com.coresolution.consultation.entity.Branch;
import com.coresolution.consultation.repository.BranchRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Branch 테이블 초기 데이터 생성 서비스
 * 애플리케이션 시작 시 MAIN001 본점 데이터를 자동 생성
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BranchInitializationService implements CommandLineRunner {
    
    private final BranchRepository branchRepository;
    
    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("🏢 Branch 테이블 초기 데이터 확인 및 생성 시작");
        initializeMainBranch();
    }
    
    /**
     * MAIN001 본점 데이터 초기화
     */
    private void initializeMainBranch() {
        try {
            // MAIN001 지점이 이미 존재하는지 확인 (삭제되지 않은 것만)
            var existingBranch = branchRepository.findByBranchCodeAndIsDeletedFalse("MAIN001");
            if (existingBranch.isPresent()) {
                Branch branch = existingBranch.get();
                // 상태가 PLANNING이면 ACTIVE로 변경
                if (branch.getBranchStatus() != Branch.BranchStatus.ACTIVE) {
                    branch.setBranchStatus(Branch.BranchStatus.ACTIVE);
                    branch.setBranchName("본점");
                    branchRepository.save(branch);
                    log.info("✅ MAIN001 본점 상태를 ACTIVE로 변경: {}", branch.getBranchStatus());
                } else {
                    log.info("✅ MAIN001 본점이 이미 ACTIVE 상태입니다");
                }
                return;
            }
            
            // MAIN001 본점 생성
            Branch mainBranch = Branch.builder()
                .branchCode("MAIN001")
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
                .branchStatus(Branch.BranchStatus.ACTIVE)
                .build();
            
            Branch savedBranch = branchRepository.save(mainBranch);
            log.info("✅ MAIN001 본점 생성 완료: ID={}, 지점명={}", savedBranch.getId(), savedBranch.getBranchName());
            
        } catch (Exception e) {
            log.error("❌ MAIN001 본점 생성 실패", e);
        }
    }
}
