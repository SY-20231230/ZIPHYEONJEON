package io.pjj.ziphyeonjeon.Chatbot.controller;

import io.pjj.ziphyeonjeon.Chatbot.dto.request.ChatMessageRequest;
import io.pjj.ziphyeonjeon.Chatbot.dto.response.ChatMessageResponse;
import io.pjj.ziphyeonjeon.Chatbot.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping
    public ResponseEntity<ChatMessageResponse> getChatResponse(@RequestBody ChatMessageRequest request) {
        log.info("Received chatbot request: {}", request.getMessage());

        try {
            String reply = chatbotService.getChatResponse(request.getMessage());

            ChatMessageResponse response = ChatMessageResponse.builder()
                    .reply(reply)
                    .status("success")
                    .build();
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error processing chat request", e);
            ChatMessageResponse errorResponse = ChatMessageResponse.builder()
                    .reply("죄송합니다. 오류가 발생했습니다.")
                    .status("error")
                    .build();
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}
