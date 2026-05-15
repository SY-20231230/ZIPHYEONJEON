package io.pjj.ziphyeonjeon.Chatbot.dto.request;

import lombok.Data;

@Data
public class SendMessageRequest {
    private String message;
    private String category;
}
