package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.VirtualClientSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VirtualClientSessionRepository extends JpaRepository<VirtualClientSession, Long> {

    Optional<VirtualClientSession> findByIdAndIsDeletedFalse(Long id);

    List<VirtualClientSession> findByConsultantIdAndIsDeletedFalseOrderByCreatedAtDesc(Long consultantId);

    List<VirtualClientSession> findByConsultantIdAndSessionStatusAndIsDeletedFalse(
        Long consultantId, String sessionStatus);
}
