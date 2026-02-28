package io.pjj.ziphyeonjeon.LoanRecommendation.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record LoanDTO(
        String snq,            // 순번
        String finPrdNm,       // 금융상품명
        String lnLmt,          // 대출한도
        String irtCtg,         // 금리구분
        String irt,            // 금리
        String maxTotLnTrm,    // 총대출기간
        String rdptMthd,       // 상환방법
        String usge,           // 용도
        String trgt,           // 대상
        String instCtg,        // 기관구분
        String ofrInstNm,      // 제공기관명
        String rsdArea,        // 거주지역
        String suprTgtDtlCond, // 지원대상 상세조건
        String age,            // 연령
        String incm,           // 소득
        String crdtSc,         // 신용등급
        String anin,           // 연소득
        String hdlInst,        // 취급기관
        String cnpl,           // 연락처
        String rltSite,        // 관련 사이트
        String prdExisYn       // 상품존재여부
) {
}
