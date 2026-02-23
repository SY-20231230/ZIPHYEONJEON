package io.pjj.ziphyeonjeon.PriceSearch.service;

import io.pjj.ziphyeonjeon.global.API.seoul.SeoulOpenApiClient;
import io.pjj.ziphyeonjeon.global.API.vworld.VworldGeocodeClient;
import io.pjj.ziphyeonjeon.global.API.vworld.VworldSearchClient;
import io.pjj.ziphyeonjeon.global.API.vworld.dto.geocode.VworldGeocodeResponse;
import io.pjj.ziphyeonjeon.global.API.vworld.dto.search.VworldSearchResponse;
import io.pjj.ziphyeonjeon.global.API.vworld.landprice.VworldOfficialLandPriceClient;
import io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class PriceSearchService {

    private final VworldGeocodeClient vworldGeocodeClient;
    private final VworldSearchClient vworldSearchClient;
    private final VworldOfficialLandPriceClient vworldOfficialLandPriceClient;
    private final SeoulOpenApiClient seoulOpenApiClient;

    private final io.pjj.ziphyeonjeon.batch.molit.MolitAptSaleRawRepository aptSaleRepo;
    private final io.pjj.ziphyeonjeon.batch.molit.MolitAptRentRawRepository aptRentRepo;
    private final io.pjj.ziphyeonjeon.batch.molit.MolitVillaSaleRawRepository villaSaleRepo;
    private final io.pjj.ziphyeonjeon.batch.molit.MolitVillaRentRawRepository villaRentRepo;
    private final io.pjj.ziphyeonjeon.batch.molit.MolitOfficetelSaleRawRepository officetelSaleRepo;
    private final io.pjj.ziphyeonjeon.batch.molit.MolitOfficetelRentRawRepository officetelRentRepo;

    public PriceSearchService(
            VworldGeocodeClient vworldGeocodeClient,
            VworldSearchClient vworldSearchClient,
            VworldOfficialLandPriceClient vworldOfficialLandPriceClient,
            SeoulOpenApiClient seoulOpenApiClient,
            io.pjj.ziphyeonjeon.batch.molit.MolitAptSaleRawRepository aptSaleRepo,
            io.pjj.ziphyeonjeon.batch.molit.MolitAptRentRawRepository aptRentRepo,
            io.pjj.ziphyeonjeon.batch.molit.MolitVillaSaleRawRepository villaSaleRepo,
            io.pjj.ziphyeonjeon.batch.molit.MolitVillaRentRawRepository villaRentRepo,
            io.pjj.ziphyeonjeon.batch.molit.MolitOfficetelSaleRawRepository officetelSaleRepo,
            io.pjj.ziphyeonjeon.batch.molit.MolitOfficetelRentRawRepository officetelRentRepo) {
        this.vworldGeocodeClient = vworldGeocodeClient;
        this.vworldSearchClient = vworldSearchClient;
        this.vworldOfficialLandPriceClient = vworldOfficialLandPriceClient;
        this.seoulOpenApiClient = seoulOpenApiClient;
        this.aptSaleRepo = aptSaleRepo;
        this.aptRentRepo = aptRentRepo;
        this.villaSaleRepo = villaSaleRepo;
        this.villaRentRepo = villaRentRepo;
        this.officetelSaleRepo = officetelSaleRepo;
        this.officetelRentRepo = officetelRentRepo;
    }

    public String getOfficialLandPriceByAddress(String address) {
        // 1) 좌표
        VworldGeocodeResponse geo = vworldGeocodeClient.getCoord(address, "ROAD");
        System.out.println("Geocoding Result: " + geo);

        // 2) PNU (도로명으로 안 나오면 Jibun으로 fallback)
        VworldSearchResponse search = vworldSearchClient.searchJuso(address);
        String pnu = null;

        if (search != null && search.response != null && search.response.result != null
                && search.response.result.items != null && !search.response.result.items.isEmpty()) {
            pnu = search.response.result.items.get(0).id;
        }
        if (pnu == null) {
            VworldSearchResponse search2 = vworldSearchClient.searchJibun(address);
            if (search2 != null && search2.response != null && search2.response.result != null
                    && search2.response.result.items != null
                    && !search2.response.result.items.isEmpty()) {
                pnu = search2.response.result.items.get(0).id;
            }
        }

        if (pnu == null) {
            return "PNU를 찾지 못했습니다. 주소가 너무 추상적이거나 검색 결과가 없습니다.";
        }

        // 3) 공시지가 (여기 uri 확정되면 정상 동작)
        return vworldOfficialLandPriceClient.getOfficialLandPriceRaw(pnu);
    }

    public String getSeoulRealTradeSample(String rcptYr, String cggCd) {
        // 서비스명은 너 캡쳐 기준 (tblnOpendataRtmsV)
        // tailSegments는 문서에 맞게 순서대로 붙이면 됨
        return seoulOpenApiClient.getRealTradeRaw(
                "tblnOpendataRtmsV",
                1,
                50,
                rcptYr, // 접수년도
                cggCd // 자치구코드 등
        );
    }

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(PriceSearchService.class);

    public java.util.List<io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse> searchByAddress(
            String rawAddress, String dealType) {
        log.info("Searching by address: {}", rawAddress);
        java.util.List<io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse> results = new java.util.ArrayList<>();

        boolean isJibun = rawAddress.matches(".*[동읍면]\\s*\\d+.*");
        VworldSearchResponse search = null;
        try {
            if (isJibun) {
                search = vworldSearchClient.searchJibun(rawAddress);
                if (search == null || search.response == null || search.response.result == null
                        || search.response.result.items == null
                        || search.response.result.items.isEmpty()) {
                    log.info("Jibun search failed for {}, trying Juso search...", rawAddress);
                    search = vworldSearchClient.searchJuso(rawAddress);
                }
            } else {
                search = vworldSearchClient.searchJuso(rawAddress);
                if (search == null || search.response == null || search.response.result == null
                        || search.response.result.items == null
                        || search.response.result.items.isEmpty()) {
                    log.info("Juso search failed for {}, trying Jibun search...", rawAddress);
                    search = vworldSearchClient.searchJibun(rawAddress);
                }
            }
        } catch (Exception e) {
            log.error("Vworld search failed", e);
            // Vworld 실패 시에도 진행 가능한지? -> 주소 파싱 안되면 불가.
            return results;
        }

        if (search == null || search.response == null || search.response.result == null
                || search.response.result.items == null || search.response.result.items.isEmpty()) {
            log.warn("Vworld search returned no items for both Juso and Jibun: {}", rawAddress);
            return results;
        }

        VworldSearchResponse.Item item = search.response.result.items.get(0);
        String roadAddr = item.address != null ? item.address.road : null;
        String jibunAddr = item.address != null ? item.address.parcel : null;
        log.info("Vworld parsed: road={}, jibun={}", roadAddr, jibunAddr);

        // 파싱 로직
        String sigungu = parseSigungu(roadAddr, jibunAddr, rawAddress);
        String roadName = parseRoadName(roadAddr);
        String jibunBeonji = parseJibunBeonji(jibunAddr);
        log.info("Parsed conditions: sigungu={}, roadName={}, jibunBeonji={}", sigungu, roadName, jibunBeonji);

        // 2. DB 조회 (아파트)
        if (sigungu != null) {
            // "서울특별시 은평구" -> "은평구"로 검색 (DB 포맷 불일치 대응)
            String searchSigungu = sigungu;
            if (sigungu.contains(" ")) {
                String[] tokens = sigungu.split(" ");
                if (tokens.length >= 2) {
                    searchSigungu = tokens[1];
                }
            }
            log.info("Searching with Sigungu: original='{}', used='{}'", sigungu, searchSigungu);

            try {
                String searchDong = parseJibunDong(jibunAddr);

                // (1) 아파트 매매
                if (roadName != null) {
                    aptSaleRepo
                            .findBySigunguContainingAndRoadNameContainingOrderByContractYyyymmDescContractDayDesc(
                                    searchSigungu, roadName)
                            .stream()
                            .filter(e -> searchDong == null
                                    || (e.getEupmyeondong() != null && e.getEupmyeondong().contains(searchDong))
                                    || (e.getSigungu() != null && e.getSigungu().contains(searchDong)))
                            .forEach(e -> results.add(toDto(e)));
                }
                if (jibunBeonji != null) {
                    aptSaleRepo
                            .findBySigunguContainingAndJibunContainingOrderByContractYyyymmDescContractDayDesc(
                                    searchSigungu, jibunBeonji)
                            .stream()
                            .filter(e -> searchDong == null
                                    || (e.getEupmyeondong() != null && e.getEupmyeondong().contains(searchDong))
                                    || (e.getSigungu() != null && e.getSigungu().contains(searchDong)))
                            .filter(e -> e.getJibun() != null && (e.getJibun().equals(jibunBeonji)
                                    || e.getJibun().endsWith(" " + jibunBeonji) || e.getJibun().endsWith(jibunBeonji)))
                            .forEach(e -> results.add(toDto(e)));

                    // Fallback: JIBUN 컬럼이 정확지 않을 경우, 동 + 본번으로 검색 시도
                    try {
                        String dong = parseJibunDong(jibunAddr);
                        log.info("Fallback Search Try: sigungu='{}', dong='{}', jibunBeonji='{}'", searchSigungu, dong,
                                jibunBeonji);

                        if (dong != null && jibunBeonji != null) {
                            String bonbun = jibunBeonji;
                            if (jibunBeonji.contains("-")) {
                                bonbun = jibunBeonji.split("-")[0];
                            }
                            // 본번 Loose 검색
                            aptSaleRepo
                                    .findBySigunguContainingAndEupmyeondongContainingAndBonbunContainingOrderByContractYyyymmDescContractDayDesc(
                                            searchSigungu, dong, bonbun)
                                    .forEach(e -> results.add(toDto(e)));
                        }
                    } catch (Exception e) {
                        log.warn("Fallback search failed: {}", e.getMessage());
                    }
                }

                // (2) 아파트 전월세
                if (roadName != null) {
                    aptRentRepo
                            .findBySigunguContainingAndRoadNameContainingOrderByContractYyyymmDescContractDayDesc(
                                    searchSigungu, roadName)
                            .stream()
                            .filter(e -> searchDong == null
                                    || (e.getEupmyeondong() != null && e.getEupmyeondong().contains(searchDong))
                                    || (e.getSigungu() != null && e.getSigungu().contains(searchDong)))
                            .forEach(e -> results.add(toDto(e)));
                }
                if (jibunBeonji != null) {
                    aptRentRepo
                            .findBySigunguContainingAndJibunContainingOrderByContractYyyymmDescContractDayDesc(
                                    searchSigungu, jibunBeonji)
                            .stream()
                            .filter(e -> searchDong == null
                                    || (e.getEupmyeondong() != null && e.getEupmyeondong().contains(searchDong))
                                    || (e.getSigungu() != null && e.getSigungu().contains(searchDong)))
                            .filter(e -> e.getJibun() != null && (e.getJibun().equals(jibunBeonji)
                                    || e.getJibun().endsWith(" " + jibunBeonji) || e.getJibun().endsWith(jibunBeonji)))
                            .forEach(e -> results.add(toDto(e)));
                }

                // (3) 빌라/오피스텔 매매
                if (roadName != null) {
                    villaSaleRepo
                            .findBySigunguContainingAndRoadNameContainingOrderByContractYmDescContractDayDesc(
                                    searchSigungu, roadName)
                            .stream()
                            .filter(e -> searchDong == null
                                    || (e.getSigungu() != null && e.getSigungu().contains(searchDong)))
                            .forEach(e -> results.add(toDto(e)));
                    officetelSaleRepo
                            .findBySigunguContainingAndRoadNameContainingOrderByContractYmDescContractDayDesc(
                                    searchSigungu, roadName)
                            .stream()
                            .filter(e -> searchDong == null
                                    || (e.getSigungu() != null && e.getSigungu().contains(searchDong)))
                            .forEach(e -> results.add(toDto(e)));
                }
                if (jibunBeonji != null) {
                    villaSaleRepo.findBySigunguContainingAndBeonjiContainingOrderByContractYmDescContractDayDesc(
                            searchSigungu, jibunBeonji)
                            .stream()
                            .filter(e -> searchDong == null
                                    || (e.getSigungu() != null && e.getSigungu().contains(searchDong)))
                            .filter(e -> e.getBeonji() != null
                                    && (e.getBeonji().equals(jibunBeonji) || e.getBeonji().endsWith(" " + jibunBeonji)
                                            || e.getBeonji().endsWith(jibunBeonji)))
                            .forEach(e -> results.add(toDto(e)));
                    officetelSaleRepo
                            .findBySigunguContainingAndBeonjiContainingOrderByContractYmDescContractDayDesc(
                                    searchSigungu, jibunBeonji)
                            .stream()
                            .filter(e -> searchDong == null
                                    || (e.getSigungu() != null && e.getSigungu().contains(searchDong)))
                            .filter(e -> e.getBeonji() != null
                                    && (e.getBeonji().equals(jibunBeonji) || e.getBeonji().endsWith(" " + jibunBeonji)
                                            || e.getBeonji().endsWith(jibunBeonji)))
                            .forEach(e -> results.add(toDto(e)));
                }

                // (4) 빌라/오피스텔 전월세
                if (roadName != null) {
                    villaRentRepo
                            .findBySigunguContainingAndRoadNameContainingOrderByContractYmDescContractDayDesc(
                                    searchSigungu, roadName)
                            .stream()
                            .filter(e -> searchDong == null
                                    || (e.getSigungu() != null && e.getSigungu().contains(searchDong)))
                            .forEach(e -> results.add(toDto(e)));
                    officetelRentRepo
                            .findBySigunguContainingAndRoadNameContainingOrderByContractYmDescContractDayDesc(
                                    searchSigungu, roadName)
                            .stream()
                            .filter(e -> searchDong == null
                                    || (e.getSigungu() != null && e.getSigungu().contains(searchDong)))
                            .forEach(e -> results.add(toDto(e)));
                }
                if (jibunBeonji != null) {
                    villaRentRepo.findBySigunguContainingAndBeonjiContainingOrderByContractYmDescContractDayDesc(
                            searchSigungu, jibunBeonji)
                            .stream()
                            .filter(e -> searchDong == null
                                    || (e.getSigungu() != null && e.getSigungu().contains(searchDong)))
                            .filter(e -> e.getBeonji() != null
                                    && (e.getBeonji().equals(jibunBeonji) || e.getBeonji().endsWith(" " + jibunBeonji)
                                            || e.getBeonji().endsWith(jibunBeonji)))
                            .forEach(e -> results.add(toDto(e)));
                    officetelRentRepo
                            .findBySigunguContainingAndBeonjiContainingOrderByContractYmDescContractDayDesc(
                                    searchSigungu, jibunBeonji)
                            .stream()
                            .filter(e -> searchDong == null
                                    || (e.getSigungu() != null && e.getSigungu().contains(searchDong)))
                            .filter(e -> e.getBeonji() != null
                                    && (e.getBeonji().equals(jibunBeonji) || e.getBeonji().endsWith(" " + jibunBeonji)
                                            || e.getBeonji().endsWith(jibunBeonji)))
                            .forEach(e -> results.add(toDto(e)));
                }
            } catch (Exception e) {
                log.error("Database query failed during address search", e);
                // DB 오류가 나더라도 부분 결과라도 리턴? 아니면 에러 전파?
                // 현재는 로깅하고 빈 결과 리턴 방지 위해 에러 던지지 않음 (디버깅 목적)
            }
        }

        // 중복 제거 (도로명, 지번 둘 다 검색될 경우) 및 정렬 (최신순)
        log.info("Total results found: {}", results.size());
        return results.stream()
                .distinct()
                .filter(r -> dealType == null || dealType.trim().isEmpty() || dealType.trim().equals(r.getDealType()))
                .sorted((a, b) -> {
                    int c = b.getContractYm().compareTo(a.getContractYm());
                    if (c == 0)
                        return b.getContractDay().compareTo(a.getContractDay());
                    return c;
                })
                .collect(java.util.stream.Collectors.toList());
    }

    // --- Helper Methods ---
    private String extractSigunguToken(String addr) {
        if (addr == null)
            return null;
        String[] tokens = addr.split(" ");
        if (tokens.length >= 2) {
            String t0 = tokens[0];
            String t1 = tokens[1];
            if ((t0.endsWith("도") || t0.endsWith("시") || t0.endsWith("특별자치도")) &&
                    (t1.endsWith("구") || t1.endsWith("시") || t1.endsWith("군"))) {
                return t0 + " " + t1;
            }
        }
        if (tokens.length >= 1) {
            String t0 = tokens[0];
            if (t0.endsWith("구") || t0.endsWith("시") || t0.endsWith("군")) {
                if (!t0.endsWith("특별시") && !t0.endsWith("광역시") && !t0.endsWith("도")) {
                    return t0;
                }
            }
        }
        return null;
    }

    private String parseSigungu(String addr) {
        String result = extractSigunguToken(addr);
        if (result != null)
            return result;

        if (addr != null) {
            String[] tokens = addr.split(" ");
            if (tokens.length >= 2) {
                return tokens[0] + " " + tokens[1];
            }
        }
        return addr;
    }

    private String parseSigungu(String roadAddr, String jibunAddr, String rawAddress) {
        String result = extractSigunguToken(jibunAddr);
        if (result != null)
            return result;

        result = extractSigunguToken(roadAddr);
        if (result != null)
            return result;

        result = extractSigunguToken(rawAddress);
        if (result != null)
            return result;

        String fallback = jibunAddr != null ? jibunAddr : (roadAddr != null ? roadAddr : rawAddress);
        if (fallback != null) {
            String[] tokens = fallback.split(" ");
            if (tokens.length >= 2) {
                return tokens[0] + " " + tokens[1];
            }
            return fallback;
        }
        return null;
    }

    private String parseRoadName(String roadAddr) {
        if (roadAddr == null)
            return null;
        // 도로명 주소: "서울특별시 강남구 테헤란로 123"
        // 보통 3번째가 도로명 ("테헤란로"), 4번째가 번호 ("123")
        // "테헤란로"만 검색하면 너무 많으므로, 가능하다면 "테헤란로" 검색 후 자바에서 필터링하거나
        // 여기서는 간단히 "테헤란로"만 리턴해서 검색 (범위가 넓을 수 있음)
        // -> 사용성을 위해 "도로명"을 추출
        String[] tokens = roadAddr.split(" ");
        if (tokens.length >= 3) {
            return tokens[2]; // "테헤란로"
        }
        return null;
    }

    private String parseJibunBeonji(String jibunAddr) {
        if (jibunAddr == null)
            return null;
        // 지번 주소: "서울특별시 강남구 역삼동 123-45"
        // 맨 뒤가 번지
        String[] tokens = jibunAddr.split(" ");
        if (tokens.length > 0) {
            return tokens[tokens.length - 1]; // "123-45"
        }
        return null;
    }

    // --- DTO Mapping Methods ---
    private io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse toDto(
            io.pjj.ziphyeonjeon.batch.molit.MolitAptSaleRawEntity e) {
        return io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse.builder()
                .propertyType("아파트")
                .dealType("매매")
                .contractYm(Integer.parseInt(e.getContractYyyymm()))
                .contractDay(Integer.valueOf(e.getContractDay()))
                .exclusiveArea(e.getExclusiveAreaM2())
                .dealAmountMan(e.getDealAmountMan())
                .floor(e.getFloorNo() != null ? Integer.valueOf(e.getFloorNo()) : null)
                .builtYear(e.getBuiltYear() != null ? Integer.valueOf(e.getBuiltYear()) : null)
                .sigungu(e.getSigungu())
                .dong(e.getEupmyeondong())
                .jibun(e.getJibun())
                .roadName(e.getRoadName())
                .complexName(e.getComplexName())
                .build();
    }

    private io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse toDto(
            io.pjj.ziphyeonjeon.batch.molit.MolitAptRentRawEntity e) {
        long monthlyRent = e.getMonthlyRentMan() != null ? e.getMonthlyRentMan() : 0L;
        String dealType = monthlyRent > 0 ? "월세" : "전세";

        return io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse.builder()
                .propertyType("아파트")
                .dealType(dealType)
                .contractYm(Integer.parseInt(e.getContractYyyymm()))
                .contractDay(Integer.valueOf(e.getContractDay()))
                .exclusiveArea(e.getExclusiveAreaM2())
                .dealAmountMan(e.getDepositMan())
                .monthlyRentMan(e.getMonthlyRentMan())
                .floor(e.getFloorNo() != null ? Integer.valueOf(e.getFloorNo()) : null)
                .builtYear(e.getBuiltYear() != null ? Integer.valueOf(e.getBuiltYear()) : null)
                .sigungu(e.getSigungu())
                .dong(e.getEupmyeondong())
                .jibun(e.getJibun())
                .roadName(e.getRoadName())
                .complexName(e.getComplexName())
                .build();
    }

    private io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse toDto(
            io.pjj.ziphyeonjeon.batch.molit.MolitVillaSaleRawEntity e) {
        return io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse.builder()
                .propertyType("연립다세대")
                .dealType("매매")
                .contractYm(e.getContractYm())
                .contractDay(Integer.valueOf(e.getContractDay()))
                .exclusiveArea(e.getExclArea())
                .dealAmountMan(e.getDealAmountMan() != null ? Long.valueOf(e.getDealAmountMan()) : null)
                .floor(e.getFloorNo() != null ? Integer.valueOf(e.getFloorNo()) : null)
                .builtYear(e.getBuiltYear() != null ? Integer.valueOf(e.getBuiltYear()) : null)
                .sigungu(e.getSigungu())
                .jibun(e.getBeonji())
                .roadName(e.getRoadName())
                .complexName(e.getBuildingName())
                .build();
    }

    private io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse toDto(
            io.pjj.ziphyeonjeon.batch.molit.MolitVillaRentRawEntity e) {
        long monthlyRent = e.getMonthlyRentMan() != null ? e.getMonthlyRentMan() : 0L;
        String dealType = monthlyRent > 0 ? "월세" : "전세";

        return io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse.builder()
                .propertyType("연립다세대")
                .dealType(dealType)
                .contractYm(e.getContractYm())
                .contractDay(Integer.valueOf(e.getContractDay()))
                .exclusiveArea(e.getExclArea())
                .dealAmountMan(e.getDepositMan())
                .monthlyRentMan(monthlyRent > 0 ? monthlyRent : null)
                .floor(e.getFloorNo() != null ? Integer.valueOf(e.getFloorNo()) : null)
                .builtYear(e.getBuiltYear() != null ? Integer.valueOf(e.getBuiltYear()) : null)
                .sigungu(e.getSigungu())
                .jibun(e.getBeonji())
                .roadName(e.getRoadName())
                .complexName(e.getBuildingName())
                .build();
    }

    private io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse toDto(
            io.pjj.ziphyeonjeon.batch.molit.MolitOfficetelSaleRawEntity e) {
        return io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse.builder()
                .propertyType("오피스텔")
                .dealType("매매")
                .contractYm(e.getContractYm())
                .contractDay(Integer.valueOf(e.getContractDay()))
                .exclusiveArea(e.getExclArea())
                .dealAmountMan(e.getDealAmountMan() != null ? Long.valueOf(e.getDealAmountMan()) : null)
                .floor(e.getFloorNo() != null ? Integer.valueOf(e.getFloorNo()) : null)
                .builtYear(e.getBuiltYear() != null ? Integer.valueOf(e.getBuiltYear()) : null)
                .sigungu(e.getSigungu())
                .jibun(e.getBeonji())
                .roadName(e.getRoadName())
                .complexName(e.getComplexName())
                .build();
    }

    private io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse toDto(
            io.pjj.ziphyeonjeon.batch.molit.MolitOfficetelRentRawEntity e) {
        long monthlyRent = e.getMonthlyRentMan() != null ? e.getMonthlyRentMan() : 0L;
        String dealType = monthlyRent > 0 ? "월세" : "전세";

        return io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse.builder()
                .propertyType("오피스텔")
                .dealType(dealType)
                .contractYm(e.getContractYm())
                .contractDay(Integer.valueOf(e.getContractDay()))
                .exclusiveArea(e.getExclArea())
                .dealAmountMan(e.getDepositMan())
                .monthlyRentMan(monthlyRent > 0 ? monthlyRent : null)
                .floor(e.getFloorNo() != null ? Integer.valueOf(e.getFloorNo()) : null)
                .builtYear(e.getBuiltYear() != null ? Integer.valueOf(e.getBuiltYear()) : null)
                .sigungu(e.getSigungu())
                .jibun(e.getBeonji())
                .roadName(e.getRoadName())
                .complexName(e.getComplexName())
                .build();
    }

    // --- P-004: 매물 시세 비교 ---
    public java.util.List<io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceCompareResponse> comparePrices(
            io.pjj.ziphyeonjeon.PriceSearch.dto.request.PriceCompareRequest request) {
        java.util.List<io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceCompareResponse> responses = new java.util.ArrayList<>();

        if (request.getTargets() == null || request.getTargets().size() < 2 || request.getTargets().size() > 10) {
            throw new IllegalArgumentException("비교할 매물은 2개 이상 10개 이하이어야 합니다.");
        }

        for (io.pjj.ziphyeonjeon.PriceSearch.dto.request.PriceCompareRequest.TargetItem item : request.getTargets()) {
            Double avgPrice = 0.0;
            String address = item.getAddress(); // "서울 강남구 역삼동" (지번 기준 가정)
            String sigungu = parseSigungu(address); // "서울특별시 강남구"
            String dong = parseJibunDong(address); // "역삼동"
            java.math.BigDecimal area = item.getArea_m2(); // spec: area_m2
            java.math.BigDecimal minArea = area.subtract(new java.math.BigDecimal("10")); // -10m2
            java.math.BigDecimal maxArea = area.add(new java.math.BigDecimal("10")); // +10m2

            // 전용면적이 음수면 0으로 보정
            if (minArea.compareTo(java.math.BigDecimal.ZERO) < 0)
                minArea = java.math.BigDecimal.ZERO;

            if (sigungu != null && dong != null) {
                // 타입별 리포지토리 조회
                // spec: transaction_type
                String type = item.getTransaction_type();
                if (type != null) {
                    if (type.contains("아파트")) {
                        avgPrice = aptSaleRepo.findAverageDealAmount(sigungu, dong, minArea, maxArea);
                    } else if (type.contains("연립") || type.contains("다세대")
                            || type.contains("빌라")) {
                        avgPrice = villaSaleRepo.findAverageDealAmount(sigungu, dong, minArea, maxArea);
                    } else if (type.contains("오피스텔")) {
                        avgPrice = officetelSaleRepo.findAverageDealAmount(sigungu, dong, minArea, maxArea);
                    }
                }
            }

            Long avgLong = (avgPrice != null) ? Math.round(avgPrice) : 0L;
            Long arrDiff = (avgLong > 0) ? (item.getTargetPrice() - avgLong) : 0L;

            Double percent = 0.0;
            if (avgLong > 0) {
                percent = (double) arrDiff / avgLong * 100.0;
            }

            String msg = "데이터 부족";
            if (avgLong > 0) {
                if (arrDiff > 0)
                    msg = String.format("평균보다 약 %d만원 비쌉니다 (%.1f%%)", arrDiff, percent);
                else if (arrDiff < 0)
                    msg = String.format("평균보다 약 %d만원 저렴합니다 (%.1f%%)", Math.abs(arrDiff), Math.abs(percent));
                else
                    msg = "평균 시세와 동일합니다";
            } else {
                msg = "비교할 주변 시세 데이터가 부족합니다.";
            }

            responses.add(io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceCompareResponse.builder()
                    .address(item.getAddress())
                    .propertyType(item.getTransaction_type())
                    .exclusiveArea(item.getArea_m2())
                    .targetPrice(item.getTargetPrice())
                    .averageMarketPrice(avgLong) // 0이면 데이터 없음
                    .priceDiff(arrDiff)
                    .diffPercent(percent)
                    .analysisMessage(msg)
                    .build());
        }

        return responses;
    }

    private String parseJibunDong(String jibunAddr) {
        if (jibunAddr == null)
            return null;
        // "서울특별시 강남구 역삼동 123-45" -> 뒤에서 두번째 "역삼동"?
        // 간단히: '동'으로 끝나는 어절을 찾거나, Split 후 적절한 위치 파악
        // 여기서는 안전하게 3번째 어절(index 2)을 동으로 가정 (시 도 / 구 / 동)
        // 하지만 "경기 성남시 분당구 정자동" 처럼 4번째일수도 있음.
        // -> 실무에선 정교한 파서 필요. 여기서는 '동'이 포함된 어절 찾기
        String[] tokens = jibunAddr.split(" ");
        for (String t : tokens) {
            if (t.endsWith("동") || t.endsWith("가") || t.endsWith("읍") || t.endsWith("면")) {
                return t;
            }
        }
        return null; // 못 찾으면 null
    }

    // --- P-005: 전세가율 위험도 분석 ---
    public io.pjj.ziphyeonjeon.PriceSearch.dto.response.JeonseRatioResponse calculateJeonseRatio(
            io.pjj.ziphyeonjeon.PriceSearch.dto.request.JeonseRatioRequest request) {
        String address = request.getAddress();

        // 구조화된 주소 필드 우선 사용, 없으면 파싱 시도, 그래도 없으면 빈 문자열 (LIKE %% = 전체)
        String sigungu = (request.getSigungu() != null && !request.getSigungu().isEmpty())
                ? request.getSigungu()
                : parseSigungu(address);
        String dong = (request.getDong() != null && !request.getDong().isEmpty())
                ? request.getDong()
                : ""; // 빈 문자열 = LIKE '%%' = 전체 동 포함

        java.math.BigDecimal area = request.getExclusiveArea();

        java.math.BigDecimal margin = area.multiply(new java.math.BigDecimal("0.10")).setScale(2,
                java.math.RoundingMode.HALF_UP);
        java.math.BigDecimal minArea = area.subtract(margin);
        java.math.BigDecimal maxArea = area.add(margin);
        if (minArea.compareTo(java.math.BigDecimal.ZERO) < 0)
            minArea = java.math.BigDecimal.ZERO;

        Double avgSale = 0.0;
        Double avgJeonse = 0.0;

        if (sigungu != null && !sigungu.isEmpty()) {
            if (request.getPropertyType().contains("아파트")) {
                avgSale = aptSaleRepo.findAverageDealAmount(sigungu, dong, minArea, maxArea);
                avgJeonse = aptRentRepo.findAverageDeposit(sigungu, dong, minArea, maxArea);
            } else if (request.getPropertyType().contains("연립") || request.getPropertyType().contains("빌라")) {
                avgSale = villaSaleRepo.findAverageDealAmount(sigungu, dong, minArea, maxArea);
                avgJeonse = villaRentRepo.findAverageDeposit(sigungu, dong, minArea, maxArea);
            } else if (request.getPropertyType().contains("오피스텔")) {
                avgSale = officetelSaleRepo.findAverageDealAmount(sigungu, dong, minArea, maxArea);
                avgJeonse = officetelRentRepo.findAverageDeposit(sigungu, dong, minArea, maxArea);
            }
        }

        Long avgSaleLong = (avgSale != null) ? Math.round(avgSale) : 0L;
        Long avgJeonseLong = (avgJeonse != null) ? Math.round(avgJeonse) : 0L;

        // 매매 데이터가 없으면 비율 계산 불가
        if (avgSaleLong == 0) {
            return io.pjj.ziphyeonjeon.PriceSearch.dto.response.JeonseRatioResponse.builder()
                    .address(address)
                    .avgSalePrice(0L)
                    .avgJeonsePrice(avgJeonseLong)
                    .riskLevel("UNKNOWN")
                    .riskMessage("비교할 대상 매매 데이터가 부족하여 전세가율을 계산할 수 없습니다.")
                    .build();
        }

        // 1. 시장 전세가율
        double marketRatio = 0.0;
        if (avgJeonseLong > 0) {
            marketRatio = (double) avgJeonseLong / avgSaleLong * 100.0;
        }

        // 2. 내 전세가율
        double myRatio = 0.0;
        // spec: jeonse_amount
        if (request.getJeonse_amount() != null && request.getJeonse_amount() > 0) {
            myRatio = (double) request.getJeonse_amount() / avgSaleLong * 100.0;
        } else {
            // 사용자 보증금이 없으면 시장 비율을 내 비율로 간주 (단순 조회일 경우)
            myRatio = marketRatio;
        }

        // 위험도 판정 (5단계)
        // - SUSPICIOUS_LOW: 비정상적으로 낮음 → 사기 의심
        // - SAFE: 안전 (25~60%)
        // - CAUTION: 주의 (60~70%)
        // - HIGH_RISK: 고위험 (70~85%)
        // - DANGER: 깡통전세 위험 (85%+)
        String riskLevel;
        String msg;

        if (myRatio < 25.0) {
            riskLevel = "SUSPICIOUS_LOW";
            msg = String.format(
                    "⚠️ 전세가율이 %.1f%%로 시세 대비 비정상적으로 낮습니다. 불법 증축·권리 문제·경매 위험 매물일 수 있으니 등기부등본과 건축물대장을 반드시 확인하세요.",
                    myRatio);
        } else if (myRatio < 60.0) {
            riskLevel = "SAFE";
            msg = String.format("전세가율 %.1f%% — 인근 매매가 대비 안정적인 전세 금액입니다.", myRatio);
        } else if (myRatio < 70.0) {
            riskLevel = "CAUTION";
            msg = String.format(
                    "전세가율 %.1f%% — 전세대출 한도(보통 70%%) 근접 구간입니다. 매매가 변동 시 보증금 회수가 어려울 수 있습니다.",
                    myRatio);
        } else if (myRatio < 85.0) {
            riskLevel = "HIGH_RISK";
            msg = String.format(
                    "전세가율 %.1f%% — HUG 전세보증 가입 기준선(85%%)에 근접한 고위험 구간입니다. 전세보증보험 가입을 강력히 권장합니다.",
                    myRatio);
        } else {
            riskLevel = "DANGER";
            msg = String.format(
                    "전세가율 %.1f%% — 깡통전세 위험! 매매가가 조금만 하락해도 보증금 전액 회수가 불가능할 수 있습니다. 계약을 재검토하세요.",
                    myRatio);
        }

        return io.pjj.ziphyeonjeon.PriceSearch.dto.response.JeonseRatioResponse.builder()
                .address(address)
                .avgSalePrice(avgSaleLong)
                .avgJeonsePrice(avgJeonseLong)
                .marketJeonseRatio(marketRatio)
                .myJeonseRatio(myRatio)
                .riskLevel(riskLevel)
                .riskMessage(msg)
                .build();
    }

    // --- P-006: 지역 시세 변동 추이 (그래프) ---
    public io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceTrendResponse getRegionalTrend(String address_code,
            String time_unit) {
        // 명세서의 address_code는 실제로는 행정동 코드일 수 있으나, 현재 DB 구조상 주소 문자열로 검색 지원
        String address = address_code;
        String sigungu = parseSigungu(address);
        String dong = parseJibunDong(address);

        java.util.Map<String, io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceTrendResponse.TrendItem> trendMap = new java.util.HashMap<>();

        if (sigungu != null && dong != null) {
            // 1. 아파트
            processTrendData(aptSaleRepo.findMonthlyAverageUnitPrice(sigungu, dong), trendMap,
                    (item, val) -> item.setAptSale(val));
            processTrendData(aptRentRepo.findMonthlyAverageJeonseUnitPrice(sigungu, dong), trendMap,
                    (item, val) -> item.setAptJeonse(val));
            processTrendData(aptRentRepo.findMonthlyAverageWolseAmount(sigungu, dong), trendMap,
                    (item, val) -> item.setAptWolse(val));

            // 2. 빌라
            processTrendData(villaSaleRepo.findMonthlyAverageUnitPrice(sigungu, dong), trendMap,
                    (item, val) -> item.setVillaSale(val));
            processTrendData(villaRentRepo.findMonthlyAverageJeonseUnitPrice(sigungu, dong), trendMap,
                    (item, val) -> item.setVillaJeonse(val));
            processTrendData(villaRentRepo.findMonthlyAverageWolseAmount(sigungu, dong), trendMap,
                    (item, val) -> item.setVillaWolse(val));

            // 3. 오피스텔
            processTrendData(officetelSaleRepo.findMonthlyAverageUnitPrice(sigungu, dong), trendMap,
                    (item, val) -> item.setOfficetelSale(val));
            processTrendData(officetelRentRepo.findMonthlyAverageJeonseUnitPrice(sigungu, dong), trendMap,
                    (item, val) -> item.setOfficetelJeonse(val));
            processTrendData(officetelRentRepo.findMonthlyAverageWolseAmount(sigungu, dong), trendMap,
                    (item, val) -> item.setOfficetelWolse(val));
        }

        // Filter: 202401 ~ 202512
        java.util.List<io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceTrendResponse.TrendItem> trends = trendMap
                .values().stream()
                .filter(item -> {
                    String p = item.getPeriod();
                    return p != null && p.compareTo("202401") >= 0 && p.compareTo("202512") <= 0;
                })
                .sorted(java.util.Comparator
                        .comparing(
                                io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceTrendResponse.TrendItem::getPeriod))
                .collect(Collectors.toList());

        return io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceTrendResponse.builder()
                .regionName(sigungu + " " + dong)
                .trends(trends)
                .build();
    }

    private void processTrendData(java.util.List<Object[]> rawData,
            java.util.Map<String, io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceTrendResponse.TrendItem> trendMap,
            java.util.function.BiConsumer<io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceTrendResponse.TrendItem, Double> setter) {
        if (rawData == null)
            return;

        for (Object[] row : rawData) {
            // Row: [Period, AvgPrice]
            // Period can be String (Apt) or Integer (Villa/Off)
            String period = String.valueOf(row[0]);
            Double val = (Double) row[1];

            if (val == null)
                continue;

            // 소수점 1자리 반올림 (만원/m2 단위)
            val = Math.round(val * 10.0) / 10.0;

            io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceTrendResponse.TrendItem item = trendMap.getOrDefault(
                    period,
                    io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceTrendResponse.TrendItem.builder().period(period)
                            .build());

            setter.accept(item, val);
            trendMap.put(period, item);
        }
    }

    // --- P-001: 국토부 실거래가 조회 (Spec 준수) ---
    public java.util.List<io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse> searchMolit(
            io.pjj.ziphyeonjeon.PriceSearch.dto.request.MolitTradeSearchRequest request) {

        java.util.List<io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse> results = new java.util.ArrayList<>();

        String sigungu = request.getSigungu_name();
        String type = request.getBuilding_type();
        String yyyyMM = request.getDeal_year_month();
        String dealType = request.getDeal_type();

        if (sigungu == null || type == null || yyyyMM == null) {
            return results;
        }

        boolean includeSale = (dealType == null || dealType.isEmpty() || dealType.equals("전체")
                || dealType.equals("매매"));
        boolean includeRent = (dealType == null || dealType.isEmpty() || dealType.equals("전체")
                || dealType.equals("전세") || dealType.equals("월세"));

        if (type.contains("아파트")) {
            // Apartment
            if (includeSale) {
                aptSaleRepo.findBySigunguContainingAndContractYyyymm(sigungu, yyyyMM)
                        .forEach(e -> results.add(toDto(e)));
            }
            if (includeRent) {
                aptRentRepo.findBySigunguContainingAndContractYyyymm(sigungu, yyyyMM)
                        .forEach(e -> {
                            PriceSearchResultResponse dto = toDto(e);
                            if (dealType == null || dealType.isEmpty() || dealType.equals("전체")
                                    || dealType.equals(dto.getDealType())) {
                                results.add(dto);
                            }
                        });
            }

        } else if (type.contains("빌라") || type.contains("연립") || type.contains("다세대")) {
            // Villa
            try {
                Integer ym = Integer.parseInt(yyyyMM);
                if (includeSale) {
                    villaSaleRepo.findBySigunguContainingAndContractYm(sigungu, ym)
                            .forEach(e -> results.add(toDto(e)));
                }
                if (includeRent) {
                    villaRentRepo.findBySigunguContainingAndContractYm(sigungu, ym)
                            .forEach(e -> {
                                PriceSearchResultResponse dto = toDto(e);
                                if (dealType == null || dealType.isEmpty() || dealType.equals("전체")
                                        || dealType.equals(dto.getDealType())) {
                                    results.add(dto);
                                }
                            });
                }
            } catch (NumberFormatException e) {
                // Invalid Date format
            }
        } else if (type.contains("오피스텔")) {
            // Officetel
            try {
                Integer ym = Integer.parseInt(yyyyMM);
                if (includeSale) {
                    officetelSaleRepo.findBySigunguContainingAndContractYm(sigungu, ym)
                            .forEach(e -> results.add(toDto(e)));
                }
                if (includeRent) {
                    officetelRentRepo.findBySigunguContainingAndContractYm(sigungu, ym)
                            .forEach(e -> {
                                PriceSearchResultResponse dto = toDto(e);
                                if (dealType == null || dealType.isEmpty() || dealType.equals("전체")
                                        || dealType.equals(dto.getDealType())) {
                                    results.add(dto);
                                }
                            });
                }
            } catch (NumberFormatException e) {
                // Invalid Date format
            }
        }

        return results;
    }

    public java.util.List<io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse> searchByComplexName(
            String complexName, String dealType) {
        log.info("Searching complex by name: {}", complexName);
        java.util.List<io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse> results = new java.util.ArrayList<>();

        try {
            // 1. 아파트 매매
            aptSaleRepo
                    .findByComplexNameContainingAndContractYyyymmGreaterThanEqualOrderByContractYyyymmDescContractDayDesc(
                            complexName, "202401")
                    .forEach(e -> {
                        PriceSearchResultResponse dto = toDto(e);
                        if (dealType == null || dealType.trim().isEmpty()
                                || dealType.trim().equals(dto.getDealType())) {
                            results.add(dto);
                        }
                    });

            // 2. 아파트 전월세
            aptRentRepo
                    .findByComplexNameContainingAndContractYyyymmGreaterThanEqualOrderByContractYyyymmDescContractDayDesc(
                            complexName, "202401")
                    .forEach(e -> {
                        PriceSearchResultResponse dto = toDto(e);
                        if (dealType == null || dealType.trim().isEmpty()
                                || dealType.trim().equals(dto.getDealType())) {
                            results.add(dto);
                        }
                    });

            // 3. 오피스텔 매매
            officetelSaleRepo
                    .findByComplexNameContainingAndContractYmGreaterThanEqualOrderByContractYmDescContractDayDesc(
                            complexName, 202401)
                    .forEach(e -> {
                        PriceSearchResultResponse dto = toDto(e);
                        if (dealType == null || dealType.trim().isEmpty()
                                || dealType.trim().equals(dto.getDealType())) {
                            results.add(dto);
                        }
                    });

            // 4. 오피스텔 전월세
            officetelRentRepo
                    .findByComplexNameContainingAndContractYmGreaterThanEqualOrderByContractYmDescContractDayDesc(
                            complexName, 202401)
                    .forEach(e -> {
                        PriceSearchResultResponse dto = toDto(e);
                        if (dealType == null || dealType.trim().isEmpty()
                                || dealType.trim().equals(dto.getDealType())) {
                            results.add(dto);
                        }
                    });

            // 5. 빌라 매매
            villaSaleRepo
                    .findByBuildingNameContainingAndContractYmGreaterThanEqualOrderByContractYmDescContractDayDesc(
                            complexName, 202401)
                    .forEach(e -> {
                        PriceSearchResultResponse dto = toDto(e);
                        if (dealType == null || dealType.trim().isEmpty()
                                || dealType.trim().equals(dto.getDealType())) {
                            results.add(dto);
                        }
                    });

            // 6. 빌라 전월세
            villaRentRepo
                    .findByBuildingNameContainingAndContractYmGreaterThanEqualOrderByContractYmDescContractDayDesc(
                            complexName, 202401)
                    .forEach(e -> {
                        PriceSearchResultResponse dto = toDto(e);
                        if (dealType == null || dealType.trim().isEmpty()
                                || dealType.trim().equals(dto.getDealType())) {
                            results.add(dto);
                        }
                    });

            log.info("Complex search finished. Total results found: {}", results.size());
        } catch (Exception e) {
            log.error("Complex search failed", e);
        }
        return results;
    }

    // --- P-002: 서울시 실거래가 조회 (Spec 준수) ---
    public java.util.List<io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSearchResultResponse> searchSeoul(
            io.pjj.ziphyeonjeon.PriceSearch.dto.request.SeoulTradeSearchRequest request) {
        // Spec: gu_name, deal_type, start_date, end_date
        return new java.util.ArrayList<>();
    }

    // --- P-003: 개별 공시지가 조회 (Spec 준수) ---
    public String searchLandPrice(io.pjj.ziphyeonjeon.PriceSearch.dto.request.OfficialLandPriceRequest request) {
        // Spec: uninum_code(PNU), year
        if (request.getUninum_code() != null) {
            return vworldOfficialLandPriceClient.getOfficialLandPriceRaw(request.getUninum_code());
        }
        return "PNU Required";
    }

    // --- P-007: 실거래가 다운로드 (CSV) ---
    public org.springframework.core.io.Resource downloadTradeData(String sidoCode, String sigunguCode, String format) {
        // 1. Code -> Name Mapping (서울 25개 구)
        java.util.Map<String, String> codeMap = new java.util.HashMap<>();
        codeMap.put("11110", "서울특별시 종로구");
        codeMap.put("11140", "서울특별시 중구");
        codeMap.put("11170", "서울특별시 용산구");
        codeMap.put("11200", "서울특별시 성동구");
        codeMap.put("11215", "서울특별시 광진구");
        codeMap.put("11230", "서울특별시 동대문구");
        codeMap.put("11260", "서울특별시 중랑구");
        codeMap.put("11290", "서울특별시 성북구");
        codeMap.put("11305", "서울특별시 강북구");
        codeMap.put("11320", "서울특별시 도봉구");
        codeMap.put("11350", "서울특별시 노원구");
        codeMap.put("11380", "서울특별시 은평구");
        codeMap.put("11410", "서울특별시 서대문구");
        codeMap.put("11440", "서울특별시 마포구");
        codeMap.put("11470", "서울특별시 양천구");
        codeMap.put("11500", "서울특별시 강서구");
        codeMap.put("11530", "서울특별시 구로구");
        codeMap.put("11545", "서울특별시 금천구");
        codeMap.put("11560", "서울특별시 영등포구");
        codeMap.put("11590", "서울특별시 동작구");
        codeMap.put("11620", "서울특별시 관악구");
        codeMap.put("11650", "서울특별시 서초구");
        codeMap.put("11680", "서울특별시 강남구");
        codeMap.put("11710", "서울특별시 송파구");
        codeMap.put("11740", "서울특별시 강동구");

        String sigungu = codeMap.getOrDefault(sigunguCode, "서울특별시 강남구");

        // 2. Data Fetch (해당 구의 아파트 매매 최근 데이터)
        java.util.List<io.pjj.ziphyeonjeon.batch.molit.MolitAptSaleRawEntity> list = aptSaleRepo
                .findBySigunguContainingAndContractYyyymm(sigungu, "202412");

        // 3. Generate CSV (UTF-8 with BOM - 엑셀 한글 깨짐 방지)
        StringBuilder csv = new StringBuilder();
        csv.append("계약년월,계약일,단지명,시군구,지번,전용면적(㎡),거래금액(만원),층수,건축년도\n");

        for (io.pjj.ziphyeonjeon.batch.molit.MolitAptSaleRawEntity entity : list) {
            csv.append(entity.getContractYyyymm()).append(",")
                    .append(entity.getContractDay()).append(",")
                    .append(escapeCsv(entity.getComplexName())).append(",")
                    .append(escapeCsv(entity.getSigungu())).append(",")
                    .append(escapeCsv(entity.getJibun())).append(",")
                    .append(entity.getExclusiveAreaM2()).append(",")
                    .append(entity.getDealAmountMan()).append(",")
                    .append(entity.getFloorNo()).append(",")
                    .append(entity.getBuiltYear()).append("\n");
        }

        // BOM(0xEF,0xBB,0xBF) + UTF-8 본문 = 엑셀에서 한글 정상 출력
        byte[] bom = new byte[] { (byte) 0xEF, (byte) 0xBB, (byte) 0xBF };
        byte[] body = csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        byte[] result = new byte[bom.length + body.length];
        System.arraycopy(bom, 0, result, 0, bom.length);
        System.arraycopy(body, 0, result, bom.length, body.length);

        return new org.springframework.core.io.ByteArrayResource(result);
    }

    private String escapeCsv(String data) {
        if (data == null)
            return "";
        return data.replace(",", " ");
    }

    // --- P-008: 적정가 판단 알고리즘 (AI Recommendation) ---
    public io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSuggestionResponse suggestPrice(
            io.pjj.ziphyeonjeon.PriceSearch.dto.request.PriceSuggestionRequest request) {

        String address = request.getAddress();
        java.math.BigDecimal area = request.getArea_m2();

        // 구조화 주소 우선 사용, 없으면 파싱
        String sigungu = (request.getSigungu() != null && !request.getSigungu().isEmpty())
                ? request.getSigungu()
                : parseSigungu(address);
        String dong = (request.getDong() != null && !request.getDong().isEmpty())
                ? request.getDong()
                : "";

        // 면적 ±10% 범위
        java.math.BigDecimal margin = area.multiply(new java.math.BigDecimal("0.10"))
                .setScale(2, java.math.RoundingMode.HALF_UP);
        java.math.BigDecimal minArea = area.subtract(margin);
        java.math.BigDecimal maxArea = area.add(margin);
        if (minArea.compareTo(java.math.BigDecimal.ZERO) < 0)
            minArea = java.math.BigDecimal.ZERO;

        // 유형별 레포지토리 라우팅
        String propertyType = request.getPropertyType();
        Double avgPriceRaw = null;
        if (propertyType != null && (propertyType.contains("빌라") || propertyType.contains("연립"))) {
            avgPriceRaw = villaSaleRepo.findAverageDealAmount(sigungu, dong, minArea, maxArea);
        } else if (propertyType != null && propertyType.contains("오피스텔")) {
            avgPriceRaw = officetelSaleRepo.findAverageDealAmount(sigungu, dong, minArea, maxArea);
        } else {
            // 기본: 아파트
            avgPriceRaw = aptSaleRepo.findAverageDealAmount(sigungu, dong, minArea, maxArea);
        }

        if (avgPriceRaw == null || avgPriceRaw == 0) {
            // 데이터 없으면 계산 불가
            return io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSuggestionResponse.builder()
                    .suggested_price(0L)
                    .grade("판단불가")
                    .calculation_basis(
                            io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSuggestionResponse.CalculationBasis
                                    .builder()
                                    .avg_market_price("비교할 인근 실거래 데이터 부족")
                                    .adjustments(java.util.Collections.emptyList())
                                    .build())
                    .build();
        }

        long basePrice = Math.round(avgPriceRaw);
        java.util.List<String> adjustments = new java.util.ArrayList<>();
        double totalFactor = 1.0;

        // 2. Adjustments (보정)
        io.pjj.ziphyeonjeon.PriceSearch.dto.request.PriceSuggestionRequest.MarketData meta = request.getMarket_data();
        if (meta != null) {
            // 2-1. 층수 보정
            if (meta.getFloor() != null) {
                if (meta.getFloor() >= 20) {
                    totalFactor += 0.05; // 초고층 +5%
                    adjustments.add("초고층 뷰 프리미엄 (+5%)");
                } else if (meta.getFloor() >= 10) {
                    totalFactor += 0.03; // 로열층 +3%
                    adjustments.add("로열층 프리미엄 (+3%)");
                } else if (meta.getFloor() <= 1) {
                    totalFactor -= 0.05; // 1층 -5%
                    adjustments.add("저층(1층) 감액 (-5%)");
                }
            }

            // 2-2. 연식 보정 (신축 선호)
            if (meta.getBuilt_year() != null) {
                int currentYear = java.time.Year.now().getValue();
                int age = currentYear - meta.getBuilt_year();
                if (age <= 5) {
                    totalFactor += 0.05; // 5년차 이내 신축 +5%
                    adjustments.add("신축 프리미엄 (5년이내) (+5%)");
                } else if (age >= 20) {
                    totalFactor -= 0.03; // 구축 감액
                    adjustments.add("구축 감가상각 (20년이상) (-3%)");
                }
            }
        }

        // 3. Final Calculation
        long visualPrice = Math.round(basePrice * totalFactor);

        // 4. Grade (호가 대비 평가)
        String grade = "적정";
        if (meta != null && meta.getCurrent_price() != null && meta.getCurrent_price() > 0) {
            long gap = meta.getCurrent_price() - visualPrice;
            if (gap > (visualPrice * 0.1))
                grade = "고평가 (주의)";
            if (gap < -(visualPrice * 0.1))
                grade = "저평가 (추천)";
        }

        return io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSuggestionResponse.builder()
                .suggested_price(visualPrice)
                .grade(grade)
                .calculation_basis(
                        io.pjj.ziphyeonjeon.PriceSearch.dto.response.PriceSuggestionResponse.CalculationBasis.builder()
                                .avg_market_price(String.format("인근 유사 평형 평균 실거래가: %d만원", basePrice))
                                .adjustments(adjustments)
                                .algorithm_version("AI Comparative Algo v1.0")
                                .build())
                .build();
    }
}
