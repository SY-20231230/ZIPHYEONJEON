package io.pjj.ziphyeonjeon.RiskAnalysis.controller;

import io.pjj.ziphyeonjeon.RiskAnalysis.dto.BuildingDTO;
import io.pjj.ziphyeonjeon.RiskAnalysis.dto.DisasterDTO;
import io.pjj.ziphyeonjeon.RiskAnalysis.dto.OcrDTO;
import io.pjj.ziphyeonjeon.RiskAnalysis.entity.RiskAnalysisResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import io.pjj.ziphyeonjeon.RiskAnalysis.dto.RiskDTO;
import io.pjj.ziphyeonjeon.RiskAnalysis.service.RiskAnalysisService;
import io.pjj.ziphyeonjeon.RiskAnalysis.service.RiskOcrService;

import java.io.IOException;

@RestController
@RequestMapping("/api/risk")
@RequiredArgsConstructor
public class RiskController {

    private final RiskAnalysisService riskAnalysisService;
    private final RiskOcrService riskOcrService;

    // 재해 위험 정보 조회
    @GetMapping("/disaster/{address}")
    public ResponseEntity<RiskDTO<DisasterDTO.DisasterResponse>> searchDisaster(@PathVariable String address) {
        System.out.println("/api/risk/disaster/{address}: " + address);

        RiskDTO<DisasterDTO.DisasterResponse> response = riskAnalysisService.analyzeDisasterRisk(address);
        return ResponseEntity.ok(response);
    }

    // 건축물대장 정보 조회
    @GetMapping("/building/{address}")
    public ResponseEntity<RiskDTO<BuildingDTO.BuildingResponse>> analyzeBuilding(@PathVariable String address) {
        System.out.println("/api/risk/building/{address}: " + address);
        RiskDTO<BuildingDTO.BuildingResponse> response = riskAnalysisService.analyzeBuildingRisk(address);

        return ResponseEntity.ok(response);
    }

    // 등기부등본 업로드
    @PostMapping("/upload")
    public ResponseEntity<?> uploadRegistry(
            @RequestParam("address") String address,
            @RequestParam("requestId") String requestId,
            @RequestParam("file") MultipartFile file) {

        try {
            String savedFileName = riskOcrService.saveFile(address, requestId, file);

            return ResponseEntity.ok("/api/risk/upload/: " + savedFileName);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("/upload 컨트롤러 오류: " + e.getMessage());
        }
    }

    // OCR 전송
    @PostMapping("/ocr")
    public ResponseEntity<?> requestOcr(@RequestParam String message,
                                        @RequestParam MultipartFile file) {
        try {
            RiskDTO<OcrDTO.RecordOfTitleResponse> result = riskAnalysisService.analyzeRecordOfTitleRisk(message, file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("/ocr 컨트롤러 오류: " + e.getMessage());
        }
    }

    @PostMapping("/analysis/save")
    public ResponseEntity<?> analyzeAndSave(@RequestParam String address,
                                            @RequestParam String message,
                                            @RequestParam MultipartFile file) {
        try {
            RiskAnalysisResult savedResult = riskAnalysisService.saveTotalRiskAnalysis(address, message, file);

            return ResponseEntity.ok(savedResult);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("통합 분석 및 저장 중 오류 발생: " + e.getMessage());
        }
    }


}