package io.pjj.ziphyeonjeon.population.repository;

import io.pjj.ziphyeonjeon.population.entity.Population;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class PopulationRepositoryImpl implements PopulationRepositoryCustom {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void batchInsert(List<Population> populations) {
        String sql = "INSERT INTO POPULATIONS (REFERENCE_DATE, HOURS, POPULATION_COUNT, SIDO, SIGUNGU, ADSTRD_CD) " +
                "VALUES (?, ?, ?, ?, ?, ?)";

        jdbcTemplate.batchUpdate(sql, populations, 5000, (PreparedStatement ps, Population population) -> {
            ps.setTimestamp(1, population.getReferenceDate());
            if (population.getHours() != null) ps.setInt(2, population.getHours());
            else ps.setNull(2, java.sql.Types.INTEGER);
            
            if (population.getPopulationCount() != null) ps.setDouble(3, population.getPopulationCount());
            else ps.setNull(3, java.sql.Types.DOUBLE);
            
            ps.setString(4, population.getSido());
            ps.setString(5, population.getSigungu());
            ps.setString(6, population.getAdstrdCd());
        });
    }
}
