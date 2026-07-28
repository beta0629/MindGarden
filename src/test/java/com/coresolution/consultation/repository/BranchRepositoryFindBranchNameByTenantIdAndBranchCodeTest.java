package com.coresolution.consultation.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.entity.Branch;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * Phase1 B7: {@link BranchRepository#findBranchNameByTenantIdAndBranchCode(String, String)} 단위 검증.
 *
 * <p>{@code /api/v1/auth/current-user} 의 지점명 단건 조회 최적화(N+1 + 멀티테넌트 누락 제거) 회귀 방지.</p>
 *
 * @author MindGarden
 * @since 2026-06-12
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@Transactional
@ActiveProfiles("test")
@DisplayName("BranchRepository.findBranchNameByTenantIdAndBranchCode — Phase1 B7")
class BranchRepositoryFindBranchNameByTenantIdAndBranchCodeTest {

    @Autowired
    private BranchRepository branchRepository;

    @Test
    @DisplayName("정상: 동일 테넌트+branch_code 활성 지점이 있으면 한글 지점명 반환")
    void returnsBranchNameWhenTenantAndCodeMatch() {
        String tenantId = UUID.randomUUID().toString();
        String branchCode = uniqueBranchCode("A");
        Branch saved = saveActiveBranch(tenantId, branchCode, "강남지점");

        Optional<String> result = branchRepository.findBranchNameByTenantIdAndBranchCode(tenantId, branchCode);

        assertThat(result).contains(saved.getBranchName()).contains("강남지점");
    }

    @Test
    @DisplayName("멀티테넌트 격리: 다른 테넌트의 동일 branch_code 는 매칭되지 않는다")
    void doesNotLeakAcrossTenants() {
        String tenantIdA = UUID.randomUUID().toString();
        String tenantIdB = UUID.randomUUID().toString();
        String branchCodeA = uniqueBranchCode("X");
        String branchCodeB = uniqueBranchCode("Y");

        saveActiveBranch(tenantIdA, branchCodeA, "TenantA 본점");
        saveActiveBranch(tenantIdB, branchCodeB, "TenantB 본점");

        // tenantId B 로 tenant A 의 branchCode 를 조회하면 empty 여야 한다.
        Optional<String> crossLookup =
            branchRepository.findBranchNameByTenantIdAndBranchCode(tenantIdB, branchCodeA);
        assertThat(crossLookup).isEmpty();

        // 자기 테넌트의 branchCode 는 정상 조회된다.
        Optional<String> ownLookup =
            branchRepository.findBranchNameByTenantIdAndBranchCode(tenantIdB, branchCodeB);
        assertThat(ownLookup).contains("TenantB 본점");
    }

    @Test
    @DisplayName("소프트 삭제 제외: is_deleted=true 인 지점은 조회되지 않는다")
    void excludesSoftDeletedBranches() {
        String tenantId = UUID.randomUUID().toString();
        String branchCode = uniqueBranchCode("D");
        Branch branch = saveActiveBranch(tenantId, branchCode, "삭제된지점");
        branch.setIsDeleted(true);
        branchRepository.save(branch);

        Optional<String> result = branchRepository.findBranchNameByTenantIdAndBranchCode(tenantId, branchCode);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("입력 누락: branch_code 가 매칭되지 않으면 empty")
    void emptyWhenBranchCodeUnknown() {
        String tenantId = UUID.randomUUID().toString();
        saveActiveBranch(tenantId, uniqueBranchCode("E"), "지점");

        Optional<String> result =
            branchRepository.findBranchNameByTenantIdAndBranchCode(tenantId, uniqueBranchCode("Z"));

        assertThat(result).isEmpty();
    }

    private Branch saveActiveBranch(String tenantId, String branchCode, String branchName) {
        Branch branch = Branch.builder()
            .tenantId(tenantId)
            .branchCode(branchCode)
            .branchName(branchName)
            .branchType(Branch.BranchType.MAIN)
            .branchStatus(Branch.BranchStatus.ACTIVE)
            .build();
        branch.setIsDeleted(false);
        return branchRepository.save(branch);
    }

    /**
     * Branch.branchCode 가 전역 UNIQUE 이므로 테스트 간 충돌 방지를 위해 고유 코드 생성.
     * 패턴: [A-Z0-9]+ , 길이 3~10.
     */
    private String uniqueBranchCode(String prefix) {
        String suffix = UUID.randomUUID().toString().replace("-", "").toUpperCase();
        String code = prefix + suffix;
        return code.substring(0, Math.min(10, code.length()));
    }
}
