package io.pjj.ziphyeonjeon.PriceSearch.controller;

import io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse;
import io.pjj.ziphyeonjeon.PriceSearch.service.PriceSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/price")
@RequiredArgsConstructor
public class PriceSearchController {

    private final PriceSearchService priceSearchService;

    @GetMapping("/search")
    public List<PriceSearchResultResponse> searchByAddress(
            @RequestParam String address,
            @RequestParam(required = false) String dealType) {
        return priceSearchService.searchByAddress(address, dealType);
    }

    @GetMapping("/search/complex")
    public List<PriceSearchResultResponse> searchByComplexName(
            @RequestParam String complexName,
            @RequestParam(required = false) String dealType) {
        return priceSearchService.searchByComplexName(complexName, dealType);
    }

    // P-001
    @GetMapping("/molit")
    public List<io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse> searchMolit(
            @org.springframework.web.bind.annotation.ModelAttribute io.pjj.ziphyeonjeon.PriceSearch.dto.request.MolitTradeSearchRequest request) {
        return priceSearchService.searchMolit(request);
    }

    // P-002
    @GetMapping("/seoul")
    public List<io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse> searchSeoul(
            @org.springframework.web.bind.annotation.ModelAttribute io.pjj.ziphyeonjeon.PriceSearch.dto.request.SeoulTradeSearchRequest request) {
        return priceSearchService.searchSeoul(request);
    }

    // P-003
    @GetMapping("/land")
    public String searchLandPrice(
            @org.springframework.web.bind.annotation.ModelAttribute io.pjj.ziphyeonjeon.PriceSearch.dto.request.OfficialLandPriceRequest request) {
        return priceSearchService.searchLandPrice(request);
    }

    @org.springframework.web.bind.annotation.PostMapping("/compare")
    public List<io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceCompareResponse> comparePrices(
            @org.springframework.web.bind.annotation.RequestBody io.pjj.ziphyeonjeon.PriceSearch.dto.request.PriceCompareRequest request) {
        return priceSearchService.comparePrices(request);
    }

    @org.springframework.web.bind.annotation.PostMapping("/risk-check")
    public io.pjj.ziphyeonjeon.PriceSearch.dto.response.JeonseRatioResponse checkJeonseRisk(
            @org.springframework.web.bind.annotation.RequestBody io.pjj.ziphyeonjeon.PriceSearch.dto.request.JeonseRatioRequest request) {
        return priceSearchService.calculateJeonseRatio(request);
    }

    @org.springframework.web.bind.annotation.GetMapping("/trend")
    public io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceTrendResponse getRegionalTrend(
            @RequestParam("address_code") String addressCode,
            @RequestParam(value = "time_unit", defaultValue = "월") String timeUnit) {
        return priceSearchService.getRegionalTrend(addressCode, timeUnit);
    }

    // P-007
    @GetMapping("/download")
    public org.springframework.http.ResponseEntity<org.springframework.core.io.Resource> downloadTradeData(
            @RequestParam("sido_code") String sidoCode,
            @RequestParam("sigungu_code") String sigunguCode,
            @RequestParam(value = "format", defaultValue = "csv") String format) {

        org.springframework.core.io.Resource resource = priceSearchService.downloadTradeData(sidoCode, sigunguCode,
                format);

        String filename = "trade_data_" + sigunguCode + "." + format;
        return org.springframework.http.ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
                .body(resource);
    }

    // P-008
    @org.springframework.web.bind.annotation.PostMapping("/suggest")
    public io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSuggestionResponse suggestPrice(
            @org.springframework.web.bind.annotation.RequestBody io.pjj.ziphyeonjeon.PriceSearch.dto.request.PriceSuggestionRequest request) {
        return priceSearchService.suggestPrice(request);
    }
}
