package io.pjj.ziphyeonjeon.RiskAnalysis.repository;

import io.pjj.ziphyeonjeon.RiskAnalysis.entity.AnalysisTargetDoc;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RiskUploadRepository extends JpaRepository<AnalysisTargetDoc, Long> {
}
