package io.pjj.ziphyeonjeon.PriceSearch.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PropertyDirectoryResponse {
    private Long representativeHouseId; // 상호작용(찜, 열람기록, AI예측) 연동용 최신 거래 ID
    private String complexName;         // 단지명 (예: 래미안상도)
    private String roadAddress;         // 도로명 주소
    private Long totalTransactions;     // 해당 단지의 누적 실거래 건수
    private String propertyType;        // 매물 유형 (아파트, 연립다세대, 오피스텔)
}
