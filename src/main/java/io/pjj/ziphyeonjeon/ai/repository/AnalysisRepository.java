package io.pjj.ziphyeonjeon.ai.repository;

import io.pjj.ziphyeonjeon.ai.entity.Analysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnalysisRepository extends JpaRepository<Analysis, Long> {
    
    // 지역과 주택/거래 유형에 따른 분석 결과 전체 조회
    List<Analysis> findBySigunguAndPropertyTypeAndDealTypeOrderByCreatedAtDesc(String sigungu, String propertyType, String dealType);

    // [NEW] 하이브리드 캐싱용: 1개월 이내의 최신 결과 1건만 스캔 (타겟 개월수 일치 항목)
    java.util.Optional<Analysis> findFirstBySigunguAndPropertyTypeAndDealTypeAndPredictTargetMonthAndCreatedAtAfterOrderByCreatedAtDesc(
            String sigungu, String propertyType, String dealType, Integer predictTargetMonth, java.time.LocalDateTime createdAt);

    // [NEW] 마이페이지용: 특정 유저의 분석 기록을 최신순으로 조회
    List<Analysis> findByUserIdOrderByCreatedAtDesc(Long userId);

}
