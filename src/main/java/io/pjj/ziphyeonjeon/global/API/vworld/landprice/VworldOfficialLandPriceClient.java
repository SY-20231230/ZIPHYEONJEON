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

    /** PNU로 공시지가 raw JSON 조회 */
    public String getOfficialLandPriceRaw(String pnu) {
        // LP_PA_CBND_BUBUN (연속지적도): 모든 API 키에서 접근 가능한 범용 레이어
        // 지적도 데이터는 보통 최신 공시지가를 포함하므로 pnu 단독 필터로 조회 성공률 극대화
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
