package com.mindgarden.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import com.mindgarden.consultation.dto.ClientRegistrationDto;
import com.mindgarden.consultation.dto.ConsultantClientMappingDto;
import com.mindgarden.consultation.dto.ConsultantRegistrationDto;
import com.mindgarden.consultation.entity.Client;
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
        User consultant = User.builder()
                .username(dto.getUsername())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .name(dto.getName())
                .phone(dto.getPhone())
                .role("CONSULTANT")
                .isActive(true)
                .build();
        
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
        client.setRole("ROLE_CLIENT");
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

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
        mapping.setAssignedAt(LocalDateTime.now());
        mapping.setStartDate(LocalDateTime.now()); // 시작일 설정
        mapping.setNotes(dto.getNotes()); // 메모 설정

        return mappingRepository.save(mapping);
    }

    @Override
    public List<User> getAllConsultants() {
        return userRepository.findByRole("ROLE_CONSULTANT");
    }

    @Override
    public List<Client> getAllClients() {
        // Client 엔티티에서 role이 CLIENT인 것만 조회
        return clientRepository.findAll().stream()
                .filter(client -> "ROLE_CLIENT".equals(client.getRole()))
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    public List<ConsultantClientMapping> getAllMappings() {
        return mappingRepository.findAll();
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
