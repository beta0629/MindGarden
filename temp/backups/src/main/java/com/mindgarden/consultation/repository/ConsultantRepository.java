package com.mindgarden.consultation.repository;

import com.mindgarden.consultation.entity.Consultant;
import org.springframework.stereotype.Repository;

/**
 * 상담사 데이터 접근 레이어
 */
@Repository
public interface ConsultantRepository extends BaseRepository<Consultant, Long> {
    
    // 상담사 특화 쿼리 메서드들은 BaseRepository에서 상속받음
    
}
