package io.pjj.ziphyeonjeon.industry.controller;

import io.pjj.ziphyeonjeon.industry.service.IndustryService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/industry")
@RequiredArgsConstructor
public class IndustryController {

    private final IndustryService industryService;

    @Operation(summary = "상권 점포 데이터 일괄 동기화 (로컬 CSV)", description = "로컬에 저장된 '서울시 상권분석서비스(점포-행정동).csv' 파일을 읽어들여 상권 점포 데이터를 DB에 일괄 저장 및 동기화합니다.")
    @PostMapping("/sync-local")
    public ResponseEntity<String> syncLocalCsv() {
        industryService.syncLocalCsv();
        return ResponseEntity.ok("CSV sync completed successfully.");
    }
}
