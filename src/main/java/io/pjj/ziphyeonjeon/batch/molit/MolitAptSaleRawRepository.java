package io.pjj.ziphyeonjeon.batch.molit;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MolitAptSaleRawRepository extends JpaRepository<MolitAptSaleRawEntity, Long> {
        // For P-001 Search
        List<MolitAptSaleRawEntity> findBySigunguContainingAndContractYyyymm(String sigungu, String contractYyyymm);

        // 아파트 단지명 검색 (2024년 이후)
        List<MolitAptSaleRawEntity> findByComplexNameContainingAndContractYyyymmGreaterThanEqualOrderByContractYyyymmDescContractDayDesc(
                        String complexName, String startYm);

        // 도로명 검색 (ex: 테헤란로 123)
        List<MolitAptSaleRawEntity> findBySigunguContainingAndRoadNameContainingOrderByContractYyyymmDescContractDayDesc(
                        String sigungu, String roadName);

        // 지번 검색 (ex: 역삼동 123-45) -> 아파트는 JIBUN 컬럼 사용
        List<MolitAptSaleRawEntity> findBySigunguContainingAndJibunContainingOrderByContractYyyymmDescContractDayDesc(
                        String sigungu,
                        String jibun);

        // 보완: 지번 컬럼이 비어있거나 포맷이 다를 경우를 대비해 동+본번 검색 추가
        List<MolitAptSaleRawEntity> findBySigunguContainingAndEupmyeondongContainingAndBonbunContainingOrderByContractYyyymmDescContractDayDesc(
                        String sigungu, String eupmyeondong, String bonbun);

        @Query("SELECT AVG(m.dealAmountMan) FROM MolitAptSaleRawEntity m " +
                        "WHERE m.sigungu LIKE %:sigungu% " +
                        "AND (m.eupmyeondong LIKE %:dong% OR m.sigungu LIKE %:dong%) " +
                        "AND m.exclusiveAreaM2 BETWEEN :minArea AND :maxArea")
        Double findAverageDealAmount(@Param("sigungu") String sigungu,
                        @Param("dong") String dong,
                        @Param("minArea") BigDecimal minArea,
                        @Param("maxArea") BigDecimal maxArea);

        @Query("SELECT m.contractYyyymm, AVG(m.dealAmountMan / m.exclusiveAreaM2) " +
                        "FROM MolitAptSaleRawEntity m " +
                        "WHERE m.sigungu LIKE %:sigungu% " +
                        "AND (m.eupmyeondong LIKE %:dong% OR m.sigungu LIKE %:dong%) " +
                        "GROUP BY m.contractYyyymm " +
                        "ORDER BY m.contractYyyymm ASC")
        List<Object[]> findMonthlyAverageUnitPrice(@Param("sigungu") String sigungu, @Param("dong") String dong);
}
