package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.TreatmentPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TreatmentPredictionRepository extends JpaRepository<TreatmentPrediction, Long> {

    Optional<TreatmentPrediction> findByIdAndIsDeletedFalse(Long id);

    Optional<TreatmentPrediction> findFirstByClientIdAndIsDeletedFalseOrderByPredictionDateDesc(Long clientId);

    List<TreatmentPrediction> findByClientIdAndIsDeletedFalseOrderByPredictionDateDesc(Long clientId);
}
