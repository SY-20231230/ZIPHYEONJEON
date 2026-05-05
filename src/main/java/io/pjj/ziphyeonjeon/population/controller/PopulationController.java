package io.pjj.ziphyeonjeon.population.controller;

import io.pjj.ziphyeonjeon.population.service.PopulationService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/populations")
@RequiredArgsConstructor
public class PopulationController {

    private final PopulationService populationService;

    @Operation(summary = "유동인구 데이터 일괄 동기화 (로컬 CSV)", description = "로컬에 위치한 유동인구 CSV 파일들을 스캔하여 백그라운드에서 유동인구 데이터를 DB에 일괄 저장 및 동기화합니다.")
    @PostMapping("/sync-local")
    public ResponseEntity<String> syncLocalCsvFiles() {
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                populationService.syncLocalCsvFiles();
            } catch (Exception e) {
            }
        });
        return ResponseEntity.ok("백그라운드에서 동기화 작업이 시작되었습니다. 서버 로그를 확인해주세요.");
    }
}
