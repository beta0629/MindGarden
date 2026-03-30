package com.coresolution.core.service.ops;

import com.coresolution.core.controller.dto.ops.PricingPlanCreateRequest;
import com.coresolution.core.controller.dto.ops.PricingPlanUpdateRequest;
import com.coresolution.core.domain.PricingPlan;
import com.coresolution.core.repository.PricingPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 요금제 관리 서비스 (Ops 포털용)
 * 요금제 CRUD 및 관리 기능
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PricingPlanService {
    
    private final PricingPlanRepository pricingPlanRepository;
    
    /**
     * 모든 요금제 목록 조회
     */
    public List<PricingPlan> findAllPlans() {
        log.debug("모든 요금제 목록 조회");
        return pricingPlanRepository.findAll();
    }
    
    /**
     * 활성화된 요금제 목록 조회
     */
    public List<PricingPlan> findAllActivePlans() {
        log.debug("활성화된 요금제 목록 조회");
        return pricingPlanRepository.findAllActive();
    }
    
    /**
     * plan_code로 요금제 조회
     */
    public Optional<PricingPlan> findByPlanCode(String planCode) {
        log.debug("요금제 조회: planCode={}", planCode);
        return pricingPlanRepository.findByPlanCode(planCode);
    }
    
    /**
     * plan_id로 요금제 조회
     */
    public Optional<PricingPlan> findByPlanId(String planId) {
        log.debug("요금제 조회: planId={}", planId);
        return pricingPlanRepository.findByPlanId(planId);
    }
    
    /**
     * 활성화된 요금제 개수 조회
     */
    @Transactional(readOnly = true)
    public long countActivePlans() {
        log.debug("활성화된 요금제 개수 조회");
        return pricingPlanRepository.countByIsActiveTrue();
    }
    
    /**
     * 요금제 생성
     * 
     * @param request 요금제 생성 요청
     * @param createdBy 생성자
     * @return 생성된 요금제
     */
    @Transactional
    public PricingPlan createPlan(PricingPlanCreateRequest request, String createdBy) {
        log.info("요금제 생성 요청: planCode={}, displayName={}", request.planCode(), request.displayName());
        
        // plan_code 중복 확인
        if (pricingPlanRepository.findByPlanCode(request.planCode()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 요금제 코드입니다: " + request.planCode());
        }
        
        // plan_id 생성 (UUID)
        String planId = UUID.randomUUID().toString();
        
        // 요금제 엔티티 생성
        PricingPlan plan = PricingPlan.builder()
            .planId(planId)
            .planCode(request.planCode())
            .name(request.displayName())
            .nameKo(request.displayNameKo())
            .baseFee(request.baseFee())
            .currency(request.currency() != null ? request.currency() : "KRW")
            .billingCycle(PricingPlan.BillingCycle.MONTHLY)
            .description(request.description())
            .descriptionKo(request.descriptionKo())
            .isActive(true)
            .displayOrder(0)
            .build();
        
        PricingPlan saved = pricingPlanRepository.save(plan);
        log.info("요금제 생성 완료: planId={}, planCode={}", saved.getPlanId(), saved.getPlanCode());
        
        return saved;
    }
    
    /**
     * 요금제 수정
     * 
     * @param planId 요금제 ID
     * @param request 요금제 수정 요청
     * @param updatedBy 수정자
     * @return 수정된 요금제
     */
    @Transactional
    public PricingPlan updatePlan(String planId, PricingPlanUpdateRequest request, String updatedBy) {
        log.info("요금제 수정 요청: planId={}", planId);
        
        PricingPlan plan = pricingPlanRepository.findByPlanId(planId)
            .orElseThrow(() -> new IllegalArgumentException("요금제를 찾을 수 없습니다: " + planId));
        
        // 요금제 정보 업데이트
        plan.setName(request.displayName());
        if (request.displayNameKo() != null) {
            plan.setNameKo(request.displayNameKo());
        }
        plan.setBaseFee(request.baseFee());
        plan.setCurrency(request.currency());
        if (request.description() != null) {
            plan.setDescription(request.description());
        }
        if (request.descriptionKo() != null) {
            plan.setDescriptionKo(request.descriptionKo());
        }
        if (request.active() != null) {
            plan.setIsActive(request.active());
        }
        
        PricingPlan saved = pricingPlanRepository.save(plan);
        log.info("요금제 수정 완료: planId={}, planCode={}", saved.getPlanId(), saved.getPlanCode());
        
        return saved;
    }
    
    /**
     * 요금제 비활성화 (소프트 삭제)
     * 
     * @param planId 요금제 ID
     * @param deletedBy 삭제자
     */
    @Transactional
    public void deactivatePlan(String planId, String deletedBy) {
        log.info("요금제 비활성화 요청: planId={}", planId);
        
        PricingPlan plan = pricingPlanRepository.findByPlanId(planId)
            .orElseThrow(() -> new IllegalArgumentException("요금제를 찾을 수 없습니다: " + planId));
        
        // 비활성화 처리 (소프트 삭제)
        plan.setIsActive(false);
        plan.delete(); // BaseEntity의 delete() 메서드 사용 (isDeleted = true, deletedAt = now)
        
        pricingPlanRepository.save(plan);
        log.info("요금제 비활성화 완료: planId={}, planCode={}", plan.getPlanId(), plan.getPlanCode());
    }
}

