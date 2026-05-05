package io.pjj.ziphyeonjeon.industry.repository;

import io.pjj.ziphyeonjeon.industry.entity.Industry;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class IndustryRepositoryImpl implements IndustryRepositoryCustom {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void batchInsert(List<Industry> industries) {
        String sql = "INSERT INTO INDUSTRY (REFERENCE_DATE, SGG_CD, ADSTRD_CD, ADSTRD_NM, SVC_INDUTY_CD, " +
                "SVC_INDUTY_NM, SHOP_COUNT, SIMILR_INDUTY_SHOP_COUNT, OPBIZ_RT, OPBIZ_SHOP_COUNT, " +
                "CLSBIZ_RT, CLSBIZ_SHOP_COUNT, FRC_SHOP_COUNT) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        jdbcTemplate.batchUpdate(sql, industries, 1000, (PreparedStatement ps, Industry industry) -> {
            ps.setTimestamp(1, industry.getReferenceDate());
            ps.setString(2, industry.getSggCd());
            ps.setString(3, industry.getAdstrdCd());
            ps.setString(4, industry.getAdstrdNm());
            ps.setString(5, industry.getSvcIndutyCd());
            ps.setString(6, industry.getSvcIndutyNm());

            if (industry.getShopCount() != null) ps.setInt(7, industry.getShopCount());
            else ps.setNull(7, java.sql.Types.INTEGER);

            if (industry.getSimilarIndutyShopCount() != null) ps.setInt(8, industry.getSimilarIndutyShopCount());
            else ps.setNull(8, java.sql.Types.INTEGER);

            if (industry.getOpbizRt() != null) ps.setDouble(9, industry.getOpbizRt());
            else ps.setNull(9, java.sql.Types.DOUBLE);

            if (industry.getOpbizShopCount() != null) ps.setInt(10, industry.getOpbizShopCount());
            else ps.setNull(10, java.sql.Types.INTEGER);

            if (industry.getClsbizRt() != null) ps.setDouble(11, industry.getClsbizRt());
            else ps.setNull(11, java.sql.Types.DOUBLE);

            if (industry.getClsbizShopCount() != null) ps.setInt(12, industry.getClsbizShopCount());
            else ps.setNull(12, java.sql.Types.INTEGER);

            if (industry.getFrcShopCount() != null) ps.setInt(13, industry.getFrcShopCount());
            else ps.setNull(13, java.sql.Types.INTEGER);
        });
    }
}
