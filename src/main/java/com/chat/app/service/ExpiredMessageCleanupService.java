package com.chat.app.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chat.app.model.Message;
import com.chat.app.repository.MessageRepository;

@Service
public class ExpiredMessageCleanupService {

    @Autowired
    private MessageRepository messageRepository;


    // =====================================================
    // DELETE EXPIRED MESSAGES
    // Runs every 60 seconds
    // =====================================================

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void deleteExpiredMessages() {

        LocalDateTime now =
                LocalDateTime.now();

        List<Message> expiredMessages =
                messageRepository.findExpiredMessages(now);

        if (expiredMessages.isEmpty()) {
            return;
        }

        messageRepository.deleteAll(
                expiredMessages
        );

        System.out.println(
                "Deleted expired messages: "
                + expiredMessages.size()
        );
    }
}