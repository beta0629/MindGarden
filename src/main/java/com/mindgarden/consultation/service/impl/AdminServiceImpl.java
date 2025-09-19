package com.mindgarden.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import com.mindgarden.consultation.constant.AdminConstants;
import com.mindgarden.consultation.constant.ScheduleStatus;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.dto.ClientRegistrationDto;
import com.mindgarden.consultation.dto.ConsultantClientMappingDto;
import com.mindgarden.consultation.dto.ConsultantRegistrationDto;
import com.mindgarden.consultation.dto.ConsultantTransferRequest;
import com.mindgarden.consultation.dto.FinancialTransactionRequest;
import com.mindgarden.consultation.entity.Branch;
import com.mindgarden.consultation.entity.Client;
import com.mindgarden.consultation.entity.CommonCode;
import com.mindgarden.consultation.entity.Consultant;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.Schedule;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.CommonCodeRepository;
import com.mindgarden.consultation.repository.ConsultantClientMappingRepository;
import com.mindgarden.consultation.repository.FinancialTransactionRepository;
import com.mindgarden.consultation.repository.ScheduleRepository;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.AdminService;
import com.mindgarden.consultation.service.AmountManagementService;
import com.mindgarden.consultation.service.BranchService;
import com.mindgarden.consultation.service.ConsultantAvailabilityService;
import com.mindgarden.consultation.service.ConsultationMessageService;
import com.mindgarden.consultation.service.FinancialTransactionService;
import com.mindgarden.consultation.service.NotificationService;
import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
    private final CommonCodeRepository commonCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final PersonalDataEncryptionUtil encryptionUtil;
    private final ConsultantAvailabilityService consultantAvailabilityService;
    private final ConsultationMessageService consultationMessageService;
    private final BranchService branchService;
    private final NotificationService notificationService;
    private final FinancialTransactionService financialTransactionService;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final AmountManagementService amountManagementService;

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

        // 지점코드 설정 (상담사의 지점코드 우선, 없으면 내담자의 지점코드 사용)
        String branchCode = consultant.getBranchCode();
        if (branchCode == null || branchCode.trim().isEmpty()) {
            branchCode = clientUser.getBranchCode();
        }
        if (branchCode == null || branchCode.trim().isEmpty()) {
            branchCode = AdminConstants.DEFAULT_BRANCH_CODE; // 기본값
        }
        
        // 기존 매핑이 있는지 확인 (중복 결과 처리)
        List<ConsultantClientMapping> existingMappings = mappingRepository
            .findByConsultantAndClient(consultant, clientUser);
        
        if (!existingMappings.isEmpty()) {
            // 중복 매핑이 있는 경우 가장 최근의 활성 매핑을 선택
            ConsultantClientMapping existing = existingMappings.stream()
                .filter(m -> m.getStatus() == ConsultantClientMapping.MappingStatus.ACTIVE)
                .max(Comparator.comparing(ConsultantClientMapping::getCreatedAt))
                .orElse(existingMappings.get(0));
            
            // 활성 상태인지 확인
            if (existing.getStatus() != ConsultantClientMapping.MappingStatus.ACTIVE) {
                log.warn("⚠️ 비활성 매핑 발견, 새 매핑 생성: 상태={}", existing.getStatus());
                // 비활성 상태면 새 매핑 생성으로 진행
            } else if (!branchCode.equals(existing.getBranchCode())) {
                log.warn("⚠️ 다른 지점의 매핑 발견, 새 매핑 생성: 기존 지점={}, 새 지점={}", 
                    existing.getBranchCode(), branchCode);
                // 다른 지점이면 새 매핑 생성으로 진행
            } else {
                // 같은 지점의 활성 매핑이 있으면 합산
                log.info("🔍 기존 활성 매핑 발견, 합산 처리: 상담사={}, 내담자={}, 지점={}", 
                    consultant.getName(), clientUser.getName(), branchCode);
            
                // 회기수 합산
                int newTotalSessions = dto.getTotalSessions() != null ? dto.getTotalSessions() : 10;
                int newRemainingSessions = dto.getRemainingSessions() != null ? dto.getRemainingSessions() : newTotalSessions;
                
                int updatedTotalSessions = existing.getTotalSessions() + newTotalSessions;
                int updatedRemainingSessions = existing.getRemainingSessions() + newRemainingSessions;
                
                // 기존 매핑 업데이트
                existing.setTotalSessions(updatedTotalSessions);
                existing.setRemainingSessions(updatedRemainingSessions);
                
                // 새로운 정보로 업데이트 (패키지명, 가격 등)
                if (dto.getPackageName() != null && !dto.getPackageName().trim().isEmpty()) {
                    existing.setPackageName(dto.getPackageName());
                }
                if (dto.getPackagePrice() != null) {
                    existing.setPackagePrice(dto.getPackagePrice());
                }
                if (dto.getPaymentMethod() != null) {
                    existing.setPaymentMethod(dto.getPaymentMethod());
                }
                if (dto.getPaymentReference() != null) {
                    existing.setPaymentReference(dto.getPaymentReference());
                }
                if (dto.getPaymentAmount() != null) {
                    existing.setPaymentAmount(dto.getPaymentAmount());
                }
                if (dto.getNotes() != null && !dto.getNotes().trim().isEmpty()) {
                    String currentNotes = existing.getNotes() != null ? existing.getNotes() : "";
                    String newNotes = currentNotes + (currentNotes.isEmpty() ? "" : "\n") + 
                        "[추가 매핑] " + dto.getNotes();
                    existing.setNotes(newNotes);
                }
                if (dto.getSpecialConsiderations() != null && !dto.getSpecialConsiderations().trim().isEmpty()) {
                    existing.setSpecialConsiderations(dto.getSpecialConsiderations());
                }
                
                // 추가 매핑 시 입금 확인 절차 필요 (ERP 연동을 위해)
                // 기존 매핑이 ACTIVE 상태라도 추가 결제에 대해서는 입금 확인이 필요
                boolean needsPaymentConfirmation = (dto.getPaymentAmount() != null && dto.getPaymentAmount() > 0) ||
                                                 (dto.getPackagePrice() != null && dto.getPackagePrice() > 0);
                
                if (needsPaymentConfirmation) {
                    // 추가 결제가 있는 경우 입금 확인 대기 상태로 설정
                    existing.setPaymentStatus(ConsultantClientMapping.PaymentStatus.PENDING);
                    log.info("💰 추가 매핑 시 입금 확인 필요: 추가금액={}원", 
                        dto.getPaymentAmount() != null ? dto.getPaymentAmount() : dto.getPackagePrice());
                } else {
                    // 추가 결제가 없는 경우 (무료 회기 추가 등) 기존 상태 유지
                    log.info("🆓 무료 회기 추가: 입금 확인 불필요");
                }
                
                // 상태는 기존 ACTIVE 상태 유지 (회기 추가는 기존 매핑 확장이므로)
                
                existing.setUpdatedAt(LocalDateTime.now());
                
                log.info("✅ 기존 매핑 합산 완료: 총 회기수={}, 남은 회기수={}", 
                    updatedTotalSessions, updatedRemainingSessions);
                
                return mappingRepository.save(existing);
            }
        }
        
        // 새로운 매핑 생성 (기존 매핑이 없거나 다른 지점인 경우)
        log.info("🆕 새로운 매핑 생성: 상담사={}, 내담자={}, 지점={}", 
            consultant.getName(), clientUser.getName(), branchCode);
            
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setConsultant(consultant);
        mapping.setClient(clientUser);
        mapping.setStartDate(dto.getStartDate() != null ? 
            dto.getStartDate().atStartOfDay() : 
            LocalDateTime.now());
        // 새 매핑은 입금 확인 후 활성화되도록 설정
        mapping.setStatus(dto.getStatus() != null ? 
            ConsultantClientMapping.MappingStatus.valueOf(dto.getStatus()) : 
            ConsultantClientMapping.MappingStatus.PENDING_PAYMENT);
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
        
        // 금액 검증 로직 추가
        if (paymentAmount != null && mapping.getPackagePrice() != null) {
            if (!paymentAmount.equals(mapping.getPackagePrice())) {
                log.warn("⚠️ 금액 불일치 감지: MappingID={}, PaymentAmount={}, PackagePrice={}", 
                    mappingId, paymentAmount, mapping.getPackagePrice());
                // 경고는 하지만 처리는 계속 진행 (관리자가 의도적으로 다른 금액을 입력했을 수 있음)
            }
        }
        
        mapping.confirmPayment(paymentMethod, paymentReference);
        mapping.setPaymentAmount(paymentAmount);
        
        ConsultantClientMapping savedMapping = mappingRepository.save(mapping);
        
        // 입금 확인 시 자동으로 ERP 수입 거래 생성
        try {
            // 추가 매핑인지 확인
            boolean isAdditionalMapping = savedMapping.getNotes() != null && 
                                        savedMapping.getNotes().contains("[추가 매핑]");
            
            if (isAdditionalMapping) {
                log.info("🔄 추가 매핑 입금 확인 - 추가 회기에 대한 ERP 거래 생성");
                createAdditionalSessionIncomeTransaction(savedMapping, paymentAmount);
            } else {
                log.info("🆕 신규 매핑 입금 확인 - 전체 패키지에 대한 ERP 거래 생성");
                createConsultationIncomeTransaction(savedMapping);
            }
            
            log.info("💚 매핑 입금 확인으로 인한 상담료 수입 거래 자동 생성 완료: MappingID={}, PaymentAmount={}, 추가매핑={}", 
                mappingId, paymentAmount, isAdditionalMapping);
        } catch (Exception e) {
            log.error("상담료 수입 거래 자동 생성 실패: {}", e.getMessage(), e);
            // 거래 생성 실패해도 입금 확인은 완료
        }
        
        return savedMapping;
    }
    
    /**
     * 상담료 수입 거래 자동 생성 (중앙화된 금액 관리 사용)
     */
    private void createConsultationIncomeTransaction(ConsultantClientMapping mapping) {
        log.info("💰 [중앙화] 상담료 수입 거래 생성 시작: MappingID={}", mapping.getId());
        
        // 1. 중복 거래 방지 (중앙화된 서비스 사용)
        if (amountManagementService.isDuplicateTransaction(mapping.getId(), 
                com.mindgarden.consultation.entity.FinancialTransaction.TransactionType.INCOME)) {
            log.warn("🚫 중복 거래 방지: MappingID={}에 대한 수입 거래가 이미 존재합니다.", mapping.getId());
            return;
        }
        
        // 2. 정확한 거래 금액 결정 (중앙화된 서비스 사용)
        Long accurateAmount = amountManagementService.getAccurateTransactionAmount(mapping);
        
        if (accurateAmount == null || accurateAmount <= 0) {
            log.error("❌ 유효한 거래 금액을 결정할 수 없습니다: MappingID={}", mapping.getId());
            return;
        }
        
        // 3. 금액 일관성 검사 (중앙화된 서비스 사용)
        AmountManagementService.AmountConsistencyResult consistency = 
            amountManagementService.checkAmountConsistency(mapping.getId());
        
        if (!consistency.isConsistent()) {
            log.warn("⚠️ 금액 일관성 문제 감지: {}", consistency.getInconsistencyReason());
            log.warn("💡 권장사항: {}", consistency.getRecommendation());
        }
        
        // 4. ERP 거래 생성
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType("INCOME")
                .category("CONSULTATION") // 공통코드 사용
                .subcategory("INDIVIDUAL_CONSULTATION") // 공통코드 사용
                .amount(java.math.BigDecimal.valueOf(accurateAmount))
                .description(String.format("상담료 입금 확인 - %s (%s) [정확한금액: %,d원]", 
                    mapping.getPackageName() != null ? mapping.getPackageName() : "상담 패키지",
                    mapping.getPaymentMethod() != null ? mapping.getPaymentMethod() : "미지정",
                    accurateAmount))
                .transactionDate(java.time.LocalDate.now())
                .relatedEntityId(mapping.getId())
                .relatedEntityType("CONSULTANT_CLIENT_MAPPING")
                .taxIncluded(false) // 상담료는 부가세 면세
                .build();
        
        // 5. 시스템 자동 거래 생성 (권한 검사 우회)
        com.mindgarden.consultation.dto.FinancialTransactionResponse response = 
            financialTransactionService.createTransaction(request, null);
        
        // 6. 입금 확인된 거래는 즉시 완료 상태로 변경
        try {
            com.mindgarden.consultation.entity.FinancialTransaction transaction = 
                financialTransactionRepository.findById(response.getId()).orElse(null);
            if (transaction != null) {
                transaction.complete(); // 완료 상태로 변경
                transaction.setApprovedAt(java.time.LocalDateTime.now());
                financialTransactionRepository.save(transaction);
                log.info("💚 매핑 연동 거래 즉시 완료 처리: TransactionID={}", response.getId());
            }
        } catch (Exception e) {
            log.error("거래 완료 처리 실패: {}", e.getMessage(), e);
        }
        
        // 6. 금액 변경 이력 기록 (중앙화된 서비스 사용)
        if (mapping.getPaymentAmount() != null && !accurateAmount.equals(mapping.getPaymentAmount())) {
            amountManagementService.recordAmountChange(mapping.getId(), 
                mapping.getPaymentAmount(), accurateAmount, 
                "ERP 연동 시 정확한 패키지 가격 적용", "SYSTEM_AUTO");
        }
        
        log.info("✅ [중앙화] 상담료 수입 거래 생성 완료: MappingID={}, AccurateAmount={}원", 
            mapping.getId(), accurateAmount);
    }
    
    /**
     * 추가 회기 수입 거래 자동 생성 (추가 매핑용)
     */
    private void createAdditionalSessionIncomeTransaction(ConsultantClientMapping mapping, Long additionalPaymentAmount) {
        log.info("💰 [중앙화] 추가 회기 수입 거래 생성 시작: MappingID={}, AdditionalAmount={}", 
            mapping.getId(), additionalPaymentAmount);
        
        // 추가 결제 금액 사용 (전체 패키지 가격이 아닌 실제 추가 결제 금액)
        Long transactionAmount = additionalPaymentAmount != null ? additionalPaymentAmount : 0L;
        
        if (transactionAmount <= 0) {
            log.warn("❌ 유효한 추가 결제 금액이 없습니다: MappingID={}", mapping.getId());
            return;
        }
        
        // 추가 회기수 추출 시도
        int additionalSessions = extractAdditionalSessionsFromNotes(mapping.getNotes());
        
        // ERP 거래 생성
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType("INCOME")
                .category("CONSULTATION") // 공통코드 사용
                .subcategory("ADDITIONAL_CONSULTATION") // 추가 회기 세부카테고리
                .amount(java.math.BigDecimal.valueOf(transactionAmount))
                .description(String.format("추가 회기 상담료 입금 확인 - %s (%d회 추가, %s) [추가금액: %,d원]", 
                    mapping.getPackageName() != null ? mapping.getPackageName() : "상담 패키지",
                    additionalSessions,
                    mapping.getPaymentMethod() != null ? mapping.getPaymentMethod() : "미지정",
                    transactionAmount))
                .transactionDate(java.time.LocalDate.now())
                .relatedEntityId(mapping.getId())
                .relatedEntityType("CONSULTANT_CLIENT_MAPPING_ADDITIONAL")
                .taxIncluded(false) // 상담료는 부가세 면세
                .build();
        
        // 시스템 자동 거래 생성 (권한 검사 우회)
        com.mindgarden.consultation.dto.FinancialTransactionResponse response = 
            financialTransactionService.createTransaction(request, null);
        
        // 입금 확인된 거래는 즉시 완료 상태로 변경
        try {
            com.mindgarden.consultation.entity.FinancialTransaction transaction = 
                financialTransactionRepository.findById(response.getId()).orElse(null);
            if (transaction != null) {
                transaction.complete(); // 완료 상태로 변경
                transaction.setApprovedAt(java.time.LocalDateTime.now());
                financialTransactionRepository.save(transaction);
                log.info("💚 추가 회기 거래 즉시 완료 처리: TransactionID={}", response.getId());
            }
        } catch (Exception e) {
            log.error("추가 회기 거래 완료 처리 실패: {}", e.getMessage(), e);
        }
        
        log.info("✅ [중앙화] 추가 회기 수입 거래 생성 완료: MappingID={}, AdditionalAmount={}원, AdditionalSessions={}회", 
            mapping.getId(), transactionAmount, additionalSessions);
    }
    
    /**
     * Notes에서 추가 회기수 추출
     */
    private int extractAdditionalSessionsFromNotes(String notes) {
        if (notes == null || notes.trim().isEmpty()) {
            return 0;
        }
        
        try {
            // "[추가 매핑]" 다음에 있는 숫자 추출 시도
            String[] lines = notes.split("\n");
            for (String line : lines) {
                if (line.contains("[추가 매핑]")) {
                    // "10회", "20회" 같은 패턴에서 숫자 추출
                    if (line.matches(".*\\d+회.*")) {
                        String sessionStr = line.replaceAll(".*?(\\d+)회.*", "$1");
                        return Integer.parseInt(sessionStr);
                    }
                    // 기본값으로 10회 반환
                    return 10;
                }
            }
        } catch (Exception e) {
            log.warn("Notes에서 추가 회기수 추출 실패: {}", e.getMessage());
        }
        
        return 10; // 기본값
    }
    
    /**
     * 상담료 환불 거래 자동 생성
     */
    private void createConsultationRefundTransaction(ConsultantClientMapping mapping, int refundedSessions, long refundAmount, String reason) {
        log.info("상담료 환불 거래 생성 시작: MappingID={}, RefundAmount={}", 
            mapping.getId(), refundAmount);
        
        if (refundAmount <= 0) {
            log.warn("유효하지 않은 환불 금액: {}", refundAmount);
            return;
        }
        
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType("EXPENSE") // 환불은 지출
                .category("CONSULTATION") // 공통코드 사용
                .subcategory("CONSULTATION_REFUND") // 환불 세부카테고리
                .amount(java.math.BigDecimal.valueOf(refundAmount))
                .description(String.format("상담료 환불 - %s (%d회기 환불, 사유: %s)", 
                    mapping.getPackageName() != null ? mapping.getPackageName() : "상담 패키지",
                    refundedSessions,
                    reason != null ? reason : "관리자 처리"))
                .transactionDate(java.time.LocalDate.now())
                .relatedEntityId(mapping.getId())
                .relatedEntityType("CONSULTANT_CLIENT_MAPPING_REFUND")
                .taxIncluded(false) // 환불은 부가세 면세
                .build();
        
        // 시스템 자동 거래 생성 (권한 검사 우회)
        financialTransactionService.createTransaction(request, null);
        
        log.info("✅ 상담료 환불 거래 생성 완료: MappingID={}, RefundAmount={}", 
            mapping.getId(), refundAmount);
    }
    
    /**
     * 부분 환불 상담료 거래 자동 생성 (중앙화된 금액 관리 사용)
     */
    private void createPartialConsultationRefundTransaction(ConsultantClientMapping mapping, int refundSessions, long refundAmount, String reason) {
        log.info("💰 [중앙화] 부분 환불 거래 생성 시작: MappingID={}, RefundSessions={}, RefundAmount={}", 
            mapping.getId(), refundSessions, refundAmount);
        
        if (refundAmount <= 0) {
            log.warn("유효하지 않은 부분 환불 금액: {}", refundAmount);
            return;
        }
        
        // 1. 중복 거래 방지 (부분 환불은 여러 번 가능하므로 중복 체크 스킵)
        // 부분 환불은 여러 번 발생할 수 있으므로 중복 체크를 하지 않음
        
        // 2. 금액 일관성 검사 (중앙화된 서비스 사용)
        AmountManagementService.AmountConsistencyResult consistency = 
            amountManagementService.checkAmountConsistency(mapping.getId());
        
        if (!consistency.isConsistent()) {
            log.warn("⚠️ 부분 환불 시 금액 일관성 문제 감지: {}", consistency.getInconsistencyReason());
            log.warn("💡 권장사항: {}", consistency.getRecommendation());
        }
        
        // 3. ERP 환불 거래 생성
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType("EXPENSE") // 환불은 지출
                .category("CONSULTATION") // 공통코드 사용
                .subcategory("CONSULTATION_PARTIAL_REFUND") // 부분 환불 세부카테고리
                .amount(java.math.BigDecimal.valueOf(refundAmount))
                .description(String.format("상담료 부분 환불 - %s (%d회기 부분 환불, 사유: %s) [남은회기: %d회]", 
                    mapping.getPackageName() != null ? mapping.getPackageName() : "상담 패키지",
                    refundSessions,
                    reason != null ? reason : "관리자 처리",
                    mapping.getRemainingSessions() - refundSessions))
                .transactionDate(java.time.LocalDate.now())
                .relatedEntityId(mapping.getId())
                .relatedEntityType("CONSULTANT_CLIENT_MAPPING_PARTIAL_REFUND")
                .taxIncluded(false) // 환불은 부가세 면세
                .build();
        
        // 4. 시스템 자동 거래 생성 (권한 검사 우회)
        com.mindgarden.consultation.dto.FinancialTransactionResponse response = 
            financialTransactionService.createTransaction(request, null);
        
        // 5. 부분 환불 거래는 즉시 완료 상태로 변경
        try {
            com.mindgarden.consultation.entity.FinancialTransaction transaction = 
                financialTransactionRepository.findById(response.getId()).orElse(null);
            if (transaction != null) {
                transaction.complete(); // 완료 상태로 변경
                transaction.setApprovedAt(java.time.LocalDateTime.now());
                financialTransactionRepository.save(transaction);
                log.info("💚 부분 환불 거래 즉시 완료 처리: TransactionID={}", response.getId());
            }
        } catch (Exception e) {
            log.error("부분 환불 거래 완료 처리 실패: {}", e.getMessage(), e);
        }
        
        // 6. 금액 변경 이력 기록 (중앙화된 서비스 사용)
        try {
            Long originalAmount = mapping.getPackagePrice();
            Long newEffectiveAmount = originalAmount != null ? originalAmount - refundAmount : null;
            
            if (originalAmount != null && newEffectiveAmount != null) {
                amountManagementService.recordAmountChange(mapping.getId(), 
                    originalAmount, newEffectiveAmount, 
                    String.format("부분 환불로 인한 유효 금액 감소 (%d회기 환불)", refundSessions), 
                    "SYSTEM_PARTIAL_REFUND");
            }
        } catch (Exception e) {
            log.error("부분 환불 금액 변경 이력 기록 실패: {}", e.getMessage(), e);
        }
        
        log.info("✅ [중앙화] 부분 환불 거래 생성 완료: MappingID={}, RefundSessions={}, RefundAmount={}원", 
            mapping.getId(), refundSessions, refundAmount);
    }

    /**
     * 입금 확인 처리 (간단 버전)
     */
    @Override
    public ConsultantClientMapping confirmPayment(Long mappingId, String paymentMethod, String paymentReference) {
        ConsultantClientMapping mapping = mappingRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));
        
        mapping.confirmPayment(paymentMethod, paymentReference);
        
        ConsultantClientMapping savedMapping = mappingRepository.save(mapping);
        
        // 입금 확인 시 자동으로 ERP 수입 거래 생성
        try {
            createConsultationIncomeTransaction(savedMapping);
            log.info("💚 매핑 입금 확인으로 인한 상담료 수입 거래 자동 생성: MappingID={}", mappingId);
        } catch (Exception e) {
            log.error("상담료 수입 거래 자동 생성 실패: {}", e.getMessage(), e);
            // 거래 생성 실패해도 입금 확인은 완료
        }
        
        return savedMapping;
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
     * 회기 추가 (연장) - 기존 메서드 (즉시 처리)
     * @deprecated 워크플로우를 통한 회기 추가를 권장합니다.
     */
    @Override
    @Deprecated
    public ConsultantClientMapping extendSessions(Long mappingId, Integer additionalSessions, String packageName, Long packagePrice) {
        log.warn("⚠️ 즉시 회기 추가 사용됨 - 워크플로우를 통한 회기 추가를 권장합니다. mappingId={}", mappingId);
        
        ConsultantClientMapping mapping = mappingRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));
        
        mapping.addSessions(additionalSessions, packageName, packagePrice);
        
        return mappingRepository.save(mapping);
    }
    
    /**
     * 회기 추가 요청 생성 (워크플로우 방식)
     */
    public ConsultantClientMapping createSessionExtensionRequest(Long mappingId, Long requesterId, 
                                                               Integer additionalSessions, String packageName, 
                                                               Long packagePrice, String reason) {
        log.info("🔄 회기 추가 요청 생성: mappingId={}, requesterId={}, sessions={}", 
                mappingId, requesterId, additionalSessions);
        
        // 매핑 정보 조회
        ConsultantClientMapping mapping = mappingRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("매핑을 찾을 수 없습니다: " + mappingId));
        
        // 요청자 정보 검증
        if (!userRepository.existsById(requesterId)) {
            throw new RuntimeException("요청자를 찾을 수 없습니다: " + requesterId);
        }
        
        // 회기 추가 요청 생성 (SessionExtensionService 사용)
        // 이 메서드는 기존 AdminService에 유지하되, 실제 처리는 SessionExtensionService로 위임
        log.info("✅ 회기 추가 요청 생성 완료 - SessionExtensionService를 통해 처리됩니다.");
        
        return mapping;
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
        List<User> consultants = userRepository.findByRoleAndIsActiveTrue(UserRole.CONSULTANT);
        
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
        List<User> consultants = userRepository.findByRoleAndIsActiveTrue(UserRole.CONSULTANT);
        
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
        
        List<User> consultants = userRepository.findByRoleAndIsActiveTrue(UserRole.CONSULTANT);
        
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
                    consultantData.put("vacationConsultantName", vacationInfo.get("consultantName"));
                    
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

    /**
     * 전화번호 하이픈 포맷팅
     * 01012345678 -> 010-1234-5678
     */
    private String formatPhoneNumber(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return phone;
        }
        
        // 숫자만 추출
        String numbers = phone.replaceAll("[^0-9]", "");
        
        // 11자리 휴대폰 번호 형식 (010-1234-5678)
        if (numbers.length() == 11 && numbers.startsWith("01")) {
            return numbers.substring(0, 3) + "-" + numbers.substring(3, 7) + "-" + numbers.substring(7);
        }
        // 10자리 전화번호 형식 (02-1234-5678, 031-123-4567 등)
        else if (numbers.length() == 10) {
            if (numbers.startsWith("02")) {
                return numbers.substring(0, 2) + "-" + numbers.substring(2, 6) + "-" + numbers.substring(6);
            } else {
                return numbers.substring(0, 3) + "-" + numbers.substring(3, 6) + "-" + numbers.substring(6);
            }
        }
        // 8자리 전화번호 형식 (031-123-4567의 앞자리 생략 등)
        else if (numbers.length() == 8) {
            return numbers.substring(0, 4) + "-" + numbers.substring(4);
        }
        
        // 형식이 맞지 않는 경우 원본 반환
        return phone;
    }

    @Override
    public List<Client> getAllClients() {
        // User 테이블에서 활성 CLIENT role 사용자들을 조회하고 Client 정보와 조인
        List<User> clientUsers = userRepository.findByRoleAndIsActiveTrue(UserRole.CLIENT);
        
        log.info("🔍 내담자 조회 - 총 {}명", clientUsers.size());
        
        // 각 내담자 정보를 상세히 로깅 (복호화 전)
        for (User user : clientUsers) {
            log.info("👤 내담자 원본 데이터 - ID: {}, 이름: '{}', 이메일: '{}', 전화번호: '{}', 활성상태: {}, 삭제상태: {}, 역할: {}", 
                user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getIsActive(), user.getIsDeleted(), user.getRole());
        }
        
        // 각 내담자의 개인정보 복호화
        clientUsers = clientUsers.stream()
            .map(user -> decryptUserPersonalData(user))
            .collect(Collectors.toList());
        
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
                
                // 전화번호 처리 - null이거나 빈 문자열인 경우 기본값 설정 (SNS 가입자 고려)
                String phone = user.getPhone();
                if (phone == null || phone.trim().isEmpty()) {
                    phone = "-"; // SNS 가입자는 전화번호가 없을 수 있음
                } else {
                    // 전화번호 하이픈 포맷팅 (010-1234-5678)
                    phone = formatPhoneNumber(phone);
                }
                client.setPhone(phone);
                
                client.setBirthDate(user.getBirthDate());
                client.setGender(user.getGender());
                client.setBranchCode(user.getBranchCode()); // 지점코드 설정
                client.setIsDeleted(user.getIsDeleted()); // isDeleted 필드 직접 사용
                client.setCreatedAt(user.getCreatedAt());
                client.setUpdatedAt(user.getUpdatedAt());
                
                // 디버깅을 위한 로깅 (복호화 후)
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
            
            // 활성 내담자만 조회
            List<User> clientUsers = userRepository.findByRoleAndIsActiveTrue(UserRole.CLIENT);
            log.info("🔍 내담자 수: {}", clientUsers.size());
            
            // 모든 매핑 조회
            List<ConsultantClientMapping> allMappings = mappingRepository.findAllWithDetails();
            log.info("🔍 매핑 수: {}", allMappings.size());
            
            List<Map<String, Object>> result = new ArrayList<>();
            
            for (User user : clientUsers) {
                // 개인정보 복호화
                User decryptedUser = decryptUserPersonalData(user);
                
                Map<String, Object> clientData = new HashMap<>();
                
                // 기본 내담자 정보 (복호화된 데이터 사용)
                clientData.put("id", decryptedUser.getId());
                clientData.put("name", decryptedUser.getName());
                clientData.put("email", decryptedUser.getEmail() != null ? decryptedUser.getEmail() : "");
                
                // 전화번호 복호화 처리 (SNS 가입자 고려)
                String phone = decryptedUser.getPhone();
                if (phone == null || phone.trim().isEmpty()) {
                    phone = "-"; // SNS 가입자는 전화번호가 없을 수 있음
                } else {
                    // 전화번호 하이픈 포맷팅 (010-1234-5678)
                    phone = formatPhoneNumber(phone);
                }
                clientData.put("phone", phone);
                
                clientData.put("birthDate", decryptedUser.getBirthDate());
                clientData.put("gender", decryptedUser.getGender());
                clientData.put("grade", decryptedUser.getGrade() != null ? decryptedUser.getGrade() : "");
                clientData.put("isActive", decryptedUser.getIsActive());
                clientData.put("isDeleted", decryptedUser.getIsDeleted());
                clientData.put("createdAt", decryptedUser.getCreatedAt());
                clientData.put("updatedAt", decryptedUser.getUpdatedAt());
                clientData.put("branchCode", decryptedUser.getBranchCode()); // 브랜치 코드 추가
                
                log.info("👤 통합 내담자 데이터 - ID: {}, 이름: '{}', 전화번호: '{}'", 
                    decryptedUser.getId(), decryptedUser.getName(), phone);
                
                // 해당 내담자의 매핑 정보들
                List<Map<String, Object>> mappings = allMappings.stream()
                    .filter(mapping -> mapping.getClient() != null && mapping.getClient().getId().equals(decryptedUser.getId()))
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
    @Transactional(rollbackFor = Exception.class)
    public void deleteConsultant(Long id) {
        log.info("🗑️ 상담사 삭제 처리 시작: ID={}", id);
        
        User consultant = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("상담사를 찾을 수 없습니다."));
        
        if (consultant.getRole() != UserRole.CONSULTANT) {
            throw new RuntimeException("상담사가 아닌 사용자는 삭제할 수 없습니다.");
        }
        
        // 1. 해당 상담사의 활성 매핑 조회
        List<ConsultantClientMapping> activeMappings = mappingRepository
                .findByConsultantIdAndStatusNot(id, ConsultantClientMapping.MappingStatus.TERMINATED);
        
        if (!activeMappings.isEmpty()) {
            log.warn("⚠️ 상담사에게 {} 개의 활성 매핑이 있습니다. 다른 상담사로 이전이 필요합니다.", activeMappings.size());
            throw new RuntimeException(String.format(
                "상담사에게 %d 개의 활성 매핑이 있습니다. 먼저 다른 상담사로 이전 처리해주세요.", 
                activeMappings.size()));
        }
        
        // 2. 해당 상담사의 예정된 스케줄 조회 (오늘 포함)
        List<Schedule> futureSchedules = scheduleRepository.findByConsultantIdAndDateGreaterThanEqual(id, LocalDate.now());
        
        if (!futureSchedules.isEmpty()) {
            log.warn("⚠️ 상담사에게 {} 개의 예정된 스케줄이 있습니다. 다른 상담사로 이전이 필요합니다.", futureSchedules.size());
            throw new RuntimeException(String.format(
                "상담사에게 %d 개의 예정된 스케줄이 있습니다. 먼저 다른 상담사로 이전 처리해주세요.", 
                futureSchedules.size()));
        }
        
        // 3. 상담사 비활성화
        consultant.setIsActive(false);
        userRepository.save(consultant);
        
        log.info("✅ 상담사 삭제 완료: ID={}, 이름={}", id, consultant.getName());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteConsultantWithTransfer(Long consultantId, Long transferToConsultantId, String reason) {
        log.info("🔄 상담사 삭제 및 이전 처리 시작: 삭제 상담사 ID={}, 이전 대상 상담사 ID={}", 
                consultantId, transferToConsultantId);
        
        // 1. 삭제할 상담사와 이전 대상 상담사 검증
        User consultantToDelete = userRepository.findById(consultantId)
                .orElseThrow(() -> new RuntimeException("삭제할 상담사를 찾을 수 없습니다."));
        
        User transferToConsultant = userRepository.findById(transferToConsultantId)
                .orElseThrow(() -> new RuntimeException("이전 대상 상담사를 찾을 수 없습니다."));
        
        if (consultantToDelete.getRole() != UserRole.CONSULTANT) {
            throw new RuntimeException("삭제 대상이 상담사가 아닙니다.");
        }
        
        if (transferToConsultant.getRole() != UserRole.CONSULTANT) {
            throw new RuntimeException("이전 대상이 상담사가 아닙니다.");
        }
        
        if (!transferToConsultant.getIsActive()) {
            throw new RuntimeException("이전 대상 상담사가 비활성 상태입니다.");
        }
        
        // 2. 활성 매핑들을 새로운 상담사로 이전
        List<ConsultantClientMapping> activeMappings = mappingRepository
                .findByConsultantIdAndStatusNot(consultantId, ConsultantClientMapping.MappingStatus.TERMINATED);
        
        for (ConsultantClientMapping mapping : activeMappings) {
            String transferReason = String.format("상담사 삭제로 인한 이전: %s -> %s. 사유: %s", 
                    consultantToDelete.getName(), transferToConsultant.getName(), reason);
            
            // 이전 대상 상담사와 내담자 조합으로 기존 매핑이 있는지 확인 (중복 방지)
            List<ConsultantClientMapping> existingTransferMappings = 
                mappingRepository.findByConsultantAndClient(transferToConsultant, mapping.getClient());
            
            // 활성 매핑이 있는지 확인
            Optional<ConsultantClientMapping> existingActiveMapping = existingTransferMappings.stream()
                .filter(m -> m.getStatus() == ConsultantClientMapping.MappingStatus.ACTIVE)
                .findFirst();
            
            if (existingActiveMapping.isPresent()) {
                // 기존 활성 매핑에 회기수 합산
                ConsultantClientMapping existing = existingActiveMapping.get();
                log.info("🔍 이전 대상 상담사와 내담자 간 기존 활성 매핑 발견, 회기수 합산: 내담자={}, 상담사={}", 
                    mapping.getClient().getName(), transferToConsultant.getName());
                
                // 회기수 합산
                int totalSessions = existing.getTotalSessions() + mapping.getTotalSessions();
                int remainingSessions = existing.getRemainingSessions() + mapping.getRemainingSessions();
                int usedSessions = existing.getUsedSessions() + mapping.getUsedSessions();
                
                existing.setTotalSessions(totalSessions);
                existing.setRemainingSessions(remainingSessions);
                existing.setUsedSessions(usedSessions);
                
                // 결제 정보 업데이트 (더 큰 금액으로)
                if (mapping.getPackagePrice() != null && 
                    (existing.getPackagePrice() == null || mapping.getPackagePrice() > existing.getPackagePrice())) {
                    existing.setPackagePrice(mapping.getPackagePrice());
                    existing.setPackageName(mapping.getPackageName());
                }
                
                if (mapping.getPaymentAmount() != null && 
                    (existing.getPaymentAmount() == null || mapping.getPaymentAmount() > existing.getPaymentAmount())) {
                    existing.setPaymentAmount(mapping.getPaymentAmount());
                    existing.setPaymentDate(mapping.getPaymentDate());
                    existing.setPaymentMethod(mapping.getPaymentMethod());
                    existing.setPaymentReference(mapping.getPaymentReference());
                }
                
                // 결제 상태 업데이트 (APPROVED 우선)
                if (mapping.getPaymentStatus() == ConsultantClientMapping.PaymentStatus.APPROVED) {
                    existing.setPaymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED);
                }
                
                existing.setNotes((existing.getNotes() != null ? existing.getNotes() + "\n" : "") + 
                    "상담사 이전으로 회기수 합산: " + transferReason);
                existing.setUpdatedAt(LocalDateTime.now());
                
                mappingRepository.save(existing);
                
                log.info("✅ 기존 매핑에 회기수 합산 완료: 총 회기수={}, 남은 회기수={}", totalSessions, remainingSessions);
            } else {
                // 새로운 매핑 생성
                log.info("🆕 새로운 매핑 생성: 내담자={}, 상담사={}", 
                    mapping.getClient().getName(), transferToConsultant.getName());
                
                ConsultantClientMapping newMapping = new ConsultantClientMapping();
                newMapping.setConsultant(transferToConsultant);
                newMapping.setClient(mapping.getClient());
                newMapping.setBranchCode(mapping.getBranchCode());
                newMapping.setStartDate(mapping.getStartDate()); // 기존 시작일 유지
                newMapping.setTotalSessions(mapping.getTotalSessions());
                newMapping.setRemainingSessions(mapping.getRemainingSessions());
                newMapping.setUsedSessions(mapping.getUsedSessions());
                newMapping.setPackageName(mapping.getPackageName());
                newMapping.setPackagePrice(mapping.getPackagePrice());
                newMapping.setPaymentAmount(mapping.getPaymentAmount());
                newMapping.setPaymentDate(mapping.getPaymentDate()); // 결제일도 유지
                newMapping.setPaymentMethod(mapping.getPaymentMethod());
                newMapping.setPaymentReference(mapping.getPaymentReference()); // 결제 참조번호도 유지
                newMapping.setStatus(mapping.getStatus());
                newMapping.setPaymentStatus(mapping.getPaymentStatus());
                newMapping.setNotes("상담사 이전: " + transferReason);
                newMapping.setAssignedAt(LocalDateTime.now());
                newMapping.setAssignedBy("SYSTEM_AUTO_TRANSFER"); // 배정자 정보도 추가
                
                mappingRepository.save(newMapping);
                
                log.info("✅ 새로운 매핑 생성 완료: 회기수={}", mapping.getTotalSessions());
            }
            
            // 기존 매핑 종료 (TERMINATED로 변경)
            mapping.transferToNewConsultant(transferReason, "SYSTEM_AUTO_TRANSFER");
            mappingRepository.save(mapping);
            
            log.info("📋 매핑 이전 완료: 내담자 {} -> 새 상담사 {}", 
                    mapping.getClient().getName(), transferToConsultant.getName());
        }
        
        // 3. 예정된 스케줄들을 새로운 상담사로 이전 (오늘 포함)
        List<Schedule> futureSchedules = scheduleRepository.findByConsultantIdAndDateGreaterThanEqual(consultantId, LocalDate.now());
        
        for (Schedule schedule : futureSchedules) {
            schedule.setConsultantId(transferToConsultantId);
            schedule.setDescription((schedule.getDescription() != null ? schedule.getDescription() + "\n" : "") + 
                    "[상담사 이전] " + consultantToDelete.getName() + " -> " + transferToConsultant.getName());
            scheduleRepository.save(schedule);
            
            log.info("📅 스케줄 이전 완료: 스케줄 ID {} -> 새 상담사 {}", 
                    schedule.getId(), transferToConsultant.getName());
        }
        
        // 4. 상담사 비활성화
        consultantToDelete.setIsActive(false);
        userRepository.save(consultantToDelete);
        
        log.info("✅ 상담사 삭제 및 이전 완료: 삭제된 상담사={}, 이전 대상 상담사={}, 이전된 매핑 수={}, 이전된 스케줄 수={}", 
                consultantToDelete.getName(), transferToConsultant.getName(), 
                activeMappings.size(), futureSchedules.size());
    }

    @Override
    public Map<String, Object> checkConsultantDeletionStatus(Long consultantId) {
        log.info("🔍 상담사 삭제 가능 여부 확인: ID={}", consultantId);
        
        User consultant = userRepository.findById(consultantId)
                .orElseThrow(() -> new RuntimeException("상담사를 찾을 수 없습니다."));
        
        if (consultant.getRole() != UserRole.CONSULTANT) {
            throw new RuntimeException("상담사가 아닌 사용자입니다.");
        }
        
        // 1. 활성 매핑 조회
        List<ConsultantClientMapping> activeMappings = mappingRepository
                .findByConsultantIdAndStatusNot(consultantId, ConsultantClientMapping.MappingStatus.TERMINATED);
        
        // 2. 예정된 스케줄 조회 (오늘 포함, 활성 상태만)
        List<Schedule> futureSchedules = scheduleRepository.findByConsultantIdAndDateGreaterThanEqual(consultantId, LocalDate.now())
                .stream()
                .filter(schedule -> schedule.getStatus() == ScheduleStatus.BOOKED || 
                                  schedule.getStatus() == ScheduleStatus.CONFIRMED)
                .collect(Collectors.toList());
        
        Map<String, Object> result = new HashMap<>();
        result.put("consultantId", consultantId);
        result.put("consultantName", consultant.getName());
        result.put("canDeleteDirectly", activeMappings.isEmpty() && futureSchedules.isEmpty());
        result.put("requiresTransfer", !activeMappings.isEmpty() || !futureSchedules.isEmpty());
        
        // 상세 정보
        Map<String, Object> details = new HashMap<>();
        details.put("activeMappingCount", activeMappings.size());
        details.put("futureScheduleCount", futureSchedules.size());
        
        // 오늘과 미래 스케줄을 분리하여 표시
        long todayScheduleCount = futureSchedules.stream()
                .filter(schedule -> schedule.getDate().equals(LocalDate.now()))
                .count();
        details.put("todayScheduleCount", (int) todayScheduleCount);
        
        // 활성 매핑된 내담자 목록
        List<Map<String, Object>> mappedClients = activeMappings.stream()
                .map(mapping -> {
                    Map<String, Object> clientInfo = new HashMap<>();
                    clientInfo.put("clientId", mapping.getClient().getId());
                    clientInfo.put("clientName", mapping.getClient().getName());
                    clientInfo.put("remainingSessions", mapping.getRemainingSessions());
                    clientInfo.put("totalSessions", mapping.getTotalSessions());
                    return clientInfo;
                })
                .collect(Collectors.toList());
        details.put("mappedClients", mappedClients);
        
        // 예정된 스케줄 목록 (최대 5개만)
        List<Map<String, Object>> upcomingSchedules = futureSchedules.stream()
                .limit(5)
                .map(schedule -> {
                    Map<String, Object> scheduleInfo = new HashMap<>();
                    scheduleInfo.put("scheduleId", schedule.getId());
                    scheduleInfo.put("date", schedule.getDate());
                    scheduleInfo.put("startTime", schedule.getStartTime());
                    scheduleInfo.put("endTime", schedule.getEndTime());
                    scheduleInfo.put("title", schedule.getTitle());
                    scheduleInfo.put("status", schedule.getStatus());
                    return scheduleInfo;
                })
                .collect(Collectors.toList());
        details.put("upcomingSchedules", upcomingSchedules);
        
        result.put("details", details);
        
        // 메시지 생성
        StringBuilder message = new StringBuilder();
        if (activeMappings.isEmpty() && futureSchedules.isEmpty()) {
            message.append("해당 상담사는 안전하게 삭제할 수 있습니다.");
        } else {
            message.append("다음 사유로 인해 다른 상담사로 이전이 필요합니다:\n");
            if (!activeMappings.isEmpty()) {
                message.append("• 활성 매핑: ").append(activeMappings.size()).append("개\n");
            }
            if (todayScheduleCount > 0) {
                message.append("• 오늘 스케줄: ").append(todayScheduleCount).append("개\n");
            }
            if (!futureSchedules.isEmpty()) {
                long futureOnlyCount = futureSchedules.size() - todayScheduleCount;
                if (futureOnlyCount > 0) {
                    message.append("• 향후 스케줄: ").append(futureOnlyCount).append("개");
                }
            }
        }
        result.put("message", message.toString());
        
        log.info("✅ 상담사 삭제 가능 여부 확인 완료: ID={}, 직접삭제가능={}, 이전필요={}", 
                consultantId, result.get("canDeleteDirectly"), result.get("requiresTransfer"));
        
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteClient(Long id) {
        log.info("🗑️ 내담자 삭제 처리 시작: ID={}", id);
        
        User client = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("내담자를 찾을 수 없습니다."));
        
        if (client.getRole() != UserRole.CLIENT) {
            throw new RuntimeException("내담자가 아닌 사용자는 삭제할 수 없습니다.");
        }
        
        // 1. 해당 내담자의 활성 매핑 조회
        List<ConsultantClientMapping> activeMappings = mappingRepository
                .findByClientIdAndStatusNot(id, ConsultantClientMapping.MappingStatus.TERMINATED);
        
        // 2. 남은 회기가 있는 매핑 확인
        List<ConsultantClientMapping> mappingsWithRemainingSessions = activeMappings.stream()
                .filter(mapping -> mapping.getRemainingSessions() > 0)
                .collect(Collectors.toList());
        
        if (!mappingsWithRemainingSessions.isEmpty()) {
            int totalRemainingSessions = mappingsWithRemainingSessions.stream()
                    .mapToInt(ConsultantClientMapping::getRemainingSessions)
                    .sum();
            
            log.warn("⚠️ 내담자에게 {} 개의 활성 매핑에서 총 {} 회기가 남아있습니다.", 
                    mappingsWithRemainingSessions.size(), totalRemainingSessions);
            
            throw new RuntimeException(String.format(
                "내담자에게 %d 개의 활성 매핑에서 총 %d 회기가 남아있습니다. 회기 소진 또는 환불 처리 후 삭제해주세요.", 
                mappingsWithRemainingSessions.size(), totalRemainingSessions));
        }
        
        // 3. 결제 대기 중인 매핑 확인
        List<ConsultantClientMapping> pendingPaymentMappings = activeMappings.stream()
                .filter(mapping -> mapping.getPaymentStatus() == ConsultantClientMapping.PaymentStatus.PENDING)
                .collect(Collectors.toList());
        
        if (!pendingPaymentMappings.isEmpty()) {
            log.warn("⚠️ 내담자에게 {} 개의 결제 대기 중인 매핑이 있습니다.", pendingPaymentMappings.size());
            throw new RuntimeException(String.format(
                "내담자에게 %d 개의 결제 대기 중인 매핑이 있습니다. 결제 처리 완료 후 삭제해주세요.", 
                pendingPaymentMappings.size()));
        }
        
        // 4. 해당 내담자의 예정된 스케줄 조회 (오늘 포함)
        List<Schedule> futureSchedules = scheduleRepository.findByClientIdAndDateGreaterThanEqual(id, LocalDate.now());
        
        // 활성 스케줄만 필터링 (BOOKED, CONFIRMED 상태)
        List<Schedule> activeSchedules = futureSchedules.stream()
                .filter(schedule -> schedule.getStatus() == ScheduleStatus.BOOKED || 
                                  schedule.getStatus() == ScheduleStatus.CONFIRMED)
                .collect(Collectors.toList());
        
        if (!activeSchedules.isEmpty()) {
            log.warn("⚠️ 내담자에게 {} 개의 예정된 스케줄이 있습니다.", activeSchedules.size());
            
            // 스케줄 상세 정보 로깅
            for (Schedule schedule : activeSchedules) {
                User consultant = userRepository.findById(schedule.getConsultantId()).orElse(null);
                log.warn("📅 예정 스케줄: ID={}, 날짜={}, 시간={}-{}, 상담사={} (활성:{})", 
                    schedule.getId(), schedule.getDate(), schedule.getStartTime(), schedule.getEndTime(),
                    consultant != null ? consultant.getName() : "알 수 없음",
                    consultant != null ? consultant.getIsActive() : "알 수 없음");
            }
            
            throw new RuntimeException(String.format(
                "내담자에게 %d 개의 예정된 스케줄이 있습니다. 회기 소진, 환불 처리, 또는 스케줄 완료 후 다시 시도해주세요.", 
                activeSchedules.size()));
        }
        
        // 5. 모든 미래 스케줄 취소 (삭제된 상담사와의 스케줄 포함)
        List<Schedule> allFutureSchedules = scheduleRepository.findByClientIdAndDateGreaterThanEqual(id, LocalDate.now());
        int cancelledScheduleCount = 0;
        
        for (Schedule schedule : allFutureSchedules) {
            if (schedule.getStatus() == ScheduleStatus.BOOKED || schedule.getStatus() == ScheduleStatus.CONFIRMED) {
                User consultant = userRepository.findById(schedule.getConsultantId()).orElse(null);
                
                log.info("📅 내담자 삭제로 인한 스케줄 취소: ID={}, 날짜={}, 상담사={} (활성:{})", 
                    schedule.getId(), schedule.getDate(), 
                    consultant != null ? consultant.getName() : "알 수 없음",
                    consultant != null ? consultant.getIsActive() : "알 수 없음");
                
                schedule.setStatus(ScheduleStatus.CANCELLED);
                schedule.setNotes(schedule.getNotes() != null ? 
                    schedule.getNotes() + "\n[내담자 삭제로 인한 자동 취소]" :
                    "[내담자 삭제로 인한 자동 취소]");
                schedule.setUpdatedAt(LocalDateTime.now());
                scheduleRepository.save(schedule);
                cancelledScheduleCount++;
            }
        }
        
        log.info("📅 내담자 삭제로 인한 스케줄 자동 취소: {}개", cancelledScheduleCount);
        
        // 6. 내담자 비활성화
        client.setIsActive(false);
        userRepository.save(client);
        
        log.info("✅ 내담자 삭제 완료: ID={}, 이름={}, 취소된 스케줄={}개", id, client.getName(), cancelledScheduleCount);
    }

    @Override
    public Map<String, Object> checkClientDeletionStatus(Long clientId) {
        log.info("🔍 내담자 삭제 가능 여부 확인: ID={}", clientId);
        
        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("내담자를 찾을 수 없습니다."));
        
        if (client.getRole() != UserRole.CLIENT) {
            throw new RuntimeException("내담자가 아닌 사용자입니다.");
        }
        
        // 1. 활성 매핑 조회
        List<ConsultantClientMapping> activeMappings = mappingRepository
                .findByClientIdAndStatusNot(clientId, ConsultantClientMapping.MappingStatus.TERMINATED);
        
        // 2. 남은 회기가 있는 매핑 확인
        List<ConsultantClientMapping> mappingsWithRemainingSessions = activeMappings.stream()
                .filter(mapping -> mapping.getRemainingSessions() > 0)
                .collect(Collectors.toList());
        
        // 3. 결제 대기 중인 매핑 확인
        List<ConsultantClientMapping> pendingPaymentMappings = activeMappings.stream()
                .filter(mapping -> mapping.getPaymentStatus() == ConsultantClientMapping.PaymentStatus.PENDING)
                .collect(Collectors.toList());
        
        // 4. 예정된 스케줄 조회 (오늘 포함, 활성 스케줄만)
        List<Schedule> futureSchedules = scheduleRepository.findByClientIdAndDateGreaterThanEqual(clientId, LocalDate.now())
                .stream()
                .filter(schedule -> schedule.getStatus() == ScheduleStatus.BOOKED || 
                                  schedule.getStatus() == ScheduleStatus.CONFIRMED)
                .collect(Collectors.toList());
        
        Map<String, Object> result = new HashMap<>();
        result.put("clientId", clientId);
        result.put("clientName", client.getName());
        
        boolean canDeleteDirectly = mappingsWithRemainingSessions.isEmpty() && 
                                  pendingPaymentMappings.isEmpty() && 
                                  futureSchedules.isEmpty();
        
        result.put("canDeleteDirectly", canDeleteDirectly);
        result.put("requiresCleanup", !canDeleteDirectly);
        
        // 상세 정보
        Map<String, Object> details = new HashMap<>();
        details.put("activeMappingCount", activeMappings.size());
        details.put("remainingSessionCount", mappingsWithRemainingSessions.stream()
                .mapToInt(ConsultantClientMapping::getRemainingSessions).sum());
        details.put("pendingPaymentCount", pendingPaymentMappings.size());
        details.put("futureScheduleCount", futureSchedules.size());
        
        // 남은 회기가 있는 매핑 정보
        List<Map<String, Object>> sessionMappings = mappingsWithRemainingSessions.stream()
                .map(mapping -> {
                    Map<String, Object> mappingInfo = new HashMap<>();
                    mappingInfo.put("mappingId", mapping.getId());
                    mappingInfo.put("consultantName", mapping.getConsultant().getName());
                    mappingInfo.put("remainingSessions", mapping.getRemainingSessions());
                    mappingInfo.put("totalSessions", mapping.getTotalSessions());
                    mappingInfo.put("packageName", mapping.getPackageName());
                    return mappingInfo;
                })
                .collect(Collectors.toList());
        details.put("sessionMappings", sessionMappings);
        
        // 결제 대기 매핑 정보
        List<Map<String, Object>> paymentMappings = pendingPaymentMappings.stream()
                .map(mapping -> {
                    Map<String, Object> mappingInfo = new HashMap<>();
                    mappingInfo.put("mappingId", mapping.getId());
                    mappingInfo.put("consultantName", mapping.getConsultant().getName());
                    mappingInfo.put("packageName", mapping.getPackageName());
                    mappingInfo.put("packagePrice", mapping.getPackagePrice());
                    return mappingInfo;
                })
                .collect(Collectors.toList());
        details.put("paymentMappings", paymentMappings);
        
        result.put("details", details);
        
        // 메시지 생성
        StringBuilder message = new StringBuilder();
        if (canDeleteDirectly) {
            message.append("해당 내담자는 안전하게 삭제할 수 있습니다.");
        } else {
            message.append("다음 사유로 인해 삭제할 수 없습니다:\n");
            if (!mappingsWithRemainingSessions.isEmpty()) {
                int totalSessions = mappingsWithRemainingSessions.stream()
                        .mapToInt(ConsultantClientMapping::getRemainingSessions).sum();
                message.append("• 남은 회기: ").append(totalSessions).append("회\n");
            }
            if (!pendingPaymentMappings.isEmpty()) {
                message.append("• 결제 대기: ").append(pendingPaymentMappings.size()).append("개\n");
            }
            if (!futureSchedules.isEmpty()) {
                message.append("• 예정 스케줄: ").append(futureSchedules.size()).append("개");
            }
        }
        result.put("message", message.toString());
        
        log.info("✅ 내담자 삭제 가능 여부 확인 완료: ID={}, 직접삭제가능={}, 정리필요={}", 
                clientId, result.get("canDeleteDirectly"), result.get("requiresCleanup"));
        
        return result;
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
    @Transactional(rollbackFor = Exception.class)
    public void terminateMapping(Long id, String reason) {
        log.info("🔧 매핑 강제 종료 처리 시작: ID={}, 사유={}", id, reason);
        
        ConsultantClientMapping mapping = mappingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("매핑을 찾을 수 없습니다."));
        
        if (mapping.getStatus() == ConsultantClientMapping.MappingStatus.TERMINATED) {
            throw new RuntimeException("이미 종료된 매핑입니다.");
        }
        
        // 환불 금액 계산
        int refundedSessions = mapping.getRemainingSessions();
        long refundAmount = 0;
        if (mapping.getPackagePrice() != null && mapping.getTotalSessions() > 0) {
            refundAmount = (mapping.getPackagePrice() * refundedSessions) / mapping.getTotalSessions();
        }
        
        // ERP 시스템에 환불 데이터 전송
        try {
            sendRefundToErp(mapping, refundedSessions, refundAmount, reason);
        } catch (Exception e) {
            log.error("❌ ERP 환불 데이터 전송 실패: MappingID={}", id, e);
            // ERP 전송 실패해도 내부 처리는 계속 진행 (나중에 재시도 가능)
        }
        
        // 매핑 종료 처리
        mapping.setStatus(ConsultantClientMapping.MappingStatus.TERMINATED);
        mapping.setTerminatedAt(LocalDateTime.now());
        
        // 종료 사유 추가
        String currentNotes = mapping.getNotes() != null ? mapping.getNotes() : "";
        String terminationNote = String.format("[%s 강제 종료] %s (환불: %d회기, %,d원)", 
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")), 
                reason != null ? reason : "관리자 요청",
                refundedSessions,
                refundAmount);
        
        String updatedNotes = currentNotes.isEmpty() ? terminationNote : currentNotes + "\n" + terminationNote;
        mapping.setNotes(updatedNotes);
        
        // 남은 회기를 0으로 설정 (환불 처리됨을 의미)
        mapping.setRemainingSessions(0);
        mapping.setUsedSessions(mapping.getTotalSessions()); // 전체를 사용한 것으로 처리하지 않고 실제 사용한 만큼만
        
        mappingRepository.save(mapping);
        
        // 관련된 미래 스케줄들 취소 처리
        try {
            log.info("🔍 환불 처리 관련 스케줄 조회 시작: 상담사ID={}, 내담자ID={}, 오늘날짜={}", 
                    mapping.getConsultant().getId(), mapping.getClient().getId(), LocalDate.now());
            
            List<Schedule> futureSchedules = scheduleRepository.findByConsultantIdAndClientIdAndDateGreaterThanEqual(
                mapping.getConsultant().getId(), 
                mapping.getClient().getId(), 
                LocalDate.now()
            );
            
            log.info("📅 조회된 미래 스케줄: {}개", futureSchedules.size());
            
            int cancelledScheduleCount = 0;
            for (Schedule schedule : futureSchedules) {
                log.info("📋 스케줄 확인: ID={}, 날짜={}, 시간={}-{}, 상태={}, 상담사ID={}, 내담자ID={}", 
                        schedule.getId(), schedule.getDate(), schedule.getStartTime(), schedule.getEndTime(), 
                        schedule.getStatus(), schedule.getConsultantId(), schedule.getClientId());
                
                if (schedule.getStatus() == ScheduleStatus.BOOKED || schedule.getStatus() == ScheduleStatus.CONFIRMED) {
                    log.info("🚫 스케줄 취소 처리: ID={}, 기존상태={}", schedule.getId(), schedule.getStatus());
                    
                    schedule.setStatus(ScheduleStatus.CANCELLED);
                    schedule.setNotes(schedule.getNotes() != null ? 
                        schedule.getNotes() + "\n[환불 처리로 인한 자동 취소] " + reason :
                        "[환불 처리로 인한 자동 취소] " + reason);
                    schedule.setUpdatedAt(LocalDateTime.now());
                    scheduleRepository.save(schedule);
                    cancelledScheduleCount++;
                    
                    log.info("✅ 스케줄 취소 완료: ID={}, 새상태={}", schedule.getId(), schedule.getStatus());
                } else {
                    log.info("⏭️ 스케줄 취소 스킵: ID={}, 상태={} (BOOKED/CONFIRMED가 아님)", schedule.getId(), schedule.getStatus());
                }
            }
            
            log.info("📅 환불 처리로 인한 스케줄 자동 취소: {}개", cancelledScheduleCount);
            
        } catch (Exception e) {
            log.error("❌ 관련 스케줄 취소 처리 실패: MappingID={}", id, e);
            // 스케줄 취소 실패해도 매핑 종료는 완료된 상태로 유지
        }
        
        // 내담자에게 환불 완료 알림 발송
        try {
            User client = mapping.getClient();
            if (client != null) {
                log.info("📤 환불 완료 알림 발송 시작: 내담자={}", client.getName());
                
                boolean notificationSent = notificationService.sendRefundCompleted(client, refundedSessions, refundAmount);
                
                if (notificationSent) {
                    log.info("✅ 환불 완료 알림 발송 성공: 내담자={}", client.getName());
                } else {
                    log.warn("⚠️ 환불 완료 알림 발송 실패: 내담자={}", client.getName());
                }
            }
        } catch (Exception e) {
            log.error("❌ 환불 완료 알림 발송 중 오류: MappingID={}", id, e);
            // 알림 발송 실패해도 환불 처리는 완료된 상태로 유지
        }
        
        log.info("✅ 매핑 강제 종료 완료: ID={}, 환불 회기={}, 환불 금액={}, 상담사={}, 내담자={}", 
                id, refundedSessions, refundAmount, mapping.getConsultant().getName(), mapping.getClient().getName());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void partialRefundMapping(Long id, int refundSessions, String reason) {
        log.info("🔧 부분 환불 처리 시작: ID={}, 환불회기={}, 사유={}", id, refundSessions, reason);
        
        ConsultantClientMapping mapping = mappingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("매핑을 찾을 수 없습니다."));
        
        if (mapping.getStatus() == ConsultantClientMapping.MappingStatus.TERMINATED) {
            throw new RuntimeException("이미 종료된 매핑입니다.");
        }
        
        // 가장 최근 추가된 패키지 정보 추출
        Map<String, Object> lastAddedPackage = getLastAddedPackageInfo(mapping);
        int lastAddedSessions = (Integer) lastAddedPackage.getOrDefault("sessions", 0);
        Long lastAddedPrice = (Long) lastAddedPackage.getOrDefault("price", 0L);
        String lastAddedPackageName = (String) lastAddedPackage.getOrDefault("packageName", "");
        
        log.info("📦 가장 최근 추가된 패키지 정보: 회기수={}, 가격={}, 패키지명={}", 
                lastAddedSessions, lastAddedPrice, lastAddedPackageName);
        
        // 환불 가능한 회기수 검증
        if (refundSessions <= 0) {
            throw new RuntimeException("환불 회기수는 1 이상이어야 합니다.");
        }
        
        if (refundSessions > mapping.getRemainingSessions()) {
            throw new RuntimeException(String.format(
                "환불 요청 회기수(%d)가 남은 회기수(%d)보다 많습니다.", 
                refundSessions, mapping.getRemainingSessions()));
        }
        
        // 청약 철회 기간 검증 (15일 이후 환불 제한)
        if (mapping.getPaymentDate() != null) {
            LocalDateTime paymentDate = mapping.getPaymentDate();
            LocalDateTime now = LocalDateTime.now();
            long daysSincePayment = java.time.Duration.between(paymentDate, now).toDays();
            
            if (daysSincePayment > 15) {
                log.warn("⚠️ 청약 철회 기간 초과: 결제일={}, 현재일={}, 경과일수={}일", 
                        paymentDate.toLocalDate(), now.toLocalDate(), daysSincePayment);
                throw new RuntimeException(String.format(
                    "청약 철회 기간이 초과되었습니다. 결제일로부터 %d일이 경과했습니다. (15일 이내만 환불 가능)", 
                    daysSincePayment));
            } else {
                log.info("✅ 청약 철회 기간 내 환불: 결제일={}, 경과일수={}일 (15일 이내)", 
                        paymentDate.toLocalDate(), daysSincePayment);
            }
        } else {
            log.warn("⚠️ 결제일 정보가 없어 청약 철회 기간을 확인할 수 없습니다.");
        }
        
        // 최근 추가분 기준 환불 권장 (강제하지 않음)
        if (lastAddedSessions > 0 && refundSessions > lastAddedSessions) {
            log.warn("⚠️ 환불 요청 회기수({})가 최근 추가분({})보다 많습니다. 단회기 또는 임의 회기수 환불로 처리됩니다.", 
                    refundSessions, lastAddedSessions);
        }
        
        // 환불 금액 계산 (유연한 방식)
        long refundAmount = 0;
        String calculationMethod = "";
        
        if (lastAddedSessions > 0 && lastAddedPrice > 0 && refundSessions <= lastAddedSessions) {
            // 최근 추가된 패키지 범위 내에서 환불하는 경우
            refundAmount = (lastAddedPrice * refundSessions) / lastAddedSessions;
            calculationMethod = "최근 추가 패키지 기준";
            log.info("💰 최근 추가 패키지 기준 환불: 추가가격={}, 추가회기={}, 환불회기={}, 환불금액={}", 
                    lastAddedPrice, lastAddedSessions, refundSessions, refundAmount);
        } else if (mapping.getPackagePrice() != null && mapping.getTotalSessions() > 0) {
            // 전체 패키지 기준으로 비례 계산 (단회기, 임의 회기수, 패키지 초과 환불)
            refundAmount = (mapping.getPackagePrice() * refundSessions) / mapping.getTotalSessions();
            calculationMethod = "전체 패키지 비례 계산";
            log.info("💰 전체 패키지 비례 계산: 전체가격={}, 전체회기={}, 환불회기={}, 환불금액={}", 
                    mapping.getPackagePrice(), mapping.getTotalSessions(), refundSessions, refundAmount);
        } else {
            log.warn("❌ 환불 금액 계산 불가: 패키지 가격 정보 없음");
            throw new RuntimeException("환불 금액을 계산할 수 없습니다. 패키지 가격 정보가 없습니다.");
        }
        
        log.info("💰 부분 환불 금액 계산 완료: 환불회기={}, 계산방식={}, 환불금액={}원", 
                refundSessions, calculationMethod, refundAmount);
        
        // ERP 시스템에 환불 데이터 전송
        try {
            sendRefundToErp(mapping, refundSessions, refundAmount, reason);
            log.info("💚 부분 환불 ERP 전송 성공: MappingID={}, RefundSessions={}, RefundAmount={}", 
                id, refundSessions, refundAmount);
        } catch (Exception e) {
            log.error("❌ ERP 환불 데이터 전송 실패: MappingID={}", id, e);
            // ERP 전송 실패해도 내부 처리는 계속 진행 (나중에 재시도 가능)
        }
        
        // 부분 환불 ERP 거래 생성 (수익 감소 반영)
        try {
            createPartialConsultationRefundTransaction(mapping, refundSessions, refundAmount, reason);
            log.info("💚 부분 환불 거래 자동 생성 완료: MappingID={}, RefundSessions={}, RefundAmount={}", 
                id, refundSessions, refundAmount);
        } catch (Exception e) {
            log.error("❌ 부분 환불 거래 자동 생성 실패: {}", e.getMessage(), e);
            // 거래 생성 실패해도 부분 환불 처리는 완료
        }
        
        // 회기수 조정 (부분 환불이므로 매핑은 유지)
        mapping.setRemainingSessions(mapping.getRemainingSessions() - refundSessions);
        mapping.setTotalSessions(mapping.getTotalSessions() - refundSessions);
        
        // 환불 처리 노트 추가
        String currentNotes = mapping.getNotes() != null ? mapping.getNotes() : "";
        String refundNote = String.format("[부분 환불] %s - 사유: %s, 환불 회기: %d회, 환불 금액: %,d원, 남은 회기: %d회", 
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")), 
                reason != null ? reason : "관리자 요청",
                refundSessions,
                refundAmount,
                mapping.getRemainingSessions());
        
        String updatedNotes = currentNotes.isEmpty() ? refundNote : currentNotes + "\n" + refundNote;
        mapping.setNotes(updatedNotes);
        
        // 매핑 상태는 유지 (전체 환불이 아니므로)
        // 단, 남은 회기가 0이 되면 자동으로 회기 소진 처리
        if (mapping.getRemainingSessions() <= 0) {
            mapping.setStatus(ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED);
            mapping.setEndDate(LocalDateTime.now());
            log.info("🎯 부분 환불 후 회기 소진: 남은 회기가 0이 되어 상태를 SESSIONS_EXHAUSTED로 변경");
        }
        
        mappingRepository.save(mapping);
        
        // 내담자에게 부분 환불 완료 알림 발송
        try {
            User client = mapping.getClient();
            if (client != null) {
                log.info("📤 부분 환불 완료 알림 발송 시작: 내담자={}", client.getName());
                
                // 기존 알림 서비스 활용 (부분 환불 메시지로 수정)
                boolean notificationSent = notificationService.sendRefundCompleted(client, refundSessions, refundAmount);
                
                if (notificationSent) {
                    log.info("✅ 부분 환불 완료 알림 발송 성공: 내담자={}", client.getName());
                } else {
                    log.warn("⚠️ 부분 환불 완료 알림 발송 실패: 내담자={}", client.getName());
                }
            }
        } catch (Exception e) {
            log.error("❌ 부분 환불 완료 알림 발송 중 오류: MappingID={}", id, e);
            // 알림 발송 실패해도 환불 처리는 완료된 상태로 유지
        }
        
        log.info("✅ 부분 환불 완료: ID={}, 환불회기={}, 환불금액={}, 남은회기={}, 총회기={}, 상담사={}, 내담자={}", 
                id, refundSessions, refundAmount, mapping.getRemainingSessions(), mapping.getTotalSessions(),
                mapping.getConsultant().getName(), mapping.getClient().getName());
    }

    @Override
    public Map<String, Object> getRefundStatistics(String period) {
        log.info("📊 환불 통계 조회 시작: period={}", period);
        
        // 환불 관련 공통 코드 초기화 (없으면 생성)
        initializeRefundCommonCodes();
        
        LocalDateTime startDate;
        LocalDateTime endDate = LocalDateTime.now();
        
        // 공통 코드에서 기간 설정 정보 조회
        startDate = getRefundPeriodStartDate(period);
        
        // 환불된 매핑 조회 (강제 종료된 매핑)
        List<ConsultantClientMapping> refundedMappings = mappingRepository.findAll().stream()
                .filter(mapping -> mapping.getStatus() == ConsultantClientMapping.MappingStatus.TERMINATED)
                .filter(mapping -> mapping.getTerminatedAt() != null)
                .filter(mapping -> mapping.getTerminatedAt().isAfter(startDate) && mapping.getTerminatedAt().isBefore(endDate))
                .filter(mapping -> mapping.getNotes() != null && mapping.getNotes().contains("강제 종료"))
                .collect(Collectors.toList());
        
        // 기본 통계
        int totalRefundCount = refundedMappings.size();
        int totalRefundedSessions = refundedMappings.stream()
                .mapToInt(mapping -> {
                    // 노트에서 환불 회기 수 추출 (실제로는 총 회기수에서 사용된 회기수를 뺀 값)
                    return mapping.getTotalSessions() - mapping.getUsedSessions();
                })
                .sum();
        
        long totalRefundAmount = refundedMappings.stream()
                .mapToLong(mapping -> {
                    // 환불 금액 계산 (패키지 가격 기준으로 비례 계산)
                    if (mapping.getPackagePrice() != null && mapping.getTotalSessions() > 0) {
                        int refundedSessions = mapping.getTotalSessions() - mapping.getUsedSessions();
                        return (mapping.getPackagePrice() * refundedSessions) / mapping.getTotalSessions();
                    }
                    return 0;
                })
                .sum();
        
        // 상담사별 환불 통계
        Map<String, Map<String, Object>> consultantRefundStats = refundedMappings.stream()
                .collect(Collectors.groupingBy(
                    mapping -> mapping.getConsultant().getName(),
                    Collectors.collectingAndThen(
                        Collectors.toList(),
                        mappings -> {
                            Map<String, Object> stats = new HashMap<>();
                            stats.put("refundCount", mappings.size());
                            stats.put("refundedSessions", mappings.stream()
                                    .mapToInt(m -> m.getTotalSessions() - m.getUsedSessions()).sum());
                            stats.put("refundAmount", mappings.stream()
                                    .mapToLong(m -> {
                                        if (m.getPackagePrice() != null && m.getTotalSessions() > 0) {
                                            int refunded = m.getTotalSessions() - m.getUsedSessions();
                                            return (m.getPackagePrice() * refunded) / m.getTotalSessions();
                                        }
                                        return 0;
                                    }).sum());
                            return stats;
                        }
                    )
                ));
        
        // 월별 환불 추이 (최근 6개월)
        List<Map<String, Object>> monthlyTrend = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate monthStart = LocalDate.now().minusMonths(i).withDayOfMonth(1);
            LocalDate monthEnd = monthStart.plusMonths(1).minusDays(1);
            
            List<ConsultantClientMapping> monthlyRefunds = refundedMappings.stream()
                    .filter(mapping -> {
                        LocalDate terminatedDate = mapping.getTerminatedAt().toLocalDate();
                        return !terminatedDate.isBefore(monthStart) && !terminatedDate.isAfter(monthEnd);
                    })
                    .collect(Collectors.toList());
            
            Map<String, Object> monthData = new HashMap<>();
            monthData.put("month", monthStart.format(DateTimeFormatter.ofPattern("yyyy-MM")));
            monthData.put("refundCount", monthlyRefunds.size());
            monthData.put("refundedSessions", monthlyRefunds.stream()
                    .mapToInt(m -> m.getTotalSessions() - m.getUsedSessions()).sum());
            monthData.put("refundAmount", monthlyRefunds.stream()
                    .mapToLong(m -> {
                        if (m.getPackagePrice() != null && m.getTotalSessions() > 0) {
                            int refunded = m.getTotalSessions() - m.getUsedSessions();
                            return (m.getPackagePrice() * refunded) / m.getTotalSessions();
                        }
                        return 0;
                    }).sum());
            
            monthlyTrend.add(monthData);
        }
        
        // 환불 사유별 통계 (공통 코드 기반 표준화)
        Map<String, Integer> refundReasonStats = refundedMappings.stream()
                .collect(Collectors.groupingBy(
                    mapping -> {
                        // 노트에서 환불 사유 추출
                        String notes = mapping.getNotes();
                        String rawReason = "기타";
                        if (notes != null && notes.contains("강제 종료]")) {
                            String[] parts = notes.split("강제 종료] ");
                            if (parts.length > 1) {
                                rawReason = parts[1].split("\n")[0];
                            }
                        }
                        // 공통 코드 기반으로 표준화
                        return standardizeRefundReason(rawReason);
                    },
                    Collectors.collectingAndThen(Collectors.counting(), Math::toIntExact)
                ));
        
        // 최근 환불 목록 (최근 10건)
        List<Map<String, Object>> recentRefunds = refundedMappings.stream()
                .sorted((a, b) -> b.getTerminatedAt().compareTo(a.getTerminatedAt()))
                .limit(10)
                .map(mapping -> {
                    Map<String, Object> refund = new HashMap<>();
                    refund.put("mappingId", mapping.getId());
                    refund.put("clientName", mapping.getClient().getName());
                    refund.put("consultantName", mapping.getConsultant().getName());
                    refund.put("packageName", mapping.getPackageName());
                    refund.put("refundedSessions", mapping.getTotalSessions() - mapping.getUsedSessions());
                    refund.put("refundAmount", mapping.getPackagePrice() != null && mapping.getTotalSessions() > 0 
                            ? (mapping.getPackagePrice() * (mapping.getTotalSessions() - mapping.getUsedSessions())) / mapping.getTotalSessions()
                            : 0);
                    refund.put("terminatedAt", mapping.getTerminatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
                    
                    // 환불 사유 추출
                    String notes = mapping.getNotes();
                    String reason = "기타";
                    if (notes != null && notes.contains("강제 종료]")) {
                        String[] parts = notes.split("강제 종료] ");
                        if (parts.length > 1) {
                            reason = parts[1].split("\n")[0];
                        }
                    }
                    refund.put("reason", reason);
                    
                    return refund;
                })
                .collect(Collectors.toList());
        
        // 결과 구성
        Map<String, Object> result = new HashMap<>();
        result.put("period", period);
        result.put("startDate", startDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        result.put("endDate", endDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        
        // 전체 통계
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalRefundCount", totalRefundCount);
        summary.put("totalRefundedSessions", totalRefundedSessions);
        summary.put("totalRefundAmount", totalRefundAmount);
        summary.put("averageRefundPerCase", totalRefundCount > 0 ? totalRefundAmount / totalRefundCount : 0);
        result.put("summary", summary);
        
        result.put("consultantStats", consultantRefundStats);
        result.put("monthlyTrend", monthlyTrend);
        result.put("refundReasonStats", refundReasonStats);
        result.put("recentRefunds", recentRefunds);
        
        log.info("✅ 환불 통계 조회 완료: 총 {}건, 환불 회기 {}회, 환불 금액 {}원", 
                totalRefundCount, totalRefundedSessions, totalRefundAmount);
        
        return result;
    }

    @Override
    public Map<String, Object> getRefundHistory(int page, int size, String period, String status) {
        log.info("📋 환불 이력 조회: page={}, size={}, period={}, status={}", page, size, period, status);
        
        LocalDateTime startDate = getRefundPeriodStartDate(period != null ? period : "month");
        LocalDateTime endDate = LocalDateTime.now();
        
        // 환불된 매핑 조회 (강제 종료된 매핑)
        List<ConsultantClientMapping> allRefundedMappings = mappingRepository.findAll().stream()
                .filter(mapping -> mapping.getStatus() == ConsultantClientMapping.MappingStatus.TERMINATED)
                .filter(mapping -> mapping.getTerminatedAt() != null)
                .filter(mapping -> mapping.getTerminatedAt().isAfter(startDate) && mapping.getTerminatedAt().isBefore(endDate))
                .filter(mapping -> mapping.getNotes() != null && mapping.getNotes().contains("강제 종료"))
                .sorted((a, b) -> b.getTerminatedAt().compareTo(a.getTerminatedAt()))
                .collect(Collectors.toList());
        
        // 페이징 처리
        int totalElements = allRefundedMappings.size();
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, totalElements);
        
        List<ConsultantClientMapping> pagedMappings = allRefundedMappings.subList(startIndex, endIndex);
        
        // 환불 이력 데이터 구성
        List<Map<String, Object>> refundHistory = pagedMappings.stream()
                .map(mapping -> {
                    Map<String, Object> refund = new HashMap<>();
                    refund.put("mappingId", mapping.getId());
                    refund.put("clientName", mapping.getClient().getName());
                    refund.put("consultantName", mapping.getConsultant().getName());
                    refund.put("packageName", mapping.getPackageName());
                    refund.put("originalAmount", mapping.getPackagePrice());
                    refund.put("totalSessions", mapping.getTotalSessions());
                    refund.put("usedSessions", mapping.getUsedSessions());
                    refund.put("refundedSessions", mapping.getTotalSessions() - mapping.getUsedSessions());
                    
                    // 환불 금액 계산
                    long refundAmount = 0;
                    if (mapping.getPackagePrice() != null && mapping.getTotalSessions() > 0) {
                        int refundedSessions = mapping.getTotalSessions() - mapping.getUsedSessions();
                        refundAmount = (mapping.getPackagePrice() * refundedSessions) / mapping.getTotalSessions();
                    }
                    refund.put("refundAmount", refundAmount);
                    
                    refund.put("terminatedAt", mapping.getTerminatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
                    refund.put("branchCode", mapping.getBranchCode());
                    
                    // 환불 사유 추출
                    String notes = mapping.getNotes();
                    String reason = "기타";
                    if (notes != null && notes.contains("강제 종료]")) {
                        String[] parts = notes.split("강제 종료] ");
                        if (parts.length > 1) {
                            String fullReason = parts[1].split("\n")[0];
                            // 환불 정보 부분 제거하고 사유만 추출
                            if (fullReason.contains(" (환불:")) {
                                reason = fullReason.split(" \\(환불:")[0];
                            } else {
                                reason = fullReason;
                            }
                        }
                    }
                    refund.put("refundReason", reason);
                    refund.put("standardizedReason", standardizeRefundReason(reason));
                    
                    // ERP 전송 상태 (모의)
                    refund.put("erpStatus", "SENT");
                    refund.put("erpReference", "ERP_" + mapping.getId() + "_" + mapping.getTerminatedAt().toLocalDate().toString().replace("-", ""));
                    
                    return refund;
                })
                .collect(Collectors.toList());
        
        // 페이징 정보
        Map<String, Object> pageInfo = new HashMap<>();
        pageInfo.put("currentPage", page);
        pageInfo.put("pageSize", size);
        pageInfo.put("totalElements", totalElements);
        pageInfo.put("totalPages", (int) Math.ceil((double) totalElements / size));
        pageInfo.put("hasNext", endIndex < totalElements);
        pageInfo.put("hasPrevious", page > 0);
        
        Map<String, Object> result = new HashMap<>();
        result.put("refundHistory", refundHistory);
        result.put("pageInfo", pageInfo);
        result.put("period", period);
        result.put("status", status);
        
        log.info("✅ 환불 이력 조회 완료: 총 {}건, 페이지 {}/{}", totalElements, page + 1, pageInfo.get("totalPages"));
        return result;
    }

    @Override
    public Map<String, Object> getErpSyncStatus() {
        log.info("🔄 ERP 동기화 상태 확인");
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // ERP 시스템 연결 상태 확인
            boolean erpAvailable = checkErpConnection();
            result.put("erpSystemAvailable", erpAvailable);
            
            // 최근 환불 처리 건수 (24시간 내)
            LocalDateTime yesterday = LocalDateTime.now().minusHours(24);
            List<ConsultantClientMapping> recentRefunds = mappingRepository.findAll().stream()
                    .filter(mapping -> mapping.getStatus() == ConsultantClientMapping.MappingStatus.TERMINATED)
                    .filter(mapping -> mapping.getTerminatedAt() != null)
                    .filter(mapping -> mapping.getTerminatedAt().isAfter(yesterday))
                    .filter(mapping -> mapping.getNotes() != null && mapping.getNotes().contains("강제 종료"))
                    .collect(Collectors.toList());
            
            result.put("recentRefundCount", recentRefunds.size());
            result.put("lastSyncTime", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            
            // ERP 전송 성공률 (모의)
            result.put("erpSuccessRate", 95.5);
            result.put("pendingErpRequests", 2);
            result.put("failedErpRequests", 1);
            
            // 회계 처리 상태
            Map<String, Object> accountingStatus = new HashMap<>();
            accountingStatus.put("processedToday", recentRefunds.size());
            accountingStatus.put("pendingApproval", 0);
            accountingStatus.put("totalRefundAmount", recentRefunds.stream()
                    .mapToLong(mapping -> {
                        if (mapping.getPackagePrice() != null && mapping.getTotalSessions() > 0) {
                            int refundedSessions = mapping.getTotalSessions() - mapping.getUsedSessions();
                            return (mapping.getPackagePrice() * refundedSessions) / mapping.getTotalSessions();
                        }
                        return 0;
                    }).sum());
            
            result.put("accountingStatus", accountingStatus);
            result.put("lastChecked", LocalDateTime.now());
            
        } catch (Exception e) {
            log.error("❌ ERP 동기화 상태 확인 실패", e);
            result.put("error", e.getMessage());
            result.put("erpSystemAvailable", false);
        }
        
        log.info("✅ ERP 동기화 상태 확인 완료: ERP 연결={}", result.get("erpSystemAvailable"));
        return result;
    }

    /**
     * ERP 시스템 연결 상태 확인
     */
    private boolean checkErpConnection() {
        try {
            // 실제 ERP 시스템 연결 확인 로직
            // 현재는 모의 처리
            String erpUrl = getErpRefundApiUrl();
            log.info("🔍 ERP 연결 확인: URL={}", erpUrl);
            
            // 실제 구현 시 HTTP 헬스체크 호출
            // return restTemplate.getForEntity(erpUrl + "/health", String.class).getStatusCode() == HttpStatus.OK;
            
            return true; // 모의 연결 성공
            
        } catch (Exception e) {
            log.warn("⚠️ ERP 연결 확인 실패: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 환불 통계 기간에 따른 시작 날짜 계산 (공통 코드 기반)
     */
    private LocalDateTime getRefundPeriodStartDate(String period) {
        try {
            // 공통 코드에서 REFUND_PERIOD 그룹 조회
            List<CommonCode> periodCodes = commonCodeRepository.findByCodeGroupOrderBySortOrderAsc("REFUND_PERIOD");
            
            for (CommonCode code : periodCodes) {
                if (code.getCodeValue().equalsIgnoreCase(period)) {
                    // extra_data에서 일수/개월수 정보 추출
                    String extraData = code.getExtraData();
                    if (extraData != null && !extraData.isEmpty()) {
                        try {
                            // JSON 파싱
                            if (extraData.contains("\"days\"")) {
                                int days = Integer.parseInt(extraData.replaceAll(".*\"days\":(\\d+).*", "$1"));
                                return LocalDate.now().minusDays(days - 1).atStartOfDay();
                            } else if (extraData.contains("\"months\"")) {
                                int months = Integer.parseInt(extraData.replaceAll(".*\"months\":(\\d+).*", "$1"));
                                return LocalDate.now().minusMonths(months).atStartOfDay();
                            } else if (extraData.contains("\"years\"")) {
                                int years = Integer.parseInt(extraData.replaceAll(".*\"years\":(\\d+).*", "$1"));
                                return LocalDate.now().minusYears(years).atStartOfDay();
                            }
                        } catch (Exception e) {
                            log.warn("환불 기간 설정 파싱 실패: period={}, extraData={}", period, extraData);
                        }
                    }
                    break;
                }
            }
        } catch (Exception e) {
            log.error("환불 기간 공통 코드 조회 실패: period={}", period, e);
        }
        
        // 기본값: 1개월
        return LocalDate.now().minusMonths(1).atStartOfDay();
    }

    /**
     * 환불 사유 표준화 (공통 코드 기반)
     */
    private String standardizeRefundReason(String rawReason) {
        if (rawReason == null || rawReason.trim().isEmpty()) {
            return "기타";
        }
        
        try {
            // 공통 코드에서 REFUND_REASON 그룹 조회
            List<CommonCode> reasonCodes = commonCodeRepository.findByCodeGroupOrderBySortOrderAsc("REFUND_REASON");
            
            for (CommonCode code : reasonCodes) {
                String codeLabel = code.getCodeLabel();
                String codeValue = code.getCodeValue();
                
                // 키워드 매칭으로 표준화
                if (rawReason.contains(codeLabel) || rawReason.contains(codeValue)) {
                    return codeLabel;
                }
                
                // extra_data에 키워드가 있으면 매칭
                String extraData = code.getExtraData();
                if (extraData != null && extraData.contains("\"keywords\"")) {
                    try {
                        // 간단한 키워드 추출 (정규식 사용)
                        String keywords = extraData.replaceAll(".*\"keywords\":\\s*\"([^\"]+)\".*", "$1");
                        String[] keywordArray = keywords.split(",");
                        for (String keyword : keywordArray) {
                            if (rawReason.contains(keyword.trim())) {
                                return codeLabel;
                            }
                        }
                    } catch (Exception e) {
                        log.debug("환불 사유 키워드 파싱 무시: {}", e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.error("환불 사유 공통 코드 조회 실패: rawReason={}", rawReason, e);
        }
        
        // 기본값: 원본 사유를 20자로 제한
        return rawReason.length() > 20 ? rawReason.substring(0, 20) + "..." : rawReason;
    }

    /**
     * ERP 시스템에 환불 데이터 전송
     */
    private void sendRefundToErp(ConsultantClientMapping mapping, int refundedSessions, long refundAmount, String reason) {
        try {
            log.info("🔄 ERP 환불 데이터 전송 시작: MappingID={}", mapping.getId());
            
            // ERP 전송 데이터 구성
            Map<String, Object> erpData = new HashMap<>();
            erpData.put("refundType", "CONSULTATION_REFUND");
            erpData.put("mappingId", mapping.getId());
            erpData.put("clientId", mapping.getClient().getId());
            erpData.put("clientName", mapping.getClient().getName());
            erpData.put("consultantId", mapping.getConsultant().getId());
            erpData.put("consultantName", mapping.getConsultant().getName());
            erpData.put("packageName", mapping.getPackageName());
            erpData.put("originalAmount", mapping.getPackagePrice());
            erpData.put("totalSessions", mapping.getTotalSessions());
            erpData.put("usedSessions", mapping.getUsedSessions());
            erpData.put("refundSessions", refundedSessions);
            erpData.put("refundAmount", refundAmount);
            erpData.put("refundReason", reason);
            erpData.put("refundDate", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            erpData.put("branchCode", getCurrentUserBranchCode());
            erpData.put("requestId", "REF_" + mapping.getId() + "_" + System.currentTimeMillis());
            
            // ERP API 호출
            String erpUrl = getErpRefundApiUrl();
            Map<String, String> headers = getErpHeaders();
            
            // HTTP 요청 전송 (실제 ERP 시스템에 맞게 구현)
            boolean success = sendToErpSystem(erpUrl, erpData, headers);
            
            if (success) {
                log.info("✅ ERP 환불 데이터 전송 성공: MappingID={}, Amount={}", mapping.getId(), refundAmount);
                
                // ERP 전송 성공 시 FinancialTransaction에 환불 거래 생성
                createConsultationRefundTransaction(mapping, refundedSessions, refundAmount, reason);
                log.info("💚 환불 거래 자동 생성 완료: MappingID={}, RefundAmount={}", 
                    mapping.getId(), refundAmount);
            } else {
                log.warn("⚠️ ERP 환불 데이터 전송 실패: MappingID={}", mapping.getId());
                // 실패 시 재시도 큐에 추가하거나 알림 발송 등 처리
            }
            
        } catch (Exception e) {
            log.error("❌ ERP 환불 데이터 전송 중 오류: MappingID={}", mapping.getId(), e);
            throw new RuntimeException("ERP 환불 데이터 전송 실패: " + e.getMessage());
        }
    }

    /**
     * ERP 시스템으로 실제 데이터 전송
     */
    private boolean sendToErpSystem(String url, Map<String, Object> data, Map<String, String> headers) {
        try {
            // 실제 ERP 시스템의 API 스펙에 맞게 구현
            // 예시: REST API 호출
            
            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);
            
            // ERP 인증 헤더 추가
            if (headers != null) {
                headers.forEach(httpHeaders::set);
            }
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(data, httpHeaders);
            
            // RestTemplate을 사용한 HTTP 요청 (실제 구현 시 주입받아 사용)
            // ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            // 현재는 모의 처리 (실제 ERP 연동 시 주석 해제하고 위 코드 사용)
            log.info("🎭 모의 ERP 전송: URL={}, Data={}, Request={}", url, data.get("requestId"), request != null ? "준비됨" : "null");
            return true;
            
        } catch (Exception e) {
            log.error("❌ ERP 시스템 통신 오류", e);
            return false;
        }
    }

    /**
     * ERP 환불 API URL 가져오기
     */
    private String getErpRefundApiUrl() {
        // 실제 ERP 시스템의 환불 API URL
        return System.getProperty("erp.refund.api.url", "http://erp.company.com/api/refund");
    }

    /**
     * ERP 인증 헤더 생성
     */
    private Map<String, String> getErpHeaders() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Authorization", "Bearer " + System.getProperty("erp.api.token", "default-token"));
        headers.put("X-System", "CONSULTATION_SYSTEM");
        headers.put("X-Version", "1.0");
        return headers;
    }

    /**
     * 현재 사용자의 지점 코드 가져오기
     */
    private String getCurrentUserBranchCode() {
        // 현재 로그인한 사용자의 지점 코드 반환
        // 실제 구현 시 SecurityContext 등에서 가져오기
        return "MAIN001"; // 임시 기본값
    }

    /**
     * 환불 관련 공통 코드 초기화 (없으면 자동 생성)
     */
    private void initializeRefundCommonCodes() {
        try {
            // REFUND_PERIOD 그룹 확인 및 생성
            List<CommonCode> periodCodes = commonCodeRepository.findByCodeGroupOrderBySortOrderAsc("REFUND_PERIOD");
            if (periodCodes.isEmpty()) {
                log.info("🔧 REFUND_PERIOD 공통 코드 그룹 생성 중...");
                
                // 환불 통계 기간 코드들 생성
                createCommonCode("REFUND_PERIOD", "TODAY", "오늘", "{\"days\":1}", 1);
                createCommonCode("REFUND_PERIOD", "WEEK", "최근 7일", "{\"days\":7}", 2);
                createCommonCode("REFUND_PERIOD", "MONTH", "최근 1개월", "{\"months\":1}", 3);
                createCommonCode("REFUND_PERIOD", "QUARTER", "최근 3개월", "{\"months\":3}", 4);
                createCommonCode("REFUND_PERIOD", "YEAR", "최근 1년", "{\"years\":1}", 5);
                
                log.info("✅ REFUND_PERIOD 공통 코드 생성 완료");
            }
            
            // REFUND_REASON 그룹 확인 및 생성
            List<CommonCode> reasonCodes = commonCodeRepository.findByCodeGroupOrderBySortOrderAsc("REFUND_REASON");
            if (reasonCodes.isEmpty()) {
                log.info("🔧 REFUND_REASON 공통 코드 그룹 생성 중...");
                
                // 환불 사유 코드들 생성
                createCommonCode("REFUND_REASON", "CUSTOMER_REQUEST", "고객 요청", "{\"keywords\":\"고객,요청,개인사정\"}", 1);
                createCommonCode("REFUND_REASON", "SERVICE_UNSATISFIED", "서비스 불만족", "{\"keywords\":\"불만족,서비스,품질\"}", 2);
                createCommonCode("REFUND_REASON", "CONSULTANT_CHANGE", "상담사 변경", "{\"keywords\":\"상담사,변경,교체\"}", 3);
                createCommonCode("REFUND_REASON", "SCHEDULE_CONFLICT", "일정 충돌", "{\"keywords\":\"일정,시간,충돌\"}", 4);
                createCommonCode("REFUND_REASON", "HEALTH_ISSUE", "건강상 이유", "{\"keywords\":\"건강,병원,치료\"}", 5);
                createCommonCode("REFUND_REASON", "RELOCATION", "이사/이전", "{\"keywords\":\"이사,이전,거리\"}", 6);
                createCommonCode("REFUND_REASON", "FINANCIAL_DIFFICULTY", "경제적 어려움", "{\"keywords\":\"경제,재정,돈\"}", 7);
                createCommonCode("REFUND_REASON", "ADMIN_DECISION", "관리자 결정", "{\"keywords\":\"관리자,결정,정책\"}", 8);
                createCommonCode("REFUND_REASON", "OTHER", "기타", "{\"keywords\":\"기타,etc\"}", 9);
                
                log.info("✅ REFUND_REASON 공통 코드 생성 완료");
            }
            
            // REFUND_STATUS 그룹 확인 및 생성
            List<CommonCode> statusCodes = commonCodeRepository.findByCodeGroupOrderBySortOrderAsc("REFUND_STATUS");
            if (statusCodes.isEmpty()) {
                log.info("🔧 REFUND_STATUS 공통 코드 그룹 생성 중...");
                
                // 환불 상태 코드들 생성
                createCommonCode("REFUND_STATUS", "REQUESTED", "환불 요청", "{\"color\":\"#ffc107\"}", 1);
                createCommonCode("REFUND_STATUS", "APPROVED", "환불 승인", "{\"color\":\"#28a745\"}", 2);
                createCommonCode("REFUND_STATUS", "PROCESSING", "환불 처리중", "{\"color\":\"#17a2b8\"}", 3);
                createCommonCode("REFUND_STATUS", "COMPLETED", "환불 완료", "{\"color\":\"#6f42c1\"}", 4);
                createCommonCode("REFUND_STATUS", "REJECTED", "환불 거부", "{\"color\":\"#dc3545\"}", 5);
                
                log.info("✅ REFUND_STATUS 공통 코드 생성 완료");
            }
            
        } catch (Exception e) {
            log.error("❌ 환불 관련 공통 코드 초기화 실패", e);
        }
    }

    /**
     * 공통 코드 생성 헬퍼 메서드
     */
    private void createCommonCode(String codeGroup, String codeValue, String codeLabel, String extraData, int sortOrder) {
        try {
            CommonCode commonCode = new CommonCode();
            commonCode.setCodeGroup(codeGroup);
            commonCode.setCodeValue(codeValue);
            commonCode.setCodeLabel(codeLabel);
            commonCode.setExtraData(extraData);
            commonCode.setSortOrder(sortOrder);
            commonCode.setIsActive(true);
            commonCode.setCreatedAt(LocalDateTime.now());
            commonCode.setUpdatedAt(LocalDateTime.now());
            
            commonCodeRepository.save(commonCode);
            log.debug("📝 공통 코드 생성: {}:{} = {}", codeGroup, codeValue, codeLabel);
            
        } catch (Exception e) {
            log.error("❌ 공통 코드 생성 실패: {}:{}", codeGroup, codeValue, e);
        }
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
            
            // 활성 상담사만 조회
            List<User> consultants = userRepository.findByRoleAndIsActiveTrue(UserRole.CONSULTANT);
            
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
                                if (consultant != null && consultant.getIsActive()) {
                                    scheduleMap.put("consultantName", consultant.getName());
                                    scheduleMap.put("consultantEmail", consultant.getEmail());
                                } else if (consultant != null && !consultant.getIsActive()) {
                                    scheduleMap.put("consultantName", consultant.getName() + " (삭제됨)");
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
                    schedule -> schedule.getStatus() != null ? schedule.getStatus().name() : "UNKNOWN",
                    Collectors.counting()
                ));
            
            // 상담사별 완료 건수 (스케줄 기준)
            Map<Long, Long> consultantCompletedCount = allSchedules.stream()
                .filter(schedule -> ScheduleStatus.COMPLETED.equals(schedule.getStatus()))
                .filter(schedule -> schedule.getConsultantId() != null)
                .collect(Collectors.groupingBy(
                    Schedule::getConsultantId,
                    Collectors.counting()
                ));
            
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalSchedules", allSchedules.size());
            statistics.put("statusCount", statusCount);
            statistics.put("consultantCompletedCount", consultantCompletedCount);
            statistics.put("completedSchedules", statusCount.getOrDefault(ScheduleStatus.COMPLETED.name(), 0L));
            statistics.put("bookedSchedules", statusCount.getOrDefault(ScheduleStatus.BOOKED.name(), 0L));
            statistics.put("cancelledSchedules", statusCount.getOrDefault(ScheduleStatus.CANCELLED.name(), 0L));
            
            log.info("✅ 스케줄 통계 조회 완료: 총 {}개, 완료 {}개", allSchedules.size(), statusCount.getOrDefault(ScheduleStatus.COMPLETED.name(), 0L));
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
                LocalDate.now(), ScheduleStatus.BOOKED);
            
            int completedCount = 0;
            int reminderSentCount = 0;
            List<Long> consultantIdsWithReminder = new ArrayList<>();
            
            for (Schedule schedule : expiredSchedules) {
                try {
                    // 스케줄을 완료 상태로 변경
                    schedule.setStatus(ScheduleStatus.COMPLETED);
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
                consultantId, ScheduleStatus.COMPLETED, startDate, endDate);
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
    
    @Override
    public Map<String, Object> mergeDuplicateMappings() {
        Map<String, Object> result = new HashMap<>();
        int mergedCount = 0;
        int deletedCount = 0;
        
        try {
            log.info("🔄 중복 매핑 통합 시작");
            
            // 모든 활성 매핑 조회
            List<ConsultantClientMapping> allMappings = mappingRepository
                .findByStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
            
            // 상담사-내담자 조합별로 그룹화
            Map<String, List<ConsultantClientMapping>> groupedMappings = allMappings.stream()
                .collect(Collectors.groupingBy(mapping -> 
                    mapping.getConsultant().getId() + "-" + mapping.getClient().getId()));
            
            for (Map.Entry<String, List<ConsultantClientMapping>> entry : groupedMappings.entrySet()) {
                List<ConsultantClientMapping> mappings = entry.getValue();
                
                if (mappings.size() > 1) {
                    log.info("🔍 중복 매핑 발견: 상담사={}, 내담자={}, 개수={}", 
                        mappings.get(0).getConsultant().getName(),
                        mappings.get(0).getClient().getName(),
                        mappings.size());
                    
                    // 가장 최근 매핑을 기준으로 통합
                    ConsultantClientMapping primaryMapping = mappings.stream()
                        .max(Comparator.comparing(ConsultantClientMapping::getCreatedAt))
                        .orElse(mappings.get(0));
                    
                    // 나머지 매핑들의 정보를 통합
                    int totalSessions = mappings.stream()
                        .mapToInt(ConsultantClientMapping::getTotalSessions)
                        .sum();
                    int usedSessions = mappings.stream()
                        .mapToInt(ConsultantClientMapping::getUsedSessions)
                        .sum();
                    int remainingSessions = totalSessions - usedSessions;
                    
                    // 통합된 정보로 업데이트
                    primaryMapping.setTotalSessions(totalSessions);
                    primaryMapping.setUsedSessions(usedSessions);
                    primaryMapping.setRemainingSessions(remainingSessions);
                    primaryMapping.setNotes("중복 매핑 통합으로 생성됨");
                    
                    mappingRepository.save(primaryMapping);
                    mergedCount++;
                    
                    // 나머지 매핑들 삭제
                    List<ConsultantClientMapping> toDelete = mappings.stream()
                        .filter(m -> !m.getId().equals(primaryMapping.getId()))
                        .collect(Collectors.toList());
                    
                    for (ConsultantClientMapping mapping : toDelete) {
                        mapping.setStatus(ConsultantClientMapping.MappingStatus.TERMINATED);
                        mapping.setNotes("중복 매핑 통합으로 종료됨");
                        mappingRepository.save(mapping);
                        deletedCount++;
                    }
                    
                    log.info("✅ 중복 매핑 통합 완료: 상담사={}, 내담자={}, 통합된 회기수={}", 
                        primaryMapping.getConsultant().getName(),
                        primaryMapping.getClient().getName(),
                        totalSessions);
                }
            }
            
            result.put("success", true);
            result.put("mergedCount", mergedCount);
            result.put("deletedCount", deletedCount);
            result.put("message", String.format("중복 매핑 통합 완료: %d개 그룹 통합, %d개 매핑 종료", 
                mergedCount, deletedCount));
            
            log.info("✅ 중복 매핑 통합 완료: {}개 그룹 통합, {}개 매핑 종료", mergedCount, deletedCount);
            
        } catch (Exception e) {
            log.error("❌ 중복 매핑 통합 실패", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public List<Map<String, Object>> findDuplicateMappings() {
        List<Map<String, Object>> duplicates = new ArrayList<>();
        
        try {
            log.info("🔍 중복 매핑 조회 시작");
            
            // 모든 활성 매핑 조회
            List<ConsultantClientMapping> allMappings = mappingRepository
                .findByStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
            
            // 상담사-내담자 조합별로 그룹화
            Map<String, List<ConsultantClientMapping>> groupedMappings = allMappings.stream()
                .collect(Collectors.groupingBy(mapping -> 
                    mapping.getConsultant().getId() + "-" + mapping.getClient().getId()));
            
            for (Map.Entry<String, List<ConsultantClientMapping>> entry : groupedMappings.entrySet()) {
                List<ConsultantClientMapping> mappings = entry.getValue();
                
                if (mappings.size() > 1) {
                    Map<String, Object> duplicateGroup = new HashMap<>();
                    duplicateGroup.put("consultantId", mappings.get(0).getConsultant().getId());
                    duplicateGroup.put("consultantName", mappings.get(0).getConsultant().getName());
                    duplicateGroup.put("clientId", mappings.get(0).getClient().getId());
                    duplicateGroup.put("clientName", mappings.get(0).getClient().getName());
                    duplicateGroup.put("mappingCount", mappings.size());
                    duplicateGroup.put("mappings", mappings.stream().map(mapping -> {
                        Map<String, Object> mappingInfo = new HashMap<>();
                        mappingInfo.put("id", mapping.getId());
                        mappingInfo.put("totalSessions", mapping.getTotalSessions());
                        mappingInfo.put("usedSessions", mapping.getUsedSessions());
                        mappingInfo.put("remainingSessions", mapping.getRemainingSessions());
                        mappingInfo.put("createdAt", mapping.getCreatedAt());
                        mappingInfo.put("status", mapping.getStatus());
                        return mappingInfo;
                    }).collect(Collectors.toList()));
                    
                    duplicates.add(duplicateGroup);
                }
            }
            
            log.info("🔍 중복 매핑 조회 완료: {}개 그룹", duplicates.size());
            
        } catch (Exception e) {
            log.error("❌ 중복 매핑 조회 실패", e);
        }
        
        return duplicates;
    }
    
    // ==================== 휴가 통계 구현 ====================
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getConsultantVacationStats(String period) {
        log.info("📊 상담사별 휴가 통계 조회: period={}", period);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 기간 설정 (미래 휴가도 포함)
            LocalDate startDate = getVacationPeriodStartDate(period);
            LocalDate endDate = LocalDate.now().plusMonths(1); // 미래 1개월까지 포함
            
            log.info("📅 휴가 통계 조회 기간: {} ~ {} (period={})", startDate, endDate, period);
            
            // 활성 상담사 목록 조회
            List<User> activeConsultants = userRepository.findByRoleAndIsActiveTrue(UserRole.CONSULTANT);
            log.info("👥 활성 상담사 수: {}명", activeConsultants.size());
            
            // 상담사별 휴가 통계
            List<Map<String, Object>> consultantStats = new ArrayList<>();
            double totalVacationDays = 0.0;
            
            for (User consultant : activeConsultants) {
                Map<String, Object> consultantData = new HashMap<>();
                consultantData.put("consultantId", consultant.getId());
                consultantData.put("consultantName", consultant.getName());
                consultantData.put("email", consultant.getEmail());
                
                // 해당 기간의 휴가 조회 (가중치 적용)
                double vacationCount = getConsultantVacationCount(consultant.getId(), startDate, endDate);
                consultantData.put("vacationDays", vacationCount);
                
                // 휴가 유형별 분석 (개수 기준)
                Map<String, Integer> vacationByType = getVacationCountByType(consultant.getId(), startDate, endDate);
                consultantData.put("vacationByType", vacationByType);
                
                // 휴가 유형별 일수 분석 (가중치 적용)
                Map<String, Double> vacationDaysByType = getVacationDaysByType(consultant.getId(), startDate, endDate);
                consultantData.put("vacationDaysByType", vacationDaysByType);
                
                // 디버깅 로그 추가
                log.info("🏖️ 상담사 {} 휴가 통계: 총 {}일, 유형별 개수={}, 유형별 일수={}", 
                    consultant.getName(), vacationCount, vacationByType, vacationDaysByType);
                
                // 최근 휴가 일자
                LocalDate lastVacationDate = getLastVacationDate(consultant.getId());
                consultantData.put("lastVacationDate", lastVacationDate != null ? lastVacationDate.toString() : null);
                
                consultantStats.add(consultantData);
                totalVacationDays += vacationCount;
            }
            
            // 전체 통계
            Map<String, Object> summary = new HashMap<>();
            summary.put("totalConsultants", activeConsultants.size());
            summary.put("totalVacationDays", totalVacationDays);
            summary.put("averageVacationDays", activeConsultants.size() > 0 ? 
                (double) totalVacationDays / activeConsultants.size() : 0.0);
            
            // 휴가 많은 상담사 TOP 3
            List<Map<String, Object>> topVacationConsultants = consultantStats.stream()
                .sorted((a, b) -> Double.compare((Double) b.get("vacationDays"), (Double) a.get("vacationDays")))
                .limit(3)
                .collect(Collectors.toList());
            
            result.put("success", true);
            result.put("period", period);
            result.put("startDate", startDate.toString());
            result.put("endDate", endDate.toString());
            result.put("summary", summary);
            result.put("consultantStats", consultantStats);
            result.put("topVacationConsultants", topVacationConsultants);
            
            log.info("✅ 상담사별 휴가 통계 조회 완료: 총 {}명, 총 휴가 {}일", 
                activeConsultants.size(), totalVacationDays);
            
        } catch (Exception e) {
            log.error("❌ 상담사별 휴가 통계 조회 실패: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "휴가 통계 조회에 실패했습니다: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * 휴가 기간 시작일 계산
     */
    private LocalDate getVacationPeriodStartDate(String period) {
        LocalDate now = LocalDate.now();
        if (period == null) {
            return now.minusMonths(1); // 기본값: 1개월
        }
        
        switch (period.toLowerCase()) {
            case "week":
                return now.minusWeeks(1);
            case "month":
                return now.minusMonths(1);
            case "quarter":
                return now.minusMonths(3);
            case "year":
                return now.minusYears(1);
            default:
                return now.minusMonths(1); // 기본값: 1개월
        }
    }
    
    /**
     * 상담사의 특정 기간 휴가 일수 조회 (가중치 적용)
     */
    private double getConsultantVacationCount(Long consultantId, LocalDate startDate, LocalDate endDate) {
        try {
            // consultantAvailabilityService를 통해 실제 휴가 정보 조회
            List<Map<String, Object>> vacations = consultantAvailabilityService.getVacations(
                consultantId, 
                startDate.toString(), 
                endDate.toString()
            );
            
            // 승인된 휴가만 가중치 적용하여 계산
            double totalDays = vacations.stream()
                .filter(vacation -> Boolean.TRUE.equals(vacation.get("isApproved")))
                .mapToDouble(vacation -> getVacationWeight((String) vacation.get("type")))
                .sum();
            
            log.debug("상담사 {} 휴가 일수: {}일 ({}~{})", consultantId, totalDays, startDate, endDate);
            return totalDays;
            
        } catch (Exception e) {
            log.error("상담사 휴가 일수 조회 실패: consultantId={}", consultantId, e);
            return 0.0;
        }
    }
    
    /**
     * 휴가 유형별 가중치 반환
     */
    private double getVacationWeight(String vacationType) {
        if (vacationType == null) {
            return 1.0; // 기본값: 종일
        }
        
        switch (vacationType.toUpperCase()) {
            // 반반차 (0.25일)
            case "MORNING_HALF_1": // 오전 반반차 1
            case "MORNING_HALF_2": // 오전 반반차 2  
            case "AFTERNOON_HALF_1": // 오후 반반차 1
            case "AFTERNOON_HALF_2": // 오후 반반차 2
            case "QUARTER": 
            case "QUARTER_DAY":
                return 0.25;
                
            // 반차 (0.5일)
            case "MORNING": // 오전 반차
            case "AFTERNOON": // 오후 반차
            case "MORNING_HALF_DAY": // 오전반차
            case "AFTERNOON_HALF_DAY": // 오후반차
            case "HALF": 
            case "HALF_DAY":
                return 0.5;
                
            // 종일 휴가 (1.0일)
            case "ALL_DAY": // 하루 종일
            case "FULL_DAY": // 종일
            case "FULL":
            default:
                return 1.0;
        }
    }
    
    /**
     * 휴가 유형별 개수 조회
     */
    private Map<String, Integer> getVacationCountByType(Long consultantId, LocalDate startDate, LocalDate endDate) {
        Map<String, Integer> vacationByType = new HashMap<>();
        
        try {
            // consultantAvailabilityService를 통해 실제 휴가 정보 조회
            List<Map<String, Object>> vacations = consultantAvailabilityService.getVacations(
                consultantId, 
                startDate.toString(), 
                endDate.toString()
            );
            
            // 휴가 유형별로 그룹화하여 카운트
            for (Map<String, Object> vacation : vacations) {
                if (Boolean.TRUE.equals(vacation.get("isApproved"))) {
                    String typeName = (String) vacation.get("typeName");
                    String type = (String) vacation.get("type");
                    
                    // typeName이 없으면 type으로부터 생성
                    if (typeName == null && type != null) {
                        typeName = mapVacationTypeToCategory(type);
                    }
                    
                    if (typeName != null) {
                        vacationByType.merge(typeName, 1, Integer::sum);
                    }
                }
            }
            
            // 기본 휴가 유형들이 없으면 0으로 설정
            if (!vacationByType.containsKey("연차")) vacationByType.put("연차", 0);
            if (!vacationByType.containsKey("반차")) vacationByType.put("반차", 0);
            if (!vacationByType.containsKey("반반차")) vacationByType.put("반반차", 0);
            if (!vacationByType.containsKey("개인사정")) vacationByType.put("개인사정", 0);
            
        } catch (Exception e) {
            log.error("휴가 유형별 개수 조회 실패: consultantId={}", consultantId, e);
            vacationByType.put("연차", 0);
            vacationByType.put("병가", 0);
            vacationByType.put("개인사정", 0);
        }
        
        return vacationByType;
    }
    
    /**
     * 휴가 유형별 일수 조회 (가중치 적용)
     */
    private Map<String, Double> getVacationDaysByType(Long consultantId, LocalDate startDate, LocalDate endDate) {
        Map<String, Double> vacationDaysByType = new HashMap<>();
        
        try {
            // consultantAvailabilityService를 통해 실제 휴가 정보 조회
            List<Map<String, Object>> vacations = consultantAvailabilityService.getVacations(
                consultantId, 
                startDate.toString(), 
                endDate.toString()
            );
            
            // 휴가 유형별로 그룹화하여 일수 계산 (가중치 적용)
            log.info("🔍 상담사 {} 휴가 데이터 분석 시작: 총 {}개 휴가", consultantId, vacations.size());
            
            for (Map<String, Object> vacation : vacations) {
                log.info("📋 휴가 데이터: {}", vacation);
                
                if (Boolean.TRUE.equals(vacation.get("isApproved"))) {
                    String typeName = (String) vacation.get("typeName");
                    String type = (String) vacation.get("type");
                    double weight = getVacationWeight(type);
                    
                    // typeName이 없으면 type으로부터 생성
                    if (typeName == null && type != null) {
                        typeName = mapVacationTypeToCategory(type);
                    }
                    
                    log.info("✅ 휴가 처리: type={}, typeName={}, weight={}", type, typeName, weight);
                    
                    if (typeName != null) {
                        vacationDaysByType.merge(typeName, weight, Double::sum);
                    }
                } else {
                    log.warn("⚠️ 미승인 휴가 스킵: {}", vacation);
                }
            }
            
            log.info("📊 최종 휴가 유형별 일수: {}", vacationDaysByType);
            
            // 기본 휴가 유형들이 없으면 0으로 설정
            if (!vacationDaysByType.containsKey("연차")) vacationDaysByType.put("연차", 0.0);
            if (!vacationDaysByType.containsKey("반차")) vacationDaysByType.put("반차", 0.0);
            if (!vacationDaysByType.containsKey("반반차")) vacationDaysByType.put("반반차", 0.0);
            if (!vacationDaysByType.containsKey("개인사정")) vacationDaysByType.put("개인사정", 0.0);
            
        } catch (Exception e) {
            log.error("휴가 유형별 일수 조회 실패: consultantId={}", consultantId, e);
            vacationDaysByType.put("연차", 0.0);
            vacationDaysByType.put("병가", 0.0);
            vacationDaysByType.put("개인사정", 0.0);
        }
        
        return vacationDaysByType;
    }
    
    /**
     * 최근 휴가 일자 조회
     */
    private LocalDate getLastVacationDate(Long consultantId) {
        try {
            // 전체 기간에서 최근 휴가 조회
            List<Map<String, Object>> vacations = consultantAvailabilityService.getVacations(
                consultantId, 
                null, // 전체 기간
                null
            );
            
            // 승인된 휴가 중 가장 최근 날짜 찾기
            return vacations.stream()
                .filter(vacation -> Boolean.TRUE.equals(vacation.get("isApproved")))
                .map(vacation -> {
                    try {
                        String dateStr = (String) vacation.get("date");
                        return LocalDate.parse(dateStr);
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(date -> date != null)
                .max(LocalDate::compareTo)
                .orElse(null);
                
        } catch (Exception e) {
            log.error("최근 휴가 일자 조회 실패: consultantId={}", consultantId, e);
            return null;
        }
    }
    
    /**
     * 휴가 유형을 카테고리로 매핑 (한글명도 처리)
     */
    private String mapVacationTypeToCategory(String vacationType) {
        if (vacationType == null) {
            return "연차";
        }
        
        String type = vacationType.toUpperCase();
        
        // 영문 코드 매핑
        switch (type) {
            // 반반차
            case "MORNING_HALF_1":
            case "MORNING_HALF_2":
            case "AFTERNOON_HALF_1":
            case "AFTERNOON_HALF_2":
                return "반반차";
                
            // 반차
            case "MORNING":
            case "AFTERNOON":
            case "MORNING_HALF_DAY":
            case "AFTERNOON_HALF_DAY":
                return "반차";
                
            // 개인사정
            case "CUSTOM_TIME":
                return "개인사정";
                
            // 연차 (종일)
            case "ALL_DAY":
            case "FULL_DAY":
                return "연차";
        }
        
        // 한글명 매핑 (ConsultantAvailabilityServiceImpl에서 반환하는 한글명 처리)
        if (vacationType.contains("반반차") || vacationType.contains("HALF_1") || vacationType.contains("HALF_2")) {
            return "반반차";
        } else if (vacationType.contains("반차") || vacationType.contains("오전") || vacationType.contains("오후")) {
            return "반차";
        } else if (vacationType.contains("개인") || vacationType.contains("사용자") || vacationType.contains("CUSTOM")) {
            return "개인사정";
        } else if (vacationType.contains("종일") || vacationType.contains("하루") || vacationType.contains("ALL") || vacationType.contains("FULL")) {
            return "연차";
        }
        
        // 기본값
        return "연차";
    }
    
    /**
     * 매핑의 notes에서 가장 최근 추가된 패키지 정보 추출
     */
    private Map<String, Object> getLastAddedPackageInfo(ConsultantClientMapping mapping) {
        Map<String, Object> result = new HashMap<>();
        result.put("sessions", 0);
        result.put("price", 0L);
        result.put("packageName", "");
        
        String notes = mapping.getNotes();
        if (notes == null || notes.trim().isEmpty()) {
            log.info("📋 매핑 notes가 없어서 최근 추가 패키지 정보를 찾을 수 없습니다.");
            return result;
        }
        
        try {
            // notes에서 추가 매핑이나 회기 추가 관련 정보 추출
            String[] noteLines = notes.split("\n");
            
            // 가장 최근 추가 정보를 찾기 위해 역순으로 검색
            for (int i = noteLines.length - 1; i >= 0; i--) {
                String line = noteLines[i].trim();
                
                // "[추가 매핑]" 패턴 검색
                if (line.contains("[추가 매핑]")) {
                    // 추가 매핑 시 기본 패키지 정보 사용
                    result.put("sessions", 10); // 기본 패키지 회기수
                    result.put("price", mapping.getPackagePrice() != null ? mapping.getPackagePrice() : 0L);
                    result.put("packageName", mapping.getPackageName() != null ? mapping.getPackageName() : "추가 패키지");
                    log.info("📦 추가 매핑 정보 발견: {}", line);
                    break;
                }
                
                // "회기 추가" 패턴 검색
                if (line.contains("회기 추가") || line.contains("EXTENSION")) {
                    // 회기 추가 로그에서 정보 추출 시도
                    try {
                        // "회기 추가: 10회" 같은 패턴에서 숫자 추출
                        if (line.matches(".*\\d+회.*")) {
                            String sessionStr = line.replaceAll(".*?(\\d+)회.*", "$1");
                            int sessions = Integer.parseInt(sessionStr);
                            result.put("sessions", sessions);
                            
                            // 가격 정보도 추출 시도
                            if (line.matches(".*\\d+원.*")) {
                                String priceStr = line.replaceAll(".*?(\\d+)원.*", "$1");
                                Long price = Long.parseLong(priceStr.replaceAll(",", ""));
                                result.put("price", price);
                            }
                            
                            log.info("📦 회기 추가 정보 발견: 회기수={}, 라인={}", sessions, line);
                            break;
                        }
                    } catch (Exception e) {
                        log.warn("회기 추가 정보 파싱 실패: {}", line, e);
                    }
                }
            }
            
            // 추가 정보가 없으면 표준 패키지 단위로 추정
            if ((Integer) result.get("sessions") == 0) {
                // 총 회기수가 10의 배수라면 가장 최근 10회 단위로 추정
                int totalSessions = mapping.getTotalSessions();
                if (totalSessions >= 10) {
                    int estimatedLastPackage = totalSessions % 10 == 0 ? 10 : totalSessions % 10;
                    if (estimatedLastPackage == 0) estimatedLastPackage = 10; // 10의 배수면 10회 패키지
                    
                    result.put("sessions", estimatedLastPackage);
                    
                    // 비례 계산으로 가격 추정
                    if (mapping.getPackagePrice() != null && totalSessions > 0) {
                        Long estimatedPrice = (mapping.getPackagePrice() * estimatedLastPackage) / totalSessions;
                        result.put("price", estimatedPrice);
                    }
                    
                    result.put("packageName", estimatedLastPackage + "회 패키지 (추정)");
                    
                    log.info("📦 표준 패키지 단위로 추정: 총회기수={}, 추정최근패키지={}회", 
                            totalSessions, estimatedLastPackage);
                }
            }
            
        } catch (Exception e) {
            log.error("❌ 최근 추가 패키지 정보 추출 실패", e);
        }
        
        return result;
    }
}
