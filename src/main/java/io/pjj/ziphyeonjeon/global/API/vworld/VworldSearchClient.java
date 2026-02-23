package io.pjj.ziphyeonjeon.global.API.vworld;

import io.pjj.ziphyeonjeon.global.API.common.ExternalApiProperties;
import io.pjj.ziphyeonjeon.global.API.vworld.dto.search.VworldSearchResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class VworldSearchClient {

    private final WebClient webClient;
    private final ExternalApiProperties props;

    public VworldSearchClient(ExternalApiProperties props) {
        this.props = props;
        this.webClient = WebClient.builder().baseUrl(props.getVworld().getBaseUrl()).build();
    }

    public VworldSearchResponse searchJuso(String query) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder.path("/req/search")
                        .queryParam("service", "search")
                        .queryParam("request", "search")
                        .queryParam("crs", "EPSG:4326")
                        .queryParam("query", query)
                        .queryParam("type", "address")
                        .queryParam("category", "road")
                        .queryParam("key", props.getVworld().getApiKey())
                        .build())
                .retrieve()
                .bodyToMono(VworldSearchResponse.class).block();
    }

    public VworldSearchResponse searchJibun(String query) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder.path("/req/search")
                        .queryParam("service", "search")
                        .queryParam("request", "search")
                        .queryParam("crs", "EPSG:4326")
                        .queryParam("query", query)
                        .queryParam("type", "address")
                        .queryParam("category", "parcel")
                        .queryParam("key", props.getVworld().getApiKey())
                        .build())
                .retrieve()
                .bodyToMono(VworldSearchResponse.class).block();
    }
}
