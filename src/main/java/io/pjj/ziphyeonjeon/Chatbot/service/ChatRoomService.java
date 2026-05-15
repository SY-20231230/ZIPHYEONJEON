package io.pjj.ziphyeonjeon.Chatbot.service;

import io.pjj.ziphyeonjeon.Chatbot.dto.response.ChatRoomResponse;
import io.pjj.ziphyeonjeon.Chatbot.entity.ChatRoom;
import io.pjj.ziphyeonjeon.Chatbot.repository.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatRoomService {
    private final ChatRoomRepository chatRoomRepository;

    @Transactional
    public Long createRoom(Long userId) {
        ChatRoom room = ChatRoom.builder()
                .userId(userId)
                .title("대화 중...")
                .build();
        ChatRoom savedRoom = chatRoomRepository.save(room);
        return savedRoom.getRoomId();
    }

    @Transactional
    public void updateRoomTitle(Long roomId, Long userId, String title) {
        ChatRoom room = chatRoomRepository.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없거나 권한이 없습니다."));
        room.setTitle(title);
        chatRoomRepository.save(room);
    }

    public List<ChatRoomResponse> getRooms(Long userId) {
        return chatRoomRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(room -> ChatRoomResponse.builder()
                        .roomId(room.getRoomId())
                        .title(room.getTitle())
                        .createdAt(room.getCreatedAt())
                        .lastMessage(room.getMessages().isEmpty() ? null
                                : room.getMessages().get(room.getMessages().size() - 1).getMessageContent())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteRoom(Long roomId, Long userId) {
        ChatRoom room = chatRoomRepository.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없거나 권한이 없습니다."));
        chatRoomRepository.delete(room);
    }

    @Transactional
    public void deleteSelectedRooms(Long userId, List<Long> roomIds) {
        if (roomIds == null || roomIds.isEmpty()) {
            throw new IllegalArgumentException("삭제할 방 ID 목록이 비어 있습니다.");
        }
        chatRoomRepository.deleteByUserIdAndRoomIdIn(userId, roomIds);
    }

    @Transactional
    public void deleteAllRooms(Long userId) {
        chatRoomRepository.deleteAllByUserId(userId);
    }
}
