package io.pjj.ziphyeonjeon.global.API.vworld.landprice;

import io.pjj.ziphyeonjeon.global.API.common.ExternalApiProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class VworldOfficialLandPriceClient {

    private final WebClient webClient;
    private final ExternalApiProperties props;

    public VworldOfficialLandPriceClient(ExternalApiProperties props) {
        this.props = props;
        this.webClient = WebClient.builder()
                .baseUrl(props.getVworld().getBaseUrl())
                .build();
    }

    /** PNU로 공시지가 raw JSON 조회 (실제 스펙) */
    public String getOfficialLandPriceRaw(String pnu) {
        String uri = "/req/data?service=data&request=GetFeature&data=LP_PA_CBND_BUBUN"
                + "&key=" + props.getVworld().getApiKey()
                + "&domain=http://localhost:3000"
                + "&attrFilter=pnu:=:" + pnu;

        return webClient.get()
                .uri(uri)
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }
}
