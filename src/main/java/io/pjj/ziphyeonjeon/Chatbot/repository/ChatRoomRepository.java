package io.pjj.ziphyeonjeon.Chatbot.repository;

import io.pjj.ziphyeonjeon.Chatbot.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    List<ChatRoom> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<ChatRoom> findByRoomIdAndUserId(Long roomId, Long userId);

    void deleteByUserIdAndRoomIdIn(Long userId, List<Long> roomIds);

    void deleteAllByUserId(Long userId);
}
