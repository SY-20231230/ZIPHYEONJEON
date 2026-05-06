package io.pjj.ziphyeonjeon.industry.repository;

import io.pjj.ziphyeonjeon.industry.entity.Industry;
import java.util.List;

public interface IndustryRepositoryCustom {
    void batchInsert(List<Industry> industries);
}
