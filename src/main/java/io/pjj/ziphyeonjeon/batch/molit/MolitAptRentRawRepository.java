package io.pjj.ziphyeonjeon.batch.molit;

import java.util.List;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MolitAptRentRawRepository extends JpaRepository<MolitAptRentRawEntity, Long> {
        // For P-001 Regional Search
        List<MolitAptRentRawEntity> findBySigunguContainingAndContractYyyymm(String sigungu, String contractYyyymm);

        List<MolitAptRentRawEntity> findBySigunguContainingAndRoadNameContainingOrderByContractYyyymmDescContractDayDesc(
                        String sigungu, String roadName);

        List<MolitAptRentRawEntity> findBySigunguContainingAndJibunContainingOrderByContractYyyymmDescContractDayDesc(
                        String sigungu,
                        String jibun);

        List<MolitAptRentRawEntity> findByComplexNameContainingAndContractYyyymmGreaterThanEqualOrderByContractYyyymmDescContractDayDesc(
                        String complexName, String startYm);

        @Query("SELECT AVG(m.depositMan) FROM MolitAptRentRawEntity m " +
                        "WHERE m.sigungu LIKE %:sigungu% " +
                        "AND (m.eupmyeondong LIKE %:dong% OR m.sigungu LIKE %:dong%) " +
                        "AND m.exclusiveAreaM2 BETWEEN :minArea AND :maxArea")
        Double findAverageDeposit(@Param("sigungu") String sigungu,
                        @Param("dong") String dong,
                        @Param("minArea") BigDecimal minArea,
                        @Param("maxArea") BigDecimal maxArea);

        @Query("SELECT m.contractYyyymm, AVG(m.depositMan / m.exclusiveAreaM2) " +
                        "FROM MolitAptRentRawEntity m " +
                        "WHERE m.sigungu LIKE %:sigungu% " +
                        "AND (m.eupmyeondong LIKE %:dong% OR m.sigungu LIKE %:dong%) " +
                        "AND (m.rentType = 'JEONSE' OR m.rentType = '전세') " +
                        "GROUP BY m.contractYyyymm " +
                        "ORDER BY m.contractYyyymm ASC")
        List<Object[]> findMonthlyAverageJeonseUnitPrice(@Param("sigungu") String sigungu, @Param("dong") String dong);

        @Query("SELECT m.contractYyyymm, AVG(m.monthlyRentMan) " +
                        "FROM MolitAptRentRawEntity m " +
                        "WHERE m.sigungu LIKE %:sigungu% " +
                        "AND (m.eupmyeondong LIKE %:dong% OR m.sigungu LIKE %:dong%) " +
                        "AND (m.rentType = 'WOLSE' OR m.rentType = '월세') " +
                        "GROUP BY m.contractYyyymm " +
                        "ORDER BY m.contractYyyymm ASC")
        List<Object[]> findMonthlyAverageWolseAmount(@Param("sigungu") String sigungu, @Param("dong") String dong);

        @Deprecated
        @Query("SELECT m.contractYyyymm, AVG(m.depositMan / m.exclusiveAreaM2) " +
                        "FROM MolitAptRentRawEntity m " +
                        "WHERE m.sigungu LIKE %:sigungu% " +
                        "AND (m.eupmyeondong LIKE %:dong% OR m.sigungu LIKE %:dong%) " +
                        "GROUP BY m.contractYyyymm " +
                        "ORDER BY m.contractYyyymm ASC")
        List<Object[]> findMonthlyAverageUnitPrice(@Param("sigungu") String sigungu, @Param("dong") String dong);
}
