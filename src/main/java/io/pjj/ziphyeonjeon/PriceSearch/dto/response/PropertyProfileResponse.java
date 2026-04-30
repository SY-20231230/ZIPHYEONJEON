package io.pjj.ziphyeonjeon.PriceSearch.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class PropertyProfileResponse {
    
    // 1. 기본 정보
    private Long houseId;
    private String complexName;
    private String roadAddress;
    private String propertyType;
    private BigDecimal area;
    private String latestContractYm; // 최신 계약 년월
    
    // 2. 현재 시세
    private Long latestTradePrice;
    private Long pyeongPrice; // 평당 단가
    
    // 3. 전세 안전성 (Jeonse Risk)
    private Double jeonseRatio;
    private String riskLevel;
    
    // 4. 미래 가치 (AI Prediction)
    private Long aiPredictedPrice;
    private Integer aiPredictTargetMonth;
    private Long aiPriceDiff; // aiPredictedPrice - latestTradePrice
}
