package io.pjj.ziphyeonjeon.Chatbot.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class DeleteRoomsRequest {
    private List<Long> roomIds;
}
