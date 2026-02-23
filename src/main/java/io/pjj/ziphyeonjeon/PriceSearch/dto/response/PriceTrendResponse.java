package io.pjj.ziphyeonjeon.PriceSearch.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class PriceTrendResponse {

    private String regionName; // "서울특별시 강남구 역삼동"
    private List<TrendItem> trends;

    @Data
    @Builder
    public static class TrendItem {
        private String period; // YYYYMM

        // 단위: 만원/m2 (매매, 전세)
        private Double aptSale;
        private Double aptJeonse;
        private Double aptWolse; // 단위: 만원 (월세액)

        private Double villaSale;
        private Double villaJeonse;
        private Double villaWolse; // 단위: 만원 (월세액)

        private Double officetelSale;
        private Double officetelJeonse;
        private Double officetelWolse; // 단위: 만원 (월세액)
    }
}
