package io.pjj.ziphyeonjeon.ai.service;

import io.pjj.ziphyeonjeon.ai.dto.PredictRequestDto;
import io.pjj.ziphyeonjeon.ai.dto.PredictResponseDto;
import io.pjj.ziphyeonjeon.ai.entity.Analysis;
import io.pjj.ziphyeonjeon.ai.repository.AnalysisRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MolitAIPredictService {

    private final AnalysisRepository analysisRepository;
    private final io.pjj.ziphyeonjeon.PriceSearch.repository.HouseRepository houseRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.python.api.url:http://localhost:8000}")
    private String pythonApiUrl;

    /**
     * [하이브리드 캐싱 적용] Python AI 모델에 예측을 요청하고 결과를 DB에 저장합니다.
     */
    @Transactional
    public Analysis predictAndSave(Long userId, Long houseId, String propertyType, String dealType, String sigungu, String targetMonth, List<Map<String, Object>> features) {
        
        // 1. 하이브리드 캐싱: 최근 1개월 이내 동일 지역/유형 분석 결과가 있는지 스캔
        int month = Integer.parseInt(targetMonth.replace("h", "").replace("m", ""));
        
        // [Cache Removed] 모든 요청은 실시간으로 AI 서버를 호출하도록 변경합니다.


        // [Cache Miss] 최근 1개월 내 기록이 없으므로 파이썬 서버 실제 호출
        log.info("[Hybrid Cache Miss] Requesting fresh AI Prediction from Python API for sigungu: {}", sigungu);
        
        PredictRequestDto requestDto = new PredictRequestDto(targetMonth, features);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<PredictRequestDto> entity = new HttpEntity<>(requestDto, headers);

        String apiDealType = dealType.contains("매매") ? "sale" : "rent";
        String url = pythonApiUrl + "/predict/" + apiDealType;
        
        try {
            ResponseEntity<PredictResponseDto> response = restTemplate.postForEntity(url, entity, PredictResponseDto.class);
            PredictResponseDto responseDto = response.getBody();
            
            if (responseDto != null && responseDto.getPredictions() != null && !responseDto.getPredictions().isEmpty()) {
                Double predictedVal = responseDto.getPredictions().get(0);
                
                // [AI 단위 보정] AI는 평당 가격(3.3m2당)을 반환하므로, 면적을 3.3으로 나눈 '평수'를 곱하여 총액을 산출합니다.
                Double area = 84.0; 
                try {
                    if (features != null && !features.isEmpty()) {
                        Object areaVal = features.get(0).get("mean_area");
                        if (areaVal instanceof Number) area = ((Number) areaVal).doubleValue();
                    }
                } catch (Exception ignored) {}

                // 예측 총액 = 평당 가격 * (전체 면적 / 3.3)
                Double predictedTotalVal = predictedVal * (area / 3.3);
                
                log.info("[AI Debug] AI 반환값(평당가): {}, 입력면적: {}, 계산된 총액: {}", predictedVal, area, predictedTotalVal);
                
                // [NEW] 추세율(Trend Percentage) 계산을 위해 현재 시군구 평균가 조회
                Double currentAvgPrice = houseRepository.findAveragePriceBySigunguAndPropertyType(sigungu, propertyType, dealType);
                BigDecimal trendPercentage = BigDecimal.ZERO;
                if (currentAvgPrice != null && currentAvgPrice > 0) {
                    // ((예측가 - 현재가) / 현재가) * 100
                    double trend = ((predictedTotalVal - currentAvgPrice) / currentAvgPrice) * 100.0;
                    trendPercentage = BigDecimal.valueOf(trend).setScale(2, java.math.RoundingMode.HALF_UP);
                }
                
                Analysis analysis = new Analysis();
                analysis.setUserId(userId);
                analysis.setHouseId(houseId);
                analysis.setPropertyType(propertyType);
                analysis.setDealType(dealType);
                analysis.setSigungu(sigungu);
                analysis.setPredictTargetMonth(month);
                analysis.setPredictedPrice(BigDecimal.valueOf(predictedTotalVal));
                analysis.setTrendPercentage(trendPercentage);
                
                return analysisRepository.save(analysis);
            } else {
                log.error("AI Prediction returned empty result.");
                throw new RuntimeException("AI API 응답이 비어있습니다.");
            }
            
        } catch (Exception e) {
            log.error("Failed to fetch prediction from Python API", e);
            throw new RuntimeException("AI 예측 서버 통신 실패", e);
        }
    }

    /**
     * [마이페이지 용] 특정 유저의 분석 내역을 최신순으로 조회합니다.
     */
    @Transactional(readOnly = true)
    public List<Analysis> getMyPredictions(Long userId) {
        return analysisRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}
