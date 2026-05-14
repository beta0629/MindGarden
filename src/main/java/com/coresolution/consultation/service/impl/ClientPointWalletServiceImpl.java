package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.PointLedgerEntryType;
import com.coresolution.consultation.dto.shop.ShopPointBalanceResponse;
import com.coresolution.consultation.entity.ClientPointLedgerEntry;
import com.coresolution.consultation.entity.ClientPointWallet;
import com.coresolution.consultation.repository.ClientPointLedgerEntryRepository;
import com.coresolution.consultation.repository.ClientPointWalletRepository;
import com.coresolution.consultation.service.ClientPointWalletService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 포인트 지갑 구현 (비관적 락).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClientPointWalletServiceImpl implements ClientPointWalletService {

    private final ClientPointWalletRepository clientPointWalletRepository;
    private final ClientPointLedgerEntryRepository clientPointLedgerEntryRepository;

    @Override
    @Transactional(readOnly = true)
    public ShopPointBalanceResponse getBalance(String tenantId, Long userId) {
        return clientPointWalletRepository.findByTenantIdAndUserId(tenantId, userId)
                .map(w -> ShopPointBalanceResponse.builder()
                        .availableMinor(w.getAvailableMinor())
                        .heldMinor(w.getHeldMinor())
                        .build())
                .orElse(ShopPointBalanceResponse.builder().availableMinor(0L).heldMinor(0L).build());
    }

    @Override
    @Transactional
    public void hold(String tenantId, Long userId, String orderPublicId, long amountMinor, String idempotencyKey) {
        if (amountMinor <= 0) {
            return;
        }
        if (clientPointLedgerEntryRepository.existsByTenantIdAndIdempotencyKeyAndIsDeletedFalse(tenantId, idempotencyKey)) {
            return;
        }
        ClientPointWallet wallet = loadOrCreateWalletForUpdate(tenantId, userId);
        if (wallet.getAvailableMinor() < amountMinor) {
            throw new IllegalArgumentException("사용 가능한 포인트가 부족합니다.");
        }
        wallet.setAvailableMinor(wallet.getAvailableMinor() - amountMinor);
        wallet.setHeldMinor(wallet.getHeldMinor() + amountMinor);
        clientPointWalletRepository.save(wallet);
        persistLedger(tenantId, userId, orderPublicId, PointLedgerEntryType.HOLD, amountMinor, idempotencyKey);
    }

    @Override
    @Transactional
    public void releaseHold(String tenantId, Long userId, String orderPublicId, long amountMinor, String idempotencyKey) {
        if (amountMinor <= 0) {
            return;
        }
        if (clientPointLedgerEntryRepository.existsByTenantIdAndIdempotencyKeyAndIsDeletedFalse(tenantId, idempotencyKey)) {
            return;
        }
        ClientPointWallet wallet = clientPointWalletRepository.lockByTenantIdAndUserId(tenantId, userId)
                .orElseThrow(() -> new IllegalStateException("포인트 지갑이 없어 hold 해제를 할 수 없습니다."));
        if (wallet.getHeldMinor() < amountMinor) {
            throw new IllegalStateException("예약된 포인트가 불일치하여 해제할 수 없습니다.");
        }
        wallet.setHeldMinor(wallet.getHeldMinor() - amountMinor);
        wallet.setAvailableMinor(wallet.getAvailableMinor() + amountMinor);
        clientPointWalletRepository.save(wallet);
        persistLedger(tenantId, userId, orderPublicId, PointLedgerEntryType.RELEASE, amountMinor, idempotencyKey);
    }

    @Override
    @Transactional
    public void commitHold(String tenantId, Long userId, String orderPublicId, long amountMinor, String idempotencyKey) {
        if (amountMinor <= 0) {
            return;
        }
        if (clientPointLedgerEntryRepository.existsByTenantIdAndIdempotencyKeyAndIsDeletedFalse(tenantId, idempotencyKey)) {
            return;
        }
        ClientPointWallet wallet = clientPointWalletRepository.lockByTenantIdAndUserId(tenantId, userId)
                .orElseThrow(() -> new IllegalStateException("포인트 지갑이 없어 확정 차감을 할 수 없습니다."));
        if (wallet.getHeldMinor() < amountMinor) {
            throw new IllegalStateException("예약된 포인트가 불일치하여 확정할 수 없습니다.");
        }
        wallet.setHeldMinor(wallet.getHeldMinor() - amountMinor);
        clientPointWalletRepository.save(wallet);
        persistLedger(tenantId, userId, orderPublicId, PointLedgerEntryType.COMMIT, amountMinor, idempotencyKey);
    }

    private ClientPointWallet loadOrCreateWalletForUpdate(String tenantId, Long userId) {
        java.util.Optional<ClientPointWallet> locked = clientPointWalletRepository.lockByTenantIdAndUserId(tenantId, userId);
        if (locked.isPresent()) {
            return locked.get();
        }
        ClientPointWallet created = ClientPointWallet.builder()
                .userId(userId)
                .availableMinor(0L)
                .heldMinor(0L)
                .build();
        created.setTenantId(tenantId);
        clientPointWalletRepository.saveAndFlush(created);
        return clientPointWalletRepository.lockByTenantIdAndUserId(tenantId, userId)
                .orElseThrow(() -> new IllegalStateException("포인트 지갑 생성 직후 조회에 실패했습니다."));
    }

    private void persistLedger(
            String tenantId,
            Long userId,
            String orderPublicId,
            PointLedgerEntryType type,
            long amountMinor,
            String idempotencyKey) {

        ClientPointLedgerEntry entry = ClientPointLedgerEntry.builder()
                .userId(userId)
                .orderPublicId(orderPublicId)
                .entryType(type)
                .amountMinor(amountMinor)
                .idempotencyKey(idempotencyKey)
                .build();
        entry.setTenantId(tenantId);
        clientPointLedgerEntryRepository.save(entry);
    }
}
