package io.pjj.ziphyeonjeon.PriceSearch.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class PriceSearchServiceTest {

    @Autowired
    private PriceSearchService service;

    @Test
    public void testSearchByAddress() {
        System.out.println("TEST START-------------------");
        try {
            var res = service.searchByAddress("서울특별시 은평구 불광동 645", null);
            System.out.println("TEST RESULTS SIZE: " + res.size());
            for (var r : res) {
                System.out.println("Item: " + r.getComplexName() + ", " + r.getDealAmountMan());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        System.out.println("TEST END---------------------");
    }
}
