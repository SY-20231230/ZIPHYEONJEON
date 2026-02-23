package io.pjj.ziphyeonjeon.PriceSearch.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class PriceSuggestionRequest {
    // 기존 호환
    private String address;

    // 구조화된 주소 + 유형 (신규)
    private String sigungu; // 예: "서초구"
    private String dong; // 예: "반포동"
    private String propertyType; // "아파트", "빌라", "오피스텔"

    private BigDecimal area_m2;

    // 사용자가 입력하는 매물 상세 정보 (보정 계수 산출용)
    private MarketData market_data;

    @Data
    public static class MarketData {
        private Integer built_year; // 건축년도 (연식 보정용)
        private Integer floor; // 층수 (층별 보정용)
        private Long current_price; // 현재 호가 (비교용, 선택)
    }
}
