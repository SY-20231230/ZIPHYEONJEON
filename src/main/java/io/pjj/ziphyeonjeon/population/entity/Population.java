package io.pjj.ziphyeonjeon.population.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Entity
@Table(name = "POPULATIONS")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Population {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "POPULATIONS_ID")
    private Long populationsId;

    @Column(name = "REFERENCE_DATE")
    private Timestamp referenceDate;

    @Column(name = "HOURS")
    private Integer hours;

    @Column(name = "POPULATION_COUNT")
    private Double populationCount;

    @Column(name = "SIDO", length = 2)
    private String sido;

    @Column(name = "SIGUNGU", length = 5)
    private String sigungu;

    @Column(name = "ADSTRD_CD", length = 10)
    private String adstrdCd;

    @Builder
    public Population(Timestamp referenceDate, Integer hours, Double populationCount, String sido, String sigungu, String adstrdCd) {
        this.referenceDate = referenceDate;
        this.hours = hours;
        this.populationCount = populationCount;
        this.sido = sido;
        this.sigungu = sigungu;
        this.adstrdCd = adstrdCd;
    }
}
