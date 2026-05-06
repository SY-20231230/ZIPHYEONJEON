package io.pjj.ziphyeonjeon.industry.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Entity
@Table(name = "INDUSTRY")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Industry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "INDUSTRY_ID")
    private Long industryId;

    @Column(name = "REFERENCE_DATE")
    private Timestamp referenceDate;

    @Column(name = "SGG_CD", length = 5)
    private String sggCd;

    @Column(name = "ADSTRD_CD", length = 10)
    private String adstrdCd;

    @Column(name = "ADSTRD_NM")
    private String adstrdNm;

    @Column(name = "SVC_INDUTY_CD", length = 20)
    private String svcIndutyCd;

    @Column(name = "SVC_INDUTY_NM")
    private String svcIndutyNm;

    @Column(name = "SHOP_COUNT")
    private Integer shopCount;

    @Column(name = "SIMILR_INDUTY_SHOP_COUNT")
    private Integer similarIndutyShopCount;

    @Column(name = "OPBIZ_RT")
    private Double opbizRt;

    @Column(name = "OPBIZ_SHOP_COUNT")
    private Integer opbizShopCount;

    @Column(name = "CLSBIZ_RT")
    private Double clsbizRt;

    @Column(name = "CLSBIZ_SHOP_COUNT")
    private Integer clsbizShopCount;

    @Column(name = "FRC_SHOP_COUNT")
    private Integer frcShopCount;

    @Builder
    public Industry(Timestamp referenceDate, String sggCd, String adstrdCd, String adstrdNm, String svcIndutyCd, String svcIndutyNm, Integer shopCount, Integer similarIndutyShopCount, Double opbizRt, Integer opbizShopCount, Double clsbizRt, Integer clsbizShopCount, Integer frcShopCount) {
        this.referenceDate = referenceDate;
        this.sggCd = sggCd;
        this.adstrdCd = adstrdCd;
        this.adstrdNm = adstrdNm;
        this.svcIndutyCd = svcIndutyCd;
        this.svcIndutyNm = svcIndutyNm;
        this.shopCount = shopCount;
        this.similarIndutyShopCount = similarIndutyShopCount;
        this.opbizRt = opbizRt;
        this.opbizShopCount = opbizShopCount;
        this.clsbizRt = clsbizRt;
        this.clsbizShopCount = clsbizShopCount;
        this.frcShopCount = frcShopCount;
    }
}
