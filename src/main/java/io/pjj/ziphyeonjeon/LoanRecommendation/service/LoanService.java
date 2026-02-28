package io.pjj.ziphyeonjeon.LoanRecommendation.service;

import io.pjj.ziphyeonjeon.LoanRecommendation.dto.LoanDTO;
import io.pjj.ziphyeonjeon.RiskAnalysis.service.RiskApiService;
import io.pjj.ziphyeonjeon.global.API.ApiLoan;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LoanService {
    private final ApiLoan apiLoan;
    private final RiskApiService riskApiService;

    public LoanService(ApiLoan apiLoan, RiskApiService riskApiService) {
        this.apiLoan = apiLoan;
        this.riskApiService = riskApiService;
    }

    // 대출 API
    public List<LoanDTO> requestLoanApi() {
        Map<String, String> rawData = apiLoan.fetchAllLoanData();
        List<LoanDTO> allLoanList = new ArrayList<>();

        rawData.forEach((key, json) -> {
            List<LoanDTO> loanList = riskApiService.extractApiData(
                    json,
                    LoanDTO.class,
                    "response", "body", "items", "item"
            );
            allLoanList.addAll(filterLoanList(loanList));
        });
        return allLoanList.stream().distinct().toList();
    }

    // 대출 필터링
    private List<LoanDTO> filterLoanList(List<LoanDTO> list) {
        List<String> allowedCategories = List.of("정부", "준정부기관", "공공·정부기관", "공공기관", "지자체", "시중은행", "상호금융", "기금", "은행");
        return list.stream()
                .filter(loan -> loan.instCtg() != null &&
                        allowedCategories.stream().anyMatch(allowed -> loan.instCtg().contains(allowed)))
                .toList();
    }

    // 대출 주체 분리
    public Map<String, List<LoanDTO>> dividedLoanList() {
        List<LoanDTO> allLoans = requestLoanApi();

        List<String> govKeywords = List.of("정부", "지자체", "공공기관", "기금", "준정부기관", "공공·정부기관");

        return allLoans.stream().collect(Collectors.groupingBy(loan -> {
            String ctg = loan.instCtg();
            if (ctg == null) return "bankLoans";

            boolean isGov = govKeywords.stream().anyMatch(ctg::contains);
            return isGov ? "govLoans" : "bankLoans";
        }));
    }

    // 대출상품 상세
    public LoanDTO requestLoanDetail(String snq) {

        List<LoanDTO> allLoans = requestLoanApi();

        return allLoans.stream()
                .filter(loan -> loan.snq() != null && loan.snq().equals(snq))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("snq error" + snq));
    }
}
