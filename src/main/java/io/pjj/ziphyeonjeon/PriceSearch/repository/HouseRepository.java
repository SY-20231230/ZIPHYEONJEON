package io.pjj.ziphyeonjeon.PriceSearch.repository;

import io.pjj.ziphyeonjeon.PriceSearch.entity.House;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface HouseRepository extends JpaRepository<House, Long> {

    // 주소 기반 일반 검색
    List<House> findBySigunguContainingAndRoadnameContainingOrderByContractYmDescContractDayDesc(String sigungu, String roadname);

    List<House> findBySigunguContainingAndJibunContainingOrderByContractYmDescContractDayDesc(String sigungu, String jibun);

    // 동 + 본번을 통한 Loose 검색 (Jibun 정보 부재시)
    List<House> findBySigunguContainingAndEmdContainingAndBonbunContainingOrderByContractYmDescContractDayDesc(String sigungu, String emd, String bonbun);

    // 단지명(Name) 기반 검색 (2024년 이후 등)
    List<House> findByNameContainingAndContractYmGreaterThanEqualOrderByContractYmDescContractDayDesc(String name, String contractYm);

    // 시군구와 계약년월 기반 검색
    List<House> findBySigunguContainingAndContractYm(String sigungu, String contractYm);

    // [NEW] 기간 설정, 페이징 기반 통합 실거래가 검색 쿼리
    Page<House> findBySigunguContainingAndPropertyTypeAndDealTypeAndContractYmBetweenOrderByContractYmDescContractDayDesc(
            String sigungu, String propertyType, String dealType, String startMonth, String endMonth, Pageable pageable);

    // [NEW] 트렌드 그래프: 3.3제곱미터(평) 당 평균 매매/전세 단가
    @Query("SELECT h.contractYm, " +
            "AVG(CASE " +
            "  WHEN h.dealType = '매매' THEN (h.trade / h.area) * 3.3 " +
            "  WHEN h.dealType LIKE '%전세%' THEN (h.deposit / h.area) * 3.3 " +
            "  WHEN h.dealType = '월세' THEN (h.rentfee) * 3.3 " + // 월세는 단가보다는 그대로 쓰는 경우가 많지만 통일성을 위해 식 유지
            "  ELSE 0 END) " +
            "FROM House h " +
            "WHERE h.sigungu LIKE %:sigungu% " +
            "AND h.propertyType = :propertyType " +
            "AND h.dealType = :dealType " +
            "AND h.contractYm BETWEEN :startMonth AND :endMonth " +
            "GROUP BY h.contractYm " +
            "ORDER BY h.contractYm ASC")
    List<Object[]> findMonthlyTrendGraphData(
            @Param("sigungu") String sigungu,
            @Param("propertyType") String propertyType,
            @Param("dealType") String dealType,
            @Param("startMonth") String startMonth,
            @Param("endMonth") String endMonth);


    // 평균 거래금액(매매 등) - AREA 범위와 타입 지정
    @Query("SELECT AVG(h.trade) FROM House h " +
            "WHERE h.sigungu LIKE %:sigungu% " +
            "AND (h.emd LIKE %:dong% OR h.sigungu LIKE %:dong%) " +
            "AND h.area BETWEEN :minArea AND :maxArea " +
            "AND (:propertyType IS NULL OR h.propertyType = :propertyType) " +
            "AND h.dealType = '매매'")
    Double findAverageTrade(@Param("sigungu") String sigungu,
                            @Param("dong") String dong,
                            @Param("minArea") BigDecimal minArea,
                            @Param("maxArea") BigDecimal maxArea,
                            @Param("propertyType") String propertyType);

    // 평균 전세보증금 - AREA 범위와 타입 지정
    @Query("SELECT AVG(h.deposit) FROM House h " +
            "WHERE h.sigungu LIKE %:sigungu% " +
            "AND (h.emd LIKE %:dong% OR h.sigungu LIKE %:dong%) " +
            "AND h.area BETWEEN :minArea AND :maxArea " +
            "AND (:propertyType IS NULL OR h.propertyType = :propertyType) " +
            "AND h.dealType = '전세'")
    Double findAverageDeposit(@Param("sigungu") String sigungu,
                              @Param("dong") String dong,
                              @Param("minArea") BigDecimal minArea,
                              @Param("maxArea") BigDecimal maxArea,
                              @Param("propertyType") String propertyType);

    // [NEW] 지역 시세 변동 단독 그래프용 9-in-1 통합 쿼리 (아파트, 빌라, 오피스텔 × 매매, 전세, 월세)
    @Query("SELECT h.contractYm, " +
            "AVG(CASE WHEN h.propertyType = '아파트' AND h.dealType = '매매' THEN (h.trade / h.area) * 3.3 ELSE NULL END), " +
            "AVG(CASE WHEN h.propertyType = '아파트' AND h.dealType LIKE '%전세%' THEN (h.deposit / h.area) * 3.3 ELSE NULL END), " +
            "AVG(CASE WHEN h.propertyType = '아파트' AND h.dealType = '월세' THEN h.rentfee * 3.3 ELSE NULL END), " +
            "AVG(CASE WHEN h.propertyType = '연립다세대' AND h.dealType = '매매' THEN (h.trade / h.area) * 3.3 ELSE NULL END), " +
            "AVG(CASE WHEN h.propertyType = '연립다세대' AND h.dealType LIKE '%전세%' THEN (h.deposit / h.area) * 3.3 ELSE NULL END), " +
            "AVG(CASE WHEN h.propertyType = '연립다세대' AND h.dealType = '월세' THEN h.rentfee * 3.3 ELSE NULL END), " +
            "AVG(CASE WHEN h.propertyType = '오피스텔' AND h.dealType = '매매' THEN (h.trade / h.area) * 3.3 ELSE NULL END), " +
            "AVG(CASE WHEN h.propertyType = '오피스텔' AND h.dealType LIKE '%전세%' THEN (h.deposit / h.area) * 3.3 ELSE NULL END), " +
            "AVG(CASE WHEN h.propertyType = '오피스텔' AND h.dealType = '월세' THEN h.rentfee * 3.3 ELSE NULL END) " +
            "FROM House h " +
            "WHERE h.sigungu LIKE %:sigungu% " +
            "AND h.contractYm BETWEEN :startMonth AND :endMonth " +
            "GROUP BY h.contractYm " +
            "ORDER BY h.contractYm ASC")
    List<Object[]> findComprehensiveMonthlyTrendGraphData(
            @Param("sigungu") String sigungu,
            @Param("startMonth") String startMonth,
            @Param("endMonth") String endMonth);
}
