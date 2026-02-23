package io.pjj.ziphyeonjeon.PriceSearch.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class PriceSearchServiceTest2 {
    @Autowired
    PriceSearchService service;

    @Test
    public void testSearchByAddress() {
        System.out.println("TEST START (Address)-------------------");
        try {
            // "불광동 645" (Fail case was here)
            var res = service.searchByAddress("서울특별시 은평구 불광동 645", null);
            System.out.println("TEST RESULTS SIZE: " + res.size());
            for (var r : res) {
                System.out
                        .println("Item: " + r.getComplexName() + " | Address: " + r.getSigungu() + " " + r.getJibun());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        System.out.println("TEST END---------------------");
    }

    @Test
    public void testPriceTrend() {
        System.out.println("TEST START (Trend)-------------------");
        try {
            var res = service.getRegionalTrend("은평구 역촌동", "월");
            System.out.println("REGION: " + res.getRegionName());
            System.out.println("TRENDS SIZE: " + res.getTrends().size());

            if (!res.getTrends().isEmpty()) {
                var first = res.getTrends().get(0);
                System.out.println("Period: " + first.getPeriod());
                System.out.println("Apt Sale: " + first.getAptSale());
                System.out.println("Apt Jeonse: " + first.getAptJeonse());
                System.out.println("Apt Wolse: " + first.getAptWolse());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        System.out.println("TEST END-------------------");
    }
}
