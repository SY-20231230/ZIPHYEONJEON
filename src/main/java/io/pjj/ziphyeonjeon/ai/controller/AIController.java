package io.pjj.ziphyeonjeon.ai.controller;

import io.pjj.ziphyeonjeon.ai.entity.Analysis;
import io.pjj.ziphyeonjeon.ai.repository.AnalysisRepository;
import io.pjj.ziphyeonjeon.ai.service.MolitAIPredictService;
import io.pjj.ziphyeonjeon.auth.entity.User;
import io.pjj.ziphyeonjeon.auth.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AIController {

    private final MolitAIPredictService aiPredictService;
    private final AnalysisRepository analysisRepository;
    private final UserRepository userRepository;

    @Data
    public static class PredictionRequestPayload {
        private String propertyType; // 아파트, 빌라, 오피스텔 등
        private String dealType; // 매매, 전세, 월세
        private String sigungu; // 시군구 명
        private String targetMonth; // h1m, h3m, h6m 등
        private Long houseId; // [NEW] 특정 매물 식별자
        private List<Map<String, Object>> features; // AI 전처리용 입력 데이터 세트
    }

    private Long getUserId(UserDetails userDetails) {
        if (userDetails == null) return null;
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getUserId();
    }

    /**
     * 프론트엔드에서 집값 예측 요청 
     * 파이썬 AI 모델 경유 후 결과 DB 저장 및 반환
     */
    @PostMapping("/predict")
    public ResponseEntity<Analysis> predictPrice(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PredictionRequestPayload payload) {
        
        // JWT 검증 후 userId 추출 (프론트 에러 해결의 핵심)
        Long userId = getUserId(userDetails);
        if (userId == null) return ResponseEntity.status(401).build();

        Analysis result = aiPredictService.predictAndSave(
                userId,
                payload.getHouseId(),
                payload.getPropertyType(),
                payload.getDealType(),
                payload.getSigungu(),
                payload.getTargetMonth(),
                payload.getFeatures()
        );
        return ResponseEntity.ok(result);
    }

    /**
     * 프론트엔드에서 특정 지역/유형의 기존 예측 결과 조회
     */
    @GetMapping("/analysis")
    public ResponseEntity<List<Analysis>> getAnalysisList(
            @RequestParam String sigungu,
            @RequestParam String propertyType,
            @RequestParam String dealType) {
        List<Analysis> results = analysisRepository.findBySigunguAndPropertyTypeAndDealTypeOrderByCreatedAtDesc(
                sigungu, propertyType, dealType);
        return ResponseEntity.ok(results);
    }

    /**
     * [NEW] 마이페이지: 내 AI 분석 기록 조회
     */
    @GetMapping("/predict/me")
    public ResponseEntity<List<Analysis>> getMyPredictions(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = getUserId(userDetails);
        if (userId == null) return ResponseEntity.status(401).build();
        
        List<Analysis> myPredictions = aiPredictService.getMyPredictions(userId);
        return ResponseEntity.ok(myPredictions);
    }
}
