package io.pjj.ziphyeonjeon.RiskAnalysis.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "RISK_ANALYSIS_RESULT")
public class RiskAnalysisResult {

    protected RiskAnalysisResult() {
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RISK_RESULT_ID")
    private Long riskResultId;

    @Column(name = "ADDRESS", length = 100)
    private String address;

    @Column(name = "ANALYZED_AT", nullable = false)
    private LocalDateTime analyzedAt;

    @Column(name = "TOTAL_SAFETY_SCORE", precision = 5, scale = 2)
    private BigDecimal totalSafetyScore;

    @Column(name = "FINAL_GRADE", length = 20)
    private String finalGrade;

    @Column(name = "DISASTER_RISK_SCORE", precision = 5, scale = 2)
    private BigDecimal disasterRiskScore;

    @Column(name = "BUILDING_RISK_SCORE", precision = 5, scale = 2)
    private BigDecimal buildingRiskScore;

    @Column(name = "REGISTER_RISK_SCORE", precision = 5, scale = 2)
    private BigDecimal registerRiskScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "LEGAL_ANALYSIS_RESULT")
    private String legalAnalysisResult;

    public RiskAnalysisResult(BigDecimal totalSafetyScore, String finalGrade) {
        this.totalSafetyScore = totalSafetyScore;
        this.finalGrade = finalGrade;
        this.analyzedAt = LocalDateTime.now();
    }

    // setter
    public void setRiskResultId(Long riskResultId) {
        this.riskResultId = riskResultId;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public void setAnalyzedAt(LocalDateTime analyzedAt) {
        this.analyzedAt = analyzedAt;
    }

    public void setTotalSafetyScore(BigDecimal totalSafetyScore) {
        this.totalSafetyScore = totalSafetyScore;
    }

    public void setFinalGrade(String finalGrade) {
        this.finalGrade = finalGrade;
    }

    public void setDisasterRiskScore(BigDecimal disasterRiskScore) {
        this.disasterRiskScore = disasterRiskScore;
    }

    public void setBuildingRiskScore(BigDecimal buildingRiskScore) {
        this.buildingRiskScore = buildingRiskScore;
    }

    public void setRegisterRiskScore(BigDecimal registerRiskScore) {
        this.registerRiskScore = registerRiskScore;
    }

    public void setLegalAnalysisResult(String legalAnalysisResult) {
        this.legalAnalysisResult = legalAnalysisResult;
    }

    // getter
    public Long getRiskResultId() {
        return riskResultId;
    }

    public String getAddress() { return address; }

    public LocalDateTime getAnalyzedAt() {
        return analyzedAt;
    }

    public BigDecimal getTotalSafetyScore() {
        return totalSafetyScore;
    }

    public String getFinalGrade() {
        return finalGrade;
    }

    public BigDecimal getRegisterRiskScore() {
        return registerRiskScore;
    }

    public BigDecimal getBuildingRiskScore() {
        return buildingRiskScore;
    }

    public BigDecimal getDisasterRiskScore() {
        return disasterRiskScore;
    }

    public String getLegalAnalysisResult() {
        return legalAnalysisResult;
    }

}