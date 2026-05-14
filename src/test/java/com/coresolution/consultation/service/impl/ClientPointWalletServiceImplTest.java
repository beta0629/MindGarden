package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import com.coresolution.consultation.dto.shop.ShopPointBalanceResponse;
import com.coresolution.consultation.entity.ClientPointWallet;
import com.coresolution.consultation.repository.ClientPointLedgerEntryRepository;
import com.coresolution.consultation.repository.ClientPointWalletRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link ClientPointWalletServiceImpl} 단위 검증.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ClientPointWalletServiceImpl")
class ClientPointWalletServiceImplTest {

    @Mock
    private ClientPointWalletRepository clientPointWalletRepository;

    @Mock
    private ClientPointLedgerEntryRepository clientPointLedgerEntryRepository;

    @InjectMocks
    private ClientPointWalletServiceImpl service;

    @Test
    @DisplayName("지갑 없으면 잔액 0")
    void getBalance_noWallet_returnsZero() {
        when(clientPointWalletRepository.findByTenantIdAndUserId("tenant-a", 42L)).thenReturn(Optional.empty());
        ShopPointBalanceResponse b = service.getBalance("tenant-a", 42L);
        assertEquals(0L, b.getAvailableMinor());
        assertEquals(0L, b.getHeldMinor());
    }

    @Test
    @DisplayName("hold 금액이 가용을 초과하면 예외")
    void hold_insufficient_throws() {
        when(clientPointLedgerEntryRepository.existsByTenantIdAndIdempotencyKeyAndIsDeletedFalse("t", "k1"))
                .thenReturn(false);
        ClientPointWallet w = ClientPointWallet.builder()
                .userId(1L)
                .availableMinor(100L)
                .heldMinor(0L)
                .build();
        w.setTenantId("t");
        when(clientPointWalletRepository.lockByTenantIdAndUserId("t", 1L)).thenReturn(Optional.of(w));
        assertThrows(IllegalArgumentException.class,
                () -> service.hold("t", 1L, "order-1", 200L, "k1"));
        verify(clientPointLedgerEntryRepository, never()).save(any());
    }
}
