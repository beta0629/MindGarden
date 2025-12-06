package com.coresolution.consultation.service.impl;

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
            var existingBranch = branchRepository.findByBranchCodeAndIsDeletedFalse("MAIN001");
            if (existingBranch.isPresent()) {
                Branch branch = existingBranch.get();
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                if (branch.getBranchStatus() != Branch.BranchStatus.ACTIVE) {
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    branch.setBranchStatus(Branch.BranchStatus.ACTIVE);
                    branch.setBranchName("본점");
                    branchRepository.save(branch);
                    log.info("✅ MAIN001 본점 상태를 ACTIVE로 변경: {}", branch.getBranchStatus());
                } else {
                    log.info("✅ MAIN001 본점이 이미 ACTIVE 상태입니다");
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
            log.info("✅ MAIN001 본점 생성 완료: ID={}, 지점명={}", savedBranch.getId(), savedBranch.getBranchName());
            
        } catch (Exception e) {
            log.error("❌ MAIN001 본점 생성 실패", e);
        }
    }
}
