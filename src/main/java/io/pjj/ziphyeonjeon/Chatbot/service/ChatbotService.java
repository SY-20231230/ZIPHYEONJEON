package io.pjj.ziphyeonjeon.Chatbot.service;

import io.pjj.ziphyeonjeon.global.API.common.ExternalApiProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final ExternalApiProperties props;
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String GEMINI_SYSTEM_PROMPT = "너는 대한민국 최고의 부동산 온라인 플랫폼 '집현전'의 인공지능 공인중개사 겸 자산관리사야. " +
            "사용자가 부동산(아파트, 빌라, 오피스텔 등)의 매매, 전세, 월세 계약이나 " +
            "현장 방문(임장), 대출, 세금 등에 대해 질문하면 언제나 친절하고 전문적인 어투로 답변해줘. " +
            "특히 사용자가 체크리스트를 물어보면 보기 좋게 마크다운 글머리 기호(-)나 번호(1. 2.)를 활용해서 " +
            "가독성 높게 명확하게 작성해줘야해. 불필요하게 말을 늘이지 말고 핵심만 정확하게 전달해줘.";

    public String getChatResponse(String userMessage) {
        String baseUrl = props.getGemini().getBaseUrl();
        String apiKey = props.getGemini().getApiKey();

        // Gemini 2.5 Flash generateContent Endpoint
        String url = baseUrl + "/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Build Payload matching Gemini API spec
        // { "contents": [{ "parts": [{"text": "Hello"}] }], "systemInstruction": {
        // "parts": [{"text": "Sys prompt"}] } }

        Map<String, Object> requestBody = new HashMap<>();

        // 1. System Instruction (Persona)
        Map<String, Object> systemInstruction = new HashMap<>();
        List<Map<String, Object>> sysParts = new ArrayList<>();
        Map<String, Object> sysPart = new HashMap<>();
        sysPart.put("text", GEMINI_SYSTEM_PROMPT);
        sysParts.add(sysPart);
        systemInstruction.put("parts", sysParts);
        requestBody.put("systemInstruction", systemInstruction);

        // 2. User Content
        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> content = new HashMap<>();
        content.put("role", "user");
        List<Map<String, Object>> userParts = new ArrayList<>();
        Map<String, Object> userPart = new HashMap<>();
        userPart.put("text", userMessage);
        userParts.add(userPart);
        content.put("parts", userParts);
        contents.add(content);

        requestBody.put("contents", contents);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

        try {
            Map<String, Object> response = restTemplate.postForObject(url, requestEntity, Map.class);
            return extractTextFromGeminiResponse(response);
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            log.error("Gemini API HTTP Error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            return "죄송합니다. 현재 AI 서버와 통신이 원활하지 않습니다. 잠시 후 다시 시도해주세요.";
        } catch (Exception e) {
            log.error("Gemini API Error: {}", e.getMessage(), e);
            return "죄송합니다. 서버 내부 오류가 발생했습니다.";
        }
    }

    private String extractTextFromGeminiResponse(Map<String, Object> response) {
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                if (content != null) {
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                    if (parts != null && !parts.isEmpty()) {
                        return (String) parts.get(0).get("text");
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error parsing Gemini response: {}", e.getMessage());
        }
        return "답변을 생성하는 데 문제가 발생했습니다.";
    }
}
