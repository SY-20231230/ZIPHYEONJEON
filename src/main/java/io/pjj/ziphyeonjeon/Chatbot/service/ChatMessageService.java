package io.pjj.ziphyeonjeon.Chatbot.service;

import io.pjj.ziphyeonjeon.Chatbot.dto.request.SendMessageRequest;
import io.pjj.ziphyeonjeon.Chatbot.dto.response.AiChatResponse;
import io.pjj.ziphyeonjeon.Chatbot.dto.response.ChatMessageResponse;
import io.pjj.ziphyeonjeon.Chatbot.entity.ChatMessage;
import io.pjj.ziphyeonjeon.Chatbot.entity.ChatRoom;
import io.pjj.ziphyeonjeon.Chatbot.repository.ChatMessageRepository;
import io.pjj.ziphyeonjeon.Chatbot.repository.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatMessageService {
        private final ChatMessageRepository chatMessageRepository;
        private final ChatRoomRepository chatRoomRepository;
        private final AiClientService aiClientService;

        public List<ChatMessageResponse> getMessages(Long roomId, Long userId) {
                chatRoomRepository.findByRoomIdAndUserId(roomId, userId)
                                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없거나 권한이 없습니다."));

                return chatMessageRepository.findByRoom_RoomIdOrderByCreatedAtAsc(roomId).stream()
                                .map(msg -> ChatMessageResponse.builder()
                                                .messageId(msg.getMessageId())
                                                .senderType(msg.getSenderType())
                                                .messageContent(msg.getMessageContent())
                                                .createdAt(msg.getCreatedAt())
                                                .references(java.util.Collections.emptyList()) // 💡 출처 데이터 규격 추가
                                                .build())
                                .collect(Collectors.toList());
        }

        @Transactional
        public ChatMessageResponse sendMessage(Long roomId, Long userId, SendMessageRequest req) {
                ChatRoom room = chatRoomRepository.findByRoomIdAndUserId(roomId, userId)
                                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없거나 권한이 없습니다."));

                // 첫 메시지인지 확인하여 제목 자동 갱신
                if (room.getMessages() == null || room.getMessages().isEmpty()) {
                        String newTitle = req.getMessage();
                        if (newTitle.length() > 20) {
                                newTitle = newTitle.substring(0, 20);
                        }
                        room.setTitle(newTitle); // JPA dirty checking으로 업데이트
                }

                // 사용자 메시지 저장
                ChatMessage userMessage = ChatMessage.builder()
                                .room(room)
                                .senderType("USER")
                                .messageContent(req.getMessage())
                                .build();
                chatMessageRepository.save(userMessage);

                // AI 서버 호출 (FastAPI RAG)
                AiChatResponse aiRes = aiClientService.ask(req.getMessage(), 3);

                // AI 응답 저장
                ChatMessage botMessage = ChatMessage.builder()
                                .room(room)
                                .senderType("BOT")
                                .messageContent(aiRes.getAnswer())
                                .build();
                ChatMessage savedBotMessage = chatMessageRepository.save(botMessage);

                // 프론트로 반환 (references 포함)
                return ChatMessageResponse.builder()
                                .messageId(savedBotMessage.getMessageId())
                                .senderType(savedBotMessage.getSenderType())
                                .messageContent(savedBotMessage.getMessageContent())
                                .createdAt(savedBotMessage.getCreatedAt())
                                .references(aiRes.getReferences())
                                .build();
        }
}
