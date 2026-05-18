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
        List<House> findBySigunguContainingAndRoadnameContainingOrderByContractYmDescContractDayDesc(String sigungu,
                        String roadname);

        List<House> findBySigunguContainingAndJibunContainingOrderByContractYmDescContractDayDesc(String sigungu,
                        String jibun);

        // 동 + 본번을 통한 Loose 검색 (Jibun 정보 부재시)
        List<House> findBySigunguContainingAndEmdContainingAndBonbunContainingOrderByContractYmDescContractDayDesc(
                        String sigungu, String emd, String bonbun);

        // 단지명(Name) 기반 검색 (2024년 이후 등)
        List<House> findByNameContainingAndContractYmGreaterThanEqualOrderByContractYmDescContractDayDesc(String name,
                        String contractYm);

        // 시군구와 계약년월 기반 검색
        List<House> findBySigunguContainingAndContractYm(String sigungu, String contractYm);

        // 시군구와 특정 연도(예: "2024")로 시작하는 계약년월 데이터 모두 조회
        @Query("SELECT h FROM House h WHERE h.sigungu LIKE CONCAT('%', :sigungu, '%') AND h.contractYm LIKE CONCAT(:year, '%')")
        List<House> findBySigunguContainingAndContractYmStartingWith(@Param("sigungu") String sigungu,
                        @Param("year") String year);

        // [NEW] 필터 적용 실거래가 다운로드용 쿼리 (빈 값일 경우 무시)
        @Query("SELECT h FROM House h WHERE h.sigungu LIKE CONCAT('%', :sigungu, '%') " +
                        "AND h.contractYm LIKE CONCAT(:year, '%') " +
                        "AND (:propertyType IS NULL OR :propertyType = '' OR h.propertyType = :propertyType) " +
                        "AND (:dealType IS NULL OR :dealType = '' OR h.dealType = :dealType)")
        List<House> findDownloadData(@Param("sigungu") String sigungu,
                        @Param("year") String year,
                        @Param("propertyType") String propertyType,
                        @Param("dealType") String dealType);

        // [NEW] 기간 설정, 페이징 기반 통합 실거래가 검색 쿼리 (동 포함, 도로명/단지명 키워드 포함)
        @Query("SELECT h FROM House h " +
                        "WHERE h.sigungu LIKE %:sigungu% " +
                        "AND (:dong IS NULL OR :dong = '' OR h.emd LIKE %:dong% OR h.sigungu LIKE %:dong%) " +
                        "AND (:keyword IS NULL OR :keyword = '' OR h.roadname LIKE %:keyword% OR h.name LIKE %:keyword%) "
                        +
                        "AND (:propertyType IS NULL OR :propertyType = '' OR h.propertyType = :propertyType) " +
                        "AND (:dealType IS NULL OR :dealType = '' OR h.dealType = :dealType) " +
                        "AND h.contractYm BETWEEN :startMonth AND :endMonth " +
                        "ORDER BY h.contractYm DESC, h.contractDay DESC")
        Page<House> searchHouseWithPagination(
                        @Param("sigungu") String sigungu,
                        @Param("dong") String dong,
                        @Param("keyword") String keyword,
                        @Param("propertyType") String propertyType,
                        @Param("dealType") String dealType,
                        @Param("startMonth") String startMonth,
                        @Param("endMonth") String endMonth,
                        Pageable pageable);

        // [NEW] 트렌드 그래프: 매매/전세는 3.3㎡(평) 당 단가, 월세는 보증금과 월세액 그대로 반환 (듀얼 그래프용)
        @Query("SELECT h.contractYm, " +
                        "AVG(CASE " +
                        "  WHEN h.dealType = '매매' THEN (h.trade / h.area) * 3.3 " +
                        "  WHEN h.dealType LIKE '%전세%' THEN (h.deposit / h.area) * 3.3 " +
                        "  ELSE NULL END), " +
                        "AVG(CASE WHEN h.dealType = '월세' THEN h.deposit ELSE NULL END), " +
                        "AVG(CASE WHEN h.dealType = '월세' THEN h.rentfee ELSE NULL END) " +
                        "FROM House h " +
                        "WHERE h.sigungu LIKE %:sigungu% " +
                        "AND (:dong IS NULL OR :dong = '' OR h.emd LIKE %:dong% OR h.sigungu LIKE %:dong%) " +
                        "AND h.propertyType = :propertyType " +
                        "AND h.dealType = :dealType " +
                        "AND h.contractYm BETWEEN :startMonth AND :endMonth " +
                        "GROUP BY h.contractYm " +
                        "ORDER BY h.contractYm ASC")
        List<Object[]> findMonthlyTrendGraphData(
                        @Param("sigungu") String sigungu,
                        @Param("dong") String dong,
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

        // [NEW] 지역 전체 평균 매매/전세금액 (면적 제한 없이 지역/유형 전체의 현재 평균가 산출, AI 추세율 계산용)
        @Query("SELECT AVG(CASE WHEN :dealType = '매매' THEN h.trade ELSE h.deposit END) FROM House h " +
                        "WHERE h.sigungu LIKE :sigungu% " +
                        "AND h.propertyType = :propertyType " +
                        "AND (h.dealType = '매매' OR h.dealType LIKE '%전세%')")
        Double findAveragePriceBySigunguAndPropertyType(
                        @Param("sigungu") String sigungu,
                        @Param("propertyType") String propertyType,
                        @Param("dealType") String dealType);

        // [NEW] 전세가율 계산용: 가장 최근 매매 실거래가 1건 조회 (전용면적 ±10% 필터 포함)
        House findTopBySigunguContainingAndEmdContainingAndPropertyTypeAndDealTypeAndAreaBetweenOrderByContractYmDescContractDayDesc(
                        String sigungu, String dong, String propertyType, String dealType, BigDecimal minArea,
                        BigDecimal maxArea);

        // [NEW] 프로필 조회용: 동일 단지의 가장 최근 '매매' 실거래가 1건 조회
        House findTopBySigunguAndEmdAndNameAndDealTypeOrderByContractYmDescContractDayDesc(
                        String sigungu, String emd, String name, String dealType);

        // 평균 전세보증금 - AREA 범위와 타입 지정
        @Query("SELECT AVG(h.deposit) FROM House h " +
                        "WHERE h.sigungu LIKE :sigungu% " +
                        "AND (h.emd LIKE %:dong% OR h.sigungu LIKE %:dong%) " +
                        "AND h.area BETWEEN :minArea AND :maxArea " +
                        "AND (:propertyType IS NULL OR h.propertyType = :propertyType) " +
                        "AND h.dealType = '전세'")
        Double findAverageDeposit(@Param("sigungu") String sigungu,
                        @Param("dong") String dong,
                        @Param("minArea") BigDecimal minArea,
                        @Param("maxArea") BigDecimal maxArea,
                        @Param("propertyType") String propertyType);

        // [NEW] 지역 시세 변동 단독 그래프용 12-in-1 통합 쿼리 (아파트/빌라/오피스텔 × 매매/전세/월세보증금/월세액)
        @Query("SELECT h.contractYm, " +
                        "AVG(CASE WHEN h.propertyType = '아파트' AND h.dealType = '매매' THEN (h.trade / h.area) * 3.3 ELSE NULL END), "
                        +
                        "AVG(CASE WHEN h.propertyType = '아파트' AND h.dealType LIKE '%전세%' THEN (h.deposit / h.area) * 3.3 ELSE NULL END), "
                        +
                        "AVG(CASE WHEN h.propertyType = '아파트' AND h.dealType = '월세' THEN h.deposit ELSE NULL END), " +
                        "AVG(CASE WHEN h.propertyType = '아파트' AND h.dealType = '월세' THEN h.rentfee ELSE NULL END), " +
                        "AVG(CASE WHEN h.propertyType = '연립다세대' AND h.dealType = '매매' THEN (h.trade / h.area) * 3.3 ELSE NULL END), "
                        +
                        "AVG(CASE WHEN h.propertyType = '연립다세대' AND h.dealType LIKE '%전세%' THEN (h.deposit / h.area) * 3.3 ELSE NULL END), "
                        +
                        "AVG(CASE WHEN h.propertyType = '연립다세대' AND h.dealType = '월세' THEN h.deposit ELSE NULL END), " +
                        "AVG(CASE WHEN h.propertyType = '연립다세대' AND h.dealType = '월세' THEN h.rentfee ELSE NULL END), " +
                        "AVG(CASE WHEN h.propertyType = '오피스텔' AND h.dealType = '매매' THEN (h.trade / h.area) * 3.3 ELSE NULL END), "
                        +
                        "AVG(CASE WHEN h.propertyType = '오피스텔' AND h.dealType LIKE '%전세%' THEN (h.deposit / h.area) * 3.3 ELSE NULL END), "
                        +
                        "AVG(CASE WHEN h.propertyType = '오피스텔' AND h.dealType = '월세' THEN h.deposit ELSE NULL END), " +
                        "AVG(CASE WHEN h.propertyType = '오피스텔' AND h.dealType = '월세' THEN h.rentfee ELSE NULL END) " +
                        "FROM House h " +
                        "WHERE h.sigungu LIKE %:sigungu% " +
                        "AND (:dong IS NULL OR :dong = '' OR h.emd LIKE %:dong% OR h.sigungu LIKE %:dong%) " +
                        "AND h.contractYm BETWEEN :startMonth AND :endMonth " +
                        "GROUP BY h.contractYm " +
                        "ORDER BY h.contractYm ASC")
        List<Object[]> findComprehensiveMonthlyTrendGraphData(
                        @Param("sigungu") String sigungu,
                        @Param("dong") String dong,
                        @Param("startMonth") String startMonth,
                        @Param("endMonth") String endMonth);

        // [NEW] 매물 단지 목록(Property Directory) 그룹화 페이징 조회
        // MAX(h.houseId)를 통해 가장 최근에 INSERT된(혹은 가장 ID가 큰) 거래를 대표 ID로 추출
        @Query("SELECT MAX(h.houseId), h.name, h.roadname, COUNT(h.houseId), h.propertyType, h.sigungu " +
                        "FROM House h " +
                        "WHERE h.sigungu LIKE CONCAT(:sigungu, '%') " +
                        "AND (:dong IS NULL OR :dong = '' OR h.emd LIKE %:dong% OR h.sigungu LIKE %:dong%) " +
                        "AND (" +
                        "  (:keyword IS NULL OR :keyword = '' OR h.name LIKE %:keyword% OR h.roadname LIKE %:keyword%) " +
                        "  OR (:roadName IS NOT NULL AND :roadName <> '' AND h.roadname LIKE %:roadName%) " +
                        "  OR (:buildNum IS NOT NULL AND :buildNum <> '' AND h.roadname LIKE %:buildNum%)" +
                        ") " +
                        "AND (:propertyType IS NULL OR :propertyType = '' OR h.propertyType = :propertyType) " +
                        "GROUP BY h.sigungu, h.emd, h.name, h.roadname, h.propertyType " +
                        "ORDER BY " +
                        "  CASE " +
                        "    WHEN (:keyword IS NOT NULL AND h.name LIKE %:keyword% AND h.roadname LIKE %:keyword%) THEN 0 " +
                        "    WHEN (:roadName IS NOT NULL AND :roadName <> '' AND h.roadname LIKE %:roadName% AND :buildNum IS NOT NULL AND :buildNum <> '' AND h.roadname LIKE %:buildNum%) THEN 1 " +
                        "    WHEN (:roadName IS NOT NULL AND :roadName <> '' AND h.roadname LIKE %:roadName%) THEN 2 " +
                        "    WHEN (:buildNum IS NOT NULL AND :buildNum <> '' AND h.roadname LIKE %:buildNum%) THEN 3 " +
                        "    ELSE 4 END ASC, " +
                        "  MAX(h.contractYm) DESC, MAX(h.houseId) DESC")
        Page<Object[]> findPropertyDirectory(
                        @Param("sigungu") String sigungu,
                        @Param("dong") String dong,
                        @Param("keyword") String keyword,
                        @Param("roadName") String roadName,
                        @Param("buildNum") String buildNum,
                        @Param("propertyType") String propertyType,
                        Pageable pageable);

        // [STRICT OPTIMIZED] 매물 비교 전용 고속 평균가 조회 (인덱스 강제 활용)
        @Query("SELECT AVG(h.trade) FROM House h " +
                        "WHERE h.sido = :sido " +
                        "AND h.sigungu = :sigungu " +
                        "AND h.emd = :dong " +
                        "AND h.area BETWEEN :minArea AND :maxArea " +
                        "AND (:propertyType IS NULL OR h.propertyType = :propertyType) " +
                        "AND h.dealType = '매매'")
        Double findAverageTradeStrict(@Param("sido") String sido,
                        @Param("sigungu") String sigungu,
                        @Param("dong") String dong,
                        @Param("minArea") BigDecimal minArea,
                        @Param("maxArea") BigDecimal maxArea,
                        @Param("propertyType") String propertyType);

        @Query("SELECT AVG(h.deposit) FROM House h " +
                        "WHERE h.sido = :sido " +
                        "AND h.sigungu = :sigungu " +
                        "AND h.emd = :dong " +
                        "AND h.area BETWEEN :minArea AND :maxArea " +
                        "AND (:propertyType IS NULL OR h.propertyType = :propertyType) " +
                        "AND h.dealType = '전세'")
        Double findAverageDepositStrict(@Param("sido") String sido,
                        @Param("sigungu") String sigungu,
                        @Param("dong") String dong,
                        @Param("minArea") BigDecimal minArea,
                        @Param("maxArea") BigDecimal maxArea,
                        @Param("propertyType") String propertyType);
}
