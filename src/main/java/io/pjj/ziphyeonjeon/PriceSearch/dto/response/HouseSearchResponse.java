package io.pjj.ziphyeonjeon.PriceSearch.dto.response;

import io.pjj.ziphyeonjeon.PriceSearch.entity.House;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class HouseSearchResponse {
    
    // 페이징된 매물 데이터 리스트 (20개씩)
    private List<House> content;
    
    // 페이징 정보
    private int pageNo;
    private int pageSize;
    private long totalElements;
    private int totalPages;
    private boolean isLast;
    
    // 시세 그래프용 데이터 리스트 (평당 평균 단가)
    private List<TrendData> trendGraph;

    @Data
    @Builder
    public static class TrendData {
        private String month; // "202401"
        private Double avgPricePerPyeong; // 3.3m2 당 평균 거래가
    }
}
