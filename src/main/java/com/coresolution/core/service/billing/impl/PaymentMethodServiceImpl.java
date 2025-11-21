package com.coresolution.core.service.billing.impl;

import com.coresolution.core.controller.dto.billing.PaymentMethodCreateRequest;
import com.coresolution.core.controller.dto.billing.PaymentMethodResponse;
import com.coresolution.core.domain.billing.PaymentMethod;
import com.coresolution.core.repository.billing.PaymentMethodRepository;
import com.coresolution.core.service.billing.PaymentMethodService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 결제 수단 서비스 구현
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PaymentMethodServiceImpl implements PaymentMethodService {
    
    private final PaymentMethodRepository paymentMethodRepository;
    private final PasswordEncoder passwordEncoder; // 토큰 암호화용
    
    @Override
    public PaymentMethodResponse createPaymentMethod(PaymentMethodCreateRequest request) {
        log.info("결제 수단 생성 요청: pgProvider={}, tenantId={}", request.pgProvider(), request.tenantId());
        
        // 토큰 저장 (원본 billingKey를 그대로 저장 - 토스페이먼츠 테스트 모드 사용)
        // 주의: 실제 운영에서는 암호화 필요하지만, 현재는 테스트 목적이므로 원본 저장
        String paymentMethodToken = request.paymentMethodToken();
        
        // 결제 수단 엔티티 생성
        PaymentMethod paymentMethod = PaymentMethod.builder()
                .paymentMethodId(UUID.randomUUID().toString())
                .tenantId(request.tenantId())
                .paymentMethodToken(paymentMethodToken)
                .pgProvider(request.pgProvider())
                .cardBrand(request.cardBrand())
                .cardLast4(request.cardLast4())
                .cardExpMonth(request.cardExpMonth())
                .cardExpYear(request.cardExpYear())
                .cardholderName(request.cardholderName())
                .isDefault(false) // 기본값은 false, 첫 번째 결제 수단이면 true로 설정 가능
                .isActive(true)
                .build();
        
        // 저장
        paymentMethod = paymentMethodRepository.save(paymentMethod);
        
        log.info("결제 수단 생성 완료: paymentMethodId={}", paymentMethod.getPaymentMethodId());
        
        return toResponse(paymentMethod);
    }
    
    @Override
    @Transactional(readOnly = true)
    public PaymentMethodResponse getPaymentMethod(String paymentMethodId) {
        PaymentMethod paymentMethod = paymentMethodRepository.findByPaymentMethodId(paymentMethodId)
                .orElseThrow(() -> new IllegalArgumentException("결제 수단을 찾을 수 없습니다: " + paymentMethodId));
        
        return toResponse(paymentMethod);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PaymentMethodResponse> getPaymentMethodsByTenant(String tenantId) {
        List<PaymentMethod> paymentMethods = paymentMethodRepository
                .findByTenantIdAndIsActiveTrueAndIsDeletedFalse(tenantId);
        
        return paymentMethods.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public PaymentMethodResponse setDefaultPaymentMethod(String paymentMethodId, String tenantId) {
        // 기존 기본 결제 수단 해제
        paymentMethodRepository.findByTenantIdAndIsDefaultTrueAndIsActiveTrueAndIsDeletedFalse(tenantId)
                .ifPresent(existing -> {
                    existing.setIsDefault(false);
                    paymentMethodRepository.save(existing);
                });
        
        // 새로운 기본 결제 수단 설정
        PaymentMethod paymentMethod = paymentMethodRepository.findByPaymentMethodId(paymentMethodId)
                .orElseThrow(() -> new IllegalArgumentException("결제 수단을 찾을 수 없습니다: " + paymentMethodId));
        
        paymentMethod.setIsDefault(true);
        paymentMethod = paymentMethodRepository.save(paymentMethod);
        
        return toResponse(paymentMethod);
    }
    
    @Override
    public void deletePaymentMethod(String paymentMethodId) {
        log.info("결제 수단 삭제 요청: paymentMethodId={}", paymentMethodId);
        
        PaymentMethod paymentMethod = paymentMethodRepository.findByPaymentMethodId(paymentMethodId)
                .orElseThrow(() -> new IllegalArgumentException("결제 수단을 찾을 수 없습니다: " + paymentMethodId));
        
        // 기본 결제 수단인 경우 삭제 불가 (다른 결제 수단을 기본으로 설정 후 삭제)
        if (Boolean.TRUE.equals(paymentMethod.getIsDefault())) {
            throw new IllegalStateException("기본 결제 수단은 삭제할 수 없습니다. 먼저 다른 결제 수단을 기본으로 설정해주세요.");
        }
        
        // 소프트 삭제
        paymentMethod.setIsActive(false);
        paymentMethodRepository.save(paymentMethod);
        
        log.info("✅ 결제 수단 삭제 완료: paymentMethodId={}", paymentMethodId);
    }
    
    @Override
    public PaymentMethodResponse updatePaymentMethod(String paymentMethodId, PaymentMethodCreateRequest request) {
        log.info("결제 수단 업데이트 요청: paymentMethodId={}", paymentMethodId);
        
        PaymentMethod paymentMethod = paymentMethodRepository.findByPaymentMethodId(paymentMethodId)
                .orElseThrow(() -> new IllegalArgumentException("결제 수단을 찾을 수 없습니다: " + paymentMethodId));
        
        // 새 토큰 저장 (원본 billingKey를 그대로 저장)
        String paymentMethodToken = request.paymentMethodToken();
        
        // 결제 수단 정보 업데이트
        paymentMethod.setPaymentMethodToken(paymentMethodToken);
        paymentMethod.setPgProvider(request.pgProvider());
        paymentMethod.setCardBrand(request.cardBrand());
        paymentMethod.setCardLast4(request.cardLast4());
        paymentMethod.setCardExpMonth(request.cardExpMonth());
        paymentMethod.setCardExpYear(request.cardExpYear());
        paymentMethod.setCardholderName(request.cardholderName());
        
        paymentMethod = paymentMethodRepository.save(paymentMethod);
        
        log.info("✅ 결제 수단 업데이트 완료: paymentMethodId={}", paymentMethodId);
        
        return toResponse(paymentMethod);
    }
    
    private PaymentMethodResponse toResponse(PaymentMethod paymentMethod) {
        return new PaymentMethodResponse(
                paymentMethod.getPaymentMethodId(),
                paymentMethod.getTenantId(),
                paymentMethod.getPgProvider(),
                paymentMethod.getCardBrand(),
                paymentMethod.getCardLast4(),
                paymentMethod.getCardExpMonth(),
                paymentMethod.getCardExpYear(),
                paymentMethod.getCardholderName(),
                paymentMethod.getIsDefault(),
                paymentMethod.getCreatedAt()
        );
    }
}

