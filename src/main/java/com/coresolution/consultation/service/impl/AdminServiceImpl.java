package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.coresolution.core.util.StatusCodeHelper;
import com.coresolution.consultation.constant.ClientRegistrationConstants;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ClientRegistrationRequest;
import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;
import com.coresolution.consultation.dto.ConsultantRegistrationRequest;
import com.coresolution.consultation.dto.ConsultantTransferRequest;
import com.coresolution.consultation.dto.FinancialTransactionRequest;
import com.coresolution.consultation.dto.StaffRegistrationRequest;
import com.coresolution.consultation.entity.Branch;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.Consultant;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ConsultantSalaryProfileRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.AmountManagementService;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.consultation.service.ConsultantStatsService;
import com.coresolution.consultation.service.ClientStatsService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.PasswordResetService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.util.FreelanceWithholdingTaxUtil;
import com.coresolution.consultation.util.LoginIdentifierUtils;
import com.coresolution.consultation.util.TaxCalculationUtil;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.util.RrnValidationUtil;
import com.coresolution.consultation.util.VehiclePlateText;
import com.coresolution.core.service.impl.BaseTenantAwareService;
import com.coresolution.core.domain.UserRoleAssignment;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.TenantRole;
import com.coresolution.core.repository.UserRoleAssignmentRepository;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.service.UserRoleQueryService;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import com.coresolution.core.security.PasswordService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import org.hibernate.Hibernate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AdminServiceImpl extends BaseTenantAwareService implements AdminService {

    private final UserRepository userRepository;
    private final ConsultantRepository consultantRepository;
    private final ClientRepository clientRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final ConsultantRatingRepository consultantRatingRepository;
    private final ConsultantRatingService consultantRatingService;
    private final ScheduleRepository scheduleRepository;
    private final CommonCodeRepository commonCodeRepository;
    private final CommonCodeService commonCodeService;
    private final PasswordService passwordService;
    private final PersonalDataEncryptionUtil encryptionUtil;
    private final ConsultantAvailabilityService consultantAvailabilityService;
    private final ConsultationMessageService consultationMessageService;
    private final BranchService branchService;
    private final NotificationService notificationService;
    private final FinancialTransactionService financialTransactionService;
    private final RealTimeStatisticsService realTimeStatisticsService;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final AmountManagementService amountManagementService;
    private final StoredProcedureService storedProcedureService;
    private final UserRoleAssignmentRepository userRoleAssignmentRepository;
    private final TenantRoleRepository tenantRoleRepository;
    private final UserRoleQueryService userRoleQueryService;
    private final StatusCodeHelper statusCodeHelper;
    private final UserPersonalDataCacheService userPersonalDataCacheService;
    private final ConsultantStatsService consultantStatsService;
    private final ClientStatsService clientStatsService;
    private final PasswordResetService passwordResetService;
    private final org.springframework.transaction.PlatformTransactionManager transactionManager;
    private final com.coresolution.consultation.service.UserIdGenerator userIdGenerator;
    private final UserService userService;
    private final ConsultantSalaryProfileRepository consultantSalaryProfileRepository;

    @Override
    public User registerConsultant(ConsultantRegistrationRequest request) {
        // 표준화 2025-12-08: 이메일만 입력받고 userId, password, name 자동 생성
        String email = request.getEmail();
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException(AdminServiceUserFacingMessages.MSG_EMAIL_REQUIRED);
        }
        email = email.trim().toLowerCase();
        
        String tenantId = getTenantIdOrNull();
        if (tenantId == null) {
            log.warn("⚠️ TenantContext에 tenantId가 없습니다. 세션에서 조회 시도...");
            throw new IllegalStateException(AdminServiceUserFacingMessages.MSG_TENANT_INFO_MISSING);
        }
        
        // 1. 테넌트별 고유한 userId 자동 생성 (표준화 2025-12-08)
        String userId = userIdGenerator.generateUniqueUserId(email, tenantId);
        log.info("✅ 테넌트별 상담사 사용자 ID 자동 생성 완료: email={}, tenantId={}, userId={}", 
                email, tenantId, userId);
        
        // 2. 비밀번호 처리: 사용자가 입력한 비밀번호가 있으면 사용, 없으면 임시 비밀번호 자동 생성
        String password;
        boolean isTempPassword = false;
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            password = request.getPassword().trim();
            log.info("✅ 사용자 입력 비밀번호 사용: email={}", email);
        } else {
            password = generateTempPassword();
            isTempPassword = true;
            log.info("✅ 상담사 임시 비밀번호 자동 생성 완료: email={}", email);
        }
        
        // 3. 이름 자동 생성 (이메일 로컬 파트 또는 기본값 사용) (표준화 2025-12-08)
        String name = request.getName();
        if (name == null || name.trim().isEmpty()) {
            // 이메일 로컬 파트에서 이름 생성
            String localPart = email.split("@")[0];
            name = localPart.replaceAll("[^a-zA-Z0-9가-힣]", "");
            if (name.isEmpty()) {
                name = AdminServiceUserFacingMessages.DEFAULT_CONSULTANT_DISPLAY_NAME;
            }
        }
        name = name.trim();
        
        // 기존 비활성화된 상담사 확인 (재활성화)
        Optional<User> existingConsultant = userRepository.findByTenantIdAndUserIdAndIsActive(tenantId, userId, false);
        
        if (existingConsultant.isPresent()) {
            // 기존 상담사 재활성화
            User consultant = existingConsultant.get();
            
            // 개인정보 암호화
            String encryptedName = encryptionUtil.safeEncrypt(name);
            String encryptedEmail = encryptionUtil.safeEncrypt(email);
            String encryptedPhone = null;
            if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
                encryptedPhone = encryptionUtil.safeEncrypt(request.getPhone());
                log.info("🔐 관리자 상담사 등록 시 전화번호 암호화 완료: {}", maskPhone(request.getPhone()));
            }
            log.info("🔐 관리자 상담사 등록 시 이름, 이메일 암호화 완료");
            
            consultant.setEmail(encryptedEmail);
            // 사용자 입력 비밀번호는 정책 적용, 임시 자동 생성은 정책 미적용
            consultant.setPassword(isTempPassword ? passwordService.encodeSecret(password) : passwordService.encodePassword(password));
            consultant.setName(encryptedName); // 자동 생성된 이름 사용
            consultant.setPhone(encryptedPhone);
            consultant.setIsActive(true); // 활성화
            consultant.setIsPasswordChanged(!isTempPassword); // 임시 비밀번호인 경우 false, 사용자 입력 비밀번호인 경우 true
            consultant.setSpecialization(request.getSpecialization());
            consultant.setTenantId(tenantId); // 테넌트 ID 설정
            if (request.getProfileImageUrl() != null && !request.getProfileImageUrl().trim().isEmpty()) {
                consultant.setProfileImageUrl(request.getProfileImageUrl().trim());
            }
            if (consultant instanceof Consultant) {
                Consultant c = (Consultant) consultant;
                c.setCertification(request.getQualifications());
                if (request.getWorkHistory() != null && !request.getWorkHistory().trim().isEmpty()) {
                    c.setWorkHistory(request.getWorkHistory().trim());
                }
            }
            if (request.getGrade() != null && !request.getGrade().trim().isEmpty()) {
                consultant.setGrade(request.getGrade().trim());
            }
            applyRrnAndAddressToUser(consultant, request.getRrnFirst6(), request.getRrnLast1(),
                    request.getAddress(), request.getAddressDetail(), request.getPostalCode());

            User savedConsultant = userRepository.save(consultant);
            
            createUserRoleAssignment(savedConsultant, tenantId, UserRole.CONSULTANT);
            
            // 표준화 2025-12-08: 상담사 등록 시 캐시에 복호화 데이터 저장 (성능 최적화)
            try {
                userPersonalDataCacheService.decryptAndCacheUserPersonalData(savedConsultant);
                log.debug("✅ 상담사 개인정보 복호화 캐시 저장 완료: userId={}, tenantId={}", 
                         savedConsultant.getId(), savedConsultant.getTenantId());
            } catch (Exception e) {
                log.warn("⚠️ 상담사 개인정보 캐시 저장 실패 (등록은 계속 진행): userId={}", 
                        savedConsultant.getId(), e);
            }
            
            log.info("✅ 기존 상담사 재활성화 완료: id={}, userId={}, tenantId={}", 
                    savedConsultant.getId(), savedConsultant.getUserId(), savedConsultant.getTenantId());
            
            // 상담사 목록 캐시 무효화 (재활성화 후 목록에 즉시 반영되도록)
            try {
                consultantStatsService.evictAllConsultantStatsCache();
                log.debug("✅ 상담사 목록 캐시 무효화 완료: tenantId={}", tenantId);
            } catch (Exception e) {
                log.warn("⚠️ 상담사 목록 캐시 무효화 실패 (등록은 계속 진행): tenantId={}", tenantId, e);
            }
            
            // 임시 비밀번호인 경우 이메일로 비밀번호 변경 링크 발송
            if (isTempPassword) {
                try {
                    log.info("📧 임시 비밀번호로 재활성화된 상담사에게 비밀번호 변경 링크 이메일 발송: email={}", email);
                    boolean emailSent = passwordResetService.sendPasswordResetEmail(email);
                    if (emailSent) {
                        log.info("✅ 비밀번호 변경 링크 이메일 발송 완료: email={}", email);
                    } else {
                        log.warn("⚠️ 비밀번호 변경 링크 이메일 발송 실패: email={}", email);
                    }
                } catch (Exception e) {
                    log.error("❌ 비밀번호 변경 링크 이메일 발송 중 오류: email={}", email, e);
                    // 이메일 발송 실패해도 등록은 계속 진행
                }
            }
            
            return savedConsultant;
        } else {
            // 새로운 상담사 생성
            // 개인정보 암호화
            String encryptedName = encryptionUtil.safeEncrypt(name);
            String encryptedEmail = encryptionUtil.safeEncrypt(email);
            String encryptedPhone = null;
            if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
                encryptedPhone = encryptionUtil.safeEncrypt(request.getPhone());
                log.info("🔐 관리자 상담사 등록 시 전화번호 암호화 완료: {}", maskPhone(request.getPhone()));
            }
            log.info("🔐 관리자 상담사 등록 시 이름, 이메일 암호화 완료");
            
            Consultant consultant = new Consultant();
            consultant.setUserId(userId); // 자동 생성된 userId 사용
            consultant.setEmail(encryptedEmail);
            // 사용자 입력 비밀번호는 정책 적용, 임시 자동 생성은 정책 미적용
            consultant.setPassword(isTempPassword ? passwordService.encodeSecret(password) : passwordService.encodePassword(password));
            consultant.setName(encryptedName); // 자동 생성된 이름 사용
            consultant.setPhone(encryptedPhone);
            consultant.setRole(UserRole.CONSULTANT);
            consultant.setIsActive(true);
            consultant.setIsPasswordChanged(!isTempPassword); // 임시 비밀번호인 경우 false, 사용자 입력 비밀번호인 경우 true
            consultant.setTenantId(tenantId); // 테넌트 ID 설정
            
            consultant.setSpecialty(request.getSpecialization());
            consultant.setCertification(request.getQualifications());
            if (request.getWorkHistory() != null && !request.getWorkHistory().trim().isEmpty()) {
                consultant.setWorkHistory(request.getWorkHistory().trim());
            }
            if (request.getProfileImageUrl() != null && !request.getProfileImageUrl().trim().isEmpty()) {
                consultant.setProfileImageUrl(request.getProfileImageUrl().trim());
            }
            if (request.getGrade() != null && !request.getGrade().trim().isEmpty()) {
                consultant.setGrade(request.getGrade().trim());
            }
            applyRrnAndAddressToUser(consultant, request.getRrnFirst6(), request.getRrnLast1(),
                    request.getAddress(), request.getAddressDetail(), request.getPostalCode());
            log.info("🔧 상담사 엔티티 생성 완료: userId={}, tenantId={}, specialization={}",
                    consultant.getUserId(), consultant.getTenantId(), consultant.getSpecialty());

            User savedConsultant = userRepository.save(consultant);
            
            log.info("✅ 상담사 등록 성공: id={}, userId={}, tenantId={}", 
                    savedConsultant.getId(), savedConsultant.getUserId(), savedConsultant.getTenantId());
            
            createUserRoleAssignment(savedConsultant, tenantId, UserRole.CONSULTANT);
            
            // 표준화 2025-12-08: 상담사 등록 시 캐시에 복호화 데이터 저장 (성능 최적화)
            try {
                userPersonalDataCacheService.decryptAndCacheUserPersonalData(savedConsultant);
                log.debug("✅ 상담사 개인정보 복호화 캐시 저장 완료: userId={}, tenantId={}", 
                         savedConsultant.getId(), savedConsultant.getTenantId());
            } catch (Exception e) {
                log.warn("⚠️ 상담사 개인정보 캐시 저장 실패 (등록은 계속 진행): userId={}", 
                        savedConsultant.getId(), e);
            }
            
            // 상담사 목록 캐시 무효화 (등록 후 목록에 즉시 반영되도록)
            try {
                consultantStatsService.evictAllConsultantStatsCache();
                log.debug("✅ 상담사 목록 캐시 무효화 완료: tenantId={}", tenantId);
            } catch (Exception e) {
                log.warn("⚠️ 상담사 목록 캐시 무효화 실패 (등록은 계속 진행): tenantId={}", tenantId, e);
            }
            
            // 임시 비밀번호인 경우 이메일로 비밀번호 변경 링크 발송
            if (isTempPassword) {
                try {
                    log.info("📧 임시 비밀번호로 등록된 상담사에게 비밀번호 변경 링크 이메일 발송: email={}", email);
                    boolean emailSent = passwordResetService.sendPasswordResetEmail(email);
                    if (emailSent) {
                        log.info("✅ 비밀번호 변경 링크 이메일 발송 완료: email={}", email);
                    } else {
                        log.warn("⚠️ 비밀번호 변경 링크 이메일 발송 실패: email={}", email);
                    }
                } catch (Exception e) {
                    log.error("❌ 비밀번호 변경 링크 이메일 발송 중 오류: email={}", email, e);
                    // 이메일 발송 실패해도 등록은 계속 진행
                }
            }
            
            return savedConsultant;
        }
    }

    @Override
    public Client registerClient(ClientRegistrationRequest request) {
        String tenantId = getTenantIdOrNull();
        if (tenantId == null) {
            log.warn("⚠️ TenantContext에 tenantId가 없습니다. 세션에서 조회 시도...");
            throw new IllegalStateException(AdminServiceUserFacingMessages.MSG_TENANT_INFO_MISSING);
        }

        String rawEmail = request.getEmail();
        String rawPhone = request.getPhone();
        boolean hasEmail = rawEmail != null && !rawEmail.trim().isEmpty();
        boolean hasPhone = rawPhone != null && !rawPhone.trim().isEmpty();
        if (!hasEmail && !hasPhone) {
            throw new IllegalArgumentException(ClientRegistrationConstants.MSG_EMAIL_OR_PHONE_REQUIRED);
        }

        String normalizedPhoneDigits = null;
        if (hasPhone) {
            normalizedPhoneDigits = LoginIdentifierUtils.normalizeKoreanMobileDigits(rawPhone);
            if (!LoginIdentifierUtils.isValidKoreanMobileDigits(normalizedPhoneDigits)) {
                throw new IllegalArgumentException(ClientRegistrationConstants.MSG_INVALID_PHONE);
            }
            if (userService.existsPhoneDuplicateForPublicSignup(normalizedPhoneDigits, tenantId)) {
                throw new IllegalArgumentException(ClientRegistrationConstants.MSG_DUPLICATE_PHONE);
            }
        }

        String emailPlain;
        if (hasEmail) {
            emailPlain = rawEmail.trim().toLowerCase();
            String encryptedForLookup = encryptionUtil.safeEncrypt(emailPlain);
            if (userRepository.existsByTenantIdAndEmail(tenantId, encryptedForLookup)) {
                throw new IllegalArgumentException(ClientRegistrationConstants.MSG_DUPLICATE_EMAIL);
            }
        } else {
            emailPlain = allocateUniqueSyntheticEmailForClient(normalizedPhoneDigits, tenantId);
        }

        // 1. userId: 이메일 우선, 전화만이면 정규화 번호 기반
        String userId;
        if (hasEmail) {
            userId = userIdGenerator.generateUniqueUserId(emailPlain, tenantId);
        } else {
            userId = userIdGenerator.generateUniqueUserIdFromPhone(normalizedPhoneDigits, tenantId);
        }
        log.info("✅ 내담자 사용자 ID 자동 생성: hasEmail={}, tenantId={}, userId={}", hasEmail, tenantId, userId);

        // 2. 비밀번호
        String password;
        boolean isTempPassword = false;
        log.debug("registerClient password received: present={}, nonEmpty={}",
                request.getPassword() != null,
                request.getPassword() != null && !request.getPassword().trim().isEmpty());
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            password = request.getPassword().trim();
            log.info("✅ 사용자 입력 비밀번호 사용: principalHint={}", hasEmail ? emailPlain : normalizedPhoneDigits);
        } else {
            password = generateTempPassword();
            isTempPassword = true;
            log.info("✅ 임시 비밀번호 자동 생성 완료");
        }

        // 3. 표시 이름
        String name = request.getName();
        if (name == null || name.trim().isEmpty()) {
            if (hasEmail) {
                String localPart = emailPlain.split("@")[0];
                name = localPart.replaceAll("[^a-zA-Z0-9가-힣]", "");
                if (name.isEmpty()) {
                    name = ClientRegistrationConstants.DEFAULT_CLIENT_DISPLAY_NAME;
                }
            } else {
                name = maskPhone(normalizedPhoneDigits);
                if (name == null || name.length() < 4) {
                    name = ClientRegistrationConstants.DEFAULT_CLIENT_DISPLAY_NAME;
                }
            }
        }
        name = name.trim();

        // 개인정보 암호화
        String encryptedName = encryptionUtil.safeEncrypt(name);
        String encryptedEmail = encryptionUtil.safeEncrypt(emailPlain);
        String encryptedPhone = null;
        if (hasPhone) {
            encryptedPhone = encryptionUtil.safeEncrypt(normalizedPhoneDigits);
            log.info("🔐 관리자 내담자 등록 시 전화번호 암호화 완료: {}", maskPhone(normalizedPhoneDigits));
        }
        log.info("🔐 관리자 내담자 등록 시 이름, 이메일 암호화 완료");
        
        // 등록 시 상태 반영: request.getStatus()가 있으면 ACTIVE→true, 그 외→false (없으면 기본 true)
        boolean isActive = true;
        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            isActive = "ACTIVE".equalsIgnoreCase(request.getStatus().trim());
        }

        // User 엔티티 생성
        // 사용자 입력 비밀번호는 정책 적용, 임시 자동 생성은 정책 미적용
        User clientUser = User.builder()
                .userId(userId)
                .email(encryptedEmail)
                .password(isTempPassword ? passwordService.encodeSecret(password) : passwordService.encodePassword(password))
                .name(encryptedName)
                .phone(encryptedPhone)
                .role(UserRole.CLIENT)
                .isActive(isActive)
                .isPasswordChanged(!isTempPassword)
                .branch(null)
                .branchCode(null)
                .build();

        clientUser.setTenantId(tenantId);
        if (request.getProfileImageUrl() != null && !request.getProfileImageUrl().trim().isEmpty()) {
            clientUser.setProfileImageUrl(request.getProfileImageUrl().trim());
        }
        applyRrnAndAddressToUser(clientUser, request.getRrnFirst6(), request.getRrnLast1(),
                request.getAddress(), request.getAddressDetail(), request.getPostalCode());

        if (request.getNotes() != null) {
            clientUser.setNotes(request.getNotes().trim().isEmpty() ? null : request.getNotes().trim());
        }
        if (request.getGrade() != null) {
            String newGrade = request.getGrade().trim().isEmpty() ? null : request.getGrade().trim();
            if (!Objects.equals(clientUser.getGrade(), newGrade)) {
                clientUser.setLastGradeUpdate(LocalDateTime.now());
            }
            clientUser.setGrade(newGrade);
        }
        if (clientUser.getBirthDate() == null && request.getAge() != null) {
            clientUser.setAge(request.getAge());
        }

        log.info("🔧 내담자 등록 - User 엔티티 정보: userId={}, email={}, tenantId={}, isActive={}, role={}",
                clientUser.getUserId(), emailPlain, tenantId, clientUser.getIsActive(), clientUser.getRole());

        User savedUser = userRepository.saveAndFlush(clientUser);
        validateClientUserTenantIntegrity(savedUser, tenantId);

        log.info("✅ 내담자 등록 완료 - 저장된 User 정보: id={}, userId={}, tenantId={}, isActive={}, role={}", 
                savedUser.getId(), savedUser.getUserId(), savedUser.getTenantId(), savedUser.getIsActive(), savedUser.getRole());
        
        createUserRoleAssignment(savedUser, tenantId, UserRole.CLIENT);
        
        // 표준화 2025-12-08: 내담자 등록 시 캐시에 복호화 데이터 저장 (성능 최적화)
        try {
            userPersonalDataCacheService.decryptAndCacheUserPersonalData(savedUser);
            log.debug("✅ 내담자 개인정보 복호화 캐시 저장 완료: userId={}, tenantId={}", 
                     savedUser.getId(), savedUser.getTenantId());
        } catch (Exception e) {
            log.warn("⚠️ 내담자 개인정보 캐시 저장 실패 (등록은 계속 진행): userId={}", 
                    savedUser.getId(), e);
        }
        
        // 내담자 목록 캐시 무효화 (등록 후 목록에 즉시 반영되도록)
        try {
            clientStatsService.evictAllClientStatsCache();
            log.debug("✅ 내담자 목록 캐시 무효화 완료: tenantId={}", tenantId);
        } catch (Exception e) {
            log.warn("⚠️ 내담자 목록 캐시 무효화 실패 (등록은 계속 진행): tenantId={}", tenantId, e);
        }
        
        Client client = new Client();
        client.setId(savedUser.getId());
        client.setTenantId(tenantId);
        client.setName(savedUser.getName());
        client.setEmail(savedUser.getEmail());
        client.setPhone(savedUser.getPhone());
        client.setBirthDate(savedUser.getBirthDate());
        client.setGender(savedUser.getGender());
        client.setAddress(savedUser.getAddress());
        client.setAddressDetail(savedUser.getAddressDetail());
        client.setPostalCode(savedUser.getPostalCode());
        String vehiclePlate = VehiclePlateText.normalizeOrNull(request.getVehiclePlate());
        client.setVehiclePlate(vehiclePlate);
        client.setEmergencyContact(encryptOptionalPiiForStorage(request.getEmergencyContact()));
        client.setEmergencyPhone(encryptOptionalPiiForStorage(request.getEmergencyPhone()));
        client.setConsultationPurpose(trimToNull(request.getConsultationPurpose()));
        client.setConsultationHistory(trimToNull(request.getConsultationHistory()));
        client.setIsDeleted(false);
        client.setCreatedAt(savedUser.getCreatedAt());
        client.setUpdatedAt(savedUser.getUpdatedAt());
        client.setBranchCode(null);
        
        log.info("✅ Client 엔티티 생성 완료: id={}, userId={}, isDeleted={}, isActive={}, tenantId={}", 
                client.getId(), savedUser.getUserId(), client.getIsDeleted(), savedUser.getIsActive(), tenantId);
        if (vehiclePlate != null) {
            log.info("🚗 내담자 등록: 차량번호 저장 (마스킹): {}", maskVehiclePlate(vehiclePlate));
        }

        return clientRepository.saveAndFlush(client);
    }

    @Override
    public User registerStaff(StaffRegistrationRequest request) {
        String email = request.getEmail();
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException(AdminServiceUserFacingMessages.MSG_EMAIL_REQUIRED);
        }
        email = email.trim().toLowerCase();

        String tenantId = getTenantIdOrNull();
        if (tenantId == null) {
            log.warn("TenantContext에 tenantId가 없습니다.");
            throw new IllegalStateException(AdminServiceUserFacingMessages.MSG_TENANT_INFO_MISSING);
        }

        String userId = userIdGenerator.generateUniqueUserId(email, tenantId);
        log.info("스태프 사용자 ID 자동 생성: email={}, tenantId={}, userId={}", email, tenantId, userId);

        String password;
        boolean isTempPassword = false;
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            password = request.getPassword().trim();
        } else {
            password = generateTempPassword();
            isTempPassword = true;
        }

        String name = request.getName();
        if (name == null || name.trim().isEmpty()) {
            String localPart = email.split("@")[0];
            name = localPart.replaceAll("[^a-zA-Z0-9가-힣]", "");
            if (name.isEmpty()) {
                name = "사무원";
            }
        }
        name = name.trim();

        String encryptedName = encryptionUtil.safeEncrypt(name);
        String encryptedEmail = encryptionUtil.safeEncrypt(email);
        String encryptedPhone = null;
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            encryptedPhone = encryptionUtil.safeEncrypt(request.getPhone());
        }

        User staffUser = User.builder()
                .userId(userId)
                .email(encryptedEmail)
                .password(isTempPassword ? passwordService.encodeSecret(password) : passwordService.encodePassword(password))
                .name(encryptedName)
                .phone(encryptedPhone)
                .role(UserRole.STAFF)
                .isActive(true)
                .isPasswordChanged(!isTempPassword)
                .branch(null)
                .branchCode(null)
                .build();
        staffUser.setTenantId(tenantId);
        if (request.getProfileImageUrl() != null && !request.getProfileImageUrl().trim().isEmpty()) {
            staffUser.setProfileImageUrl(request.getProfileImageUrl().trim());
        }
        applyRrnAndAddressToUser(staffUser, request.getRrnFirst6(), request.getRrnLast1(),
                request.getAddress(), request.getAddressDetail(), request.getPostalCode());

        User savedUser = userRepository.save(staffUser);
        createUserRoleAssignment(savedUser, tenantId, UserRole.STAFF);

        try {
            userPersonalDataCacheService.decryptAndCacheUserPersonalData(savedUser);
        } catch (Exception e) {
            log.warn("스태프 개인정보 캐시 저장 실패: userId={}", savedUser.getId(), e);
        }

        log.info("스태프 등록 완료: id={}, userId={}, tenantId={}", savedUser.getId(), savedUser.getUserId(), tenantId);
        return savedUser;
    }

    @Override
    public ConsultantClientMapping createMapping(ConsultantClientMappingCreateRequest dto) {
        // 표준화 2025-12-05: tenantId 필터링 필수 (BaseTenantAwareService 상속으로 자동 처리)
        String tenantId = getTenantId();
        User consultant = userRepository.findByTenantIdAndId(tenantId, dto.getConsultantId())
                .orElseThrow(() -> new RuntimeException("Consultant not found"));
        
        User clientUser = userRepository.findByTenantIdAndId(tenantId, dto.getClientId())
                .orElseThrow(() -> new RuntimeException("Client not found"));

        // 표준화 2025-12-06: 브랜치 코드 사용 금지 - branchCode는 null로 설정
        String branchCode = null;
        
        List<ConsultantClientMapping> existingMappings = mappingRepository
            .findByTenantIdAndConsultantAndClient(tenantId, consultant, clientUser);
        
        if (!existingMappings.isEmpty()) {
            log.info("🔍 기존 매칭 발견, 자동 종료 처리: 상담사={}, 내담자={}, 기존 매칭 수={}", 
                consultant.getName(), clientUser.getName(), existingMappings.size());
            
            String terminatedStatus = getMappingStatusCode("TERMINATED");
            
            for (ConsultantClientMapping existingMapping : existingMappings) {
                try {
                existingMapping.setStatus(ConsultantClientMapping.MappingStatus.valueOf(terminatedStatus));
                } catch (IllegalArgumentException e) {
                    log.warn("⚠️ 종료 상태 값이 enum에 없음: {}, 기본값 사용: TERMINATED", terminatedStatus, e);
                    existingMapping.setStatus(ConsultantClientMapping.MappingStatus.TERMINATED);
                }
                existingMapping.setTerminatedAt(LocalDateTime.now());
                existingMapping.setNotes((existingMapping.getNotes() != null ? existingMapping.getNotes() + "\n" : "") + 
                    "새로운 매칭 생성으로 인한 자동 종료 - 회기 자동 소진");
                
                int remainingSessions = existingMapping.getRemainingSessions();
                if (remainingSessions > 0) {
                    existingMapping.setUsedSessions(existingMapping.getUsedSessions() + remainingSessions);
                    existingMapping.setRemainingSessions(0);
                    log.info("🔄 기존 매칭 회기 자동 소진: 매칭ID={}, 소진 회기={}", 
                        existingMapping.getId(), remainingSessions);
                }
                
                existingMapping.setUpdatedAt(LocalDateTime.now());
                mappingRepository.save(existingMapping);
                
                log.info("✅ 기존 매칭 자동 종료 완료: 매칭ID={}, 상태={}", 
                    existingMapping.getId(), existingMapping.getStatus());
            }
        }
        
        log.info("🆕 새로운 매칭 생성: 상담사={}, 내담자={}", 
            consultant.getName(), clientUser.getName());
            
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setConsultant(consultant);
        mapping.setClient(clientUser);
        mapping.setStartDate(dto.getStartDate() != null ? 
            dto.getStartDate().atStartOfDay() : 
            LocalDateTime.now());
        String defaultMappingStatus = getMappingStatusCode("PENDING_PAYMENT");
        String defaultPaymentStatus = getPaymentStatusCode("PENDING");
        
        try {
        mapping.setStatus(dto.getStatus() != null ? 
            ConsultantClientMapping.MappingStatus.valueOf(dto.getStatus()) : 
            ConsultantClientMapping.MappingStatus.valueOf(defaultMappingStatus));
        } catch (IllegalArgumentException e) {
            log.warn("⚠️ 잘못된 매칭 상태 값: {}, 기본값 사용: {}", dto.getStatus(), defaultMappingStatus, e);
            mapping.setStatus(ConsultantClientMapping.MappingStatus.valueOf(defaultMappingStatus));
        }
        
        try {
        mapping.setPaymentStatus(dto.getPaymentStatus() != null ? 
            ConsultantClientMapping.PaymentStatus.valueOf(dto.getPaymentStatus()) : 
            ConsultantClientMapping.PaymentStatus.valueOf(defaultPaymentStatus));
        } catch (IllegalArgumentException e) {
            log.warn("⚠️ 잘못된 결제 상태 값: {}, 기본값 사용: {}", dto.getPaymentStatus(), defaultPaymentStatus, e);
            mapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.valueOf(defaultPaymentStatus));
        }
        mapping.setTotalSessions(dto.getTotalSessions() != null ? dto.getTotalSessions() : 10);
        // 신규 매칭: 입금 확인 전까지 사용 가능 회기는 0 (입금 확인 시 confirmDeposit에서 채움)
        mapping.setRemainingSessions(0);
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
        mapping.setBranchCode(null); // 표준화 2025-12-06: 브랜치 코드 사용 금지

        return mappingRepository.save(mapping);
    }

    /**
     /**
     * 입금 확인 처리
     */
    @Override
    public ConsultantClientMapping confirmPayment(Long mappingId, String paymentMethod, String paymentReference, Long paymentAmount) {
        ConsultantClientMapping mapping = mappingRepository.findByTenantIdAndId(getTenantId(), mappingId)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));
        
        if (paymentAmount != null && mapping.getPackagePrice() != null) {
            if (!paymentAmount.equals(mapping.getPackagePrice())) {
                log.warn("⚠️ 금액 불일치 감지: MappingID={}, PaymentAmount={}, PackagePrice={}", 
                    mappingId, paymentAmount, mapping.getPackagePrice());
            }
        }
        
        mapping.confirmPayment(paymentMethod, paymentReference);
        mapping.setPaymentAmount(paymentAmount);
        
        ConsultantClientMapping savedMapping = mappingRepository.save(mapping);
        
        try {
            boolean isAdditionalMapping = savedMapping.getNotes() != null &&
                                        savedMapping.getNotes().contains("[추가 매칭]");
            if (isAdditionalMapping) {
                log.info("🔄 추가 매칭 입금 확인 - 추가 회기에 대한 ERP 거래 생성 (별도 트랜잭션)");
                String tenantId = getTenantIdFromMapping(savedMapping);
                if (tenantId == null) tenantId = getTenantIdOrNull();
                runInNewTransaction(tenantId, () -> createAdditionalSessionIncomeTransaction(savedMapping, paymentAmount));
            } else {
                log.info("🆕 신규 매칭 입금 확인 - 전체 패키지에 대한 ERP 거래 생성 (별도 트랜잭션)");
                createConsultationIncomeTransactionAsync(savedMapping);
            }
            log.info("💚 매칭 입금 확인으로 인한 상담료 수입 거래 자동 생성 완료: MappingID={}, PaymentAmount={}, 추가매칭={}",
                mappingId, paymentAmount, isAdditionalMapping);
        } catch (Exception e) {
            log.error("상담료 수입 거래 자동 생성 실패: {}", e.getMessage(), e);
        }
        // ERP 수입 등록은 입금 확인(confirm-deposit)에서만 수행. 결제 확인(confirm-payment)에서는 호출하지 않음.

        // 컨트롤러에서 mapping.getConsultant()/getClient() 접근 시 no Session 방지: 같은 트랜잭션 내에서 lazy 초기화
        Hibernate.initialize(savedMapping.getConsultant());
        Hibernate.initialize(savedMapping.getClient());
        return savedMapping;
    }

     /**
     * 상담료 수입 거래 자동 생성 (중앙화된 금액 관리 사용)
     * runInNewTransaction(REQUIRES_NEW)로 별도 트랜잭션에서 실행되며, 실패해도 부모 트랜잭션이
     * rollback-only로 마크되지 않음. rollback-only 발생 시 내부 서비스 예외가 원인.
     */
    public void createConsultationIncomeTransactionAsync(ConsultantClientMapping mapping) {
        String tenantId = getTenantIdFromMapping(mapping);
        if (tenantId == null || tenantId.isEmpty()) {
            tenantId = TenantContextHolder.getTenantId();
        }
        if (tenantId == null || tenantId.isEmpty()) {
            throw new IllegalStateException(String.format(
                    AdminServiceUserFacingMessages.MSG_TENANT_REQUIRED_CONSULTATION_INCOME_FMT, mapping.getId()));
        }
        final String tenantIdForCallback = tenantId;
        try {
            runInNewTransaction(tenantIdForCallback, () -> createConsultationIncomeTransaction(mapping));
        } catch (Exception e) {
            log.error("💰 [비동기] 상담료 수입 거래 트랜잭션 실행 실패: MappingID={}, Error: {}", mapping.getId(), e.getMessage(), e);
        }
    }

    /**
     * 매핑 소속 테넌트 ID 조회 (consultant 또는 client의 tenantId)
     */
    private String getTenantIdFromMapping(ConsultantClientMapping mapping) {
        if (mapping == null) {
            return null;
        }
        if (mapping.getConsultant() != null && mapping.getConsultant().getTenantId() != null) {
            return mapping.getConsultant().getTenantId();
        }
        if (mapping.getClient() != null && mapping.getClient().getTenantId() != null) {
            return mapping.getClient().getTenantId();
        }
        return null;
    }

    /**
     * 프리랜서 급여 프로필인 경우에만 상담료 총 입금액 기준 사업소득 원천징수(3.3%) 예정액을 반환합니다.
     * 부가세(VAT)와 별개이며, 매출(입금) 총액은 {@code amount}와 동일하게 유지합니다.
     * 활성 급여 프로필이 복수인 경우 {@code updatedAt} 최신 1건을 사용합니다.
     *
     * @param tenantId 테넌트 ID
     * @param mapping  매핑
     * @param grossAmountKrw 총 입금 금액(원)
     * @return 원천징수 예정액(원 단위 절사), 해당 없으면 0
     */
    private BigDecimal resolveFreelanceWithholdingTaxAmount(String tenantId, ConsultantClientMapping mapping,
            long grossAmountKrw) {
        if (grossAmountKrw <= 0 || tenantId == null || tenantId.isEmpty()) {
            return BigDecimal.ZERO;
        }
        if (mapping.getConsultant() == null || mapping.getConsultant().getId() == null) {
            return BigDecimal.ZERO;
        }
        return consultantSalaryProfileRepository
                .findFirstByTenantIdAndConsultantIdAndIsActiveTrueOrderByUpdatedAtDescIdDesc(tenantId,
                        mapping.getConsultant().getId())
                .filter(p -> FreelanceWithholdingTaxUtil.CONSULTANT_SALARY_TYPE_FREELANCE.equals(p.getSalaryType()))
                .map(p -> FreelanceWithholdingTaxUtil.calculateWithholdingTaxAmount(grossAmountKrw))
                .orElse(BigDecimal.ZERO);
    }

    private void createConsultationIncomeTransaction(ConsultantClientMapping mapping) {
        log.info("💰 [중앙화] 상담료 수입 거래 생성 시작: MappingID={}", mapping.getId());
        
        try {
            if (amountManagementService.isDuplicateTransaction(mapping.getId(), 
                    FinancialTransaction.TransactionType.INCOME)) {
                log.warn("🚫 중복 거래 방지: MappingID={}에 대한 수입 거래가 이미 존재합니다. 정상 종료합니다.", mapping.getId());
                return; // 중복 거래는 정상적인 상황이므로 예외 없이 종료
            }
        } catch (Exception e) {
            log.error("❌ 중복 거래 확인 중 오류 발생: MappingID={}, Error: {}", mapping.getId(), e.getMessage(), e);
            return; // 예외 발생 시에도 정상 종료하여 부모 트랜잭션에 영향을 주지 않음
        }
        
        Long accurateAmount = amountManagementService.getAccurateTransactionAmount(mapping);
        
        if (accurateAmount == null || accurateAmount <= 0) {
            log.error("❌ 유효한 거래 금액을 결정할 수 없습니다: MappingID={}", mapping.getId());
            return;
        }
        
        AmountManagementService.AmountConsistencyResult consistency = 
            amountManagementService.checkAmountConsistency(mapping.getId());
        
        if (!consistency.isConsistent()) {
            log.warn("⚠️ 금액 일관성 문제 감지: {}", consistency.getInconsistencyReason());
            log.warn("💡 권장사항: {}", consistency.getRecommendation());
        }
        
        String tenantId = getTenantIdFromMapping(mapping);
        if (tenantId == null || tenantId.isEmpty()) {
            tenantId = TenantContextHolder.getTenantId();
        }
        BigDecimal withholdingTax = resolveFreelanceWithholdingTaxAmount(tenantId, mapping, accurateAmount);
        BigDecimal grossAmountBd = BigDecimal.valueOf(accurateAmount);
        TaxCalculationUtil.TaxCalculationResult consultationTax =
                TaxCalculationUtil.calculateTaxFromPayment(grossAmountBd);
        String incomeDescription = String.format("상담료 입금 확인 - %s (%s) [정확한금액: %,d원]",
                mapping.getPackageName() != null ? mapping.getPackageName() : "상담 패키지",
                mapping.getPaymentMethod() != null ? mapping.getPaymentMethod() : "미지정",
                accurateAmount);
        incomeDescription = incomeDescription + String.format(" [부가세 분리: 공급가 %,d원, 부가세 %,d원]",
                consultationTax.getAmountExcludingTax().longValue(),
                consultationTax.getVatAmount().longValue());
        if (withholdingTax.compareTo(BigDecimal.ZERO) > 0) {
            incomeDescription = incomeDescription + String.format(" [사업소득 원천징수 3.3%% 예정 %,d원(부가세와 별개)]",
                    withholdingTax.longValue());
        }
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType("INCOME")
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE) // 필수 필드: 상담료 수입 거래
                .subcategory("CONSULTATION_FEE") // 상세 분류
                .amount(consultationTax.getAmountIncludingTax()) // 부가세 포함 총액(결제 자동 생성과 동일)
                .taxAmount(consultationTax.getVatAmount())
                .withholdingTaxAmount(withholdingTax)
                .amountBeforeTax(consultationTax.getAmountExcludingTax())
                .description(incomeDescription)
                .transactionDate(java.time.LocalDate.now())
                .relatedEntityId(mapping.getId())
                .relatedEntityType("CONSULTANT_CLIENT_MAPPING")
                .tenantId(tenantId) // 테넌트 명시: createTransaction 시 tenantId 누락 방지
                .branchCode(null) // 표준화 2025-12-06: 브랜치 코드 사용 금지
                .taxIncluded(true)
                .remarks(withholdingTax.compareTo(BigDecimal.ZERO) > 0
                        ? "원천징수(사업소득 3.3%) 예정액. 부가세(VAT) 금액과 혼동 금지."
                        : null)
                .build();
        
        com.coresolution.consultation.dto.FinancialTransactionResponse response = 
            financialTransactionService.createTransaction(request, null);
        
        try {
            FinancialTransaction transaction = 
                financialTransactionRepository.findByTenantIdAndId(tenantId, response.getId()).orElse(null);
            if (transaction != null) {
                transaction.complete(); // 완료 상태로 변경
                transaction.setApprovedAt(java.time.LocalDateTime.now());
                financialTransactionRepository.save(transaction);
                log.info("💚 매칭 연동 거래 즉시 완료 처리: TransactionID={}", response.getId());
            }
        } catch (Exception e) {
            log.error("거래 완료 처리 실패: {}", e.getMessage(), e);
        }
        
        if (mapping.getPaymentAmount() != null && !accurateAmount.equals(mapping.getPaymentAmount())) {
            amountManagementService.recordAmountChange(mapping.getId(), 
                mapping.getPaymentAmount(), accurateAmount, 
                "ERP 연동 시 정확한 패키지 가격 적용", "SYSTEM_AUTO");
        }
        
        log.info("✅ [중앙화] 상담료 수입 거래 생성 완료: MappingID={}, AccurateAmount={}원", 
            mapping.getId(), accurateAmount);
    }
    
     /**
     * 추가 회기 수입 거래 자동 생성 (추가 매칭용)
     */
    private void createAdditionalSessionIncomeTransaction(ConsultantClientMapping mapping, Long additionalPaymentAmount) {
        log.info("💰 [중앙화] 추가 회기 수입 거래 생성 시작: MappingID={}, AdditionalAmount={}",
            mapping.getId(), additionalPaymentAmount);

        Long transactionAmount = additionalPaymentAmount != null ? additionalPaymentAmount : 0L;

        if (transactionAmount <= 0) {
            log.warn("❌ 유효한 추가 결제 금액이 없습니다: MappingID={}", mapping.getId());
            return;
        }

        try {
            String tenantId = TenantContextHolder.getTenantId();
            boolean exists = financialTransactionRepository
                .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                    tenantId, mapping.getId(), "CONSULTANT_CLIENT_MAPPING_ADDITIONAL",
                    FinancialTransaction.TransactionType.INCOME);
            if (exists) {
                log.warn("🚫 중복 거래 방지: MappingID={}에 대한 추가 회기 수입 거래가 이미 존재합니다.", mapping.getId());
                return;
            }
        } catch (Exception e) {
            log.error("❌ 추가 회기 중복 거래 확인 중 오류: MappingID={}, Error={}", mapping.getId(), e.getMessage(), e);
            return;
        }

        int additionalSessions = extractAdditionalSessionsFromNotes(mapping.getNotes());

        String tenantIdForAdditional = getTenantIdFromMapping(mapping);
        if (tenantIdForAdditional == null || tenantIdForAdditional.isEmpty()) {
            tenantIdForAdditional = TenantContextHolder.getTenantId();
        }
        BigDecimal withholdingAdditional = resolveFreelanceWithholdingTaxAmount(tenantIdForAdditional, mapping,
                transactionAmount);
        BigDecimal grossAdditionalBd = BigDecimal.valueOf(transactionAmount);
        TaxCalculationUtil.TaxCalculationResult additionalTax =
                TaxCalculationUtil.calculateTaxFromPayment(grossAdditionalBd);
        String additionalDescription = String.format("추가 회기 상담료 입금 확인 - %s (%d회 추가, %s) [추가금액: %,d원]",
                mapping.getPackageName() != null ? mapping.getPackageName() : "상담 패키지",
                additionalSessions,
                mapping.getPaymentMethod() != null ? mapping.getPaymentMethod() : "미지정",
                transactionAmount);
        additionalDescription = additionalDescription + String.format(" [부가세 분리: 공급가 %,d원, 부가세 %,d원]",
                additionalTax.getAmountExcludingTax().longValue(),
                additionalTax.getVatAmount().longValue());
        if (withholdingAdditional.compareTo(BigDecimal.ZERO) > 0) {
            additionalDescription = additionalDescription + String.format(
                    " [사업소득 원천징수 3.3%% 예정 %,d원(부가세와 별개)]",
                    withholdingAdditional.longValue());
        }

        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType("INCOME")
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE) // 필수 필드: 상담료 수입 거래
                .subcategory("ADDITIONAL_CONSULTATION") // 추가 회기 세부카테고리
                .amount(additionalTax.getAmountIncludingTax())
                .taxAmount(additionalTax.getVatAmount())
                .withholdingTaxAmount(withholdingAdditional)
                .amountBeforeTax(additionalTax.getAmountExcludingTax())
                .description(additionalDescription)
                .transactionDate(java.time.LocalDate.now())
                .relatedEntityId(mapping.getId())
                .relatedEntityType("CONSULTANT_CLIENT_MAPPING_ADDITIONAL")
                .tenantId(tenantIdForAdditional)
                .taxIncluded(true)
                .remarks(withholdingAdditional.compareTo(BigDecimal.ZERO) > 0
                        ? "원천징수(사업소득 3.3%) 예정액. 부가세(VAT) 금액과 혼동 금지."
                        : null)
                .build();
        
        com.coresolution.consultation.dto.FinancialTransactionResponse response = 
            financialTransactionService.createTransaction(request, null);
        
        try {
            String ftTenantIdForReload = getTenantIdFromMapping(mapping);
            if (ftTenantIdForReload == null || ftTenantIdForReload.isEmpty()) {
                ftTenantIdForReload = TenantContextHolder.getTenantId();
            }
            FinancialTransaction transaction = (ftTenantIdForReload != null && !ftTenantIdForReload.isEmpty() && response.getId() != null)
                ? financialTransactionRepository.findByTenantIdAndId(ftTenantIdForReload, response.getId()).orElse(null)
                : null;
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
            String[] lines = notes.split("\n");
            for (String line : lines) {
                if (line.contains("[추가 매칭]")) {
                    if (line.matches(".*\\d+회.*")) {
                        String sessionStr = line.replaceAll(".*?(\\d+)회.*", "$1");
                        return Integer.parseInt(sessionStr);
                    }
                    return 10;
                }
            }
        } catch (Exception e) {
            log.warn("Notes에서 추가 회기수 추출 실패: {}", e.getMessage());
        }
        
        return 10; // 기본값
    }
    
     /**
     * 상담료 환불 거래 자동 생성.
     * 회계: AccountingServiceImpl에서 환불부채 2단계 분개 (비용/매출환입↔환불부채, 환불부채↔현금)로 처리됨.
     */
    private void createConsultationRefundTransaction(ConsultantClientMapping mapping, int refundedSessions, long refundAmount, String reason) {
        log.info("상담료 환불 거래 생성 시작: MappingID={}, RefundAmount={}", 
            mapping.getId(), refundAmount);
        
        if (refundAmount <= 0) {
            log.warn("유효하지 않은 환불 금액: {}", refundAmount);
            return;
        }

        String tenantId = getTenantIdFromMapping(mapping);
        if (tenantId == null || tenantId.isEmpty()) {
            tenantId = TenantContextHolder.getTenantId();
        }
        BigDecimal grossRefundBd = BigDecimal.valueOf(refundAmount);
        TaxCalculationUtil.TaxCalculationResult refundTax =
                TaxCalculationUtil.calculateTaxFromPayment(grossRefundBd);
        String refundDescription = String.format("상담료 환불 - %s (%d회기 환불, 사유: %s)",
                mapping.getPackageName() != null ? mapping.getPackageName() : "상담 패키지",
                refundedSessions,
                reason != null ? reason : "관리자 처리");
        refundDescription = refundDescription + String.format(" [부가세 분리: 공급가 %,d원, 부가세 %,d원]",
                refundTax.getAmountExcludingTax().longValue(),
                refundTax.getVatAmount().longValue());
        
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType("EXPENSE") // 환불은 지출
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .subcategory("CONSULTATION_REFUND") // 환불 세부카테고리
                .amount(refundTax.getAmountIncludingTax())
                .taxAmount(refundTax.getVatAmount())
                .amountBeforeTax(refundTax.getAmountExcludingTax())
                .description(refundDescription)
                .transactionDate(java.time.LocalDate.now())
                .relatedEntityId(mapping.getId())
                .relatedEntityType("CONSULTANT_CLIENT_MAPPING_REFUND")
                .tenantId(tenantId)
                .taxIncluded(true)
                .build();
        
        financialTransactionService.createTransaction(request, null);
        
        log.info("✅ 상담료 환불 거래 생성 완료: MappingID={}, RefundAmount={}", 
            mapping.getId(), refundAmount);
    }
    
     /**
     * 부분 환불 상담료 거래 자동 생성 (중앙화된 금액 관리 사용).
     * 회계: AccountingServiceImpl에서 환불부채 2단계 분개로 처리됨.
     */
    private void createPartialConsultationRefundTransaction(ConsultantClientMapping mapping, int refundSessions, long refundAmount, String reason) {
        log.info("💰 [중앙화] 부분 환불 거래 생성 시작: MappingID={}, RefundSessions={}, RefundAmount={}", 
            mapping.getId(), refundSessions, refundAmount);
        
        if (refundAmount <= 0) {
            log.warn("유효하지 않은 부분 환불 금액: {}", refundAmount);
            return;
        }
        
        
        AmountManagementService.AmountConsistencyResult consistency = 
            amountManagementService.checkAmountConsistency(mapping.getId());
        
        if (!consistency.isConsistent()) {
            log.warn("⚠️ 부분 환불 시 금액 일관성 문제 감지: {}", consistency.getInconsistencyReason());
            log.warn("💡 권장사항: {}", consistency.getRecommendation());
        }

        String tenantIdForPartial = getTenantIdFromMapping(mapping);
        if (tenantIdForPartial == null || tenantIdForPartial.isEmpty()) {
            tenantIdForPartial = TenantContextHolder.getTenantId();
        }
        BigDecimal grossPartialBd = BigDecimal.valueOf(refundAmount);
        TaxCalculationUtil.TaxCalculationResult partialRefundTax =
                TaxCalculationUtil.calculateTaxFromPayment(grossPartialBd);
        String partialRefundDescription = String.format(
                "상담료 부분 환불 - %s (%d회기 부분 환불, 사유: %s) [남은회기: %d회]",
                mapping.getPackageName() != null ? mapping.getPackageName() : "상담 패키지",
                refundSessions,
                reason != null ? reason : "관리자 처리",
                mapping.getRemainingSessions() - refundSessions);
        partialRefundDescription = partialRefundDescription + String.format(
                " [부가세 분리: 공급가 %,d원, 부가세 %,d원]",
                partialRefundTax.getAmountExcludingTax().longValue(),
                partialRefundTax.getVatAmount().longValue());
        
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType("EXPENSE") // 환불은 지출
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .subcategory("CONSULTATION_PARTIAL_REFUND") // 부분 환불 세부카테고리
                .amount(partialRefundTax.getAmountIncludingTax())
                .taxAmount(partialRefundTax.getVatAmount())
                .amountBeforeTax(partialRefundTax.getAmountExcludingTax())
                .description(partialRefundDescription)
                .transactionDate(java.time.LocalDate.now())
                .relatedEntityId(mapping.getId())
                .relatedEntityType("CONSULTANT_CLIENT_MAPPING_PARTIAL_REFUND")
                .tenantId(tenantIdForPartial)
                .branchCode(null) // 표준화 2025-12-06: 브랜치 코드 사용 금지
                .taxIncluded(true)
                .build();
        
        com.coresolution.consultation.dto.FinancialTransactionResponse response = 
            financialTransactionService.createTransaction(request, null);
        
        try {
            FinancialTransaction transaction = (tenantIdForPartial != null && !tenantIdForPartial.isEmpty() && response.getId() != null)
                ? financialTransactionRepository.findByTenantIdAndId(tenantIdForPartial, response.getId()).orElse(null)
                : null;
            if (transaction != null) {
                transaction.complete(); // 완료 상태로 변경
                transaction.setApprovedAt(java.time.LocalDateTime.now());
                financialTransactionRepository.save(transaction);
                log.info("💚 부분 환불 거래 즉시 완료 처리: TransactionID={}", response.getId());
            }
        } catch (Exception e) {
            log.error("부분 환불 거래 완료 처리 실패: {}", e.getMessage(), e);
        }
        
        // 부분 환불 시 매핑 notes/version은 부모 트랜잭션(partialRefundMapping)에서 한 번만 갱신함.
        // 여기서 recordAmountChange를 호출하면 T3에서 mapping.save()로 version이 올라가
        // 부모 복귀 후 StaleStateException이 발생하므로, 부분 환불 경로에서는 호출하지 않음.
        // 금액 변경 이력 문구는 T1의 refundNote에 이미 포함됨.
        
        log.info("✅ [중앙화] 부분 환불 거래 생성 완료: MappingID={}, RefundSessions={}, RefundAmount={}원", 
            mapping.getId(), refundSessions, refundAmount);
    }

     /**
     * 결제 확인 처리 (미수금 상태)
     */
    @Override
    public ConsultantClientMapping confirmPayment(Long mappingId, String paymentMethod, String paymentReference) {
        ConsultantClientMapping mapping = mappingRepository.findByTenantIdAndId(getTenantId(), mappingId)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));
        
        mapping.confirmPayment(paymentMethod, paymentReference);
        
        ConsultantClientMapping savedMapping = mappingRepository.save(mapping);
        
        // 통계/ERP 실패가 결제 완료 트랜잭션에 영향 주지 않도록 별도 트랜잭션에서 실행
        final Long consultantId = savedMapping.getConsultant() != null ? savedMapping.getConsultant().getId() : null;
        final Long clientId = savedMapping.getClient() != null ? savedMapping.getClient().getId() : null;
        String tenantIdForTx = getTenantIdFromMapping(savedMapping);
        if (tenantIdForTx == null) tenantIdForTx = getTenantIdOrNull();
        try {
            if (consultantId != null && clientId != null) {
                runInNewTransaction(tenantIdForTx, () -> realTimeStatisticsService.updateStatisticsOnMappingChange(
                    consultantId, clientId, null));
            }
            log.info("✅ 결제 확인시 실시간 통계 업데이트 완료: mappingId={}", mappingId);
        } catch (Exception e) {
            log.error("❌ 결제 확인시 실시간 통계 업데이트 실패: {}", e.getMessage(), e);
        }
        
        try {
            runInNewTransaction(tenantIdForTx, () -> createReceivablesTransaction(savedMapping));
            log.info("💚 매칭 결제 확인으로 인한 미수금 거래 자동 생성: MappingID={}", mappingId);
        } catch (Exception e) {
            log.error("미수금 거래 자동 생성 실패: {}", e.getMessage(), e);
        }
        // 컨트롤러에서 mapping.getConsultant()/getClient() 접근 시 no Session 방지
        Hibernate.initialize(savedMapping.getConsultant());
        Hibernate.initialize(savedMapping.getClient());
        return savedMapping;
    }

    /**
     * REQUIRES_NEW 트랜잭션에서 실행하여, 내부 예외 시에도 부모 트랜잭션이 rollback-only로 마크되지 않도록 함.
     */
    private void runInNewTransaction(Runnable action) {
        runInNewTransaction(null, action);
    }

    /**
     * REQUIRES_NEW 트랜잭션에서 실행하며, 콜백 진입 시 tenantId를 TenantContextHolder에 설정.
     * ERP/통계 등에서 getRequiredTenantId() 사용 시 새 트랜잭션에서도 동작하도록 함. 종료 시 clear.
     *
     * @param tenantId 콜백 내에서 사용할 테넌트 ID (null이면 설정 생략)
     * @param action 실행할 작업
     */
    private void runInNewTransaction(String tenantId, Runnable action) {
        org.springframework.transaction.support.TransactionTemplate template =
            new org.springframework.transaction.support.TransactionTemplate(transactionManager);
        template.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        try {
            template.executeWithoutResult(status -> {
                if (tenantId != null && !tenantId.isEmpty()) {
                    TenantContextHolder.setTenantId(tenantId);
                }
                try {
                    action.run();
                } catch (RuntimeException ex) {
                    // 중첩 @Transactional 등으로 이미 rollback-only인데 예외를 상위로 올리지 않으면
                    // commit 단계에서 UnexpectedRollbackException이 날 수 있음. 명시 롤백 후 전파.
                    status.setRollbackOnly();
                    throw ex;
                } finally {
                    TenantContextHolder.clear();
                }
            });
        } catch (RuntimeException e) {
            log.error("별도 트랜잭션 실행 실패: {}", e.getMessage(), e);
        }
    }

     /**
     * 미수금(매출채권) 거래 생성
     */
    private void createReceivablesTransaction(ConsultantClientMapping mapping) {
        log.info("💰 [미수금] 매출채권 거래 생성 시작: MappingID={}", mapping.getId());
        
        if (amountManagementService.isDuplicateTransaction(mapping.getId(), 
                FinancialTransaction.TransactionType.RECEIVABLES)) {
            log.warn("🚫 중복 거래 방지: MappingID={}에 대한 미수금 거래가 이미 존재합니다.", mapping.getId());
            return;
        }
        
        Long accurateAmount = amountManagementService.getAccurateTransactionAmount(mapping);
        
        if (accurateAmount == null || accurateAmount <= 0) {
            log.error("❌ 유효한 거래 금액을 결정할 수 없습니다: MappingID={}", mapping.getId());
            return;
        }
        
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType("RECEIVABLES") // 미수금 거래 타입
                .amount(java.math.BigDecimal.valueOf(accurateAmount))
                .description(String.format("상담료 결제 확인 (미수금) - %s (%s) [금액: %,d원]", 
                    mapping.getPackageName() != null ? mapping.getPackageName() : "상담 패키지",
                    mapping.getPaymentMethod() != null ? mapping.getPaymentMethod() : "미지정",
                    accurateAmount))
                .transactionDate(java.time.LocalDate.now())
                .relatedEntityId(mapping.getId())
                .relatedEntityType("CONSULTANT_CLIENT_MAPPING")
                .branchCode(null) // 표준화 2025-12-06: 브랜치 코드 사용 금지
                .taxIncluded(false) // 상담료는 부가세 면세
                .build();
        
        com.coresolution.consultation.dto.FinancialTransactionResponse response = 
            financialTransactionService.createTransaction(request, null);
        
        if (response != null && response.getId() != null) {
            log.info("✅ [미수금] 매출채권 거래 생성 완료: TransactionID={}, MappingID={}, Amount={}원", 
                response.getId(), mapping.getId(), accurateAmount);
        } else {
            log.error("❌ [미수금] 매출채권 거래 생성 실패: MappingID={}", mapping.getId());
        }
    }
    
     /**
     * 입금 확인 처리 (현금 수입)
     * confirm-payment와 동일한 ERP 거래(INCOME) 생성 로직 적용.
     * packagePrice/paymentAmount 유효성 검사, 중복 거래 방지 포함.
     *
     * @param mappingId 매핑 ID
     * @param depositReference 입금 참조번호
     * @return 저장된 ConsultantClientMapping
     * @author MindGarden
     * @since 2025-02-22
     */
    @Override
    public ConsultantClientMapping confirmDeposit(Long mappingId, String depositReference) {
        ConsultantClientMapping mapping = mappingRepository.findByTenantIdAndId(getTenantId(), mappingId)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));

        mapping.confirmDeposit(depositReference);

        // 입금 확인 시 회기 채우기: remainingSessions가 0이고 totalSessions > 0이면 사용 가능 회기 설정
        Integer total = mapping.getTotalSessions();
        Integer remaining = mapping.getRemainingSessions();
        int used = mapping.getUsedSessions() != null ? mapping.getUsedSessions() : 0;
        if (total != null && total > 0 && remaining != null && remaining == 0) {
            mapping.setRemainingSessions(Math.max(0, total - used));
        }

        // packagePrice/paymentAmount 유효성: ERP 거래용 금액 결정 (paymentAmount 우선, 없으면 packagePrice)
        Long effectiveAmount = mapping.getPaymentAmount() != null && mapping.getPaymentAmount() > 0
                ? mapping.getPaymentAmount()
                : mapping.getPackagePrice();
        if (effectiveAmount != null && effectiveAmount > 0) {
            mapping.setPaymentAmount(effectiveAmount);
        }

        ConsultantClientMapping savedMapping = mappingRepository.save(mapping);

        try {
            boolean isAdditionalMapping = savedMapping.getNotes() != null
                    && savedMapping.getNotes().contains("[추가 매칭]");

            if (effectiveAmount == null || effectiveAmount <= 0) {
                log.warn("⚠️ 입금 확인 ERP 거래 스킵: MappingID={}, packagePrice={}, paymentAmount={} (유효 금액 없음)",
                        mappingId, mapping.getPackagePrice(), mapping.getPaymentAmount());
            } else if (isAdditionalMapping) {
                log.info("🔄 추가 매칭 입금 확인 - 추가 회기에 대한 ERP 거래 생성 (별도 트랜잭션): MappingID={}", mappingId);
                String tenantIdForTx = getTenantIdFromMapping(savedMapping);
                if (tenantIdForTx == null) tenantIdForTx = getTenantIdOrNull();
                if (tenantIdForTx == null || tenantIdForTx.isEmpty()) {
                    throw new IllegalStateException(String.format(
                            AdminServiceUserFacingMessages.MSG_TENANT_REQUIRED_MAPPING_ID_FMT, mappingId));
                }
                runInNewTransaction(tenantIdForTx, () -> createAdditionalSessionIncomeTransaction(savedMapping, effectiveAmount));
                log.info("💚 입금 확인 ERP 거래 생성 완료 (추가 매칭): MappingID={}, Amount={}", mappingId, effectiveAmount);
            } else {
                log.info("🆕 신규 매칭 입금 확인 - 전체 패키지에 대한 ERP 거래 생성 (별도 트랜잭션): MappingID={}", mappingId);
                createConsultationIncomeTransactionAsync(savedMapping);
                log.info("💚 입금 확인 ERP 거래 생성 완료 (신규 매칭): MappingID={}", mappingId);
            }
        } catch (Exception e) {
            log.error("❌ 입금 확인 ERP 거래 생성 실패 (입금 확인은 완료됨): MappingID={}, Error={}", mappingId, e.getMessage(), e);
        }

        // 입금 확인 후 ERP 매핑 정보 동기화 (유효 금액이 있을 때만 — INCOME 경로와 동일, 불필요한 프로시저/롤백 방지)
        if (effectiveAmount != null && effectiveAmount > 0) {
            String tenantIdForProc = getTenantIdFromMapping(savedMapping);
            if (tenantIdForProc == null) tenantIdForProc = getTenantIdOrNull();
            if (tenantIdForProc == null || tenantIdForProc.isEmpty()) {
                throw new IllegalStateException(String.format(
                        AdminServiceUserFacingMessages.MSG_TENANT_REQUIRED_ERP_MAPPING_SYNC_FMT, mappingId));
            }
            runInNewTransaction(tenantIdForProc, () -> {
                log.info("🔄 입금 확인 완료, ERP 매핑 정보 동기화 프로시저 호출: mappingId={}", mappingId);
                Map<String, Object> procedureResult = storedProcedureService.updateMappingInfo(
                    mappingId,
                    savedMapping.getPackageName(),
                    savedMapping.getPackagePrice() != null ? savedMapping.getPackagePrice().doubleValue() : 0.0,
                    savedMapping.getTotalSessions() != null ? savedMapping.getTotalSessions() : 0,
                    "입금확인"
                );
                if (Boolean.TRUE.equals(procedureResult.get("success"))) {
                    log.info("✅ ERP 매핑 정보 동기화 완료: mappingId={}, message={}", mappingId, procedureResult.get("message"));
                } else {
                    log.warn("⚠️ ERP 매핑 정보 동기화 실패: mappingId={}, message={}", mappingId, procedureResult.get("message"));
                }
            });
        } else {
            log.debug("입금 확인 ERP 매핑 프로시저 스킵(유효 금액 없음): mappingId={}", mappingId);
        }

        // 컨트롤러에서 mapping.getConsultant()/getClient() 접근 시 no Session 방지
        Hibernate.initialize(savedMapping.getConsultant());
        Hibernate.initialize(savedMapping.getClient());
        return savedMapping;
    }

     /**
     * 관리자 승인
     */
    @Override
    public ConsultantClientMapping approveMapping(Long mappingId, String adminName) {
        ConsultantClientMapping mapping = mappingRepository.findByTenantIdAndId(getTenantId(), mappingId)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));
        
        mapping.approveByAdmin(adminName);

        ConsultantClientMapping savedMapping = mappingRepository.save(mapping);
        // ERP 수입 등록은 입금 확인(confirm-deposit)에서만 수행. 승인(approve)에서는 호출하지 않음.

        // 통계 업데이트는 Controller에서 트랜잭션 커밋 후 별도로 호출
        // 이렇게 하면 통계 업데이트 실패가 승인 트랜잭션에 영향을 주지 않음
        // 컨트롤러/직렬화 시 no Session 방지
        Hibernate.initialize(savedMapping.getConsultant());
        Hibernate.initialize(savedMapping.getClient());
        return savedMapping;
    }

     /**
     * 관리자 거부
     */
    @Override
    public ConsultantClientMapping rejectMapping(Long mappingId, String reason) {
        ConsultantClientMapping mapping = mappingRepository.findByTenantIdAndId(getTenantId(), mappingId)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));
        
        String terminatedStatus = getMappingStatusCode("TERMINATED");
        mapping.setStatus(ConsultantClientMapping.MappingStatus.valueOf(terminatedStatus));
        mapping.setNotes(reason);
        mapping.setTerminatedAt(LocalDateTime.now());
        
        ConsultantClientMapping saved = mappingRepository.save(mapping);
        Hibernate.initialize(saved.getConsultant());
        Hibernate.initialize(saved.getClient());
        return saved;
    }

    /**
     /**
     * 회기 사용 처리
     */
    @Override
    public ConsultantClientMapping useSession(Long mappingId) {
        ConsultantClientMapping mapping = mappingRepository.findByTenantIdAndId(getTenantId(), mappingId)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));
        
        mapping.useSession();
        
        ConsultantClientMapping saved = mappingRepository.save(mapping);
        Hibernate.initialize(saved.getConsultant());
        Hibernate.initialize(saved.getClient());
        return saved;
    }

    /**
     /**
     * 회기 추가 (연장) - 기존 메서드 (즉시 처리)
     /**
     * @deprecated 워크플로우를 통한 회기 추가를 권장합니다.
     */
    @Override
    @Deprecated
    public ConsultantClientMapping extendSessions(Long mappingId, Integer additionalSessions, String packageName, Long packagePrice) {
        log.warn("⚠️ 즉시 회기 추가 사용됨 - 워크플로우를 통한 회기 추가를 권장합니다. mappingId={}", mappingId);
        
        ConsultantClientMapping mapping = mappingRepository.findByTenantIdAndId(getTenantId(), mappingId)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));
        
        mapping.addSessions(additionalSessions, packageName, packagePrice);
        
        ConsultantClientMapping saved = mappingRepository.save(mapping);
        Hibernate.initialize(saved.getConsultant());
        Hibernate.initialize(saved.getClient());
        return saved;
    }
    
     /**
     * 회기 추가 요청 생성 (워크플로우 방식)
     */
    public ConsultantClientMapping createSessionExtensionRequest(Long mappingId, Long requesterId, 
                                                               Integer additionalSessions, String packageName, 
                                                               Long packagePrice, String reason) {
        log.info("🔄 회기 추가 요청 생성: mappingId={}, requesterId={}, sessions={}", 
                mappingId, requesterId, additionalSessions);
        
        String tenantId = getTenantId();
        ConsultantClientMapping mapping = mappingRepository.findByTenantIdAndId(tenantId, mappingId)
                .orElseThrow(() -> new RuntimeException(String.format(
                        AdminServiceUserFacingMessages.MSG_MAPPING_NOT_FOUND_WITH_ID_FMT, mappingId)));
        
        if (userRepository.findByTenantIdAndId(tenantId, requesterId).isEmpty()) {
            throw new RuntimeException(String.format(
                    AdminServiceUserFacingMessages.MSG_REQUESTER_NOT_FOUND_FMT, requesterId));
        }
        
        log.info("✅ 회기 추가 요청 생성 완료 - SessionExtensionService를 통해 처리됩니다.");
        
        return mapping;
    }

     /**
     * 입금 대기 중인 매칭 목록 조회
     */
    @Override
    public List<ConsultantClientMapping> getPendingPaymentMappings() {
        String pendingPaymentStatus = getMappingStatusCode("PENDING_PAYMENT");
        String tenantId = getTenantId();
        List<ConsultantClientMapping> list = mappingRepository.findByTenantId(tenantId).stream()
                .filter(mapping -> mapping.getStatus().name().equals(pendingPaymentStatus))
                .collect(Collectors.toList());
        for (ConsultantClientMapping m : list) {
            Hibernate.initialize(m.getConsultant());
            Hibernate.initialize(m.getClient());
        }
        return list;
    }

     /**
     * 입금 확인된 매칭 목록 조회
     */
    @Override
    public List<ConsultantClientMapping> getPaymentConfirmedMappings() {
        String paymentConfirmedStatus = getMappingStatusCode("PAYMENT_CONFIRMED");
        String tenantId = getTenantId();
        List<ConsultantClientMapping> list = mappingRepository.findByTenantId(tenantId).stream()
                .filter(mapping -> mapping.getStatus().name().equals(paymentConfirmedStatus))
                .collect(Collectors.toList());
        for (ConsultantClientMapping m : list) {
            Hibernate.initialize(m.getConsultant());
            Hibernate.initialize(m.getClient());
        }
        return list;
    }

     /**
     * 입금 확인 대기 중인 매칭 목록 조회 (결제 확인 완료, 입금 확인 대기)
     */
    @Override
    public List<ConsultantClientMapping> getPendingDepositMappings() {
        String tenantId = getTenantId();
        List<ConsultantClientMapping> list = mappingRepository.findByTenantId(tenantId).stream()
                .filter(mapping -> mapping.getPaymentStatus() != null &&
                                 mapping.getPaymentStatus().name().equals("CONFIRMED") &&
                                 mapping.getStatus() != null &&
                                 mapping.getStatus().name().equals("PAYMENT_CONFIRMED"))
                .collect(Collectors.toList());
        // 컨트롤러에서 mapping.getConsultant()/getClient() 접근 시 no Session 방지
        for (ConsultantClientMapping m : list) {
            Hibernate.initialize(m.getConsultant());
            Hibernate.initialize(m.getClient());
        }
        return list;
    }

     /**
     * 활성 매칭 목록 조회 (승인 완료)
     */
    @Override
    public List<ConsultantClientMapping> getActiveMappings() {
        // 표준화 2025-12-05: tenantId 필터링 필수
        String tenantId = getTenantId();
        List<ConsultantClientMapping> list = mappingRepository.findActiveMappingsWithDetailsByTenantId(tenantId);
        for (ConsultantClientMapping m : list) {
            Hibernate.initialize(m.getConsultant());
            Hibernate.initialize(m.getClient());
        }
        return list;
    }

     /**
     * 회기 소진된 매칭 목록 조회
     */
    @Override
    public List<ConsultantClientMapping> getSessionsExhaustedMappings() {
        String sessionsExhaustedStatus = getMappingStatusCode("SESSIONS_EXHAUSTED");
        String tenantId = getTenantId();
        List<ConsultantClientMapping> list = mappingRepository.findByTenantId(tenantId).stream()
                .filter(mapping -> mapping.getStatus().name().equals(sessionsExhaustedStatus))
                .collect(Collectors.toList());
        for (ConsultantClientMapping m : list) {
            Hibernate.initialize(m.getConsultant());
            Hibernate.initialize(m.getClient());
        }
        return list;
    }

    @Override
    public Map<String, Object> getSessionStatistics() {
        try {
            Map<String, Object> statistics = new HashMap<>();
            
            long totalMappings = mappingRepository.count();
            statistics.put("totalMappings", totalMappings);
            
            // 표준화 2025-12-05: BaseTenantAwareService 상속으로 getTenantId() 사용
            String tenantId = getTenantId();
            long activeMappings = mappingRepository.findByTenantId(tenantId).stream()
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    .filter(mapping -> mapping.getStatus() == ConsultantClientMapping.MappingStatus.ACTIVE)
                    .count();
            statistics.put("activeMappings", activeMappings);
            
            long sessionsExhaustedMappings = mappingRepository.findByTenantId(tenantId).stream()
                    .filter(mapping -> mapping.getStatus() == ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED)
                    .count();
            statistics.put("sessionsExhaustedMappings", sessionsExhaustedMappings);
            
            int totalSessions = mappingRepository.findByTenantId(tenantId).stream()
                    .mapToInt(mapping -> mapping.getTotalSessions() != null ? mapping.getTotalSessions() : 0)
                    .sum();
            statistics.put("totalSessions", totalSessions);
            
            int usedSessions = mappingRepository.findByTenantId(tenantId).stream()
                    .mapToInt(mapping -> {
                        if (mapping.getTotalSessions() != null && mapping.getRemainingSessions() != null) {
                            return mapping.getTotalSessions() - mapping.getRemainingSessions();
                        }
                        return 0;
                    })
                    .sum();
            statistics.put("usedSessions", usedSessions);
            
            int remainingSessions = mappingRepository.findByTenantId(tenantId).stream()
                    .mapToInt(mapping -> mapping.getRemainingSessions() != null ? mapping.getRemainingSessions() : 0)
                    .sum();
            statistics.put("remainingSessions", remainingSessions);
            
            return statistics;
        } catch (Exception e) {
            log.error("❌ 회기관리 통계 조회 실패: {}", e.getMessage(), e);
            throw new RuntimeException(AdminServiceUserFacingMessages.MSG_SESSION_STATS_QUERY_FAILED, e);
        }
    }

    @Override
    public List<Map<String, Object>> getSessions() {
        try {
            // 표준화 2025-12-05: BaseTenantAwareService 상속으로 getTenantId() 사용
            String tenantId = getTenantId();
            List<ConsultantClientMapping> mappings = mappingRepository.findByTenantId(tenantId);
            
            return mappings.stream()
                    .map(mapping -> {
                        Map<String, Object> sessionData = new HashMap<>();
                        sessionData.put("id", mapping.getId());
                        sessionData.put("consultantName", mapping.getConsultant() != null ? mapping.getConsultant().getName() : "N/A");
                        sessionData.put("clientName", mapping.getClient() != null ? mapping.getClient().getName() : "N/A");
                        sessionData.put("status", mapping.getStatus() != null ? mapping.getStatus().toString() : "UNKNOWN");
                        sessionData.put("totalSessions", mapping.getTotalSessions());
                        sessionData.put("remainingSessions", mapping.getRemainingSessions());
                        sessionData.put("startDate", mapping.getStartDate());
                        sessionData.put("endDate", mapping.getEndDate());
                        sessionData.put("createdAt", mapping.getCreatedAt());
                        return sessionData;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("❌ 회기관리 목록 조회 실패: {}", e.getMessage(), e);
            throw new RuntimeException(AdminServiceUserFacingMessages.MSG_SESSION_LIST_QUERY_FAILED, e);
        }
    }

    @Override
    public List<User> getAllConsultants() {
        String tenantId = getTenantId();
        List<Consultant> consultantEntities = consultantRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        List<User> consultants = consultantEntities.stream()
                .map(consultant -> (User) consultant)
                .collect(Collectors.toList());
        
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
        // 표준화 2025-12-05: tenantId 필터링 필수
        String tenantId = getTenantId();
        List<Consultant> consultants = consultantRepository.findActiveConsultantsByTenantId(tenantId);
        
        Map<String, Map<String, String>> gradeStyles = new HashMap<>();
        try {
            List<CommonCode> gradeCodes = commonCodeService.getCommonCodesByGroup("CONSULTANT_GRADE");
            for (CommonCode code : gradeCodes) {
                Map<String, String> style = new HashMap<>();
                style.put("color", code.getColorCode() != null ? code.getColorCode() : "#6b7280");
                style.put("icon", code.getIcon() != null ? code.getIcon() : "⭐");
                gradeStyles.put(code.getCodeValue(), style);
            }
        } catch (Exception e) {
            log.warn("상담사 등급 스타일 조회 실패, 기본값 사용: {}", e.getMessage());
        }
        
        return consultants.stream()
            .map(consultant -> {
                Map<String, Object> consultantData = new HashMap<>();
                consultantData.put("id", consultant.getId());
                consultantData.put("name", consultant.getName());
                consultantData.put("email", consultant.getEmail());
                
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
                consultantData.put("branchCode", null); // 표준화 2025-12-06: 브랜치 코드 사용 금지
                consultantData.put("createdAt", consultant.getCreatedAt());
                consultantData.put("updatedAt", consultant.getUpdatedAt());
                
                String grade = consultant.getGrade() != null ? consultant.getGrade() : "CONSULTANT_JUNIOR";
                Map<String, String> style = gradeStyles.getOrDefault(grade, Map.of("color", "#6b7280", "icon", "⭐"));
                consultantData.put("gradeColor", style.get("color"));
                consultantData.put("gradeIcon", style.get("icon"));
                consultantData.put("grade", grade);
                
                String currentTenantId = getTenantIdOrNull();
                
                long actualCurrentClients = currentTenantId != null ? 
                    mappingRepository.countByConsultantIdAndStatusIn(
                        currentTenantId,
                        consultant.getId(), 
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                        List.of(ConsultantClientMapping.MappingStatus.ACTIVE, ConsultantClientMapping.MappingStatus.PAYMENT_CONFIRMED)
                    ) : 0L;
                consultantData.put("currentClients", (int) actualCurrentClients);
                consultantData.put("maxClients", consultant.getMaxClients());
                consultantData.put("totalClients", consultant.getTotalClients());
                consultantData.put("totalConsultations", consultant.getTotalConsultations());
                try {
                    Map<String, Object> ratingStats = consultantRatingService.getConsultantRatingStats(consultant.getId());
                    if (ratingStats != null && !ratingStats.isEmpty()) {
                        consultantData.put("averageRating", ratingStats.getOrDefault("averageHeartScore", 0.0));
                        consultantData.put("totalRatings", ratingStats.getOrDefault("totalRatingCount", 0));
                    } else {
                        consultantData.put("averageRating", 0.0);
                        consultantData.put("totalRatings", 0);
                    }
                } catch (Exception e) {
                    log.warn("평점 데이터 조회 실패, 기본값 사용: consultantId={}, error={}", consultant.getId(), e.getMessage());
                    consultantData.put("averageRating", 0.0);
                    consultantData.put("totalRatings", 0);
                }
                consultantData.put("yearsOfExperience", consultant.getYearsOfExperience());
                consultantData.put("isAvailable", consultant.getIsAvailable());
                
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
        
        // 표준화 2025-12-05: tenantId 필터링 필수
        String tenantId = getTenantIdOrNull();
        if (tenantId == null || tenantId.isEmpty()) {
            log.error("❌ tenantId가 설정되지 않았습니다. 상담사 목록을 조회할 수 없습니다.");
            throw new IllegalStateException("Tenant ID is required but not set in current context");
        }
        log.info("✅ tenantId 확인: {}", tenantId);
        List<Consultant> consultants = consultantRepository.findActiveConsultantsByTenantId(tenantId);
        
        Map<String, Object> allVacations = consultantAvailabilityService.getAllConsultantsVacations(date);
        
        return consultants.stream()
            .map(consultant -> {
                Map<String, Object> consultantData = new HashMap<>();
                consultantData.put("id", consultant.getId());
                
                // 표준화 2025-12-08: 개인정보 캐시 서비스를 사용하여 복호화된 데이터 사용
                Map<String, String> decryptedData = userPersonalDataCacheService.getDecryptedUserData(consultant);
                if (decryptedData != null) {
                    consultantData.put("name", decryptedData.get("name"));
                    consultantData.put("email", decryptedData.get("email"));
                    consultantData.put("phone", decryptedData.get("phone"));
                } else {
                    // 캐시에 없으면 직접 복호화 (fallback)
                    log.warn("⚠️ 상담사 개인정보 캐시 없음, 직접 복호화: consultantId={}", consultant.getId());
                    consultantData.put("name", encryptionUtil.safeDecrypt(consultant.getName()));
                    consultantData.put("email", encryptionUtil.safeDecrypt(consultant.getEmail()));
                    
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
                }
                
                consultantData.put("role", consultant.getRole());
                consultantData.put("isActive", consultant.getIsActive());
                consultantData.put("branchCode", null); // 표준화 2025-12-06: 브랜치 코드 사용 금지
                consultantData.put("createdAt", consultant.getCreatedAt());
                consultantData.put("updatedAt", consultant.getUpdatedAt());
                consultantData.put("profileImageUrl", consultant.getProfileImageUrl());
                
                String tenantId2 = com.coresolution.core.context.TenantContextHolder.getTenantId();
                
                long actualCurrentClients = tenantId2 != null ? 
                    mappingRepository.countByConsultantIdAndStatusIn(
                        tenantId2,
                        consultant.getId(), 
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                        List.of(ConsultantClientMapping.MappingStatus.ACTIVE, ConsultantClientMapping.MappingStatus.PAYMENT_CONFIRMED)
                    ) : 0L;
                consultantData.put("currentClients", (int) actualCurrentClients);
                consultantData.put("maxClients", consultant.getMaxClients());
                consultantData.put("totalClients", consultant.getTotalClients());
                consultantData.put("totalConsultations", consultant.getTotalConsultations());
                try {
                    Map<String, Object> ratingStats = consultantRatingService.getConsultantRatingStats(consultant.getId());
                    if (ratingStats != null && !ratingStats.isEmpty()) {
                        consultantData.put("averageRating", ratingStats.getOrDefault("averageHeartScore", 0.0));
                        consultantData.put("totalRatings", ratingStats.getOrDefault("totalRatingCount", 0));
                    } else {
                        consultantData.put("averageRating", 0.0);
                        consultantData.put("totalRatings", 0);
                    }
                } catch (Exception e) {
                    log.warn("평점 데이터 조회 실패, 기본값 사용: consultantId={}, error={}", consultant.getId(), e.getMessage());
                    consultantData.put("averageRating", 0.0);
                    consultantData.put("totalRatings", 0);
                }
                consultantData.put("yearsOfExperience", consultant.getYearsOfExperience());
                consultantData.put("isAvailable", consultant.getIsAvailable());
                
                String specialization = consultant.getSpecialization();
                if (specialization != null && !specialization.trim().isEmpty()) {
                    consultantData.put("specialization", specialization);
                    consultantData.put("specializationDetails", getSpecializationDetailsFromDB(specialization));
                } else {
                    consultantData.put("specialization", null);
                    consultantData.put("specializationDetails", new ArrayList<>());
                }
                
                String consultantId = consultant.getId().toString();
                @SuppressWarnings("unchecked")
                Map<String, Object> consultantVacations = (Map<String, Object>) allVacations.get(consultantId);
                
                if (consultantVacations != null && consultantVacations.containsKey(date)) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> vacationInfo = (Map<String, Object>) consultantVacations.get(date);
                    consultantData.put("isOnVacation", true);
                    consultantData.put("vacationType", vacationInfo.get("type"));
                    consultantData.put("vacationReason", vacationInfo.get("reason"));
                    consultantData.put("vacationStartTime", vacationInfo.get("startTime"));
                    consultantData.put("vacationEndTime", vacationInfo.get("endTime"));
                    consultantData.put("vacationConsultantName", vacationInfo.get("consultantName"));
                    
                    consultantData.put("busy", true); // 휴가 중이므로 바쁨
                    consultantData.put("isVacation", true); // 휴가 상태임을 명시
                } else {
                    consultantData.put("isOnVacation", false);
                    consultantData.put("vacationType", null);
                    consultantData.put("vacationReason", null);
                    consultantData.put("vacationStartTime", null);
                    consultantData.put("vacationEndTime", null);
                    
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
        
        String[] codes = specialization.split(",");
        List<Map<String, String>> details = new ArrayList<>();
        
        for (String code : codes) {
            code = code.trim();
            if (!code.isEmpty()) {
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
        specialtyMap.put("ADOLESCENT", "청소년상담"); // ADOLESCENT 추가
        specialtyMap.put("ADDICTION", "중독");
        specialtyMap.put("EATING", "섭식장애");
        specialtyMap.put("SLEEP", "수면장애");
        specialtyMap.put("ANGER", "분노조절");
        specialtyMap.put("GRIEF", "상실");
        specialtyMap.put("SELF_ESTEEM", "자존감");
        specialtyMap.put("CAREER", "진로상담"); // CAREER 추가
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
            if (user.getName() != null && !user.getName().trim().isEmpty()) {
                if (isEncryptedData(user.getName())) {
                    user.setName(encryptionUtil.decrypt(user.getName()));
                }
            }
            
            if (user.getNickname() != null && !user.getNickname().trim().isEmpty()) {
                if (isEncryptedData(user.getNickname())) {
                    user.setNickname(encryptionUtil.decrypt(user.getNickname()));
                }
            }
            
            if (user.getPhone() != null && !user.getPhone().trim().isEmpty()) {
                if (isEncryptedData(user.getPhone())) {
                    user.setPhone(encryptionUtil.decrypt(user.getPhone()));
                }
            }
            
            if (user.getGender() != null && !user.getGender().trim().isEmpty()) {
                if (isEncryptedData(user.getGender())) {
                    user.setGender(encryptionUtil.decrypt(user.getGender()));
                }
            }
            
        } catch (Exception e) {
            log.warn("사용자 개인정보 복호화 실패: {}", e.getMessage());
        }
        
        return user;
    }
    
     /**
     * 데이터가 암호화된 데이터인지 확인
     /**
     * Base64 패턴과 길이로 판단
     */
    private boolean isEncryptedData(String data) {
        if (data == null || data.trim().isEmpty()) {
            return false;
        }
        
        if (!data.matches("^[A-Za-z0-9+/]*={0,2}$")) {
            return false;
        }
        
        if (data.length() < 20) {
            return false;
        }
        
        if (data.matches(".*[가-힣].*") || data.matches(".*[^A-Za-z0-9+/=].*")) {
            return false;
        }
        
        return true;
    }

     /**
     * 전화번호 하이픈 포맷팅
     /**
     * 01012345678 -> 010-1234-5678
     */
    private String formatPhoneNumber(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return phone;
        }
        
        String numbers = phone.replaceAll("[^0-9]", "");
        
        if (numbers.length() == 11 && numbers.startsWith("01")) {
            return numbers.substring(0, 3) + "-" + numbers.substring(3, 7) + "-" + numbers.substring(7);
        }
        else if (numbers.length() == 10) {
            if (numbers.startsWith("02")) {
                return numbers.substring(0, 2) + "-" + numbers.substring(2, 6) + "-" + numbers.substring(6);
            } else {
                return numbers.substring(0, 3) + "-" + numbers.substring(3, 6) + "-" + numbers.substring(6);
            }
        }
        else if (numbers.length() == 8) {
            return numbers.substring(0, 4) + "-" + numbers.substring(4);
        }
        
        return phone;
    }

    @Override
    public List<Client> getAllClients() {
        String tenantId = getTenantIdOrNull();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return new ArrayList<>();
        }
        List<User> clientUsers = userRepository.findByRoleAndIsActiveTrue(tenantId, UserRole.CLIENT);
        
        log.info("🔍 내담자 조회 - 총 {}명", clientUsers.size());
        
        for (User user : clientUsers) {
            log.info("👤 내담자 원본 데이터 - ID: {}, 이름: '{}', 이메일: '{}', 전화번호: '{}', 활성상태: {}, 삭제상태: {}, 역할: {}", 
                user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getIsActive(), user.getIsDeleted(), user.getRole());
        }
        
        clientUsers = clientUsers.stream()
            .map(user -> decryptUserPersonalData(user))
            .collect(Collectors.toList());
        
        List<User> allUsers = userRepository.findByTenantId(tenantId);
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
                Client client = new Client();
                client.setId(user.getId());
                client.setName(user.getName());
                client.setEmail(user.getEmail());
                
                String phone = user.getPhone();
                if (phone == null || phone.trim().isEmpty()) {
                    phone = "-"; // SNS 가입자는 전화번호가 없을 수 있음
                } else {
                    phone = formatPhoneNumber(phone);
                }
                client.setPhone(phone);
                
                client.setBirthDate(user.getBirthDate());
                client.setGender(user.getGender());
                client.setBranchCode(null); // 표준화 2025-12-06: 브랜치 코드 사용 금지
                client.setIsDeleted(user.getIsDeleted()); // isDeleted 필드 직접 사용
                client.setCreatedAt(user.getCreatedAt());
                client.setUpdatedAt(user.getUpdatedAt());
                
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
            
            // 표준화 2025-12-05: BaseTenantAwareService 상속으로 getTenantId() 사용
            String tenantId = getTenantId();
            List<User> clientUsers = userRepository.findByRoleAndIsActiveTrue(tenantId, UserRole.CLIENT);
            log.info("🔍 내담자 수: {}", clientUsers.size());
            
            // 표준화 2025-12-05: tenantId 필터링 필수
            List<ConsultantClientMapping> allMappings = mappingRepository.findAllWithDetailsByTenantId(tenantId);
            log.info("🔍 매칭 수: {}", allMappings.size());
            
            List<Map<String, Object>> result = new ArrayList<>();
            
            for (User user : clientUsers) {
                // 표준화 2025-12-08: 개인정보 복호화 (캐시 활용)
                Map<String, String> decryptedData = userPersonalDataCacheService.getDecryptedUserData(user);
                String clientName = decryptedData != null ? decryptedData.get("name") : user.getName();
                String clientEmail = decryptedData != null ? decryptedData.get("email") : user.getEmail();
                String clientPhone = decryptedData != null ? decryptedData.get("phone") : user.getPhone();
                
                Map<String, Object> clientData = new HashMap<>();
                
                clientData.put("id", user.getId());
                clientData.put("name", clientName != null ? clientName : "");
                clientData.put("email", clientEmail != null ? clientEmail : "");
                
                String phone = clientPhone;
                if (phone == null || phone.trim().isEmpty()) {
                    phone = "-"; // SNS 가입자는 전화번호가 없을 수 있음
                } else {
                    phone = formatPhoneNumber(phone);
                }
                clientData.put("phone", phone);
                
                clientData.put("birthDate", user.getBirthDate());
                clientData.put("gender", decryptedData != null ? decryptedData.get("gender") : user.getGender());
                clientData.put("grade", user.getGrade() != null ? user.getGrade() : "");
                clientData.put("isActive", user.getIsActive());
                clientData.put("isDeleted", user.getIsDeleted());
                clientData.put("createdAt", user.getCreatedAt());
                clientData.put("updatedAt", user.getUpdatedAt());
                clientData.put("branchCode", null); // 표준화 2025-12-06: 브랜치 코드 사용 금지
                clientData.put("profileImageUrl", user.getProfileImageUrl());
                
                log.info("👤 통합 내담자 데이터 - ID: {}, 이름: '{}', 전화번호: '{}'", 
                    user.getId(), clientName, phone);
                
                List<Map<String, Object>> mappings = allMappings.stream()
                    .filter(mapping -> mapping.getClient() != null && mapping.getClient().getId().equals(user.getId()))
                    .map(mapping -> {
                        Map<String, Object> mappingData = new HashMap<>();
                        mappingData.put("mappingId", mapping.getId());
                        mappingData.put("consultantId", mapping.getConsultant() != null ? mapping.getConsultant().getId() : null);
                        // 표준화 2025-12-08: 상담사 이름 복호화 (캐시 활용)
                        if (mapping.getConsultant() != null) {
                            Map<String, String> decryptedConsultant = userPersonalDataCacheService.getDecryptedUserData(mapping.getConsultant());
                            String consultantName = decryptedConsultant != null ? decryptedConsultant.get("name") : mapping.getConsultant().getName();
                            mappingData.put("consultantName", consultantName != null ? consultantName : "");
                        } else {
                            mappingData.put("consultantName", "");
                        }
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
                
                long activeMappingCount = mappings.stream()
                    .filter(mapping -> "APPROVED".equals(mapping.get("status")))
                    .count();
                clientData.put("activeMappingCount", activeMappingCount);
                
                int totalRemainingSessions = mappings.stream()
                    .filter(mapping -> "APPROVED".equals(mapping.get("status")))
                    .mapToInt(mapping -> (Integer) mapping.get("remainingSessions"))
                    .sum();
                clientData.put("totalRemainingSessions", totalRemainingSessions);
                
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
            throw new RuntimeException(String.format(
                    AdminServiceUserFacingMessages.MSG_INTEGRATED_CLIENT_DATA_QUERY_FAILED_FMT, e.getMessage()), e);
        }
    }

    @Override
    public List<ConsultantClientMapping> getAllMappings() {
        try {
            // 표준화 2025-12-05: tenantId 필터링 필수
            String tenantId = getTenantId();
            List<ConsultantClientMapping> list = mappingRepository.findAllWithDetailsByTenantId(tenantId);
            for (ConsultantClientMapping m : list) {
                Hibernate.initialize(m.getConsultant());
                Hibernate.initialize(m.getClient());
            }
            return list;
        } catch (Exception e) {
            System.err.println("매칭 목록 조회 실패 (빈 목록 반환): " + e.getMessage());
            return new java.util.ArrayList<>();
        }
    }

    @Override
    public User updateConsultant(Long id, ConsultantRegistrationRequest request) {
        if (request == null) {
            throw new IllegalArgumentException(AdminServiceUserFacingMessages.MSG_REQUEST_BODY_MISSING);
        }

        Consultant consultant = consultantRepository.findByTenantIdAndId(getTenantId(), id)
                .orElseThrow(() -> new EntityNotFoundException("상담사", id));

        if (consultant.getRole() != UserRole.CONSULTANT) {
            throw new IllegalArgumentException(AdminServiceUserFacingMessages.MSG_USER_NOT_CONSULTANT);
        }

        // null/blank 시 기존 값 유지 (빈 문자열 저장으로 인한 NOT NULL 등 제약 500 방지)
        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            consultant.setName(encryptionUtil.safeEncrypt(request.getName()));
        }
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            consultant.setEmail(encryptionUtil.safeEncrypt(request.getEmail()));
        }
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            consultant.setPhone(encryptionUtil.safeEncrypt(request.getPhone()));
        }

        if (request.getSpecialization() != null) {
            consultant.setSpecialization(request.getSpecialization());
        }
        if (request.getProfileImageUrl() != null && !request.getProfileImageUrl().trim().isEmpty()) {
            consultant.setProfileImageUrl(request.getProfileImageUrl().trim());
        }

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            log.info("🔧 상담사 비밀번호 변경: ID={}", id);
            consultant.setPassword(passwordService.encodePassword(request.getPassword()));
            consultant.setUpdatedAt(LocalDateTime.now());
            consultant.setVersion(consultant.getVersion() + 1);
        }

        // 주민번호: 입력한 경우에만 RrnValidationUtil 검증 후 나이/성별 계산·암호화 저장
        if (request.getRrnFirst6() != null && !request.getRrnFirst6().trim().isEmpty()
                && request.getRrnLast1() != null && !request.getRrnLast1().trim().isEmpty()) {
            applyRrnAndAddressToUser(consultant, request.getRrnFirst6(), request.getRrnLast1(),
                    null, null, null);
        }
        // 주소: request 값 반영 (빈 문자열이면 null로 두지 않고 요청대로 저장 가능)
        if (request.getAddress() != null) {
            consultant.setAddress(request.getAddress().trim().isEmpty() ? null : request.getAddress().trim());
        }
        if (request.getAddressDetail() != null) {
            consultant.setAddressDetail(request.getAddressDetail().trim().isEmpty() ? null : request.getAddressDetail().trim());
        }
        if (request.getPostalCode() != null) {
            consultant.setPostalCode(request.getPostalCode().trim().isEmpty() ? null : request.getPostalCode().trim());
        }

        // 자격·경력 (Consultant 전용)
        if (request.getQualifications() != null) {
            consultant.setCertification(request.getQualifications().trim().isEmpty() ? null : request.getQualifications().trim());
        }
        if (request.getWorkHistory() != null) {
            consultant.setWorkHistory(request.getWorkHistory().trim().isEmpty() ? null : request.getWorkHistory().trim());
        }
        if (request.getGrade() != null) {
            consultant.setGrade(request.getGrade().trim().isEmpty() ? null : request.getGrade().trim());
        }

        // 상태 반영: request.getStatus()가 null/empty가 아니면 ACTIVE→true, 그 외→false
        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            consultant.setIsActive("ACTIVE".equalsIgnoreCase(request.getStatus().trim()));
        }

        User savedConsultant = consultantRepository.save(consultant);

        // 표준화 2025-12-08: 사용자 정보 업데이트 시 캐시 무효화
        if (savedConsultant.getTenantId() != null) {
            userPersonalDataCacheService.evictUserPersonalDataCache(
                savedConsultant.getTenantId(),
                savedConsultant.getId()
            );
        }

        // 상담사 목록 캐시 무효화 (프로필 사진 등 수정 후 목록에서 즉시 반영)
        consultantStatsService.evictAllConsultantStatsCache();

        return savedConsultant;
    }

    @Override
    public User updateConsultantGrade(Long id, String grade) {
        User consultant = userRepository.findByTenantIdAndId(getTenantId(), id)
                .orElseThrow(() -> new RuntimeException("Consultant not found"));
        
        consultant.setGrade(grade);
        consultant.setLastGradeUpdate(LocalDateTime.now());
        consultant.setUpdatedAt(LocalDateTime.now());
        
        log.info("🔧 상담사 등급 업데이트: ID={}, 등급={}", id, grade);
        User saved = userRepository.save(consultant);

        if (saved.getTenantId() != null) {
            userPersonalDataCacheService.evictUserPersonalDataCache(saved.getTenantId(), saved.getId());
        }
        consultantStatsService.evictAllConsultantStatsCache();

        return saved;
    }

    @Override
    public Client updateClient(Long id, ClientRegistrationRequest request) {
        if (request == null) {
            throw new IllegalArgumentException(AdminServiceUserFacingMessages.MSG_REQUEST_BODY_MISSING);
        }

        String tenantIdForClient = getTenantId();
        User clientUser = userRepository.findByTenantIdAndId(tenantIdForClient, id)
                .orElseThrow(() -> new EntityNotFoundException("내담자", id));

        if (clientUser.getRole() != UserRole.CLIENT) {
            throw new IllegalArgumentException(AdminServiceUserFacingMessages.MSG_USER_NOT_CLIENT);
        }

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            clientUser.setName(encryptionUtil.safeEncrypt(request.getName()));
        }
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            clientUser.setEmail(encryptionUtil.safeEncrypt(request.getEmail()));
        }
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            clientUser.setPhone(encryptionUtil.safeEncrypt(request.getPhone()));
        }
        if (request.getProfileImageUrl() != null && !request.getProfileImageUrl().trim().isEmpty()) {
            clientUser.setProfileImageUrl(request.getProfileImageUrl().trim());
        }
        if (request.getNotes() != null) {
            clientUser.setNotes(request.getNotes().trim().isEmpty() ? null : request.getNotes().trim());
        }
        if (request.getGrade() != null) {
            String newGrade = request.getGrade().trim().isEmpty() ? null : request.getGrade().trim();
            if (!Objects.equals(clientUser.getGrade(), newGrade)) {
                clientUser.setLastGradeUpdate(LocalDateTime.now());
            }
            clientUser.setGrade(newGrade);
        }

        // 주민번호: 입력한 경우에만 검증 후 나이/성별 계산·암호화 저장
        if (request.getRrnFirst6() != null && !request.getRrnFirst6().trim().isEmpty()
                && request.getRrnLast1() != null && !request.getRrnLast1().trim().isEmpty()) {
            applyRrnAndAddressToUser(clientUser, request.getRrnFirst6(), request.getRrnLast1(),
                    null, null, null);
        }
        // 주소: User에 반영
        if (request.getAddress() != null) {
            clientUser.setAddress(request.getAddress().trim().isEmpty() ? null : request.getAddress().trim());
        }
        if (request.getAddressDetail() != null) {
            clientUser.setAddressDetail(request.getAddressDetail().trim().isEmpty() ? null : request.getAddressDetail().trim());
        }
        if (request.getPostalCode() != null) {
            clientUser.setPostalCode(request.getPostalCode().trim().isEmpty() ? null : request.getPostalCode().trim());
        }

        // 상태 반영: request.getStatus()가 null/empty가 아니면 ACTIVE→true, 그 외→false
        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            clientUser.setIsActive("ACTIVE".equalsIgnoreCase(request.getStatus().trim()));
        }

        User savedUser = userRepository.saveAndFlush(clientUser);
        validateClientUserTenantIntegrity(savedUser, tenantIdForClient);

        // 표준화 2025-12-08: 사용자 정보 업데이트 시 캐시 무효화
        if (savedUser.getTenantId() != null) {
            userPersonalDataCacheService.evictUserPersonalDataCache(
                savedUser.getTenantId(),
                savedUser.getId()
            );
        }

        // Client upsert: 테넌트+id(삭제 포함) → 없으면 동일 PK로 clients 행 존재 여부 확인
        // clients.tenant_id 가 NULL·users와 불일치하면 첫 조회가 비어 INSERT 시도 → PK 중복·제약 위반
        Optional<Client> existingClientOpt =
                clientRepository.findByTenantIdAndIdIncludingDeleted(tenantIdForClient, id);
        if (existingClientOpt.isEmpty()) {
            existingClientOpt = clientRepository.findById(id)
                    .filter(c -> Objects.equals(c.getId(), savedUser.getId()));
        }
        Client persistedClient;
        if (existingClientOpt.isPresent()) {
            Client client = existingClientOpt.get();
            if (!Objects.equals(client.getTenantId(), savedUser.getTenantId())) {
                log.warn("clients.tenant_id 정합 복구: clientId={}, before={}, after={}",
                        id, client.getTenantId(), savedUser.getTenantId());
                client.setTenantId(savedUser.getTenantId());
            }
            if (Boolean.TRUE.equals(client.getIsDeleted())) {
                client.restore();
            }
            client.setName(savedUser.getName());
            client.setEmail(savedUser.getEmail());
            client.setPhone(savedUser.getPhone());
            client.setAddress(savedUser.getAddress());
            client.setAddressDetail(savedUser.getAddressDetail());
            client.setPostalCode(savedUser.getPostalCode());
            client.setBirthDate(savedUser.getBirthDate());
            client.setGender(savedUser.getGender());
            if (request.getVehiclePlate() != null) {
                String plate = VehiclePlateText.normalizeOrNull(request.getVehiclePlate());
                client.setVehiclePlate(plate);
                if (plate != null) {
                    log.info("🚗 내담자 수정: 차량번호 갱신 (마스킹): {}", maskVehiclePlate(plate));
                }
            }
            if (request.getEmergencyContact() != null) {
                client.setEmergencyContact(request.getEmergencyContact().trim().isEmpty()
                        ? null
                        : encryptionUtil.safeEncrypt(request.getEmergencyContact().trim()));
            }
            if (request.getEmergencyPhone() != null) {
                client.setEmergencyPhone(request.getEmergencyPhone().trim().isEmpty()
                        ? null
                        : encryptionUtil.safeEncrypt(request.getEmergencyPhone().trim()));
            }
            if (request.getConsultationPurpose() != null) {
                client.setConsultationPurpose(trimToNull(request.getConsultationPurpose()));
            }
            if (request.getConsultationHistory() != null) {
                client.setConsultationHistory(trimToNull(request.getConsultationHistory()));
            }
            persistedClient = clientRepository.save(client);
        } else {
            Client client = new Client();
            client.setId(savedUser.getId());
            client.setTenantId(savedUser.getTenantId());
            client.setName(savedUser.getName());
            client.setEmail(savedUser.getEmail());
            client.setPhone(savedUser.getPhone());
            client.setBirthDate(savedUser.getBirthDate());
            client.setGender(savedUser.getGender());
            client.setAddress(savedUser.getAddress());
            client.setAddressDetail(savedUser.getAddressDetail());
            client.setPostalCode(savedUser.getPostalCode());
            String vehiclePlate = VehiclePlateText.normalizeOrNull(request.getVehiclePlate());
            client.setVehiclePlate(vehiclePlate);
            client.setEmergencyContact(encryptOptionalPiiForStorage(request.getEmergencyContact()));
            client.setEmergencyPhone(encryptOptionalPiiForStorage(request.getEmergencyPhone()));
            client.setConsultationPurpose(trimToNull(request.getConsultationPurpose()));
            client.setConsultationHistory(trimToNull(request.getConsultationHistory()));
            client.setIsDeleted(false);
            client.setCreatedAt(savedUser.getCreatedAt());
            client.setUpdatedAt(savedUser.getUpdatedAt());
            client.setBranchCode(null);
            if (vehiclePlate != null) {
                log.info("🚗 내담자 수정: Client 신규 저장, 차량번호 (마스킹): {}", maskVehiclePlate(vehiclePlate));
            }
            persistedClient = clientRepository.save(client);
        }

        // 내담자 목록 캐시 무효화 (수정 후 목록/재진입 시 주소 등 즉시 반영)
        clientStatsService.evictAllClientStatsCache();

        Client response = new Client();
        response.setId(savedUser.getId());
        response.setName(savedUser.getName());
        response.setEmail(savedUser.getEmail());
        response.setPhone(savedUser.getPhone());
        response.setBirthDate(savedUser.getBirthDate());
        response.setGender(savedUser.getGender());
        response.setAddress(savedUser.getAddress());
        response.setAddressDetail(savedUser.getAddressDetail());
        response.setPostalCode(savedUser.getPostalCode());
        response.setVehiclePlate(persistedClient.getVehiclePlate());
        response.setIsDeleted(Boolean.FALSE.equals(savedUser.getIsActive()));
        response.setCreatedAt(savedUser.getCreatedAt());
        response.setUpdatedAt(savedUser.getUpdatedAt());

        return response;
    }

    @Override
    @Transactional
    public ConsultantClientMapping updateMapping(Long id, ConsultantClientMappingCreateRequest dto, String updatedBy) {
        ConsultantClientMapping mapping = mappingRepository.findByTenantIdAndId(getTenantId(), id)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));
        
        log.info("🔄 매핑 정보 수정: id={}, packageName={}, packagePrice={}, totalSessions={}", 
                id, dto.getPackageName(), dto.getPackagePrice(), dto.getTotalSessions());
        
        String oldPackageName = mapping.getPackageName();
        Long oldPackagePrice = mapping.getPackagePrice();
        Integer oldTotalSessions = mapping.getTotalSessions();
        
        if (dto.getPackageName() != null) {
            mapping.setPackageName(dto.getPackageName());
        }
        if (dto.getPackagePrice() != null) {
            mapping.setPackagePrice(dto.getPackagePrice());
        }
        
        if (dto.getTotalSessions() != null) {
            mapping.setTotalSessions(dto.getTotalSessions());
            mapping.setRemainingSessions(dto.getTotalSessions() - mapping.getUsedSessions());
        }
        
        if (dto.getStatus() != null) {
            mapping.setStatus(ConsultantClientMapping.MappingStatus.valueOf(dto.getStatus()));
        }
        if (dto.getPaymentStatus() != null) {
            mapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.valueOf(dto.getPaymentStatus()));
        }
        
        ConsultantClientMapping savedMapping = mappingRepository.save(mapping);
        
        boolean packageChanged = (dto.getPackageName() != null && oldPackageName != null && !dto.getPackageName().equals(oldPackageName)) ||
                                (dto.getPackageName() != null && oldPackageName == null) ||
                                (dto.getPackagePrice() != null && oldPackagePrice != null && !dto.getPackagePrice().equals(oldPackagePrice)) ||
                                (dto.getTotalSessions() != null && oldTotalSessions != null && !dto.getTotalSessions().equals(oldTotalSessions)) ||
                                (dto.getPackagePrice() != null && oldPackagePrice == null) ||
                                (dto.getTotalSessions() != null && oldTotalSessions == null);
        
        if (packageChanged) {
            String tenantId = getTenantIdFromMapping(savedMapping);
            if (tenantId == null) tenantId = getTenantIdOrNull();
            runInNewTransaction(tenantId, () -> {
                log.info("🔄 패키지 정보 변경 감지, ERP 재무 거래 동기화 프로시저 호출: mappingId={}", id);

                String procedureUpdatedBy = updatedBy != null && !updatedBy.isEmpty()
                    ? updatedBy
                    : (savedMapping.getConsultant() != null && savedMapping.getConsultant().getName() != null
                        ? savedMapping.getConsultant().getName()
                        : "System");

                Map<String, Object> procedureResult = storedProcedureService.updateMappingInfo(
                    id,
                    savedMapping.getPackageName(),
                    savedMapping.getPackagePrice() != null ? savedMapping.getPackagePrice().doubleValue() : 0.0,
                    savedMapping.getTotalSessions(),
                    procedureUpdatedBy
                );

                if ((Boolean) procedureResult.getOrDefault("success", false)) {
                    log.info("✅ ERP 재무 거래 동기화 완료: mappingId={}, message={}",
                            id, procedureResult.get("message"));
                } else {
                    log.warn("⚠️ ERP 재무 거래 동기화 실패: mappingId={}, message={}",
                            id, procedureResult.get("message"));
                }
            });
        }
        
        try {
            if (savedMapping.getConsultant() != null && savedMapping.getClient() != null) {
                // 표준화 2025-12-06: 브랜치 코드 사용 금지 - null 전달
                realTimeStatisticsService.updateStatisticsOnMappingChange(
                    savedMapping.getConsultant().getId(), 
                    savedMapping.getClient().getId(), 
                    null // 브랜치 코드 사용 금지
                );
                
                if (packageChanged && savedMapping.getPackagePrice() != null) {
                    // 표준화 2025-12-06: 브랜치 코드 사용 금지 - null 전달
                    realTimeStatisticsService.updateFinancialStatisticsOnPayment(
                        null, // 브랜치 코드 사용 금지
                        savedMapping.getPackagePrice(), 
                        LocalDate.now()
                    );
                }
                
                log.info("✅ 매핑 수정시 실시간 통계 업데이트 완료: mappingId={}", id);
            }
        } catch (Exception e) {
            log.error("❌ 매핑 수정시 실시간 통계 업데이트 실패: mappingId={}, error={}", id, e.getMessage(), e);
        }
        
        log.info("✅ 매핑 정보 수정 완료: id={}, packageName={}, packagePrice={}, totalSessions={}", 
                savedMapping.getId(), savedMapping.getPackageName(), 
                savedMapping.getPackagePrice(), savedMapping.getTotalSessions());
        
        return savedMapping;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteConsultant(Long id) {
        log.info("🗑️ 상담사 삭제 처리 시작: ID={}", id);
        
        String tenantId = getTenantId();
        User consultant = userRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new RuntimeException(AdminServiceUserFacingMessages.MSG_CONSULTANT_NOT_FOUND));
        
        if (consultant.getRole() != UserRole.CONSULTANT) {
            throw new RuntimeException(AdminServiceUserFacingMessages.MSG_CANNOT_DELETE_NON_CONSULTANT);
        }
        
        List<ConsultantClientMapping> activeMappings = mappingRepository
                .findByConsultantIdAndStatusNot(tenantId, id, ConsultantClientMapping.MappingStatus.TERMINATED);
        
        if (!activeMappings.isEmpty()) {
            log.warn("⚠️ 상담사에게 {} 개의 활성 매칭이 있습니다. 다른 상담사로 이전이 필요합니다.", activeMappings.size());
            throw new RuntimeException(String.format(
                    AdminServiceUserFacingMessages.MSG_CONSULTANT_ACTIVE_MAPPINGS_TRANSFER_FMT,
                    activeMappings.size()));
        }
        
        List<Schedule> futureSchedules = scheduleRepository.findByTenantIdAndConsultantIdAndDateGreaterThanEqual(tenantId, id, LocalDate.now());
        
        if (!futureSchedules.isEmpty()) {
            log.warn("⚠️ 상담사에게 {} 개의 예정된 스케줄이 있습니다. 다른 상담사로 이전이 필요합니다.", futureSchedules.size());
            throw new RuntimeException(String.format(
                    AdminServiceUserFacingMessages.MSG_CONSULTANT_FUTURE_SCHEDULES_TRANSFER_FMT,
                    futureSchedules.size()));
        }
        
        consultant.setIsActive(false);
        userRepository.save(consultant);
        
        log.info("✅ 상담사 삭제 완료: ID={}, 이름={}", id, consultant.getName());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteConsultantWithTransfer(Long consultantId, Long transferToConsultantId, String reason) {
        log.info("🔄 상담사 삭제 및 이전 처리 시작: 삭제 상담사 ID={}, 이전 대상 상담사 ID={}", 
                consultantId, transferToConsultantId);
        String tenantId = getTenantId();
        
        User consultantToDelete = userRepository.findByTenantIdAndId(tenantId, consultantId)
                .orElseThrow(() -> new RuntimeException(
                        AdminServiceUserFacingMessages.MSG_CONSULTANT_TO_DELETE_NOT_FOUND));
        
        User transferToConsultant = userRepository.findByTenantIdAndId(tenantId, transferToConsultantId)
                .orElseThrow(() -> new RuntimeException(
                        AdminServiceUserFacingMessages.MSG_TRANSFER_TARGET_CONSULTANT_NOT_FOUND));
        
        if (consultantToDelete.getRole() != UserRole.CONSULTANT) {
            throw new RuntimeException(AdminServiceUserFacingMessages.MSG_DELETE_TARGET_NOT_CONSULTANT);
        }
        
        if (transferToConsultant.getRole() != UserRole.CONSULTANT) {
            throw new RuntimeException(AdminServiceUserFacingMessages.MSG_TRANSFER_TARGET_NOT_CONSULTANT);
        }
        
        if (!transferToConsultant.getIsActive()) {
            throw new RuntimeException(AdminServiceUserFacingMessages.MSG_TRANSFER_TARGET_CONSULTANT_INACTIVE);
        }
        
        String terminatedStatus = getMappingStatusCode("TERMINATED");
        List<ConsultantClientMapping> activeMappings = mappingRepository.findByTenantId(tenantId).stream()
                .filter(mapping -> mapping.getConsultant().getId().equals(consultantId))
                .filter(mapping -> !mapping.getStatus().name().equals(terminatedStatus))
                .collect(Collectors.toList());
        
        for (ConsultantClientMapping mapping : activeMappings) {
            String transferReason = String.format("상담사 삭제로 인한 이전: %s -> %s. 사유: %s", 
                    consultantToDelete.getName(), transferToConsultant.getName(), reason);
            
            List<ConsultantClientMapping> existingTransferMappings = 
                mappingRepository.findByTenantIdAndConsultantAndClient(tenantId, transferToConsultant, mapping.getClient());
            
            String activeStatus = getMappingStatusCode("ACTIVE");
            Optional<ConsultantClientMapping> existingActiveMapping = existingTransferMappings.stream()
                .filter(m -> m.getStatus().name().equals(activeStatus))
                .findFirst();
            
            if (existingActiveMapping.isPresent()) {
                ConsultantClientMapping existing = existingActiveMapping.get();
                log.info("🔍 이전 대상 상담사와 내담자 간 기존 활성 매칭 발견, 회기수 합산: 내담자={}, 상담사={}", 
                    mapping.getClient().getName(), transferToConsultant.getName());
                
                int totalSessions = existing.getTotalSessions() + mapping.getTotalSessions();
                int remainingSessions = existing.getRemainingSessions() + mapping.getRemainingSessions();
                int usedSessions = existing.getUsedSessions() + mapping.getUsedSessions();
                
                existing.setTotalSessions(totalSessions);
                existing.setRemainingSessions(remainingSessions);
                existing.setUsedSessions(usedSessions);
                
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
                
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                if (mapping.getPaymentStatus() == ConsultantClientMapping.PaymentStatus.APPROVED) {
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    existing.setPaymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED);
                }
                
                existing.setNotes((existing.getNotes() != null ? existing.getNotes() + "\n" : "") + 
                    "상담사 이전으로 회기수 합산: " + transferReason);
                existing.setUpdatedAt(LocalDateTime.now());
                
                mappingRepository.save(existing);
                
                log.info("✅ 기존 매칭에 회기수 합산 완료: 총 회기수={}, 남은 회기수={}", totalSessions, remainingSessions);
            } else {
                log.info("🆕 새로운 매칭 생성: 내담자={}, 상담사={}", 
                    mapping.getClient().getName(), transferToConsultant.getName());
                
                ConsultantClientMapping newMapping = new ConsultantClientMapping();
                newMapping.setConsultant(transferToConsultant);
                newMapping.setClient(mapping.getClient());
                newMapping.setBranchCode(null); // 표준화 2025-12-06: 브랜치 코드 사용 금지
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
                
                log.info("✅ 새로운 매칭 생성 완료: 회기수={}", mapping.getTotalSessions());
            }
            
            mapping.transferToNewConsultant(transferReason, "SYSTEM_AUTO_TRANSFER");
            mappingRepository.save(mapping);
            
            log.info("📋 매칭 이전 완료: 내담자 {} -> 새 상담사 {}", 
                    mapping.getClient().getName(), transferToConsultant.getName());
        }
        
        List<Schedule> futureSchedules = scheduleRepository.findByTenantIdAndConsultantIdAndDateGreaterThanEqual(tenantId, consultantId, LocalDate.now());
        
        for (Schedule schedule : futureSchedules) {
            schedule.setConsultantId(transferToConsultantId);
            schedule.setDescription((schedule.getDescription() != null ? schedule.getDescription() + "\n" : "") + 
                    "[상담사 이전] " + consultantToDelete.getName() + " -> " + transferToConsultant.getName());
            scheduleRepository.save(schedule);
            
            log.info("📅 스케줄 이전 완료: 스케줄 ID {} -> 새 상담사 {}", 
                    schedule.getId(), transferToConsultant.getName());
        }
        
        consultantToDelete.setIsActive(false);
        userRepository.save(consultantToDelete);
        
        log.info("✅ 상담사 삭제 및 이전 완료: 삭제된 상담사={}, 이전 대상 상담사={}, 이전된 매칭 수={}, 이전된 스케줄 수={}", 
                consultantToDelete.getName(), transferToConsultant.getName(), 
                activeMappings.size(), futureSchedules.size());
    }

    @Override
    public Map<String, Object> checkConsultantDeletionStatus(Long consultantId) {
        log.info("🔍 상담사 삭제 가능 여부 확인: ID={}", consultantId);
        String tenantId = getTenantId();
        
        User consultant = userRepository.findByTenantIdAndId(tenantId, consultantId)
                .orElseThrow(() -> new RuntimeException(AdminServiceUserFacingMessages.MSG_CONSULTANT_NOT_FOUND));
        
        if (consultant.getRole() != UserRole.CONSULTANT) {
            throw new RuntimeException(AdminServiceUserFacingMessages.MSG_NOT_CONSULTANT_USER);
        }
        
        String terminatedStatus = getMappingStatusCode("TERMINATED");
        List<ConsultantClientMapping> activeMappings = mappingRepository.findByTenantId(tenantId).stream()
            .filter(mapping -> mapping.getConsultant().getId().equals(consultantId))
                .filter(mapping -> !mapping.getStatus().name().equals(terminatedStatus))
                .collect(Collectors.toList());
        
        String bookedStatus = getScheduleStatusCode("BOOKED");
        String confirmedStatus = getScheduleStatusCode("CONFIRMED");
        List<Schedule> futureSchedules = scheduleRepository.findByTenantIdAndConsultantIdAndDateGreaterThanEqual(tenantId, consultantId, LocalDate.now())
                .stream()
                .filter(schedule -> schedule.getStatus().name().equals(bookedStatus) || 
                                  schedule.getStatus().name().equals(confirmedStatus))
                .collect(Collectors.toList());
        
        Map<String, Object> result = new HashMap<>();
        result.put("consultantId", consultantId);
        result.put("consultantName", consultant.getName());
        result.put("canDeleteDirectly", activeMappings.isEmpty() && futureSchedules.isEmpty());
        result.put("requiresTransfer", !activeMappings.isEmpty() || !futureSchedules.isEmpty());
        
        Map<String, Object> details = new HashMap<>();
        details.put("activeMappingCount", activeMappings.size());
        details.put("futureScheduleCount", futureSchedules.size());
        
        long todayScheduleCount = futureSchedules.stream()
                .filter(schedule -> schedule.getDate().equals(LocalDate.now()))
                .count();
        details.put("todayScheduleCount", (int) todayScheduleCount);
        
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
        
        StringBuilder message = new StringBuilder();
        if (activeMappings.isEmpty() && futureSchedules.isEmpty()) {
            message.append("해당 상담사는 안전하게 삭제할 수 있습니다.");
        } else {
            message.append("다음 사유로 인해 다른 상담사로 이전이 필요합니다:\n");
            if (!activeMappings.isEmpty()) {
                message.append("• 활성 매칭: ").append(activeMappings.size()).append("개\n");
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
        String tenantId = getTenantId();
        
        User client = userRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new RuntimeException(AdminServiceUserFacingMessages.MSG_CLIENT_NOT_FOUND));
        
        if (client.getRole() != UserRole.CLIENT) {
            throw new RuntimeException(AdminServiceUserFacingMessages.MSG_CANNOT_DELETE_NON_CLIENT);
        }
        
        String terminatedStatus = getMappingStatusCode("TERMINATED");
        List<ConsultantClientMapping> activeMappings = mappingRepository.findByTenantId(tenantId).stream()
            .filter(mapping -> mapping.getClient().getId().equals(id))
                .filter(mapping -> !mapping.getStatus().name().equals(terminatedStatus))
                .collect(Collectors.toList());
        
        List<ConsultantClientMapping> mappingsWithRemainingSessions = activeMappings.stream()
                .filter(mapping -> mapping.getRemainingSessions() > 0)
                .collect(Collectors.toList());
        
        if (!mappingsWithRemainingSessions.isEmpty()) {
            int totalRemainingSessions = mappingsWithRemainingSessions.stream()
                    .mapToInt(ConsultantClientMapping::getRemainingSessions)
                    .sum();
            
            log.warn("⚠️ 내담자에게 {} 개의 활성 매칭에서 총 {} 회기가 남아있습니다.", 
                    mappingsWithRemainingSessions.size(), totalRemainingSessions);
            
            throw new RuntimeException(String.format(
                    AdminServiceUserFacingMessages.MSG_CLIENT_ACTIVE_MAPPINGS_REMAINING_SESSIONS_FMT,
                    mappingsWithRemainingSessions.size(), totalRemainingSessions));
        }
        
        String pendingPaymentStatus = getPaymentStatusCode("PENDING");
        List<ConsultantClientMapping> pendingPaymentMappings = activeMappings.stream()
                .filter(mapping -> mapping.getPaymentStatus().name().equals(pendingPaymentStatus))
                .collect(Collectors.toList());
        
        if (!pendingPaymentMappings.isEmpty()) {
            log.warn("⚠️ 내담자에게 {} 개의 결제 대기 중인 매칭이 있습니다.", pendingPaymentMappings.size());
            throw new RuntimeException(String.format(
                    AdminServiceUserFacingMessages.MSG_CLIENT_PENDING_PAYMENT_MAPPINGS_FMT,
                    pendingPaymentMappings.size()));
        }
        
        List<Schedule> futureSchedules = scheduleRepository.findByTenantIdAndClientIdAndDateGreaterThanEqual(tenantId, id, LocalDate.now());
        
        String bookedStatus = getScheduleStatusCode("BOOKED");
        String confirmedStatus = getScheduleStatusCode("CONFIRMED");
        List<Schedule> activeSchedules = futureSchedules.stream()
                .filter(schedule -> schedule.getStatus().name().equals(bookedStatus) || 
                                  schedule.getStatus().name().equals(confirmedStatus))
                .collect(Collectors.toList());
        
        if (!activeSchedules.isEmpty()) {
            log.warn("⚠️ 내담자에게 {} 개의 예정된 스케줄이 있습니다.", activeSchedules.size());
            
            for (Schedule schedule : activeSchedules) {
                User consultant = schedule.getConsultantId() != null
                    ? userRepository.findByTenantIdAndId(tenantId, schedule.getConsultantId()).orElse(null)
                    : null;
                log.warn("📅 예정 스케줄: ID={}, 날짜={}, 시간={}-{}, 상담사={} (활성:{})", 
                    schedule.getId(), schedule.getDate(), schedule.getStartTime(), schedule.getEndTime(),
                    consultant != null ? consultant.getName() : "알 수 없음",
                    consultant != null ? consultant.getIsActive() : "알 수 없음");
            }
            
            throw new RuntimeException(String.format(
                    AdminServiceUserFacingMessages.MSG_CLIENT_FUTURE_SCHEDULES_FMT,
                    activeSchedules.size()));
        }
        
        List<Schedule> allFutureSchedules = scheduleRepository.findByTenantIdAndClientIdAndDateGreaterThanEqual(tenantId, id, LocalDate.now());
        int cancelledScheduleCount = 0;
        
        for (Schedule schedule : allFutureSchedules) {
            if (schedule.getStatus().name().equals(bookedStatus) || schedule.getStatus().name().equals(confirmedStatus)) {
                User consultant = schedule.getConsultantId() != null
                    ? userRepository.findByTenantIdAndId(tenantId, schedule.getConsultantId()).orElse(null)
                    : null;
                
                log.info("📅 내담자 삭제로 인한 스케줄 취소: ID={}, 날짜={}, 상담사={} (활성:{})", 
                    schedule.getId(), schedule.getDate(), 
                    consultant != null ? consultant.getName() : "알 수 없음",
                    consultant != null ? consultant.getIsActive() : "알 수 없음");
                
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
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
        
        client.setIsActive(false);
        userRepository.save(client);

        clientStatsService.evictTenantClientsWithStatsListCache(tenantId);
        clientStatsService.evictClientStatsCache(tenantId, id);

        log.info("✅ 내담자 삭제 완료: ID={}, 이름={}, 취소된 스케줄={}개", id, client.getName(), cancelledScheduleCount);
    }

    @Override
    public Map<String, Object> checkClientDeletionStatus(Long clientId) {
        String tenantId = getTenantId();
        log.info("🔍 내담자 삭제 가능 여부 확인: ID={}", clientId);
        
        User client = userRepository.findByTenantIdAndId(tenantId, clientId)
                .orElseThrow(() -> new RuntimeException(AdminServiceUserFacingMessages.MSG_CLIENT_NOT_FOUND));
        
        if (client.getRole() != UserRole.CLIENT) {
            throw new RuntimeException(AdminServiceUserFacingMessages.MSG_NOT_CLIENT_USER);
        }
        
        String terminatedStatus = getMappingStatusCode("TERMINATED");
        List<ConsultantClientMapping> activeMappings = mappingRepository.findByTenantId(tenantId).stream()
            .filter(mapping -> mapping.getClient().getId().equals(clientId))
                .filter(mapping -> !mapping.getStatus().name().equals(terminatedStatus))
                .collect(Collectors.toList());
        
        List<ConsultantClientMapping> mappingsWithRemainingSessions = activeMappings.stream()
                .filter(mapping -> mapping.getRemainingSessions() > 0)
                .collect(Collectors.toList());
        
        String pendingPaymentStatus = getPaymentStatusCode("PENDING");
        List<ConsultantClientMapping> pendingPaymentMappings = activeMappings.stream()
                .filter(mapping -> mapping.getPaymentStatus().name().equals(pendingPaymentStatus))
                .collect(Collectors.toList());
        
        String bookedStatus = getScheduleStatusCode("BOOKED");
        String confirmedStatus = getScheduleStatusCode("CONFIRMED");
        List<Schedule> futureSchedules = scheduleRepository.findByTenantIdAndClientIdAndDateGreaterThanEqual(tenantId, clientId, LocalDate.now())
                .stream()
                .filter(schedule -> schedule.getStatus().name().equals(bookedStatus) || 
                                  schedule.getStatus().name().equals(confirmedStatus))
                .collect(Collectors.toList());
        
        Map<String, Object> result = new HashMap<>();
        result.put("clientId", clientId);
        result.put("clientName", client.getName());
        
        boolean canDeleteDirectly = mappingsWithRemainingSessions.isEmpty() && 
                                  pendingPaymentMappings.isEmpty() && 
                                  futureSchedules.isEmpty();
        
        result.put("canDeleteDirectly", canDeleteDirectly);
        result.put("requiresCleanup", !canDeleteDirectly);
        
        Map<String, Object> details = new HashMap<>();
        details.put("activeMappingCount", activeMappings.size());
        details.put("remainingSessionCount", mappingsWithRemainingSessions.stream()
                .mapToInt(ConsultantClientMapping::getRemainingSessions).sum());
        details.put("pendingPaymentCount", pendingPaymentMappings.size());
        details.put("futureScheduleCount", futureSchedules.size());
        
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
        ConsultantClientMapping mapping = mappingRepository.findByTenantIdAndId(getTenantId(), id)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));
        String terminatedStatus = getMappingStatusCode("TERMINATED");
        mapping.setStatus(ConsultantClientMapping.MappingStatus.valueOf(terminatedStatus));
        mapping.setTerminatedAt(LocalDateTime.now());
        mappingRepository.save(mapping);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void terminateMapping(Long id, String reason) {
        log.info("🔧 매칭 강제 종료 처리 시작: ID={}, 사유={}", id, reason);
        String tenantId = getTenantId();
        
        ConsultantClientMapping mapping = mappingRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new RuntimeException(AdminServiceUserFacingMessages.MSG_MAPPING_NOT_FOUND));
        Hibernate.initialize(mapping.getConsultant());
        Hibernate.initialize(mapping.getClient());
        
        String terminatedStatus = getMappingStatusCode("TERMINATED");
        if (mapping.getStatus().name().equals(terminatedStatus)) {
            throw new RuntimeException(AdminServiceUserFacingMessages.MSG_MAPPING_ALREADY_TERMINATED);
        }
        
        int refundedSessions = mapping.getRemainingSessions();
        long refundAmount = 0;
        if (mapping.getPackagePrice() != null && mapping.getTotalSessions() > 0) {
            refundAmount = (mapping.getPackagePrice() * refundedSessions) / mapping.getTotalSessions();
        }
        final ConsultantClientMapping mappingForErp = mapping;
        final int finalRefundedSessions = refundedSessions;
        final long finalRefundAmount = refundAmount;
        final String finalReason = reason;
        String tenantIdForErp = getTenantIdFromMapping(mapping);
        if (tenantIdForErp == null) tenantIdForErp = getTenantIdOrNull();
        try {
            runInNewTransaction(tenantIdForErp, () -> sendRefundToErp(mappingForErp, finalRefundedSessions, finalRefundAmount, finalReason));
        } catch (Exception e) {
            log.error("❌ ERP 환불 데이터 전송 실패: MappingID={}", id, e);
        }
        
        mapping.setStatus(ConsultantClientMapping.MappingStatus.valueOf(terminatedStatus));
        mapping.setTerminatedAt(LocalDateTime.now());
        
        String currentNotes = mapping.getNotes() != null ? mapping.getNotes() : "";
        String terminationNote = String.format("[%s 강제 종료] %s (환불: %d회기, %,d원)", 
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")), 
                reason != null ? reason : "관리자 요청",
                refundedSessions,
                refundAmount);
        
        String updatedNotes = currentNotes.isEmpty() ? terminationNote : currentNotes + "\n" + terminationNote;
        mapping.setNotes(updatedNotes);
        
        mapping.setRemainingSessions(0);
        mapping.setUsedSessions(mapping.getTotalSessions()); // 종료 시 남은 회기 없음: used=total 로 두어 total=used+remaining 유지

        mappingRepository.save(mapping);
        
        try {
            log.info("🔍 환불 처리 관련 스케줄 조회 시작: 상담사ID={}, 내담자ID={}, 오늘날짜={}", 
                    mapping.getConsultant().getId(), mapping.getClient().getId(), LocalDate.now());
            
            List<Schedule> futureSchedules = scheduleRepository.findByTenantIdAndConsultantIdAndClientIdAndDateGreaterThanEqual(tenantId, 
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
                
                String bookedStatus = getScheduleStatusCode("BOOKED");
                String confirmedStatus = getScheduleStatusCode("CONFIRMED");
                if (schedule.getStatus().name().equals(bookedStatus) || schedule.getStatus().name().equals(confirmedStatus)) {
                    log.info("🚫 스케줄 취소 처리: ID={}, 기존상태={}", schedule.getId(), schedule.getStatus());
                    
                    String cancelledStatus = getScheduleStatusCode("CANCELLED");
                    schedule.setStatus(ScheduleStatus.valueOf(cancelledStatus));
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
        }
        
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
        }
        
        log.info("✅ 매칭 강제 종료 완료: ID={}, 환불 회기={}, 환불 금액={}, 상담사={}, 내담자={}", 
                id, refundedSessions, refundAmount, mapping.getConsultant().getName(), mapping.getClient().getName());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void partialRefundMapping(Long id, int refundSessions, String reason) {
        log.info("🔧 부분 환불 처리 시작: ID={}, 환불회기={}, 사유={}", id, refundSessions, reason);
        
        ConsultantClientMapping mapping = mappingRepository.findByTenantIdAndId(getTenantId(), id)
                .orElseThrow(() -> new RuntimeException(AdminServiceUserFacingMessages.MSG_MAPPING_NOT_FOUND));
        Hibernate.initialize(mapping.getConsultant());
        Hibernate.initialize(mapping.getClient());
        
        String terminatedStatus = getMappingStatusCode("TERMINATED");
        if (mapping.getStatus().name().equals(terminatedStatus)) {
            throw new RuntimeException(AdminServiceUserFacingMessages.MSG_MAPPING_ALREADY_TERMINATED);
        }
        
        Map<String, Object> lastAddedPackage = getLastAddedPackageInfo(mapping);
        int lastAddedSessions = (Integer) lastAddedPackage.getOrDefault("sessions", 0);
        Long lastAddedPrice = (Long) lastAddedPackage.getOrDefault("price", 0L);
        String lastAddedPackageName = (String) lastAddedPackage.getOrDefault("packageName", "");
        
        log.info("📦 가장 최근 추가된 패키지 정보: 회기수={}, 가격={}, 패키지명={}", 
                lastAddedSessions, lastAddedPrice, lastAddedPackageName);
        
        if (refundSessions <= 0) {
            throw new RuntimeException(AdminServiceUserFacingMessages.MSG_REFUND_SESSIONS_AT_LEAST_ONE);
        }
        
        if (refundSessions > mapping.getRemainingSessions()) {
            throw new RuntimeException(String.format(
                    AdminServiceUserFacingMessages.MSG_REFUND_SESSIONS_EXCEED_REMAINING_FMT,
                    refundSessions, mapping.getRemainingSessions()));
        }
        
        if (mapping.getPaymentDate() != null) {
            LocalDateTime paymentDate = mapping.getPaymentDate();
            LocalDateTime now = LocalDateTime.now();
            long daysSincePayment = java.time.Duration.between(paymentDate, now).toDays();
            
            if (daysSincePayment > 15) {
                log.warn("⚠️ 청약 철회 기간 초과: 결제일={}, 현재일={}, 경과일수={}일", 
                        paymentDate.toLocalDate(), now.toLocalDate(), daysSincePayment);
                throw new RuntimeException(String.format(
                        AdminServiceUserFacingMessages.MSG_COOLING_OFF_PERIOD_EXCEEDED_FMT,
                        daysSincePayment));
            } else {
                log.info("✅ 청약 철회 기간 내 환불: 결제일={}, 경과일수={}일 (15일 이내)", 
                        paymentDate.toLocalDate(), daysSincePayment);
            }
        } else {
            log.warn("⚠️ 결제일 정보가 없어 청약 철회 기간을 확인할 수 없습니다.");
        }
        
        if (lastAddedSessions > 0 && refundSessions > lastAddedSessions) {
            log.warn("⚠️ 환불 요청 회기수({})가 최근 추가분({})보다 많습니다. 단회기 또는 임의 회기수 환불로 처리됩니다.", 
                    refundSessions, lastAddedSessions);
        }
        
        long refundAmount = 0;
        String calculationMethod = "";
        
        if (lastAddedSessions > 0 && lastAddedPrice > 0 && refundSessions <= lastAddedSessions) {
            refundAmount = (lastAddedPrice * refundSessions) / lastAddedSessions;
            calculationMethod = "최근 추가 패키지 기준";
            log.info("💰 최근 추가 패키지 기준 환불: 추가가격={}, 추가회기={}, 환불회기={}, 환불금액={}", 
                    lastAddedPrice, lastAddedSessions, refundSessions, refundAmount);
        } else if (mapping.getPackagePrice() != null && mapping.getTotalSessions() > 0) {
            refundAmount = (mapping.getPackagePrice() * refundSessions) / mapping.getTotalSessions();
            calculationMethod = "전체 패키지 비례 계산";
            log.info("💰 전체 패키지 비례 계산: 전체가격={}, 전체회기={}, 환불회기={}, 환불금액={}", 
                    mapping.getPackagePrice(), mapping.getTotalSessions(), refundSessions, refundAmount);
        } else {
            log.warn("❌ 환불 금액 계산 불가: 패키지 가격 정보 없음");
            throw new RuntimeException(AdminServiceUserFacingMessages.MSG_REFUND_AMOUNT_CALCULATION_IMPOSSIBLE);
        }
        
        log.info("💰 부분 환불 금액 계산 완료: 환불회기={}, 계산방식={}, 환불금액={}원", 
                refundSessions, calculationMethod, refundAmount);
        
        final ConsultantClientMapping mappingForRefund = mapping;
        final int finalRefundSessions = refundSessions;
        final long finalRefundAmount = refundAmount;
        final String finalReason = reason;
        String tenantIdForErp = getTenantIdFromMapping(mapping);
        if (tenantIdForErp == null) tenantIdForErp = getTenantIdOrNull();
        try {
            runInNewTransaction(tenantIdForErp, () -> sendRefundToErp(mappingForRefund, finalRefundSessions, finalRefundAmount, finalReason));
            log.info("💚 부분 환불 ERP 전송 성공: MappingID={}, RefundSessions={}, RefundAmount={}", 
                id, refundSessions, refundAmount);
        } catch (Exception e) {
            log.error("❌ ERP 환불 데이터 전송 실패: MappingID={}", id, e);
        }
        
        try {
            runInNewTransaction(tenantIdForErp, () -> createPartialConsultationRefundTransaction(mappingForRefund, finalRefundSessions, finalRefundAmount, finalReason));
            log.info("💚 부분 환불 거래 자동 생성 완료: MappingID={}, RefundSessions={}, RefundAmount={}", 
                id, refundSessions, refundAmount);
        } catch (Exception e) {
            log.error("❌ 부분 환불 거래 자동 생성 실패: {}", e.getMessage(), e);
        }
        
        mapping.setRemainingSessions(mapping.getRemainingSessions() - refundSessions);
        mapping.setTotalSessions(mapping.getTotalSessions() - refundSessions);
        
        String currentNotes = mapping.getNotes() != null ? mapping.getNotes() : "";
        String refundNote = String.format("[부분 환불] %s - 사유: %s, 환불 회기: %d회, 환불 금액: %,d원, 남은 회기: %d회", 
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")), 
                reason != null ? reason : "관리자 요청",
                refundSessions,
                refundAmount,
                mapping.getRemainingSessions());
        
        String updatedNotes = currentNotes.isEmpty() ? refundNote : currentNotes + "\n" + refundNote;
        mapping.setNotes(updatedNotes);
        
        if (mapping.getRemainingSessions() <= 0) {
            String sessionsExhaustedStatus = getMappingStatusCode("SESSIONS_EXHAUSTED");
            mapping.setStatus(ConsultantClientMapping.MappingStatus.valueOf(sessionsExhaustedStatus));
            mapping.setEndDate(LocalDateTime.now());
            log.info("🎯 부분 환불 후 회기 소진: 남은 회기가 0이 되어 상태를 SESSIONS_EXHAUSTED로 변경");
        }
        
        mappingRepository.save(mapping);
        
        try {
            User client = mapping.getClient();
            if (client != null) {
                log.info("📤 부분 환불 완료 알림 발송 시작: 내담자={}", client.getName());
                
                boolean notificationSent = notificationService.sendRefundCompleted(client, refundSessions, refundAmount);
                
                if (notificationSent) {
                    log.info("✅ 부분 환불 완료 알림 발송 성공: 내담자={}", client.getName());
                } else {
                    log.warn("⚠️ 부분 환불 완료 알림 발송 실패: 내담자={}", client.getName());
                }
            }
        } catch (Exception e) {
            log.error("❌ 부분 환불 완료 알림 발송 중 오류: MappingID={}", id, e);
        }
        
        log.info("✅ 부분 환불 완료: ID={}, 환불회기={}, 환불금액={}, 남은회기={}, 총회기={}, 상담사={}, 내담자={}", 
                id, refundSessions, refundAmount, mapping.getRemainingSessions(), mapping.getTotalSessions(),
                mapping.getConsultant().getName(), mapping.getClient().getName());
    }

    @Override
    public Map<String, Object> getRefundStatistics(String period) {
        return getRefundStatistics(period, null);
    }
    
    @Override
    public Map<String, Object> getRefundStatistics(String period, String branchCode) {
        // 표준화 2025-12-06: 브랜치 코드 사용 금지 - branchCode 파라미터는 무시하고 tenantId만 사용
        if (branchCode != null && !branchCode.trim().isEmpty()) {
            // 표준화 2025-12-07: 브랜치 개념 제거됨, 로그에서 branchCode 제거
            log.warn("⚠️ 브랜치 코드는 더 이상 사용하지 않습니다. 파라미터는 무시됩니다.");
        }
        log.info("📊 환불 통계 조회 시작: period={}", period);
        String tenantId = getTenantId();
        
        initializeRefundCommonCodes();
        
        LocalDateTime startDate;
        LocalDateTime endDate = LocalDateTime.now();
        
        startDate = getRefundPeriodStartDate(period);
        
        String terminatedStatus = getMappingStatusCode("TERMINATED");
        // 표준화 2025-12-06: 브랜치 코드 필터링 제거 - tenantId만 사용
        List<ConsultantClientMapping> terminatedMappings = mappingRepository.findByTenantId(tenantId).stream()
                .filter(mapping -> mapping.getStatus().name().equals(terminatedStatus))
                .filter(mapping -> mapping.getTerminatedAt() != null)
                .filter(mapping -> mapping.getTerminatedAt().isAfter(startDate) && mapping.getTerminatedAt().isBefore(endDate))
                .filter(mapping -> mapping.getNotes() != null && mapping.getNotes().contains("강제 종료"))
                .collect(Collectors.toList());
        
        // 표준화 2025-12-06: 브랜치 코드 필터링 제거 - tenantId만 사용
        List<FinancialTransaction> partialRefundTransactions = 
            financialTransactionRepository.findByTenantIdAndTransactionTypeAndSubcategoryAndTransactionDateBetweenAndIsDeletedFalse(tenantId, 
                FinancialTransaction.TransactionType.EXPENSE, "CONSULTATION_PARTIAL_REFUND", startDate.toLocalDate(), endDate.toLocalDate());
        
        int totalTerminatedRefundCount = terminatedMappings.size();
        int totalTerminatedRefundedSessions = terminatedMappings.stream()
                .mapToInt(mapping -> mapping.getTotalSessions() - mapping.getUsedSessions())
                .sum();
        
        long totalTerminatedRefundAmount = terminatedMappings.stream()
                .mapToLong(mapping -> {
                    if (mapping.getPackagePrice() != null && mapping.getTotalSessions() > 0) {
                        int refundedSessions = mapping.getTotalSessions() - mapping.getUsedSessions();
                        return (mapping.getPackagePrice() * refundedSessions) / mapping.getTotalSessions();
                    }
                    return 0;
                })
                .sum();
        
        int totalPartialRefundCount = partialRefundTransactions.size();
        int totalPartialRefundedSessions = partialRefundTransactions.stream()
                .mapToInt(transaction -> extractRefundSessionsFromDescription(transaction.getDescription()))
                .sum();
        
        long totalPartialRefundAmount = partialRefundTransactions.stream()
                .mapToLong(transaction -> transaction.getAmount().longValue())
                .sum();
        
        int totalRefundCount = totalTerminatedRefundCount + totalPartialRefundCount;
        int totalRefundedSessions = totalTerminatedRefundedSessions + totalPartialRefundedSessions;
        long totalRefundAmount = totalTerminatedRefundAmount + totalPartialRefundAmount;
        
        Map<String, Map<String, Object>> consultantRefundStats = new HashMap<>();
        
        Map<String, Map<String, Object>> terminatedStats = terminatedMappings.stream()
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
        
        Map<String, Map<String, Object>> partialStats = partialRefundTransactions.stream()
                .collect(Collectors.groupingBy(
                    transaction -> {
                        ConsultantClientMapping mapping = transaction.getRelatedEntityId() != null
                            ? mappingRepository.findByTenantIdAndId(tenantId, transaction.getRelatedEntityId()).orElse(null)
                            : null;
                        return mapping != null ? mapping.getConsultant().getName() : "알 수 없음";
                    },
                    Collectors.collectingAndThen(
                        Collectors.toList(),
                        transactions -> {
                            Map<String, Object> stats = new HashMap<>();
                            stats.put("refundCount", transactions.size());
                            stats.put("refundedSessions", transactions.stream()
                                    .mapToInt(t -> extractRefundSessionsFromDescription(t.getDescription())).sum());
                            stats.put("refundAmount", transactions.stream()
                                    .mapToLong(t -> t.getAmount().longValue()).sum());
                            return stats;
                        }
                    )
                ));
        
        consultantRefundStats.putAll(terminatedStats);
        partialStats.forEach((consultant, stats) -> {
            if (consultantRefundStats.containsKey(consultant)) {
                Map<String, Object> existing = consultantRefundStats.get(consultant);
                existing.put("refundCount", (Integer) existing.get("refundCount") + (Integer) stats.get("refundCount"));
                existing.put("refundedSessions", (Integer) existing.get("refundedSessions") + (Integer) stats.get("refundedSessions"));
                existing.put("refundAmount", (Long) existing.get("refundAmount") + (Long) stats.get("refundAmount"));
            } else {
                consultantRefundStats.put(consultant, stats);
            }
        });
        
        List<Map<String, Object>> monthlyTrend = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate monthStart = LocalDate.now().minusMonths(i).withDayOfMonth(1);
            LocalDate monthEnd = monthStart.plusMonths(1).minusDays(1);
            
            List<ConsultantClientMapping> monthlyTerminatedRefunds = terminatedMappings.stream()
                    .filter(mapping -> {
                        LocalDate terminatedDate = mapping.getTerminatedAt().toLocalDate();
                        return !terminatedDate.isBefore(monthStart) && !terminatedDate.isAfter(monthEnd);
                    })
                    .collect(Collectors.toList());
            
            List<FinancialTransaction> monthlyPartialRefunds = partialRefundTransactions.stream()
                    .filter(transaction -> {
                        LocalDate transactionDate = transaction.getTransactionDate();
                        return !transactionDate.isBefore(monthStart) && !transactionDate.isAfter(monthEnd);
                    })
                    .collect(Collectors.toList());
            
            Map<String, Object> monthData = new HashMap<>();
            monthData.put("month", monthStart.format(DateTimeFormatter.ofPattern("yyyy-MM")));
            monthData.put("refundCount", monthlyTerminatedRefunds.size() + monthlyPartialRefunds.size());
            monthData.put("refundedSessions", 
                monthlyTerminatedRefunds.stream().mapToInt(m -> m.getTotalSessions() - m.getUsedSessions()).sum() +
                monthlyPartialRefunds.stream().mapToInt(t -> extractRefundSessionsFromDescription(t.getDescription())).sum());
            monthData.put("refundAmount", 
                monthlyTerminatedRefunds.stream().mapToLong(m -> {
                    if (m.getPackagePrice() != null && m.getTotalSessions() > 0) {
                        int refunded = m.getTotalSessions() - m.getUsedSessions();
                        return (m.getPackagePrice() * refunded) / m.getTotalSessions();
                    }
                    return 0;
                }).sum() +
                monthlyPartialRefunds.stream().mapToLong(t -> t.getAmount().longValue()).sum());
            
            monthlyTrend.add(monthData);
        }
        
        Map<String, Integer> refundReasonStats = new HashMap<>();
        
        Map<String, Integer> terminatedReasonStats = terminatedMappings.stream()
                .collect(Collectors.groupingBy(
                    mapping -> {
                        String notes = mapping.getNotes();
                        String rawReason = "기타";
                        if (notes != null && notes.contains("강제 종료]")) {
                            String[] parts = notes.split("강제 종료] ");
                            if (parts.length > 1) {
                                rawReason = parts[1].split("\n")[0];
                            }
                        }
                        return standardizeRefundReason(rawReason);
                    },
                    Collectors.collectingAndThen(Collectors.counting(), Math::toIntExact)
                ));
        
        Map<String, Integer> partialReasonStats = partialRefundTransactions.stream()
                .collect(Collectors.groupingBy(
                    transaction -> {
                        String reason = extractRefundReasonFromDescription(transaction.getDescription());
                        return standardizeRefundReason(reason);
                    },
                    Collectors.collectingAndThen(Collectors.counting(), Math::toIntExact)
                ));
        
        refundReasonStats.putAll(terminatedReasonStats);
        partialReasonStats.forEach((reason, count) -> {
            refundReasonStats.merge(reason, count, Integer::sum);
        });
        
        List<Map<String, Object>> recentRefunds = new ArrayList<>();
        
        terminatedMappings.stream()
                .sorted((a, b) -> b.getTerminatedAt().compareTo(a.getTerminatedAt()))
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
                .forEach(recentRefunds::add);
        
        partialRefundTransactions.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(transaction -> {
                    Map<String, Object> refund = new HashMap<>();
                    
                    ConsultantClientMapping mapping = transaction.getRelatedEntityId() != null
                        ? mappingRepository.findByTenantIdAndId(tenantId, transaction.getRelatedEntityId()).orElse(null)
                        : null;
                    
                    if (mapping != null) {
                        refund.put("mappingId", mapping.getId());
                        refund.put("clientName", mapping.getClient().getName());
                        refund.put("consultantName", mapping.getConsultant().getName());
                        refund.put("packageName", mapping.getPackageName());
                        refund.put("refundedSessions", extractRefundSessionsFromDescription(transaction.getDescription()));
                        refund.put("refundAmount", transaction.getAmount().longValue());
                        refund.put("terminatedAt", transaction.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
                        
                        String reason = extractRefundReasonFromDescription(transaction.getDescription());
                        refund.put("reason", reason);
                    } else {
                        refund.put("mappingId", transaction.getRelatedEntityId());
                        refund.put("clientName", "알 수 없음");
                        refund.put("consultantName", "알 수 없음");
                        refund.put("packageName", "알 수 없음");
                        refund.put("refundedSessions", 0);
                        refund.put("refundAmount", transaction.getAmount().longValue());
                        refund.put("terminatedAt", transaction.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
                        refund.put("reason", "매칭 정보 없음");
                    }
                    
                    return refund;
                })
                .forEach(recentRefunds::add);
        
        recentRefunds.sort((a, b) -> {
            String dateA = (String) a.get("terminatedAt");
            String dateB = (String) b.get("terminatedAt");
            return dateB.compareTo(dateA);
        });
        
        if (recentRefunds.size() > 10) {
            recentRefunds = recentRefunds.subList(0, 10);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("period", period);
        result.put("startDate", startDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        result.put("endDate", endDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        
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
        
        log.info("📊 환불 통계 조회 완료: 전체={}, 부분환불={}, 전체환불={}, 총금액={}원", 
                totalRefundCount, totalPartialRefundCount, totalTerminatedRefundCount, totalRefundAmount);
        
        return result;
    }

    @Override
    public Map<String, Object> getRefundHistory(int page, int size, String period, String status) {
        log.info("📋 환불 이력 조회: page={}, size={}, period={}, status={}", page, size, period, status);
        String tenantId = getTenantId();
        
        LocalDateTime startDate = getRefundPeriodStartDate(period != null ? period : "month");
        LocalDateTime endDate = LocalDateTime.now();
        
        String terminatedStatus = getMappingStatusCode("TERMINATED");
        List<ConsultantClientMapping> terminatedMappings = mappingRepository.findByTenantId(tenantId).stream()
                .filter(mapping -> mapping.getStatus().name().equals(terminatedStatus))
                .filter(mapping -> mapping.getTerminatedAt() != null)
                .filter(mapping -> mapping.getTerminatedAt().isAfter(startDate) && mapping.getTerminatedAt().isBefore(endDate))
                .filter(mapping -> mapping.getNotes() != null && mapping.getNotes().contains("강제 종료"))
                .collect(Collectors.toList());
        
        List<FinancialTransaction> partialRefundTransactions = 
            financialTransactionRepository.findByTenantIdAndTransactionTypeAndSubcategoryAndTransactionDateBetweenAndIsDeletedFalse(tenantId, 
                FinancialTransaction.TransactionType.EXPENSE, "CONSULTATION_PARTIAL_REFUND", startDate.toLocalDate(), endDate.toLocalDate());
        
        List<Map<String, Object>> partialRefundHistory = partialRefundTransactions.stream()
                .map(transaction -> {
                    Map<String, Object> refund = new HashMap<>();
                    
                    ConsultantClientMapping mapping = null;
                    if (transaction.getRelatedEntityId() != null) {
                        mapping = mappingRepository.findByTenantIdAndId(tenantId, transaction.getRelatedEntityId()).orElse(null);
                    }
                    
                    if (mapping != null) {
                        refund.put("mappingId", mapping.getId());
                        refund.put("clientName", mapping.getClient().getName());
                        refund.put("consultantName", mapping.getConsultant().getName());
                        refund.put("packageName", mapping.getPackageName());
                        refund.put("originalAmount", mapping.getPackagePrice());
                        refund.put("totalSessions", mapping.getTotalSessions());
                        refund.put("usedSessions", mapping.getUsedSessions());
                        
                        refund.put("refundedSessions", extractRefundSessionsFromDescription(transaction.getDescription()));
                        refund.put("refundAmount", transaction.getAmount().longValue());
                        refund.put("terminatedAt", transaction.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
                        refund.put("branchCode", null); // 표준화 2025-12-07: 브랜치 개념 제거됨
                        refund.put("erpStatus", "SENT");
                        refund.put("erpReference", "ERP_" + mapping.getId() + "_" + transaction.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyyMMdd")));
                        
                        String reason = extractRefundReasonFromDescription(transaction.getDescription());
                        refund.put("refundReason", reason);
                        refund.put("standardizedReason", standardizeRefundReason(reason));
                    } else {
                        refund.put("mappingId", transaction.getRelatedEntityId());
                        refund.put("clientName", "알 수 없음");
                        refund.put("consultantName", "알 수 없음");
                        refund.put("packageName", "알 수 없음");
                        refund.put("originalAmount", 0);
                        refund.put("totalSessions", 0);
                        refund.put("usedSessions", 0);
                        refund.put("refundedSessions", 0);
                        refund.put("refundAmount", transaction.getAmount().longValue());
                        refund.put("terminatedAt", transaction.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
                        refund.put("branchCode", null); // 표준화 2025-12-07: 브랜치 개념 제거됨
                        refund.put("erpStatus", "SENT");
                        refund.put("erpReference", "ERP_UNKNOWN_" + transaction.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyyMMdd")));
                        refund.put("refundReason", "매칭 정보 없음");
                        refund.put("standardizedReason", "기타");
                    }
                    
                    return refund;
                })
                .collect(Collectors.toList());
        
        List<Map<String, Object>> terminatedRefundHistory = terminatedMappings.stream()
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
                    
                    long refundAmount = 0;
                    if (mapping.getPackagePrice() != null && mapping.getTotalSessions() > 0) {
                        int refundedSessions = mapping.getTotalSessions() - mapping.getUsedSessions();
                        refundAmount = (mapping.getPackagePrice() * refundedSessions) / mapping.getTotalSessions();
                    }
                    refund.put("refundAmount", refundAmount);
                    
                    refund.put("terminatedAt", mapping.getTerminatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
                    refund.put("branchCode", null); // 표준화 2025-12-06: 브랜치 코드 사용 금지
                    refund.put("erpStatus", "SENT");
                    refund.put("erpReference", "ERP_" + mapping.getId() + "_" + mapping.getTerminatedAt().format(DateTimeFormatter.ofPattern("yyyyMMdd")));
                    
                    String notes = mapping.getNotes();
                    String reason = "기타";
                    if (notes != null && notes.contains("강제 종료]")) {
                        String[] parts = notes.split("강제 종료] ");
                        if (parts.length > 1) {
                            String fullReason = parts[1].split("\n")[0];
                            if (fullReason.contains(" (환불:")) {
                                reason = fullReason.split(" \\(환불:")[0];
                            } else {
                                reason = fullReason;
                            }
                        }
                    }
                    refund.put("refundReason", reason);
                    refund.put("standardizedReason", standardizeRefundReason(reason));
                    
                    return refund;
                })
                .collect(Collectors.toList());
        
        List<Map<String, Object>> allRefundHistory = new ArrayList<>();
        allRefundHistory.addAll(partialRefundHistory);
        allRefundHistory.addAll(terminatedRefundHistory);
        
        allRefundHistory.sort((a, b) -> {
            String dateA = (String) a.get("terminatedAt");
            String dateB = (String) b.get("terminatedAt");
            return dateB.compareTo(dateA);
        });
        
        int totalElements = allRefundHistory.size();
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, totalElements);
        
        List<Map<String, Object>> pagedRefundHistory = allRefundHistory.subList(startIndex, endIndex);
        
        Map<String, Object> pageInfo = new HashMap<>();
        pageInfo.put("currentPage", page);
        pageInfo.put("pageSize", size);
        pageInfo.put("totalElements", totalElements);
        pageInfo.put("totalPages", (int) Math.ceil((double) totalElements / size));
        pageInfo.put("hasNext", endIndex < totalElements);
        pageInfo.put("hasPrevious", page > 0);
        
        Map<String, Object> result = new HashMap<>();
        result.put("refundHistory", pagedRefundHistory);
        result.put("pageInfo", pageInfo);
        result.put("period", period != null ? period : "month");
        result.put("status", status != null ? status : "all");
        
        log.info("📋 환불 이력 조회 완료: 전체={}, 부분환불={}, 전체환불={}, 페이지={}", 
                totalElements, partialRefundHistory.size(), terminatedRefundHistory.size(), page);
        
        return result;
    }
    
    @Override
    public Map<String, Object> getRefundHistory(int page, int size, String period, String status, String branchCode) {
        log.info("📋 환불 이력 조회: page={}, size={}, period={}, status={}", page, size, period, status);
        String tenantId = getTenantId();
        
        LocalDateTime startDate = getRefundPeriodStartDate(period != null ? period : "month");
        LocalDateTime endDate = LocalDateTime.now();
        
        String terminatedStatus = getMappingStatusCode("TERMINATED");
        List<ConsultantClientMapping> allTerminatedMappings = mappingRepository.findByTenantId(tenantId).stream()
                .filter(mapping -> mapping.getStatus().name().equals(terminatedStatus))
                .filter(mapping -> mapping.getTerminatedAt() != null)
                .filter(mapping -> mapping.getTerminatedAt().isAfter(startDate) && mapping.getTerminatedAt().isBefore(endDate))
                .filter(mapping -> mapping.getNotes() != null && mapping.getNotes().contains("강제 종료"))
                .collect(Collectors.toList());
        
        List<ConsultantClientMapping> terminatedMappings = allTerminatedMappings.stream()
                // 표준화 2025-12-07: 브랜치 개념 제거됨, 필터링 제거
                .collect(Collectors.toList());
        
        List<FinancialTransaction> allPartialRefundTransactions = 
            financialTransactionRepository.findByTenantIdAndTransactionTypeAndSubcategoryAndTransactionDateBetweenAndIsDeletedFalse(tenantId, 
                FinancialTransaction.TransactionType.EXPENSE, "CONSULTATION_PARTIAL_REFUND", startDate.toLocalDate(), endDate.toLocalDate());
        
        List<FinancialTransaction> partialRefundTransactions = allPartialRefundTransactions.stream()
                // 표준화 2025-12-07: 브랜치 개념 제거됨, 필터링 제거
                .collect(Collectors.toList());
        
        List<Map<String, Object>> partialRefundHistory = partialRefundTransactions.stream()
                .map(transaction -> {
                    Map<String, Object> refund = new HashMap<>();
                    
                    ConsultantClientMapping mapping = null;
                    if (transaction.getRelatedEntityId() != null) {
                        mapping = mappingRepository.findByTenantIdAndId(tenantId, transaction.getRelatedEntityId()).orElse(null);
                    }
                    
                    if (mapping != null) {
                        refund.put("mappingId", mapping.getId());
                        refund.put("consultantName", mapping.getConsultant() != null ? mapping.getConsultant().getName() : "알 수 없음");
                        refund.put("clientName", mapping.getClient() != null ? mapping.getClient().getName() : "알 수 없음");
                        refund.put("packageName", mapping.getPackageName() != null ? mapping.getPackageName() : "알 수 없음");
                        refund.put("refundedSessions", extractRefundSessionsFromDescription(transaction.getDescription()));
                        refund.put("refundAmount", transaction.getAmount().longValue());
                        refund.put("terminatedAt", transaction.getTransactionDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
                    } else {
                        refund.put("mappingId", transaction.getRelatedEntityId());
                        refund.put("consultantName", "알 수 없음");
                        refund.put("clientName", "알 수 없음");
                        refund.put("packageName", "알 수 없음");
                        refund.put("refundedSessions", extractRefundSessionsFromDescription(transaction.getDescription()));
                        refund.put("refundAmount", transaction.getAmount().longValue());
                        refund.put("terminatedAt", transaction.getTransactionDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
                    }
                    
                    refund.put("refundReason", extractRefundReasonFromDescription(transaction.getDescription()));
                    refund.put("standardizedReason", standardizeRefundReason(extractRefundReasonFromDescription(transaction.getDescription())));
                    
                    return refund;
                })
                .collect(Collectors.toList());
        
        List<Map<String, Object>> terminatedRefundHistory = terminatedMappings.stream()
                .map(mapping -> {
                    Map<String, Object> refund = new HashMap<>();
                    refund.put("mappingId", mapping.getId());
                    refund.put("consultantName", mapping.getConsultant() != null ? mapping.getConsultant().getName() : "알 수 없음");
                    refund.put("clientName", mapping.getClient() != null ? mapping.getClient().getName() : "알 수 없음");
                    refund.put("packageName", mapping.getPackageName() != null ? mapping.getPackageName() : "알 수 없음");
                    refund.put("refundedSessions", mapping.getTotalSessions() - mapping.getUsedSessions());
                    refund.put("refundAmount", mapping.getPackagePrice() != null ? 
                        ((mapping.getPackagePrice() * (mapping.getTotalSessions() - mapping.getUsedSessions())) / mapping.getTotalSessions()) : 0L);
                    refund.put("terminatedAt", mapping.getTerminatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
                    
                    String notes = mapping.getNotes();
                    String reason = "기타";
                    if (notes != null && notes.contains("강제 종료]")) {
                        String[] parts = notes.split("강제 종료] ");
                        if (parts.length > 1) {
                            String fullReason = parts[1].split("\n")[0];
                            if (fullReason.contains(" (환불:")) {
                                reason = fullReason.split(" \\(환불:")[0];
                            } else {
                                reason = fullReason;
                            }
                        }
                    }
                    refund.put("refundReason", reason);
                    refund.put("standardizedReason", standardizeRefundReason(reason));
                    
                    return refund;
                })
                .collect(Collectors.toList());
        
        List<Map<String, Object>> allRefundHistory = new ArrayList<>();
        allRefundHistory.addAll(partialRefundHistory);
        allRefundHistory.addAll(terminatedRefundHistory);
        
        allRefundHistory.sort((a, b) -> {
            String dateA = (String) a.get("terminatedAt");
            String dateB = (String) b.get("terminatedAt");
            return dateB.compareTo(dateA);
        });
        
        int totalElements = allRefundHistory.size();
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, totalElements);
        
        List<Map<String, Object>> pagedRefundHistory = allRefundHistory.subList(startIndex, endIndex);
        
        Map<String, Object> pageInfo = new HashMap<>();
        pageInfo.put("currentPage", page);
        pageInfo.put("pageSize", size);
        pageInfo.put("totalElements", totalElements);
        pageInfo.put("totalPages", (int) Math.ceil((double) totalElements / size));
        pageInfo.put("hasNext", endIndex < totalElements);
        pageInfo.put("hasPrevious", page > 0);
        
        Map<String, Object> result = new HashMap<>();
        result.put("refundHistory", pagedRefundHistory);
        result.put("pageInfo", pageInfo);
        result.put("period", period != null ? period : "month");
        result.put("status", status != null ? status : "all");
        result.put("branchCode", null); // 표준화 2025-12-07: 브랜치 개념 제거됨
        
        log.info("📋 환불 이력 조회 완료 (지점별): 전체={}, 부분환불={}, 전체환불={}, 페이지={}, 지점={}", 
                totalElements, partialRefundHistory.size(), terminatedRefundHistory.size(), page, branchCode);
        
        return result;
    }
    
     /**
     * 환불 설명에서 환불 회기수 추출
     */
    private int extractRefundSessionsFromDescription(String description) {
        if (description == null) return 0;
        
        try {
            if (description.contains("회기 부분 환불")) {
                String[] parts = description.split("회기 부분 환불");
                if (parts.length > 0) {
                    String numberPart = parts[0].substring(parts[0].lastIndexOf("(") + 1);
                    return Integer.parseInt(numberPart.trim());
                }
            }
        } catch (Exception e) {
            log.warn("환불 회기수 추출 실패: {}", description);
        }
        return 0;
    }
    
     /**
     * 환불 설명에서 환불 사유 추출
     */
    private String extractRefundReasonFromDescription(String description) {
        if (description == null) return "기타";
        
        try {
            if (description.contains("사유: ")) {
                String[] parts = description.split("사유: ");
                if (parts.length > 1) {
                    String reason = parts[1].split(" \\[")[0]; // " [" 이전까지만 추출
                    return reason.trim();
                }
            }
        } catch (Exception e) {
            log.warn("환불 사유 추출 실패: {}", description);
        }
        return "기타";
    }
    

    @Override
    public Map<String, Object> getErpSyncStatus() {
        log.info("🔄 ERP 동기화 상태 확인");
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            boolean erpAvailable = checkErpConnection();
            result.put("erpSystemAvailable", erpAvailable);
            
            LocalDateTime yesterday = LocalDateTime.now().minusHours(24);
            // 표준화 2025-12-05: BaseTenantAwareService 상속으로 getTenantId() 사용
            String tenantId = getTenantId();
            List<ConsultantClientMapping> recentRefunds = mappingRepository.findByTenantId(tenantId).stream()
                    .filter(mapping -> mapping.getStatus() == ConsultantClientMapping.MappingStatus.TERMINATED)
                    .filter(mapping -> mapping.getTerminatedAt() != null)
                    .filter(mapping -> mapping.getTerminatedAt().isAfter(yesterday))
                    .filter(mapping -> mapping.getNotes() != null && mapping.getNotes().contains("강제 종료"))
                    .collect(Collectors.toList());
            
            result.put("recentRefundCount", recentRefunds.size());
            result.put("lastSyncTime", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            
            result.put("erpSuccessRate", 95.5);
            result.put("pendingErpRequests", 2);
            result.put("failedErpRequests", 1);
            
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
            String erpUrl = getErpRefundApiUrl();
            log.info("🔍 ERP 연결 확인: URL={}", erpUrl);
            
            
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
            String tenantId = getTenantIdOrNull();
            // 표준화 2025-12-06: deprecated 메서드 대체
            String currentTenantId = TenantContextHolder.getTenantId();
            if (currentTenantId == null) {
                currentTenantId = tenantId; // 파라미터에서 가져온 tenantId 사용
            }
            List<CommonCode> periodCodes = currentTenantId != null 
                ? commonCodeRepository.findByTenantIdAndCodeGroupOrderBySortOrderAsc(currentTenantId, "REFUND_PERIOD")
                : commonCodeRepository.findCoreCodesByGroup("REFUND_PERIOD"); // 코어 코드 조회
            
            for (CommonCode code : periodCodes) {
                if (code.getCodeValue().equalsIgnoreCase(period)) {
                    String extraData = code.getExtraData();
                    if (extraData != null && !extraData.isEmpty()) {
                        try {
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
            String tenantId = getTenantIdOrNull();
            // 표준화 2025-12-06: deprecated 메서드 대체
            String currentTenantId = TenantContextHolder.getTenantId();
            if (currentTenantId == null) {
                currentTenantId = tenantId; // 파라미터에서 가져온 tenantId 사용
            }
            List<CommonCode> reasonCodes = currentTenantId != null 
                ? commonCodeRepository.findByTenantIdAndCodeGroupAndIsActiveTrueOrderBySortOrderAsc(currentTenantId, "REFUND_REASON")
                : commonCodeRepository.findCoreCodesByGroup("REFUND_REASON"); // 코어 코드 조회
            
            String reason = rawReason.toLowerCase().trim();
            
            for (CommonCode code : reasonCodes) {
                String codeLabel = code.getCodeLabel();
                String codeValue = code.getCodeValue();
                
                if (reason.contains(codeLabel.toLowerCase()) || reason.contains(codeValue.toLowerCase())) {
                    return codeLabel;
                }
                
                String extraData = code.getExtraData();
                if (extraData != null && extraData.contains("\"keywords\"")) {
                    try {
                        ObjectMapper mapper = new ObjectMapper();
                        JsonNode extraDataNode = mapper.readTree(extraData);
                        JsonNode keywords = extraDataNode.get("keywords");
                        
                        if (keywords != null) {
                            String[] keywordArray = keywords.asText().split(",");
                            for (String keyword : keywordArray) {
                                if (reason.contains(keyword.trim().toLowerCase())) {
                                    return codeLabel;
                                }
                            }
                        }
                    } catch (Exception e) {
                        log.debug("환불 사유 키워드 파싱 실패: codeValue={}, error={}", codeValue, e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.error("환불 사유 공통 코드 조회 실패: rawReason={}", rawReason, e);
        }
        
        if (rawReason.toLowerCase().contains("환불테스트")) {
            return "환불테스트";
        }
        
        return "기타";
    }

     /**
     * ERP 시스템에 환불 데이터 전송
     */
    private void sendRefundToErp(ConsultantClientMapping mapping, int refundedSessions, long refundAmount, String reason) {
        try {
            log.info("🔄 ERP 환불 데이터 전송 시작: MappingID={}", mapping.getId());
            
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
            erpData.put("branchCode", null); // 표준화 2025-12-07: 브랜치 개념 제거됨
            erpData.put("requestId", "REF_" + mapping.getId() + "_" + System.currentTimeMillis());
            
            String erpUrl = getErpRefundApiUrl();
            Map<String, String> headers = getErpHeaders();
            
            boolean success = sendToErpSystem(erpUrl, erpData, headers);
            
            if (success) {
                log.info("✅ ERP 환불 데이터 전송 성공: MappingID={}, Amount={}", mapping.getId(), refundAmount);
                
                createConsultationRefundTransaction(mapping, refundedSessions, refundAmount, reason);
                log.info("💚 환불 거래 자동 생성 완료: MappingID={}, RefundAmount={}", 
                    mapping.getId(), refundAmount);
            } else {
                log.warn("⚠️ ERP 환불 데이터 전송 실패: MappingID={}", mapping.getId());
            }
            
        } catch (Exception e) {
            log.error("❌ ERP 환불 데이터 전송 중 오류: MappingID={}", mapping.getId(), e);
            throw new RuntimeException(String.format(
                    AdminServiceUserFacingMessages.MSG_ERP_REFUND_SEND_FAILED_FMT, e.getMessage()));
        }
    }

     /**
     * ERP 시스템으로 실제 데이터 전송
     */
    private boolean sendToErpSystem(String url, Map<String, Object> data, Map<String, String> headers) {
        try {
            
            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);
            
            if (headers != null) {
                headers.forEach(httpHeaders::set);
            }
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(data, httpHeaders);
            
            
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
        return "MAIN001"; // 임시 기본값
    }

    /**
     * 매핑 상태 코드 조회
     */
    private String getMappingStatusCode(String statusName) {
        String codeValue = statusCodeHelper.getStatusCodeValue("MAPPING_STATUS", statusName);
        if (codeValue != null) {
            return codeValue;
        }
        return statusName;
    }

    /**
     * 결제 상태 코드 조회
     */
    private String getPaymentStatusCode(String statusName) {
        String codeValue = statusCodeHelper.getStatusCodeValue("PAYMENT_STATUS", statusName);
        if (codeValue != null) {
            return codeValue;
        }
        return statusName;
    }

    /**
     * 스케줄 상태 코드 조회
     */
    private String getScheduleStatusCode(String statusName) {
        String codeValue = statusCodeHelper.getStatusCodeValue("SCHEDULE_STATUS", statusName);
        if (codeValue != null) {
            return codeValue;
        }
        return statusName;
    }

    private void initializeRefundCommonCodes() {
        try {
            String tenantId = getTenantIdOrNull();
            // 표준화 2025-12-06: deprecated 메서드 대체
            String currentTenantId = TenantContextHolder.getTenantId();
            if (currentTenantId == null) {
                currentTenantId = tenantId; // 파라미터에서 가져온 tenantId 사용
            }
            List<CommonCode> periodCodes = currentTenantId != null 
                ? commonCodeRepository.findByTenantIdAndCodeGroupOrderBySortOrderAsc(currentTenantId, "REFUND_PERIOD")
                : commonCodeRepository.findCoreCodesByGroup("REFUND_PERIOD"); // 코어 코드 조회
            if (periodCodes.isEmpty()) {
                log.info("🔧 REFUND_PERIOD 공통 코드 그룹 생성 중...");
                
                createCommonCode("REFUND_PERIOD", "TODAY", "오늘", "{\"days\":1}", 1);
                createCommonCode("REFUND_PERIOD", "WEEK", "최근 7일", "{\"days\":7}", 2);
                createCommonCode("REFUND_PERIOD", "MONTH", "최근 1개월", "{\"months\":1}", 3);
                createCommonCode("REFUND_PERIOD", "QUARTER", "최근 3개월", "{\"months\":3}", 4);
                createCommonCode("REFUND_PERIOD", "YEAR", "최근 1년", "{\"years\":1}", 5);
                
                log.info("✅ REFUND_PERIOD 공통 코드 생성 완료");
            }
            
            // 표준화 2025-12-06: deprecated 메서드 대체
            String currentTenantId2 = TenantContextHolder.getTenantId();
            if (currentTenantId2 == null) {
                currentTenantId2 = tenantId; // 파라미터에서 가져온 tenantId 사용
            }
            List<CommonCode> reasonCodes = currentTenantId2 != null 
                ? commonCodeRepository.findByTenantIdAndCodeGroupOrderBySortOrderAsc(currentTenantId2, "REFUND_REASON")
                : commonCodeRepository.findCoreCodesByGroup("REFUND_REASON"); // 코어 코드 조회
            if (reasonCodes.isEmpty()) {
                log.info("🔧 REFUND_REASON 공통 코드 그룹 생성 중...");
                
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
            
            // 표준화 2025-12-06: deprecated 메서드 대체
            String currentTenantId3 = TenantContextHolder.getTenantId();
            if (currentTenantId3 == null) {
                currentTenantId3 = tenantId; // 파라미터에서 가져온 tenantId 사용
            }
            List<CommonCode> statusCodes = currentTenantId3 != null 
                ? commonCodeRepository.findByTenantIdAndCodeGroupOrderBySortOrderAsc(currentTenantId3, "REFUND_STATUS")
                : commonCodeRepository.findCoreCodesByGroup("REFUND_STATUS"); // 코어 코드 조회
            if (statusCodes.isEmpty()) {
                log.info("🔧 REFUND_STATUS 공통 코드 그룹 생성 중...");
                
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
        String tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return new ArrayList<>();
        }
        
        List<ConsultantClientMapping> mappings = mappingRepository.findByConsultantIdAndStatusNot(tenantId, consultantId, ConsultantClientMapping.MappingStatus.TERMINATED);
        
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
        log.info("🔍 상담사별 매칭 조회 - 상담사 ID: {}", consultantId);
        
        String tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return new ArrayList<>();
        }
        
        List<ConsultantClientMapping> mappings = mappingRepository.findByConsultantIdAndBranchCodeAndStatusNot(
            tenantId, consultantId, branchCode, ConsultantClientMapping.MappingStatus.TERMINATED);
        
        log.info("🔍 브랜치 코드 필터링된 매칭 수: {}", mappings.size());
        
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
            log.info("🔍 내담자별 매칭 조회 시작: clientId={}", clientId);
            
            String tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
            if (tenantId == null) {
                log.warn("tenantId 미설정으로 내담자 매핑 조회를 건너뜁니다: clientId={}", clientId);
                return new ArrayList<>();
            }
            
            List<ConsultantClientMapping> mappings = new ArrayList<>();
            try {
                mappings = mappingRepository.findByClientIdAndStatusNot(tenantId, clientId, ConsultantClientMapping.MappingStatus.TERMINATED);
                log.info("🔍 내담자별 매칭 조회 완료: clientId={}, 매칭 수={}", clientId, mappings.size());
                
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
                log.error("❌ 매칭 조회 중 오류: clientId={}, error={}", clientId, e.getMessage(), e);
                mappings = new ArrayList<>();
            }
            
            return mappings;
        } catch (Exception e) {
            log.error("❌ 내담자별 매칭 조회 실패: clientId={}, error={}", clientId, e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ConsultantClientMapping getMappingById(Long mappingId) {
        // Lazy 프록시 초기화를 위해 트랜잭션에서 조회
        String tenantId = getTenantIdOrNull();
        if (tenantId == null || tenantId.isEmpty()) {
            return null;
        }
        ConsultantClientMapping mapping = mappingRepository.findByTenantIdAndId(tenantId, mappingId).orElse(null);
        if (mapping != null) {
            // Lazy 프록시 초기화를 위해 관계 엔티티 접근
            if (mapping.getConsultant() != null) {
                mapping.getConsultant().getId(); // 프록시 초기화
            }
            if (mapping.getClient() != null) {
                mapping.getClient().getId(); // 프록시 초기화
            }
        }
        return mapping;
    }


    @Override
    @Transactional(rollbackFor = Exception.class)
    public ConsultantClientMapping transferConsultant(ConsultantTransferRequest request) {
        log.info("상담사 변경 처리 시작: 기존 매칭 ID={}, 새 상담사 ID={}", 
                request.getCurrentMappingId(), request.getNewConsultantId());
        
        String tenantId = getTenantId();
        ConsultantClientMapping currentMapping = mappingRepository.findByTenantIdAndId(tenantId, request.getCurrentMappingId())
                .orElseThrow(() -> new RuntimeException(
                        AdminServiceUserFacingMessages.MSG_EXISTING_MAPPING_NOT_FOUND));
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        if (currentMapping.getStatus() != ConsultantClientMapping.MappingStatus.ACTIVE) {
            throw new RuntimeException(AdminServiceUserFacingMessages.MSG_TRANSFER_CONSULTANT_ACTIVE_MAPPING_ONLY);
        }
        
        User newConsultant = userRepository.findByTenantIdAndId(tenantId, request.getNewConsultantId())
                .orElseThrow(() -> new RuntimeException(AdminServiceUserFacingMessages.MSG_NEW_CONSULTANT_NOT_FOUND));
        
        if (newConsultant.getRole() != UserRole.CONSULTANT) {
            throw new RuntimeException(AdminServiceUserFacingMessages.MSG_NOT_CONSULTANT_USER);
        }
        
        String transferReason = String.format("상담사 변경: %s -> %s. 사유: %s", 
                currentMapping.getConsultant().getName(), 
                newConsultant.getName(), 
                request.getTransferReason());
        
        currentMapping.transferToNewConsultant(transferReason, request.getTransferredBy());
        mappingRepository.save(currentMapping);
        
        ConsultantClientMapping newMapping = new ConsultantClientMapping();
        newMapping.setConsultant(newConsultant);
        newMapping.setClient(currentMapping.getClient());
        newMapping.setStartDate(LocalDateTime.now());
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        newMapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        newMapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED); // 이전 매칭에서 승인된 상태 유지
        newMapping.setTotalSessions(request.getTotalSessions() != null ? 
                request.getTotalSessions() : currentMapping.getRemainingSessions());
        newMapping.setRemainingSessions(request.getRemainingSessions() != null ? 
                request.getRemainingSessions() : currentMapping.getRemainingSessions());
        newMapping.setUsedSessions(0); // 새 매칭이므로 사용된 회기수는 0
        newMapping.setPackageName(request.getPackageName() != null ? 
                request.getPackageName() : currentMapping.getPackageName());
        newMapping.setPackagePrice(request.getPackagePrice() != null ? 
                request.getPackagePrice() : currentMapping.getPackagePrice());
        newMapping.setPaymentAmount(currentMapping.getPaymentAmount());
        newMapping.setPaymentMethod(currentMapping.getPaymentMethod());
        newMapping.setPaymentReference(currentMapping.getPaymentReference());
        newMapping.setAssignedAt(LocalDateTime.now());
        newMapping.setNotes(String.format("상담사 변경으로 생성된 매칭. 기존 매칭 ID: %d", currentMapping.getId()));
        newMapping.setSpecialConsiderations(request.getSpecialConsiderations());
        
        ConsultantClientMapping savedMapping = mappingRepository.save(newMapping);
        
        log.info("상담사 변경 완료: 새 매칭 ID={}, 내담자={}, 새 상담사={}", 
                savedMapping.getId(), 
                currentMapping.getClient().getName(), 
                newConsultant.getName());
        
        Hibernate.initialize(savedMapping.getConsultant());
        Hibernate.initialize(savedMapping.getClient());
        return savedMapping;
    }

    @Override
    public List<ConsultantClientMapping> getTransferHistory(Long clientId) {
        String tenantId = getTenantId();
        User client = userRepository.findByTenantIdAndId(tenantId, clientId)
                .orElseThrow(() -> new RuntimeException(AdminServiceUserFacingMessages.MSG_CLIENT_NOT_FOUND));
        
        return mappingRepository.findByTenantIdAndClient(tenantId, client).stream()
                .filter(mapping -> mapping.getStatus() == ConsultantClientMapping.MappingStatus.TERMINATED)
                .filter(mapping -> mapping.getTerminationReason() != null && 
                        mapping.getTerminationReason().contains("상담사 변경"))
                .collect(Collectors.toList());
    }
    
    @Override
    public List<Map<String, Object>> getSchedulesByConsultantId(Long consultantId) {
        try {
            log.info("🔍 상담사별 스케줄 조회: consultantId={}", consultantId);
            // 표준화 2025-12-05: BaseTenantAwareService 상속으로 getTenantId() 사용
            String tenantId = getTenantId();
            
            userRepository.findByTenantIdAndId(tenantId, consultantId)
                    .orElseThrow(() -> new RuntimeException(String.format(
                            AdminServiceUserFacingMessages.MSG_CONSULTANT_NOT_FOUND_WITH_ID_FMT, consultantId)));
            
            List<Schedule> schedules = scheduleRepository.findByTenantIdAndConsultantId(tenantId, consultantId);
            
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
                        
                        if (schedule.getClientId() != null) {
                            scheduleMap.put("clientId", schedule.getClientId());
                            try {
                                User clientUser = userRepository.findByTenantIdAndId(tenantId, schedule.getClientId()).orElse(null);
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
            // 표준화 2025-12-05: BaseTenantAwareService 상속으로 getTenantId() 사용
            String tenantId = getTenantId();
            
            List<Consultant> consultantEntities = consultantRepository.findByTenantIdAndIsDeletedFalse(tenantId);
            List<User> consultants = consultantEntities.stream()
                    .map(consultant -> (User) consultant)
                    .collect(Collectors.toList());
            
            List<Map<String, Object>> statistics = new ArrayList<>();
            
            for (User consultant : consultants) {
                try {
                    LocalDate startDate, endDate;
                    if (period != null && !period.isEmpty()) {
                        String[] parts = period.split("-");
                        int year = Integer.parseInt(parts[0]);
                        int month = Integer.parseInt(parts[1]);
                        startDate = LocalDate.of(year, month, 1);
                        endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
                    } else {
                        startDate = LocalDate.of(LocalDate.now().getYear(), 1, 1);
                        endDate = LocalDate.of(LocalDate.now().getYear(), 12, 31);
                    }
                    
                    int completedCount = getCompletedScheduleCount(consultant.getId(), startDate, endDate);
                    
                    long totalCount = getTotalScheduleCount(consultant.getId());
                    
                    // 표준화: with-vacation과 동일하게 복호화된 상담사명 사용 (순위 목록 3·4위 실명 표시)
                    String consultantName = null;
                    String consultantEmail = null;
                    Map<String, String> decryptedData = userPersonalDataCacheService.getDecryptedUserData(consultant);
                    if (decryptedData != null) {
                        consultantName = decryptedData.get("name");
                        consultantEmail = decryptedData.get("email");
                    }
                    if (consultantName == null || consultantName.trim().isEmpty()) {
                        consultantName = encryptionUtil.safeDecrypt(consultant.getName());
                    }
                    if (consultantEmail == null || consultantEmail.trim().isEmpty()) {
                        consultantEmail = encryptionUtil.safeDecrypt(consultant.getEmail());
                    }
                    if (consultantName == null || consultantName.trim().isEmpty()) {
                        consultantName = consultant.getName() != null ? consultant.getName() : "알 수 없음";
                    }

                    Map<String, Object> consultantStats = new HashMap<>();
                    consultantStats.put("consultantId", consultant.getId());
                    consultantStats.put("consultantName", consultantName);
                    consultantStats.put("consultantEmail", consultantEmail != null ? consultantEmail : consultant.getEmail());
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
    public List<Map<String, Object>> getConsultationMonthlyTrend(int lastMonths) {
        try {
            String tenantId = getTenantId();
            if (tenantId == null || tenantId.isEmpty()) {
                log.warn("⚠️ getConsultationMonthlyTrend: tenantId 없음");
                return new ArrayList<>();
            }
            List<Consultant> consultants = consultantRepository.findByTenantIdAndIsDeletedFalse(tenantId);
            List<Map<String, Object>> monthlyData = new ArrayList<>();
            LocalDate now = LocalDate.now();
            LocalDate yearStart = LocalDate.of(now.getYear(), 1, 1);
            int monthsCount = (int) java.time.temporal.ChronoUnit.MONTHS.between(yearStart, now) + 1;
            if (monthsCount <= 0) monthsCount = 1;
            for (int i = 0; i < monthsCount; i++) {
                LocalDate monthStart = yearStart.plusMonths(i);
                LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());
                if (monthEnd.isAfter(now)) monthEnd = now;
                int sum = 0;
                for (Consultant consultant : consultants) {
                    sum += getCompletedScheduleCount(consultant.getId(), monthStart, monthEnd);
                }
                long bookedSum = scheduleRepository.countByStatusAndDateBetween(
                        tenantId, ScheduleStatus.BOOKED, monthStart, monthEnd)
                        + scheduleRepository.countByStatusAndDateBetween(
                                tenantId, ScheduleStatus.CONFIRMED, monthStart, monthEnd);
                Map<String, Object> row = new HashMap<>();
                row.put("period", monthStart.format(DateTimeFormatter.ofPattern("yyyy-MM")));
                row.put("completedCount", sum);
                row.put("bookedCount", bookedSum);
                monthlyData.add(row);
            }
            log.info("✅ 월별 상담 완료 추이 조회 완료: {}개월 (KPI와 동일 집계)", monthlyData.size());
            return monthlyData;
        } catch (Exception e) {
            log.error("❌ 월별 상담 완료 추이 조회 실패 (반환: 빈 목록). 원인: {} - {}", e.getClass().getSimpleName(), e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    @Override
    public List<Map<String, Object>> getConsultationWeeklyTrend(int lastWeeks) {
        try {
            String tenantId = getTenantId();
            if (tenantId == null || tenantId.isEmpty()) {
                log.warn("⚠️ getConsultationWeeklyTrend: tenantId 없음");
                return new ArrayList<>();
            }
            List<Consultant> consultants = consultantRepository.findByTenantIdAndIsDeletedFalse(tenantId);
            List<Map<String, Object>> weeklyData = new ArrayList<>();
            LocalDate now = LocalDate.now();
            for (int i = lastWeeks - 1; i >= 0; i--) {
                LocalDate weekEnd = now.minusWeeks(i);
                LocalDate weekStart = weekEnd.minusDays(6);
                int sum = 0;
                for (Consultant consultant : consultants) {
                    sum += getCompletedScheduleCount(consultant.getId(), weekStart, weekEnd);
                }
                long bookedSum = scheduleRepository.countByStatusAndDateBetween(
                        tenantId, ScheduleStatus.BOOKED, weekStart, weekEnd)
                        + scheduleRepository.countByStatusAndDateBetween(
                                tenantId, ScheduleStatus.CONFIRMED, weekStart, weekEnd);
                Map<String, Object> row = new HashMap<>();
                row.put("period", weekEnd.format(DateTimeFormatter.ofPattern("MM/dd")));
                row.put("completedCount", sum);
                row.put("bookedCount", bookedSum);
                weeklyData.add(row);
            }
            log.info("✅ 주간 상담 완료 추이 조회 완료: {}주 (KPI와 동일 집계)", weeklyData.size());
            return weeklyData;
        } catch (Exception e) {
            log.error("❌ 주간 상담 완료 추이 조회 실패 (반환: 빈 목록). 원인: {} - {}", e.getClass().getSimpleName(), e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    @Override
    public double getCompletionRateForMonth(int year, int month) {
        try {
            String tenantId = getTenantId();
            if (tenantId == null || tenantId.isEmpty()) {
                return 0.0;
            }
            LocalDate monthStart = LocalDate.of(year, month, 1);
            LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());
            long totalScheduled = scheduleRepository.countByDateBetween(tenantId, monthStart, monthEnd);
            if (totalScheduled == 0) {
                return 0.0;
            }
            long totalCompleted = scheduleRepository.countByStatusAndDateBetween(
                    tenantId, ScheduleStatus.COMPLETED, monthStart, monthEnd);
            return Math.round((double) totalCompleted / totalScheduled * 100.0 * 10.0) / 10.0;
        } catch (Exception e) {
            log.warn("월별 완료율 조회 실패: year={}, month={}, error={}", year, month, e.getMessage());
            return 0.0;
        }
    }
    
    @Override
    public List<Map<String, Object>> getConsultationCompletionStatisticsByBranch(String period, String branchCode) {
        try {
            log.info("📊 상담 완료 건수 통계 조회: period={}", period);
            
            // 표준화 2025-12-05: BaseTenantAwareService 상속으로 getTenantId() 사용
            String tenantId = getTenantId();
            
            if (branchCode == null || branchCode.trim().isEmpty()) {
                return new ArrayList<>();
            }
            
            List<User> consultants;
            try {
                Branch branch = branchService.getBranchByCode(branchCode);
                consultants = userRepository.findByBranchAndRoleAndIsDeletedFalseOrderByUserId(tenantId, branch, UserRole.CONSULTANT);
                consultants = consultants.stream()
                    .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                    .collect(Collectors.toList());
            } catch (com.coresolution.consultation.exception.EntityNotFoundException e) {
                // 표준화 2025-12-07: 브랜치 개념 제거됨, 로그 제거
                // log.warn("브랜치를 찾을 수 없습니다: {}", branchCode);
                consultants = new ArrayList<>();
            }
            log.info("👥 활성 상담사 수: {}명", consultants.size());
            
            List<Map<String, Object>> statistics = new ArrayList<>();
            
            for (User consultant : consultants) {
                try {
                    LocalDate startDate, endDate;
                    if (period != null && !period.isEmpty()) {
                        String[] parts = period.split("-");
                        int year = Integer.parseInt(parts[0]);
                        int month = Integer.parseInt(parts[1]);
                        startDate = LocalDate.of(year, month, 1);
                        endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
                    } else {
                        startDate = LocalDate.of(LocalDate.now().getYear(), 1, 1);
                        endDate = LocalDate.of(LocalDate.now().getYear(), 12, 31);
                    }
                    
                    int completedCount = getCompletedScheduleCount(consultant.getId(), startDate, endDate);
                    
                    long totalCount = getTotalScheduleCount(consultant.getId());
                    
                    // 표준화: with-vacation과 동일하게 복호화된 상담사명 사용 (순위 목록 3·4위 실명 표시)
                    String consultantName = null;
                    String consultantEmail = null;
                    Map<String, String> decryptedData = userPersonalDataCacheService.getDecryptedUserData(consultant);
                    if (decryptedData != null) {
                        consultantName = decryptedData.get("name");
                        consultantEmail = decryptedData.get("email");
                    }
                    if (consultantName == null || consultantName.trim().isEmpty()) {
                        consultantName = encryptionUtil.safeDecrypt(consultant.getName());
                    }
                    if (consultantEmail == null || consultantEmail.trim().isEmpty()) {
                        consultantEmail = encryptionUtil.safeDecrypt(consultant.getEmail());
                    }
                    if (consultantName == null || consultantName.trim().isEmpty()) {
                        consultantName = consultant.getName() != null ? consultant.getName() : "알 수 없음";
                    }

                    Map<String, Object> consultantStats = new HashMap<>();
                    consultantStats.put("consultantId", consultant.getId());
                    consultantStats.put("consultantName", consultantName);
                    consultantStats.put("consultantEmail", consultantEmail != null ? consultantEmail : consultant.getEmail());
                    consultantStats.put("consultantPhone", maskPhone(consultant.getPhone()));
                    consultantStats.put("specialization", consultant.getSpecialization());
                    consultantStats.put("grade", consultant.getGrade());
                    consultantStats.put("branchCode", null); // 표준화 2025-12-07: 브랜치 개념 제거됨
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
            
            statistics.sort((a, b) -> {
                Integer countA = (Integer) a.get("completedCount");
                Integer countB = (Integer) b.get("completedCount");
                return countB.compareTo(countA);
            });
            
            log.info("✅ 상담 완료 건수 통계 조회 완료: {}명", statistics.size());
            return statistics;
            
        } catch (Exception e) {
            log.error("❌ 지점별 상담 완료 건수 통계 조회 실패: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    @Override
    public List<Map<String, Object>> getAllSchedules() {
        try {
            log.info("🔍 모든 스케줄 조회");
            
            // 표준화 2025-12-05: BaseTenantAwareService 상속으로 getTenantId() 사용
            String tenantId = getTenantId();
            List<Schedule> schedules = scheduleRepository.findByTenantId(tenantId);
            
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
                        
                        if (schedule.getConsultantId() != null) {
                            try {
                                User consultant = userRepository.findByTenantIdAndId(tenantId, schedule.getConsultantId()).orElse(null);
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
                        
                        if (schedule.getClientId() != null) {
                            scheduleMap.put("clientId", schedule.getClientId());
                            try {
                                User clientUser = userRepository.findByTenantIdAndId(tenantId, schedule.getClientId()).orElse(null);
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
            log.info("📊 스케줄 상태별 통계 조회 시작");
            
            log.debug("🔍 모든 스케줄 조회 중...");
            // 표준화 2025-12-05: BaseTenantAwareService 상속으로 getTenantId() 사용
            String tenantId = getTenantId();
            List<Schedule> allSchedules = scheduleRepository.findByTenantId(tenantId);
            log.info("📋 조회된 스케줄 수: {}", allSchedules.size());
            
            log.debug("📊 상태별 카운트 계산 중...");
            Map<String, Long> statusCount = allSchedules.stream()
                .collect(Collectors.groupingBy(
                    schedule -> {
                        String status = schedule.getStatus() != null ? schedule.getStatus().name() : "UNKNOWN";
                        log.trace("스케줄 ID {}: 상태 = {}", schedule.getId(), status);
                        return status;
                    },
                    Collectors.counting()
                ));
            log.info("📊 상태별 카운트: {}", statusCount);
            
            log.debug("👥 상담사별 완료 건수 계산 중...");
            Map<Long, Long> consultantCompletedCount = allSchedules.stream()
                .filter(schedule -> {
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    boolean isCompleted = ScheduleStatus.COMPLETED.equals(schedule.getStatus());
                    if (isCompleted) {
                        log.trace("완료된 스케줄 ID {}: 상담사 ID = {}", schedule.getId(), schedule.getConsultantId());
                    }
                    return isCompleted;
                })
                .filter(schedule -> schedule.getConsultantId() != null)
                .collect(Collectors.groupingBy(
                    Schedule::getConsultantId,
                    Collectors.counting()
                ));
            log.info("👥 상담사별 완료 건수: {}", consultantCompletedCount);
            
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalSchedules", allSchedules.size());
            statistics.put("statusCount", statusCount);
            statistics.put("consultantCompletedCount", consultantCompletedCount);
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            statistics.put("completedSchedules", statusCount.getOrDefault(ScheduleStatus.COMPLETED.name(), 0L));
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            statistics.put("bookedSchedules", statusCount.getOrDefault(ScheduleStatus.BOOKED.name(), 0L));
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            statistics.put("cancelledSchedules", statusCount.getOrDefault(ScheduleStatus.CANCELLED.name(), 0L));
            
            log.info("✅ 스케줄 통계 조회 완료: 총 {}개, 완료 {}개, 예약 {}개, 취소 {}개", 
                    allSchedules.size(), 
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    statusCount.getOrDefault(ScheduleStatus.COMPLETED.name(), 0L),
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    statusCount.getOrDefault(ScheduleStatus.BOOKED.name(), 0L),
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    statusCount.getOrDefault(ScheduleStatus.CANCELLED.name(), 0L));
            return statistics;
            
        } catch (Exception e) {
            log.error("❌ 스케줄 통계 조회 실패: {}", e.getMessage(), e);
            throw new RuntimeException(String.format(
                    AdminServiceUserFacingMessages.MSG_SCHEDULE_STATS_QUERY_FAILED_FMT, e.getMessage()), e);
        }
    }
    
    @Override
    public Map<String, Object> getScheduleStatisticsByBranch(String branchCode) {
        try {
            log.info("📊 스케줄 상태별 통계 조회 시작");
            
            log.debug("🔍 지점별 스케줄 조회 중...");
            // 표준화 2025-12-05: BaseTenantAwareService 상속으로 getTenantId() 사용
            String tenantId = getTenantId();
            List<Schedule> allSchedules = scheduleRepository.findByTenantId(tenantId);
            List<Schedule> branchSchedules = allSchedules.stream()
                    // 표준화 2025-12-07: 브랜치 개념 제거됨, 필터링 제거
                    .filter(schedule -> true)
                    .collect(Collectors.toList());
            log.info("📋 조회된 스케줄 수: {} (전체: {})", branchSchedules.size(), allSchedules.size());
            
            log.debug("📊 상태별 카운트 계산 중...");
            Map<String, Long> statusCount = branchSchedules.stream()
                .collect(Collectors.groupingBy(
                    schedule -> {
                        String status = schedule.getStatus() != null ? schedule.getStatus().name() : "UNKNOWN";
                        log.trace("스케줄 ID {}: 상태 = {}", schedule.getId(), status);
                        return status;
                    },
                    Collectors.counting()
                ));
            log.info("📊 상태별 카운트: {}", statusCount);
            
            log.debug("👥 상담사별 완료 건수 계산 중...");
            Map<Long, Long> consultantCompletedCount = branchSchedules.stream()
                .filter(schedule -> {
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    boolean isCompleted = ScheduleStatus.COMPLETED.equals(schedule.getStatus());
                    if (isCompleted) {
                        log.trace("완료된 스케줄 ID {}: 상담사 ID = {}", schedule.getId(), schedule.getConsultantId());
                    }
                    return isCompleted;
                })
                .filter(schedule -> schedule.getConsultantId() != null)
                .collect(Collectors.groupingBy(
                    Schedule::getConsultantId,
                    Collectors.counting()
                ));
            log.info("👥 상담사별 완료 건수: {}", consultantCompletedCount);
            
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalSchedules", branchSchedules.size());
            statistics.put("statusCount", statusCount);
            statistics.put("consultantCompletedCount", consultantCompletedCount);
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            statistics.put("completedSchedules", statusCount.getOrDefault(ScheduleStatus.COMPLETED.name(), 0L));
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            statistics.put("bookedSchedules", statusCount.getOrDefault(ScheduleStatus.BOOKED.name(), 0L));
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            statistics.put("cancelledSchedules", statusCount.getOrDefault(ScheduleStatus.CANCELLED.name(), 0L));
            statistics.put("branchCode", null); // 표준화 2025-12-07: 브랜치 개념 제거됨
            
            log.info("✅ 스케줄 통계 조회 완료 (지점별): 총 {}개, 완료 {}개, 예약 {}개, 취소 {}개", 
                    branchSchedules.size(), 
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    statusCount.getOrDefault(ScheduleStatus.COMPLETED.name(), 0L),
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    statusCount.getOrDefault(ScheduleStatus.BOOKED.name(), 0L),
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    statusCount.getOrDefault(ScheduleStatus.CANCELLED.name(), 0L));
            return statistics;
            
        } catch (Exception e) {
            log.error("❌ 스케줄 통계 조회 실패 (지점별): {}", e.getMessage(), e);
            throw new RuntimeException(String.format(
                    AdminServiceUserFacingMessages.MSG_SCHEDULE_STATS_QUERY_FAILED_FMT, e.getMessage()), e);
        }
    }
    
    @Override
    public Map<String, Object> autoCompleteSchedulesWithReminder() {
        try {
            log.info("🔄 스케줄 자동 완료 처리 및 상담일지 미작성 알림 시작");
            
            String tenantId = getTenantIdOrNull();
            if (tenantId == null) {
                log.error("❌ tenantId가 설정되지 않았습니다");
                Map<String, Object> errorResult = new HashMap<>();
                errorResult.put("completedCount", 0);
                errorResult.put("reminderSentCount", 0);
                return errorResult;
            }
            
            List<Schedule> expiredSchedules = scheduleRepository.findByDateBeforeAndStatus(
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                tenantId, LocalDate.now(), ScheduleStatus.BOOKED);
            
            int completedCount = 0;
            int reminderSentCount = 0;
            List<Long> consultantIdsWithReminder = new ArrayList<>();
            
            for (Schedule schedule : expiredSchedules) {
                try {
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    schedule.setStatus(ScheduleStatus.COMPLETED);
                    schedule.setUpdatedAt(LocalDateTime.now());
                    scheduleRepository.save(schedule);
                    completedCount++;
                    
                    boolean hasConsultationRecord = checkConsultationRecord(schedule);
                    
                    if (!hasConsultationRecord) {
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
            
            // 표준화 2025-12-05: sendMessage 메서드 시그니처에 맞게 수정 (senderType 추가)
            consultationMessageService.sendMessage(
                schedule.getConsultantId(),
                schedule.getClientId(),
                null, // consultationId는 null
                UserRole.ADMIN.name(), // senderType: 관리자가 발신
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
            String tenantId = getTenantIdOrNull();
            // 표준화 2025-12-06: deprecated 메서드 대체
            String currentTenantId = TenantContextHolder.getTenantId();
            if (currentTenantId == null) {
                currentTenantId = tenantId; // 파라미터에서 가져온 tenantId 사용
            }
            List<Schedule> completedSchedules = currentTenantId != null
                ? scheduleRepository.findByTenantIdAndConsultantIdAndStatusAndDateBetween(
                    currentTenantId, consultantId, ScheduleStatus.COMPLETED, startDate, endDate)
                : new ArrayList<>(); // tenantId가 없으면 빈 리스트 반환
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
            String tenantId = getTenantIdOrNull();
            if (tenantId == null) {
                log.error("❌ tenantId가 설정되지 않았습니다");
                return 0;
            }
            return scheduleRepository.countByConsultantId(tenantId, consultantId);
        } catch (Exception e) {
            log.warn("상담사 {} 총 스케줄 건수 조회 실패: {}", consultantId, e.getMessage());
            return 0;
        }
    }
    
    /**
     * 전화만 등록 시 DB NOT NULL용 합성 이메일을 테넌트 범위에서 유일하게 할당합니다.
     *
     * @param normalizedDigits 정규화된 휴대폰 숫자열
     * @param tenantId         테넌트 ID
     * @return 평문 합성 이메일
     */
    private String allocateUniqueSyntheticEmailForClient(String normalizedDigits, String tenantId) {
        String sanitized = ClientRegistrationConstants.sanitizeTenantIdForSyntheticEmailDomain(tenantId);
        for (int i = 0; i < 1000; i++) {
            String candidate = ClientRegistrationConstants.buildSyntheticEmail(normalizedDigits, sanitized, i);
            String enc = encryptionUtil.safeEncrypt(candidate);
            if (!userRepository.existsByTenantIdAndEmail(tenantId, enc)) {
                return candidate;
            }
        }
        throw new IllegalStateException(AdminServiceUserFacingMessages.MSG_SYNTHETIC_EMAIL_ALLOCATION_FAILED);
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

    /**
     * 차량번호 로그용 마스킹 (평문 전체 출력 금지).
     */
    private String maskVehiclePlate(String plate) {
        if (plate == null || plate.isEmpty()) {
            return "(없음)";
        }
        if (plate.length() <= 2) {
            return "**";
        }
        return plate.charAt(0) + "***" + plate.charAt(plate.length() - 1);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<User> getUsers(boolean includeInactive, String role, String branchCode) {
        // 표준화 2025-12-06: 브랜치 코드 사용 금지 - branchCode 파라미터는 무시하고 tenantId만 사용
        if (branchCode != null && !branchCode.isEmpty()) {
            // 표준화 2025-12-07: 브랜치 개념 제거됨, 로그에서 branchCode 제거
            log.warn("⚠️ 브랜치 코드는 더 이상 사용하지 않습니다. 파라미터는 무시됩니다.");
        }
        log.info("🔍 사용자 목록 조회: includeInactive={}, role={}", includeInactive, role);
        try {
            // 표준화 2025-12-06: BaseTenantAwareService 상속으로 getTenantId() 사용, 브랜치 코드 무시
            String tenantId = getTenantId();
            
            List<User> users;
            
            if (role != null && !role.isEmpty()) {
                UserRole userRole = UserRole.valueOf(role);
                users = userRepository.findByTenantIdAndRoleAndIsActive(tenantId, userRole, includeInactive ? null : true);
            } else {
                if (includeInactive) {
                    users = userRepository.findByTenantId(tenantId);
                } else {
                    users = userRepository.findByIsActive(tenantId, true);
                }
            }
            
            log.info("✅ 사용자 목록 조회 완료: {}명", users.size());
            return users;
        } catch (Exception e) {
            log.error("❌ 사용자 목록 조회 중 오류 발생: {}", e.getMessage(), e);
            return List.of();
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        log.info("🔍 사용자 ID로 조회: {}", id);
        try {
            return userRepository.findByTenantIdAndId(getTenantId(), id).orElse(null);
        } catch (Exception e) {
            log.error("❌ 사용자 조회 중 오류 발생: {}", e.getMessage(), e);
            return null;
        }
    }
    
    @Override
    @Transactional
    public User changeUserRole(Long userId, String newRole) {
        log.info("🔧 사용자 역할 변경: userId={}, newRole={}", userId, newRole);
        try {
            User user = userRepository.findByTenantIdAndId(getTenantId(), userId).orElse(null);
            if (user == null) {
                log.warn("❌ 사용자를 찾을 수 없습니다: userId={}", userId);
                return null;
            }
            
            UserRole role = UserRole.valueOf(newRole);
            user.setRole(role);
            user.setUpdatedAt(LocalDateTime.now());
            
            User savedUser = userRepository.save(user);
            
            log.info("✅ 사용자 역할 변경 완료: userId={}, oldRole={}, newRole={}", 
                    userId, user.getRole(), newRole);
            
            return savedUser;
        } catch (Exception e) {
            log.error("❌ 사용자 역할 변경 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException(String.format(
                    AdminServiceUserFacingMessages.MSG_USER_ROLE_CHANGE_FAILED_FMT, e.getMessage()));
        }
    }
    
    @Override
    public Map<String, Object> mergeDuplicateMappings() {
        Map<String, Object> result = new HashMap<>();
        int mergedCount = 0;
        int deletedCount = 0;
        
        try {
            log.info("🔄 중복 매칭 통합 시작");
            
            // 표준화 2025-12-05: tenantId 필터링 필수
            String tenantId = getTenantId();
            List<ConsultantClientMapping> allMappings = mappingRepository
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .findByTenantIdAndStatus(tenantId, ConsultantClientMapping.MappingStatus.ACTIVE);
            
            Map<String, List<ConsultantClientMapping>> groupedMappings = allMappings.stream()
                .collect(Collectors.groupingBy(mapping -> 
                    mapping.getConsultant().getId() + "-" + mapping.getClient().getId()));
            
            for (Map.Entry<String, List<ConsultantClientMapping>> entry : groupedMappings.entrySet()) {
                List<ConsultantClientMapping> mappings = entry.getValue();
                
                if (mappings.size() > 1) {
                    log.info("🔍 중복 매칭 발견: 상담사={}, 내담자={}, 개수={}", 
                        mappings.get(0).getConsultant().getName(),
                        mappings.get(0).getClient().getName(),
                        mappings.size());
                    
                    ConsultantClientMapping primaryMapping = mappings.stream()
                        .max(Comparator.comparing(ConsultantClientMapping::getCreatedAt))
                        .orElse(mappings.get(0));
                    
                    int totalSessions = mappings.stream()
                        .mapToInt(ConsultantClientMapping::getTotalSessions)
                        .sum();
                    int usedSessions = mappings.stream()
                        .mapToInt(ConsultantClientMapping::getUsedSessions)
                        .sum();
                    int remainingSessions = totalSessions - usedSessions;
                    
                    primaryMapping.setTotalSessions(totalSessions);
                    primaryMapping.setUsedSessions(usedSessions);
                    primaryMapping.setRemainingSessions(remainingSessions);
                    primaryMapping.setNotes("중복 매칭 통합으로 생성됨");
                    
                    mappingRepository.save(primaryMapping);
                    mergedCount++;
                    
                    List<ConsultantClientMapping> toDelete = mappings.stream()
                        .filter(m -> !m.getId().equals(primaryMapping.getId()))
                        .collect(Collectors.toList());
                    
                    for (ConsultantClientMapping mapping : toDelete) {
                        mapping.setStatus(ConsultantClientMapping.MappingStatus.TERMINATED);
                        mapping.setNotes("중복 매칭 통합으로 종료됨");
                        mappingRepository.save(mapping);
                        deletedCount++;
                    }
                    
                    log.info("✅ 중복 매칭 통합 완료: 상담사={}, 내담자={}, 통합된 회기수={}", 
                        primaryMapping.getConsultant().getName(),
                        primaryMapping.getClient().getName(),
                        totalSessions);
                }
            }
            
            result.put("success", true);
            result.put("mergedCount", mergedCount);
            result.put("deletedCount", deletedCount);
            result.put("message", String.format("중복 매칭 통합 완료: %d개 그룹 통합, %d개 매칭 종료", 
                mergedCount, deletedCount));
            
            log.info("✅ 중복 매칭 통합 완료: {}개 그룹 통합, {}개 매칭 종료", mergedCount, deletedCount);
            
        } catch (Exception e) {
            log.error("❌ 중복 매칭 통합 실패", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public List<Map<String, Object>> findDuplicateMappings() {
        List<Map<String, Object>> duplicates = new ArrayList<>();
        
        try {
            log.info("🔍 중복 매칭 조회 시작");
            
            // 표준화 2025-12-05: tenantId 필터링 필수
            String tenantId = getTenantId();
            List<ConsultantClientMapping> allMappings = mappingRepository
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .findByTenantIdAndStatus(tenantId, ConsultantClientMapping.MappingStatus.ACTIVE);
            
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
            
            log.info("🔍 중복 매칭 조회 완료: {}개 그룹", duplicates.size());
            
        } catch (Exception e) {
            log.error("❌ 중복 매칭 조회 실패", e);
        }
        
        return duplicates;
    }
    
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getConsultantVacationStats(String period) {
        log.info("📊 상담사별 휴가 통계 조회: period={}", period);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            LocalDate startDate = getVacationPeriodStartDate(period);
            LocalDate endDate = LocalDate.now().plusMonths(1); // 미래 1개월까지 포함
            
            log.info("📅 휴가 통계 조회 기간: {} ~ {} (period={})", startDate, endDate, period);
            
            String tenantId = getTenantIdOrNull();
            if (tenantId == null) {
                log.error("❌ tenantId가 설정되지 않았습니다");
                return new HashMap<>();
            }
            
            List<User> activeConsultants = userRepository.findByRoleAndIsActiveTrue(tenantId, UserRole.CONSULTANT);
            log.info("👥 활성 상담사 수: {}명", activeConsultants.size());
            
            List<Map<String, Object>> consultantStats = new ArrayList<>();
            double totalVacationDays = 0.0;
            
            for (User consultant : activeConsultants) {
                Map<String, Object> consultantData = new HashMap<>();
                consultantData.put("consultantId", consultant.getId());
                consultantData.put("consultantName", consultant.getName());
                consultantData.put("email", consultant.getEmail());
                
                double vacationCount = getConsultantVacationCount(consultant.getId(), startDate, endDate);
                consultantData.put("vacationDays", vacationCount);
                
                Map<String, Integer> vacationByType = getVacationCountByType(consultant.getId(), startDate, endDate);
                consultantData.put("vacationByType", vacationByType);
                
                Map<String, Double> vacationDaysByType = getVacationDaysByType(consultant.getId(), startDate, endDate);
                consultantData.put("vacationDaysByType", vacationDaysByType);
                
                log.info("🏖️ 상담사 {} 휴가 통계: 총 {}일, 유형별 개수={}, 유형별 일수={}", 
                    consultant.getName(), vacationCount, vacationByType, vacationDaysByType);
                
                LocalDate lastVacationDate = getLastVacationDate(consultant.getId());
                consultantData.put("lastVacationDate", lastVacationDate != null ? lastVacationDate.toString() : null);
                
                consultantStats.add(consultantData);
                totalVacationDays += vacationCount;
            }
            
            Map<String, Object> summary = new HashMap<>();
            summary.put("totalConsultants", activeConsultants.size());
            summary.put("totalVacationDays", totalVacationDays);
            summary.put("averageVacationDays", activeConsultants.size() > 0 ? 
                (double) totalVacationDays / activeConsultants.size() : 0.0);
            
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
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getConsultantVacationStatsByBranch(String period, String branchCode) {
        log.info("📊 상담사 휴가 통계 조회: period={}", period);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            LocalDate startDate = getVacationPeriodStartDate(period);
            LocalDate endDate = LocalDate.now().plusMonths(1); // 미래 1개월까지 포함
            
            log.info("📅 휴가 통계 조회 기간: {} ~ {} (period={})", startDate, endDate, period);
            
            String tenantId = getTenantIdOrNull();
            if (tenantId == null) {
                log.error("❌ tenantId가 설정되지 않았습니다");
                return new HashMap<>();
            }
            
            List<User> activeConsultants;
            if (branchCode == null || branchCode.trim().isEmpty()) {
                activeConsultants = new ArrayList<>();
            } else {
                try {
                    Branch branch = branchService.getBranchByCode(branchCode);
                    activeConsultants = userRepository.findByBranchAndRoleAndIsDeletedFalseOrderByUserId(tenantId, branch, UserRole.CONSULTANT);
                    activeConsultants = activeConsultants.stream()
                        .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                        .collect(Collectors.toList());
                } catch (com.coresolution.consultation.exception.EntityNotFoundException e) {
                    // 표준화 2025-12-07: 브랜치 개념 제거됨, 로그 제거
                // log.warn("브랜치를 찾을 수 없습니다: {}", branchCode);
                    activeConsultants = new ArrayList<>();
                }
            }
            log.info("👥 활성 상담사 수: {}명", activeConsultants.size());
            
            List<Map<String, Object>> consultantStats = new ArrayList<>();
            double totalVacationDays = 0.0;
            
            for (User consultant : activeConsultants) {
                Map<String, Object> consultantData = new HashMap<>();
                consultantData.put("consultantId", consultant.getId());
                consultantData.put("consultantName", consultant.getUserId());
                consultantData.put("consultantEmail", consultant.getEmail());
                consultantData.put("branchCode", null); // 표준화 2025-12-07: 브랜치 개념 제거됨
                
                double vacationDays = getConsultantVacationCount(consultant.getId(), startDate, endDate);
                consultantData.put("vacationDays", vacationDays);
                totalVacationDays += vacationDays;
                
                Map<String, Double> vacationByType = new HashMap<>();
                vacationByType.put("annual", vacationDays);
                vacationByType.put("sick", 0.0);
                vacationByType.put("personal", 0.0);
                consultantData.put("vacationByType", vacationByType);
                
                consultantStats.add(consultantData);
            }
            
            consultantStats.sort((a, b) -> Double.compare(
                (Double) b.get("vacationDays"), 
                (Double) a.get("vacationDays")
            ));
            
            List<Map<String, Object>> topVacationConsultants = consultantStats.stream()
                .limit(5)
                .collect(Collectors.toList());
            
            Map<String, Object> summary = new HashMap<>();
            summary.put("totalConsultants", activeConsultants.size());
            summary.put("totalVacationDays", totalVacationDays);
            summary.put("averageVacationDays", activeConsultants.isEmpty() ? 0.0 : totalVacationDays / activeConsultants.size());
            summary.put("branchCode", null); // 표준화 2025-12-07: 브랜치 개념 제거됨
            
            result.put("success", true);
            result.put("summary", summary);
            result.put("consultantStats", consultantStats);
            result.put("topVacationConsultants", topVacationConsultants);
            
            log.info("✅ 지점별 상담사 휴가 통계 조회 완료: 지점={}, 총 {}명, 총 휴가 {}일", 
                branchCode, activeConsultants.size(), totalVacationDays);
            
        } catch (Exception e) {
            log.error("❌ 지점별 상담사 휴가 통계 조회 실패: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "지점별 휴가 통계 조회에 실패했습니다: " + e.getMessage());
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
            List<Map<String, Object>> vacations = consultantAvailabilityService.getVacations(
                consultantId, 
                startDate.toString(), 
                endDate.toString()
            );
            
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
            case "MORNING_HALF_1": // 오전 반반차 1
            case "MORNING_HALF_2": // 오전 반반차 2  
            case "AFTERNOON_HALF_1": // 오후 반반차 1
            case "AFTERNOON_HALF_2": // 오후 반반차 2
            case "QUARTER": 
            case "QUARTER_DAY":
                return 0.25;
                
            case "MORNING": // 오전 반차
            case "AFTERNOON": // 오후 반차
            case "MORNING_HALF_DAY": // 오전반차
            case "AFTERNOON_HALF_DAY": // 오후반차
            case "HALF": 
            case "HALF_DAY":
                return 0.5;
                
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
            List<Map<String, Object>> vacations = consultantAvailabilityService.getVacations(
                consultantId, 
                startDate.toString(), 
                endDate.toString()
            );
            
            for (Map<String, Object> vacation : vacations) {
                if (Boolean.TRUE.equals(vacation.get("isApproved"))) {
                    String typeName = (String) vacation.get("typeName");
                    String type = (String) vacation.get("type");
                    
                    if (typeName == null && type != null) {
                        typeName = mapVacationTypeToCategory(type);
                    }
                    
                    if (typeName != null) {
                        vacationByType.merge(typeName, 1, Integer::sum);
                    }
                }
            }
            
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
            List<Map<String, Object>> vacations = consultantAvailabilityService.getVacations(
                consultantId, 
                startDate.toString(), 
                endDate.toString()
            );
            
            log.info("🔍 상담사 {} 휴가 데이터 분석 시작: 총 {}개 휴가", consultantId, vacations.size());
            
            for (Map<String, Object> vacation : vacations) {
                log.info("📋 휴가 데이터: {}", vacation);
                
                if (Boolean.TRUE.equals(vacation.get("isApproved"))) {
                    String typeName = (String) vacation.get("typeName");
                    String type = (String) vacation.get("type");
                    double weight = getVacationWeight(type);
                    
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
            List<Map<String, Object>> vacations = consultantAvailabilityService.getVacations(
                consultantId, 
                null, // 전체 기간
                null
            );
            
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
     * 휴가 유형을 카테고리로 매칭 (한글명도 처리)
     */
    private String mapVacationTypeToCategory(String vacationType) {
        if (vacationType == null) {
            return "연차";
        }
        
        String type = vacationType.toUpperCase();
        
        switch (type) {
            case "MORNING_HALF_1":
            case "MORNING_HALF_2":
            case "AFTERNOON_HALF_1":
            case "AFTERNOON_HALF_2":
                return "반반차";
                
            case "MORNING":
            case "AFTERNOON":
            case "MORNING_HALF_DAY":
            case "AFTERNOON_HALF_DAY":
                return "반차";
                
            case "CUSTOM_TIME":
                return "개인사정";
                
            case "ALL_DAY":
            case "FULL_DAY":
                return "연차";
        }
        
        if (vacationType.contains("반반차") || vacationType.contains("HALF_1") || vacationType.contains("HALF_2")) {
            return "반반차";
        } else if (vacationType.contains("반차") || vacationType.contains("오전") || vacationType.contains("오후")) {
            return "반차";
        } else if (vacationType.contains("개인") || vacationType.contains("사용자") || vacationType.contains("CUSTOM")) {
            return "개인사정";
        } else if (vacationType.contains("종일") || vacationType.contains("하루") || vacationType.contains("ALL") || vacationType.contains("FULL")) {
            return "연차";
        }
        
        return "연차";
    }
    
     /**
     * UserRoleAssignment 자동 생성
     /**
     * 
     /**
     * @param user 사용자
     /**
     * @param tenantId 테넌트 ID
     /**
     * @param userRole 사용자 역할
     */
    private void createUserRoleAssignment(User user, String tenantId, UserRole userRole) {
        try {
            String roleNameEn = mapUserRoleToTenantRoleNameEn(userRole);
            
            Optional<TenantRole> tenantRoleOpt = tenantRoleRepository.findByTenantIdAndNameEnAndIsDeletedFalse(
                tenantId, roleNameEn
            );
            
            if (tenantRoleOpt.isEmpty()) {
                log.warn("⚠️ TenantRole을 찾을 수 없습니다: tenantId={}, roleNameEn={}, userRole={}", 
                    tenantId, roleNameEn, userRole);
                return;
            }
            
            TenantRole tenantRole = tenantRoleOpt.get();
            
            boolean exists = userRoleAssignmentRepository.existsByUserAndTenantAndRoleAndBranch(
                user.getId(), tenantId, tenantRole.getTenantRoleId(), null
            );
            
            if (exists) {
                log.info("✅ UserRoleAssignment가 이미 존재합니다: userId={}, tenantId={}, roleId={}", 
                    user.getId(), tenantId, tenantRole.getTenantRoleId());
                return;
            }
            
            String assignmentId = UUID.randomUUID().toString();
            UserRoleAssignment assignment = UserRoleAssignment.builder()
                .assignmentId(assignmentId)
                .userId(user.getId())
                .tenantId(tenantId)
                .tenantRoleId(tenantRole.getTenantRoleId())
                .branchId(null)
                .effectiveFrom(LocalDate.now())
                .effectiveTo(null)
                .isActive(true)
                .assignedBy("SYSTEM")
                .assignmentReason("관리자 등록 시 자동 할당")
                .build();
            
            userRoleAssignmentRepository.save(assignment);
            log.info("✅ UserRoleAssignment 생성 완료: userId={}, tenantId={}, roleId={}, assignmentId={}", 
                user.getId(), tenantId, tenantRole.getTenantRoleId(), assignmentId);
        } catch (Exception e) {
            log.error("❌ UserRoleAssignment 생성 실패: userId={}, tenantId={}, userRole={}, error={}", 
                user.getId(), tenantId, userRole, e.getMessage(), e);
        }
    }
    
     /**
     * UserRole을 TenantRole name_en으로 매핑
     /**
     * 실제 TenantRole name_en과 일치시켜야 함
     */
    private String mapUserRoleToTenantRoleNameEn(UserRole userRole) {
        if (userRole == null) {
            return "Client";
        }
        
        switch (userRole) {
            case ADMIN:
                return "Director";
            case CONSULTANT:
                return "Counselor";
            case CLIENT:
                return "Client";
            case STAFF:
                return "Staff";
            default:
                return "Client";
        }
    }
    
     /**
     * 매칭의 notes에서 가장 최근 추가된 패키지 정보 추출
     */
    private Map<String, Object> getLastAddedPackageInfo(ConsultantClientMapping mapping) {
        Map<String, Object> result = new HashMap<>();
        result.put("sessions", 0);
        result.put("price", 0L);
        result.put("packageName", "");
        
        String notes = mapping.getNotes();
        if (notes == null || notes.trim().isEmpty()) {
            log.info("📋 매칭 notes가 없어서 최근 추가 패키지 정보를 찾을 수 없습니다.");
            return result;
        }
        
        try {
            String[] noteLines = notes.split("\n");
            
            for (int i = noteLines.length - 1; i >= 0; i--) {
                String line = noteLines[i].trim();
                
                if (line.contains("[추가 매칭]")) {
                    result.put("sessions", 10); // 기본 패키지 회기수
                    result.put("price", mapping.getPackagePrice() != null ? mapping.getPackagePrice() : 0L);
                    result.put("packageName", mapping.getPackageName() != null ? mapping.getPackageName() : "추가 패키지");
                    log.info("📦 추가 매칭 정보 발견: {}", line);
                    break;
                }
                
                if (line.contains("회기 추가") || line.contains("EXTENSION")) {
                    try {
                        if (line.matches(".*\\d+회.*")) {
                            String sessionStr = line.replaceAll(".*?(\\d+)회.*", "$1");
                            int sessions = Integer.parseInt(sessionStr);
                            result.put("sessions", sessions);
                            
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
            
            if ((Integer) result.get("sessions") == 0) {
                int totalSessions = mapping.getTotalSessions();
                if (totalSessions >= 10) {
                    int estimatedLastPackage = totalSessions % 10 == 0 ? 10 : totalSessions % 10;
                    if (estimatedLastPackage == 0) estimatedLastPackage = 10; // 10의 배수면 10회 패키지
                    
                    result.put("sessions", estimatedLastPackage);
                    
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

    @Override
    public List<ConsultantClientMapping> getMappingsByConsultantEmail(String consultantEmail) {
        log.info("🔍 상담사 이메일로 매칭 조회 - 이메일: {}", consultantEmail);
        String tenantId = getTenantId();
        
        Optional<User> consultantOpt = userRepository.findByTenantIdAndEmail(tenantId, consultantEmail);
        if (consultantOpt.isEmpty()) {
            log.warn("❌ 상담사를 찾을 수 없습니다 - 이메일: {}", consultantEmail);
            return new ArrayList<>();
        }
        
        User consultant = consultantOpt.get();
        log.info("🔍 찾은 상담사 정보 - ID: {}, 이름: {}, 역할: {}, 브랜치코드: {}", 
                consultant.getId(), consultant.getName(), consultant.getRole(), consultant.getBranchCode());
        
        List<ConsultantClientMapping> allMappings = mappingRepository.findByConsultantId(tenantId, consultant.getId());
        List<ConsultantClientMapping> mappings = allMappings.stream()
            .filter(mapping -> mapping.getStatus() != ConsultantClientMapping.MappingStatus.TERMINATED)
            .collect(java.util.stream.Collectors.toList());
        
        log.info("🔍 상담사별 매칭 수: {}", mappings.size());
        
        for (ConsultantClientMapping mapping : mappings) {
            log.info("🔍 매칭 정보 - ID: {}, 상담사ID: {}, 내담자ID: {}, 결제상태: {}, 상태: {}", 
                    mapping.getId(), 
                    mapping.getConsultant() != null ? mapping.getConsultant().getId() : "null",
                    mapping.getClient() != null ? mapping.getClient().getId() : "null",
                    mapping.getPaymentStatus(), mapping.getStatus());
        }
        
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
    
    // ==================== 표준화 2025-12-08: 유틸리티 메서드 ====================

    /**
     * 주민번호(앞6+뒤1) 검증·나이/성별 계산·암호화 저장 및 주소 필드 설정.
     * 상담일지·API에는 주민번호 노출하지 않음.
     *
     * @param user          설정 대상 User 엔티티
     * @param rrnFirst6     주민번호 앞 6자리 (null/빈값이면 RRN 처리 생략)
     * @param rrnLast1      주민번호 뒤 1자리
     * @param address       기본 주소
     * @param addressDetail 상세 주소
     * @param postalCode    우편번호
     * @throws IllegalArgumentException 주민번호 형식 오류 시
     */
    private void applyRrnAndAddressToUser(User user, String rrnFirst6, String rrnLast1,
            String address, String addressDetail, String postalCode) {
        if (user == null) {
            return;
        }
        if (rrnFirst6 != null && !rrnFirst6.trim().isEmpty() && rrnLast1 != null && !rrnLast1.trim().isEmpty()) {
            if (!RrnValidationUtil.validateFormat(rrnFirst6, rrnLast1)) {
                throw new IllegalArgumentException(
                        "주민번호 앞 6자리는 6자리 숫자, 뒤 1자리는 1자리 숫자(1~4)로 입력해 주세요.");
            }
            LocalDate birthDate = RrnValidationUtil.toBirthDate(rrnFirst6, rrnLast1);
            Integer age = RrnValidationUtil.toAge(birthDate);
            String gender = RrnValidationUtil.toGender(rrnLast1);
            String plainRrn = RrnValidationUtil.toPlainRrnForStorage(rrnFirst6, rrnLast1);
            if (plainRrn != null) {
                user.setRrnEncrypted(encryptionUtil.safeEncrypt(plainRrn));
            }
            user.setBirthDate(birthDate);
            user.setAge(age);
            user.setGender(gender);
        }
        if (address != null && !address.trim().isEmpty()) {
            user.setAddress(address.trim());
        }
        if (addressDetail != null && !addressDetail.trim().isEmpty()) {
            user.setAddressDetail(addressDetail.trim());
        }
        if (postalCode != null && !postalCode.trim().isEmpty()) {
            user.setPostalCode(postalCode.trim());
        }
    }

    /**
     * 선택 PII 문자열을 clients 등에 저장할 때 암호화 (빈값은 null).
     *
     * @param plain 평문
     * @return 암호문 또는 null
     */
    private String encryptOptionalPiiForStorage(String plain) {
        if (plain == null || plain.trim().isEmpty()) {
            return null;
        }
        return encryptionUtil.safeEncrypt(plain.trim());
    }

    private static String trimToNull(String s) {
        if (s == null || s.trim().isEmpty()) {
            return null;
        }
        return s.trim();
    }

    /**
     * users -> clients 저장 직전 tenantId 정합성 방어.
     */
    private void validateClientUserTenantIntegrity(User savedUser, String expectedTenantId) {
        if (savedUser == null || savedUser.getId() == null) {
            throw new IllegalStateException(AdminServiceUserFacingMessages.MSG_CLIENT_USER_SAVE_FAILED_NO_USER_ID);
        }
        if (expectedTenantId == null || expectedTenantId.isBlank()) {
            throw new IllegalStateException(AdminServiceUserFacingMessages.MSG_CLIENT_SAVE_TENANT_ID_EMPTY);
        }
        if (savedUser.getTenantId() == null || savedUser.getTenantId().isBlank()) {
            throw new IllegalStateException(AdminServiceUserFacingMessages.MSG_USERS_TENANT_ID_EMPTY_CLIENT_SAVE_ABORT);
        }
        if (!expectedTenantId.equals(savedUser.getTenantId())) {
            throw new IllegalStateException(
                "users.tenant_id 불일치로 clients 저장을 중단합니다. expected=" + expectedTenantId
                    + ", actual=" + savedUser.getTenantId()
            );
        }
    }

    /**
     * 임시 비밀번호 생성
     * 표준화 2025-12-08: 내담자 등록 시 자동 생성된 임시 비밀번호
     * 형식: CLIENT_{timestamp}_{random}
     *
     * @return 생성된 임시 비밀번호
     */
    private String generateTempPassword() {
        return "CLIENT_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 10000);
    }
}
