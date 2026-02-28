package io.pjj.ziphyeonjeon.LoanRecommendation.controller;

import io.pjj.ziphyeonjeon.LoanRecommendation.dto.LoanDTO;
import io.pjj.ziphyeonjeon.LoanRecommendation.service.LoanService;
import io.pjj.ziphyeonjeon.RiskAnalysis.dto.DisasterDTO;
import io.pjj.ziphyeonjeon.RiskAnalysis.dto.RiskDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loan")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class LoanController {

    private final LoanService loanService;

    public LoanController(LoanService loanService) {
        this.loanService = loanService;
    }

    // 대출 목록 로드
    @GetMapping("/list")
    public ResponseEntity<Map<String, List<LoanDTO>>> getLoan() {
        System.out.println("/api/loan/list...");

        Map<String, List<LoanDTO>> response = loanService.dividedLoanList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/detail/{snq}")
    public ResponseEntity<LoanDTO> getLoanDetail(@PathVariable String snq) {
        System.out.println("/api/loan/detail/{snq}: " + snq);

        LoanDTO response = loanService.requestLoanDetail(snq);
        return ResponseEntity.ok(response);
    }

}
