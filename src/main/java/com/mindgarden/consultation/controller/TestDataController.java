package com.mindgarden.consultation.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import com.mindgarden.consultation.dto.ClientRegistrationDto;
import com.mindgarden.consultation.dto.ConsultantClientMappingDto;
import com.mindgarden.consultation.dto.ConsultantRegistrationDto;
import com.mindgarden.consultation.entity.Client;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.AdminService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 테스트용 데이터 생성 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestDataController {

    private final AdminService adminService;
    
    @Value("${spring.profiles.active:prod}")
    private String activeProfile;
    
    /**
     * 개발 모드인지 확인
     */
    private boolean isDev() {
        return "local".equals(activeProfile) || "dev".equals(activeProfile) || "development".equals(activeProfile);
    }

    /**
     * 테스트용 데이터 생성 (상담사, 내담자, 매핑)
     * 개발 모드에서만 동작
     */
    @PostMapping("/create-test-data")
    public ResponseEntity<?> createTestData() {
        // 개발 모드가 아니면 접근 거부
        if (!isDev()) {
            log.warn("🚫 운영 환경에서 테스트 데이터 생성 시도 차단");
            return ResponseEntity.status(403)
                .body(Map.of("error", "테스트 데이터 생성은 개발 모드에서만 가능합니다."));
        }
        
        log.info("🧪 테스트용 데이터 생성 시작 (개발 모드: {})", activeProfile);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 1. 상담사 등록
            ConsultantRegistrationDto consultantDto = ConsultantRegistrationDto.builder()
                    .username("consultant1@mindgarden.com")
                    .password("password123")
                    .name("김상담")
                    .email("consultant1@mindgarden.com")
                    .phone("010-1234-5678")
                    .address("서울시 강남구")
                    .addressDetail("테헤란로 123")
                    .postalCode("06123")
                    .specialization("스트레스, 불안, 우울증")
                    .qualifications("상담심리사 1급, 임상심리사")
                    .notes("5년 경력의 전문 상담사")
                    .role("ROLE_CONSULTANT")
                    .build();

            User consultant = adminService.registerConsultant(consultantDto);
            result.put("consultant", consultant);
            log.info("✅ 상담사 생성 완료: {}", consultant.getEmail());

            // 2. 내담자 등록
            ClientRegistrationDto clientDto = ClientRegistrationDto.builder()
                    .name("이내담")
                    .age(28)
                    .phone("010-9876-5432")
                    .email("client1@example.com")
                    .address("서울시 서초구")
                    .addressDetail("서초대로 456")
                    .postalCode("06543")
                    .consultationPurpose("직장 스트레스 및 업무 압박감으로 인한 불안 증상")
                    .consultationHistory("이전 상담 경험 없음")
                    .emergencyContact("이부모")
                    .emergencyPhone("010-1111-2222")
                    .notes("IT 업계 종사자, 야근이 잦음")
                    .registeredBy("1") // 관리자 ID
                    .build();

            Client client = adminService.registerClient(clientDto);
            result.put("client", client);
            log.info("✅ 내담자 생성 완료: {}", client.getName());

            // 3. 상담사-내담자 매핑 생성
            ConsultantClientMappingDto mappingDto = ConsultantClientMappingDto.builder()
                    .consultantId(consultant.getId())
                    .clientId(client.getId())
                    .startDate(LocalDate.now())
                    .notes("스트레스 관련 상담 담당")
                    .responsibility("정신건강 상담")
                    .specialConsiderations("야근이 잦아 피로도가 높음")
                    .status("ACTIVE")
                    .assignedBy("1") // 관리자 ID
                    .build();

            ConsultantClientMapping mapping = adminService.createMapping(mappingDto);
            result.put("mapping", mapping);
            log.info("✅ 매핑 생성 완료: ID={}", mapping.getId());

            result.put("message", "테스트 데이터 생성 완료");
            result.put("success", true);
            
            log.info("🎉 테스트용 데이터 생성 완료");
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("❌ 테스트 데이터 생성 실패: {}", e.getMessage(), e);
            result.put("message", "테스트 데이터 생성 실패: " + e.getMessage());
            result.put("success", false);
            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * 추가 상담사 등록 (개발 모드에서만 동작)
     */
    @PostMapping("/create-consultant")
    public ResponseEntity<?> createConsultant(@RequestBody ConsultantRegistrationDto request) {
        // 개발 모드가 아니면 접근 거부
        if (!isDev()) {
            log.warn("🚫 운영 환경에서 테스트 상담사 등록 시도 차단");
            return ResponseEntity.status(403)
                .body(Map.of("error", "테스트 상담사 등록은 개발 모드에서만 가능합니다."));
        }
        
        log.info("🧪 추가 상담사 등록: {}", request.getUsername());
        
        try {
            User consultant = adminService.registerConsultant(request);
            log.info("✅ 추가 상담사 등록 완료: {}", consultant.getEmail());
            
            return ResponseEntity.ok(consultant);
        } catch (Exception e) {
            log.error("❌ 추가 상담사 등록 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("상담사 등록 실패: " + e.getMessage());
        }
    }

    /**
     * 추가 내담자 등록 (개발 모드에서만 동작)
     */
    @PostMapping("/create-client")
    public ResponseEntity<?> createClient(@RequestBody ClientRegistrationDto request) {
        // 개발 모드가 아니면 접근 거부
        if (!isDev()) {
            log.warn("🚫 운영 환경에서 테스트 내담자 등록 시도 차단");
            return ResponseEntity.status(403)
                .body(Map.of("error", "테스트 내담자 등록은 개발 모드에서만 가능합니다."));
        }
        
        log.info("🧪 추가 내담자 등록: {}", request.getName());
        
        try {
            Client client = adminService.registerClient(request);
            log.info("✅ 추가 내담자 등록 완료: {}", client.getName());
            
            return ResponseEntity.ok(client);
        } catch (Exception e) {
            log.error("❌ 추가 내담자 등록 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("내담자 등록 실패: " + e.getMessage());
        }
    }

    /**
     * 추가 매핑 생성 (개발 모드에서만 동작)
     */
    @PostMapping("/create-mapping")
    public ResponseEntity<?> createMapping(@RequestBody ConsultantClientMappingDto request) {
        // 개발 모드가 아니면 접근 거부
        if (!isDev()) {
            log.warn("🚫 운영 환경에서 테스트 매핑 생성 시도 차단");
            return ResponseEntity.status(403)
                .body(Map.of("error", "테스트 매핑 생성은 개발 모드에서만 가능합니다."));
        }
        
        log.info("🧪 추가 매핑 생성: 상담사={}, 내담자={}", 
                request.getConsultantId(), request.getClientId());
        
        try {
            ConsultantClientMapping mapping = adminService.createMapping(request);
            log.info("✅ 추가 매핑 생성 완료: ID={}", mapping.getId());
            
            return ResponseEntity.ok(mapping);
        } catch (Exception e) {
            log.error("❌ 추가 매핑 생성 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("매핑 생성 실패: " + e.getMessage());
        }
    }

    /**
     * 생성된 데이터 조회 (개발 모드에서만 동작)
     */
    @GetMapping("/data")
    public ResponseEntity<?> getTestData() {
        // 개발 모드가 아니면 접근 거부
        if (!isDev()) {
            log.warn("🚫 운영 환경에서 테스트 데이터 조회 시도 차단");
            return ResponseEntity.status(403)
                .body(Map.of("error", "테스트 데이터 조회는 개발 모드에서만 가능합니다."));
        }
        
        log.info("🧪 테스트 데이터 조회 (개발 모드: {})", activeProfile);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            result.put("consultants", adminService.getAllConsultants());
            result.put("clients", adminService.getAllClients());
            result.put("mappings", adminService.getAllMappings());
            result.put("success", true);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("❌ 테스트 데이터 조회 실패: {}", e.getMessage(), e);
            result.put("message", "데이터 조회 실패: " + e.getMessage());
            result.put("success", false);
            return ResponseEntity.badRequest().body(result);
        }
    }
}
