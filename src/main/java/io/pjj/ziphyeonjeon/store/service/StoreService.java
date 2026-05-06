package io.pjj.ziphyeonjeon.store.service;

import io.pjj.ziphyeonjeon.RiskAnalysis.service.RiskAddressService;
import io.pjj.ziphyeonjeon.global.API.APIStore;
import io.pjj.ziphyeonjeon.store.dto.StoreDto;
import io.pjj.ziphyeonjeon.store.entity.Store;
import io.pjj.ziphyeonjeon.store.repository.StoreRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StoreService {

    private final APIStore apiStore;
    private final StoreRepository storeRepository;
    private final RiskAddressService riskAddressService;

    public StoreService(APIStore apiStore, StoreRepository storeRepository, RiskAddressService riskAddressService) {
        this.apiStore = apiStore;
        this.storeRepository = storeRepository;
        this.riskAddressService = riskAddressService;
    }


    private void saveApiStoresToDb(List<StoreDto> dtoList) {
        for (StoreDto dto : dtoList) {
            boolean isDuplicate = false;

            // 층이 있고 sigungu, emd, jibun이 같으면 중복으로 처리
            if (dto.floor() != null && !dto.floor().isBlank()) {
                isDuplicate = storeRepository.existsBySigunguAndEmdAndJibunAndFloor(
                        dto.sigungu(), dto.emd(), dto.jibun(), dto.floor());
            }

            // 층이 없으면 조건 없이 새로운 데이터로 저장 (isDuplicate = false 유지)
            if (!isDuplicate) {
                Store store = new Store(
                        dto.sggCd(), dto.sigungu(), dto.emd(), dto.type(),
                        dto.jibun(), dto.buildingUse(), dto.dealYear(), dto.dealMonth(),
                        dto.dealDay(), dto.floor(), dto.amount(), dto.area());
                storeRepository.save(store);
            }
        }
    }

    @Transactional
    public List<StoreDto> getStoresBySigungu(String sigungu, String dealYm) {
        boolean isLawdCd = sigungu != null && sigungu.matches("\\d{5}");

        if (dealYm == null || dealYm.isBlank()) {
            // dealYm가 없을 경우 기본적으로 전체를 반환하거나 기본값(202507)을 사용
            List<Store> stores = isLawdCd ? storeRepository.findBySggCd(sigungu)
                    : storeRepository.findBySigungu(sigungu);
            if (stores.isEmpty()) {
                String lawdCd = isLawdCd ? sigungu : riskAddressService.getLawdCdBySigungu(sigungu);
                if (lawdCd != null) {
                    List<StoreDto> apiStores = apiStore.fetchStoreSalesData(lawdCd, "202507");
                    saveApiStoresToDb(apiStores);
                    return apiStores;
                }
            }
            return stores.stream().map(StoreDto::from).collect(Collectors.toList());
        }

        String dealYear = dealYm.substring(0, 4);
        String dealMonth = dealYm.substring(4, 6);
        String dealMonthNoZero = dealMonth.startsWith("0") ? dealMonth.substring(1) : dealMonth;

        List<Store> stores;
        if (isLawdCd) {
            // 입력값이 5자리 숫자(LAWD_CD)인 경우 SGG_CD 로 조회
            stores = storeRepository.findBySggCdAndDealYearAndDealMonth(sigungu, dealYear, dealMonth);
            if (stores.isEmpty() && !dealMonth.equals(dealMonthNoZero)) {
                stores = storeRepository.findBySggCdAndDealYearAndDealMonth(sigungu, dealYear, dealMonthNoZero);
            }
        } else {
            // 입력값이 지역 이름인 경우 SIGUNGU 로 조회
            stores = storeRepository.findBySigunguAndDealYearAndDealMonth(sigungu, dealYear, dealMonth);
            if (stores.isEmpty() && !dealMonth.equals(dealMonthNoZero)) {
                stores = storeRepository.findBySigunguAndDealYearAndDealMonth(sigungu, dealYear, dealMonthNoZero);
            }
        }

        // DB에 데이터가 있으면 DB 목록 반환
        if (!stores.isEmpty()) {
            return stores.stream()
                    .map(StoreDto::from)
                    .collect(Collectors.toList());
        }

        // DB에 데이터가 없으면 국토교통부 API로 요청해서 바로 반환
        String lawdCd = isLawdCd ? sigungu : riskAddressService.getLawdCdBySigungu(sigungu);
        if (lawdCd != null) {
            List<StoreDto> apiStores = apiStore.fetchStoreSalesData(lawdCd, dealYm);
            saveApiStoresToDb(apiStores);
            return apiStores;
        }

        return new java.util.ArrayList<>();
    }

    @Transactional(readOnly = true)
    public StoreDto getStoreById(Long storeId, String sigungu) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new IllegalArgumentException("해당 상가 정보가 없습니다. id=" + storeId));
        return StoreDto.from(store);
    }
}
