package com.chat.app.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.chat.app.model.MessageReaction;

@Repository
public interface MessageReactionRepository
        extends JpaRepository<MessageReaction, Long> {

    List<MessageReaction> findByMessageId(Long messageId);

    Optional<MessageReaction>
    findByMessageIdAndUsername(
            Long messageId,
            String username);

    void deleteByMessageIdAndUsername(
            Long messageId,
            String username);
}