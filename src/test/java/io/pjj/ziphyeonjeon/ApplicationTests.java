package io.pjj.ziphyeonjeon;

import io.pjj.ziphyeonjeon.global.API.ApiLoan;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Objects;

class ApplicationTests {

    @Test
    void apiTest() {
        RestTemplate restTemplate = new RestTemplate();
        ApiLoan apiLoan = new ApiLoan(restTemplate);

        String serviceKey = "5R1W25iameoAVaGDMFaP03PhY4t3LTsoLrt00XESCDquGBzGjfq7YD%2F7LIbb1o0V0km%2FwLqK5pluQch%2BwaiEAQ%3D%3D";
        ReflectionTestUtils.setField(apiLoan, "serviceKey", serviceKey);

        Map<String, String> result = apiLoan.fetchAllLoanData();

        // 4. 결과 출력
        System.out.println("================ API RAW RESPONSE ================");
//        System.out.println(result);

        // 가장 무식하지만 확실한 방법 (데이터 구조를 모를 때)
        System.out.println("데이터 중 instCtg 확인:");
        result.values().forEach(val -> {
            if(val.contains("instCtg")) {
                // 문자열에서 instCtg 뒤의 값만 대략적으로 출력
                System.out.println(val);
            }
        });
        System.out.println("==================================================");
    }
}
