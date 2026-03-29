package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.VirtualClientSession;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VirtualClientSessionRepository extends BaseRepository<VirtualClientSession, Long> {

    List<VirtualClientSession> findByConsultantIdAndIsDeletedFalseOrderByCreatedAtDesc(Long consultantId);

    List<VirtualClientSession> findByConsultantIdAndSessionStatusAndIsDeletedFalse(
        Long consultantId, String sessionStatus);
}
