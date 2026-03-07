package io.pjj.ziphyeonjeon.RiskAnalysis.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import io.pjj.ziphyeonjeon.RiskAnalysis.entity.RiskAnalysisResult;

@Repository
public interface RiskAnalysisRepository extends JpaRepository<RiskAnalysisResult, Long> {

}
