package io.pjj.ziphyeonjeon.store.dto;

import io.pjj.ziphyeonjeon.store.entity.Store;
import java.math.BigDecimal;

public record StoreDto(
    Long storeId,
    String sggCd,
    String sigungu,
    String emd,
    String type,
    String jibun,
    String buildingUse,
    String dealYear,
    String dealMonth,
    String dealDay,
    String floor,
    String amount,
    BigDecimal area
) {
    public static StoreDto from(Store store) {
        return new StoreDto(
            store.getStoreId(), store.getSggCd(), store.getSigungu(), store.getEmd(), store.getType(),
            store.getJibun(), store.getBuildingUse(), store.getDealYear(), store.getDealMonth(),
            store.getDealDay(), store.getFloor(), store.getAmount(), store.getArea()
        );
    }
}
