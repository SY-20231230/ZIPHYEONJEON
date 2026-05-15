package io.pjj.ziphyeonjeon.Chatbot.service;

import io.pjj.ziphyeonjeon.Chatbot.dto.response.AiChatResponse;
import io.pjj.ziphyeonjeon.global.API.common.ExternalApiProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiClientService {
    private final RestTemplate restTemplate;
    private final ExternalApiProperties props;

    public AiChatResponse ask(String query, int topK) {
        String baseUrl = props.getAiServer().getBaseUrl();
        String url = baseUrl + "/api/v1/legal/ask";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("query", query);
        requestBody.put("top_k", topK);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

        try {
            return restTemplate.postForObject(url, requestEntity, AiChatResponse.class);
        } catch (Exception e) {
            log.error("AI Server API Error: {}", e.getMessage(), e);
            return AiChatResponse.builder()
                    .answer("죄송합니다. AI 서버와 통신 중 오류가 발생했습니다.")
                    .build();
        }
    }
}
