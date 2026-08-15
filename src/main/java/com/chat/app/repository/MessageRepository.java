package com.chat.app.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.chat.app.enums.MessageStatus;
import com.chat.app.model.Message;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /*
     * =====================================================
     * GET PRIVATE CHAT HISTORY
     *
     * Returns:
     * user1 -> user2
     * user2 -> user1
     * =====================================================
     */
    @Query("""
        SELECT m
        FROM Message m
        WHERE
            (m.sender.username = :user1
             AND m.receiver.username = :user2)
        OR
            (m.sender.username = :user2
             AND m.receiver.username = :user1)
        ORDER BY m.id ASC
    """)
    List<Message> findConversation(
            @Param("user1") String user1,
            @Param("user2") String user2
    );


    Optional<Message>
    findTopBySenderUsernameAndReceiverUsernameOrderByIdDesc(
            String sender,
            String receiver
    );


    List<Message>
    findBySenderUsernameAndReceiverUsernameAndStatus(
            String sender,
            String receiver,
            MessageStatus status
    );


    long
    countBySenderUsernameAndReceiverUsernameAndStatus(
            String sender,
            String receiver,
            MessageStatus status
    );


    List<Message>
    findBySenderUsernameAndReceiverUsernameAndStatusIn(
            String sender,
            String receiver,
            List<MessageStatus> statuses
    );
}