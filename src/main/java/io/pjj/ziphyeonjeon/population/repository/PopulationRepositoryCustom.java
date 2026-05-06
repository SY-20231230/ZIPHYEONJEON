package io.pjj.ziphyeonjeon.population.repository;

import io.pjj.ziphyeonjeon.population.entity.Population;
import java.util.List;

public interface PopulationRepositoryCustom {
    void batchInsert(List<Population> populations);
}
