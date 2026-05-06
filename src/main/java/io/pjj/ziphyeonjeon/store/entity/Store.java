package io.pjj.ziphyeonjeon.store.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "STORE")
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "STORE_ID")
    private Long storeId;

    @Column(name = "SGG_CD")
    private String sggCd;

    @Column(name = "SIGUNGU")
    private String sigungu;

    @Column(name = "EMD")
    private String emd;

    @Column(name = "TYPE")
    private String type;

    @Column(name = "JIBUN")
    private String jibun;

    @Column(name = "BUILDING_USE")
    private String buildingUse;

    @Column(name = "DEAL_YEAR")
    private String dealYear;

    @Column(name = "DEAL_MONTH")
    private String dealMonth;

    @Column(name = "DEAL_DAY")
    private String dealDay;

    @Column(name = "FLOOR")
    private String floor;

    @Column(name = "AMOUNT")
    private String amount;

    @Column(name = "AREA", precision = 14, scale = 4)
    private BigDecimal area;

    protected Store() {}

    public Store(String sggCd, String sigungu, String emd, String type, String jibun, String buildingUse, String dealYear, String dealMonth, String dealDay, String floor, String amount, BigDecimal area) {
        this.sggCd = sggCd;
        this.sigungu = sigungu;
        this.emd = emd;
        this.type = type;
        this.jibun = jibun;
        this.buildingUse = buildingUse;
        this.dealYear = dealYear;
        this.dealMonth = dealMonth;
        this.dealDay = dealDay;
        this.floor = floor;
        this.amount = amount;
        this.area = area;
    }

    public Long getStoreId() { return storeId; }
    public String getSggCd() { return sggCd; }
    public String getSigungu() { return sigungu; }
    public String getEmd() { return emd; }
    public String getType() { return type; }
    public String getJibun() { return jibun; }
    public String getBuildingUse() { return buildingUse; }
    public String getDealYear() { return dealYear; }
    public String getDealMonth() { return dealMonth; }
    public String getDealDay() { return dealDay; }
    public String getFloor() { return floor; }
    public String getAmount() { return amount; }
    public BigDecimal getArea() { return area; }
}
