package com.mindgarden.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import com.mindgarden.consultation.constant.AdminConstants;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.dto.ClientRegistrationDto;
import com.mindgarden.consultation.dto.ConsultantClientMappingDto;
import com.mindgarden.consultation.dto.ConsultantRegistrationDto;
import com.mindgarden.consultation.dto.ConsultantTransferRequest;
import com.mindgarden.consultation.entity.Branch;
import com.mindgarden.consultation.entity.Client;
import com.mindgarden.consultation.entity.Consultant;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.Schedule;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.ConsultantClientMappingRepository;
import com.mindgarden.consultation.repository.ScheduleRepository;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.AdminService;
import com.mindgarden.consultation.service.BranchService;
import com.mindgarden.consultation.service.ConsultantAvailabilityService;
import com.mindgarden.consultation.service.ConsultationMessageService;
import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final ScheduleRepository scheduleRepository;
    private final PasswordEncoder passwordEncoder;
    private final PersonalDataEncryptionUtil encryptionUtil;
    private final ConsultantAvailabilityService consultantAvailabilityService;
    private final ConsultationMessageService consultationMessageService;
    private final BranchService branchService;

    @Override
    public User registerConsultant(ConsultantRegistrationDto dto) {
        // 전화번호 암호화
        String encryptedPhone = null;
        if (dto.getPhone() != null && !dto.getPhone().trim().isEmpty()) {
            encryptedPhone = encryptionUtil.encrypt(dto.getPhone());
            log.info("🔐 관리자 상담사 등록 시 전화번호 암호화 완료: {}", maskPhone(dto.getPhone()));
        }
        
        // 지점코드 처리
        Branch branch = null;
        if (dto.getBranchCode() != null && !dto.getBranchCode().trim().isEmpty()) {
            try {
                branch = branchService.getBranchByCode(dto.getBranchCode());
                log.info("🔐 관리자 상담사 등록 시 지점 할당: branchCode={}, branchName={}", 
                    dto.getBranchCode(), branch.getBranchName());
            } catch (Exception e) {
                log.error("❌ 지점 코드 처리 중 오류: branchCode={}, error={}", dto.getBranchCode(), e.getMessage());
                throw new IllegalArgumentException("존재하지 않는 지점 코드입니다: " + dto.getBranchCode());
            }
        }
        
        // 같은 username을 가진 삭제된 상담사가 있는지 확인
        Optional<User> existingConsultant = userRepository.findByUsernameAndIsActive(dto.getUsername(), false);
        
        if (existingConsultant.isPresent()) {
            // 삭제된 상담사가 있으면 기존 데이터를 업데이트
            User consultant = existingConsultant.get();
            consultant.setEmail(dto.getEmail());
            consultant.setPassword(passwordEncoder.encode(dto.getPassword()));
            consultant.setName(dto.getName());
            consultant.setPhone(encryptedPhone);
            consultant.setIsActive(true); // 활성화
            consultant.setSpecialization(dto.getSpecialization());
            consultant.setBranch(branch); // 지점 할당
            consultant.setBranchCode(dto.getBranchCode()); // 지점코드 저장
            
            // Consultant로 캐스팅하여 certification 설정
            if (consultant instanceof Consultant) {
                ((Consultant) consultant).setCertification(dto.getQualifications());
            }
            
            return userRepository.save(consultant);
        } else {
            // 새로운 상담사 생성
            Consultant consultant = new Consultant();
            consultant.setUsername(dto.getUsername());
            consultant.setEmail(dto.getEmail());
            consultant.setPassword(passwordEncoder.encode(dto.getPassword()));
            consultant.setName(dto.getName());
            consultant.setPhone(encryptedPhone);
            consultant.setRole(UserRole.CONSULTANT);
            consultant.setIsActive(true);
            consultant.setBranch(branch); // 지점 할당
            consultant.setBranchCode(dto.getBranchCode()); // 지점코드 저장
            
            // 상담사 전용 정보 설정
            consultant.setSpecialty(dto.getSpecialization());
            consultant.setCertification(dto.getQualifications());
            
            return userRepository.save(consultant);
        }
    }

    @Override
    public Client registerClient(ClientRegistrationDto dto) {
        // 전화번호 암호화
        String encryptedPhone = null;
        if (dto.getPhone() != null && !dto.getPhone().trim().isEmpty()) {
            encryptedPhone = encryptionUtil.encrypt(dto.getPhone());
            log.info("🔐 관리자 내담자 등록 시 전화번호 암호화 완료: {}", maskPhone(dto.getPhone()));
        }
        
        // 지점코드 처리
        Branch branch = null;
        if (dto.getBranchCode() != null && !dto.getBranchCode().trim().isEmpty()) {
            try {
                branch = branchService.getBranchByCode(dto.getBranchCode());
                log.info("🔐 관리자 내담자 등록 시 지점 할당: branchCode={}, branchName={}", 
                    dto.getBranchCode(), branch.getBranchName());
            } catch (Exception e) {
                log.error("❌ 지점 코드 처리 중 오류: branchCode={}, error={}", dto.getBranchCode(), e.getMessage());
                throw new IllegalArgumentException("존재하지 않는 지점 코드입니다: " + dto.getBranchCode());
            }
        }
        
        // User 테이블에 CLIENT role로 저장
        User clientUser = User.builder()
                .username(dto.getUsername())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .name(dto.getName())
                .phone(encryptedPhone)
                .role(UserRole.CLIENT)
                .isActive(true)
                .branch(branch) // 지점 할당
                .branchCode(dto.getBranchCode()) // 지점코드 저장
                .build();
        
        User savedUser = userRepository.save(clientUser);
        
        // Client 객체로 변환하여 반환
        Client client = new Client();
        client.setId(savedUser.getId());
        client.setName(savedUser.getName());
        client.setEmail(savedUser.getEmail());
        client.setPhone(savedUser.getPhone());
        client.setBirthDate(savedUser.getBirthDate());
        client.setGender(savedUser.getGender());
        client.setIsDeleted(!savedUser.getIsActive());
        client.setCreatedAt(savedUser.getCreatedAt());
        client.setUpdatedAt(savedUser.getUpdatedAt());
        client.setBranchCode(dto.getBranchCode()); // 지점코드 저장
        
        return client;
    }

    @Override
    public ConsultantClientMapping createMapping(ConsultantClientMappingDto dto) {
        User consultant = userRepository.findById(dto.getConsultantId())
                .orElseThrow(() -> new RuntimeException("Consultant not found"));
        
        // Client는 User를 상속받으므로 userRepository로 조회
        User clientUser = userRepository.findById(dto.getClientId())
                .orElseThrow(() -> new RuntimeException("Client not found"));

        // 매핑 객체를 직접 생성하여 저장
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setConsultant(consultant);
        mapping.setClient(clientUser); // User 객체를 직접 사용
        mapping.setStartDate(dto.getStartDate() != null ? 
            dto.getStartDate().atStartOfDay() : 
            LocalDateTime.now());
        mapping.setStatus(dto.getStatus() != null ? 
            ConsultantClientMapping.MappingStatus.valueOf(dto.getStatus()) : 
            ConsultantClientMapping.MappingStatus.ACTIVE);
        mapping.setPaymentStatus(dto.getPaymentStatus() != null ? 
            ConsultantClientMapping.PaymentStatus.valueOf(dto.getPaymentStatus()) : 
            ConsultantClientMapping.PaymentStatus.PENDING);
        mapping.setTotalSessions(dto.getTotalSessions() != null ? dto.getTotalSessions() : 10);
        mapping.setRemainingSessions(dto.getRemainingSessions() != null ? dto.getRemainingSessions() : (dto.getTotalSessions() != null ? dto.getTotalSessions() : 10));
        mapping.setUsedSessions(0);
        mapping.setPackageName(dto.getPackageName() != null ? dto.getPackageName() : "기본 패키지");
        mapping.setPackagePrice(dto.getPackagePrice() != null ? dto.getPackagePrice() : 0L);
        mapping.setPaymentMethod(dto.getPaymentMethod());
        mapping.setPaymentReference(dto.getPaymentReference());
        mapping.setPaymentAmount(dto.getPaymentAmount());
        mapping.setAssignedAt(LocalDateTime.now());
        mapping.setNotes(dto.getNotes());
        mapping.setResponsibility(dto.getResponsibility());
        mapping.setSpecialConsiderations(dto.getSpecialConsiderations());
        
        // 지점코드 설정 (상담사의 지점코드 우선, 없으면 내담자의 지점코드 사용)
        String branchCode = consultant.getBranchCode();
        if (branchCode == null || branchCode.trim().isEmpty()) {
            branchCode = clientUser.getBranchCode();
        }
        if (branchCode == null || branchCode.trim().isEmpty()) {
            branchCode = AdminConstants.DEFAULT_BRANCH_CODE; // 기본값
        }
        mapping.setBranchCode(branchCode);
        log.info("🔧 매핑 지점코드 설정: {}", branchCode);

        return mappingRepository.save(mapping);
    }

    /**
     * 입금 확인 처리
     */
    @Override
    public ConsultantClientMapping confirmPayment(Long mappingId, String paymentMethod, String paymentReference, Long paymentAmount) {
        ConsultantClientMapping mapping = mappingRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));
        
        mapping.confirmPayment(paymentMethod, paymentReference);
        mapping.setPaymentAmount(paymentAmount);
        
        return mappingRepository.save(mapping);
    }

    /**
     * 입금 확인 처리 (간단 버전)
     */
    @Override
    public ConsultantClientMapping confirmPayment(Long mappingId, String paymentMethod, String paymentReference) {
        ConsultantClientMapping mapping = mappingRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));
        
        mapping.confirmPayment(paymentMethod, paymentReference);
        
        return mappingRepository.save(mapping);
    }

    /**
     * 관리자 승인
     */
    @Override
    public ConsultantClientMapping approveMapping(Long mappingId, String adminName) {
        ConsultantClientMapping mapping = mappingRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));
        
        mapping.approveByAdmin(adminName);
        
        return mappingRepository.save(mapping);
    }

    /**
     * 관리자 거부
     */
    @Override
    public ConsultantClientMapping rejectMapping(Long mappingId, String reason) {
        ConsultantClientMapping mapping = mappingRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));
        
        mapping.setStatus(ConsultantClientMapping.MappingStatus.TERMINATED);
        mapping.setNotes(reason);
        mapping.setTerminatedAt(LocalDateTime.now());
        
        return mappingRepository.save(mapping);
    }

    /**
     * 회기 사용 처리
     */
    @Override
    public ConsultantClientMapping useSession(Long mappingId) {
        ConsultantClientMapping mapping = mappingRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));
        
        mapping.useSession();
        
        return mappingRepository.save(mapping);
    }

    /**
     * 회기 추가 (연장)
     */
    @Override
    public ConsultantClientMapping extendSessions(Long mappingId, Integer additionalSessions, String packageName, Long packagePrice) {
        ConsultantClientMapping mapping = mappingRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));
        
        mapping.addSessions(additionalSessions, packageName, packagePrice);
        
        return mappingRepository.save(mapping);
    }

    /**
     * 입금 대기 중인 매핑 목록 조회
     */
    @Override
    public List<ConsultantClientMapping> getPendingPaymentMappings() {
        return mappingRepository.findByStatus(ConsultantClientMapping.MappingStatus.PENDING_PAYMENT);
    }

    /**
     * 입금 확인된 매핑 목록 조회
     */
    @Override
    public List<ConsultantClientMapping> getPaymentConfirmedMappings() {
        return mappingRepository.findByStatus(ConsultantClientMapping.MappingStatus.PAYMENT_CONFIRMED);
    }

    /**
     * 활성 매핑 목록 조회 (승인 완료)
     */
    @Override
    public List<ConsultantClientMapping> getActiveMappings() {
        return mappingRepository.findActiveMappingsWithDetails();
    }

    /**
     * 회기 소진된 매핑 목록 조회
     */
    @Override
    public List<ConsultantClientMapping> getSessionsExhaustedMappings() {
        return mappingRepository.findByStatus(ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED);
    }

    @Override
    public List<User> getAllConsultants() {
        List<User> consultants = userRepository.findByRole(UserRole.CONSULTANT);
        
        // 각 상담사의 전화번호 복호화
        consultants.forEach(consultant -> {
            if (consultant.getPhone() != null && !consultant.getPhone().trim().isEmpty()) {
                try {
                    String decryptedPhone = encryptionUtil.decrypt(consultant.getPhone());
                    consultant.setPhone(decryptedPhone);
                    log.info("🔓 상담사 전화번호 복호화 완료: {}", maskPhone(decryptedPhone));
                } catch (Exception e) {
                    log.error("❌ 상담사 전화번호 복호화 실패: {}", e.getMessage());
                    consultant.setPhone("복호화 실패");
                }
            }
        });
        
        return consultants;
    }
    
    @Override
    public List<Map<String, Object>> getAllConsultantsWithSpecialty() {
        List<User> consultants = userRepository.findByRole(UserRole.CONSULTANT);
        
        return consultants.stream()
            .map(consultant -> {
                Map<String, Object> consultantData = new HashMap<>();
                consultantData.put("id", consultant.getId());
                consultantData.put("name", consultant.getName());
                consultantData.put("email", consultant.getEmail());
                
                // 전화번호 복호화
                String decryptedPhone = null;
                if (consultant.getPhone() != null && !consultant.getPhone().trim().isEmpty()) {
                    try {
                        decryptedPhone = encryptionUtil.decrypt(consultant.getPhone());
                        log.info("🔓 상담사 전화번호 복호화 완료: {}", maskPhone(decryptedPhone));
                    } catch (Exception e) {
                        log.error("❌ 상담사 전화번호 복호화 실패: {}", e.getMessage());
                        decryptedPhone = "복호화 실패";
                    }
                }
                consultantData.put("phone", decryptedPhone);
                
                consultantData.put("role", consultant.getRole());
                consultantData.put("isActive", consultant.getIsActive());
                consultantData.put("branchCode", consultant.getBranchCode());
                consultantData.put("createdAt", consultant.getCreatedAt());
                consultantData.put("updatedAt", consultant.getUpdatedAt());
                
                // 전문분야 정보 처리
                String specialization = consultant.getSpecialization();
                if (specialization != null && !specialization.trim().isEmpty()) {
                    consultantData.put("specialization", specialization);
                    consultantData.put("specializationDetails", getSpecializationDetailsFromDB(specialization));
                } else {
                    consultantData.put("specialization", null);
                    consultantData.put("specializationDetails", new ArrayList<>());
                }
                
                return consultantData;
            })
            .collect(Collectors.toList());
    }
    
    /**
     * 휴무 정보를 포함한 상담사 목록 조회 (관리자 스케줄링용)
     */
    @Override
    public List<Map<String, Object>> getAllConsultantsWithVacationInfo(String date) {
        log.info("휴무 정보를 포함한 상담사 목록 조회: date={}", date);
        
        List<User> consultants = userRepository.findByRole(UserRole.CONSULTANT);
        
        // 모든 상담사의 휴무 정보 조회
        Map<String, Object> allVacations = consultantAvailabilityService.getAllConsultantsVacations(date);
        
        return consultants.stream()
            .map(consultant -> {
                Map<String, Object> consultantData = new HashMap<>();
                consultantData.put("id", consultant.getId());
                consultantData.put("name", consultant.getName());
                consultantData.put("email", consultant.getEmail());
                
                // 전화번호 복호화
                String decryptedPhone = null;
                if (consultant.getPhone() != null && !consultant.getPhone().trim().isEmpty()) {
                    try {
                        decryptedPhone = encryptionUtil.decrypt(consultant.getPhone());
                    } catch (Exception e) {
                        log.error("❌ 상담사 전화번호 복호화 실패: {}", e.getMessage());
                        decryptedPhone = "복호화 실패";
                    }
                }
                consultantData.put("phone", decryptedPhone);
                
                consultantData.put("role", consultant.getRole());
                consultantData.put("isActive", consultant.getIsActive());
                consultantData.put("createdAt", consultant.getCreatedAt());
                consultantData.put("updatedAt", consultant.getUpdatedAt());
                
                // 전문분야 정보 처리
                String specialization = consultant.getSpecialization();
                if (specialization != null && !specialization.trim().isEmpty()) {
                    consultantData.put("specialization", specialization);
                    consultantData.put("specializationDetails", getSpecializationDetailsFromDB(specialization));
                } else {
                    consultantData.put("specialization", null);
                    consultantData.put("specializationDetails", new ArrayList<>());
                }
                
                // 휴무 정보 추가
                String consultantId = consultant.getId().toString();
                @SuppressWarnings("unchecked")
                Map<String, Object> consultantVacations = (Map<String, Object>) allVacations.get(consultantId);
                
                if (consultantVacations != null && consultantVacations.containsKey(date)) {
                    // 해당 날짜에 휴가가 있는 경우
                    @SuppressWarnings("unchecked")
                    Map<String, Object> vacationInfo = (Map<String, Object>) consultantVacations.get(date);
                    consultantData.put("isOnVacation", true);
                    consultantData.put("vacationType", vacationInfo.get("type"));
                    consultantData.put("vacationReason", vacationInfo.get("reason"));
                    consultantData.put("vacationStartTime", vacationInfo.get("startTime"));
                    consultantData.put("vacationEndTime", vacationInfo.get("endTime"));
                    
                    // 휴무 상태 구분
                    consultantData.put("busy", true); // 휴가 중이므로 바쁨
                    consultantData.put("isVacation", true); // 휴가 상태임을 명시
                } else {
                    // 해당 날짜에 휴가가 없는 경우
                    consultantData.put("isOnVacation", false);
                    consultantData.put("vacationType", null);
                    consultantData.put("vacationReason", null);
                    consultantData.put("vacationStartTime", null);
                    consultantData.put("vacationEndTime", null);
                    
                    // 일반 상태 (스케줄에 따라 바쁨 여부 결정)
                    consultantData.put("busy", false); // 기본적으로 여유
                    consultantData.put("isVacation", false); // 휴가 아님
                }
                
                return consultantData;
            })
            .collect(Collectors.toList());
    }
    
    /**
     * 데이터베이스에서 전문분야 상세 정보 조회
     */
    private List<Map<String, String>> getSpecializationDetailsFromDB(String specialization) {
        if (specialization == null || specialization.trim().isEmpty()) {
            return new ArrayList<>();
        }
        
        // 전문분야 코드들을 배열로 분리
        String[] codes = specialization.split(",");
        List<Map<String, String>> details = new ArrayList<>();
        
        for (String code : codes) {
            code = code.trim();
            if (!code.isEmpty()) {
                // 실제로는 CodeValueRepository를 사용해서 조회해야 함
                // 여기서는 임시로 하드코딩된 매핑 사용
                Map<String, String> detail = new HashMap<>();
                detail.put("code", code);
                detail.put("name", getSpecialtyNameByCode(code));
                details.add(detail);
            }
        }
        
        return details;
    }
    
    /**
     * 코드로 전문분야 이름 조회 (한글 통일)
     */
    private String getSpecialtyNameByCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            return "미설정";
        }
        
        // 이미 한글로 된 경우 그대로 반환
        if (code.matches(".*[가-힣].*")) {
            return code;
        }
        
        Map<String, String> specialtyMap = new HashMap<>();
        specialtyMap.put("DEPRESSION", "우울증");
        specialtyMap.put("ANXIETY", "불안장애");
        specialtyMap.put("TRAUMA", "트라우마");
        specialtyMap.put("STRESS", "스트레스");
        specialtyMap.put("RELATIONSHIP", "관계상담");
        specialtyMap.put("FAMILY", "가족상담");
        specialtyMap.put("COUPLE", "부부상담");
        specialtyMap.put("CHILD", "아동상담");
        specialtyMap.put("TEEN", "청소년상담");
        specialtyMap.put("ADDICTION", "중독");
        specialtyMap.put("EATING", "섭식장애");
        specialtyMap.put("SLEEP", "수면장애");
        specialtyMap.put("ANGER", "분노조절");
        specialtyMap.put("GRIEF", "상실");
        specialtyMap.put("SELF_ESTEEM", "자존감");
        specialtyMap.put("FAMIL", "가족상담"); // FAMILY의 축약형 처리
        
        return specialtyMap.getOrDefault(code, code);
    }
    
    /**
     * 사용자 개인정보 복호화
     */
    private User decryptUserPersonalData(User user) {
        if (user == null || encryptionUtil == null) {
            return user;
        }
        
        try {
            // 이름 복호화 (암호화된 데이터인지 확인)
            if (user.getName() != null && !user.getName().trim().isEmpty()) {
                if (isEncryptedData(user.getName())) {
                    user.setName(encryptionUtil.decrypt(user.getName()));
                }
                // 암호화되지 않은 데이터는 그대로 유지
            }
            
            // 닉네임 복호화
            if (user.getNickname() != null && !user.getNickname().trim().isEmpty()) {
                if (isEncryptedData(user.getNickname())) {
                    user.setNickname(encryptionUtil.decrypt(user.getNickname()));
                }
            }
            
            // 전화번호 복호화
            if (user.getPhone() != null && !user.getPhone().trim().isEmpty()) {
                if (isEncryptedData(user.getPhone())) {
                    user.setPhone(encryptionUtil.decrypt(user.getPhone()));
                }
            }
            
            // 성별 복호화
            if (user.getGender() != null && !user.getGender().trim().isEmpty()) {
                if (isEncryptedData(user.getGender())) {
                    user.setGender(encryptionUtil.decrypt(user.getGender()));
                }
            }
            
        } catch (Exception e) {
            // 복호화 실패 시 원본 데이터 유지
            log.warn("사용자 개인정보 복호화 실패: {}", e.getMessage());
        }
        
        return user;
    }
    
    /**
     * 데이터가 암호화된 데이터인지 확인
     * Base64 패턴과 길이로 판단
     */
    private boolean isEncryptedData(String data) {
        if (data == null || data.trim().isEmpty()) {
            return false;
        }
        
        // Base64 패턴 확인 (A-Z, a-z, 0-9, +, /, =)
        if (!data.matches("^[A-Za-z0-9+/]*={0,2}$")) {
            return false;
        }
        
        // 암호화된 데이터는 일반적으로 20자 이상
        if (data.length() < 20) {
            return false;
        }
        
        // 한글이나 특수문자가 포함된 경우 평문으로 판단
        if (data.matches(".*[가-힣].*") || data.matches(".*[^A-Za-z0-9+/=].*")) {
            return false;
        }
        
        return true;
    }

    @Override
    public List<Client> getAllClients() {
        // User 테이블에서 CLIENT role 사용자들을 조회하고 Client 정보와 조인
        List<User> clientUsers = userRepository.findByRole(UserRole.CLIENT);
        
        log.info("🔍 내담자 조회 - 총 {}명", clientUsers.size());
        
        // 각 내담자 정보를 상세히 로깅
        for (User user : clientUsers) {
            log.info("👤 내담자 원본 데이터 - ID: {}, 이름: '{}', 이메일: '{}', 전화번호: '{}', 활성상태: {}, 삭제상태: {}, 역할: {}", 
                user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getIsActive(), user.getIsDeleted(), user.getRole());
        }
        
        // 삭제된 사용자도 포함해서 전체 조회해보기
        List<User> allUsers = userRepository.findAll();
        List<User> allClientUsers = allUsers.stream()
            .filter(user -> user.getRole() == UserRole.CLIENT)
            .collect(Collectors.toList());
        
        log.info("🔍 전체 사용자 중 CLIENT 역할 - 총 {}명 (삭제 포함)", allClientUsers.size());
        for (User user : allClientUsers) {
            log.info("👤 전체 내담자 - ID: {}, 이름: '{}', 이메일: '{}', 전화번호: '{}', 활성상태: {}, 삭제상태: {}", 
                user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getIsActive(), user.getIsDeleted());
        }
        
        return clientUsers.stream()
            .map(user -> {
                // User 정보를 Client로 매핑 (이미 복호화된 데이터 사용)
                Client client = new Client();
                client.setId(user.getId());
                client.setName(user.getName());
                client.setEmail(user.getEmail());
                
                // 전화번호 처리 - null이거나 빈 문자열인 경우 기본값 설정
                String phone = user.getPhone();
                if (phone == null || phone.trim().isEmpty()) {
                    phone = "전화번호 없음";
                }
                client.setPhone(phone);
                
                client.setBirthDate(user.getBirthDate());
                client.setGender(user.getGender());
                client.setBranchCode(user.getBranchCode()); // 지점코드 설정
                client.setIsDeleted(user.getIsDeleted()); // isDeleted 필드 직접 사용
                client.setCreatedAt(user.getCreatedAt());
                client.setUpdatedAt(user.getUpdatedAt());
                
                // 디버깅을 위한 로깅
                log.info("👤 내담자 최종 데이터 - ID: {}, 이름: '{}', 이메일: '{}', 전화번호: '{}', 삭제상태: {}", 
                    user.getId(), user.getName(), user.getEmail(), phone, user.getIsDeleted());
                
                return client;
            })
            .collect(Collectors.toList());
    }

    @Override
    public List<Map<String, Object>> getAllClientsWithMappingInfo() {
        try {
            log.info("🔍 통합 내담자 데이터 조회 시작");
            
            // 모든 내담자 조회
            List<User> clientUsers = userRepository.findByRole(UserRole.CLIENT);
            log.info("🔍 내담자 수: {}", clientUsers.size());
            
            // 모든 매핑 조회
            List<ConsultantClientMapping> allMappings = mappingRepository.findAllWithDetails();
            log.info("🔍 매핑 수: {}", allMappings.size());
            
            List<Map<String, Object>> result = new ArrayList<>();
            
            for (User user : clientUsers) {
                Map<String, Object> clientData = new HashMap<>();
                
                // 기본 내담자 정보
                clientData.put("id", user.getId());
                clientData.put("name", user.getName());
                clientData.put("email", user.getEmail() != null ? user.getEmail() : "");
                clientData.put("phone", user.getPhone() != null ? user.getPhone() : "");
                clientData.put("birthDate", user.getBirthDate());
                clientData.put("gender", user.getGender());
                clientData.put("isActive", user.getIsActive());
                clientData.put("isDeleted", user.getIsDeleted());
                clientData.put("createdAt", user.getCreatedAt());
                clientData.put("updatedAt", user.getUpdatedAt());
                clientData.put("branchCode", user.getBranchCode()); // 브랜치 코드 추가
                
                // 해당 내담자의 매핑 정보들
                List<Map<String, Object>> mappings = allMappings.stream()
                    .filter(mapping -> mapping.getClient() != null && mapping.getClient().getId().equals(user.getId()))
                    .map(mapping -> {
                        Map<String, Object> mappingData = new HashMap<>();
                        mappingData.put("mappingId", mapping.getId());
                        mappingData.put("consultantId", mapping.getConsultant() != null ? mapping.getConsultant().getId() : null);
                        mappingData.put("consultantName", mapping.getConsultant() != null ? mapping.getConsultant().getName() : "");
                        mappingData.put("packageName", mapping.getPackageName());
                        mappingData.put("totalSessions", mapping.getTotalSessions());
                        mappingData.put("remainingSessions", mapping.getRemainingSessions());
                        mappingData.put("usedSessions", mapping.getUsedSessions());
                        mappingData.put("paymentStatus", mapping.getPaymentStatus() != null ? mapping.getPaymentStatus().toString() : "");
                        mappingData.put("status", mapping.getStatus() != null ? mapping.getStatus().toString() : "");
                        mappingData.put("packagePrice", mapping.getPackagePrice());
                        mappingData.put("createdAt", mapping.getCreatedAt());
                        mappingData.put("updatedAt", mapping.getUpdatedAt());
                        mappingData.put("terminatedAt", mapping.getTerminatedAt());
                        mappingData.put("notes", mapping.getNotes());
                        return mappingData;
                    })
                    .collect(Collectors.toList());
                
                clientData.put("mappings", mappings);
                clientData.put("mappingCount", mappings.size());
                
                // 활성 매핑 수 (승인된 매핑)
                long activeMappingCount = mappings.stream()
                    .filter(mapping -> "APPROVED".equals(mapping.get("status")))
                    .count();
                clientData.put("activeMappingCount", activeMappingCount);
                
                // 총 남은 세션 수
                int totalRemainingSessions = mappings.stream()
                    .filter(mapping -> "APPROVED".equals(mapping.get("status")))
                    .mapToInt(mapping -> (Integer) mapping.get("remainingSessions"))
                    .sum();
                clientData.put("totalRemainingSessions", totalRemainingSessions);
                
                // 결제 상태별 매핑 수
                Map<String, Long> paymentStatusCount = mappings.stream()
                    .collect(Collectors.groupingBy(
                        mapping -> (String) mapping.get("paymentStatus"),
                        Collectors.counting()
                    ));
                clientData.put("paymentStatusCount", paymentStatusCount);
                
                result.add(clientData);
            }
            
            log.info("🔍 통합 내담자 데이터 조회 완료 - 총 {}명", result.size());
            return result;
            
        } catch (Exception e) {
            log.error("❌ 통합 내담자 데이터 조회 실패", e);
            throw new RuntimeException("통합 내담자 데이터 조회에 실패했습니다: " + e.getMessage(), e);
        }
    }

    @Override
    public List<ConsultantClientMapping> getAllMappings() {
        try {
            return mappingRepository.findAllWithDetails();
        } catch (Exception e) {
            // enum 변환 오류 등으로 인해 조회 실패시 빈 목록 반환
            System.err.println("매핑 목록 조회 실패 (빈 목록 반환): " + e.getMessage());
            return new java.util.ArrayList<>();
        }
    }

    @Override
    public User updateConsultant(Long id, ConsultantRegistrationDto dto) {
        User consultant = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Consultant not found"));
        
        consultant.setName(dto.getName());
        consultant.setEmail(dto.getEmail());
        consultant.setPhone(dto.getPhone());
        
        // 전문분야 필드 처리 추가
        if (dto.getSpecialization() != null) {
            consultant.setSpecialization(dto.getSpecialization());
        }
        
        // 비밀번호 변경 처리 추가
        if (dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            log.info("🔧 상담사 비밀번호 변경: ID={}", id);
            consultant.setPassword(passwordEncoder.encode(dto.getPassword()));
            consultant.setUpdatedAt(LocalDateTime.now());
            consultant.setVersion(consultant.getVersion() + 1);
        }
        
        return userRepository.save(consultant);
    }

    @Override
    public User updateConsultantGrade(Long id, String grade) {
        User consultant = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Consultant not found"));
        
        consultant.setGrade(grade);
        consultant.setLastGradeUpdate(LocalDateTime.now());
        consultant.setUpdatedAt(LocalDateTime.now());
        
        log.info("🔧 상담사 등급 업데이트: ID={}, 등급={}", id, grade);
        return userRepository.save(consultant);
    }

    @Override
    public Client updateClient(Long id, ClientRegistrationDto dto) {
        User clientUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));
        
        clientUser.setName(dto.getName());
        clientUser.setEmail(dto.getEmail());
        clientUser.setPhone(dto.getPhone());
        
        User savedUser = userRepository.save(clientUser);
        
        // Client 객체로 변환하여 반환
        Client client = new Client();
        client.setId(savedUser.getId());
        client.setName(savedUser.getName());
        client.setEmail(savedUser.getEmail());
        client.setPhone(savedUser.getPhone());
        client.setBirthDate(savedUser.getBirthDate());
        client.setGender(savedUser.getGender());
        client.setIsDeleted(!savedUser.getIsActive());
        client.setCreatedAt(savedUser.getCreatedAt());
        client.setUpdatedAt(savedUser.getUpdatedAt());
        
        return client;
    }

    @Override
    public ConsultantClientMapping updateMapping(Long id, ConsultantClientMappingDto dto) {
        ConsultantClientMapping mapping = mappingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));
        
        // 상태 업데이트
        if (dto.getStatus() != null) {
            mapping.setStatus(ConsultantClientMapping.MappingStatus.valueOf(dto.getStatus()));
        }
        
        // 기타 필드들도 업데이트 가능하도록 추가
        if (dto.getTotalSessions() != null) {
            mapping.setTotalSessions(dto.getTotalSessions());
        }
        if (dto.getRemainingSessions() != null) {
            mapping.setRemainingSessions(dto.getRemainingSessions());
        }
        if (dto.getPaymentStatus() != null) {
            mapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.valueOf(dto.getPaymentStatus()));
        }
        
        return mappingRepository.save(mapping);
    }

    @Override
    public void deleteConsultant(Long id) {
        User consultant = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Consultant not found"));
        consultant.setIsActive(false);
        userRepository.save(consultant);
    }

    @Override
    public void deleteClient(Long id) {
        User clientUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));
        clientUser.setIsActive(false);
        userRepository.save(clientUser);
    }

    @Override
    public void deleteMapping(Long id) {
        ConsultantClientMapping mapping = mappingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));
        mapping.setStatus(ConsultantClientMapping.MappingStatus.TERMINATED);
        mapping.setTerminatedAt(LocalDateTime.now());
        mappingRepository.save(mapping);
    }

    @Override
    public List<ConsultantClientMapping> getMappingsByConsultantId(Long consultantId) {
        List<ConsultantClientMapping> mappings = mappingRepository.findByConsultantIdAndStatusNot(consultantId, ConsultantClientMapping.MappingStatus.TERMINATED);
        
        // 매핑된 사용자 정보 복호화
        for (ConsultantClientMapping mapping : mappings) {
            if (mapping.getConsultant() != null) {
                decryptUserPersonalData(mapping.getConsultant());
            }
            if (mapping.getClient() != null) {
                decryptUserPersonalData(mapping.getClient());
            }
        }
        
        return mappings;
    }

    @Override
    public List<ConsultantClientMapping> getMappingsByConsultantId(Long consultantId, String branchCode) {
        log.info("🔍 상담사별 매핑 조회 - 상담사 ID: {}, 브랜치 코드: {}", consultantId, branchCode);
        
        // 브랜치 코드로 필터링된 매핑 조회
        List<ConsultantClientMapping> mappings = mappingRepository.findByConsultantIdAndBranchCodeAndStatusNot(
            consultantId, branchCode, ConsultantClientMapping.MappingStatus.TERMINATED);
        
        log.info("🔍 브랜치 코드 필터링된 매핑 수: {}", mappings.size());
        
        // 매핑된 사용자 정보 복호화
        for (ConsultantClientMapping mapping : mappings) {
            if (mapping.getConsultant() != null) {
                decryptUserPersonalData(mapping.getConsultant());
            }
            if (mapping.getClient() != null) {
                decryptUserPersonalData(mapping.getClient());
            }
        }
        
        return mappings;
    }

    @Override
    public List<ConsultantClientMapping> getMappingsByClient(Long clientId) {
        try {
            log.info("🔍 내담자별 매핑 조회 시작: clientId={}", clientId);
            
            // 안전한 매핑 조회
            List<ConsultantClientMapping> mappings = new ArrayList<>();
            try {
                mappings = mappingRepository.findByClientIdAndStatusNot(clientId, ConsultantClientMapping.MappingStatus.TERMINATED);
                log.info("🔍 내담자별 매핑 조회 완료: clientId={}, 매핑 수={}", clientId, mappings.size());
                
                // 매핑된 사용자 정보 복호화
                for (ConsultantClientMapping mapping : mappings) {
                    if (mapping.getConsultant() != null) {
                        decryptUserPersonalData(mapping.getConsultant());
                        log.info("🔐 상담사 정보 복호화 완료: ID={}, 이름={}", 
                            mapping.getConsultant().getId(), mapping.getConsultant().getName());
                    }
                    if (mapping.getClient() != null) {
                        decryptUserPersonalData(mapping.getClient());
                        log.info("🔐 내담자 정보 복호화 완료: ID={}, 이름={}", 
                            mapping.getClient().getId(), mapping.getClient().getName());
                    }
                }
                
            } catch (Exception e) {
                log.error("❌ 매핑 조회 중 오류: clientId={}, error={}", clientId, e.getMessage(), e);
                // 오류 시 빈 목록 반환
                mappings = new ArrayList<>();
            }
            
            return mappings;
        } catch (Exception e) {
            log.error("❌ 내담자별 매핑 조회 실패: clientId={}, error={}", clientId, e.getMessage(), e);
            // 오류 시 빈 목록 반환
            return new ArrayList<>();
        }
    }

    @Override
    public ConsultantClientMapping getMappingById(Long mappingId) {
        return mappingRepository.findById(mappingId).orElse(null);
    }

    // ==================== 상담사 변경 시스템 ====================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ConsultantClientMapping transferConsultant(ConsultantTransferRequest request) {
        log.info("상담사 변경 처리 시작: 기존 매핑 ID={}, 새 상담사 ID={}", 
                request.getCurrentMappingId(), request.getNewConsultantId());
        
        // 1. 기존 매핑 조회 및 검증
        ConsultantClientMapping currentMapping = mappingRepository.findById(request.getCurrentMappingId())
                .orElseThrow(() -> new RuntimeException("기존 매핑을 찾을 수 없습니다."));
        
        if (currentMapping.getStatus() != ConsultantClientMapping.MappingStatus.ACTIVE) {
            throw new RuntimeException("활성 상태의 매핑만 상담사를 변경할 수 있습니다.");
        }
        
        // 2. 새 상담사 조회 및 검증
        User newConsultant = userRepository.findById(request.getNewConsultantId())
                .orElseThrow(() -> new RuntimeException("새 상담사를 찾을 수 없습니다."));
        
        if (newConsultant.getRole() != UserRole.CONSULTANT) {
            throw new RuntimeException("상담사가 아닌 사용자입니다.");
        }
        
        // 3. 기존 매핑 종료 처리
        String transferReason = String.format("상담사 변경: %s -> %s. 사유: %s", 
                currentMapping.getConsultant().getName(), 
                newConsultant.getName(), 
                request.getTransferReason());
        
        currentMapping.transferToNewConsultant(transferReason, request.getTransferredBy());
        mappingRepository.save(currentMapping);
        
        // 4. 새 매핑 생성
        ConsultantClientMapping newMapping = new ConsultantClientMapping();
        newMapping.setConsultant(newConsultant);
        newMapping.setClient(currentMapping.getClient());
        newMapping.setStartDate(LocalDateTime.now());
        newMapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
        newMapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED); // 이전 매핑에서 승인된 상태 유지
        newMapping.setTotalSessions(request.getTotalSessions() != null ? 
                request.getTotalSessions() : currentMapping.getRemainingSessions());
        newMapping.setRemainingSessions(request.getRemainingSessions() != null ? 
                request.getRemainingSessions() : currentMapping.getRemainingSessions());
        newMapping.setUsedSessions(0); // 새 매핑이므로 사용된 회기수는 0
        newMapping.setPackageName(request.getPackageName() != null ? 
                request.getPackageName() : currentMapping.getPackageName());
        newMapping.setPackagePrice(request.getPackagePrice() != null ? 
                request.getPackagePrice() : currentMapping.getPackagePrice());
        newMapping.setPaymentAmount(currentMapping.getPaymentAmount());
        newMapping.setPaymentMethod(currentMapping.getPaymentMethod());
        newMapping.setPaymentReference(currentMapping.getPaymentReference());
        newMapping.setAssignedAt(LocalDateTime.now());
        newMapping.setNotes(String.format("상담사 변경으로 생성된 매핑. 기존 매핑 ID: %d", currentMapping.getId()));
        newMapping.setSpecialConsiderations(request.getSpecialConsiderations());
        
        ConsultantClientMapping savedMapping = mappingRepository.save(newMapping);
        
        log.info("상담사 변경 완료: 새 매핑 ID={}, 내담자={}, 새 상담사={}", 
                savedMapping.getId(), 
                currentMapping.getClient().getName(), 
                newConsultant.getName());
        
        return savedMapping;
    }

    @Override
    public List<ConsultantClientMapping> getTransferHistory(Long clientId) {
        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("내담자를 찾을 수 없습니다."));
        
        return mappingRepository.findByClient(client).stream()
                .filter(mapping -> mapping.getStatus() == ConsultantClientMapping.MappingStatus.TERMINATED)
                .filter(mapping -> mapping.getTerminationReason() != null && 
                        mapping.getTerminationReason().contains("상담사 변경"))
                .collect(Collectors.toList());
    }
    
    @Override
    public List<Map<String, Object>> getSchedulesByConsultantId(Long consultantId) {
        try {
            log.info("🔍 상담사별 스케줄 조회: consultantId={}", consultantId);
            
            // 상담사 존재 확인
            userRepository.findById(consultantId)
                    .orElseThrow(() -> new RuntimeException("상담사를 찾을 수 없습니다: " + consultantId));
            
            // 상담사의 스케줄 조회
            List<Schedule> schedules = scheduleRepository.findByConsultantId(consultantId);
            
            // 스케줄을 Map 형태로 변환
            List<Map<String, Object>> scheduleMaps = schedules.stream()
                    .map(schedule -> {
                        Map<String, Object> scheduleMap = new HashMap<>();
                        scheduleMap.put("id", schedule.getId());
                        scheduleMap.put("title", schedule.getTitle());
                        scheduleMap.put("date", schedule.getDate());
                        scheduleMap.put("startTime", schedule.getStartTime());
                        scheduleMap.put("endTime", schedule.getEndTime());
                        scheduleMap.put("consultationType", schedule.getConsultationType());
                        scheduleMap.put("status", schedule.getStatus());
                        scheduleMap.put("notes", schedule.getNotes());
                        
                        // 내담자 정보 추가
                        if (schedule.getClientId() != null) {
                            scheduleMap.put("clientId", schedule.getClientId());
                            // 내담자 이름은 별도로 조회해야 함
                            try {
                                User clientUser = userRepository.findById(schedule.getClientId()).orElse(null);
                                if (clientUser != null) {
                                    scheduleMap.put("clientName", clientUser.getName());
                                } else {
                                    scheduleMap.put("clientName", "미지정");
                                }
                            } catch (Exception e) {
                                log.warn("내담자 정보 조회 실패: clientId={}, error={}", schedule.getClientId(), e.getMessage());
                                scheduleMap.put("clientName", "미지정");
                            }
                        } else {
                            scheduleMap.put("clientId", null);
                            scheduleMap.put("clientName", "미지정");
                        }
                        
                        return scheduleMap;
                    })
                    .collect(Collectors.toList());
            
            log.info("✅ 상담사별 스케줄 조회 완료: {}개", scheduleMaps.size());
            return scheduleMaps;
            
        } catch (Exception e) {
            log.error("❌ 상담사별 스케줄 조회 실패: consultantId={}, error={}", consultantId, e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    @Override
    public List<Map<String, Object>> getConsultationCompletionStatistics(String period) {
        try {
            log.info("📊 상담사별 상담 완료 건수 통계 조회: period={}", period);
            
            // 모든 상담사 조회
            List<User> consultants = userRepository.findByRole(UserRole.CONSULTANT);
            
            List<Map<String, Object>> statistics = new ArrayList<>();
            
            for (User consultant : consultants) {
                try {
                    // 기간 설정
                    LocalDate startDate, endDate;
                    if (period != null && !period.isEmpty()) {
                        // 기간 파싱 (예: "2025-09")
                        String[] parts = period.split("-");
                        int year = Integer.parseInt(parts[0]);
                        int month = Integer.parseInt(parts[1]);
                        startDate = LocalDate.of(year, month, 1);
                        endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
                    } else {
                        // 전체 기간 (올해)
                        startDate = LocalDate.of(LocalDate.now().getYear(), 1, 1);
                        endDate = LocalDate.of(LocalDate.now().getYear(), 12, 31);
                    }
                    
                    // 상담 완료 건수 조회 (스케줄 기준)
                    int completedCount = getCompletedScheduleCount(consultant.getId(), startDate, endDate);
                    
                    // 총 상담 건수 조회 (스케줄 기준)
                    long totalCount = getTotalScheduleCount(consultant.getId());
                    
                    // 상담사 정보와 통계 데이터 매핑
                    Map<String, Object> consultantStats = new HashMap<>();
                    consultantStats.put("consultantId", consultant.getId());
                    consultantStats.put("consultantName", consultant.getName());
                    consultantStats.put("consultantEmail", consultant.getEmail());
                    consultantStats.put("consultantPhone", maskPhone(consultant.getPhone()));
                    consultantStats.put("specialization", consultant.getSpecialization());
                    consultantStats.put("grade", consultant.getGrade());
                    consultantStats.put("completedCount", completedCount);
                    consultantStats.put("totalCount", totalCount);
                    consultantStats.put("completionRate", totalCount > 0 ? 
                        Math.round((double) completedCount / totalCount * 100) : 0);
                    consultantStats.put("period", period != null ? period : "전체");
                    consultantStats.put("startDate", startDate.toString());
                    consultantStats.put("endDate", endDate.toString());
                    
                    statistics.add(consultantStats);
                    
                } catch (Exception e) {
                    log.warn("상담사 ID {} 통계 조회 실패: {}", consultant.getId(), e.getMessage());
                }
            }
            
            // 완료 건수 기준으로 내림차순 정렬
            statistics.sort((a, b) -> {
                Integer countA = (Integer) a.get("completedCount");
                Integer countB = (Integer) b.get("completedCount");
                return countB.compareTo(countA);
            });
            
            log.info("✅ 상담 완료 건수 통계 조회 완료: {}명", statistics.size());
            return statistics;
            
        } catch (Exception e) {
            log.error("❌ 상담 완료 건수 통계 조회 실패", e);
            return new ArrayList<>();
        }
    }
    
    @Override
    public List<Map<String, Object>> getAllSchedules() {
        try {
            log.info("🔍 모든 스케줄 조회");
            
            // 모든 스케줄 조회
            List<Schedule> schedules = scheduleRepository.findAll();
            
            // 스케줄을 Map 형태로 변환
            List<Map<String, Object>> scheduleMaps = schedules.stream()
                    .map(schedule -> {
                        Map<String, Object> scheduleMap = new HashMap<>();
                        scheduleMap.put("id", schedule.getId());
                        scheduleMap.put("title", schedule.getTitle());
                        scheduleMap.put("date", schedule.getDate());
                        scheduleMap.put("startTime", schedule.getStartTime());
                        scheduleMap.put("endTime", schedule.getEndTime());
                        scheduleMap.put("consultationType", schedule.getConsultationType());
                        scheduleMap.put("status", schedule.getStatus());
                        scheduleMap.put("notes", schedule.getNotes());
                        scheduleMap.put("consultantId", schedule.getConsultantId());
                        
                        // 상담사 정보 추가
                        if (schedule.getConsultantId() != null) {
                            try {
                                User consultant = userRepository.findById(schedule.getConsultantId()).orElse(null);
                                if (consultant != null) {
                                    scheduleMap.put("consultantName", consultant.getName());
                                    scheduleMap.put("consultantEmail", consultant.getEmail());
                                } else {
                                    scheduleMap.put("consultantName", "미지정");
                                    scheduleMap.put("consultantEmail", "");
                                }
                            } catch (Exception e) {
                                log.warn("상담사 정보 조회 실패: consultantId={}, error={}", schedule.getConsultantId(), e.getMessage());
                                scheduleMap.put("consultantName", "미지정");
                                scheduleMap.put("consultantEmail", "");
                            }
                        } else {
                            scheduleMap.put("consultantName", "미지정");
                            scheduleMap.put("consultantEmail", "");
                        }
                        
                        // 내담자 정보 추가
                        if (schedule.getClientId() != null) {
                            scheduleMap.put("clientId", schedule.getClientId());
                            try {
                                User clientUser = userRepository.findById(schedule.getClientId()).orElse(null);
                                if (clientUser != null) {
                                    scheduleMap.put("clientName", clientUser.getName());
                                    scheduleMap.put("clientEmail", clientUser.getEmail());
                                } else {
                                    scheduleMap.put("clientName", "미지정");
                                    scheduleMap.put("clientEmail", "");
                                }
                            } catch (Exception e) {
                                log.warn("내담자 정보 조회 실패: clientId={}, error={}", schedule.getClientId(), e.getMessage());
                                scheduleMap.put("clientName", "미지정");
                                scheduleMap.put("clientEmail", "");
                            }
                        } else {
                            scheduleMap.put("clientId", null);
                            scheduleMap.put("clientName", "미지정");
                            scheduleMap.put("clientEmail", "");
                        }
                        
                        return scheduleMap;
                    })
                    .collect(Collectors.toList());
            
            log.info("✅ 모든 스케줄 조회 완료: {}개", scheduleMaps.size());
            return scheduleMaps;
            
        } catch (Exception e) {
            log.error("❌ 모든 스케줄 조회 실패", e);
            return new ArrayList<>();
        }
    }
    
    @Override
    public Map<String, Object> getScheduleStatistics() {
        try {
            log.info("📊 스케줄 상태별 통계 조회");
            
            // 모든 스케줄 조회
            List<Schedule> allSchedules = scheduleRepository.findAll();
            
            // 상태별 카운트
            Map<String, Long> statusCount = allSchedules.stream()
                .collect(Collectors.groupingBy(
                    schedule -> schedule.getStatus() != null ? schedule.getStatus() : "UNKNOWN",
                    Collectors.counting()
                ));
            
            // 상담사별 완료 건수 (스케줄 기준)
            Map<Long, Long> consultantCompletedCount = allSchedules.stream()
                .filter(schedule -> "COMPLETED".equals(schedule.getStatus()))
                .filter(schedule -> schedule.getConsultantId() != null)
                .collect(Collectors.groupingBy(
                    Schedule::getConsultantId,
                    Collectors.counting()
                ));
            
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalSchedules", allSchedules.size());
            statistics.put("statusCount", statusCount);
            statistics.put("consultantCompletedCount", consultantCompletedCount);
            statistics.put("completedSchedules", statusCount.getOrDefault("COMPLETED", 0L));
            statistics.put("bookedSchedules", statusCount.getOrDefault("BOOKED", 0L));
            statistics.put("confirmedSchedules", statusCount.getOrDefault("CONFIRMED", 0L));
            statistics.put("cancelledSchedules", statusCount.getOrDefault("CANCELLED", 0L));
            
            log.info("✅ 스케줄 통계 조회 완료: 총 {}개, 완료 {}개", allSchedules.size(), statusCount.getOrDefault("COMPLETED", 0L));
            return statistics;
            
        } catch (Exception e) {
            log.error("❌ 스케줄 통계 조회 실패", e);
            return new HashMap<>();
        }
    }
    
    @Override
    public Map<String, Object> autoCompleteSchedulesWithReminder() {
        try {
            log.info("🔄 스케줄 자동 완료 처리 및 상담일지 미작성 알림 시작");
            
            // 1. 지난 스케줄 중 완료되지 않은 것들 조회
            List<Schedule> expiredSchedules = scheduleRepository.findByDateBeforeAndStatus(
                LocalDate.now(), "CONFIRMED");
            
            int completedCount = 0;
            int reminderSentCount = 0;
            List<Long> consultantIdsWithReminder = new ArrayList<>();
            
            for (Schedule schedule : expiredSchedules) {
                try {
                    // 스케줄을 완료 상태로 변경
                    schedule.setStatus("COMPLETED");
                    schedule.setUpdatedAt(LocalDateTime.now());
                    scheduleRepository.save(schedule);
                    completedCount++;
                    
                    // 상담일지 작성 여부 확인 (consultations 테이블에 해당 스케줄의 상담 기록이 있는지 확인)
                    boolean hasConsultationRecord = checkConsultationRecord(schedule);
                    
                    if (!hasConsultationRecord) {
                        // 상담일지 미작성 시 상담사에게 메시지 발송
                        sendConsultationReminderMessage(schedule);
                        reminderSentCount++;
                        
                        if (!consultantIdsWithReminder.contains(schedule.getConsultantId())) {
                            consultantIdsWithReminder.add(schedule.getConsultantId());
                        }
                    }
                    
                } catch (Exception e) {
                    log.error("❌ 스케줄 ID {} 자동 완료 처리 실패: {}", schedule.getId(), e.getMessage());
                }
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("completedSchedules", completedCount);
            result.put("reminderMessagesSent", reminderSentCount);
            result.put("consultantsNotified", consultantIdsWithReminder.size());
            result.put("consultantIds", consultantIdsWithReminder);
            result.put("message", String.format("스케줄 %d개가 완료 처리되었고, 상담일지 미작성 상담사 %d명에게 알림이 발송되었습니다.", 
                completedCount, consultantIdsWithReminder.size()));
            
            log.info("✅ 스케줄 자동 완료 처리 완료: 완료 {}개, 알림 발송 {}개", completedCount, reminderSentCount);
            return result;
            
        } catch (Exception e) {
            log.error("❌ 스케줄 자동 완료 처리 실패", e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "스케줄 자동 완료 처리에 실패했습니다: " + e.getMessage());
            return errorResult;
        }
    }
    
    /**
     * 상담일지 작성 여부 확인
     */
    private boolean checkConsultationRecord(Schedule schedule) {
        try {
            // consultations 테이블에서 해당 스케줄과 관련된 상담 기록이 있는지 확인
            // 여기서는 간단히 스케줄 ID나 날짜/시간으로 매칭하는 로직을 구현
            // 실제로는 더 정확한 매칭 로직이 필요할 수 있음
            return false; // 임시로 항상 false 반환 (상담일지 미작성으로 간주)
        } catch (Exception e) {
            log.warn("상담일지 작성 여부 확인 실패: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * 상담일지 작성 독려 메시지 발송
     */
    private void sendConsultationReminderMessage(Schedule schedule) {
        try {
            if (schedule.getConsultantId() == null || schedule.getClientId() == null) {
                log.warn("스케줄 ID {} 상담사 또는 내담자 정보가 없어 메시지 발송을 건너뜁니다.", schedule.getId());
                return;
            }
            
            String title = "상담일지 작성 안내";
            String content = String.format(
                "안녕하세요. %s에 진행된 상담의 상담일지를 아직 작성하지 않으셨습니다.\n\n" +
                "상담일지는 상담의 질 향상과 내담자 관리에 매우 중요합니다.\n" +
                "빠른 시일 내에 상담일지를 작성해 주시기 바랍니다.\n\n" +
                "상담 정보:\n" +
                "- 상담일: %s\n" +
                "- 상담시간: %s ~ %s\n" +
                "- 내담자: %s\n\n" +
                "감사합니다.",
                schedule.getDate(),
                schedule.getDate(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.getClientId() // 실제로는 내담자 이름을 조회해야 함
            );
            
            // 상담사에게 메시지 발송
            consultationMessageService.sendMessage(
                schedule.getConsultantId(),
                schedule.getClientId(),
                null, // consultationId는 null
                "ADMIN", // 발신자 타입
                title,
                content,
                "REMINDER", // 메시지 타입
                true, // 중요 메시지
                false // 긴급 메시지 아님
            );
            
            log.info("📨 상담일지 작성 독려 메시지 발송 완료: 상담사 ID={}, 스케줄 ID={}", 
                schedule.getConsultantId(), schedule.getId());
                
        } catch (Exception e) {
            log.error("❌ 상담일지 작성 독려 메시지 발송 실패: 스케줄 ID={}, error={}", 
                schedule.getId(), e.getMessage());
        }
    }
    
    /**
     * 상담사별 완료된 스케줄 건수 조회 (기간별)
     */
    private int getCompletedScheduleCount(Long consultantId, LocalDate startDate, LocalDate endDate) {
        try {
            List<Schedule> completedSchedules = scheduleRepository.findByConsultantIdAndStatusAndDateBetween(
                consultantId, "COMPLETED", startDate, endDate);
            return completedSchedules.size();
        } catch (Exception e) {
            log.warn("상담사 {} 완료 스케줄 건수 조회 실패: {}", consultantId, e.getMessage());
            return 0;
        }
    }
    
    /**
     * 상담사별 총 스케줄 건수 조회
     */
    private long getTotalScheduleCount(Long consultantId) {
        try {
            return scheduleRepository.countByConsultantId(consultantId);
        } catch (Exception e) {
            log.warn("상담사 {} 총 스케줄 건수 조회 실패: {}", consultantId, e.getMessage());
            return 0;
        }
    }
    
    /**
     * 전화번호 마스킹
     */
    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return phone;
        }
        
        if (phone.length() <= 8) {
            return phone.substring(0, 3) + "****";
        }
        
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }
    
    @Override
    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        log.info("🔍 사용자 ID로 조회: {}", id);
        try {
            return userRepository.findById(id).orElse(null);
        } catch (Exception e) {
            log.error("❌ 사용자 조회 중 오류 발생: {}", e.getMessage(), e);
            return null;
        }
    }
}
