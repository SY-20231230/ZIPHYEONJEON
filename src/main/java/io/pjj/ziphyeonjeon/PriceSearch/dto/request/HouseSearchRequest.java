package io.pjj.ziphyeonjeon.PriceSearch.dto.request;

import lombok.Data;

@Data
public class HouseSearchRequest {
    private String sigungu; // 예: "서울특별시 동작구"
    private String propertyType; // "아파트", "연립다세대", "오피스텔"
    private String dealType; // "매매", "전월세" 등
    private String startMonth; // "202401"
    private String endMonth; // "202412"
    
    // Pagination parameters
    private int page = 0; // 시작 페이지 (0부터)
    private int size = 20; // 한 번에 가져올 데이터 개수 (기본 20개)
}
