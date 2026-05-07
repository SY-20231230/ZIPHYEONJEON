package io.pjj.ziphyeonjeon.PriceSearch.dto.request;

import lombok.Data;

@Data
public class PropertyDirectoryRequest {
    private String sigungu;      // 예: "서울특별시 동작구"
    private String dong;         // 예: "상도동" (옵션)
    private String propertyType; // "아파트", "연립다세대", "오피스텔" (옵션)
    private String keyword;      // 단지명 또는 도로명 검색어 (옵션)
    private int page = 0;
    private int size = 20;
}
