package io.pjj.ziphyeonjeon.store.controller;

import io.pjj.ziphyeonjeon.store.dto.StoreDto;
import io.pjj.ziphyeonjeon.store.service.StoreService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stores")
public class StoreController {

    private final StoreService storeService;

    public StoreController(StoreService storeService) {
        this.storeService = storeService;
    }


    // GET /api/stores?sigungu=11110&dealYm=202507
    @Operation(summary = "상가 조회", description = "해당 시군구의 상가 실거래가를 조회합니다.")
    @GetMapping
    public ResponseEntity<List<StoreDto>> getStoresBySigungu(@Parameter(description = "법정동코드 또는 시군구를 포함한 주소를 사용합니다. 11110 또는 서초구", schema = @Schema(example = "11110"))
                                                             @RequestParam String sigungu,
                                                             @Parameter(description = "거래연월을 지정합니다.", schema = @Schema(example = "202507"))
                                                             @RequestParam(required = false) String dealYm) {
        List<StoreDto> stores = storeService.getStoresBySigungu(sigungu, dealYm);
        return ResponseEntity.ok(stores);
    }

    // GET /api/stores/1
    @Operation(summary = "상가 단건 상세 조회", description = "상가 ID를 통해 특정 상가의 상세 정보를 조회합니다.")
    @GetMapping("/{storeId}")
    public ResponseEntity<StoreDto> getStoreById(@Parameter(description = "상가 ID", schema = @Schema(example = "1"))
                                                 @PathVariable Long storeId,
                                                 @Parameter(description = "법정동코드 또는 시군구를 포함한 주소", schema = @Schema(example = "11110"))
                                                 @RequestParam String sigungu) {
        StoreDto store = storeService.getStoreById(storeId, sigungu);
        return ResponseEntity.ok(store);
    }
}
