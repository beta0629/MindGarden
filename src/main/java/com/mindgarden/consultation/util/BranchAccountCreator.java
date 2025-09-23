package com.mindgarden.consultation.util;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.entity.Client;
import com.mindgarden.consultation.entity.Consultant;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.ClientRepository;
import com.mindgarden.consultation.repository.ConsultantRepository;
import com.mindgarden.consultation.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 지점별 계정 생성 유틸리티
 * 작성일: 2025-09-23
 * 설명: 각 지점에 지점수퍼 관리자, 상담사, 내담자 계정을 생성
 */
@Component
public class BranchAccountCreator {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ConsultantRepository consultantRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // 지점별 계정 정보
    private static final List<String> BRANCH_CODES = Arrays.asList(
        "GANGNAM", "HONGDAE", "JAMSIL", "SINCHON", 
        "BUSAN", "DAEGU", "INCHEON", "GWANGJU"
    );

    private static final List<String> BRANCH_NAMES = Arrays.asList(
        "강남점", "홍대점", "잠실점", "신촌점",
        "부산점", "대구점", "인천점", "광주점"
    );

    /**
     * 모든 지점의 계정을 생성
     */
    @Transactional
    public void createAllBranchAccounts() {
        System.out.println("지점별 계정 생성 시작...");
        
        for (int i = 0; i < BRANCH_CODES.size(); i++) {
            String branchCode = BRANCH_CODES.get(i);
            String branchName = BRANCH_NAMES.get(i);
            
            System.out.println("지점 계정 생성: " + branchName + " (" + branchCode + ")");
            
            // 1. 지점 관리자 계정 생성
            createBranchAdminAccount(branchCode, branchName);
            
            // 2. 테스트 상담사 계정 생성
            createTestConsultantAccount(branchCode, branchName);
            
            // 3. 테스트 내담자 계정 생성
            createTestClientAccount(branchCode, branchName);
        }
        
        System.out.println("지점별 계정 생성 완료!");
    }

    /**
     * 지점 관리자 계정 생성
     */
    private void createBranchAdminAccount(String branchCode, String branchName) {
        String email = branchCode.toLowerCase() + "_admin@mindgarden.com";
        String username = branchCode.toLowerCase() + "_admin";
        String name = branchName + " 관리자";
        
        // 기존 계정 확인
        if (userRepository.findByEmail(email).isPresent()) {
            System.out.println("  - 지점 관리자 계정 이미 존재: " + email);
            return;
        }
        
        User admin = new User();
        admin.setEmail(email);
        admin.setUsername(username);
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setName(name);
        admin.setRole(UserRole.BRANCH_SUPER_ADMIN);
        admin.setPhone("010-1234-5678");
        admin.setBranchCode(branchCode);
        admin.setActive(true);
        admin.setIsEmailVerified(true);
        admin.setCreatedAt(LocalDateTime.now());
        admin.setUpdatedAt(LocalDateTime.now());
        admin.setIsDeleted(false);
        admin.setVersion(0L);
        
        userRepository.save(admin);
        System.out.println("  ✓ 지점 관리자 계정 생성: " + email);
    }

    /**
     * 테스트 상담사 계정 생성
     */
    private void createTestConsultantAccount(String branchCode, String branchName) {
        String email = "consultant_" + branchCode.toLowerCase() + "@mindgarden.com";
        String username = "consultant_" + branchCode.toLowerCase();
        String name = branchName + " 테스트상담사";
        
        // 기존 계정 확인
        if (userRepository.findByEmail(email).isPresent()) {
            System.out.println("  - 테스트 상담사 계정 이미 존재: " + email);
            return;
        }
        
        // 사용자 계정 생성
        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode("consultant123"));
        user.setName(name);
        user.setRole(UserRole.CONSULTANT);
        user.setPhone("010-2345-6789");
        user.setBranchCode(branchCode);
        user.setActive(true);
        user.setIsEmailVerified(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setIsDeleted(false);
        user.setVersion(0L);
        
        User savedUser = userRepository.save(user);
        
        // 상담사 상세 정보 생성
        Consultant consultant = new Consultant();
        consultant.setId(savedUser.getId());
        consultant.setGrade("SENIOR");
        consultant.setSpecialty("개인상담");
        consultant.setYearsOfExperience(5);
        consultant.setIsAvailable(true);
        consultant.setMaxClients(20);
        consultant.setSessionDuration(60);
        consultant.setBreakTime("15분");
        consultant.setConsultationHours("09:00-18:00");
        consultant.setCreatedAt(LocalDateTime.now());
        consultant.setUpdatedAt(LocalDateTime.now());
        consultant.setIsDeleted(false);
        consultant.setVersion(0L);
        
        consultantRepository.save(consultant);
        System.out.println("  ✓ 테스트 상담사 계정 생성: " + email);
    }

    /**
     * 테스트 내담자 계정 생성
     */
    private void createTestClientAccount(String branchCode, String branchName) {
        String email = "client_" + branchCode.toLowerCase() + "@mindgarden.com";
        String username = "client_" + branchCode.toLowerCase();
        String name = branchName + " 테스트내담자";
        
        // 기존 계정 확인
        if (userRepository.findByEmail(email).isPresent()) {
            System.out.println("  - 테스트 내담자 계정 이미 존재: " + email);
            return;
        }
        
        // 사용자 계정 생성
        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode("client123"));
        user.setName(name);
        user.setRole(UserRole.CLIENT);
        user.setPhone("010-3456-7890");
        user.setBranchCode(branchCode);
        user.setActive(true);
        user.setIsEmailVerified(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setIsDeleted(false);
        user.setVersion(0L);
        
        User savedUser = userRepository.save(user);
        
        // 내담자 상세 정보 생성
        Client client = new Client();
        client.setId(savedUser.getId());
        client.setName(name);
        client.setEmail(email);
        client.setPhone("010-3456-7890");
        
        clientRepository.save(client);
        System.out.println("  ✓ 테스트 내담자 계정 생성: " + email);
    }

    /**
     * 특정 지점의 계정만 생성
     */
    @Transactional
    public void createBranchAccount(String branchCode) {
        int index = BRANCH_CODES.indexOf(branchCode);
        if (index == -1) {
            System.out.println("지원하지 않는 지점 코드: " + branchCode);
            return;
        }
        
        String branchName = BRANCH_NAMES.get(index);
        System.out.println("지점 계정 생성: " + branchName + " (" + branchCode + ")");
        
        createBranchAdminAccount(branchCode, branchName);
        createTestConsultantAccount(branchCode, branchName);
        createTestClientAccount(branchCode, branchName);
    }
}
