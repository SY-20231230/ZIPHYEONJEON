package io.pjj.ziphyeonjeon.batch.molit;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MolitVillaRentRawRepository extends JpaRepository<MolitVillaRentRawEntity, Long> {
        // For P-001 Regional Search
        List<MolitVillaRentRawEntity> findBySigunguContainingAndContractYm(String sigungu, Integer contractYm);

        List<MolitVillaRentRawEntity> findBySigunguContainingAndRoadNameContainingOrderByContractYmDescContractDayDesc(
                        String sigungu,
                        String roadName);

        List<MolitVillaRentRawEntity> findBySigunguContainingAndBeonjiContainingOrderByContractYmDescContractDayDesc(
                        String sigungu,
                        String beonji);

        List<MolitVillaRentRawEntity> findByBuildingNameContainingAndContractYmGreaterThanEqualOrderByContractYmDescContractDayDesc(
                        String buildingName, Integer startYm);

        @Query("SELECT AVG(m.depositMan) FROM MolitVillaRentRawEntity m " +
                        "WHERE m.sigungu LIKE %:sigungu% " +
                        "AND (m.beonji LIKE %:dong% OR m.sigungu LIKE %:dong%) " +
                        "AND m.exclArea BETWEEN :minArea AND :maxArea")
        Double findAverageDeposit(@Param("sigungu") String sigungu,
                        @Param("dong") String dong,
                        @Param("minArea") BigDecimal minArea,
                        @Param("maxArea") BigDecimal maxArea);

        @Query("SELECT m.contractYm, AVG(m.depositMan / m.exclArea) " +
                        "FROM MolitVillaRentRawEntity m " +
                        "WHERE m.sigungu LIKE %:sigungu% " +
                        "AND (m.beonji LIKE %:dong% OR m.sigungu LIKE %:dong%) " +
                        "AND (m.rentType = 'JEONSE' OR m.rentType = '전세') " +
                        "GROUP BY m.contractYm " +
                        "ORDER BY m.contractYm ASC")
        List<Object[]> findMonthlyAverageJeonseUnitPrice(@Param("sigungu") String sigungu, @Param("dong") String dong);

        @Query("SELECT m.contractYm, AVG(m.monthlyRentMan) " +
                        "FROM MolitVillaRentRawEntity m " +
                        "WHERE m.sigungu LIKE %:sigungu% " +
                        "AND (m.beonji LIKE %:dong% OR m.sigungu LIKE %:dong%) " +
                        "AND (m.rentType = 'WOLSE' OR m.rentType = '월세') " +
                        "GROUP BY m.contractYm " +
                        "ORDER BY m.contractYm ASC")
        List<Object[]> findMonthlyAverageWolseAmount(@Param("sigungu") String sigungu, @Param("dong") String dong);

        @Deprecated
        @Query("SELECT m.contractYm, AVG(m.depositMan / m.exclArea) " +
                        "FROM MolitVillaRentRawEntity m " +
                        "WHERE m.sigungu LIKE %:sigungu% " +
                        "AND (m.beonji LIKE %:dong% OR m.sigungu LIKE %:dong%) " +
                        "GROUP BY m.contractYm " +
                        "ORDER BY m.contractYm ASC")
        List<Object[]> findMonthlyAverageUnitPrice(@Param("sigungu") String sigungu, @Param("dong") String dong);
}
