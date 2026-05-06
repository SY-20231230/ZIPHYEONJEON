package io.pjj.ziphyeonjeon.global.API;

import io.pjj.ziphyeonjeon.store.dto.StoreDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Component
public class APIStore {

    @Value("${PUBLIC_DATA_SERVICE_KEY}")
    private String serviceKey;

    private final RestTemplate restTemplate;

    public APIStore(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public List<StoreDto> fetchStoreSalesData(String lawdCd, String dealYm) {
        List<StoreDto> dtoList = new ArrayList<>();
        String endPoint = "https://apis.data.go.kr/1613000/RTMSDataSvcNrgTrade/getRTMSDataSvcNrgTrade";

        try {
            String finalUrl = endPoint + "?serviceKey=" + serviceKey
                    + "&LAWD_CD=" + lawdCd
                    + "&DEAL_YMD=" + dealYm
                    + "&_type=xml";

            URI uri = new URI(finalUrl);

            String response = restTemplate.getForObject(uri, String.class);
            if (response == null || response.isBlank()) {
                System.out.println("API 응답이 비어있습니다.");
                return dtoList;
            }

            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new ByteArrayInputStream(response.getBytes(StandardCharsets.UTF_8)));
            doc.getDocumentElement().normalize();

            NodeList nList = doc.getElementsByTagName("item");

            for (int i = 0; i < nList.getLength(); i++) {
                Node node = nList.item(i);
                if (node.getNodeType() == Node.ELEMENT_NODE) {
                    Element elem = (Element) node;

                    String sigungu = getTagValue("sggNm", elem);
                    String emd = getTagValue("umdNm", elem);
                    String type = getTagValue("buildingType", elem);
                    String jibun = getTagValue("jibun", elem);
                    String buildingUse = getTagValue("buildingUse", elem);
                    if (buildingUse == null || buildingUse.isBlank()) {
                        buildingUse = getTagValue("landUse", elem);
                    }
                    String dealYear = getTagValue("dealYear", elem);
                    String dealMonth = getTagValue("dealMonth", elem);
                    String dealDay = getTagValue("dealDay", elem);
                    String floor = getTagValue("floor", elem);
                    String amount = getTagValue("dealAmount", elem);
                    if (amount != null)
                        amount = amount.replace(",", "").trim();

                    String areaStr = getTagValue("buildingAr", elem);
                    if (areaStr == null || areaStr.isBlank()) {
                        areaStr = getTagValue("plottageAr", elem);
                    }
                    BigDecimal area = (areaStr != null && !areaStr.isBlank()) ? new BigDecimal(areaStr.trim()) : null;

                    String sggCd = getTagValue("sggCd", elem);
                    if (sggCd == null || sggCd.isBlank()) {
                        sggCd = lawdCd;
                    }

                    dtoList.add(new StoreDto(null, sggCd, sigungu, emd, type, jibun, buildingUse, dealYear, dealMonth,
                            dealDay, floor, amount, area));
                }
            }

        } catch (Exception e) {
            System.err.println("APIStore 호출 실패: " + e.getMessage());
        }

        return dtoList;
    }

    private String getTagValue(String tag, Element elem) {
        NodeList nlList = elem.getElementsByTagName(tag);
        if (nlList != null && nlList.getLength() > 0) {
            Node nValue = nlList.item(0).getChildNodes().item(0);
            if (nValue != null) {
                return nValue.getNodeValue().trim();
            }
        }
        return null;
    }
}
