package io.pjj.ziphyeonjeon.Chatbot.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReferenceDto {
    private String source;
    private String title;
    private String text;
    private Double score;
}
