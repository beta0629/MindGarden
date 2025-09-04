package com.mindgarden.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.dto.ClientRegistrationDto;
import com.mindgarden.consultation.dto.ConsultantClientMappingDto;
import com.mindgarden.consultation.dto.ConsultantRegistrationDto;
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
        // Consultant 엔티티 생성 (User를 상속받음)
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
        
        Client client = clientRepository.findById(dto.getClientId())
                .orElseThrow(() -> new RuntimeException("Client not found"));

        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .consultant(consultant)
                .client(client)
                .startDate(dto.getStartDate() != null ? 
                    dto.getStartDate().atStartOfDay() : 
                    LocalDateTime.now())
                .status(dto.getStatus() != null ? 
                    ConsultantClientMapping.MappingStatus.valueOf(dto.getStatus()) : 
                    ConsultantClientMapping.MappingStatus.ACTIVE)
                .paymentStatus(dto.getPaymentStatus() != null ? 
                    ConsultantClientMapping.PaymentStatus.valueOf(dto.getPaymentStatus()) : 
                    ConsultantClientMapping.PaymentStatus.PENDING)
                .totalSessions(dto.getTotalSessions() != null ? dto.getTotalSessions() : 10)
                .remainingSessions(dto.getRemainingSessions() != null ? dto.getRemainingSessions() : (dto.getTotalSessions() != null ? dto.getTotalSessions() : 10))
                .usedSessions(0)
                .packageName(dto.getPackageName() != null ? dto.getPackageName() : "기본 패키지")
                .packagePrice(dto.getPackagePrice() != null ? dto.getPackagePrice() : 0L)
                .paymentMethod(dto.getPaymentMethod())
                .paymentReference(dto.getPaymentReference())
                .paymentAmount(dto.getPaymentAmount())
                .assignedAt(LocalDateTime.now())
                .notes(dto.getNotes())
                .responsibility(dto.getResponsibility())
                .specialConsiderations(dto.getSpecialConsiderations())
                .build();

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
    public List<Client> getAllClients() {
        // UserRepository를 사용하여 CLIENT role 사용자만 조회 (안전한 방법)
        return userRepository.findByRole(UserRole.CLIENT).stream()
                .filter(user -> user instanceof Client)
                .map(user -> (Client) user)
                .collect(java.util.stream.Collectors.toList());
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
}
