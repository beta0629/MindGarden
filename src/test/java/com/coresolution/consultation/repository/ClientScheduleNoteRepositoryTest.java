package com.coresolution.consultation.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import com.coresolution.consultation.entity.ClientScheduleNote;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@Transactional
@ActiveProfiles("test")
@DisplayName("ClientScheduleNoteRepository 테스트")
class ClientScheduleNoteRepositoryTest {

    @Autowired
    private ClientScheduleNoteRepository clientScheduleNoteRepository;

    @Test
    @DisplayName("countUnresolvedByClientIdsGrouped - tenantId, clientId IN, 미해소, 미삭제 조건 검증")
    void countUnresolvedByClientIdsGrouped_returnsCorrectCounts() {
        // Given
        String tenantId = UUID.randomUUID().toString();
        String otherTenantId = UUID.randomUUID().toString();
        
        Long client1 = Math.abs(java.util.concurrent.ThreadLocalRandom.current().nextLong());
        Long client2 = Math.abs(java.util.concurrent.ThreadLocalRandom.current().nextLong());
        Long client3 = Math.abs(java.util.concurrent.ThreadLocalRandom.current().nextLong());

        // client1: 미해소 2건, 해소 1건, 삭제 1건, 타 테넌트 1건 -> 기대: 2
        saveNote(tenantId, client1, false, null); // 미해소
        saveNote(tenantId, client1, false, null); // 미해소
        saveNote(tenantId, client1, false, LocalDateTime.now()); // 해소
        saveNote(tenantId, client1, true, null); // 삭제
        saveNote(otherTenantId, client1, false, null); // 타 테넌트

        // client2: 미해소 1건 -> 기대: 1
        saveNote(tenantId, client2, false, null); // 미해소

        // client3: 미해소 0건 -> 기대: 결과에 없음

        clientScheduleNoteRepository.flush();

        // When
        List<Object[]> results = clientScheduleNoteRepository.countUnresolvedByClientIdsGrouped(
                tenantId, List.of(client1, client2, client3));

        // Then
        Map<Long, Long> countMap = results.stream()
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).longValue(),
                        row -> ((Number) row[1]).longValue()
                ));

        assertThat(countMap).hasSize(2);
        assertThat(countMap.get(client1)).isEqualTo(2L);
        assertThat(countMap.get(client2)).isEqualTo(1L);
        assertThat(countMap.containsKey(client3)).isFalse();
    }

    private void saveNote(String tenantId, Long clientId, boolean isDeleted, LocalDateTime resolvedAt) {
        ClientScheduleNote note = new ClientScheduleNote();
        note.setTenantId(tenantId);
        note.setClientId(clientId);
        note.setScheduleId(9999L);
        note.setNoteType("GENERAL");
        note.setTitle("Test Note");
        note.setBody("Test Body");
        note.setIsDeleted(isDeleted);
        note.setResolvedAt(resolvedAt);
        clientScheduleNoteRepository.save(note);
    }
}
