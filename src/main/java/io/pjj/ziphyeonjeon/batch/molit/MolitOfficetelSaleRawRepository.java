package io.pjj.ziphyeonjeon.batch.molit;

import java.util.List;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MolitOfficetelSaleRawRepository extends JpaRepository<MolitOfficetelSaleRawEntity, Long> {
        List<MolitOfficetelSaleRawEntity> findBySigunguContainingAndContractYm(String sigungu, Integer contractYm);

        List<MolitOfficetelSaleRawEntity> findBySigunguContainingAndRoadNameContainingOrderByContractYmDescContractDayDesc(
                        String sigungu, String roadName);

        List<MolitOfficetelSaleRawEntity> findBySigunguContainingAndBeonjiContainingOrderByContractYmDescContractDayDesc(
                        String sigungu, String beonji);

        List<MolitOfficetelSaleRawEntity> findByComplexNameContainingAndContractYmGreaterThanEqualOrderByContractYmDescContractDayDesc(
                        String complexName, Integer startYm);

        @Query("SELECT AVG(m.dealAmountMan) FROM MolitOfficetelSaleRawEntity m " +
                        "WHERE m.sigungu LIKE %:sigungu% " +
                        "AND (m.beonji LIKE %:dong% OR m.sigungu LIKE %:dong%) " +
                        "AND m.exclArea BETWEEN :minArea AND :maxArea")
        Double findAverageDealAmount(@org.springframework.data.repository.query.Param("sigungu") String sigungu,
                        @org.springframework.data.repository.query.Param("dong") String dong,
                        @org.springframework.data.repository.query.Param("minArea") java.math.BigDecimal minArea,
                        @org.springframework.data.repository.query.Param("maxArea") java.math.BigDecimal maxArea);

        @Query("SELECT m.contractYm, AVG(m.dealAmountMan / m.exclArea) " +
                        "FROM MolitOfficetelSaleRawEntity m " +
                        "WHERE m.sigungu LIKE %:sigungu% " +
                        "AND (m.beonji LIKE %:dong% OR m.sigungu LIKE %:dong%) " +
                        "GROUP BY m.contractYm " +
                        "ORDER BY m.contractYm ASC")
        List<Object[]> findMonthlyAverageUnitPrice(
                        @org.springframework.data.repository.query.Param("sigungu") String sigungu,
                        @org.springframework.data.repository.query.Param("dong") String dong);
}
