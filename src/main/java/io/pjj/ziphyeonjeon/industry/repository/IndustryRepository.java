package io.pjj.ziphyeonjeon.industry.repository;

import io.pjj.ziphyeonjeon.industry.entity.Industry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IndustryRepository extends JpaRepository<Industry, Long>, IndustryRepositoryCustom {
}
