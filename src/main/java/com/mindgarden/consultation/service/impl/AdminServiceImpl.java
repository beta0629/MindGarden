package com.mindgarden.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.dto.ClientRegistrationDto;
import com.mindgarden.consultation.dto.ConsultantClientMappingDto;
import com.mindgarden.consultation.dto.ConsultantRegistrationDto;
import com.mindgarden.consultation.dto.ConsultantTransferRequest;
import com.mindgarden.consultation.entity.Client;
import com.mindgarden.consultation.entity.Consultant;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.ClientRepository;
import com.mindgarden.consultation.repository.ConsultantClientMappingRepository;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.AdminService;
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
    private final ClientRepository clientRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public User registerConsultant(ConsultantRegistrationDto dto) {
        // 같은 username을 가진 삭제된 상담사가 있는지 확인
        Optional<User> existingConsultant = userRepository.findByUsernameAndIsActive(dto.getUsername(), false);
        
        if (existingConsultant.isPresent()) {
            // 삭제된 상담사가 있으면 기존 데이터를 업데이트
            User consultant = existingConsultant.get();
            consultant.setEmail(dto.getEmail());
            consultant.setPassword(passwordEncoder.encode(dto.getPassword()));
            consultant.setName(dto.getName());
            consultant.setPhone(dto.getPhone());
            consultant.setIsActive(true); // 활성화
            consultant.setSpecialization(dto.getSpecialization());
            
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
            consultant.setPhone(dto.getPhone());
            consultant.setRole(UserRole.CONSULTANT);
            consultant.setIsActive(true);
            
            // 상담사 전용 정보 설정
            consultant.setSpecialty(dto.getSpecialization());
            consultant.setCertification(dto.getQualifications());
            
            return userRepository.save(consultant);
        }
    }

    @Override
    public Client registerClient(ClientRegistrationDto dto) {
        // Client 엔티티 생성 (User를 상속받음)
        Client client = new Client();
        client.setUsername(dto.getUsername());
        client.setEmail(dto.getEmail());
        client.setPassword(passwordEncoder.encode(dto.getPassword()));
        client.setName(dto.getName());
        client.setPhone(dto.getPhone());
        client.setRole(UserRole.CLIENT);
        client.setIsActive(true);
        
        // Client만 저장하면 User도 자동으로 저장됨 (상속 구조)
        return clientRepository.save(client);
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
        return userRepository.findByRole(UserRole.CONSULTANT);
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
                consultantData.put("phone", consultant.getPhone());
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
     * 코드로 전문분야 이름 조회 (임시 구현)
     */
    private String getSpecialtyNameByCode(String code) {
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
        
        return specialtyMap.getOrDefault(code, code);
    }

    @Override
    public List<Client> getAllClients() {
        // UserRepository를 사용하여 CLIENT role 사용자만 조회
        // User 엔티티를 Client로 변환하여 반환
        return userRepository.findByRole(UserRole.CLIENT).stream()
                .map(user -> {
                    // User를 Client로 변환
                    Client client = new Client();
                    client.setId(user.getId());
                    client.setUsername(user.getUsername());
                    client.setEmail(user.getEmail());
                    client.setName(user.getName());
                    client.setPhone(user.getPhone());
                    client.setRole(user.getRole());
                    client.setIsActive(user.getIsActive());
                    client.setGrade(user.getGrade());
                    client.setCreatedAt(user.getCreatedAt());
                    client.setUpdatedAt(user.getUpdatedAt());
                    client.setAddress(user.getAddress());
                    client.setAddressDetail(user.getAddressDetail());
                    client.setPostalCode(user.getPostalCode());
                    client.setAge(user.getAge());
                    client.setGender(user.getGender());
                    client.setBirthDate(user.getBirthDate());
                    client.setProfileImageUrl(user.getProfileImageUrl());
                    client.setIsEmailVerified(user.getIsEmailVerified());
                    client.setTotalConsultations(user.getTotalConsultations());
                    client.setExperiencePoints(user.getExperiencePoints());
                    client.setLastLoginAt(user.getLastLoginAt());
                    client.setMemo(user.getMemo());
                    client.setNotes(user.getNotes());
                    client.setIsDeleted(user.getIsDeleted());
                    client.setDeletedAt(user.getDeletedAt());
                    client.setVersion(user.getVersion());
                    return client;
                })
                .collect(Collectors.toList());
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
        
        return userRepository.save(consultant);
    }

    @Override
    public Client updateClient(Long id, ClientRegistrationDto dto) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));
        
        client.setName(dto.getName());
        client.setEmail(dto.getEmail());
        client.setPhone(dto.getPhone());
        
        return clientRepository.save(client);
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
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));
        client.setIsActive(false);
        clientRepository.save(client);
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
        return mappingRepository.findByConsultantIdAndStatusNot(consultantId, ConsultantClientMapping.MappingStatus.TERMINATED);
    }

    @Override
    public List<ConsultantClientMapping> getMappingsByClient(Long clientId) {
        return mappingRepository.findByClientIdAndStatusNot(clientId, ConsultantClientMapping.MappingStatus.TERMINATED);
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
}
