package io.pjj.ziphyeonjeon.batch.molit;

import java.util.List;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MolitVillaSaleRawRepository extends JpaRepository<MolitVillaSaleRawEntity, Long> {
        // For P-001 Search
        List<MolitVillaSaleRawEntity> findBySigunguContainingAndContractYm(String sigungu, Integer contractYm);

        // 빌라/오피스텔은 'BEONJI' 컬럼 사용
        List<MolitVillaSaleRawEntity> findBySigunguContainingAndRoadNameContainingOrderByContractYmDescContractDayDesc(
                        String sigungu,
                        String roadName);

        List<MolitVillaSaleRawEntity> findBySigunguContainingAndBeonjiContainingOrderByContractYmDescContractDayDesc(
                        String sigungu, String beonji);

        List<MolitVillaSaleRawEntity> findByBuildingNameContainingAndContractYmGreaterThanEqualOrderByContractYmDescContractDayDesc(
                        String buildingName, Integer startYm);

        @Query("SELECT AVG(m.dealAmountMan) FROM MolitVillaSaleRawEntity m " +
                        "WHERE m.sigungu LIKE %:sigungu% " +
                        "AND (m.beonji LIKE %:dong% OR m.sigungu LIKE %:dong%) " +
                        "AND m.exclArea BETWEEN :minArea AND :maxArea")
        Double findAverageDealAmount(@org.springframework.data.repository.query.Param("sigungu") String sigungu,
                        @org.springframework.data.repository.query.Param("dong") String dong,
                        @org.springframework.data.repository.query.Param("minArea") java.math.BigDecimal minArea,
                        @org.springframework.data.repository.query.Param("maxArea") java.math.BigDecimal maxArea);

        @Query("SELECT m.contractYm, AVG(m.dealAmountMan / m.exclArea) " +
                        "FROM MolitVillaSaleRawEntity m " +
                        "WHERE m.sigungu LIKE %:sigungu% " +
                        "AND (m.beonji LIKE %:dong% OR m.sigungu LIKE %:dong%) " +
                        "GROUP BY m.contractYm " +
                        "ORDER BY m.contractYm ASC")
        List<Object[]> findMonthlyAverageUnitPrice(
                        @org.springframework.data.repository.query.Param("sigungu") String sigungu,
                        @org.springframework.data.repository.query.Param("dong") String dong);
}
