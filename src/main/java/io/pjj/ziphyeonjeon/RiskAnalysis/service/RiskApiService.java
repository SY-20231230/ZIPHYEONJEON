package io.pjj.ziphyeonjeon.RiskAnalysis.service;

import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static reactor.netty.http.HttpConnectionLiveness.log;

import io.pjj.ziphyeonjeon.RiskAnalysis.dto.BuildingDTO;
import io.pjj.ziphyeonjeon.RiskAnalysis.dto.DisasterDTO;

import io.pjj.ziphyeonjeon.global.API.ApiBuilding;
import io.pjj.ziphyeonjeon.global.API.ApiDisaster;

@Service
public class RiskApiService {
    private final ApiDisaster apiDisaster;
    private final ApiBuilding apiBuilding;
    private final ObjectMapper objectMapper;
    private final RiskAddressService riskAddressService;

    public RiskApiService(ApiDisaster apiDisaster, ApiBuilding apiBuilding,
                          ObjectMapper objectMapper, RiskAddressService riskAddressService) {
        this.apiDisaster = apiDisaster;
        this.apiBuilding = apiBuilding;
        this.objectMapper = objectMapper;
        this.riskAddressService = riskAddressService;
    }

    // 재해 API
    public List<DisasterDTO> requestDisasterApi(String address) {
        Map<String, String> addrDetails = riskAddressService.splitAddressDetails(address);
        String district = addrDetails.get("district");

        String rawData = apiDisaster.fetchAllDisasterData(district);
        List<DisasterDTO> disasterList = extractApiData(rawData, DisasterDTO.class);

        return filterDisasterData(disasterList);
    }

    // 재해 필터링
    private List<DisasterDTO> filterDisasterData(List<DisasterDTO> list) {
        return list.stream()
                .filter(data -> data.EMRG_STEP_NM() != null && data.EMRG_STEP_NM().contains("재난"))
                .toList();
    }

    // 건축물대장 API
    public List<BuildingDTO> requestBuildingApi(String address) {
        Map<String, String> addrDetails = riskAddressService.splitAddressDetails(address);
        String[] codes = riskAddressService.getAddressCode(addrDetails.get("districtToDong"));

        if (codes == null) return Collections.emptyList();

        String dongNm = riskAddressService.formatDongHo(addrDetails.get("dongNm"), "동");
        String hoNm = riskAddressService.formatDongHo(addrDetails.get("hoNm"), "호");

        Map<String, String> apiRawData = apiBuilding.fetchAllBuildingData(
                codes[0], codes[1], addrDetails.get("bun"), addrDetails.get("ji"), dongNm, hoNm
        );

        List<BuildingDTO> operationList = new ArrayList<>();

        String[] targetOperations = {"title", "hsprc", "pubuseArea", "recapTitle"};

        for (String key : targetOperations) {
            List<BuildingDTO> data = extractApiData(
                    apiRawData.get(key), BuildingDTO.class, "response", "body", "items", "item"
            );
            System.out.println("RiskApiService/requestBuildingApi/" + key + ": 추출된 데이터 개수: " + data.size());
            operationList.addAll(data);
        }

        return operationList;
    }

    // JsonNode
    private JsonNode moveJsonPath(String jsonString, String... paths) throws Exception {
        JsonNode node = objectMapper.readTree(jsonString);
        for (String path : paths) {
            node = node.path(path);
        }
        return node;
    }

    // API 데이터 추출
    public <T> List<T> extractApiData(String jsonString, Class<T> targetClass, String... paths) {
        if (jsonString == null || jsonString.isBlank()) return Collections.emptyList();

        try {
            JsonNode node = moveJsonPath(jsonString, paths);

            if (node.isMissingNode() || node.isNull()) {
                log.warn("해당 경로를 찾을 수 없습니다: {}", String.join(" > ", paths));
                return Collections.emptyList();
            }

            if (node.isArray()) {
                return objectMapper.convertValue(node,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, targetClass));
            }
            return List.of(objectMapper.convertValue(node, targetClass));
        } catch (Exception e) {
            log.error("API 데이터 매핑 실패: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

}
