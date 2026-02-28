package io.pjj.ziphyeonjeon.RiskAnalysis.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record BuildingDTO(
        String bldNm,               // 건물명
        String platPlc,             // 대지위치
        String mainPurpsCdNm,       // 주용도코드명
        String etcPurps,            // 기타용도
        Integer hsprc,              // 주택가격
        Integer hhldCnt,            // 세대수(세대)
        String useAprDay,           // 사용 승인일
        String indictViolBldYn,     // 위반건축물 여부 (0: 정상, 1: 위반)
        String strctCdNm,           // 구조명
        Integer crtnDay             // 생성일자
) {

    public record BuildingResponse(
            String address,
            Integer housePrice,
            Integer householdCount,     // 세대수(세대)
            String approvalUseDay,      // 사용 승인일
            Integer score,
            String riskLevel,           // 등급
            List<String> reasons,       // 감점 사유
            Integer creationDay         // 생성일자
    ) {
        public static String calculateBuildingLevel(int score) {
            if (score >= 95) return "안전";
            if (score >= 65) return "주의";
            if (score >= 5) return "위험";
            return "조회된 건축물 정보가 없습니다.";
        }
    }
}