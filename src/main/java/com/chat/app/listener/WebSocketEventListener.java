package com.chat.app.listener;

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

    @EventListener
    public void handleConnect(SessionConnectedEvent event) {

        StompHeaderAccessor accessor =
                StompHeaderAccessor.wrap(event.getMessage());

        if (accessor.getUser() == null) {
            return;
        }

        String username = accessor.getUser().getName();

        messagingTemplate.convertAndSend(
                "/topic/presence",
                new PresenceEvent(username, true, null)
        );
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {

        StompHeaderAccessor accessor =
                StompHeaderAccessor.wrap(event.getMessage());

        if (accessor.getUser() == null) {
            return;
        }

        String username = accessor.getUser().getName();

        User user = userRepository.findByUsername(username).orElse(null);

        String lastSeen = null;

        if (user != null) {
            lastSeen = user.getLastSeen();
        }

        messagingTemplate.convertAndSend(
                "/topic/presence",
                new PresenceEvent(username, false, lastSeen)
        );
    }
}