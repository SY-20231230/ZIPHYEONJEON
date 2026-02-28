package io.pjj.ziphyeonjeon.global.API;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

@Component
public class ApiBuilding {

    @Value("${PUBLIC_DATA_SERVICE_KEY}")
    private String serviceKey;

    private final RestTemplate restTemplate;

    public ApiBuilding(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Map<String, String> fetchAllBuildingData(String sigunguCd, String bjdongCd,
                                                    String bun, String ji, String dongNm, String hoNm) {
        Map<String, String> results = new HashMap<>();
        String END_POINT = "https://apis.data.go.kr/1613000/BldRgstHubService";

        Map<String, String> operations = new HashMap<>();
        operations.put("title", "/getBrTitleInfo");                     // 표제부 조회
        operations.put("hsprc", "/getBrHsprcInfo");                     // 주택가격 조회
        operations.put("pubuseArea", "/getBrExposPubuseAreaInfo");      // 전유공용면적(동, 호) 조회
        operations.put("recapTitle", "/getBrRecapTitleInfo");           // 총괄표제부 조회

        operations.forEach((key, operation) -> {
            String response = executeApiCall(END_POINT, operation, sigunguCd, bjdongCd, bun, ji, dongNm, hoNm);
            if (shouldRetry(response)) {
                String retryDong = adjustSuffix(dongNm, "동");
                String retryHo = adjustSuffix(hoNm, "호");

                if (!retryDong.equals(dongNm == null ? "" : dongNm) || !retryHo.equals(hoNm == null ? "" : hoNm)) {
                    System.out.println(key + " ApiBuilding 재시도 중... " + retryDong + " / " + retryHo);
                    response = executeApiCall(END_POINT, operation, sigunguCd, bjdongCd, bun, ji, retryDong, retryHo);
                }
            }
            results.put(key, response);
        });

        return results;
    }

    // API 호출
    private String executeApiCall(String endPoint, String operation, String sigunguCd, String bjdongCd, String bun, String ji, String dongNm, String hoNm) {
        try {
            StringBuilder urlBuilder = new StringBuilder(endPoint + operation);
            urlBuilder.append("?sigunguCd=").append(sigunguCd);
            urlBuilder.append("&bjdongCd=").append(bjdongCd);
            urlBuilder.append("&bun=").append(bun);
            urlBuilder.append("&ji=").append(ji);
            urlBuilder.append("&platGbCd=0&numOfRows=10&pageNo=1&_type=json");

            if (dongNm != null && !dongNm.isEmpty()) {
                urlBuilder.append("&dongNm=").append(java.net.URLEncoder.encode(dongNm, "UTF-8"));
            }
            if (hoNm != null && !hoNm.isEmpty()) {
                urlBuilder.append("&hoNm=").append(java.net.URLEncoder.encode(hoNm, "UTF-8"));
            }

            String finalUrl = urlBuilder + "&serviceKey=" + serviceKey;
            java.net.URI uri = new java.net.URI(finalUrl);

            System.out.println("[" + operation + "] 호출 URI: " + uri);
            return restTemplate.getForObject(uri, String.class);

        } catch (Exception e) {
            System.err.println("호출 실패: " + e.getMessage());
            return "{\"error\": \"API 호출 실패: " + e.getMessage() + "\"}";
        }
    }

    // 결과 데이터 확인
    private boolean shouldRetry(String response) {
        if (response == null) return true;
        return response.contains("\"totalCount\":0") || response.contains("\"item\":[]");
    }

    // 동, 호 보정
    private String adjustSuffix(String value, String suffix) {
        if (value == null || value.isBlank()) return "";
        if (value.endsWith(suffix)) {
            return value.replace(suffix, "");
        }
        return value + suffix;
    }
}
