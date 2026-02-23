package io.pjj.ziphyeonjeon.PriceSearch.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class JeonseRatioRequest {
    // address (기존 호환 유지)
    private String address;

    // 구조화된 주소 (신규 - 파싱 불필요)
    private String sigungu; // 예: "서울특별시 서초구"
    private String dong; // 예: "반포동"

    // 유형 (아파트, 빌라 등)
    private String propertyType;

    // 전용면적
    private BigDecimal exclusiveArea;

    // 전세보증금
    private Long jeonse_amount;

    // market_price (선택 입력: 사용자 지정 매매가)
    private Long market_price;
}
