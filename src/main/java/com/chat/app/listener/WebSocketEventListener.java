package com.chat.app.listener;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.chat.app.dto.PresenceEvent;
import com.chat.app.model.User;
import com.chat.app.repository.UserRepository;

@Component
public class WebSocketEventListener {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private UserRepository userRepository;


    /*
     * =====================================================
     * LAST SEEN FORMAT
     * =====================================================
     */

    private static final DateTimeFormatter
        LAST_SEEN_FORMATTER =
            DateTimeFormatter.ofPattern(
                "yyyy-MM-dd'T'HH:mm:ss"
            );


    /*
     * =====================================================
     * USER CONNECTED
     * =====================================================
     */

    @EventListener
    public void handleConnect(
            SessionConnectedEvent event) {

        StompHeaderAccessor accessor =
            StompHeaderAccessor.wrap(
                event.getMessage()
            );


        /*
         * Make sure user exists
         */

        if (accessor.getUser() == null) {

            return;
        }


        String username =
            accessor.getUser().getName();


        /*
         * Find user
         */

        User user =
            userRepository
                .findByUsername(username)
                .orElse(null);


        if (user == null) {

            return;
        }


        /*
         * Mark user ONLINE
         */

        user.setOnline(true);


        /*
         * Clear old last-seen value
         * while user is online.
         */

        user.setLastSeen(null);


        /*
         * Save status
         */

        userRepository.save(user);


        /*
         * Broadcast ONLINE
         */

        messagingTemplate.convertAndSend(
            "/topic/presence",
            new PresenceEvent(
                username,
                true,
                null
            )
        );


        System.out.println(
            "USER ONLINE: " +
            username
        );

    }


    /*
     * =====================================================
     * USER DISCONNECTED
     * =====================================================
     */

    @EventListener
    public void handleDisconnect(
            SessionDisconnectEvent event) {

        StompHeaderAccessor accessor =
            StompHeaderAccessor.wrap(
                event.getMessage()
            );


        /*
         * Make sure user exists
         */

        if (accessor.getUser() == null) {

            return;
        }


        String username =
            accessor.getUser().getName();


        /*
         * Find user
         */

        User user =
            userRepository
                .findByUsername(username)
                .orElse(null);


        if (user == null) {

            return;
        }


        /*
         * Mark user OFFLINE
         */

        user.setOnline(false);


        /*
         * Update LAST SEEN
         */

        String lastSeen =
            LocalDateTime.now()
                .format(
                    LAST_SEEN_FORMATTER
                );


        user.setLastSeen(
            lastSeen
        );


        /*
         * Save status
         */

        userRepository.save(user);


        /*
         * Broadcast OFFLINE
         */

        messagingTemplate.convertAndSend(
            "/topic/presence",
            new PresenceEvent(
                username,
                false,
                lastSeen
            )
        );


        System.out.println(
            "USER OFFLINE: " +
            username +
            " | Last Seen: " +
            lastSeen
        );

    }

}