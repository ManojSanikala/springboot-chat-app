package com.chat.app.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chat.app.model.MessageReaction;
import com.chat.app.repository.MessageReactionRepository;

@Service
public class MessageReactionService {

    @Autowired
    private MessageReactionRepository messageReactionRepository;


    // =====================================================
    // ADD OR UPDATE REACTION
    // =====================================================

    public MessageReaction addReaction(
            Long messageId,
            String username,
            String reaction) {

        if (messageId == null) {
            throw new RuntimeException(
                "Message ID is required"
            );
        }

        if (
            username == null ||
            username.trim().isEmpty()
        ) {
            throw new RuntimeException(
                "Username is required"
            );
        }

        if (
            reaction == null ||
            reaction.trim().isEmpty()
        ) {
            throw new RuntimeException(
                "Reaction is required"
            );
        }


        /*
         * Check whether this user already
         * reacted to this message.
         */

        MessageReaction existing =
                messageReactionRepository
                    .findByMessageIdAndUsername(
                        messageId,
                        username
                    )
                    .orElse(null);


        /*
         * If same reaction already exists,
         * remove it.
         *
         * Example:
         * 👍 -> click 👍 again -> remove 👍
         */

        if (
            existing != null &&
            existing.getReaction()
                    .equals(reaction)
        ) {

            messageReactionRepository.delete(
                existing
            );

            return null;
        }


        /*
         * If another reaction exists,
         * replace it.
         *
         * Example:
         * 👍 -> ❤️
         */

        if (existing != null) {

            existing.setReaction(
                reaction
            );

            return messageReactionRepository.save(
                existing
            );
        }


        /*
         * First reaction from this user.
         */

        MessageReaction newReaction =
                new MessageReaction(
                    messageId,
                    username,
                    reaction
                );


        return messageReactionRepository.save(
            newReaction
        );
    }


    // =====================================================
    // GET MESSAGE REACTIONS
    // =====================================================

    @Transactional(readOnly = true)
    public List<MessageReaction> getReactions(
            Long messageId) {

        return messageReactionRepository
            .findByMessageId(
                messageId
            );
    }


    // =====================================================
    // REMOVE REACTION
    // =====================================================

    public void removeReaction(
            Long messageId,
            String username) {

        messageReactionRepository
            .deleteByMessageIdAndUsername(
                messageId,
                username
            );
    }

}