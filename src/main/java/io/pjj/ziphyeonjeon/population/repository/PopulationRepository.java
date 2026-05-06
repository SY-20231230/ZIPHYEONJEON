package io.pjj.ziphyeonjeon.population.repository;

import io.pjj.ziphyeonjeon.population.entity.Population;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PopulationRepository extends JpaRepository<Population, Long>, PopulationRepositoryCustom {
}
